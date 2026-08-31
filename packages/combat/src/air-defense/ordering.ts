// packages/combat/src/air-defense/ordering.ts
// D-4 M4 Aviation: Air Defense — AC-15 canonical ordering per DESIGN-45 §27.
// Parallel to air-combat/ordering.ts pattern.
import type { AirDefenseEngagementRecord } from "./records.js";
import { outcomeEffectOrdinal } from "./records.js";
import type { LayerId } from "./air-defense-system-definition.js";

const LAYER_ORDER: ReadonlyMap<LayerId, number> = new Map<LayerId, number>([
  ["HEAVY_AA", 0],
  ["MEDIUM_AA", 1],
  ["LIGHT_AA", 2],
  ["CIWS_TERMINAL_DEFENSE", 3],
]);

/**
 * Codepoint string comparison (NOT localeCompare).
 * Deterministic, locale-free, platform-independent.
 */
export function compareStrings(a: string, b: string): number {
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (a.charCodeAt(i) !== b.charCodeAt(i)) return a.charCodeAt(i) - b.charCodeAt(i);
  }
  return a.length - b.length;
}

/**
 * §27 canonical ordering for air-defense engagement records.
 *
 * Order: (1) arrival time ascending; (2) defense-layer order from §1;
 * (3) defended ship identifier ascending; (4) threat priority descending;
 * (5) defense-system identifier ascending; (6) director/radar-channel identifier ascending;
 * (7) engagement identifier ascending; (8) outcome effect ordinal ascending.
 *
 * Database insertion order, UI order, localized names, rendering order,
 * and wall-clock time MUST NOT affect results.
 */
export function compareAirDefenseEngagementRecords(
  a: AirDefenseEngagementRecord,
  b: AirDefenseEngagementRecord,
): number {
  // (1) battle minute ascending
  const byMinute = Number(a.battleMinute) - Number(b.battleMinute);
  if (byMinute !== 0) return byMinute;

  // (1b) substep ascending
  const bySubstep = Number(a.substep) - Number(b.substep);
  if (bySubstep !== 0) return bySubstep;

  // (2) defense-layer order from §1
  const layerA = LAYER_ORDER.get(a.layer) ?? 99;
  const layerB = LAYER_ORDER.get(b.layer) ?? 99;
  if (layerA !== layerB) return layerA - layerB;

  // (3) defended ship identifier ascending (codepoint)
  const byDefender = compareStrings(a.defenderId, b.defenderId);
  if (byDefender !== 0) return byDefender;

  // (4) threat priority — encoded in outcomeProbabilityBp; higher = more dangerous = sort first (descending)
  if (Number(a.outcomeProbabilityBp) !== Number(b.outcomeProbabilityBp)) {
    return Number(b.outcomeProbabilityBp) - Number(a.outcomeProbabilityBp);
  }

  // (5) defense-system identifier ascending
  const bySystem = compareStrings(a.systemId, b.systemId);
  if (bySystem !== 0) return bySystem;

  // (6) director and radar-channel identifier ascending
  const byChannel = compareStrings(a.channelId, b.channelId);
  if (byChannel !== 0) return byChannel;

  // (7) attacker as engagement identifier ascending
  const byAttacker = compareStrings(a.attackerId, b.attackerId);
  if (byAttacker !== 0) return byAttacker;

  // (8) outcome effect ordinal ascending
  const byOutcome = outcomeEffectOrdinal(a.outcome) - outcomeEffectOrdinal(b.outcome);
  return byOutcome;
}

export function canonicallySortedRecords(
  records: readonly AirDefenseEngagementRecord[],
): AirDefenseEngagementRecord[] {
  return [...records].sort(compareAirDefenseEngagementRecords);
}
