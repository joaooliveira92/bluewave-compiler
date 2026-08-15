import { SafeInt } from "@bluewave/contracts";
import { BluewaveError } from "@bluewave/contracts";
import type {
  CampaignSnapshot,
  NationState,
  Ship,
  FleetState,
  TechnologyProgress,
  WarDeclaration,
  WarParticipantMembership,
  BlockadeState,
  PermanentDivision,
  BattleInstance,
  BattleResult,
  DivisionAssetView,
  CanonicalShipType,
  CampaignWeatherState,
} from "@bluewave/campaign";
import {
  WAR_SCORE_MINOR,
  WAR_SCORE_MAJOR,
  WAR_SCORE_DECISIVE,
  VICTORY_MINOR_MAX_FRACTION,
  VICTORY_MAJOR_MAX_FRACTION,
  MAXIMUM_CONCURRENT_WARS,
  NAP_VIOLATION_PENALTY,
  SURRENDER_SCORE,
  BLOCKADE_WAR_SCORE_PER_MONTH,
  TENSION_WAR,
  TENSION_PEACE,
  TENSION_ALLIANCE,
  VACANT,
  applyDivisionCommand,
  assertDivisionInvariants,
  INITIAL_DIVISION_EXPERIENCE,
  INITIAL_DIVISION_COHESION,
  DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE,
  DIVISION_STATE_INVARIANT_FAILED,
} from "@bluewave/campaign";
import type {
  CommandEnvelope,
  CommandBody,
  SetResearchPriorityCommand,
  DeclareWarCommand,
  AcceptPeaceCommand,
  FormAllianceCommand,
  BreakAllianceCommand,
  FormNonAggressionPactCommand,
  BreakNonAggressionPactCommand,
  DeclareBlockadeCommand,
  BudgetProjectCommand,
  CreateDivisionCommand,
  AddShipToDivisionCommand,
  RemoveShipFromDivisionCommand,
  DissolveDivisionCommand,
  ChangeDivisionFlagshipCommand,
} from "@bluewave/commands";
import { CANONICAL_RESEARCH_FIELD_IDS as RESEARCH_FIELD_IDS } from "@bluewave/content-schema";
import { CommandLifecycle, CommandLedger, CommandIdempotencyMap } from "@bluewave/commands";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { EventLedger } from "@bluewave/events";
import type { DomainEventEnvelope } from "@bluewave/events";
import { RandomEngine, RandomLedger } from "@bluewave/random";
import { BattleResolver, generateBattles } from "@bluewave/combat";
import { resolveBattleAuto } from "@bluewave/combat";
import type { BattleResolutionResult } from "@bluewave/combat";
import { BATTLE_AUTO_RESOLUTION_FAILED } from "@bluewave/combat";
import { INVALID_BATTLE_WEATHER_INITIALIZATION } from "@bluewave/combat";
import { classifyShip } from "@bluewave/combat";
import { generateStrategicWeather, defaultClimateProfile_v1 } from "@bluewave/combat";
import { WEATHER_PROFILE_INCOMPLETE } from "@bluewave/combat";
import type { ClimateProfile } from "@bluewave/combat";
import { campaignMonthId } from "@bluewave/campaign";
import { AiPhaseExecutor } from "@bluewave/ai";
import { FinancialLedger, type LedgerTransactionInput } from "./financial-ledger.js";

const CURRENT_VERSION = "0.1.0" as const;

// B-6 INC-3: the battle manifest shape `resolveBattleAuto` consumes. The
// snapshot stores manifests structurally (campaign-side mirror); the combat
// generation manifest is the authoritative runtime shape — the phase casts at
// the single lookup seam (never a deep cross-package import).
type AutoResolutionManifest = Parameters<typeof resolveBattleAuto>[0]["manifest"];

export interface MonthResult {
  finalSnapshot: CampaignSnapshot;
  commandLedger: CommandLedger;
  eventLedger: EventLedger;
  randomLedger: RandomLedger;
  financialLedger: FinancialLedger;
  success: boolean;
}

/**
 * B-6/ADR-0025: per-area climate source for the `weather_generation` phase.
 * The engine default `defaultClimateProfile_v1` is the canonical source until
 * the CONTENT-track supplies region climate-profile YAML (spec §1.3 deferral):
 * when `climateProfiles` is undefined every world area uses
 * `defaultClimateProfile_v1` (never a silent fallback — the default IS the
 * canonical source). When a caller supplies an explicit area->profile map, an
 * area missing from the map fails closed with a WEATHER_PROFILE_INCOMPLETE
 * diagnostic (no area is silently skipped without a record).
 */
export interface StrategicWeatherPhaseOptions {
  readonly climateProfiles?: ReadonlyMap<string, ClimateProfile>;
}

function cloneSnapshot(snapshot: CampaignSnapshot): CampaignSnapshot {
  const nations = new Map<string, NationState>();
  for (const [id, nation] of snapshot["nations"]) {
    const clonedNation: NationState = {
      id: nation["id"],
      name: nation["name"],
      tag: nation["tag"],
      treasury: nation["treasury"],
      income: nation["income"],
      expenses: nation["expenses"],
      baseResources: nation["baseResources"],
      navalAppropriationRateBp: nation["navalAppropriationRateBp"],
      maintenanceCost: nation["maintenanceCost"],
      fleets: nation["fleets"].map((f) => ({
        id: f["id"],
        nationId: f["nationId"],
        name: f["name"],
        locationAreaId: f["locationAreaId"],
        ships: f["ships"].map((s) => ({
          id: s["id"],
          name: s["name"],
          classId: s["classId"],
          nationId: s["nationId"],
          locationAreaId: s["locationAreaId"],
          designVersionId: s["designVersionId"],
          hitPoints: s["hitPoints"],
          maxHitPoints: s["maxHitPoints"],
          speed: s["speed"],
          firepower: s["firepower"],
          armor: s["armor"],
          isUnderConstruction: s["isUnderConstruction"],
          constructionProgress: s["constructionProgress"],
          constructionTotalWork: s["constructionTotalWork"],
          inBattleId: s["inBattleId"],
        })),
      })),
      research: {
        nationId: nation["research"]["nationId"],
        technologies: nation["research"]["technologies"].map((t) => ({
          techId: t["techId"],
          investedPoints: t["investedPoints"],
          completed: t["completed"],
        })),
        currentProjectTechId: nation["research"]["currentProjectTechId"],
        fieldPriorities: { ...nation["research"]["fieldPriorities"] },
        researchBudget: nation["research"]["researchBudget"],
        activeCandidates: new Map(nation["research"]["activeCandidates"]),
        discoveredTechs: [...nation["research"]["discoveredTechs"]],
      },
      divisions: nation["divisions"].map((d) => ({
        divisionId: d["divisionId"],
        nationId: d["nationId"],
        shipOrder: [...d["shipOrder"]],
        flagshipShipId: d["flagshipShipId"],
        commanderOfficerId: d["commanderOfficerId"],
        divisionRole: d["divisionRole"],
        preferredFormation: d["preferredFormation"],
        experience: d["experience"],
        cohesion: d["cohesion"],
        locationAreaId: d["locationAreaId"],
        creationMonth: d["creationMonth"],
        lastReorganizationMonth: d["lastReorganizationMonth"],
        provenanceRefs: [...d["provenanceRefs"]],
        rulesetVersion: d["rulesetVersion"],
        aggregateHash: d["aggregateHash"],
      })),
      constructionProjects: nation["constructionProjects"].map((c) => ({
        id: c["id"],
        type: c["type"],
        projectType: c["projectType"],
        targetId: c["targetId"],
        designVersionId: c["designVersionId"],
        totalWork: c["totalWork"],
        completedWork: c["completedWork"],
        paidWork: c["paidWork"],
        status: c["status"],
        startedAt: c["startedAt"],
      })),
      isPlayable: nation["isPlayable"],
      isAI: nation["isAI"],
    };
    nations.set(id, clonedNation);
  }

  const warsArr = snapshot["wars"]["wars"].map((w) => ({
    id: w["id"],
    attackerSideId: w["attackerSideId"],
    defenderSideId: w["defenderSideId"],
    attackerSideMembers: [...w["attackerSideMembers"]],
    defenderSideMembers: [...w["defenderSideMembers"]],
    attackerWarScore: w["attackerWarScore"],
    defenderWarScore: w["defenderWarScore"],
    attackerId: w["attackerId"],
    defenderId: w["defenderId"],
    startDate: w["startDate"],
    status: w["status"],
    endDate: w["endDate"],
  }));

  const participantMembershipsArr = snapshot["wars"]["participantMemberships"].map((m) => ({
    warId: m["warId"],
    nationId: m["nationId"],
    sideId: m["sideId"],
    entryMonth: m["entryMonth"],
    exitMonth: m["exitMonth"],
    status: m["status"],
    nationalContributionPoints: m["nationalContributionPoints"],
  }));

  const blockadeStateArr = snapshot["wars"]["blockadeState"].map((b) => ({
    blockaderId: b["blockaderId"],
    blockadedNationId: b["blockadedNationId"],
    areaId: b["areaId"],
    establishedMonth: b["establishedMonth"],
  }));

  const battlesArr = snapshot["wars"]["battles"].map((b) => ({
    id: b["id"],
    phase: b["phase"],
    attackerId: b["attackerId"],
    defenderId: b["defenderId"],
    areaId: b["areaId"],
    attackerFleetIds: [...b["attackerFleetIds"]],
    defenderFleetIds: [...b["defenderFleetIds"]],
    manifestHash: b["manifestHash"],
    result: b["result"],
  }));

  const battleManifestsArr = (snapshot["wars"]["battleManifests"] ?? []).map((m) => ({
    ...m,
    missionObjectives: [...m["missionObjectives"]],
    persistentAssets: [...m["persistentAssets"]],
    temporaryAssets: [...m["temporaryAssets"]],
    permanentDivisionIds: [...m["permanentDivisionIds"]],
    tacticalDivisions: m["tacticalDivisions"].map((td) => ({ ...(td as object) })),
    commanders: [...m["commanders"]],
    reservations: [...m["reservations"]],
    provenanceRecords: [...m["provenanceRecords"]],
    sourceStateHashes: { ...m["sourceStateHashes"] },
    sides: m["sides"].map((s: { sideId: string; participantIds: string[] }) => ({
      sideId: s["sideId"],
      participantIds: [...s["participantIds"]],
    })),
  }));

  const designs = new Map(snapshot["designs"]);
  const designFamilies = new Map(snapshot["designFamilies"]);

  return {
    version: snapshot["version"],
    turnNumber: snapshot["turnNumber"],
    campaignId: snapshot["campaignId"],
    startYear: snapshot["startYear"],
    startMonth: snapshot["startMonth"],
    slots: snapshot["slots"].map((s) => ({ nationId: s["nationId"], type: s["type"] })),
    world: {
      areas: snapshot["world"]["areas"].map((a) => ({
        id: a["id"],
        name: a["name"],
        type: a["type"],
        controller: a["controller"],
      })),
      routes: snapshot["world"]["routes"].map((r) => ({
        id: r["id"],
        from: r["from"],
        to: r["to"],
        type: r["type"],
        distance: r["distance"],
      })),
      ports: snapshot["world"]["ports"].map((p) => ({
        id: p["id"],
        name: p["name"],
        areaId: p["areaId"],
        nationId: p["nationId"],
        level: p["level"],
      })),
    },
    wars: {
      wars: warsArr,
      battles: battlesArr,
      participantMemberships: participantMembershipsArr,
      blockadeState: blockadeStateArr,
      battleManifests: battleManifestsArr,
    },
    politics: {
      relations: snapshot["politics"]["relations"].map((r) => ({
        nationA: r["nationA"],
        nationB: r["nationB"],
        relation: r["relation"],
        tension: r["tension"],
        nap: r["nap"],
        since: r["since"],
      })),
      shells: { ...snapshot["politics"]["shells"] },
    },
    intelligence: {
      shells: { ...snapshot["intelligence"]["shells"] },
    },
    designs,
    designFamilies,
    nations,
    // Deep-clone the canonical current-month per-area weather collection
    // (array of immutable state records; ordering by areaId is preserved).
    strategicWeather: (snapshot["strategicWeather"] ?? []).map((s) => ({ ...s })),
    rulesetVersion: snapshot["rulesetVersion"],
    compatibilityVersion: snapshot["compatibilityVersion"],
  };
}

