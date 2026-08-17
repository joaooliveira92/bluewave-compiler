import { SafeInt } from "@bluewave/contracts";
import type { DomainEventEnvelope } from "@bluewave/events";
import type { LedgerTransactionInput } from "./financial-ledger.js";

export const CURRENT_VERSION = "0.1.0" as const;

export function budgetChangedEvent(
  nationId: string,
  previousTreasury: SafeInt,
  newTreasury: SafeInt,
  delta: SafeInt,
  reason: string,
  seq: SafeInt,
  campaignMonth: string,
): DomainEventEnvelope {
  return {
    eventId: `NationBudgetChanged-${nationId}-${String(seq)}`,
    version: CURRENT_VERSION,
    aggregateType: "nation",
    aggregateId: nationId,
    eventType: "NationBudgetChanged",
    // ADR-0035: domain events carry a deterministic ISO-8601 timestamp derived
    // from the campaign month (the validated DomainEventEnvelope schema
    // requires z.string().datetime). The first day of the month at UTC keeps
    // it wall-clock/locale-free and turn-distinct.
    timestamp: `${campaignMonth}-01T00:00:00.000Z`,
    body: {
      kind: "NationBudgetChanged",
      nationId,
      previousTreasury,
      newTreasury,
      delta,
      reason,
    },
    sequenceNumber: seq,
  };
}

export function constructionProgressedEvent(
  projectId: string,
  nationId: string,
  previousWork: SafeInt,
  newWork: SafeInt,
  workAdded: SafeInt,
  seq: SafeInt,
  campaignMonth: string,
): DomainEventEnvelope {
  return {
    eventId: `ConstructionProgressed-${projectId}-${String(seq)}`,
    version: CURRENT_VERSION,
    aggregateType: "construction",
    aggregateId: projectId,
    eventType: "ConstructionProgressed",
    // ADR-0035: deterministic ISO-8601 timestamp from the campaign month.
    timestamp: `${campaignMonth}-01T00:00:00.000Z`,
    body: {
      kind: "ConstructionProgressed",
      projectId,
      nationId,
      previousWork,
      newWork,
      workAdded,
    },
    sequenceNumber: seq,
  };
}

export function researchProgressedEvent(
  nationId: string,
  techId: string,
  previousPoints: SafeInt,
  newPoints: SafeInt,
  seq: SafeInt,
  campaignMonth: string,
): DomainEventEnvelope {
  return {
    eventId: `ResearchProgressed-${nationId}-${String(seq)}`,
    version: CURRENT_VERSION,
    aggregateType: "research",
    aggregateId: techId,
    eventType: "ResearchProgressed",
    // ADR-0035: deterministic ISO-8601 timestamp from the campaign month.
    timestamp: `${campaignMonth}-01T00:00:00.000Z`,
    body: {
      kind: "ResearchProgressed",
      nationId,
      techId,
      previousPoints,
      newPoints,
    },
    sequenceNumber: seq,
  };
}

export function makeLedgerEntry(
  nationId: string,
  phaseId: string,
  categoryId: string,
  debit: SafeInt,
  credit: SafeInt,
  previousBalance: SafeInt,
  newBalance: SafeInt,
  reason: string,
  campaignMonth: string,
): LedgerTransactionInput {
  return {
    campaignMonth,
    phaseId,
    nationId,
    categoryId,
    debit,
    credit,
    previousBalance,
    newBalance,
    reason,
  };
}
