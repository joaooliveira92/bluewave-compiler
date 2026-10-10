/**
 * National content completeness (ADR-0092): one deterministic validator that proves every release nation is
 * playable end-to-end from its *content* alone — resolvable date-banded profile, complete hard/soft sections,
 * valid component references and access coverage, six legal classified opening designs (B, CA, CL, DD, KE, AMC),
 * a viable procurement path per role group, dock/industrial fit, affordability under the standard opening budget and
 * no release placeholders. It never mutates state and never throws on content errors.
 */
import { compileDesign } from "./compile.js";
import { lintNavalArms } from "./componentVariants.js";
import { resolveNavalProfile, type NationNavalProfile } from "./nationProfile.js";
import { PROCUREMENT_TYPES, roleGroupOf, type RoleGroup } from "./fleetProcurement.js";
import type { ShipBuildingContent } from "./shipBuildingContent.js";
import { starterFor, type StarterDesign } from "./shipTypeRoster.js";
import { computeCost, treasuryCostUnits } from "./cost.js";

/** The historical classification of a starter/reference design (exactly one per design). */
export const REFERENCE_DESIGN_CLASSES = [
  "HISTORICAL_RECONSTRUCTION",
  "HISTORICALLY_INSPIRED",
  "DOCTRINE_TEMPLATE",
  "BALANCE_TEMPLATE",
] as const;
export type ReferenceDesignClass = (typeof REFERENCE_DESIGN_CLASSES)[number];

export interface CompletenessIssue {
  readonly nationId: string;
  readonly code: string;
  readonly message: string;
}

export interface NationCompletenessOptions {
  readonly profiles: readonly NationNavalProfile[];
  readonly starters: readonly StarterDesign[];
  readonly content: ShipBuildingContent;
  readonly openingMonth: string;
  /** A standard opening procurement budget in treasury units (a starter must fit within it). */
  readonly standardBudgetUnits: number;
  readonly knownComponentIds: ReadonlySet<string>;
  /** Explicit historical classification per starter id (one of REFERENCE_DESIGN_CLASSES). */
  readonly classifications: Readonly<Record<string, ReferenceDesignClass>>;
  readonly release: boolean;
}

const err = (nationId: string, code: string, message: string): CompletenessIssue => ({
  nationId,
  code,
  message,
});

const monthIndex = (m: string): number => Number(m.slice(0, 4)) * 12 + (Number(m.slice(5, 7)) - 1);

