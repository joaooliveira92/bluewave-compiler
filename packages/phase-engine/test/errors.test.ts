// packages/phase-engine/test/errors.test.ts
// Ticket 30 (audit rescope) — the eight foundation `throw`s in snapshotClone,
// financial-ledger and commandLifecycle are `PhaseEngineError` (a runtime-free
// `Data.TaggedError`) instead of plain `Error` / `Object.assign(Error, {code})`.
// These tests prove the tagged error carries the verbatim `message` and the
// preserved `code`, so in-process callers that match on either are unaffected
// (MIG-RUNTIME-1, MIG-DET-1).

import type { CampaignSlot } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import { describe, expect, it } from "vite-plus/test";
import { BudgetProjectLifecycle, FinancialLedger, PhaseEngineError } from "../src/index.js";
import { cloneSnapshot } from "../src/snapshotClone.js";

function capture(fn: () => unknown): PhaseEngineError {
  try {
    fn();
  } catch (error) {
    if (error instanceof PhaseEngineError) return error;
    throw error;
  }
  throw new Error("expected a PhaseEngineError");
}

describe("PhaseEngineError", () => {
  it("is a tagged, in-process Error subclass", () => {
    const error = new PhaseEngineError({ message: "boom" });
    expect(error).toBeInstanceOf(PhaseEngineError);
    expect(error).toBeInstanceOf(Error);
    expect(error._tag).toBe("PhaseEngineError");
    expect(error.message).toBe("boom");
    expect(error.code).toBeUndefined();
  });

  it("snapshotClone: non-null snapshot failure is tagged with the verbatim message", () => {
    const error = capture(() => cloneSnapshot(null as any));
    expect(error._tag).toBe("PhaseEngineError");
    expect(error.message).toBe("cloneSnapshot: snapshot must be a non-null object");
    expect(error.code).toBeUndefined();
  });

  it("snapshotClone: non-Map nations failure is tagged with the verbatim message", () => {
    const error = capture(() => {
      const bad = {
        version: "0.1.0",
        turnNumber: SafeInt(1),
        campaignId: "c",
        startYear: 1880,
        startMonth: 1,
        slots: [],
        world: { areas: [], routes: [], ports: [] },
        nations: {},
        wars: {},
        politics: {},
        intelligence: {},
        designs: new Map(),
        designFamilies: new Map(),
        rulesetVersion: "0.1.0",
        compatibilityVersion: "0.1.0",
      };
      return cloneSnapshot(bad as any);
    });
    expect(error._tag).toBe("PhaseEngineError");
    expect(error.message).toBe("cloneSnapshot: nations must be a Map");
    expect(error.code).toBeUndefined();
  });

  it("financial-ledger: unbalanced transaction failure is tagged with the verbatim message", () => {
    const error = capture(() =>
      new FinancialLedger().append({
        campaignMonth: "1880-01",
        phaseId: "command_collection_resolution",
        nationId: "GBR",
        categoryId: "SETTLEMENT",
        debit: SafeInt(3),
        credit: SafeInt(4),
        previousBalance: SafeInt(0),
        newBalance: SafeInt(0),
        reason: "test",
      }),
    );
    expect(error._tag).toBe("PhaseEngineError");
    expect(error.message).toBe("Unbalanced ledger transaction: debit 3 != credit 4");
    expect(error.code).toBeUndefined();
  });

  it("commandLifecycle: invalid status transition preserves the code and message", () => {
    const slot: CampaignSlot = { nationId: "GBR", type: "playable" };
    // `walk` is private; a terminal record cannot transition, which is the
    // exact fail-closed guard this assertion pins.
    const lifecycle = new BudgetProjectLifecycle() as any;
    const error = capture(() =>
      lifecycle.walk(
        { commandId: "cmd-1", status: "COMPLETED" },
        ["SUBMITTED"],
        [],
        { previousHash: "0" },
        slot,
      ),
    );
    expect(error._tag).toBe("PhaseEngineError");
    expect(error.code).toBe("INVALID_COMMAND_STATUS_TRANSITION");
    expect(error.message).toBe("INVALID_COMMAND_STATUS_TRANSITION: COMPLETED -> SUBMITTED");
  });
});
