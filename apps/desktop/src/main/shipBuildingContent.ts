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
import { parse } from "yaml";
import { resolveProductionPackDir } from "./contentPack.js";

let cached: ShipBuildingContent | null = null;

/**
 * Loads the ship-building content that sits beside the production pack (`ship-building/*.yaml`) once per process.
 * The same content must be given to every month execution so replays compile identically.
 */
export function loadShipBuildingContent(): ShipBuildingContent {
  if (cached) return cached;
  const dir = resolveProductionPackDir();
  const read = (rel: string): unknown => parse(readFileSync(join(dir, rel), "utf8"));
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
  return cached;
}
