# Ticket 04 — Sweeping & Dual-Equipment Formula Policy

**Type:** decision
**Status:** resolved
**Blocked by:** 01-scope-boundary

## Question

§6–10 define minesweeping eligibility, base values, dual ASW/mine equipment
modes, effective sweeping value, and regional aggregation/allocation. Are any of
these BALANCE TARGETs needing research grounding (per the C-1/torpedo precedent
of an open model catalog), or are they fully exact/shipped? What is the
missing-dual-equipment-mode default policy exactly, since §8's wording could be
read two ways?

## Decision

**All §6–10 numeric values are exact DESIGN-35 shipped integers — no BALANCE
TARGET, no research grounding needed:**

- §7 base sweeping values: dedicated fleet minesweeper `150`, dedicated coastal
  minesweeper `100`, DD `80`, KE `100`, CL `60`, AMC `50`, converted TR `120` —
  literal, exact, ship as-is.
- §8 dual-purpose capability multipliers: dedicated ASW `10_000`/`0`, dedicated
  sweeping `0`/`10_000`, balanced `7_500`/`7_500`, ASW-priority `9_000`/`5_000`,
  sweeping-priority `5_000`/`9_000` — literal, exact.
- §9 mine-type resistance multipliers (contact `10_000`, magnetic `7_500`/`10_000`,
  acoustic `7_500`/`10_000`, controlled defensive `5_000`, submarine-laid `9_000`,
  scenario-special definition-required) — literal, exact; `scenario-special`
  correctly fails closed with `MINE_SWEEP_RESISTANCE_MISSING` absent a definition
  (no default fabricated).

**Dual-equipment missing-mode default (§8 literal text resolution):** "Missing
mode MUST default to the explicit shipped `balanced dual mode` only when the
installed equipment is declared dual-purpose. Other missing configurations MUST
fail with `DUAL_EQUIPMENT_MODE_MISSING`." Read literally and applied as: (1) if
equipment is declared `dual_asw_mine_equipment_v1`-typed and mode is absent →
default to balanced (`7_500`/`7_500`); (2) if equipment is single-purpose (pure
ASW or pure sweeping, not the dual contract) and mode is absent → this predicate
doesn't apply (single-purpose equipment has no "mode" to be missing); (3) if
equipment is dual-purpose-typed but declares an invalid/out-of-enum mode value →
`DUAL_EQUIPMENT_MODE_MISSING` (fail closed, never silently coerced to balanced).
This is the narrowest reading consistent with the literal sentence and the
contract's general fail-closed posture (`ENGINEERING-CONTRACT.md`).

**Content deliverable scope for `MineTypeDefinition` instances (§2):** DESIGN-35
supplies exact sweeping-resistance and severity-weight constants per type
directly in the design doc (§9, §15), unlike DESIGN-40 which left the entire
torpedo model catalog open for content authoring. This sprint therefore ships
the six canonical `MineTypeDefinition` **shapes** (fields per §2) with
DESIGN-35's own exact constants wired in as the shipped values — not a
research-grounded content catalog. Historical mine-type flavor (specific named
mine models, e.g. Vickers Elia, German UMB, US Mk 6) is a content-pack concern,
deferred to the content track alongside actual production-pack YAML (out of
scope this sprint; no YAML touched).

## Deferred (recorded)

- Named historical mine-model content entries — content track (see
  `docs/research/c2-m3-mine-warfare.md` for why no grounding research was run
  this sprint).

## Rationale / authority

DESIGN-35's constant tables are exhaustive and exact (§31 validation item 5
literally requires "shipped base sweeping values are exactly 150, 100, 80, 100,
60, 50, and 120" — the design doc itself treats these as non-negotiable, not
tunable). Treating them as BALANCE TARGET would contradict the design doc's own
`MUST`/exact-value language. The narrow dual-equipment-mode reading avoids the
alternative (defaulting single-purpose equipment silently into a dual mode),
which would be an unauthorized behavior invention.
