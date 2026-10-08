import type {
  CampaignSnapshot,
  CanonicalShipType,
  DivisionAssetView,
  NationState,
  PermanentDivision,
} from "@bluewave/campaign";
import {
  applyDivisionCommand,
  assertDivisionInvariants,
  DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE,
  DIVISION_STATE_INVARIANT_FAILED,
  INITIAL_DIVISION_COHESION,
  INITIAL_DIVISION_EXPERIENCE,
  VACANT,
} from "@bluewave/campaign";
import { classifyShip } from "@bluewave/combat";
import type {
  AddShipToDivisionCommand,
  BudgetProjectCommand,
  ChangeDivisionFlagshipCommand,
  CommandBody,
  CreateDivisionCommand,
  DissolveDivisionCommand,
  RemoveShipFromDivisionCommand,
  SetBudgetAllocationCommand,
} from "@bluewave/commands";
import { SafeInt } from "@bluewave/contracts";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { EventLedger } from "@bluewave/events";
import type { FinancialLedger } from "./financial-ledger.js";
import { budgetChangedEvent, makeLedgerEntry } from "./events.js";

/**
 * Shared canonical application of a SetResearchPriority command. Used by both
 * the human command_collection path and the AI_PLANNING path so behavior is
 * byte-identical.
 */
export function applySetResearchPriority(
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
 * Canonical application of a SetBudgetAllocation command (ADR-0060): sets the
 * naval appropriation rate and the standing monthly research budget.
 */
export function applySetBudgetAllocation(
  currentSnapshot: CampaignSnapshot,
  body: SetBudgetAllocationCommand,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const nation = currentSnapshot["nations"].get(body["nationId"]);
  if (!nation) {
    collector.addError("NATION_NOT_FOUND", `Nation ${body["nationId"]} not found`, {
      stage: "command_collection",
    });
    return currentSnapshot;
  }
  const updatedNation: NationState = {
    ...nation,
    navalAppropriationRateBp: body["appropriationRateBp"],
    research: {
      ...nation["research"],
      researchBudget: body["researchBudget"],
      standingResearchBudget: body["researchBudget"],
    },
  };
  const updatedNations = new Map(currentSnapshot["nations"]);
  updatedNations.set(body["nationId"], updatedNation);
  return { ...currentSnapshot, nations: updatedNations };
}

/**
 * Shared canonical application of a budget_project command. Used by both the
 * human command_collection path and the AI_PLANNING path so behavior is
 * byte-identical.
 */
export function applyBudgetProject(
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
      campaignMonth,
    ),
  );

  return next;
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

export function applyDivisionCommandMonth(
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
