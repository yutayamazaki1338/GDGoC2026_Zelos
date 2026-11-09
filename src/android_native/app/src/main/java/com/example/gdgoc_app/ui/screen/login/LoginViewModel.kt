package com.example.gdgoc_app.ui.screen.login

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.gdgoc_app.data.repository.AuthRepository
import com.example.gdgoc_app.data.repository.GoogleSignInRepository
import com.example.gdgoc_app.di.ServiceLocator
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val message: String? = null,
    val needsVerification: Boolean = false
)

class LoginViewModel(
    private val authRepository: AuthRepository = ServiceLocator.authRepository,
    private val googleSignIn: GoogleSignInRepository = GoogleSignInRepository()
) : ViewModel() {
    private val _uiState = MutableStateFlow(LoginUiState(needsVerification = authRepository.needsEmailVerification))
    val uiState = _uiState.asStateFlow()

    fun onEmailChanged(value: String) { if (!_uiState.value.isLoading) _uiState.update { it.copy(email = value, errorMessage = null) } }
    fun onPasswordChanged(value: String) { if (!_uiState.value.isLoading) _uiState.update { it.copy(password = value, errorMessage = null) } }
    fun togglePasswordVisibility() { _uiState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) } }

    private fun validEmail(): Boolean {
        if (android.util.Patterns.EMAIL_ADDRESS.matcher(_uiState.value.email.trim()).matches()) return true
        _uiState.update { it.copy(errorMessage = "正しいメールアドレスを入力してください。") }
        return false
    }

    private fun runOperation(action: suspend () -> String?) {
        if (_uiState.value.isLoading) return
        _uiState.update { it.copy(isLoading = true, errorMessage = null, message = null) }
        viewModelScope.launch {
            try {
                val message = action()
                _uiState.update { it.copy(message = message, password = "") }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.update { it.copy(errorMessage = authErrorMessage(e)) }
            } finally {
                _uiState.update { it.copy(isLoading = false, needsVerification = authRepository.needsEmailVerification) }
            }
        }
    }

    fun login(register: Boolean = false) {
        if (_uiState.value.isLoading || !validEmail()) return
        val state = _uiState.value
        if (state.password.isEmpty() || (register && state.password.length < 6)) {
            _uiState.update { it.copy(errorMessage = if (register) "パスワードは6文字以上で入力してください。" else "パスワードを入力してください。") }
            return
        }
        runOperation {
            if (register) authRepository.register(state.email, state.password)
            else authRepository.login(state.email, state.password)
            if (authRepository.needsEmailVerification) {
                if (register) "確認メールを送信しました。メール内のリンクを開いてから「確認済み・再確認」を押してください。"
                else "メールアドレスが未確認です。確認メールのリンクを開いてください。"
            } else null
        }
    }

    fun loginWithGoogle(context: Context) = runOperation {
        authRepository.loginWithGoogle(googleSignIn.getIdToken(context))
        null
    }
    fun resetPassword() {
        if (_uiState.value.isLoading || !validEmail()) return
        val email = _uiState.value.email
        runOperation {
            authRepository.sendPasswordReset(email)
            "登録されている場合は、パスワード再設定メールが届きます。受信箱をご確認ください。"
        }
    }
    fun resendVerification() = runOperation {
        authRepository.resendVerification()
        "確認メールを再送しました。"
    }
    fun refreshVerification() = runOperation {
        authRepository.refreshUser()
        if (authRepository.needsEmailVerification) "まだ確認できていません。メール内のリンクを開いてから再確認してください。" else null
    }
    fun cancelVerification() = runOperation { authRepository.logout(); null }
}
