import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const account = readFileSync(new URL("../src/AccountScreens.tsx", import.meta.url), "utf8");
const diagnosis = readFileSync(new URL("../src/DiagnosisScreens.tsx", import.meta.url), "utf8");

test("diagnosis simplification removes redundant labels, hints and the locked-feed action", () => {
  for (const text of [
    "正解はありません。迷ったときは真ん中でも大丈夫。戻って回答を変更できます。",
    "PART 1 / 2",
    "PART 2 / 2",
    "ここからは文章への当てはまりを答えます。",
    "分類の境界付近です。",
    "色の長さが、両方向への近さを表します。",
    "どちらが高くても、優劣はありません。",
    "選択中：",
    "今日の問いに回答する",
  ])
    assert.ok(!(app + diagnosis).includes(text), `Removed copy returned: ${text}`);
});

test("requested explanatory text stays removed from interface source", () => {
  for (const text of [
    "今の自分を、プロフィールに",
    "名前・アイコン・自己紹介は、投稿やコメントにも表示されます。",
    "これまでに公開した、あなたの考え。",
    "1日1問、違う視点に出会う",
    "結婚観を、話そう。",
    "心理学的に検証",
    "大切にしたいこと、",
    "直近の結果と、その1回前の結果を比べています。",
    "多数派が正解ではありません。",
    "名前・アイコン・回答・診断タイプと一緒に公開されます。",
    "表示名で参加できます。実名や連絡先を投稿に表示することはありません。",
    "新しい連絡先へ。",
    "パスワードを見直す。",
    "今、感じたことを残そう。",
    "絞り込みを解除",
  ])
    assert.ok(!(app + account).includes(text), `Removed copy returned: ${text}`);
});

test("Apple signup and comparison notes have no remaining UI entry points", () => {
  assert.ok(!account.includes("signup-apple"));
  assert.ok(!account.includes("Appleで続ける"));
  assert.ok(!app.includes("saveNote"));
  assert.ok(!app.includes("メモを保存"));
  assert.ok(!app.includes('className="stats"'));
});

test("signup no longer asks users to confirm participation precautions", () => {
  assert.ok(!account.includes("参加にあたって"));
  assert.ok(!account.includes('type="checkbox"'));
});
