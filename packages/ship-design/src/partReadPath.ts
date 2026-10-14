/**
 * The P1 gun and mount read path (ship-part-model SPM-R3, R6, R13, R14, R16, R19, R20;
 * proposal rev 4.1 §9.2). It is additive: production content, saves, visual YAML and
 * every golden are untouched, and the production pipeline stays on the legacy path.
 *
 * An in-memory **adapter** reads today's armament catalogue (`components.yaml` gun
 * families plus the authored `ship-building/armament/*.yaml` national models and
 * mounts) as `gun` and `gun_mount` **parts**, and today's hull forms as **platforms**
 * with a compatibility **slot template**. A reference design's gun placement is
 * translated to **loadout entries** exactly as §9.2 requires — one placement → one
 * entry, `mountCount` × `gunsPerMount` = the legacy barrel count — and its quantities
 * are compiled through their declared **application basis** (SPM-R13). The compiled
 * armament inputs are then fed to the existing `@bluewave/armament` resolver, so the
 * `ResolvedArmament` and compiled weapon contract are byte-identical to the legacy
 * path for every design except the nine D17 identity paths (`mountType`, `mountId`).
 *
 * Translation (§9.2 / SPM-R20):
 * - CASEMATE / BROADSIDE_BATTERY / DECK_SHIELDED / DECK_OPEN with `n` barrels →
 *   `mountCount: n`, `gunsPerMount: 1`;
 * - TURRET / BARBETTE with 1–2 barrels → `mountCount: 1`, `gunsPerMount: barrels`;
 * - TURRET / BARBETTE with ≥ 3 barrels (the nine central-battery placements) → one
 *   **battery assembly** (`mountCount: 1`, `gunsPerMount: barrels`, canonical
 *   `mountType: BROADSIDE_BATTERY`), with the legacy resolved type and the
 *   `RECLASSIFIED_AS_CENTRAL_BATTERY` disposition kept in migration provenance only.
 *
 * Ammunition is **not** modelled here: the gun rows are in memory only, so the read
 * path resolves the nation's ammunition exactly as the legacy path does. Ammunition
 * parts belong to ship-part-model ticket 05. The compatibility-path placements (a
 * nation with no first-class armament content) resolve nothing here, matching the
 * legacy compile; `useFirstClassArmament` carries that gate so P2 can drop it. The
 * gun-mount `spec` carries no `hullSpaceUsageLitre` (SPM-R1 does not define one and
 * today's mounts author none), so that resolved field stays absent, as it is today.
 */
import {
  armamentNationId,
  armamentTechnologyId,
  gunFamilyId,
  gunModelId,
  gunMountId,
  resolveArmament,
  toCompiledArmamentMount,
  type AmmunitionPattern as ArmamentAmmunitionPattern,
  type ArmamentAccessStatus,
  type ArmamentMountType,
  type ArmamentProvenance,
  type ArmamentResolutionFinding,
  type ArmamentTechnologyContext,
  type CompiledArmamentMount,
  type GunModel as ArmamentGunModel,
  type GunMountDef as ArmamentGunMountDef,
  type ResolvedArmament,
} from "@bluewave/armament";
import {
  armamentAmmunitionFor,
  armamentModelFor,
  armamentMountFor,
  type AuthoredArmamentContent,
} from "./armamentContent.js";
import type { ComponentDef } from "./component.js";
import type { PlacementSpec } from "./compileShared.js";

/** How a quantity component scales (SPM-R5, D3). Closed at three values. */
export type PartBasis = "PER_LOADOUT_ENTRY" | "PER_PART_UNIT" | "PER_CONTAINED_UNIT";

/** What a quantity component measures (SPM-R5). */
export type QuantityKind = "massKg" | "costMicro" | "crew" | "volumeLitre" | "deckFootprintMm2";

/** The one disposition a translated D17 central-battery entry carries (proposal §9.2). */
export type TranslationDisposition = "RECLASSIFIED_AS_CENTRAL_BATTERY";

