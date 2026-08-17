//packages/combat/src/battleResolution/damage.ts
// B-6 INC-2: damage wiring for the auto-resolution orchestrator (DESIGN-38 step
// 10 after gunnery step 8.5/9; DESIGN-41 §3 pipeline via `resolveDamage`).
//
// This module closes the B-3/B-4 seam: every HIT GunneryEventRecord is
// synthesized into a `GunneryImpact` (damage/engineWiring.ts) using the
// target's canonical layout + the B-4 armor model (ADR-0021 linear
// penetration: caliber * velocity / 1000), and `resolveDamage` updates the
// target's `ShipDamageState`. It also defines the canonical ship->damage-state
// construction and the hp mapping used by the damageReport (ADR-0026):
//
//   hp(state) = SINKING|FOUNDERED ? 0 :
//               floor(maxHitPoints * (structureBp + flotationBp) / 20_000)
//   where structureBp = clamp(floor(structuralIntegrity * 10_000 / STRUCTURE_UNIT),
//                             0, 10_000) and flotationBp analogously.
//   battleLoss = max(0, ship.hitPoints_at_battle_start - hp(state)).
//
// Pure/deterministic: the ONLY randomness is the keyed damage streams derived
// from the battle seed via RandomEngine (hit-zone selection; fire/flooding/
// magazine draws inside resolveDamage). No ambient I/O/clock/random.
import { SafeInt } from "@bluewave/contracts";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { RandomEngine, RandomLedger, drawUniform } from "@bluewave/random";
import type { GunneryEventRecord } from "../gunnery/event.js";
import type { TacticalContact } from "../contact/lifecycle.js";
import type { BattleEvent } from "../battleLedger.js";
import { type GunneryImpact, resolveDamage } from "../damage/engineWiring.js";
import { type ShipDamageState, withDamageStateHash } from "../damage/state.js";
import { DAMAGE_RULESET_VERSION, DAMAGE_FORMULA_VERSION } from "../damage/constants.js";
import {
  determinePenetrationOutcome,
  lookupArmorQualityMultiplierBp,
  manufacturingEffectiveThickness,
  type PenetrationOutcome,
} from "../damage/armorModel.js";
import { type SplinterIntensity } from "../damage/componentDamage.js";
import {
  AUTO_RESOLUTION_COMPARTMENTS,
  AUTO_RESOLUTION_COMPONENTS,
  ARMOR_QUALITY_FAMILY,
  FLOAT_LOSS_RATIO_BP,
  FLOAT_UNIT,
  HIT_DAMAGE_OUTCOME_BP,
  HIT_STRUCTURAL_DAMAGE_BASE,
  SHELL_IMPACT_ANGLE_DEG,
  SHELL_MUZZLE_VELOCITY_MS,
  STABILITY_INITIAL_BP,
  STRUCTURE_UNIT,
  type AutoResolutionZone,
} from "./constants.js";

// Damage runs between gunnery (substep 2) and nothing else in this slice:
// DESIGN-38 §3 step 9 gun actions -> step 10 apply damage. Event priority sits
// after gunnery (9).
export const DAMAGE_SUBSTEP = 3 as const;
export const DAMAGE_EVENT_PRIORITY = 10 as const;
export const DAMAGE_EVENT_TYPE = "damage_impact" as const;

// ---------------------------------------------------------------------------
// Per-target context (design-dependent surface the engine needs per ship)

export interface DamageTargetContext {
  shipId: string;
  /** Canonical armor zones in order (autoZonesForBelt). */
  zones: readonly AutoResolutionZone[];
  /** Ordered compartment stable-ids (ShipDamageState surface). */
  compartments: readonly string[];
  /** Ordered component stable-ids (ShipDamageState surface). */
  components: readonly string[];
  /** Current authoritative ShipDamageState. */
  state: ShipDamageState;
  /** Design (full) flotation reserve for terminal percentage calculations. */
  designFlotationReserve: number;
  /** Design (full) stability score in basis points [0, 10_000]. */
  designStabilityScore: number;
  /** Belt armor thickness in µm (zone thickness source). */
  beltArmorUm: number;
  /** Main gun caliber in µm (shell penetration source). */
  mainGunsCaliberUm: number;
  /** Canonical ship type string (fire-risk multiplier surface). */
  shipType: string;
  /** Campaign max hit points (hp mapping denominator). */
  maxHitPoints: number;
}

