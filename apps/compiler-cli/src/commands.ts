import { Compiler } from "@bluewave/content-compiler";
import type { CompilerInput } from "@bluewave/content-compiler";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, normalize, join } from "node:path";
import {
  canonicalSerialize,
  sha256Hex,
  createEnvelope,
  verifyEnvelope,
} from "@bluewave/deterministic";
import {
  CampaignCompiler,
  type CampaignCompilerInput,
  type CampaignFiles,
} from "@bluewave/campaign";
import { SaveStore } from "@bluewave/persistence";
import type {
  CampaignState,
  CampaignSnapshot,
  NationState,
  BattleInstance,
  BattleManifest,
} from "@bluewave/campaign";
import type { CommandEnvelope, CommandBody, CommandOutcome } from "@bluewave/commands";
import { CommandLedger } from "@bluewave/commands";
import { MonthExecutor, ReplayVerifier, resolveShipStrength } from "@bluewave/phase-engine";
import {
  generateBattles,
  advanceMinute,
  resolveAccuracy,
  resolveHit,
  reserveAndConsumeAmmunition,
  type BattleGenerationResult,
  type MinuteResult,
  type TacticalBattleState,
  type UnitOrders,
  type GunneryAccuracyFactors,
  type AmmunitionType,
  type AccuracyResolution,
  type KeyedHitDraw,
  type AmmunitionReserve,
} from "@bluewave/combat";
import { RandomEngine } from "@bluewave/random";
import { runCombatOperation } from "./combatDiagnostics.js";

export type OutputMode = "human" | "json";
export type ExitCategory =
  | "success"
  | "validation-error"
  | "compile-error"
  | "aborted"
  | "internal-error"
  | "usage-error";

export interface CliOptions {
  manifest: string;
  contentDir: string;
  outputDir: string;
  outputMode: OutputMode;
}

export function runValidate(options: CliOptions): ExitCategory {
  const collector = new DiagnosticCollector();
  const input = buildInput(options, collector);
  if (!input) return "usage-error";
  const compiler = new Compiler();
  const signal = new AbortController().signal;
  const output = compiler.compile(input, signal, collector);
  printDiagnostics(collector, options.outputMode);
  if (collector.hasErrors) return "validation-error";
  if (!output) return "compile-error";
  printResult("Validation passed", options.outputMode);
  return "success";
}

export function runCompile(options: CliOptions): ExitCategory {
  const collector = new DiagnosticCollector();
  const input = buildInput(options, collector);
  if (!input) return "usage-error";
  const compiler = new Compiler();
  const signal = new AbortController().signal;
  const output = compiler.compile(input, signal, collector);
  printDiagnostics(collector, options.outputMode);
  if (collector.hasErrors) return "validation-error";
  if (!output) return "compile-error";
  const outDir = resolve(options.outputDir);
  mkdirSync(outDir, { recursive: true });
  const envelope = createEnvelope("content-pack", "0.1.0", output.pack);
  const artifactPath = resolve(outDir, "artifact.json");
  const envelopePath = resolve(outDir, "artifact.sig.json");
  const tempArtifact = artifactPath + ".tmp";
  const tempEnvelope = envelopePath + ".tmp";
  try {
    const artifactJson = canonicalSerialize(output.pack);
    const envelopeJson = canonicalSerialize(envelope);
    writeFileSync(tempArtifact, artifactJson, "utf8");
    writeFileSync(tempEnvelope, envelopeJson, "utf8");
    rmSync(artifactPath, { force: true });
    rmSync(envelopePath, { force: true });
    writeFileSync(artifactPath, artifactJson, "utf8");
    writeFileSync(envelopePath, envelopeJson, "utf8");
  } finally {
    rmSync(tempArtifact, { force: true });
    rmSync(tempEnvelope, { force: true });
  }
  if (options.outputMode === "json") {
    printResult(
      JSON.stringify({
        artifactHash: output.rawHash,
        envelopeHash: output.envelopeHash,
        artifactPath,
        envelopePath,
      }),
      "human",
    );
  } else {
    printResult(`Compiled successfully`, "human");
    printResult(`  Artifact: ${artifactPath} (SHA-256: ${output.rawHash})`, "human");
    printResult(`  Envelope: ${envelopePath} (SHA-256: ${output.envelopeHash})`, "human");
  }
  return "success";
}

export function runInspect(options: CliOptions): ExitCategory {
  const artifactPath = resolve(options.outputDir, "artifact.json");
  const envelopePath = resolve(options.outputDir, "artifact.sig.json");
  if (!existsSync(artifactPath)) {
    printResult(`Artifact not found at ${artifactPath}`, "human");
    return "usage-error";
  }
  if (!existsSync(envelopePath)) {
    printResult(`Envelope not found at ${envelopePath}`, "human");
    return "usage-error";
  }
  try {
    const artifactJson = readFileSync(artifactPath, "utf8");
    const envelopeJson = readFileSync(envelopePath, "utf8");
    const envelope = JSON.parse(envelopeJson);
    const computedHash = sha256Hex(artifactJson);
    const valid = computedHash === envelope.bodyHash;
    if (options.outputMode === "json") {
      printResult(
        JSON.stringify({ artifactHash: computedHash, envelope, valid }, null, 2),
        "human",
      );
    } else {
      printResult(`Artifact: ${artifactPath}`, "human");
      printResult(`  Size: ${Buffer.byteLength(artifactJson, "utf8")} bytes`, "human");
      printResult(`  SHA-256: ${computedHash}`, "human");
      printResult(`Envelope:`, "human");
      printResult(`  Algorithm: ${envelope.algorithm}`, "human");
      printResult(`  Kind: ${envelope.artifactKind}`, "human");
      printResult(`  Version: ${envelope.compatibilityVersion}`, "human");
      printResult(`  Body Hash: ${envelope.bodyHash}`, "human");
      printResult(`  Body Length: ${envelope.bodyLength}`, "human");
      printResult(`  Status: ${valid ? "VALID" : "INVALID - hash mismatch"}`, "human");
    }
    return valid ? "success" : "validation-error";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printResult(`Failed to inspect: ${message}`, "human");
    return "internal-error";
  }
}