/** One quantity component on a part (SPM-R1/R5): a value and its required basis. */
export interface PartQuantity {
  readonly id: string;
  readonly kind: QuantityKind;
  readonly value: number;
  readonly basis: PartBasis;
}

/** The gun family `spec` (SPM-R1), the fields a national model carries. */
export interface GunPartSpec {
  readonly calibreUm: number;
  readonly barrelLengthCalibers?: number;
  readonly gunMassKg?: number;
  readonly loadingSystem?: string;
  readonly nominalMuzzleVelocityUmPerSec?: number;
  readonly mechanicalRateOfFireRoundsPerMinuteX100?: number;
  readonly propellantChargeBp?: number;
  readonly shellMassG?: number;
  readonly roundVolumeMl?: number;
  readonly reliabilityBp?: number;
}

/** A `gun` part read from today's content (SPM-R1). `id` is the legacy gun-model id. */
export interface GunPartData {
  readonly id: string;
  /** The legacy armament family id (`components.yaml` gun id). */
  readonly familyId: string;
  readonly nation: string;
  readonly name: string;
  readonly spec: GunPartSpec;
  /** Quantity components; gun mass is `PER_PART_UNIT` (SPM-R20). */
  readonly quantities: readonly PartQuantity[];
  /**
   * The legacy resolved mount type for this model: the model's first supported type,
   * else `DECK_OPEN` (the compatibility default). The new model chooses the mount type
   * through the mount part/slot; this records the translation's chosen type (SPM-R20).
   */
  readonly resolvedMountType: ArmamentMountType;
  readonly lifecycle: {
    readonly availableFrom: string;
    readonly availableUntil: string | null;
    readonly requires: readonly string[];
  };
  readonly provenance: ArmamentProvenance;
}

/** The gun-mount family `spec` (SPM-R1). Base/per-gun mass live in `quantities`. */
export interface GunMountPartSpec {
  readonly mountType: ArmamentMountType;
  /** Guns in one mount (D2). Total guns = `mountCount × gunsPerMount`. */
  readonly gunsPerMount: number;
  readonly topWeightKg?: number;
  readonly supportedArmorMm?: number;
  readonly traverseDeg?: number;
  readonly elevationMinDeg?: number;
  readonly elevationMaxDeg?: number;
  readonly firingArcDeg?: number;
  readonly rateOfFireModifierBp?: number;
  readonly ammunitionHandlingModifierBp?: number;
  readonly crewProtection?: string;
  readonly stabilityContributionKgM?: number;
  readonly vulnerability?: string;
}

/** A `gun_mount` part read from today's content (SPM-R1). `id` is the legacy mount id. */
export interface GunMountPartData {
  readonly id: string;
  /** The legacy armament family id the mount accepts. */
  readonly familyId: string;
  readonly spec: GunMountPartSpec;
  /** `installation_fixed` (`PER_LOADOUT_ENTRY`) and `installation_per_gun` (`PER_CONTAINED_UNIT`). */
  readonly quantities: readonly PartQuantity[];
  /** The mount's own `guns` slot; its count is `gunsPerMount` (SPM-R3). */
  readonly slots: readonly SlotData[];
  readonly lifecycle: {
    readonly availableFrom?: string;
    readonly availableUntil: string | null;
    readonly requires: readonly string[];
  };
  readonly provenance: ArmamentProvenance;
}

/** The in-memory part index the adapter builds (parts by `nation` × `family`). */
export interface GunPartModel {
  readonly byKey: ReadonlyMap<string, GunPartData>;
}

// ---------------------------------------------------------------------------
// Platforms and compatibility slot templates (SPM-R3; the gun slice)
// ---------------------------------------------------------------------------

/** The `interfaces/1` values the gun slice reads; ticket 05 widens the vocabulary. */
export type PartInterface = "gun" | "gun_mount";

/** A named mount point (SPM-R3). A platform slot names its zone; a part's own slot need not. */
export interface SlotData {
  readonly id: string;
  readonly accepts: readonly PartInterface[];
  readonly zone?: string;
  readonly mountCount?: { readonly min: number; readonly max: number };
}