export interface DamageContext {
  battleId: string;
  /** Per-ship damage context; resolveMinuteDamage threads the updated states
   *  back into `targets` at the end of each resolved minute. */
  targets: Record<string, DamageTargetContext>;
  /** Keyed deterministic RNG (battle seed). Optional: structural/flotation
   *  losses still apply without it; fire/flooding/magazine/zone randomness is
   *  then fixed (draw 0 / first zone). */
  engine?: RandomEngine;
  /** Optional ledger recording every keyed draw (port pattern). */
  randomLedger?: RandomLedger;
}

// ---------------------------------------------------------------------------
// ShipDamageState construction + hp mapping (ADR-0026)

/** Build the pristine battle-start ShipDamageState for one ship. */
export function initialDamageState(shipId: string): ShipDamageState {
  return withDamageStateHash({
    shipId,
    compartments: [...AUTO_RESOLUTION_COMPARTMENTS],
    components: [...AUTO_RESOLUTION_COMPONENTS],
    structuralIntegrity: STRUCTURE_UNIT,
    flotationReserve: FLOAT_UNIT,
    stabilityScore: STABILITY_INITIAL_BP,
    fireRecords: [],
    floodingRecords: [],
    progressiveFloodingTotal: 0,
    performanceModifiers: {},
    terminalStatus: "NORMAL",
    rulesetVersion: DAMAGE_RULESET_VERSION,
    formulaVersion: DAMAGE_FORMULA_VERSION,
  });
}

function clampBp(v: number): number {
  if (v < 0) return 0;
  if (v > 10_000) return 10_000;
  return v;
}

/**
 * Current battle hp of a ship, integer fixed-point in [0, maxHitPoints].
 * A terminal ship (SINKING/FOUNDERED) has 0 hp (it is lost).
 */
export function hpOfState(state: ShipDamageState, maxHitPoints: number): SafeInt {
  if (state.terminalStatus !== "NORMAL") return SafeInt(0);
  const structuralBp = clampBp(Math.floor((state.structuralIntegrity * 10_000) / STRUCTURE_UNIT));
  const flotationBp = clampBp(Math.floor((state.flotationReserve * 10_000) / FLOAT_UNIT));
  const fractionBp = Math.floor((structuralBp + flotationBp) / 2); // equal 50/50 weights
  const hp = Math.floor((maxHitPoints * fractionBp) / 10_000);
  return SafeInt(Math.max(0, Math.min(maxHitPoints, hp)));
}

/** Accumulated battle loss in hp: battle-start hp minus current derived hp
 *  (integer, clamped at 0 — a battle can never repair a ship). */
export function battleLoss(
  battleStartHitPoints: number,
  state: ShipDamageState,
  maxHitPoints: number,
): SafeInt {
  return SafeInt(Math.max(0, battleStartHitPoints - (hpOfState(state, maxHitPoints) as number)));
}

// ---------------------------------------------------------------------------
// Impact synthesis: GunneryEventRecord HIT -> GunneryImpact (B-4 seam)

/** Canonical splinter intensity per penetration outcome (deterministic). */
export function splinterIntensityForOutcome(outcome: PenetrationOutcome): SplinterIntensity {
  switch (outcome) {
    case "SPLINTER_EFFECT":
      return "LIGHT";
    case "PARTIAL_PENETRATION":
      return "MEDIUM";
    default:
      return "NONE";
  }
}

/** Effective armored resistance for a zone (manufacturing + quality, integer µm). */
export function effectiveResistanceUm(zone: { thicknessUm: number }): number {
  const armored = manufacturingEffectiveThickness(zone.thicknessUm);
  const qualityBp = lookupArmorQualityMultiplierBp(ARMOR_QUALITY_FAMILY);
  return Math.floor((armored * qualityBp) / 10_000);
}

// ADR-0021: linear penetration `caliber * velocity / 1000` (mm scale, floored),
// then re-scaled to µm for the armor comparison.
export function shellPenetrationUm(caliberUm: number, velocityMS: number): number {
  const caliberMm = Math.floor(caliberUm / 1_000_000);
  const penetrationMm = Math.floor((caliberMm * velocityMS) / 1_000);
  return penetrationMm * 1_000_000;
}

const HULL_BREACH_OUTCOMES: ReadonlySet<string> = new Set([
  "FULL_PENETRATION",
  "CRITICAL_PENETRATION",
  "PASS_THROUGH",
]);

