//packages/combat/src/torpedoes/resolve.ts
// DESIGN-40 §12–§22 torpedo fire-resolution engine stage (INC-7, AC-22) —
// `resolveTorpedoes`, the pure stage the DESIGN-38 minute-advance engine calls
// AFTER the damage stage. It orchestrates the INC-1..INC-6 modules into one
// deterministic per-minute chain:
//
//   reservation → launch (ascending tube order, §12 failure/stuck semantics)
//     → track creation → track advance (distance/time) → hit resolution
//     (§14 geometry/arming/depth/legality/ordering) → detonation (§15 keyed
//     reliability) → damage package + flooding/machinery/shock/hazard/chain
//     (INC-6 seams, atomic application) → §27 records → §28 ordering.
//
// PER-MINUTE ORDERING (deterministic, documented):
//   - Launch substep = TORPEDO_LAUNCH_SUBSTEP (4). Accepted-salvo commands are
//     processed in §28 levels 1-3 order (side → firing ship → launcher); each
//     salvo fires its tubes in ASCENDING tube-identifier order (the §12 rule).
//   - After all launches, every RUNNING track advances for the rest of the
//     minute: tracks launched this minute at substep L advance
//     (SUBSTEPS_PER_MINUTE - L) × 1_000 ms; tracks running from earlier minutes
//     advance the full TORPEDO_MINUTE_MS. (§13 track advance; whole-minute
//     position sampling — the shipped INC-7 approximation.)
//   - Evaluation substep = TORPEDO_RESOLVE_IMPACT_SUBSTEP (56): every running
//     track is hit-checked against its target's legal contact position in §28
//     level 5 order (launch minute, launch substep, track id) and level 6 order
//     (target contact id). A resolved hit proceeds to detonation (§15); a
//     functioning detonation builds ONE damage package and applies it atomically
//     through the INC-6 seam, resolving the §21 tube-hazard + §22 chain
//     continuations on a TUBE_BAY impact with a launcher context. Damage
//     packages apply in §28 level 7 order; each package's machinery (§19) and
//     system-shock (§20) draws are consumed in the same keyed order as
//     applyTorpedoDamagePackage's internal stages.
//
// DETERMINISM: the ONLY randomness is the injected keyedRng seam (per stream
// from a shared @bluewave/random RandomEngine; a deterministic 0 when no engine
// is supplied). Every draw is a domain-separated, state-keyed stream; the
// *sequence* of streams consumed is a pure function of the inputs, so identical
// inputs produce identical runs in every process. No ambient clock, Math.random,
// env, filesystem, or locale (ENGINEERING-CONTRACT determinism). The stage
// never mutates any input — every transition is an immutable copy-out.
import { BluewaveError } from "@bluewave/contracts";
import type { RandomEngine } from "@bluewave/random";
import type { BattleEvent } from "../battleLedger.js";
import type { TacticalContact } from "../contact/lifecycle.js";
import type { Position } from "../spotting/detection.js";
import type { ShipDamageState } from "../damage/state.js";
import type { TurretComponent } from "../damage/turretStates.js";
import { SUBSTEPS_PER_MINUTE } from "../movement/constants.js";
import {
  EMPTY_TUBE,
  NO_TARGET_CONTACT,
  TORPEDO_BASIS_POINTS_PER_UNIT,
  TORPEDO_FORMULA_VERSION,
  TORPEDO_LAUNCH_SUBSTEP,
  TORPEDO_MINUTE_MS,
  TORPEDO_RULESET_VERSION,
  type FloodingIsolationState,
} from "./constants.js";
import { reserveSalvoTorpedoes, type TorpedoSalvoPolicyInputs } from "./salvo.js";
import { resolveTubeLaunches } from "./launch-failure.js";
import { torpedoModelById, type TorpedoSetting } from "./model.js";
import { advanceTorpedoTrack, type TorpedoTrack } from "./track.js";
import { resolveTorpedoHit, type TargetHitProfile } from "./hit-resolution.js";
import { applyTorpedoDetonationToTrack, resolveTorpedoDetonation } from "./detonation.js";
import { type TorpedoImpactZone, type TorpedoTargetProtectionLevel } from "./detonation.js";
import {
  applyTorpedoChainReactionPackage,
  applyTorpedoDamagePackage,
  createTorpedoDamagePackage,
  type TorpedoDamageApplicationInput,
  type TorpedoDamageApplicationResult,
  type TorpedoDamageControlAccessibility,
  type TorpedoDamagePackageInput,
  type TorpedoImpactSide,
} from "./damagePackage.js";
import {
  evaluateTorpedoMachineryDamage,
  machinerySeverityToComponentOutcome,
} from "./machinery.js";
import { evaluateTorpedoSystemShock, type SystemShockCandidate } from "./systemShock.js";
import { resolveTorpedoChainReaction } from "./chainReaction.js";
import { TORPEDO_CHAIN_REACTION_NEUTRAL_MODIFIER_BP } from "./damageConstants.js";
import {
  validateAboveWaterLaunchSpeedLimit,
  validateUnderwaterTubeSpeedLimitFiringSubstep,
  type SpeedLimitVerdict,
} from "./launch-speed.js";
import { type TorpedoLauncherState, assertFixedPointTorpedo } from "./state.js";
import { TORPEDO_STATE_INVARIANT_FAILED } from "./reasonCodes.js";
import {
  makeTorpedoRecord,
  torpedoRecordId,
  type TorpedoRecord,
  type TorpedoRecordKind,
} from "./records.js";
import { compareLaunchCommandOrder, compareTrackRunOrder, torpedoRecordOrder } from "./ordering.js";

// ---------------------------------------------------------------------------
// Stage constants (fresh, versioned surface; the ONE authoritative copy).
// ---------------------------------------------------------------------------

/** The nominal torpedo evaluation substep for hit/detonation/damage within a
 *  minute (the final second — whole-minute position sampling). */
export const TORPEDO_RESOLVE_IMPACT_SUBSTEP = 56 as const;
/** The BattleLedger event priority for every torpedo stage record — after the
 *  B-4 damage priority 10 (the torpedo stage runs after the damage stage). */
export const TORPEDO_RESOLUTION_EVENT_PRIORITY = 11 as const;
/** Default torpedo depth setting (metres) when a command leaves it open.
 *
 *  ADR-0031 entry (reviewer HIGH-4): this 5 m default is an AUTHORED decision —
 *  DESIGN-40 §12 leaves the depth setting open; the stage defaults it to 5 m
 *  (a representative shallow-running depth for the 1880–1945 surface-launch
 *  slice). Invented default, not a DESIGN-40 literal — recorded in ADR-0031. */
export const TORPEDO_RESOLUTION_DEFAULT_DEPTH_M = 5 as const;
/** Default ordered gyro angle when a command leaves it open — the straight run
 *  along the ship's launch heading (see resolveTorpedoes). */