function budgetChangedEvent(
  nationId: string,
  previousTreasury: SafeInt,
  newTreasury: SafeInt,
  delta: SafeInt,
  reason: string,
  seq: SafeInt,
  turnNumber: SafeInt,
): DomainEventEnvelope {
  return {
    eventId: `NationBudgetChanged-${nationId}-${String(seq)}`,
    version: CURRENT_VERSION,
    aggregateType: "nation",
    aggregateId: nationId,
    eventType: "NationBudgetChanged",
    timestamp: `turn-${String(turnNumber)}`,
    body: {
      kind: "NationBudgetChanged",
      nationId,
      previousTreasury,
      newTreasury,
      delta,
      reason,
    },
    sequenceNumber: seq,
  };
}

function constructionProgressedEvent(
  projectId: string,
  nationId: string,
  previousWork: SafeInt,
  newWork: SafeInt,
  workAdded: SafeInt,
  seq: SafeInt,
  turnNumber: SafeInt,
): DomainEventEnvelope {
  return {
    eventId: `ConstructionProgressed-${projectId}-${String(seq)}`,
    version: CURRENT_VERSION,
    aggregateType: "construction",
    aggregateId: projectId,
    eventType: "ConstructionProgressed",
    timestamp: `turn-${String(turnNumber)}`,
    body: {
      kind: "ConstructionProgressed",
      projectId,
      nationId,
      previousWork,
      newWork,
      workAdded,
    },
    sequenceNumber: seq,
  };
}

function researchProgressedEvent(
  nationId: string,
  techId: string,
  previousPoints: SafeInt,
  newPoints: SafeInt,
  seq: SafeInt,
  turnNumber: SafeInt,
): DomainEventEnvelope {
  return {
    eventId: `ResearchProgressed-${nationId}-${String(seq)}`,
    version: CURRENT_VERSION,
    aggregateType: "research",
    aggregateId: techId,
    eventType: "ResearchProgressed",
    timestamp: `turn-${String(turnNumber)}`,
    body: {
      kind: "ResearchProgressed",
      nationId,
      techId,
      previousPoints,
      newPoints,
    },
    sequenceNumber: seq,
  };
}

function makeLedgerEntry(
  nationId: string,
  phaseId: string,
  categoryId: string,
  debit: SafeInt,
  credit: SafeInt,
  previousBalance: SafeInt,
  newBalance: SafeInt,
  reason: string,
  campaignMonth: string,
): LedgerTransactionInput {
  return {
    campaignMonth,
    phaseId,
    nationId,
    categoryId,
    debit,
    credit,
    previousBalance,
    newBalance,
    reason,
  };
}

function computeMaintenanceCost(ship: Ship): SafeInt {
  return SafeInt.div(SafeInt.mul(ship["hitPoints"], SafeInt(10)), SafeInt(100), "floor");
}

function computeConstructionCap(nation: NationState): SafeInt {
  const base = nation["baseResources"] ?? (0 as SafeInt);
  return SafeInt.div(SafeInt.div(base, SafeInt(12)), SafeInt(100), "floor");
}

/**
 * Shared canonical application of a SetResearchPriority command. Used by both
 * the human command_collection path and the AI_PLANNING path so behavior is
 * byte-identical.
 */
function applySetResearchPriority(
  currentSnapshot: CampaignSnapshot,
  nationId: string,
  fieldPriorities: Record<string, SafeInt>,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const nation = currentSnapshot["nations"].get(nationId);
  if (!nation) {
    collector.addError("NATION_NOT_FOUND", `Nation ${nationId} not found`, {
      stage: "command_collection",
    });
    return currentSnapshot;
  }
  const updatedNation: NationState = {
    ...nation,
    research: {
      ...nation["research"],
      fieldPriorities,
    },
  };
  const updatedNations = new Map(currentSnapshot["nations"]);
  updatedNations.set(nationId, updatedNation);
  return { ...currentSnapshot, nations: updatedNations };
}

/**
 * Shared canonical application of a budget_project command. Used by both the
 * human command_collection path and the AI_PLANNING path so behavior is
 * byte-identical.
 */
function applyBudgetProject(
  currentSnapshot: CampaignSnapshot,
  body: BudgetProjectCommand,
  campaignMonth: string,
  turnNumber: SafeInt,
  nextSeq: () => SafeInt,
  financialLedger: FinancialLedger,
  eventLedger: EventLedger,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const nation = currentSnapshot["nations"].get(body["nationId"]);
  if (!nation) {
    collector.addError("NATION_NOT_FOUND", `Nation ${body["nationId"]} not found`, {
      stage: "command_collection",
    });
    return currentSnapshot;
  }

  const project = nation["constructionProjects"].find((p) => p["id"] === body["projectId"]);
  if (!project) {
    collector.addError("PROJECT_NOT_FOUND", `Project ${body["projectId"]} not found`, {
      stage: "command_collection",
    });
    return currentSnapshot;
  }

  const budget = body["budget"];
  const previousTreasury = nation["treasury"];
  const newTreasury = SafeInt.sub(previousTreasury, budget);
  const rawNewWork = SafeInt.add(project["completedWork"], budget);
  const clampedWork = rawNewWork > project["totalWork"] ? project["totalWork"] : rawNewWork;

  const updatedNation: NationState = {
    ...nation,
    treasury: newTreasury,
    constructionProjects: nation["constructionProjects"].map((p) =>
      p["id"] === body["projectId"]
        ? {
            ...p,
            completedWork: clampedWork,
            paidWork: SafeInt.add(p["paidWork"], budget),
            status: "ACTIVE" as const,
          }
        : p,
    ),
  };
  const updatedNations = new Map(currentSnapshot["nations"]);
  updatedNations.set(body["nationId"], updatedNation);
  const next = { ...currentSnapshot, nations: updatedNations };

  financialLedger.append(
    makeLedgerEntry(
      body["nationId"],
      "command_collection",
      "CONSTRUCTION_BUDGET",
      budget,
      budget,
      previousTreasury,
      newTreasury,
      `Player budget for project ${body["projectId"]}`,
      campaignMonth,
    ),
  );

  eventLedger.append(
    budgetChangedEvent(
      body["nationId"],
      previousTreasury,
      newTreasury,
      SafeInt.mul(budget, SafeInt(-1)),
      `Player budget for project ${body["projectId"]}`,
      nextSeq(),
      turnNumber,
    ),
  );

  return next;
}

function drawWeighted(
  stream: import("@bluewave/random").RandomStream,
  weights: [string, SafeInt][],
): string {
  const totalWeight = weights.reduce((sum, [, w]) => SafeInt.add(sum, w), SafeInt.ZERO);
  if ((totalWeight as number) <= 0) return weights[0]?.[0] ?? "";
  const draw = stream.next() * (totalWeight as number);
  let cumulative = 0;
  for (const [id, weight] of weights) {
    cumulative += weight as number;
    if (draw <= cumulative) return id;
  }
  return weights[weights.length - 1]?.[0] ?? "";
}

const RESEARCH_RESOURCE_CONVERSION_BP = SafeInt(10_000);
const CANONICAL_FIELD_IDS = RESEARCH_FIELD_IDS;

function computeResearchResources(actualPaidExpenditure: SafeInt): SafeInt {
  if ((actualPaidExpenditure as number) <= 0) return SafeInt.ZERO;
  return SafeInt.div(
    SafeInt.mul(actualPaidExpenditure, RESEARCH_RESOURCE_CONVERSION_BP),
    SafeInt(10_000),
    "floor",
  );
}

function largestRemainderAllocation(
  resources: SafeInt,
  weights: [string, SafeInt][],
): Map<string, SafeInt> {
  const allocation = new Map<string, SafeInt>();
  if ((resources as number) <= 0 || weights.length === 0) return allocation;

  const totalWeight = weights.reduce((sum, [, w]) => SafeInt.add(sum, w), SafeInt.ZERO);
  if ((totalWeight as number) <= 0) return allocation;

  // Proportional allocation with floor
  let allocated = SafeInt.ZERO;
  const remainders: [string, number][] = [];

  for (const [fieldId, weight] of weights) {
    const rawProportion = (weight as number) / (totalWeight as number);
    const floorShare = SafeInt(Math.floor(rawProportion * (resources as number)));
    allocation.set(fieldId, floorShare);
    allocated = SafeInt.add(allocated, floorShare);
    const remainder = rawProportion * (resources as number) - (floorShare as number);
    remainders.push([fieldId, remainder]);
  }

  // Distribute remaining by largest remainder
  let remaining = SafeInt.sub(resources, allocated);
  remainders.sort((a, b) => b[1] - a[1]);

  for (const [fieldId] of remainders) {
    if ((remaining as number) <= 0) break;
    const current = allocation.get(fieldId) ?? SafeInt.ZERO;
    allocation.set(fieldId, SafeInt.add(current, SafeInt.ONE));
    remaining = SafeInt.sub(remaining, SafeInt.ONE);
  }

  return allocation;
}

