import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
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
  type HullFormRecord,
  type NationNavalProfile,
  type PropulsionPlant,
  type RawReferenceDesign,
  type ShipBuildingContent,
  type ShipBuildingData,
} from "@bluewave/ship-design";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { parse } from "yaml";
import { resolveProductionPackDir } from "./contentPack.js";

let cached: ShipBuildingContent | null = null;
let cachedHash: string | null = null;
let cachedArmamentHash: string | null = null;

/** The ship-building files that define the legacy content identity (`shipBuildingContentHash`). */
const FILES = [
  "ship-building/components.yaml",
  "ship-building/plants.yaml",
  "ship-building/hull-forms.yaml",
  "ship-building/balance.yaml",
  "ship-building/naval-profiles.yaml",
  "ship-building/reference-designs.yaml",
  "technologies.yaml",
] as const;

/** The first-class armament files, hashed separately (`armamentContentHash`, ADR-0093 Step 3). */
const ARMAMENT_FILES = [
  "ship-building/armament/gun-families.yaml",
  "ship-building/armament/gun-models.yaml",
  "ship-building/armament/gun-mounts.yaml",
  "ship-building/armament/ammunition.yaml",
] as const;

/**
 * Loads the ship-building content that sits beside the production pack (`ship-building/*.yaml`) once per process.
 * The same content must be given to every month execution so replays compile identically.
 */
export function loadShipBuildingContent(): ShipBuildingContent {
  if (cached) return cached;
  const dir = resolveProductionPackDir();
  const texts = new Map(FILES.map((rel) => [rel, readFileSync(join(dir, rel), "utf8")]));
  const read = (rel: (typeof FILES)[number]): unknown => parse(texts.get(rel)!);
  const armamentTexts = new Map(
    ARMAMENT_FILES.map((rel) => [rel, readFileSync(join(dir, rel), "utf8")]),
  );
  const readArmament = (rel: (typeof ARMAMENT_FILES)[number]): unknown =>
    parse(armamentTexts.get(rel)!);
  const armament: AuthoredArmamentContent = {
    gunFamilies: GunFamilyCatalogueSchema.parse(
      readArmament("ship-building/armament/gun-families.yaml"),
    ).gunFamilies,
    gunModels: GunModelCatalogueSchema.parse(readArmament("ship-building/armament/gun-models.yaml"))
      .gunModels,
    gunMounts: GunMountCatalogueSchema.parse(readArmament("ship-building/armament/gun-mounts.yaml"))
      .gunMounts,
    ammunition: AmmunitionCatalogueSchema.parse(
      readArmament("ship-building/armament/ammunition.yaml"),
    ).ammunition,
  } as unknown as AuthoredArmamentContent;
  const data: ShipBuildingData = {
    components: ShipComponentCatalogueSchema.parse(read("ship-building/components.yaml"))
      .components as ComponentDef[],
    plants: PropulsionPlantCatalogueSchema.parse(read("ship-building/plants.yaml"))
      .plants as unknown as PropulsionPlant[],
    hullForms: ShipHullFormCatalogueSchema.parse(read("ship-building/hull-forms.yaml"))
      .hullForms as HullFormRecord[],
    balance: read("ship-building/balance.yaml") as ShipBuildingData["balance"],
    technologies: read("technologies.yaml") as { id: string; year: number }[],
    navalProfiles: NavalProfileCatalogueSchema.parse(read("ship-building/naval-profiles.yaml"))
      .navalProfiles as unknown as NationNavalProfile[],
    armament,
    referenceDesigns: (
      read("ship-building/reference-designs.yaml") as {
        designs: RawReferenceDesign[];
      }
    ).designs,
  };
  cached = buildShipBuildingContent(data);
  // The legacy content hash keeps its exact semantics: the same seven files as before the cut-over.
  cachedHash = sha256Hex(canonicalSerialize(Object.fromEntries(texts)));
  cachedArmamentHash = sha256Hex(canonicalSerialize(Object.fromEntries(armamentTexts)));
  return cached;
}

/**
 * Hash of the exact files `loadShipBuildingContent` read. A month records it so a replay can tell "the content changed
 * since" (an expected difference after a content update) from a real divergence.
 */
export function shipBuildingContentHash(): string {
  loadShipBuildingContent();
  return cachedHash!;
}

/**
 * A separately versioned hash of the first-class armament files (ADR-0093 Step 3). Kept apart from
 * `shipBuildingContentHash` so older saves keep their existing content identity; new saves record it so a
 * replay can detect an armament-content change on its own. Deterministic across processes: it hashes the
 * file bytes keyed by their relative paths, never absolute paths or file order.
 */
export function armamentContentHash(): string {
  loadShipBuildingContent();
  return cachedArmamentHash!;
}
