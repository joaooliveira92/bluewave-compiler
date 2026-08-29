import { AiPhaseExecutor } from "@bluewave/ai";
import type {
  BattleInstance,
  CampaignSnapshot,
  CampaignWeatherState,
  FleetState,
  NationState,
  Ship,
} from "@bluewave/campaign";
import {
  campaignMonthId,
  KNOTS_TO_UMS,
  MM_TO_UM,
  TENSION_ALLIANCE,
  TENSION_PEACE,
} from "@bluewave/campaign";
import type { ClimateProfile } from "@bluewave/combat";
import {
  BATTLE_AUTO_RESOLUTION_FAILED,
  BattleResolver,
  defaultClimateProfile_v1,
  generateBattles,
  generateStrategicWeather,
  INVALID_BATTLE_WEATHER_INITIALIZATION,
  resolveBattleAuto,
  WEATHER_PROFILE_INCOMPLETE,
} from "@bluewave/combat";
import type {
  AcceptPeaceCommand,
  BreakAllianceCommand,
  BreakNonAggressionPactCommand,
  BudgetProjectCommand,
  CommandBody,
  CommandEnvelope,
  DeclareBlockadeCommand,
  DeclareWarCommand,
  FormAllianceCommand,
  FormNonAggressionPactCommand,
  SetResearchPriorityCommand,
} from "@bluewave/commands";
import { CommandIdempotencyMap, CommandLedger, CommandLifecycle } from "@bluewave/commands";
import { BluewaveError, SafeInt } from "@bluewave/contracts";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { EventLedger } from "@bluewave/events";
import { RandomLedger } from "@bluewave/random";
import { FinancialLedger } from "./financial-ledger.js";
import { PhaseGuard, PHASE_ACCESS_DENIED, PHASE_FOOTPRINTS } from "./phase-guard.js";
import type { PhaseDefinition } from "./registry.js";
import { cloneSnapshot } from "./snapshotClone.js";
import { budgetChangedEvent, constructionProgressedEvent, makeLedgerEntry } from "./events.js";
import { resolveResearchPhase } from "./research.js";
import { resolveAircraftDevelopment } from "./aircraft.js";
import {
  applyAcceptPeace,
  applyDeclareBlockade,
  applyDeclareWar,
  applySetNap,
  applySetRelation,
  resolveDiplomacyPhase,
} from "./diplomacy.js";
import {
  applyBudgetProject,
  applyDivisionCommandMonth,
  applySetResearchPriority,
} from "./commands.js";
import {
  applyBattleConsequences,
  applyBattleResult,
  recordResolvedBattle,
  resolveBattleManifest,
  resolveLegacyBattle,
  resolveShipStrength,
  toCampaignBattleResult,
} from "./battles.js";

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

/**
 * Engine-level options. `phaseOverrides` substitutes a phase's registry
 * definition at runtime (used by tests to exercise the fail-closed guard for a
 * specific phase). ADR-0036.
 */
export interface MonthExecutorEngineOptions {
  readonly phaseOverrides?: ReadonlyMap<string, PhaseDefinition>;
}

function computeMaintenanceCost(ship: Ship): SafeInt {
  return SafeInt.div(SafeInt.mul(ship["hitPoints"], SafeInt(10)), SafeInt(100), "floor");
}

function computeConstructionCap(nation: NationState): SafeInt {
  const base = nation["baseResources"] ?? (0 as SafeInt);
  return SafeInt.div(SafeInt.div(base, SafeInt(12)), SafeInt(100), "floor");
}

export class MonthExecutor {
  private lifecycle = new CommandLifecycle();

