// ADR-0092/ADR-0111: promote canonical historical reference ships to national opening capital starters.
// These tests pin the promotion: nation ownership, classification, schema/compile legality, no capability
// inflation or foreign-equipment overreach, the rifled-muzzle-loader mechanism, and the anti-clone invariant.
import { describe, expect, it } from "vite-plus/test";
import {
  compileDesign,
  resolveConstructionModifiers,
  resolveNavalProfile,
  starterFor,
  validateDraftShape,
  type DesignDraft,
  type StarterDesign,
} from "../src/index.js";
import {
  navalProfiles,
  readReferenceDesignEntries,
  shipBuildingContent,
} from "./helpers/earlyContext.js";
import {
  HISTORICAL_B_STARTERS,
  REFERENCE_DESIGN_CLASSIFICATIONS,
} from "./helpers/referenceClassifications.js";

const OPENING_MONTH = "1880-01";
const OPENING_TYPES = ["B", "CA", "CL", "DD", "KE", "AMC"] as const;

const designs = readReferenceDesignEntries() as {
  id: string;
  name: string;
  month: string;
  starterFor?: string;
  draft: DesignDraft;
}[];
const byId = (id: string) => designs.find((d) => d.id === id)!;
const starters = designs.filter((d): d is StarterDesign => d.starterFor !== undefined);
const uk = designs.find((d) => d.id === "alexandra_1877")!;

const CONVERTED = Object.entries(HISTORICAL_B_STARTERS);

/**
 * The mechanical projection of a draft: the characteristics that make two ships different, with every identity
 * field (nationId, name, description, provenance, file path, generated id) removed. Two starters that differ
 * only in metadata project to the same fingerprint, which is exactly the clone this promotion removes.
 */
const mechanicalFingerprint = (draft: DesignDraft): string =>
  JSON.stringify({
    hullFormId: draft.hull.hullFormId,
    materialId: draft.hull.materialId,
    structuralSchemeId: draft.hull.structuralSchemeId,
    lengthWl: draft.hull.lengthWl,
    beam: draft.hull.beam,
    draught: draft.hull.draught,
    depthToMainDeck: draft.hull.depthToMainDeck,
    targetDisplacementKg: draft.hull.targetDisplacementKg,
    plantId: draft.machinery.plantId,
    installedKw: draft.machinery.installedKw,
    speedMilliKnots: draft.requirement.requiredSpeedMilliKnots,
    armour: draft.armour.regions.map((r) => `${r.region}:${r.materialId}:${r.thicknessUm}`).sort(),
    guns: draft.placements
      .filter((p) => p.componentId.startsWith("gun_"))
      .map((p) => `${p.componentId}:${p.params?.barrels ?? 0}`)
      .sort(),
  });