export function runVerify(options: CliOptions): ExitCategory {
  return runInspect(options);
}

export function runCompare(options: CliOptions): ExitCategory {
  const artifactPath = resolve(options.outputDir, "artifact.json");
  const envelopePath = resolve(options.outputDir, "artifact.sig.json");
  if (!existsSync(artifactPath)) {
    printResult(`Artifact not found at ${artifactPath}`, "human");
    return "usage-error";
  }
  try {
    const artifactJson = readFileSync(artifactPath, "utf8");
    const envelopeJson = readFileSync(envelopePath, "utf8");
    const artifact = JSON.parse(artifactJson);
    const envelope = JSON.parse(envelopeJson);
    const computedHash = sha256Hex(artifactJson);
    const valid = verifyEnvelope(envelope, artifact);
    if (options.outputMode === "json") {
      printResult(
        JSON.stringify(
          {
            recomputedHash: computedHash,
            envelopeBodyHash: envelope.bodyHash,
            hashMatch: computedHash === envelope.bodyHash,
            envelopeValid: valid,
          },
          null,
          2,
        ),
        "human",
      );
    } else {
      printResult(`Comparison:`, "human");
      printResult(`  Re-computed SHA-256: ${computedHash}`, "human");
      printResult(`  Envelope bodyHash:   ${envelope.bodyHash}`, "human");
      printResult(
        `  Hash match:          ${computedHash === envelope.bodyHash ? "YES" : "NO"}`,
        "human",
      );
      printResult(`  Envelope valid:      ${valid ? "YES" : "NO"}`, "human");
    }
    return valid ? "success" : "validation-error";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printResult(`Failed to compare: ${message}`, "human");
    return "internal-error";
  }
}

export interface CampaignCliOptions extends CliOptions {
  saveDir: string;
  seed: string;
  commandsPath?: string;
}

export interface BattleGenerateCliOptions extends CampaignCliOptions {
  campaignMonth?: string;
  rngVersion: string;
  formulaVersion: string;
  rulesetVersion?: string;
  contentVersion: string;
}

export interface BattleAdvanceMinuteCliOptions {
  outputMode: OutputMode;
  statePath?: string;
  minute: number;
  observationTime: string;
}

/**
 * File shape read from `--state <path>` for `battle:advance-minute`: the
 * hand-authored TacticalBattleState plus the two optional AdvanceMinuteInput
 * fields (`orders`, `attackRangeUm`) that are keyed/structured enough to
 * belong in the JSON rather than on the command line. `minute` and
 * `observationTime` are simple scalars and live as CLI flags instead, so a
 * caller can re-run the same state file at different minutes without
 * editing it. `engine`/`gunnery` are intentionally unsupported in v1 — this
 * command exercises movement/spotting only, matching the map's scope
 * (gunnery gets its own bundled `gunnery:resolve-shot` command).
 */
interface BattleAdvanceMinuteFile {
  state: TacticalBattleState;
  orders?: Record<string, UnitOrders>;
  attackRangeUm?: number;
}

export interface GunneryResolveShotCliOptions {
  outputMode: OutputMode;
  inputPath?: string;
  seed: string;
}

/**
 * File shape read from `--input <path>` for `gunnery:resolve-shot`. Gunnery
 * has no single `resolveGunnery` entry point — only composable primitives —
 * so this bundles the "what happens on one shot" subset (§3 accuracy, §3
 * hit check, §28 ammunition) into one scenario file. `identity` (battle/
 * battery/minute/substep) is nested here rather than split across CLI flags
 * since it's one cohesive object the keyed hit-draw stream id is derived
 * from; only `--seed` (the RandomEngine master seed) is a flag, mirroring
 * this CLI's existing `--seed` convention.
 */
interface GunneryResolveShotFile {
  identity: { battleId: string; batteryId: string; minute: number; substep: number };
  accuracyFactors: GunneryAccuracyFactors;
  salvo: {
    count: number;
    ammunition: Record<AmmunitionType, number>;
    preferredType: AmmunitionType;
    permittedTypes?: AmmunitionType[];
  };
}