export interface SynthesizeImpactInput {
  salvo: GunneryEventRecord;
  targetShipId: string;
  zone: AutoResolutionZone;
  beltArmorUm: number;
  mainGunsCaliberUm: number;
  shipType: string;
}

/** Make a damage-facing GunneryImpact from a HIT salvo + the target's zone. */
export function synthesizeImpact(input: SynthesizeImpactInput): GunneryImpact {
  const { salvo, targetShipId, zone, mainGunsCaliberUm, shipType } = input;
  const hitLocation = zone.id;
  const effectiveResistance = effectiveResistanceUm(zone);
  const penetrationCapability = shellPenetrationUm(mainGunsCaliberUm, SHELL_MUZZLE_VELOCITY_MS);
  const penetrationOutcome = determinePenetrationOutcome(
    penetrationCapability,
    effectiveResistance,
    SHELL_IMPACT_ANGLE_DEG,
    zone.critical,
  );
  const splinterIntensity = splinterIntensityForOutcome(penetrationOutcome);

  const dmgBp = HIT_DAMAGE_OUTCOME_BP[penetrationOutcome] as number;
  const structuralDamage = Math.floor((HIT_STRUCTURAL_DAMAGE_BASE * dmgBp) / 10_000);
  const hullBreach =
    HULL_BREACH_OUTCOMES.has(penetrationOutcome) && (zone.id === "BELT" || zone.id === "MAGAZINE");
  const flotationDamage = hullBreach
    ? Math.floor((structuralDamage * FLOAT_LOSS_RATIO_BP) / 10_000)
    : 0;

  return {
    sourceId: salvo.batteryId,
    weaponId: salvo.batteryId,
    targetShipId,
    hitLocation,
    penetrationOutcome,
    splinterIntensity,
    effectiveResistanceUm: effectiveResistance,
    penetrationMargin: penetrationCapability - effectiveResistance,
    structuralDamage,
    flotationDamage,
    shipType,
    hasCombustible: true,
    hasOxygen: true,
    hullBreach,
    hasWaterRoute: hullBreach,
    hasMagazineInZone: zone.critical,
    hitZoneType: zone.id,
    catastrophicBreakup: false,
    capsizeRisk: false,
    designFlotationReserve: FLOAT_UNIT,
    designStabilityScore: STABILITY_INITIAL_BP,
  };
}

// ---------------------------------------------------------------------------
// resolveMinuteDamage — the step-10 stage the engine calls after gunnery.

function assetIdForContact(contactId: string, contacts: readonly TacticalContact[]): string {
  for (const c of contacts) {
    if (c.contactId === contactId) return c.assetId;
  }
  return "";
}

export interface ResolveMinuteDamageInput {
  battleId: string;
  minute: number;
  salvos: readonly GunneryEventRecord[];
  contacts: readonly TacticalContact[];
  targets: Record<string, DamageTargetContext>;
  engine?: RandomEngine;
  randomLedger?: RandomLedger;
}

export interface ResolveMinuteDamageOutput {
  /** Ledger-ready BattleEvents (one per damage event record). */
  events: BattleEvent[];
  /** Updated per-ship damage states (only ships that absorbed hits). */
  states: Record<string, ShipDamageState>;
  /** Targets with the updated states threaded (next minute's context). */
  updatedTargets: Record<string, DamageTargetContext>;
}

/**
 * Resolve one minute of damage: for every HIT salvo pick the target's hit zone
 * (keyed draw; first zone without an engine), synthesize the impact, group by
 * ship, and run `resolveDamage` per ship (canonical shipId order). The keyedRng
 * passed into `resolveDamage` is scoped by (battleId, minute, substep, impact
 * ordinal), so the engine's per-impact stages (fire, flooding, magazine) draw
 * from distinct deterministic streams (ADR-0026 §random).
 */