/** Validate one nation's content completeness. Deterministic; never throws. */
export function validateNationCompleteness(
  opts: NationCompletenessOptions,
  nationId: string,
): CompletenessIssue[] {
  const out: CompletenessIssue[] = [];
  const own = opts.profiles.filter((p) => p.nationId === nationId);
  if (own.length === 0) return [err(nationId, "NATION_NO_PROFILE", "no naval profile authored")];

  // Date bands must not overlap and must be internally ordered.
  const sorted = [...own].sort((a, b) => monthIndex(a.activeFrom) - monthIndex(b.activeFrom));
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    if (p.activeUntil !== null && monthIndex(p.activeUntil) < monthIndex(p.activeFrom))
      out.push(err(nationId, "NATION_BAND_ORDER", `${p.activeFrom}..${p.activeUntil} is inverted`));
    const next = sorted[i + 1];
    if (
      next !== undefined &&
      p.activeUntil !== null &&
      monthIndex(p.activeUntil) >= monthIndex(next.activeFrom)
    )
      out.push(
        err(
          nationId,
          "NATION_BAND_OVERLAP",
          `${p.activeFrom}..${p.activeUntil} overlaps ${next.activeFrom}`,
        ),
      );
  }

  // A resolvable opening profile.
  const opening = resolveNavalProfile(opts.profiles, nationId, opts.openingMonth);
  if (opening === null)
    return [...out, err(nationId, "NATION_NO_OPENING_PROFILE", "no profile at opening month")];

  // Complete hard-capability and doctrine sections.
  if (opening.hardCapabilities.hullForms.length === 0)
    out.push(err(nationId, "NATION_HARD_INCOMPLETE", "no hull forms allowed"));
  if (opening.hardCapabilities.domesticPlants.length === 0)
    out.push(err(nationId, "NATION_HARD_INCOMPLETE", "no domestic plants"));
  if (opening.doctrineProfile.postures.length === 0)
    out.push(err(nationId, "NATION_DOCTRINE_INCOMPLETE", "no strategic postures"));

  // Valid component references: every variant family exists (its access status defaults to DOMESTIC when unspecified).
  for (const v of [...opening.gunModels, ...opening.componentVariants]) {
    if (!opts.knownComponentIds.has(v.familyId))
      out.push(
        err(
          nationId,
          "NATION_UNKNOWN_COMPONENT",
          `${v.id} overlays unknown family '${v.familyId}'`,
        ),
      );
    if (
      v.introductionMonth !== undefined &&
      v.obsoleteMonth != null &&
      monthIndex(v.obsoleteMonth) < monthIndex(v.introductionMonth)
    )
      out.push(err(nationId, "NATION_VARIANT_DATE", `${v.id} retires before it is introduced`));
  }
  for (const key of Object.keys(opening.componentAccess))
    if (!opts.knownComponentIds.has(key))
      out.push(
        err(nationId, "NATION_UNKNOWN_COMPONENT", `componentAccess names unknown family '${key}'`),
      );

  // No release placeholders + arms lint.
  for (const issue of lintNavalArms(opening, opts.release))
    out.push(err(nationId, issue.code, issue.message));
  if (opts.release && opening.provenance.sourceStatus === "PLACEHOLDER")
    out.push(err(nationId, "NATION_PLACEHOLDER", "profile provenance is a PLACEHOLDER at release"));

  // Six legal, classified opening designs + a viable procurement path per role group + affordability.
  const env = opts.content.environmentFor(opts.openingMonth, nationId);
  const coveredGroups = new Set<RoleGroup>();
  for (const type of PROCUREMENT_TYPES) {
    const starter = starterFor(type, opts.starters, opts.openingMonth, nationId);
    if (starter === null) {
      out.push(err(nationId, "NATION_STARTER_MISSING", `no opening ${type} starter`));
      continue;
    }
    const classification = opts.classifications[starter.id];
    if (classification === undefined || !REFERENCE_DESIGN_CLASSES.includes(classification))
      out.push(
        err(nationId, "NATION_STARTER_UNCLASSIFIED", `${starter.id} has no valid classification`),
      );
    const compiled = compileDesign(starter.draft, env.ctx);
    const blocking = compiled.findings.filter((f) => f.severity === "BLOCKING");
    if (!compiled.valid || blocking.length > 0)
      out.push(
        err(
          nationId,
          "NATION_STARTER_ILLEGAL",
          `${starter.id}: ${blocking.map((f) => f.id).join(", ")}`,
        ),
      );
    if (compiled.naturalClass !== type)
      out.push(
        err(
          nationId,
          "NATION_STARTER_CLASS",
          `${starter.id} classifies as ${compiled.naturalClass}, not ${type}`,
        ),
      );
    if (compiled.findings.some((f) => f.id === "NO_FACILITY_FITS"))
      out.push(err(nationId, "NATION_STARTER_NO_DOCK", `${starter.id} fits no dock`));
    const cost = treasuryCostUnits(
      computeCost(compiled, starter.draft, env.costBalance, env.costCtx).total,
      opts.content.treasuryUnitMicro,
    );
    if (cost > opts.standardBudgetUnits)
      out.push(
        err(
          nationId,
          "NATION_STARTER_UNAFFORDABLE",
          `${starter.id} costs ${String(cost)} > ${String(opts.standardBudgetUnits)}`,
        ),
      );
    coveredGroups.add(roleGroupOf(type));
  }
  for (const group of ["capital", "cruiser", "light", "colonial"] as const)
    if (!coveredGroups.has(group))
      out.push(err(nationId, "NATION_ROLE_UNCOVERED", `no viable procurement path for ${group}`));

  // Deterministic runtime resolution.
  const again = resolveNavalProfile(opts.profiles, nationId, opts.openingMonth);
  if (again === null || again.activeFrom !== opening.activeFrom)
    out.push(
      err(nationId, "NATION_RESOLUTION_NONDETERMINISTIC", "profile resolution is not stable"),
    );

  return out;
}

/** Validate every nation that has an authored profile. */
export function validateAllNations(opts: NationCompletenessOptions): CompletenessIssue[] {
  const nations = [...new Set(opts.profiles.map((p) => p.nationId))].sort();
  return nations.flatMap((nationId) => validateNationCompleteness(opts, nationId));
}
