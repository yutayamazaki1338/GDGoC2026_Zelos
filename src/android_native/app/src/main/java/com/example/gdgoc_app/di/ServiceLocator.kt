package com.example.gdgoc_app.di

import com.example.gdgoc_app.config.AppConfig
import com.example.gdgoc_app.data.remote.ApiClient
import com.example.gdgoc_app.data.repository.ApiPostRepository
import com.example.gdgoc_app.data.repository.ApiUserRepository
import com.example.gdgoc_app.data.repository.AuthRepository
import com.example.gdgoc_app.data.repository.MockPostRepository
import com.example.gdgoc_app.data.repository.MockUserRepository
import com.example.gdgoc_app.data.repository.PostRepository
import com.example.gdgoc_app.data.repository.UserRepository

/**
 * 依存性注入（DI）を管理するシングルトンオブジェクト。
 *
 * [AppConfig.useMockData] のフラグに応じて、
 * モックリポジトリと実APIリポジトリを透過的に切り替えます。
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

    var apiClient: ApiClient? = null
        private set

    fun init(appConfig: AppConfig, context: android.content.Context) {
        applicationContext = context.applicationContext
        config = appConfig
        authRepository = AuthRepository()

        if (config.useMockData) {
            postRepository = MockPostRepository()
            userRepository = MockUserRepository()
            apiClient = null
        } else {
            val client = ApiClient(baseUrl = config.apiBaseUrl, tokenProvider = { authRepository.getIdToken() })
            apiClient = client
            postRepository = ApiPostRepository(client)
            userRepository = ApiUserRepository(client)
        }
    }
}
