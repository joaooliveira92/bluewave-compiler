import { describe, it, expect } from "vitest";
import { SafeInt } from "@bluewave/contracts";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { CampaignSnapshot, CampaignSlot } from "@bluewave/campaign";
import type { CommandEnvelope, CommandBody } from "../src/index.js";
import { CommandLifecycle, CommandIdempotencyMap, CommandLedger } from "../src/index.js";

function makeTestSnapshot(treasury: SafeInt = SafeInt(1000)): CampaignSnapshot {
  return {
    version: "0.1.0",
    turnNumber: SafeInt(1),
    campaignId: "test-campaign",
    slots: [{ nationId: "GBR", type: "playable" }],
    world: { areas: [], routes: [], ports: [] },
    nations: new Map([
      [
        "GBR",
        {
          id: "GBR",
          name: "Great Britain",
          tag: "GBR",
          treasury,
          income: SafeInt(100),
          expenses: SafeInt(50),
          fleets: [],
          research: { nationId: "GBR", technologies: [] },
          constructionProjects: [],
          isPlayable: true,
          isAI: false,
        },
      ],
    ]),
    wars: { wars: [], battles: [] },
    politics: { relations: [], shells: {} },
    intelligence: { shells: {} },
    rulesetVersion: "0.1.0",
    compatibilityVersion: "0.1.0",
  };
}

function makeEnvelope(
  overrides: Partial<CommandEnvelope<CommandBody>> = {},
): CommandEnvelope<CommandBody> {
  const snapshot = makeTestSnapshot();
  const hash = sha256Hex(canonicalSerialize(snapshot));
  return {
    commandId: "cmd-1",
    version: "0.1.0",
    expectedSnapshotHash: hash,
    idempotencyKey: "idem-1",
    timestamp: "2024-01-01T00:00:00Z",
    body: { type: "budget_project", nationId: "GBR", projectId: "proj-1", budget: SafeInt(100) },
    ...overrides,
  };
}

describe("CommandEnvelope", () => {
  it("creates a valid command envelope", () => {
    const snapshot = makeTestSnapshot();
    const hash = sha256Hex(canonicalSerialize(snapshot));
    const envelope: CommandEnvelope<CommandBody> = {
      commandId: "cmd-1",
      version: "0.1.0",
      expectedSnapshotHash: hash,
      idempotencyKey: "idem-1",
      timestamp: "2024-01-01T00:00:00Z",
      body: { type: "budget_project", nationId: "GBR", projectId: "proj-1", budget: SafeInt(100) },
    };
    expect(envelope.commandId).toBe("cmd-1");
    expect(envelope.body.type).toBe("budget_project");
    expect(envelope.body.nationId).toBe("GBR");
    expect(envelope.body.budget).toBe(SafeInt(100));
  });
});

describe("CommandLifecycle", () => {
  it("runs a successful lifecycle", () => {
    const snapshot = makeTestSnapshot();
    const envelope = makeEnvelope();
    const slot: CampaignSlot = { nationId: "GBR", type: "playable" };
    const lifecycle = new CommandLifecycle();
    const idempotencyMap = new CommandIdempotencyMap();

    const outcome = lifecycle.process(envelope, snapshot, slot, idempotencyMap);

    expect(outcome.type).toBe("success");
    if (outcome.type === "success") {
      expect(outcome.commandId).toBe("cmd-1");
      expect(outcome.snapshotHash).toBeTruthy();
    }
  });

  it("returns idempotency match for the same command", () => {
    const snapshot = makeTestSnapshot();
    const envelope = makeEnvelope();
    const slot: CampaignSlot = { nationId: "GBR", type: "playable" };
    const lifecycle = new CommandLifecycle();
    const idempotencyMap = new CommandIdempotencyMap();

    const firstOutcome = lifecycle.process(envelope, snapshot, slot, idempotencyMap);
    expect(firstOutcome.type).toBe("success");

    const secondOutcome = lifecycle.process(envelope, snapshot, slot, idempotencyMap);
    expect(secondOutcome.type).toBe("idempotency_match");
  });

  it("returns idempotency conflict for different command with same key", () => {
    const snapshot = makeTestSnapshot();
    const envelope = makeEnvelope();
    const slot: CampaignSlot = { nationId: "GBR", type: "playable" };
    const lifecycle = new CommandLifecycle();
    const idempotencyMap = new CommandIdempotencyMap();

    const firstOutcome = lifecycle.process(envelope, snapshot, slot, idempotencyMap);
    expect(firstOutcome.type).toBe("success");

    const conflictingEnvelope = makeEnvelope({
      commandId: "cmd-2",
      idempotencyKey: "idem-1",
    });
    const secondOutcome = lifecycle.process(conflictingEnvelope, snapshot, slot, idempotencyMap);
    expect(secondOutcome.type).toBe("idempotency_conflict");
  });

  it("rejects stale expectedSnapshotHash", () => {
    const snapshot = makeTestSnapshot();
    const envelope = makeEnvelope({
      commandId: "cmd-3",
      idempotencyKey: "idem-3",
      expectedSnapshotHash: "wrong-hash",
    });
    const slot: CampaignSlot = { nationId: "GBR", type: "playable" };
    const lifecycle = new CommandLifecycle();
    const idempotencyMap = new CommandIdempotencyMap();

    const outcome = lifecycle.process(envelope, snapshot, slot, idempotencyMap);
    expect(outcome.type).toBe("rejected");
    if (outcome.type === "rejected") {
      expect(outcome.diagnostic.code).toBe("STALE_SNAPSHOT_HASH");
    }
  });
});

describe("CommandLedger", () => {
  it("produces deterministic hash", () => {
    const ledger1 = new CommandLedger();
    const ledger2 = new CommandLedger();

    const outcome1: import("../src/index.js").CommandOutcome = {
      type: "success",
      commandId: "cmd-1",
      snapshotHash: "abc123",
      result: { budget: SafeInt(100), nationId: "GBR", projectId: "proj-1" },
    };

    const outcome2: import("../src/index.js").CommandOutcome = {
      type: "success",
      commandId: "cmd-2",
      snapshotHash: "def456",
      result: { budget: SafeInt(50), nationId: "FRA", projectId: "proj-2" },
    };

    ledger1.add(outcome1);
    ledger1.add(outcome2);

    ledger2.add(outcome1);
    ledger2.add(outcome2);

    expect(ledger1.hash()).toBe(ledger2.hash());
    expect(ledger1.all.length).toBe(2);
    expect(ledger2.all.length).toBe(2);
  });
});