import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  PropulsionPlantCatalogueSchema,
  ShipComponentCatalogueSchema,
  ShipHullFormCatalogueSchema,
} from "@bluewave/content-schema";
import {
  hullFormsFromRecords,
  shipBalanceFromRecord,
  type ComponentDef,
  type CostBalance,
  type ConstructionBalance,
  type CveBalance,
  type HullFormRecord,
  type PropulsionPlant,
  type ShipContext,
} from "../../src/index.js";

const root = join(__dirname, "..", "..", "..", "..", "content", "production", "1880");
const load = (rel: string) =>
  parse(readFileSync(join(root, rel), "utf8")) as Record<string, unknown>;

export const components = ShipComponentCatalogueSchema.parse(load("ship-building/components.yaml"))
  .components as ComponentDef[];
export const plants = PropulsionPlantCatalogueSchema.parse(load("ship-building/plants.yaml"))
  .plants as unknown as PropulsionPlant[];
export const hullRecords = ShipHullFormCatalogueSchema.parse(load("ship-building/hull-forms.yaml"))
  .hullForms as HullFormRecord[];
const balanceFile = load("ship-building/balance.yaml");
export const shipBalance = shipBalanceFromRecord(balanceFile.ship);
export const costBalance = balanceFile.cost as CostBalance;
export const constructionBalance = balanceFile.construction as ConstructionBalance;
export const cveBalance = balanceFile.cve as CveBalance;
const techs = parse(readFileSync(join(root, "technologies.yaml"), "utf8")) as {
  id: string;
  year: number;
}[];

/** Reference threat profiles. Penetrations come from the research note (12in/25: 521 mm iron at 1,000 yd); QF values are ESTIMATE. */
export const threats = [
  { id: "bl_12in", penetrationUm: 521_000 },
  { id: "bl_92in", penetrationUm: 300_000 },
  { id: "qf_6in", penetrationUm: 150_000 },
  { id: "qf_47in", penetrationUm: 100_000 },
  { id: "qf_12pdr", penetrationUm: 50_000 },
];

export const earlyContext = (month: string): ShipContext => ({
  month,
  unlockedTechs: new Set(techs.filter((t) => t.year <= Number(month.slice(0, 4))).map((t) => t.id)),
  catalogue: components,
  plants,
  hullForms: hullFormsFromRecords(hullRecords),
  threats,
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
  balance: shipBalance,
});
