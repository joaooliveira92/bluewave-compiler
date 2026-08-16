import type {
  BattleInstance,
  BattleManifest,
  BattleManifestSide,
  BattleResult,
  BlockadeState,
  CampaignSlot,
  CampaignSnapshot,
  CampaignWeatherState,
  CompiledDesignVersion,
  ConstructionProject,
  DesignFamily,
  DiplomaticRelation,
  FleetState,
  IntelligenceState,
  NationState,
  PermanentDivision,
  PoliticalState,
  ResearchState,
  Ship,
  TechnologyProgress,
  WarDeclaration,
  WarParticipantMembership,
  WarState,
  WorldState,
} from "@bluewave/campaign";

// Local aliases for the world sub-record types (not re-exported from the
// campaign package; structurally identical to the state.ts interfaces of the
// same name — the audit test compares against those interface names).
type AreaData = WorldState["areas"][number];
type RouteData = WorldState["routes"][number];
type PortData = WorldState["ports"][number];

// ---------------------------------------------------------------------------
// Field-exhaustive structural deep-clone of the campaign snapshot.
//
// Every record type the snapshot materialises has an explicit copy entry in
// `F` — the ordered list of fields the clone copies. A field may only be added
// to a cloned type (or renamed) together with a matching entry here; the audit
// test (`test/snapshot-clone.test.ts`) re-reads the campaign type definitions
// and fails on any gap, so a forgotten field can never silently alias the
// caller's object graph again.
// ---------------------------------------------------------------------------

type ValueClone = (value: unknown) => unknown;

/** Deep-copies a value by runtime kind. Primitive values are returned as-is;
 *  Maps, arrays and plain records are structurally re-created (never shared). */
function cloneValue(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== "object") return value;
  if (value instanceof Map) {
    return new Map([...value].map(([key, v]) => [key, cloneValue(v)]));
  }
  if (Array.isArray(value)) return value.map((v) => cloneValue(v));
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    out[key] = cloneValue((value as Record<string, unknown>)[key]);
  }
  return out;
}

/** Builds a fresh object copying exactly the declared `fields`, running the
 *  optional per-field value clones (used for nested structured types). Any
 *  field present on the source but missing from `fields` is intentionally
 *  dropped — the audit test forbids that from happening for the declared
 *  types. */
function recordClone<T extends object>(
  source: T,
  fields: readonly (keyof T)[],
  special: Partial<Record<keyof T, ValueClone>> = {},
): T {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const value = (source as Record<string, unknown>)[field as string];
    out[field as string] = special[field] ? special[field]!(value) : cloneValue(value);
  }
  return out as T;
}

