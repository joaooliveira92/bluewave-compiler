#!/usr/bin/env node
// migrate-dev-saves — the offline, explicitly versioned developer tool of
// ship-part-model ticket 11d (SPM-R21, proposal §9.1).
//
// It is NOT part of the desktop bundle and NOT a runtime save-loading path: the
// product refuses a mismatched save (ADR-0113). This tool brings a development
// save directory forward across a registered migration, atomically and
// recoverably, using the pure transform in `@bluewave/persistence`.
//
// Usage:
//   pnpm build   # the tool reads the built package
//   node tools/migrate-dev-saves/main.mjs --from 1.2.0 --to 2.0.0 --save <dir>
//
// `<dir>` may be a save directory (holding pointer.json) or a single save folder
// (holding campaign.json). The original is preserved as `<save>.1.2.0`.

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const VERSION = "1.2.0";
const TARGET = "2.0.0";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === "--from" || key === "--to" || key === "--save") {
      out[key.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.from !== VERSION || args.to !== TARGET) {
  console.error(
    `migrate-dev-saves: only the registered migration ${VERSION} -> ${TARGET} is supported ` +
      `(got --from ${args.from ?? "?"} --to ${args.to ?? "?"})`,
  );
  process.exit(2);
}
if (args.save === undefined) {
  console.error("migrate-dev-saves: --save <dir> is required");
  process.exit(2);
}

const persistence = resolve(
  import.meta.dirname,
  "..",
  "..",
  "packages",
  "persistence",
  "dist",
  "index.js",
);
if (!existsSync(persistence)) {
  console.error("migrate-dev-saves: build the workspace first (`pnpm build`)");
  process.exit(2);
}
const { migrateSaveDirectory } = await import(persistence);

const input = resolve(args.save);
const withPointer = join(input, "pointer.json");
let savePath = input;
if (!existsSync(join(input, "campaign.json")) && existsSync(withPointer)) {
  const pointer = JSON.parse(readFileSync(withPointer, "utf8"));
  savePath = join(input, pointer.activeSaveId);
}

const result = migrateSaveDirectory(savePath);
switch (result.status) {
  case "migrated":
    console.log(
      `migrate-dev-saves: migrated ${result.from} -> ${result.to}; original preserved at ${result.backup}`,
    );
    break;
  case "current":
    console.log(`migrate-dev-saves: already current (${result.to}); nothing to do`);
    break;
  default:
    console.error(`migrate-dev-saves: refused (${result.kind}): ${result.reason}`);
    process.exit(1);
}
