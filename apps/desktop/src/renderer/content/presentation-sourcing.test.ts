import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { parse } from "yaml";
import { AREA_REGION, REGIONS } from "../components/world-map/area-regions.js";
import {
  CAMPAIGN_AREA_TO_FIXTURE,
  NATION_HOME_AREA,
  NATION_HUE,
  NATION_LABEL,
} from "../components/world-map/campaign-map-join.js";
import { PLAYABLE_SLOT_COUNTRY_IDS } from "./nationAssetManifest.js";
import { NATION_COORDINATES } from "./nationCoordinates.js";
import { NATION_DOSSIER_FIELDS } from "./nationDossierFields.js";
import { NATION_FLAVOR_TEXT } from "./nationFlavorText.js";
import { NATION_MARKER_COLOURS } from "./nationPresentationCatalog.js";
import { countryIdToNationId } from "./nationSlotMapping.js";

/**
 * Source-fidelity audit (CAH-PRES-1/CAH-PRES-5): the authored presentation
 * corpus compiled into the artifact must carry exactly the data the renderer
 * tables currently hold, so sourcing the screens from the artifact is a pure
 * move, not a content change. This is the audit test the contract ticket (13)
 * deletes once the renderer tables are gone.
 */
const PRESENTATION_PATH = resolve(process.cwd(), "../../content/production/1880/presentation.yaml");

interface AuthoredPresentation {
  nations: Array<{
    countryId: string;
    nationId: string;
    code: string;
    markerColour: string;
    coordinates: unknown;
    flavor: unknown;
    dossier: unknown;
  }>;
  regions: { regions: unknown[]; areaRegion: Record<string, string> };
  mapJoin: {
    campaignAreaToFixture: Record<string, string>;
    nationHue: Record<string, number>;
    nationLabel: Record<string, string>;
    nationHomeArea: Record<string, string>;
  };
}

const authored = parse(readFileSync(PRESENTATION_PATH, "utf8")) as AuthoredPresentation;

describe("presentation content is sourced from the authored corpus (CAH-PRES-1)", () => {
  it("authors one nation record per playable slot, equal to the renderer tables", () => {
    expect(authored.nations.map((n) => n.countryId).sort()).toEqual(
      [...PLAYABLE_SLOT_COUNTRY_IDS].sort(),
    );
    const byCountry = new Map(authored.nations.map((n) => [n.countryId, n]));
    for (const countryId of PLAYABLE_SLOT_COUNTRY_IDS) {
      const record = byCountry.get(countryId)!;
      expect(record.nationId).toBe(countryIdToNationId(countryId));
      expect(record.code).toBe(countryId.slice(0, 3).toUpperCase());
      expect(record.markerColour).toBe(NATION_MARKER_COLOURS[countryId]);
      expect(record.coordinates).toEqual(NATION_COORDINATES[countryId]);
      expect(record.flavor).toEqual(NATION_FLAVOR_TEXT[countryId]);
      expect(record.dossier).toEqual(NATION_DOSSIER_FIELDS[countryId]);
    }
  });

  it("authors the area-region grouping equal to the renderer table", () => {
    expect(authored.regions.areaRegion).toEqual(AREA_REGION);
    expect(authored.regions.regions).toEqual(
      REGIONS.map((region) => ({ id: region.id, label: region.label })),
    );
  });

  it("authors the campaign-map join equal to the renderer tables", () => {
    expect(authored.mapJoin.campaignAreaToFixture).toEqual(CAMPAIGN_AREA_TO_FIXTURE);
    expect(authored.mapJoin.nationHue).toEqual(NATION_HUE);
    expect(authored.mapJoin.nationLabel).toEqual(NATION_LABEL);
    expect(authored.mapJoin.nationHomeArea).toEqual(NATION_HOME_AREA);
  });
});
