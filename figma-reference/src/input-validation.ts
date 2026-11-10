export type CredentialMode = "signup" | "login" | "email" | "password" | "reset" | "request";
export type CredentialValues = {
  email: string;
  password: string;
  currentPassword: string;
  confirmation: string;
};
export type CredentialField = keyof CredentialValues;
export type CredentialErrors = Partial<Record<CredentialField, string>>;
export type ProfileErrors = Partial<Record<"name" | "bio", string>>;

function passwordError(value: string, label: string) {
  if (!value.trim()) return `${label}を入力してください。`;
  if (value.length < 8) return `${label}は8文字以上で入力してください。`;
  if (value.length > 128) return `${label}は128文字以内で入力してください。`;
}

export function validateCredentials(
  mode: CredentialMode,
  values: CredentialValues,
): CredentialErrors {
  const errors: CredentialErrors = {};
  if (["signup", "login", "email", "request"].includes(mode)) {
    const email = values.email.trim();
    if (!email) errors.email = "メールアドレスを入力してください。";
    else if (email.length > 254) errors.email = "メールアドレスは254文字以内で入力してください。";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "メールアドレスの形式を確認してください（例：name@example.com）。";
  }
  if (["email", "password"].includes(mode)) {
    const error = passwordError(values.currentPassword, "現在のパスワード");
    if (error) errors.currentPassword = error;
  }
  if (["signup", "login", "password", "reset"].includes(mode)) {
    const error = passwordError(
      values.password,
      ["password", "reset"].includes(mode) ? "新しいパスワード" : "パスワード",
    );
    if (error) errors.password = error;
  }
  if (["signup", "password", "reset"].includes(mode)) {
    const error = passwordError(values.confirmation, "確認用パスワード");
    if (error) errors.confirmation = error;
    else if (values.password !== values.confirmation)
      errors.confirmation = "確認用パスワードが一致しません。";
  }
  if (
    mode === "password" &&
    !errors.password &&
    !errors.currentPassword &&
    values.password === values.currentPassword
  ) {
    errors.password = "現在とは異なるパスワードを入力してください。";
  }
  return errors;
}

export function validateProfile(name: string, bio: string): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!name.trim()) errors.name = "名前を入力してください。";
  else if (name.length > 20) errors.name = "名前は20文字以内で入力してください。";
  if (bio.length > 120) errors.bio = "自己紹介は120文字以内で入力してください。";
  return errors;
}

export function validateProfileImage(file: { type: string; size: number }) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "JPG・PNG・WebP形式の画像を選んでください。";
  if (file.size <= 0) return "画像ファイルが空です。別の画像を選んでください。";
  if (file.size > 5 * 1024 * 1024) return "画像は5MB以下にしてください。";
  return "";
}
