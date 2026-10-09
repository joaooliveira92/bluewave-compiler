// packages/phase-engine/src/commandPhases.ts
// Player command + AI planning phases: command_collection (3) and ai_planning (3.5).
import { AiPhaseExecutor } from "@bluewave/ai";
import { TENSION_ALLIANCE, TENSION_PEACE } from "@bluewave/campaign";
import {
  type AcceptPeaceCommand,
  type AssignOfficerCommand,
  type BreakAllianceCommand,
  type BreakNonAggressionPactCommand,
  type BudgetProjectCommand,
  type CommandBody,
  CommandIdempotencyMap,
  type DeclareBlockadeCommand,
  type DeclareWarCommand,
  type FormAllianceCommand,
  type FormNonAggressionPactCommand,
  type MoveFleetCommand,
  type RelieveOfficerCommand,
  type SetBudgetAllocationCommand,
  type SetResearchPriorityCommand,
  type ReviseProjectCommand,
  type StartRebuildCommand,
  type SubmitDesignCommand,
} from "@bluewave/commands";
import {
  applyBudgetProject,
  applyDivisionCommandMonth,
  applyMoveFleet,
  applyOfficerCommand,
  applySetBudgetAllocation,
  applySetResearchPriority,
  applySubmitDesign,
} from "./commands.js";
import {
  applyAcceptPeace,
  applyDeclareBlockade,
  applyDeclareWar,
  applySetNap,
  applySetRelation,
} from "./diplomacy.js";
import type { MonthContext } from "./monthContext.js";
import { applyReviseProject } from "./reviseProject.js";
import { applyStartRebuild } from "./startRebuild.js";

// Phase 3: command_collection — process player commands in order, applying each
// successful command body through the shared command appliers.
export function runCommandCollectionPhase(ctx: MonthContext): void {
  const slot = ctx.slots[0];
  if (!slot) return;

  for (const cmd of ctx.commands) {
    const outcome = ctx.lifecycle.process(
      cmd,
      ctx.sourceSnapshot,
      slot,
      new CommandIdempotencyMap(),
    );
    ctx.commandLedger.add(outcome);

    if (outcome["type"] !== "success") continue;
    applyPlayerCommand(ctx, cmd["body"]);
  }
}

// Dispatch a successfully-authorized player command to its applier. Body types
// are disjoint, so the first matching group wins.
function applyPlayerCommand(ctx: MonthContext, body: CommandBody): void {
  if (applyAdministrativeCommand(ctx, body)) return;
  if (applyDiplomacyCommand(ctx, body)) return;
  if (applyDivisionCommand(ctx, body)) return;
  applyConstructionCommand(ctx, body as BudgetProjectCommand);
}

function applyAdministrativeCommand(ctx: MonthContext, body: CommandBody): boolean {
  const { campaignMonth, collector } = ctx;

  if (body["type"] === "SetResearchPriority") {
    const priorityBody = body as SetResearchPriorityCommand;
    ctx.currentSnapshot = applySetResearchPriority(
      ctx.currentSnapshot,
      priorityBody["nationId"],
      priorityBody["fieldPriorities"],
      collector,
    );
    return true;
  }

  if (body["type"] === "AssignOfficer" || body["type"] === "RelieveOfficer") {
    ctx.currentSnapshot = applyOfficerCommand(
      ctx.currentSnapshot,
      body as AssignOfficerCommand | RelieveOfficerCommand,
      campaignMonth,
      collector,
    );
    return true;
  }

  if (body["type"] === "SubmitDesign") {
    ctx.currentSnapshot = applySubmitDesign(
      ctx.currentSnapshot,
      body as SubmitDesignCommand,
      ctx.engineOptions?.shipBuilding,
      campaignMonth,
      collector,
    );
    return true;
  }

  if (body["type"] === "ReviseProject") {
    ctx.currentSnapshot = applyReviseProject(
      ctx.currentSnapshot,
      body as ReviseProjectCommand,
      ctx.engineOptions?.shipBuilding,
      campaignMonth,
      collector,
    );
    return true;
  }

  if (body["type"] === "StartRebuild") {
    ctx.currentSnapshot = applyStartRebuild(
      ctx.currentSnapshot,
      body as StartRebuildCommand,
      ctx.engineOptions?.shipBuilding,
      campaignMonth,
      collector,
    );
    return true;
  }

  if (body["type"] === "MoveFleet") {
    ctx.currentSnapshot = applyMoveFleet(ctx.currentSnapshot, body as MoveFleetCommand, collector);
    return true;
  }

  if (body["type"] === "SetBudgetAllocation") {
    ctx.currentSnapshot = applySetBudgetAllocation(
      ctx.currentSnapshot,
      body as SetBudgetAllocationCommand,
      collector,
    );
    return true;
  }

  return false;
}

