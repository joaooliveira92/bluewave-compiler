import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vite-plus/test";
import {
  AmmunitionCatalogueSchema,
  GunFamilyCatalogueSchema,
  GunModelCatalogueSchema,
  GunMountCatalogueSchema,
} from "../src/index.js";

const dir = join(
  process.cwd(),
  "..",
  "..",
  "content",
  "production",
  "1880",
  "ship-building",
  "armament",
);
const read = (file: string) => parse(readFileSync(join(dir, file), "utf8"));

const provenance = {
  sourceStatus: "VERIFIED",
  confidence: "HIGH",
  kind: "historical_fact",
  sources: [{ title: "test source" }],
};

describe("armament content schema — the authored catalogue parses", () => {
  it("parses every gun family", () => {
    const result = GunFamilyCatalogueSchema.safeParse(read("gun-families.yaml"));
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });
  it("parses every national gun model", () => {
    const result = GunModelCatalogueSchema.safeParse(read("gun-models.yaml"));
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });
  it("parses every gun mount", () => {
    const result = GunMountCatalogueSchema.safeParse(read("gun-mounts.yaml"));
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });
  it("parses every ammunition pattern", () => {
    const result = AmmunitionCatalogueSchema.safeParse(read("ammunition.yaml"));
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });
});

describe("armament content schema — explicit units only", () => {
  const family = {
    id: "gun_x",
    designation: "X",
    category: "MAIN_GUN",
    defaultMountType: "TURRET",
    provenance,
  };

  it("rejects an ambiguous unitless field such as 'weight'", () => {
    const result = GunFamilyCatalogueSchema.safeParse({
      gunFamilies: [{ ...family, weight: 1000 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an ambiguous 'speed' field on a model", () => {
    const result = GunModelCatalogueSchema.safeParse({
      gunModels: [
        {
          id: "uk_gun_x",
          familyId: "gun_x",
          nationId: "uk",
          designation: "X",
          speed: 12,
          supportedMountTypes: ["TURRET"],
          requiredTechnologyIds: [],
          provenance,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-canonical id and an unknown mount type", () => {
    expect(
      GunFamilyCatalogueSchema.safeParse({ gunFamilies: [{ ...family, id: "Gun X" }] }).success,
    ).toBe(false);
    expect(
      GunFamilyCatalogueSchema.safeParse({
        gunFamilies: [{ ...family, defaultMountType: "SPACE_TURRET" }],
      }).success,
    ).toBe(false);
  });

  it("rejects an out-of-range reliability and a missing required field", () => {
    const base = {
      id: "uk_gun_x",
      familyId: "gun_x",
      nationId: "uk",
      designation: "X",
      supportedMountTypes: ["TURRET"],
      requiredTechnologyIds: [],
      provenance,
    };
    expect(
      GunModelCatalogueSchema.safeParse({ gunModels: [{ ...base, reliabilityBp: 20_000 }] })
        .success,
    ).toBe(false);
    const { requiredTechnologyIds: _drop, ...missing } = base;
    expect(GunModelCatalogueSchema.safeParse({ gunModels: [missing] }).success).toBe(false);
  });
});