export const TORPEDO_DEFAULT_ORDERED_GYRO_MDEG = 0 as const;
/** The §22 neutral modifier manifest (isolation/flooding/protection/fire/
 *  existingDamage — the engine exposes no finer damage-control surface yet).
 *
 *  ADR-0031 entry (reviewer HIGH-4): the stage hard-codes all five §22 modifiers
 *  to the neutral 10_000 (no damage-control strain is modelled in this slice) and
 *  only ever fires the §22 chain on a SEVERE §21 underwater-tube hit. A
 *  MAGAZINE-zone chain reaction (DESIGN-40 §22 magazine detonation on a
 *  MAGAZINE impact zone) is NOT wired in this stage — explicitly deferred, not
 *  silent (recorded in ADR-0031; resolved in INC-8/phase wiring). */
const CHAIN_REACTION_NEUTRAL_MODIFIERS = Object.freeze({
  isolation: TORPEDO_CHAIN_REACTION_NEUTRAL_MODIFIER_BP,
  flooding: TORPEDO_CHAIN_REACTION_NEUTRAL_MODIFIER_BP,
  protection: TORPEDO_CHAIN_REACTION_NEUTRAL_MODIFIER_BP,
  fireIntensity: TORPEDO_CHAIN_REACTION_NEUTRAL_MODIFIER_BP,
  existingDamage: TORPEDO_CHAIN_REACTION_NEUTRAL_MODIFIER_BP,
});

// ---------------------------------------------------------------------------
// the per-minute stage surfaces
// ---------------------------------------------------------------------------

export interface TorpedoLauncherWiring {
  /** authoritative §2 launcher state (threaded across minutes). */
  launcher: TorpedoLauncherState;
  /** the platform (ship) that owns this launcher — must be a battle unit. */
  ownerShipId: string;
  sideId: string;
  /** crew skill for the §12 failure composition [0, 10_000] bp. */
  crewQualityBp: number;
  /** the recorded command source (CENTRAL/local/player — audit provenance). */
  commandSource: string;
  /** per-launcher launch point offset from the ship's position (integer µm). */
  launchPointOffsetUm?: readonly [number, number];
  /** the §8 above-water resolved maximum (knots) or null — the phase layer
   *  resolves it; null on an above-water mount fails closed with
   *  TORPEDO_LAUNCH_SPEED_LIMIT_MISSING (the authoritative gate). */
  aboveWaterMaxLaunchSpeedKnots?: number | null;
}

export interface TorpedoLaunchCommand {
  /** the firing platform (must own the launcher). */
  shipId: string;
  launcherId: string;
  /** the accepted salvo's tubes (any order; fired ascending). */
  tubeIndexes: readonly number[];
  /** the legal target contact id or the §13 NO_TARGET_CONTACT marker. */
  targetContactId: string;
  /** the declared firing substep (default TORPEDO_LAUNCH_SUBSTEP). */
  firingSubstep?: number;
  /** the selected §1 ordered setting id; null ⇒ the model's first setting. */
  selectedSettingId?: string | null;
  /** ordered gyro angle (integer milli-degrees, full circle 360_000). */
  orderedGyroAngleMdeg?: number;
  /** torpedo depth setting (integer metres). */
  depthSettingM?: number;
  /** the §11 salvo policy (the deterministic continuation permit + the
   *  solution-quality carrier recorded on the launch records). */
  salvoPolicy: TorpedoSalvoPolicyInputs;
}

/** The caller/phase layer's resolved §16 impact scene — the engine has no ship
 *  design knowledge; the impact-side/longitudinal/breach figures come from the
 *  ship design + impact geometry the caller supplies. */
export interface TorpedoTargetScene {
  impactSide: TorpedoImpactSide;
  longitudinalPositionM: number;
  hullBreachAreaM2: number;
  fireProbabilityBp: number; // [0, 10_000]
  crewCasualties: number;
  damageControlAccessibility: TorpedoDamageControlAccessibility;
  /** §18 progressive-rate isolation surface. */
  isolationState: FloodingIsolationState;
}

export interface TorpedoTargetContext {
  /** the physical target ship id (record provenance). */
  shipId: string;
  /** the legal contract id this target is tracked by (§28 level 6 key). */
  contactId: string;
  /** caller-supplied authoritative collision geometry (radius/draft). */
  profile: TargetHitProfile;
  /** §17 impact zone (detonation + damage-package impact zone). */
  zone: TorpedoImpactZone;
  /** the underwater-protection resistance (§15/§17). */
  protectionLevel: TorpedoTargetProtectionLevel;
  /** the authorized §16 impact scene. */
  scene: TorpedoTargetScene;
  /** current authoritative damage state (threaded across minutes). */
  damageState: ShipDamageState;
  /** design (full) flotation reserve for the terminal % seam. */
  designFlotationReserve: number;
  /** design stability bp [1, 10_000] for the terminal % seam. */
  designStabilityScore: number;
  /** §18 per-compartment flooding-creation inputs (creation-only). */
  flooding: TorpedoDamageApplicationInput["flooding"];
  /** §19 machinery context (omit → no machinery draw). */
  machinery?: { zone: TorpedoImpactZone; machineryComponents: readonly string[] };
  /** §20 nearby-system shock pool (omit → no shock draw). */
  shockCandidates?: readonly SystemShockCandidate[];
  /** caller's turret list (the applyTurretDamage seam on shocked turrets). */
  turretComponents?: readonly TurretComponent[];
  /** §21 tube-hazard context — present ONLY for tube-bay launchers on this
   *  ship (the launcher's loaded surface). */
  tubeHazard?: TorpedoDamageApplicationInput["tubeHazard"];
}

/** The INC-7 torpedo stage input (analogue of GunneryBattery[]/DamageContext —
 *  optional in the engine input; absent ⇒ strict no-op). */
export interface TorpedoContext {
  /** the authoritative launchers (with their wiring). */
  launchers: readonly TorpedoLauncherWiring[];
  /** the accepted-salvo commands for this minute (any order). */
  commands: readonly TorpedoLaunchCommand[];
  /** per-ship target contexts (the legal geometry + damage surface). */
  targets: Record<string, TorpedoTargetContext>;
  /** RUNNING spokes threaded from previous minutes (never terminal). */
  tracks?: readonly TorpedoTrack[];
}

export interface ResolveTorpedoesInput {
  battleId: string;
  minute: number;
  context: TorpedoContext;
  /** the engine's legal-contract surface (fog gate; §14 known tracks). */
  contacts: readonly TacticalContact[];
  shipPositions: Readonly<Record<string, Position>>;
  /** integer degrees [0, 359] (the movement heading surface). */
  shipHeadings: Readonly<Record<string, number>>;
  /** integer µm/s (the movement currentSpeed surface). */
  shipSpeedsUmS: Readonly<Record<string, number>>;
  /** shared keyed RNG (battle seed); absent ⇒ deterministic fixed path. */
  engine?: RandomEngine;
}

