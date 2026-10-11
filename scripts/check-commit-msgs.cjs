#!/usr/bin/env node
// Validates commit subjects against the Conventional Commits format used across
// the repository (see `git log --oneline`). Run it in CI over the pushed/PR
// range so a malformed subject cannot merge.
//
//   COMMIT_RANGE="origin/main..HEAD" node scripts/check-commit-msgs.cjs
//
// Defaults to the last commit (HEAD~1..HEAD). Merge, revert, fixup! and squash!
// commits are skipped. If the range cannot be resolved (e.g. a shallow checkout
// or a brand-new branch), the check is skipped rather than failed.
const { execFileSync } = require("child_process");

const range = process.env.COMMIT_RANGE || "HEAD~1..HEAD";
const TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
];
const SUBJECT = new RegExp(`^(${TYPES.join("|")})(\\([a-z0-9._/-]+\\))?!?: .+\\S$`);
const SKIP = /^(Merge |Revert |fixup!|squash!)/;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

let subjects;
try {
  subjects = git(["log", "--no-merges", "--format=%s", range]).split("\n").filter(Boolean);
} catch {
  console.log(`commit-msg check: range "${range}" is unavailable; skipping`);
  process.exit(0);
}

const bad = subjects.filter((subject) => !SKIP.test(subject) && !SUBJECT.test(subject));
if (bad.length > 0) {
  console.error(`commit-msg check: ${bad.length} subject(s) are not Conventional Commits:`);
  for (const subject of bad) console.error(`  ${subject}`);
  console.error(`Allowed types: ${TYPES.join(", ")} (e.g. "fix(combat): ...")`);
  process.exit(1);
}

console.log(`commit-msg check: ok (${subjects.length} subject(s) in "${range}")`);