export function runCampaignCompile(options: CampaignCliOptions): ExitCategory {
  const collector = new DiagnosticCollector();
  const compilerInput = buildInput(options, collector);
  if (!compilerInput) return "usage-error";
  const campaignFiles = buildCampaignFiles(options, collector);
  if (!campaignFiles) return "usage-error";
  const campaignInput: CampaignCompilerInput = {
    compilerInput,
    campaignFiles,
    rulesetVersion: "1.0.0",
    compatibilityVersion: "1.0.0",
  };
  const campaignCompiler = new CampaignCompiler();
  const signal = new AbortController().signal;
  const output = campaignCompiler.compile(campaignInput, signal, collector);
  printDiagnostics(collector, options.outputMode);
  if (collector.hasErrors) return "validation-error";
  if (!output) return "compile-error";
  const outDir = resolve(options.outputDir);
  mkdirSync(outDir, { recursive: true });
  // canonicalSerialize (JSON.stringify) silently drops Map-typed fields
  // (nations/designs/designFamilies) to `{}`, so they are converted to plain
  // objects before anything is hashed or written. @bluewave/persistence's
  // SaveStore also treats a save as corrupt unless
  // rawHash === sha256(canonicalSerialize({snapshot, envelope})); the campaign
  // compiler's own rawHash covers `snapshot` only, so both are recomputed here
  // against the persistable snapshot to match what SaveStore verifies on load.
  const persistableSnapshot = serializeCampaignSnapshot(output.state.snapshot);
  const envelope = createEnvelope(
    "campaign-snapshot",
    campaignInput.compatibilityVersion,
    persistableSnapshot,
  );
  const state: CampaignState = {
    snapshot: persistableSnapshot,
    envelope,
    rawHash: persistedStateHash(persistableSnapshot, envelope),
  };
  const stateJson = canonicalSerialize(state);
  const statePath = resolve(outDir, "campaign-state.json");
  const tmpPath = statePath + ".tmp";
  try {
    writeFileSync(tmpPath, stateJson, "utf8");
    rmSync(statePath, { force: true });
    writeFileSync(statePath, stateJson, "utf8");
  } finally {
    rmSync(tmpPath, { force: true });
  }
  if (options.outputMode === "json") {
    printResult(
      JSON.stringify({
        contentHash: output.contentHash,
        rawHash: state.rawHash,
        path: statePath,
      }),
      "human",
    );
  } else {
    printResult(`Campaign compiled successfully`, "human");
    printResult(`  State: ${statePath} (SHA-256: ${state.rawHash})`, "human");
    printResult(`  Content hash: ${output.contentHash}`, "human");
  }
  return "success";
}

export function runCampaignSave(options: CampaignCliOptions, saveDir: string): ExitCategory {
  const statePath = resolve(options.outputDir, "campaign-state.json");
  if (!existsSync(statePath)) {
    printResult(`Campaign state not found at ${statePath}`, "human");
    return "usage-error";
  }
  let state: CampaignState;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8")) as CampaignState;
  } catch {
    printResult(`Failed to parse campaign state at ${statePath}`, "human");
    return "internal-error";
  }
  const store = new SaveStore();
  try {
    const result = store.save(state, saveDir);
    if (options.outputMode === "json") {
      printResult(JSON.stringify(result, null, 2), "human");
    } else {
      printResult(`Campaign saved`, "human");
      printResult(`  Save ID: ${result.metadata.saveId}`, "human");
      printResult(`  Path: ${result.savePath}`, "human");
      printResult(`  Hash: ${result.hash}`, "human");
    }
    return "success";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printResult(`Failed to save campaign: ${message}`, "human");
    return "internal-error";
  }
}

export function runCampaignLoad(options: CampaignCliOptions, saveDir: string): ExitCategory {
  const collector = new DiagnosticCollector();
  const store = new SaveStore();
  const state = store.load(saveDir, collector);
  printDiagnostics(collector, options.outputMode);
  if (!state) return "validation-error";
  if (options.outputMode === "json") {
    printResult(
      JSON.stringify({
        rawHash: state.rawHash,
        envelopeHash: state.envelope.bodyHash,
        turnNumber: state.snapshot.turnNumber,
        campaignId: state.snapshot.campaignId,
      }),
      "human",
    );
  } else {
    printResult(`Campaign loaded successfully`, "human");
    printResult(`  Turn: ${String(state.snapshot.turnNumber)}`, "human");
    printResult(`  Campaign: ${state.snapshot.campaignId}`, "human");
    printResult(`  Raw Hash: ${state.rawHash}`, "human");
    printResult(`  Envelope verified: YES`, "human");
  }
  return "success";
}

/**
 * Runs `generateBattles` (`@bluewave/combat`) against a saved campaign
 * snapshot in isolation, without running a full turn — useful for debugging
 * mission-opportunity/eligibility/reachability/manifest-hashing logic
 * without economy/research/diplomacy noise from `turn:execute`. The
 * resolver callbacks and version defaults mirror
 * `phase-engine/src/month.ts`'s battle_generation phase exactly, so results
 * here match what a real turn would produce for the same snapshot/month.
 */
export function runBattleGenerate(options: BattleGenerateCliOptions, saveDir: string): ExitCategory {
  const collector = new DiagnosticCollector();
  const store = new SaveStore();
  const state = store.load(saveDir, collector);
  if (!state) {
    printDiagnostics(collector, options.outputMode);
    return "validation-error";
  }
  const snapshot = reviveCampaignSnapshot(state.snapshot);
  const campaignMonth = options.campaignMonth ?? String(snapshot.turnNumber);
  const rulesetVersion = options.rulesetVersion ?? snapshot.rulesetVersion;
  const result = runCombatOperation(
    () =>
      generateBattles({
        snapshot,
        campaignMonth,
        campaignSeed: options.seed,
        rngVersion: options.rngVersion,
        formulaVersion: options.formulaVersion,
        rulesetVersion,
        contentVersion: options.contentVersion,
        resolveStrength: (shipId) => resolveShipStrength(snapshot, shipId),
        resolveShipType: () => "BB",
        resolveReadiness: () => 80,
      }),
    collector,
    "battle:generate",
  );
  printDiagnostics(collector, options.outputMode);
  if (result.outcome !== "success") return result.outcome;
  printBattleGenerationResult(result.value, options.outputMode);
  return "success";
}

