#!/usr/bin/env node
// Reject `JSON.parse(...) as T` at declared external boundaries.
//
// RULES.md "Schema and boundaries" requires a strict schema decode at every
// external boundary; a `JSON.parse(...) as T` assertion admits whatever the file
// happens to contain, bypassing the validator the same shape already has
// (ADR-0102/ADR-0105). This gate freezes the rule per boundary scope
// (ADR-0106 ratchet pattern):
//
//   --scope compiler  packages/content-compiler/src  (the content loader)
//   --scope desktop   apps/desktop/src/main          (project/pack loaders)
//
// A site is a boundary cast when a `JSON.parse(...)` call (possibly wrapped in
// parens or a further `as unknown`) is asserted to a named type. `JSON.parse`
// into an `unknown` binding that is then schema-decoded is the required shape and
// is not flagged.
//
// Usage: `node scripts/assert-boundary-decode.mjs [--scope compiler|desktop|all] [--self-test]`
//
// Wired into `pnpm preflight` (one self-test, then one gate per scope).

import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseSync } from "oxc-parser";

const root = resolve(import.meta.dirname, "..");

/** The boundary scopes the gate guards, keyed by `--scope` name. */
export const SCOPES = {
  compiler: ["packages/content-compiler/src"],
  desktop: ["apps/desktop/src/main"],
};

const SOURCE_RE = /\.(?:[cm]?[jt]s|[jt]sx)$/u;
const TEST_RE = /(?:^|\/)(?:test|tests|__tests__)\/|\.(?:test|spec)\.[cm]?[jt]sx?$/u;

