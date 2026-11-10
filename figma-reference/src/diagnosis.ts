import { diagnosisTypes, styleAxes } from "./diagnosis-types.ts";

type Question = { text: string; axis: number; left?: string; right?: string };
export const diagnosisQuestions: Question[] = [
  {
    axis: 0,
    text: "将来の暮らしを思い浮かべるとき",
    left: "先に理想の暮らしを描く",
    right: "経験を重ねながら自分に合う暮らしを探す",
  },
  {
    axis: 1,
    text: "将来の働き方を考えるとき",
    left: "条件や制度を調べて比較する",
    right: "体験した感覚や手応えを確かめる",
  },
  {
    axis: 2,
    text: "数年後に向けて動き出すとき",
    left: "目標までの段階や期限を先に決める",
    right: "状況を見ながら進み方を調整する",
  },
  {
    axis: 3,
    text: "将来について迷いがあるとき",
    left: "一人で考えを書き出すと整理しやすい",
    right: "誰かと話すと整理しやすい",
  },
  {
    axis: 0,
    text: "10年後の自分について考えるとき",
    left: "まず色々な可能性を広げたい",
    right: "まず目指す姿を決めたい",
  },
  {
    axis: 1,
    text: "知らない暮らし方に関心を持ったとき",
    left: "実践している人の体験に触れたい",
    right: "費用や条件などの情報を調べたい",
  },
  {
    axis: 2,
    text: "予定どおり進まなくなったとき",
    left: "別の方法を試しながら進みたい",
    right: "計画を組み直して順序を決めたい",
  },
  {
    axis: 3,
    text: "大切にしたい価値観を整理するとき",
    left: "人と考えを交わすと気づきが増える",
    right: "一人で振り返ると気づきが増える",
  },
  {
    axis: 0,
    text: "これから挑戦することを選ぶとき",
    left: "実現したい将来像から逆算する",
    right: "試してみたい経験から選んでいく",
  },
  {
    axis: 1,
    text: "新しい選択肢を検討するとき",
    left: "選択肢の長所・短所を整理して判断する",
    right: "実際に試した際の納得感から判断する",
  },
  {
    axis: 2,
    text: "将来の方針を決めたあと",
    left: "必要な行動を具体的な予定に落とし込む",
    right: "変更できる余地を残して進める",
  },
  {
    axis: 3,
    text: "新しい意見に触れたあと",
    left: "自分の中で意味をじっくり整理する",
    right: "誰かと話して理解を深める",
  },
  { axis: 4, text: "今の自分が望む暮らしについて、具体的なイメージがある。" },
  { axis: 4, text: "仕事以外の生活や、自分の時間をどう過ごしたいかを考えている。" },
  { axis: 4, text: "将来の選択で大切にしたい条件を、自分の言葉で説明できる。" },
  { axis: 5, text: "自分の周囲でよく見るもの以外にも、多様な生き方があると知っている。" },
  { axis: 5, text: "仕事・住まい・家族などについて、複数の選択肢を比較したことがある。" },
  { axis: 5, text: "将来の選択を考えるとき、参考になる情報や体験談を探す方法が分かる。" },
  { axis: 6, text: "希望する暮らしに必要な条件（お金・時間・経験など）を考えている。" },
  { axis: 6, text: "将来に向けて、今できることを試したり準備したりしている。" },
];

export const styleScaleLabels = [
  "左に近い",
  "やや左に近い",
  "どちらともいえない",
  "やや右に近い",
  "右に近い",
];
export const scaleLabels = [
  "全く当てはまらない",
  "あまり当てはまらない",
  "どちらともいえない",
  "やや当てはまる",
  "とても当てはまる",
];
export type BoundaryFlag = "tie" | "near" | null;
export type DiagnosisResult = {
  scores: number[];
  totals: number[];
  boundaries: BoundaryFlag[];
  concreteness: number[];
  code: string;
  type: string;
};
export type DiagnosisRecord = DiagnosisResult & { id: string; createdAt: string; sample: boolean };

export function makeDiagnosisRecord(
  result: DiagnosisResult,
  now = new Date(),
  id: string = crypto.randomUUID(),
): DiagnosisRecord {
  return {
    ...result,
    scores: [...result.scores],
    totals: [...result.totals],
    boundaries: [...result.boundaries],
    concreteness: [...result.concreteness],
    id,
    createdAt: now.toISOString(),
    sample: false,
  };
}

export function seedDiagnosisHistory(now = new Date()): DiagnosisRecord[] {
  return [
    [1, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 4, 3, 3, 2, 4, 3, 3, 2, 2],
    [2, 2, 4, 4, 3, 4, 2, 2, 2, 2, 4, 4, 4, 3, 3, 4, 4, 3, 3, 4],
  ].map((answers, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (i === 0 ? 90 : 30));
    return { ...makeDiagnosisRecord(scoreDiagnosis(answers), date, `sample-${i}`), sample: true };
  });
}

export function compareDiagnoses(before: DiagnosisResult, after: DiagnosisResult) {
  const deltas = after.scores.map((value, i) => value - before.scores[i]);
  const largest = Math.max(...deltas.map(Math.abs));
  return {
    deltas,
    changedAxis: largest === 0 ? null : deltas.findIndex((value) => Math.abs(value) === largest),
  };
}

export function latestDiagnosisPair(records: readonly DiagnosisRecord[]) {
  if (records.length < 2) return null;
  return { before: records[records.length - 2], after: records[records.length - 1] };
}

// All numerators are nonnegative: integer arithmetic implements ROUND_HALF_UP exactly.
export function roundHalfUp(numerator: number, denominator: number) {
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

export function scoreDiagnosis(answers: number[]): DiagnosisResult {
  if (
    answers.length !== 20 ||
    diagnosisQuestions.some(
      (_, i) => !Number.isInteger(answers[i]) || answers[i] < 1 || answers[i] > 5,
    )
  )
    throw new Error("すべての質問に1〜5で回答してください");
  const totals = styleAxes.map((_, axis) =>
    diagnosisQuestions
      .slice(0, 12)
      .reduce(
        (sum, q, i) =>
          sum + (q.axis === axis ? (i >= 4 && i <= 7 ? answers[i] : 6 - answers[i]) : 0),
        0,
      ),
  );
  const scores = totals.map((total) => roundHalfUp((total - 3) * 100, 12));
  const boundaries: BoundaryFlag[] = totals.map((total) =>
    total === 9 ? "tie" : total === 8 || total === 10 ? "near" : null,
  );
  const code = totals
    .map((total, i) => (total >= 9 ? styleAxes[i].first : styleAxes[i].second))
    .join("");
  const concreteness = [
    [12, 15],
    [15, 18],
    [18, 20],
  ].map(([start, end]) => {
    const n = end - start;
    const sum = answers.slice(start, end).reduce((a, b) => a + b, 0);
    return roundHalfUp((sum - n) * 100, 4 * n);
  });
  return {
    scores,
    totals,
    boundaries,
    concreteness,
    code,
    type: diagnosisTypes.find((type) => type.code === code)!.name,
  };
}
