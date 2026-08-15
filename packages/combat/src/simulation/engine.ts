//packages/combat/src/simulation/engine.ts
// DESIGN-38 §3 tactical minute-advance simulation over TacticalBattleState, steps
// 4-8 in order:
//   4 update_contact_knowledge, 5 resolve_movement_intent,
//   6 resolve_propulsion_formation, 7 resolve_collisions_grounding (empty hook),
//   8 resolve_sensors_spotting.
// Uses the existing BattleLedger + canonicalEventOrder and computes a minute-state
// hash per minute. Pure/deterministic: no ambient clock, random, or I/O.
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { RandomEngine } from "@bluewave/random";
import type { MovementState } from "../movement.js";
import {
  resolvePropulsion,
  resolveTurning,
  advancePosition,
  resolveCollisionsGrounding,
} from "../movement/kinematics.js";
import {
  resolveSensorsSpotting,
  type SensorObserver,
  type TrueAsset,
} from "../spotting/detection.js";
import {
  ageContact,
  isStale,
  updateContact,
  createContactTrack,
  type TacticalContact,
} from "../contact/lifecycle.js";
import { BattleLedger, type BattleEvent } from "../battleLedger.js";
import { resolveGunnery, type GunneryBattery } from "../gunnery/index.js";
import { resolveWeather, type WeatherEngineContext } from "../weather/engine.js";
import type { BattleWeatherComponents } from "../weather/components.js";
import { SUBSTEPS_PER_MINUTE } from "../movement/constants.js";
import type { TacticalBattleState } from "../tactical/index.js";
import type { GunneryState } from "../gunnery/index.js";

export interface UnitOrders {
  orderedHeading: number;
  orderedSpeedBp: number;
  attainableMaxBp?: number;
}

export interface AdvanceMinuteInput {
  state: TacticalBattleState;
  minute: number;
  observationTime: string;
  orders?: Record<string, UnitOrders>;
  attackRangeUm?: number;
  engine?: RandomEngine;
  // Optional surface-gunnery batteries (DESIGN-39 / B-3 INC-4) to resolve after
  // spotting (step 8). When absent or empty, gunnery resolution is a strict no-op:
  // zero events appended, minute snapshot/minuteHash byte-identical to the baseline.
  gunnery?: GunneryBattery[];
  // Optional weather-engine context (B-5 / INC-5). When absent, weather resolution
  // is a strict no-op: zero events appended, hashes unchanged.
  weather?: WeatherEngineContext;
}

export interface MinuteResult {
  minute: number;
  movementStates: Record<string, MovementState>;
  contacts: TacticalContact[];
  events: BattleEvent[];
  minuteHash: string;
  // Updated per-battery GunneryState (batteryId -> state) after this minute's
  // gunnery stage. Present only when gunnery batteries were supplied.
  gunneryStates?: Record<string, GunneryState>;
  // Updated weather components after this minute's weather stage. Present only
  // when weather context was supplied.
  weatherComponents?: BattleWeatherComponents;
}

// atomic mutable snapshot used through one minute.
interface UnitRun {
  assetId: string;
  movement: MovementState;
}

// Deterministic event identifier: derived solely from the event's canonical
// fields, so repeated runs and child processes emit identical eventIds (no
// module-level counter; ENGINEERING-CONTRACT determinism). The fields already
// distinguish every event this pipeline emits: pipeline phase events share
// minute/substep but differ by eventType; contact events embed the stable
// contact key in actorId and targetId.
function evt(
  minute: number,
  substep: number,
  eventType: string,
  priority: number,
  actorId: string,
  battleId: string,
  targetId = "",
): BattleEvent {
  const eventId = `${battleId}:${minute}:${substep}:${eventType}:${actorId}:${targetId}`;
  return {
    battleId,
    minute,
    substep,
    eventPriority: priority,
    actorId,
    targetId,
    eventId,
    eventType,
  };
}

function cloneMovementState(m: MovementState): MovementState {
  return { ...m, ...(m.position ? { position: [m.position[0], m.position[1]] } : {}) };
}