export interface TorpedoResolution {
  /** the §28-ordered §27 records emitted this minute. */
  records: readonly TorpedoRecord[];
  /** ledger-ready BattleEvents (one per record; eventHash = recordHash). */
  events: readonly BattleEvent[];
  /** updated launcher states (launcherId → state) — only launchers that fired. */
  launcherStates: Readonly<Record<string, TorpedoLauncherState>>;
  /** the RUNNING tracks after this minute (the next-minute thread surface). */
  tracks: readonly TorpedoTrack[];
  /** per-ship damage-state updates from torpedo damage applications. */
  damageStates: Readonly<Record<string, ShipDamageState>>;
  /** whether the stage produced any events/state this minute. */
  changed: boolean;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function invariant(field: string, value: unknown, reason: string): never {
  throw new BluewaveError(TORPEDO_STATE_INVARIANT_FAILED, {
    code: TORPEDO_STATE_INVARIANT_FAILED,
    field,
    reason,
    value,
  });
}

function isSafeInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && Number.isSafeInteger(v);
}

/** The §28 level-4 tube marker ("tube" + zero-padded index — the string sort
 *  reproduces the canonical ascending tube order). */
function tubeMarker(tubeId: number): string {
  return `tube${String(tubeId).padStart(4, "0")}`;
}

function speedVerdictFor(
  mountType: TorpedoLauncherState["mountType"],
  speedUmS: number,
  aboveWaterMaxLaunchSpeedKnots: number | null | undefined,
): SpeedLimitVerdict {
  if (mountType === "UNDERWATER_FIXED" || mountType === "UNDERWATER_TRAINABLE") {
    return validateUnderwaterTubeSpeedLimitFiringSubstep(speedUmS, mountType);
  }
  if (mountType === "ABOVE_WATER_FIXED" || mountType === "ABOVE_WATER_TRAINABLE") {
    return validateAboveWaterLaunchSpeedLimit(speedUmS, aboveWaterMaxLaunchSpeedKnots ?? null);
  }
  // SUBMARINE_INTERNAL → C-3 (submarine-launch mechanics deferred).
  return { applicable: false, allowed: true, reasonCode: null, speedUmS, limitUmS: null };
}

function keyedRngOf(engine: RandomEngine | undefined): (stream: string) => number {
  return (stream: string): number => (engine ? engine.stream(stream).next() : 0);
}

function modelWarheadEquivalentKg(modelId: string): number {
  return torpedoModelById(modelId).warheadExplosiveEquivalentMassKg;
}

function commandSourceOf(
  track: TorpedoTrack,
  launcherById: ReadonlyMap<string, TorpedoLauncherWiring>,
): string {
  return launcherById.get(track.launcherId)?.commandSource ?? "ENGINE_STAGE";
}

// ---------------------------------------------------------------------------
// the §27 record builder (single factory for every record the stage emits)
// ---------------------------------------------------------------------------

interface RecordSeed {
  kind: TorpedoRecordKind;
  battleMinute: number;
  substep: number;
  sourceId: string;
  targetId: string;
  commandSource: string;
  legalContactId?: string | null;
  torpedoModelId?: string | null;
  launcherId?: string | null;
  settingId?: string | null;
  solutionInputs?: readonly { key: string; value: number }[];
  solutionQualityBp?: number | null;
  speedLimitValidation?: SpeedLimitVerdict;
  ammunitionChange?: TorpedoRecord["ammunitionChange"];
  rngDecision?: TorpedoRecord["rngDecision"];
  damageEffects?: TorpedoRecord["damageEffects"];
  persists?: boolean;
  /** Optional disambiguator appended to the record id (the §22 chain explosion
   *  records share the primary package's source/target at the same instant —
   *  see torpedoRecordId). */
  discriminator?: string;
}

const NEUTRAL_DAMAGE_EFFECTS: TorpedoRecord["damageEffects"] = Object.freeze({
  structuralDamage: 0,
  flotationDamage: 0,
  floodingSourcesCreated: 0,
  terminalTransition: null,
  reasonCode: null,
});

function makeRecord(battleId: string, seed: RecordSeed): TorpedoRecord {
  const speed = seed.speedLimitValidation ?? {
    applicable: false,
    allowed: true,
    reasonCode: null,
    limitUmS: null,
  };
  return makeTorpedoRecord({
    recordId: torpedoRecordId({
      battleId,
      minute: seed.battleMinute,
      substep: seed.substep,
      kind: seed.kind,
      sourceId: seed.sourceId,
      targetId: seed.targetId,
      ...(seed.discriminator ? { discriminator: seed.discriminator } : {}),
    }),
    kind: seed.kind,
    battleMinute: seed.battleMinute,
    substep: seed.substep,
    sourceId: seed.sourceId,
    targetId: seed.targetId,
    commandSource: seed.commandSource,
    legalContactId: seed.legalContactId ?? null,
    torpedoModelId: seed.torpedoModelId ?? null,
    launcherId: seed.launcherId ?? null,
    settingId: seed.settingId ?? null,
    solutionInputs: seed.solutionInputs ?? [],
    solutionQualityBp: seed.solutionQualityBp ?? null,
    speedLimitValidation: {
      applicable: speed.applicable,
      allowed: speed.allowed,
      reasonCode: speed.reasonCode,
      limitUmS: speed.limitUmS,
    },
    ammunitionChange: seed.ammunitionChange ?? null,
    rngDecision: seed.rngDecision ?? null,
    damageEffects: seed.damageEffects ?? NEUTRAL_DAMAGE_EFFECTS,
    persists: seed.persists ?? false,
    formulaVersion: TORPEDO_FORMULA_VERSION,
    rulesetVersion: TORPEDO_RULESET_VERSION,
  });
}

function launchSolutionInputs(setting: TorpedoSetting, gyroMdeg: number, depthM: number) {
  return [
    { key: "orderedSpeedKnotsBp", value: setting.speedKnotsBp },
    { key: "orderedRangeM", value: setting.rangeM },
    { key: "orderedGyroAngleMdeg", value: gyroMdeg },
    { key: "depthSettingM", value: depthM },
  ];
}

function resolvedSettingForCommand(
  modelId: string,
  selectedSettingId: string | null | undefined,
): TorpedoSetting {
  const model = torpedoModelById(modelId); // fail-closed
  if (selectedSettingId === null || selectedSettingId === undefined) {
    const first = model.orderedSettings[0];
    if (!first) invariant("orderedSettings", modelId, "a model must ship at least one setting");
    return first;
  }
  const found = model.orderedSettings.find((s) => s.settingId === selectedSettingId);
  if (!found)
    invariant(
      "selectedSettingId",
      selectedSettingId,
      `the salvo selected a setting the launcher's model does not ship (${modelId})`,
    );
  return found;
}

