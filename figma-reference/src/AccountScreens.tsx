import { validateCredentials, validateProfile, validateProfileImage } from "./input-validation";
import type { CredentialField, CredentialMode, CredentialValues } from "./input-validation";
import { useEffect, useRef, useState } from "react";
import { Avatar, Header, Icon } from "./ui";
import type { IconName } from "./ui";

export type DemoProfile = { name: string; bio: string; image?: string };
export const initialProfile: DemoProfile = {
  name: "そら",
  bio: "結婚観は考え中。違う立場の話も聞きたい。",
};
export type AccountScreen =
  | "signup"
  | "signup-email"
  | "signup-google"
  | "signup-verify"
  | "signup-done"
  | "signup-profile"
  | "login"
  | "login-done"
  | "reset-request"
  | "reset-sent"
  | "reset-password"
  | "reset-done"
  | "settings"
  | "edit-profile"
  | "change-email"
  | "email-sent"
  | "email-done"
  | "change-password"
  | "password-done"
  | "logout"
  | "delete-account"
  | "deleted";

type Props = {
  screen: AccountScreen;
  go: (screen: AccountScreen | "welcome" | "profile" | "diagnosis" | "result" | "home") => void;
  profile: DemoProfile;
  saveProfile: (profile: DemoProfile, onboarding: boolean) => void;
  completeSession: () => void;
  endSession: (reset?: boolean) => void;
  session: boolean;
};

function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  field,
  error,
  fresh = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  field: Exclude<CredentialField, "email">;
  error?: string;
  fresh?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const id = `account-${field}`;
  return (
    <label className="form-field" htmlFor={id}>
      <span>{label}</span>
      <div className={`password-input${error ? " has-error" : ""}`}>
        <input
          id={id}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          required
          minLength={8}
          maxLength={128}
          autoComplete={fresh ? "new-password" : "current-password"}
          placeholder="8文字以上"
        />
        <button
          type="button"
          aria-label={`${label}を${visible ? "隠す" : "表示"}`}
          onClick={() => setVisible(!visible)}
        >
          {visible ? "隠す" : "表示"}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="field-error">
          {error}
        </p>
      )}
    </label>
  );
}

