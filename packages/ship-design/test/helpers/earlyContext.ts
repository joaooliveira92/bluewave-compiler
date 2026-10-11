import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  AmmunitionCatalogueSchema,
  GunFamilyCatalogueSchema,
  GunModelCatalogueSchema,
  GunMountCatalogueSchema,
  NavalProfileCatalogueSchema,
  PropulsionPlantCatalogueSchema,
  ShipComponentCatalogueSchema,
  ShipHullFormCatalogueSchema,
  decodeStrict,
} from "@bluewave/content-schema";
import {
  buildShipBuildingContent,
  shipBalanceFromRecord,
  type AuthoredArmamentContent,
  type ComponentDef,
  type ConstructionBalance,
  type CostBalance,
  type CveBalance,
  type HullFormRecord,
  type NationNavalProfile,
  type PropulsionPlant,
  type RawReferenceDesign,
  type ShipBuildingData,
  type ShipContext,
} from "../../src/index.js";

const root = join(__dirname, "..", "..", "..", "..", "content", "production", "1880");
const load = (rel: string) =>
  parse(readFileSync(join(root, rel), "utf8")) as Record<string, unknown>;

const armamentDir = join(root, "ship-building", "armament");
const loadArmament = (rel: string) =>
  parse(readFileSync(join(armamentDir, rel), "utf8")) as Record<string, unknown>;

/** First-class armament content, schema-validated as the runtime loader sees it (ADR-0093 Step 3). */
export const armamentContent: AuthoredArmamentContent = {
  gunFamilies: decodeStrict(GunFamilyCatalogueSchema, loadArmament("gun-families.yaml"))
    .gunFamilies,
  gunModels: decodeStrict(GunModelCatalogueSchema, loadArmament("gun-models.yaml")).gunModels,
  gunMounts: decodeStrict(GunMountCatalogueSchema, loadArmament("gun-mounts.yaml")).gunMounts,
  ammunition: decodeStrict(AmmunitionCatalogueSchema, loadArmament("ammunition.yaml")).ammunition,
} as unknown as AuthoredArmamentContent;

export const components = decodeStrict(
  ShipComponentCatalogueSchema,
  load("ship-building/components.yaml"),
).components as ComponentDef[];
export const plants = decodeStrict(
  PropulsionPlantCatalogueSchema,
  load("ship-building/plants.yaml"),
).plants as unknown as PropulsionPlant[];
export const hullRecords = decodeStrict(
  ShipHullFormCatalogueSchema,
  load("ship-building/hull-forms.yaml"),
).hullForms as HullFormRecord[];
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
  navalProfiles: decodeStrict(
    NavalProfileCatalogueSchema,
    load("ship-building/naval-profiles.yaml"),
  ).navalProfiles as unknown as NationNavalProfile[],
  armament: armamentContent,
  referenceDesigns: (
    load("ship-building/reference-designs.yaml") as { designs: RawReferenceDesign[] }
  ).designs,
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
