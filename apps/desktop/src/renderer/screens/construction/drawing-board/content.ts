import {
  PropulsionPlantCatalogueSchema,
  ShipComponentCatalogueSchema,
  ShipHullFormCatalogueSchema,
} from "@bluewave/content-schema";
import {
  hullFormsFromRecords,
  LINE_IDS,
  shipBalanceFromRecord,
  type AiEnvironment,
  type ArchetypeId,
  type ArchetypeSpec,
  type ComponentDef,
  type ConstructionBalance,
  type CostBalance,
  type CveBalance,
  type DesignDraft,
  type HullFormRecord,
  type LineId,
  type PropulsionPlant,
  type WorkshopEnvironment,
} from "@bluewave/ship-design";
import { parse } from "yaml";
import balanceYaml from "@content/ship-building/balance.yaml?raw";
import componentsYaml from "@content/ship-building/components.yaml?raw";
import hullFormsYaml from "@content/ship-building/hull-forms.yaml?raw";
import plantsYaml from "@content/ship-building/plants.yaml?raw";
import referencesYaml from "@content/ship-building/reference-designs.yaml?raw";
import technologiesYaml from "@content/technologies.yaml?raw";

export interface ReferenceDesign {
  readonly id: string;
  readonly name: string;
  readonly month: string;
  readonly draft: DesignDraft;
}

/** Bundled EARLY-band ship-building content (v1). Campaign-pack delivery over the bridge replaces this in SB-14. */
export interface DrawingBoardContent {
  readonly components: readonly ComponentDef[];
  readonly plants: readonly PropulsionPlant[];
  readonly hullForms: readonly HullFormRecord[];
  readonly references: readonly ReferenceDesign[];
  readonly environmentFor: (month: string) => WorkshopEnvironment;
  readonly aiEnvironmentFor: (month: string) => AiEnvironment;
}

let cached: DrawingBoardContent | null = null;

export function loadDrawingBoardContent(): DrawingBoardContent {
  if (cached) return cached;
  const components = ShipComponentCatalogueSchema.parse(parse(componentsYaml))
    .components as ComponentDef[];
  const plants = PropulsionPlantCatalogueSchema.parse(parse(plantsYaml))
    .plants as unknown as PropulsionPlant[];
  const hullForms = ShipHullFormCatalogueSchema.parse(parse(hullFormsYaml))
    .hullForms as HullFormRecord[];
  const balance = parse(balanceYaml) as {
    ship: unknown;
    cost: CostBalance;
    construction: ConstructionBalance;
    cve: CveBalance;
    ai: Record<ArchetypeId, ArchetypeSpec>;
  };
  const ship = shipBalanceFromRecord(balance.ship);
  const techs = parse(technologiesYaml) as { id: string; year: number }[];
  const references = (parse(referencesYaml) as { designs: ReferenceDesign[] }).designs;
  const forms = hullFormsFromRecords(hullForms);
  const yardCapacity = Object.fromEntries(LINE_IDS.map((l) => [l, 2_000_000])) as Record<
    LineId,
    number
  >;

  const environmentFor = (month: string): WorkshopEnvironment => ({
    ctx: {
      month,
      unlockedTechs: new Set(
        techs.filter((t) => t.year <= Number(month.slice(0, 4))).map((t) => t.id),
      ),
      catalogue: components,
      plants,
      hullForms: forms,
      // Reference threat profiles: 12in/25 penetration is sourced; the QF values are ESTIMATE (see the research note).
      threats: [
        { id: "bl_12in", penetrationUm: 521_000 },
        { id: "bl_92in", penetrationUm: 300_000 },
        { id: "qf_6in", penetrationUm: 150_000 },
        { id: "qf_47in", penetrationUm: 100_000 },
        { id: "qf_12pdr", penetrationUm: 50_000 },
      ],
      facilities: [
        {
          id: "yard",
          maxLengthMm: 200_000,
          maxBeamMm: 40_000,
          maxDisplacementKg: 30_000_000,
          craneLiftKg: 250_000,
        },
      ],
      treaty: null,
      balance: ship,
    },
    costBalance: balance.cost,
    costCtx: { maturityBpByTech: {}, firstOfClass: true },
    constructionBalance: balance.construction,
    cveBalance: balance.cve,
    yardCapacity,
  });

  cached = {
    components,
    plants,
    hullForms,
    references,
    environmentFor,
    aiEnvironmentFor: (month) => {
      const env = environmentFor(month);
      return {
        ctx: env.ctx,
        costBalance: env.costBalance,
        costCtx: env.costCtx,
        cveBalance: env.cveBalance,
        archetypes: balance.ai,
        budgetMicro: null,
      };
    },
  };
  return cached;
}
