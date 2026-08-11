import { SafeInt } from "@bluewave/contracts";
import type {
  CampaignSnapshot,
  NationState,
  ConstructionProject,
  Ship,
  FleetState,
  CompiledDesignVersion,
  ResearchState,
  TechnologyProgress,
} from "@bluewave/campaign";
import type { CommandEnvelope, BudgetProjectCommand, SetResearchPriorityCommand } from "@bluewave/commands";
import { CommandLifecycle, CommandLedger, CommandIdempotencyMap } from "@bluewave/commands";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { EventLedger } from "@bluewave/events";
import type { DomainEventEnvelope } from "@bluewave/events";
import { RandomEngine, RandomLedger, drawUniform } from "@bluewave/random";
import { BattleResolver } from "@bluewave/combat";
import { PhaseRegistry } from "./registry.js";
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
    attackerId: w["attackerId"],
    defenderId: w["defenderId"],
    startDate: w["startDate"],
    status: w["status"],
    endDate: w["endDate"],
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
    },
    politics: {
      relations: snapshot["politics"]["relations"].map((r) => ({
        nationA: r["nationA"],
        nationB: r["nationB"],
        relation: r["relation"],
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

function drawWeighted(stream: import("@bluewave/random").RandomStream, weights: [string, SafeInt][]): string {
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

const CANONICAL_FIELD_IDS = [
  "HULL_CONSTRUCTION",
  "MACHINERY",
  "SHIP_DESIGN",
  "GUNNERY",
  "FIRE_CONTROL",
  "TORPEDOES",
  "SUBMARINES",
  "MINES_AND_ASW",
  "AVIATION",
  "CARRIER_OPERATIONS",
  "RADAR_AND_ELECTRONICS",
  "MISSILES",
  "AMPHIBIOUS_OPERATIONS",
  "INFRASTRUCTURE",
  "DAMAGE_CONTROL",
] as const;

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

    for (const [fieldId, allocation] of fieldAllocations) {
      if ((allocation as number) <= 0) continue;

      let activeTechId = activeCandidates.get(fieldId);

      if (!activeTechId) {
        // Select eligible technology with highest discovery weight
        const fieldTechs = findEligibleTechsForField(fieldId, updatedTechs, discoveredTechs, turnNumber);
        if (fieldTechs.length === 0) continue;

        // For deterministic selection without active candidate, pick the one with highest weight
        // First discovery (no active candidate yet) - use deterministic selection
        const stream = new RandomEngine(randomSeed).stream(`research/month/${nationId}/${fieldId}`);
        const weights: [string, SafeInt][] = fieldTechs.map((t) => [t.techId, t.discoveryWeight ?? SafeInt(1)] as [string, SafeInt]);

        // Record this selection in the random ledger
        const inputHash = sha256Hex(canonicalSerialize({
          nationId,
          fieldId,
          turnNumber,
          eligibleTechs: fieldTechs.map((t) => t.techId),
        }));

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
        const newDiscoveredTechs = [...discoveredTechs, activeTechId];

        // Mark as completed
        updatedTechs[techIdx] = {
          ...updatedTechs[techIdx]!,
          completed: true,
          investedPoints: cost,
        };

        // Remove from active candidates
        activeCandidates.delete(fieldId);

        // Apply IMMEDIATE_KNOWLEDGE effects
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

        // Update nation's discoveredTechs
        nation["research"]["discoveredTechs"] = newDiscoveredTechs;
      }
    }

    const updatedNation: NationState = {
      ...nation,
      research: {
        ...research,
        technologies: updatedTechs,
        activeCandidates,
        discoveredTechs: research["discoveredTechs"],
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
): (TechnologyProgress & { discoveryWeight: SafeInt })[] {
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
      if (def["availabilityMonth"] !== undefined && (turnNumber as number) < (def["availabilityMonth"] as number)) {
        return false;
      }
      return true;
    })
    .map((t) => {
      const def = TECH_DEFINITIONS[t["techId"]]!;
      return { ...t, discoveryWeight: def["discoveryWeight"] };
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

function findTechDiscoveryWeight(techId: string): SafeInt {
  return TECH_DEFINITIONS[techId]?.["discoveryWeight"] ?? SafeInt(10);
}

export class MonthExecutor {
  private lifecycle = new CommandLifecycle();

  execute(
    snapshot: CampaignSnapshot,
    commands: CommandEnvelope<BudgetProjectCommand>[],
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
                shipFirepower = SafeInt.mul(design["mainGunsCount"], SafeInt.div(design["mainGunsCaliber"], SafeInt(100), "floor"));
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

    // Phase 8: resolve_research
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

    // Phase 9: battle_resolution
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

    // Phase 10: closing_validation
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
