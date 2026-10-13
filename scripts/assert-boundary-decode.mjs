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
// The `cli` scope is the developer entry point ADR-0151 §Alternatives protects.
// Its file→state reads are decoded where an honest schema exists — campaign
// state (`StorableCampaignStateSchema`), the command ledger, the final hash and
// the placeholder allowlist — and the rest are a reviewed, justified ALLOWLIST
// (ADR-0151 §2): `CommandEnvelope<CommandBody>` (no `CommandBody` schema exists
// anywhere) and the two hand-authored debug fixtures whose malformed contents
// the combat engine is meant to reject downstream. The scope still ratchets: a
// NEW `JSON.parse(...) as T` in `compiler-cli` fails closed.
//
// Usage: `node scripts/assert-boundary-decode.mjs [--scope compiler|desktop|cli|all] [--self-test] [--strict]`
//   (`--strict` fails on a stale allowlist entry; CI is always strict)
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
 * The key is the raw normalised cast source rather than ADR-0106 §1's hashed
 * fingerprint: ADR-0151 §2 requires the allowlist to be human-visible, and these
 * few entry-point exceptions read better spelled out than hashed. ADR-0151 §2
 * records this as the one deviation from the hashed-fingerprint convention.
 *
 * Only the genuinely unmodelled reads remain. `CommandEnvelope<CommandBody>` at
 * `main.ts:251` / `commands.ts:827` has no schema anywhere (the desktop's
 * `campaignCommandSchemas.ts` holds IPC wire payloads, not `CommandBody`), and
 * the `BattleAdvanceMinuteFile` / `GunneryResolveShotFile` fixtures are
 * hand-authored debug inputs whose malformed contents the combat engine is meant
 * to reject downstream (the tests assert `TACTICAL_STATE_INVARIANT_FAILED` /
 * `GUNNERY_ACCURACY_FACTOR_MISSING` reach the adapter). Decoding them at the CLI
 * would change behaviour. Every other `bwc` file→state read is decoded.
 * @type {Readonly<Record<string, Readonly<Record<string, {count: number, reason: string}>>>>}
 */
export const ALLOWLIST = {
  "apps/compiler-cli/src/commands.ts": {
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
 * Split the findings into those no allowlist entry covers (`kept`) and the
 * allowlist entries whose occurrence allowance was not fully consumed (`stale`),
 * keyed by file then whitespace-normalised cast source, consuming one unit of
 * each entry's occurrence allowance per match (ADR-0151 §2). A duplicate cast
 * beyond its allowance is kept, so a new assertion is never silently admitted; a
 * fully-unused entry is stale, so a removed assertion must shrink the allowlist.
 * @param {ReadonlyArray<{file: string, line: number, snippet: string}>} findings
 * @param {Readonly<Record<string, Readonly<Record<string, {count: number}>>>>} allowlist
 * @returns {{kept: Array<{file: string, line: number, snippet: string}>, stale: Array<{file: string, snippet: string, remaining: number}>}}
 */
export function partitionAllowlist(findings, allowlist) {
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
  const stale = [];
  for (const [file, entries] of remaining) {
    for (const [snippet, left] of entries) {
      if (left > 0) stale.push({ file, snippet, remaining: left });
    }
  }
  return { kept, stale };
}

/**
 * Drop the findings a reviewed allowlist entry covers (see
 * {@link partitionAllowlist}). Kept for callers that only need the surviving
 * findings; the gate itself uses `partitionAllowlist` so it can also fail closed
 * on stale entries.
 * @param {ReadonlyArray<{file: string, line: number, snippet: string}>} findings
 * @param {Readonly<Record<string, Readonly<Record<string, {count: number}>>>>} allowlist
 * @returns {Array<{file: string, line: number, snippet: string}>}
 */
export function filterAllowlisted(findings, allowlist) {
  return partitionAllowlist(findings, allowlist).kept;
}

/**
 * True when the run should treat stale allowlist entries as fatal. CI is the
 * authority on the committed tree, so it is strict; a local run only warns,
 * because a concurrent editor removing a cast elsewhere must not block an
 * unrelated commit (ADR-0107). `--strict` opts a local run in. Mirrors
 * `verify-no-unknown-casts.mjs`.
 * @returns {boolean}
 */
export function isStrictEnvironment(env = process.env) {
  const value = env.CI;
  return value !== undefined && value !== "" && value !== "0" && value.toLowerCase() !== "false";
}

/**
 * Scan the authored (non-test) source under the given roots for boundary casts,
 * dropping the sites a reviewed allowlist entry covers. Fails closed on a stale
 * allowlist entry (one whose cast was removed) when `strict`, and warns
 * otherwise (ADR-0151 §2: entries may only shrink).
 * @param {string} repoRoot
 * @param {readonly string[]} roots source prefixes
 * @param {Readonly<Record<string, Readonly<Record<string, {count: number}>>>>} allowlist
 * @param {boolean} strict treat stale allowlist entries as fatal
 * @returns {Array<{file: string, line: number, snippet: string}>}
 */
export function scanBoundaryDecodeCasts(repoRoot, roots, allowlist = ALLOWLIST, strict = false) {
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

  const raw = present.flatMap((file) =>
    findBoundaryDecodeCasts(file, readFileSync(resolve(repoRoot, file), "utf8")),
  );
  const scopedAllowlist = Object.fromEntries(
    Object.entries(allowlist).filter(([file]) =>
      roots.some((prefix) => file.startsWith(`${prefix}/`)),
    ),
  );
  const { kept, stale } = partitionAllowlist(raw, scopedAllowlist);
  if (stale.length > 0) {
    const detail = stale
      .map((entry) => `  ${entry.file} — ${entry.snippet} (${String(entry.remaining)} unused)`)
      .join("\n");
    const message =
      "assert-boundary-decode: stale allowlist entr" +
      (stale.length === 1 ? "y" : "ies") +
      " — the cast was removed, so remove the entry (ADR-0151 §2: entries may only shrink).\n" +
      detail;
    if (strict) throw new Error(message);
    console.warn(message);
  }
  return kept;
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

  const strict = args.includes("--strict") || isStrictEnvironment();
  for (const scope of scopesFromArgs(args)) {
    const findings = scanBoundaryDecodeCasts(root, SCOPES[scope], ALLOWLIST, strict);
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
