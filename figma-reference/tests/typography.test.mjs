import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const name of ["index.css", "account.css", "diagnosis.css"]) {
  test(`${name}: explicit font sizes are at least 10px`, () => {
    const css = readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8");
    const sizes = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)];
    assert.ok(sizes.length > 0);
    for (const [, size] of sizes) assert.ok(Number(size) >= 10, `Found ${size}px text in ${name}`);
  });
}
