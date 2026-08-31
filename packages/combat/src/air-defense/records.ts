// packages/combat/src/air-defense/records.ts
// D-4 M4 Aviation: Air Defense — AC-15 AirDefenseEngagementRecord per DESIGN-45 §26.
// Parallel to air-combat/records.ts pattern.
import { SafeInt } from "@bluewave/contracts";
import { createEnvelope } from "@bluewave/deterministic";
import { AIR_DEFENSE_INVARIANT_FAILED } from "./reason-codes.js";
import type { LayerId } from "./air-defense-system-definition.js";
import type { DisruptionSeverityType } from "./air-defense-state.js";
import type { EngagementOutcome } from "./engagement.js";

export const AIR_DEFENSE_RECORD_POLICY_ID = "air_defense_record_v1" as const;

/** Disruption severity ordinal for canonical ordering (§27 outcome ordinal). */
const DISRUPTION_OUTCOME_ORDINAL: Record<string, number> = {
  KILL: 0,
  DAMAGE: 1,
  ABORT: 2,
  DISRUPTION: 3,
  NO_EFFECT: 4,
};

export interface AirDefenseEngagementRecord {
  battleMinute: SafeInt;
  substep: SafeInt;
  defenderId: string;
  attackerId: string;
  attackType: string;
  terminalProfile: string;
  layer: LayerId;
  systemId: string;
  directorState: string;
  radarState: string;
  crewQualityBp: SafeInt;
  damageState: string;
  powerState: string;
  ammunitionState: string;
  timingMs: SafeInt;
  channelId: string;
  directorScalingBp: SafeInt;
  radarSaturationBp: SafeInt;
  ciwsRedundancyBp: SafeInt;
  outcomeProbabilityBp: SafeInt;
  randomDrawBp: SafeInt;
  outcome: EngagementOutcome;
  disruptionSeverity: DisruptionSeverityType | null;
  formulaVersion: string;
  rulesetVersion: string;
  policyId: string;
  recordHash: string;
}

type AirDefenseEngagementRecordBody = Omit<AirDefenseEngagementRecord, "recordHash">;

export function computeAirDefenseEngagementRecordHash(
  body: AirDefenseEngagementRecordBody,
): string {
  const envelope = createEnvelope("air-defense-record", AIR_DEFENSE_RECORD_POLICY_ID, body);
  return envelope.bodyHash;
}

export function createAirDefenseEngagementRecord(
  params: AirDefenseEngagementRecordBody,
): AirDefenseEngagementRecord {
  const body: AirDefenseEngagementRecordBody = { ...params };
  return { ...body, recordHash: computeAirDefenseEngagementRecordHash(body) };
}

export function verifyAirDefenseEngagementRecordHash(record: AirDefenseEngagementRecord): boolean {
  const { recordHash, ...body } = record;
  return computeAirDefenseEngagementRecordHash(body) === recordHash;
}

export function assertAirDefenseEngagementRecordHash(record: AirDefenseEngagementRecord): void {
  if (!verifyAirDefenseEngagementRecordHash(record)) {
    throw new Error(AIR_DEFENSE_INVARIANT_FAILED);
  }
}

/**
 * Returns the outcome-effect ordinal for §27 canonical ordering (tie-breaker #8).
 */
export function outcomeEffectOrdinal(outcome: EngagementOutcome): number {
  return DISRUPTION_OUTCOME_ORDINAL[outcome] ?? 99;
}
