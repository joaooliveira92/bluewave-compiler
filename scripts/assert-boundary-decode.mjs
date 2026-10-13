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
//   --scope cli       apps/compiler-cli/src          (the bwc entry point)
//
// A site is a boundary cast when a `JSON.parse(...)` call (possibly wrapped in
// parens or a further `as unknown`) is asserted to a named type. `JSON.parse`
// into an `unknown` binding that is then schema-decoded is the required shape and
// is not flagged.
//
// The `cli` scope is the developer entry point ADR-0151 §Alternatives protects:
// every file `bwc` reads is either its own written artifact (campaign state,
// command ledger, final hash) or a hand-authored debug fixture whose contents
// the engine validates downstream (CommandLifecycle, ReplayVerifier, the combat
// invariants). Decoding them at the CLI would duplicate fast-evolving domain
// schemas, so each of the known sites is a reviewed, justified ALLOWLIST entry
// (ADR-0151 §2) rather than an unexamined scope gap: the scope still ratchets,
// and a NEW `JSON.parse(...) as T` in `compiler-cli` fails closed.
//
// Usage: `node scripts/assert-boundary-decode.mjs [--scope compiler|desktop|cli|all] [--self-test]`
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
  cli: ["apps/compiler-cli/src"],
};

/**
 * Reviewed exceptions, keyed by file then by the whitespace-normalised source of
 * the cast expression, each with the number of occurrences the exception covers
 * and a one-line justification (ADR-0151 §2). The count keeps the ratchet
 * honest: the same cast appearing once more than its allowance is a new finding.
 * Entries here only ever shrink; a rewritten cast is treated as new and must be
 * re-reviewed.
 *
 * These are the `bwc` entry point's file→state reads, which F3 showed are not
 * display-only but which cannot be honestly decoded at the CLI: their formats
 * (`CommandEnvelope<CommandBody>`, `TacticalBattleState`, `GunneryAccuracyFactors`,
 * the CLI's own `campaign-state.json`) have no schema, and the one that does
 * (`StorableCampaignStateSchema`) is deliberately shallow, so decoding it would
 * need the same `as unknown as` narrow `packages/persistence/src/store.ts:447`
 * already carries. The engine validates every read downstream, so these are
 * recorded exceptions, not an unexamined scope gap.
 * @type {Readonly<Record<string, Readonly<Record<string, {count: number, reason: string}>>>>}
 */
export const ALLOWLIST = {
  "apps/compiler-cli/src/commands.ts": {
    'JSON.parse(readFileSync(statePath, "utf8")) as CampaignState': {
      count: 1,
      reason:
        "bwc campaign:save re-reads the campaign-state.json its own campaign:compile wrote; SaveStore re-hashes it and any later load re-decodes it through StorableCampaignStateSchema.",
    },
    'JSON.parse(readFileSync(resolvedPath, "utf8")) as BattleAdvanceMinuteFile': {
      count: 1,
      reason:
        "bwc battle:advance-minute reads a hand-authored debug fixture; advanceMinute validates the tactical invariants downstream (TACTICAL_STATE_INVARIANT_FAILED).",
    },
    'JSON.parse(readFileSync(resolvedPath, "utf8")) as GunneryResolveShotFile': {
      count: 1,
      reason:
        "bwc gunnery:resolve-shot reads a hand-authored debug fixture; the gunnery primitives validate the factors downstream (GUNNERY_ACCURACY_FACTOR_MISSING).",
    },
    'JSON.parse(readFileSync(commandsPath, "utf8")) as CommandEnvelope<CommandBody>[]': {
      count: 1,
      reason:
        "bwc replay re-reads the commands.json its own turn:execute wrote; ReplayVerifier re-runs each command through CommandLifecycle (no CommandBody schema exists to decode it).",
    },
    'JSON.parse(readFileSync(ledgerPath, "utf8")) as unknown[]': {
      count: 1,
      reason:
        "bwc replay re-reads its own command-ledger.json and feeds it to CommandLedger; each outcome is re-added and re-hashed by ReplayVerifier.",
    },
    'JSON.parse(readFileSync(finalHashPath, "utf8")) as { finalSnapshotHash: string; }': {
      count: 1,
      reason:
        "bwc replay re-reads its own final-hash.json; ReplayVerifier recomputes and compares the hash rather than trusting the file.",
    },
    'JSON.parse(readFileSync(allowlistPath, "utf8")) as { allow?: unknown }': {
      count: 1,
      reason:
        "bwc content:gate reads the authored placeholder allowlist; only the `allow` array is read and each entry is validated by checkPlaceholderGate.",
    },
  },
  "apps/compiler-cli/src/main.ts": {
    "JSON.parse(raw) as CommandEnvelope<CommandBody>[]": {
      count: 1,
      reason:
        "bwc turn:execute reads the caller's --commands file; each envelope runs through CommandLifecycle.validate at issue time (no CommandBody schema exists to decode it).",
    },
  },
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

/** Whitespace-normalised source text, so an allowlist key survives reformatting. */
function normalize(text) {
  return text.replace(/\s+/gu, " ").trim();
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
 * @returns {Array<{file: string, line: number, snippet: string}>}
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
        findings.push({
          file: normalized,
          line: lineAt(text, base.start),
          snippet: normalize(text.slice(node.start, node.end)),
        });
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
 * Drop the findings a reviewed allowlist entry covers, keyed by file then
 * whitespace-normalised cast source, consuming one unit of each entry's
 * occurrence allowance per match (ADR-0151 §2). A duplicate cast beyond its
 * allowance is kept, so a new assertion is never silently admitted.
 * @param {ReadonlyArray<{file: string, line: number, snippet: string}>} findings
 * @param {Readonly<Record<string, Readonly<Record<string, {count: number}>>>>} allowlist
 * @returns {Array<{file: string, line: number, snippet: string}>}
 */
export function filterAllowlisted(findings, allowlist) {
  const remaining = new Map(
    Object.entries(allowlist).map(([file, entries]) => [
      file,
      new Map(Object.entries(entries).map(([snippet, entry]) => [snippet, entry.count])),
    ]),
  );
  const kept = [];
  for (const finding of findings) {
    const byFile = remaining.get(finding.file);
    const left = byFile?.get(finding.snippet) ?? 0;
    if (left > 0) byFile.set(finding.snippet, left - 1);
    else kept.push(finding);
  }
  return kept;
}

/**
 * Scan the authored (non-test) source under the given roots for boundary casts,
 * dropping the sites a reviewed allowlist entry covers.
 * @param {string} repoRoot
 * @param {readonly string[]} roots source prefixes
 * @param {Readonly<Record<string, Readonly<Record<string, {count: number}>>>>} allowlist
 * @returns {Array<{file: string, line: number, snippet: string}>}
 */
export function scanBoundaryDecodeCasts(repoRoot, roots, allowlist = ALLOWLIST) {
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

  return filterAllowlisted(
    present.flatMap((file) =>
      findBoundaryDecodeCasts(file, readFileSync(resolve(repoRoot, file), "utf8")),
    ),
    allowlist,
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
      const detail = findings.map((f) => `  ${f.file}:${String(f.line)} — ${f.snippet}`).join("\n");
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