const EVENT_TYPES: Record<TorpedoRecordKind, string> = {
  LAUNCH: "torpedo_launch",
  TRACK: "torpedo_track",
  DETECTION: "torpedo_detection",
  HIT_RESOLUTION: "torpedo_hit",
  DETONATION: "torpedo_detonation",
  DAMAGE: "torpedo_damage",
  FLOODING_SOURCE: "torpedo_flooding_source",
  MACHINERY: "torpedo_machinery",
  SYSTEM_SHOCK: "torpedo_system_shock",
  TUBE_HAZARD: "torpedo_tube_hazard",
  CHAIN_REACTION: "torpedo_chain_reaction",
};

function torpedoEventFor(
  battleId: string,
  record: TorpedoRecord,
  discriminator?: string,
): BattleEvent {
  const base = `${battleId}:${record.battleMinute}:${record.substep}:${EVENT_TYPES[record.kind]}:${record.sourceId}:${record.targetId}`;
  return {
    battleId,
    minute: record.battleMinute,
    substep: record.substep,
    eventPriority: TORPEDO_RESOLUTION_EVENT_PRIORITY,
    actorId: record.sourceId,
    targetId: record.targetId,
    // the §22 chain-explosion records share the primary package's actor/target
    // at the same instant — append the discriminator so every eventId is unique
    // (reviewer BLOCKER-1; the same suffix as the record id).
    eventId: discriminator ? `${base}:${discriminator}` : base,
    eventType: EVENT_TYPES[record.kind],
    eventHash: record.recordHash,
  };
}

// ---------------------------------------------------------------------------
// THE ENERGY — the per-minute torpedo stage
// ---------------------------------------------------------------------------

