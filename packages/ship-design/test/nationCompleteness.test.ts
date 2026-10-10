import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, it, expect } from "vite-plus/test";
import {
  fingerprintDistance,
  profileFingerprint,
  validateAllNations,
  validateNationCompleteness,
  type DesignDraft,
  type ReferenceDesignClass,
  type StarterDesign,
} from "../src/index.js";
import { components, navalProfiles, shipBuildingContent } from "./helpers/earlyContext.js";

const root = join(__dirname, "..", "..", "..", "content", "production", "1880");
const starters = (
  parse(readFileSync(join(root, "ship-building/reference-designs.yaml"), "utf8")) as {
    designs: { id: string; name: string; month: string; starterFor?: string; draft: DesignDraft }[];
  }
).designs.filter((d) => d.starterFor !== undefined) as unknown as StarterDesign[];

const knownComponentIds = new Set(components.map((c) => c.id));

/** Explicit historical classification of every starter (ADR-0092 §3): historical ships vs shared doctrine templates. */
const CLASSIFICATIONS: Record<string, ReferenceDesignClass> = {
  alexandra_1877: "HISTORICAL_RECONSTRUCTION",
  starter_armoured_cruiser_1880: "DOCTRINE_TEMPLATE",
  starter_protected_cruiser_1880: "DOCTRINE_TEMPLATE",
  starter_torpedo_gunboat_1880: "DOCTRINE_TEMPLATE",
  starter_corvette_1880: "DOCTRINE_TEMPLATE",
  starter_armed_liner_1880: "DOCTRINE_TEMPLATE",
  redoutable_1878: "HISTORICAL_RECONSTRUCTION",
  starter_armoured_cruiser_fr_1880: "DOCTRINE_TEMPLATE",
  starter_protected_cruiser_fr_1880: "DOCTRINE_TEMPLATE",
  starter_torpedo_gunboat_fr_1880: "DOCTRINE_TEMPLATE",
  starter_corvette_fr_1880: "DOCTRINE_TEMPLATE",
  starter_armed_liner_fr_1880: "DOCTRINE_TEMPLATE",
  sachsen_1878: "HISTORICAL_RECONSTRUCTION",
  starter_armoured_cruiser_de_1880: "DOCTRINE_TEMPLATE",
  starter_protected_cruiser_de_1880: "DOCTRINE_TEMPLATE",
  starter_torpedoboat_de_1880: "DOCTRINE_TEMPLATE",
  starter_gunboat_de_1880: "DOCTRINE_TEMPLATE",
  starter_armed_liner_de_1880: "DOCTRINE_TEMPLATE",
};

const opts = {
  profiles: navalProfiles,
  starters,
  content: shipBuildingContent,
  openingMonth: "1880-01",
  standardBudgetUnits: 400,
  knownComponentIds,
  classifications: CLASSIFICATIONS,
  release: true,
};

const NATIONS = ["uk", "france", "germany"] as const;

describe("national content completeness (UK / France / Germany)", () => {
  it.each(NATIONS)("%s passes every completeness check at release", (nation) => {
    const issues = validateNationCompleteness(opts, nation);
    expect(issues.map((i) => `${i.code}: ${i.message}`)).toEqual([]);
  });
  it("validates every authored nation with no issues", () => {
    expect(validateAllNations(opts)).toEqual([]);
  });
  it("rejects a nation with no profile", () => {
    expect(validateNationCompleteness(opts, "japan").map((i) => i.code)).toContain(
      "NATION_NO_PROFILE",
    );
  });
  it("rejects an unclassified starter", () => {
    const { ["starter_gunboat_de_1880"]: _drop, ...without } = CLASSIFICATIONS;
    const issues = validateNationCompleteness({ ...opts, classifications: without }, "germany");
    expect(issues.map((i) => i.code)).toContain("NATION_STARTER_UNCLASSIFIED");
  });
  it("the three nations are measurably distinct without violating the rules", () => {
    const uk = profileFingerprint(navalProfiles.find((p) => p.nationId === "uk")!);
    const fr = profileFingerprint(navalProfiles.find((p) => p.nationId === "france")!);
    const de = profileFingerprint(navalProfiles.find((p) => p.nationId === "germany")!);
    expect(fingerprintDistance(uk, de)).toBeGreaterThanOrEqual(2);
    expect(fingerprintDistance(fr, de)).toBeGreaterThanOrEqual(2);
    expect(fingerprintDistance(uk, fr)).toBeGreaterThanOrEqual(2);
  });
});