/** A shared, named set of slots that platforms reuse (SPM-R3). */
export interface SlotTemplateData {
  readonly id: string;
  readonly slots: readonly SlotData[];
}

/** A hull form as a platform whose mounted parts fill its slots (SPM-R3). */
export interface PlatformData {
  readonly id: string;
  readonly hullForm: string;
  readonly slotTemplates: readonly string[];
  readonly slots: readonly SlotData[];
}

/** The one shared compatibility template that carries the gun mounts. */
export const COMPATIBILITY_GUN_SLOT_TEMPLATE = "compatibility_gun_slots";

/** The slot a zone renders as (SPM-R3): one lower snake id per zone. */
export function slotIdForZone(zoneId: string): string {
  return zoneId.toLowerCase();
}

export interface CompatibilityModel {
  readonly slotTemplates: readonly SlotTemplateData[];
  readonly platforms: readonly PlatformData[];
}

/**
 * Read today's hull forms as platforms with a shared compatibility slot template: one
 * slot per zone, accepting today's gun mounts (SPM-R19). Every reference design stays
 * legal, because a gun placement maps to its zone's slot; other families add their
 * slots in ship-part-model tickets 04–06.
 */
export function buildCompatibilitySlots(input: {
  readonly hullForms: readonly {
    readonly id: string;
    readonly zones: readonly { readonly id: string }[];
  }[];
}): CompatibilityModel {
  const zoneIds = [...new Set(input.hullForms.flatMap((h) => h.zones.map((z) => z.id)))].sort();
  const slots: readonly SlotData[] = zoneIds.map((zone) => ({
    id: slotIdForZone(zone),
    accepts: ["gun_mount"],
    zone,
  }));
  return {
    slotTemplates: [{ id: COMPATIBILITY_GUN_SLOT_TEMPLATE, slots }],
    platforms: input.hullForms.map((hull) => ({
      id: hull.id,
      hullForm: hull.id,
      slotTemplates: [COMPATIBILITY_GUN_SLOT_TEMPLATE],
      slots: [],
    })),
  };
}

export interface GunPartRequest {
  readonly nationId: string;
  readonly familyId: string;
}

/** A stable key for the part index. `\u0000` cannot appear in an id. */
export function gunKey(nationId: string, familyId: string): string {
  return `${nationId}\u0000${familyId}`;
}

/** The mount types whose legacy `barrels` means guns in a whole battery, not one mount. */
const SINGLE_GUN_MOUNTS: ReadonlySet<ArmamentMountType> = new Set([
  "CASEMATE",
  "BROADSIDE_BATTERY",
  "DECK_SHIELDED",
  "DECK_OPEN",
]);

/** The rotating mount types whose 1–2 barrels are guns in one mount. */
const MULTI_GUN_MOUNTS: ReadonlySet<ArmamentMountType> = new Set(["TURRET", "BARBETTE"]);

/**
 * The basis multiplier for one entry's quantity component (SPM-R13). It is a pure
 * function of the declared basis and the entry's counts — never of the part family or
 * kind: `PER_LOADOUT_ENTRY` → 1, `PER_PART_UNIT` → `mountCount`,
 * `PER_CONTAINED_UNIT` → `mountCount × gunsPerMount`.
 */
export function basisMultiplier(
  basis: PartBasis,
  mountCount: number,
  gunsPerMount: number,
): number {
  switch (basis) {
    case "PER_LOADOUT_ENTRY":
      return 1;
    case "PER_PART_UNIT":
      return mountCount;
    case "PER_CONTAINED_UNIT":
      return mountCount * gunsPerMount;
  }
}

/** One compiled quantity line: value × multiplier = contribution (SPM-R13/R14). */
export interface QuantityLine {
  readonly id: string;
  readonly kind: QuantityKind;
  /** Which part the component belongs to. */
  readonly scope: "mount" | "gun";
  readonly value: number;
  readonly basis: PartBasis;
  readonly multiplier: number;
  readonly contribution: number;
}

