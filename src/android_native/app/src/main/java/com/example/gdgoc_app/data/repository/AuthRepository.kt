package com.example.gdgoc_app.data.repository

import com.example.gdgoc_app.data.model.User
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * 認証状態およびログイン・ログアウト処理を管理するリポジトリ。
 *
 * 【重要】
 * 現段階ではGoogle Cloud環境未構築のため、仮実装のモック認証を行っています。
 * 本番用の認証として使用しないでください。
 * 将来的にFirebase Authentication (FirebaseAuth) へ切り替える設計となっています。
 */
class AuthRepository {

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    val isAuthenticated: Boolean
        get() = _currentUser.value != null

    companion object {
        const val TEST_EMAIL = "test@example.com"
        const val TEST_PASSWORD = "test1234"
    }

    /**
     * 仮ログイン処理を実行します。
     */
    suspend fun login(email: String, password: String): User {
        delay(600) // ネットワーク遅延シミュレーション

        val trimmedEmail = email.trim()
        if (trimmedEmail == TEST_EMAIL && password == TEST_PASSWORD) {
            val user = User(
                id = "user001",
                name = "テストユーザー",
                email = TEST_EMAIL,
                bio = "Kotlin + Jetpack ComposeとGoogle Cloud (Cloud Run / Django / Firestore) を連携して開発しています。エミュレーター通信を検証中。"
            )
            _currentUser.value = user
            return user
        } else {
            throw IllegalArgumentException(
                "メールアドレスまたはパスワードが正しくありません。\n" +
                        "【開発用テストアカウント】\n" +
                        "メール: $TEST_EMAIL\n" +
                        "パスワード: $TEST_PASSWORD"
            )
        }
    }

    /**
     * ログアウト処理を実行します。
     */
    suspend fun logout() {
        delay(100)
        _currentUser.value = null
    }
}
