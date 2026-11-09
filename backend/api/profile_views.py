
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from google.cloud import firestore
from google.api_core.exceptions import AlreadyExists, GoogleAPICallError
from django.views.decorators.csrf import csrf_exempt

from .authentication import require_firebase_auth
import json
from .registration_permissions import require_registration_completed


def get_firestore():
    """Firestoreクライアントを取得する"""
    return firestore.Client()


def check_email_verification(user):
    """パスワード認証でメール未確認なら拒否する"""
    firebase_info = user.get("firebase") or {}
    provider = firebase_info.get("sign_in_provider")

    if provider == "password" and not user.get("email_verified", False):
        return JsonResponse(
            {"error": "Email verification required"},
            status=403
        )

    return None


def profile_response(uid, user, data):
    """FirestoreとFirebaseの情報を統合して返す"""
    created_at = data.get("createdAt")

    return {
        "id": uid,
        "name": data.get("name", ""),
        "email": user.get("email") or "",
        "emailVerified": user.get("email_verified", False),
        "bio": data.get("bio", ""),
        "avatarUrl": data.get("avatarUrl", ""),
        "createdAt": (
            created_at.isoformat()
            if created_at is not None else None
        ),
        "latestDiagnosis": data.get("latestDiagnosis"),
        "diagnosisOnboarding": data.get("diagnosisOnboarding"),
    }


@csrf_exempt
@require_http_methods(["POST"])
@require_firebase_auth
def initialize_profile(request):
    """
    POST /users/me/initialize

    新規ユーザー:
        診断結果保存 → ユーザー名入力 → プロフィール作成

    既存ユーザー:
        既存プロフィールをそのまま返す
    """

    user = request.firebase_user
    uid = user["uid"]

    verification_error = check_email_verification(user)
    if verification_error is not None:
        return verification_error

    db = get_firestore()

    profile_ref = db.collection("users").document(uid)
    policy_ref = (
        db.collection("registrationPolicies")
        .document(uid)
    )

    # 診断保存済みか調べる。
    # ここではまだプロフィールを作成しない。
    try:
        latest_diagnoses = list(
            profile_ref.collection("diagnoses")
            .order_by(
                "completedAt",
                direction=firestore.Query.DESCENDING,
            )
            .limit(1)
            .stream()
        )
    except GoogleAPICallError:
        return JsonResponse(
            {"error": "Database unavailable"},
            status=503,
        )

    latest_diagnosis_id = (
        latest_diagnoses[0].id
        if latest_diagnoses
        else None
    )

    # 新規ユーザー用の名前はリクエストJSONから受け取る
    try:
        payload = (
            json.loads(request.body.decode("utf-8"))
            if request.body
            else {}
        )
    except (ValueError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400,
        )

    if not isinstance(payload, dict):
        return JsonResponse(
            {"error": "JSON object is required"},
            status=400,
        )

    requested_name = payload.get("name")

    @firestore.transactional
    def create_profile(transaction):
        # Firestoreの読み取りをすべて書き込みより前に行う
        policy_snapshot = policy_ref.get(
            transaction=transaction
        )

        profile_snapshot = profile_ref.get(
            transaction=transaction
        )

        if not policy_snapshot.exists:
            return "policy_missing"

        policy = policy_snapshot.to_dict() or {}
        state = policy.get("registrationState")

        # 移行済みの既存ユーザー
        if state == "Existing":
            if policy.get("diagnosisRequired") is not False:
                return "invalid_policy"

            if not profile_snapshot.exists:
                return "profile_missing"

            return "existing"

        # 新規登録が完了している場合
        if state == "Completed":
            if not profile_snapshot.exists:
                return "profile_missing"

            diagnosis_id = policy.get("verifiedDiagnosisId")

            if not diagnosis_id:
                return "invalid_policy"

            

            saved_diagnosis = (
                profile_ref.collection("diagnoses")
                .document(diagnosis_id)
                .get(transaction=transaction)
            )

            if not saved_diagnosis.exists:
                return "diagnosis_missing"

            return "existing"

        # 新規ユーザーの登録途中
        if state not in ("PendingDiagnosis", "PendingUsername"):
            return "invalid_policy"

        if policy.get("diagnosisRequired") is not True:
            return "invalid_policy"

        # 新しい必須登録フローでは、
        # すでにプロフィールがある状態を許さない
        if profile_snapshot.exists:
            return "unexpected_profile"

        # 診断未完了のまま登録させない
        if not latest_diagnosis_id:
            return "diagnosis_missing"

        diagnosis_ref = (
            profile_ref.collection("diagnoses")
            .document(latest_diagnosis_id)
        )

        diagnosis_snapshot = diagnosis_ref.get(
            transaction=transaction
        )

        if not diagnosis_snapshot.exists:
            return "diagnosis_missing"

        diagnosis = diagnosis_snapshot.to_dict() or {}

        if not diagnosis.get("typeCode"):
            return "diagnosis_invalid"

        # ユーザー名の形式を検証
        if not isinstance(requested_name, str):
            return "invalid_name"

        name = requested_name.strip()

        if not 1 <= len(name) <= 30:
            return "invalid_name"

        if any(ord(ch) < 32 or ord(ch) == 127 for ch in name):
            return "invalid_name"

        # 保存するのは診断結果の概要
        from .diagnosis_questions import TYPE_MAP

        type_code = diagnosis["typeCode"]

        if type_code not in TYPE_MAP:
            return "diagnosis_invalid"

        latest_diagnosis = {
            "id": diagnosis_snapshot.id,
            "typeCode": type_code,
            "description": TYPE_MAP[type_code]["description"],
        }

        # プロフィール作成
        transaction.create(
            profile_ref,
            {
                "name": name,
                "bio": "",
                "avatarUrl": "",
                "createdAt": firestore.SERVER_TIMESTAMP,
                "latestDiagnosis": latest_diagnosis,
                "diagnosisOnboarding": "completed",
            },
        )

        # 登録ポリシーを同時に完了状態へ変更
        transaction.update(
            policy_ref,
            {
                "registrationState": "Completed",
                "verifiedDiagnosisId": diagnosis_snapshot.id,
                "completedAt": firestore.SERVER_TIMESTAMP,
            },
        )

        return "created"

    try:
        result = create_profile(db.transaction())

        errors = {
            "policy_missing": (
                "Registration policy not initialized", 409
            ),
            "invalid_policy": (
                "Invalid registration policy", 409
            ),
            "profile_missing": (
                "Profile not found", 409
            ),
            "diagnosis_missing": (
                "Diagnosis not completed", 409
            ),
            "diagnosis_invalid": (
                "Invalid diagnosis result", 409
            ),
            "unexpected_profile": (
                "Profile exists before registration completion", 409
            ),
            "invalid_name": (
                "Username must contain 1 to 30 valid characters", 400
            ),
        }

        if result in errors:
            message, status_code = errors[result]
            return JsonResponse(
                {"error": message},
                status=status_code,
            )

        snapshot = profile_ref.get()

        if not snapshot.exists:
            return JsonResponse(
                {"error": "Profile not found"},
                status=503,
            )

        return JsonResponse(
            profile_response(uid, user, snapshot.to_dict()),
            status=201 if result == "created" else 200,
        )

    except GoogleAPICallError:
        return JsonResponse(
            {"error": "Database unavailable"},
            status=503,
        )
    except Exception:
        import logging
        logging.getLogger(__name__).exception(
            "Profile initialization failed"
        )
        return JsonResponse(
            {"error": "Profile initialization failed"},
            status=500,
        )