/** Compile a part's quantity components at an entry's counts (SPM-R13). */
export function quantityLines(
  quantities: readonly PartQuantity[],
  scope: "mount" | "gun",
  mountCount: number,
  gunsPerMount: number,
): QuantityLine[] {
  return quantities.map((q) => {
    const multiplier = basisMultiplier(q.basis, mountCount, gunsPerMount);
    return {
      id: q.id,
      kind: q.kind,
      scope,
      value: q.value,
      basis: q.basis,
      multiplier,
      contribution: q.value * multiplier,
    };
  });
}

// ---------------------------------------------------------------------------
// The adapter: today's content → gun and gun-mount parts
// ---------------------------------------------------------------------------

function gunPartFromModel(nationId: string, model: ArmamentGunModel): GunPartData {
  if (model.caliberUm === undefined) {
    throw new Error(
      `partReadPath: gun model '${String(model.id)}' has no caliberUm; a gun part needs one`,
    );
  }
  if (model.introductionMonth === undefined) {
    throw new Error(
      `partReadPath: gun model '${String(model.id)}' has no introductionMonth; a part lifecycle needs one`,
    );
  }
  const spec: GunPartSpec = {
    calibreUm: model.caliberUm,
    ...(model.barrelLengthCalibers !== undefined
      ? { barrelLengthCalibers: model.barrelLengthCalibers }
      : {}),
    ...(model.gunMassKg !== undefined ? { gunMassKg: model.gunMassKg } : {}),
    ...(model.loadingSystem !== undefined ? { loadingSystem: model.loadingSystem } : {}),
    ...(model.nominalMuzzleVelocityUmPerSec !== undefined
      ? { nominalMuzzleVelocityUmPerSec: model.nominalMuzzleVelocityUmPerSec }
      : {}),
    ...(model.mechanicalRateOfFireRoundsPerMinuteX100 !== undefined
      ? { mechanicalRateOfFireRoundsPerMinuteX100: model.mechanicalRateOfFireRoundsPerMinuteX100 }
      : {}),
    ...(model.propellantChargeBp !== undefined
      ? { propellantChargeBp: model.propellantChargeBp }
      : {}),
    ...(model.shellMassG !== undefined ? { shellMassG: model.shellMassG } : {}),
    ...(model.roundVolumeMl !== undefined ? { roundVolumeMl: model.roundVolumeMl } : {}),
    ...(model.reliabilityBp !== undefined ? { reliabilityBp: model.reliabilityBp } : {}),
  };
  return {
    id: String(model.id),
    familyId: String(model.familyId),
    nation: nationId,
    name: model.designation,
    spec,
    quantities:
      model.gunMassKg === undefined
        ? []
        : [{ id: "gun_mass", kind: "massKg", value: model.gunMassKg, basis: "PER_PART_UNIT" }],
    resolvedMountType: model.supportedMountTypes?.[0] ?? "DECK_OPEN",
    lifecycle: {
      availableFrom: model.introductionMonth,
      availableUntil: model.retirementMonth ?? null,
      requires: (model.requiredTechnologyIds ?? []).map(String),
    },
    provenance: model.provenance,
  };
}

/**
 * Build the in-memory gun-part index from today's content (SPM-R19). The adapter reads
 * the shared gun families and the national models/variants through `armamentModelFor`,
 * so a national override (or the family-derived fallback) becomes one `gun` part.
 */
export function buildGunPartModel(input: {
  readonly content: AuthoredArmamentContent;
  readonly components: readonly ComponentDef[];
  readonly requests: readonly GunPartRequest[];
}): GunPartModel {
  const byKey = new Map<string, GunPartData>();
  for (const { nationId, familyId } of input.requests) {
    const key = gunKey(nationId, familyId);
    if (byKey.has(key)) continue;
    const model = armamentModelFor(input.content, input.components, nationId, familyId);
    if (model === null) continue;
    byKey.set(key, gunPartFromModel(nationId, model));
  }
  return { byKey };
}