function printBattleGenerationResult(result: BattleGenerationResult, mode: OutputMode): void {
  if (mode === "json") {
    printResult(JSON.stringify(result), "human");
    return;
  }
  printResult(`Battle generation complete`, "human");
  printResult(`  Records: ${result.records.length}`, "human");
  printResult(`  Battles: ${result.battleIds.length}`, "human");
  result.battleIds.forEach((battleId, i) => {
    const manifest = result.manifests[i];
    printResult(
      `    ${battleId} — ${manifest?.attackerId ?? "?"} vs ${manifest?.defenderId ?? "?"} @ ${manifest?.areaId ?? "?"} (manifestHash: ${manifest?.manifestHash ?? "?"})`,
      "human",
    );
  });
  if (result.rejections.length > 0) {
    printResult(`  Rejections: ${result.rejections.join(", ")}`, "human");
  }
}

/**
 * Runs one `advanceMinute` call (`@bluewave/combat`'s DESIGN-38 §3 tactical
 * minute-advance engine — steps 4-8: contact aging, movement intent,
 * propulsion/turning/position, collision stub, spotting) against a
 * hand-authored `TacticalBattleState` — the tactical layer has no CLI reach
 * at all today, and no fixture builder exists to scaffold one, so v1
 * requires the state file to be hand-authored (see `--help`).
 */
export function runBattleAdvanceMinute(options: BattleAdvanceMinuteCliOptions): ExitCategory {
  const collector = new DiagnosticCollector();
  if (!options.statePath) {
    collector.addError("USAGE", "Missing required --state <path>");
    printDiagnostics(collector, options.outputMode);
    return "usage-error";
  }
  const resolvedPath = resolve(options.statePath);
  if (!existsSync(resolvedPath)) {
    collector.addError("USAGE", `State file not found: ${resolvedPath}`);
    printDiagnostics(collector, options.outputMode);
    return "usage-error";
  }
  let parsed: BattleAdvanceMinuteFile;
  try {
    parsed = JSON.parse(readFileSync(resolvedPath, "utf8")) as BattleAdvanceMinuteFile;
  } catch {
    collector.addError("USAGE", `Failed to parse state file: ${resolvedPath}`);
    printDiagnostics(collector, options.outputMode);
    return "usage-error";
  }
  const result = runCombatOperation(
    () =>
      advanceMinute({
        state: parsed.state,
        minute: options.minute,
        observationTime: options.observationTime,
        orders: parsed.orders,
        attackRangeUm: parsed.attackRangeUm,
      }),
    collector,
    "battle:advance-minute",
  );
  printDiagnostics(collector, options.outputMode);
  if (result.outcome !== "success") return result.outcome;
  printMinuteResult(result.value, options.outputMode);
  return "success";
}

function printMinuteResult(result: MinuteResult, mode: OutputMode): void {
  if (mode === "json") {
    printResult(JSON.stringify(result), "human");
    return;
  }
  printResult(`Minute ${result.minute} advanced`, "human");
  printResult(`  Minute hash: ${result.minuteHash}`, "human");
  printResult(`  Units:`, "human");
  for (const [assetId, m] of Object.entries(result.movementStates)) {
    printResult(
      `    ${assetId} — pos [${m.position[0]}, ${m.position[1]}] heading ${m.heading} speed ${m.currentSpeed}bp`,
      "human",
    );
  }
  printResult(`  Contacts: ${result.contacts.length}`, "human");
  for (const c of result.contacts) {
    printResult(`    ${c.contactId} — asset ${c.assetId} pos [${c.position[0]}, ${c.position[1]}]`, "human");
  }
  printResult(`  Events: ${result.events.length}`, "human");
  for (const e of result.events) {
    printResult(`    [${e.substep}] ${e.eventType} (${e.actorId}${e.targetId ? ` -> ${e.targetId}` : ""})`, "human");
  }
}

/**
 * Sequences the "what happens on one shot" gunnery primitives
 * (`@bluewave/combat`) the way a real salvo resolves: §3 accuracy
 * (`resolveAccuracy`) -> keyed hit draw (`resolveHit`) -> §28 ammunition
 * consumption (`reserveAndConsumeAmmunition`) — surfacing each stage's
 * result, not just hit/miss, so a caller can see *why* (which factor drove
 * the accuracy number, what the draw was against what threshold). Gunnery
 * has no single `resolveGunnery` entry point; this bundles the curated
 * subset rather than exposing one command per primitive.
 */
