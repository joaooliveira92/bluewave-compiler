import {
  classFacts,
  classificationFindings,
  DESIGN_22_EARLY,
  isEarlyShipType,
  type ClassificationRules,
} from "./classification.js";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import {
  analyseArrangement,
  ZONE_IDS,
  type ArrangementBalance,
  type ArrangementResult,
  type ResolvedPlacement,
  type ZoneDef,
  type ZoneId,
} from "./arrangement.js";
import {
  compileArmour,
  type ArmourBalance,
  type ArmourInput,
  type ArmourRegion,
  type ArmourResult,
  type ThreatProfile,
} from "./armour.js";
import type { ComponentCategory, ComponentDef } from "./component.js";
import type { Finding } from "./findings.js";
import { hasBlocking, sortFindings } from "./findings.js";
import { evaluate } from "./formula/eval.js";
import { parseFormula } from "./formula/parse.js";
import {
  compileHull,
  type HullBalance,
  type HullForm,
  type HullResult,
  type HullSpec,
} from "./hull.js";
import { emptyLedger, withLine, type DisplacementLedger, type LedgerCategory } from "./ledger.js";
import {
  compileMachinery,
  type MachineryBalance,
  type MachineryResult,
  type PropulsionPlant,
} from "./machinery.js";
import {
  compileStability,
  type StabilityBalance,
  type StabilityResult,
  type StabilityWindow,
  type WeightItem,
} from "./stability.js";
import {
  compileSystems,
  type AccommodationStandard,
  type SystemsBalance,
  type SystemsResult,
} from "./systems.js";
import {
  compileWeapons,
  type ArcObstacle,
  type GunMount,
  type MountSide,
  type WeaponBalance,
  type WeaponsResult,
} from "./weapons.js";

// ---------------------------------------------------------------------------------------------
// Inputs

export interface PlacementSpec {
  readonly instanceId: string;
  readonly componentId: string;
  readonly zoneId: ZoneId;
  readonly stationPermille: number;
  readonly side?: MountSide;
  /** Chosen values for the component's declared parameters; missing ones default to the minimum. */
  readonly params?: Readonly<Record<string, number>>;
  readonly magazineRef?: string;
}

export interface MachineryPlan {
  readonly plantId: string;
  readonly installedKw: number;
  readonly zoneId: ZoneId;
  readonly stationPermille: number;
  readonly fuelCapacityKg: number;
  readonly fuelZoneId: ZoneId;
  readonly fuelStationPermille: number;
  readonly foulingBp: number;
}

export interface DesignRequirement {
  readonly category: string;
  readonly requiredSpeedMilliKnots: number;
  readonly cruiseSpeedMilliKnots: number;
  readonly requiredRangeNm: number;
  readonly designThreatId: string;
  readonly modernizationExpectation: "NONE" | "MINOR" | "MAJOR";
  readonly crewQualityBp: number;
  readonly accommodationStandard: AccommodationStandard;
}

export interface DesignDraft {
  readonly nationId: string;
  readonly requirement: DesignRequirement;
  readonly hull: HullSpec;
  readonly machinery: MachineryPlan;
  readonly armour: {
    readonly regions: readonly ArmourRegion[];
    readonly citadelLengthMm: number;
    readonly torpedoWarheadKg: number;
    readonly bunkerProtectionBp: number;
  };
  readonly placements: readonly PlacementSpec[];
}

export interface HullFormData {
  readonly form: HullForm;
  readonly zones: readonly ZoneDef[];
  readonly volumeFullnessBp: number;
  readonly deckFullnessBp: number;
  readonly lcbPermille: number;
  readonly buoyancyByZoneBp: readonly number[];
}

export interface Facility {
  readonly id: string;
  readonly maxLengthMm: number;
  readonly maxBeamMm: number;
  readonly maxDisplacementKg: number;
  readonly craneLiftKg: number;
}

export interface TreatyLimits {
  readonly maxDisplacementKg?: number;
  readonly maxMainGunCaliberUm?: number;
  readonly forbiddenCategories?: readonly string[];
}

