import type { SafeInt } from "@bluewave/contracts";

export type EventVersion = string;
export type AggregateType = string;
export type AggregateId = string;
export type EventType = DomainEventBody["kind"];
export type Reason = string;

export interface NationBudgetChanged {
  readonly kind: "NationBudgetChanged";
  readonly nationId: string;
  readonly previousTreasury: SafeInt;
  readonly newTreasury: SafeInt;
  readonly delta: SafeInt;
  readonly reason: Reason;
}

export interface ConstructionProgressed {
  readonly kind: "ConstructionProgressed";
  readonly projectId: string;
  readonly nationId: string;
  readonly previousWork: SafeInt;
  readonly newWork: SafeInt;
  readonly workAdded: SafeInt;
}

/**
 * The transition record of a completed rebuild (ADR-0078, DESIGN-23 section 22): the ship changed from one compiled design
 * version to another. The old version stays persisted; this event is the ship-specific record of the change.
 */
export interface ShipRebuilt {
  readonly kind: "ShipRebuilt";
  readonly projectId: string;
  readonly nationId: string;
  readonly shipId: string;
  readonly fromDesignVersionId: string;
  readonly toDesignVersionId: string;
}

export interface ResearchProgressed {
  readonly kind: "ResearchProgressed";
  readonly nationId: string;
  readonly techId: string;
  readonly previousPoints: SafeInt;
  readonly newPoints: SafeInt;
}

export interface BattleInitiated {
  readonly kind: "BattleInitiated";
  readonly battleId: string;
  readonly attackerId: string;
  readonly defenderId: string;
  readonly areaId: string;
}

export interface BattleResolved {
  readonly kind: "BattleResolved";
  readonly battleId: string;
  readonly winnerId: string;
  readonly loserId: string;
}

export interface TechnologyDiscovered {
  readonly kind: "TechnologyDiscovered";
  readonly nationId: string;
  readonly techId: string;
  readonly researchFieldId: string;
  readonly discoveryMonth: string;
  readonly cost: SafeInt;
}

export type DomainEventBody =
  | NationBudgetChanged
  | ConstructionProgressed
  | ShipRebuilt
  | ResearchProgressed
  | BattleInitiated
  | BattleResolved
  | TechnologyDiscovered;

export interface DomainEventEnvelope<TBody extends DomainEventBody = DomainEventBody> {
  readonly eventId: string;
  readonly version: EventVersion;
  readonly aggregateType: AggregateType;
  readonly aggregateId: AggregateId;
  readonly eventType: TBody["kind"];
  readonly timestamp: string;
  readonly body: TBody;
  readonly sequenceNumber: SafeInt;
}
