import { SafeInt } from "@bluewave/contracts";
import type { CampaignSnapshot, NationState, ConstructionProject } from "@bluewave/campaign";
import type { CommandEnvelope, BudgetProjectCommand } from "@bluewave/commands";
import { CommandLifecycle, CommandLedger, CommandIdempotencyMap } from "@bluewave/commands";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { EventLedger } from "@bluewave/events";
import type { DomainEventEnvelope } from "@bluewave/events";
import { RandomEngine, RandomLedger, drawUniform } from "@bluewave/random";
import { BattleResolver } from "@bluewave/combat";
import { PhaseRegistry } from "./registry.js";
import { FinancialLedger, type FinancialEntry } from "./financial-ledger.js";

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
      },
      constructionProjects: nation["constructionProjects"].map((c) => ({
        id: c["id"],
        type: c["type"],
        targetId: c["targetId"],
        totalWork: c["totalWork"],
        completedWork: c["completedWork"],
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

    // Phase 2: command_collection
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
                p["id"] === body["projectId"] ? { ...p, completedWork: clampedWork } : p,
              ),
            };
            const updatedNations = new Map(currentSnapshot["nations"]);
            updatedNations.set(body["nationId"], updatedNation);
            currentSnapshot = { ...currentSnapshot, nations: updatedNations };

            financialLedger.append({
              nationId: body["nationId"],
              phaseId: "command_collection",
              previousBalance: previousTreasury,
              delta: SafeInt.mul(budget, SafeInt(-1)),
              newBalance: newTreasury,
              reason: `Player budget for project ${body["projectId"]}`,
            });

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

    // Phase 3: appropriation
    {
      for (const [nationId, nation] of currentSnapshot["nations"]) {
        if (!nation["isPlayable"] && !nation["isAI"]) continue;
        const expenseReserve = nation["expenses"];
        const available = SafeInt.sub(nation["treasury"], expenseReserve);
        if ((available as number) <= 0) continue;

        const projects = nation["constructionProjects"].filter(
          (p) => (p["completedWork"] as number) < (p["totalWork"] as number),
        );
        if (projects.length === 0) continue;

        const totalRemainingWork = projects.reduce(
          (sum: SafeInt, p) => SafeInt.add(sum, SafeInt.sub(p["totalWork"], p["completedWork"])),
          SafeInt.ZERO,
        );
        if ((totalRemainingWork as number) <= 0) continue;

        let remainingFunds = available;
        let updatedProjects = [...nation["constructionProjects"]];
        let totalDelta = SafeInt.ZERO;

        for (const project of projects) {
          const remainingWork = SafeInt.sub(project["totalWork"], project["completedWork"]);
          const proportion = (remainingWork as number) / (totalRemainingWork as number);
          const alloc = SafeInt(Math.floor(proportion * (available as number)));
          const clampedAlloc = alloc > remainingWork ? remainingWork : alloc;
          if ((clampedAlloc as number) <= 0) continue;

          totalDelta = SafeInt.add(totalDelta, clampedAlloc);
          remainingFunds = SafeInt.sub(remainingFunds, clampedAlloc);

          updatedProjects = updatedProjects.map((p) =>
            p["id"] === project["id"]
              ? { ...p, completedWork: SafeInt.add(p["completedWork"], clampedAlloc) }
              : p,
          );
        }

        // Apply leftover funds to first incomplete project
        if ((remainingFunds as number) > 0) {
          const firstIncomplete = updatedProjects.find(
            (p) => (p["completedWork"] as number) < (p["totalWork"] as number),
          );
          if (firstIncomplete) {
            const remainingWork = SafeInt.sub(
              firstIncomplete["totalWork"],
              firstIncomplete["completedWork"],
            );
            const extra = remainingFunds > remainingWork ? remainingWork : remainingFunds;
            totalDelta = SafeInt.add(totalDelta, extra);

            updatedProjects = updatedProjects.map((p) =>
              p["id"] === firstIncomplete["id"]
                ? { ...p, completedWork: SafeInt.add(p["completedWork"], extra) }
                : p,
            );
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

          financialLedger.append({
            nationId,
            phaseId: "appropriation",
            previousBalance: previousTreasury,
            delta: SafeInt.mul(totalDelta, SafeInt(-1)),
            newBalance: newTreasury,
            reason: "Proportional appropriation to construction projects",
          });

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

    // Phase 4: obligation
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

        financialLedger.append({
          nationId,
          phaseId: "obligation",
          previousBalance: previousTreasury,
          delta: SafeInt.mul(expense, SafeInt(-1)),
          newBalance: actualNew,
          reason: "Mandatory fixed expenses",
        });

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

    // Phase 5: construction_processing
    {
      for (const [nationId, nation] of currentSnapshot["nations"]) {
        if (!nation["isPlayable"] && !nation["isAI"]) continue;

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
            const updatedProjects = nation["constructionProjects"].map((p) =>
              p["id"] === project["id"] ? { ...p, completedWork: clampedWork } : p,
            );
            const updatedNation: NationState = {
              ...nation,
              constructionProjects: updatedProjects,
            };
            const updatedNations = new Map(currentSnapshot["nations"]);
            updatedNations.set(nationId, updatedNation);
            currentSnapshot = { ...currentSnapshot, nations: updatedNations };
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
      }
    }

    // Phase 6: research_progress
    {
      const randomEngine = new RandomEngine(randomSeed);

      for (const [nationId, nation] of currentSnapshot["nations"]) {
        if (!nation["isPlayable"] && !nation["isAI"]) continue;
        const techId = nation["research"]["currentProjectTechId"];
        if (!techId) continue;

        const tech = nation["research"]["technologies"].find((t) => t["techId"] === techId);
        if (!tech || tech["completed"]) continue;

        const stream = randomEngine.stream("research:progress");
        const draw = drawUniform(stream, SafeInt(1), SafeInt(20));
        const newPoints = SafeInt.add(tech["investedPoints"], draw);

        const updatedTechs = nation["research"]["technologies"].map((t) =>
          t["techId"] === techId ? { ...t, investedPoints: newPoints } : t,
        );
        const updatedNation: NationState = {
          ...nation,
          research: {
            ...nation["research"],
            technologies: updatedTechs,
          },
        };
        const updatedNations = new Map(currentSnapshot["nations"]);
        updatedNations.set(nationId, updatedNation);
        currentSnapshot = { ...currentSnapshot, nations: updatedNations };

        randomLedger.record({
          streamId: "research:progress",
          entityKey: `${nationId}:${techId}`,
          phase: "research_progress",
          rulesetVersion: CURRENT_VERSION,
          inputHash: sha256Hex(canonicalSerialize({ nationId, techId, turnNumber })),
          draw: draw as number,
          outcome: `research_points_${String(draw)}`,
          reasonCode: "RESEARCH_PROGRESS_DRAW",
        });

        eventLedger.append(
          researchProgressedEvent(
            nationId,
            techId,
            tech["investedPoints"],
            newPoints,
            nextSeq(),
            turnNumber,
          ),
        );
      }
    }

    // Phase 7: battle_resolution
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

    // Phase 8: closing_validation
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
