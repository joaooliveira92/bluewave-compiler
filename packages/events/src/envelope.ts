import type { SafeInt } from "@bluewave/contracts";

export type EventVersion = string;
export type AggregateType = string;
export type AggregateId = string;
export type EventType = string;
export type Reason = string;

export interface NationBudgetChanged {
  kind: "NationBudgetChanged";
  nationId: string;
  previousTreasury: SafeInt;
  newTreasury: SafeInt;
  delta: SafeInt;
  reason: Reason;
}

export interface ConstructionProgressed {
  kind: "ConstructionProgressed";
  projectId: string;
  nationId: string;
  previousWork: SafeInt;
  newWork: SafeInt;
  workAdded: SafeInt;
}

export interface ResearchProgressed {
  kind: "ResearchProgressed";
  nationId: string;
  techId: string;
  previousPoints: SafeInt;
  newPoints: SafeInt;
}

export interface BattleInitiated {
  kind: "BattleInitiated";
  battleId: string;
  attackerId: string;
  defenderId: string;
  areaId: string;
}

export interface BattleResolved {
  kind: "BattleResolved";
  battleId: string;
  winnerId: string;
  loserId: string;
}

export interface TechnologyDiscovered {
  kind: "TechnologyDiscovered";
  nationId: string;
  techId: string;
  researchFieldId: string;
  discoveryMonth: string;
  cost: SafeInt;
}

export type DomainEventBody =
  | NationBudgetChanged
  | ConstructionProgressed
  | ResearchProgressed
  | BattleInitiated
  | BattleResolved
  | TechnologyDiscovered;

export interface DomainEventEnvelope<TBody extends DomainEventBody = DomainEventBody> {
  eventId: string;
  version: EventVersion;
  aggregateType: AggregateType;
  aggregateId: AggregateId;
  eventType: EventType;
  timestamp: string;
  body: TBody;
  sequenceNumber: SafeInt;
}
