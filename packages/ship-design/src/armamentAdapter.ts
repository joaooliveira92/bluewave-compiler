/**
 * Compatibility adapter (ADR-0093): map the *current* legacy armament content — a shared `components.yaml`
 * family, a national `GunModelDef`/`AmmunitionPatternDef`, and a `NationNavalProfile` — into the
 * authoritative armament domain in `@bluewave/armament`, and resolve it.
 *
 * Since the Step 3 ship-design cut-over the runtime compile no longer uses this adapter: it resolves the
 * first-class armament content (`ship-building/armament/*.yaml`) through `resolveInstalledWeapon`
 * (`armamentContent.ts`). This adapter is retained for the migration path and legacy tooling/tests that
 * still hold the merged `ComponentDef` + `NationNavalProfile` shape. It is not a second authoritative
 * representation.
 *
 * Fields the adapter cannot yet map from legacy content are reported explicitly in
 * `ARMAMENT_ADAPTER_UNMAPPED_FIELDS`; they are omitted (undefined), never guessed. These are the values the
 * first-class model does not yet own; the ones ship design needs are carried through the explicitly named
 * legacy compatibility path (`ComponentSummary` keeps the component's own weight/cost/volume), and the rest
 * are combat-only and deferred to the Step 4 combat cut-over.
 */
import type { ComponentDef } from "./component.js";
import { applyGunModel } from "./componentVariants.js";
import { num } from "./compileShared.js";
import type {
  AmmunitionPatternDef,
  GunModelDef,
  MountType,
  NationNavalProfile,
  Provenance,
} from "./nationProfile.js";
import {
  ammunitionId,
  armamentNationId,
  armamentTechnologyId,
  gunFamilyId,
  gunModelId,
  gunMountId,
  resolveArmament,
  type AmmunitionPattern as ArmamentAmmunitionPattern,
  type ArmamentAccessContext,
  type ArmamentAccessStatus,
  type ArmamentProvenance,
  type ArmamentResolutionResult,
  type ArmamentTechnologyContext,
  type GunModel as ArmamentGunModel,
  type GunMountDef as ArmamentGunMountDef,
} from "@bluewave/armament";

/** Domain fields current content cannot populate yet. The adapter omits them rather than inventing values. */
export const ARMAMENT_ADAPTER_UNMAPPED_FIELDS = [
  "gunModel.barrelLengthCalibers: no authored barrel length",
  "gunModel.loadingSystem: no authored loading/breech field",
  "gunModel.nominalMuzzleVelocityUmPerSec: muzzle velocity appears only in components.yaml comments",
  "gunModel.reliabilityBp: no authored per-gun reliability",
  "gunMount.topWeightKg: no authored top-weight field",
  "gunMount.supportedArmorMm: no authored field",
  "gunMount.traverseDeg/elevationMinDeg/elevationMaxDeg: no authored field",
  "gunMount.crewProtection: no authored field",
  "gunMount.hullSpaceUsageLitre: mount volume is folded into the gun component's volumeLitre",
  "gunMount.stabilityContributionKgM: no authored field",
  "gunMount.vulnerability: no authored field",
  "gunMount.rateOfFireModifierBp/ammunitionHandlingModifierBp: modifiers live in balance.yaml, not per mount",
  "ammunition.shellMassG: shell mass is authored on the gun component",
  "ammunition.propellantInteractionBp: no authored field",
  "ammunition.explosiveFillerG/burstingEffectBp/fireEffectBp/storageHazard/ammunitionCostMicro: no authored field",
  "ammunition.compatibleGunFamilies/compatibleGunModelIds: no authored compatibility constraint",
  "ammunition.introductionMonth/retirementMonth/rateOfFireModifierBp: no authored field",
] as const;

export interface ArmamentAdapterInput {
  /** The shared `components.yaml` family the model overlays. */
  readonly family: ComponentDef;
  /** The national gun model. */
  readonly model: GunModelDef;
  /** The chosen installation type (must be one of `model.mounts` for a valid resolution). */
  readonly mountType: MountType;
  /** The chosen number of guns in the mount (current content leaves this a design parameter). */
  readonly gunCount: number;
  /** The national ammunition pattern. */
  readonly ammunition: AmmunitionPatternDef;
  /** The resolution month (YYYY-MM). */
  readonly month: string;
  /** Technology ids unlocked for the nation at that month (e.g. `ShipContext.unlockedTechs`). */
  readonly unlockedTechnologyIds: ReadonlySet<string>;
  /** The nation's naval profile (component access). */
  readonly profile: NationNavalProfile;
}

export interface AdaptedArmament {
  readonly gunModel: ArmamentGunModel;
  readonly mount: ArmamentGunMountDef;
  readonly ammunition: ArmamentAmmunitionPattern;
  readonly technologyContext: ArmamentTechnologyContext;
  readonly accessContext: ArmamentAccessContext;
  /** Domain fields the adapter could not populate from current content. */
  readonly unmapped: readonly string[];
}

