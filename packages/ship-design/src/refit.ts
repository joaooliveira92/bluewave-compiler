import { armourAvailabilityFindings, type ArmourRegion, type ArmourRegionId } from "./armour.js";
import type { ComponentCategory } from "./component.js";
import {
  compileDesign,
  type CompiledDesign,
  type DesignDraft,
  type PlacementSpec,
  type ShipContext,
} from "./compile.js";
import { computeCost, type CostBalance, type CostContext } from "./cost.js";
import type { Finding } from "./findings.js";
import { sortFindings } from "./findings.js";
import { bp, kg } from "./units.js";

export type RefitKind =
  | "MAINTENANCE_REFIT"
  | "SENSOR_FC_UPDATE"
  | "AA_UPGRADE"
  | "MACHINERY_REFIT"
  | "REARMAMENT"
  | "ARMOUR_MODIFICATION"
  | "BULGE"
  | "AVIATION_CONVERSION"
  | "MAJOR_RECONSTRUCTION"
  | "ROLE_CONVERSION";

/** DESIGN-23 project type each refit kind runs as (spec §16.1). */
export type RefitProjectType = "REPAIR" | "EQUIPMENT_INSTALLATION" | "REBUILD" | "CONVERSION";

export interface RefitKindRule {
  readonly projectType: RefitProjectType;
  /** Component categories that may be added or removed by this kind. */
  readonly allowedCategories: readonly ComponentCategory[];
  readonly minRemainingLifeMonths: number;
  /** The hull may not be this fatigued to start the refit, bp. */
  readonly maxHullFatigueBp: number;
  readonly fatigueGainBp: number;
  readonly costMultiplierBp: number;
  readonly minMonths: number;
  readonly lifeExtensionMonths: number;
}

export interface RefitBalance {
  readonly rules: Readonly<Record<RefitKind, RefitKindRule>>;
  /** Cost to strip fitted equipment, bp of its cost. */
  readonly removalCostBp: number;
  /** Growth budget consumed per removed kg (holes cut in structure), bp. */
  readonly holeGrowthBp: number;
  readonly uneconomicalBp: number;
  readonly uneconomicalHardBp: number;
  /** Money that buys one work unit, to turn cost into dock time. */
  readonly costPerWorkMicro: number;
  /**
   * BULGE refit (RTW3 manual p. 32; ADR-0067 §3): the torpedo-protection gain credited to a bulged ship, bp. The
   * speed penalty is realised by the blister's added hull mass through the normal compile (BALANCE TARGET).
   */
  readonly bulgeProtectionGainBp: number;
  /** Declared nominal speed penalty of a bulge, bp of the ship's speed, recorded for evidence (BALANCE TARGET). */
  readonly bulgeSpeedPenaltyBp: number;
}

/** What a built ship carries between refits: the finite budgets that stop unlimited upgrading (spec §16.3). */
export interface ShipState {
  readonly design: DesignDraft;
  readonly growthBudgetKg: number;
  readonly hullFatigueBp: number;
  readonly remainingServiceMonths: number;
  readonly refitCount: number;
}

export interface RefitPlan {
  readonly kind: RefitKind;
  readonly removeInstanceIds: readonly string[];
  readonly add: readonly PlacementSpec[];
  /**
   * Armour regions to add or replace (matched by `region`), e.g. +1 in of DECK_MAIN or a changed BELT_UPPER. Legal only
   * under ARMOUR_MODIFICATION (RTW3 manual p. 32; ADR-0067 §3). Applied after `armourRemove`.
   */
  readonly armourSet?: readonly ArmourRegion[];
  /** Armour regions to strip (e.g. CONNING_TOWER). Legal only under ARMOUR_MODIFICATION. */
  readonly armourRemove?: readonly ArmourRegionId[];
  /**
   * The blister a `BULGE` refit adds (RTW3 manual p. 32): its added hull mass drives the speed penalty through the
   * normal compile, which also accounts for the displacement and stability it brings. Legal only under `BULGE`.
   */
  readonly bulge?: { readonly massKg: number };
}

