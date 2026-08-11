import { Compiler } from "@bluewave/content-compiler";
import type { CompilerInput } from "@bluewave/content-compiler";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname, sep, normalize, join } from "node:path";
import {
  canonicalSerialize,
  sha256Hex,
  createEnvelope,
  verifyEnvelope,
} from "@bluewave/deterministic";
import { CampaignCompiler, type CampaignCompilerInput } from "@bluewave/campaign";
import { SaveStore } from "@bluewave/persistence";
import type { CampaignState, CampaignSnapshot, NationState } from "@bluewave/campaign";
import type { CommandEnvelope, BudgetProjectCommand, CommandOutcome } from "@bluewave/commands";
import { CommandLedger } from "@bluewave/commands";
import { MonthExecutor, ReplayVerifier } from "@bluewave/phase-engine";

export type OutputMode = "human" | "json";
export type ExitCategory =
  "success" | "validation-error" | "compile-error" | "aborted" | "internal-error" | "usage-error";

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
}

export function runCampaignCompile(options: CampaignCliOptions): ExitCategory {
  const collector = new DiagnosticCollector();
  const compilerInput = buildInput(options, collector);
  if (!compilerInput) return "usage-error";

  const campaignInput: CampaignCompilerInput = {
    compilerInput,
    campaignFiles: {
      fleetFiles: [],
      economyFiles: [],
      constructionFiles: [],
      diplomacyFiles: [],
      researchFiles: [],
    },
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

  const stateJson = canonicalSerialize(output.state);
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
        rawHash: output.state.rawHash,
        path: statePath,
      }),
      "human",
    );
  } else {
    printResult(`Campaign compiled successfully`, "human");
    printResult(`  State: ${statePath} (SHA-256: ${output.state.rawHash})`, "human");
    printResult(`  Content hash: ${output.contentHash}`, "human");
  }

  return "success";
}

export function runCampaignSave(options: CampaignCliOptions, saveDir: string): ExitCategory {
  const collector = new DiagnosticCollector();
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

export function runTurnExecute(
  options: CampaignCliOptions,
  saveDir: string,
  commands?: CommandEnvelope<BudgetProjectCommand>[],
): ExitCategory {
  const collector = new DiagnosticCollector();
  const store = new SaveStore();

  const state = store.load(saveDir, collector);
  if (!state) {
    printDiagnostics(collector, options.outputMode);
    return "validation-error";
  }

  const executor = new MonthExecutor();
  const randomSeed = options.seed || "default-seed";
  const cmdList = commands ?? [];

  const result = executor.execute(state.snapshot, cmdList, randomSeed, collector);

  printDiagnostics(collector, options.outputMode);

  if (collector.hasErrors) return "compile-error";
  if (!result.success) return "compile-error";

  const newState: CampaignState = {
    snapshot: result.finalSnapshot,
    envelope: createEnvelope(
      "campaign-snapshot",
      state.snapshot.compatibilityVersion,
      result.finalSnapshot,
    ),
    rawHash: snapshotHash(result.finalSnapshot),
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
    writeFileSync(finalHashTmp, JSON.stringify({ finalSnapshotHash: newState.rawHash }), "utf8");
    rmSync(finalHashPath, { force: true });
    writeFileSync(finalHashPath, JSON.stringify({ finalSnapshotHash: newState.rawHash }), "utf8");
  } finally {
    rmSync(finalHashTmp, { force: true });
  }

  if (options.outputMode === "json") {
    printResult(
      JSON.stringify({
        snapshotHash: newState.rawHash,
        commandLedgerHash: result.commandLedger.hash(),
        eventLedgerHash: result.eventLedger.hash(),
        randomLedgerHash: result.randomLedger.hash(),
        financialLedgerHash: result.financialLedger.hash(),
        savePath: saveResult.savePath,
        saveId: saveResult.metadata.saveId,
      }),
      "human",
    );
  } else {
    printResult(`Turn executed`, "human");
    printResult(`  Turn: ${String(result.finalSnapshot.turnNumber)}`, "human");
    printResult(`  Snapshot Hash: ${newState.rawHash}`, "human");
    printResult(`  Command Ledger Hash: ${result.commandLedger.hash()}`, "human");
    printResult(`  Event Ledger Hash: ${result.eventLedger.hash()}`, "human");
    printResult(`  Random Ledger Hash: ${result.randomLedger.hash()}`, "human");
    printResult(`  Financial Ledger Hash: ${result.financialLedger.hash()}`, "human");
    printResult(`  Save ID: ${saveResult.metadata.saveId}`, "human");
  }

  return "success";
}

export function runReplay(options: CampaignCliOptions, saveDir: string): ExitCategory {
  const collector = new DiagnosticCollector();
  const store = new SaveStore();

  const state = store.load(saveDir, collector);
  if (!state) {
    printDiagnostics(collector, options.outputMode);
    return "validation-error";
  }

  const activeSaveId = store.getActiveSaveId(saveDir);
  if (!activeSaveId) {
    printResult(`No active save found in ${saveDir}`, "human");
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

  let commands: CommandEnvelope<BudgetProjectCommand>[];
  try {
    commands = JSON.parse(
      readFileSync(commandsPath, "utf8"),
    ) as CommandEnvelope<BudgetProjectCommand>[];
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
    state.snapshot,
    commands,
    originalLedger,
    expectedFinalHash,
    randomSeed,
    collector,
  );

  printDiagnostics(collector, options.outputMode);

  if (options.outputMode === "json") {
    printResult(JSON.stringify(replayResult, null, 2), "human");
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
  }

  if (collector.hasErrors) return "validation-error";
  return replayResult.match ? "success" : "validation-error";
}

function buildInput(
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
  const files = manifest.files ?? {};

  return {
    manifestPath: "manifest",
    contentDir,
    rulesetFiles: (files.rulesets ?? []).map(toAbsolute).map(safePath),
    countryFiles: (files.countries ?? []).map(toAbsolute).map(safePath),
    areaFiles: (files.areas ?? []).map(toAbsolute).map(safePath),
    routeFiles: (files.routes ?? []).map(toAbsolute).map(safePath),
    possessionFiles: (files.possessions ?? []).map(toAbsolute).map(safePath),
    portFiles: (files.ports ?? []).map(toAbsolute).map(safePath),
    technologyFiles: (files.technologies ?? []).map(toAbsolute).map(safePath),
  };
}

function safePath(file: string): string {
  const normalized = normalize(file);
  if (normalized.includes(`..${sep}`)) {
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

function snapshotHash(snapshot: CampaignSnapshot): string {
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
