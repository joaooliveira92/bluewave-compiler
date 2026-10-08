import type { CompiledDesign, DesignDraft } from "./compile.js";
import { UM_PER_KNOT } from "./units.js";

/**
 * Structural match of `@bluewave/campaign`'s `CompiledDesignVersion` (ADR-0037 canonical units), kept here so this package
 * does not depend on the campaign engine. Plain numbers; the engine brands them at its boundary.
 */
export interface EngineDesignFields {
  readonly designVersionId: string;
  readonly designFamilyId: string;
  readonly className: string;
  readonly nationId: string;
  readonly hullType: string;
  readonly normalizedDisplacementKg: number;
  readonly normalizedSpeedUms: number;
  readonly normalizedArmorUm: number;
  readonly hitPoints: number;
  readonly mainGunsCaliber: number;
  readonly mainGunsCount: number;
  readonly machineryType: string;
  readonly crewComplement: number;
  readonly contentVersion: string;
  readonly compiledHash: string;
  readonly torpedoArmament?: readonly {
    mountType: string;
    tubeCount: number;
    torpedoModelId: string;
  }[];
}

export interface EngineAdapterOptions {
  readonly designVersionId: string;
  readonly designFamilyId: string;
  readonly className: string;
  readonly hullType: string;
  readonly machineryType: string;
  readonly contentVersion: string;
  /** Hull mass that equals one engine hit point (ruleset constant). */
  readonly kgPerHitPoint: number;
}

export class EngineAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineAdapterError";
  }
}

/**
 * Projects a validated compiled design onto the fields combat and campaign already consume. Refuses invalid designs
 * (an invalid design can never enter the engine, invariant I3).
 */
export function toEngineDesign(
  c: CompiledDesign,
  d: DesignDraft,
  o: EngineAdapterOptions,
): EngineDesignFields {
  if (!c.valid)
    throw new EngineAdapterError("invalid design (BLOCKING findings) cannot enter the engine");
  if (o.kgPerHitPoint <= 0) throw new EngineAdapterError("kgPerHitPoint must be > 0");

  const vertical = c.armour
    ? d.armour.regions.filter(
        (r) => r.region === "BELT_MAIN" || r.region === "BELT_UPPER" || r.region === "BELT_ENDS",
      )
    : [];
  const armorUm = vertical.reduce((m, r) => Math.max(m, r.thicknessUm), 0);

  const guns = c.components.filter((k) => k.category === "MAIN_GUN");
  const pool = guns.length > 0 ? guns : c.components.filter((k) => k.category === "SECONDARY_GUN");
  const caliber = pool.reduce((m, k) => Math.max(m, k.attr.caliberUm ?? 0), 0);
  const count = pool
    .filter((k) => (k.attr.caliberUm ?? 0) === caliber)
    .reduce((a, k) => a + (k.params.barrels ?? 1), 0);

  const mounts = new Map<
    string,
    { mountType: string; tubeCount: number; torpedoModelId: string }
  >();
  for (const k of c.components) {
    if (k.category !== "TORPEDO_TUBE" || !k.torpedoMount) continue;
    const key = `${k.torpedoMount.mountType}|${k.torpedoMount.torpedoModelId}`;
    const cur = mounts.get(key);
    const tubes = k.params.tubes ?? 1;
    mounts.set(
      key,
      cur ? { ...cur, tubeCount: cur.tubeCount + tubes } : { ...k.torpedoMount, tubeCount: tubes },
    );
  }
  const torpedoArmament = [...mounts.entries()]
    .sort((x, y) => (x[0] < y[0] ? -1 : 1))
    .map(([, v]) => v);

  return {
    designVersionId: o.designVersionId,
    designFamilyId: o.designFamilyId,
    className: o.className,
    nationId: d.nationId,
    hullType: o.hullType,
    normalizedDisplacementKg: c.totalKg,
    normalizedSpeedUms: Math.floor(((c.machinery?.maxSpeedMilliKnots ?? 0) * UM_PER_KNOT) / 1000),
    normalizedArmorUm: armorUm,
    hitPoints: Math.max(1, Math.floor(c.ledger.hull / o.kgPerHitPoint)),
    mainGunsCaliber: caliber,
    mainGunsCount: count,
    machineryType: o.machineryType,
    crewComplement: c.systems?.crewRequired ?? 0,
    contentVersion: o.contentVersion,
    compiledHash: c.hash,
    ...(torpedoArmament.length > 0 ? { torpedoArmament } : {}),
  };
}
