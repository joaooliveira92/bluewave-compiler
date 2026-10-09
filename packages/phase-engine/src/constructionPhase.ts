// packages/phase-engine/src/constructionPhase.ts
// Phase 7: construction_processing — advance construction projects, complete
// finished projects into fleet ships, and emit construction-progressed events.
import { KNOTS_TO_UMS, MM_TO_UM } from "@bluewave/campaign";
import type { FleetState, NationState, Ship } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import { constructionProgressedEvent } from "./events.js";
import type { MonthContext } from "./monthContext.js";

export function runConstructionProcessingPhase(ctx: MonthContext): void {
  for (const [nationId, nation] of ctx.currentSnapshot["nations"]) {
    if (!nation["isPlayable"] && !nation["isAI"]) continue;
    applyConstructionToNation(ctx, nationId, nation);
  }
}

function applyConstructionToNation(ctx: MonthContext, nationId: string, nation: NationState): void {
  const { campaignMonth, eventLedger, collector, nextSeq } = ctx;

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

    // Check for completion. Only new construction completes into a new ship; a finished REBUILD is handled by the rebuild
    // completion step (ADR-0078), so it must not spawn a second ship here.
    if (
      project["projectType"] === "NEW_CONSTRUCTION" &&
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

      const ensured = ensureNationFleet(updatedFleets, nationId, nation);
      updatedFleets = ensured.fleets;
      const newShip = buildCompletedShip(ctx, project, ensured.fleet);
      updatedFleets = updatedFleets.map((f) =>
        f["id"] === ensured.fleet["id"] ? { ...f, ships: [...f["ships"], newShip] } : f,
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
    const updatedNations = new Map(ctx.currentSnapshot["nations"]);
    updatedNations.set(nationId, updatedNation);
    ctx.currentSnapshot = { ...ctx.currentSnapshot, nations: updatedNations };
  }
}

// Find the nation's fleet, creating a placeholder fleet when it has none.
function ensureNationFleet(
  fleets: FleetState[],
  nationId: string,
  nation: NationState,
): { fleet: FleetState; fleets: FleetState[] } {
  const existing = fleets.find((f) => f["nationId"] === nationId);
  if (existing) return { fleet: existing, fleets };
  const newFleet: FleetState = {
    id: `fleet-${nationId}`,
    nationId,
    name: `${nation["name"]} Fleet`,
    ships: [],
    locationAreaId: "unknown",
  };
  return { fleet: newFleet, fleets: [...fleets, newFleet] };
}

// Build the commissioned ship for a completed project, resolving compiled design
// stats back to the abstracted Ship units (ADR-0037).
function buildCompletedShip(
  ctx: MonthContext,
  project: NationState["constructionProjects"][number],
  fleet: FleetState,
): Ship {
  const nationId = fleet["nationId"];
  const designVersionId = project["designVersionId"] ?? "";
  let shipHitPoints = SafeInt(100) as SafeInt;
  let shipMaxHitPoints = SafeInt(100) as SafeInt;
  let shipSpeed = SafeInt(10) as SafeInt;
  let shipFirepower = SafeInt(10) as SafeInt;
  let shipArmor = SafeInt(10) as SafeInt;
  let shipClassName = project["targetId"];

  if (designVersionId) {
    const design = ctx.currentSnapshot["designs"]?.get(designVersionId);
    if (design) {
      shipHitPoints = design["hitPoints"];
      shipMaxHitPoints = design["hitPoints"];
      // ADR-0037: compiled design fields are canonical µm / µm·s⁻¹; the
      // abstracted Ship stats are knots / mm (+ a coarse firepower heuristic).
      shipSpeed = SafeInt.div(design["normalizedSpeedUms"], SafeInt(KNOTS_TO_UMS), "floor");
      shipFirepower = SafeInt.mul(
        design["mainGunsCount"],
        SafeInt.div(design["mainGunsCaliber"], SafeInt(100_000), "floor"),
      );
      shipArmor = SafeInt.div(design["normalizedArmorUm"], SafeInt(MM_TO_UM), "floor");
      shipClassName = design["className"];
    }
  }

  return {
    id: `ship-${project["targetId"]}-${String(ctx.turnNumber)}`,
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
}