export function resolveMinuteDamage(input: ResolveMinuteDamageInput): ResolveMinuteDamageOutput {
  const { battleId, minute, salvos, contacts, targets, engine, randomLedger } = input;
  const events: BattleEvent[] = [];
  const states: Record<string, ShipDamageState> = {};
  const updatedTargets: Record<string, DamageTargetContext> = {};
  const byTarget = new Map<string, GunneryImpact[]>();

  for (const salvo of salvos) {
    if (salvo.outcome !== "HIT") continue;
    const targetShipId = assetIdForContact(salvo.targetContactId, contacts);
    if (!targetShipId) continue;
    const target = targets[targetShipId];
    if (!target) continue; // every committed ship is in targets; defensive no-op

    const zone = pickZone(engine, battleId, target, minute, salvo, randomLedger);

    const impact: GunneryImpact = synthesizeImpact({
      salvo,
      targetShipId,
      zone,
      beltArmorUm: target.beltArmorUm,
      mainGunsCaliberUm: target.mainGunsCaliberUm,
      shipType: target.shipType,
    });

    const list = byTarget.get(targetShipId) ?? [];
    list.push(impact);
    byTarget.set(targetShipId, list);
  }

  const shipIds = [...byTarget.keys()].sort();
  for (const shipId of shipIds) {
    const impacts = byTarget.get(shipId) ?? [];
    if (impacts.length === 0) continue;
    const target = targets[shipId]!;

    // One keyedRng per resolveDamage call: every draw invocation (one per
    // impact stage: fire, flooding, magazine) consumes a distinct deterministic
    // stream via a monotonically increasing call counter, so multi-impact
    // minutes never reuse a stream (ADR-0026 §random). Order of calls is fixed
    // by engineWiring's pipeline stage order.
    let drawCall = 0;
    const scopedRng = (stream: string): number => {
      const domain = `${stream}:${battleId}:${minute}:${DAMAGE_SUBSTEP}:${drawCall}`;
      drawCall += 1;
      if (!engine) return 0;
      const draw = engine.stream(domain).next();
      if (randomLedger) {
        randomLedger.record({
          streamId: domain,
          entityKey: shipId,
          phase: "resolve_battle_auto_resolution_damage",
          rulesetVersion: DAMAGE_RULESET_VERSION,
          inputHash: sha256Hex(
            canonicalSerialize({
              battleId,
              minute,
              shipId,
              impacts: impacts.map((i) => i.targetShipId),
              stream,
            }),
          ),
          draw,
          outcome: String(draw),
          reasonCode: "DAMAGE_KEYED_DRAW",
        });
      }
      return draw;
    };

    const { newState, events: damageEventRecords } = resolveDamage(
      target.state,
      impacts,
      minute,
      DAMAGE_SUBSTEP,
      scopedRng,
    );

    for (const dmgEvent of damageEventRecords) {
      events.push({
        battleId,
        minute,
        substep: DAMAGE_SUBSTEP,
        eventPriority: DAMAGE_EVENT_PRIORITY,
        eventType: DAMAGE_EVENT_TYPE,
        actorId: dmgEvent.sourceId,
        targetId: dmgEvent.targetShipId,
        eventId: `${battleId}:${minute}:${DAMAGE_SUBSTEP}:${DAMAGE_EVENT_TYPE}:${dmgEvent.sourceId}:${dmgEvent.targetShipId}`,
        eventHash: dmgEvent.recordHash,
      });
    }

    states[shipId] = newState;
    updatedTargets[shipId] = { ...target, state: newState };
  }

  return { events, states, updatedTargets };
}

/** Deterministic canonical zone pick — keyed stream when an engine is present,
 *  else the first zone ("BELT"). The stream is keyed by target ship AND salvo
 *  battery (each battery fires ≤1 salvo/minute, so batteryId is a stable,
 *  unique per-salvo ordinal): multi-impact minutes never reuse a stream, so
 *  every HIT draws its zone independently (ENGINEERING-CONTRACT domain
 *  separation; ADR-0026 §random). The draw is recorded in the random ledger. */
function pickZone(
  engine: RandomEngine | undefined,
  battleId: string,
  target: DamageTargetContext,
  minute: number,
  salvo: GunneryEventRecord,
  randomLedger?: RandomLedger,
): AutoResolutionZone {
  if (!engine || target.zones.length === 0) return target.zones[0]!;
  const streamId = `battle/damage/hit_zone:${battleId}:${minute}:${DAMAGE_SUBSTEP}:${target.shipId}:${salvo.batteryId}`;
  const stream = engine.stream(streamId);
  const draw = drawUniform(stream, SafeInt(0), SafeInt(target.zones.length - 1));
  if (randomLedger) {
    randomLedger.record({
      streamId,
      entityKey: target.shipId,
      phase: "resolve_battle_auto_resolution_hit_zone",
      rulesetVersion: DAMAGE_RULESET_VERSION,
      inputHash: "",
      draw: draw as number,
      outcome: target.zones[draw as number]!.id,
      reasonCode: "DAMAGE_HIT_ZONE_DRAW",
    });
  }
  return target.zones[draw as number]!;
}