export function resolveTorpedoes(input: ResolveTorpedoesInput): TorpedoResolution {
  const { battleId, minute, context } = input;
  const records: TorpedoRecord[] = [];
  // recordId → discriminator for the damage-record family (the §22 chain
  // explosion + cross-track flooding sources share identity fields at the same
  // instant — see damageRecordsFor). Threaded into the event ids so every
  // ledger eventId is also unique (reviewer BLOCKER-1).
  const recordDiscriminators = new Map<string, string>();
  const launcherStates = new Map<string, TorpedoLauncherState>();
  const damageStates = new Map<string, ShipDamageState>();
  const keyedRng = keyedRngOf(input.engine);

  // ---- input integrity (fail closed on structurally malformed input) ------
  const launcherById = new Map<string, TorpedoLauncherWiring>();
  for (const wiring of context.launchers) {
    if (launcherById.has(wiring.launcher.launcherId))
      invariant(
        "launcherId",
        wiring.launcher.launcherId,
        "a launcher id must be unique across the battle",
      );
    launcherById.set(wiring.launcher.launcherId, wiring);
  }
  const targetByContact = new Map<string, TorpedoTargetContext>();
  for (const shipId of Object.keys(context.targets).sort()) {
    const target = context.targets[shipId]!;
    if (targetByContact.has(target.contactId))
      invariant("targets.contactId", target.contactId, "one contact must map to exactly one ship");
    targetByContact.set(target.contactId, target);
  }
  const sideOf = (shipId: string): string => {
    for (const wiring of context.launchers) {
      if (wiring.ownerShipId === shipId) return wiring.sideId;
    }
    return "";
  };

  // the running-track thread (RUNNING tracks only; cloned so the caller's
  // frozen entities are never aliased or mutated).
  const income = (context.tracks ?? []).filter((t) => t.terminalResult === null);
  const runningTracks: TorpedoTrack[] = [...income]
    .sort(compareTrackRunOrder)
    .map((t) => ({ ...t }));

  // solution provenance of every track (carried into the later-share records)
  const trackLaunchSolution = new Map<
    string,
    { inputs: readonly { key: string; value: number }[]; qualityBp: number | null }
  >();

  // ===================== STAGE 1 — LAUNCH (substep 4) ======================
  const commandOrder = [...context.commands].sort((a, b) =>
    compareLaunchCommandOrder(a, b, sideOf),
  );

  for (const cmd of commandOrder) {
    const wiring = launcherById.get(cmd.launcherId);
    if (!wiring)
      invariant("launcherId", cmd.launcherId, "a command must reference a wired launcher");
    if (wiring.ownerShipId !== cmd.shipId)
      invariant("shipId", cmd.shipId, "a command's ship must own the referenced launcher");
    assertFixedPointTorpedo(wiring.launcher);
    const position = input.shipPositions[cmd.shipId];
    if (!position || !isSafeInt(position[0]) || !isSafeInt(position[1]))
      invariant("shipPositions", cmd.shipId, "the firing ship must have a battle position");
    const headingDeg = input.shipHeadings[cmd.shipId] ?? 0;
    if (!isSafeInt(headingDeg) || headingDeg < 0 || headingDeg > 359)
      invariant("shipHeadings", headingDeg, "a ship heading must be an integer degree [0, 359]");
    const shipSpeed = input.shipSpeedsUmS[cmd.shipId] ?? 0;
    const speedVerdict = speedVerdictFor(
      wiring.launcher.mountType,
      shipSpeed,
      wiring.aboveWaterMaxLaunchSpeedKnots,
    );
    const firingSubstep = cmd.firingSubstep ?? TORPEDO_LAUNCH_SUBSTEP;
    if (!isSafeInt(firingSubstep) || firingSubstep < 1 || firingSubstep >= SUBSTEPS_PER_MINUTE)
      invariant("firingSubstep", firingSubstep, "firing substep must be within [1, 60)");
    const offset = wiring.launchPointOffsetUm ?? [0, 0];
    const launchPosition: Position = [position[0] + offset[0], position[1] + offset[1]];
    const launchHeadingMdeg = headingDeg * 1_000; // §13 milli-degrees (the TU equals safe)
    // §13 guidance invariant: while running, a gyro-guided torpedo's ordered
    // course must equal its launch heading — the default (unset) gyro is the
    // straight run along the ship's heading.
    const gyro = cmd.orderedGyroAngleMdeg ?? launchHeadingMdeg;
    const depthM = cmd.depthSettingM ?? TORPEDO_RESOLUTION_DEFAULT_DEPTH_M;
    if (!isSafeInt(gyro) || !isSafeInt(depthM) || depthM < 0)
      invariant("depth/gyro", { gyro, depthM }, "ordered gyro/depth must be safely integer");
    const legalContact = cmd.targetContactId === NO_TARGET_CONTACT ? null : cmd.targetContactId;

    // ---- §7/§8 checkpoint 2 (an illegal launch consumes NO torpedo) ---------
    if (!speedVerdict.allowed) {
      const tubes = [...cmd.tubeIndexes].sort((a, b) => a - b);
      const firstTube = tubes[0]!;
      const tubeModel = wiring.launcher.loadedPerTube[firstTube];
      records.push(
        makeRecord(battleId, {
          kind: "LAUNCH",
          battleMinute: minute,
          substep: firingSubstep,
          sourceId: `${cmd.shipId}:${cmd.launcherId}`,
          targetId: tubeMarker(firstTube),
          commandSource: wiring.commandSource,
          legalContactId: legalContact,
          torpedoModelId: tubeModel && tubeModel !== EMPTY_TUBE ? tubeModel : null,
          launcherId: cmd.launcherId,
          settingId: null,
          solutionInputs: [],
          solutionQualityBp: cmd.salvoPolicy.solutionQualityBp,
          speedLimitValidation: speedVerdict,
          damageEffects: { ...NEUTRAL_DAMAGE_EFFECTS, reasonCode: speedVerdict.reasonCode },
        }),
      );
      continue;
    }

    // ---- atomic §11 reservation, launch, per-tube records, track creation ---
    const reservation = reserveSalvoTorpedoes(wiring.launcher, cmd.tubeIndexes); // §3, atomic
    const accountByTube = new Map(reservation.accounts.map((a) => [a.tubeIndex, a]));
    const salvoTubes = [...cmd.tubeIndexes].sort((a, b) => a - b);
    const salvoModelId = accountByTube.get(salvoTubes[0]!)!.modelId;
    const setting = resolvedSettingForCommand(salvoModelId, cmd.selectedSettingId);

    const launched = resolveTubeLaunches({
      battleId,
      firingShipId: cmd.shipId,
      firingSideId: sideOf(cmd.shipId),
      reservation,
      tubeIndexes: cmd.tubeIndexes,
      crewQualityBp: wiring.crewQualityBp,
      salvoPolicy: cmd.salvoPolicy,
      selectedSetting: setting,
      launchMinute: minute,
      firingSubstep,
      launchPosition,
      launchHeadingMdeg,
      orderedGyroAngleMdeg: gyro,
      depthSettingM: depthM,
      targetContactId: legalContact,
      keyedRng,
    });

    // every attempted tube is recorded separately (§12)
    for (const attempt of launched.attempts) {
      const account = accountByTube.get(attempt.tubeId);
      const ammoModel = account?.modelId ?? null;
      const after: "LOADED" | "EMPTY" =
        attempt.outcome === "TORPEDO_LAUNCH_FAILURE" ? "LOADED" : "EMPTY";
      records.push(
        makeRecord(battleId, {
          kind: "LAUNCH",
          battleMinute: minute,
          substep: firingSubstep,
          sourceId: `${cmd.shipId}:${cmd.launcherId}`,
          targetId: tubeMarker(attempt.tubeId),
          commandSource: wiring.commandSource,
          legalContactId: legalContact,
          torpedoModelId: ammoModel,
          launcherId: cmd.launcherId,
          settingId: setting.settingId,
          solutionInputs: launchSolutionInputs(setting, gyro, depthM),
          solutionQualityBp: cmd.salvoPolicy.solutionQualityBp,
          speedLimitValidation: speedVerdict,
          ammunitionChange: {
            tubeId: attempt.tubeId,
            torpedoModelId: ammoModel,
            before: "LOADED",
            after: after,
          },
          rngDecision: {
            streamId: attempt.drawStreamId,
            draw: attempt.drawBp / TORPEDO_BASIS_POINTS_PER_UNIT,
            drawBp: attempt.drawBp,
          },
          damageEffects: {
            ...NEUTRAL_DAMAGE_EFFECTS,
            reasonCode: attempt.outcome === "SUCCESS" ? null : attempt.reasonCode,
          },
        }),
      );
    }

    // each successful launch created an authoritative track (§13)
    for (const track of launched.tracks) {
      runningTracks.push(track);
      records.push(
        makeRecord(battleId, {
          kind: "TRACK",
          battleMinute: minute,
          substep: track.launchSubstep,
          sourceId: track.torpedoTrackId,
          targetId: legalContact ?? NO_TARGET_CONTACT,
          commandSource: wiring.commandSource,
          legalContactId: legalContact,
          torpedoModelId: track.torpedoModelId,
          launcherId: track.launcherId,
          settingId: track.selectedSettingId,
          solutionInputs: launchSolutionInputs(setting, gyro, depthM),
          solutionQualityBp: cmd.salvoPolicy.solutionQualityBp,
          speedLimitValidation: speedVerdict,
          ammunitionChange: {
            tubeId: track.tubeId,
            torpedoModelId: track.torpedoModelId,
            before: "LOADED",
            after: "EMPTY",
          },
        }),
      );
      trackLaunchSolution.set(track.torpedoTrackId, {
        inputs: launchSolutionInputs(setting, gyro, depthM),
        qualityBp: cmd.salvoPolicy.solutionQualityBp,
      });
    }
    launcherStates.set(cmd.launcherId, launched.state);
  }

  // ===================== STAGE 2 — ADVANCE (whole-minute) ===================
  // ADR-0031 entry (reviewer LOW-8): the track advance is a SINGLE end-of-minute
  // jump (the torpedo advances the whole `dtMs` and is then hit-checked at the
  // SAMPLED end position at substep 56). A §14 mid-minute crossing is NOT
  // evaluated in this slice — a torpedo that INTERSECTS the target mid-minute
  // but ends OUTSIDE the collision envelope MISSES. This is a documented
  // end-of-minute approximation (recorded in ADR-0031), not silent behavior.
  const toEvaluate: TorpedoTrack[] = [];
  for (const track of runningTracks) {
    const dtMs =
      track.launchMinute === minute
        ? (SUBSTEPS_PER_MINUTE - track.launchSubstep) * 1_000
        : TORPEDO_MINUTE_MS;
    if (dtMs <= 0) {
      toEvaluate.push(track);
      continue;
    }
    const advanced = advanceTorpedoTrack(track, dtMs);
    if (advanced.terminalResult === "EXHAUSTION") {
      records.push(
        makeRecord(battleId, {
          kind: "TRACK",
          battleMinute: minute,
          substep: TORPEDO_RESOLVE_IMPACT_SUBSTEP,
          sourceId: track.torpedoTrackId,
          targetId: track.targetContactId,
          commandSource: commandSourceOf(track, launcherById),
          legalContactId:
            track.targetContactId === NO_TARGET_CONTACT ? null : track.targetContactId,
          torpedoModelId: track.torpedoModelId,
          launcherId: track.launcherId,
          settingId: track.selectedSettingId,
          damageEffects: { ...NEUTRAL_DAMAGE_EFFECTS, terminalTransition: "EXHAUSTION" },
        }),
      );
      continue; // terminal — no hit evaluation this minute
    }
    toEvaluate.push(advanced);
  }

  // ============ STAGE 3 — HIT RESOLUTION + DETONATION (substep 56) ==========
  const continuedTracks: TorpedoTrack[] = [];
  const damageQueue: { track: TorpedoTrack; target: TorpedoTargetContext }[] = [];

  for (const track of toEvaluate) {
    // §14(6): the impact instant must lie strictly after the launch instant —
    // a torpedo launched at/after the evaluation substep continues next minute.
    if (track.launchMinute === minute && track.launchSubstep >= TORPEDO_RESOLVE_IMPACT_SUBSTEP) {
      continuedTracks.push(track);
      continue;
    }
    const target = targetByContact.get(track.targetContactId);
    const hasTarget = track.targetContactId !== NO_TARGET_CONTACT && target !== undefined;
    const profile: TargetHitProfile | null = hasTarget
      ? {
          targetId: target!.shipId,
          contactId: target!.contactId,
          collisionRadiusM: target!.profile.collisionRadiusM,
          draftM: target!.profile.draftM,
          // the §41 terminal status comes from the CURRENT authoritative
          // damage state (a FOUNDERED ship is no longer a legal physical
          // object — §14.5).
          terminalStatus: target!.damageState.terminalStatus,
        }
      : null;
    const hit = resolveTorpedoHit({
      track,
      target: profile,
      knownTracks: [...input.contacts],
      blocker: null,
      impactMinute: minute,
      impactSubstep: TORPEDO_RESOLVE_IMPACT_SUBSTEP,
    });
    const solution = trackLaunchSolution.get(track.torpedoTrackId);
    const commandSource = commandSourceOf(track, launcherById);
    records.push(
      makeRecord(battleId, {
        kind: "HIT_RESOLUTION",
        battleMinute: minute,
        substep: TORPEDO_RESOLVE_IMPACT_SUBSTEP,
        sourceId: track.torpedoTrackId,
        targetId: hit.targetContactId,
        commandSource,
        legalContactId: hit.targetContactId === NO_TARGET_CONTACT ? null : hit.targetContactId,
        torpedoModelId: track.torpedoModelId,
        launcherId: track.launcherId,
        settingId: track.selectedSettingId,
        solutionInputs: solution?.inputs ?? [],
        solutionQualityBp: solution?.qualityBp ?? null,
        damageEffects: { ...NEUTRAL_DAMAGE_EFFECTS, reasonCode: hit.reasonCode },
      }),
    );
    if (!hit.hit) {
      continuedTracks.push(track);
      continue;
    }

    // ---- a RESOLVED hit proceeds to detonation (§15) ---------------------
    // ADR-0031 entries (reviewer HIGH-4): `deviationMdeg: 0` (the fired
    // solution has zero gyro deviation — no evasion/target-maneuver track in
    // this slice) and `wakeIntercept: false` (no wake-homing countermeasure
    // modelled) are AUTHORED defaults, not DESIGN-40 literals — recorded in
    // ADR-0031.
    const detonation = resolveTorpedoDetonation({
      track,
      hit,
      impact: { zone: target?.zone ?? null, deviationMdeg: 0 },
      targetProtection: target?.protectionLevel ?? null,
      damageState: hasTarget
        ? { progressiveFloodingTotalKg: target!.damageState.progressiveFloodingTotal }
        : null,
      prematureEnvironment: { wakeIntercept: false },
      keyedRng,
    });
    records.push(
      makeRecord(battleId, {
        kind: "DETONATION",
        battleMinute: minute,
        substep: TORPEDO_RESOLVE_IMPACT_SUBSTEP,
        sourceId: track.torpedoTrackId,
        targetId: hit.targetContactId,
        commandSource,
        legalContactId: hit.targetContactId === NO_TARGET_CONTACT ? null : hit.targetContactId,
        torpedoModelId: track.torpedoModelId,
        launcherId: track.launcherId,
        settingId: track.selectedSettingId,
        solutionInputs: solution?.inputs ?? [],
        solutionQualityBp: solution?.qualityBp ?? null,
        rngDecision: detonation.decision.streamId
          ? {
              streamId: detonation.decision.streamId,
              draw: detonation.decision.draw,
              drawBp: detonation.decision.drawBp,
            }
          : null,
        damageEffects: { ...NEUTRAL_DAMAGE_EFFECTS, reasonCode: detonation.reasonCode },
      }),
    );

    const terminalTrack = applyTorpedoDetonationToTrack({ track, outcome: detonation.outcome });
    if (terminalTrack.terminalResult === null) {
      // NO_CONTACT keeps the torpedo authoritative; it continues to run.
      continuedTracks.push(terminalTrack);
      continue;
    }
    if (detonation.functioned && target) {
      damageQueue.push({ track, target });
    }
  }

  // ============ STAGE 4 — DAMAGE (substep 56, §28 level 7 order) ===========
  for (const demand of damageQueue) {
    const { track, target } = demand;
    const state = damageStates.get(target.shipId) ?? target.damageState;
    // §19/§20 pre-evaluation — the package fields carry the SAME keyed draws
    // the atomic application re-consumes (the same stream yields the same
    // draw — `engine.stream` creates a fresh deterministic sub-stream per
    // identity, so the double evaluation is observationally idempotent).
    const machinery = target.machinery
      ? evaluateTorpedoMachineryDamage({
          battleId,
          impactMinute: minute,
          impactSubstep: TORPEDO_RESOLVE_IMPACT_SUBSTEP,
          torpedoTrackId: track.torpedoTrackId,
          zone: target.machinery.zone,
          machineryComponents: target.machinery.machineryComponents,
          keyedRng,
        })
      : null;
    const shield = target.shockCandidates
      ? evaluateTorpedoSystemShock({
          battleId,
          impactMinute: minute,
          impactSubstep: TORPEDO_RESOLVE_IMPACT_SUBSTEP,
          entityId: track.torpedoTrackId,
          candidates: target.shockCandidates,
          keyedRng,
        })
      : null;
    const packageInput: TorpedoDamagePackageInput = {
      battleId,
      battleMinute: minute,
      substep: TORPEDO_RESOLVE_IMPACT_SUBSTEP,
      torpedoTrackId: track.torpedoTrackId,
      targetShipId: target.shipId,
      targetContactId: target.contactId,
      impactZone: target.zone,
      impactSide: target.scene.impactSide,
      longitudinalPositionM: target.scene.longitudinalPositionM,
      warheadExplosiveEquivalentMassKg: modelWarheadEquivalentKg(track.torpedoModelId),
      detonationDepthM: track.depthSettingM,
      protectionLevel: target.protectionLevel,
      hullBreachAreaM2: target.scene.hullBreachAreaM2,
      isolationState: target.scene.isolationState,
      machinery: machinery
        ? {
            severity: machinery.severity,
            affectedComponents: machinery.componentEffects.map((c) => c.componentId),
            componentOutcome: machinerySeverityToComponentOutcome(machinery.severity),
          }
        : { severity: "NO_EFFECT", affectedComponents: [], componentOutcome: "UNAFFECTED" },
      nearbySystemShock: shield
        ? {
            affectedSystemId: shield.affectedSystem?.stableSystemId ?? null,
            componentOutcome: shield.affectedSystem ? "DESTROYED" : null,
          }
        : { affectedSystemId: null, componentOutcome: null },
      fireProbabilityBp: target.scene.fireProbabilityBp,
      crewCasualties: target.scene.crewCasualties,
      damageControlAccessibility: target.scene.damageControlAccessibility,
    };
    const pkg = createTorpedoDamagePackage(packageInput);
    const result = applyTorpedoDamagePackage({
      state,
      pkg,
      flooding: target.flooding,
      machinery: target.machinery,
      shockCandidates: target.shockCandidates,
      turretComponents: target.turretComponents,
      tubeHazard: target.tubeHazard,
      designFlotationReserve: target.designFlotationReserve,
      designStabilityScore: target.designStabilityScore,
      keyedRng,
      // MEDIUM-6 (reviewer): the §19/§20 evaluation above is threaded in so the
      // machinery/shock stream draws are consumed EXACTLY once (the application
      // does not re-evaluate the same keyed streams).
      precomputedEffect: { machinery, systemShock: shield },
    });
    damageStates.set(target.shipId, result.newState);
    const command = commandSourceOf(track, launcherById);
    const solution = trackLaunchSolution.get(track.torpedoTrackId);
    records.push(
      ...damageRecordsFor(battleId, track, target, solution, command, result, {
        chain: false,
        discriminators: recordDiscriminators,
      }),
    );

    // ---- §21/§22 continuation on a TUBE_BAY severe hit --------------------
    if (result.tubeHazardResult?.severe && target.tubeHazard) {
      const chain = resolveTorpedoChainReaction({
        battleId,
        minute,
        substep: TORPEDO_RESOLVE_IMPACT_SUBSTEP,
        launcherId: target.tubeHazard.launcherId,
        loadedTorpedoes: target.tubeHazard.loadedChecks,
        modifiers: CHAIN_REACTION_NEUTRAL_MODIFIERS,
        keyedRng,
      });
      if (chain.reasonCode) {
        // every detonated check is recorded (the stable system ids)
        for (const check of chain.checks) {
          if (!check.detonated) continue;
          records.push(
            makeRecord(battleId, {
              kind: "CHAIN_REACTION",
              battleMinute: minute,
              substep: TORPEDO_RESOLVE_IMPACT_SUBSTEP,
              sourceId: track.torpedoTrackId,
              targetId: `launcher:${target.tubeHazard.launcherId}:${tubeMarker(check.tubeIndex)}`,
              commandSource: command,
              legalContactId:
                track.targetContactId === NO_TARGET_CONTACT ? null : track.targetContactId,
              torpedoModelId: check.torpedoModelId,
              launcherId: target.tubeHazard.launcherId,
              rngDecision: {
                streamId: check.decision.streamId,
                draw: check.decision.draw,
                drawBp: check.decision.drawBp,
              },
              damageEffects: { ...NEUTRAL_DAMAGE_EFFECTS, reasonCode: chain.reasonCode },
              persists: true,
            }),
          );
        }
        // the separate explosion package (the §22 "separate damage package") —
        // applied atomically on the SAME ship state (never silent alteration).
        const { warheadExplosiveEquivalentMassKg: _w, ...packageContext } = packageInput;
        const chainResult = applyTorpedoChainReactionPackage({
          chain,
          packageContext,
          state: damageStates.get(target.shipId) ?? state,
          flooding: target.flooding,
          machinery: target.machinery,
          shockCandidates: target.shockCandidates,
          turretComponents: target.turretComponents,
          designFlotationReserve: target.designFlotationReserve,
          designStabilityScore: target.designStabilityScore,
          keyedRng,
        });
        damageStates.set(target.shipId, chainResult.newState);
        // §22 chain-explosion discriminator (reviewer BLOCKER-1): the chain
        // explosion records share the primary §21 package's source/target at
        // the same instant — the `chain` marker keeps every recordId unique.
        const chainRecs = damageRecordsFor(battleId, track, target, solution, command, chainResult, {
          chain: true,
          discriminators: recordDiscriminators,
        });
        records.push(...chainRecs);
      }
    }
  }

  // ---- assemble -----------------------------------------------------------
  const sortedRecords = [...records].sort(torpedoRecordOrder);
  assertUniqueRecordIds(sortedRecords, battleId, minute);
  const events: BattleEvent[] = sortedRecords.map((r) =>
    torpedoEventFor(battleId, r, recordDiscriminators.get(r.recordId)),
  );
  const eventIds = events.map((e) => e.eventId);
  if (new Set(eventIds).size !== eventIds.length)
    invariant(
      "events.eventId",
      { battleId, minute, count: eventIds.length },
      "the torpedo stage must emit a unique eventId per record (a §22 chain explosion must not collide with its primary package)",
    );
  return {
    records: sortedRecords,
    events,
    launcherStates: Object.freeze(Object.fromEntries(launcherStates)),
    tracks: Object.freeze(continuedTracks.map((t) => ({ ...t }))),
    damageStates: Object.freeze(Object.fromEntries(damageStates)),
    changed:
      sortedRecords.length > 0 || events.length > 0 || income.length > 0 || launcherStates.size > 0,
  };
}

