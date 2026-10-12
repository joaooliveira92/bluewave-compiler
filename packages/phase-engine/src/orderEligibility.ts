import {
  isShipOperational,
  type CampaignSnapshot,
  type CompiledDesignVersion,
} from "@bluewave/campaign";
import {
  compileDesign,
  DESIGN_22_EARLY,
  dockRecordFromCeiling,
  evaluateAmcFleetLimit,
  HULL_TYPE_FOR_SHIP_TYPE,
  newConstructionDockEligibility,
  resolveConstructionModifiers,
  type AvailabilityReason,
  type DesignDraft,
  type ShipBuildingContent,
} from "@bluewave/ship-design";

/** Stable codes the construction-order check adds to the ship-type availability reasons. */
export type OrderRejectionCode =
  | AvailabilityReason["code"]
  | "DESIGN_REVALIDATION_FAILED"
  | "DESIGN_REVALIDATION_UNAVAILABLE"
  | "SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT"
  | "DOCK_LIMIT_MISSING";

export interface OrderRejection {
  readonly code: OrderRejectionCode;
  readonly message: string;
}

export interface OrderEligibility {
  readonly eligible: boolean;
  readonly rejections: readonly OrderRejection[];
}

/**
 * Hull types that count as a "cruiser" for the DESIGN-22 section 15 AMC allowance: the canonical CA and CL (the
 * opening campaign's armoured and protected cruisers) and the older authored labels for the same two types. A
 * battlecruiser is a capital ship, DD/KE are not cruisers, and an AMC never counts toward its own allowance.
 */
const CRUISER_HULL_TYPES: ReadonlySet<string> = new Set([
  HULL_TYPE_FOR_SHIP_TYPE.CA,
  HULL_TYPE_FOR_SHIP_TYPE.CL,
  "heavy_cruiser",
  "light_cruiser",
]);
const AMC_HULL_TYPE = HULL_TYPE_FOR_SHIP_TYPE.AMC;

/**
 * The fleet a new AMC order is measured against (DESIGN-22 section 15, ADR-0088):
 * - `cruisers`: ships of a cruiser hull type that are commissioned and operational. A hull still building, or made
 *   unavailable by a rebuild (the engine's only reserve-like state), is not an "active commissioned" cruiser.
 * - `amc` / `fastAmc`: every AMC of the nation, commissioned or still building (a queued order counts at once, so the
 *   limit cannot be exceeded by ordering several before any is launched), whatever its availability: an AMC in a
 *   dockyard is still part of the auxiliary fleet.
 * A fast AMC is one whose designed speed is at or above `amcFastSpeedUms` (22 kn).
 */
export function auxiliaryFleetCounts(
  snapshot: CampaignSnapshot,
  nationId: string,
  /** A project being replaced by the order under test: it is not counted. */
  excludeProjectId?: string,
  fastSpeedUms: number = DESIGN_22_EARLY.amcFastSpeedUms,
): { cruisers: number; amc: number; fastAmc: number } {
  const nation = snapshot["nations"].get(nationId);
  const out = { cruisers: 0, amc: 0, fastAmc: 0 };
  if (!nation) return out;
  const countAmc = (design: CompiledDesignVersion): void => {
    out.amc += 1;
    if (Number(design.normalizedSpeedUms) >= fastSpeedUms) out.fastAmc += 1;
  };
  for (const fleet of nation["fleets"])
    for (const ship of fleet["ships"]) {
      const design = snapshot["designs"].get(ship["designVersionId"]);
      if (!design) continue;
      if (design.hullType === AMC_HULL_TYPE) countAmc(design);
      else if (CRUISER_HULL_TYPES.has(design.hullType) && isShipOperational(ship))
        out.cruisers += 1;
    }
  for (const p of nation["constructionProjects"]) {
    if (
      p["type"] !== "ship" ||
      p["projectType"] !== "NEW_CONSTRUCTION" ||
      p["status"] === "COMPLETED" ||
      p["id"] === excludeProjectId
    )
      continue;
    const design = snapshot["designs"].get(p["designVersionId"]);
    if (design?.hullType === AMC_HULL_TYPE) countAmc(design);
  }
  return out;
}

/**
 * Whether the player may place a construction order for a design now (application layer, ADR-0088):
 *  1. a design made from a draft is compiled again under today's rules, so a component made obsolete, a treaty or a
 *     ruleset change that now blocks it stops the order instead of reaching the yard;
 *  2. an armed merchant cruiser is checked against the auxiliary fleet limits.
 * Authored designs have no draft and skip the first check (their legality is the content's, not the designer's).
 */
export function constructionOrderEligibility(
  snapshot: CampaignSnapshot,
  design: CompiledDesignVersion,
  content: ShipBuildingContent | undefined,
  month: string,
  replacingProjectId?: string,
): OrderEligibility {
  const rejections: OrderRejection[] = [];
  if (design.sourceDraft !== undefined) {
    if (content === undefined)
      rejections.push({
        code: "DESIGN_REVALIDATION_UNAVAILABLE",
        message: "The ship-building content is not loaded, so the design cannot be revalidated.",
      });
    else {
      try {
        const compiled = compileDesign(
          design.sourceDraft as unknown as DesignDraft,
          content.environmentFor(month).ctx,
        );
        if (!compiled.valid)
          rejections.push({
            code: "DESIGN_REVALIDATION_FAILED",
            message: `The design no longer passes validation: ${compiled.findings
              .filter((f) => f.severity === "BLOCKING")
              .map((f) => f.id)
              .join(", ")}.`,
          });
      } catch (e) {
        rejections.push({
          code: "DESIGN_REVALIDATION_FAILED",
          message: `The design could not be revalidated: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }
  }
  if (design.hullType === AMC_HULL_TYPE) {
    // The limits are ruleset data (`ShipBalance.classification`); a pack that sets none gets the DESIGN-22 EARLY values.
    const rules = content?.environmentFor(month).ctx.balance.classification ?? DESIGN_22_EARLY;
    const limit = evaluateAmcFleetLimit(
      Number(design.normalizedSpeedUms),
      auxiliaryFleetCounts(snapshot, design.nationId, replacingProjectId, rules.amcFastSpeedUms),
      rules,
    );
    rejections.push(...limit.reasons);
  }
  // DESIGN-16 section 4.2: a domestic order must fit the nation's dock ceiling (the largest hull its own yards can
  // build, authored as the industrial `maxPracticalDisplacementKg`). Foreign orders bypass this via the design's
  // foreign-yard contract (SB3-R20, later increment).
  const profile = content?.navalProfileFor(design.nationId, month) ?? null;
  if (profile !== null) {
    const ceiling = resolveConstructionModifiers(profile, month).maxPracticalDisplacementKg;
    const fit = newConstructionDockEligibility(dockRecordFromCeiling(ceiling), {
      lengthMm: 0,
      beamMm: 0,
      displacementKg: Number(design.normalizedDisplacementKg),
      heaviestKg: 0,
    });
    rejections.push(...fit.rejections);
  }
  return { eligible: rejections.length === 0, rejections };
}