export function runGunneryResolveShot(options: GunneryResolveShotCliOptions): ExitCategory {
  const collector = new DiagnosticCollector();
  if (!options.inputPath) {
    collector.addError("USAGE", "Missing required --input <path>");
    printDiagnostics(collector, options.outputMode);
    return "usage-error";
  }
  const resolvedPath = resolve(options.inputPath);
  if (!existsSync(resolvedPath)) {
    collector.addError("USAGE", `Input file not found: ${resolvedPath}`);
    printDiagnostics(collector, options.outputMode);
    return "usage-error";
  }
  let parsed: GunneryResolveShotFile;
  try {
    parsed = JSON.parse(readFileSync(resolvedPath, "utf8")) as GunneryResolveShotFile;
  } catch {
    collector.addError("USAGE", `Failed to parse input file: ${resolvedPath}`);
    printDiagnostics(collector, options.outputMode);
    return "usage-error";
  }
  const result = runCombatOperation(
    (): GunneryResolveShotResult => {
      const accuracy = resolveAccuracy(parsed.accuracyFactors);
      const engine = new RandomEngine(options.seed);
      const hit = resolveHit(engine, parsed.identity, accuracy.finalAccuracyBp);
      const ammunition = reserveAndConsumeAmmunition(
        parsed.salvo.ammunition,
        parsed.salvo.count,
        parsed.salvo.preferredType,
        parsed.salvo.permittedTypes,
      );
      return { accuracy, hit, ammunition };
    },
    collector,
    "gunnery:resolve-shot",
  );
  printDiagnostics(collector, options.outputMode);
  if (result.outcome !== "success") return result.outcome;
  printGunneryResolveShotResult(result.value, options.outputMode);
  return "success";
}

interface GunneryResolveShotResult {
  accuracy: AccuracyResolution;
  hit: KeyedHitDraw;
  ammunition: AmmunitionReserve;
}

function printGunneryResolveShotResult(result: GunneryResolveShotResult, mode: OutputMode): void {
  if (mode === "json") {
    printResult(JSON.stringify(result), "human");
    return;
  }
  printResult(`Accuracy factors:`, "human");
  printResult(`    baseAccuracyBp: ${result.accuracy.factors.baseAccuracyBp}`, "human");
  for (const key of result.accuracy.factorKeys) {
    printResult(`    ${key}: ${result.accuracy.factors[key]}`, "human");
  }
  printResult(`  Final accuracy: ${result.accuracy.finalAccuracyBp}bp`, "human");
  printResult(`  Draw: ${result.hit.draw} (need < ${result.hit.finalAccuracyBp})`, "human");
  printResult(`  Result: ${result.hit.isHit ? "HIT" : "MISS"}`, "human");
  printResult(
    `  Ammunition: consumed ${result.ammunition.account.count} x ${result.ammunition.account.type} (${result.ammunition.account.before} -> ${result.ammunition.account.after})`,
    "human",
  );
}

/**
 * `generateBattles`/`BattleResolver` already run inside `turn:execute`'s
 * MonthExecutor pipeline (battle_generation + battle_resolution phases,
 * packages/phase-engine/src/month.ts) and persist their output straight onto
 * the snapshot (`wars.battleManifests`, `wars.battles[].result`) — no new
 * combat call is needed here, just surfacing data that already exists.
 * Returns undefined when no battles occurred this turn/replay, so callers
 * can omit the section entirely rather than print an empty one.
 */
function extractBattleSummary(
  snapshot: CampaignSnapshot,
): { manifests: BattleManifest[]; battles: BattleInstance[] } | undefined {
  const battles = snapshot.wars.battles ?? [];
  const manifests = snapshot.wars.battleManifests ?? [];
  if (battles.length === 0 && manifests.length === 0) return undefined;
  return { manifests, battles };
}

function printBattleSummary(
  summary: { manifests: BattleManifest[]; battles: BattleInstance[] } | undefined,
): void {
  if (!summary) return;
  printResult(`  Battles:`, "human");
  printResult(`    Generated manifests: ${summary.manifests.length}`, "human");
  for (const battle of summary.battles) {
    if (battle.result) {
      const r = battle.result;
      printResult(
        `    ${battle.id} (${battle.attackerId} vs ${battle.defenderId} @ ${battle.areaId}): ${r.winnerId} defeated ${r.loserId}`,
        "human",
      );
      printResult(
        `      Losses — attacker: ${r.attackerLosses.join(", ") || "none"}; defender: ${r.defenderLosses.join(", ") || "none"}`,
        "human",
      );
      const damageEntries = Object.entries(r.damageReport);
      if (damageEntries.length > 0) {
        printResult(
          `      Damage: ${damageEntries.map(([id, dmg]) => `${id}=${String(dmg)}`).join(", ")}`,
          "human",
        );
      }
    } else {
      printResult(
        `    ${battle.id} (${battle.attackerId} vs ${battle.defenderId} @ ${battle.areaId}): ${battle.phase}`,
        "human",
      );
    }
  }
}