const F = {
  Ship: [
    "id",
    "name",
    "classId",
    "nationId",
    "locationAreaId",
    "designVersionId",
    "hitPoints",
    "maxHitPoints",
    "speed",
    "firepower",
    "armor",
    "isUnderConstruction",
    "constructionProgress",
    "constructionTotalWork",
    "inBattleId",
  ] as const satisfies readonly (keyof Ship)[],

  FleetState: [
    "id",
    "nationId",
    "name",
    "ships",
    "locationAreaId",
  ] as const satisfies readonly (keyof FleetState)[],

  TechnologyProgress: [
    "techId",
    "investedPoints",
    "completed",
  ] as const satisfies readonly (keyof TechnologyProgress)[],

  ResearchState: [
    "nationId",
    "technologies",
    "currentProjectTechId",
    "fieldPriorities",
    "researchBudget",
    "activeCandidates",
    "discoveredTechs",
  ] as const satisfies readonly (keyof ResearchState)[],

  PermanentDivision: [
    "divisionId",
    "nationId",
    "shipOrder",
    "flagshipShipId",
    "commanderOfficerId",
    "divisionRole",
    "preferredFormation",
    "experience",
    "cohesion",
    "locationAreaId",
    "creationMonth",
    "lastReorganizationMonth",
    "provenanceRefs",
    "rulesetVersion",
    "aggregateHash",
  ] as const satisfies readonly (keyof PermanentDivision)[],

  ConstructionProject: [
    "id",
    "type",
    "projectType",
    "targetId",
    "designVersionId",
    "totalWork",
    "completedWork",
    "paidWork",
    "status",
    "startedAt",
  ] as const satisfies readonly (keyof ConstructionProject)[],

  NationState: [
    "id",
    "name",
    "tag",
    "treasury",
    "income",
    "expenses",
    "baseResources",
    "navalAppropriationRateBp",
    "maintenanceCost",
    "fleets",
    "divisions",
    "research",
    "constructionProjects",
    "isPlayable",
    "isAI",
  ] as const satisfies readonly (keyof NationState)[],

  DiplomaticRelation: [
    "nationA",
    "nationB",
    "relation",
    "tension",
    "nap",
    "since",
  ] as const satisfies readonly (keyof DiplomaticRelation)[],

  PoliticalState: ["relations", "shells"] as const satisfies readonly (keyof PoliticalState)[],

  IntelligenceState: ["shells"] as const satisfies readonly (keyof IntelligenceState)[],

  AreaData: ["id", "name", "type", "controller"] as const satisfies readonly (keyof AreaData)[],

  RouteData: [
    "id",
    "from",
    "to",
    "type",
    "distance",
  ] as const satisfies readonly (keyof RouteData)[],

  PortData: [
    "id",
    "name",
    "areaId",
    "nationId",
    "level",
  ] as const satisfies readonly (keyof PortData)[],

  WorldState: ["areas", "routes", "ports"] as const satisfies readonly (keyof WorldState)[],

  WarDeclaration: [
    "id",
    "attackerSideId",
    "defenderSideId",
    "attackerSideMembers",
    "defenderSideMembers",
    "attackerWarScore",
    "defenderWarScore",
    "attackerId",
    "defenderId",
    "startDate",
    "status",
    "endDate",
  ] as const satisfies readonly (keyof WarDeclaration)[],

  WarParticipantMembership: [
    "warId",
    "nationId",
    "sideId",
    "entryMonth",
    "exitMonth",
    "status",
    "nationalContributionPoints",
  ] as const satisfies readonly (keyof WarParticipantMembership)[],

  BlockadeState: [
    "blockaderId",
    "blockadedNationId",
    "areaId",
    "establishedMonth",
  ] as const satisfies readonly (keyof BlockadeState)[],

  BattleInstance: [
    "id",
    "phase",
    "attackerId",
    "defenderId",
    "areaId",
    "attackerFleetIds",
    "defenderFleetIds",
    "manifestHash",
    "result",
  ] as const satisfies readonly (keyof BattleInstance)[],

  BattleResult: [
    "winnerId",
    "loserId",
    "attackerLosses",
    "defenderLosses",
    "damageReport",
    "explanation",
  ] as const satisfies readonly (keyof BattleResult)[],

  BattleManifest: [
    "battleId",
    "opportunityId",
    "warId",
    "areaId",
    "missionType",
    "attackerId",
    "defenderId",
    "acceptanceClass",
    "missionObjectives",
    "sides",
    "persistentAssets",
    "temporaryAssets",
    "permanentDivisionIds",
    "tacticalDivisions",
    "commanders",
    "weather",
    "seaState",
    "visibility",
    "environment",
    "sourceStateHashes",
    "reservations",
    "autoResolutionProof",
    "provenanceRecords",
    "battleSeed",
    "rulesetVersion",
    "formulaVersion",
    "aiPolicyVersion",
    "rngVersion",
    "contentVersion",
    "manifestHash",
  ] as const satisfies readonly (keyof BattleManifest)[],

  BattleManifestSide: [
    "sideId",
    "participantIds",
  ] as const satisfies readonly (keyof BattleManifestSide)[],

  WarState: [
    "wars",
    "battles",
    "participantMemberships",
    "blockadeState",
    "battleManifests",
  ] as const satisfies readonly (keyof WarState)[],

  CampaignSlot: ["nationId", "type"] as const satisfies readonly (keyof CampaignSlot)[],

  CompiledDesignVersion: [
    "designVersionId",
    "designFamilyId",
    "className",
    "nationId",
    "hullType",
    "normalizedDisplacementKg",
    "normalizedSpeedUms",
    "normalizedArmorUm",
    "hitPoints",
    "mainGunsCaliber",
    "mainGunsCount",
    "machineryType",
    "crewComplement",
    "contentVersion",
    "compiledHash",
  ] as const satisfies readonly (keyof CompiledDesignVersion)[],

  DesignFamily: [
    "designFamilyId",
    "nationId",
    "rootDesignVersionId",
    "memberDesignVersionIds",
    "familyCreationMonth",
  ] as const satisfies readonly (keyof DesignFamily)[],

  CampaignWeatherState: [
    "areaId",
    "month",
    "climateProfileId",
    "seasonId",
    "persistentWeatherStateId",
    "seaState",
    "windDirectionDeg",
    "windSpeedUmPerSec",
    "precipitationType",
    "precipitationIntensityBp",
    "fogMistDensityBp",
    "cloudCoverBp",
    "daylightProfileId",
    "glareEligible",
    "baseVisibilityUm",
    "generatedAtPhase",
    "rulesetVersion",
    "climateVersion",
    "formulaVersion",
    "rngVersion",
    "stateHash",
  ] as const satisfies readonly (keyof CampaignWeatherState)[],

  CampaignSnapshot: [
    "version",
    "turnNumber",
    "campaignId",
    "startYear",
    "startMonth",
    "slots",
    "world",
    "nations",
    "wars",
    "politics",
    "intelligence",
    "designs",
    "designFamilies",
    "strategicWeather",
    "rulesetVersion",
    "compatibilityVersion",
  ] as const satisfies readonly (keyof CampaignSnapshot)[],
} as const;

const cloneShip = (s: Ship): Ship => recordClone(s, F.Ship);

const cloneFleet = (f: FleetState): FleetState =>
  recordClone(f, F.FleetState, {
    ships: (v) => (v as Ship[]).map(cloneShip),
  });

const cloneTechnology = (t: TechnologyProgress): TechnologyProgress =>
  recordClone(t, F.TechnologyProgress);

