import type { ArchetypeId, ArchetypeSpec, AiEnvironment } from "./ai.js";
import type { ComponentDef } from "./component.js";
import type { ConstructionBalance } from "./construction.js";
import { LINE_IDS, type LineId } from "./construction.js";
import {
  hullFormsFromRecords,
  shipBalanceFromRecord,
  type HullFormRecord,
} from "./contextBuilder.js";
import type { CostBalance } from "./cost.js";
import type { CveBalance } from "./cve.js";
import type { Facility } from "./compile.js";
import type { PropulsionPlant } from "./machinery.js";
import type { ThreatProfile } from "./armour.js";
import type { WorkshopEnvironment } from "./workshop.js";

/** Parsed (not yet interpreted) ship-building data: the YAML files of content/production/<scenario>/ship-building. */
export interface ShipBuildingData {
  readonly components: readonly ComponentDef[];
  readonly plants: readonly PropulsionPlant[];
  readonly hullForms: readonly HullFormRecord[];
  readonly balance: {
    readonly ship: unknown;
    readonly cost: CostBalance;
    readonly construction: ConstructionBalance;
    readonly cve: CveBalance;
    readonly ai?: Readonly<Record<ArchetypeId, ArchetypeSpec>>;
    readonly environment: {
      readonly threats: readonly ThreatProfile[];
      readonly facilities: readonly Facility[];
      readonly yardCapacityWorkPerMonth: number;
      readonly kgPerHitPoint: number;
    };
  };
  /** Technology id and the year it becomes available, from the scenario's technology list. */
  readonly technologies: readonly { readonly id: string; readonly year: number }[];
}

/** Everything a caller needs, built once. `environmentFor(month)` is pure: same data and month, same environment. */
export interface ShipBuildingContent {
  readonly components: readonly ComponentDef[];
  readonly plants: readonly PropulsionPlant[];
  readonly hullForms: readonly HullFormRecord[];
  readonly environmentFor: (month: string) => WorkshopEnvironment;
  /** Ruleset constant for the engine projection (displacement per hit point). */
  readonly kgPerHitPoint: number;
  readonly aiEnvironmentFor: (month: string) => AiEnvironment;
}

/** Technology is available once its year has begun; month ids are YYYY-MM. */
export function unlockedTechIds(
  techs: ShipBuildingData["technologies"],
  month: string,
): Set<string> {
  const year = Number(month.slice(0, 4));
  return new Set(techs.filter((t) => t.year <= year).map((t) => t.id));
}

export function buildShipBuildingContent(data: ShipBuildingData): ShipBuildingContent {
  const ship = shipBalanceFromRecord(data.balance.ship);
  const forms = hullFormsFromRecords(data.hullForms);
  const yardCapacity = Object.fromEntries(
    LINE_IDS.map((l) => [l, data.balance.environment.yardCapacityWorkPerMonth]),
  ) as Record<LineId, number>;
  const environmentFor = (month: string): WorkshopEnvironment => ({
    ctx: {
      month,
      unlockedTechs: unlockedTechIds(data.technologies, month),
      catalogue: data.components,
      plants: data.plants,
      hullForms: forms,
      threats: data.balance.environment.threats,
      facilities: data.balance.environment.facilities,
      treaty: null,
      balance: ship,
    },
    costBalance: data.balance.cost,
    costCtx: { maturityBpByTech: {}, firstOfClass: true },
    constructionBalance: data.balance.construction,
    cveBalance: data.balance.cve,
    yardCapacity,
  });
  return {
    components: data.components,
    plants: data.plants,
    hullForms: data.hullForms,
    environmentFor,
    kgPerHitPoint: data.balance.environment.kgPerHitPoint,
    aiEnvironmentFor: (month) => {
      if (!data.balance.ai) throw new Error("ship-building balance has no 'ai' section");
      const env = environmentFor(month);
      return {
        ctx: env.ctx,
        costBalance: env.costBalance,
        costCtx: env.costCtx,
        cveBalance: env.cveBalance,
        archetypes: data.balance.ai,
        budgetMicro: null,
      };
    },
  };
}
