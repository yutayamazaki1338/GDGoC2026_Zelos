import assert from "node:assert/strict";
import test from "node:test";
import {
  validateCredentials,
  validateProfile,
  validateProfileImage,
} from "../src/input-validation.ts";

const valid = {
  email: "name@example.com",
  currentPassword: "Current123",
  password: "NewPassword123",
  confirmation: "NewPassword123",
};

test("each credential form validates only the fields it exposes", () => {
  const empty = { email: "", currentPassword: "", password: "", confirmation: "" };
  const required = {
    signup: ["email", "password", "confirmation"],
    login: ["email", "password"],
    email: ["email", "currentPassword"],
    password: ["currentPassword", "password", "confirmation"],
    reset: ["password", "confirmation"],
    request: ["email"],
  };
  for (const [mode, keys] of Object.entries(required)) {
    assert.deepEqual(Object.keys(validateCredentials(mode, empty)), keys);
    assert.deepEqual(validateCredentials(mode, valid), {});
  }
});

test("email errors distinguish missing values, format and excessive length", () => {
  assert.match(validateCredentials("request", { ...valid, email: "  " }).email, /入力してください/);
  for (const email of ["name", "name@", "name @example.com", "name@@example.com"])
    assert.match(validateCredentials("request", { ...valid, email }).email, /形式/);
  assert.match(
    validateCredentials("request", { ...valid, email: `${"a".repeat(255)}@example.com` }).email,
    /254文字以内/,
  );
  assert.deepEqual(validateCredentials("request", { ...valid, email: " name@example.com " }), {});
});

test("password errors cover whitespace-only, minimum and maximum lengths", () => {
  assert.match(
    validateCredentials("login", { ...valid, password: "        " }).password,
    /入力してください/,
  );
  assert.match(validateCredentials("login", { ...valid, password: "short" }).password, /8文字以上/);
  assert.match(
    validateCredentials("login", { ...valid, password: "a".repeat(129) }).password,
    /128文字以内/,
  );
  assert.deepEqual(validateCredentials("login", { ...valid, password: "a".repeat(8) }), {});
});

test("password mismatch belongs to confirmation and is cleared after correction", () => {
  const mismatch = validateCredentials("signup", { ...valid, confirmation: "Different123" });
  assert.deepEqual(Object.keys(mismatch), ["confirmation"]);
  assert.match(mismatch.confirmation, /一致しません/);
  assert.deepEqual(validateCredentials("signup", valid), {});
  assert.match(
    validateCredentials("reset", { ...valid, password: "Another123" }).confirmation,
    /一致しません/,
  );
});

test("reusing the current password marks the new-password field only", () => {
  const errors = validateCredentials("password", {
    ...valid,
    password: valid.currentPassword,
    confirmation: valid.currentPassword,
  });
  assert.deepEqual(Object.keys(errors), ["password"]);
  assert.match(errors.password, /現在とは異なる/);
});

test("profile validation distinguishes name and biography errors", () => {
  assert.match(validateProfile("   ", "").name, /名前を入力/);
  assert.match(validateProfile("名".repeat(21), "").name, /20文字以内/);
  assert.match(validateProfile("そら", "あ".repeat(121)).bio, /120文字以内/);
  assert.deepEqual(validateProfile("名".repeat(20), "あ".repeat(120)), {});
});

test("image validation handles supported types, empty files and size limits", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"])
    assert.equal(validateProfileImage({ type, size: 5 * 1024 * 1024 }), "");
  assert.match(validateProfileImage({ type: "image/svg+xml", size: 100 }), /JPG・PNG・WebP/);
  assert.match(validateProfileImage({ type: "image/png", size: 0 }), /空/);
  assert.match(validateProfileImage({ type: "image/png", size: 5 * 1024 * 1024 + 1 }), /5MB以下/);
});

test("validation does not change submitted values", () => {
  const values = Object.freeze({ ...valid });
  assert.deepEqual(validateCredentials("signup", values), {});
  assert.deepEqual(values, valid);
});
