#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  runValidate,
  runCompile,
  runInspect,
  runVerify,
  runCompare,
  runCampaignCompile,
  runCampaignSave,
  runCampaignLoad,
  runTurnExecute,
  runReplay,
  type CliOptions,
  type CampaignCliOptions,
  type OutputMode,
  type ExitCategory,
} from "./commands.js";

const USAGE = `
Usage: bwc <command> [options]

Commands:
  validate           Validate content pack without producing output
  compile            Compile content pack to canonical artifact
  inspect            Inspect compiled artifact and envelope
  verify             Verify compiled artifact against envelope
  compare            Compare compiled artifact hash against envelope
  campaign:compile   Compile 1880 fixture to campaign state
  campaign:save      Save campaign state to persistence store
  campaign:load      Load and verify campaign state from persistence store
  turn:execute       Execute one month, save new state
  replay             Replay all commands from a save and verify hashes

General options:
  --manifest <path>     Path to pack manifest (default: pack.json)
  --content-dir <path>  Content directory (default: content/)
  --output-dir <path>   Output directory (default: out/)
  --save-dir <path>     Save directory (default: saves/)
  --seed <string>       Random seed for deterministic RNG (default: "default-seed")
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

  const existingCommands = ["validate", "compile", "inspect", "verify", "compare"];
  const newCommands = ["campaign:compile", "campaign:save", "campaign:load", "turn:execute", "replay"];
  const allCommands = [...existingCommands, ...newCommands];

  if (!allCommands.includes(command)) {
    process.stderr.write(`Unknown command: ${command}\n`);
    process.stderr.write(USAGE);
    process.exit(1);
  }

  const isNew = newCommands.includes(command);
  const options = parseOptions(args.slice(1), isNew);
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
    case "campaign:compile": {
      const co = options as CampaignCliOptions;
      exitCategory = runCampaignCompile(co);
      break;
    }
    case "campaign:save": {
      const co = options as CampaignCliOptions;
      exitCategory = runCampaignSave(co, co.saveDir);
      break;
    }
    case "campaign:load": {
      const co = options as CampaignCliOptions;
      exitCategory = runCampaignLoad(co, co.saveDir);
      break;
    }
    case "turn:execute": {
      const co = options as CampaignCliOptions;
      exitCategory = runTurnExecute(co, co.saveDir);
      break;
    }
    case "replay": {
      const co = options as CampaignCliOptions;
      exitCategory = runReplay(co, co.saveDir);
      break;
    }
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

function parseOptions(argv: string[], extended = false): CliOptions | CampaignCliOptions {
  let manifest = "pack.json";
  let contentDir = "content";
  let outputDir = "out";
  let saveDir = "saves";
  let seed = "default-seed";
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
      case "--save-dir":
        saveDir = argv[++i] ?? saveDir;
        break;
      case "--seed":
        seed = argv[++i] ?? seed;
        break;
      case "--json":
        outputMode = "json";
        break;
    }
  }

  if (extended) {
    return { manifest, contentDir, outputDir, outputMode, saveDir, seed };
  }
  return { manifest, contentDir, outputDir, outputMode };
}

main();