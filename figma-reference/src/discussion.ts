import { diagnosisTypes } from "./diagnosis-types.ts";
export { diagnosisTypes };

// 診断前に表示する、プロトタイプ用のサンプルタイプ。
export const myType = diagnosisTypes[1].name;

export const dailyQuestions = [
  {
    tag: "結婚する・しない",
    q: "今のあなたは、自分の結婚についてどう考えている？",
    choices: ["結婚したい", "結婚しないでいたい", "まだ決めていない"],
    reasons: [
      "日々を共にして、困ったときに支え合う関係を結婚という形でつくりたい。そうでない形も尊重したい。",
      "今は結婚せずに暮らしたい。友人や身近な人との支え合いも、私には大切だから。",
      "結婚に求めるものがまだ分からない。いろいろな経験を聞きながら、ゆっくり考えたい。",
    ],
  },
  {
    tag: "家計",
    q: "結婚して生活費を分担するなら、どの方法がしっくりくる？",
    choices: ["同じ金額を出す", "収入に応じて出す", "状況に合わせて話し合う"],
    reasons: [
      "同じ金額だと管理しやすそう。ただ、どちらかの負担が大きくなったら見直したい。",
      "収入が違うなら、同じ額より収入に応じた分担が自分にはしっくりくる。",
      "収入だけでなく、家事やケアの負担も含めて、その都度相談したい。",
    ],
  },
  {
    tag: "家事・ケア",
    q: "結婚して一緒に暮らすなら、家事分担はどう決めたい？",
    choices: ["同じ割合で分担", "得意なことを担当", "仕事の忙しさに合わせる", "その都度話し合う"],
    reasons: [
      "担当の偏りが出ないよう、まず同じ割合を目安にしてみたい。",
      "得意なことから分けたいけど、苦手な家事が一人に残らない工夫も必要だと思う。",
      "忙しい時期は支え合いたい。ただ、いつも同じ人が引き受けないようにしたい。",
      "家事に使える時間も体調も変わるから、定期的に分担を話し直したい。",
    ],
  },
  {
    tag: "住まいと距離感",
    q: "結婚と暮らし方について、今の自分に近いのは？",
    choices: ["一緒に住みたい", "別々に住みたい", "状況に合わせたい", "まだ決めていない"],
    reasons: [
      "日々の小さなことを共有できる同居が、自分には合いそう。",
      "一人で過ごす空間がある方が落ち着く。離れて暮らしていても支え合えると思う。",
      "仕事や体調に合わせて、同居か別居かを見直せる関係でいたい。",
      "誰かと暮らした経験がまだ少ないので、いろいろな暮らし方を聞いてみたい。",
    ],
  },
  {
    tag: "制度と選択",
    q: "結婚に関わる制度について、まず話してみたいのは？",
    choices: ["姓や手続き", "権利や保障", "多様な関係の選択肢"],
    reasons: [
      "名前が変わる場合の負担や、今選べる制度について知ってから話したい。",
      "病気や相続のとき、どんな権利や保障があるのかが気になっている。",
      "同性のパートナーや法律婚を選ばない人も含め、どんな選択肢があるか知りたい。",
    ],
  },
  {
    tag: "周囲の期待",
    q: "「結婚はいつ？」と聞かれたら、どう伝えたい？",
    choices: ["自分の考えを話す", "今は話さないと伝える", "なぜ気になるのか聞く"],
    reasons: [
      "決まった予定がなくても、今どう考えているかを自分の言葉で伝えたい。",
      "親しい相手でも、話したくないことは話さなくていいと思う。",
      "心配なのか、ただの雑談なのか、相手の背景を聞いてから話したい。",
    ],
  },
  {
    tag: "結婚と子ども",
    q: "結婚と子どもを持つ選択について、まず話したいのは？",
    choices: [
      "持つ・持たないの希望",
      "育児やケアの分担",
      "周囲の期待との距離",
      "まだ考えを整理したい",
    ],
    reasons: [
      "結婚の希望と子どもを持つ希望は別に、決めつけず話したい。",
      "育てるとしたら誰がどんなケアを担うのか、具体的な負担を話したい。",
      "結婚したら子どもを持つはず、という周囲の期待との距離を考えたい。",
      "まだ自分の希望は分からないけれど、迷ったまま話してもいいと思う。",
    ],
  },
];

export type DiscussionDay = {
  id: string;
  date: string;
  shortDate: string;
  question: (typeof dailyQuestions)[number];
};

export type Comment = {
  id: number;
  name: string;
  text: string;
  color: string;
  liked?: boolean;
  own?: boolean;
  image?: string;
  likes?: number;
  replyTo?: { id: number; name: string; text?: string };
};
export type Post = {
  id: number;
  dayId: string;
  name: string;
  type: string;
  time: string;
  text: string;
  tags: string[];
  likes: number;
  comments: number;
  color: string;
  own: boolean;
  image?: string;
  liked?: boolean;
  poll?: string;
  replies?: Comment[];
};