function lineAt(text, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function isJsonProperty(node) {
  return (
    node?.type === "MemberExpression" &&
    node.object?.type === "Identifier" &&
    node.object.name === "JSON" &&
    node.property?.type === "Identifier" &&
    node.property.name === "parse"
  );
}

function isJsonParseCall(node) {
  return node?.type === "CallExpression" && isJsonProperty(node.callee);
}

/** Unwrap parens, non-null, and inner `as T`/`<T>` assertions to the base call. */
function unwrap(node) {
  let current = node;
  while (
    current !== null &&
    typeof current === "object" &&
    (current.type === "TSAsExpression" ||
      current.type === "TSTypeAssertion" ||
      current.type === "TSNonNullExpression" ||
      current.type === "ParenthesizedExpression")
  ) {
    current = current.expression;
  }
  return current;
}

/**
 * Find `JSON.parse(...) as T` boundary casts in one source file.
 * @param {string} file repository-relative path (forward slashes)
 * @param {string} text source contents
 * @returns {Array<{file: string, line: number}>}
 */
export function findBoundaryDecodeCasts(file, text) {
  const normalized = file.replaceAll("\\", "/");
  const { program, errors } = parseSync(normalized, text);
  if (errors.length > 0) {
    throw new Error(
      `assert-boundary-decode: cannot parse ${normalized}: ${errors[0].message} ` +
        "(failing closed — an unparsed file could hide a boundary cast)",
    );
  }
  const findings = [];
  const seenCalls = new Set();
  const visit = (node) => {
    if (node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (typeof node.type !== "string") return;
    if (node.type === "TSAsExpression" || node.type === "TSTypeAssertion") {
      const base = unwrap(node.expression);
      if (isJsonParseCall(base) && !seenCalls.has(base.start)) {
        seenCalls.add(base.start);
        findings.push({ file: normalized, line: lineAt(text, base.start) });
      }
    }
    for (const key of Object.keys(node)) {
      if (key === "type" || key === "start" || key === "end" || key === "range") continue;
      const value = node[key];
      if (value !== null && typeof value === "object") visit(value);
    }
  };
  visit(program);
  return findings;
}

/**
 * Scan the authored (non-test) source under the given roots for boundary casts.
 * @param {string} repoRoot
 * @param {readonly string[]} roots source prefixes
 * @returns {Array<{file: string, line: number}>}
 */
export function scanBoundaryDecodeCasts(repoRoot, roots) {
  const isGuarded = (file) =>
    SOURCE_RE.test(file) &&
    !TEST_RE.test(file) &&
    roots.some((prefix) => file.startsWith(`${prefix}/`));
  const files = [
    ...new Set(
      execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      })
        .split("\0")
        .map((file) => file.replaceAll("\\", "/"))
        .filter(isGuarded),
    ),
  ].sort();

  const present = files.filter((file) => {
    const stat = lstatSync(resolve(repoRoot, file), { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) {
      throw new Error(`assert-boundary-decode: source symlink is unsupported: ${file}`);
    }
    return stat?.isFile() === true;
  });

  for (const guarded of roots) {
    if (!present.some((file) => file.startsWith(`${guarded}/`))) {
      throw new Error(`assert-boundary-decode: source discovery omitted ${guarded}`);
    }
  }

  return present.flatMap((file) =>
    findBoundaryDecodeCasts(file, readFileSync(resolve(repoRoot, file), "utf8")),
  );
}

// ---- embedded self-test fixtures ------------------------------------------
const FIXTURES = [
  { name: "boundary cast fails", source: "const x = JSON.parse(s) as Foo;", expect: 1 },
  {
    name: "cast after parens fails",
    source: "const x = (JSON.parse(s)) as { a: number };",
    expect: 1,
  },
  {
    name: "double assertion fails once",
    source: "const x = JSON.parse(s) as unknown as Foo;",
    expect: 1,
  },
  { name: "unknown binding passes", source: "const x: unknown = JSON.parse(s);", expect: 0 },
  {
    name: "schema decode of a parse passes",
    source: "const x = decodeStrict(S, JSON.parse(s));",
    expect: 0,
  },
  { name: "non-JSON parse cast is ignored", source: "const x = parseYaml(s) as Foo;", expect: 0 },
  {
    name: "other object's parse cast is ignored",
    source: "const x = body.parse(s) as Foo;",
    expect: 0,
  },
];

export function runSelfTest(fixtures = FIXTURES) {
  let failed = 0;
  for (const fixture of fixtures) {
    const findings = findBoundaryDecodeCasts("fixture.ts", fixture.source);
    const passed = findings.length === fixture.expect;
    if (!passed) failed += 1;
    console.log(
      `  ${passed ? "ok  " : "FAIL"} fixture "${fixture.name}": expected ${String(fixture.expect)} finding(s), got ${String(findings.length)}`,
    );
  }
  return { ok: failed === 0, failed, total: fixtures.length };
}

function scopesFromArgs(args) {
  const index = args.indexOf("--scope");
  const value = index === -1 ? "all" : (args[index + 1] ?? "all");
  if (value === "all") return Object.keys(SCOPES);
  if (!Object.hasOwn(SCOPES, value)) {
    throw new Error(
      `assert-boundary-decode: unknown scope "${value}" (expected ${Object.keys(SCOPES).join(", ")})`,
    );
  }
  return [value];
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    console.log("assert-boundary-decode: self-test");
    const { ok, failed, total } = runSelfTest();
    if (!ok) {
      console.error(
        `assert-boundary-decode: self-test FAILED (${String(failed)}/${String(total)})`,
      );
      process.exit(1);
    }
    console.log(`assert-boundary-decode: self-test ok (${String(total)} fixtures)`);
    return;
  }

  for (const scope of scopesFromArgs(args)) {
    const findings = scanBoundaryDecodeCasts(root, SCOPES[scope]);
    if (findings.length > 0) {
      const detail = findings.map((f) => `  ${f.file}:${String(f.line)}`).join("\n");
      throw new Error(
        `assert-boundary-decode (${scope}): decode every external boundary with a strict schema ` +
          '(RULES.md "Schema and boundaries"); `JSON.parse(...) as T` is forbidden.\n' +
          detail,
      );
    }
  }
  console.log("assert-boundary-decode: ok (no boundary casts in the guarded scopes)");
}

function isEntrypoint() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.filename === resolve(process.argv[1]);
  } catch {
    return false;
  }
}

if (isEntrypoint()) {
  try {
    main();
  } catch (error) {
    console.error(
      `assert-boundary-decode: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
