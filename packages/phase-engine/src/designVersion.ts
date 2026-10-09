import type { CompiledDesignVersion } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import {
  computeCost,
  toEngineDesign,
  treasuryCostUnits,
  type CompiledDesign,
  type DesignDraft,
  type CostBalance,
  type CostContext,
  type EngineAdapterOptions,
  type ShipBuildingContent,
} from "@bluewave/ship-design";

/** What the cost model needs to price a design in treasury units. */
export interface DesignPricing {
  readonly costBalance: CostBalance;
  readonly costCtx: CostContext;
  readonly treasuryUnitMicro: number;
}

/** Pricing inputs for a month from the ship-building content: the same cost model the Drawing Board forecast uses. */
export function pricingFor(content: ShipBuildingContent, month: string): DesignPricing {
  const env = content.environmentFor(month);
  return {
    costBalance: env.costBalance,
    costCtx: env.costCtx,
    treasuryUnitMicro: content.treasuryUnitMicro,
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
    constructionCostUnits: SafeInt(treasuryCostUnits(cost.total, pricing.treasuryUnitMicro)),
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
