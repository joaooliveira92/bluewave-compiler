import type { CompiledDesignVersion } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import {
  computeCost,
  constructionOrderPlan,
  toEngineDesign,
  treasuryCostUnits,
  type CompiledDesign,
  type DesignDraft,
  type ConstructionBalance,
  type CostBalance,
  type CostContext,
  type EngineAdapterOptions,
  type ShipBuildingContent,
  type Yard,
} from "@bluewave/ship-design";

/** What the cost model needs to price a design in treasury units. */
export interface DesignPricing {
  readonly costBalance: CostBalance;
  readonly costCtx: CostContext;
  readonly treasuryUnitMicro: number;
  /** Inputs for the construction plan an order carries (ADR-0077); without them a design version has no plan. */
  readonly construction?: {
    readonly balance: ConstructionBalance;
    readonly yards: readonly Yard[];
    readonly industryBp?: number | undefined;
    /** Keel-laying month for the era multiplier on build time (ADR-0080). */
    readonly month?: string | undefined;
  };
}

/** Pricing inputs for a month from the ship-building content: the same cost model the Drawing Board forecast uses. */
export function pricingFor(content: ShipBuildingContent, month: string): DesignPricing {
  const env = content.environmentFor(month);
  return {
    costBalance: env.costBalance,
    costCtx: env.costCtx,
    treasuryUnitMicro: content.treasuryUnitMicro,
    construction: {
      balance: env.constructionBalance,
      yards: env.yards,
      industryBp: env.industryBp,
      month,
    },
  };
}

/**
 * Projects a compiled, valid design into the engine's immutable `CompiledDesignVersion` (ADR-0066) and keeps the
 * draft it came from (ADR-0070) so the design can later be revised. Shared by SubmitDesign and ReviseProject.
 */
export function buildDesignVersion(
  compiled: CompiledDesign,
  draft: DesignDraft,
  options: EngineAdapterOptions,
  pricing: DesignPricing,
): CompiledDesignVersion {
  const e = toEngineDesign(compiled, draft, options);
  const cost = computeCost(compiled, draft, pricing.costBalance, pricing.costCtx);
  const units = treasuryCostUnits(cost.total, pricing.treasuryUnitMicro);
  const orderPlan = pricing.construction
    ? constructionOrderPlan(
        {
          compiled,
          draft,
          cost,
          balance: pricing.construction.balance,
          yards: pricing.construction.yards,
          industryBp: pricing.construction.industryBp,
          month: pricing.construction.month,
          accelerated: pricing.costCtx.accelerated,
        },
        units,
      )
    : null;
  return {
    designVersionId: e.designVersionId,
    designFamilyId: e.designFamilyId,
    className: e.className,
    nationId: e.nationId,
    hullType: e.hullType,
    normalizedDisplacementKg: SafeInt(e.normalizedDisplacementKg),
    normalizedSpeedUms: SafeInt(e.normalizedSpeedUms),
    normalizedArmorUm: SafeInt(e.normalizedArmorUm),
    hitPoints: SafeInt(e.hitPoints),
    mainGunsCaliber: SafeInt(e.mainGunsCaliber),
    mainGunsCount: SafeInt(e.mainGunsCount),
    machineryType: e.machineryType,
    crewComplement: SafeInt(e.crewComplement),
    contentVersion: e.contentVersion,
    compiledHash: e.compiledHash,
    // A copy: the snapshot must not alias the command body (plain JSON, so structuredClone is exact).
    constructionCostUnits: SafeInt(units),
    ...(orderPlan
      ? {
          constructionPlan: {
            yardId: orderPlan.yardId,
            packages: orderPlan.packages.map((p) => ({
              id: p.id,
              kind: p.kind,
              line: p.line,
              totalWork: SafeInt(p.totalWork),
              dependsOn: [...p.dependsOn],
            })),
            capacityUnits: Object.fromEntries(
              Object.entries(orderPlan.capacityUnits).map(([line, v]) => [line, SafeInt(v)]),
            ),
          },
        }
      : {}),
    sourceDraft: structuredClone(draft) as unknown as Readonly<Record<string, unknown>>,
    ...(e.torpedoArmament
      ? {
          torpedoArmament: e.torpedoArmament.map((m) => ({
            mountType: m.mountType,
            tubeCount: SafeInt(m.tubeCount),
            torpedoModelId: m.torpedoModelId,
          })),
        }
      : {}),
  };
}
