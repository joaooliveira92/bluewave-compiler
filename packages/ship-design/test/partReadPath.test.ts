import { describe, expect, it } from "vite-plus/test";
import {
  COMPATIBILITY_GUN_SLOT_TEMPLATE,
  armamentMountFor,
  basisMultiplier,
  buildCompatibilitySlots,
  buildGunPartModel,
  componentAccessOf,
  gunKey,
  nationHasArmamentContent,
  quantityLines,
  resolveGunPlacementThroughParts,
  resolveInstalledWeapon,
  toCompiledWeaponArmament,
  type DesignDraft,
  type GunPartRequest,
  type PartQuantity,
  type PlacementSpec,
} from "../src/index.js";
import {
  armamentContent,
  components,
  earlyContext,
  hullRecords,
  readReferenceDesignEntries,
} from "./helpers/earlyContext.js";

const GUN = new Set(["MAIN_GUN", "SECONDARY_GUN", "DUAL_PURPOSE_GUN", "AA_WEAPON"]);

const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

interface Design {
  readonly id: string;
  readonly month: string;
  readonly draft: DesignDraft;
}

interface GunPlacement {
  readonly design: Design;
  readonly placement: PlacementSpec;
  readonly familyId: string;
}

const designs: Design[] = readReferenceDesignEntries();

const placements: GunPlacement[] = [];
const requests: GunPartRequest[] = [];
for (const design of designs) {
  for (const placement of design.draft.placements) {
    const component = components.find((c) => c.id === placement.componentId);
    if (component === undefined || !GUN.has(component.category)) continue;
    placements.push({ design, placement, familyId: component.id });
    requests.push({ nationId: design.draft.nationId, familyId: component.id });
  }
}

const gunPartModel = buildGunPartModel({ content: armamentContent, components, requests });
const compatibility = buildCompatibilitySlots({ hullForms: hullRecords });
const gunSlotTemplate = compatibility.slotTemplates.find(
  (t) => t.id === COMPATIBILITY_GUN_SLOT_TEMPLATE,
)!;

const compileThroughParts = (row: GunPlacement) => {
  const ctx = earlyContext(row.design.month);
  const nationId = row.design.draft.nationId;
  const useFirstClassArmament = nationHasArmamentContent(armamentContent, nationId);
  const componentAccess = componentAccessOf(ctx.navalProfile);
  return {
    ctx,
    nationId,
    useFirstClassArmament,
    componentAccess,
    got: resolveGunPlacementThroughParts({
      content: armamentContent,
      components,
      model: gunPartModel,
      designId: row.design.id,
      placement: row.placement,
      nationId,
      familyId: row.familyId,
      month: row.design.month,
      unlockedTechnologyIds: ctx.unlockedTechs,
      componentAccess,
      useFirstClassArmament,
    }),
  };
};

