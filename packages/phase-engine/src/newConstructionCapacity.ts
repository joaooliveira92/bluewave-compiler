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

/**
 * DESIGN-16 section 9 (SB3-R19): the compiled capacity readout a screen shows — the cap, the non-exempt mass that
 * competes against it, and the exempt AMC/small-corvette mass that sits outside it. Every field is derived here, never
 * authored by the UI.
 */
export interface ConstructionCapacityUtilization {
  /** The national concurrency cap (`maxConcurrentMassKg`), in kilograms. */
  readonly maxConcurrentMassKg: number;
  /** Non-exempt `NEW_CONSTRUCTION` mass already committed (competes with the cap). */
  readonly committedMassKg: number;
  /** Exempt AMC/small-corvette mass under construction (outside the cap). */
  readonly exemptMassKg: number;
}

/**
 * DESIGN-16 sections 7-9: a nation's `NEW_CONSTRUCTION` capacity utilisation, split into the normal-pool mass that
 * competes with the cap and the exempt AMC/small-corvette share layered outside it. `committedMassKg` is exactly
 * `committedNewConstructionMassKg` (so it matches the order-time reservation); `exemptMassKg` is the non-terminal
 * projects' exempt share `displacement - designNewConstructionReservedMassKg`, clamped at zero. Pure and deterministic.
 */
export function constructionCapacityUtilization(
  snapshot: CampaignSnapshot,
  nationId: string,
  capacity: NationalConstructionCapacity,
): ConstructionCapacityUtilization {
  const committedMassKg = committedNewConstructionMassKg(snapshot, nationId, capacity);
  const nation = snapshot["nations"].get(nationId);
  if (!nation) {
    return { maxConcurrentMassKg: capacity.maxConcurrentMassKg, committedMassKg, exemptMassKg: 0 };
  }
  let exemptMassKg = 0;
  for (const p of nation["constructionProjects"]) {
    if (p.projectType !== "NEW_CONSTRUCTION") continue;
    if (isTerminalConstructionProjectStatus(p.status)) continue;
    // A foreign-contract project is funded and built by its BUILDER (DESIGN-16 section 13.3); its displacement must
    // never count against the ordering nation's pools, exempt or otherwise.
    if (p["foreignContractId"] !== undefined) continue;
    const design = snapshot["designs"].get(p.designVersionId);
    if (!design) continue;
    const displacementKg = Number(design.normalizedDisplacementKg);
    const reserved = designNewConstructionReservedMassKg(design.hullType, displacementKg, capacity);
    exemptMassKg += Math.max(0, displacementKg - reserved);
  }
  return { maxConcurrentMassKg: capacity.maxConcurrentMassKg, committedMassKg, exemptMassKg };
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
    // A foreign-contract project books to its BUILDER (DESIGN-16 section 13.3), never the ordering nation's cap.
    if (p["foreignContractId"] !== undefined) continue;
    if (p.id === excludedProjectId) continue;
    total += projectReservedMassKg(snapshot, p, capacity);
  }
  return total;
}
