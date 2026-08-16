//packages/combat/src/torpedoes/state.ts
// DESIGN-40 §2 authoritative TorpedoLauncherState: one per installed launcher.
// The numeric surface is integer fixed-point (DESIGN-07): tube count, integer
// ammunition counts, integer milli-degree train limits, integer reload
// milliseconds. Non-integers and malformed fields are rejected at the
// construction boundary (INVALID_TORPEDO_LAUNCHER_STATE) and by the
// reversible-to-invariant guard (TORPEDO_STATE_INVARIANT_FAILED). The state
// carries an authoritative deterministic state hash. Pure/deterministic: no
// ambient I/O/clock/random.
import { BluewaveError } from "@bluewave/contracts";
import { createEnvelope } from "@bluewave/deterministic";
import {
  EMPTY_TUBE,
  FIRE_CONTROL_CONNECTION_STATES,
  type FireControlConnectionState,
  FLOODING_ISOLATION_STATES,
  type FloodingIsolationState,
  LAUNCHER_DAMAGE_STATES,
  type LauncherDamageState,
  NO_FIRE_SOLUTION,
  TORPEDO_MOUNT_TYPES,
  type TorpedoMountType,
  torpedoPolicyId,
} from "./constants.js";
import { TORPEDO_STATE_INVARIANT_FAILED } from "./reasonCodes.js";

// DESIGN-40 §2/§3 reload state. A reload reserves + consumes one compatible
// reserve torpedo (ammunition.ts reserveForReload) and the required reload time;
// the tube fills only when the reload completes (progressMs >= requiredReloadTimeMs
// via completeTorpedoReload; minute-advance wiring lands in INC-7).
export type TorpedoReloadState =
  | { status: "NO_RELOAD_IN_PROGRESS" }
  | {
      status: "RELOAD_IN_PROGRESS";
      tubeIndex: number;
      modelId: string;
      requiredReloadTimeMs: number;
      progressMs: number;
    };

export const NO_RELOAD_IN_PROGRESS: TorpedoReloadState = { status: "NO_RELOAD_IN_PROGRESS" };

// DESIGN-40 §2 authoritative launcher state.
export interface TorpedoLauncherState {
  launcherId: string;
  ownerPlatformId: string;
  launcherFamilyId: string;
  mountPosition: string;
  mountType: TorpedoMountType; // closed enum — exactly five §2 values
  tubeCount: number; // integer >= 1
  // Torpedo model id per tube, or the canonical EMPTY_TUBE marker — enforced at
  // runtime by assertFixedPointTorpedo (a plain `string` type per
  // no-redundant-type-constituents; the marker is a documented constant).
  loadedPerTube: readonly string[]; // length === tubeCount
  reserveAmmunition: Record<string, number>; // by torpedo model id, non-negative integers
  reloadState: TorpedoReloadState;
  trainingLimitsMdeg: { min: number; max: number }; // integer milli-degrees, min <= max
  underwaterLaunchCapability: boolean;
  fireControlConnectionState: FireControlConnectionState;
  damageState: LauncherDamageState;
  floodingIsolationState: FloodingIsolationState;
  // Fire-solution id, or the canonical NO_FIRE_SOLUTION marker — enforced at
  // runtime (see assertFixedPointTorpedo).
  activeFireSolution: string;
  rulesetVersion: string;
  formulaVersion: string;
  stateHash: string; // authoritative deterministic hash
}

function invariant(s: TorpedoLauncherState, field: string, value: unknown, reason: string): never {
  const message = TORPEDO_STATE_INVARIANT_FAILED;
  throw new BluewaveError(message, {
    code: TORPEDO_STATE_INVARIANT_FAILED,
    field,
    reason,
    value,
  });
}

