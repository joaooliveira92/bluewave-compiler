import { describe, it, expect } from "vite-plus/test";
import {
  ARMAMENT_CONFIDENCE_LEVELS,
  ARMAMENT_PROVENANCE_KINDS,
  ARMAMENT_SOURCE_STATUSES,
} from "@bluewave/armament";
import {
  ARMAMENT_ADAPTER_UNMAPPED_FIELDS,
  CONFIDENCE_LEVELS,
  PROVENANCE_KINDS,
  SOURCE_STATUSES,
  adaptArmament,
  resolveArmamentFromContent,
  type ComponentDef,
  type GunModelDef,
  type MountType,
  type NationNavalProfile,
} from "../src/index.js";
import { components, navalProfiles, nationalContext } from "./helpers/earlyContext.js";

const MONTH = "1885-01";

const profileOf = (nationId: string): NationNavalProfile =>
  navalProfiles.find((p) => p.nationId === nationId)!;

const familyOf = (id: string): ComponentDef => components.find((c) => c.id === id)!;

const modelOf = (profile: NationNavalProfile, familyId: string): GunModelDef =>
  profile.gunModels.find((g) => g.familyId === familyId)!;

interface Representative {
  readonly nationId: string;
  readonly familyId: string;
  readonly modelId: string;
  readonly ammunitionId: string;
  readonly mountType: MountType;
}

const REPRESENTATIVES: readonly Representative[] = [
  {
    nationId: "uk",
    familyId: "gun_bl_12in_25",
    modelId: "uk_bl_12in_25_mk1",
    ammunitionId: "uk_ap_palliser",
    mountType: "BARBETTE",
  },
  {
    nationId: "france",
    familyId: "gun_bl_274mm_m1875",
    modelId: "fr_canon_274mm_mle1893",
    ammunitionId: "fr_melinite_he",
    mountType: "BARBETTE",
  },
  {
    nationId: "germany",
    familyId: "gun_bl_263mm_rkl20",
    modelId: "de_26cm_rk_l20",
    ammunitionId: "de_ap_krupp",
    mountType: "TURRET",
  },
];

const resolveRepresentative = (r: Representative) => {
  const profile = profileOf(r.nationId);
  return resolveArmamentFromContent({
    family: familyOf(r.familyId),
    model: modelOf(profile, r.familyId),
    mountType: r.mountType,
    gunCount: 2,
    ammunition: profile.ammunitionPatterns.find((a) => a.id === r.ammunitionId)!,
    month: MONTH,
    unlockedTechnologyIds: nationalContext(MONTH, r.nationId).unlockedTechs,
    profile,
  });
};

describe("armament compatibility adapter — UK / France / Germany", () => {
  it.each(REPRESENTATIVES)(
    "$nationId resolves a representative combination with grounded values",
    (r) => {
      const result = resolveRepresentative(r);
      expect(result.findings).toEqual([]);
      expect(result.ok).toBe(true);
      const resolved = result.resolved!;
      expect(resolved.gunModelId).toBe(r.modelId);
      expect(resolved.gunFamilyId).toBe(r.familyId);
      expect(resolved.ammunitionId).toBe(r.ammunitionId);
      expect(resolved.gunCount).toBe(2);
      expect(resolved.caliberUm).toBeGreaterThan(0);
      expect(resolved.shellMassG).toBeGreaterThan(0);
      expect(resolved.gunMassKg).toBeGreaterThan(0);
      expect(resolved.mountInstallationMassKg).toBeGreaterThan(0);
      expect(resolved.totalInstallationMassKg).toBeGreaterThan(resolved.mountInstallationMassKg!);
      expect(resolved.accessStatus).toBe("DOMESTIC");
      // Provenance survives the adapter.
      expect(resolved.provenance.gunModel.sources.length).toBeGreaterThan(0);
      expect(resolved.provenance.ammunition.sources.length).toBeGreaterThan(0);
    },
  );

  it("maps each nation's gun mass and mount mass from the shared family constants", () => {
    const uk = resolveRepresentative(REPRESENTATIVES[0]!).resolved!;
    const family = familyOf("gun_bl_12in_25");
    expect(uk.gunMassKg).toBe(family.constants.gun_kg);
    expect(uk.mountInstallationMassKg).toBe(
      (family.constants.mount_fixed_kg as number) +
        (family.constants.mount_per_barrel_kg as number) * 2,
    );
  });

  it("reports every domain field it cannot yet map from current content", () => {
    const adapted = adaptArmament({
      family: familyOf("gun_bl_12in_25"),
      model: modelOf(profileOf("uk"), "gun_bl_12in_25"),
      mountType: "BARBETTE",
      gunCount: 2,
      ammunition: profileOf("uk").ammunitionPatterns[0]!,
      month: MONTH,
      unlockedTechnologyIds: nationalContext(MONTH, "uk").unlockedTechs,
      profile: profileOf("uk"),
    });
    expect(adapted.unmapped).toBe(ARMAMENT_ADAPTER_UNMAPPED_FIELDS);
    expect(adapted.unmapped.some((f) => f.startsWith("gunModel.loadingSystem"))).toBe(true);
    expect(adapted.unmapped.some((f) => f.startsWith("gunMount.topWeightKg"))).toBe(true);
  });

  it("does not mutate the content it reads", () => {
    const profile = profileOf("uk");
    const family = familyOf("gun_bl_12in_25");
    const before = JSON.stringify({ family, model: modelOf(profile, "gun_bl_12in_25") });
    resolveRepresentative(REPRESENTATIVES[0]!);
    const after = JSON.stringify({ family, model: modelOf(profile, "gun_bl_12in_25") });
    expect(after).toBe(before);
  });

  it("blocks an unavailable national family and a not-yet-introduced model", () => {
    const uk = profileOf("uk");
    const unavailable: GunModelDef = {
      id: "test_uk_french_27cm",
      familyId: "gun_bl_274mm_m1875",
      designation: "Test overlay of an unavailable French gun",
      overrides: {},
      mounts: ["BARBETTE"],
      provenance: uk.gunModels[0]!.provenance,
    };
    const blocked = resolveArmamentFromContent({
      family: familyOf("gun_bl_274mm_m1875"),
      model: unavailable,
      mountType: "BARBETTE",
      gunCount: 1,
      ammunition: uk.ammunitionPatterns[0]!,
      month: MONTH,
      unlockedTechnologyIds: nationalContext(MONTH, "uk").unlockedTechs,
      profile: uk,
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.findings.map((f) => f.code)).toContain("ARMAMENT_ACCESS_UNAVAILABLE");

    const early = resolveArmamentFromContent({
      family: familyOf("gun_bl_12in_25"),
      model: modelOf(uk, "gun_bl_12in_25"),
      mountType: "BARBETTE",
      gunCount: 2,
      ammunition: uk.ammunitionPatterns[0]!,
      month: "1880-01",
      unlockedTechnologyIds: nationalContext("1880-01", "uk").unlockedTechs,
      profile: uk,
    });
    expect(early.findings.map((f) => f.code)).toContain("ARMAMENT_BEFORE_INTRODUCTION");
  });
});

describe("armament provenance vocabulary parity", () => {
  it("keeps the armament package vocabulary identical to the canonical national-profile vocabulary", () => {
    expect([...ARMAMENT_SOURCE_STATUSES]).toEqual([...SOURCE_STATUSES]);
    expect([...ARMAMENT_CONFIDENCE_LEVELS]).toEqual([...CONFIDENCE_LEVELS]);
    expect([...ARMAMENT_PROVENANCE_KINDS]).toEqual([...PROVENANCE_KINDS]);
  });
});
