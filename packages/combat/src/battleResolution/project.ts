//packages/combat/src/battleResolution/project.ts
// B-6 INC-2 (AC-4): project the battle manifest + committed campaign ships
// (B-1 promotions) + divisions into a deterministic `TacticalBattleState` with
// realism-independent stats (DESIGN-38 §9, §33), the main-battery gunnery
// surface, and the per-ship damage contexts.
//
// Rules (recorded in ADR-0026):
//  - only ships on `manifest.persistentAssets` that are present in the owning
//    nation's fleets and NOT under construction are promoted; unit assetId ==
//    campaign ship id;
//  - sides follow the manifest (ATTACKER nation / DEFENDER nation), units
//    ordered by canonicalized persistentAssets;
//  - a missing design for a promoted ship fails closed with the promotion
//    guard's TACTICAL_UNIT_PROMOTION_INVALID (never a silent skip);
//  - an asset on the manifest missing from both nations fails closed with
//    BATTLE_AUTO_RESOLUTION_FAILED and a stable diagnostic (no partial result);
//  - movement spawn uses the canonical default area bbox; initial headings
//    from spawn.ts (attackers east, defenders west).
import { sha256Hex } from "@bluewave/deterministic";
import { canonicalSerialize } from "@bluewave/deterministic";
import { BluewaveError } from "@bluewave/contracts";
import type { CompiledDesignVersion, PermanentDivision, Ship } from "@bluewave/campaign";
import {
  promoteTacticalUnit,
  TACTICAL_UNIT_PROMOTION_INVALID,
  type TacticalShipUnit,
} from "../tactical/unit.js";
import { projectPermanentDivision, type TacticalDivision } from "../tactical/division.js";
import type { TacticalBattleState } from "../tactical/state.js";
import { computeInitialMovementStates } from "../simulation/spawn.js";
import type { GunneryBattery } from "../gunnery/resolve.js";
import {
  neutralAccuracyFactors,
  neutralRateFactors,
  withGunneryStateHash,
  NO_TARGET,
} from "../gunnery/index.js";
import { GUNNERY_RULESET_VERSION, GUNNERY_FORMULA_VERSION } from "../gunnery/constants.js";
import type { BattleManifest } from "../generation/manifest.js";
import { initialDamageState, type DamageContext, type DamageTargetContext } from "./damage.js";
import {
  AUTO_RESOLUTION_COMPARTMENTS,
  AUTO_RESOLUTION_COMPONENTS,
  DEFAULT_AREA_BBOX,
  FLOAT_UNIT,
  GUNNERY_ACCURACY_BASE_BP,
  GUNNERY_BASE_RELOAD_MS,
  STABILITY_INITIAL_BP,
  autoZonesForBelt,
  designedSpeedBpKnots,
} from "./constants.js";
import { BATTLE_AUTO_RESOLUTION_FAILED } from "./reasonCodes.js";

export interface AutoResolverNation {
  nationId: string;
  ships: Ship[];
  designs: Map<string, CompiledDesignVersion>;
  divisions: PermanentDivision[];
}

export interface ProjectBattleInput {
  manifest: BattleManifest;
  areaId: string;
  campaignMonth: string;
  attacker: AutoResolverNation;
  defender: AutoResolverNation;
  rulesetVersion: string;
}

export interface ProjectBattleOutput {
  state: TacticalBattleState;
  /** Main-battery gunnery surface (engine/resolver thread the states). */
  batteries: GunneryBattery[];
  /** Per-ship damage contexts (engine/resolver update states per minute). */
  damage: DamageContext;
  /** Mission orders (spawn headings at full designed speed). */
  orders: Record<string, { orderedHeading: number; orderedSpeedBp: number }>;
  /** Promoted units keyed by assetId. */
  units: TacticalShipUnit[];
  /** Resolved designs for the promoted units (promotion-verified). */
  designs: Record<string, CompiledDesignVersion>;
}

