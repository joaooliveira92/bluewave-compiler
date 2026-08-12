// content/budgets.ts - Budgets Phase - IMMUTABLE - January 1880
// Derived from: economy + industry + government.budgetPriority + resources
// No DB rows - qualitative structural layout (abstract 1-100, not currency)
// UK = 100 benchmark. All shares are % of totalBudget.
// Zod 4 compatible

import { z } from "zod";
import type { PlayableNationId } from "./nations/shared.ts";

// ── Schemas ─────────────────────────────────────────────────────────

export const BudgetPrioritySchema = z.enum([
  "navy_first",
  "army_first",
  "balanced",
  "colonial_first",
  "fragmented",
]);

export const FiscalStabilitySchema = z.enum([
  "excellent",
  "strong",
  "moderate",
  "strained",
  "fragile",
  "crisis",
]);

export const BudgetSourceSchema = z.enum([
  "taxation",
  "colonial_revenue",
  "iron_exports",
  "customs",
  "grain",
  "foreign_loans",
  // non-playable / future - kept for extensibility
  "coffee_rubber",
  "nitrates",
]);

export const NationalBudgetProfileSchema = z
  .object({
    nation: z.string(),
    priority: BudgetPrioritySchema,
    fiscalStability: FiscalStabilitySchema,
    totalBudget: z
      .number()
      .int()
      .min(1)
      .max(100)
      .describe("Abstract 1-100 relative. UK=100 benchmark"),
    navalShare: z.number().int().min(0).max(100).describe("% of totalBudget"),
    armyShare: z.number().int().min(0).max(100),
    colonialShare: z.number().int().min(0).max(100),
    debtBurden: z.number().int().min(0).max(100).describe("0=no debt, 100=crippling"),
    sources: z.array(BudgetSourceSchema).min(1).max(4),
    constraints: z.array(z.string().min(10).max(120)).min(1).max(5),
    strategicNote: z.string().min(20).max(300),
  })
  .strict()
  .superRefine((b, ctx) => {
    const sum = b.navalShare + b.armyShare + b.colonialShare;
    if (sum > 100) {
      ctx.addIssue({
        code: "custom",
        message: `[${b.nation}] shares sum to ${sum}% > 100% (naval:${b.navalShare}+army:${b.armyShare}+colonial:${b.colonialShare})`,
        path: ["navalShare"],
      });
    }
    // Reserve 100 for UK benchmark only
    if (b.totalBudget === 100 && b.nation !== "uk") {
      ctx.addIssue({
        code: "custom",
        message: `Only UK can be 100 benchmark, got ${b.nation}=100`,
        path: ["totalBudget"],
      });
    }
  });

export type BudgetPriority = z.infer<typeof BudgetPrioritySchema>;
export type FiscalStability = z.infer<typeof FiscalStabilitySchema>;
export type BudgetSource = z.infer<typeof BudgetSourceSchema>;
export type NationalBudgetProfile = z.infer<typeof NationalBudgetProfileSchema>;

// ── Data ────────────────────────────────────────────────────────────
// Canon numbers unchanged - only hardened with satisfies + validation