// AC-2: reject any non-integer / out-of-bound / malformed field in the
// authoritative TorpedoLauncherState with TORPEDO_STATE_INVARIANT_FAILED.
// Reversible-to-invariant: a failure leaves the supplied state untouched.
export function assertFixedPointTorpedo(s: TorpedoLauncherState): void {
  if (typeof s.launcherId !== "string" || s.launcherId.length === 0)
    invariant(s, "launcherId", s.launcherId, "launcherId must be a non-empty string");
  if (typeof s.ownerPlatformId !== "string" || s.ownerPlatformId.length === 0)
    invariant(s, "ownerPlatformId", s.ownerPlatformId, "ownerPlatformId must be a non-empty string");
  if (typeof s.launcherFamilyId !== "string" || s.launcherFamilyId.length === 0)
    invariant(
      s,
      "launcherFamilyId",
      s.launcherFamilyId,
      "launcherFamilyId must be a non-empty string",
    );
  if (typeof s.mountPosition !== "string" || s.mountPosition.length === 0)
    invariant(s, "mountPosition", s.mountPosition, "mountPosition must be a non-empty string");

  if (!(TORPEDO_MOUNT_TYPES as readonly string[]).includes(s.mountType))
    invariant(s, "mountType", s.mountType, "mountType must be one of the five DESIGN-40 §2 values");

  if (!Number.isInteger(s.tubeCount) || s.tubeCount < 1)
    invariant(s, "tubeCount", s.tubeCount, "tubeCount must be an integer >= 1");

  if (!Array.isArray(s.loadedPerTube) || s.loadedPerTube.length !== s.tubeCount)
    invariant(
      s,
      "loadedPerTube",
      s.loadedPerTube,
      "loadedPerTube must be an array of length tubeCount (model id or EMPTY per tube)",
    );
  for (let i = 0; i < s.loadedPerTube.length; i++) {
    const entry = s.loadedPerTube[i];
    if (entry === EMPTY_TUBE) continue;
    if (typeof entry !== "string" || entry.length === 0)
      invariant(s, `loadedPerTube[${i}]`, entry, "each tube must hold a model id or EMPTY");
  }

  if (typeof s.reserveAmmunition !== "object" || s.reserveAmmunition === null)
    invariant(s, "reserveAmmunition", s.reserveAmmunition, "reserveAmmunition must be a record keyed by model id");
  for (const [modelId, count] of Object.entries(s.reserveAmmunition)) {
    if (modelId.length === 0)
      invariant(s, "reserveAmmunition", s.reserveAmmunition, "reserve model id must be non-empty");
    if (!Number.isInteger(count) || count < 0)
      invariant(
        s,
        `reserveAmmunition[${modelId}]`,
        count,
        "reserve count must be a non-negative integer",
      );
  }

  // The reload state is a closed two-member union; the status check uses a
  // widened view so a malformed runtime status value is caught here (the union
  // narrowing alone would make the invalid branch statically unreachable).
  const reloadStatus: unknown = (s.reloadState as { status?: unknown }).status;
  if (reloadStatus === "RELOAD_IN_PROGRESS") {
    const r = s.reloadState as Extract<TorpedoReloadState, { status: "RELOAD_IN_PROGRESS" }>;
    if (!Number.isInteger(r.tubeIndex) || r.tubeIndex < 0 || r.tubeIndex >= s.tubeCount)
      invariant(s, "reloadState.tubeIndex", r.tubeIndex, "reload tubeIndex must be within [0, tubeCount)");
    if (typeof r.modelId !== "string" || r.modelId.length === 0)
      invariant(s, "reloadState.modelId", r.modelId, "reload model id must be non-empty");
    if (!Number.isInteger(r.requiredReloadTimeMs) || r.requiredReloadTimeMs <= 0)
      invariant(s, "reloadState.requiredReloadTimeMs", r.requiredReloadTimeMs, "required reload time must be a positive integer ms");
    if (!Number.isInteger(r.progressMs) || r.progressMs < 0 || r.progressMs > r.requiredReloadTimeMs)
      invariant(
        s,
        "reloadState.progressMs",
        r.progressMs,
        "reload progress must be an integer within [0, requiredReloadTimeMs]",
      );
  } else if (reloadStatus !== "NO_RELOAD_IN_PROGRESS") {
    invariant(s, "reloadState.status", reloadStatus, "reload state status must be canonical");
  }

  const train = s.trainingLimitsMdeg;
  if (typeof train !== "object" || train === null)
    invariant(s, "trainingLimitsMdeg", train, "trainingLimitsMdeg must be a record");
  if (!Number.isInteger(train.min) || !Number.isInteger(train.max))
    invariant(s, "trainingLimitsMdeg", train, "training limits must be integer milli-degrees");
  if (train.min > train.max)
    invariant(s, "trainingLimitsMdeg", train, "training min must not exceed max");

  if (typeof s.underwaterLaunchCapability !== "boolean")
    invariant(s, "underwaterLaunchCapability", s.underwaterLaunchCapability, "must be a boolean");

  if (!(FIRE_CONTROL_CONNECTION_STATES as readonly string[]).includes(s.fireControlConnectionState))
    invariant(
      s,
      "fireControlConnectionState",
      s.fireControlConnectionState,
      "fire-control connection state must be canonical",
    );
  if (!(LAUNCHER_DAMAGE_STATES as readonly string[]).includes(s.damageState))
    invariant(s, "damageState", s.damageState, "damage state must be canonical");
  if (!(FLOODING_ISOLATION_STATES as readonly string[]).includes(s.floodingIsolationState))
    invariant(s, "floodingIsolationState", s.floodingIsolationState, "flooding-isolation state must be canonical");

  if (s.activeFireSolution === NO_FIRE_SOLUTION) {
    // valid
  } else if (typeof s.activeFireSolution !== "string" || s.activeFireSolution.length === 0) {
    invariant(s, "activeFireSolution", s.activeFireSolution, "active fire solution must be an id or NONE");
  }

  if (typeof s.rulesetVersion !== "string" || s.rulesetVersion.length === 0)
    invariant(s, "rulesetVersion", s.rulesetVersion, "rulesetVersion must be a non-empty string");
  if (typeof s.formulaVersion !== "string" || s.formulaVersion.length === 0)
    invariant(s, "formulaVersion", s.formulaVersion, "formulaVersion must be a non-empty string");
}

