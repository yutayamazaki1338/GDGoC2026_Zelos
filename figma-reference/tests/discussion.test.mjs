import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDays,
  buildCommentThreads,
  dailyQuestions,
  diagnosisTypes,
  filterPosts,
  myType,
  pollResults,
  seedAnswers,
  seedPosts,
  toggleCommentLike,
} from "../src/discussion.ts";

const days = buildDays(new Date(2026, 0, 3, 12));
const posts = seedPosts(days);

test("comment replies and replies-to-replies stay grouped under their root", () => {
  const root = { id: 1, name: "まる", text: "元のコメント", color: "#67CDB9" };
  const other = { id: 2, name: "きい", text: "別のコメント", color: "#FF8F86" };
  const reply = {
    id: 3,
    name: "そら",
    text: "返信",
    color: "#8B7CF6",
    replyTo: { id: 1, name: "まる", text: root.text },
  };
  const nested = {
    id: 4,
    name: "なぎ",
    text: "返信への返信",
    color: "#D9AA51",
    replyTo: { id: 3, name: "そら", text: reply.text },
  };
  const comments = [nested, reply, root, other];
  const threads = buildCommentThreads(comments);
  assert.deepEqual(
    threads.map((thread) => thread.root.id),
    [1, 2],
  );
  assert.deepEqual(
    threads[0].replies.map((comment) => comment.id),
    [4, 3],
  );
  assert.deepEqual(threads[1].replies, []);
  assert.deepEqual(
    comments.map((comment) => comment.id),
    [4, 3, 1, 2],
  );
});

test("missing parents and malformed cycles do not hide comments or loop", () => {
  const orphan = {
    id: 5,
    name: "そら",
    text: "返信",
    color: "#8B7CF6",
    replyTo: { id: 99, name: "まる" },
  };
  const first = {
    id: 1,
    name: "まる",
    text: "A",
    color: "#67CDB9",
    replyTo: { id: 2, name: "きい" },
  };
  const second = {
    id: 2,
    name: "きい",
    text: "B",
    color: "#FF8F86",
    replyTo: { id: 1, name: "まる" },
  };
  const threads = buildCommentThreads([orphan, first, second]);
  assert.deepEqual(
    threads
      .flatMap((thread) => [thread.root.id, ...thread.replies.map((reply) => reply.id)])
      .sort(),
    [1, 2, 5],
  );
  assert.deepEqual(buildCommentThreads([]), []);
});

test("comment likes toggle counts without changing the reply context", () => {
  const comment = {
    id: 100,
    name: "そら",
    text: "返信です",
    color: "#8B7CF6",
    likes: 4,
    replyTo: { id: 1, name: "まる" },
  };
  const liked = toggleCommentLike(comment);
  assert.equal(liked.liked, true);
  assert.equal(liked.likes, 5);
  assert.deepEqual(liked.replyTo, comment.replyTo);
  assert.equal(comment.likes, 4);
  const unliked = toggleCommentLike(liked);
  assert.equal(unliked.liked, false);
  assert.equal(unliked.likes, 4);
});

test("comment likes support older demo comments and never become negative", () => {
  const comment = { id: 1, name: "そら", text: "コメント", color: "#8B7CF6" };
  assert.equal(toggleCommentLike(comment).likes, 1);
  assert.equal(toggleCommentLike({ ...comment, liked: true }).likes, 0);
  assert.equal(toggleCommentLike({ ...comment, liked: true, likes: 0 }).likes, 0);
});

test("one question per calendar day, with seven distinct past days across a year boundary", () => {
  assert.equal(days.length, 8);
  assert.equal(days[0].id, "2026-01-03");
  assert.equal(days[7].id, "2025-12-27");
  assert.equal(new Set(days.map((day) => day.id)).size, 8);
  assert.equal(new Set(days.slice(1).map((day) => day.question.q)).size, 7);
  assert.equal(buildDays(new Date(2026, 0, 3, 23, 59))[0].question, days[0].question);
  assert.notEqual(buildDays(new Date(2026, 0, 4))[0].question, days[0].question);
});

