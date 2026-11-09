package com.example.gdgoc_app.data.repository

import com.example.gdgoc_app.data.model.Post
import com.example.gdgoc_app.data.model.PostsResponse
import com.example.gdgoc_app.data.remote.ApiClient

/**
 * Cloud Run / Django バックエンドとHTTP通信を行って投稿データを取得するリポジトリ。
 */
class ApiPostRepository(
    private val apiClient: ApiClient
) : PostRepository {

    override suspend fun getPosts(): List<Post> {
        val response = apiClient.get("/posts", PostsResponse::class.java)
        return response.posts.sortedByDescending { it.createdAt }
    }

    override suspend fun getUserPosts(userId: String): List<Post> {
        // Until Django verifies Firebase tokens, derive this list from the public endpoint.
        return getPosts().filter { it.userId == userId }
    }
}