// Authoritative deterministic state hash: canonicalSerialize + sha256 over the
// non-hash surface, domain-separated with the torpedo_v1 compatibility version.
// Any provided stateHash is ignored so the hash depends only on the state fields.
export function computeTorpedoLauncherStateHash(s: TorpedoLauncherState): string {
  const surface = {
    launcherId: s.launcherId,
    ownerPlatformId: s.ownerPlatformId,
    launcherFamilyId: s.launcherFamilyId,
    mountPosition: s.mountPosition,
    mountType: s.mountType,
    tubeCount: s.tubeCount,
    loadedPerTube: s.loadedPerTube,
    reserveAmmunition: s.reserveAmmunition,
    reloadState: s.reloadState,
    trainingLimitsMdeg: s.trainingLimitsMdeg,
    underwaterLaunchCapability: s.underwaterLaunchCapability,
    fireControlConnectionState: s.fireControlConnectionState,
    damageState: s.damageState,
    floodingIsolationState: s.floodingIsolationState,
    activeFireSolution: s.activeFireSolution,
    rulesetVersion: s.rulesetVersion,
    formulaVersion: s.formulaVersion,
  };
  return createEnvelope("torpedo-launcher-state", torpedoPolicyId, surface).bodyHash;
}

// Build a fully-invariant TorpedoLauncherState with its authoritative hash.
export function withTorpedoLauncherStateHash(
  s: Omit<TorpedoLauncherState, "stateHash">,
): TorpedoLauncherState {
  const full = s as TorpedoLauncherState;
  assertFixedPointTorpedo(full);
  return { ...full, stateHash: computeTorpedoLauncherStateHash(full) };
}