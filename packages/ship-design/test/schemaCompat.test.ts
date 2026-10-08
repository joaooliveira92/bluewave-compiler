import { describe, it, expect } from "vite-plus/test";
import {
  ShipComponentSchema,
  SHIP_COMPONENT_CATEGORIES,
  SHIP_ZONE_IDS,
  PropulsionPlantSchema,
} from "@bluewave/content-schema";
import {
  COMPONENT_CATEGORIES,
  ZONE_IDS,
  lintCatalogue,
  type ComponentDef,
  type PropulsionPlant,
} from "../src/index.js";
import { catalogue, plant } from "./fixtures/gunboat.js";

describe("content-schema stays in lock-step with ship-design", () => {
  it("category and zone lists are identical", () => {
    expect([...SHIP_COMPONENT_CATEGORIES]).toEqual([...COMPONENT_CATEGORIES]);
    expect([...SHIP_ZONE_IDS]).toEqual([...ZONE_IDS]);
  });
  it("every fixture component passes the schema, and parsed output is a valid ComponentDef that lints clean", () => {
    const parsed: ComponentDef[] = catalogue.map((c) => {
      const r = ShipComponentSchema.safeParse(c);
      expect(r.success, c.id).toBe(true);
      return r.data as ComponentDef;
    });
    expect(lintCatalogue(parsed, new Set(["tech_qf_guns", "tech_whitehead"]))).toEqual([]);
  });
  it("plants parse into the runtime shape", () => {
    const r = PropulsionPlantSchema.safeParse({
      ...plant,
      introduction: { fromMonth: "1881-01", obsoleteMonth: null },
      requires: [],
    });
    expect(r.success).toBe(true);
    const p: PropulsionPlant = {
      id: r.data!.id,
      fuelType: r.data!.fuelType,
      weightMilliKgPerKw: r.data!.weightMilliKgPerKw,
      volumeLitrePerKw: r.data!.volumeLitrePerKw,
      sfcGramPerKwh: r.data!.sfcGramPerKwh as never,
      reliabilityBp: r.data!.reliabilityBp,
      minKw: r.data!.minKw,
      maxKw: r.data!.maxKw,
    };
    expect(p.id).toBe(plant.id);
  });
});
