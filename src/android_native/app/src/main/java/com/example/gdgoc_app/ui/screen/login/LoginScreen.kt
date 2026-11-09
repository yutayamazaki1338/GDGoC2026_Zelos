package com.example.gdgoc_app.ui.screen.login

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(viewModel: LoginViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var registering by remember { mutableStateOf(false) }
    Scaffold(topBar = { CenterAlignedTopAppBar(title = { Text("ミライログ") }) }) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(if (state.needsVerification) "メールアドレスの確認" else if (registering) "新規登録" else "ログイン", style = MaterialTheme.typography.headlineSmall)
            if (state.needsVerification) {
                Text("メール確認が完了するまで投稿一覧には進めません。確認メールのリンクを開き、下のボタンで再確認してください。アプリを閉じても確認を続けられます。")
                Button(onClick = viewModel::refreshVerification, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth()) { Text("確認済み・再確認") }
                OutlinedButton(onClick = viewModel::resendVerification, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth()) { Text("確認メールを再送") }
                TextButton(onClick = viewModel::cancelVerification, enabled = !state.isLoading) { Text("ログアウトして戻る") }
            } else {
                OutlinedButton(onClick = { viewModel.loginWithGoogle(context) }, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth()) { Text("Googleでログイン") }
                Text("またはメールアドレスで続ける")
                OutlinedTextField(value = state.email, onValueChange = viewModel::onEmailChanged,
                    label = { Text("メールアドレス") }, singleLine = true, enabled = !state.isLoading,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = state.password, onValueChange = viewModel::onPasswordChanged,
                    label = { Text("パスワード") }, singleLine = true, enabled = !state.isLoading,
                    visualTransformation = if (state.isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = { TextButton(onClick = viewModel::togglePasswordVisibility) { Text(if (state.isPasswordVisible) "隠す" else "表示") } },
                    modifier = Modifier.fillMaxWidth())
                Button(onClick = { viewModel.login(registering) }, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth()) { Text(if (registering) "登録して確認メールを送信" else "ログイン") }
                TextButton(onClick = { registering = !registering }, enabled = !state.isLoading) { Text(if (registering) "ログインに戻る" else "メールアドレスで新規登録") }
                TextButton(onClick = viewModel::resetPassword, enabled = !state.isLoading) { Text("パスワード再設定メールを送信") }
                if (registering) Text("登録後に確認メールを送信します。メール確認後にログインできます。", style = MaterialTheme.typography.bodySmall)
            }
            state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            state.errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            if (state.isLoading) CircularProgressIndicator()
        }
    }
}