function resolveResearchPhase(
  snapshot: CampaignSnapshot,
  randomSeed: string,
  turnNumber: SafeInt,
  randomLedger: RandomLedger,
  eventLedger: EventLedger,
  financialLedger: FinancialLedger,
  collector: DiagnosticCollector,
  nextSeq: () => SafeInt,
  campaignMonth: string,
): CampaignSnapshot {
  let currentSnapshot = snapshot;

  for (const [nationId, nation] of currentSnapshot["nations"]) {
    if (!nation["isPlayable"] && !nation["isAI"]) continue;

    const research = nation["research"];

    // Stage 1: Calculate paid research resources
    const actualPaidExpenditure = research["researchBudget"];
    const effectiveResources = computeResearchResources(actualPaidExpenditure);

    if ((effectiveResources as number) <= 0) continue;

    // Stage 2: Allocate by field priority
    const priorities = research["fieldPriorities"];
    const eligibleFields: [string, SafeInt][] = [];

    const techs = research["technologies"];
    const discoveredTechs = research["discoveredTechs"];

    for (const fieldId of CANONICAL_FIELD_IDS) {
      // Find eligible tech for this field
      const eligibleTech = findEligibleTech(fieldId, techs, discoveredTechs, turnNumber);
      if (!eligibleTech) continue;

      const priority = priorities[fieldId] ?? SafeInt(1);
      if ((priority as number) <= 0) continue;

      eligibleFields.push([fieldId, priority]);
    }

    if (eligibleFields.length === 0) {
      collector.addInfo(
        "NO_ELIGIBLE_RESEARCH_FIELD",
        `Nation ${nationId} has no eligible research fields`,
        { stage: "resolve_research" },
      );
      continue;
    }

    const fieldAllocations = largestRemainderAllocation(effectiveResources, eligibleFields);

    // Stage 3: Advance eligible technologies
    const activeCandidates = new Map(research["activeCandidates"]);
    const updatedTechs = [...techs];
    const monthDiscoveredTechs = new Set(research["discoveredTechs"]);

    for (const [fieldId, allocation] of fieldAllocations) {
      if ((allocation as number) <= 0) continue;

      let activeTechId = activeCandidates.get(fieldId);

      if (!activeTechId) {
        // Select eligible technology with highest discovery weight
        const fieldTechs = findEligibleTechsForField(
          fieldId,
          updatedTechs,
          [...monthDiscoveredTechs],
          turnNumber,
        );
        if (fieldTechs.length === 0) {
          collector.addInfo(
            "NO_ELIGIBLE_TECHNOLOGY",
            `Nation ${nationId} field ${fieldId} has no eligible technology`,
            { stage: "resolve_research" },
          );
          continue;
        }

        // Deterministic weighted selection keyed by research/month/{nation}/{field}
        const stream = new RandomEngine(randomSeed).stream(`research/month/${nationId}/${fieldId}`);
        const weights: [string, SafeInt][] = fieldTechs.map(
          (t) =>
            [
              t.techId,
              applyHistoricalTimingModifier(
                t.discoveryWeight ?? SafeInt(1),
                t.availabilityMonth,
                turnNumber,
              ),
            ] as [string, SafeInt],
        );

        // Record this selection in the random ledger
        const inputHash = sha256Hex(
          canonicalSerialize({
            nationId,
            fieldId,
            turnNumber,
            eligibleTechs: fieldTechs.map((t) => t.techId),
          }),
        );

        activeTechId = drawWeighted(stream, weights);

        randomLedger.record({
          streamId: `research/month/${nationId}/${fieldId}`,
          entityKey: `${nationId}:${fieldId}`,
          phase: "resolve_research",
          rulesetVersion: CURRENT_VERSION,
          inputHash,
          draw: 0,
          outcome: `selected_tech_${activeTechId}`,
          reasonCode: "RESEARCH_SELECT_CANDIDATE",
        });

        activeCandidates.set(fieldId, activeTechId);
      }

      // Stage 4: Add progress to active candidate
      const techIdx = updatedTechs.findIndex((t) => t["techId"] === activeTechId);
      if (techIdx < 0) continue;

      const tech = updatedTechs[techIdx]!;
      const newPoints = SafeInt.add(tech["investedPoints"], allocation);
      updatedTechs[techIdx] = { ...tech, investedPoints: newPoints };

      // Calculate progress beyond cost
      const cost = findTechCost(activeTechId);
      const clampedPoints = (newPoints as number) > (cost as number) ? cost : newPoints;
      updatedTechs[techIdx] = { ...updatedTechs[techIdx]!, investedPoints: clampedPoints };

      eventLedger.append(
        researchProgressedEvent(
          nationId,
          activeTechId,
          tech["investedPoints"],
          clampedPoints,
          nextSeq(),
          turnNumber,
        ),
      );

      // Stage 5: Check if discovered
      if ((clampedPoints as number) >= (cost as number)) {
        // Stage 7: revalidate prerequisites and availability before discovery.
        const revalidated = findEligibleTechsForField(
          fieldId,
          updatedTechs,
          [...monthDiscoveredTechs],
          turnNumber,
        ).some((t) => t.techId === activeTechId);
        if (!revalidated) {
          collector.addError(
            "TECHNOLOGY_DISCOVERY_VALIDATION_FAILED",
            `Discovery validation failed for ${activeTechId} (nation ${nationId})`,
            { stage: "resolve_research" },
          );
          continue;
        }

        // Mark as completed
        updatedTechs[techIdx] = {
          ...updatedTechs[techIdx]!,
          completed: true,
          investedPoints: cost,
        };
        monthDiscoveredTechs.add(activeTechId);

        // Remove from active candidates
        activeCandidates.delete(fieldId);

        // Apply IMMEDIATE_KNOWLEDGE effects (only immediate-knowledge effects
        // for B10b; adoption/production/refit branches are deferred).
        eventLedger.append({
          eventId: `TechnologyDiscovered-${nationId}-${activeTechId}-${String(nextSeq())}`,
          version: CURRENT_VERSION,
          aggregateType: "research" as const,
          aggregateId: activeTechId,
          eventType: "TechnologyDiscovered" as const,
          timestamp: campaignMonth,
          body: {
            kind: "TechnologyDiscovered" as const,
            nationId,
            techId: activeTechId,
            researchFieldId: fieldId,
            discoveryMonth: campaignMonth,
            cost,
          },
          sequenceNumber: nextSeq(),
        });
      }
    }

    const updatedNation: NationState = {
      ...nation,
      research: {
        ...research,
        technologies: updatedTechs,
        activeCandidates,
        discoveredTechs: [...monthDiscoveredTechs],
        researchBudget: SafeInt.ZERO,
      },
    };

    const updatedNations = new Map(currentSnapshot["nations"]);
    updatedNations.set(nationId, updatedNation);
    currentSnapshot = { ...currentSnapshot, nations: updatedNations };

    // Record financial expenditure
    const previousBalance = nation["treasury"];
    const newBalance = SafeInt.sub(previousBalance, actualPaidExpenditure);
    const safeNewBalance = newBalance < SafeInt.ZERO ? SafeInt.ZERO : newBalance;

    const updatedTreasuryNation: NationState = {
      ...updatedNation,
      treasury: safeNewBalance,
    };
    const updatedTreasuryNations = new Map(currentSnapshot["nations"]);
    updatedTreasuryNations.set(nationId, updatedTreasuryNation);
    currentSnapshot = { ...currentSnapshot, nations: updatedTreasuryNations };

    financialLedger.append(
      makeLedgerEntry(
        nationId,
        "resolve_research",
        "RESEARCH_EXPENDITURE",
        actualPaidExpenditure,
        actualPaidExpenditure,
        previousBalance,
        safeNewBalance,
        "Research budget expenditure",
        campaignMonth,
      ),
    );

    if ((actualPaidExpenditure as number) > 0) {
      eventLedger.append(
        budgetChangedEvent(
          nationId,
          previousBalance,
          safeNewBalance,
          SafeInt.mul(actualPaidExpenditure, SafeInt(-1)),
          "Research budget expenditure",
          nextSeq(),
          turnNumber,
        ),
      );
    }
  }

  return currentSnapshot;
}

/**
 * DESIGN-20 §12.2 historical timing modifier. The modifier is applied to a
 * candidate's base discovery weight based on how far the current month is from
 * the technology's canonical historical availability. The final campaign
 * availability month (availabilityMonth) remains a hard eligibility boundary
 * enforced in findEligibleTechsForField; the modifier only distinguishes by
 * how many months past availability a technology is.
 *
 * Shipped basis points: 5_000 (25-60 months before), 8_000 (1-24 months
 * before), 10_000 (canonical through 60 months after), 12_500 (60+ months
 * after). Months before availability are ineligible in this codebase
 * (availabilityMonth is treated as the hard boundary), so pre-availability
 * bands are expressed dutyfully but are unreachable.
 */
function applyHistoricalTimingModifier(
  baseWeight: SafeInt,
  availabilityMonth: SafeInt | undefined,
  turnNumber: SafeInt,
): SafeInt {
  const monthId = turnNumber as number;
  const availabilityDate = (availabilityMonth ?? SafeInt(0)) as number;
  const monthsAfter = monthId - availabilityDate;

  let modifierBp = SafeInt(10_000);
  if (monthsAfter > 60) {
    modifierBp = SafeInt(12_500);
  } else if (monthsAfter >= 0) {
    modifierBp = SafeInt(10_000);
  } else if (monthsAfter >= -24) {
    modifierBp = SafeInt(8_000);
  } else if (monthsAfter >= -60) {
    modifierBp = SafeInt(5_000);
  }

  const adjusted = SafeInt.div(SafeInt.mul(baseWeight, modifierBp), SafeInt(10_000), "floor");
  return (adjusted as number) < 1 ? SafeInt.ONE : adjusted;
}

function findEligibleTech(
  fieldId: string,
  techs: TechnologyProgress[],
  discoveredTechs: string[],
  turnNumber: SafeInt,
): TechnologyProgress | undefined {
  return findEligibleTechsForField(fieldId, techs, discoveredTechs, turnNumber)[0] ?? undefined;
}

function findEligibleTechsForField(
  fieldId: string,
  techs: TechnologyProgress[],
  discoveredTechs: string[],
  turnNumber: SafeInt,
): (TechnologyProgress & { discoveryWeight: SafeInt; availabilityMonth?: SafeInt })[] {
  const allDiscovered = new Set(discoveredTechs);
  return techs
    .filter((t) => {
      const def = TECH_DEFINITIONS[t["techId"]];
      if (!def) return false;
      if (def["researchFieldId"] !== fieldId) return false;
      if (t["completed"] || allDiscovered.has(t["techId"])) return false;
      // Check if not already discovered
      // Check prerequisites
      const prereqs = def["prerequisites"] ?? [];
      for (const prereqId of prereqs) {
        const prereqTech = techs.find((pt) => pt["techId"] === prereqId);
        if (!prereqTech || !prereqTech["completed"]) return false;
      }
      // Check availability month
      if (
        def["availabilityMonth"] !== undefined &&
        (turnNumber as number) < (def["availabilityMonth"] as number)
      ) {
        return false;
      }
      return true;
    })
    .map((t) => {
      const def = TECH_DEFINITIONS[t["techId"]]!;
      return {
        ...t,
        discoveryWeight: def["discoveryWeight"],
        availabilityMonth: def["availabilityMonth"],
      };
    });
}

interface TechDefinition {
  techId: string;
  researchFieldId: string;
  cost: SafeInt;
  discoveryWeight: SafeInt;
  prerequisites: string[];
  availabilityMonth?: SafeInt;
}

const TECH_DEFINITIONS: Record<string, TechDefinition> = {
  basic_hull: {
    techId: "basic_hull",
    researchFieldId: "HULL_CONSTRUCTION",
    cost: SafeInt(100),
    discoveryWeight: SafeInt(10),
    prerequisites: [],
    availabilityMonth: SafeInt(0),
  },
  advanced_hull: {
    techId: "advanced_hull",
    researchFieldId: "HULL_CONSTRUCTION",
    cost: SafeInt(200),
    discoveryWeight: SafeInt(8),
    prerequisites: ["basic_hull"],
    availabilityMonth: SafeInt(0),
  },
  basic_steam: {
    techId: "basic_steam",
    researchFieldId: "MACHINERY",
    cost: SafeInt(100),
    discoveryWeight: SafeInt(10),
    prerequisites: [],
    availabilityMonth: SafeInt(0),
  },
  advanced_steam: {
    techId: "advanced_steam",
    researchFieldId: "MACHINERY",
    cost: SafeInt(200),
    discoveryWeight: SafeInt(8),
    prerequisites: ["basic_steam"],
    availabilityMonth: SafeInt(0),
  },
  basic_gunnery: {
    techId: "basic_gunnery",
    researchFieldId: "GUNNERY",
    cost: SafeInt(100),
    discoveryWeight: SafeInt(10),
    prerequisites: [],
    availabilityMonth: SafeInt(0),
  },
  advanced_gunnery: {
    techId: "advanced_gunnery",
    researchFieldId: "GUNNERY",
    cost: SafeInt(200),
    discoveryWeight: SafeInt(8),
    prerequisites: ["basic_gunnery"],
    availabilityMonth: SafeInt(0),
  },
};

function findTechCost(techId: string): SafeInt {
  return TECH_DEFINITIONS[techId]?.["cost"] ?? SafeInt(100);
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("\u0000");
}

function getPairRelation(snapshot: CampaignSnapshot, a: string, b: string) {
  const key = pairKey(a, b);
  return (
    snapshot["politics"]["relations"].find((r) => pairKey(r["nationA"], r["nationB"]) === key) ??
    null
  );
}

function updateRelation(
  snapshot: CampaignSnapshot,
  a: string,
  b: string,
  patch: Partial<{
    relation: "neutral" | "allied" | "at_war" | "trade_agreement";
    tension: number;
    nap: boolean;
  }>,
): CampaignSnapshot {
  const key = pairKey(a, b);
  const relations = snapshot["politics"]["relations"].map((r) =>
    pairKey(r["nationA"], r["nationB"]) === key
      ? {
          ...r,
          ...patch,
          relation: patch["relation"] ?? r["relation"],
        }
      : r,
  );
  return {
    ...snapshot,
    politics: { ...snapshot["politics"], relations },
  };
}

