package com.example.gdgoc_app.data.remote

import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.net.SocketTimeoutException
import java.util.concurrent.TimeUnit

/**
 * 通信エラーを表す例外クラス。
 */
class ApiException(
    message: String,
    val statusCode: Int? = null,
    cause: Throwable? = null
) : Exception(message, cause)

/**
 * Cloud Run / Django バックエンドとの通信を担当するHTTPクライアント。
 *
 * タイムアウト、将来のFirebase Auth IDトークン付与、レスポンスのJSON解析をカプセル化します。
 */
class ApiClient(
    val baseUrl: String,
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build(),
    private val gson: Gson = Gson()
) {
    @Volatile
    private var idToken: String? = null

    /**
     * 将来Firebase Authentication導入後に取得したIDトークンを設定します。
     * Authorization: Bearer <token> として各リクエストに付与されます。
     */
    fun setAuthToken(token: String?) {
        this.idToken = token
    }

    /**
     * 指定されたエンドポイントへGETリクエストを送信し、型 [T] にデシリアライズして返します。
     */
    suspend fun <T> get(endpoint: String, responseClass: Class<T>): T = withContext(Dispatchers.IO) {
        if (baseUrl.trim().isEmpty()) {
            throw ApiException("Cloud Run (Django) のURLが設定されていません。assets/config/app_config.json を確認してください。")
        }

        val normalizedBaseUrl = if (baseUrl.endsWith("/")) baseUrl.dropLast(1) else baseUrl
        val normalizedEndpoint = if (endpoint.startsWith("/")) endpoint else "/$endpoint"
        val fullUrl = "$normalizedBaseUrl$normalizedEndpoint"

        val requestBuilder = Request.Builder()
            .url(fullUrl)
            .addHeader("Accept", "application/json")
            .addHeader("Content-Type", "application/json; charset=utf-8")

        idToken?.let { token ->
            if (token.isNotEmpty()) {
                requestBuilder.addHeader("Authorization", "Bearer $token")
            }
        }

        val request = requestBuilder.build()

        try {
            client.newCall(request).execute().use { response ->
                val bodyString = response.body?.string().orEmpty()

                if (response.isSuccessful) {
                    try {
                        return@withContext gson.fromJson(bodyString, responseClass)
                            ?: throw ApiException("レスポンスのパース結果がnullでした。")
                    } catch (e: Exception) {
                        throw ApiException("サーバー応答をJSONとして解析できませんでした。", cause = e)
                    }
                }

                when (response.code) {
                    401, 403 -> throw ApiException("認証に失敗しました。再ログインしてください。", response.code)
                    404 -> throw ApiException("指定されたリソースが見つかりませんでした (404)。", response.code)
                    in 500..599 -> throw ApiException("サーバー内部エラーが発生しました (${response.code})。", response.code)
                    else -> throw ApiException("通信エラーが発生しました (ステータスコード: ${response.code})", response.code)
                }
            }
        } catch (e: SocketTimeoutException) {
            throw ApiException("通信がタイムアウトしました。サーバーの状態を確認してください。", cause = e)
        } catch (e: IOException) {
            throw ApiException("ネットワークに接続できませんでした。通信環境を確認してください: ${e.message}", cause = e)
        }
    }
}
