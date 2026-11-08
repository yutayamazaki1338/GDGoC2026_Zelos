package com.example.gdgoc_app.ui.screen.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.gdgoc_app.data.repository.AuthRepository
import com.example.gdgoc_app.di.ServiceLocator
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val emailError: String? = null,
    val password: String = "",
    val passwordError: String? = null,
    val isPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isLoggedIn: Boolean = false
)

class LoginViewModel(
    private val authRepository: AuthRepository = ServiceLocator.authRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChanged(email: String) {
        _uiState.update {
            it.copy(
                email = email,
                emailError = null,
                errorMessage = null
            )
        }
    }

    fun onPasswordChanged(password: String) {
        _uiState.update {
            it.copy(
                password = password,
                passwordError = null,
                errorMessage = null
            )
        }
    }

    fun togglePasswordVisibility() {
        _uiState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun fillTestAccount() {
        _uiState.update {
            it.copy(
                email = AuthRepository.TEST_EMAIL,
                emailError = null,
                password = AuthRepository.TEST_PASSWORD,
                passwordError = null,
                errorMessage = null
            )
        }
    }

    fun login() {
        val state = _uiState.value
        val email = state.email.trim()
        val password = state.password

        // バリデーション
        var hasError = false
        var emailError: String? = null
        var passwordError: String? = null

        if (email.isEmpty()) {
            emailError = "メールアドレスを入力してください"
            hasError = true
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailError = "正しいメールアドレスの形式で入力してください"
            hasError = true
        }

        if (password.isEmpty()) {
            passwordError = "パスワードを入力してください"
            hasError = true
        } else if (password.length < 6) {
            passwordError = "パスワードは6文字以上で入力してください"
            hasError = true
        }

        if (hasError) {
            _uiState.update {
                it.copy(
                    emailError = emailError,
                    passwordError = passwordError
                )
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                authRepository.login(email = email, password = password)
                _uiState.update { it.copy(isLoading = false, isLoggedIn = true) }
            } catch (e: Exception) {
                val message = e.message ?: "ログインに失敗しました"
                _uiState.update { it.copy(isLoading = false, errorMessage = message) }
            }
        }
    }
}
