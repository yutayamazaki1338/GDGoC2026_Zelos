package com.example.gdgoc_app.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.SettingsSuggest
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.gdgoc_app.di.ServiceLocator
import com.example.gdgoc_app.ui.screen.login.LoginScreen
import com.example.gdgoc_app.ui.screen.main.MainNavigationScreen

object NavDestinations {
    const val LOGIN = "login"
    const val MAIN = "main"
}

@Composable
fun NavGraph() {
    val config = ServiceLocator.config
    val configError = config.validate()

    if (configError != null) {
        ConfigErrorScreen(errorMessage = configError)
        return
    }

    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = NavDestinations.LOGIN
    ) {
        composable(NavDestinations.LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(NavDestinations.MAIN) {
                        popUpTo(NavDestinations.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(NavDestinations.MAIN) {
            MainNavigationScreen(
                onLogout = {
                    navController.navigate(NavDestinations.LOGIN) {
                        popUpTo(NavDestinations.MAIN) { inclusive = true }
                    }
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ConfigErrorScreen(errorMessage: String) {
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(text = "設定エラー", fontWeight = FontWeight.Bold) }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Outlined.SettingsSuggest,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(64.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "設定ファイルのエラー",
                style = MaterialTheme.textTheme.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(12.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.errorContainer)
                    .padding(16.dp)
            ) {
                Text(
                    text = errorMessage,
                    style = MaterialTheme.textTheme.bodyMedium,
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }
    }
}