describe("gun and mount read path over today's content (P1 tracer)", () => {
  it("covers all 91 reference designs and all 230 gun placements", () => {
    expect(designs.length).toBe(91);
    expect(placements.length).toBe(230);
  });

  it("translates every placement so mountCount x gunsPerMount is the legacy barrels", () => {
    for (const row of placements) {
      const { got } = compileThroughParts(row);
      const t = got.translation;
      expect(t, `${row.design.id}:${row.placement.instanceId}`).not.toBeNull();
      const barrels = row.placement.params?.barrels ?? 1;
      expect(t!.legacyBarrels).toBe(barrels);
      expect(t!.containedUnits).toBe(barrels);
      expect(t!.mountCount * t!.gunsPerMount).toBe(barrels);
      // A nested entry's part units are its parent's contained units (SPM-R13).
      expect(t!.entries.guns[0]!.mountCount).toBe(t!.containedUnits);
    }
  });

  it("is byte-identical to the legacy resolver except the D17 identity paths", () => {
    let resolved = 0;
    let reclassified = 0;
    for (const row of placements) {
      const { ctx, nationId, useFirstClassArmament, componentAccess, got } =
        compileThroughParts(row);
      const barrels = row.placement.params?.barrels ?? 1;
      const where = `${row.design.id}:${row.placement.instanceId}`;

      const legacy = useFirstClassArmament
        ? resolveInstalledWeapon({
            content: armamentContent,
            components,
            nationId,
            familyId: row.familyId,
            gunCount: barrels,
            month: row.design.month,
            unlockedTechnologyIds: ctx.unlockedTechs,
            componentAccess,
          })
        : { resolved: null, mountType: null };

      if (legacy.resolved === null) {
        // The compatibility path emits no compiled armament in the legacy compile either.
        expect(got.resolved, where).toBeNull();
        expect(got.compiled, where).toBeNull();
        continue;
      }
      resolved += 1;
      const legacyCompiled = toCompiledWeaponArmament(
        legacy.resolved,
        legacy.mountType!,
        row.placement.instanceId,
      );
      const t = got.translation!;
      const isReclassified = t.disposition !== null;
      if (isReclassified) {
        reclassified += 1;
        expect(t.mountType, where).toBe("BROADSIDE_BATTERY");
        expect(String(got.resolved!.mountId), where).not.toBe(String(legacy.resolved.mountId));
        expect(got.compiled!.mountType, where).not.toBe(legacyCompiled.mountType);
        expect(got.resolved, where).toEqual({
          ...legacy.resolved,
          mountId: got.resolved!.mountId,
        });
        expect(got.compiled, where).toEqual({
          ...legacyCompiled,
          mountId: got.compiled!.mountId,
          mountType: got.compiled!.mountType,
        });
      } else {
        expect(got.resolved, where).toEqual(legacy.resolved);
        expect(got.compiled, where).toEqual(legacyCompiled);
      }
    }
    // Only france/germany/uk carry first-class armament; the rest use the legacy
    // compatibility path (no compiled armament) in both pipelines.
    expect(resolved).toBe(68);
    // The six D17 placements that resolve are the two each on Redoutable, Kaiser and
    // Sachsen; the three Mesudiye entries fall on the Ottoman compatibility path.
    expect(reclassified).toBe(6);
  });

  it("reads hull forms as platforms with a compatibility slot per zone", () => {
    expect(compatibility.platforms.length).toBe(hullRecords.length);
    expect(new Set(compatibility.platforms.map((p) => p.id))).toEqual(
      new Set(hullRecords.map((h) => h.id)),
    );
    for (const platform of compatibility.platforms) {
      expect(platform.slotTemplates).toContain(COMPATIBILITY_GUN_SLOT_TEMPLATE);
    }
    const zones = [...new Set(hullRecords.flatMap((h) => h.zones.map((z) => z.id)))].sort(cmpStr);
    expect(gunSlotTemplate.slots.map((s) => String(s.zone)).sort(cmpStr)).toEqual(zones);
    for (const slot of gunSlotTemplate.slots) {
      expect(slot.accepts).toContain("gun_mount");
    }
    // Every gun placement lands in a zone slot that accepts the mount, and the mount's
    // own `guns` slot holds exactly `gunsPerMount` guns (SPM-R3).
    const slotZones = new Set(gunSlotTemplate.slots.map((s) => s.zone));
    for (const row of placements) {
      const { got } = compileThroughParts(row);
      const t = got.translation!;
      expect(
        slotZones.has(row.placement.zoneId),
        `${row.design.id}:${row.placement.instanceId}`,
      ).toBe(true);
      expect(t.entries.mount.slot).toBe(row.placement.zoneId.toLowerCase());
      const gunsSlot = t.mountPart.slots.find((s) => s.id === "guns")!;
      expect(gunsSlot.accepts).toEqual(["gun"]);
      expect(gunsSlot.mountCount).toEqual({ min: t.gunsPerMount, max: t.gunsPerMount });
    }
  });

  it("applies each basis multiplier from the entry counts, never the family", () => {
    expect(basisMultiplier("PER_LOADOUT_ENTRY", 3, 2)).toBe(1);
    expect(basisMultiplier("PER_PART_UNIT", 3, 2)).toBe(3);
    expect(basisMultiplier("PER_CONTAINED_UNIT", 3, 2)).toBe(6);

    // A deliberately unusual basis on a gun part still multiplies the way its basis
    // says, not the way the gun family's usual `PER_PART_UNIT` would.
    const unusual: readonly PartQuantity[] = [
      { id: "gun_mass", kind: "massKg", value: 100, basis: "PER_LOADOUT_ENTRY" },
    ];
    expect(quantityLines(unusual, "gun", 5, 4)).toEqual([
      {
        id: "gun_mass",
        kind: "massKg",
        scope: "gun",
        value: 100,
        basis: "PER_LOADOUT_ENTRY",
        multiplier: 1,
        contribution: 100,
      },
    ]);
  });

  it("hand-works the three bases for a 1-mount, 2-gun turret entry", () => {
    const row = placements.find(
      (p) =>
        (p.placement.params?.barrels ?? 1) === 2 &&
        gunPartModel.byKey.get(gunKey(p.design.draft.nationId, p.familyId))?.resolvedMountType ===
          "TURRET",
    );
    expect(row, "a 2-barrel turret placement exists").toBeDefined();
    const t = compileThroughParts(row!).got.translation!;
    expect(t.mountCount).toBe(1);
    expect(t.gunsPerMount).toBe(2);
    expect(t.containedUnits).toBe(2);
    expect(t.entries.guns[0]!.mountCount).toBe(t.containedUnits);
    const mountFixed = t.quantities.find(
      (q) => q.scope === "mount" && q.id === "installation_fixed",
    );
    if (mountFixed !== undefined) {
      expect(mountFixed.basis).toBe("PER_LOADOUT_ENTRY");
      expect(mountFixed.multiplier).toBe(1);
    }
    const perGun = t.quantities.find((q) => q.scope === "mount" && q.id === "installation_per_gun");
    if (perGun !== undefined) {
      expect(perGun.basis).toBe("PER_CONTAINED_UNIT");
      expect(perGun.multiplier).toBe(2);
    }
    const gunMass = t.quantities.find((q) => q.scope === "gun" && q.id === "gun_mass");
    if (gunMass !== undefined) {
      expect(gunMass.basis).toBe("PER_PART_UNIT");
      expect(gunMass.multiplier).toBe(2);
    }
  });

  it("reclassifies exactly the nine central-battery placements as battery assemblies", () => {
    const translations = placements.map((row) => compileThroughParts(row).got.translation!);
    const d17 = translations.filter((t) => t.disposition === "RECLASSIFIED_AS_CENTRAL_BATTERY");
    expect(d17.map((t) => `${t.designId}:${t.instanceId}`).sort(cmpStr)).toEqual([
      "kaiser_1875:main_aft",
      "kaiser_1875:main_fwd",
      "mesudiye_1875:main_aft",
      "mesudiye_1875:main_fwd",
      "mesudiye_1875:sec",
      "redoutable_1878:main_aft",
      "redoutable_1878:main_fwd",
      "sachsen_1878:main_aft",
      "sachsen_1878:main_fwd",
    ]);
    for (const t of d17) {
      const where = `${t.designId}:${t.instanceId}`;
      expect(t.mountCount, where).toBe(1);
      expect(t.gunsPerMount, where).toBe(t.legacyBarrels);
      expect(t.containedUnits, where).toBe(t.legacyBarrels);
      expect(t.mountType, where).toBe("BROADSIDE_BATTERY");
      const legacyMount = armamentMountFor(
        armamentContent,
        components,
        t.familyId,
        t.legacyResolvedMountType,
        t.legacyBarrels,
      )!;
      const fixed = t.quantities.find((q) => q.scope === "mount" && q.id === "installation_fixed");
      if (legacyMount.baseInstallationMassKg === undefined) {
        expect(fixed).toBeUndefined();
      } else {
        expect(fixed?.basis, where).toBe("PER_LOADOUT_ENTRY");
        expect(fixed?.multiplier, where).toBe(1);
        expect(fixed?.value, where).toBe(legacyMount.baseInstallationMassKg);
        expect(fixed?.contribution, where).toBe(legacyMount.baseInstallationMassKg);
      }
      expect(t.entries.mount.part, where).toContain("central_battery");
    }
  });
});
