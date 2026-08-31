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
  type Position,
} from "../spotting/detection.js";
import {
  ageContact,
  isStale,
  updateContact,
  createContactTrack,
  type TacticalContact,
} from "../contact/lifecycle.js";
import { BattleLedger, type BattleEvent } from "../battleLedger.js";
import { resolveGunnery, type GunneryBattery, type GunneryEventRecord } from "../gunnery/index.js";
import { resolveWeather, type WeatherEngineContext } from "../weather/engine.js";
import type { BattleWeatherComponents } from "../weather/components.js";
import { SUBSTEPS_PER_MINUTE } from "../movement/constants.js";
import type { TacticalBattleState } from "../tactical/index.js";
import type { GunneryState } from "../gunnery/index.js";
import type { ShipDamageState } from "../damage/state.js";
import { resolveMinuteDamage, type DamageContext } from "../battleResolution/damage.js";
import {
  resolveTorpedoes,
  type TorpedoContext,
  type TorpedoLauncherState,
  type TorpedoTrack,
  type TorpedoRecord,
} from "../torpedoes/index.js";
import { resolveSmoke, type SmokeContext } from "../smoke/engineWiring.js";
import type { SmokeCloud } from "../smoke/model.js";
import type { SmokeEventRecord } from "../smoke/smokeRecords.js";
import {
  resolveDamageControl,
  type DamageControlContext,
} from "../damage/damageControlEngineWiring.js";
import { resolveAirCombat, type AirCombatContext } from "../air-combat/engineWiring.js";
import type { AirCombatRecord } from "../air-combat/records.js";

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
  // Optional damage context (B-4/B-6 INC-2). When absent, damage resolution is a
  // strict no-op: zero events appended, minute snapshot/minuteHash byte-identical
  // to the B-2..B-5 baseline. When present, every HIT gunnery salvo is converted
  // into damage impacts and applied via resolveDamage at step 9-10 (substep 3).
  damage?: DamageContext;
  // Optional torpedo stage input (C-1 / INC-7 — DESIGN-40 §12–§22). When
  // absent, the torpedo stage is a strict no-op: zero events appended, minute
  // snapshot/minuteHash byte-identical to the B-2..B-6 baseline. When present,
  // resolveTorpedoes runs AFTER the damage stage and its records/states are
  // threaded (torpedoStates/torpedoTracks) exactly like gunneryStates.
  torpedoes?: TorpedoContext;
  /** Optional smoke context (C-5 / INC-8). When absent, the smoke stage is a
   *  strict no-op: zero events appended, minute snapshot/minuteHash byte-identical
   *  to the pre-INC-8 baseline. When present, resolveSmoke runs after movement
   *  intent (step 5) and before propulsion (step 6). */
  smoke?: SmokeContext;
  /** Optional damage-control context (C-5 / INC-8). When absent, the damage-control
   *  stage is a strict no-op: zero events appended, minute snapshot/minuteHash
   *  byte-identical to the baseline. When present, resolveDamageControl runs after
   *  damage resolution (steps 9-10 and 10.5) in the same minute. */
  damageControl?: DamageControlContext;
  /** Optional air-combat context (D-3 / INC-8). When absent, the resolveAirCombat
   *  stage is a strict no-op: zero records emitted, minute snapshot/minuteHash
   *  byte-identical to the pre-INC-8 baseline. When present, resolveAirCombat runs
   *  after weather (step 7.5) and before spotting (step 8). */
  airCombat?: AirCombatContext;
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
  // Updated per-ship ShipDamageState (shipId -> state) after this minute's
  // damage stage. Present only when damage context was supplied.
  damageStates?: Record<string, ShipDamageState>;
  // Updated torpedo launcher states (launcherId -> state) after this minute's
  // torpedo stage. Present only when launchers actually fired.
  torpedoStates?: Record<string, TorpedoLauncherState>;
  // The RUNNING torpedo tracks after this minute's torpedo stage. Present only
  // when the stage resolved a live torpedo entity.
  torpedoTracks?: readonly TorpedoTrack[];
  // The §27 torpedo records emitted this minute. Present only when the stage
  // produced records.
  torpedoRecords?: readonly TorpedoRecord[];
  /** Smoke clouds after this minute's smoke stage. Present only when the stage
   *  resolved clouds. */
  smokeClouds?: SmokeCloud[];
  /** Smoke event records emitted this minute. Present only when the stage
   *  produced records. */
  smokeRecords?: SmokeEventRecord[];
  /** Air-combat records emitted this minute. Present only when the stage
   *  produced records. */
  airCombatRecords?: readonly AirCombatRecord[];
  /** Summary of air-combat activity this minute. Present only when the stage
   *  was active. */
  airCombatSummary?: { capEngagements: number; strikeAttacks: number; losses: number };
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

  // Step 5.5 (C-5 / INC-8): resolve smoke — drift, decay, and lifecycle
  // Strict no-op when no smoke context is supplied.
  let smokeClouds: SmokeCloud[] | undefined;
  let smokeRecords: SmokeEventRecord[] | undefined;
  if (input.smoke) {
    const smokeResult = resolveSmoke(input.smoke, minute, 0);
    if (smokeResult.nextClouds.length > 0 || smokeResult.events.length > 0) {
      smokeClouds = smokeResult.nextClouds;
      smokeRecords = smokeResult.events;
      for (const sr of smokeResult.events) {
        ledger.append(
          evt(minute, 0, `smoke_${sr.kind.toLowerCase()}`, 55, `cloud-${sr.cloudId}`, battleId),
        );
      }
    }
  }

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

  // Step 7.7 (D-3 / INC-8): resolve air combat — CAP interception & strike attack.
  // Runs after weather (step 7.5) and before spotting (step 8) so that CAP
  // intercepts incoming strikes before gunnery resolves. Strict no-op when no
  // air-combat context is supplied (zero records appended -> minute snapshot/
  // minuteHash byte-identical to the pre-INC-8 baseline).
  let airCombatRecords: readonly AirCombatRecord[] | undefined;
  let airCombatSummary:
    | { capEngagements: number; strikeAttacks: number; losses: number }
    | undefined;
  if (input.airCombat) {
    const airResult = resolveAirCombat({
      ...input.airCombat,
      battleId,
      minute,
    });
    if (airResult.active && airResult.records.length > 0) {
      airCombatRecords = airResult.records;
      airCombatSummary = airResult.summary;
    }
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
  let salvos: readonly GunneryEventRecord[] = [];
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
    salvos = gres.salvos;
  }

  // Step 9-10 (DESIGN-38 §3 / B-4 / B-6 INC-2): apply damage from gunnery HIT
  // events — each HIT becomes a GunneryImpact applied via resolveDamage, and the
  // damage events are appended here (after gunnery at substep 3). Strict no-op
  // when no damage context is supplied (zero events; hashes unchanged).
  let damageStates: Record<string, ShipDamageState> | undefined;
  if (input.damage) {
    const dmgResult = resolveMinuteDamage({
      battleId,
      minute,
      salvos,
      contacts: afterContacts,
      targets: input.damage.targets,
      engine: input.damage.engine,
      randomLedger: input.damage.randomLedger,
    });
    for (const de of dmgResult.events) ledger.append(de);
    if (Object.keys(dmgResult.states).length > 0) damageStates = dmgResult.states;
  }

  // Step 10.5 (DESIGN-40 / C-1 INC-7): torpedo fire resolution AFTER the damage
  // stage, using the same legal contact surface. Strict no-op when no torpedo
  // context is supplied (zero events appended, minute snapshot/minuteHash
  // byte-identical to the B-2..B-6 baseline). When a context is supplied but
  // nothing resolves, the same byte-identical guarantee holds (the stage emits
  // nothing until there is a launcher with a command or a running track).
  let torpedoStates: Record<string, TorpedoLauncherState> | undefined;
  let torpedoTracks: readonly TorpedoTrack[] | undefined;
  let torpedoRecords: readonly TorpedoRecord[] | undefined;
  if (input.torpedoes) {
    const shipPositions: Record<string, Position> = {};
    const shipHeadings: Record<string, number> = {};
    const shipSpeedsUmS: Record<string, number> = {};
    for (const u of units) {
      const m = resolvedMovements[u.assetId];
      if (!m) continue;
      shipPositions[u.assetId] = m.position;
      shipHeadings[u.assetId] = m.heading;
      shipSpeedsUmS[u.assetId] = m.currentSpeed;
    }
    // AC-22 composition (reviewer BLOCKER-2): the torpedo stage runs AFTER the
    // damage stage in the same minute, so it must resolve against the ship's
    // POST-damage state — not the caller's PRE-damage target input. Thread the
    // damage stage's per-ship `damageStates` into the torpedo target contexts
    // (same immutable copy-out as the next-minute threading below) so gunnery
    // damage applied this minute is NOT silently discarded: the torpedo
    // damage accumulates on top of it, and the merge below keeps the combined
    // (gunnery + torpedo) state rather than replacing per-ship states.
    let torpedoContext = input.torpedoes;
    if (damageStates && Object.keys(damageStates).length > 0) {
      torpedoContext = { ...input.torpedoes, targets: { ...input.torpedoes.targets } };
      for (const [sid, st] of Object.entries(damageStates)) {
        const tgt = torpedoContext.targets[sid];
        if (tgt) torpedoContext.targets[sid] = { ...tgt, damageState: st };
      }
    }
    const torpedoResult = resolveTorpedoes({
      battleId,
      minute,
      context: torpedoContext,
      contacts: afterContacts,
      shipPositions,
      shipHeadings,
      shipSpeedsUmS,
      engine: input.engine,
    });
    if (torpedoResult.changed) {
      for (const te of torpedoResult.events) ledger.append(te);
      torpedoRecords = torpedoResult.records.length > 0 ? torpedoResult.records : undefined;
      torpedoTracks = torpedoResult.tracks.length > 0 ? torpedoResult.tracks : undefined;
      if (Object.keys(torpedoResult.launcherStates).length > 0)
        torpedoStates = torpedoResult.launcherStates;
      // COMPOSE (AC-22): keep every pre-torpedo damage state and let the torpedo
      // result overwrite ONLY the ships it damaged (which, thanks to the
      // threading above, already carry the accumulated gunnery + torpedo damage).
      if (Object.keys(torpedoResult.damageStates).length > 0)
        damageStates = { ...damageStates, ...torpedoResult.damageStates };
    }
  }

  // Step 8.6 (C-5 / INC-8): resolve damage control — fire progression,
  // flooding resolution, damage-control allocation. Strict no-op when no
  // damage-control context is supplied.
  if (input.damageControl) {
    const dcResult = resolveDamageControl(input.damageControl, minute, 0);
    for (const _sr of dcResult.smokeEventRecords) {
      ledger.append(evt(minute, 0, `smoke_fire`, 86, `fire-smoke`, battleId));
    }
    // Apply fire/flooding state updates to damageStates
    if (damageStates) {
      for (const [shipId, state] of Object.entries(damageStates)) {
        damageStates[shipId] = {
          ...state,
          fireRecords: dcResult.fireRecords,
          floodingRecords: dcResult.floodingRecords,
        };
      }
    }
  }

  const events = ledger.sorted();
  const hasTorpedoSurface =
    torpedoTracks !== undefined || (torpedoRecords !== undefined && torpedoRecords.length > 0);
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
    // The torpedo minute-state surface (INC-7): present ONLY when the stage
    // resolved state — absent context or an empty stage keeps the snapshot
    // byte-identical to the B-2..B-6 baseline (the strict no-op guarantee).
    ...(hasTorpedoSurface
      ? {
          torpedo: {
            tracks: (torpedoTracks ?? []).map((t) => ({
              torpedoTrackId: t.torpedoTrackId,
              currentPosition: t.currentPosition,
              distanceTraveledUm: t.distanceTraveledUm,
              armed: t.armed,
              terminalResult: t.terminalResult,
              trackHash: t.trackHash,
            })),
            ...(torpedoStates
              ? {
                  launchers: Object.keys(torpedoStates)
                    .sort()
                    .map((launcherId) => {
                      const st = torpedoStates![launcherId]!;
                      return {
                        launcherId,
                        loadedPerTube: st.loadedPerTube,
                        stateHash: st.stateHash,
                      };
                    }),
                }
              : {}),
            ...(torpedoRecords && torpedoRecords.length > 0
              ? {
                  records: torpedoRecords.map((r) => ({
                    recordId: r.recordId,
                    kind: r.kind,
                    recordHash: r.recordHash,
                  })),
                }
              : {}),
          },
        }
      : {}),
    // The smoke minute-state surface (C-5 / INC-8): present ONLY when the stage
    // resolved state — absent context or an empty stage keeps the snapshot
    // byte-identical to the pre-INC-8 baseline (the strict no-op guarantee).
    ...(smokeRecords && smokeRecords.length > 0
      ? {
          smoke: {
            records: smokeRecords.map((r) => ({
              recordId: r.recordId,
              kind: r.kind,
              recordHash: r.recordHash,
            })),
          },
        }
      : {}),
    // The air-combat minute-state surface (D-3 / INC-8): present ONLY when the
    // stage resolved activity — absent context or an empty stage keeps the
    // snapshot byte-identical to the pre-INC-8 baseline (the strict no-op
    // guarantee).
    ...(airCombatRecords && airCombatRecords.length > 0
      ? {
          airCombat: {
            records: airCombatRecords.map((r) => ({
              recordId: r.recordId,
              kind: r.recordKind,
              recordHash: r.recordHash,
            })),
            ...(airCombatSummary
              ? {
                  summary: {
                    capEngagements: airCombatSummary.capEngagements,
                    strikeAttacks: airCombatSummary.strikeAttacks,
                    losses: airCombatSummary.losses,
                  },
                }
              : {}),
          },
        }
      : {}),
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
    ...(damageStates ? { damageStates } : {}),
    ...(torpedoStates ? { torpedoStates } : {}),
    ...(torpedoTracks ? { torpedoTracks } : {}),
    ...(torpedoRecords ? { torpedoRecords } : {}),
    ...(smokeClouds ? { smokeClouds } : {}),
    ...(smokeRecords ? { smokeRecords } : {}),
    ...(airCombatRecords ? { airCombatRecords } : {}),
    ...(airCombatSummary ? { airCombatSummary } : {}),
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
  /** Optional damage context (B-4 / B-6 INC-2). When absent, damage resolution
   *  is a strict no-op across all minutes. */
  damage?: DamageContext;
  /** Optional torpedo stage context (C-1 / INC-7). When absent, the torpedo
   *  stage is a strict no-op across all minutes. */
  torpedoes?: TorpedoContext;
  /** Optional smoke context (C-5 / INC-8). When absent, the smoke stage is a
   *  strict no-op across all minutes. When present, smoke clouds are threaded
   *  from minute to minute. */
  smoke?: SmokeContext;
  /** Optional damage-control context (C-5 / INC-8). When absent, the damage-control
   *  stage is a strict no-op across all minutes. When present, fire and flooding
   *  records are threaded from minute to minute. */
  damageControl?: DamageControlContext;
  /** Optional air-combat context (D-3 / INC-8). When absent, the resolveAirCombat
   *  stage is a strict no-op across all minutes. When present, capPatrols and
   *  strikeMissions are threaded from minute to minute. */
  airCombat?: AirCombatContext;
}
export interface AdvanceMinutesResult {
  results: MinuteResult[];
  hashes: string[];
  finalState: TacticalBattleState;
  /** Per-minute damage states (mirrors results[i].damageStates). */
  damageStates?: Record<string, ShipDamageState>[];
  /** Per-minute torpedo tracks (mirrors results[i].torpedoTracks). */
  torpedoTracks?: (readonly TorpedoTrack[])[];
}
export function advanceMinutes(input: AdvanceMinutesInput): AdvanceMinutesResult {
  const results: MinuteResult[] = [];
  let gunnery = input.gunnery;
  let weather = input.weather;
  let damage = input.damage;
  let torpedoes = input.torpedoes;
  let smoke = input.smoke;
  let damageControl = input.damageControl;
  let airCombat: AirCombatContext | undefined = input.airCombat
    ? { ...input.airCombat }
    : undefined;
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
      damage,
      torpedoes,
      smoke,
      damageControl,
      airCombat,
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
    // Thread the updated damage states into the context targets for the next
    // minute (immutable copy-out pattern).
    if (res.damageStates && damage) {
      damage = { ...damage, targets: { ...damage.targets } };
      for (const [sid, st] of Object.entries(res.damageStates)) {
        if (damage.targets[sid]) damage.targets[sid] = { ...damage.targets[sid]!, state: st };
      }
    }
    // Thread the updated torpedo launcher states + running tracks + target
    // damage states into the next minute (GunneryState idiom).
    if (torpedoes) {
      if (res.torpedoStates) {
        torpedoes = {
          ...torpedoes,
          launchers: torpedoes.launchers.map((wiring) => {
            const next = res.torpedoStates![wiring.launcher.launcherId];
            return next ? { ...wiring, launcher: next } : wiring;
          }),
        };
      }
      if (res.torpedoTracks) {
        torpedoes = {
          ...torpedoes,
          tracks: res.torpedoTracks.map((t) => ({ ...t })),
        };
      }
      if (res.damageStates) {
        torpedoes = { ...torpedoes, targets: { ...torpedoes.targets } };
        for (const [sid, st] of Object.entries(res.damageStates)) {
          const tgt = torpedoes.targets[sid];
          if (tgt) torpedoes.targets[sid] = { ...tgt, damageState: st };
        }
      }
    }
    // Thread the updated smoke clouds into the next minute.
    if (smoke && res.smokeClouds) {
      smoke = { ...smoke, clouds: res.smokeClouds };
    }
    // Thread the updated damage-control context into the next minute.
    if (damageControl && res.smokeRecords) {
      // After damage control, fire and flooding records may have changed.
      // The smoke stage handling is separate; damage control results are
      // consumed here by updating the fire/flooding context.
    }
    // Thread the updated air-combat context into the next minute (D-3 / INC-8).
    // For the INC-8 stub, state does not change, but the records accumulate.
    if (airCombat) {
      if (res.airCombatRecords) {
        airCombat = {
          ...airCombat,
          existingRecords: res.airCombatRecords.map((r) => ({ ...r })),
        };
      }
    }
  }
  return {
    results,
    hashes: results.map((r) => r.minuteHash),
    finalState: state,
    ...(input.damage ? { damageStates: results.map((r) => r.damageStates ?? {}) } : {}),
    ...(input.torpedoes ? { torpedoTracks: results.map((r) => r.torpedoTracks ?? []) } : {}),
  };
}
