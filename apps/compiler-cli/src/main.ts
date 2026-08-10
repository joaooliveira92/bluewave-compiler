#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  runValidate,
  runCompile,
  runInspect,
  runVerify,
  runCompare,
  type CliOptions,
  type OutputMode,
  type ExitCategory,
} from "./commands.js";

const USAGE = `
Usage: bwc <command> [options]

Commands:
  validate   Validate content pack without producing output
  compile    Compile content pack to canonical artifact
  inspect    Inspect compiled artifact and envelope
  verify     Verify compiled artifact against envelope
  compare    Compare compiled artifact hash against envelope

Options:
  --manifest <path>     Path to pack manifest (default: pack.json)
  --content-dir <path>  Content directory (default: content/)
  --output-dir <path>   Output directory (default: out/)
  --json                Output in JSON format
  --help                Show this help
`;

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  const command = args[0] as string;

  if (!["validate", "compile", "inspect", "verify", "compare"].includes(command)) {
    process.stderr.write(`Unknown command: ${command}\n`);
    process.stderr.write(USAGE);
    process.exit(1);
  }

  const options = parseOptions(args.slice(1));
  let exitCategory: ExitCategory;

  switch (command) {
    case "validate":
      exitCategory = runValidate(options);
      break;
    case "compile":
      exitCategory = runCompile(options);
      break;
    case "inspect":
      exitCategory = runInspect(options);
      break;
    case "verify":
      exitCategory = runVerify(options);
      break;
    case "compare":
      exitCategory = runCompare(options);
      break;
    default:
      exitCategory = "usage-error";
  }

  const exitCodes: Record<ExitCategory, number> = {
    success: 0,
    "validation-error": 1,
    "compile-error": 2,
    aborted: 3,
    "internal-error": 4,
    "usage-error": 5,
  };

  process.exit(exitCodes[exitCategory]);
}

function parseOptions(argv: string[]): CliOptions {
  let manifest = "pack.json";
  let contentDir = "content";
  let outputDir = "out";
  let outputMode: OutputMode = "human";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--manifest":
        manifest = argv[++i] ?? manifest;
        break;
      case "--content-dir":
        contentDir = argv[++i] ?? contentDir;
        break;
      case "--output-dir":
        outputDir = argv[++i] ?? outputDir;
        break;
      case "--json":
        outputMode = "json";
        break;
    }
  }

  return { manifest, contentDir, outputDir, outputMode };
}

main();