export const BUDGETS = {
  uk: {
    nation: "uk",
    priority: "navy_first",
    fiscalStability: "strong",
    totalBudget: 100,
    navalShare: 35,
    armyShare: 25,
    colonialShare: 15,
    debtBurden: 20,
    sources: ["taxation", "colonial_revenue", "customs"],
    constraints: [
      "Global overstretch - must fund every theater",
      "Two-power standard pressure",
      "Merchant marine protection cost",
    ],
    strategicNote:
      "Mature hegemon - rich but expensive global requirements. Naval scares trigger emergency construction.",
  },
  germany: {
    nation: "germany",
    priority: "army_first",
    fiscalStability: "strong",
    totalBudget: 70,
    navalShare: 15,
    armyShare: 55,
    colonialShare: 5,
    debtBurden: 10,
    sources: ["taxation", "iron_exports"],
    constraints: [
      "Every mark on navy competes with army",
      "Reichstag budget battles",
      "Bismarckian restraint until 1890",
    ],
    strategicNote:
      "Technical challenger - concentrated battlefleet is affordable, global fleet is not.",
  },
  usa: {
    nation: "usa",
    priority: "fragmented",
    fiscalStability: "strong",
    totalBudget: 80,
    navalShare: 12,
    armyShare: 20,
    colonialShare: 0,
    debtBurden: 5,
    sources: ["taxation", "customs"],
    constraints: [
      "Congress underfunds in peace, mobilizes after crisis",
      "Two-ocean split",
      "No Panama - duplication cost",
    ],
    strategicNote:
      "Latent giant - can mobilize dramatically after crisis, but fragmented peacetime funding.",
  },
  japan: {
    nation: "japan",
    priority: "balanced",
    fiscalStability: "strained",
    totalBudget: 25,
    navalShare: 30,
    armyShare: 35,
    colonialShare: 0,
    debtBurden: 40,
    sources: ["taxation", "foreign_loans"],
    constraints: [
      "Industrial immaturity",
      "Foreign dependence - must import steel/armor/guns",
      "Heavy borrowing for prestige ships",
    ],
    strategicNote:
      "Urgent modernizer - ambitious programs financed by heavy borrowing, vulnerable until domestic mills established.",
  },
  france: {
    nation: "france",
    priority: "fragmented",
    fiscalStability: "moderate",
    totalBudget: 65,
    navalShare: 25,
    armyShare: 40,
    colonialShare: 15,
    debtBurden: 25,
    sources: ["taxation", "colonial_revenue"],
    constraints: [
      "Doctrinal fragmentation - competing naval concepts",
      "Coal deficit - must import British coal",
      "Cabinet instability",
    ],
    strategicNote:
      "Experimental - brilliant but unstable, many plausible theaters require coherence.",
  },
  italy: {
    nation: "italy",
    priority: "balanced",
    fiscalStability: "strained",
    totalBudget: 30,
    navalShare: 28,
    armyShare: 30,
    colonialShare: 10,
    debtBurden: 35,
    sources: ["taxation", "foreign_loans"],
    constraints: [
      "Budget limitations - bold ships strain state",
      "Near-total import reliance for coal/steel",
      "North-concentrated industry",
    ],
    strategicNote:
      "Prestige gambler - every major ship must prove great-power status, but fiscal limits bite.",
  },
  russia: {
    nation: "russia",
    priority: "army_first",
    fiscalStability: "strained",
    totalBudget: 60,
    navalShare: 18,
    armyShare: 50,
    colonialShare: 5,
    debtBurden: 30,
    sources: ["taxation", "grain", "foreign_loans"],
    constraints: [
      "Geographic fragmentation - Baltic/Black Sea/Pacific separate fleets",
      "Internal transport friction",
      "Slow rail integration",
    ],
    strategicNote:
      "Fragmented giant - vast reserves but poor integration, Baltic yards cut off from southern coal.",
  },
  austria_hungary: {
    nation: "austria_hungary",
    priority: "army_first",
    fiscalStability: "moderate",
    totalBudget: 35,
    navalShare: 15,
    armyShare: 45,
    colonialShare: 0,
    debtBurden: 20,
    sources: ["taxation"],
    constraints: [
      "Dual Monarchy budget bargaining - Austrian/Hungarian interests",
      "Political vulnerability",
      "Otranto confinement",
    ],
    strategicNote: "Efficient regional - can be meaningful in Adriatic without global cost.",
  },
  spain: {
    nation: "spain",
    priority: "colonial_first",
    fiscalStability: "fragile",
    totalBudget: 20,
    navalShare: 22,
    armyShare: 25,
    colonialShare: 20,
    debtBurden: 45,
    sources: ["taxation", "iron_exports", "colonial_revenue"],
    constraints: [
      "Industrial weakness",
      "Imperial overstretch - Cuba/Philippines/Guam",
      "Reliant on British coal/foreign yards",
    ],
    strategicNote:
      "Declining maintainer - scattered empire exposes weakness more than multiplies power.",
  },
  qing: {
    nation: "qing",
    priority: "fragmented",
    fiscalStability: "fragile",
    totalBudget: 40,
    navalShare: 15,
    armyShare: 30,
    colonialShare: 0,
    debtBurden: 35,
    sources: ["taxation", "customs"],
    constraints: [
      "Administrative fragmentation - regional viceroys",
      "Fiscal diversion - Cixi",
      "Regional fleets cannot share resources",
      "Complete reliance on foreign yards for capital ships",
    ],
    strategicNote:
      "Fragmented modernizer - Beiyang dominant, but cannot convert scale into unified navy.",
  },
} as const satisfies Record<PlayableNationId, NationalBudgetProfile>;

// ── Build-time lock ─────────────────────────────────────────────────
// Throws on import if canon drifts - makes IMMUTABLE real
for (const profile of Object.values(BUDGETS)) {
  NationalBudgetProfileSchema.parse(profile);
}

// ── Helpers ─────────────────────────────────────────────────────────

export const getBudget = (nation: PlayableNationId): NationalBudgetProfile => {
  const b = BUDGETS[nation];
  if (!b) throw new Error(`Unknown nation: ${nation}`);
  return b;
};

export const getNavalBudget = (nation: PlayableNationId): number =>
  Math.round((BUDGETS[nation].totalBudget * BUDGETS[nation].navalShare) / 100);

export const getMonthlyNavalFunds = (nation: PlayableNationId): number =>
  Math.round(getNavalBudget(nation) / 12);

export const getArmyBudget = (nation: PlayableNationId): number =>
  Math.round((BUDGETS[nation].totalBudget * BUDGETS[nation].armyShare) / 100);

export const getEffectiveNavalFunds = (nation: PlayableNationId): number => {
  // Debt burden reduces effective funds - fragile states can't spend full share
  const b = BUDGETS[nation];
  const debtPenalty = b.debtBurden > 35 ? Math.round((b.debtBurden - 35) / 10) : 0;
  return Math.max(0, getMonthlyNavalFunds(nation) - debtPenalty);
};

export const isFiscallyConstrained = (nation: PlayableNationId): boolean => {
  const s = BUDGETS[nation].fiscalStability as FiscalStability;
  return s === "strained" || s === "fragile" || s === "crisis";
};

export const canAfford = (nation: PlayableNationId, monthlyCost: number): boolean =>
  monthlyCost <= getMonthlyNavalFunds(nation);

// ── Guardrails for monthlyProcessor ─────────────────────────────────

export const BUDGET_GUARDRAILS = {
  insufficientFunds:
    "Monthly construction cost > monthly naval funds → must halt/accelerate/delay or prestige consequence",
  debt: "Heavy borrowing (Japan/Italy/Qing/Spain debtBurden >=35) increases future debtBurden and reduces effective funds",
  armyCompetition:
    "Germany/Russia/Austria - naval share competes directly with army. Raising navalShare requires lowering armyShare",
  fragmented:
    "USA/France/Qing fragmented priority - naval funds unreliable, crisis mobilization can double funds temporarily",
} as const;