export function runTurnExecute(
  options: CampaignCliOptions,
  saveDir: string,
  commands?: CommandEnvelope<CommandBody>[],
): ExitCategory {
  const collector = new DiagnosticCollector();
  const store = new SaveStore();
  const state = store.load(saveDir, collector);
  if (!state) {
    printDiagnostics(collector, options.outputMode);
    return "validation-error";
  }
  const revivedSnapshot = reviveCampaignSnapshot(state.snapshot);
  const executor = new MonthExecutor();
  const randomSeed = options.seed || "default-seed";
  const cmdList = commands ?? [];
  const result = executor.execute(revivedSnapshot, cmdList, randomSeed, collector);
  printDiagnostics(collector, options.outputMode);
  if (collector.hasErrors) return "compile-error";
  if (!result.success) return "compile-error";
  // ReplayVerifier independently recomputes this exact hash (Map-aware) from
  // the live post-execution snapshot, so it must be captured before the
  // Map->plain-object conversion below.
  const finalSnapshotHash = snapshotHash(result.finalSnapshot);
  const battles = extractBattleSummary(result.finalSnapshot);
  const persistableSnapshot = serializeCampaignSnapshot(result.finalSnapshot);
  const newEnvelope = createEnvelope(
    "campaign-snapshot",
    state.snapshot.compatibilityVersion,
    persistableSnapshot,
  );
  const newState: CampaignState = {
    snapshot: persistableSnapshot,
    envelope: newEnvelope,
    rawHash: persistedStateHash(persistableSnapshot, newEnvelope),
  };
  const saveResult = store.save(newState, saveDir);
  const commandsDir = join(saveResult.savePath, "..", saveResult.metadata.saveId);
  const commandsPath = join(commandsDir, "commands.json");
  const ledgerPath = join(commandsDir, "command-ledger.json");
  const finalHashPath = join(commandsDir, "final-hash.json");
  if (cmdList.length > 0) {
    const tmpCommands = commandsPath + ".tmp";
    try {
      writeFileSync(tmpCommands, canonicalSerialize(cmdList), "utf8");
      rmSync(commandsPath, { force: true });
      writeFileSync(commandsPath, canonicalSerialize(cmdList), "utf8");
    } finally {
      rmSync(tmpCommands, { force: true });
    }
  }
  const ledgerTmp = ledgerPath + ".tmp";
  try {
    writeFileSync(ledgerTmp, canonicalSerialize(result.commandLedger.all), "utf8");
    rmSync(ledgerPath, { force: true });
    writeFileSync(ledgerPath, canonicalSerialize(result.commandLedger.all), "utf8");
  } finally {
    rmSync(ledgerTmp, { force: true });
  }
  const finalHashTmp = finalHashPath + ".tmp";
  try {
    writeFileSync(finalHashTmp, JSON.stringify({ finalSnapshotHash }), "utf8");
    rmSync(finalHashPath, { force: true });
    writeFileSync(finalHashPath, JSON.stringify({ finalSnapshotHash }), "utf8");
  } finally {
    rmSync(finalHashTmp, { force: true });
  }
  if (options.outputMode === "json") {
    printResult(
      JSON.stringify({
        snapshotHash: finalSnapshotHash,
        commandLedgerHash: result.commandLedger.hash(),
        eventLedgerHash: result.eventLedger.hash(),
        randomLedgerHash: result.randomLedger.hash(),
        financialLedgerHash: result.financialLedger.hash(),
        savePath: saveResult.savePath,
        saveId: saveResult.metadata.saveId,
        battles,
      }),
      "human",
    );
  } else {
    printResult(`Turn executed`, "human");
    printResult(`  Turn: ${String(result.finalSnapshot.turnNumber)}`, "human");
    printResult(`  Snapshot Hash: ${finalSnapshotHash}`, "human");
    printResult(`  Command Ledger Hash: ${result.commandLedger.hash()}`, "human");
    printResult(`  Event Ledger Hash: ${result.eventLedger.hash()}`, "human");
    printResult(`  Random Ledger Hash: ${result.randomLedger.hash()}`, "human");
    printResult(`  Financial Ledger Hash: ${result.financialLedger.hash()}`, "human");
    printResult(`  Save ID: ${saveResult.metadata.saveId}`, "human");
    printBattleSummary(battles);
  }
  return "success";
}

