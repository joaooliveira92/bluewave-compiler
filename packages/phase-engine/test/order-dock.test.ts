// SB-3/INC-5c (DESIGN-16 section 4, ADR-0135): the national dock ceiling gates domestic new construction, and a
// materialised nation dock overrides the content-derived one. Uses real 1880 content (profiles + reference designs).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CampaignSnapshot, CompiledDesignVersion } from "@bluewave/campaign";
import {
  decodeStrict,
  PropulsionPlantCatalogueSchema,
  ShipComponentCatalogueSchema,
  ShipHullFormCatalogueSchema,
} from "@bluewave/content-schema";
import { SafeInt } from "@bluewave/contracts";
import { buildShipBuildingContent, type ShipBuildingData } from "@bluewave/ship-design";
import { parse } from "yaml";
import { describe, expect, it } from "vite-plus/test";
import { placeConstructionOrder } from "../src/index.js";
import { makeBattleSnapshot, makeDesign, makeNation } from "./battle-fixtures.js";
import { readNavalProfileEntries } from "./helpers/contentFiles.js";

const root = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "content",
  "production",
  "1880",
);
const load = (rel: string) =>
  parse(readFileSync(join(root, rel), "utf8")) as Record<string, unknown>;
const data = {
  components: decodeStrict(ShipComponentCatalogueSchema, load("ship-building/components.yaml"))
    .components,
  plants: decodeStrict(PropulsionPlantCatalogueSchema, load("ship-building/plants.yaml")).plants,
  hullForms: decodeStrict(ShipHullFormCatalogueSchema, load("ship-building/hull-forms.yaml"))
    .hullForms,
  balance: load("ship-building/balance.yaml"),
  technologies: parse(readFileSync(join(root, "technologies.yaml"), "utf8")),
  navalProfiles: readNavalProfileEntries(),
} as ShipBuildingData;
const content = { ...buildShipBuildingContent(data), study: null };

const ukDesign = (displacementKg: number): CompiledDesignVersion => ({
  ...makeDesign("dv-uk", "uk"),
  normalizedDisplacementKg: SafeInt(displacementKg),
});

function ukSnapshot(design: CompiledDesignVersion): CampaignSnapshot {
  const base = makeBattleSnapshot({ areas: ["a-1"], wars: [] });
  return {
    ...base,
    nations: new Map([["uk", makeNation("uk", [])]]),
    designs: new Map([[design.designVersionId, design]]),
  };
}

const order = (snapshot: CampaignSnapshot) =>
  placeConstructionOrder(
    snapshot,
    {
      nationId: "uk",
      commandId: "cmd-1",
      designVersionId: "dv-uk",
      month: { month: 1, year: 1880 },
    },
    content,
  );

describe("national dock ceiling at order time (INC-5c)", () => {
  it("orders a real domestic reference design at the UK dock (12,679 t < 13,000 t)", () => {
    const result = order(ukSnapshot(ukDesign(12_679_499)));
    expect(result.ok).toBe(true);
  });

  it("refuses an oversized design with SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT", () => {
    const result = order(ukSnapshot(ukDesign(13_000_001)));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT");
  });

  it("a materialised nation dock overrides the content-derived dock", () => {
    const snapshot = ukSnapshot(ukDesign(1_500_000));
    const uk = snapshot.nations.get("uk")!;
    snapshot.nations.set("uk", {
      ...uk,
      dock: {
        maximumNewConstructionMassKg: 1_000_000,
        maximumMajorRepairMassKg: 1_000_000,
        maximumRebuildMassKg: 1_000_000,
        maximumConversionMassKg: 1_000_000,
      },
    });
    const result = order(snapshot);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT");
  });
});
