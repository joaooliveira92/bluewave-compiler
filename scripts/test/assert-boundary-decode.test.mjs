// Tests for scripts/assert-boundary-decode.mjs — the boundary-cast gate over the
// content loader and desktop main (RULES.md "Schema and boundaries"). Covers the
// rejected shapes (`as T`, parens, double assertion), the required decode shape,
// the fail-closed parse path, and the guarded scopes.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SCOPES,
  findBoundaryDecodeCasts,
  scanBoundaryDecodeCasts,
} from "../assert-boundary-decode.mjs";

const count = (text) => findBoundaryDecodeCasts("a.ts", text).length;

void test("rejects a JSON.parse boundary cast", () => {
  assert.equal(count("const x = JSON.parse(s) as Foo;"), 1);
  assert.equal(count("const x = (JSON.parse(s)) as { a: number };"), 1);
});

void test("counts a double assertion once", () => {
  assert.equal(count("const x = JSON.parse(s) as unknown as Foo;"), 1);
});

void test("permits parsing into an unknown binding for schema decode", () => {
  assert.equal(count("const x: unknown = JSON.parse(s);"), 0);
  assert.equal(count("const x = decodeStrict(S, JSON.parse(s));"), 0);
});

void test("ignores non-JSON parse calls", () => {
  assert.equal(count("const x = parseYaml(s) as Foo;"), 0);
  assert.equal(count("const x = body.parse(s) as Foo;"), 0);
});

void test("reports the offending line", () => {
  const findings = findBoundaryDecodeCasts(
    "a.ts",
    "const a = 1;\nconst x = JSON.parse(s) as Foo;\n",
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 2);
});

void test("fails closed on a parse error", () => {
  assert.throws(
    () => findBoundaryDecodeCasts("a.ts", "const x = JSON.parse(s) as"),
    /failing closed/u,
  );
});

void test("the real tree passes both scopes", () => {
  const repoRoot = new URL("../..", import.meta.url).pathname;
  for (const roots of Object.values(SCOPES)) {
    assert.deepEqual(scanBoundaryDecodeCasts(repoRoot, roots), []);
  }
});
