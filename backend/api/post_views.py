
import json
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from google.cloud import firestore

from .authentication import require_firebase_auth
from .registration_permissions import require_registration_completed
from .diagnosis_questions import TYPE_MAP

logger = logging.getLogger(__name__)
JST = ZoneInfo("Asia/Tokyo")


@csrf_exempt
@require_POST
@require_firebase_auth
@require_registration_completed
def create_post(request):
    """当日の問いに対する投稿を保存する。"""

    try:
        payload = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400,
        )

    if not isinstance(payload, dict):
        return JsonResponse(
            {"error": "JSON object required"},
            status=400,
        )

    question_id = payload.get("questionId")
    content = payload.get("content")
    option_index = payload.get("selectedOptionIndex")

    if not isinstance(question_id, str):
        return JsonResponse(
            {"error": "Invalid questionId"},
            status=400,
        )

    if not isinstance(content, str):
        return JsonResponse(
            {"error": "Invalid content"},
            status=400,
        )

    content = content.strip()

    if not content or len(content) > 1000:
        return JsonResponse(
            {"error": "Content must be 1-1000 characters"},
            status=400,
        )

    if option_index is not None and (
        type(option_index) is not int or option_index < 0
    ):
        return JsonResponse(
            {"error": "Invalid selectedOptionIndex"},
            status=400,
        )

    uid = request.firebase_user["uid"]

    try:
        db = firestore.Client()

        # 問いとユーザーをトランザクション内で確認する
        question_ref = db.collection("questions").document(
            question_id
        )
        user_ref = db.collection("users").document(uid)
        post_ref = db.collection("posts").document()

        @firestore.transactional
        def save_post(transaction):
            question_snap = question_ref.get(
                transaction=transaction
            )
            user_snap = user_ref.get(
                transaction=transaction
            )

            if not question_snap.exists:
                return "question_not_found"

            question = question_snap.to_dict() or {}

            if not user_snap.exists:
                return "user_not_found"

            user = user_snap.to_dict() or {}

            if user.get("registrationState") != "Completed":
                return "registration_incomplete"

            today = datetime.now(JST).date().isoformat()

            if (
                question_id != today
                or question.get("publishDate") != today
                or not isinstance(question.get("archiveUntil"), str)
                or question["archiveUntil"] < today
            ):
                return "posting_closed"

            options = question.get("options")

            if not isinstance(options, list) or not options:
                return "invalid_question"

            if (
                option_index is not None
                and option_index >= len(options)
            ):
                return "invalid_option"

            latest = user.get("latestDiagnosis") or {}
            type_code = (
                latest.get("typeCode")
                if isinstance(latest, dict)
                else None
            )

            if type_code not in TYPE_MAP:
                return "diagnosis_unavailable"

            transaction.create(
                post_ref,
                {
                    "uid": uid,
                    "questionId": question_id,
                    "typeCodeAtPost": type_code,
                    "content": content,
                    "selectedOptionIndex": option_index,
                    "likeCount": 0,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                },
            )

            return "created"

        result = save_post(db.transaction())

        error_map = {
            "question_not_found": (404, "Question not found"),
            "user_not_found": (404, "User not found"),
            "registration_incomplete": (403, "Registration incomplete"),
            "posting_closed": (403, "Posting period closed"),
            "invalid_question": (503, "Question data invalid"),
            "invalid_option": (400, "Invalid selectedOptionIndex"),
            "diagnosis_unavailable": (409, "Diagnosis unavailable"),
        }

        if result != "created":
            status, message = error_map.get(
                result, (503, "Post creation failed")
            )
            return JsonResponse(
                {"error": message},
                status=status,
            )

        return JsonResponse(
            {
                "id": post_ref.id,
                "questionId": question_id,
                "typeCodeAtPost": (
                    # 保存した値を再取得して返す
                    post_ref.get().to_dict() or {}
                ).get("typeCodeAtPost"),
                "content": content,
            },
            status=201,
            json_dumps_params={"ensure_ascii": False},
        )

    except Exception:
        logger.exception("Post creation failed")
        return JsonResponse(
            {"error": "Post service unavailable"},
            status=503,
        )