function mountPartFromLegacy(
  id: string,
  mountType: ArmamentMountType,
  gunsPerMount: number,
  legacy: ArmamentGunMountDef,
): GunMountPartData {
  const spec: GunMountPartSpec = {
    mountType,
    gunsPerMount,
    ...(legacy.topWeightKg !== undefined ? { topWeightKg: legacy.topWeightKg } : {}),
    ...(legacy.supportedArmorMm !== undefined ? { supportedArmorMm: legacy.supportedArmorMm } : {}),
    ...(legacy.traverseDeg !== undefined ? { traverseDeg: legacy.traverseDeg } : {}),
    ...(legacy.elevationMinDeg !== undefined ? { elevationMinDeg: legacy.elevationMinDeg } : {}),
    ...(legacy.elevationMaxDeg !== undefined ? { elevationMaxDeg: legacy.elevationMaxDeg } : {}),
    ...(legacy.firingArcDeg !== undefined ? { firingArcDeg: legacy.firingArcDeg } : {}),
    ...(legacy.rateOfFireModifierBp !== undefined
      ? { rateOfFireModifierBp: legacy.rateOfFireModifierBp }
      : {}),
    ...(legacy.ammunitionHandlingModifierBp !== undefined
      ? { ammunitionHandlingModifierBp: legacy.ammunitionHandlingModifierBp }
      : {}),
    ...(legacy.crewProtection !== undefined ? { crewProtection: legacy.crewProtection } : {}),
    ...(legacy.stabilityContributionKgM !== undefined
      ? { stabilityContributionKgM: legacy.stabilityContributionKgM }
      : {}),
    ...(legacy.vulnerability !== undefined ? { vulnerability: legacy.vulnerability } : {}),
  };
  const quantities: PartQuantity[] = [];
  if (legacy.baseInstallationMassKg !== undefined) {
    quantities.push({
      id: "installation_fixed",
      kind: "massKg",
      value: legacy.baseInstallationMassKg,
      basis: "PER_LOADOUT_ENTRY",
    });
  }
  if (legacy.perGunInstallationMassKg !== undefined) {
    quantities.push({
      id: "installation_per_gun",
      kind: "massKg",
      value: legacy.perGunInstallationMassKg,
      basis: "PER_CONTAINED_UNIT",
    });
  }
  return {
    id,
    familyId: (legacy.compatibleGunFamilies ?? []).map(String)[0] ?? "",
    spec,
    quantities,
    slots: [
      {
        id: "guns",
        accepts: ["gun"],
        mountCount: { min: gunsPerMount, max: gunsPerMount },
      },
    ],
    lifecycle: {
      ...(legacy.introductionMonth !== undefined
        ? { availableFrom: legacy.introductionMonth }
        : {}),
      availableUntil: legacy.retirementMonth ?? null,
      requires: (legacy.requiredTechnologyIds ?? []).map(String),
    },
    provenance: legacy.provenance,
  };
}

/** The result of translating one gun placement's mount (§9.2, D17). */
export interface GunMountTranslation {
  readonly part: GunMountPartData;
  readonly mountType: ArmamentMountType;
  readonly disposition: TranslationDisposition | null;
}

/**
 * Build the mount part for one placement, applying the §9.2 translation. The legacy
 * resolved mount record supplies the installation masses and firing arc, so every
 * translated value is preserved; a ≥3-barrel turret/barbette becomes the D17 battery
 * assembly (`BROADSIDE_BATTERY`, canonical id) instead.
 */