export function toggleCommentLike(comment: Comment): Comment {
  const likes = comment.likes ?? (comment.liked ? 1 : 0);
  return {
    ...comment,
    liked: !comment.liked,
    likes: Math.max(0, likes + (comment.liked ? -1 : 1)),
  };
}

export function buildCommentThreads(comments: readonly Comment[]) {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const rootOf = (comment: Comment) => {
    let current = comment;
    const seen = new Set([comment.id]);
    while (current.replyTo && byId.has(current.replyTo.id)) {
      const parent = byId.get(current.replyTo.id)!;
      if (seen.has(parent.id)) return comment.id;
      seen.add(parent.id);
      current = parent;
    }
    return current.id;
  };
  const roots = new Map(comments.map((comment) => [comment.id, rootOf(comment)]));
  return comments
    .filter((comment) => roots.get(comment.id) === comment.id)
    .map((root) => ({
      root,
      replies: comments.filter(
        (comment) => comment.id !== root.id && roots.get(comment.id) === root.id,
      ),
    }));
}

export function buildDays(now = new Date()): DiscussionDay[] {
  return Array.from({ length: 8 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const ordinal = Math.floor(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
    );
    return {
      id: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      date: date.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" }),
      shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
      question: dailyQuestions[((ordinal % 7) + 7) % 7],
    };
  });
}

export function seedAnswers(days: DiscussionDay[]): Record<string, string> {
  return Object.fromEntries(
    days
      .slice(1)
      .filter((_, i) => i !== 4)
      .map((day, i) => [day.id, day.question.choices[(i + 1) % day.question.choices.length]]),
  );
}

export function seedPosts(days: DiscussionDay[]): Post[] {
  const answers = seedAnswers(days);
  return days.flatMap((day, d) => {
    const posts: Post[] = diagnosisTypes.map((type, i) => ({
      id: (d + 1) * 100 + i,
      dayId: day.id,
      name: [
        "みずき",
        "りん",
        "はる",
        "なぎ",
        "ゆう",
        "あお",
        "けい",
        "ふう",
        "れん",
        "まこ",
        "さく",
        "つむぎ",
        "かい",
        "ひなた",
        "しお",
        "いと",
      ][i],
      type: type.name,
      time:
        d === 0
          ? ["12分前", "35分前", "1時間前", "2時間前"][i % 4]
          : `${day.shortDate} 18:${String(12 + (i % 4) * 10).padStart(2, "0")}`,
      text: day.question.reasons[i % day.question.choices.length],
      tags: [day.question.tag],
      likes: [87, 124, 63, 152][i % 4] - d * 3,
      comments: [12, 18, 9, 24][i % 4],
      color: type.color,
      own: false,
      liked: d > 0 && i === 1,
      poll: day.question.choices[i % day.question.choices.length],
    }));
    if (answers[day.id]) {
      const answer = answers[day.id];
      posts.push({
        id: (d + 1) * 100 + 16,
        dayId: day.id,
        name: "そら",
        type: myType,
        time: `${day.shortDate} 20:30`,
        text: `${day.question.reasons[day.question.choices.indexOf(answer)]} 違う立場の人の理由も聞いてみたい。`,
        tags: [day.question.tag],
        likes: d % 2 === 0 ? 8 : 0,
        comments: 0,
        color: "#8B7CF6",
        own: true,
        poll: answer,
        replies: [],
      });
    }
    return posts;
  });
}

export function filterPosts(
  posts: Post[],
  options: {
    dayId?: string;
    type?: string;
    mine?: boolean;
    liked?: boolean;
    popular?: boolean;
  } = {},
) {
  const filtered = posts.filter(
    (post) =>
      (!options.mine || post.own) &&
      (!options.dayId || post.dayId === options.dayId) &&
      (!options.type || post.type === options.type) &&
      (!options.liked || post.liked),
  );
  return options.popular ? [...filtered].sort((a, b) => b.likes - a.likes) : filtered;
}

export function pollResults(day: DiscussionDay, answer: string) {
  const counts = day.question.choices.length === 3 ? [359, 603, 322] : [359, 411, 292, 222];
  const voted = counts.map((count, i) => count + (day.question.choices[i] === answer ? 1 : 0));
  const total = voted.reduce((a, b) => a + b, 0);
  const raw = voted.map((count) => (count / total) * 100);
  const values = raw.map(Math.floor);
  const order = raw
    .map((n, i) => ({ i, fraction: n - values[i] }))
    .sort((a, b) => b.fraction - a.fraction);
  const remainder = 100 - values.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remainder; i++) values[order[i].i]++;
  return { total, values };
}
