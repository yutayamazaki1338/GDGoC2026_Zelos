
from django.http import JsonResponse
from google.cloud import firestore


def health(request):
    """Djangoが起動しているか確認"""
    return JsonResponse({"status": "ok"})


@require_firebase_auth
def my_posts(request):
    """ログインしたユーザーの投稿を取得"""

    uid = request.firebase_user["uid"]

    db = firestore.Client()

    documents = (
        db.collection("posts")
        .where("userId", "==", uid)
        .stream()
    )

    results = []

    for doc in documents:
        data = doc.to_dict()
        created_at = data.get("createdAt")

        results.append({
            "id": doc.id,
            "userId": data.get("userId", ""),
            "userName": data.get("userName", ""),
            "content": data.get("content", ""),
            "likeCount": data.get("likeCount", 0),
            "createdAt": (
                created_at.isoformat()
                if created_at else None
            ),
        })

    results.sort(
        key=lambda post: post["createdAt"] or "",
        reverse=True
    )

    return JsonResponse({"posts": results})

