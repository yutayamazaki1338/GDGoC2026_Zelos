package com.example.gdgoc_app.ui.screen.mypage

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.gdgoc_app.data.model.Post
import com.example.gdgoc_app.data.model.User
import com.example.gdgoc_app.data.repository.AuthRepository
import com.example.gdgoc_app.data.repository.PostRepository
import com.example.gdgoc_app.data.repository.UserRepository
import com.example.gdgoc_app.di.ServiceLocator
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MyPageUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val userPosts: List<Post> = emptyList(),
    val errorMessage: String? = null,
    val showLogoutDialog: Boolean = false,
    val isLoggedOut: Boolean = false
)

class MyPageViewModel(
    private val userRepository: UserRepository = ServiceLocator.userRepository,
    private val postRepository: PostRepository = ServiceLocator.postRepository,
    private val authRepository: AuthRepository = ServiceLocator.authRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyPageUiState(isLoading = true))
    val uiState: StateFlow<MyPageUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val user = userRepository.getMyProfile()
                val posts = postRepository.getUserPosts(user.id)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        user = user,
                        userPosts = posts,
                        errorMessage = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = e.message ?: "プロフィールの取得に失敗しました"
                    )
                }
            }
        }
    }

    fun showLogoutDialog() {
        _uiState.update { it.copy(showLogoutDialog = true) }
    }

    fun dismissLogoutDialog() {
        _uiState.update { it.copy(showLogoutDialog = false) }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.update {
                it.copy(
                    showLogoutDialog = false,
                    isLoggedOut = true
                )
            }
        }
    }
}