function applyDeclareWar(
  snapshot: CampaignSnapshot,
  body: DeclareWarCommand,
  campaignMonth: string,
): CampaignSnapshot {
  const declarer = body["nationId"];
  const target = body["targetNationId"];
  const warId = `war_${declarer}_${target}_${campaignMonth}`;
  const attackerSideId = `side_${declarer}`;
  const defenderSideId = `side_${target}`;

  // Non-aggression pact violation: deduct penalty from the violator's treasury.
  const pair = getPairRelation(snapshot, declarer, target);
  let napPenaltyNations = snapshot["nations"];
  if (pair && pair["nap"]) {
    const current = snapshot["nations"].get(declarer);
    if (current) {
      const penalty = NAP_VIOLATION_PENALTY as number;
      const newTreasury = Math.max(0, (current["treasury"] as number) - penalty);
      const updatedNation: NationState = { ...current, treasury: SafeInt(newTreasury) };
      napPenaltyNations = new Map(snapshot["nations"]);
      napPenaltyNations.set(declarer, updatedNation);
    }
  }

  const war: WarDeclaration = {
    id: warId,
    attackerSideId,
    defenderSideId,
    attackerSideMembers: [declarer],
    defenderSideMembers: [target],
    attackerWarScore: 0,
    defenderWarScore: 0,
    attackerId: declarer,
    defenderId: target,
    startDate: campaignMonth,
    status: "DECLARED_NOT_ACTIVE",
  };

  const attackerMembership: WarParticipantMembership = {
    warId,
    nationId: declarer,
    sideId: attackerSideId,
    entryMonth: campaignMonth,
    status: "ACTIVE",
    nationalContributionPoints: 0,
  };
  const defenderMembership: WarParticipantMembership = {
    warId,
    nationId: target,
    sideId: defenderSideId,
    entryMonth: campaignMonth,
    status: "ACTIVE",
    nationalContributionPoints: 0,
  };

  let baseSnapshot = { ...snapshot, nations: napPenaltyNations };

  let next = {
    ...baseSnapshot,
    wars: {
      ...baseSnapshot["wars"],
      wars: [...baseSnapshot["wars"]["wars"], war],
      participantMemberships: [
        ...baseSnapshot["wars"]["participantMemberships"],
        attackerMembership,
        defenderMembership,
      ],
    },
  };

  next = updateRelation(next, declarer, target, {
    relation: "at_war",
    tension: TENSION_WAR,
    nap: false,
  });

  return next;
}

function applyAcceptPeace(
  snapshot: CampaignSnapshot,
  body: AcceptPeaceCommand,
  campaignMonth: string,
): CampaignSnapshot {
  const war = snapshot["wars"]["wars"].find((w) => w["id"] === body["warId"]);
  if (!war) return snapshot;

  const wars = snapshot["wars"]["wars"].map((w) =>
    w["id"] === war["id"] ? { ...w, status: "ENDED" as const, endDate: campaignMonth } : w,
  );

  const participantMemberships = snapshot["wars"]["participantMemberships"].map((m) =>
    m["warId"] === war["id"] && m["status"] === "ACTIVE"
      ? { ...m, status: "EXITED" as const, exitMonth: campaignMonth }
      : m,
  );

  let next = {
    ...snapshot,
    wars: { ...snapshot["wars"], wars, participantMemberships },
  };

  next = updateRelation(next, war["attackerId"], war["defenderId"], {
    relation: "neutral",
    tension: TENSION_PEACE,
    nap: false,
  });

  return next;
}

function applySetRelation(
  snapshot: CampaignSnapshot,
  nationId: string,
  partnerNationId: string,
  relation: "allied" | "neutral",
  tension: number,
): CampaignSnapshot {
  return updateRelation(snapshot, nationId, partnerNationId, { relation, tension });
}

function applySetNap(
  snapshot: CampaignSnapshot,
  nationId: string,
  partnerNationId: string,
  nap: boolean,
): CampaignSnapshot {
  return updateRelation(snapshot, nationId, partnerNationId, { nap, tension: TENSION_PEACE });
}

export function resolveShipStrength(snapshot: CampaignSnapshot, shipId: string): number {
  for (const [, nation] of snapshot["nations"]) {
    for (const fleet of nation["fleets"]) {
      const ship = fleet["ships"].find((s) => s["id"] === shipId);
      if (ship) return ship["firepower"] as number;
    }
  }
  return 0;
}

function divisionAssetsFor(
  snapshot: CampaignSnapshot,
  nationId: string,
  shipIds: string[],
): NonNullable<Parameters<typeof assertDivisionInvariants>[1]> {
  const nation = snapshot["nations"].get(nationId);
  if (!nation) return [];
  const all = nation["fleets"].flatMap((f) => f["ships"]);
  const byId = new Map(all.map((s) => [s["id"], s]));
  const assets: DivisionAssetView[] = [];
  for (const id of shipIds) {
    const s = byId.get(id);
    if (!s) continue;
    let shipType = "BB" as CanonicalShipType;
    const design = snapshot["designs"].get(s["designVersionId"]);
    if (design) {
      try {
        shipType = classifyShip(design);
      } catch {
        shipType = "BB" as CanonicalShipType;
      }
    }
    assets.push({
      shipId: id,
      shipType,
      locationAreaId: s["locationAreaId"],
      isUnderConstruction: s["isUnderConstruction"],
    });
  }
  return assets;
}

function applyDivisionCommandMonth(
  snapshot: CampaignSnapshot,
  body: CommandBody,
  campaignMonth: string,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  if (body["type"] === "CreateDivision") {
    const cb = body as CreateDivisionCommand;
    const nation = snapshot["nations"].get(cb["nationId"]);
    if (!nation) {
      collector.addError("NATION_NOT_FOUND", `Nation ${cb["nationId"]} not found`, {
        stage: "command-collection",
      });
      return snapshot;
    }
    if (nation["divisions"].some((d) => d["divisionId"] === cb["divisionId"])) {
      collector.addError(
        DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE,
        `Duplicate division ${cb["divisionId"]}`,
        {
          stage: "command-collection",
        },
      );
      return snapshot;
    }
    const assets = divisionAssetsFor(snapshot, cb["nationId"], cb["shipOrder"]);
    if (assets.length !== cb["shipOrder"].length) {
      collector.addError(DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE, "One or more ships not found", {
        stage: "command-collection",
      });
      return snapshot;
    }
    const division: PermanentDivision = {
      divisionId: cb["divisionId"],
      nationId: cb["nationId"],
      shipOrder: [...cb["shipOrder"]],
      flagshipShipId: cb["shipOrder"][0]!,
      commanderOfficerId: VACANT,
      divisionRole: cb["divisionRole"] as PermanentDivision["divisionRole"],
      preferredFormation: cb["preferredFormation"] as PermanentDivision["preferredFormation"],
      experience: SafeInt(INITIAL_DIVISION_EXPERIENCE),
      cohesion: SafeInt(INITIAL_DIVISION_COHESION),
      locationAreaId:
        nation["fleets"].find((f) => f["ships"].some((s) => s["id"] === cb["shipOrder"][0]))?.[
          "locationAreaId"
        ] ?? "",
      creationMonth: campaignMonth,
      lastReorganizationMonth: campaignMonth,
      provenanceRefs: [],
      rulesetVersion: snapshot["rulesetVersion"],
      aggregateHash: "",
    };
    try {
      assertDivisionInvariants(division, assets, {});
    } catch (e) {
      collector.addError(
        DIVISION_STATE_INVARIANT_FAILED,
        `Division invariant failed: ${(e as Error).message}`,
        {
          stage: "command-collection",
        },
      );
      return snapshot;
    }
    const updated = applyDivisionCommand(
      division,
      { type: "create", shipId: cb["shipOrder"][0]!, creationMonth: campaignMonth },
      campaignMonth,
    );
    const nations = new Map(snapshot["nations"]);
    const nationNext = { ...nation, divisions: [...nation["divisions"], updated.division] };
    nations.set(cb["nationId"], nationNext);
    return { ...snapshot, nations };
  }

  if (
    body["type"] === "AddShipToDivision" ||
    body["type"] === "RemoveShipFromDivision" ||
    body["type"] === "ChangeDivisionFlagship" ||
    body["type"] === "DissolveDivision"
  ) {
    const cb = body as
      | AddShipToDivisionCommand
      | RemoveShipFromDivisionCommand
      | ChangeDivisionFlagshipCommand
      | DissolveDivisionCommand;
    const nation = snapshot["nations"].get(cb["nationId"]);
    if (!nation) {
      collector.addError("NATION_NOT_FOUND", `Nation ${cb["nationId"]} not found`, {
        stage: "command-collection",
      });
      return snapshot;
    }
    const idx = nation["divisions"].findIndex((d) => d["divisionId"] === cb["divisionId"]);
    if (idx === -1) {
      collector.addError(
        DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE,
        `Division ${cb["divisionId"]} not found`,
        {
          stage: "command-collection",
        },
      );
      return snapshot;
    }
    const division = nation["divisions"][idx]!;
    let updated: { division: PermanentDivision };
    try {
      let op:
        | { type: "remove_ship"; shipId: string }
        | { type: "add_ship"; shipId: string }
        | { type: "change_flagship"; newFlagshipShipId: string }
        | { type: "dissolve" };
      if (body["type"] === "AddShipToDivision")
        op = { type: "add_ship", shipId: (body as AddShipToDivisionCommand)["shipId"] };
      else if (body["type"] === "RemoveShipFromDivision")
        op = { type: "remove_ship", shipId: (body as RemoveShipFromDivisionCommand)["shipId"] };
      else if (body["type"] === "ChangeDivisionFlagship")
        op = {
          type: "change_flagship",
          newFlagshipShipId: (body as ChangeDivisionFlagshipCommand)["newFlagshipShipId"],
        };
      else op = { type: "dissolve" };
      updated = applyDivisionCommand(division, op, campaignMonth);
    } catch (e) {
      collector.addError(
        DIVISION_STATE_INVARIANT_FAILED,
        `Division command failed: ${(e as Error).message}`,
        {
          stage: "command-collection",
        },
      );
      return snapshot;
    }
    let divisions = [...nation["divisions"]];
    if (body["type"] === "DissolveDivision") divisions.splice(idx, 1);
    else divisions[idx] = updated.division;
    const nations = new Map(snapshot["nations"]);
    const nationNext = { ...nation, divisions };
    nations.set(cb["nationId"], nationNext);
    return { ...snapshot, nations };
  }

  return snapshot;
}

function applyDeclareBlockade(
  snapshot: CampaignSnapshot,
  body: DeclareBlockadeCommand,
  campaignMonth: string,
): CampaignSnapshot {
  const blockade: BlockadeState = {
    blockaderId: body["nationId"],
    blockadedNationId: body["targetNationId"],
    areaId: body["areaId"],
    establishedMonth: campaignMonth,
  };
  return {
    ...snapshot,
    wars: {
      ...snapshot["wars"],
      blockadeState: [...snapshot["wars"]["blockadeState"], blockade],
    },
  };
}

function resolveDiplomacyPhase(
  snapshot: CampaignSnapshot,
  campaignMonth: string,
): CampaignSnapshot {
  let wars = snapshot["wars"]["wars"];
  let changed = false;

  const atWarWars = new Set(wars.filter((w) => w["status"] !== "ENDED").map((w) => w["id"]));

  for (const blockade of snapshot["wars"]["blockadeState"]) {
    if (blockade["establishedMonth"] > campaignMonth) continue;
    const war = wars.find(
      (w) =>
        atWarWars.has(w["id"]) &&
        (w["status"] === "ACTIVE" || w["status"] === "DECLARED_NOT_ACTIVE") &&
        w["attackerSideMembers"].includes(blockade["blockaderId"]),
    );
    if (!war) continue;
    const side = war["attackerSideMembers"].includes(blockade["blockaderId"])
      ? "attacker"
      : "defender";
    const gain = BLOCKADE_WAR_SCORE_PER_MONTH as number;
    const increment = (current: number) => Math.max(-100, Math.min(100, current + gain));
    const updated =
      side === "attacker"
        ? { ...war, attackerWarScore: increment(war["attackerWarScore"] as number) }
        : { ...war, defenderWarScore: increment(war["defenderWarScore"] as number) };
    wars = wars.map((w) => (w["id"] === war["id"] ? updated : w));
    changed = true;
  }

  if (!changed) return snapshot;
  return { ...snapshot, wars: { ...snapshot["wars"], wars } };
}

