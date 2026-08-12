import { SafeInt } from "@bluewave/contracts";
import type {
  CampaignSnapshot,
  NationState,
  Ship,
  FleetState,
  TechnologyProgress,
  WarDeclaration,
  WarParticipantMembership,
  BlockadeState,
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
} from "@bluewave/commands";
import { CANONICAL_RESEARCH_FIELD_IDS as RESEARCH_FIELD_IDS } from "@bluewave/content-schema";
import { CommandLifecycle, CommandLedger, CommandIdempotencyMap } from "@bluewave/commands";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { EventLedger } from "@bluewave/events";
import type { DomainEventEnvelope } from "@bluewave/events";
import { RandomEngine, RandomLedger } from "@bluewave/random";
import { BattleResolver } from "@bluewave/combat";
import { FinancialLedger, type LedgerTransactionInput } from "./financial-ledger.js";

const CURRENT_VERSION = "0.1.0" as const;

export interface MonthResult {
  finalSnapshot: CampaignSnapshot;
  commandLedger: CommandLedger;
  eventLedger: EventLedger;
  randomLedger: RandomLedger;
  financialLedger: FinancialLedger;
  success: boolean;
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
    result: b["result"],
  }));

  const designs = new Map(snapshot["designs"]);
  const designFamilies = new Map(snapshot["designFamilies"]);

  return {
    version: snapshot["version"],
    turnNumber: snapshot["turnNumber"],
    campaignId: snapshot["campaignId"],
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
  patch: Partial<{ relation: "neutral" | "allied" | "at_war" | "trade_agreement"; tension: number; nap: boolean }>,
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
    const increment = (current: number) =>
      Math.max(-100, Math.min(100, current + gain));
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
      (w["attackerId"] === battle["attackerId"] &&
        w["defenderId"] === battle["defenderId"]) ||
      (w["attackerId"] === battle["defenderId"] &&
        w["defenderId"] === battle["attackerId"]),
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
            sideId: sideMembers === defenderSideMembers ? war["defenderSideId"] : war["attackerSideId"],
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

  const winnerScore =
    winnerSide === "attacker" ? war["attackerWarScore"] : war["defenderWarScore"];
  const loserScore =
    winnerSide === "attacker" ? war["defenderWarScore"] : war["attackerWarScore"];
  const newWinnerScore = clamp((winnerScore as number) + magnitude);
  const newLoserScore = clamp((loserScore as number) - magnitude);

  war = {
    ...war,
    attackerWarScore:
      winnerSide === "attacker" ? newWinnerScore : newLoserScore,
    defenderWarScore:
      winnerSide === "defender" ? newWinnerScore : newLoserScore,
  };

  // nationalContributionPoints for participating nations on the winning side.
  const contributionDelta = Math.floor(lossHp / 1000);
  const winnerMembers = winnerSide === "attacker" ? war["attackerSideMembers"] : war["defenderSideMembers"];
  if (contributionDelta > 0) {
    participantMemberships = participantMemberships.map((m) =>
      m["warId"] === war["id"] && winnerMembers.includes(m["nationId"])
        ? {
            ...m,
            nationalContributionPoints: (m["nationalContributionPoints"] as number) + contributionDelta,
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

export class MonthExecutor {
  private lifecycle = new CommandLifecycle();

  execute(
    snapshot: CampaignSnapshot,
    commands: CommandEnvelope<CommandBody>[],
    randomSeed: string,
    collector: DiagnosticCollector,
  ): MonthResult {
    const commandLedger = new CommandLedger();
    const eventLedger = new EventLedger();
    const randomLedger = new RandomLedger();
    const financialLedger = new FinancialLedger();
    let currentSnapshot = cloneSnapshot(snapshot);
    const turnNumber = snapshot["turnNumber"];
    const campaignMonth = String(turnNumber);

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
              const nation = currentSnapshot["nations"].get(priorityBody["nationId"]);
              if (!nation) {
                collector.addError(
                  "NATION_NOT_FOUND",
                  `Nation ${priorityBody["nationId"]} not found`,
                  {
                    stage: "command-collection",
                  },
                );
                continue;
              }
              const updatedNation: NationState = {
                ...nation,
                research: {
                  ...nation["research"],
                  fieldPriorities: priorityBody["fieldPriorities"],
                },
              };
              const updatedNations = new Map(currentSnapshot["nations"]);
              updatedNations.set(priorityBody["nationId"], updatedNation);
              currentSnapshot = { ...currentSnapshot, nations: updatedNations };
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

            const budget = body["budget"];
            const previousTreasury = nation["treasury"];
            const newTreasury = SafeInt.sub(previousTreasury, budget);
            const rawNewWork = SafeInt.add(project["completedWork"], budget);
            const clampedWork =
              rawNewWork > project["totalWork"] ? project["totalWork"] : rawNewWork;

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
            currentSnapshot = { ...currentSnapshot, nations: updatedNations };

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

    // Phase 10: battle_resolution
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

          const result = resolver.resolve(battle, attacker, defender, randomEngine);

          currentSnapshot = applyBattleResult(
            currentSnapshot,
            battle,
            result,
            campaignMonth,
            collector,
          );

          const updatedBattles = currentSnapshot["wars"]["battles"].map((b) =>
            b["id"] === battle["id"] ? { ...b, phase: "resolved" as const, result } : b,
          );
          currentSnapshot = {
            ...currentSnapshot,
            wars: { ...currentSnapshot["wars"], battles: updatedBattles },
          };
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
