import type { ComponentCategory } from "./component.js";
import type { CompiledDesign, DesignDraft } from "./compile.js";
import type { CostBreakdown } from "./cost.js";
import { evaluate, type LookupTable } from "./formula/eval.js";
import { parseFormula } from "./formula/parse.js";
import { toSafe } from "./units.js";

export type LineId = "slipway" | "armour_plate" | "heavy_gun" | "machinery" | "quay" | "trials";
export const LINE_IDS: readonly LineId[] = [
  "slipway",
  "armour_plate",
  "heavy_gun",
  "machinery",
  "quay",
  "trials",
];

export type PackageKind =
  | "HULL"
  | "ARMOUR"
  | "ORDNANCE"
  | "MACHINERY"
  | "LAUNCH"
  | "FIT_OUT"
  | "TRIALS"
  | "ACCEPTANCE";
/** Canonical order for allocating contended capacity (extends DESIGN-23 §19 ordering for new construction). */
export const PACKAGE_ORDER: readonly PackageKind[] = [
  "HULL",
  "MACHINERY",
  "ARMOUR",
  "ORDNANCE",
  "LAUNCH",
  "FIT_OUT",
  "TRIALS",
  "ACCEPTANCE",
];

export interface WorkPackage {
  readonly id: string;
  readonly kind: PackageKind;
  readonly line: LineId;
  readonly totalWork: number;
  readonly dependsOn: readonly string[];
}

export interface ConstructionBalance {
  readonly hullWorkPerTonneMicro: number;
  readonly armourWorkPerKgMicro: number;
  readonly machineryWorkPerKwMicro: number;
  /** Money (micro) that buys one work micro-unit for a component with no authored work. */
  readonly componentCostPerWorkMicro: number;
  readonly lineByCategory: Readonly<Record<ComponentCategory, LineId | "fit_out">>;
  readonly fitOutHullShareBp: number;
  readonly launchHullShareBp: number;
  readonly trialsShareBp: number;
  readonly acceptanceShareBp: number;
  readonly firstOfClassWorkBp: number;
  readonly maxMonths: number;
  /** Displacement in tonnes -> months from keel to commissioning at a neutral yard (ADR-0067 section 5). */
  readonly buildMonthsByDisplacementT: LookupTable;
  /** Provenance of each build-time point, parallel to `buildMonthsByDisplacementT.points` (same length and order). */
  readonly buildMonthsProvenance: readonly BuildTimeProvenance[];
  /** Industry-efficiency multiplier on build time for an efficient shipbuilding industry, bp (10_000 = neutral). */
  readonly efficientIndustryBp: number;
  /** Accelerated construction time multiplier, bp (RTW3 manual p. 31: 10 % faster = 9_000). */
  readonly accelerationTimeBp: number;
}

/**
 * How well a build-time table point is sourced. VERIFIED: the months value is read in a primary contemporary source for a
 * ship of about that displacement. SECONDARY: from a compilation, a derived value, or a primary duration whose displacement
 * is not itself verified. ESTIMATE: no source. The Drawing Board labels the build time provisional unless every point that
 * brackets the displacement is VERIFIED.
 */
export type BuildTimeSourceStatus = "VERIFIED" | "SECONDARY" | "ESTIMATE";

export interface BuildTimeProvenance {
  readonly status: BuildTimeSourceStatus;
  /** Citation: publication, page and ship the value is read from. */
  readonly source: string;
}

export interface BuildTimeOptions {
  /** Shipbuilding-industry time multiplier, bp: below 10_000 efficient, above undeveloped. Default neutral. */
  readonly industryBp?: number;
  readonly accelerated?: boolean;
}

/**
 * Historical build time (keel to commissioning) in whole months for a displacement, from the content table, scaled by the
 * industry multiplier and, if accelerated, the acceleration multiplier. Pure; round-half-up on each bp step; at least 1.
 */
export function historicalBuildMonths(
  displacementKg: number,
  b: ConstructionBalance,
  o: BuildTimeOptions = {},
): number {
  const tonnes = Math.round(displacementKg / 1000);
  const base = evaluate(parseFormula("lookup(t, x)"), {
    vars: { x: tonnes },
    tables: { t: b.buildMonthsByDisplacementT },
  });
  let m = BigInt(base);
  m = mulBp(m, o.industryBp ?? 10_000);
  if (o.accelerated) m = mulBp(m, b.accelerationTimeBp);
  return Math.max(1, Number(m));
}