export function buildGunMountPart(input: {
  readonly content: AuthoredArmamentContent;
  readonly components: readonly ComponentDef[];
  readonly familyId: string;
  readonly legacyMountType: ArmamentMountType;
  readonly barrels: number;
}): GunMountTranslation {
  const legacy = armamentMountFor(
    input.content,
    input.components,
    input.familyId,
    input.legacyMountType,
    input.barrels,
  );
  if (legacy === null) {
    throw new Error(
      `partReadPath: no mount for family '${input.familyId}' in a ${input.legacyMountType} mount`,
    );
  }
  if (SINGLE_GUN_MOUNTS.has(input.legacyMountType)) {
    return {
      part: mountPartFromLegacy(String(legacy.id), input.legacyMountType, 1, legacy),
      mountType: input.legacyMountType,
      disposition: null,
    };
  }
  if (MULTI_GUN_MOUNTS.has(input.legacyMountType)) {
    if (input.barrels >= 3) {
      // D17: the canonical central-battery assembly; the legacy resolved type and the
      // disposition live in migration provenance only (never in simulation content).
      return {
        part: mountPartFromLegacy(
          `${input.familyId}_central_battery_${input.barrels}`,
          "BROADSIDE_BATTERY",
          input.barrels,
          legacy,
        ),
        mountType: "BROADSIDE_BATTERY",
        disposition: "RECLASSIFIED_AS_CENTRAL_BATTERY",
      };
    }
    return {
      part: mountPartFromLegacy(String(legacy.id), input.legacyMountType, input.barrels, legacy),
      mountType: input.legacyMountType,
      disposition: null,
    };
  }
  throw new Error(
    `partReadPath: mount type '${input.legacyMountType}' is not a gun mount (family '${input.familyId}')`,
  );
}

/** One gun placement rendered in the new model (SPM-R6, R13, R14, R16). */
export interface GunPlacementTranslation {
  readonly designId: string;
  readonly instanceId: string;
  readonly nationId: string;
  readonly familyId: string;
  /** The legacy placement's barrels (its `params.barrels`). */
  readonly legacyBarrels: number;
  /** The legacy resolved mount type, before any D17 reclassification. */
  readonly legacyResolvedMountType: ArmamentMountType;
  /** The canonical translated mount type. */
  readonly mountType: ArmamentMountType;
  readonly mountCount: number;
  readonly gunsPerMount: number;
  /** `mountCount × gunsPerMount` = the legacy barrel count. */
  readonly containedUnits: number;
  readonly disposition: TranslationDisposition | null;
  readonly mountPart: GunMountPartData;
  readonly gunPart: GunPartData;
  /** The loadout entries: the mount entry in its zone slot, with its nested gun entry. */
  readonly entries: {
    readonly mount: { readonly part: string; readonly slot: string; readonly mountCount: number };
    readonly guns: readonly {
      readonly part: string;
      readonly slot: string;
      readonly mountCount: number;
    }[];
  };
  /** Every quantity component compiled at this entry's counts. */
  readonly quantities: readonly QuantityLine[];
}

/**
 * Translate one gun placement into loadout entries (SPM-R20, §9.2). The mount type is
 * the model's first supported type, else the family's (proposal §9.2 "general rule"),
 * carried on the gun part; a missing `mountCount` defaults to 1 (SPM-R6).
 */
export function translateGunPlacement(input: {
  readonly designId: string;
  readonly placement: PlacementSpec;
  readonly nationId: string;
  readonly gunPart: GunPartData;
  readonly content: AuthoredArmamentContent;
  readonly components: readonly ComponentDef[];
}): GunPlacementTranslation {
  const legacyBarrels = input.placement.params?.barrels ?? 1;
  const legacyMountType = input.gunPart.resolvedMountType;
  const mount = buildGunMountPart({
    content: input.content,
    components: input.components,
    familyId: input.gunPart.familyId,
    legacyMountType,
    barrels: legacyBarrels,
  });
  const mountCount = SINGLE_GUN_MOUNTS.has(legacyMountType) ? legacyBarrels : 1;
  const gunsPerMount = mount.part.spec.gunsPerMount;
  const containedUnits = mountCount * gunsPerMount;
  return {
    designId: input.designId,
    instanceId: input.placement.instanceId,
    nationId: input.nationId,
    familyId: input.gunPart.familyId,
    legacyBarrels,
    legacyResolvedMountType: legacyMountType,
    mountType: mount.mountType,
    mountCount,
    gunsPerMount,
    containedUnits,
    disposition: mount.disposition,
    mountPart: mount.part,
    gunPart: input.gunPart,
    entries: {
      mount: { part: mount.part.id, slot: slotIdForZone(input.placement.zoneId), mountCount },
      guns: [{ part: input.gunPart.id, slot: "guns", mountCount: containedUnits }],
    },
    quantities: [
      ...quantityLines(mount.part.quantities, "mount", mountCount, gunsPerMount),
      ...quantityLines(input.gunPart.quantities, "gun", containedUnits, 1),
    ],
  };
}