export interface RefitEvaluation {
  readonly legal: boolean;
  readonly findings: readonly Finding[];
  readonly newDesign: DesignDraft;
  readonly before: CompiledDesign;
  readonly after: CompiledDesign;
  readonly netAddedKg: number;
  readonly costMicro: number;
  readonly replacementCostMicro: number;
  readonly costRatioBp: number;
  readonly monthsOutOfService: number;
  readonly projectType: RefitProjectType;
  /** Torpedo-protection gain credited by a `BULGE` refit, bp; 0 for every other kind (RTW3 manual p. 32). */
  readonly bulgeProtectionGainBp: number;
  /** The ship as it would be after the refit; identical to the input when not legal. */
  readonly nextState: ShipState;
}

const f = (
  id: string,
  severity: Finding["severity"],
  what: string,
  why: string,
  consequence: string,
  remedies: [string, string][],
  threshold = 0,
  value = 1,
): Finding => ({
  id,
  severity,
  what,
  why,
  consequence,
  remedies: remedies.map(([rid, description]) => ({ id: rid, description })),
  evidence: { formulaId: "REFIT", inputs: {}, threshold, value },
});
// Reported once, for the installed plate only, by the explicit gate above.
const ARMOUR_GATE_IDS: ReadonlySet<string> = new Set([
  "ARMOUR_TECH_UNAVAILABLE",
  "ARMOUR_THICKNESS_UNAVAILABLE",
]);
const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Evaluates a refit as a diff on the built ship: the whole compile pipeline runs on the modified design, so mass, volume,
 * stability, power, cooling and crew are all accounted for (I5). Pre-existing problems do not block; new BLOCKING or
 * CRITICAL findings do.
 */
