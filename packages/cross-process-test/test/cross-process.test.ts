import { describe, it, expect } from "vite-plus/test";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";

const thisDir = dirname(fileURLToPath(import.meta.url));
const childScript = resolve(thisDir, "..", "dist", "run-child.js");

interface ChildOutput {
  contentArtifactHash: string;
  initialSnapshotHash: string;
  closingSnapshotHash: string;
  commandLedgerHash: string;
  eventLedgerHash: string;
  financialLedgerHash: string;
  randomDecisionLedgerHash: string;
  replayVerificationHash: string;
  battleGenerationHash: string;
  success: boolean;
}

function runChild(): ChildOutput {
  const stdout = execFileSync(process.execPath, [childScript], {
    encoding: "utf8",
    timeout: 30000,
    env: { ...process.env, NODE_OPTIONS: "" },
  });
  const lines = stdout.trim().split("\n");
  const jsonLine = lines[lines.length - 1]!;
  return JSON.parse(jsonLine) as ChildOutput;
}

describe("Cross-process determinism", () => {
  it("Two clean child-process runs produce identical hashes", () => {
    const r1 = runChild();
    const r2 = runChild();

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    expect(r1.contentArtifactHash).toBe(r2.contentArtifactHash);
    expect(r1.initialSnapshotHash).toBe(r2.initialSnapshotHash);
    expect(r1.closingSnapshotHash).toBe(r2.closingSnapshotHash);
    expect(r1.commandLedgerHash).toBe(r2.commandLedgerHash);
    expect(r1.eventLedgerHash).toBe(r2.eventLedgerHash);
    expect(r1.financialLedgerHash).toBe(r2.financialLedgerHash);
    expect(r1.randomDecisionLedgerHash).toBe(r2.randomDecisionLedgerHash);
    expect(r1.replayVerificationHash).toBe(r2.replayVerificationHash);
    expect(r1.battleGenerationHash).toBe(r2.battleGenerationHash);
  });

  it("Hashes match golden reference", () => {
    const goldenPath = resolve(thisDir, "..", "..", "..", "golden", "hashes.json");
    if (!existsSync(goldenPath)) {
      return; // Skip if golden file doesn't exist yet
    }

    const r = runChild();
    const golden = JSON.parse(readFileSync(goldenPath, "utf8")) as Record<string, string>;

    expect(r.contentArtifactHash).toBe(golden.contentArtifactHash);
    expect(r.initialSnapshotHash).toBe(golden.initialSnapshotHash);
    expect(r.closingSnapshotHash).toBe(golden.closingSnapshotHash);
    expect(r.commandLedgerHash).toBe(golden.commandLedgerHash);
    expect(r.eventLedgerHash).toBe(golden.eventLedgerHash);
    expect(r.financialLedgerHash).toBe(golden.financialLedgerHash);
    expect(r.randomDecisionLedgerHash).toBe(golden.randomDecisionLedgerHash);
    expect(r.replayVerificationHash).toBe(golden.replayVerificationHash);
  });
});

describe("Air-combat cross-process determinism", () => {
  const airCombatChildScript = resolve(thisDir, "..", "dist", "run-air-combat-child.js");

  interface AirCombatChildOutput {
    contentArtifactHash: string;
    initialSnapshotHash: string;
    closingSnapshotHash: string;
    commandLedgerHash: string;
    eventLedgerHash: string;
    financialLedgerHash: string;
    randomDecisionLedgerHash: string;
    resolveAirCombatHash: string;
    success: boolean;
  }

  function runAirCombatChild(): AirCombatChildOutput {
    const stdout = execFileSync(process.execPath, [airCombatChildScript], {
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    const lines = stdout.trim().split("\n");
    const jsonLine = lines[lines.length - 1]!;
    return JSON.parse(jsonLine) as AirCombatChildOutput;
  }

  it("Two clean air-combat child-process runs produce identical air-combat hashes", () => {
    const r1 = runAirCombatChild();
    const r2 = runAirCombatChild();

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r1.resolveAirCombatHash).toBe(r2.resolveAirCombatHash);
    expect(r1.closingSnapshotHash).toBe(r2.closingSnapshotHash);
    expect(r1.eventLedgerHash).toBe(r2.eventLedgerHash);
  });

  it("Air-combat child creates non-empty records when CAP/strike data is present", () => {
    const r = runAirCombatChild();
    expect(r.success).toBe(true);
    expect(r.resolveAirCombatHash).not.toBe("");
    expect(r.resolveAirCombatHash).not.toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ); // Not empty hash
  });
});

describe("Air-defense cross-process determinism (D-4 AC-19)", () => {
  const airDefenseChildScript = resolve(thisDir, "..", "dist", "run-air-defense-child.js");

  interface AirDefenseChildOutput {
    resolveAirDefenseHash: string;
    closingSnapshotHash: string;
    recordCount: number;
    success: boolean;
    error?: string;
  }

  function runAirDefenseChild(): AirDefenseChildOutput {
    const stdout = execFileSync(process.execPath, [airDefenseChildScript], {
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    const lines = stdout.trim().split("\n");
    return JSON.parse(lines[lines.length - 1]!) as AirDefenseChildOutput;
  }

  it("Two clean air-defense child-process runs produce identical hashes", () => {
    const r1 = runAirDefenseChild();
    const r2 = runAirDefenseChild();
    expect(r1.error).toBeUndefined();
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r1.recordCount).toBeGreaterThan(0);
    expect(r1.resolveAirDefenseHash).toBe(r2.resolveAirDefenseHash);
    expect(r1.closingSnapshotHash).toBe(r2.closingSnapshotHash);
  });
});

describe("Carrier operations cross-process determinism", () => {
  const carrierChildScript = resolve(thisDir, "..", "dist", "run-carrier-operations-child.js");

  interface CarrierChildOutput {
    contentArtifactHash: string;
    initialSnapshotHash: string;
    closingSnapshotHash: string;
    commandLedgerHash: string;
    eventLedgerHash: string;
    financialLedgerHash: string;
    randomDecisionLedgerHash: string;
    carrierOpsHash: string;
    success: boolean;
  }

  function runCarrierChild(): CarrierChildOutput {
    const stdout = execFileSync(process.execPath, [carrierChildScript], {
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    const lines = stdout.trim().split("\n");
    const jsonLine = lines[lines.length - 1]!;
    return JSON.parse(jsonLine) as CarrierChildOutput;
  }

  it("Two clean carrier child-process runs produce identical carrier ops hashes", () => {
    const r1 = runCarrierChild();
    const r2 = runCarrierChild();

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    expect(r1.carrierOpsHash).toBe(r2.carrierOpsHash);
    expect(r1.closingSnapshotHash).toBe(r2.closingSnapshotHash);
    expect(r1.commandLedgerHash).toBe(r2.commandLedgerHash);
    expect(r1.eventLedgerHash).toBe(r2.eventLedgerHash);
    expect(r1.financialLedgerHash).toBe(r2.financialLedgerHash);
    expect(r1.randomDecisionLedgerHash).toBe(r2.randomDecisionLedgerHash);
    expect(r1.contentArtifactHash).toBe(r2.contentArtifactHash);
    expect(r1.initialSnapshotHash).toBe(r2.initialSnapshotHash);
  });
});
