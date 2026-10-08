// packages/ship-design/src/compileShared.ts
// Public compile contracts plus the small shared helpers used by the compile
// pipeline stages. Re-exported from ./compile.js so the package surface is
// unchanged.
import type { ArrangementBalance, ArrangementResult, ZoneDef, ZoneId } from "./arrangement.js";
import type {
  ArmourBalance,
  ArmourRegion,
  ArmourResult,
  ThreatProfile,
} from "./armour.js";
import type { ClassificationRules } from "./classification.js";
import type { ComponentCategory, ComponentDef } from "./component.js";
import type { Finding } from "./findings.js";
import { evaluate } from "./formula/eval.js";
import { parseFormula } from "./formula/parse.js";
import type { HullBalance, HullForm, HullResult, HullSpec } from "./hull.js";
import type { DisplacementLedger, LedgerCategory } from "./ledger.js";
import type { MachineryBalance, MachineryResult, PropulsionPlant } from "./machinery.js";
import type { StabilityBalance, StabilityResult, StabilityWindow } from "./stability.js";
import type { AccommodationStandard, SystemsBalance, SystemsResult } from "./systems.js";
import type { MountSide, WeaponBalance, WeaponsResult } from "./weapons.js";

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
  /**
   * Optional machinery rooms (boiler rooms, engine rooms). The plant's weight and volume are split by `shareBp`
   * (sum 10_000); each room is a separate critical system. When absent the plant is one room at `zoneId`.
   */
  readonly rooms?: readonly {
    readonly zoneId: ZoneId;
    readonly stationPermille: number;
    readonly shareBp: number;
  }[];
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
  /** NONE = the brief accepts an unprotected ship (torpedo craft): protection findings become advisories. Default STANDARD. */
  readonly protectionGoal?: "NONE" | "STANDARD";
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

export const WEAPON_CATEGORIES: readonly ComponentCategory[] = [
  "MAIN_GUN",
  "SECONDARY_GUN",
  "DUAL_PURPOSE_GUN",
  "AA_WEAPON",
];

export interface Resolved {
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

export function f(
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

export const num = (src: string | undefined, vars: Record<string, number>) =>
  src === undefined ? 0 : evaluate(parseFormula(src), { vars });
export const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
