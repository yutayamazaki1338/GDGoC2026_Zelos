import { Avatar, Header, Icon, Pill } from "./ui";
import type { IconName } from "./ui";
import { compareDiagnoses, latestDiagnosisPair, makeDiagnosisRecord } from "./diagnosis";
import type { DiagnosisRecord, DiagnosisResult } from "./diagnosis";
import {
  Diagnosis,
  Result,
  ResultContent,
  BalanceBars,
  ConcreteScores,
  diagnosisNotice,
} from "./DiagnosisScreens";
import { styleAxes } from "./diagnosis-types";
import { AccountScreens, initialProfile } from "./AccountScreens";
import type { AccountScreen, DemoProfile } from "./AccountScreens";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDays,
  buildCommentThreads,
  diagnosisTypes,
  filterPosts,
  myType,
  pollResults,
  seedAnswers,
  seedPosts,
  toggleCommentLike,
} from "./discussion";
import type { Comment as DiscussionComment, DiscussionDay, Post } from "./discussion";

type Screen =
  | "welcome"
  | "diagnosis"
  | "result"
  | "home"
  | "diagnostics"
  | "archive"
  | "compose"
  | "detail"
  | "profile"
  | AccountScreen;

type DiagnosticsTab = "current" | "comparison";

function BottomNav({ current, go }: { current: Screen; go: (s: Screen) => void }) {
  const items: [Screen, IconName, string][] = [
    ["home", "home", "ホーム"],
    ["diagnostics", "spark", "診断"],
    ["archive", "archive", "アーカイブ"],
    ["profile", "user", "マイページ"],
  ];
  return (
    <nav className="bottom-nav">
      {items.map(([screen, icon, label]) => (
        <button
          key={screen}
          className={current === screen ? "active" : ""}
          aria-current={current === screen ? "page" : undefined}
          onClick={() => go(screen)}
        >
          <Icon name={icon} />
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}

function Welcome({
  start,
  browse,
  login,
}: {
  start: () => void;
  browse: () => void;
  login: () => void;
}) {
  return (
    <main className="screen welcome">
      <div className="welcome-brand">
        <span className="logo-mark">
          <Icon name="spark" size={20} />
        </span>
        ミライログ
      </div>
      <div className="bubble-field" aria-hidden="true">
        <div className="person p1">
          <Avatar color="#8B7CF6" size={48} />
        </div>
        <div className="person p2">
          <Avatar color="#67CDB9" size={44} />
        </div>
        <div className="person p3">
          <Avatar color="#FF8F86" size={42} />
        </div>
        <div className="chat c1">
          結婚しても
          <br />
          一人の時間は大切
        </div>
        <div className="chat c2">
          結婚しない
          <br />
          選択もあるよね
        </div>
        <div className="chat c3">
          家事やお金、
          <br />
          どう分担してる？
        </div>
        <div className="chat c4">まだ決めなくてもいい？</div>
        <div className="orbit o1" />
        <div className="orbit o2" />
      </div>
      <section className="welcome-copy">
        <Pill>あなたの言葉で、結婚観を話そう</Pill>
        <h1>
          結婚する、しない。
          <br />
          <em>違う考え</em>と話してみよう。
        </h1>
        <p>
          したい人も、しない人も、迷っている人も、結婚している人も。出会い探しではなく、結婚をめぐる考えや経験を語り合う場所です。
        </p>
      </section>
      <div className="welcome-actions">
        <button className="primary" onClick={start}>
          アカウントを作成する <Icon name="arrow" />
        </button>
        <button className="secondary" onClick={login}>
          ログイン
        </button>
        <button className="text-button" onClick={browse}>
          みんなの投稿を見る
        </button>
      </div>
    </main>
  );
}

function TypeTag({ type, own = false }: { type: string; own?: boolean }) {
  const color = diagnosisTypes.find((t) => t.name === type)?.color || "#8B7CF6";
  return (
    <span className="type-tag" style={{ "--type-color": color } as React.CSSProperties}>
      <i />
      {type}
      {own && <b>あなたのタイプ</b>}
    </span>
  );
}

function PostCard({
  post,
  day,
  onOpen,
  onLike,
  flatAvatar = false,
}: {
  post: Post;
  day?: DiscussionDay;
  onOpen: () => void;
  onLike: () => void;
  flatAvatar?: boolean;
}) {
  return (
    <article className="post-card">
      {day && (
        <div className="post-topic">
          <span>{day.shortDate}</span>
          {day.question.q}
        </div>
      )}
      <div className="post-head">
        <Avatar color={post.color} image={post.image} flat={flatAvatar} />
        <div className="post-person">
          <strong>
            {post.name}
            {post.own && <small>あなた</small>}
          </strong>
          <div>
            <TypeTag type={post.type} own={post.own} />
            <small>{post.time}</small>
          </div>
        </div>
      </div>
      {post.poll && (
        <div className="choice-tag">
          <span>選んだ回答</span>
          <strong>{post.poll}</strong>
        </div>
      )}
      <button className="post-body" onClick={onOpen} aria-label={`${post.name}の投稿を開く`}>
        <span className="post-text">{post.text}</span>
      </button>
      <div className="tags">
        {post.tags.map((t) => (
          <span key={t}>#{t}</span>
        ))}
      </div>
      <div className="post-actions">
        <button
          className={post.liked ? "liked" : ""}
          onClick={onLike}
          aria-label="共感"
          aria-pressed={!!post.liked}
        >
          <Icon name="heart" filled={post.liked} />
          {post.likes}
        </button>
        <button onClick={onOpen} aria-label="コメントを見る">
          <Icon name="message" />
          {post.comments}
        </button>
      </div>
    </article>
  );
}

type FeedProps = {
  posts: Post[];
  days: DiscussionDay[];
  openPost: (id: number) => void;
  togglePost: (id: number) => void;
};

function Feed({
  posts,
  days,
  openPost,
  togglePost,
  showTopic = false,
}: FeedProps & { showTopic?: boolean }) {
  return (
    <div className="feed">
      {posts.length ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            day={showTopic ? days.find((d) => d.id === post.dayId) : undefined}
            onOpen={() => openPost(post.id)}
            onLike={() => togglePost(post.id)}
            flatAvatar
          />
        ))
      ) : (
        <section className="feed-empty">
          <Icon name="message" size={28} />
          <h3>まだ投稿がありません</h3>
          <p>異なる考えも尊重しながら、あなたの言葉で。</p>
        </section>
      )}
    </div>
  );
}

function TodayCard({
  day,
  answer,
  onAnswer,
  collapsed,
  onToggle,
}: {
  day: DiscussionDay;
  answer?: string;
  onAnswer: (choice: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [selected, setSelected] = useState("");
  const results = answer ? pollResults(day, answer) : null;
  return (
    <section
      className={`today-card ${answer ? "answered" : ""} ${collapsed ? "is-collapsed" : ""}`}
      aria-labelledby="today-question"
    >
      <div className="today-card-top">
        <span>
          <Icon name="spark" size={16} /> 今日の問い
        </span>
        <div className="card-heading-actions">
          <small>{day.date}</small>
          <button
            className="card-toggle"
            aria-expanded={!collapsed}
            aria-controls="today-card-content"
            aria-label={collapsed ? "今日の問いを開く" : "今日の問いを折りたたむ"}
            onClick={onToggle}
          >
            <span>{collapsed ? "開く" : "閉じる"}</span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </div>
      <h2 id="today-question">{day.question.q}</h2>
      <div id="today-card-content" hidden={collapsed}>
        {results ? (
          <div className="inline-results" aria-live="polite">
            <div className="answered-label">
              <Icon name="check" size={15} /> 回答しました{" "}
              <span>{results.total.toLocaleString()}人が回答</span>
            </div>
            {day.question.choices.map((choice, i) => (
              <div className={`inline-poll ${answer === choice ? "mine" : ""}`} key={choice}>
                <div>
                  <span>
                    {choice}
                    {answer === choice && <b>あなた</b>}
                  </span>
                  <strong>
                    {results.values[i]}
                    <small>%</small>
                  </strong>
                </div>
                <div className="inline-bar">
                  <i style={{ width: `${results.values[i]}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="today-choices">
              {day.question.choices.map((choice, i) => (
                <button
                  key={choice}
                  aria-pressed={selected === choice}
                  className={selected === choice ? "selected" : ""}
                  onClick={() => setSelected(choice)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {choice}
                  {selected === choice && <Icon name="check" size={17} />}
                </button>
              ))}
            </div>
            <button
              className="primary full"
              disabled={!selected}
              onClick={() => onAnswer(selected)}
            >
              回答して、みんなの声を見る <Icon name="arrow" size={18} />
            </button>
            <p className="today-privacy">
              <Icon name="lock" size={12} /> 回答率は回答後に表示。回答だけでは公開されません
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Home({
  posts,
  days,
  answer,
  onAnswer,
  compose,
  openPost,
  togglePost,
  collapsed,
  onToggle,
  selectedType,
  onSelectType,
  userType,
  tab,
  setTab,
}: FeedProps & {
  answer?: string;
  onAnswer: (choice: string) => void;
  compose: () => void;
  collapsed: boolean;
  onToggle: () => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  userType: string;
  tab: string;
  setTab: (tab: string) => void;
}) {
  const today = days[0];
  const typeFilterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = typeFilterRef.current;
    const active = row?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (!row || !active) return;
    const bounds = row.getBoundingClientRect();
    const selected = active.getBoundingClientRect();
    row.scrollLeft += selected.left - bounds.left - (row.clientWidth - selected.width) / 2;
  }, [selectedType, answer, userType]);
  const visible = filterPosts(posts, {
    dayId: today.id,
    liked: tab === "共感した投稿",
    popular: tab === "人気",
    type: selectedType,
  });
  return (
    <main className="screen app-screen home-screen">
      <header className="brand-header">
        <div className="brand">
          <span className="logo-mark">
            <Icon name="spark" size={17} />
          </span>
          ミライログ
        </div>
      </header>
      <div className="home-content">
        <TodayCard
          key={today.id}
          day={today}
          answer={answer}
          onAnswer={onAnswer}
          collapsed={collapsed}
          onToggle={onToggle}
        />
        <div className="discussion-heading">
          <div>
            <small>TODAY'S TALK</small>
            <h2>今日の問いを、みんなと。</h2>
          </div>
        </div>
        {answer ? (
          <>
            <div className="feed-tabs">
              {["みんなの声", "人気", "共感した投稿"].map((t) => (
                <button
                  key={t}
                  aria-pressed={tab === t}
                  className={tab === t ? "active" : ""}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="home-type-filters" role="group" aria-label="診断タイプで絞り込み">
              <div className="home-filter-heading">
                <span>{selectedType ? `診断タイプ：${selectedType}` : "診断タイプで絞り込み"}</span>
              </div>
              <div className="home-type-options" ref={typeFilterRef}>
                {diagnosisTypes.map((type) => (
                  <button
                    key={type.name}
                    className={selectedType === type.name ? "active" : ""}
                    aria-pressed={selectedType === type.name}
                    aria-label={`${type.name}の投稿を表示${type.name === userType ? "（あなたのタイプ）" : ""}`}
                    onClick={() => onSelectType(selectedType === type.name ? "" : type.name)}
                  >
                    <TypeTag type={type.name} own={type.name === userType} />
                  </button>
                ))}
              </div>
            </div>
            <Feed posts={visible} days={days} openPost={openPost} togglePost={togglePost} />
          </>
        ) : (
          <section className="locked-discussion" aria-label="回答前の投稿プレビュー">
            <div className="locked-feed-preview" inert aria-hidden="true">
              <Feed
                posts={filterPosts(posts, { dayId: today.id })}
                days={days}
                openPost={openPost}
                togglePost={togglePost}
              />
            </div>
            <div className="locked-feed-prompt">
              <span>
                <Icon name="lock" size={23} />
              </span>
              <h3>あなたの回答から、対話がはじまる。</h3>
              <p>
                今日の問いに答えると、
                <br />
                みんなの投稿を読んで話し合えます。
              </p>
            </div>
          </section>
        )}
      </div>
      <button className="compose-fab" aria-label="今日の問いについて投稿する" onClick={compose}>
        <Icon name="plus" size={26} />
        <span>投稿する</span>
      </button>
    </main>
  );
}

function DiagnosticsHub({
  records,
  start,
  tab,
  setTab,
  community,
}: {
  records: DiagnosisRecord[];
  start: () => void;
  tab: DiagnosticsTab;
  setTab: (tab: DiagnosticsTab) => void;
  community: () => void;
}) {
  const record = records[records.length - 1];
  const tabs = [
    { id: "current", label: "あなたの診断" },
    { id: "comparison", label: "過去の自分との比較" },
  ] as const;
  const selectTab = (next: DiagnosticsTab) => {
    setTab(next);
    window.scrollTo(0, 0);
  };
  return (
    <main className="screen app-screen diagnostics-screen">
      <Header title="診断" />
      <nav className="diagnostics-tabs" role="tablist" aria-label="診断メニュー">
        {tabs.map((item, index) => (
          <button
            key={item.id}
            id={`diagnostics-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`diagnostics-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            className={tab === item.id ? "active" : ""}
            onClick={() => selectTab(item.id)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? tabs[0]
                  : event.key === "End"
                    ? tabs[1]
                    : tabs[(index + 1) % tabs.length];
              selectTab(next.id);
              document.getElementById(`diagnostics-tab-${next.id}`)?.focus();
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div
        id="diagnostics-panel-current"
        role="tabpanel"
        aria-labelledby="diagnostics-tab-current"
        hidden={tab !== "current"}
      >
        <div className="content diagnostics-content">
          {record ? (
            <>
              <div className="life-record-date">
                {new Date(record.createdAt).toLocaleDateString("ja-JP")} の回答
              </div>
              <ResultContent
                result={record}
                previous={records.length >= 2 ? records[records.length - 2] : undefined}
                home={community}
              />
              <button className="secondary full" onClick={start}>
                もう一度診断する
              </button>
            </>
          ) : (
            <section className="life-start">
              <span className="life-start-symbol">
                <Icon name="spark" size={32} />
              </span>
              <small>LIFE DESIGN STYLE</small>
              <h2>
                これからの自分を、
                <br />
                今の自分から知ってみる。
              </h2>
              <p>
                未来を先に描く？ 経験から探す？
                <br />
                あなたらしい考え方を、20の問いで振り返ります。
              </p>
              <div className="life-start-parts">
                <div>
                  <b>01</b>
                  <span>
                    考え方のスタイル<small>左右の考え方を比較・12問</small>
                  </span>
                </div>
                <div>
                  <b>02</b>
                  <span>
                    将来像の具体化状況<small>文章への当てはまり・8問</small>
                  </span>
                </div>
              </div>
              <button className="primary full" onClick={start}>
                診断をはじめる
                <Icon name="arrow" size={18} />
              </button>
              <p className="life-start-meta">全20問・5段階回答 / 正解・不正解はありません</p>
              <p className="life-notice">{diagnosisNotice}</p>
            </section>
          )}
          <details className="diagnostic-type-details">
            <summary>
              診断タイプ一覧を見る
              <Icon name="chevron" size={18} />
            </summary>
            <div className="diagnostic-type-details-body">
              <div className="type-library-intro">
                <h2>大切にすることは、人それぞれ。</h2>
                <p>
                  4つの軸から、今の回答傾向を表しています。
                  <br />
                  どのタイプにも優劣はありません。
                </p>
              </div>
              <div className="diagnostic-type-library">
                {diagnosisTypes.map((type) => (
                  <article
                    key={type.name}
                    className="diagnostic-type-card"
                    style={{ "--type-color": type.color } as React.CSSProperties}
                  >
                    <TypeTag type={type.name} own={type.name === record?.type} />
                    <h3>{type.code}</h3>
                    <p>{type.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
      <div
        id="diagnostics-panel-comparison"
        role="tabpanel"
        aria-labelledby="diagnostics-tab-comparison"
        hidden={tab !== "comparison"}
      >
        <DiagnosisComparison records={records} startDiagnosis={start} />
      </div>
    </main>
  );
}

function Archive({
  posts,
  days,
  answers,
  openPost,
  togglePost,
  collapsedDays,
  toggleDay,
}: FeedProps & {
  answers: Record<string, string>;
  collapsedDays: Record<string, boolean>;
  toggleDay: (id: string) => void;
}) {
  const [dayId, setDayId] = useState(days[1].id);
  const [tab, setTab] = useState("人気");
  const pastDays = days.slice(1);
  const day = pastDays.find((d) => d.id === dayId) || pastDays[0];
  const daysRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = daysRef.current;
    const active = row?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (!row || !active) return;
    const bounds = row.getBoundingClientRect();
    const selected = active.getBoundingClientRect();
    row.scrollLeft += selected.left - bounds.left - (row.clientWidth - selected.width) / 2;
  }, [day.id]);
  const collapsed = !!collapsedDays[day.id];
  const visible = filterPosts(posts, {
    dayId: day.id,
    mine: tab === "自分の投稿",
    liked: tab === "共感した投稿",
    popular: tab === "人気",
  });
  return (
    <main className="screen app-screen archive-screen">
      <Header title="アーカイブ" />
      <div className="archive-days" aria-label="過去1週間の日付" ref={daysRef}>
        {pastDays.map((d, i) => (
          <button
            key={d.id}
            aria-pressed={day.id === d.id}
            className={day.id === d.id ? "active" : ""}
            onClick={() => setDayId(d.id)}
          >
            <small>{i === 0 ? "昨日" : d.date.slice(-2, -1)}</small>
            <strong>{d.shortDate}</strong>
            <i className={answers[d.id] ? "has-answer" : ""}>
              {answers[d.id] ? <Icon name="check" size={11} /> : "–"}
            </i>
          </button>
        ))}
      </div>
      <section
        className={`archive-question ${collapsed ? "is-collapsed" : ""}`}
        aria-labelledby="archive-question-title"
      >
        <div className="question-card-heading">
          <span>{day.date}</span>
          <button
            className="card-toggle"
            aria-expanded={!collapsed}
            aria-controls="archive-card-content"
            aria-label={collapsed ? "過去の問いを開く" : "過去の問いを折りたたむ"}
            onClick={() => toggleDay(day.id)}
          >
            <span>{collapsed ? "開く" : "閉じる"}</span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
        <Pill>#{day.question.tag}</Pill>
        <h2 id="archive-question-title">{day.question.q}</h2>
        <div id="archive-card-content" hidden={collapsed}>
          <PollBreakdown day={day} answer={answers[day.id]} />
        </div>
      </section>
      <div className="archive-tabs feed-tabs">
        {["自分の投稿", "人気", "共感した投稿"].map((t) => (
          <button
            key={t}
            aria-pressed={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <Feed posts={visible} days={days} openPost={openPost} togglePost={togglePost} />
    </main>
  );
}

function Compose({
  back,
  publish,
  day,
  answer,
  profile,
  userType,
}: {
  back: () => void;
  publish: (text: string, tags: string[]) => void;
  day: DiscussionDay;
  answer: string;
  profile: DemoProfile;
  userType: string;
}) {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([day.question.tag]);
  const submit = () => {
    if (text.trim()) publish(text.trim(), tags);
  };
  const tagOptions = [
    ...new Set([day.question.tag, "結婚観", "経験をシェア", "違う意見も聞きたい", "まだ考え中"]),
  ];
  return (
    <main className="screen compose-screen">
      <Header
        title="今日の問いに投稿"
        onBack={back}
        actions={
          <button className="post-submit" disabled={!text.trim()} onClick={submit}>
            投稿
          </button>
        }
      />
      <div className="content">
        <div className="composer-profile">
          <Avatar image={profile.image} />
          <div>
            <strong>{profile.name}</strong>
            <span>このプロフィールで、みんなに公開されます</span>
          </div>
        </div>
        <div className="attached compose-question">
          <div>
            <small>{day.date} の問い</small>
            <strong>{day.question.q}</strong>
            <span>あなたの回答：{answer}</span>
          </div>
        </div>
        <TypeTag type={userType} own />
        <textarea
          aria-label="投稿内容"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="その選択をした理由や経験を、あなたの言葉で。違う立場の人に聞いてみたいことも。"
          maxLength={240}
        />
        <div className="count">{text.length} / 240</div>
        <h3 className="field-title">ハッシュタグ</h3>
        <div className="hashtag-options">
          {tagOptions.map((t) => (
            <button
              key={t}
              className={tags.includes(t) ? "active" : ""}
              aria-pressed={tags.includes(t)}
              onClick={() =>
                setTags(tags.includes(t) ? tags.filter((tag) => tag !== t) : [...tags, t])
              }
            >
              #{t}
            </button>
          ))}
        </div>
        <div className="safe-note">
          <Icon name="message" size={17} />
          <p>
            結婚や出産の選択を決めつけず、相手を尊重して話しましょう。出会いの募集や、個人を特定できる情報の投稿は控えてください。
          </p>
        </div>
        <button className="primary full desktop-submit" disabled={!text.trim()} onClick={submit}>
          投稿する
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </main>
  );
}

function Detail({
  post,
  day,
  back,
  updatePost,
  profile,
}: {
  post: Post;
  day?: DiscussionDay;
  back: () => void;
  updatePost: (post: Post) => void;
  profile: DemoProfile;
}) {
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<DiscussionComment["replyTo"]>();
  const comments: DiscussionComment[] = post.replies || [
    {
      id: 1,
      name: "まる",
      text: "自分とは立場が違うけど、何を大切にしているか知れてよかった。",
      color: "#67CDB9",
      likes: 4,
    },
    {
      id: 2,
      name: "きい",
      text: "私は結婚してから考えが変わったこともある。途中で見直せてもいいよね。",
      color: "#FF8F86",
      likes: 2,
    },
    {
      id: 3,
      name: "つむぎ",
      text: "結婚しないと考えている私も、支え合う関係について話してみたい。",
      color: "#8B7CF6",
      likes: 1,
    },
  ];
  const threads = buildCommentThreads(comments);
  const send = () => {
    if (!comment.trim()) return;
    updatePost({
      ...post,
      replies: [
        {
          id: Math.max(Date.now(), ...comments.map((item) => item.id)) + 1,
          name: profile.name,
          image: profile.image,
          own: true,
          text: comment.trim(),
          color: "#8B7CF6",
          likes: 0,
          replyTo,
        },
        ...comments,
      ],
      comments: post.comments + 1,
    });
    setComment("");
    setReplyTo(undefined);
  };
  const renderComment = (item: DiscussionComment, nested = false, rootId?: number) => {
    const parent = item.replyTo
      ? comments.find((candidate) => candidate.id === item.replyTo!.id)
      : undefined;
    const parentName = parent?.name || item.replyTo?.name;
    return (
      <article
        key={item.id}
        className={`comment-card${nested ? " nested-comment" : ""}`}
        data-comment-id={item.id}
      >
        <Avatar color={item.color} image={item.image} size={nested ? 28 : 36} />
        <div className="comment-body">
          <strong>{item.name}</strong>
          {item.own && <span className="comment-own-label">あなた</span>}
          {item.replyTo && (
            <div className="comment-reply-to">
              <Icon name="back" size={13} />
              {parentName}さんへの返信
            </div>
          )}
          {item.replyTo && item.replyTo.id !== rootId && (parent?.text || item.replyTo.text) && (
            <blockquote className="comment-parent-quote">
              {parent?.text || item.replyTo.text}
            </blockquote>
          )}
          <p className="comment-text">{item.text}</p>
          <div className="comment-actions">
            <button
              type="button"
              className={item.liked ? "liked" : ""}
              aria-label={`${item.name}のコメントにいいね`}
              aria-pressed={!!item.liked}
              onClick={() =>
                updatePost({
                  ...post,
                  replies: comments.map((candidate) =>
                    candidate.id === item.id ? toggleCommentLike(candidate) : candidate,
                  ),
                })
              }
            >
              <Icon name="heart" size={18} filled={item.liked} />
              <span>{item.likes ?? (item.liked ? 1 : 0)}</span>
            </button>
            <button
              type="button"
              aria-label={`${item.name}のコメントに返信`}
              onClick={() => {
                setReplyTo({ id: item.id, name: item.name, text: item.text });
                document.getElementById("comment-input")?.focus();
              }}
            >
              <Icon name="message" size={18} />
              <span>返信する</span>
            </button>
          </div>
        </div>
      </article>
    );
  };
  return (
    <main className={`screen detail-screen ${replyTo ? "is-replying" : ""}`}>
      <Header title="問いについての対話" onBack={back} />
      <div className="content">
        <PostCard
          post={post}
          day={day}
          onOpen={() => {
            setReplyTo(undefined);
            document.getElementById("comment-input")?.focus();
          }}
          onLike={() =>
            updatePost({ ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) })
          }
        />
        <div className="comments-head">
          <h3>コメント</h3>
          <small>新しい順</small>
        </div>
        <div className="comments">
          {threads.map((thread) => (
            <section
              className="comment-thread"
              key={thread.root.id}
              data-thread-id={thread.root.id}
              aria-label={`${thread.root.name}のコメントと返信`}
            >
              {renderComment(thread.root)}
              {thread.replies.length > 0 && (
                <div className="comment-replies" aria-label="このコメントへの返信">
                  {thread.replies.map((item) => renderComment(item, true, thread.root.id))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
      <div className="comment-box">
        {replyTo && (
          <div className="reply-context">
            <div>
              <strong>{replyTo.name}さんに返信中</strong>
              <p>{replyTo.text}</p>
            </div>
            <button
              type="button"
              aria-label="返信をキャンセル"
              onClick={() => setReplyTo(undefined)}
            >
              キャンセル
            </button>
          </div>
        )}
        <Avatar size={32} image={profile.image} />
        <input
          id="comment-input"
          aria-label="コメント"
          maxLength={240}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && !event.nativeEvent.isComposing && send()}
          placeholder={
            replyTo ? `${replyTo.name}さんへの返信を入力` : "違いを尊重して、考えを伝えよう"
          }
        />
        <button aria-label="コメントを送信" disabled={!comment.trim()} onClick={send}>
          <Icon name="arrow" />
        </button>
      </div>
    </main>
  );
}

function Profile({
  posts,
  days,
  openPost,
  togglePost,
  profile,
  edit,
  settings,
}: FeedProps & {
  profile: DemoProfile;
  edit: () => void;
  settings: () => void;
}) {
  const ownPosts = filterPosts(posts, { mine: true });
  return (
    <main className="screen app-screen profile-screen">
      <Header
        title="マイページ"
        actions={
          <button
            className="icon-btn profile-settings-button"
            aria-label="アカウント設定"
            title="アカウント設定"
            onClick={settings}
          >
            <Icon name="settings" size={22} />
          </button>
        }
      />
      <div className="content">
        <section className="profile-head">
          <Avatar size={64} image={profile.image} />
          <div>
            <h2>{profile.name}</h2>
            <p>{profile.bio || "自己紹介はまだありません。"}</p>
          </div>
          <button onClick={edit}>編集</button>
        </section>
        <div className="profile-posts-heading">
          <h2>自分の投稿</h2>
        </div>
        <div className="own-feed">
          <Feed
            posts={ownPosts}
            days={days}
            openPost={openPost}
            togglePost={togglePost}
            showTopic
          />
        </div>
      </div>
    </main>
  );
}

function DiagnosisComparison({
  records,
  startDiagnosis,
}: {
  records: DiagnosisRecord[];
  startDiagnosis: () => void;
}) {
  const pair = latestDiagnosisPair(records);
  if (!pair)
    return (
      <div className="content comparison-empty">
        <h2>2回分の診断で、変化を見つめよう。</h2>
        <p>もう一度診断すると、前回と今回の結果を比較できます。</p>
        <button className="primary full" onClick={startDiagnosis}>
          診断する
          <Icon name="arrow" size={18} />
        </button>
      </div>
    );
  const { before, after } = pair;
  const changes = compareDiagnoses(before, after);
  const changedAxis = changes.changedAxis;
  const delta = changedAxis === null ? 0 : changes.deltas[changedAxis];
  const dateLabel = (record: DiagnosisRecord) =>
    new Date(record.createdAt).toLocaleString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <div className="content diagnosis-history">
      <div className="diagnosis-comparison-dates" aria-label="比較している診断の日時">
        <div>
          <span>前回</span>
          <time dateTime={before.createdAt}>{dateLabel(before)}</time>
        </div>
        <Icon name="arrow" size={18} />
        <div>
          <span>今回</span>
          <time dateTime={after.createdAt}>{dateLabel(after)}</time>
        </div>
      </div>
      <section className="card compare-card">
        <div className="comparison-type-pair">
          <div>
            <small>前回</small>
            <strong>{before.type}</strong>
          </div>
          <Icon name="arrow" size={16} />
          <div>
            <small>今回</small>
            <strong>{after.type}</strong>
          </div>
        </div>
        <h3 className="life-comparison-title">4軸のバランスの変化</h3>
        <BalanceBars result={after} previous={before} />
      </section>
      <ConcreteScores result={after} previous={before} />
      <section className="change-message">
        <span>
          <Icon name="spark" />
        </span>
        <div>
          <small>直近2回の診断の変化</small>
          <h3>
            {changedAxis === null
              ? "4つの軸のスコアは、どちらの診断も同じでした。"
              : `「${styleAxes[changedAxis].left} / ${styleAxes[changedAxis].right}」が${Math.abs(delta)}ポイント、${delta > 0 ? styleAxes[changedAxis].left : styleAxes[changedAxis].right}側へ変化しています。`}
          </h3>
          <p>
            結婚したい・したくないの強さではありません。変わることにも、変わらないことにも優劣はありません。
          </p>
        </div>
      </section>
      <div className="stack-actions">
        <button className="primary" onClick={startDiagnosis}>
          もう一度診断する
          <Icon name="arrow" size={18} />
        </button>
      </div>
      <p className="legal">価値観の変化の原因を示すものではありません。</p>
    </div>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <div className="toast">
      <span>
        <Icon name="check" size={17} />
      </span>
      {text}
    </div>
  );
}

export default function App() {
  const [days, setDays] = useState(() => buildDays());
  const [screen, setScreen] = useState<Screen>("welcome");
  const [posts, setPosts] = useState(() => seedPosts(days));
  const [answers, setAnswers] = useState(() => seedAnswers(days));
  const [profile, setProfile] = useState<DemoProfile>(initialProfile);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [diagnosisRecords, setDiagnosisRecords] = useState<DiagnosisRecord[]>([]);
  const [diagnosticsTab, setDiagnosticsTab] = useState<DiagnosticsTab>("current");
  const [initialDiagnosis, setInitialDiagnosis] = useState(false);
  const [diagnosisOrigin, setDiagnosisOrigin] = useState<Screen>("diagnostics");
  const [session, setSession] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(10);
  const [returnScreen, setReturnScreen] = useState<Screen>("home");
  const [homeType, setHomeType] = useState("");
  const [homeTab, setHomeTab] = useState("みんなの声");
  const [toast, setToast] = useState("");
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const today = days[0];
  const userType = diagnosis?.type || myType;
  const openCommunity = () => {
    setHomeType("");
    setHomeTab("みんなの声");
    go("home");
  };
  const displayedPosts = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        ...(post.own ? { name: profile.name, image: profile.image } : {}),
        replies: post.replies?.map((reply) =>
          reply.own ? { ...reply, name: profile.name, image: profile.image } : reply,
        ),
      })),
    [posts, profile],
  );
  const selectedPost = displayedPosts.find((p) => p.id === selectedPostId) || displayedPosts[0];

  useEffect(() => {
    const refresh = () => {
      const nextDays = buildDays();
      if (nextDays[0].id === today.id) return;
      setDays(nextDays);
      setPosts((current) => {
        const known = new Set(current.map((post) => post.dayId));
        return [
          ...seedPosts(nextDays)
            .filter((post) => !known.has(post.dayId) && post.dayId === nextDays[0].id)
            .map((post) => ({ ...post, id: Date.now() + post.id })),
          ...current,
        ];
      });
      setScreen((current) => (current === "compose" ? "home" : current));
    };
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(refresh, midnight.getTime() - now.getTime() + 100);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [today.id]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const go = (next: Screen) => {
    setScreen(next);
    window.scrollTo(0, 0);
  };
  const answerToday = (choice: string) => {
    if (!today.question.choices.includes(choice)) return;
    setAnswers((current) => (current[today.id] ? current : { ...current, [today.id]: choice }));
  };
  const compose = () => {
    if (!answers[today.id]) {
      go("home");
      setToast("まずは今日の問いに回答してみましょう");
      return;
    }
    go("compose");
  };
  const publish = (text: string, tags: string[]) => {
    if (!text.trim() || !answers[today.id]) return;
    setPosts((current) => [
      {
        id: Date.now(),
        dayId: today.id,
        name: profile.name,
        image: profile.image,
        type: userType,
        time: "たった今",
        text: text.trim(),
        tags,
        likes: 0,
        comments: 0,
        color: "#8B7CF6",
        own: true,
        poll: answers[today.id],
        replies: [],
      },
      ...current,
    ]);
    setToast("今日の問いへの投稿を公開しました");
    go("home");
  };
  const updatePost = (post: Post) =>
    setPosts((current) => current.map((p) => (p.id === post.id ? post : p)));
  const togglePost = (id: number) =>
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
          : post,
      ),
    );
  const openPost = (id: number) => {
    setReturnScreen(screen);
    setSelectedPostId(id);
    go("detail");
  };
  const feedProps = { posts: displayedPosts, days, openPost, togglePost };
  const toggleDay = (id: string) =>
    setCollapsedDays((current) => ({ ...current, [id]: !current[id] }));
  const saveProfile = (next: DemoProfile, onboarding: boolean) => {
    setProfile(next);
    setToast("プロフィールを更新しました");
    if (onboarding) setInitialDiagnosis(false);
    go(onboarding ? "home" : "profile");
  };
  const endSession = (reset = false) => {
    setSession(false);
    if (reset) {
      const initialDays = buildDays();
      setDays(initialDays);
      setProfile(initialProfile);
      setPosts(seedPosts(initialDays));
      setAnswers(seedAnswers(initialDays));
      setDiagnosis(null);
      setDiagnosisRecords([]);
      setInitialDiagnosis(false);
      setDiagnosticsTab("current");
      setHomeType("");
      setHomeTab("みんなの声");
      setCollapsedDays({});
    }
  };
  const mainScreens: Screen[] = [
    "welcome",
    "diagnosis",
    "result",
    "home",
    "diagnostics",
    "archive",
    "compose",
    "detail",
    "profile",
  ];
  return (
    <div
      className={`app-shell${screen === "profile" ? " profile-shell" : ""}${screen === "home" ? " home-shell" : ""}${screen === "welcome" ? " welcome-shell" : ""}`}
    >
      {screen === "welcome" && (
        <Welcome start={() => go("signup")} login={() => go("login")} browse={() => go("home")} />
      )}
      {screen === "diagnosis" && (
        <Diagnosis
          finish={(result) => {
            setDiagnosis(result);
            const record = makeDiagnosisRecord(result);
            setDiagnosisRecords((current) => [...current, record]);
            go("result");
          }}
          exit={() => go(diagnosisOrigin)}
          onClose={initialDiagnosis ? undefined : () => go(diagnosisOrigin)}
        />
      )}
      {screen === "result" && diagnosis && (
        <Result
          result={diagnosis}
          previous={
            diagnosisRecords.length >= 2 ? diagnosisRecords[diagnosisRecords.length - 2] : undefined
          }
          preview={{
            question: today.question.q,
            posts: posts.filter((post) => post.dayId === today.id && !post.own).slice(0, 2),
          }}
          home={openCommunity}
          onProfile={initialDiagnosis ? () => go("signup-profile") : undefined}
          onClose={initialDiagnosis ? undefined : () => go(diagnosisOrigin)}
        />
      )}
      {screen === "home" && (
        <Home
          {...feedProps}
          answer={answers[today.id]}
          onAnswer={answerToday}
          compose={compose}
          collapsed={!!collapsedDays[today.id]}
          onToggle={() => toggleDay(today.id)}
          selectedType={homeType}
          onSelectType={setHomeType}
          userType={userType}
          tab={homeTab}
          setTab={setHomeTab}
        />
      )}
      {screen === "diagnostics" && (
        <DiagnosticsHub
          records={diagnosisRecords}
          community={openCommunity}
          start={() => {
            setInitialDiagnosis(false);
            setDiagnosisOrigin(screen);
            go("diagnosis");
          }}
          tab={diagnosticsTab}
          setTab={setDiagnosticsTab}
        />
      )}
      <div hidden={screen !== "archive"}>
        {screen !== "welcome" && (
          <Archive
            key={today.id}
            {...feedProps}
            answers={answers}
            collapsedDays={collapsedDays}
            toggleDay={toggleDay}
          />
        )}
      </div>
      {screen === "compose" && (
        <Compose
          key={today.id}
          profile={profile}
          userType={userType}
          day={today}
          answer={answers[today.id]}
          back={() => go("home")}
          publish={publish}
        />
      )}
      {screen === "detail" && (
        <Detail
          key={selectedPost.id}
          profile={profile}
          post={selectedPost}
          day={days.find((d) => d.id === selectedPost.dayId)}
          back={() => go(returnScreen)}
          updatePost={updatePost}
        />
      )}
      {screen === "profile" && (
        <Profile
          {...feedProps}
          profile={profile}
          edit={() => go("edit-profile")}
          settings={() => go("settings")}
        />
      )}
      {!mainScreens.includes(screen) && (
        <AccountScreens
          key={screen}
          screen={screen as AccountScreen}
          go={(next) => {
            if (next === "diagnosis") {
              setInitialDiagnosis(true);
              setDiagnosisOrigin(screen);
            }
            go(next);
          }}
          profile={profile}
          saveProfile={saveProfile}
          completeSession={() => setSession(true)}
          endSession={endSession}
          session={session}
        />
      )}
      {(["home", "diagnostics", "archive", "profile"] as Screen[]).includes(screen) && (
        <BottomNav current={screen} go={go} />
      )}
      {toast && <Toast text={toast} />}
    </div>
  );
}

function PollBreakdown({ day, answer }: { day: DiscussionDay; answer?: string }) {
  const results = answer ? pollResults(day, answer) : null;
  return (
    <div className="inline-results archive-poll" aria-label="各選択肢の回答割合">
      {day.question.choices.map((choice, i) => (
        <div className={`inline-poll ${choice === answer ? "mine" : ""}`} key={choice}>
          <div>
            <span>
              {choice}
              {choice === answer && <b>あなた</b>}
            </span>
            <strong>
              {results ? (
                <>
                  {results.values[i]}
                  <small>%</small>
                </>
              ) : (
                "—"
              )}
            </strong>
          </div>
          {results && (
            <div className="inline-bar">
              <i style={{ width: `${results.values[i]}%` }} />
            </div>
          )}
        </div>
      ))}
      <p className="poll-disclaimer">
        {results
          ? `${results.total.toLocaleString()}人が回答。`
          : "この日は未回答のため、回答割合は表示されません。"}
      </p>
    </div>
  );
}