export interface ConstructionPlan {
  readonly packages: readonly WorkPackage[];
  readonly totalWork: number;
}

/**
 * True while any table point that brackets this displacement (the point itself on an exact hit, the first or last point
 * outside the table, otherwise the two surrounding points) is not VERIFIED. Throws if the provenance does not match the table.
 */
export function buildTimeIsProvisional(displacementKg: number, b: ConstructionBalance): boolean {
  const pts = b.buildMonthsByDisplacementT.points;
  const prov = b.buildMonthsProvenance;
  if (prov.length !== pts.length) {
    throw new Error(
      `buildMonthsProvenance has ${prov.length} entries for ${pts.length} buildMonthsByDisplacementT points`,
    );
  }
  for (const p of prov) {
    if (p.status !== "VERIFIED" && p.status !== "SECONDARY" && p.status !== "ESTIMATE") {
      throw new Error(`unknown build-time source status '${String(p.status)}'`);
    }
    if (p.source.trim() === "") throw new Error("build-time provenance needs a source citation");
  }
  const t = Math.round(displacementKg / 1000);
  const last = pts.length - 1;
  if (last < 0) throw new Error("empty build-time table");
  const verified = (i: number) => prov[i]!.status === "VERIFIED";
  if (t <= pts[0]![0]) return !verified(0);
  if (t >= pts[last]![0]) return !verified(last);
  for (let i = 1; i <= last; i++) {
    if (t === pts[i]![0]) return !verified(i);
    if (t < pts[i]![0]) return !(verified(i - 1) && verified(i));
  }
  return !verified(last);
}

const BP = 10_000n;
const mulBp = (v: bigint, p: number) => (v * BigInt(p) + BP / 2n) / BP;

/** Splits a compiled design into work packages with dependencies (spec §15.2). Pure and deterministic. */
export function planConstruction(
  c: CompiledDesign,
  d: DesignDraft,
  cost: CostBreakdown,
  b: ConstructionBalance,
  firstOfClass: boolean,
): ConstructionPlan {
  const mult = (v: bigint) => (firstOfClass ? mulBp(v, 10_000 + b.firstOfClassWorkBp) : v);
  const hullWork = mult((BigInt(c.ledger.hull) * BigInt(b.hullWorkPerTonneMicro)) / 1000n);
  let armour = mult(BigInt(c.armour?.totalWeightKg ?? 0) * BigInt(b.armourWorkPerKgMicro));
  let machinery = mult(BigInt(d.machinery.installedKw) * BigInt(b.machineryWorkPerKwMicro));
  let ordnance = 0n;
  let fitOut = mulBp(hullWork, b.fitOutHullShareBp);
  for (const k of c.components) {
    const work = mult(
      k.buildWorkMicro !== null
        ? BigInt(k.buildWorkMicro)
        : BigInt(k.costMicro) / BigInt(b.componentCostPerWorkMicro),
    );
    const line = k.productionLine ?? b.lineByCategory[k.category];
    if (line === "heavy_gun") ordnance += work;
    else if (line === "armour_plate") armour += work;
    else if (line === "machinery") machinery += work;
    else fitOut += work;
  }
  const launch = mulBp(hullWork, b.launchHullShareBp);
  const sum = hullWork + armour + machinery + ordnance + launch + fitOut;
  const trials = mulBp(sum, b.trialsShareBp);
  const acceptance = mulBp(sum, b.acceptanceShareBp);
  void cost;
  const w = (v: bigint) => Math.max(1, toSafe("work", v));
  const pk = (
    id: string,
    kind: PackageKind,
    line: LineId,
    total: bigint,
    dependsOn: string[],
  ): WorkPackage => ({ id, kind, line, totalWork: w(total), dependsOn });
  const packages: WorkPackage[] = [
    pk("hull", "HULL", "slipway", hullWork, []),
    pk("machinery", "MACHINERY", "machinery", machinery, []),
    pk("armour", "ARMOUR", "armour_plate", armour, []),
    pk("ordnance", "ORDNANCE", "heavy_gun", ordnance, []),
    pk("launch", "LAUNCH", "slipway", launch, ["hull"]),
    pk("fit_out", "FIT_OUT", "quay", fitOut, ["launch", "machinery", "armour", "ordnance"]),
    pk("trials", "TRIALS", "trials", trials, ["fit_out"]),
    pk("acceptance", "ACCEPTANCE", "trials", acceptance, ["trials"]),
  ];
  return { packages, totalWork: packages.reduce((a, p) => a + p.totalWork, 0) };
}

