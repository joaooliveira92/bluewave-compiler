#!/usr/bin/env node
import { readFileSync } from "node:fs";
import type { CommandEnvelope, CommandBody } from "@bluewave/commands";
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
  runBattleGenerate,
  runBattleAdvanceMinute,
  runGunneryResolveShot,
  type CampaignCliOptions,
  type BattleGenerateCliOptions,
  type ExitCategory,
} from "./commands.js";
import {
  exitCodes,
  parseOptions,
  parseBattleAdvanceMinuteOptions,
  parseGunneryResolveShotOptions,
} from "./options.js";

const USAGE = `Usage: bwc <command> [options]
Commands:
  validate           Validate content pack without producing output
  compile            Compile content pack to canonical artifact
  inspect            Inspect compiled artifact and envelope
  verify             Verify compiled artifact against envelope
  compare            Compare compiled artifact hash against envelope
  campaign:compile   Compile content pack (incl. fleets/economy/construction/
                      diplomacy/research/designs) to campaign state
  campaign:save      Save campaign state to persistence store
  campaign:load      Load and verify campaign state from persistence store
  turn:execute       Execute one month, save new state
  replay             Replay all commands from a save and verify hashes
  battle:generate    Run battle generation (@bluewave/combat) against a saved
                      snapshot in isolation, without running a full turn
  battle:advance-minute
                      Run one tactical minute-advance (@bluewave/combat,
                      DESIGN-38 movement/spotting) against a hand-authored
                      TacticalBattleState JSON file
  gunnery:resolve-shot
                      Resolve one gunnery shot (@bluewave/combat, DESIGN-39
                      §3/§28 accuracy + hit + ammunition) against a
                      hand-authored scenario JSON file
General options:
  --manifest <path>     Path to pack manifest (default: pack.json)
  --content-dir <path>  Content directory (default: content/)
  --output-dir <path>   Output directory (default: out/)
  --save-dir <path>     Save directory (default: saves/)
  --seed <string>       Random seed for deterministic RNG (default: "default-seed")
  --commands <path>     Path to a JSON file of CommandEnvelope[] to submit for
                         turn:execute (budget, research priority, design,
                         diplomacy/war, AI, etc.)
  --json                Output in JSON format
  --help                Show this help
battle:generate options:
  --campaign-month <string>   Month to generate battles for (default: the
                               loaded snapshot's turnNumber)
  --ruleset-version <string>  Ruleset version passed to generateBattles
                               (default: the loaded snapshot's rulesetVersion)
  --rng-version <string>      RNG version passed to generateBattles
                               (default: "1", matching turn:execute)
  --formula-version <string>  Formula version passed to generateBattles
                               (default: "1", matching turn:execute)
  --content-version <string>  Content version passed to generateBattles
                               (default: "0.1.0", matching turn:execute)
battle:advance-minute options:
  --state <path>              Required. Path to a JSON file with shape
                               { state: TacticalBattleState, orders?:
                               Record<assetId, { orderedHeading: number,
                               orderedSpeedBp: number, attainableMaxBp?:
                               number }>, attackRangeUm?: number }. There is
                               no fixture generator yet — hand-author this
                               file against @bluewave/combat's
                               TacticalBattleState/MovementState/
                               TacticalContact types (see
                               packages/combat/src/tactical/state.ts and
                               packages/combat/test/simulation/advance.test.ts
                               for a worked example). Movement/spotting only
                               (steps 4-8) — no gunnery in this command.
  --minute <number>            Minute number to advance (default: 1)
  --observation-time <string>  ISO timestamp passed to spotting resolution
                               (default: "1900-01-01T00:00:00.000Z")
gunnery:resolve-shot options:
  --input <path>        Required. Path to a JSON file with shape
                         { identity: { battleId, batteryId, minute, substep },
                         accuracyFactors: { baseAccuracyBp, fireControl, crew,
                         officer, training, range, visibility, radar,
                         ownManeuver, targetManeuver, previousSalvo, seaState,
                         smoke, damage, multipleAttacker, glare,
                         targetEvasion } (all integer basis points; see
                         packages/combat/src/gunnery/constants.ts for the
                         canonical factor list), salvo: { count, ammunition:
                         { ARMOR_PIERCING, COMMON, HIGH_EXPLOSIVE },
                         preferredType, permittedTypes? } }. There is no
                         fixture generator yet — hand-author against
                         @bluewave/combat's GunneryAccuracyFactors/
                         AmmunitionType types (see
                         packages/combat/test/gunnery/accuracy.test.ts and
                         ammunition.test.ts for worked examples).
  --seed <string>        RandomEngine master seed for the keyed hit draw
                         (default: "default-seed")`;

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(USAGE);
    process.exit(0);
  }
  const command = args[0] as string;
  const existingCommands = ["validate", "compile", "inspect", "verify", "compare"];
  const newCommands = [
    "campaign:compile",
    "campaign:save",
    "campaign:load",
    "turn:execute",
    "replay",
  ];
  const battleGenerateCommands = ["battle:generate"];
  const battleAdvanceMinuteCommands = ["battle:advance-minute"];
  const gunneryResolveShotCommands = ["gunnery:resolve-shot"];
  const allCommands = [
    ...existingCommands,
    ...newCommands,
    ...battleGenerateCommands,
    ...battleAdvanceMinuteCommands,
    ...gunneryResolveShotCommands,
  ];
  if (!allCommands.includes(command)) {
    process.stderr.write(`Unknown command: ${command}\n`);
    process.stderr.write(USAGE);
    process.exit(1);
  }
  if (battleAdvanceMinuteCommands.includes(command)) {
    const bo = parseBattleAdvanceMinuteOptions(args.slice(1));
    process.exit(exitCodes[runBattleAdvanceMinute(bo)]);
  }
  if (gunneryResolveShotCommands.includes(command)) {
    const go = parseGunneryResolveShotOptions(args.slice(1));
    process.exit(exitCodes[runGunneryResolveShot(go)]);
  }
  const isBattleGenerate = battleGenerateCommands.includes(command);
  const isNew = newCommands.includes(command) || isBattleGenerate;
  const options = parseOptions(args.slice(1), isNew, isBattleGenerate);
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
      const commands = loadCommandsFile(co.commandsPath);
      if (commands === "error") {
        process.stderr.write(`Failed to parse commands file: ${co.commandsPath}\n`);
        exitCategory = "usage-error";
        break;
      }
      exitCategory = runTurnExecute(co, co.saveDir, commands);
      break;
    }
    case "replay": {
      const co = options as CampaignCliOptions;
      exitCategory = runReplay(co, co.saveDir);
      break;
    }
    case "battle:generate": {
      const bo = options as BattleGenerateCliOptions;
      exitCategory = runBattleGenerate(bo, bo.saveDir);
      break;
    }
    default:
      exitCategory = "usage-error";
  }
  process.exit(exitCodes[exitCategory]);
}

function loadCommandsFile(
  path: string | undefined,
): CommandEnvelope<CommandBody>[] | undefined | "error" {
  if (!path) return undefined;
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw) as CommandEnvelope<CommandBody>[];
  } catch {
    return "error";
  }
}

// prevent auto-run when imported in vitest
if (!process.env.VITEST) {
  main();
}