describe("promoted historical national starters", () => {
  it.each(CONVERTED)("%s begins with %s as its capital starter", (nation, id) => {
    const chosen = starterFor("B", starters, OPENING_MONTH, nation);
    expect(chosen?.id).toBe(id);
    expect(chosen?.draft.nationId).toBe(nation);
    expect(byId(id).starterFor).toBe("B");
  });

  it.each(CONVERTED)("%s: %s is classified HISTORICAL_RECONSTRUCTION", (_nation, id) => {
    expect(REFERENCE_DESIGN_CLASSIFICATIONS[id]).toBe("HISTORICAL_RECONSTRUCTION");
  });

  it("the cloned British capital starters were removed, not merely hidden", () => {
    for (const id of [
      "starter_b_italy_1880",
      "starter_b_russia_1880",
      "starter_b_ottoman_empire_1880",
    ])
      expect(designs.find((d) => d.id === id)).toBeUndefined();
  });

  // ADR-0114: these nations' named candidates cannot legally classify as a B capital under DESIGN_22_EARLY
  // (displacement < 5,000 t and/or belt < 6 in), so promoting one would be a false substitution. They stay on
  // their doctrine template until a classification-schema change admits slow coast-defence ships.
  it("leaves the ADR-0114-deferred candidates on their doctrine template (no false substitution)", () => {
    for (const nation of [
      "netherlands",
      "portugal",
      "brazil",
      "japan",
      "spain",
      "qing",
      "usa",
      "austria_hungary",
    ]) {
      const chosen = starterFor("B", starters, OPENING_MONTH, nation);
      expect(chosen, `${nation} B starter`).not.toBeNull();
      expect(chosen!.id.startsWith("starter_b_")).toBe(true);
      expect(REFERENCE_DESIGN_CLASSIFICATIONS[chosen!.id]).toBe("DOCTRINE_TEMPLATE");
      expect(HISTORICAL_B_STARTERS[nation]).toBeUndefined();
    }
  });

  it("never sets an import ceiling below the domestic one (it widens, never restricts)", () => {
    for (const profile of navalProfiles) {
      const caps = profile.hardCapabilities;
      if (caps.maxImportedGunCaliberUm !== undefined)
        expect(caps.maxImportedGunCaliberUm).toBeGreaterThanOrEqual(caps.maxGunCaliberUm);
    }
  });

  it.each(CONVERTED)(
    "%s: %s validates as a production draft and compiles legal as a capital ship",
    (nation, id) => {
      const draft = byId(id).draft;
      expect(validateDraftShape(JSON.parse(JSON.stringify(draft)))).toEqual([]);
      const { ctx } = shipBuildingContent.environmentFor(OPENING_MONTH, nation);
      const r = compileDesign(draft, ctx);
      expect(
        r.findings.filter((f) => f.severity === "BLOCKING" || f.severity === "CRITICAL"),
      ).toEqual([]);
      expect(r.valid).toBe(true);
      expect(r.naturalClass).toBe("B");
    },
  );

  it.each(CONVERTED)(
    "%s: %s does not exceed the nation's gun/armour/displacement ceilings",
    (nation, id) => {
      const profile = resolveNavalProfile(navalProfiles, nation, OPENING_MONTH)!;
      const caps = profile.hardCapabilities;
      const importCeiling = caps.maxImportedGunCaliberUm ?? caps.maxGunCaliberUm;
      const construction = resolveConstructionModifiers(profile, OPENING_MONTH);
      const draft = byId(id).draft;
      expect(draft.hull.targetDisplacementKg).toBeLessThanOrEqual(
        construction.maxPracticalDisplacementKg,
      );
      for (const region of draft.armour.regions)
        expect(region.thicknessUm).toBeLessThanOrEqual(caps.maxArmourThicknessUm);
      const { ctx } = shipBuildingContent.environmentFor(OPENING_MONTH, nation);
      const r = compileDesign(draft, ctx);
      for (const c of r.components) {
        const caliber = c.attr.caliberUm;
        if (caliber === undefined) continue;
        // An imported family may reach the import ceiling; a domestic one is capped by the domestic ceiling
        // (ADR-0114). The domestic ceiling itself is never inflated to admit an import.
        const status = profile.componentAccess[c.componentId]?.status ?? "DOMESTIC";
        const ceiling = status === "DOMESTIC" ? caps.maxGunCaliberUm : importCeiling;
        expect(caliber).toBeLessThanOrEqual(ceiling);
      }
    },
  );

  it.each(CONVERTED)("%s: %s uses no equipment the nation cannot obtain", (nation, id) => {
    const profile = resolveNavalProfile(navalProfiles, nation, OPENING_MONTH)!;
    for (const placement of byId(id).draft.placements)
      expect(profile.componentAccess[placement.componentId]?.status).not.toBe("UNAVAILABLE");
  });

  it.each([
    ["italy", "gun_rml_11in_25ton", "IMPORTED"],
    ["italy", "gun_rml_10in_18ton_broadside", "IMPORTED"],
    ["ottoman_empire", "gun_rml_10in_18ton", "IMPORTED"],
    ["ottoman_empire", "gun_rml_7in_7ton", "IMPORTED"],
    ["russia", "gun_rml_12in_25ton", "DOMESTIC"],
  ])("%s models %s as %s", (nation, familyId, status) => {
    const profile = resolveNavalProfile(navalProfiles, nation, OPENING_MONTH)!;
    expect(profile.componentAccess[familyId]?.status).toBe(status);
  });

  it.each(CONVERTED)(
    "%s: every gun in %s is a rifled muzzle-loader (no smoothbore/breech-loader substitution)",
    (_nation, id) => {
      const guns = byId(id).draft.placements.filter((p) => p.componentId.startsWith("gun_"));
      expect(guns.length).toBeGreaterThan(0);
      for (const gun of guns) expect(gun.componentId).toMatch(/^gun_rml_/);
    },
  );

  it.each(CONVERTED)(
    "%s: %s is mechanically distinct from the British capital starter",
    (nation, id) => {
      const promoted = mechanicalFingerprint(byId(id).draft);
      expect(promoted).not.toBe(mechanicalFingerprint(uk.draft));
      // Distinct from every other promoted/served capital starter too (not a shared shape re-skinned).
      for (const [otherNation, otherId] of CONVERTED)
        if (otherNation !== nation)
          expect(promoted, `${id} vs ${otherId}`).not.toBe(
            mechanicalFingerprint(byId(otherId).draft),
          );
    },
  );

  it("leaves the British starter untouched", () => {
    expect(uk.draft.nationId).toBe("uk");
    expect(uk.starterFor).toBe("B");
    expect(uk.draft.hull.hullFormId).toBe("coast_defence_form");
    expect(uk.draft.hull.targetDisplacementKg).toBe(9492000);
    expect(
      uk.draft.placements.some(
        (p) => p.componentId === "gun_rml_11in_25ton" && p.params?.barrels === 2,
      ),
    ).toBe(true);
  });

  it("keeps every converted nation's full opening roster resolvable and legal", () => {
    for (const [nation] of CONVERTED) {
      const { ctx } = shipBuildingContent.environmentFor(OPENING_MONTH, nation);
      for (const type of OPENING_TYPES) {
        const chosen = starterFor(type, starters, OPENING_MONTH, nation);
        expect(chosen, `${nation} ${type}`).not.toBeNull();
        const r = compileDesign(chosen!.draft, ctx);
        expect(r.valid, `${nation} ${type}`).toBe(true);
        expect(r.naturalClass, `${nation} ${type}`).toBe(type);
      }
    }
  });

  it("resolves the reference-design set deterministically", () => {
    const ids = () => readReferenceDesignEntries().map((d) => d.id);
    expect(ids()).toEqual(ids());
    const { ctx } = shipBuildingContent.environmentFor(OPENING_MONTH, "italy");
    const first = compileDesign(byId("principe_amedeo_1874").draft, ctx);
    const again = compileDesign(byId("principe_amedeo_1874").draft, ctx);
    expect(again.hash).toBe(first.hash);
  });
});