export function projectBattle(input: ProjectBattleInput): ProjectBattleOutput {
  const { manifest, attacker, defender } = input;

  // ---- Committed ships: manifest.persistentAssets only ---------------------
  const attackerByPid = new Map(attacker.ships.map((s) => [s.id, s]));
  const defenderByPid = new Map(defender.ships.map((s) => [s.id, s]));
  const assets = [...manifest.persistentAssets].sort();

  const promoted: TacticalShipUnit[] = [];
  const unitDesigns: Record<string, CompiledDesignVersion> = {};

  for (const assetId of assets) {
    const ship = attackerByPid.get(assetId) ?? defenderByPid.get(assetId);
    if (!ship) {
      throw new BluewaveError(BATTLE_AUTO_RESOLUTION_FAILED, {
        code: BATTLE_AUTO_RESOLUTION_FAILED,
        assetId,
        battleId: manifest.battleId,
        reason: "manifest persistent asset not found in either nation's committed ships",
      });
    }
    if (ship.isUnderConstruction) continue; // B-1: under-construction ships cannot promote

    const sideId: "ATTACKER" | "DEFENDER" = attackerByPid.has(assetId) ? "ATTACKER" : "DEFENDER";
    const designs = sideId === "ATTACKER" ? attacker.designs : defender.designs;
    const design = designs.get(ship.designVersionId);
    if (!design) {
      // Fail closed with the promotion guard's stable diagnostic — a design is
      // REQUIRED for every committed ship (never a silent skip).
      throw new BluewaveError(TACTICAL_UNIT_PROMOTION_INVALID, {
        code: TACTICAL_UNIT_PROMOTION_INVALID,
        shipId: ship.id,
        designVersionId: ship.designVersionId,
        reason: "missing design reference for a committed ship",
      });
    }

    const unit = promoteTacticalUnit(ship, design, {
      sideId,
      preBattleStateHash: preBattleHash(
        manifest.battleId,
        input.areaId,
        input.campaignMonth,
        ship.id,
      ),
      projectionReason: "auto-resolution",
    });
    promoted.push(unit);
    unitDesigns[unit.assetId] = design;
  }

  // ---- sides/forces (attacker then defender, canonical asset order) --------
  const attackerUnits = promoted.filter((u) => u.sideId === "ATTACKER");
  const defenderUnits = promoted.filter((u) => u.sideId === "DEFENDER");
  const units = [...attackerUnits, ...defenderUnits];

  // ---- movement spawn (canonical default area box) -------------------------
  const movement = computeInitialMovementStates(
    DEFAULT_AREA_BBOX,
    units.map((u) => ({
      assetId: u.assetId,
      sideId: u.sideId as "ATTACKER" | "DEFENDER",
      orderedSpeedBpKnots: designedSpeedBpKnots(u.designedSpeedUms as number),
      designedSpeedBpKnots: designedSpeedBpKnots(u.designedSpeedUms as number),
      turningRateMdegS: 1_000,
    })),
  );

  // ---- divisions -----------------------------------------------------------
  const divisions: TacticalDivision[] = [];
  const projectDivision = (
    div: PermanentDivision,
    sideUnits: TacticalShipUnit[],
    sideId: string,
  ): void => {
    const res = projectPermanentDivision(
      div,
      sideUnits,
      manifest.battleId,
      sideId,
      input.rulesetVersion,
    );
    divisions.push(...res.tacticalDivisions);
  };
  for (const d of attacker.divisions) projectDivision(d, attackerUnits, "ATTACKER");
  for (const d of defender.divisions) projectDivision(d, defenderUnits, "DEFENDER");

  const state: TacticalBattleState = {
    battleId: manifest.battleId,
    mapId: input.areaId,
    sides: [
      { sideId: "ATTACKER", participantIds: attackerUnits.map((u) => u.assetId) },
      { sideId: "DEFENDER", participantIds: defenderUnits.map((u) => u.assetId) },
    ],
    forces: {
      ATTACKER: attackerUnits.map((u) => u.assetId),
      DEFENDER: defenderUnits.map((u) => u.assetId),
    },
    divisions,
    units,
    contacts: [],
    movementStates: movement,
    objectives: [],
    weather: {
      weather: manifest.weather,
      seaState: manifest.seaState,
      visibilityNm: 20,
      daylight: true,
    },
    exitZones: [],
    battleEventLedger: [],
  };

  // ---- main-battery gunnery surface (one battery per armed ship) -----------
  const batteries: GunneryBattery[] = [];
  for (const u of units) {
    const design = unitDesigns[u.assetId]!;
    const mainGunsCount = design.mainGunsCount as number;
    if (mainGunsCount <= 0) continue; // no main battery -> no gunnery (canonical)
    const batteryId = `${u.assetId}:MAIN`;
    batteries.push({
      id: batteryId,
      ownerShipId: u.assetId,
      sideId: u.sideId,
      mountOrdinal: 1,
      commandSource: "CENTRAL",
      baseReloadMs: GUNNERY_BASE_RELOAD_MS,
      salvoCount: mainGunsCount,
      preferredType: "ARMOR_PIERCING",
      rateFactors: neutralRateFactors(),
      accuracyFactors: neutralAccuracyFactors(GUNNERY_ACCURACY_BASE_BP),
      state: withGunneryStateHash({
        batteryId,
        ownerShipId: u.assetId,
        gunDefinitionId: `${u.designVersionId}:MAIN`,
        mountDefinitionId: "MAIN-BATTERY",
        targetContactId: NO_TARGET,
        acquisitionProgressBp: 10_000,
        rangeEstimateUm: 10_000_000_000,
        rangeUncertaintyUm: 150_000_000,
        fireControlSolutionQualityBp: 10_000,
        ammunition: { ARMOR_PIERCING: 10_000, COMMON: 0, HIGH_EXPLOSIVE: 0 },
        fireMode: "NORMAL",
        reloadProgressMs: 0,
        straddleState: null,
        damageState: null,
        aaEligibilityState: null,
        lastSalvoMinute: -1,
        lastSalvoSubstep: 0,
        rulesetVersion: GUNNERY_RULESET_VERSION,
        formulaVersion: GUNNERY_FORMULA_VERSION,
      }),
    });
  }

  // ---- per-ship damage contexts --------------------------------------------
  const targets: Record<string, DamageTargetContext> = {};
  for (const u of units) {
    const design = unitDesigns[u.assetId]!;
    targets[u.assetId] = {
      shipId: u.assetId,
      zones: autoZonesForBelt(design.normalizedArmorUm as number),
      compartments: [...AUTO_RESOLUTION_COMPARTMENTS],
      components: [...AUTO_RESOLUTION_COMPONENTS],
      state: initialDamageState(u.assetId),
      designFlotationReserve: FLOAT_UNIT,
      designStabilityScore: STABILITY_INITIAL_BP,
      beltArmorUm: design.normalizedArmorUm as number,
      mainGunsCaliberUm: design.mainGunsCaliber as number,
      shipType: u.shipType,
      maxHitPoints: u.maxHitPoints as number,
    };
  }

  // ---- orders (keep spawn headings; steam at full designed speed) ----------
  const orders: Record<string, { orderedHeading: number; orderedSpeedBp: number }> = {};
  for (const u of units) {
    const m = movement[u.assetId]!;
    orders[u.assetId] = {
      orderedHeading: m.heading,
      orderedSpeedBp: designedSpeedBpKnots(u.designedSpeedUms as number),
    };
  }

  return {
    state,
    batteries,
    damage: { battleId: manifest.battleId, targets },
    orders,
    units,
    designs: unitDesigns,
  };
}

/** Deterministic pre-battle state hash for a promoted ship (promotion seam). */
function preBattleHash(battleId: string, areaId: string, month: string, shipId: string): string {
  return sha256Hex(canonicalSerialize({ battleId, areaId, month, shipId }));
}
