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
import { catalogueForNation } from "./componentVariants.js";
import { type NationNavalProfile, resolveNavalProfile } from "./nationProfile.js";
import type { AuthoredArmamentContent } from "./armamentContent.js";
import type { StarterDesign } from "./shipTypeRoster.js";
import type { DesignDraft } from "./compileShared.js";
import type { CompiledPartModel, ReferenceDesignLoadoutData } from "@bluewave/content-schema";
import { buildProductionPartModel } from "./compileProduction.js";
import { platformSlots } from "./partCompatibility.js";
import { rebuildDraft } from "./partCatalogueReaders.js";

/** A raw reference-design entry as authored in `reference-designs.yaml` (its `starterFor` is optional). */
export interface RawReferenceDesign {
  readonly id: string;
  readonly name: string;
  readonly month: string;
  readonly starterFor?: string;
  readonly draft: DesignDraft;
}

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
  /** National naval profiles (optional): when present, a nation's catalogue and capabilities are derived from them. */
  readonly navalProfiles?: readonly NationNavalProfile[];
  /** First-class armament content (optional, ADR-0093 Step 3): drives authoritative weapon resolution. */
  readonly armament?: AuthoredArmamentContent;
  /** Reference designs (optional): the starter designs the AI may base a procurement candidate on. */
  readonly referenceDesigns?: readonly RawReferenceDesign[];
  /**
   * The compiled part model and the authoritative reference-design loadouts
   * (ship-part-model ticket 11d). When both are present, reference designs are
   * rebuilt from their loadouts — the parts are authoritative and the legacy
   * `referenceDesigns` array is the harness baseline only.
   */
  readonly partModel?: CompiledPartModel;
  readonly designLoadouts?: readonly ReferenceDesignLoadoutData[];
}

/** Everything a caller needs, built once. `environmentFor(month)` is pure: same data and month, same environment. */
export interface ShipBuildingContent {
  readonly components: readonly ComponentDef[];
  readonly plants: readonly PropulsionPlant[];
  readonly hullForms: readonly HullFormRecord[];
  /** `environmentFor(month)` is nation-neutral; passing a nationId derives that nation's catalogue and capabilities. */
  readonly environmentFor: (month: string, nationId?: string) => WorkshopEnvironment;
  /** Ruleset constant for the engine projection (displacement per hit point). */
  readonly kgPerHitPoint: number;
  /** Micro-pounds per treasury unit, to turn the cost model's pounds into the engine's units. */
  readonly treasuryUnitMicro: number;
  readonly aiEnvironmentFor: (month: string, nationId?: string) => AiEnvironment;
  /** Revision-tier thresholds, or null when the pack has none. */
  readonly revision: RevisionBalance | null;
  /** Retained-hull limits of a rebuild, or null when the pack has none. */
  readonly rebuild: RebuildBalance | null;
  /** Design-study rules, or null when the pack has none (designs are then approved without a study). */
  readonly study: StudyBalance | null;
  /** National naval profiles, or empty when the pack has none. */
  readonly navalProfiles: readonly NationNavalProfile[];
  /** First-class armament content, or null when the pack has none (the compatibility path). */
  readonly armament: AuthoredArmamentContent | null;
  /** The profile active for a nation at a month, or null. */
  readonly navalProfileFor: (nationId: string, month: string) => NationNavalProfile | null;
  /** Starter designs (a reference design with a `starterFor`), for AI procurement candidate generation. */
  readonly starterDesigns: readonly StarterDesign[];
}

/** Technology is available once its year has begun; month ids are YYYY-MM. */
export function unlockedTechIds(
  techs: ShipBuildingData["technologies"],
  month: string,
): Set<string> {
  const year = Number(month.slice(0, 4));
  return new Set(techs.filter((t) => t.year <= year).map((t) => t.id));
}