function applyDiplomacyCommand(ctx: MonthContext, body: CommandBody): boolean {
  const { campaignMonth } = ctx;

  if (body["type"] === "DeclareWar") {
    ctx.currentSnapshot = applyDeclareWar(
      ctx.currentSnapshot,
      body as DeclareWarCommand,
      campaignMonth,
    );
    return true;
  }

  if (body["type"] === "AcceptPeace") {
    ctx.currentSnapshot = applyAcceptPeace(
      ctx.currentSnapshot,
      body as AcceptPeaceCommand,
      campaignMonth,
    );
    return true;
  }

  if (body["type"] === "FormAlliance") {
    ctx.currentSnapshot = applySetRelation(
      ctx.currentSnapshot,
      (body as FormAllianceCommand)["nationId"],
      (body as FormAllianceCommand)["partnerNationId"],
      "allied",
      TENSION_ALLIANCE,
    );
    return true;
  }

  if (body["type"] === "BreakAlliance") {
    ctx.currentSnapshot = applySetRelation(
      ctx.currentSnapshot,
      (body as BreakAllianceCommand)["nationId"],
      (body as BreakAllianceCommand)["partnerNationId"],
      "neutral",
      TENSION_PEACE,
    );
    return true;
  }

  if (body["type"] === "FormNonAggressionPact") {
    ctx.currentSnapshot = applySetNap(
      ctx.currentSnapshot,
      (body as FormNonAggressionPactCommand)["nationId"],
      (body as FormNonAggressionPactCommand)["partnerNationId"],
      true,
    );
    return true;
  }

  if (body["type"] === "BreakNonAggressionPact") {
    ctx.currentSnapshot = applySetNap(
      ctx.currentSnapshot,
      (body as BreakNonAggressionPactCommand)["nationId"],
      (body as BreakNonAggressionPactCommand)["partnerNationId"],
      false,
    );
    return true;
  }

  if (body["type"] === "DeclareBlockade") {
    ctx.currentSnapshot = applyDeclareBlockade(
      ctx.currentSnapshot,
      body as DeclareBlockadeCommand,
      campaignMonth,
    );
    return true;
  }

  return false;
}

function applyDivisionCommand(ctx: MonthContext, body: CommandBody): boolean {
  if (
    body["type"] === "CreateDivision" ||
    body["type"] === "AddShipToDivision" ||
    body["type"] === "RemoveShipFromDivision" ||
    body["type"] === "DissolveDivision" ||
    body["type"] === "ChangeDivisionFlagship"
  ) {
    ctx.currentSnapshot = applyDivisionCommandMonth(
      ctx.currentSnapshot,
      body,
      ctx.campaignMonth,
      ctx.collector,
    );
    return true;
  }
  return false;
}

function applyConstructionCommand(ctx: MonthContext, body: BudgetProjectCommand): void {
  const { campaignMonth, turnNumber, financialLedger, eventLedger, collector } = ctx;

  const nation = ctx.currentSnapshot["nations"].get(body["nationId"]);
  if (!nation) {
    collector.addError("NATION_NOT_FOUND", `Nation ${body["nationId"]} not found`, {
      stage: "command-collection",
    });
    return;
  }

  const project = nation["constructionProjects"].find((p) => p["id"] === body["projectId"]);
  if (!project) {
    collector.addError("PROJECT_NOT_FOUND", `Project ${body["projectId"]} not found`, {
      stage: "command-collection",
    });
    return;
  }

  ctx.currentSnapshot =
    // Apply via the shared helper (kept inline in command_collection
    // for exact parity with the AI path).
    applyBudgetProject(
      ctx.currentSnapshot,
      body,
      campaignMonth,
      turnNumber,
      ctx.nextSeq,
      financialLedger,
      eventLedger,
      collector,
    );
}

// Phase 3.5: ai_planning — run each AI slot's planner and apply its commands.
export function runAiPlanningPhase(ctx: MonthContext): void {
  const { campaignMonth, turnNumber, financialLedger, eventLedger, collector } = ctx;

  const idempotencyMap = new CommandIdempotencyMap();
  const aiExecutor = new AiPhaseExecutor();
  const aiEngine = ctx.phaseGuard.rng("ai_planning", ctx.randomSeed)!;
  for (const slot of ctx.slots) {
    if (slot["type"] !== "ai") continue;
    const { commands, diagnostics } = aiExecutor.run(
      slot,
      ctx.currentSnapshot,
      aiEngine,
      ctx.lifecycle,
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
        ctx.currentSnapshot = applySetResearchPriority(
          ctx.currentSnapshot,
          priorityBody["nationId"],
          priorityBody["fieldPriorities"],
          collector,
        );
      } else if (body["type"] === "budget_project") {
        ctx.currentSnapshot = applyBudgetProject(
          ctx.currentSnapshot,
          body as BudgetProjectCommand,
          campaignMonth,
          turnNumber,
          ctx.nextSeq,
          financialLedger,
          eventLedger,
          collector,
        );
      }
    }
  }
}
