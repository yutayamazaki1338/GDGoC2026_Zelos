
import logging

from django.http import JsonResponse
from django.views.decorators.http import require_GET
from firebase_admin import firestore
from google.cloud import firestore as google_firestore
from google.api_core.exceptions import GoogleAPICallError

from .authentication import require_firebase_auth
from .profile_views import (
    get_firestore,
    check_email_verification,
)

logger = logging.getLogger(__name__)

POLICY_VERSION = 1


def registration_response(
    state,
    diagnosis_required,
    diagnosis_id=None,
):
    return JsonResponse({
        "registrationState": state,
        "diagnosisRequired": diagnosis_required,
        "verifiedDiagnosisId": diagnosis_id,
    })


@require_GET
@require_firebase_auth
def get_registration_state(request):
    """
    GET /users/me/registration

    Firebase UIDをもとに登録状態を取得する。
    """

    user = request.firebase_user

    verification_error = check_email_verification(user)
    if verification_error is not None:
        return verification_error

    uid = user["uid"]

    try:
        db = get_firestore()

        policy_ref = (
            db.collection("registrationPolicies")
            .document(uid)
        )

        profile_ref = (
            db.collection("users")
            .document(uid)
        )

        @google_firestore.transactional
        def ensure_policy(transaction):
            snapshot = policy_ref.get(transaction=transaction)

            if snapshot.exists:
                return snapshot.to_dict(), False

            # 未分類UIDを自動的に既存ユーザー扱いしない
            initial_policy = {
                "policyVersion": POLICY_VERSION,
                "diagnosisRequired": True,
                "registrationState": "PendingDiagnosis",
                "verifiedDiagnosisId": None,
                "createdAt": firestore.SERVER_TIMESTAMP,
            }

            transaction.create(policy_ref, initial_policy)

            return initial_policy, True

        policy, newly_created = ensure_policy(
            db.transaction()
        )

        diagnosis_required = policy.get(
            "diagnosisRequired",
            True,
        )

        state = policy.get("registrationState")

        # 移行済みの従来ユーザー
        if state == "Existing":
            if diagnosis_required is not False:
                return JsonResponse(
                    {"error": "Invalid registration policy"},
                    status=409,
                )
            return registration_response(
                "Existing",
                False,
            )

        # 登録完了済み
        if state == "Completed":
            diagnosis_id = policy.get(
                "verifiedDiagnosisId"
            )

            if not diagnosis_id:
                return JsonResponse(
                    {"error": "Missing verified diagnosis"},
                    status=409,
                )

            diagnosis = (
                profile_ref.collection("diagnoses")
                .document(diagnosis_id)
                .get()
            )
            profile = profile_ref.get()

            if not diagnosis.exists or not profile.exists:
                return JsonResponse(
                    {"error": "Incomplete registration"},
                    status=409,
                )

            

            return registration_response(
                "Completed",
                True,
                diagnosis_id,
            )

        # 新規登録途中の状態だけを受け付ける
        if state not in (
            "PendingDiagnosis",
            "PendingUsername",
        ):
            return JsonResponse(
                {"error": "Invalid registration state"},
                status=409,
            )

        # プロフィールの有無によらず、診断の実在を確認
        diagnoses = list(
            profile_ref
            .collection("diagnoses")
            .order_by(
                "completedAt",
                direction=firestore.Query.DESCENDING,
            )
            .limit(1)
            .stream()
        )

        if diagnoses:
            # 診断保存済み、ユーザー名登録待ち
            return registration_response(
                "PendingUsername",
                True,
                diagnoses[0].id,
            )

        # 初回アクセスのみNew、それ以降はPendingDiagnosis
        return registration_response(
            "New" if newly_created else "PendingDiagnosis",
            True,
        )

    except GoogleAPICallError:
        logger.exception("Registration state database error")
        return JsonResponse(
            {"error": "Database unavailable"},
            status=503,
        )
    except Exception:
        logger.exception("Unexpected registration state error")
        return JsonResponse(
            {"error": "Registration state unavailable"},
            status=500,
        )
