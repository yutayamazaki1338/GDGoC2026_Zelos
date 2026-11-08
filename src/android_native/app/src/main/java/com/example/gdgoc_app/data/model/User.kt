package com.example.gdgoc_app.data.model

import com.google.gson.annotations.SerializedName

/**
 * ユーザー情報を表すデータモデル。
 *
 * GET /users/me のレスポンスに対応します。
 */
data class User(
    @SerializedName("id")
    val id: String = "",

    @SerializedName("name")
    val name: String = "",

    @SerializedName("email")
    val email: String = "",

    @SerializedName("bio")
    val bio: String = ""
)
