// packages/phase-engine/src/newConstructionCapacity.ts
// SB3-R18/R19: the order-time displacement reservation against the national concurrency cap. This is the application
// layer over the pure `@bluewave/ship-design` primitives: it reads campaign state and the content balance, but owns no
// arithmetic of its own. The cap governs how much tonnage may be under construction at once; the DESIGN-16 section 7
// work-micro-unit pools still govern how fast work advances, and the two are never conflated.
import type { CampaignSnapshot } from "@bluewave/campaign";
import { isTerminalConstructionProjectStatus } from "@bluewave/campaign";
import {
  maxConcurrentConstructionMassKg,
  reservedNewConstructionMassKg,
  shippedConstructionCapacityExemptions,
  type ConstructionCapacityBalance,
  type ConstructionCapacityExemptionDefinition,
} from "@bluewave/ship-design";

/** Re-exported so the order path has one stable, documented reason code. */
export { INSUFFICIENT_PROJECT_CAPACITY } from "@bluewave/ship-design";

/** The national concurrency cap and the exemption definitions it is enforced against. */
export interface NationalConstructionCapacity {
  readonly maxConcurrentMassKg: number;
  readonly exemptions: readonly ConstructionCapacityExemptionDefinition[];
}

/** Resolve a nation's concurrency cap and exemptions from its versioned balance and dock size. Pure. */
export function nationalConstructionCapacity(
  balance: ConstructionCapacityBalance,
  dockMaxMassKg: number,
): NationalConstructionCapacity {
  return {
    maxConcurrentMassKg: maxConcurrentConstructionMassKg(
      dockMaxMassKg,
      balance.shipyardCapacityMultipleBp,
    ),
    exemptions: shippedConstructionCapacityExemptions(balance, dockMaxMassKg),
  };
}

/**
 * The displacement a design reserves against the `NEW_CONSTRUCTION` cap: its non-exempt share under the nation's
 * exemption definitions (DESIGN-16 section 9). A fully exempt ship reserves zero; an ordinary ship reserves all of it.
 */
export function designNewConstructionReservedMassKg(
  hullType: string,
  displacementKg: number,
  capacity: NationalConstructionCapacity,
): number {
  return reservedNewConstructionMassKg({ hullType, displacementKg }, capacity.exemptions);
}

/** The displacement reserved by one in-flight project: its stored reservation, else recomputed from its design. */
function projectReservedMassKg(
  snapshot: CampaignSnapshot,
  project: { designVersionId: string; newConstructionReservedMassKg?: number },
  capacity: NationalConstructionCapacity,
): number {
  if (project.newConstructionReservedMassKg !== undefined)
    return project.newConstructionReservedMassKg;
  const design = snapshot["designs"].get(project.designVersionId);
  if (!design) return 0;
  return designNewConstructionReservedMassKg(
    design.hullType,
    Number(design.normalizedDisplacementKg),
    capacity,
  );
}

/**
 * The mass already reserved by a nation's in-flight `NEW_CONSTRUCTION` projects (SB3-R18). Rebuild projects book to
 * `REFIT_REBUILD` and are excluded; submarines book to `NEW_CONSTRUCTION` and are counted. The replaced project, if
 * any, leaves in the same step and is excluded. Pure and deterministic.
 */
export function committedNewConstructionMassKg(
  snapshot: CampaignSnapshot,
  nationId: string,
  capacity: NationalConstructionCapacity,
  excludedProjectId?: string,
): number {
  const nation = snapshot["nations"].get(nationId);
  if (!nation) return 0;
  let total = 0;
  for (const p of nation["constructionProjects"]) {
    if (p.projectType !== "NEW_CONSTRUCTION") continue;
    if (isTerminalConstructionProjectStatus(p.status)) continue;
    if (p.id === excludedProjectId) continue;
    total += projectReservedMassKg(snapshot, p, capacity);
  }
  return total;
}
