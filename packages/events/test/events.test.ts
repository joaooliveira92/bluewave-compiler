import { describe, it, expect } from "vitest";
import { SafeInt } from "@bluewave/contracts";
import type { DomainEventEnvelope, DomainEventBody, NationBudgetChanged } from "../src/index.js";
import { EventLedger, ExplanationBuilder, formatExplanation } from "../src/index.js";

describe("DomainEventEnvelope", () => {
  it("creates a domain event envelope", () => {
    const body: NationBudgetChanged = {
      kind: "NationBudgetChanged",
      nationId: "nation-1",
      previousTreasury: SafeInt(1000),
      newTreasury: SafeInt(1100),
      delta: SafeInt(100),
      reason: "tax_collection",
    };

    const envelope: DomainEventEnvelope = {
      eventId: "evt-001",
      version: "1.0.0",
      aggregateType: "nation",
      aggregateId: "nation-1",
      eventType: "NationBudgetChanged",
      timestamp: "2026-01-15T12:00:00Z",
      body,
      sequenceNumber: SafeInt(1),
    };

    expect(envelope["eventId"]).toBe("evt-001");
    expect(envelope["body"]["kind"]).toBe("NationBudgetChanged");
    expect(envelope["body"]["delta"]).toBe(SafeInt(100));
    expect(envelope["sequenceNumber"]).toBe(SafeInt(1));
  });

  it("serializes envelope to JSON", () => {
    const body: DomainEventBody = {
      kind: "ConstructionProgressed",
      projectId: "proj-1",
      nationId: "nation-1",
      previousWork: SafeInt(50),
      newWork: SafeInt(80),
      workAdded: SafeInt(30),
    };

    const envelope: DomainEventEnvelope = {
      eventId: "evt-002",
      version: "1.0.0",
      aggregateType: "construction",
      aggregateId: "proj-1",
      eventType: "ConstructionProgressed",
      timestamp: "2026-01-15T12:00:00Z",
      body,
      sequenceNumber: SafeInt(2),
    };

    const json = JSON.stringify(envelope);
    const parsed = JSON.parse(json);

    expect(parsed["eventId"]).toBe("evt-002");
    expect(parsed["body"]["kind"]).toBe("ConstructionProgressed");
    expect(parsed["body"]["workAdded"]).toBe(30);
    expect(parsed["sequenceNumber"]).toBe(2);
  });
});

describe("ExplanationTree", () => {
  it("creates explanation tree with builder", () => {
    const tree = new ExplanationBuilder("treasury_calc", "1.0.0")
      .withInput("base_income", 500)
      .withInput("tax_rate", 0.3)
      .withIntermediate("gross_income", 150)
      .withIntermediate("expenses", 50)
      .withResult(SafeInt(100))
      .withUnit("gold")
      .build();

    expect(tree["formulaId"]).toBe("treasury_calc");
    expect(tree["inputs"]["base_income"]).toBe(500);
    expect(tree["result"]).toBe(SafeInt(100));
  });

  it("creates nested explanation tree", () => {
    const child = new ExplanationBuilder("maintenance", "1.0.0")
      .withInput("ship_count", 5)
      .withIntermediate("per_ship", 10)
      .withResult(SafeInt(50))
      .withUnit("gold")
      .build();

    const parent = new ExplanationBuilder("total_budget", "1.0.0")
      .withInput("base_budget", 1000)
      .addChild(child)
      .withResult(SafeInt(950))
      .withUnit("gold")
      .build();

    expect(parent["children"]).toHaveLength(1);
    expect(parent["children"]![0]["formulaId"]).toBe("maintenance");
    expect(parent["children"]![0]["result"]).toBe(SafeInt(50));
  });
});

describe("formatExplanation", () => {
  it("produces a human-readable string", () => {
    const tree = new ExplanationBuilder("treasury_calc", "1.0.0")
      .withInput("base_income", 500)
      .withInput("tax_rate", 0.3)
      .withIntermediate("gross_income", 150)
      .withIntermediate("expenses", 50)
      .withResult(100)
      .withUnit("gold")
      .build();

    const output = formatExplanation(tree);

    expect(typeof output).toBe("string");
    expect(output).toContain("treasury_calc v1.0.0 = 100 gold");
    expect(output).toContain("base_income = 500");
    expect(output).toContain("tax_rate = 0.3");
    expect(output).toContain("gross_income = 150");
  });

  it("formats nested trees", () => {
    const child = new ExplanationBuilder("upkeep", "2.0.0")
      .withInput("units", 10)
      .withResult(200)
      .withUnit("gold")
      .build();

    const parent = new ExplanationBuilder("budget", "1.0.0")
      .addChild(child)
      .withResult(800)
      .withUnit("gold")
      .build();

    const output = formatExplanation(parent);

    expect(output).toContain("budget v1.0.0 = 800 gold");
    expect(output).toContain("upkeep v2.0.0 = 200 gold");
    expect(output).toContain("units = 10");
  });
});

describe("EventLedger", () => {
  it("accumulates events and produces deterministic hash", () => {
    const ledger = new EventLedger();
    expect(ledger["all"]).toHaveLength(0);

    const body1: DomainEventBody = {
      kind: "NationBudgetChanged",
      nationId: "nation-1",
      previousTreasury: SafeInt(1000),
      newTreasury: SafeInt(1100),
      delta: SafeInt(100),
      reason: "tax_collection",
    };

    ledger.append({
      eventId: "evt-001",
      version: "1.0.0",
      aggregateType: "nation",
      aggregateId: "nation-1",
      eventType: "NationBudgetChanged",
      timestamp: "2026-01-15T12:00:00Z",
      body: body1,
      sequenceNumber: SafeInt(1),
    });

    expect(ledger["all"]).toHaveLength(1);

    const body2: DomainEventBody = {
      kind: "BattleInitiated",
      battleId: "battle-1",
      attackerId: "nation-1",
      defenderId: "nation-2",
      areaId: "area-5",
    };

    ledger.append({
      eventId: "evt-002",
      version: "1.0.0",
      aggregateType: "battle",
      aggregateId: "battle-1",
      eventType: "BattleInitiated",
      timestamp: "2026-01-15T12:01:00Z",
      body: body2,
      sequenceNumber: SafeInt(2),
    });

    expect(ledger["all"]).toHaveLength(2);

    const h = ledger.hash();
    expect(typeof h).toBe("string");
    expect(h).toHaveLength(64);

    const h2 = ledger.hash();
    expect(h2).toBe(h);
  });

  it("toJSON returns string", () => {
    const ledger = new EventLedger();
    const body: DomainEventBody = {
      kind: "ResearchProgressed",
      nationId: "nation-1",
      techId: "tech-1",
      previousPoints: SafeInt(0),
      newPoints: SafeInt(50),
    };

    ledger.append({
      eventId: "evt-003",
      version: "1.0.0",
      aggregateType: "research",
      aggregateId: "nation-1",
      eventType: "ResearchProgressed",
      timestamp: "2026-01-15T12:00:00Z",
      body,
      sequenceNumber: SafeInt(1),
    });

    const json = ledger.toJSON();
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
  });

  it("empty ledger hash is deterministic", () => {
    const ledger1 = new EventLedger();
    const ledger2 = new EventLedger();
    expect(ledger1.hash()).toBe(ledger2.hash());
  });
});
