import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  AmmunitionCatalogueSchema,
  GunFamilyCatalogueSchema,
  GunModelCatalogueSchema,
  GunMountCatalogueSchema,
} from "@bluewave/content-schema";
import {
  starterFor,
  type AuthoredArmamentContent,
  type ArmamentStarter,
  type ComponentDef,
  type DesignDraft,
  type NationNavalProfile,
  type StarterDesign,
} from "../../src/index.js";
import { components, navalProfiles, shipBuildingData } from "./earlyContext.js";

const root = join(__dirname, "..", "..", "..", "..", "content", "production", "1880");
const armamentDir = join(root, "ship-building", "armament");
const read = (rel: string) => parse(readFileSync(join(armamentDir, rel), "utf8"));

/** The authored armament content, schema-validated exactly as the release gate sees it. */
export const armamentContent: AuthoredArmamentContent = {
  gunFamilies: GunFamilyCatalogueSchema.parse(read("gun-families.yaml")).gunFamilies,
  gunModels: GunModelCatalogueSchema.parse(read("gun-models.yaml")).gunModels,
  gunMounts: GunMountCatalogueSchema.parse(read("gun-mounts.yaml")).gunMounts,
  ammunition: AmmunitionCatalogueSchema.parse(read("ammunition.yaml")).ammunition,
} as unknown as AuthoredArmamentContent;

const GUN_CATEGORIES = new Set(["MAIN_GUN", "SECONDARY_GUN", "DUAL_PURPOSE_GUN", "AA_WEAPON"]);
const byComponent = new Map(components.map((c) => [c.id, c]));

const designs = (
  parse(readFileSync(join(root, "ship-building", "reference-designs.yaml"), "utf8")) as {
    designs: { id: string; name: string; month: string; starterFor?: string; draft: DesignDraft }[];
  }
).designs;

const starters = designs.filter((d) => d.starterFor !== undefined) as unknown as StarterDesign[];

/** The 18 opening reference designs: six per nation (B, CA, CL, DD, KE, AMC) at January 1880. */
export const OPENING_MONTH = "1880-01";
const OPENING_NATIONS = ["uk", "france", "germany"] as const;
const OPENING_TYPES = ["B", "CA", "CL", "DD", "KE", "AMC"] as const;

export const armamentStarters: readonly ArmamentStarter[] = OPENING_NATIONS.flatMap((nationId) =>
  OPENING_TYPES.flatMap((type) => {
    const chosen = starterFor(type, starters, OPENING_MONTH, nationId);
    if (chosen === null) return [];
    const weapons = chosen.draft.placements
      .filter((p) => GUN_CATEGORIES.has(byComponent.get(p.componentId)?.category ?? ""))
      .map((p) => ({
        instanceId: p.instanceId,
        componentId: p.componentId,
        gunCount: p.params?.barrels ?? 1,
      }));
    return [{ id: chosen.id, month: chosen.month, nationId, weapons }];
  }),
);

export const armamentComponents: readonly ComponentDef[] = components;
export const armamentProfiles: readonly NationNavalProfile[] = navalProfiles;
export const armamentTechnologies = shipBuildingData.technologies;

export const armamentCoverageInput = {
  content: armamentContent,
  components,
  profiles: navalProfiles,
  starters: armamentStarters,
  technologies: shipBuildingData.technologies,
  release: true,
};
