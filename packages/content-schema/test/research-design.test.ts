import { describe, it, expect } from "vitest";
import {
  DesignTemplateSchema,
  TechnologyPrerequisiteChainSchema,
  CANONICAL_RESEARCH_FIELD_IDS,
  RESEARCH_FIELD_PRIORITY_WEIGHTS,
} from "../src/index.js";

describe("DesignTemplateSchema", () => {
  it("accepts a valid design template", () => {
    const valid = {
      designId: "gbr-dreadnought-v1",
      nationId: "GBR",
      className: "Dreadnought",
      hullType: "battleship",
      displacementKg: 18_000,
      speedUms: 11,
      armorBeltUm: 300,
      mainGuns: { caliber: 305, count: 10, mounts: 5 },
      machineryType: "steam_turbine",
      hitPoints: 100,
      crewComplement: 800,
    };
    const result = DesignTemplateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a template missing required fields", () => {
    const invalid = { designId: "gbr-dreadnought-v1", className: "Dreadnought" };
    const result = DesignTemplateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects a template with invalid main gun values", () => {
    const invalid = {
      designId: "gbr-dreadnought-v1",
      nationId: "GBR",
      className: "Dreadnought",
      hullType: "battleship",
      displacementKg: 18_000,
      speedUms: 11,
      armorBeltUm: 300,
      mainGuns: { caliber: 0, count: 10, mounts: 5 },
      machineryType: "steam_turbine",
      hitPoints: 100,
      crewComplement: 800,
    };
    const result = DesignTemplateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("TechnologyPrerequisiteChainSchema", () => {
  it("accepts the expanded research fields", () => {
    const valid = {
      id: "basic_gunnery",
      name: "Basic Gunnery",
      category: "weapons",
      researchFieldId: "GUNNERY",
      prerequisites: [],
      cost: 100,
      discoveryWeight: 10,
      availabilityMonth: 0,
      year: 1880,
    };
    const result = TechnologyPrerequisiteChainSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects discovery weight outside 1..1_000_000", () => {
    const invalid = {
      id: "basic_gunnery",
      name: "Basic Gunnery",
      category: "weapons",
      researchFieldId: "GUNNERY",
      discoveryWeight: 0,
    };
    const result = TechnologyPrerequisiteChainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("CANONICAL_RESEARCH_FIELD_IDS", () => {
  it("contains exactly the 15 canonical fields in DESIGN-20 §1 order", () => {
    expect(CANONICAL_RESEARCH_FIELD_IDS).toEqual([
      "HULL_CONSTRUCTION",
      "MACHINERY",
      "SHIP_DESIGN",
      "GUNNERY",
      "FIRE_CONTROL",
      "TORPEDOES",
      "SUBMARINES",
      "MINES_AND_ASW",
      "AVIATION",
      "CARRIER_OPERATIONS",
      "RADAR_AND_ELECTRONICS",
      "MISSILES",
      "AMPHIBIOUS_OPERATIONS",
      "INFRASTRUCTURE",
      "DAMAGE_CONTROL",
    ]);
  });

  it("declares exact priority weights 4/2/1", () => {
    expect(RESEARCH_FIELD_PRIORITY_WEIGHTS).toEqual({ HIGH: 4, MEDIUM: 2, LOW: 1 });
  });
});