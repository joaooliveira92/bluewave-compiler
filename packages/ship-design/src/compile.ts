// packages/ship-design/src/compile.ts
// Full design-compile pipeline (DESIGN-22). Never throws on design errors: they
// become findings. Throws only on corrupt context.
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import {
  classFacts,
  classificationFindings,
  DESIGN_22_EARLY,
  isEarlyShipType,
} from "./classification.js";
import { compileArmour, type ArmourInput } from "./armour.js";
import type { ComponentCategory } from "./component.js";
import type { Finding } from "./findings.js";
import { hasBlocking, sortFindings } from "./findings.js";
import { compileHull } from "./hull.js";
import { emptyLedger, withLine, type LedgerCategory } from "./ledger.js";
import { compileMachinery } from "./machinery.js";
import { compileStability, type StabilityResult } from "./stability.js";
import { compileSystems } from "./systems.js";
import { compileWeapons, type ArcObstacle, type GunMount } from "./weapons.js";
import {
  num,
  WEAPON_CATEGORIES,
  type ComponentSummary,
  type DesignDraft,
  type ShipContext,
} from "./compileShared.js";
import {
  buildPlacementsAndArrangement,
  buildStabilityLumps,
  collectDockTreatyModernizationFindings,
  resolveDesignComponents,
} from "./compileStages.js";

export type {
  PlacementSpec,
  MachineryPlan,
  DesignRequirement,
  DesignDraft,
  HullFormData,
  Facility,
  TreatyLimits,
  ShipBalance,
  ShipContext,
  CompiledDesign,
  ComponentSummary,
} from "./compileShared.js";

export function compileDesign(draft: DesignDraft, ctx: ShipContext): CompiledDesign {
  const b = ctx.balance;
  const findings: Finding[] = [];
  const formData = ctx.hullForms[draft.hull.hullFormId];
  if (!formData) throw new Error(`unknown hull form '${draft.hull.hullFormId}'`);
  const plant = ctx.plants.find((p) => p.id === draft.machinery.plantId);
  if (!plant) throw new Error(`unknown plant '${draft.machinery.plantId}'`);
  const catalogue = new Map(ctx.catalogue.map((c) => [c.id, c]));

  // 1. Technology availability and parameter validity (stage VALIDATE_TECHNOLOGY)
  const resolved = resolveDesignComponents(draft, ctx, catalogue, plant, findings);
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
  const { arrangement, rooms, roomPart } = buildPlacementsAndArrangement({
    draft,
    resolved,
    plant,
    machineryRaw,
    formData,
    b,
    findings,
    ammoById,
  });

  // 7. Stability: every ledger kilogram becomes a weight lump
  const lumps = buildStabilityLumps({
    draft,
    resolved,
    hull,
    formData,
    b,
    hullRes,
    machineryRaw,
    ammoById,
    byId,
    rooms,
    roomPart,
    armour,
  });
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
  collectDockTreatyModernizationFindings({
    draft,
    ctx,
    resolved,
    total,
    reserveKg: hullRes.ledger.reserve,
    findings,
  });

  const protectionIds = new Set([
    "MAGAZINE_UNPROTECTED",
    "ARMOUR_INEFFECTIVE_VS_ADVERSARY",
    "CITADEL_INCOMPLETE",
  ]);
  const adjusted =
    draft.requirement.protectionGoal === "NONE"
      ? findings.map((x) => (protectionIds.has(x.id) ? { ...x, severity: "ADVISORY" as const } : x))
      : findings;
  const sorted = sortFindings(adjusted);
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