// ---------------------------------------------------------------------------
// Compiling the entries back through the existing armament resolver (SPM-R16)
// ---------------------------------------------------------------------------

function armamentGunModelFromPart(part: GunPartData): ArmamentGunModel {
  return {
    id: gunModelId(part.id),
    familyId: gunFamilyId(part.familyId),
    designation: part.name,
    caliberUm: part.spec.calibreUm,
    ...(part.spec.barrelLengthCalibers !== undefined
      ? { barrelLengthCalibers: part.spec.barrelLengthCalibers }
      : {}),
    ...(part.spec.gunMassKg !== undefined ? { gunMassKg: part.spec.gunMassKg } : {}),
    ...(part.spec.loadingSystem !== undefined ? { loadingSystem: part.spec.loadingSystem } : {}),
    ...(part.spec.nominalMuzzleVelocityUmPerSec !== undefined
      ? { nominalMuzzleVelocityUmPerSec: part.spec.nominalMuzzleVelocityUmPerSec }
      : {}),
    ...(part.spec.mechanicalRateOfFireRoundsPerMinuteX100 !== undefined
      ? {
          mechanicalRateOfFireRoundsPerMinuteX100:
            part.spec.mechanicalRateOfFireRoundsPerMinuteX100,
        }
      : {}),
    ...(part.spec.propellantChargeBp !== undefined
      ? { propellantChargeBp: part.spec.propellantChargeBp }
      : {}),
    ...(part.spec.shellMassG !== undefined ? { shellMassG: part.spec.shellMassG } : {}),
    ...(part.spec.roundVolumeMl !== undefined ? { roundVolumeMl: part.spec.roundVolumeMl } : {}),
    ...(part.spec.reliabilityBp !== undefined ? { reliabilityBp: part.spec.reliabilityBp } : {}),
    introductionMonth: part.lifecycle.availableFrom,
    retirementMonth: part.lifecycle.availableUntil,
    requiredTechnologyIds: part.lifecycle.requires.map(armamentTechnologyId),
    // `supportedMountTypes` is intentionally absent: in the new model the mount type
    // belongs to the mount part/slot, not the gun, so a D17 battery resolves cleanly.
    provenance: part.provenance,
  };
}

function quantityValue(part: GunMountPartData, id: string): number | undefined {
  return part.quantities.find((q) => q.id === id)?.value;
}

function armamentMountFromPart(
  part: GunMountPartData,
  familyId: string,
  gunCount: number,
): ArmamentGunMountDef {
  const fixed = quantityValue(part, "installation_fixed");
  const perGun = quantityValue(part, "installation_per_gun");
  return {
    id: gunMountId(part.id),
    mountType: part.spec.mountType,
    compatibleGunFamilies: [gunFamilyId(familyId)],
    gunCount,
    ...(fixed !== undefined ? { baseInstallationMassKg: fixed } : {}),
    ...(perGun !== undefined ? { perGunInstallationMassKg: perGun } : {}),
    ...(part.spec.topWeightKg !== undefined ? { topWeightKg: part.spec.topWeightKg } : {}),
    ...(part.spec.supportedArmorMm !== undefined
      ? { supportedArmorMm: part.spec.supportedArmorMm }
      : {}),
    ...(part.spec.traverseDeg !== undefined ? { traverseDeg: part.spec.traverseDeg } : {}),
    ...(part.spec.elevationMinDeg !== undefined
      ? { elevationMinDeg: part.spec.elevationMinDeg }
      : {}),
    ...(part.spec.elevationMaxDeg !== undefined
      ? { elevationMaxDeg: part.spec.elevationMaxDeg }
      : {}),
    ...(part.spec.firingArcDeg !== undefined ? { firingArcDeg: part.spec.firingArcDeg } : {}),
    ...(part.spec.rateOfFireModifierBp !== undefined
      ? { rateOfFireModifierBp: part.spec.rateOfFireModifierBp }
      : {}),
    ...(part.spec.ammunitionHandlingModifierBp !== undefined
      ? { ammunitionHandlingModifierBp: part.spec.ammunitionHandlingModifierBp }
      : {}),
    ...(part.spec.crewProtection !== undefined ? { crewProtection: part.spec.crewProtection } : {}),
    ...(part.spec.stabilityContributionKgM !== undefined
      ? { stabilityContributionKgM: part.spec.stabilityContributionKgM }
      : {}),
    ...(part.spec.vulnerability !== undefined ? { vulnerability: part.spec.vulnerability } : {}),
    ...(part.lifecycle.availableFrom !== undefined
      ? { introductionMonth: part.lifecycle.availableFrom }
      : {}),
    retirementMonth: part.lifecycle.availableUntil,
    requiredTechnologyIds: part.lifecycle.requires.map(armamentTechnologyId),
    provenance: part.provenance,
  };
}

