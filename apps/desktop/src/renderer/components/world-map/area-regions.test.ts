import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { AREA_REGION, REGIONS } from "./area-regions.js";

// Package tests run with the package dir (apps/desktop) as cwd.
const AREAS_YAML = resolve(process.cwd(), "../../content/production/1880/areas.yaml");
const ids = [
  ...readFileSync(AREAS_YAML, "utf8").matchAll(/^\s*-\s+id:\s*"?([a-z0-9_]+)"?\s*$/gm),
].map((m) => m[1] as string);

describe("area region table (production 1880 pack)", () => {
  it("reads a plausible number of production areas", () => {
    expect(ids.length).toBeGreaterThan(50);
  });

  it("assigns every production area to a region", () => {
    expect(ids.filter((id) => AREA_REGION[id] === undefined)).toEqual([]);
  });

  it("has no stale keys for areas the pack no longer defines", () => {
    const known = new Set(ids);
    expect(Object.keys(AREA_REGION).filter((id) => !known.has(id))).toEqual([]);
  });

  it("only uses declared regions, and every region holds at least one area", () => {
    const declared = new Set(REGIONS.map((region) => region.id));
    expect(Object.values(AREA_REGION).filter((region) => !declared.has(region))).toEqual([]);
    const used = new Set(Object.values(AREA_REGION));
    expect(REGIONS.filter((region) => !used.has(region.id))).toEqual([]);
  });
});