function Credentials({ mode, go }: { mode: CredentialMode; go: Props["go"] }) {
  const [values, setValues] = useState<CredentialValues>({
    email: "",
    password: "",
    currentPassword: "",
    confirmation: "",
  });
  const [touched, setTouched] = useState<Partial<Record<CredentialField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const errors = validateCredentials(mode, values);
  const errorFor = (field: CredentialField) =>
    submitted || touched[field] ? errors[field] : undefined;
  const change = (field: CredentialField, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));
  const blur = (field: CredentialField) => setTouched((current) => ({ ...current, [field]: true }));
  const isSignup = mode === "signup";
  const isLogin = mode === "login";
  const changingPassword = mode === "password" || mode === "reset";
  const showEmail = isSignup || isLogin || mode === "email" || mode === "request";
  const copy = {
    signup: ["メールアドレスで登録", "あなたの言葉で、はじめよう。", "", "確認メールを送信"],
    login: [
      "ログイン",
      "おかえりなさい。",
      "今日も、いろんな結婚観に触れてみよう。",
      "ログインする",
    ],
    email: [
      "メールアドレス変更",
      "",
      "新しいメールアドレスの確認後に、変更が完了する流れです。",
      "確認メールを送信",
    ],
    password: [
      "パスワード変更",
      "",
      "現在のパスワードと、新しいパスワードを入力してください。",
      "パスワードを変更する",
    ],
    reset: [
      "パスワード再設定",
      "新しいパスワードを。",
      "新しいパスワードを入力してください。",
      "再設定する",
    ],
    request: [
      "パスワードを忘れた方",
      "もう一度、ログインへ。",
      "登録したメールアドレスを入力してください。",
      "再設定メールを送信",
    ],
  }[mode];
  const back: Parameters<Props["go"]>[0] = isSignup
    ? "signup"
    : isLogin
      ? "welcome"
      : mode === "request" || mode === "reset"
        ? "login"
        : "settings";
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      const form = event.currentTarget;
      window.requestAnimationFrame(() =>
        form.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    // Credentials remain local to this form and are discarded before changing screens.
    setValues({ email: "", password: "", currentPassword: "", confirmation: "" });
    setTouched({});
    setSubmitted(false);
    go(
      (
        {
          signup: "signup-verify",
          login: "login-done",
          email: "email-sent",
          password: "password-done",
          reset: "reset-done",
          request: "reset-sent",
        } as const
      )[mode],
    );
  };
  const emailError = errorFor("email");
  return (
    <main className="screen account-screen">
      <Header title={copy[0]} onBack={() => go(back)} />
      <div className="account-content">
        <div className="account-title">
          <span className="account-symbol">
            <Icon name={changingPassword ? "key" : "mail"} size={25} />
          </span>
          {copy[1] && <h2>{copy[1]}</h2>}
          {copy[2] && <p>{copy[2]}</p>}
        </div>
        <form noValidate onSubmit={submit} className="account-form">
          {showEmail && (
            <label className="form-field" htmlFor="account-email">
              <span>{mode === "email" ? "新しいメールアドレス" : "メールアドレス"}</span>
              <input
                id="account-email"
                aria-label={mode === "email" ? "新しいメールアドレス" : "メールアドレス"}
                type="email"
                value={values.email}
                onChange={(event) => change("email", event.target.value)}
                onBlur={() => blur("email")}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "account-email-error" : undefined}
                placeholder="name@example.com"
                required
                maxLength={254}
                autoComplete="email"
              />
              {emailError && (
                <p id="account-email-error" role="alert" className="field-error">
                  {emailError}
                </p>
              )}
            </label>
          )}
          {(mode === "email" || mode === "password") && (
            <PasswordField
              label="現在のパスワード"
              field="currentPassword"
              value={values.currentPassword}
              onChange={(value) => change("currentPassword", value)}
              onBlur={() => blur("currentPassword")}
              error={errorFor("currentPassword")}
            />
          )}
          {(isSignup || isLogin || changingPassword) && (
            <PasswordField
              label={changingPassword ? "新しいパスワード" : "パスワード"}
              field="password"
              value={values.password}
              onChange={(value) => change("password", value)}
              onBlur={() => blur("password")}
              error={errorFor("password")}
              fresh={!isLogin}
            />
          )}
          {(isSignup || changingPassword) && (
            <PasswordField
              label="パスワード（確認）"
              field="confirmation"
              value={values.confirmation}
              onChange={(value) => change("confirmation", value)}
              onBlur={() => blur("confirmation")}
              error={errorFor("confirmation")}
              fresh
            />
          )}
          <button className="primary full" type="submit">
            {copy[3]}
            <Icon name="arrow" size={18} />
          </button>
        </form>
        {isLogin && (
          <>
            <button className="text-button full" onClick={() => go("reset-request")}>
              パスワードを忘れた方
            </button>
            <div className="account-divider">
              <span>はじめての方</span>
            </div>
            <button className="secondary full" onClick={() => go("signup")}>
              アカウントを作成する
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function ProfileEditor({
  profile,
  onboarding,
  save,
  back,
}: {
  profile: DemoProfile;
  onboarding: boolean;
  save: (profile: DemoProfile, onboarding: boolean) => void;
  back: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [image, setImage] = useState(profile.image);
  const [imageError, setImageError] = useState("");
  const [reading, setReading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<"name" | "bio", boolean>>>({});
  const errors = validateProfile(name, bio);
  const nameError = submitted || touched.name ? errors.name : undefined;
  const bioError = submitted || touched.bio ? errors.bio : undefined;
  const readerRef = useRef<FileReader | null>(null);
  useEffect(
    () => () => {
      readerRef.current?.abort();
      readerRef.current = null;
    },
    [],
  );
  const loadImage = (file?: File) => {
    if (!file) return;
    readerRef.current?.abort();
    readerRef.current = null;
    setReading(false);
    const error = validateProfileImage(file);
    if (error) {
      setImageError(error);
      return;
    }
    const reader = new FileReader();
    readerRef.current = reader;
    setReading(true);
    setImageError("");
    const fail = () => {
      if (readerRef.current === reader) {
        setReading(false);
        setImageError("画像を読み込めませんでした。別の画像を選んでください。");
      }
    };
    reader.onerror = fail;
    reader.onload = () => {
      const data = String(reader.result);
      const candidate = new Image();
      candidate.onload = () => {
        if (readerRef.current === reader) {
          setImage(data);
          setReading(false);
        }
      };
      candidate.onerror = fail;
      candidate.src = data;
    };
    reader.readAsDataURL(file);
  };
  return (
    <main className="screen account-screen">
      <Header title={onboarding ? "プロフィールを設定" : "プロフィール編集"} onBack={back} />
      <div className="account-content">
        {onboarding && (
          <div className="account-title">
            <h2>あなたらしく、話そう。</h2>
          </div>
        )}
        <form
          className="account-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (reading) return;
            setSubmitted(true);
            if (Object.keys(errors).length || imageError) {
              const form = event.currentTarget;
              window.requestAnimationFrame(() =>
                form
                  .querySelector<HTMLInputElement | HTMLTextAreaElement>('[aria-invalid="true"]')
                  ?.focus(),
              );
              return;
            }
            save({ name: name.trim(), bio: bio.trim(), image }, onboarding);
          }}
        >
          <div className="profile-image-editor">
            <Avatar size={88} image={image} />
            <label
              className={`image-upload${imageError ? " has-error" : ""}`}
              htmlFor="profile-image"
            >
              <Icon name="camera" size={16} />
              アイコン画像を選ぶ
              <input
                id="profile-image"
                aria-label="アイコン画像"
                aria-invalid={!!imageError}
                aria-describedby={imageError ? "profile-image-error" : undefined}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  loadImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            {imageError && (
              <p id="profile-image-error" className="field-error" role="alert">
                {imageError}
              </p>
            )}
            <small>JPG・PNG・WebP / 5MBまで</small>
            {(image || imageError) && (
              <button
                className="text-button"
                type="button"
                disabled={reading}
                onClick={() => {
                  if (imageError) setImageError("");
                  else setImage(undefined);
                }}
              >
                {imageError ? "画像の選択を取り消す" : "画像を削除"}
              </button>
            )}
          </div>
          <label className="form-field" htmlFor="profile-name">
            <span>
              名前 <small>必須</small>
            </span>
            <input
              id="profile-name"
              aria-label="名前"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "profile-name-error" : undefined}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, name: true }))}
              maxLength={20}
              required
              autoComplete="nickname"
              placeholder="表示する名前"
            />
            {nameError && (
              <p id="profile-name-error" className="field-error" role="alert">
                {nameError}
              </p>
            )}
            <small>{name.length} / 20</small>
          </label>
          <label className="form-field" htmlFor="profile-bio">
            <span>自己紹介</span>
            <textarea
              id="profile-bio"
              aria-label="自己紹介"
              aria-invalid={!!bioError}
              aria-describedby={bioError ? "profile-bio-error" : undefined}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, bio: true }))}
              maxLength={120}
              placeholder="大切にしていること、話してみたいことなど"
            />
            {bioError && (
              <p id="profile-bio-error" className="field-error" role="alert">
                {bioError}
              </p>
            )}
            <small>{bio.length} / 120</small>
          </label>
          <button type="submit" className="primary full" disabled={reading}>
            {reading
              ? "画像を読み込み中…"
              : onboarding
                ? "プロフィールを設定してはじめる"
                : "変更を保存する"}
          </button>
        </form>
      </div>
    </main>
  );
}

