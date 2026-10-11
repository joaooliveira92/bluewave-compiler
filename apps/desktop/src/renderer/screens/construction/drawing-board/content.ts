import {
  decodeStrict,
  AmmunitionCatalogueSchema,
  GunFamilyCatalogueSchema,
  GunModelCatalogueSchema,
  GunMountCatalogueSchema,
  NavalProfileCatalogueSchema,
  PropulsionPlantCatalogueSchema,
  ShipComponentCatalogueSchema,
  ShipHullFormCatalogueSchema,
} from "@bluewave/content-schema";
import {
  buildShipBuildingContent,
  type AuthoredArmamentContent,
  type ComponentDef,
  type DesignDraft,
  type HullFormRecord,
  type NationNavalProfile,
  type PropulsionPlant,
  type RawReferenceDesign,
  type ShipBuildingContent,
  type ShipBuildingData,
} from "@bluewave/ship-design";
import { parse } from "yaml";
import ammunitionYaml from "@content/ship-building/armament/ammunition.yaml?raw";
import gunFamiliesYaml from "@content/ship-building/armament/gun-families.yaml?raw";
import gunModelsYaml from "@content/ship-building/armament/gun-models.yaml?raw";
import gunMountsYaml from "@content/ship-building/armament/gun-mounts.yaml?raw";
import balanceYaml from "@content/ship-building/balance.yaml?raw";
import componentsYaml from "@content/ship-building/components.yaml?raw";
import hullFormsYaml from "@content/ship-building/hull-forms.yaml?raw";
import plantsYaml from "@content/ship-building/plants.yaml?raw";
import technologiesYaml from "@content/technologies.yaml?raw";

/** Naval profiles live one file per nation; reference designs one directory per nation (ADR-0109). */
const navalProfileFiles = import.meta.glob("@content/ship-building/naval-profiles/*.yaml", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;
const referenceDesignFiles = import.meta.glob("@content/ship-building/reference-designs/*/*.yaml", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;
const sortedTexts = (files: Record<string, string>): string[] =>
  Object.keys(files)
    .sort()
    .map((key) => files[key]!);

/** The nation directory of a reference-design glob key (e.g. `…/reference-designs/uk/starters.yaml`). */
const nationOf = (key: string): string => key.split("/").at(-2) ?? "";

/** Reference designs, UK first and starters before historical, so the first design stays the historical default (ADR-0109). */
const referenceTexts = (): string[] => {
  const rank = (key: string): string => {
    const nation = nationOf(key);
    const file = key.split("/").at(-1);
    return `${nation === "uk" ? "0" : "1"}:${nation}:${file === "starters.yaml" ? "0" : "1"}`;
  };
  return Object.keys(referenceDesignFiles)
    .sort((a, b) => (rank(a) < rank(b) ? -1 : rank(a) > rank(b) ? 1 : 0))
    .map((key) => referenceDesignFiles[key]!);
};

export interface ReferenceDesign {
  readonly id: string;
  readonly name: string;
  readonly month: string;
  /** The ship type this design is the starting point of (ADR-0088); absent for plain historical references. */
  readonly starterFor?: string;
  readonly draft: DesignDraft;
}

/** Bundled EARLY-band ship-building content (v1) plus the reference designs offered as starting points. */
export interface DrawingBoardContent extends ShipBuildingContent {
  readonly references: readonly ReferenceDesign[];
}

let cached: DrawingBoardContent | null = null;

export function loadDrawingBoardContent(): DrawingBoardContent {
  if (cached) return cached;
  const armament: AuthoredArmamentContent = {
    gunFamilies: decodeStrict(GunFamilyCatalogueSchema, parse(gunFamiliesYaml)).gunFamilies,
    gunModels: decodeStrict(GunModelCatalogueSchema, parse(gunModelsYaml)).gunModels,
    gunMounts: decodeStrict(GunMountCatalogueSchema, parse(gunMountsYaml)).gunMounts,
    ammunition: decodeStrict(AmmunitionCatalogueSchema, parse(ammunitionYaml)).ammunition,
  } as unknown as AuthoredArmamentContent;
  const data: ShipBuildingData = {
    components: decodeStrict(ShipComponentCatalogueSchema, parse(componentsYaml))
      .components as ComponentDef[],
    plants: decodeStrict(PropulsionPlantCatalogueSchema, parse(plantsYaml))
      .plants as unknown as PropulsionPlant[],
    hullForms: decodeStrict(ShipHullFormCatalogueSchema, parse(hullFormsYaml))
      .hullForms as HullFormRecord[],
    balance: parse(balanceYaml) as ShipBuildingData["balance"],
    technologies: parse(technologiesYaml) as { id: string; year: number }[],
    navalProfiles: decodeStrict(NavalProfileCatalogueSchema, {
      navalProfiles: sortedTexts(navalProfileFiles).flatMap(
        (text) => (parse(text) as { navalProfiles: unknown[] }).navalProfiles,
      ),
    }).navalProfiles as unknown as NationNavalProfile[],
    armament,
    referenceDesigns: referenceTexts().flatMap(
      (text) => (parse(text) as { designs: RawReferenceDesign[] }).designs,
    ),
  };
  cached = {
    ...buildShipBuildingContent(data),
    references: referenceTexts().flatMap(
      (text) => (parse(text) as { designs: ReferenceDesign[] }).designs,
    ),
  };
  return cached;
}
