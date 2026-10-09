import type { DraftEdit } from "./edits.js";
import type { ComponentCategory } from "./component.js";

export type ChangeKind = "FITTINGS" | "MAIN_ARMAMENT" | "ARMOUR" | "MACHINERY" | "STRUCTURE";
export type RevisionTier = "T0_FREE" | "T1_REVISION" | "T2_REDESIGN" | "T3_RECONSTRUCTION";

export interface RevisionBalance {
  /** Hull progress thresholds, bp of total hull work. */
  readonly freeBelowBp: number;
  readonly revisionBelowBp: number;
  readonly redesignBelowBp: number;
  /** T1: rework work = bp of work already done on the affected packages. */
  readonly reworkBp: number;
  readonly t1DelayMonths: number;
  /** T2: study cost multiplier, hull progress kept, delay. */
  readonly redesignStudyCostBp: number;
  readonly redesignKeptBp: number;
  readonly t2DelayMonths: number;
}

/**
 * Structural checks on a revision balance, so a bad content value fails loudly when the content is built instead of
 * producing odd tiers in play. Besides ranges it enforces the order of harshness the rules rely on: a redesign never costs
 * less than a revision (in lost work or in delay), and thresholds ascend. Returns problems; empty means valid.
 */
export function checkRevisionBalance(b: RevisionBalance): string[] {
  const problems: string[] = [];
  const bp = (name: string, v: number) => {
    if (!Number.isSafeInteger(v) || v < 0 || v > 10_000)
      problems.push(`${name} must be an integer in 0..10000 bp, got ${String(v)}`);
  };
  const months = (name: string, v: number, min: number) => {
    if (!Number.isSafeInteger(v) || v < min)
      problems.push(
        `${name} must be an integer of at least ${String(min)} months, got ${String(v)}`,
      );
  };
  bp("freeBelowBp", b.freeBelowBp);
  bp("revisionBelowBp", b.revisionBelowBp);
  bp("redesignBelowBp", b.redesignBelowBp);
  bp("reworkBp", b.reworkBp);
  bp("redesignKeptBp", b.redesignKeptBp);
  if (!Number.isSafeInteger(b.redesignStudyCostBp) || b.redesignStudyCostBp < 0)
    problems.push(
      `redesignStudyCostBp must be a non-negative integer, got ${String(b.redesignStudyCostBp)}`,
    );
  months("t1DelayMonths", b.t1DelayMonths, 1); // spec 15.4: a revision delays at least a month
  months("t2DelayMonths", b.t2DelayMonths, 1);
  if (!(b.freeBelowBp < b.revisionBelowBp && b.revisionBelowBp < b.redesignBelowBp))
    problems.push("thresholds must ascend: freeBelowBp < revisionBelowBp < redesignBelowBp");
  if (b.t2DelayMonths < b.t1DelayMonths)
    problems.push(
      "a redesign must not delay less than a revision (t2DelayMonths >= t1DelayMonths)",
    );
  if (b.reworkBp > 10_000 - b.redesignKeptBp)
    problems.push(
      "a redesign must not lose less work than a revision adds (reworkBp <= 10000 - redesignKeptBp)",
    );
  return problems;
}

export interface BuildProgress {
  readonly hullDoneWork: number;
  readonly hullTotalWork: number;
  readonly armourStarted: boolean;
  readonly machineryStarted: boolean;
  readonly launched: boolean;
  /** Work already done on packages affected by a fittings change (for T1 rework). */
  readonly affectedDoneWork: number;
}

export interface RevisionDecision {
  readonly tier: RevisionTier;
  readonly progressBp: number;
  readonly reworkWorkMicro: number;
  readonly delayMonths: number;
  readonly studyCostMultiplierBp: number;
  /** Hull work retained after the change (T2 reduces; T3 is handled by a rebuild project). */
  readonly hullDoneWorkAfter: number;
  /** True when the change must become a REBUILD/CONVERSION/cancel decision (DESIGN-23 §20-23). */
  readonly requiresRebuildProject: boolean;
  readonly reasonCodes: readonly string[];
}

export const STRUCTURE_KEYS: ReadonlySet<string> = new Set([
  "hullFormId",
  "lengthWl",
  "beam",
  "draught",
  "depthToMainDeck",
  "blockCoeffBp",
  "materialId",
  "structuralSchemeId",
  "subdivisionGrade",
]);

