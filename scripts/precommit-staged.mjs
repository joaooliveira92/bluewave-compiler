#!/usr/bin/env node
// Fast staged-file format check for the `pre-commit` hook (ADR-0107 follow-up).
//
// The hook's `preflight` set checks git state, docs, dependency and determinism
// guards but never ran a formatter, so unformatted files kept landing and were
// only caught later by `pnpm check`/CI. This checks only the files staged for the
// pending commit, so it stays fast. Markdown/YAML/JSON are included only when
// Oxfmt is configured to handle them (it decides; unmatched paths are ignored).
//
// Bypass a deliberate exception with `git commit --no-verify`; CI re-runs
// `pnpm format` over the whole tree regardless.

import { execFileSync } from "node:child_process";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();

function stagedFiles() {
  const out = execFileSync(
    "git",
    ["-C", root, "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z", "--"],
    { encoding: "utf8" },
  );
  return out
    .split("\0")
    .map((path) => path.trim())
    .filter((path) => path !== "" && !path.endsWith(".png") && !path.endsWith(".ico"));
}

// A merge/rebase commit has no meaningful staged set to format-check.
try {
  execFileSync("git", ["-C", root, "rev-parse", "-q", "--verify", "MERGE_HEAD"], {
    stdio: "ignore",
  });
  console.log("precommit format: merge in progress; skipping staged format check");
  process.exit(0);
} catch {
  // no merge in progress
}

const files = stagedFiles();
if (files.length === 0) {
  console.log("precommit format: no staged files; skipping");
  process.exit(0);
}

try {
  execFileSync(
    "pnpm",
    ["exec", "vp", "fmt", "--check", "--no-error-on-unmatched-pattern", ...files],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
} catch {
  console.error(
    "precommit format: staged files are not formatted. Run `pnpm format:fix` (or `git commit --no-verify` if intentional).",
  );
  process.exit(1);
}
console.log(`precommit format: ok (${files.length} staged file(s))`);