// ---------------------------------------------------------------------------
// damage → record family (§27: DAMAGE + FLOODING/MACHINERY/SYSTEM_SHOCK/TUBE_HAZARD)
// ---------------------------------------------------------------------------

/** AC-20 (reviewer BLOCKER-1): fail-closed assertion that every §27 record id
 *  emitted this minute is unique — even on the §22 chain path (whose explosion
 *  records share the primary package's source/target at the same instant and
 *  are disambiguated by the `chain` discriminator). Never weakened. */
function assertUniqueRecordIds(
  sortedRecords: readonly TorpedoRecord[],
  battleId: string,
  minute: number,
): void {
  const seen = new Set<string>();
  for (const r of sortedRecords) {
    if (seen.has(r.recordId))
      invariant(
        "records.recordId",
        { recordId: r.recordId, battleId, minute, kind: r.kind },
        "the torpedo stage must emit a unique recordId per record (a §22 chain explosion must not collide with its primary package)",
      );
    seen.add(r.recordId);
  }
}

function damageRecordsFor(
  battleId: string,
  track: TorpedoTrack,
  target: TorpedoTargetContext,
  solution:
    | { inputs: readonly { key: string; value: number }[]; qualityBp: number | null }
    | undefined,
  command: string,
  result: TorpedoDamageApplicationResult,
  opts: { chain: boolean; discriminators: Map<string, string> },
): TorpedoRecord[] {
  const recs: TorpedoRecord[] = [];
  const event = result.eventRecord;
  // Reviewer BLOCKER-1 — id/eventId uniqueness for the damage record family:
  //   - DAMAGE / MACHINERY / SYSTEM_SHOCK / TUBE_HAZARD carry sourceId = the
  //     torpedo track id, so they already differ across tracks; the §22 chain
  //     explosion (same track, same instant) needs the `chain` discriminator.
  //   - FLOODING_SOURCE carries sourceId = the COMPARTMENT (DESIGN-40 §28 level
  //     8), so two torpedoes hitting the same compartment in one minute would
  //     collide; its discriminator is scoped to the originating track (plus a
  //     `:chain` marker on the §22 chain explosion) to keep every record unique.
  const otherDiscriminator = opts.chain ? "chain" : undefined;
  const floodDiscriminator = `${track.torpedoTrackId}${opts.chain ? ":chain" : ""}`;
  const register = (rec: TorpedoRecord, discriminator: string | undefined): TorpedoRecord => {
    if (discriminator) opts.discriminators.set(rec.recordId, discriminator);
    return rec;
  };
  recs.push(
    register(
      makeRecord(battleId, {
        kind: "DAMAGE",
        battleMinute: event.battleMinute,
        substep: event.substep,
        sourceId: event.torpedoTrackId,
        targetId: event.targetShipId,
        commandSource: command,
        legalContactId: target.contactId,
        torpedoModelId: track.torpedoModelId,
        launcherId: track.launcherId,
        settingId: track.selectedSettingId,
        solutionInputs: solution?.inputs ?? [],
        solutionQualityBp: solution?.qualityBp ?? null,
        damageEffects: {
          structuralDamage: event.structuralDamage,
          flotationDamage: event.flotationDamage,
          floodingSourcesCreated: event.createdFloodingSources.length,
          terminalTransition: event.terminalTransition,
          reasonCode: null,
        },
        persists: true,
        ...(otherDiscriminator ? { discriminator: otherDiscriminator } : {}),
      }),
      otherDiscriminator,
    ),
  );
  event.createdFloodingSources.forEach((source, i) => {
    recs.push(
      register(
        makeRecord(battleId, {
          kind: "FLOODING_SOURCE",
          battleMinute: event.battleMinute,
          substep: event.substep,
          sourceId: source.compartmentId,
          targetId: `${source.compartmentId}:${source.cause}:${i}`,
          commandSource: command,
          legalContactId: target.contactId,
          torpedoModelId: track.torpedoModelId,
          launcherId: track.launcherId,
          settingId: track.selectedSettingId,
          solutionInputs: solution?.inputs ?? [],
          solutionQualityBp: solution?.qualityBp ?? null,
          damageEffects: {
            ...NEUTRAL_DAMAGE_EFFECTS,
            structuralDamage: 0,
            floodingSourcesCreated: 1,
            reasonCode: source.cause,
          },
          persists: true,
          discriminator: floodDiscriminator,
        }),
        floodDiscriminator,
      ),
    );
  });
  if (result.machineryEffect?.reasonCode) {
    recs.push(
      register(
        makeRecord(battleId, {
          kind: "MACHINERY",
          battleMinute: event.battleMinute,
          substep: event.substep,
          sourceId: event.torpedoTrackId,
          targetId: firstStableSystemIdOf(result.machineryEffect),
          commandSource: command,
          legalContactId: target.contactId,
          torpedoModelId: track.torpedoModelId,
          launcherId: track.launcherId,
          settingId: track.selectedSettingId,
          solutionInputs: solution?.inputs ?? [],
          solutionQualityBp: solution?.qualityBp ?? null,
          rngDecision: {
            streamId: result.machineryEffect.decision.streamId,
            draw: result.machineryEffect.decision.draw,
            drawBp: result.machineryEffect.decision.drawBp,
          },
          damageEffects: {
            ...NEUTRAL_DAMAGE_EFFECTS,
            reasonCode: result.machineryEffect.reasonCode,
          },
          persists: true,
          ...(otherDiscriminator ? { discriminator: otherDiscriminator } : {}),
        }),
        otherDiscriminator,
      ),
    );
  }
  if (result.systemShockResult?.affectedSystem) {
    recs.push(
      register(
        makeRecord(battleId, {
          kind: "SYSTEM_SHOCK",
          battleMinute: event.battleMinute,
          substep: event.substep,
          sourceId: event.torpedoTrackId,
          targetId: result.systemShockResult.affectedSystem!.stableSystemId,
          commandSource: command,
          legalContactId: target.contactId,
          torpedoModelId: track.torpedoModelId,
          launcherId: track.launcherId,
          settingId: track.selectedSettingId,
          solutionInputs: solution?.inputs ?? [],
          solutionQualityBp: solution?.qualityBp ?? null,
          rngDecision: result.systemShockResult.decision
            ? {
                streamId: result.systemShockResult.decision.streamId,
                draw: result.systemShockResult.decision.draw,
                drawBp: result.systemShockResult.decision.drawBp,
              }
            : null,
          damageEffects: {
            ...NEUTRAL_DAMAGE_EFFECTS,
            reasonCode: result.systemShockResult.reasonCode,
          },
          persists: true,
          ...(otherDiscriminator ? { discriminator: otherDiscriminator } : {}),
        }),
        otherDiscriminator,
      ),
    );
  }
  if (result.tubeHazardResult?.reasonCode) {
    recs.push(
      register(
        makeRecord(battleId, {
          kind: "TUBE_HAZARD",
          battleMinute: event.battleMinute,
          substep: event.substep,
          sourceId: event.torpedoTrackId,
          targetId: `launcher:${track.launcherId}`,
          commandSource: command,
          legalContactId: target.contactId,
          torpedoModelId: track.torpedoModelId,
          launcherId: track.launcherId,
          settingId: track.selectedSettingId,
          solutionInputs: solution?.inputs ?? [],
          solutionQualityBp: solution?.qualityBp ?? null,
          rngDecision: result.tubeHazardResult.decision
            ? {
                streamId: result.tubeHazardResult.decision.streamId,
                draw: result.tubeHazardResult.decision.draw,
                drawBp: result.tubeHazardResult.decision.drawBp,
              }
            : null,
          damageEffects: {
            ...NEUTRAL_DAMAGE_EFFECTS,
            floodingSourcesCreated: result.tubeHazardResult.extraFloodingSource ? 1 : 0,
            reasonCode: result.tubeHazardResult.reasonCode,
            terminalTransition: null,
          },
          persists: true,
          ...(otherDiscriminator ? { discriminator: otherDiscriminator } : {}),
        }),
        otherDiscriminator,
      ),
    );
  }
  return recs;
}

function firstStableSystemIdOf(machinery: {
  componentEffects: readonly { componentId: string }[];
}): string {
  return machinery.componentEffects[0]?.componentId ?? "machinery-space";
}