export class ConstructionPlanError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ConstructionPlanError";
  }
}

export interface MonthState {
  readonly month: number;
  readonly applied: Readonly<Record<string, number>>;
  readonly completed: readonly string[];
}

export interface ConstructionSchedule {
  readonly months: readonly MonthState[];
  readonly durationMonths: number;
  /** Line that limited progress in the most months. */
  readonly bottleneck: LineId | null;
  readonly finalWork: Readonly<Record<string, number>>;
}

export interface ScheduleInput {
  /** Work micro-units each line can apply per month for this ship. */
  readonly capacity: Readonly<Record<LineId, number>>;
  /** Money available per month, or null for unconstrained. */
  readonly monthlyFundingMicro: number | null;
  readonly costPerWorkMicro: number;
}

/** Cyclic or dangling dependencies fail with DOCKYARD_WORK_PACKAGE_CYCLE (DESIGN-23 §19). */
export function checkPlan(plan: ConstructionPlan): void {
  const ids = new Set(plan.packages.map((p) => p.id));
  const state = new Map<string, 1 | 2>();
  const by = new Map(plan.packages.map((p) => [p.id, p]));
  const visit = (id: string): void => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1)
      throw new ConstructionPlanError("DOCKYARD_WORK_PACKAGE_CYCLE", `cycle at ${id}`);
    state.set(id, 1);
    for (const dep of by.get(id)!.dependsOn) {
      if (!ids.has(dep))
        throw new ConstructionPlanError(
          "DOCKYARD_WORK_PACKAGE_DEPENDENCY_MISSING",
          `${id} depends on ${dep}`,
        );
      visit(dep);
    }
    state.set(id, 2);
  };
  for (const p of plan.packages) visit(p.id);
}

/**
 * Month-by-month progress. A package starts only when its dependencies are complete; progress in a month is limited by
 * line capacity and, if set, funding (money buys work at `costPerWorkMicro`). Contended lines are allocated in
 * PACKAGE_ORDER. Progress is never negative and never exceeds remaining work (invariant I6).
 */
export function simulateConstruction(
  plan: ConstructionPlan,
  s: ScheduleInput,
  maxMonths: number,
): ConstructionSchedule {
  checkPlan(plan);
  const remaining = new Map(plan.packages.map((p) => [p.id, p.totalWork]));
  const done = new Set<string>();
  const months: MonthState[] = [];
  const limited = new Map<LineId, number>();
  const order = [...plan.packages].sort(
    (x, y) =>
      PACKAGE_ORDER.indexOf(x.kind) - PACKAGE_ORDER.indexOf(y.kind) || (x.id < y.id ? -1 : 1),
  );
  for (let m = 1; m <= maxMonths && done.size < plan.packages.length; m++) {
    const cap = new Map(LINE_IDS.map((l) => [l, s.capacity[l]]));
    let funds =
      s.monthlyFundingMicro === null
        ? Number.MAX_SAFE_INTEGER
        : Math.floor(s.monthlyFundingMicro / Math.max(1, s.costPerWorkMicro));
    const applied: Record<string, number> = {};
    const finished: string[] = [];
    for (const p of order) {
      if (done.has(p.id) || !p.dependsOn.every((x) => done.has(x))) continue;
      const rem = remaining.get(p.id)!;
      const lineCap = cap.get(p.line)!;
      const a = Math.max(0, Math.min(rem, lineCap, funds));
      if (a < rem && a === lineCap && lineCap < funds)
        limited.set(p.line, (limited.get(p.line) ?? 0) + 1);
      cap.set(p.line, lineCap - a);
      funds -= a;
      remaining.set(p.id, rem - a);
      applied[p.id] = a;
      if (rem - a === 0) finished.push(p.id);
    }
    for (const id of finished) done.add(id);
    months.push({ month: m, applied, completed: finished });
  }
  if (done.size < plan.packages.length) {
    throw new ConstructionPlanError(
      "CONSTRUCTION_STALLED",
      `not finished within ${maxMonths} months (capacity or funding too low)`,
    );
  }
  let bottleneck: LineId | null = null;
  let best = 0;
  for (const l of LINE_IDS) {
    const n = limited.get(l) ?? 0;
    if (n > best) {
      best = n;
      bottleneck = l;
    }
  }
  return {
    months,
    durationMonths: months.length,
    bottleneck,
    finalWork: Object.fromEntries(
      plan.packages.map((p) => [p.id, p.totalWork - remaining.get(p.id)!]),
    ),
  };
}
