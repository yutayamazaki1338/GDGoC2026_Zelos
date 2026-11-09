package com.example.gdgoc_app.data.repository

import android.content.Context
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import com.example.gdgoc_app.R
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

/** Activity context is used only for the account chooser, never retained. */
class GoogleSignInRepository {
    suspend fun getIdToken(activityContext: Context): String {
        val option = GetSignInWithGoogleOption.Builder(
            activityContext.getString(R.string.default_web_client_id)
        ).build()
        val result = CredentialManager.create(activityContext).getCredential(
            activityContext,
            GetCredentialRequest.Builder().addCredentialOption(option).build()
        )
        val credential = result.credential
        check(credential is CustomCredential &&
            credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            "Googleの認証情報を取得できませんでした"
        }
        return GoogleIdTokenCredential.createFrom(credential.data).idToken
    }

    suspend fun clearSession(context: Context) {
        CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())
    }
}