export function advanceMinute(input: AdvanceMinuteInput): MinuteResult {
  const { battleId } = input.state;
  const minute = input.minute;
  const ledger = new BattleLedger();
  const units = input.state.units ?? [];
  // Deep copy movement states so sub-step integration (step 6) never mutates the
  // caller's authoritative state (immutable typed transitions, ENGINEERING-CONTRACT).
  const movement: Record<string, MovementState> = {};
  for (const [k, v] of Object.entries(input.state.movementStates ?? {})) {
    movement[k] = cloneMovementState(v);
  }
  const run: UnitRun[] = units.map((u) => {
    const m = movement[u.assetId] ?? {
      position: [0, 0],
      heading: 0,
      orderedSpeed: 0,
      currentSpeed: 0,
      acceleration: 0,
      turningRate: 1_000,
      collisionRadius: 5_000_000,
      propulsionState: "steam",
      machineryReliability: 10_000,
      fuelState: "coal",
      formationStation: "LEAD",
    };
    return { assetId: u.assetId, movement: m };
  });

  // Step 4: update contact and knowledge state (age by 1 minute; drop dead).
  let contacts: TacticalContact[] = (input.state.contacts ?? []).map((c) => ageContact(c, 1));
  const before = contacts
    .filter((c) => !isStale(c))
    .map((c) => c.contactId)
    .sort();
  contacts = contacts.filter((c) => !isStale(c));
  ledger.append(evt(minute, 0, "update_contact_knowledge", 4, "pipeline", battleId));

  // Step 5: resolve movement intent — apply orders to each unit.
  const orders = input.orders ?? {};
  const resolvedMovements: Record<string, MovementState> = {};
  for (const u of run) {
    const ord = orders[u.assetId];
    const next: MovementState = {
      ...u.movement,
      orderedSpeed: ord?.orderedSpeedBp ?? u.movement.orderedSpeed,
    };
    resolvedMovements[u.assetId] = next;
    u.movement = next;
  }
  ledger.append(evt(minute, 0, "resolve_movement_intent", 5, "pipeline", battleId));

  // Step 6: resolve propulsion, turning, and position (60 deterministic substeps).
  for (let sub = 0; sub < SUBSTEPS_PER_MINUTE; sub++) {
    for (const u of run) {
      const ord = orders[u.assetId];
      const m = u.movement;
      m.currentSpeed = resolvePropulsion({
        currentSpeed: m.currentSpeed,
        orderedSpeed: m.orderedSpeed,
        dtSeconds: 1,
        attainableMaxBpKnots: ord?.attainableMaxBp ?? m.orderedSpeed,
      });
      // With no order, a unit holds its existing course (heading==orderedHeading
      // yields zero turn), rather than inventing a magnetic-north bias (F4).
      m.heading = resolveTurning({
        heading: m.heading,
        orderedHeading: ord?.orderedHeading ?? m.heading,
        dtSeconds: 1,
        turningRateMdegS: m.turningRate,
      });
      m.position = advancePosition({
        state: { ...m, currentSpeed: m.currentSpeed, heading: m.heading },
        dtSeconds: 1,
      });
    }
  }
  for (const u of run) resolvedMovements[u.assetId] = { ...u.movement };
  ledger.append(evt(minute, 0, "resolve_propulsion_formation", 6, "pipeline", battleId));

  // Step 7: collisions/grounding — successful empty record (deferred resolution).
  const collisionRecord = resolveCollisionsGrounding();
  ledger.append(evt(minute, 0, "resolve_collisions_grounding", 7, "pipeline", battleId));

  // Step 7.5 (B-5 / INC-5): resolve weather — time-of-day, progression,
  // and visibility before spotting. Strict no-op when no weather context is
  // supplied (zero events -> minute hash byte-identical to B-2/B-3/B-4).
  let weatherComponents: BattleWeatherComponents | undefined;
  if (input.weather) {
    const weatherResult = resolveWeather({
      context: input.weather,
      battleId,
      minute,
    });
    for (const we of weatherResult.ledgerEvents) ledger.append(we);
    weatherComponents = weatherResult.nextComponents;
  }

  // Step 8: resolve sensor and spotting updates.
  const observers: SensorObserver[] = units.map((u) => ({
    observerId: `obs-${u.assetId}`,
    sideId: u.sideId,
    position: resolvedMovements[u.assetId]!.position,
  }));
  const assets: TrueAsset[] = units.map((u) => ({
    assetId: u.assetId,
    sideId: u.sideId,
    position: resolvedMovements[u.assetId]!.position,
    heading: resolvedMovements[u.assetId]!.heading,
    speedBpKnots: resolvedMovements[u.assetId]!.currentSpeed,
    estimatedClass: u.className,
  }));
  const detected = resolveSensorsSpotting({
    observers,
    assets,
    battleId,
    minute,
    observationTime: input.observationTime,
    contractRangeUm: input.attackRangeUm,
  });
  const byKey = new Map(contacts.map((c) => [c.contactId, c]));
  const seen = new Set<string>();
  for (const d of detected) {
    const key = d.contactId;
    seen.add(key);
    const existing = byKey.get(key);
    if (existing) {
      const merged: TacticalContact = updateContact(existing, {
        position: d.position,
        course: d.course,
        speedBpKnots: d.speed,
        observationTime: d.observationTime,
        minute,
        source: d.source,
      });
      byKey.set(key, merged);
      ledger.append(evt(minute, 1, "contact_updated", 8, `obs-${key}`, battleId, key));
    } else {
      const created = createContactTrack({
        battleId,
        assetId: d.assetId,
        sideId: d.sideId,
        estimatedIdentity: d.estimatedIdentity,
        position: d.position,
        course: d.course,
        speedBpKnots: d.speed,
        observationTime: d.observationTime,
        minute,
        source: d.source,
      });
      byKey.set(key, created);
      ledger.append(evt(minute, 0, "contact_created", 8, `obs-${key}`, battleId, key));
    }
  }
  const afterContacts = [...byKey.values()];
  ledger.append(evt(minute, 0, "resolve_sensors_spotting", 8, "pipeline", battleId));

  // Step 8.5 (DESIGN-39 / B-3 INC-4): surface-gunnery resolution AFTER spotting,
  // using the just-updated legal contact tracks. Strict no-op when no batteries are
  // supplied (no gunneryState on any unit) -> zero events appended, so the minute
  // snapshot/minuteHash remain byte-identical to the pre-INC-4 output (AC-15).
  let gunneryStates: Record<string, GunneryState> | undefined;
  const gunneryBatteries = input.gunnery ?? [];
  if (gunneryBatteries.length > 0) {
    const gres = resolveGunnery({
      battleId,
      minute,
      batteries: gunneryBatteries,
      contacts: afterContacts,
      engine: input.engine,
    });
    for (const ge of gres.events) ledger.append(ge);
    gunneryStates = gres.nextStates;
  }

  const events = ledger.sorted();
  const snapshot = {
    battleId,
    minute,
    units: units.map((u) => ({
      assetId: u.assetId,
      position: resolvedMovements[u.assetId]!.position,
      heading: resolvedMovements[u.assetId]!.heading,
      currentSpeed: resolvedMovements[u.assetId]!.currentSpeed,
    })),
    contacts: afterContacts.map((c) => ({
      contactId: c.contactId,
      assetId: c.assetId,
      position: c.position,
      course: c.course,
      speed: c.speed,
      confidence: c.confidence,
      stale: c.stale,
    })),
    collisionEmpty: collisionRecord.empty,
    droppedContacts: before.filter((id) => !byKey.has(id)),
    events: events.map((e) => ({
      minute: e.minute,
      substep: e.substep,
      eventPriority: e.eventPriority,
      eventType: e.eventType,
      eventId: e.eventId,
    })),
  };
  const minuteHash = sha256Hex(canonicalSerialize(snapshot));

  return {
    minute,
    movementStates: resolvedMovements,
    contacts: afterContacts,
    events: ledger.sorted(),
    minuteHash,
    ...(gunneryStates ? { gunneryStates } : {}),
    ...(weatherComponents ? { weatherComponents } : {}),
  };
}