export interface ShipBalance {
  readonly hull: HullBalance;
  readonly machinery: MachineryBalance;
  readonly arrangement: ArrangementBalance;
  readonly weapons: WeaponBalance;
  readonly armour: ArmourBalance;
  readonly stability: StabilityBalance;
  readonly systems: SystemsBalance;
  /** Which ledger line each component category's weight belongs to. */
  readonly ledgerCategoryOf: Readonly<Record<ComponentCategory, LedgerCategory>>;
  /** Vertical position of distributed lumps as bp of depth. */
  readonly lumpZFractionBp: Readonly<
    Record<"hull" | "margin" | "reserve" | "crew" | "machinery" | "fuel", number>
  >;
  /** Vertical position of armour regions as bp of depth. */
  readonly armourZFractionBp: Readonly<Record<string, number>>;
  readonly crewKgPerHead: number;
  readonly stabilityWindowByCategory: Readonly<Record<string, StabilityWindow>>;
  /** DESIGN-22 thresholds; defaults to the EARLY band when absent. */
  readonly classification?: ClassificationRules;
  readonly minReserveBpByExpectation: Readonly<
    Record<DesignRequirement["modernizationExpectation"], number>
  >;
}

export interface ShipContext {
  /** Campaign month, YYYY-MM. */
  readonly month: string;
  readonly unlockedTechs: ReadonlySet<string>;
  readonly catalogue: readonly ComponentDef[];
  readonly plants: readonly PropulsionPlant[];
  readonly hullForms: Readonly<Record<string, HullFormData>>;
  readonly threats: readonly ThreatProfile[];
  readonly facilities: readonly Facility[];
  readonly treaty: TreatyLimits | null;
  readonly balance: ShipBalance;
}

// ---------------------------------------------------------------------------------------------
// Output

export interface CompiledDesign {
  readonly ledger: DisplacementLedger;
  readonly totalKg: number;
  readonly hull: HullResult;
  readonly machinery: MachineryResult | null;
  readonly arrangement: ArrangementResult | null;
  readonly weapons: WeaponsResult | null;
  readonly armour: ArmourResult | null;
  readonly stability: StabilityResult | null;
  readonly systems: SystemsResult | null;
  readonly naturalClass: string | null;
  readonly componentCostMicro: number;
  /** Per-placement resolved data used by cost and construction planning. */
  readonly components: readonly ComponentSummary[];
  readonly findings: readonly Finding[];
  readonly valid: boolean;
  /** SHA-256 over the canonical serialisation of the whole result. */
  readonly hash: string;
}

export interface ComponentSummary {
  readonly instanceId: string;
  readonly componentId: string;
  readonly category: ComponentCategory;
  readonly weightKg: number;
  readonly costMicro: number;
  readonly maintenanceMonthlyBp: number;
  /** Authored build work, or null to use the balance default. */
  readonly buildWorkMicro: number | null;
  readonly productionLine: string | null;
  readonly requires: readonly string[];
  /** Chosen parameters and evaluated attributes, for adapters (e.g. caliber, barrels, tubes). */
  readonly params: Readonly<Record<string, number>>;
  readonly attr: Readonly<Record<string, number>>;
  readonly torpedoMount: { readonly mountType: string; readonly torpedoModelId: string } | null;
}

const WEAPON_CATEGORIES: readonly ComponentCategory[] = [
  "MAIN_GUN",
  "SECONDARY_GUN",
  "DUAL_PURPOSE_GUN",
  "AA_WEAPON",
];

function f(
  id: string,
  severity: Finding["severity"],
  what: string,
  why: string,
  consequence: string,
  remedies: [string, string][],
  formulaId = "SB-9",
): Finding {
  return {
    id,
    severity,
    what,
    why,
    consequence,
    remedies: remedies.map(([rid, description]) => ({ id: rid, description })),
    evidence: { formulaId, inputs: {}, threshold: 0, value: 1 },
  };
}

interface Resolved {
  readonly spec: PlacementSpec;
  readonly def: ComponentDef;
  readonly params: Record<string, number>;
  readonly weightKg: number;
  readonly volumeLitre: number;
  readonly deckFootprintMm2: number;
  readonly heightMm: number;
  readonly zCgMm: number;
  readonly powerKw: number;
  readonly coolingKw: number;
  readonly crew: number;
  readonly costMicro: number;
  readonly attr: Record<string, number>;
}