const cloneResearch = (r: ResearchState): ResearchState =>
  recordClone(r, F.ResearchState, {
    technologies: (v) => (v as TechnologyProgress[]).map(cloneTechnology),
  });

const cloneDivision = (d: PermanentDivision): PermanentDivision =>
  recordClone(d, F.PermanentDivision);

const cloneConstructionProject = (c: ConstructionProject): ConstructionProject =>
  recordClone(c, F.ConstructionProject);

const cloneNation = (n: NationState): NationState =>
  recordClone(n, F.NationState, {
    fleets: (v) => (v as FleetState[]).map(cloneFleet),
    divisions: (v) => (v as PermanentDivision[]).map(cloneDivision),
    research: (v) => cloneResearch(v as ResearchState),
    constructionProjects: (v) => (v as ConstructionProject[]).map(cloneConstructionProject),
  });

const cloneBattleResult = (r: BattleResult): BattleResult => recordClone(r, F.BattleResult);

const cloneBattle = (b: BattleInstance): BattleInstance =>
  recordClone(b, F.BattleInstance, {
    result: (v) => (v === undefined ? undefined : cloneBattleResult(v as BattleResult)),
  });

const cloneManifest = (m: BattleManifest): BattleManifest =>
  recordClone(m, F.BattleManifest, {
    sides: (v) =>
      (v as BattleManifestSide[]).map((side) => recordClone(side, F.BattleManifestSide)),
  });

const cloneWeather = (w: CampaignWeatherState): CampaignWeatherState =>
  recordClone(w, F.CampaignWeatherState);

const cloneDesign = (d: CompiledDesignVersion): CompiledDesignVersion =>
  recordClone(d, F.CompiledDesignVersion);

const cloneDesignFamily = (d: DesignFamily): DesignFamily => recordClone(d, F.DesignFamily);

const cloneDesigns = (designs: CampaignSnapshot["designs"]): CampaignSnapshot["designs"] =>
  new Map([...designs].map(([id, d]) => [id, cloneDesign(d)]));

const cloneDesignFamilies = (
  designFamilies: CampaignSnapshot["designFamilies"],
): CampaignSnapshot["designFamilies"] =>
  new Map([...designFamilies].map(([id, d]) => [id, cloneDesignFamily(d)]));

/**
 * Structural deep-clone of the campaign snapshot (B-2/engine-state-hardening
 * 01). Every field of every cloned record type has an explicit copy entry in
 * `F`; `CLONE_COVERAGE` exposes those entries so the audit test can fail on any
 * field added/renamed on a campaign type without a matching clone path. The
 * clone produces a fully disjoint object graph — no shared reference with the
 * caller's snapshot, and no shared reference between consecutive turns.
 */
export function cloneSnapshot(snapshot: CampaignSnapshot): CampaignSnapshot {
  return recordClone(snapshot, F.CampaignSnapshot, {
    slots: (v) => (v as CampaignSlot[]).map((s) => recordClone(s, F.CampaignSlot)),
    world: (v) =>
      recordClone(v as WorldState, F.WorldState, {
        areas: (areas) => (areas as AreaData[]).map((a) => recordClone(a, F.AreaData)),
        routes: (routes) => (routes as RouteData[]).map((r) => recordClone(r, F.RouteData)),
        ports: (ports) => (ports as PortData[]).map((p) => recordClone(p, F.PortData)),
      }),
    nations: (v) =>
      new Map([...(v as Map<string, NationState>)].map(([id, n]) => [id, cloneNation(n)])),
    wars: (v) =>
      recordClone(v as WarState, F.WarState, {
        wars: (wars) => (wars as WarDeclaration[]).map((w) => recordClone(w, F.WarDeclaration)),
        battles: (battles) => (battles as BattleInstance[]).map(cloneBattle),
        participantMemberships: (memberships) =>
          (memberships as WarParticipantMembership[]).map((m) =>
            recordClone(m, F.WarParticipantMembership),
          ),
        blockadeState: (state) =>
          (state as BlockadeState[]).map((b) => recordClone(b, F.BlockadeState)),
        battleManifests: (manifests) =>
          (manifests === undefined ? [] : (manifests as BattleManifest[])).map(cloneManifest),
      }),
    politics: (v) =>
      recordClone(v as PoliticalState, F.PoliticalState, {
        relations: (relations) =>
          (relations as DiplomaticRelation[]).map((r) => recordClone(r, F.DiplomaticRelation)),
      }),
    intelligence: (v) => recordClone(v as IntelligenceState, F.IntelligenceState),
    designs: (v) => cloneDesigns(v as CampaignSnapshot["designs"]),
    designFamilies: (v) => cloneDesignFamilies(v as CampaignSnapshot["designFamilies"]),
    strategicWeather: (v) =>
      (v === undefined ? [] : (v as CampaignWeatherState[])).map(cloneWeather),
  });
}

/** Audit surface: type name → the exact ordered list of fields the deep-clone
 *  copies for that type. `test/snapshot-clone.test.ts` compares this against
 *  the campaign type definitions. */
export const CLONE_COVERAGE: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  Object.entries(F).map(([typeName, fields]) => [typeName, fields as readonly string[]]),
);