@require_http_methods(["GET"])
@require_firebase_auth
@require_registration_completed
def my_profile(request):
    """ログイン済みユーザーのプロフィールを取得"""

    user = request.firebase_user
    uid = user["uid"]

    verification_error = check_email_verification(user)
    if verification_error is not None:
        return verification_error

    try:
        db = get_firestore()
        snapshot = db.collection("users").document(uid).get()

        if not snapshot.exists:
            return JsonResponse(
                {"error": "Profile not found"},
                status=404
            )

        return JsonResponse(
            profile_response(uid, user, snapshot.to_dict())
        )

    except GoogleAPICallError:
        return JsonResponse(
            {"error": "Database unavailable"},
            status=503
        )


@csrf_exempt
@require_http_methods(["PATCH"])
@require_firebase_auth
def update_my_profile(request):

    # ① Firebase認証済みユーザーのUIDを取得
    user = request.firebase_user
    uid = user["uid"]

    # ② メール認証状態を確認
    verification_error = check_email_verification(user)
    if verification_error is not None:
        return verification_error

    # ③ Androidから送信されたJSONを取得
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400,
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "JSON object required"},
            status=400,
        )

    # ④ 更新可能なフィールドだけを受け付ける
    if set(data.keys()) != {"name", "bio"}:
        return JsonResponse(
            {"error": "Only name and bio are allowed"},
            status=400,
        )

    name = data["name"]
    bio = data["bio"]

    # ⑤ 入力値の検証
    if not isinstance(name, str) or not isinstance(bio, str):
        return JsonResponse(
            {"error": "name and bio must be strings"},
            status=400,
        )

    name = name.strip()

    if not name or len(name) > 50:
        return JsonResponse(
            {"error": "name must be 1 to 50 characters"},
            status=400,
        )

    if len(bio) > 300:
        return JsonResponse(
            {"error": "bio must be 300 characters or fewer"},
            status=400,
        )

    # ⑥ Firestoreの本人のドキュメントを更新
    try:
        db = get_firestore()
        doc_ref = db.collection("users").document(uid)

        doc_ref.update({
            "name": name,
            "bio": bio,
        })

        # ⑦ 更新後のプロフィールを取得
        snapshot = doc_ref.get()

        return JsonResponse(
            profile_response(uid, user, snapshot.to_dict()),
            status=200,
        )

    except NotFound:
        return JsonResponse(
            {"error": "Profile not found"},
            status=404,
        )

    except GoogleAPICallError:
        return JsonResponse(
            {"error": "Database unavailable"},
            status=503,
        )