function applyBattleResult(
  snapshot: CampaignSnapshot,
  battle: {
    attackerId: string;
    defenderId: string;
    attackerFleetIds: string[];
    defenderFleetIds: string[];
  },
  result: { winnerId: string; loserId: string; damageReport: Record<string, SafeInt> },
  campaignMonth: string,
  _collector: DiagnosticCollector,
): CampaignSnapshot {
  let wars = snapshot["wars"]["wars"];
  let participantMemberships = snapshot["wars"]["participantMemberships"];

  // Find and promote the involved war.
  const warIdx = wars.findIndex(
    (w) =>
      (w["attackerId"] === battle["attackerId"] && w["defenderId"] === battle["defenderId"]) ||
      (w["attackerId"] === battle["defenderId"] && w["defenderId"] === battle["attackerId"]),
  );

  if (warIdx === -1) return snapshot;

  let war = wars[warIdx]!;
  if (war["status"] === "DECLARED_NOT_ACTIVE") {
    war = { ...war, status: "ACTIVE" as const };
  }

  // Alliance / mutual-defense auto-entry for defender & attacker sides.
  let attackerSideMembers = [...war["attackerSideMembers"]];
  let defenderSideMembers = [...war["defenderSideMembers"]];

  for (const [sideNationId, sideMembers, targetMembers] of [
    [battle["defenderId"], defenderSideMembers, attackerSideMembers] as const,
    [battle["attackerId"], attackerSideMembers, defenderSideMembers] as const,
  ]) {
    void sideNationId;
    for (const memberNationId of sideMembers) {
      const allies = snapshot["politics"]["relations"]
        .filter(
          (r) =>
            (r["nationA"] === memberNationId || r["nationB"] === memberNationId) &&
            r["relation"] === "allied",
        )
        .map((r) => (r["nationA"] === memberNationId ? r["nationB"] : r["nationA"]));
      for (const ally of allies) {
        if (targetMembers.includes(ally) || sideMembers.includes(ally)) continue;
        if (sideMembers.length + targetMembers.length >= MAXIMUM_CONCURRENT_WARS * 2) continue;
        if (countActiveWarsFor(snapshot, ally) >= MAXIMUM_CONCURRENT_WARS) continue;
        // add to the current side
        const warId = war["id"];
        if (sideMembers === defenderSideMembers) {
          defenderSideMembers = [...defenderSideMembers, ally];
        } else {
          attackerSideMembers = [...attackerSideMembers, ally];
        }
        participantMemberships = [
          ...participantMemberships,
          {
            warId,
            nationId: ally,
            sideId:
              sideMembers === defenderSideMembers ? war["defenderSideId"] : war["attackerSideId"],
            entryMonth: campaignMonth,
            status: "ACTIVE" as const,
            nationalContributionPoints: 0,
          },
        ];
      }
    }
  }

  war = {
    ...war,
    attackerSideMembers,
    defenderSideMembers,
    status: war["status"],
  };

  // Victory classification + war score.
  const loserId = result["loserId"];
  const attackerWins = result["winnerId"] === battle["attackerId"];
  const loserIsAttacker = loserId === battle["attackerId"];
  const loserFleetIds = loserIsAttacker ? battle["attackerFleetIds"] : battle["defenderFleetIds"];
  const loserNation = snapshot["nations"].get(loserId);
  const loserShips = loserNation
    ? loserNation["fleets"]
        .filter((f) => loserFleetIds.includes(f["id"]))
        .flatMap((f) => f["ships"])
        .filter((s) => !s["isUnderConstruction"])
    : [];

  const totalHp = loserShips.reduce((sum, s) => sum + (s["hitPoints"] as number), 0);
  const lossHp = loserShips.reduce(
    (sum, s) => sum + Number(result["damageReport"][s["id"]] ?? 0),
    0,
  );
  const lossFraction = totalHp > 0 ? lossHp / totalHp : 1;

  const level =
    lossFraction >= VICTORY_MAJOR_MAX_FRACTION
      ? "decisive"
      : lossFraction >= VICTORY_MINOR_MAX_FRACTION
        ? "major"
        : "minor";
  const magnitude =
    level === "decisive"
      ? (WAR_SCORE_DECISIVE as number)
      : level === "major"
        ? (WAR_SCORE_MAJOR as number)
        : (WAR_SCORE_MINOR as number);

  const winnerSide = attackerWins ? "attacker" : "defender";
  const clamp = (v: number) => Math.max(-100, Math.min(100, v));

  const winnerScore = winnerSide === "attacker" ? war["attackerWarScore"] : war["defenderWarScore"];
  const loserScore = winnerSide === "attacker" ? war["defenderWarScore"] : war["attackerWarScore"];
  const newWinnerScore = clamp((winnerScore as number) + magnitude);
  const newLoserScore = clamp((loserScore as number) - magnitude);

  war = {
    ...war,
    attackerWarScore: winnerSide === "attacker" ? newWinnerScore : newLoserScore,
    defenderWarScore: winnerSide === "defender" ? newWinnerScore : newLoserScore,
  };

  // nationalContributionPoints for participating nations on the winning side.
  const contributionDelta = Math.floor(lossHp / 1000);
  const winnerMembers =
    winnerSide === "attacker" ? war["attackerSideMembers"] : war["defenderSideMembers"];
  if (contributionDelta > 0) {
    participantMemberships = participantMemberships.map((m) =>
      m["warId"] === war["id"] && winnerMembers.includes(m["nationId"])
        ? {
            ...m,
            nationalContributionPoints:
              (m["nationalContributionPoints"] as number) + contributionDelta,
          }
        : m,
    );
  }

  wars = wars.map((w) => (w["id"] === war["id"] ? war : w));

  let next: CampaignSnapshot = {
    ...snapshot,
    wars: { ...snapshot["wars"], wars, participantMemberships },
  };

  // Surrender auto-check.
  const attackerScore = war["attackerWarScore"] as number;
  const defenderScore = war["defenderWarScore"] as number;
  if (attackerScore >= SURRENDER_SCORE || defenderScore >= SURRENDER_SCORE) {
    next = settleWar(next, war["id"], campaignMonth);
  }

  return next;
}

function countActiveWarsFor(snapshot: CampaignSnapshot, nationId: string): number {
  return snapshot["wars"]["wars"].filter(
    (w) =>
      w["status"] !== "ENDED" &&
      (w["attackerSideMembers"].includes(nationId) || w["defenderSideMembers"].includes(nationId)),
  ).length;
}

function settleWar(
  snapshot: CampaignSnapshot,
  warId: string,
  campaignMonth: string,
): CampaignSnapshot {
  const war = snapshot["wars"]["wars"].find((w) => w["id"] === warId);
  if (!war) return snapshot;
  const wars = snapshot["wars"]["wars"].map((w) =>
    w["id"] === warId ? { ...w, status: "ENDED" as const, endDate: campaignMonth } : w,
  );
  const participantMemberships = snapshot["wars"]["participantMemberships"].map((m) =>
    m["warId"] === warId && m["status"] === "ACTIVE"
      ? { ...m, status: "EXITED" as const, exitMonth: campaignMonth }
      : m,
  );
  let next = {
    ...snapshot,
    wars: { ...snapshot["wars"], wars, participantMemberships },
  };
  next = updateRelation(next, war["attackerId"], war["defenderId"], {
    relation: "neutral",
    tension: TENSION_PEACE,
    nap: false,
  });
  return next;
}

// ---------------------------------------------------------------------------
// B-6 INC-3: battle_resolution phase helpers (AC-8/AC-9). The tactical
// auto-resolution result (@bluewave/combat resolveBattleAuto, INC-2) is
// applied to the campaign through these pure, deterministic helpers. Never
// mutate a ship in place; every transition builds a new snapshot.
// ---------------------------------------------------------------------------

/**
 * Locate the accepted battle manifest for a battle instance. The canonical
 * match is by `manifestHash` (the battle's pre-seed content hash — DESIGN-37
 * §32); a battle with a `manifestHash` for which the snapshot carries NO
 * matching manifest is a corrupted/inconsistent state and fails closed (the
 * caller records a stable diagnostic and applies NO mutation).
 */
function resolveBattleManifest(
  snapshot: CampaignSnapshot,
  battle: BattleInstance,
): AutoResolutionManifest | null {
  if (battle["manifestHash"] === undefined) return null;
  const manifests = snapshot["wars"]["battleManifests"] ?? [];
  const found = manifests.find((m) => m["manifestHash"] === battle["manifestHash"]);
  // The snapshot's manifests are produced by @bluewave/combat's generateBattles
  // (structurally identical); the cast only reconciles the campaign-side mirror
  // type with the combat manifest type at this single lookup seam.
  return found ? (found as unknown as AutoResolutionManifest) : null;
}

/**
 * Apply the tactical battle outcome to the campaign (AC-9): per-ship
 * accumulated battle hp loss (ADR-0026 damageReport mapping) applied to
 * `fleets[].ships[].hitPoints` clamped >= 0; terminal ships (in the result's
 * sunk lists OR derived hp == 0) REMOVED from their fleet; `inBattleId`
 * reservations cleared on every ship that fought (the battle's fleets).
 * Deterministic: ships iterate in fleet order (canonical id-sorted in the
 * battle generation); untouched ships keep their object identity.
 */
export function applyBattleConsequences(
  snapshot: CampaignSnapshot,
  battle: BattleInstance,
  result: Pick<BattleResolutionResult, "damageReport" | "attackerSunkIds" | "defenderSunkIds">,
): CampaignSnapshot {
  const sunkIds = new Set<string>([...result.attackerSunkIds, ...result.defenderSunkIds]);
  const battleFleetIds = new Set<string>([...battle.attackerFleetIds, ...battle.defenderFleetIds]);
  const updatedNations = new Map<string, NationState>();
  let changed = false;

  for (const [nationId, nation] of snapshot["nations"]) {
    let fleetsChanged = false;
    const fleets = nation["fleets"].map((fleet) => {
      if (!battleFleetIds.has(fleet["id"])) return fleet;
      const ships: Ship[] = [];
      let fleetChanged = false;
      for (const ship of fleet["ships"]) {
        const loss = Number(result.damageReport[ship["id"]] ?? 0);
        const newHp = Math.max(0, (ship["hitPoints"] as number) - loss);
        const isSunk = sunkIds.has(ship["id"]) || newHp <= 0;
        if (isSunk) {
          // Authoritative loss (DESIGN-37 §19/§20): the ship is gone from its
          // fleet; survivors keep their damage (readiness harm is real).
          fleetChanged = true;
          continue;
        }
        if (newHp === (ship["hitPoints"] as number) && ship["inBattleId"] === undefined) {
          ships.push(ship); // untouched
          continue;
        }
        fleetChanged = true;
        // Clear the battle reservation; hitPoints carry the clamped loss.
        const { inBattleId: _reservation, ...rest } = ship;
        ships.push({ ...rest, hitPoints: SafeInt(newHp) });
      }
      if (fleetChanged) fleetsChanged = true;
      return fleetChanged ? { ...fleet, ships } : fleet;
    });
    if (fleetsChanged) {
      changed = true;
      updatedNations.set(nationId, { ...nation, fleets });
    } else {
      updatedNations.set(nationId, nation);
    }
  }

  return changed ? { ...snapshot, nations: updatedNations } : snapshot;
}

/**
 * Map the tactical auto-resolution result onto the campaign `BattleResult`
 * shape (the shape `applyBattleResult` consumes for the DECIDED path and the
 * shape persisted on `BattleInstance.result`). Ties / time-limit battles carry
 * null winner/loser (ADR-0026 §7); sunk ids are canonical id-sorted.
 */
function toCampaignBattleResult(auto: BattleResolutionResult): BattleResult {
  return {
    winnerId: auto.winnerId,
    loserId: auto.loserId,
    attackerLosses: [...auto.attackerSunkIds].sort(),
    defenderLosses: [...auto.defenderSunkIds].sort(),
    damageReport: auto.damageReport,
    explanation: [
      `auto-resolved (${auto.battleEndReason}) after ${String(auto.elapsedMinutes)} battle minutes`,
    ],
  };
}

/** Mark a battle resolved with its recorded campaign result (battles keep
 *  their canonical snapshot order — the array is mapped in place). */
function recordResolvedBattle(
  snapshot: CampaignSnapshot,
  battle: BattleInstance,
  result: BattleResult,
): CampaignSnapshot {
  const battles = snapshot["wars"]["battles"].map((b) =>
    b["id"] === battle["id"] ? { ...b, phase: "resolved" as const, result } : b,
  );
  return { ...snapshot, wars: { ...snapshot["wars"], battles } };
}

