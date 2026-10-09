import type { ArchetypeId, ArchetypeSpec, AiEnvironment } from "./ai.js";
import type { ComponentDef } from "./component.js";
import type { ConstructionBalance } from "./construction.js";
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
import { checkRebuildBalance, type RebuildBalance } from "./rebuild.js";
import { checkRevisionBalance, type RevisionBalance } from "./revision.js";
import { checkStudyBalance, type StudyBalance } from "./study.js";
import { buildYards } from "./yards.js";

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
    /** Revision-tier thresholds (spec 15.4); absent in older packs, in which case revisions are refused. */
    readonly revision?: RevisionBalance;
    /** Retained-hull limits of a rebuild (DESIGN-23 section 21); absent in older packs, in which case rebuilds are refused. */
    readonly rebuild?: RebuildBalance;
    /** Design studies (DESIGN-21 sections 3 and 18, ADR-0085); absent in older packs, in which case designs need no study. */
    readonly study?: StudyBalance;
    readonly environment: {
      readonly threats: readonly ThreatProfile[];
      readonly facilities: readonly Facility[];
      /** Work micro-units per month per line per tonne of a yard's maxDisplacement (ADR-0067 section 6). */
      readonly yardWorkPerTonneMonth: number;
      readonly kgPerHitPoint: number;
      /** Micro-pounds per treasury unit (campaign treasury and project work are counted in these units). */
      readonly treasuryUnitMicro: number;
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
  /** Micro-pounds per treasury unit, to turn the cost model's pounds into the engine's units. */
  readonly treasuryUnitMicro: number;
  readonly aiEnvironmentFor: (month: string) => AiEnvironment;
  /** Revision-tier thresholds, or null when the pack has none. */
  readonly revision: RevisionBalance | null;
  /** Retained-hull limits of a rebuild, or null when the pack has none. */
  readonly rebuild: RebuildBalance | null;
  /** Design-study rules, or null when the pack has none (designs are then approved without a study). */
  readonly study: StudyBalance | null;
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
  // A pack that has a study section must have all of it (DERIVED_DESIGN_DISCOUNT_CONTRACT_MISSING otherwise).
  const study = data.balance.study === undefined ? null : checkStudyBalance(data.balance.study);
  if (data.balance.rebuild !== undefined) {
    const problems = checkRebuildBalance(data.balance.rebuild);
    if (problems.length > 0)
      throw new Error(`invalid ship-building rebuild balance: ${problems.join("; ")}`);
  }
  if (data.balance.revision !== undefined) {
    const problems = checkRevisionBalance(data.balance.revision);
    if (problems.length > 0)
      throw new Error(`invalid ship-building revision balance: ${problems.join("; ")}`);
  }
  const ship = shipBalanceFromRecord(data.balance.ship);
  const forms = hullFormsFromRecords(data.hullForms);
  const yards = buildYards(
    data.balance.environment.facilities,
    data.balance.environment.yardWorkPerTonneMonth,
  );
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
    yards,
  });
  return {
    components: data.components,
    plants: data.plants,
    hullForms: data.hullForms,
    environmentFor,
    kgPerHitPoint: data.balance.environment.kgPerHitPoint,
    treasuryUnitMicro: data.balance.environment.treasuryUnitMicro,
    revision: data.balance.revision ?? null,
    rebuild: data.balance.rebuild ?? null,
    study,
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