const num = (src: string | undefined, vars: Record<string, number>) =>
  src === undefined ? 0 : evaluate(parseFormula(src), { vars });
const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Full pipeline. Never throws on design errors: they become findings. Throws only on corrupt context. */
export function compileDesign(draft: DesignDraft, ctx: ShipContext): CompiledDesign {
  const b = ctx.balance;
  const findings: Finding[] = [];
  const formData = ctx.hullForms[draft.hull.hullFormId];
  if (!formData) throw new Error(`unknown hull form '${draft.hull.hullFormId}'`);
  const plant = ctx.plants.find((p) => p.id === draft.machinery.plantId);
  if (!plant) throw new Error(`unknown plant '${draft.machinery.plantId}'`);
  const catalogue = new Map(ctx.catalogue.map((c) => [c.id, c]));

  // 1. Technology availability and parameter validity (stage VALIDATE_TECHNOLOGY)
  const techCheck = (
    id: string,
    requires: readonly string[],
    fromMonth: string,
    obsoleteMonth: string | null,
  ) => {
    const missing = requires.filter((t) => !ctx.unlockedTechs.has(t));
    if (missing.length > 0 || fromMonth > ctx.month) {
      findings.push(
        f(
          "TECH_UNAVAILABLE",
          "BLOCKING",
          `${id} is not available to this nation yet.`,
          missing.length > 0
            ? `Missing technology: ${missing.join(", ")}.`
            : `Introduced ${fromMonth}; current month ${ctx.month}.`,
          "A ship cannot use equipment that does not exist for its builder.",
          [
            ["research", "Research the missing technology."],
            ["alternative", "Use an earlier component that is available."],
            ["wait", "Delay the design until the technology matures."],
          ],
        ),
      );
    } else if (obsoleteMonth !== null && obsoleteMonth <= ctx.month) {
      findings.push(
        f(
          "COMPONENT_OBSOLETE",
          "ADVISORY",
          `${id} is obsolete.`,
          `Obsolete since ${obsoleteMonth}.`,
          "Spares and support cost more; the part is outclassed.",
          [["upgrade", "Use its upgrade-path successor."]],
        ),
      );
    }
  };
  techCheck(
    plant.id,
    plant.requires ?? [],
    plant.introduction?.fromMonth ?? "0000-00",
    plant.introduction?.obsoleteMonth ?? null,
  );

  const resolved: Resolved[] = [];
  for (const spec of [...draft.placements].sort((x, y) => cmpStr(x.instanceId, y.instanceId))) {
    const def = catalogue.get(spec.componentId);
    if (!def) {
      findings.push(
        f(
          "COMPONENT_UNKNOWN",
          "BLOCKING",
          `Component ${spec.componentId} does not exist.`,
          `Placement ${spec.instanceId} references an unknown id.`,
          "The design cannot be priced or weighed.",
          [
            ["replace", "Choose a catalogue component."],
            ["remove", "Remove the placement."],
            ["update", "Update the design to the current content version."],
          ],
        ),
      );
      continue;
    }
    techCheck(def.id, def.requires, def.introduction.fromMonth, def.introduction.obsoleteMonth);
    const params: Record<string, number> = {};
    let ok = true;
    for (const [pn, r] of Object.entries(def.parameters)) {
      const v = spec.params?.[pn] ?? r.min;
      if (v < r.min || v > r.max || (v - r.min) % r.step !== 0) {
        ok = false;
        findings.push(
          f(
            "PARAM_RANGE",
            "BLOCKING",
            `${spec.instanceId}: parameter ${pn}=${v} is not allowed.`,
            `Legal ${r.min}..${r.max} step ${r.step}.`,
            "The component does not exist in that configuration.",
            [
              ["set_min", `Set ${pn} to ${r.min}.`],
              ["set_max", `Set ${pn} to ${r.max}.`],
              ["other_component", "Choose a different component."],
            ],
          ),
        );
      }
      params[pn] = v;
    }
    if (!ok) continue;
    const vars = { ...def.constants, ...params };
    const attr: Record<string, number> = {};
    for (const [k, src] of Object.entries(def.attributes ?? {})) attr[k] = num(src, vars);
    resolved.push({
      spec,
      def,
      params,
      weightKg: num(def.weightKg, vars),
      volumeLitre: num(def.volumeLitre, vars),
      deckFootprintMm2: num(def.deckFootprintMm2, vars),
      heightMm: num(def.heightMm, vars),
      zCgMm: num(def.zCgMm, vars),
      powerKw: num(def.powerKw, vars),
      coolingKw: num(def.coolingKw, vars),
      crew: num(def.crew, vars),
      costMicro: num(def.costMicro, vars),
      attr,
    });
  }
  const byId = new Map(resolved.map((r) => [r.spec.instanceId, r]));
  const hull = draft.hull;
  const station = (id: string | undefined) => (id ? byId.get(id)?.spec.stationPermille : undefined);

  // 2. Weapons
  const gunRes = resolved.filter((r) => WEAPON_CATEGORIES.includes(r.def.category));
  const mounts: GunMount[] = gunRes.map((r) => {
    const magSt = station(r.spec.magazineRef);
    return {
      instanceId: r.spec.instanceId,
      stationPermille: r.spec.stationPermille,
      side: r.spec.side ?? "CENTRE",
      barrels: r.params.barrels ?? 1,
      roundsPerBarrel: r.params.rounds ?? 0,
      shellMassG: r.attr.shellMassG ?? 0,
      chargeBp: r.attr.chargeBp ?? 0,
      roundVolumeMl: r.attr.roundVolumeMl ?? 0,
      rofBaseX100: r.attr.rofBaseX100 ?? 0,
      beamArcDeg: r.attr.beamArcDeg ?? 0,
      feedDistancePermille: magSt === undefined ? 0 : Math.abs(r.spec.stationPermille - magSt),
    };
  });
  const obstacles: ArcObstacle[] = resolved
    .filter((r) => (r.attr.arcBlockedDeg ?? 0) > 0)
    .map((r) => ({
      id: r.spec.instanceId,
      fromPermille: r.spec.stationPermille,
      toPermille: r.spec.stationPermille,
      reachPermille: r.attr.arcReachPermille ?? 0,
      blockedDeg: r.attr.arcBlockedDeg!,
    }));
  const weapons = compileWeapons(mounts, obstacles, draft.requirement.crewQualityBp, b.weapons);
  findings.push(...weapons.findings);
  const ammoById = new Map(weapons.mounts.map((m) => [m.instanceId, m]));

  // 3. Machinery (power sized on the design displacement, which avoids a circular dependency)
  const accommodationVolume = resolved
    .filter((r) => r.def.category === "ACCOMMODATION")
    .reduce((a, r) => a + r.volumeLitre, 0);
  const systemsItems = resolved.map((r) => ({
    instanceId: r.spec.instanceId,
    category: r.def.category,
    powerKw: r.powerKw,
    coolingKw: r.coolingKw,
    crew: r.crew,
  }));
  const generators = resolved
    .filter((r) => r.def.category === "GENERATOR")
    .map((r) => ({ instanceId: r.spec.instanceId, kw: r.attr.genKw ?? 0, zoneId: r.spec.zoneId }));
  const directors = resolved
    .filter((r) => r.def.category === "DIRECTOR" || r.def.category === "RANGEFINDER")
    .map((r) => ({
      instanceId: r.spec.instanceId,
      supportedClasses: r.def.fcClasses ?? [],
      accuracyBonusBp: r.attr.accuracyBonusBp ?? 0,
      capacity: r.attr.capacity ?? 0,
      stationPermille: r.spec.stationPermille,
    }));
  const guns = gunRes
    .filter((r) => r.def.fcClass)
    .map((r) => ({ instanceId: r.spec.instanceId, fcClass: r.def.fcClass! }));
  const funnels = resolved
    .filter((r) => r.def.tags.includes("funnel"))
    .map((r) => r.spec.stationPermille);
  const systems = compileSystems(
    {
      items: systemsItems,
      generators,
      coolingSupplyKw: resolved.reduce((a, r) => a + (r.attr.coolingSupplyKw ?? 0), 0),
      displacementKg: hull.targetDisplacementKg,
      accommodationStandard: draft.requirement.accommodationStandard,
      accommodationVolumeLitre: accommodationVolume,
      guns,
      directors,
      funnelStationsPermille: funnels,
    },
    b.systems,
  );
  findings.push(...systems.findings);

  const machineryRaw = compileMachinery(
    {
      plant,
      installedKw: draft.machinery.installedKw,
      hullFormId: hull.hullFormId,
      lengthWlMm: hull.lengthWl,
      displacementKg: hull.targetDisplacementKg,
      foulingBp: draft.machinery.foulingBp,
      fuelCapacityKg: draft.machinery.fuelCapacityKg,
      cruiseSpeedMilliKnots: draft.requirement.cruiseSpeedMilliKnots,
      requiredSpeedMilliKnots: draft.requirement.requiredSpeedMilliKnots,
      requiredRangeNm: draft.requirement.requiredRangeNm,
    },
    b.machinery,
  );
  findings.push(...machineryRaw.findings);

  // 4. Armour
  const armourInput = (
    reserveBuoyancyBp: number,
    magazines: ArmourInput["magazines"],
  ): ArmourInput => ({
    regions: draft.armour.regions,
    threats: ctx.threats,
    designThreatId: draft.requirement.designThreatId,
    citadelLengthMm: draft.armour.citadelLengthMm,
    magazines,
    torpedoWarheadKg: draft.armour.torpedoWarheadKg,
    bunkerProtectionBp: draft.armour.bunkerProtectionBp,
    subdivisionGrade: hull.subdivisionGrade,
    reserveBuoyancyBp,
    damageControlBp: resolved.reduce((a, r) => a + (r.attr.damageControlBp ?? 0), 0),
    flammableBp:
      resolved.reduce((a, r) => a + (r.attr.flammableBp ?? 0), 0) +
      (plant.fuelType === "OIL" ? 1_000 : 0),
  });
  const armourPre = compileArmour(armourInput(0, []), b.armour);
  const mag = (region: string, threatId: string) => armourPre.marginBp[region]?.[threatId] ?? null;
  const designThreat = draft.requirement.designThreatId;
  const magazines = resolved
    .filter((r) => r.def.category === "MAGAZINE")
    .map((r) => {
      const near = (cat: ComponentCategory) =>
        resolved.some((o) => o.def.category === cat && o.spec.zoneId === r.spec.zoneId);
      return {
        magazineId: r.spec.instanceId,
        beltMarginBp: mag("BELT_MAIN", designThreat),
        deckMarginBp: mag("DECK_MAIN", designThreat),
        boxMarginBp: mag("MAGAZINE_BOX", designThreat),
        adjacentBoilers: near("BOILER") || near("ENGINE"),
        adjacentTorpedoTubes: near("TORPEDO_TUBE"),
        flashProtectionBp: r.attr.flashProtectionBp ?? 0,
      };
    });

  // 5. Hull + ledger
  const sumBy = (cat: LedgerCategory, extra = 0) =>
    resolved
      .filter((r) => b.ledgerCategoryOf[r.def.category] === cat)
      .reduce((a, r) => a + r.weightKg, extra);
  const crewKg = systems.crewRequired * b.crewKgPerHead;
  let others = emptyLedger();
  others = withLine(
    others,
    "machinery",
    (machineryRaw.plantWeightKg + sumBy("machinery")) as never,
  );
  others = withLine(others, "fuel", (draft.machinery.fuelCapacityKg + sumBy("fuel")) as never);
  others = withLine(others, "armament", sumBy("armament") as never);
  others = withLine(others, "ammunition", (weapons.ammoMassKg + sumBy("ammunition")) as never);
  others = withLine(others, "sensors", sumBy("sensors") as never);
  others = withLine(others, "mission", sumBy("mission") as never);
  others = withLine(others, "crew", crewKg as never);
  others = withLine(others, "auxiliary", sumBy("auxiliary") as never);
  others = withLine(others, "armour", (armourPre.totalWeightKg + sumBy("armour")) as never);
  const hullRes = compileHull(hull, formData.form, b.hull, others);
  findings.push(...hullRes.findings);
  const armour = compileArmour(armourInput(hullRes.reserveBuoyancyBp, magazines), b.armour);
  findings.push(...armour.findings);

  // 6. Arrangement
  const resolvedPlacements: ResolvedPlacement[] = resolved.map((r) => ({
    instanceId: r.spec.instanceId,
    componentId: r.def.id,
    category: r.def.category,
    zoneId: r.spec.zoneId,
    stationPermille: r.spec.stationPermille,
    weightKg: r.weightKg,
    volumeLitre: r.volumeLitre,
    deckFootprintMm2: r.deckFootprintMm2,
    heightMm: r.heightMm,
    zCgMm: r.zCgMm,
    allowedZones: (r.def.allowedZones as ZoneId[] | undefined) ?? [...ZONE_IDS],
    forbidsCoLocation: r.def.forbidsCoLocation ?? [],
    critical: r.def.critical ?? false,
    ...(r.def.category === "MAGAZINE" ? { magazineLitre: r.attr.magazineLitre ?? 0 } : {}),
    ...(ammoById.has(r.spec.instanceId)
      ? { ammoVolumeLitre: ammoById.get(r.spec.instanceId)!.ammoVolumeLitre }
      : {}),
    ...(r.spec.magazineRef ? { magazineRef: r.spec.magazineRef } : {}),
    ...(r.attr.maxFeedPermille !== undefined ? { maxFeedPermille: r.attr.maxFeedPermille } : {}),
  }));
  const dm = draft.machinery;
  resolvedPlacements.push(
    {
      instanceId: "~plant",
      componentId: plant.id,
      category: "ENGINE",
      zoneId: dm.zoneId,
      stationPermille: dm.stationPermille,
      weightKg: machineryRaw.plantWeightKg,
      volumeLitre: machineryRaw.plantVolumeLitre,
      deckFootprintMm2: 0,
      heightMm: 0,
      zCgMm: Math.floor((hull.depthToMainDeck * b.lumpZFractionBp.machinery) / 10_000),
      allowedZones: [...ZONE_IDS],
      forbidsCoLocation: [],
      critical: true,
    },
    {
      instanceId: "~bunkers",
      componentId: "bunkers",
      category: "FUEL_BUNKER",
      zoneId: dm.fuelZoneId,
      stationPermille: dm.fuelStationPermille,
      weightKg: dm.fuelCapacityKg,
      volumeLitre: machineryRaw.bunkerVolumeLitre,
      deckFootprintMm2: 0,
      heightMm: 0,
      zCgMm: Math.floor((hull.depthToMainDeck * b.lumpZFractionBp.fuel) / 10_000),
      allowedZones: [...ZONE_IDS],
      forbidsCoLocation: [],
      critical: false,
    },
  );
  const arrangement = analyseArrangement(
    resolvedPlacements,
    formData.zones,
    {
      lengthMm: hull.lengthWl,
      beamMm: hull.beam,
      depthMm: hull.depthToMainDeck,
      volumeFullnessBp: formData.volumeFullnessBp,
      deckFullnessBp: formData.deckFullnessBp,
    },
    b.arrangement,
  );
  findings.push(...arrangement.findings);

  // 7. Stability: every ledger kilogram becomes a weight lump
  const lumps: WeightItem[] = [];
  const spread = (label: string, kg: number, zFracBp: number) => {
    let left = kg;
    const shares = formData.buoyancyByZoneBp;
    ZONE_IDS.forEach((zid, i) => {
      if (zid === "MISSION") return;
      const zd = formData.zones[i]!;
      const part = i === ZONE_IDS.length - 2 ? left : Math.floor((kg * shares[i]!) / 10_000);
      left -= part;
      lumps.push({
        label: `${label}:${zid}`,
        kg: part,
        zMm: Math.floor((hull.depthToMainDeck * zFracBp) / 10_000),
        stationPermille: Math.floor((zd.startPermille + zd.endPermille) / 2),
        zoneId: zid,
      });
    });
  };
  spread("hull", hullRes.ledger.hull, b.lumpZFractionBp.hull);
  spread("margin", hullRes.ledger.margin, b.lumpZFractionBp.margin);
  spread("reserve", hullRes.ledger.reserve, b.lumpZFractionBp.reserve);
  spread("crew", hullRes.ledger.crew, b.lumpZFractionBp.crew);
  for (const r of resolved) {
    lumps.push({
      label: r.spec.instanceId,
      kg: r.weightKg,
      zMm: r.zCgMm,
      stationPermille: r.spec.stationPermille,
      zoneId: r.spec.zoneId,
    });
    const am = ammoById.get(r.spec.instanceId);
    if (am && am.ammoMassKg > 0) {
      const ms = r.spec.magazineRef ? byId.get(r.spec.magazineRef) : undefined;
      lumps.push({
        label: `${r.spec.instanceId}:ammo`,
        kg: am.ammoMassKg,
        zMm: ms?.zCgMm ?? r.zCgMm,
        stationPermille: ms?.spec.stationPermille ?? r.spec.stationPermille,
        zoneId: ms?.spec.zoneId ?? r.spec.zoneId,
      });
    }
  }
  lumps.push({
    label: "plant",
    kg: machineryRaw.plantWeightKg,
    zMm: Math.floor((hull.depthToMainDeck * b.lumpZFractionBp.machinery) / 10_000),
    stationPermille: dm.stationPermille,
    zoneId: dm.zoneId,
  });
  lumps.push({
    label: "fuel",
    kg: dm.fuelCapacityKg,
    zMm: Math.floor((hull.depthToMainDeck * b.lumpZFractionBp.fuel) / 10_000),
    stationPermille: dm.fuelStationPermille,
    zoneId: dm.fuelZoneId,
  });
  for (const [region, kg] of Object.entries(armour.weightByRegionKg)) {
    lumps.push({
      label: `armour:${region}`,
      kg,
      zMm: Math.floor((hull.depthToMainDeck * (b.armourZFractionBp[region] ?? 5_000)) / 10_000),
      stationPermille: 450,
      zoneId: "CENTRAL_MACHINERY",
    });
  }
  const window = b.stabilityWindowByCategory[draft.requirement.category];
  if (!window) throw new Error(`no stability window for category '${draft.requirement.category}'`);
  let stability: StabilityResult | null = null;
  if (!hasBlocking(hullRes.findings) && lumps.reduce((a, l) => a + l.kg, 0) > 0) {
    stability = compileStability(
      {
        items: lumps,
        lengthMm: hull.lengthWl,
        beamMm: hull.beam,
        draughtMm: hull.draught,
        depthMm: hull.depthToMainDeck,
        blockCoeffBp: hull.blockCoeffBp,
        lcbPermille: formData.lcbPermille,
        buoyancyByZoneBp: formData.buoyancyByZoneBp,
        hullWeightKg: hullRes.ledger.hull,
        window,
      },
      formData.zones,
      b.stability,
    );
    findings.push(...stability.findings);
  }

  const components: ComponentSummary[] = resolved.map((r) => ({
    instanceId: r.spec.instanceId,
    componentId: r.def.id,
    category: r.def.category,
    weightKg: r.weightKg,
    costMicro: r.costMicro,
    maintenanceMonthlyBp: r.def.maintenanceMonthlyBp ?? 0,
    buildWorkMicro:
      r.def.buildWorkMicro === undefined
        ? null
        : num(r.def.buildWorkMicro, { ...r.def.constants, ...r.params }),
    productionLine: r.def.productionLine ?? null,
    requires: r.def.requires,
    params: r.params,
    attr: r.attr,
    torpedoMount: r.def.torpedoMount ?? null,
  }));

  // 7b. Intended classification (DESIGN-22 section 5). Only the types of the active band are checked.
  let naturalClassId: string | null = null;
  if (isEarlyShipType(draft.requirement.category)) {
    const cls = classificationFindings(
      classFacts({ totalKg: hullRes.totalKg, machinery: machineryRaw, components }, draft),
      draft.requirement.category,
      b.classification ?? DESIGN_22_EARLY,
    );
    naturalClassId = cls.natural;
    findings.push(...cls.findings);
  }

  // 8. Dock, treaty, modernization
  const total = hullRes.totalKg;
  const heaviest = Math.max(0, ...resolved.map((r) => r.weightKg));
  if (
    !ctx.facilities.some(
      (x) =>
        x.maxLengthMm >= hull.lengthWl &&
        x.maxBeamMm >= hull.beam &&
        x.maxDisplacementKg >= total &&
        x.craneLiftKg >= heaviest,
    )
  ) {
    findings.push(
      f(
        "NO_FACILITY_FITS",
        "BLOCKING",
        "No available shipyard can build this ship.",
        `Needs length ${hull.lengthWl} mm, beam ${hull.beam} mm, ${total} kg, crane lift ${heaviest} kg.`,
        "The design cannot be laid down anywhere you own or can use.",
        [
          ["smaller_hull", "Reduce length, beam or displacement."],
          ["lighter_items", "Use components within the crane limit."],
          ["build_dock", "Invest in a larger slipway."],
        ],
        "SB-DOCK",
      ),
    );
  }
  const t = ctx.treaty;
  if (t) {
    if (t.maxDisplacementKg !== undefined && total > t.maxDisplacementKg) {
      findings.push(
        f(
          "TREATY_LIMIT_DISPLACEMENT",
          "BLOCKING",
          "The design exceeds the treaty displacement limit.",
          `${total} kg vs limit ${t.maxDisplacementKg} kg.`,
          "Building it violates the treaty.",
          [
            ["cut_weight", "Reduce displacement below the limit."],
            ["leave_treaty", "Withdraw from the treaty (diplomatic consequences)."],
            ["other_category", "Design a category the treaty does not limit."],
          ],
          "SB-TREATY",
        ),
      );
    }
    if (t.maxMainGunCaliberUm !== undefined) {
      const over = resolved.filter(
        (r) => r.def.category === "MAIN_GUN" && (r.attr.caliberUm ?? 0) > t.maxMainGunCaliberUm!,
      );
      if (over.length > 0)
        findings.push(
          f(
            "TREATY_LIMIT_CALIBRE",
            "BLOCKING",
            "A main gun exceeds the treaty calibre limit.",
            `${over.map((o) => o.spec.instanceId).join(", ")} over ${t.maxMainGunCaliberUm} µm.`,
            "Building it violates the treaty.",
            [
              ["smaller_gun", "Use a smaller calibre."],
              ["leave_treaty", "Withdraw from the treaty."],
              ["reclassify", "Redesign as a category without the limit."],
            ],
            "SB-TREATY",
          ),
        );
    }
    if (t.forbiddenCategories?.includes(draft.requirement.category)) {
      findings.push(
        f(
          "TREATY_LIMIT_CATEGORY",
          "BLOCKING",
          "This ship category is forbidden by treaty.",
          `Category ${draft.requirement.category}.`,
          "It cannot be built while the treaty is in force.",
          [
            ["other_category", "Choose another category."],
            ["leave_treaty", "Withdraw from the treaty."],
            ["wait", "Wait for the treaty to expire."],
          ],
          "SB-TREATY",
        ),
      );
    }
  }
  const reserveBp = total === 0 ? 0 : Math.floor((hullRes.ledger.reserve * 10_000) / total);
  const minReserve = b.minReserveBpByExpectation[draft.requirement.modernizationExpectation];
  if (reserveBp < minReserve) {
    findings.push(
      f(
        "MODERNIZATION_MARGIN_LOW",
        "ADVISORY",
        "The design has little room to grow.",
        `Growth reserve ${reserveBp} bp; the requirement expects at least ${minReserve} bp.`,
        "Later refits will be limited or impossible without removing equipment.",
        [
          ["raise_reserve", "Raise the growth reserve (costs capability now)."],
          ["accept", "Accept a hull that cannot be modernized."],
        ],
        "F-H5",
      ),
    );
  }

  const sorted = sortFindings(findings);
  const costMicro = resolved.reduce((a, r) => a + r.costMicro, 0);
  const body = {
    ledger: hullRes.ledger,
    totalKg: total,
    hull: hullRes,
    machinery: machineryRaw,
    arrangement,
    weapons,
    armour,
    stability,
    systems,
    naturalClass: naturalClassId,
    componentCostMicro: costMicro,
    components,
    findings: sorted,
    valid: !hasBlocking(sorted),
  };
  return { ...body, hash: sha256Hex(canonicalSerialize(body)) };
}
