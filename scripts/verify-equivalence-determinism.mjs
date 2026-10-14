#!/usr/bin/env node
// Cross-process determinism proof for the ship-part equivalence report (SPM-R24):
// run the harness test in two fresh processes and require the report's SHA-256 to match.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "packages",
  "ship-design",
);

function runOnce() {
  const out = execFileSync(
    "pnpm",
    ["exec", "vp", "test", "run", "--reporter=verbose", "test/equivalenceHarness.test.ts"],
    {
      cwd: pkg,
      encoding: "utf8",
      timeout: 300000,
    },
  );
  const m = /EQUIVALENCE_REPORT_SHA256 ([0-9a-f]{64})/.exec(out);
  if (m === null) throw new Error("equivalence report hash not found in test output");
  return m[1];
}

const first = runOnce();
const second = runOnce();
if (first !== second) {
  console.error(`equivalence determinism: runs differ\n${first}\n${second}`);
  process.exit(1);
}
console.log(`equivalence determinism: two fresh processes byte-identical (sha256 ${first})`);