/**
 * Rebuild the authoritative reference designs from their parts loadouts (ticket 11d). The
 * inverse readers reconstruct each legacy `DesignDraft` from the part model, so the catalogues
 * and the AI read exactly the activated parts content. A loadout that cannot rebuild is a
 * content error, never a silently dropped design.
 */
export function referenceDesignsFromLoadouts(
  loadouts: readonly ReferenceDesignLoadoutData[],
  model: CompiledPartModel,
): RawReferenceDesign[] {
  const production = buildProductionPartModel({
    parts: Object.values(model.partIndex.byId),
    slotTemplates: model.slotTemplates,
    platforms: model.platforms,
  });
  return loadouts.map((loadout) => {
    const slots = platformSlots(production.compatibility, loadout.loadout.platform) ?? [];
    const rebuilt = rebuildDraft({
      designId: loadout.id,
      header: loadout.header,
      loadout: loadout.loadout,
      partOf: production.partOf,
      slotOf: (slotId) => slots.find((slot) => slot.id === slotId),
    });
    if (rebuilt.draft === null || rebuilt.issues.length > 0) {
      throw new Error(`reference design '${loadout.id}' does not rebuild from its parts loadout`);
    }
    return {
      id: loadout.id,
      name: loadout.name,
      month: loadout.month,
      ...(loadout.starterFor === undefined ? {} : { starterFor: loadout.starterFor }),
      draft: rebuilt.draft,
    };
  });
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
  const profiles = data.navalProfiles ?? [];
  // The authoritative source of reference designs is the parts loadouts when the pack carries
  // them; the legacy `referenceDesigns` array remains the equivalence-harness baseline.
  const referenceDesigns =
    data.partModel !== undefined && data.designLoadouts !== undefined
      ? referenceDesignsFromLoadouts(data.designLoadouts, data.partModel)
      : (data.referenceDesigns ?? []);
  const environmentFor = (month: string, nationId?: string): WorkshopEnvironment => {
    const profile = nationId === undefined ? null : resolveNavalProfile(profiles, nationId, month);
    const selection = profile === null ? null : catalogueForNation(data.components, profile, month);
    const ctx: WorkshopEnvironment["ctx"] = {
      month,
      unlockedTechs: unlockedTechIds(data.technologies, month),
      catalogue: selection?.catalogue ?? data.components,
      plants: data.plants,
      hullForms: forms,
      threats: data.balance.environment.threats,
      facilities: data.balance.environment.facilities,
      treaty: null,
      balance: ship,
      armamentContent: data.armament ?? null,
      // Classification, availability and the fit requirements read the compiled ship-type registry
      // (ADR-0156, ticket 12b) when the pack carries one; a pack without parts content falls back
      // to the code registry, whose values the 12a regression pins equal.
      ...(data.partModel === undefined ? {} : { shipTypes: data.partModel.partIndex.shipTypes }),
      ...(profile !== null
        ? {
            capabilities: new Set(profile.hardCapabilities.grants),
            restrictedShipTypes: profile.hardCapabilities.restrictedShipTypes,
            navalProfile: profile,
          }
        : {}),
    };
    return {
      ctx,
      costBalance: data.balance.cost,
      costCtx: { maturityBpByTech: {}, firstOfClass: true },
      constructionBalance: data.balance.construction,
      cveBalance: data.balance.cve,
      yards,
    };
  };
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
    navalProfiles: profiles,
    armament: data.armament ?? null,
    navalProfileFor: (nationId, month) => resolveNavalProfile(profiles, nationId, month),
    starterDesigns: referenceDesigns
      .filter((r): r is RawReferenceDesign & { starterFor: string } => r.starterFor !== undefined)
      .map((r) => ({
        id: r.id,
        name: r.name,
        month: r.month,
        starterFor: r.starterFor,
        draft: r.draft,
      })),
    aiEnvironmentFor: (month, nationId) => {
      if (!data.balance.ai) throw new Error("ship-building balance has no 'ai' section");
      const env = environmentFor(month, nationId);
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
