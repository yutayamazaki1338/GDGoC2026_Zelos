import assert from "node:assert/strict";
import test from "node:test";
import {
  compareDiagnoses,
  diagnosisQuestions,
  latestDiagnosisPair,
  makeDiagnosisRecord,
  roundHalfUp,
  scaleLabels,
  scoreDiagnosis,
  seedDiagnosisHistory,
  styleScaleLabels,
} from "../src/diagnosis.ts";
import { diagnosisTypes, styleAxes } from "../src/diagnosis-types.ts";

// Turn corrected values into the actual left-to-right answer positions.
const raw = (corrected, concrete = Array(8).fill(3)) => [
  ...corrected.map((value, i) => (i >= 4 && i <= 7 ? value : 6 - value)),
  ...concrete,
];
const uniform = (value) => raw(Array(12).fill(value));

test("all 16 type names match the revised naming list", () => {
  assert.deepEqual(Object.fromEntries(diagnosisTypes.map(({ code, name }) => [code, name])), {
    GIPS: "じっくり未来設計",
    GIPD: "相談型プランナー",
    GIFS: "堅実な柔軟派",
    GIFD: "対話型の未来設計",
    GXPS: "実感重視の計画派",
    GXPD: "体験共有プランナー",
    GXFS: "感覚重視の柔軟派",
    GXFD: "柔軟な対話型",
    EIPS: "選択肢重視の計画派",
    EIPD: "対話で練る将来設計",
    EIFS: "情報重視の探索派",
    EIFD: "対話で広げる選択肢",
    EXPS: "体験重視の計画派",
    EXPD: "相談しながら挑戦",
    EXFS: "マイペースな体験重視",
    EXFD: "対話で探る未来",
  });
});

test("20 questions contain 12 bipolar and 8 agreement items with exact axis groups", () => {
  assert.equal(diagnosisQuestions.length, 20);
  assert.equal(scaleLabels.length, 5);
  assert.equal(styleScaleLabels.length, 5);
  for (let i = 0; i < 12; i++) {
    assert.equal(diagnosisQuestions[i].axis, i % 4);
    assert.ok(diagnosisQuestions[i].left && diagnosisQuestions[i].right);
  }
  assert.deepEqual(
    diagnosisQuestions.slice(12).map((q) => q.axis),
    [4, 4, 4, 5, 5, 5, 6, 6],
  );
});

test("forward and reversed questions transform in the specified directions", () => {
  assert.deepEqual(scoreDiagnosis(uniform(1)).scores, [0, 0, 0, 0]);
  assert.deepEqual(scoreDiagnosis(uniform(3)).scores, [50, 50, 50, 50]);
  assert.deepEqual(scoreDiagnosis(uniform(5)).scores, [100, 100, 100, 100]);
  for (let i = 0; i < 12; i++) {
    const answers = Array(20).fill(3);
    answers[i] = 5;
    const result = scoreDiagnosis(answers);
    assert.equal(result.totals[i % 4], i >= 4 && i <= 7 ? 11 : 7);
    assert.equal(result.scores[i % 4], i >= 4 && i <= 7 ? 67 : 33);
  }
});

test("all 16 codes resolve to the correct, unique named type", () => {
  assert.equal(diagnosisTypes.length, 16);
  assert.equal(new Set(diagnosisTypes.map((type) => type.code)).size, 16);
  assert.equal(new Set(diagnosisTypes.map((type) => type.name)).size, 16);
  for (const type of diagnosisTypes) {
    const result = scoreDiagnosis(
      raw(
        Array.from({ length: 12 }, (_, i) => (type.code[i % 4] === styleAxes[i % 4].first ? 5 : 1)),
      ),
    );
    assert.equal(result.code, type.code);
    assert.equal(result.type, type.name);
  }
});

test("integer totals, not rounded percentages, determine tie and near-boundary flags", () => {
  for (let total = 3; total <= 15; total++) {
    const values = [1, 1, 1];
    let remaining = total - 3;
    for (let i = 0; i < 3; i++) {
      const amount = Math.min(remaining, 4);
      values[i] += amount;
      remaining -= amount;
    }
    const result = scoreDiagnosis(raw(values.flatMap((value) => Array(4).fill(value))));
    assert.deepEqual(result.totals, Array(4).fill(total));
    assert.deepEqual(
      result.boundaries,
      Array(4).fill(total === 9 ? "tie" : total === 8 || total === 10 ? "near" : null),
    );
    assert.equal(result.code, total >= 9 ? "GIPS" : "EXFD");
    assert.equal(result.scores[0], Math.round(((total - 3) * 100) / 12));
    assert.equal(result.scores[0] + (100 - result.scores[0]), 100);
  }
});

