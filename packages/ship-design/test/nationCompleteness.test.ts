import { describe, it, expect } from "vite-plus/test";
import {
  fingerprintDistance,
  profileFingerprint,
  validateAllNations,
  validateArmamentContent,
  validateNationCompleteness,
  type StarterDesign,
} from "../src/index.js";
import {
  components,
  navalProfiles,
  readReferenceDesignEntries,
  shipBuildingContent,
} from "./helpers/earlyContext.js";
import {
  armamentContent,
  armamentStarters,
  armamentTechnologies,
} from "./helpers/armamentContext.js";
import { REFERENCE_DESIGN_CLASSIFICATIONS } from "./helpers/referenceClassifications.js";

const starters = (readReferenceDesignEntries() as { starterFor?: string }[]).filter(
  (d) => d.starterFor !== undefined,
) as unknown as StarterDesign[];

const knownComponentIds = new Set(components.map((c) => c.id));

const CLASSIFICATIONS = REFERENCE_DESIGN_CLASSIFICATIONS;

const opts = {
  profiles: navalProfiles,
  starters,
  content: shipBuildingContent,
  openingMonth: "1880-01",
  standardBudgetUnits: 400,
  knownComponentIds,
  classifications: CLASSIFICATIONS,
  release: true,
  armament: {
    content: armamentContent,
    components,
    starters: armamentStarters,
    technologies: armamentTechnologies,
  },
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
    expect(validateNationCompleteness(opts, "atlantis").map((i) => i.code)).toContain(
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

  it("passes the integrated armament release gate with no issues", () => {
    expect(validateArmamentContent(opts)).toEqual([]);
    expect(validateAllNations(opts)).toEqual([]);
  });
});