/**
 * The M1 legacy battle-resolution path (strength-based, UNCHANGED): resolves
 * the battle via `BattleResolver`, feeds the A-3 `applyBattleResult`
 * (war score / ADR-0010 victory classification / nationalContributionPoints),
 * and records the legacy `BattleResult` with phase "resolved".
 */
function resolveLegacyBattle(
  snapshot: CampaignSnapshot,
  battle: BattleInstance,
  attacker: NationState,
  defender: NationState,
  randomEngine: import("@bluewave/random").RandomEngine,
  resolver: BattleResolver,
  campaignMonth: string,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const result = resolver.resolve(battle, attacker, defender, randomEngine);
  // The M1 BattleResolver ALWAYS decides (winner/loser non-null) — the A-3
  // war-score path keeps its exact `{ winnerId: string; loserId: string }`
  // contract; the nullable campaign BattleResult fields only carry null on the
  // auto-resolution tie/time-limit path.
  let next = applyBattleResult(
    snapshot,
    battle,
    { winnerId: result.winnerId!, loserId: result.loserId!, damageReport: result.damageReport },
    campaignMonth,
    collector,
  );
  next = recordResolvedBattle(next, battle, result);
  return next;
}

export class MonthExecutor {
  private lifecycle = new CommandLifecycle();