export function runReplay(options: CampaignCliOptions, saveDir: string): ExitCategory {
  const collector = new DiagnosticCollector();
  const store = new SaveStore();
  const activeSaveId = store.getActiveSaveId(saveDir);
  if (!activeSaveId) {
    printResult(`No active save found in ${saveDir}`, "human");
    return "validation-error";
  }
  // commands.json/ledger/final-hash in the active save's directory describe
  // the turn that produced *that* save; replaying them must start from the
  // snapshot they were originally applied to — the *previous* save — not the
  // active (already post-turn) one.
  const previousSaveId = store.getPreviousSaveId(saveDir);
  if (!previousSaveId) {
    printResult(
      `No previous save found for ${activeSaveId} in ${saveDir} (nothing to replay from)`,
      "human",
    );
    return "validation-error";
  }
  const state = store.loadById(saveDir, previousSaveId, collector);
  if (!state) {
    printDiagnostics(collector, options.outputMode);
    return "validation-error";
  }
  const savePath = join(saveDir, activeSaveId);
  const commandsPath = join(savePath, "commands.json");
  const ledgerPath = join(savePath, "command-ledger.json");
  const finalHashPath = join(savePath, "final-hash.json");
  if (!existsSync(commandsPath)) {
    printResult(`No commands found in save ${activeSaveId}`, "human");
    return "validation-error";
  }
  let commands: CommandEnvelope<CommandBody>[];
  try {
    commands = JSON.parse(
      readFileSync(commandsPath, "utf8"),
    ) as CommandEnvelope<CommandBody>[];
  } catch {
    printResult(`Failed to parse commands file: ${commandsPath}`, "human");
    return "internal-error";
  }
  let originalLedgerData: unknown[];
  try {
    originalLedgerData = JSON.parse(readFileSync(ledgerPath, "utf8")) as unknown[];
  } catch {
    printResult(`Failed to parse command ledger file: ${ledgerPath}`, "human");
    return "internal-error";
  }
  let expectedFinalHash: string;
  try {
    const finalHashData = JSON.parse(readFileSync(finalHashPath, "utf8")) as {
      finalSnapshotHash: string;
    };
    expectedFinalHash = finalHashData.finalSnapshotHash;
  } catch {
    printResult(`Failed to parse final hash file: ${finalHashPath}`, "human");
    return "internal-error";
  }
  const originalLedger = new CommandLedger();
  for (const outcome of originalLedgerData) {
    originalLedger.add(outcome as CommandOutcome);
  }
  const randomSeed = options.seed || "default-seed";
  const verifier = new ReplayVerifier();
  const replayResult = verifier.verify(
    reviveCampaignSnapshot(state.snapshot),
    commands,
    originalLedger,
    expectedFinalHash,
    randomSeed,
    collector,
  );
  printDiagnostics(collector, options.outputMode);
  // ReplayVerifier.verify's finalSnapshot is the replayed post-execution
  // snapshot (already computed internally to derive replayedFinalHash) —
  // same battle data surfaced from turn:execute, extracted here rather than
  // dumped wholesale: finalSnapshot.nations is a Map, and JSON.stringify-ing
  // it directly (as the old `JSON.stringify(replayResult, ...)` would) would
  // silently collapse it to `{}` (the same Map-serialization gap documented
  // elsewhere in this file), plus bloat routine replay output with the full
  // snapshot on every call.
  const battles = replayResult.finalSnapshot
    ? extractBattleSummary(replayResult.finalSnapshot)
    : undefined;
  if (options.outputMode === "json") {
    printResult(
      JSON.stringify(
        {
          match: replayResult.match,
          replayedFinalHash: replayResult.replayedFinalHash,
          originalFinalHash: replayResult.originalFinalHash,
          replayedCommandLedgerHash: replayResult.replayedCommandLedgerHash,
          originalCommandLedgerHash: replayResult.originalCommandLedgerHash,
          steps: replayResult.steps,
          mismatches: replayResult.mismatches,
          battles,
        },
        null,
        2,
      ),
      "human",
    );
  } else {
    if (replayResult.match) {
      printResult(`Replay verification: PASSED`, "human");
    } else {
      printResult(`Replay verification: FAILED`, "human");
      for (const m of replayResult.mismatches) {
        printResult(`  Step ${m.stepIndex} (${m.commandId}):`, "human");
        printResult(`    Expected: ${m.expectedHash}`, "human");
        printResult(`    Actual:   ${m.actualHash}`, "human");
      }
    }
    printResult(`  Replayed Final Hash: ${replayResult.replayedFinalHash}`, "human");
    printResult(`  Original Final Hash: ${replayResult.originalFinalHash}`, "human");
    printResult(
      `  Steps: ${replayResult.steps.length}, Mismatches: ${replayResult.mismatches.length}`,
      "human",
    );
    printBattleSummary(battles);
  }
  if (collector.hasErrors) return "validation-error";
  return replayResult.match ? "success" : "validation-error";
}

