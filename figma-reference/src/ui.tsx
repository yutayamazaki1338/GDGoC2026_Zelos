export type IconName =
  | "home"
  | "spark"
  | "plus"
  | "user"
  | "bell"
  | "search"
  | "heart"
  | "message"
  | "arrow"
  | "back"
  | "close"
  | "share"
  | "lock"
  | "check"
  | "more"
  | "archive"
  | "settings"
  | "mail"
  | "camera"
  | "key"
  | "chevron";

export function Icon({
  name,
  size = 21,
  filled = false,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="M3 10.8 12 3l9 7.8" />
        <path d="M5 9.8V21h14V9.8M9 21v-7h6v7" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 1.5 5.2L19 9l-5.5 1.8L12 16l-1.5-5.2L5 9l5.5-1.8L12 2Z" />
        <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />,
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.7 10.7 6.6-4.2M8.7 13.3l6.6 4.2" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    settings: (
      <>
        <path d="M10 3h4l.6 2.4 1.7 1 2.4-.7 2 3.5-1.8 1.7v2l1.8 1.7-2 3.5-2.4-.7-1.7 1L14 21h-4l-.6-2.6-1.7-1-2.4.7-2-3.5 1.8-1.7v-2L3.3 9.2l2-3.5 2.4.7 1.7-1L10 3Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    camera: (
      <>
        <path d="M3 7h4l2-3h6l2 3h4v14H3Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="9" r="5" />
        <path d="m12 13 8 8m-4-4 3-3m-6 0 3-3" />
      </>
    ),
    archive: (
      <>
        <rect x="3" y="4" width="18" height="5" rx="1.5" />
        <path d="M5 9v11h14V9M10 13h4" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Avatar({
  color = "#8B7CF6",
  size = 42,
  image,
  flat = false,
}: {
  color?: string;
  size?: number;
  image?: string;
  flat?: boolean;
}) {
  return (
    <div
      className={`avatar${flat ? " avatar-flat" : ""}`}
      style={{ background: color, width: size, height: size }}
    >
      {image ? (
        <img src={image} alt="" className="avatar-image" />
      ) : (
        <>
          <span />
          <span />
        </>
      )}
    </div>
  );
}

export function Header({
  title,
  onBack,
  onClose,
  actions,
  hideTitle = false,
}: {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  actions?: React.ReactNode;
  hideTitle?: boolean;
}) {
  return (
    <header className="topbar" aria-label={hideTitle ? title : undefined}>
      <div className="header-side">
        {onClose ? (
          <button className="icon-btn" onClick={onClose} aria-label="閉じる">
            <Icon name="close" />
          </button>
        ) : (
          onBack && (
            <button className="icon-btn" onClick={onBack} aria-label="戻る">
              <Icon name="back" />
            </button>
          )
        )}
      </div>
      {hideTitle ? <span aria-hidden="true" /> : <h1>{title}</h1>}
      <div className="header-side right">{actions}</div>
    </header>
  );
}

export function Pill({
  children,
  color = "lavender",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return <span className={`pill ${color}`}>{children}</span>;
}
