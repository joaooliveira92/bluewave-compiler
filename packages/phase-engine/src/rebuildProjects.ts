import type { NationState } from "@bluewave/campaign";

/**
 * Consistency problems of a nation's REBUILD projects (ADR-0078), as readable messages; empty when there are none or they
 * all hold. Pure. While a REBUILD project is unfinished: it names a target ship that exists in the nation's fleets; that
 * ship is UNAVAILABLE and records this project as the reason (DESIGN-23 section 20); and no other unfinished rebuild
 * targets the same ship. A new-construction project names no target ship.
 */
export function rebuildProjectProblems(nation: NationState): string[] {
  const problems: string[] = [];
  const ships = new Map(nation["fleets"].flatMap((f) => f["ships"]).map((s) => [s["id"], s]));
  const claimed = new Map<string, string>();
  for (const project of nation["constructionProjects"]) {
    const id = project["id"];
    if (project["projectType"] === "NEW_CONSTRUCTION") {
      if (project["targetShipId"] !== undefined)
        problems.push(
          `project ${id} is new construction but names target ship ${project["targetShipId"]}`,
        );
      continue;
    }
    const target = project["targetShipId"];
    if (target === undefined) {
      problems.push(`rebuild project ${id} names no target ship`);
      continue;
    }
    if (project["status"] === "COMPLETED") continue;
    const ship = ships.get(target);
    if (ship === undefined) {
      problems.push(`rebuild project ${id} targets unknown ship ${target}`);
      continue;
    }
    const other = claimed.get(target);
    if (other !== undefined)
      problems.push(`ship ${target} is the target of two rebuilds (${other} and ${id})`);
    claimed.set(target, id);
    if (ship["availability"] !== "UNAVAILABLE" || ship["availabilityProjectId"] !== id)
      problems.push(`ship ${target} must be unavailable because of rebuild project ${id}`);
  }
  return problems;
}
