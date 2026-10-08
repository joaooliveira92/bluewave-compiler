import {
  compileDesign,
  type CompiledDesign,
  type DesignDraft,
  type ShipContext,
} from "./compile.js";
import {
  planConstruction,
  simulateConstruction,
  type ConstructionBalance,
  type LineId,
} from "./construction.js";
import { computeCost, type CostBalance, type CostContext } from "./cost.js";
import { computeCve, CVE_LABEL, type CveBalance } from "./cve.js";
import type { Finding, Severity } from "./findings.js";
import { LEDGER_CATEGORIES, type LedgerCategory } from "./ledger.js";

/** Everything the workshop needs besides the draft. Built once per campaign from content and nation state. */
export interface WorkshopEnvironment {
  readonly ctx: ShipContext;
  readonly costBalance: CostBalance;
  readonly costCtx: CostContext;
  readonly constructionBalance: ConstructionBalance;
  readonly cveBalance: CveBalance;
  /** Work micro-units per month each line can apply to this ship, from the chosen yard. */
  readonly yardCapacity: Readonly<Record<LineId, number>>;
}

export interface LedgerRow {
  readonly category: LedgerCategory;
  readonly kg: number;
  /** Share of total displacement, bp. */
  readonly shareBp: number;
}

export interface Metric {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  /** "ok" | "warn" | "bad" lets the view colour the cell without knowing thresholds. */
  readonly tone: "ok" | "warn" | "bad" | "neutral";
}

export interface WorkshopView {
  readonly valid: boolean;
  readonly naturalClass: string | null;
  readonly totalKg: number;
  readonly buoyantKg: number;
  readonly ledger: readonly LedgerRow[];
  readonly metrics: readonly Metric[];
  readonly findingsBySeverity: Readonly<Record<Severity, readonly Finding[]>>;
  readonly counts: Readonly<Record<Severity, number>>;
  readonly forecast: {
    readonly costMicro: number;
    readonly monthlyMaintenanceMicro: number;
    readonly months: number | null;
    readonly bottleneck: LineId | null;
    readonly note: string | null;
  };
  readonly cve: { readonly label: string; readonly cveBp: number };
  readonly compiled: CompiledDesign;
}

const kn = (milli: number) => (milli / 1000).toFixed(1);
const t = (kg: number) => Math.round(kg / 1000).toLocaleString("en-US");

/**
 * The view model behind every Drawing Board panel. Pure: same inputs, same output. No formulas live in the UI; this is the
 * only place a number is turned into display text.
 */
export function buildWorkshopView(draft: DesignDraft, env: WorkshopEnvironment): WorkshopView {
  const c = compileDesign(draft, env.ctx);
  const plant = env.ctx.plants.find((p) => p.id === draft.machinery.plantId);
  const counts: Record<Severity, number> = { BLOCKING: 0, CRITICAL: 0, WARNING: 0, ADVISORY: 0 };
  const grouped: Record<Severity, Finding[]> = {
    BLOCKING: [],
    CRITICAL: [],
    WARNING: [],
    ADVISORY: [],
  };
  for (const f of c.findings) {
    counts[f.severity]++;
    grouped[f.severity].push(f);
  }
  const ledger: LedgerRow[] = LEDGER_CATEGORIES.map((cat) => ({
    category: cat,
    kg: c.ledger[cat],
    shareBp: c.totalKg === 0 ? 0 : Math.floor((c.ledger[cat] * 10_000) / c.totalKg),
  }));

  const cost = computeCost(c, draft, env.costBalance, env.costCtx);
  const req = draft.requirement;
  const vmax = c.machinery?.maxSpeedMilliKnots ?? 0;
  const range = c.machinery?.rangeNmAtCruise ?? 0;
  const metrics: Metric[] = [
    {
      id: "displacement",
      label: "Displacement",
      value: `${t(c.totalKg)} t`,
      tone: c.hull.findings.some((f) => f.severity === "BLOCKING") ? "bad" : "neutral",
    },
    {
      id: "speed",
      label: "Top speed",
      value: `${kn(vmax)} kn (need ${kn(req.requiredSpeedMilliKnots)})`,
      tone: vmax >= req.requiredSpeedMilliKnots ? "ok" : "warn",
    },
    {
      id: "range",
      label: "Range",
      value: `${range.toLocaleString("en-US")} nm at ${kn(req.cruiseSpeedMilliKnots)} kn (need ${req.requiredRangeNm.toLocaleString("en-US")})`,
      tone: range >= req.requiredRangeNm ? "ok" : "warn",
    },
    {
      id: "stability",
      label: "Metacentric height",
      value: c.stability ? `${(c.stability.gmMm / 1000).toFixed(2)} m` : "n/a",
      tone: c.stability
        ? c.findings.some((f) => f.id.startsWith("STABILITY_") && f.severity !== "ADVISORY")
          ? "bad"
          : "ok"
        : "neutral",
    },
    {
      id: "trim",
      label: "Trim",
      value: c.stability ? `${(c.stability.trimBp / 100).toFixed(1)} %L` : "n/a",
      tone: c.findings.some((f) => f.id.startsWith("TRIM_")) ? "warn" : "ok",
    },
    {
      id: "stress",
      label: "Hull girder stress",
      value: c.stability ? `${(c.stability.stressBp / 100).toFixed(0)} % of limit` : "n/a",
      tone:
        c.stability && c.stability.stressBp > 10_000
          ? "bad"
          : c.stability && c.stability.stressBp > 8_000
            ? "warn"
            : "ok",
    },
    {
      id: "crew",
      label: "Crew / berths",
      value: c.systems ? `${c.systems.crewRequired} / ${c.systems.crewCapacity}` : "n/a",
      tone: c.systems && c.systems.crewRequired > c.systems.crewCapacity ? "bad" : "ok",
    },
    {
      id: "reserve",
      label: "Reserve buoyancy",
      value: `${(c.hull.reserveBuoyancyBp / 100).toFixed(0)} %`,
      tone: c.findings.some((f) => f.id === "LOW_RESERVE_BUOYANCY") ? "warn" : "ok",
    },
  ];

  let months: number | null = null;
  let bottleneck: LineId | null = null;
  let note: string | null = null;
  if (c.valid) {
    try {
      const plan = planConstruction(c, draft, cost, env.constructionBalance, true);
      const s = simulateConstruction(
        plan,
        { capacity: env.yardCapacity, monthlyFundingMicro: null, costPerWorkMicro: 1 },
        env.constructionBalance.maxMonths,
      );
      months = s.durationMonths;
      bottleneck = s.bottleneck;
    } catch (e) {
      note = e instanceof Error ? e.message : String(e);
    }
  } else {
    note = "Resolve blocking findings to get a schedule.";
  }
  const cve = computeCve(c, draft, plant?.reliabilityBp ?? 0, env.cveBalance);
  return {
    valid: c.valid,
    naturalClass: c.naturalClass,
    totalKg: c.totalKg,
    buoyantKg: c.hull.buoyantKg,
    ledger,
    metrics,
    findingsBySeverity: grouped,
    counts,
    forecast: {
      costMicro: cost.total,
      monthlyMaintenanceMicro: cost.monthlyMaintenance,
      months,
      bottleneck,
      note,
    },
    cve: { label: CVE_LABEL, cveBp: cve.cveBp },
    compiled: c,
  };
}