export function evaluateRefit(
  ship: ShipState,
  plan: RefitPlan,
  ctx: ShipContext,
  balance: RefitBalance,
  costBalance: CostBalance,
  costCtx: CostContext,
  quayCapacityWorkPerMonth: number,
): RefitEvaluation {
  const rule = balance.rules[plan.kind];
  const findings: Finding[] = [];
  const catOf = (componentId: string) => ctx.catalogue.find((c) => c.id === componentId)?.category;

  // BULGE (RTW3 manual p. 32): a blister is required, and only a BULGE refit may add one.
  const bulgeMassKg =
    plan.bulge !== undefined && plan.kind === "BULGE" ? Math.max(0, Math.floor(plan.bulge.massKg)) : 0;
  if (plan.kind === "BULGE" && plan.bulge === undefined)
    findings.push(
      f(
        "REFIT_BULGE_REQUIRED",
        "BLOCKING",
        "A bulge refit needs a blister.",
        "No bulge mass was given, so there is nothing to build.",
        "The plan cannot be carried out.",
        [
          ["add_bulge", "Specify the blister's added mass."],
          ["use_kind", "Choose a different refit kind."],
          ["drop", "Drop the bulge from the plan."],
        ],
      ),
    );
  if (plan.bulge !== undefined && plan.kind !== "BULGE")
    findings.push(
      f(
        "REFIT_BULGE_KIND_MISMATCH",
        "BLOCKING",
        `A bulge cannot be added in a ${plan.kind} refit.`,
        "Only a BULGE refit adds a torpedo blister.",
        "A refit of this kind cannot bulge the hull.",
        [
          ["use_kind", "Plan a BULGE refit instead."],
          ["drop", "Remove the bulge from the plan."],
          ["reconstruct", "Plan a major reconstruction instead."],
        ],
      ),
    );

  // Build the modified design.
  const existing = new Map(ship.design.placements.map((p) => [p.instanceId, p]));
  for (const id of plan.removeInstanceIds) {
    if (!existing.has(id))
      findings.push(
        f(
          "REFIT_UNKNOWN_TARGET",
          "BLOCKING",
          `Nothing to remove: ${id}.`,
          "The ship has no such fitting.",
          "The plan cannot be carried out.",
          [
            ["fix_plan", "Remove the entry from the plan."],
            ["pick_other", "Choose an installed fitting."],
            ["resurvey", "Re-survey the ship design."],
          ],
        ),
      );
  }
  for (const p of plan.add) {
    if (existing.has(p.instanceId) && !plan.removeInstanceIds.includes(p.instanceId)) {
      findings.push(
        f(
          "REFIT_DUPLICATE_INSTANCE",
          "BLOCKING",
          `${p.instanceId} already exists.`,
          "Added fittings need new ids.",
          "Ambiguous design.",
          [
            ["rename", "Rename the new fitting."],
            ["remove_old", "Remove the old one in the same refit."],
            ["drop", "Drop the addition."],
          ],
        ),
      );
    }
  }
  const touched = [
    ...plan.removeInstanceIds.map((id) => existing.get(id)?.componentId),
    ...plan.add.map((p) => p.componentId),
  ].filter((x): x is string => x !== undefined);
  for (const cid of touched) {
    const cat = catOf(cid);
    if (cat === undefined || !rule.allowedCategories.includes(cat)) {
      findings.push(
        f(
          "REFIT_KIND_MISMATCH",
          "BLOCKING",
          `${cid} is not part of a ${plan.kind} refit.`,
          `Category ${cat ?? "unknown"} is outside this refit kind.`,
          "A refit of this kind cannot touch that equipment.",
          [
            ["use_kind", "Choose the refit kind that covers this equipment."],
            ["drop", "Remove it from the plan."],
            ["reconstruct", "Plan a major reconstruction instead."],
          ],
        ),
      );
    }
  }
  const stripped = ship.design.placements.filter(
    (p) =>
      !plan.removeInstanceIds.includes(p.instanceId) &&
      !plan.removeInstanceIds.includes(p.magazineRef ?? ""),
  );
  const armourSet = plan.armourSet ?? [];
  const armourRemove = plan.armourRemove ?? [];
  if ((armourSet.length > 0 || armourRemove.length > 0) && plan.kind !== "ARMOUR_MODIFICATION") {
    findings.push(
      f(
        "REFIT_ARMOUR_KIND_MISMATCH",
        "BLOCKING",
        `Armour cannot be changed in a ${plan.kind} refit.`,
        "Only an armour modification may add, remove or alter armour regions.",
        "A refit of this kind cannot touch the armour.",
        [
          ["use_kind", "Plan an armour modification instead."],
          ["drop", "Remove the armour changes from the plan."],
          ["reconstruct", "Plan a major reconstruction instead."],
        ],
      ),
    );
  }
  // Same gate as the design compile, applied to the plate the refit installs (a pre-existing region is not re-judged).
  findings.push(
    ...armourAvailabilityFindings(armourSet, ctx.balance.armour, ctx.month, ctx.unlockedTechs).map(
      (x) => ({ ...x, id: `REFIT_${x.id}` }),
    ),
  );
  const haveRegions = new Set(ship.design.armour.regions.map((r) => r.region));
  for (const region of armourRemove) {
    if (!haveRegions.has(region))
      findings.push(
        f(
          "REFIT_UNKNOWN_TARGET",
          "BLOCKING",
          `Nothing to remove: armour region ${region}.`,
          "The ship has no such armour region.",
          "The plan cannot be carried out.",
          [
            ["fix_plan", "Remove the entry from the plan."],
            ["pick_other", "Choose an armoured region."],
            ["resurvey", "Re-survey the ship design."],
          ],
        ),
      );
  }
  const replaced = new Map(armourSet.map((a) => [a.region, a]));
  const kept = ship.design.armour.regions
    .filter((r) => !armourRemove.includes(r.region))
    .map((r) => replaced.get(r.region) ?? r);
  const armourRegions = [
    ...kept,
    ...[...replaced.values()].filter((a) => !haveRegions.has(a.region)),
  ];
  const newDesign: DesignDraft = {
    ...ship.design,
    placements: [...stripped, ...plan.add],
    armour:
      armourSet.length > 0 || armourRemove.length > 0
        ? { ...ship.design.armour, regions: armourRegions }
        : ship.design.armour,
  };

  const before = compileDesign(ship.design, ctx);
  // A bulge grows the hull: the added blister mass is carried into the compile, so displacement, stability and speed
  // are re-derived and the speed penalty emerges from the heavier hull with the same installed power.
  const shaped: DesignDraft =
    bulgeMassKg > 0
      ? {
          ...newDesign,
          hull: {
            ...newDesign.hull,
            targetDisplacementKg: kg(newDesign.hull.targetDisplacementKg + bulgeMassKg),
          },
        }
      : newDesign;
  const rawAfter = compileDesign(shaped, ctx);
  const netAddedKg =
    rawAfter.ledger.armament +
    rawAfter.ledger.ammunition +
    rawAfter.ledger.sensors +
    rawAfter.ledger.mission +
    rawAfter.ledger.auxiliary +
    rawAfter.ledger.machinery +
    rawAfter.ledger.crew +
    rawAfter.ledger.armour -
    (before.ledger.armament +
      before.ledger.ammunition +
      before.ledger.sensors +
      before.ledger.mission +
      before.ledger.auxiliary +
      before.ledger.machinery +
      before.ledger.crew +
      before.ledger.armour) +
    bulgeMassKg;
  // The refit spends the ship's growth budget instead of paying a fresh margin: keep margin and reserve as built.
  const subtotalAfter = rawAfter.totalKg - rawAfter.ledger.margin - rawAfter.ledger.reserve;
  const marginBp =
    subtotalAfter <= 0 ? 0 : Math.ceil((before.ledger.margin * 10_000) / subtotalAfter);
  const reserveAfter = Math.max(0, before.ledger.reserve - Math.max(0, netAddedKg));
  const reserveBp = Math.ceil(
    (reserveAfter * 10_000) / Math.max(1, ship.design.hull.targetDisplacementKg),
  );
  const adjusted: DesignDraft = {
    ...shaped,
    hull: { ...shaped.hull, designMarginBp: bp(marginBp), growthReserveBp: bp(reserveBp) },
  };
  const after = compileDesign(adjusted, ctx);

  if (netAddedKg > ship.growthBudgetKg) {
    findings.push(
      f(
        "REFIT_GROWTH_EXCEEDED",
        "BLOCKING",
        "The hull cannot take this much extra weight.",
        `Net addition ${fmt(netAddedKg)} kg exceeds the remaining growth budget ${fmt(ship.growthBudgetKg)} kg.`,
        "The ship would sit too low and lose stability and structural margin.",
        [
          ["remove_equipment", "Remove older equipment of similar weight in the same refit."],
          ["lighter_option", "Choose lighter equipment."],
          ["scrap_replace", "Replace the ship instead."],
        ],
        ship.growthBudgetKg,
        netAddedKg,
      ),
    );
  }
  if (ship.hullFatigueBp > rule.maxHullFatigueBp) {
    findings.push(
      f(
        "HULL_WORN_OUT",
        "BLOCKING",
        "The hull is too worn for this refit.",
        `Hull fatigue ${ship.hullFatigueBp} bp exceeds ${rule.maxHullFatigueBp} bp.`,
        "Further work would shorten a hull that has little life left.",
        [
          ["cheaper_refit", "Limit the work to a maintenance refit."],
          ["role_conversion", "Convert to a harbour or training role."],
          ["scrap", "Scrap and replace."],
        ],
        rule.maxHullFatigueBp,
        ship.hullFatigueBp,
      ),
    );
  }
  if (ship.remainingServiceMonths < rule.minRemainingLifeMonths) {
    findings.push(
      f(
        "REFIT_SERVICE_LIFE_TOO_SHORT",
        "BLOCKING",
        "Too little service life remains to justify this refit.",
        `${ship.remainingServiceMonths} months left; ${plan.kind} needs ${rule.minRemainingLifeMonths}.`,
        "The investment would not be recovered.",
        [
          ["lesser_refit", "Do a lighter refit."],
          ["extend_life", "Do a maintenance refit first to extend life."],
          ["retire", "Retire the ship."],
        ],
        rule.minRemainingLifeMonths,
        ship.remainingServiceMonths,
      ),
    );
  }

  // New problems only (spec §16.2): pre-existing findings do not block.
  const baseline = new Set(before.findings.map((x) => `${x.severity}:${x.id}`));
  for (const x of after.findings) {
    if (
      (x.severity === "BLOCKING" || x.severity === "CRITICAL") &&
      !baseline.has(`${x.severity}:${x.id}`) &&
      !ARMOUR_GATE_IDS.has(x.id)
    ) {
      findings.push({ ...x, id: `REFIT_${x.id}`, what: `Refit would cause: ${x.what}` });
    }
  }

  // Cost, time, comparison with replacement.
  const costOf = (d: DesignDraft, c: CompiledDesign) => computeCost(c, d, costBalance, costCtx);
  const oldCost = costOf(ship.design, before).total;
  const newCost = costOf(adjusted, after).total;
  const addedCost = Math.max(0, newCost - oldCost);
  const removedFitted = before.components
    .filter((k) => plan.removeInstanceIds.includes(k.instanceId))
    .reduce((a, k) => a + k.costMicro, 0);
  const base = addedCost + Math.floor((removedFitted * balance.removalCostBp) / 10_000);
  const costMicro = Math.floor((base * rule.costMultiplierBp) / 10_000);
  const replacementCostMicro = newCost;
  const costRatioBp =
    replacementCostMicro <= 0 ? 0 : Math.floor((costMicro * 10_000) / replacementCostMicro);
  if (costRatioBp >= balance.uneconomicalHardBp) {
    findings.push(
      f(
        "REFIT_UNECONOMICAL_HARD",
        "BLOCKING",
        "This refit costs nearly as much as a new ship.",
        `Refit ${fmt(costMicro)} vs replacement ${fmt(replacementCostMicro)} (${costRatioBp} bp).`,
        "Money is better spent on a modern hull.",
        [
          ["smaller_scope", "Reduce the scope of the refit."],
          ["new_build", "Order a replacement."],
          ["retire", "Retire the ship."],
        ],
        balance.uneconomicalHardBp,
        costRatioBp,
      ),
    );
  } else if (costRatioBp >= balance.uneconomicalBp) {
    findings.push(
      f(
        "REFIT_UNECONOMICAL",
        "WARNING",
        "This refit is poor value against replacement.",
        `${costRatioBp} bp of replacement cost.`,
        "You pay most of a new ship for an old hull.",
        [
          ["smaller_scope", "Reduce the scope."],
          ["new_build", "Order a replacement."],
        ],
        balance.uneconomicalBp,
        costRatioBp,
      ),
    );
  }
  const monthsOutOfService = Math.max(
    rule.minMonths,
    Math.ceil(
      costMicro / Math.max(1, balance.costPerWorkMicro) / Math.max(1, quayCapacityWorkPerMonth),
    ),
  );

  const removedKg = before.components
    .filter((k) => plan.removeInstanceIds.includes(k.instanceId))
    .reduce((a, k) => a + k.weightKg, 0);
  const legal = !findings.some((x) => x.severity === "BLOCKING" || x.severity === "CRITICAL");
  const nextState: ShipState = legal
    ? {
        design: adjusted,
        growthBudgetKg: Math.max(
          0,
          ship.growthBudgetKg -
            Math.max(0, netAddedKg) -
            Math.floor((removedKg * balance.holeGrowthBp) / 10_000),
        ),
        hullFatigueBp: ship.hullFatigueBp + rule.fatigueGainBp,
        remainingServiceMonths: ship.remainingServiceMonths + rule.lifeExtensionMonths,
        refitCount: ship.refitCount + 1,
      }
    : ship;
  return {
    legal,
    findings: sortFindings(findings),
    newDesign: adjusted,
    before,
    after,
    netAddedKg,
    costMicro,
    replacementCostMicro,
    costRatioBp,
    monthsOutOfService,
    projectType: rule.projectType,
    bulgeProtectionGainBp: plan.kind === "BULGE" && plan.bulge !== undefined ? balance.bulgeProtectionGainBp : 0,
    nextState,
  };
}
