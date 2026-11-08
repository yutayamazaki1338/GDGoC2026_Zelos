package com.example.gdgoc_app.data.repository

import com.example.gdgoc_app.data.model.User

/**
 * ユーザープロフィール取得の抽象インターフェース。
 */
interface UserRepository {
    suspend fun getMyProfile(): User
}
