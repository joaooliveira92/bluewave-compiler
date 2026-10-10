import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  NavalProfileCatalogueSchema,
  PropulsionPlantCatalogueSchema,
  ShipComponentCatalogueSchema,
  ShipHullFormCatalogueSchema,
} from "@bluewave/content-schema";
import {
  buildShipBuildingContent,
  shipBalanceFromRecord,
  type ComponentDef,
  type ConstructionBalance,
  type CostBalance,
  type CveBalance,
  type HullFormRecord,
  type NationNavalProfile,
  type PropulsionPlant,
  type ShipBuildingData,
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

export const shipBuildingData: ShipBuildingData = {
  components,
  plants,
  hullForms: hullRecords,
  balance: balanceFile as unknown as ShipBuildingData["balance"],
  technologies: techs,
  navalProfiles: NavalProfileCatalogueSchema.parse(load("ship-building/naval-profiles.yaml"))
    .navalProfiles as unknown as NationNavalProfile[],
};
export const shipBuildingContent = buildShipBuildingContent(shipBuildingData);
export const navalProfiles = shipBuildingData.navalProfiles!;

/** Same ship-building context the engine and the UI use, for a given campaign month. */
export const earlyContext = (month: string): ShipContext =>
  shipBuildingContent.environmentFor(month).ctx;
/** A nation's context: the shared context with that nation's catalogue and capabilities applied. */
export const nationalContext = (month: string, nationId: string): ShipContext =>
  shipBuildingContent.environmentFor(month, nationId).ctx;
export const threats = shipBuildingData.balance.environment.threats;