  execute(
    snapshot: CampaignSnapshot,
    commands: CommandEnvelope<CommandBody>[],
    randomSeed: string,
    collector: DiagnosticCollector,
    options?: StrategicWeatherPhaseOptions,
    engineOptions?: MonthExecutorEngineOptions,
  ): MonthResult {
    const commandLedger = new CommandLedger();
    const eventLedger = new EventLedger();
    const randomLedger = new RandomLedger();
    const financialLedger = new FinancialLedger();
    const phaseGuard = new PhaseGuard(engineOptions?.phaseOverrides);
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
      if (!this.assertPhase(phaseGuard, "opening_validation", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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
      if (!this.assertPhase(phaseGuard, "weather_generation", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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
      if (!this.assertPhase(phaseGuard, "monthly_revenue", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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
            campaignMonth,
          ),
        );
      }
    }

    // Phase 3: command_collection
    {
      if (!this.assertPhase(phaseGuard, "command_collection", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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
      if (!this.assertPhase(phaseGuard, "ai_planning", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
      const idempotencyMap = new CommandIdempotencyMap();
      const aiExecutor = new AiPhaseExecutor();
      const aiEngine = phaseGuard.rng("ai_planning", randomSeed)!;
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
      if (!this.assertPhase(phaseGuard, "appropriation", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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
              campaignMonth,
            ),
          );
        }
      }
    }

    // Phase 5: maintenance
    {
      if (!this.assertPhase(phaseGuard, "maintenance", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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
            campaignMonth,
          ),
        );
      }
    }

    // Phase 6: obligation
    {
      if (!this.assertPhase(phaseGuard, "obligation", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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
            campaignMonth,
          ),
        );
      }
    }

    // Phase 7: construction_processing
    {
      if (!this.assertPhase(phaseGuard, "construction_processing", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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
                // ADR-0037: compiled design fields are canonical µm / µm·s⁻¹;
                // the abstracted Ship stats are knots / mm (and a coarse
                // firepower heuristic), so convert back for display/balance.
                shipSpeed = SafeInt.div(
                  design["normalizedSpeedUms"],
                  SafeInt(KNOTS_TO_UMS),
                  "floor",
                );
                shipFirepower = SafeInt.mul(
                  design["mainGunsCount"],
                  SafeInt.div(design["mainGunsCaliber"], SafeInt(100_000), "floor"),
                );
                shipArmor = SafeInt.div(design["normalizedArmorUm"], SafeInt(MM_TO_UM), "floor");
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
              campaignMonth,
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
      if (!this.assertPhase(phaseGuard, "resolve_diplomacy", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
      currentSnapshot = resolveDiplomacyPhase(currentSnapshot, campaignMonth);
    }

    // Phase 9: resolve_research
    {
      if (!this.assertPhase(phaseGuard, "resolve_research", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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

    // Phase 7.2: resolve_aircraft_development (registry order 7.2, after
    // resolve_research, before battle_generation). D-1: per-nation aircraft
    // development pipeline (DESIGN-43 §§4-12): advance development projects,
    // generate proposals on completion, resolve private ventures, expire stale
    // proposals. Strict no-op when no nation has aviation tech (goldens unchanged
    // for pre-aviation months).
    {
      if (!this.assertPhase(phaseGuard, "resolve_aircraft_development", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
      const rngEngine = phaseGuard.rng("resolve_aircraft_development", randomSeed);
      if (rngEngine) {
        const result = resolveAircraftDevelopment({
          snapshot: currentSnapshot,
          campaignMonth,
          rngStream: rngEngine.stream("aircraft/development"),
        });
        currentSnapshot = result.snapshot;
      }
    }

    // Phase 9.5: battle_generation (order 7.5). Generates BattleInstances +
    // manifests for reachable missions from committed post-construction state;
    // feeds battle_resolution (phase 10) unchanged. No-op path keeps the new
    // collections ABSENT so a no-war month's final-state hash is unchanged
    // (AC-12 pin). Uses no randomness for reachable missions in B-1.
    {
      if (!this.assertPhase(phaseGuard, "battle_generation", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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
      if (!this.assertPhase(phaseGuard, "battle_resolution", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
      const battles = currentSnapshot["wars"]["battles"].filter(
        (b) => b["phase"] === "pending" || b["phase"] === "resolving",
      );

      if (battles.length > 0) {
        const randomEngine = phaseGuard.rng("battle_resolution", randomSeed)!;
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
      if (!this.assertPhase(phaseGuard, "closing_validation", collector)) {
        return this.failClosed(
          currentSnapshot,
          commandLedger,
          eventLedger,
          randomLedger,
          financialLedger,
        );
      }
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

  /**
   * ADR-0036: enforce the phase registry contract at runtime. Asserts the
   * phase's authoritative footprint against its registry-declared
   * read/writePermissions + rngAllowed. On any violation, records a stable
   * PHASE_ACCESS_DENIED diagnostic and returns false — the caller fails the
   * phase closed (the phase body does not run).
   */
  private assertPhase(guard: PhaseGuard, phaseId: string, collector: DiagnosticCollector): boolean {
    const footprint = PHASE_FOOTPRINTS[phaseId];
    const violations =
      footprint === undefined
        ? [`phase "${phaseId}" has no registered runtime footprint`]
        : guard.assert(phaseId, footprint);
    for (const message of violations) {
      collector.addError(PHASE_ACCESS_DENIED, message, { stage: phaseId });
    }
    return violations.length === 0;
  }

  private failClosed(
    finalSnapshot: CampaignSnapshot,
    commandLedger: CommandLedger,
    eventLedger: EventLedger,
    randomLedger: RandomLedger,
    financialLedger: FinancialLedger,
  ): MonthResult {
    return {
      finalSnapshot,
      commandLedger,
      eventLedger,
      randomLedger,
      financialLedger,
      success: false,
    };
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