// AC-12: advance a battle state N full minutes in DESIGN-38 order, collecting a
// minute hash per minute.
export interface AdvanceMinutesInput {
  state: TacticalBattleState;
  minutes: number;
  observationTime: string;
  orders?: Record<string, UnitOrders>;
  attackRangeUm?: number;
  engine?: RandomEngine;
  gunnery?: GunneryBattery[];
  /** Optional weather-engine context (B-5 / INC-5). When absent, weather
   *  resolution is a strict no-op across all minutes. */
  weather?: WeatherEngineContext;
}
export interface AdvanceMinutesResult {
  results: MinuteResult[];
  hashes: string[];
  finalState: TacticalBattleState;
}
export function advanceMinutes(input: AdvanceMinutesInput): AdvanceMinutesResult {
  const results: MinuteResult[] = [];
  let gunnery = input.gunnery;
  let weather = input.weather;
  let state: TacticalBattleState = {
    ...input.state,
    contacts: [...(input.state.contacts ?? [])],
    movementStates: { ...input.state.movementStates },
  };
  for (let minute = 1; minute <= input.minutes; minute++) {
    const res = advanceMinute({
      state,
      minute,
      observationTime: input.observationTime,
      orders: input.orders,
      attackRangeUm: input.attackRangeUm,
      engine: input.engine,
      gunnery,
      weather,
    });
    results.push(res);
    state = {
      ...state,
      contacts: res.contacts.map((c) => ({ ...c })),
      movementStates: Object.fromEntries(
        Object.entries(res.movementStates).map(([k, v]) => [k, { ...v }]),
      ),
    };
    // Thread the updated battery states into the next minute so ammunition/reload
    // progress persists deterministically across minutes.
    if (res.gunneryStates && gunnery) {
      gunnery = gunnery.map((b) => {
        const ns = res.gunneryStates![b.id];
        return ns ? { ...b, state: ns } : b;
      });
    }
    // Thread the updated weather components into the next minute.
    if (res.weatherComponents && weather) {
      weather = { ...weather, components: res.weatherComponents };
    }
  }
  return {
    results,
    hashes: results.map((r) => r.minuteHash),
    finalState: state,
  };
}
