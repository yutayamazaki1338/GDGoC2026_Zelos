package com.example.gdgoc_app.data.repository

import com.example.gdgoc_app.data.model.User
import com.example.gdgoc_app.data.remote.ApiClient
import com.example.gdgoc_app.data.remote.ApiException
import com.google.gson.JsonObject

/** Django owns profile persistence. Both operations always require Firebase authentication. */
class ApiUserRepository(private val apiClient: ApiClient) : UserRepository {
    override suspend fun initializeMyProfile(): User = parse(
        apiClient.post("/users/me/initialize", JsonObject::class.java, authenticated = true)
    )
    override suspend fun getMyProfile(): User = parse(
        apiClient.get("/users/me", JsonObject::class.java, authenticated = true)
    )

    private fun parse(json: JsonObject): User {
        fun string(key: String): String {
            val value = json.get(key)
            if (value == null || !value.isJsonPrimitive || !value.asJsonPrimitive.isString)
                throw ApiException("プロフィールの応答形式が正しくありません。")
            return value.asString
        }
        val verified = json.get("emailVerified")
        if (verified == null || !verified.isJsonPrimitive || !verified.asJsonPrimitive.isBoolean)
            throw ApiException("プロフィールの応答形式が正しくありません。")
        val user = User(
            id = string("id"), name = string("name"), email = string("email"),
            emailVerified = verified.asBoolean, bio = string("bio"),
            avatarUrl = string("avatarUrl"), createdAt = string("createdAt")
        )
        if (user.id.isBlank()) throw ApiException("プロフィールのユーザー情報を確認できませんでした。")
        return user
    }
}
