package com.example.gdgoc_app.data.repository

import com.example.gdgoc_app.data.model.User
import com.example.gdgoc_app.data.remote.ApiClient

/**
 * Cloud Run / Django バックエンドとHTTP通信を行ってユーザー情報を取得するリポジトリ。
 */
class ApiUserRepository(
    private val apiClient: ApiClient
) : UserRepository {

    override suspend fun getMyProfile(): User {
        return apiClient.get("/users/me", User::class.java)
    }
}
