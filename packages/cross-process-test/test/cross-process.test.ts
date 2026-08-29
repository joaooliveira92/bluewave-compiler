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
