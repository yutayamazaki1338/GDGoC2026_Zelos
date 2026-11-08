package com.example.gdgoc_app.ui.screen.main

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Article
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.Article
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.example.gdgoc_app.ui.screen.mypage.MyPageScreen
import com.example.gdgoc_app.ui.screen.postlist.PostListScreen

/**
 * ログイン後のメイン画面。
 *
 * 下部ナビゲーションバー（Material 3 NavigationBar）により、
 * 「投稿一覧」と「マイページ」を切り替えます。
 */
@Composable
fun MainNavigationScreen(
    onLogout: () -> Unit
) {
    var selectedIndex by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedIndex == 0,
                    onClick = { selectedIndex = 0 },
                    icon = {
                        Icon(
                            imageVector = if (selectedIndex == 0) Icons.Filled.Article else Icons.Outlined.Article,
                            contentDescription = "投稿一覧"
                        )
                    },
                    label = { Text("投稿一覧") }
                )
                NavigationBarItem(
                    selected = selectedIndex == 1,
                    onClick = { selectedIndex = 1 },
                    icon = {
                        Icon(
                            imageVector = if (selectedIndex == 1) Icons.Filled.Person else Icons.Outlined.Person,
                            contentDescription = "マイページ"
                        )
                    },
                    label = { Text("マイページ") }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedIndex) {
                0 -> PostListScreen()
                1 -> MyPageScreen(onLogout = onLogout)
            }
        }
    }
}
