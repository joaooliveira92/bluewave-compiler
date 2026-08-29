import { describe, expect, it } from "vite-plus/test";
import { parseDomainEventEnvelope } from "../src/index.js";
import { budgetEvent } from "./fixtures.js";

describe("event validation", () => {
  it("accepts a valid envelope", () => {
    expect(parseDomainEventEnvelope(budgetEvent())).toEqual(budgetEvent());
  });

  it("rejects eventType and body.kind mismatches", () => {
    expect(() =>
      parseDomainEventEnvelope({ ...budgetEvent(), eventType: "BattleResolved" }),
    ).toThrow(/eventType must match body.kind/);
  });

  it("rejects invalid timestamps", () => {
    expect(() => parseDomainEventEnvelope({ ...budgetEvent(), timestamp: "yesterday" })).toThrow();
  });

  it("rejects unsafe sequence numbers", () => {
    expect(() =>
      parseDomainEventEnvelope({ ...budgetEvent(), sequenceNumber: Number.MAX_SAFE_INTEGER + 1 }),
    ).toThrow();
  });

  it("rejects unknown properties", () => {
    expect(() => parseDomainEventEnvelope({ ...budgetEvent(), unexpected: true })).toThrow();
  });
});
