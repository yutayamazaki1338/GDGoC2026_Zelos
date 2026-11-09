
import logging
from functools import wraps

from django.conf import settings
from django.http import JsonResponse
from google.cloud import firestore
from google.api_core.exceptions import GoogleAPICallError

logger = logging.getLogger(__name__)


def require_registration_completed(view_func):
    """
    Firebase認証後、通常APIの利用資格を確認する。

    このデコレータを使う関数には、
    先に @require_firebase_auth を適用すること。
    """

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):

        # 既存ユーザー移行が完了するまでは強制しない
        if not settings.REGISTRATION_GATE_ENABLED:
            return view_func(request, *args, **kwargs)

        user = getattr(request, "firebase_user", None)

        if not user or not user.get("uid"):
            return JsonResponse(
                {"error": "Authentication required"},
                status=401,
            )

        uid = user["uid"]

        try:
            db = firestore.Client()

            policy_ref = (
                db.collection("registrationPolicies")
                .document(uid)
            )

            profile_ref = (
                db.collection("users")
                .document(uid)
            )

            policy_snapshot = policy_ref.get()

            if not policy_snapshot.exists:
                return JsonResponse(
                    {"error": "Registration state unavailable"},
                    status=403,
                )

            policy = policy_snapshot.to_dict() or {}
            state = policy.get("registrationState")

            if state == "Existing":
                if policy.get("diagnosisRequired") is not False:
                    return JsonResponse(
                        {"error": "Invalid registration policy"},
                        status=403,
                    )

                if not profile_ref.get().exists:
                    return JsonResponse(
                        {"error": "Profile not found"},
                        status=403,
                    )

                return view_func(request, *args, **kwargs)

            if state != "Completed":
                return JsonResponse(
                    {
                        "error": "Registration incomplete",
                        "registrationState": state,
                    },
                    status=403,
                )

            if policy.get("diagnosisRequired") is not True:
                return JsonResponse(
                    {"error": "Invalid registration policy"},
                    status=403,
                )

            diagnosis_id = policy.get("verifiedDiagnosisId")

            if not diagnosis_id:
                return JsonResponse(
                    {"error": "Verified diagnosis missing"},
                    status=403,
                )

            profile_snapshot = profile_ref.get()

            if not profile_snapshot.exists:
                return JsonResponse(
                    {"error": "Profile not found"},
                    status=403,
                )

            

            diagnosis_snapshot = (
                profile_ref.collection("diagnoses")
                .document(diagnosis_id)
                .get()
            )

            if not diagnosis_snapshot.exists:
                return JsonResponse(
                    {"error": "Verified diagnosis not found"},
                    status=403,
                )

            return view_func(request, *args, **kwargs)

        except GoogleAPICallError:
            logger.exception("Registration authorization DB error")
            return JsonResponse(
                {"error": "Registration check unavailable"},
                status=503,
            )

    return wrapper
