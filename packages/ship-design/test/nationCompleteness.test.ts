import { describe, it, expect } from "vite-plus/test";
import {
  fingerprintDistance,
  profileFingerprint,
  validateAllNations,
  validateArmamentContent,
  validateNationCompleteness,
  type ReferenceDesignClass,
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

const starters = (readReferenceDesignEntries() as { starterFor?: string }[]).filter(
  (d) => d.starterFor !== undefined,
) as unknown as StarterDesign[];

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
  starter_b_usa_1880: "DOCTRINE_TEMPLATE",
  starter_ca_usa_1880: "DOCTRINE_TEMPLATE",
  starter_cl_usa_1880: "DOCTRINE_TEMPLATE",
  starter_dd_usa_1880: "DOCTRINE_TEMPLATE",
  starter_ke_usa_1880: "DOCTRINE_TEMPLATE",
  starter_amc_usa_1880: "DOCTRINE_TEMPLATE",
  starter_b_japan_1880: "DOCTRINE_TEMPLATE",
  starter_ca_japan_1880: "DOCTRINE_TEMPLATE",
  starter_cl_japan_1880: "DOCTRINE_TEMPLATE",
  starter_dd_japan_1880: "DOCTRINE_TEMPLATE",
  starter_ke_japan_1880: "DOCTRINE_TEMPLATE",
  starter_amc_japan_1880: "DOCTRINE_TEMPLATE",
  starter_b_italy_1880: "DOCTRINE_TEMPLATE",
  starter_ca_italy_1880: "DOCTRINE_TEMPLATE",
  starter_cl_italy_1880: "DOCTRINE_TEMPLATE",
  starter_dd_italy_1880: "DOCTRINE_TEMPLATE",
  starter_ke_italy_1880: "DOCTRINE_TEMPLATE",
  starter_amc_italy_1880: "DOCTRINE_TEMPLATE",
  starter_b_russia_1880: "DOCTRINE_TEMPLATE",
  starter_ca_russia_1880: "DOCTRINE_TEMPLATE",
  starter_cl_russia_1880: "DOCTRINE_TEMPLATE",
  starter_dd_russia_1880: "DOCTRINE_TEMPLATE",
  starter_ke_russia_1880: "DOCTRINE_TEMPLATE",
  starter_amc_russia_1880: "DOCTRINE_TEMPLATE",
  starter_b_austria_hungary_1880: "DOCTRINE_TEMPLATE",
  starter_ca_austria_hungary_1880: "DOCTRINE_TEMPLATE",
  starter_cl_austria_hungary_1880: "DOCTRINE_TEMPLATE",
  starter_dd_austria_hungary_1880: "DOCTRINE_TEMPLATE",
  starter_ke_austria_hungary_1880: "DOCTRINE_TEMPLATE",
  starter_amc_austria_hungary_1880: "DOCTRINE_TEMPLATE",
  starter_b_spain_1880: "DOCTRINE_TEMPLATE",
  starter_ca_spain_1880: "DOCTRINE_TEMPLATE",
  starter_cl_spain_1880: "DOCTRINE_TEMPLATE",
  starter_dd_spain_1880: "DOCTRINE_TEMPLATE",
  starter_ke_spain_1880: "DOCTRINE_TEMPLATE",
  starter_amc_spain_1880: "DOCTRINE_TEMPLATE",
  starter_b_qing_1880: "DOCTRINE_TEMPLATE",
  starter_ca_qing_1880: "DOCTRINE_TEMPLATE",
  starter_cl_qing_1880: "DOCTRINE_TEMPLATE",
  starter_dd_qing_1880: "DOCTRINE_TEMPLATE",
  starter_ke_qing_1880: "DOCTRINE_TEMPLATE",
  starter_amc_qing_1880: "DOCTRINE_TEMPLATE",
  starter_b_ottoman_empire_1880: "DOCTRINE_TEMPLATE",
  starter_ca_ottoman_empire_1880: "DOCTRINE_TEMPLATE",
  starter_cl_ottoman_empire_1880: "DOCTRINE_TEMPLATE",
  starter_dd_ottoman_empire_1880: "DOCTRINE_TEMPLATE",
  starter_ke_ottoman_empire_1880: "DOCTRINE_TEMPLATE",
  starter_amc_ottoman_empire_1880: "DOCTRINE_TEMPLATE",
  starter_b_netherlands_1880: "DOCTRINE_TEMPLATE",
  starter_ca_netherlands_1880: "DOCTRINE_TEMPLATE",
  starter_cl_netherlands_1880: "DOCTRINE_TEMPLATE",
  starter_dd_netherlands_1880: "DOCTRINE_TEMPLATE",
  starter_ke_netherlands_1880: "DOCTRINE_TEMPLATE",
  starter_amc_netherlands_1880: "DOCTRINE_TEMPLATE",
  starter_b_portugal_1880: "DOCTRINE_TEMPLATE",
  starter_ca_portugal_1880: "DOCTRINE_TEMPLATE",
  starter_cl_portugal_1880: "DOCTRINE_TEMPLATE",
  starter_dd_portugal_1880: "DOCTRINE_TEMPLATE",
  starter_ke_portugal_1880: "DOCTRINE_TEMPLATE",
  starter_amc_portugal_1880: "DOCTRINE_TEMPLATE",
  starter_b_brazil_1880: "DOCTRINE_TEMPLATE",
  starter_ca_brazil_1880: "DOCTRINE_TEMPLATE",
  starter_cl_brazil_1880: "DOCTRINE_TEMPLATE",
  starter_dd_brazil_1880: "DOCTRINE_TEMPLATE",
  starter_ke_brazil_1880: "DOCTRINE_TEMPLATE",
  starter_amc_brazil_1880: "DOCTRINE_TEMPLATE",
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
