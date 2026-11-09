
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from google.cloud import firestore
from google.api_core.exceptions import AlreadyExists, GoogleAPICallError
from django.views.decorators.csrf import csrf_exempt

from .authentication import require_firebase_auth


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