  execute(
    snapshot: CampaignSnapshot,
    commands: CommandEnvelope<CommandBody>[],
    randomSeed: string,
    collector: DiagnosticCollector,
    options?: StrategicWeatherPhaseOptions,
  ): MonthResult {
    const commandLedger = new CommandLedger();
    const eventLedger = new EventLedger();
    const randomLedger = new RandomLedger();
    const financialLedger = new FinancialLedger();
    let currentSnapshot = cloneSnapshot(snapshot);
    const turnNumber = snapshot["turnNumber"];
    // DESIGN-03 §2 / ADR-0025: the authoritative campaign month id is derived
    // from the snapshot's compiled start date + turn number (integer calendar
    // arithmetic only — never wall-clock/env/locale).
    const campaignMonth = campaignMonthId(
      snapshot["startYear"],
      snapshot["startMonth"],
      turnNumber as number,
    );

    let eventSeq = 0;
    function nextSeq(): SafeInt {
      const current = SafeInt(eventSeq);
      eventSeq++;
      return current;
    }

    // Phase 1: opening_validation
    {
      const ok = this.runOpeningValidation(currentSnapshot, collector);
      if (!ok) {
        return {
          finalSnapshot: currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
          success: false,
        };
      }
    }

    // Phase 1.5: weather_generation (registry order 0.5; DESIGN-42 §1 /
    // ADR-0025). Authoritative per-area current-month StrategicWeatherState
    // from the canonical default climate profile over the keyed stream
    // `campaign/weather/<areaId>/<month>`; committed into the snapshot before
    // command_collection. rngAllowed: true — the ONLY randomness is the keyed
    // stream inside generateStrategicWeather (recorded in the randomLedger).
    {
      const areas = [...currentSnapshot["world"]["areas"]].sort((a, b) =>
        a["id"] < b["id"] ? -1 : a["id"] > b["id"] ? 1 : 0,
      );
      const priorByArea = new Map(
        (currentSnapshot["strategicWeather"] ?? []).map((s) => [s["areaId"], s] as const),
      );
      const climateSource = options?.["climateProfiles"];
      const profileFor = (areaId: string): ClimateProfile | undefined =>
        climateSource === undefined ? defaultClimateProfile_v1 : climateSource.get(areaId);

      const nextWeather: CampaignWeatherState[] = [];
      for (const area of areas) {
        const profile = profileFor(area["id"]);
        if (!profile) {
          collector.addError(
            WEATHER_PROFILE_INCOMPLETE,
            `No climate profile for strategic area ${area["id"]}`,
            { stage: "weather_generation", entityId: area["id"] },
          );
          continue; // fail-closed: recorded, area simply not committed this month
        }
        try {
          nextWeather.push(
            generateStrategicWeather({
              areaId: area["id"],
              month: campaignMonth,
              climateProfile: profile,
              campaignSeed: randomSeed,
              priorState: priorByArea.get(area["id"]),
              randomLedger,
            }),
          );
        } catch (e) {
          collector.addError(
            WEATHER_PROFILE_INCOMPLETE,
            `Strategic weather generation failed for area ${area["id"]}: ${(e as Error).message}`,
            { stage: "weather_generation", entityId: area["id"] },
          );
        }
      }
      if (nextWeather.length > 0 || (currentSnapshot["strategicWeather"] ?? []).length > 0) {
        currentSnapshot = { ...currentSnapshot, strategicWeather: nextWeather };
      }
    }

    // Phase 2: monthly_revenue
    {
      for (const [nationId, nation] of currentSnapshot["nations"]) {
        if (!nation["isPlayable"] && !nation["isAI"]) continue;
        const baseResources = nation["baseResources"] ?? (0 as SafeInt);
        const rateBp = nation["navalAppropriationRateBp"] ?? (0 as SafeInt);
        const revenue = SafeInt.div(
          SafeInt.div(SafeInt.mul(baseResources, rateBp), SafeInt(10000)),
          SafeInt(12),
          "floor",
        );
        if ((revenue as number) <= 0) continue;

        const previousBalance = nation["treasury"];
        const newBalance = SafeInt.add(previousBalance, revenue);

        const updatedNation: NationState = {
          ...nation,
          treasury: newBalance,
        };
        const updatedNations = new Map(currentSnapshot["nations"]);
        updatedNations.set(nationId, updatedNation);
        currentSnapshot = { ...currentSnapshot, nations: updatedNations };

        financialLedger.append(
          makeLedgerEntry(
            nationId,
            "monthly_revenue",
            "NAVAL_APPROPRIATION",
            revenue,
            revenue,
            previousBalance,
            newBalance,
            "Monthly naval appropriation revenue",
            campaignMonth,
          ),
        );

        eventLedger.append(
          budgetChangedEvent(
            nationId,
            previousBalance,
            newBalance,
            revenue,
            "Monthly naval appropriation revenue",
            nextSeq(),
            turnNumber,
          ),
        );
      }
    }

    // Phase 3: command_collection
    {
      const slot = snapshot["slots"][0];
      if (slot) {
        for (const cmd of commands) {
          const outcome = this.lifecycle.process(cmd, snapshot, slot, new CommandIdempotencyMap());
          commandLedger.add(outcome);

          if (outcome["type"] === "success") {
            const body = cmd["body"];

            if (body["type"] === "SetResearchPriority") {
              const priorityBody = body as SetResearchPriorityCommand;
              currentSnapshot = applySetResearchPriority(
                currentSnapshot,
                priorityBody["nationId"],
                priorityBody["fieldPriorities"],
                collector,
              );
              continue;
            }

            if (body["type"] === "DeclareWar") {
              currentSnapshot = applyDeclareWar(
                currentSnapshot,
                body as DeclareWarCommand,
                campaignMonth,
              );
              continue;
            }

            if (body["type"] === "AcceptPeace") {
              currentSnapshot = applyAcceptPeace(
                currentSnapshot,
                body as AcceptPeaceCommand,
                campaignMonth,
              );
              continue;
            }

            if (body["type"] === "FormAlliance") {
              currentSnapshot = applySetRelation(
                currentSnapshot,
                (body as FormAllianceCommand)["nationId"],
                (body as FormAllianceCommand)["partnerNationId"],
                "allied",
                TENSION_ALLIANCE,
              );
              continue;
            }

            if (body["type"] === "BreakAlliance") {
              currentSnapshot = applySetRelation(
                currentSnapshot,
                (body as BreakAllianceCommand)["nationId"],
                (body as BreakAllianceCommand)["partnerNationId"],
                "neutral",
                TENSION_PEACE,
              );
              continue;
            }

            if (body["type"] === "FormNonAggressionPact") {
              currentSnapshot = applySetNap(
                currentSnapshot,
                (body as FormNonAggressionPactCommand)["nationId"],
                (body as FormNonAggressionPactCommand)["partnerNationId"],
                true,
              );
              continue;
            }

            if (body["type"] === "BreakNonAggressionPact") {
              currentSnapshot = applySetNap(
                currentSnapshot,
                (body as BreakNonAggressionPactCommand)["nationId"],
                (body as BreakNonAggressionPactCommand)["partnerNationId"],
                false,
              );
              continue;
            }

            if (body["type"] === "DeclareBlockade") {
              currentSnapshot = applyDeclareBlockade(
                currentSnapshot,
                body as DeclareBlockadeCommand,
                campaignMonth,
              );
              continue;
            }

            if (
              body["type"] === "CreateDivision" ||
              body["type"] === "AddShipToDivision" ||
              body["type"] === "RemoveShipFromDivision" ||
              body["type"] === "DissolveDivision" ||
              body["type"] === "ChangeDivisionFlagship"
            ) {
              currentSnapshot = applyDivisionCommandMonth(
                currentSnapshot,
                body as CommandBody,
                campaignMonth,
                collector,
              );
              continue;
            }

            const nation = currentSnapshot["nations"].get(body["nationId"]);
            if (!nation) {
              collector.addError("NATION_NOT_FOUND", `Nation ${body["nationId"]} not found`, {
                stage: "command-collection",
              });
              continue;
            }

            const project = nation["constructionProjects"].find(
              (p) => p["id"] === body["projectId"],
            );
            if (!project) {
              collector.addError("PROJECT_NOT_FOUND", `Project ${body["projectId"]} not found`, {
                stage: "command-collection",
              });
              continue;
            }

            currentSnapshot =
              // Apply via the shared helper (kept inline in command_collection
              // for exact parity with the AI path).
              applyBudgetProject(
                currentSnapshot,
                body as BudgetProjectCommand,
                campaignMonth,
                turnNumber,
                nextSeq,
                financialLedger,
                eventLedger,
                collector,
              );
          }
        }
      }
    }

    // Phase 3.5: ai_planning
    {
      const idempotencyMap = new CommandIdempotencyMap();
      const aiExecutor = new AiPhaseExecutor();
      const aiEngine = new RandomEngine(randomSeed);
      for (const slot of snapshot["slots"]) {
        if (slot["type"] !== "ai") continue;
        const { commands, diagnostics } = aiExecutor.run(
          slot,
          currentSnapshot,
          aiEngine,
          this.lifecycle,
          idempotencyMap,
        );
        for (const diagnostic of diagnostics) {
          collector.addError(diagnostic.code, diagnostic.message, {
            stage: diagnostic.stage ?? "ai_planning",
            entityId: diagnostic.entityId,
          });
        }
        for (const cmd of commands) {
          const body = cmd["body"];
          if (body["type"] === "SetResearchPriority") {
            const priorityBody = body as SetResearchPriorityCommand;
            currentSnapshot = applySetResearchPriority(
              currentSnapshot,
              priorityBody["nationId"],
              priorityBody["fieldPriorities"],
              collector,
            );
          } else if (body["type"] === "budget_project") {
            currentSnapshot = applyBudgetProject(
              currentSnapshot,
              body as BudgetProjectCommand,
              campaignMonth,
              turnNumber,
              nextSeq,
              financialLedger,
              eventLedger,
              collector,
            );
          }
        }
      }
    }

    // Phase 4: appropriation
    {
      for (const [nationId, nation] of currentSnapshot["nations"]) {
        if (!nation["isPlayable"] && !nation["isAI"]) continue;
        const expenseReserve = nation["expenses"];
        const available = SafeInt.sub(nation["treasury"], expenseReserve);
        if ((available as number) <= 0) continue;

        const projects = nation["constructionProjects"].filter(
          (p) =>
            (p["completedWork"] as number) < (p["totalWork"] as number) &&
            p["status"] !== "COMPLETED",
        );
        if (projects.length === 0) continue;

        const totalRemainingWork = projects.reduce(
          (sum: SafeInt, p) => SafeInt.add(sum, SafeInt.sub(p["totalWork"], p["completedWork"])),
          SafeInt.ZERO,
        );
        if ((totalRemainingWork as number) <= 0) continue;

        const constructionCap = computeConstructionCap(nation);
        let remainingFunds = available;
        let remainingCap = constructionCap;
        let updatedProjects = [...nation["constructionProjects"]];
        let totalDelta = SafeInt.ZERO;

        for (const project of projects) {
          if ((remainingCap as number) <= 0) break;

          const remainingWork = SafeInt.sub(project["totalWork"], project["completedWork"]);
          const proportion = (remainingWork as number) / (totalRemainingWork as number);
          const alloc = SafeInt(Math.floor(proportion * (available as number)));
          const cappedAlloc =
            (remainingCap as number) > 0 && alloc > remainingCap ? remainingCap : alloc;
          const clampedAlloc = cappedAlloc > remainingWork ? remainingWork : cappedAlloc;
          if ((clampedAlloc as number) <= 0) continue;

          totalDelta = SafeInt.add(totalDelta, clampedAlloc);
          remainingFunds = SafeInt.sub(remainingFunds, clampedAlloc);
          remainingCap = SafeInt.sub(remainingCap, clampedAlloc);

          updatedProjects = updatedProjects.map((p) =>
            p["id"] === project["id"]
              ? {
                  ...p,
                  completedWork: SafeInt.add(p["completedWork"], clampedAlloc),
                  paidWork: SafeInt.add(p["paidWork"], clampedAlloc),
                  status: "ACTIVE" as const,
                }
              : p,
          );
        }

        // Apply leftover funds to first incomplete project if within cap
        if ((remainingFunds as number) > 0 && (remainingCap as number) > 0) {
          const firstIncomplete = updatedProjects.find(
            (p) =>
              (p["completedWork"] as number) < (p["totalWork"] as number) &&
              p["status"] !== "COMPLETED",
          );
          if (firstIncomplete) {
            const remainingWork = SafeInt.sub(
              firstIncomplete["totalWork"],
              firstIncomplete["completedWork"],
            );
            const extra = remainingFunds > remainingWork ? remainingWork : remainingFunds;
            const cappedExtra = extra > remainingCap ? remainingCap : extra;
            if ((cappedExtra as number) > 0) {
              totalDelta = SafeInt.add(totalDelta, cappedExtra);

              updatedProjects = updatedProjects.map((p) =>
                p["id"] === firstIncomplete["id"]
                  ? {
                      ...p,
                      completedWork: SafeInt.add(p["completedWork"], cappedExtra),
                      paidWork: SafeInt.add(p["paidWork"], cappedExtra),
                      status: "ACTIVE" as const,
                    }
                  : p,
              );
            }
          }
        }

        if ((totalDelta as number) > 0) {
          const previousTreasury = nation["treasury"];
          const newTreasury = SafeInt.sub(previousTreasury, totalDelta);

          const updatedNation: NationState = {
            ...nation,
            treasury: newTreasury,
            constructionProjects: updatedProjects,
          };
          const updatedNations = new Map(currentSnapshot["nations"]);
          updatedNations.set(nationId, updatedNation);
          currentSnapshot = { ...currentSnapshot, nations: updatedNations };

          financialLedger.append(
            makeLedgerEntry(
              nationId,
              "appropriation",
              "APPROPRIATION",
              totalDelta,
              totalDelta,
              previousTreasury,
              newTreasury,
              "Proportional appropriation to construction projects",
              campaignMonth,
            ),
          );

          eventLedger.append(
            budgetChangedEvent(
              nationId,
              previousTreasury,
              newTreasury,
              SafeInt.mul(totalDelta, SafeInt(-1)),
              "Proportional appropriation to construction projects",
              nextSeq(),
              turnNumber,
            ),
          );
        }
      }
    }

    // Phase 5: maintenance
    {
      for (const [nationId, nation] of currentSnapshot["nations"]) {
        if (!nation["isPlayable"] && !nation["isAI"]) continue;

        let totalMaintenance = SafeInt.ZERO;
        for (const fleet of nation["fleets"]) {
          for (const ship of fleet["ships"]) {
            totalMaintenance = SafeInt.add(totalMaintenance, computeMaintenanceCost(ship));
          }
        }

        if ((totalMaintenance as number) <= 0) continue;

        const previousTreasury = nation["treasury"];
        const newTreasury = SafeInt.sub(previousTreasury, totalMaintenance);
        const actualNew = newTreasury < (0 as SafeInt) ? (0 as SafeInt) : newTreasury;

        const updatedNation: NationState = {
          ...nation,
          treasury: actualNew,
          maintenanceCost: totalMaintenance,
        };
        const updatedNations = new Map(currentSnapshot["nations"]);
        updatedNations.set(nationId, updatedNation);
        currentSnapshot = { ...currentSnapshot, nations: updatedNations };

        financialLedger.append(
          makeLedgerEntry(
            nationId,
            "maintenance",
            "MAINTENANCE_EXPENDITURE",
            totalMaintenance,
            totalMaintenance,
            previousTreasury,
            actualNew,
            "Monthly ship maintenance costs",
            campaignMonth,
          ),
        );

        eventLedger.append(
          budgetChangedEvent(
            nationId,
            previousTreasury,
            actualNew,
            SafeInt.mul(totalMaintenance, SafeInt(-1)),
            "Monthly ship maintenance costs",
            nextSeq(),
            turnNumber,
          ),
        );
      }
    }

    // Phase 6: obligation
    {
      for (const [nationId, nation] of currentSnapshot["nations"]) {
        if (!nation["isPlayable"] && !nation["isAI"]) continue;
        const expense = nation["expenses"];
        const previousTreasury = nation["treasury"];
        const newTreasury = SafeInt.sub(previousTreasury, expense);
        const actualNew = newTreasury < (0 as SafeInt) ? (0 as SafeInt) : newTreasury;

        if ((newTreasury as number) < 0) {
          collector.addError(
            "NEGATIVE_TREASURY_OBLIGATION",
            `Nation ${nationId} would have negative treasury after obligation`,
            { stage: "obligation" },
          );
        }

        const updatedNation: NationState = {
          ...nation,
          treasury: actualNew,
        };
        const updatedNations = new Map(currentSnapshot["nations"]);
        updatedNations.set(nationId, updatedNation);
        currentSnapshot = { ...currentSnapshot, nations: updatedNations };

        financialLedger.append(
          makeLedgerEntry(
            nationId,
            "obligation",
            "OBLIGATION",
            expense,
            expense,
            previousTreasury,
            actualNew,
            "Mandatory fixed expenses",
            campaignMonth,
          ),
        );

        eventLedger.append(
          budgetChangedEvent(
            nationId,
            previousTreasury,
            actualNew,
            SafeInt.mul(expense, SafeInt(-1)),
            "Mandatory fixed expenses",
            nextSeq(),
            turnNumber,
          ),
        );
      }
    }

    // Phase 7: construction_processing
    {
      for (const [nationId, nation] of currentSnapshot["nations"]) {
        if (!nation["isPlayable"] && !nation["isAI"]) continue;

        let updatedProjects = [...nation["constructionProjects"]];
        let updatedFleets = [...nation["fleets"]];
        let hasChanges = false;

        for (const project of nation["constructionProjects"]) {
          if ((project["completedWork"] as number) > (project["totalWork"] as number)) {
            collector.addError(
              "CONSTRUCTION_OVERFLOW",
              `Project ${project["id"]} completedWork exceeds totalWork`,
              { stage: "construction-processing" },
            );
          }

          const clampedWork =
            project["completedWork"] > project["totalWork"]
              ? project["totalWork"]
              : project["completedWork"];

          if ((clampedWork as number) !== (project["completedWork"] as number)) {
            updatedProjects = updatedProjects.map((p) =>
              p["id"] === project["id"] ? { ...p, completedWork: clampedWork } : p,
            );
            hasChanges = true;
          }

          // Check for completion
          if (
            project["status"] !== "COMPLETED" &&
            (clampedWork as number) >= (project["totalWork"] as number) &&
            (project["totalWork"] as number) > 0
          ) {
            updatedProjects = updatedProjects.map((p) =>
              p["id"] === project["id"]
                ? { ...p, status: "COMPLETED" as const, completedWork: project["totalWork"] }
                : p,
            );
            hasChanges = true;

            // Find or create a fleet for this nation
            let fleet = updatedFleets.find((f) => f["nationId"] === nationId);
            if (!fleet) {
              const newFleet: FleetState = {
                id: `fleet-${nationId}`,
                nationId,
                name: `${nation["name"]} Fleet`,
                ships: [],
                locationAreaId: "unknown",
              };
              updatedFleets = [...updatedFleets, newFleet];
              fleet = newFleet;
            }

            // Create a new ship from the completed project
            const designVersionId = project["designVersionId"] ?? "";
            let shipHitPoints = SafeInt(100) as SafeInt;
            let shipMaxHitPoints = SafeInt(100) as SafeInt;
            let shipSpeed = SafeInt(10) as SafeInt;
            let shipFirepower = SafeInt(10) as SafeInt;
            let shipArmor = SafeInt(10) as SafeInt;
            let shipClassName = project["targetId"];

            if (designVersionId) {
              const design = currentSnapshot["designs"]?.get(designVersionId);
              if (design) {
                shipHitPoints = design["hitPoints"];
                shipMaxHitPoints = design["hitPoints"];
                shipSpeed = design["normalizedSpeedUms"];
                shipFirepower = SafeInt.mul(
                  design["mainGunsCount"],
                  SafeInt.div(design["mainGunsCaliber"], SafeInt(100), "floor"),
                );
                shipArmor = design["normalizedArmorUm"];
                shipClassName = design["className"];
              }
            }

            const newShip: Ship = {
              id: `ship-${project["targetId"]}-${String(turnNumber)}`,
              name: `Ship ${shipClassName}`,
              classId: shipClassName,
              nationId,
              locationAreaId: fleet["locationAreaId"],
              designVersionId,
              hitPoints: shipHitPoints,
              maxHitPoints: shipMaxHitPoints,
              speed: shipSpeed,
              firepower: shipFirepower,
              armor: shipArmor,
              isUnderConstruction: false,
              constructionProgress: project["totalWork"],
              constructionTotalWork: project["totalWork"],
            };

            updatedFleets = updatedFleets.map((f) =>
              f["id"] === fleet["id"] ? { ...f, ships: [...f["ships"], newShip] } : f,
            );
          }

          eventLedger.append(
            constructionProgressedEvent(
              project["id"],
              nationId,
              project["completedWork"],
              clampedWork,
              SafeInt.sub(clampedWork, project["completedWork"]),
              nextSeq(),
              turnNumber,
            ),
          );
        }

        if (hasChanges) {
          const updatedNation: NationState = {
            ...nation,
            constructionProjects: updatedProjects,
            fleets: updatedFleets,
          };
          const updatedNations = new Map(currentSnapshot["nations"]);
          updatedNations.set(nationId, updatedNation);
          currentSnapshot = { ...currentSnapshot, nations: updatedNations };
        }
      }
    }

    // Phase 8: resolve_diplomacy
    {
      currentSnapshot = resolveDiplomacyPhase(currentSnapshot, campaignMonth);
    }

    // Phase 9: resolve_research
    {
      currentSnapshot = resolveResearchPhase(
        currentSnapshot,
        randomSeed,
        turnNumber,
        randomLedger,
        eventLedger,
        financialLedger,
        collector,
        nextSeq,
        campaignMonth,
      );
    }

    // Phase 9.5: battle_generation (order 7.5). Generates BattleInstances +
    // manifests for reachable missions from committed post-construction state;
    // feeds battle_resolution (phase 10) unchanged. No-op path keeps the new
    // collections ABSENT so a no-war month's final-state hash is unchanged
    // (AC-12 pin). Uses no randomness for reachable missions in B-1.
    {
      const hadWars = (currentSnapshot["wars"]["wars"] ?? []).some(
        (w) => w["status"] === "ACTIVE" || w["status"] === "DECLARED_NOT_ACTIVE",
      );
      if (hadWars) {
        const generationResult = generateBattles({
          snapshot: currentSnapshot,
          campaignMonth,
          campaignSeed: randomSeed,
          rngVersion: "1",
          formulaVersion: "1",
          rulesetVersion: currentSnapshot["rulesetVersion"],
          contentVersion: "0.1.0",
          resolveStrength: (shipId) => resolveShipStrength(currentSnapshot, shipId),
          resolveShipType: () => "BB",
          resolveReadiness: () => 80,
        });

        if (generationResult.battleIds.length > 0) {
          const fleetsInArea = (nationId: string, areaId: string): string[] => {
            const nation = currentSnapshot["nations"].get(nationId);
            if (!nation) return [];
            return nation["fleets"]
              .filter((f) => f["locationAreaId"] === areaId)
              .map((f) => f["id"]);
          };

          const newBattles: BattleInstance[] = generationResult.battleIds.map((battleId, i) => {
            const manifest = generationResult.manifests[i]!;
            const attackerFleetIds = fleetsInArea(manifest.attackerId, manifest.areaId);
            const defenderFleetIds = fleetsInArea(manifest.defenderId, manifest.areaId);
            return {
              id: battleId,
              phase: "pending" as const,
              attackerId: manifest.attackerId,
              defenderId: manifest.defenderId,
              areaId: manifest.areaId,
              attackerFleetIds,
              defenderFleetIds,
              manifestHash: manifest.manifestHash,
            };
          });

          // Apply reservations: mark ships in battle.
          const reservedShipIds = new Set(
            generationResult.manifests.flatMap((m) => m["persistentAssets"]),
          );
          const updatedNations = new Map<string, NationState>();
          for (const [nid, nation] of currentSnapshot["nations"]) {
            if (reservedShipIds.size === 0) {
              updatedNations.set(nid, nation);
              continue;
            }
            const fleets = nation["fleets"].map((f) => ({
              ...f,
              ships: f["ships"].map((s) =>
                reservedShipIds.has(s["id"])
                  ? { ...s, inBattleId: generationResult.battleIds[0] }
                  : s,
              ),
            }));
            updatedNations.set(nid, { ...nation, fleets });
          }

          currentSnapshot = {
            ...currentSnapshot,
            nations: updatedNations,
            wars: {
              ...currentSnapshot["wars"],
              battleManifests: [
                ...(currentSnapshot["wars"]["battleManifests"] ?? []),
                ...generationResult.manifests,
              ],
              battles: [...currentSnapshot["wars"]["battles"], ...newBattles],
            },
          };
        }
      }
    }

    // Phase 10: battle_resolution (registry order 8). B-6 INC-3 (AC-8):
    // manifest-carrying pending/resolving battles resolve deterministically via
    // `resolveBattleAuto` (@bluewave/combat, INC-2) with the campaign's
    // committed ships/divisions/weather for that battle; the result feeds the
    // UNCHANGED A-3 `applyBattleResult` (war score / ADR-0010 victory
    // classification / nationalContributionPoints) for DECIDED battles, applies
    // per-ship damage/loss + reservation clearing (AC-9), and records
    // `BattleInstance.result` + phase "resolved".
    //
    // - A battle WITHOUT a manifest keeps the M1 `BattleResolver` strength path
    //   exactly as today (unchanged; the accepted M1 auto-resolution).
    // - A manifest battle whose auto-resolution fails closed (missing committed
    //   weather / missing design / malformed manifest — INC-2 throws a stable
    //   BluewaveError BEFORE any consequence) records the stable diagnostic and
    //   falls back to the same legacy path: never crashes, never a partial
    //   mutation.
    // - A battle whose `manifestHash` matches NO stored manifest is a broken
    //   invariant: stable diagnostic + NO mutation (battle stays pending).
    // - Null winner/loser (time_limit / both-non-viable tie, ADR-0026 §7):
    //   `applyBattleResult` is called ONLY for decided battles; a tie applies
    //   no war score / victory class / contribution delta but still records
    //   damage/loss, the battle result, and reservation clearing (INC-3 ADR).
    {
      const battles = currentSnapshot["wars"]["battles"].filter(
        (b) => b["phase"] === "pending" || b["phase"] === "resolving",
      );

      if (battles.length > 0) {
        const randomEngine = new RandomEngine(randomSeed);
        const resolver = new BattleResolver();

        for (const battle of battles) {
          const attacker = currentSnapshot["nations"].get(battle["attackerId"]);
          const defender = currentSnapshot["nations"].get(battle["defenderId"]);
          if (!attacker || !defender) {
            collector.addError(
              "BATTLE_NATION_MISSING",
              `Nation not found for battle ${battle["id"]}`,
              { stage: "battle-resolution" },
            );
            continue;
          }

          const manifest = resolveBattleManifest(currentSnapshot, battle);
          const hasManifestHash = battle["manifestHash"] !== undefined;

          // Two fail-fast branches, then `manifest` is guaranteed non-null for
          // the tactical auto-resolution path below (narrowed by the union):
          //  - no manifestHash -> M1 legacy strength path, unchanged;
          //  - manifestHash with NO matching stored manifest -> corrupted
          //    invariant: stable diagnostic, never a partial/silent resolution.
          if (!hasManifestHash || manifest === null) {
            if (hasManifestHash) {
              collector.addError(
                BATTLE_AUTO_RESOLUTION_FAILED,
                `Battle ${battle["id"]} declares manifestHash ${battle["manifestHash"]} but no matching battle manifest exists in the snapshot`,
                { stage: "battle-resolution", entityId: battle["id"] },
              );
              continue;
            }
            // M1 legacy strength path — unchanged (no manifest -> no tactical
            // auto-resolution available).
            currentSnapshot = resolveLegacyBattle(
              currentSnapshot,
              battle,
              attacker,
              defender,
              randomEngine,
              resolver,
              campaignMonth,
              collector,
            );
            continue;
          }

          // Tactical auto-resolution (AC-3 fail-closed: the battle area MUST
          // have committed strategic weather from the weather_generation phase).
          const strategicWeather = currentSnapshot["strategicWeather"].find(
            (s) => s["areaId"] === battle["areaId"],
          );
          if (!strategicWeather) {
            collector.addError(
              INVALID_BATTLE_WEATHER_INITIALIZATION,
              `Battle ${battle["id"]} has a manifest but no committed strategic weather for area ${battle["areaId"]} — resolving via the legacy strength path`,
              { stage: "battle-resolution", entityId: battle["id"] },
            );
            currentSnapshot = resolveLegacyBattle(
              currentSnapshot,
              battle,
              attacker,
              defender,
              randomEngine,
              resolver,
              campaignMonth,
              collector,
            );
            continue;
          }

          try {
            const autoResult = resolveBattleAuto({
              battleId: battle["id"],
              areaId: battle["areaId"],
              campaignMonth,
              manifest,
              attacker: {
                nationId: attacker["id"],
                ships: attacker["fleets"].flatMap((f) => f["ships"]),
                designs: currentSnapshot["designs"],
                divisions: attacker["divisions"],
              },
              defender: {
                nationId: defender["id"],
                ships: defender["fleets"].flatMap((f) => f["ships"]),
                designs: currentSnapshot["designs"],
                divisions: defender["divisions"],
              },
              strategicWeather,
              campaignSeed: randomSeed,
              rulesetVersion: currentSnapshot["rulesetVersion"],
              formulaVersion: manifest["formulaVersion"],
              rngVersion: manifest["rngVersion"],
              randomLedger,
            });

            // A-3 war-score path, UNCHANGED — but only for DECIDED battles. A
            // tie / time-limit end (both winnerId and loserId null, ADR-0026
            // §7) contributes NO war score, NO victory class, NO contribution
            // delta; it still applies ship damage/loss, records the battle
            // result, and clears reservations below.
            if (autoResult.winnerId !== null && autoResult.loserId !== null) {
              currentSnapshot = applyBattleResult(
                currentSnapshot,
                battle,
                {
                  winnerId: autoResult.winnerId,
                  loserId: autoResult.loserId,
                  damageReport: autoResult.damageReport,
                },
                campaignMonth,
                collector,
              );
            }

            currentSnapshot = applyBattleConsequences(currentSnapshot, battle, autoResult);
            currentSnapshot = recordResolvedBattle(
              currentSnapshot,
              battle,
              toCampaignBattleResult(autoResult),
            );
          } catch (e) {
            // Fail-closed auto-resolution: INC-2 throws a stable BluewaveError
            // code BEFORE any consequence is applied. Record the diagnostic and
            // resolve via the accepted M1 legacy path — never crash, never a
            // partial tactical mutation.
            const ctxCode =
              e instanceof BluewaveError && typeof e.context?.["code"] === "string"
                ? (e.context["code"] as string)
                : "";
            const code = ctxCode.length > 0 ? ctxCode : BATTLE_AUTO_RESOLUTION_FAILED;
            collector.addError(
              code,
              `Battle auto-resolution failed for ${battle["id"]}: ${(e as Error).message ?? String(e)}`,
              { stage: "battle-resolution", entityId: battle["id"] },
            );
            currentSnapshot = resolveLegacyBattle(
              currentSnapshot,
              battle,
              attacker,
              defender,
              randomEngine,
              resolver,
              campaignMonth,
              collector,
            );
          }
        }
      }
    }

    // Phase 11: closing_validation
    {
      const diagnostics: string[] = [];

      for (const [nationId, nation] of currentSnapshot["nations"]) {
        if ((nation["treasury"] as number) < 0) {
          diagnostics.push(
            `Nation ${nationId} has negative treasury at closing: ${String(nation["treasury"])}`,
          );
          collector.addError(
            "NEGATIVE_TREASURY",
            `Nation ${nationId} has negative treasury at closing`,
            { stage: "closing-validation" },
          );
        }

        for (const project of nation["constructionProjects"]) {
          if ((project["completedWork"] as number) > (project["totalWork"] as number)) {
            diagnostics.push(`Project ${project["id"]} completed work exceeds total`);
            collector.addError(
              "CONSTRUCTION_OVERFLOW",
              `Project ${project["id"]} completedWork ${String(project["completedWork"])} exceeds totalWork ${String(project["totalWork"])}`,
              { stage: "closing-validation" },
            );
          }
        }
      }

      const hasErrors = diagnostics.length > 0 || collector.errors.length > 0;
      return {
        finalSnapshot: currentSnapshot,
        commandLedger,
        eventLedger,
        randomLedger,
        financialLedger,
        success: !hasErrors,
      };
    }
  }