/** Maps a draft edit to the kind of change it is. `categoryOf` resolves a placement's component category. */
export function changeKindOf(
  e: DraftEdit,
  categoryOf: (instanceId: string) => ComponentCategory | undefined,
): ChangeKind {
  switch (e.kind) {
    case "set_hull":
      return Object.keys(e.patch).some((k) => STRUCTURE_KEYS.has(k)) ? "STRUCTURE" : "FITTINGS";
    case "set_machinery":
      return Object.keys(e.patch).some((k) => k === "plantId" || k === "installedKw")
        ? "MACHINERY"
        : "FITTINGS";
    case "set_armour_region":
    case "remove_armour_region":
      return "ARMOUR";
    case "add_placement":
      return "FITTINGS";
    case "remove_placement":
    case "move_placement":
    case "set_param":
      return categoryOf(e.instanceId) === "MAIN_GUN" ? "MAIN_ARMAMENT" : "FITTINGS";
  }
}

const TIER_RANK: Record<RevisionTier, number> = {
  T0_FREE: 0,
  T1_REVISION: 1,
  T2_REDESIGN: 2,
  T3_RECONSTRUCTION: 3,
};
const maxTier = (a: RevisionTier, b: RevisionTier): RevisionTier =>
  TIER_RANK[a] >= TIER_RANK[b] ? a : b;

/** Spec §15.4: when changes stay cheap and when they become redesign or reconstruction. Pure. */
export function classifyRevision(
  kinds: readonly ChangeKind[],
  p: BuildProgress,
  b: RevisionBalance,
): RevisionDecision {
  const progressBp =
    p.hullTotalWork <= 0
      ? 10_000
      : Math.min(10_000, Math.floor((p.hullDoneWork * 10_000) / p.hullTotalWork));
  const reasons: string[] = [];
  let tier: RevisionTier =
    progressBp < b.freeBelowBp
      ? "T0_FREE"
      : progressBp < b.revisionBelowBp
        ? "T1_REVISION"
        : progressBp < b.redesignBelowBp
          ? "T2_REDESIGN"
          : "T3_RECONSTRUCTION";
  if (tier !== "T0_FREE") reasons.push(`REVISION_PROGRESS_${tier}`);

  const hard = kinds.some(
    (k) => k === "STRUCTURE" || k === "MACHINERY" || k === "MAIN_ARMAMENT" || k === "ARMOUR",
  );
  if (hard && tier === "T1_REVISION") {
    tier = "T2_REDESIGN";
    reasons.push("REVISION_ESCALATED_STRUCTURAL");
  }
  if (
    tier === "T0_FREE" &&
    ((p.armourStarted && kinds.includes("ARMOUR")) ||
      (p.machineryStarted && kinds.includes("MACHINERY")))
  ) {
    tier = "T1_REVISION";
    reasons.push("REVISION_COMPONENT_ORDERED");
  }
  if (kinds.includes("STRUCTURE") && progressBp >= b.freeBelowBp) {
    tier = maxTier(tier, "T2_REDESIGN");
    reasons.push("REVISION_HULL_GEOMETRY");
  }
  if (p.launched) {
    tier = "T3_RECONSTRUCTION";
    reasons.push("REVISION_AFTER_LAUNCH");
  }

  switch (tier) {
    case "T0_FREE":
      return {
        tier,
        progressBp,
        reworkWorkMicro: 0,
        delayMonths: 0,
        studyCostMultiplierBp: 0,
        hullDoneWorkAfter: p.hullDoneWork,
        requiresRebuildProject: false,
        reasonCodes: reasons,
      };
    case "T1_REVISION":
      return {
        tier,
        progressBp,
        reworkWorkMicro: Math.floor((p.affectedDoneWork * b.reworkBp) / 10_000),
        delayMonths: b.t1DelayMonths,
        studyCostMultiplierBp: 0,
        hullDoneWorkAfter: p.hullDoneWork,
        requiresRebuildProject: false,
        reasonCodes: reasons,
      };
    case "T2_REDESIGN":
      return {
        tier,
        progressBp,
        reworkWorkMicro: 0,
        delayMonths: b.t2DelayMonths,
        studyCostMultiplierBp: b.redesignStudyCostBp,
        hullDoneWorkAfter: Math.floor((p.hullDoneWork * b.redesignKeptBp) / 10_000),
        requiresRebuildProject: false,
        reasonCodes: reasons,
      };
    case "T3_RECONSTRUCTION":
      return {
        tier,
        progressBp,
        reworkWorkMicro: 0,
        delayMonths: 0,
        studyCostMultiplierBp: 0,
        hullDoneWorkAfter: p.hullDoneWork,
        requiresRebuildProject: true,
        reasonCodes: reasons,
      };
  }
}
