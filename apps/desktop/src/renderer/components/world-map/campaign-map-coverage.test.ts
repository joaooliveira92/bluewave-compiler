import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { AREAS_BY_ID } from "./fixture-world.js";
import { CAMPAIGN_AREA_TO_FIXTURE } from "./campaign-map-join.js";

/**
 * Production-data guard: the map draws at fixture granularity, so every area in
 * the shipped content pack must map to a fixture polygon. A new or renamed
 * content area fails here instead of silently disappearing from the map.
 */
// Package tests run with the package dir (apps/desktop) as cwd.
const AREAS_YAML = resolve(process.cwd(), "../../content/production/1880/areas.yaml");

function productionAreaIds(): string[] {
  const text = readFileSync(AREAS_YAML, "utf8");
  return [...text.matchAll(/^\s*-\s+id:\s*"?([a-z0-9_]+)"?\s*$/gm)].map((m) => m[1] as string);
}

describe("campaign map coverage (production 1880 pack)", () => {
  const ids = productionAreaIds();

  it("reads a plausible number of production areas", () => {
    expect(ids.length).toBeGreaterThan(50);
  });

  it("maps every production area to a fixture area", () => {
    expect(ids.filter((id) => CAMPAIGN_AREA_TO_FIXTURE[id] === undefined)).toEqual([]);
  });

  it("has no stale mapping keys for areas the pack no longer defines", () => {
    const known = new Set(ids);
    expect(Object.keys(CAMPAIGN_AREA_TO_FIXTURE).filter((id) => !known.has(id))).toEqual([]);
  });

  it("only targets fixture areas that exist", () => {
    const missing = Object.values(CAMPAIGN_AREA_TO_FIXTURE).filter((id) => !AREAS_BY_ID.has(id));
    expect(missing).toEqual([]);
  });
});
