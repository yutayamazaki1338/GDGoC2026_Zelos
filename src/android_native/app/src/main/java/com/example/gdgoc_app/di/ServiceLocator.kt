package com.example.gdgoc_app.di

import com.example.gdgoc_app.config.AppConfig
import com.example.gdgoc_app.data.remote.ApiClient
import com.example.gdgoc_app.data.repository.ApiPostRepository
import com.example.gdgoc_app.data.repository.ApiUserRepository
import com.example.gdgoc_app.data.repository.AuthRepository
import com.example.gdgoc_app.data.repository.MockPostRepository
import com.example.gdgoc_app.data.repository.UserProfileSession
import com.example.gdgoc_app.data.repository.GoogleSignInRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CancellationException
import com.example.gdgoc_app.data.repository.PostRepository
import com.example.gdgoc_app.data.repository.UserRepository

/**
 * 依存性注入（DI）を管理するシングルトンオブジェクト。
 *
 * [AppConfig.useMockData] は投稿データだけに適用します。
 * 認証はFirebase、プロフィールはDjangoの実サービスを使用します。
 */
object ServiceLocator {

    lateinit var applicationContext: android.content.Context
        private set

    lateinit var config: AppConfig
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var postRepository: PostRepository
        private set

    lateinit var userRepository: UserRepository
        private set

    lateinit var profileSession: UserProfileSession
        private set

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    var apiClient: ApiClient? = null
        private set

    fun init(appConfig: AppConfig, context: android.content.Context) {
        applicationContext = context.applicationContext
        config = appConfig
        authRepository = AuthRepository()

        // Only posts use mock mode. Firebase auth and Django profiles always use real services.
        val client = ApiClient(baseUrl = config.apiBaseUrl, tokenProvider = { authRepository.getIdToken() })
        apiClient = client
        userRepository = ApiUserRepository(client)
        postRepository = if (config.useMockData) MockPostRepository() else ApiPostRepository(client)
        profileSession = UserProfileSession(authRepository.currentUser, userRepository, applicationScope)
    }

    suspend fun logout() {
        try {
            GoogleSignInRepository().clearSession(applicationContext)
        } catch (e: CancellationException) {
            throw e
        } catch (_: androidx.credentials.exceptions.ClearCredentialException) {
            // Device provider cleanup must not prevent Firebase logout.
        }
        authRepository.logout()
    }
}