function mapProvenance(p: Provenance): ArmamentProvenance {
  return {
    sourceStatus: p.sourceStatus,
    confidence: p.confidence,
    kind: p.kind,
    sources: p.sources.map((s) => ({ ...s })),
    ...(p.derivation !== undefined ? { derivation: { ...p.derivation } } : {}),
    ...(p.note !== undefined ? { note: p.note } : {}),
  };
}

/** Evaluate one numeric component attribute (formula) with the component's constants; undefined when absent. */
function attrNumber(def: ComponentDef, name: string): number | undefined {
  const raw = def.attributes?.[name];
  if (raw === undefined) return undefined;
  const value = num(raw, { ...def.constants });
  return Number.isFinite(value) ? value : undefined;
}

/** Map current content into the armament domain types (no resolution). */
export function adaptArmament(input: ArmamentAdapterInput): AdaptedArmament {
  const merged = applyGunModel(input.family, input.model);
  const constants = merged.constants;
  const number = (name: string): number | undefined =>
    constants[name] === undefined ? undefined : constants[name];

  const introductionMonth = merged.introduction.fromMonth;
  const retirementMonth = merged.introduction.obsoleteMonth;
  const mountId = `${input.family.id}_${input.mountType.toLowerCase()}`;

  const caliberUm = attrNumber(merged, "caliberUm");
  const gunMassKg = number("gun_kg");
  const shellMassG = attrNumber(merged, "shellMassG");
  const propellantChargeBp = attrNumber(merged, "chargeBp");
  const roundVolumeMl = attrNumber(merged, "roundVolumeMl");
  const rofX100 = attrNumber(merged, "rofBaseX100");
  const baseInstallationMassKg = number("mount_fixed_kg");
  const perGunInstallationMassKg = number("mount_per_barrel_kg");
  const firingArcDeg = attrNumber(merged, "beamArcDeg");

  const gunModel: ArmamentGunModel = {
    id: gunModelId(input.model.id),
    familyId: gunFamilyId(input.family.id),
    designation: input.model.designation,
    ...(caliberUm !== undefined ? { caliberUm } : {}),
    ...(gunMassKg !== undefined ? { gunMassKg } : {}),
    ...(shellMassG !== undefined ? { shellMassG } : {}),
    ...(propellantChargeBp !== undefined ? { propellantChargeBp } : {}),
    ...(roundVolumeMl !== undefined ? { roundVolumeMl } : {}),
    ...(rofX100 !== undefined ? { mechanicalRateOfFireRoundsPerMinuteX100: rofX100 } : {}),
    introductionMonth,
    retirementMonth,
    supportedMountTypes: input.model.mounts,
    requiredTechnologyIds: input.family.requires.map(armamentTechnologyId),
    provenance: mapProvenance(input.model.provenance),
  };

  const mount: ArmamentGunMountDef = {
    id: gunMountId(mountId),
    mountType: input.mountType,
    compatibleGunFamilies: [gunFamilyId(input.family.id)],
    gunCount: input.gunCount,
    ...(baseInstallationMassKg !== undefined ? { baseInstallationMassKg } : {}),
    ...(perGunInstallationMassKg !== undefined ? { perGunInstallationMassKg } : {}),
    ...(firingArcDeg !== undefined ? { firingArcDeg } : {}),
    introductionMonth,
    retirementMonth: null,
    requiredTechnologyIds: [],
    provenance: mapProvenance(input.model.provenance),
  };

  const ammunition: ArmamentAmmunitionPattern = {
    id: ammunitionId(input.ammunition.id),
    shellType: input.ammunition.pattern,
    penetrationBiasBp: input.ammunition.penetrationBiasBp,
    provenance: mapProvenance(input.ammunition.provenance),
  };

  const technologyContext: ArmamentTechnologyContext = {
    month: input.month,
    unlockedTechnologyIds: new Set([...input.unlockedTechnologyIds].map(armamentTechnologyId)),
  };

  const componentAccess: Record<string, ArmamentAccessStatus> = {};
  for (const [familyId, access] of Object.entries(input.profile.componentAccess)) {
    componentAccess[familyId] = access.status;
  }
  const accessContext: ArmamentAccessContext = {
    nationId: armamentNationId(input.profile.nationId),
    componentAccess,
  };

  return {
    gunModel,
    mount,
    ammunition,
    technologyContext,
    accessContext,
    unmapped: ARMAMENT_ADAPTER_UNMAPPED_FIELDS,
  };
}

/** Adapt current content and resolve it through the authoritative armament resolver. */
export function resolveArmamentFromContent(input: ArmamentAdapterInput): ArmamentResolutionResult {
  const adapted = adaptArmament(input);
  return resolveArmament(
    adapted.gunModel,
    adapted.mount,
    adapted.ammunition,
    adapted.technologyContext,
    adapted.accessContext,
  );
}