test("HALF_UP rounds exact halves upwards, including two-item R", () => {
  assert.equal(roundHalfUp(125, 10), 13);
  assert.equal(roundHalfUp(375, 10), 38);
  const result = scoreDiagnosis(raw(Array(12).fill(3), [1, 2, 2, 5, 4, 5, 1, 2]));
  assert.deepEqual(result.concreteness, [17, 92, 13]);
});

test("V/O/R are independent, normalized to 0–100 and never affect the style", () => {
  for (let value = 1; value <= 5; value++) {
    const result = scoreDiagnosis(raw(Array(12).fill(3), Array(8).fill(value)));
    assert.deepEqual(result.concreteness, Array(3).fill((value - 1) * 25));
    assert.equal(result.code, "GIPS");
    assert.deepEqual(result.scores, [50, 50, 50, 50]);
  }
  const answers = raw(Array(12).fill(3), [5, 5, 5, 1, 1, 1, 3, 3]);
  assert.deepEqual(scoreDiagnosis(answers).concreteness, [100, 0, 50]);
});

test("incomplete, sparse, non-integer and out-of-range answers are rejected", () => {
  const sparse = Array(20).fill(3);
  delete sparse[7];
  for (const answers of [
    [],
    Array(20),
    sparse,
    Array(12).fill(3),
    Array(19).fill(3),
    Array(21).fill(3),
    Array(20).fill(0),
    Array(20).fill(6),
    Array(20).fill(2.5),
    Array(20).fill(NaN),
    Array(20).fill("3"),
  ])
    assert.throws(() => scoreDiagnosis(answers));
});

test("diagnosis records snapshot every array and timestamp without modifying answers", () => {
  const answers = uniform(5);
  const original = [...answers];
  const result = scoreDiagnosis(answers);
  const record = makeDiagnosisRecord(result, new Date("2026-11-09T12:00:00Z"), "diagnosis-1");
  assert.equal(record.id, "diagnosis-1");
  assert.equal(record.sample, false);
  assert.equal(record.createdAt, "2026-11-09T12:00:00.000Z");
  assert.deepEqual(answers, original);
  result.scores[0] = 0;
  result.totals[0] = 3;
  result.concreteness[0] = 0;
  result.boundaries[0] = "tie";
  assert.equal(record.scores[0], 100);
  assert.equal(record.totals[0], 15);
  assert.equal(record.concreteness[0], 50);
  assert.equal(record.boundaries[0], null);
});

test("comparison uses the latest two records and shows real score deltas", () => {
  const records = [];
  assert.equal(latestDiagnosisPair(records), null);
  const before = makeDiagnosisRecord(scoreDiagnosis(uniform(1)), new Date(), "first");
  records.push(before);
  assert.equal(latestDiagnosisPair(records), null);
  const after = makeDiagnosisRecord(scoreDiagnosis(uniform(5)), new Date(), "second");
  records.push(after);
  assert.deepEqual(compareDiagnoses(before, after), {
    deltas: [100, 100, 100, 100],
    changedAxis: 0,
  });
  assert.deepEqual(compareDiagnoses(after, after), { deltas: [0, 0, 0, 0], changedAxis: null });
  assert.deepEqual(latestDiagnosisPair(records), { before, after });
  const third = makeDiagnosisRecord(scoreDiagnosis(uniform(3)), new Date(), "third");
  records.push(third);
  assert.deepEqual(latestDiagnosisPair(Object.freeze(records)), { before: after, after: third });
});

test("sample data, when requested, uses the new scoring model and chronological timestamps", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  const records = seedDiagnosisHistory(now);
  assert.ok(records.every((record) => record.sample && record.concreteness.length === 3));
  assert.ok(new Date(records[0].createdAt) < new Date(records[1].createdAt));
  assert.ok(new Date(records[1].createdAt) < now);
  assert.ok(records.every((record) => diagnosisTypes.some((type) => type.code === record.code)));
});