function FlowMessage({
  title,
  heading,
  text,
  action,
  onAction,
  icon = "check",
  secondary,
}: {
  title: string;
  heading: string;
  text: string;
  action: string;
  onAction: () => void;
  icon?: IconName;
  secondary?: React.ReactNode;
}) {
  return (
    <main className="screen account-screen">
      <Header title={title} />
      <div className="account-content flow-message">
        <span className={`flow-icon ${icon === "mail" ? "lavender" : ""}`}>
          <Icon name={icon} size={32} />
        </span>

        <h2>{heading}</h2>
        <p>{text}</p>
        <button className="primary full" onClick={onAction}>
          {action}
          <Icon name="arrow" size={18} />
        </button>
        {secondary}
      </div>
    </main>
  );
}

export function AccountScreens({
  screen,
  go,
  profile,
  saveProfile,
  completeSession,
  endSession,
  session,
}: Props) {
  const [resent, setResent] = useState(false);
  if (screen === "signup")
    return (
      <main className="screen account-screen">
        <Header title="アカウント登録" onBack={() => go("welcome")} />
        <div className="account-content">
          <div className="account-title">
            <span className="account-symbol">
              <Icon name="message" size={28} />
            </span>
            <h2>
              違う考えと、
              <br />
              話すきっかけを。
            </h2>
            <p>今日の問いに答えて、あなたの言葉で参加しよう。まずは登録方法を選んでください。</p>
          </div>
          <div className="signup-methods">
            <button className="primary full" onClick={() => go("signup-email")}>
              <Icon name="mail" size={20} />
              メールアドレスで登録
            </button>
            <div className="account-divider">
              <span>または</span>
            </div>
            <button className="provider-button" onClick={() => go("signup-google")}>
              <span className="provider-mark">G</span>Googleで続ける
            </button>
          </div>
          <p className="account-login-link">
            アカウントをお持ちの方 <button onClick={() => go("login")}>ログイン</button>
          </p>
        </div>
      </main>
    );
  if (screen === "signup-google") {
    const provider = "Google";
    return (
      <main className="screen account-screen">
        <Header title={`${provider}で続ける`} onBack={() => go("signup")} />
        <div className="account-content">
          <div className="account-title">
            <span className="account-symbol">
              <Icon name="user" size={28} />
            </span>
            <h2>{provider}との連携</h2>
            <p>{provider}アカウントでミライログをはじめましょう。</p>
          </div>
          <div className="provider-preview">
            <Avatar size={48} />
            <div>
              <strong>{profile.name}</strong>
              <span>sora@example.com</span>
            </div>
          </div>
          <button className="primary full" onClick={() => go("signup-done")}>
            {provider}で続ける
            <Icon name="arrow" size={18} />
          </button>
          <button className="text-button full" onClick={() => go("signup")}>
            別の登録方法を選ぶ
          </button>
        </div>
      </main>
    );
  }
  const credentialModes: Partial<Record<AccountScreen, Parameters<typeof Credentials>[0]["mode"]>> =
    {
      "signup-email": "signup",
      login: "login",
      "change-email": "email",
      "change-password": "password",
      "reset-password": "reset",
      "reset-request": "request",
    };
  const mode = credentialModes[screen];
  if (mode) return <Credentials mode={mode} go={go} />;
  if (screen === "signup-verify" || screen === "email-sent" || screen === "reset-sent") {
    const next =
      screen === "signup-verify"
        ? "signup-done"
        : screen === "email-sent"
          ? "email-done"
          : "reset-password";
    return (
      <FlowMessage
        title="メールの確認"
        heading="確認メールを送信しました"
        text="メール内のリンクを開いて、確認を完了してください。"
        icon="mail"
        action={screen === "reset-sent" ? "再設定リンクを開く" : "メールを確認する"}
        onAction={() => go(next)}
        secondary={
          <>
            <button className="text-button full" onClick={() => setResent(true)}>
              {resent ? "再送しました" : "確認メールを再送する"}
            </button>
            {resent && (
              <p className="resend-note" role="status">
                確認メールを再送しました。
              </p>
            )}
            <button
              className="text-button full"
              onClick={() =>
                go(
                  screen === "signup-verify"
                    ? "signup-email"
                    : screen === "email-sent"
                      ? "change-email"
                      : "reset-request",
                )
              }
            >
              メールアドレスを入力し直す
            </button>
          </>
        }
      />
    );
  }
  if (screen === "signup-done")
    return (
      <FlowMessage
        title="登録完了"
        heading="ミライログへようこそ。"
        text="まずは診断で、今の自分の考え方を振り返ってみましょう。"
        action="診断をはじめる"
        onAction={() => {
          completeSession();
          go("diagnosis");
        }}
      />
    );
  if (screen === "login-done")
    return (
      <FlowMessage
        title="ログイン完了"
        heading="おかえりなさい。"
        text="今日の問いから、みんなの考えに触れてみましょう。"
        action="ホームへ"
        onAction={() => {
          completeSession();
          go("home");
        }}
      />
    );
  if (screen === "email-done" || screen === "password-done" || screen === "reset-done")
    return (
      <FlowMessage
        title="変更完了"
        heading={
          screen === "email-done" ? "メールアドレスを変更しました" : "パスワードを変更しました"
        }
        text="変更が完了しました。引き続きミライログをお楽しみください。"
        action={screen === "reset-done" ? "ログインへ" : "アカウント設定へ"}
        onAction={() => go(screen === "reset-done" ? "login" : "settings")}
      />
    );
  if (screen === "edit-profile" || screen === "signup-profile")
    return (
      <ProfileEditor
        profile={profile}
        onboarding={screen === "signup-profile"}
        save={saveProfile}
        back={() => go(screen === "signup-profile" ? "result" : "profile")}
      />
    );
  if (screen === "settings")
    return (
      <main className="screen account-screen">
        <Header title="アカウント設定" onBack={() => go("profile")} />
        <div className="account-content">
          <div className="settings-profile">
            <Avatar size={54} image={profile.image} />
            <div>
              <strong>{profile.name}</strong>
              <small>{session ? "ログイン中" : "ゲストで利用中"}</small>
            </div>
          </div>
          <h2 className="settings-section-title">プロフィール</h2>
          <div className="settings-list">
            <button onClick={() => go("edit-profile")}>
              <Icon name="user" />
              <div>
                <strong>プロフィール編集</strong>
                <small>名前・アイコン画像・自己紹介</small>
              </div>
              <Icon name="arrow" size={17} />
            </button>
          </div>
          <h2 className="settings-section-title">ログイン情報</h2>
          <div className="settings-list">
            <button onClick={() => go("change-email")}>
              <Icon name="mail" />
              <div>
                <strong>メールアドレス変更</strong>
                <small>sora@example.com</small>
              </div>
              <Icon name="arrow" size={17} />
            </button>
            <button onClick={() => go("change-password")}>
              <Icon name="key" />
              <div>
                <strong>パスワード変更</strong>
                <small>現在と新しいパスワードを入力</small>
              </div>
              <Icon name="arrow" size={17} />
            </button>
          </div>
          <h2 className="settings-section-title">その他</h2>
          <div className="settings-list">
            <button onClick={() => go("logout")}>
              <Icon name="back" />
              <div>
                <strong>ログアウト</strong>
              </div>
              <Icon name="arrow" size={17} />
            </button>
            <button className="danger-text" onClick={() => go("delete-account")}>
              <Icon name="user" />
              <div>
                <strong>アカウント削除</strong>
                <small>アカウントの削除手続き</small>
              </div>
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>
      </main>
    );
  if (screen === "logout" || screen === "delete-account") {
    const deleting = screen === "delete-account";
    return (
      <main className="screen account-screen">
        <Header
          title={deleting ? "アカウント削除の確認" : "ログアウトの確認"}
          onBack={() => go("settings")}
        />
        <div className="account-content">
          <div className="account-title">
            <span className="account-symbol">
              <Icon name="user" size={28} />
            </span>
            <h2>{deleting ? "アカウントを削除しますか？" : "ログアウトしますか？"}</h2>
            <p>
              {deleting
                ? "プロフィール・投稿・回答を初期状態に戻します。この操作は取り消せません。"
                : "ログアウトして、はじめの画面に戻ります。"}
            </p>
          </div>
          <button
            className={`primary full ${deleting ? "danger-button" : ""}`}
            onClick={() => {
              endSession(deleting);
              go(deleting ? "deleted" : "welcome");
            }}
          >
            {deleting ? "アカウントを削除する" : "ログアウトする"}
          </button>
          <button className="secondary full account-cancel" onClick={() => go("settings")}>
            キャンセル
          </button>
        </div>
      </main>
    );
  }
  return (
    <FlowMessage
      title="アカウント削除完了"
      heading="また、話したくなったら。"
      text="アカウントの削除が完了しました。ご利用ありがとうございました。"
      action="はじめの画面へ"
      onAction={() => go("welcome")}
    />
  );
}
