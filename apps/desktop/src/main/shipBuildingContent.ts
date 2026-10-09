import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PropulsionPlantCatalogueSchema,
  ShipComponentCatalogueSchema,
  ShipHullFormCatalogueSchema,
} from "@bluewave/content-schema";
import {
  buildShipBuildingContent,
  type ComponentDef,
  type HullFormRecord,
  type PropulsionPlant,
  type ShipBuildingContent,
  type ShipBuildingData,
} from "@bluewave/ship-design";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { parse } from "yaml";
import { resolveProductionPackDir } from "./contentPack.js";

let cached: ShipBuildingContent | null = null;
let cachedHash: string | null = null;

const FILES = [
  "ship-building/components.yaml",
  "ship-building/plants.yaml",
  "ship-building/hull-forms.yaml",
  "ship-building/balance.yaml",
  "technologies.yaml",
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
  const data: ShipBuildingData = {
    components: ShipComponentCatalogueSchema.parse(read("ship-building/components.yaml"))
      .components as ComponentDef[],
    plants: PropulsionPlantCatalogueSchema.parse(read("ship-building/plants.yaml"))
      .plants as unknown as PropulsionPlant[],
    hullForms: ShipHullFormCatalogueSchema.parse(read("ship-building/hull-forms.yaml"))
      .hullForms as HullFormRecord[],
    balance: read("ship-building/balance.yaml") as ShipBuildingData["balance"],
    technologies: read("technologies.yaml") as { id: string; year: number }[],
  };
  cached = buildShipBuildingContent(data);
  cachedHash = sha256Hex(canonicalSerialize(Object.fromEntries(texts)));
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
