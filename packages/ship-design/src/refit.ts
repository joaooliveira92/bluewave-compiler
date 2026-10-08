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
import { bp } from "./units.js";

export type RefitKind =
  | "MAINTENANCE_REFIT"
  | "SENSOR_FC_UPDATE"
  | "AA_UPGRADE"
  | "MACHINERY_REFIT"
  | "REARMAMENT"
  | "ARMOUR_MODIFICATION"
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
  const newDesign: DesignDraft = { ...ship.design, placements: [...stripped, ...plan.add] };

  const before = compileDesign(ship.design, ctx);
  const rawAfter = compileDesign(newDesign, ctx);
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
      before.ledger.armour);
  // The refit spends the ship's growth budget instead of paying a fresh margin: keep margin and reserve as built.
  const subtotalAfter = rawAfter.totalKg - rawAfter.ledger.margin - rawAfter.ledger.reserve;
  const marginBp =
    subtotalAfter <= 0 ? 0 : Math.ceil((before.ledger.margin * 10_000) / subtotalAfter);
  const reserveAfter = Math.max(0, before.ledger.reserve - Math.max(0, netAddedKg));
  const reserveBp = Math.ceil(
    (reserveAfter * 10_000) / Math.max(1, ship.design.hull.targetDisplacementKg),
  );
  const adjusted: DesignDraft = {
    ...newDesign,
    hull: { ...newDesign.hull, designMarginBp: bp(marginBp), growthReserveBp: bp(reserveBp) },
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
      !baseline.has(`${x.severity}:${x.id}`)
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
    nextState,
  };
}
