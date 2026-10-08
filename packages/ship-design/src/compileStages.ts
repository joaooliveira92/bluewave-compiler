// packages/ship-design/src/compileStages.ts
// Focused stages of the design-compile pipeline. Each stage performs one part of
// DESIGN-22 compilation and reports its findings through the shared list.
import {
  analyseArrangement,
  ZONE_IDS,
  type ArrangementResult,
  type ResolvedPlacement,
  type ZoneId,
} from "./arrangement.js";
import type { ArmourResult } from "./armour.js";
import type { ComponentDef } from "./component.js";
import {
  cmpStr,
  f,
  num,
  WEAPON_CATEGORIES,
  type DesignDraft,
  type HullFormData,
  type Resolved,
  type ShipBalance,
  type ShipContext,
} from "./compileShared.js";
import type { Finding } from "./findings.js";
import type { HullResult, HullSpec } from "./hull.js";
import type { MachineryResult, PropulsionPlant } from "./machinery.js";
import type { WeightItem } from "./stability.js";
import type { WeaponsResult } from "./weapons.js";

type AmmoMount = WeaponsResult["mounts"][number];

// Stage 1 - technology availability and parameter validity
// (stage VALIDATE_TECHNOLOGY): resolve each placement against the catalogue,
// defaulting parameters and evaluating formulas.
export function resolveDesignComponents(
  draft: DesignDraft,
  ctx: ShipContext,
  catalogue: Map<string, ComponentDef>,
  plant: PropulsionPlant,
  findings: Finding[],
): Resolved[] {
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
  return resolved;
}

// Stage 6 - arrangement: turn resolved components (plus machinery rooms and
// bunkers) into placements and analyse the layout.
export function buildPlacementsAndArrangement(args: {
  draft: DesignDraft;
  resolved: Resolved[];
  plant: PropulsionPlant;
  machineryRaw: MachineryResult;
  formData: HullFormData;
  b: ShipBalance;
  findings: Finding[];
  ammoById: Map<string, AmmoMount>;
}): {
  arrangement: ArrangementResult;
  rooms: readonly { zoneId: ZoneId; stationPermille: number; shareBp: number }[];
  roomPart: (total: number, i: number) => number;
} {
  const { draft, resolved, plant, machineryRaw, formData, b, ammoById } = args;
  const hull = draft.hull;

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
  const rooms = dm.rooms ?? [
    { zoneId: dm.zoneId, stationPermille: dm.stationPermille, shareBp: 10_000 },
  ];
  if (rooms.reduce((a, r) => a + r.shareBp, 0) !== 10_000 || rooms.some((r) => r.shareBp <= 0)) {
    throw new Error("machinery room shares must be positive and sum to 10000");
  }
  const roomPart = (total: number, i: number) =>
    i === rooms.length - 1
      ? total - rooms.slice(0, i).reduce((a, r) => a + Math.floor((total * r.shareBp) / 10_000), 0)
      : Math.floor((total * rooms[i]!.shareBp) / 10_000);
  rooms.forEach((room, i) => {
    resolvedPlacements.push({
      instanceId: `~plant${rooms.length === 1 ? "" : `:${i}`}`,
      componentId: plant.id,
      category: "ENGINE",
      zoneId: room.zoneId,
      stationPermille: room.stationPermille,
      weightKg: roomPart(machineryRaw.plantWeightKg, i),
      volumeLitre: roomPart(machineryRaw.plantVolumeLitre, i),
      deckFootprintMm2: 0,
      heightMm: 0,
      zCgMm: Math.floor((hull.depthToMainDeck * b.lumpZFractionBp.machinery) / 10_000),
      allowedZones: [...ZONE_IDS],
      forbidsCoLocation: [],
      critical: true,
    });
  });
  resolvedPlacements.push({
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
  });
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
  args.findings.push(...arrangement.findings);
  return { arrangement, rooms, roomPart };
}

// Stage 7 - stability: every ledger kilogram becomes a weight lump.
export function buildStabilityLumps(args: {
  draft: DesignDraft;
  resolved: Resolved[];
  hull: HullSpec;
  formData: HullFormData;
  b: ShipBalance;
  hullRes: HullResult;
  machineryRaw: MachineryResult;
  ammoById: Map<string, AmmoMount>;
  byId: Map<string, Resolved>;
  rooms: readonly { zoneId: ZoneId; stationPermille: number; shareBp: number }[];
  roomPart: (total: number, i: number) => number;
  armour: ArmourResult;
}): WeightItem[] {
  const { draft, resolved, hull, formData, b, hullRes, machineryRaw, ammoById, byId, rooms, roomPart, armour } =
    args;
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
  rooms.forEach((room, i) => {
    lumps.push({
      label: `plant:${i}`,
      kg: roomPart(machineryRaw.plantWeightKg, i),
      zMm: Math.floor((hull.depthToMainDeck * b.lumpZFractionBp.machinery) / 10_000),
      stationPermille: room.stationPermille,
      zoneId: room.zoneId,
    });
  });
  lumps.push({
    label: "fuel",
    kg: draft.machinery.fuelCapacityKg,
    zMm: Math.floor((hull.depthToMainDeck * b.lumpZFractionBp.fuel) / 10_000),
    stationPermille: draft.machinery.fuelStationPermille,
    zoneId: draft.machinery.fuelZoneId,
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
  return lumps;
}

// Stage 8 - dock, treaty and modernization findings.
export function collectDockTreatyModernizationFindings(args: {
  draft: DesignDraft;
  ctx: ShipContext;
  resolved: Resolved[];
  total: number;
  reserveKg: number;
  findings: Finding[];
}): void {
  const { draft, ctx, resolved, total, reserveKg, findings } = args;
  const hull = draft.hull;
  const b = ctx.balance;

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
  const reserveBp = total === 0 ? 0 : Math.floor((reserveKg * 10_000) / total);
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
}
