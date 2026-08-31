// packages/combat/test/air-defense/test-helpers.ts
// Shared test fixtures for air-defense layer resolution tests.

import { SafeInt } from "@bluewave/contracts";
import {
  createAirDefenseSystemDefinition,
  createAirDefenseState,
  createAirDefenseAttack,
  Layer,
  Category,
  AttackType,
  TerminalProfile,
  type AirDefenseSystemDefinition,
  type AirDefenseAttack,
  type AirDefenseState,
  type AirDefenseContext,
} from "../../src/air-defense/index.js";

// ---- Default system factory ----

export function makeHeavyAASystem(
  overrides?: Partial<Parameters<typeof createAirDefenseSystemDefinition>[0]>,
): AirDefenseSystemDefinition {
  return createAirDefenseSystemDefinition({
    systemId: "heavy_001",
    layer: Layer.HEAVY_AA,
    category: Category.HEAVY_AA,
    mountCount: SafeInt(4),
    barrels: SafeInt(1),
    rangeMinM: SafeInt(1_000),
    rangeMaxM: SafeInt(20_000),
    altitudeMinM: SafeInt(0),
    altitudeMaxM: SafeInt(15_000),
    targetSpeedLimitMps: SafeInt(800),
    profileEligibility: new Set(["CA", "CV", "DD"]),
    engagementChannels: new Set(["ch_heavy_01"]),
    ...overrides,
  });
}

export function makeMediumAASystem(
  overrides?: Partial<Parameters<typeof createAirDefenseSystemDefinition>[0]>,
): AirDefenseSystemDefinition {
  return createAirDefenseSystemDefinition({
    systemId: "medium_001",
    layer: Layer.MEDIUM_AA,
    category: Category.MEDIUM_AA,
    mountCount: SafeInt(2),
    barrels: SafeInt(1),
    rangeMinM: SafeInt(500),
    rangeMaxM: SafeInt(10_000),
    altitudeMinM: SafeInt(0),
    altitudeMaxM: SafeInt(10_000),
    targetSpeedLimitMps: SafeInt(600),
    profileEligibility: new Set(["CA", "CV", "DD"]),
    engagementChannels: new Set(["ch_medium_01"]),
    ...overrides,
  });
}

export function makeLightAASystem(
  overrides?: Partial<Parameters<typeof createAirDefenseSystemDefinition>[0]>,
): AirDefenseSystemDefinition {
  return createAirDefenseSystemDefinition({
    systemId: "light_001",
    layer: Layer.LIGHT_AA,
    category: Category.LIGHT_AA,
    mountCount: SafeInt(6),
    barrels: SafeInt(2),
    rangeMinM: SafeInt(0),
    rangeMaxM: SafeInt(3_000),
    altitudeMinM: SafeInt(0),
    altitudeMaxM: SafeInt(5_000),
    targetSpeedLimitMps: SafeInt(400),
    profileEligibility: new Set(["CA", "CV", "DD"]),
    engagementChannels: new Set(["ch_light_01"]),
    ...overrides,
  });
}

export function makeCIWSSystem(
  overrides?: Partial<Parameters<typeof createAirDefenseSystemDefinition>[0]>,
): AirDefenseSystemDefinition {
  return createAirDefenseSystemDefinition({
    systemId: "ciws_001",
    layer: Layer.CIWS_TERMINAL_DEFENSE,
    category: Category.CIWS_TERMINAL_DEFENSE,
    mountCount: SafeInt(1),
    barrels: SafeInt(1),
    rangeMinM: SafeInt(0),
    rangeMaxM: SafeInt(1_500),
    altitudeMinM: SafeInt(0),
    altitudeMaxM: SafeInt(3_000),
    targetSpeedLimitMps: SafeInt(2_000),
    profileEligibility: new Set(["CA", "CV", "DD"]),
    engagementChannels: new Set(["ch_ciws_01"]),
    ...overrides,
  });
}

// ---- Default attack factory ----

export function makeAttack(
  overrides?: Partial<Parameters<typeof createAirDefenseAttack>[0]>,
): AirDefenseAttack {
  return createAirDefenseAttack({
    attackId: "atk_001",
    attackType: AttackType.AIRCRAFT_LEVEL_BOMBING,
    releaseRangeM: SafeInt(5_000),
    releaseAltitudeM: SafeInt(3_000),
    terminalProfile: TerminalProfile.LEVEL,
    speedKnots: SafeInt(250),
    formationSize: SafeInt(3),
    cohesionBp: SafeInt(8_000),
    defensiveSusceptibilityBp: SafeInt(5_000),
    targetId: "ship_001",
    ...overrides,
  });
}

// ---- Default state factory ----

const defaultDirectorState = {
  channelId: "ch_heavy_01",
  assignedLayer: Layer.HEAVY_AA,
  directorIndex: SafeInt(0),
  scalingBp: SafeInt(10_000),
};

const defaultRadarState = {
  channelId: "radar_01",
  assignedLayer: Layer.HEAVY_AA,
  saturationGroup: SafeInt(0),
  diminishingReturnsBp: SafeInt(10_000),
};

export function makeState(
  systems: AirDefenseSystemDefinition[],
  overrides?: {
    defenderId?: string;
    channelReservations?: Map<string, string>;
    ammunitionByType?: Map<string, SafeInt>;
    powerBp?: SafeInt;
    damageBp?: SafeInt;
  },
): AirDefenseState {
  let state = createAirDefenseState(
    overrides?.defenderId ?? "ship_001",
    "SHIP",
    systems,
    defaultDirectorState,
    defaultRadarState,
    SafeInt(10_000),
  );
  if (overrides?.ammunitionByType) {
    state = { ...state, ammunitionByType: overrides.ammunitionByType };
  }
  if (overrides?.channelReservations) {
    state = { ...state, channelReservations: overrides.channelReservations };
  }
  if (overrides?.powerBp !== undefined) {
    state = { ...state, powerBp: overrides.powerBp };
  }
  if (overrides?.damageBp !== undefined) {
    state = { ...state, damageBp: overrides.damageBp };
  }
  return state;
}

// Override damageBp etc. after creation (state is a plain object)
export function withDamage(state: AirDefenseState, damageBp: SafeInt): AirDefenseState {
  return { ...state, damageBp };
}

export function withReservations(
  state: AirDefenseState,
  reservations: Map<string, string>,
): AirDefenseState {
  return { ...state, channelReservations: reservations };
}

export function withAmmunition(
  state: AirDefenseState,
  ammo: Map<string, SafeInt>,
): AirDefenseState {
  return { ...state, ammunitionByType: ammo };
}

// ---- Default context factory ----

export function makeContext(overrides?: Partial<AirDefenseContext>): AirDefenseContext {
  return {
    defendingShipId: "ship_001",
    targetShipId: "ship_001",
    targetType: "CA",
    nearbyShips: new Map([
      ["ship_002", SafeInt(4_000)],
      ["ship_003", SafeInt(10_000)],
    ]),
    attackerRangeM: SafeInt(8_000),
    attackerAltitudeM: SafeInt(3_000),
    fireControlSolutionBp: SafeInt(8_000),
    isPreRelease: true,
    ...overrides,
  };
}
