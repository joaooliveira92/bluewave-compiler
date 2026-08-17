// Deterministic child-process script for the B-6 battle auto-resolution
// orchestrator. Spawned TWICE by test/battle-resolution/determinism.test.ts and
// byte-compared (AC-10: two-process OS-independence genuinely exercised).
// Uses only fixed inputs; the sole randomness is the domain-separated keyed
// streams derived from the battle seed (derived from the fixed campaign seed) —
// no ambient clock/random/env/fs order.
import { canonicalSerialize } from "@bluewave/deterministic";
import { SafeInt } from "@bluewave/contracts";
import type { CompiledDesignVersion, Ship } from "@bluewave/campaign";
import { buildManifest, type BattleManifest } from "../generation/manifest.js";
import { withStrategicWeatherStateHash } from "../weather/strategic-state.js";
import { resolveBattleAuto, type ResolveBattleAutoInput } from "../battleResolution/resolve.js";
import type { AutoResolverNation } from "../battleResolution/project.js";

const ATTACKER = "n-uk";
const DEFENDER = "n-fr";

function design(designVersionId: string, nationId: string): CompiledDesignVersion {
  return {
    designVersionId,
    designFamilyId: `${designVersionId}-family`,
    className: `Class ${designVersionId}`,
    nationId,
    hullType: "battleship",
    normalizedDisplacementKg: SafeInt(30_000_000),
    normalizedSpeedUms: SafeInt(15_433_320),
    normalizedArmorUm: SafeInt(305_000_000),
    hitPoints: SafeInt(100),
    mainGunsCaliber: SafeInt(343_000_000),
    mainGunsCount: SafeInt(10),
    machineryType: "steam_triple_expansion",
    crewComplement: SafeInt(1_000),
    contentVersion: "fixture_v1",
    compiledHash: `compiled-${designVersionId}`,
  };
}

function ship(id: string, designVersionId: string, nationId: string): Ship {
  return {
    id,
    name: id,
    classId: designVersionId,
    nationId,
    locationAreaId: "area-eng-ch",
    designVersionId,
    hitPoints: SafeInt(100),
    maxHitPoints: SafeInt(100),
    speed: SafeInt(30),
    firepower: SafeInt(10),
    armor: SafeInt(12),
    isUnderConstruction: false,
    constructionProgress: SafeInt(0),
    constructionTotalWork: SafeInt(0),
  };
}

function nation(nationId: string, shipIds: string[]): AutoResolverNation {
  const designs = new Map<string, CompiledDesignVersion>();
  for (const id of shipIds) designs.set(id, design(id, nationId));
  return {
    nationId,
    ships: shipIds.map((id) => ship(id, id, nationId)),
    designs,
    divisions: [],
  };
}

function manifest(): BattleManifest {
  return buildManifest({
    battleId: "b6-child-battle",
    opportunityId: "opp-child",
    warId: "war-child",
    areaId: "area-eng-ch",
    missionType: "open_fleet_engagement",
    attackerId: ATTACKER,
    defenderId: DEFENDER,
    acceptanceClass: "accepted",
    missionObjectives: [],
    sides: [
      { sideId: "ATTACKER", participantIds: [ATTACKER] },
      { sideId: "DEFENDER", participantIds: [DEFENDER] },
    ],
    persistentAssets: ["a1", "a2", "d1", "d2"],
    temporaryAssets: [],
    permanentDivisionIds: [],
    tacticalDivisions: [],
    commanders: [],
    weather: "clear",
    seaState: "calm",
    visibility: "good",
    environment: "open_sea",
    sourceStateHashes: {},
    reservations: [],
    autoResolutionProof: "auto-resolvable",
    provenanceRecords: [],
    rulesetVersion: "b6_ruleset_v1",
    formulaVersion: "b6_formula_v1",
    aiPolicyVersion: "ai_policy_v1",
    rngVersion: "rng_v1",
    contentVersion: "fixture_v1",
  });
}

const input: ResolveBattleAutoInput = {
  battleId: "b6-child-battle",
  areaId: "area-eng-ch",
  campaignMonth: "1880-06",
  manifest: manifest(),
  attacker: nation(ATTACKER, ["a1", "a2"]),
  defender: nation(DEFENDER, ["d1", "d2"]),
  strategicWeather: withStrategicWeatherStateHash({
    areaId: "area-eng-ch",
    month: "1880-06",
    climateProfileId: "default",
    seasonId: "summer",
    persistentWeatherStateId: "",
    seaState: 3,
    windDirectionDeg: 225,
    windSpeedUmPerSec: 8_000_000,
    precipitationType: "NONE",
    precipitationIntensityBp: 0,
    fogMistDensityBp: 500,
    cloudCoverBp: 5_000,
    daylightProfileId: "default_daylight_v1",
    glareEligible: true,
    baseVisibilityUm: 60_000_000_000,
    generatedAtPhase: "weather_generation",
    rulesetVersion: "weather_ruleset_v1",
    climateVersion: "weather_climate_v1",
    formulaVersion: "weather_formula_v1",
    rngVersion: "weather_rng_v1",
  }),
  campaignSeed: "child-campaign-seed-b6-fixed",
  rulesetVersion: "b6_ruleset_v1",
  formulaVersion: "b6_formula_v1",
  rngVersion: "rng_v1",
};

function main(): void {
  const result = resolveBattleAuto(input);
  const out = {
    resultHash: result.resultHash,
    battleEndReason: result.battleEndReason,
    elapsedMinutes: result.elapsedMinutes,
    winnerId: result.winnerId,
    loserId: result.loserId,
    eventLedgerHash: result.eventLedgerHash,
    minuteHashes: result.minuteHashes,
    damageReport: result.damageReport,
    survivorSunk: {
      attackerSurvivorIds: result.attackerSurvivorIds,
      defenderSurvivorIds: result.defenderSurvivorIds,
      attackerSunkIds: result.attackerSunkIds,
      defenderSunkIds: result.defenderSunkIds,
    },
  };
  process.stdout.write(canonicalSerialize(out) + "\n");
}

try {
  main();
} catch (e) {
  process.stderr.write(`CHILD_FAILED: ${(e as Error).message}\n`);
  process.exitCode = 1;
}