export function buildInput(
  options: CliOptions,
  collector: DiagnosticCollector,
): CompilerInput | undefined {
  const manifestPath = resolve(options.manifest);
  const contentDir = resolve(options.contentDir);
  if (!existsSync(manifestPath)) {
    collector.addError("USAGE", `Manifest not found: ${manifestPath}`);
    return undefined;
  }
  if (!existsSync(contentDir)) {
    collector.addError("USAGE", `Content directory not found: ${contentDir}`);
    return undefined;
  }
  let manifest: { files?: Record<string, string[]> };
  try {
    const manifestContent = readFileSync(manifestPath, "utf8");
    manifest = JSON.parse(manifestContent);
  } catch {
    collector.addError("USAGE", `Failed to parse manifest: ${manifestPath}`);
    return undefined;
  }
  const toAbsolute = (file: string) => resolve(contentDir, file);
  const safeCheck = (file: string) => {
    safePath(file);
    return file;
  };
  const files = manifest.files ?? {};
  return {
    manifestPath,
    contentDir,
    rulesetFiles: (files.rulesets ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    countryFiles: (files.countries ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    areaFiles: (files.areas ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    routeFiles: (files.routes ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    possessionFiles: (files.possessions ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    portFiles: (files.ports ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    technologyFiles: (files.technologies ?? []).map(safeCheck).map(toAbsolute).map(safePath),
  };
}

export function buildCampaignFiles(
  options: CliOptions,
  collector: DiagnosticCollector,
): CampaignFiles | undefined {
  const manifestPath = resolve(options.manifest);
  const contentDir = resolve(options.contentDir);
  if (!existsSync(manifestPath)) {
    collector.addError("USAGE", `Manifest not found: ${manifestPath}`);
    return undefined;
  }
  let manifest: { files?: Record<string, string[]> };
  try {
    const manifestContent = readFileSync(manifestPath, "utf8");
    manifest = JSON.parse(manifestContent);
  } catch {
    collector.addError("USAGE", `Failed to parse manifest: ${manifestPath}`);
    return undefined;
  }
  const toAbsolute = (file: string) => resolve(contentDir, file);
  const safeCheck = (file: string) => {
    safePath(file);
    return file;
  };
  const files = manifest.files ?? {};
  return {
    fleetFiles: (files.fleets ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    economyFiles: (files.economies ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    constructionFiles: (files.constructions ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    diplomacyFiles: (files.diplomacy ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    researchFiles: (files.research ?? []).map(safeCheck).map(toAbsolute).map(safePath),
    designFiles: (files.designs ?? []).map(safeCheck).map(toAbsolute).map(safePath),
  };
}

export function safePath(file: string): string {
  // must check raw before normalize() collapses a/../b -> b
  if (file.split(/[/\\]+/).includes("..")) {
    throw new Error(`Path traversal detected: ${file}`);
  }
  const normalized = normalize(file);
  const segments = normalized.split(/[/\\]+/);
  if (segments.includes("..")) {
    throw new Error(`Path traversal detected: ${file}`);
  }
  return normalized;
}

function printDiagnostics(collector: DiagnosticCollector, mode: OutputMode): void {
  if (mode === "json") {
    process.stdout.write(collector.toJSON() + "\n");
  } else {
    const text = collector.toHuman();
    if (text) process.stdout.write(text + "\n");
  }
}

function printResult(message: string, _mode: OutputMode): void {
  process.stdout.write(message + "\n");
}

export function snapshotHash(snapshot: CampaignSnapshot): string {
  const nations: Record<string, NationState> = {};
  for (const [id, nation] of snapshot.nations) {
    nations[id] = nation;
  }
  const wars = {
    wars: snapshot.wars.wars.map((w) => ({ ...w })),
    battles: snapshot.wars.battles.map((b) => ({ ...b })),
  };
  const hashable = {
    version: snapshot.version,
    turnNumber: snapshot.turnNumber,
    campaignId: snapshot.campaignId,
    slots: snapshot.slots.map((s) => ({ ...s })),
    world: {
      areas: snapshot.world.areas.map((a) => ({ ...a })),
      routes: snapshot.world.routes.map((r) => ({ ...r })),
      ports: snapshot.world.ports.map((p) => ({ ...p })),
    },
    nations,
    wars,
    politics: {
      relations: snapshot.politics.relations.map((r) => ({ ...r })),
      shells: { ...snapshot.politics.shells },
    },
    intelligence: {
      shells: { ...snapshot.intelligence.shells },
    },
    rulesetVersion: snapshot.rulesetVersion,
    compatibilityVersion: snapshot.compatibilityVersion,
  };
  return sha256Hex(canonicalSerialize(hashable));
}

/**
 * Matches @bluewave/persistence's SaveStore self-consistency check, which
 * hashes the full persisted state minus `rawHash` (i.e. `{snapshot, envelope}`
 * verbatim). A `rawHash` computed any other way (e.g. over `snapshot` alone)
 * is flagged PERSISTENCE_CORRUPT_SAVE on the very next load.
 */
export function persistedStateHash(
  snapshot: CampaignSnapshot,
  envelope: ReturnType<typeof createEnvelope>,
): string {
  return sha256Hex(canonicalSerialize({ snapshot, envelope }));
}

/**
 * @bluewave/persistence stores state as JSON, so `Map`-typed CampaignSnapshot
 * fields (nations, designs, designFamilies, and each nation's
 * research.activeCandidates) come back from SaveStore.load() as plain objects,
 * not Maps — @bluewave/phase-engine requires real Map instances. Revives them
 * before handing a loaded snapshot to MonthExecutor/ReplayVerifier.
 */
export function reviveCampaignSnapshot(snapshot: CampaignSnapshot): CampaignSnapshot {
  const nations = toMap<NationState>(snapshot.nations).entries();
  const revivedNations = new Map(
    [...nations].map(([id, nation]) => [id, reviveNation(nation)] as const),
  );
  return {
    ...snapshot,
    nations: revivedNations,
    designs: toMap(snapshot.designs),
    designFamilies: toMap(snapshot.designFamilies),
  };
}

function reviveNation(nation: NationState): NationState {
  if (!nation.research) return nation;
  return {
    ...nation,
    research: {
      ...nation.research,
      activeCandidates: toMap<string>(nation.research.activeCandidates),
    },
  };
}

function toMap<V>(value: Map<string, V> | Record<string, V> | undefined): Map<string, V> {
  if (!value) return new Map();
  if (value instanceof Map) return value;
  return new Map(Object.entries(value));
}

/**
 * Inverse of {@link reviveCampaignSnapshot}: converts Map-typed fields to
 * plain objects so canonicalSerialize (plain JSON.stringify) can actually
 * persist their contents instead of silently collapsing them to `{}`.
 */
export function serializeCampaignSnapshot(snapshot: CampaignSnapshot): CampaignSnapshot {
  const nations: Record<string, NationState> = {};
  for (const [id, nation] of snapshot.nations) {
    nations[id] = serializeNation(nation);
  }
  return {
    ...snapshot,
    nations: nations as unknown as Map<string, NationState>,
    designs: fromMap(snapshot.designs),
    designFamilies: fromMap(snapshot.designFamilies),
  };
}

function serializeNation(nation: NationState): NationState {
  if (!nation.research) return nation;
  return {
    ...nation,
    research: {
      ...nation.research,
      activeCandidates: fromMap(nation.research.activeCandidates),
    },
  };
}

function fromMap<V>(value: Map<string, V> | undefined): Map<string, V> {
  if (!value) return {} as unknown as Map<string, V>;
  return Object.fromEntries(value) as unknown as Map<string, V>;
}
