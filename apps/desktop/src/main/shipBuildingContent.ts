import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
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

/** The fixed ship-building files that define the legacy content identity (`shipBuildingContentHash`). */
const FIXED_FILES = [
  "ship-building/components.yaml",
  "ship-building/plants.yaml",
  "ship-building/hull-forms.yaml",
  "ship-building/balance.yaml",
  "technologies.yaml",
] as const;

/** Naval profiles live one file per nation; reference designs one directory per nation (ADR-0109). */
const NAVAL_PROFILE_DIR = "ship-building/naval-profiles";
const REFERENCE_DESIGN_DIR = "ship-building/reference-designs";

/** The first-class armament files, hashed separately (`armamentContentHash`, ADR-0093 Step 3). */
const ARMAMENT_FILES = [
  "ship-building/armament/gun-families.yaml",
  "ship-building/armament/gun-models.yaml",
  "ship-building/armament/gun-mounts.yaml",
  "ship-building/armament/ammunition.yaml",
] as const;

/** Every `.yaml` file under a directory, recursively, in sorted order (deterministic). */
function listYamlFiles(dir: string, rel: string): string[] {
  const abs = join(dir, rel);
  return readdirSync(abs)
    .sort()
    .flatMap((entry) => {
      const child = join(rel, entry);
      if (statSync(join(dir, child)).isDirectory()) return listYamlFiles(dir, child);
      return entry.endsWith(".yaml") ? [child] : [];
    });
}

/** Deterministic nation order: the UK set leads, so the first reference design stays the historical default. */
const nationOrder = (a: string, b: string): number =>
  a === b ? 0 : a === "uk" ? -1 : b === "uk" ? 1 : a < b ? -1 : 1;

/** Reference-design files, one directory per nation, UK first (starters.yaml + historical.yaml). */
function listReferenceDesignFiles(dir: string): string[] {
  return readdirSync(join(dir, REFERENCE_DESIGN_DIR))
    .sort(nationOrder)
    .flatMap((nation) =>
      ["starters.yaml", "historical.yaml"]
        .map((name) => join(REFERENCE_DESIGN_DIR, nation, name))
        .filter((rel) => existsSync(join(dir, rel))),
    );
}

/**
 * Loads the ship-building content that sits beside the production pack (`ship-building/**`) once per process.
 * The same content must be given to every month execution so replays compile identically.
 */
export function loadShipBuildingContent(): ShipBuildingContent {
  if (cached) return cached;
  const dir = resolveProductionPackDir();
  const contentFiles = [
    ...FIXED_FILES,
    ...listYamlFiles(dir, NAVAL_PROFILE_DIR),
    ...listReferenceDesignFiles(dir),
  ];
  const texts = new Map(contentFiles.map((rel) => [rel, readFileSync(join(dir, rel), "utf8")]));
  const read = (rel: string): unknown => parse(texts.get(rel)!);
  const armamentTexts = new Map(
    ARMAMENT_FILES.map((rel) => [rel, readFileSync(join(dir, rel), "utf8")]),
  );
  const readArmament = (rel: (typeof ARMAMENT_FILES)[number]): unknown =>
    parse(armamentTexts.get(rel)!);
  const armament: AuthoredArmamentContent = {
    gunFamilies: decodeStrict(
      GunFamilyCatalogueSchema,
      readArmament("ship-building/armament/gun-families.yaml"),
    ).gunFamilies,
    gunModels: decodeStrict(
      GunModelCatalogueSchema,
      readArmament("ship-building/armament/gun-models.yaml"),
    ).gunModels,
    gunMounts: decodeStrict(
      GunMountCatalogueSchema,
      readArmament("ship-building/armament/gun-mounts.yaml"),
    ).gunMounts,
    ammunition: decodeStrict(
      AmmunitionCatalogueSchema,
      readArmament("ship-building/armament/ammunition.yaml"),
    ).ammunition,
  } as unknown as AuthoredArmamentContent;
  const data: ShipBuildingData = {
    components: decodeStrict(ShipComponentCatalogueSchema, read("ship-building/components.yaml"))
      .components as ComponentDef[],
    plants: decodeStrict(PropulsionPlantCatalogueSchema, read("ship-building/plants.yaml"))
      .plants as unknown as PropulsionPlant[],
    hullForms: decodeStrict(ShipHullFormCatalogueSchema, read("ship-building/hull-forms.yaml"))
      .hullForms as HullFormRecord[],
    balance: read("ship-building/balance.yaml") as ShipBuildingData["balance"],
    technologies: read("technologies.yaml") as { id: string; year: number }[],
    navalProfiles: decodeStrict(NavalProfileCatalogueSchema, {
      navalProfiles: listYamlFiles(dir, NAVAL_PROFILE_DIR).flatMap(
        (rel) => (parse(texts.get(rel)!) as { navalProfiles: unknown[] }).navalProfiles,
      ),
    }).navalProfiles as unknown as NationNavalProfile[],
    armament,
    referenceDesigns: listReferenceDesignFiles(dir).flatMap(
      (rel) => (parse(texts.get(rel)!) as { designs: RawReferenceDesign[] }).designs,
    ),
  };
  cached = buildShipBuildingContent(data);
  // The legacy content hash keeps its semantics: the bytes of every ship-building content file, keyed by path.
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