test("past answers belong to their question and today starts unanswered", () => {
  const answers = seedAnswers(days);
  assert.equal(answers[days[0].id], undefined);
  assert.equal(Object.keys(answers).length, 6);
  for (const day of days.slice(1)) {
    if (answers[day.id]) assert.ok(day.question.choices.includes(answers[day.id]));
  }
});

test("each question has an opinion for every choice and every poll sums to 100%", () => {
  for (const question of dailyQuestions) {
    assert.equal(question.choices.length, question.reasons.length);
    for (const answer of question.choices) {
      const { total, values } = pollResults({ ...days[0], question }, answer);
      assert.equal(total, 1285);
      assert.equal(values.length, question.choices.length);
      assert.equal(
        values.reduce((a, b) => a + b, 0),
        100,
      );
      assert.ok(values.every((value) => value >= 0 && value <= 100));
    }
  }
});

test("community filters all posts by diagnosis type", () => {
  for (const { name } of diagnosisTypes) {
    const filtered = filterPosts(posts, { type: name });
    assert.ok(filtered.length > 0);
    assert.ok(filtered.every((post) => post.type === name));
  }
  assert.equal(filterPosts(posts).length, posts.length);
});

test("home filters combine today's question, diagnosis type, liked state, and popularity", () => {
  const dayId = days[0].id;
  const type = diagnosisTypes[1].name;
  const selected = posts.find((post) => post.dayId === dayId && post.type === type);
  const current = posts.map((post) => (post.id === selected.id ? { ...post, liked: true } : post));
  current.push({ ...selected, id: 9999, likes: 300, liked: true });
  const filtered = filterPosts(current, { dayId, type, liked: true, popular: true });
  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((post) => post.dayId === dayId && post.type === type && post.liked));
  assert.deepEqual(
    filtered.map((post) => post.likes),
    [300, selected.likes],
  );
});

test("my feed includes past posts with no private or saved state", () => {
  const mine = filterPosts(posts, { mine: true });
  assert.equal(mine.length, 6);
  assert.ok(posts.every((post) => !("isPublic" in post) && !("saved" in post)));
  assert.ok(mine.every((post) => post.own && post.type === myType));
});

test("archive scopes both popular and own feeds to the selected day", () => {
  for (const day of days.slice(1)) {
    const popular = filterPosts(posts, { dayId: day.id, popular: true });
    assert.ok(popular.every((post) => post.dayId === day.id));
    assert.deepEqual(
      popular.map((post) => post.likes),
      popular.map((post) => post.likes).sort((a, b) => b - a),
    );
    assert.ok(
      filterPosts(posts, { dayId: day.id, mine: true }).every(
        (post) => post.dayId === day.id && post.own,
      ),
    );
  }
});

test("liked archive posts belong to the selected day and update when unliked", () => {
  const day = days[1];
  const liked = filterPosts(posts, { dayId: day.id, liked: true });
  assert.ok(liked.length > 0);
  assert.ok(liked.every((post) => post.liked && post.dayId === day.id));
  const updated = posts.map((post) => (post.id === liked[0].id ? { ...post, liked: false } : post));
  assert.equal(filterPosts(updated, { dayId: day.id, liked: true }).length, liked.length - 1);
});

test("choice tags match their day, post IDs are unique, and sorting does not mutate state", () => {
  assert.equal(new Set(posts.map((post) => post.id)).size, posts.length);
  for (const post of posts) {
    const day = days.find((day) => day.id === post.dayId);
    assert.ok(day.question.choices.includes(post.poll));
  }
  const original = posts.map((post) => post.id);
  filterPosts(posts, { popular: true });
  assert.deepEqual(
    posts.map((post) => post.id),
    original,
  );
});