  private runOpeningValidation(
    snapshot: CampaignSnapshot,
    collector: DiagnosticCollector,
  ): boolean {
    let valid = true;

    for (const [nationId, nation] of snapshot["nations"]) {
      if ((nation["treasury"] as number) < 0) {
        collector.addError(
          "NEGATIVE_TREASURY",
          `Nation ${nationId} has negative treasury: ${String(nation["treasury"])}`,
          { stage: "opening-validation" },
        );
        valid = false;
      }

      for (const ship of nation["fleets"].flatMap((f) => f["ships"])) {
        if ((ship["constructionProgress"] as number) > (ship["constructionTotalWork"] as number)) {
          collector.addError(
            "CONSTRUCTION_OVERFLOW",
            `Ship ${ship["id"]} construction progress ${String(ship["constructionProgress"])} exceeds total work ${String(ship["constructionTotalWork"])}`,
            { stage: "opening-validation" },
          );
          valid = false;
        }
      }
    }

    const shipBattleMap = new Map<string, string>();
    for (const battle of snapshot["wars"]["battles"]) {
      const battleFleetIds = [...battle["attackerFleetIds"], ...battle["defenderFleetIds"]];
      for (const fleetId of battleFleetIds) {
        for (const nation of snapshot["nations"].values()) {
          for (const fleet of nation["fleets"]) {
            if (fleet["id"] === fleetId) {
              for (const ship of fleet["ships"]) {
                if (ship["inBattleId"]) {
                  if (shipBattleMap.has(ship["id"])) {
                    collector.addError(
                      "SHIP_IN_MULTIPLE_BATTLES",
                      `Ship ${ship["id"]} is assigned to multiple battles`,
                      { stage: "opening-validation" },
                    );
                    valid = false;
                  }
                  shipBattleMap.set(ship["id"], battle["id"]);
                }
              }
            }
          }
        }
      }
    }

    return valid;
  }
}