export interface ResolveGunPlacementInput {
  readonly content: AuthoredArmamentContent;
  readonly components: readonly ComponentDef[];
  readonly model: GunPartModel;
  readonly designId: string;
  readonly placement: PlacementSpec;
  readonly nationId: string;
  readonly familyId: string;
  readonly month: string;
  readonly unlockedTechnologyIds: ReadonlySet<string>;
  readonly componentAccess: Readonly<Record<string, ArmamentAccessStatus>>;
  /** The legacy gate: a nation with no first-class armament resolves nothing (P1 only). */
  readonly useFirstClassArmament: boolean;
}

export interface ResolvedGunPlacement {
  readonly translation: GunPlacementTranslation | null;
  readonly resolved: ResolvedArmament | null;
  readonly compiled: CompiledArmamentMount | null;
  readonly findings: readonly ArmamentResolutionFinding[];
}

/**
 * Compile one gun placement through its loadout entries and the existing armament
 * resolver (SPM-R16). The armament inputs are rebuilt from the parts (the gun model
 * from the `gun` part, the mount from the `gun_mount` part at the translated
 * `gunCount`) so the result matches the legacy resolver for every placement except the
 * nine D17 identity paths.
 */
export function resolveGunPlacementThroughParts(
  input: ResolveGunPlacementInput,
): ResolvedGunPlacement {
  const gunPart = input.model.byKey.get(gunKey(input.nationId, input.familyId));
  if (gunPart === undefined) {
    throw new Error(
      `partReadPath: no gun part for nation '${input.nationId}' family '${input.familyId}'`,
    );
  }
  const translation = translateGunPlacement({
    designId: input.designId,
    placement: input.placement,
    nationId: input.nationId,
    gunPart,
    content: input.content,
    components: input.components,
  });

  // The compatibility path emits no compiled armament (the legacy compile does not
  // resolve it either); mirroring it keeps P1's zero-difference gate honest.
  if (!input.useFirstClassArmament) {
    return { translation, resolved: null, compiled: null, findings: [] };
  }
  const ammunition: ArmamentAmmunitionPattern | null = armamentAmmunitionFor(
    input.content,
    input.nationId,
    input.familyId,
  );
  if (ammunition === null) {
    return { translation, resolved: null, compiled: null, findings: [] };
  }

  const technologyContext: ArmamentTechnologyContext = {
    month: input.month,
    unlockedTechnologyIds: new Set([...input.unlockedTechnologyIds].map(armamentTechnologyId)),
  };
  const result = resolveArmament(
    armamentGunModelFromPart(gunPart),
    armamentMountFromPart(translation.mountPart, gunPart.familyId, translation.containedUnits),
    ammunition,
    technologyContext,
    { nationId: armamentNationId(input.nationId), componentAccess: input.componentAccess },
  );
  return {
    translation,
    resolved: result.resolved,
    compiled:
      result.resolved === null
        ? null
        : toCompiledArmamentMount(
            result.resolved,
            translation.mountType,
            input.placement.instanceId,
          ),
    findings: result.findings,
  };
}
