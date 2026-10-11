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
import navalProfilesYaml from "@content/ship-building/naval-profiles.yaml?raw";
import plantsYaml from "@content/ship-building/plants.yaml?raw";
import referencesYaml from "@content/ship-building/reference-designs.yaml?raw";
import technologiesYaml from "@content/technologies.yaml?raw";

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
    navalProfiles: decodeStrict(NavalProfileCatalogueSchema, parse(navalProfilesYaml))
      .navalProfiles as unknown as NationNavalProfile[],
    armament,
    referenceDesigns: (parse(referencesYaml) as { designs: RawReferenceDesign[] }).designs,
  };
  cached = {
    ...buildShipBuildingContent(data),
    references: (parse(referencesYaml) as { designs: ReferenceDesign[] }).designs,
  };
  return cached;
}
