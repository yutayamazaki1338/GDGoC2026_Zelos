
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from google.cloud import firestore
from google.api_core.exceptions import AlreadyExists, GoogleAPICallError
from django.views.decorators.csrf import csrf_exempt

from .authentication import require_firebase_auth
import json



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
    """初回ログイン時にプロフィールを作成する"""

    user = request.firebase_user
    uid = user["uid"]

    verification_error = check_email_verification(user)
    if verification_error is not None:
        return verification_error

    db = get_firestore()
    doc_ref = db.collection("users").document(uid)

    email = user.get("email") or ""
    initial_name = (
        user.get("name")
        or email.split("@")[0]
        or "ユーザー"
    )

    initial_data = {
        "name": initial_name,
        "bio": "",
        "avatarUrl": "",
        "createdAt": firestore.SERVER_TIMESTAMP,
    }

    try:
        try:
            doc_ref.create(initial_data)
            status_code = 201
        except AlreadyExists:
            status_code = 200

        # 保存済みデータを読み直す
        snapshot = doc_ref.get()

        if not snapshot.exists:
            return JsonResponse(
                {"error": "Profile not found"},
                status=503
            )

        return JsonResponse(
            profile_response(uid, user, snapshot.to_dict()),
            status=status_code
        )

    except GoogleAPICallError:
        return JsonResponse(
            {"error": "Database unavailable"},
            status=503
        )


@require_http_methods(["GET"])
@require_firebase_auth
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
