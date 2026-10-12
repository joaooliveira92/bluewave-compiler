# ADR-0132: In-place design-revision limits (manual p27)

## Status

Accepted (2026-10-12).

## Context

The reference manual (DESIGNING SHIPS, printed p27) bounds how much a class may
be changed while still under construction, before the change stops being an
in-place revision and becomes a redesign or a rebuild: displacement `+10 %` or
`1000 t`, main guns above 6 inches unchangeable, secondary guns above 6 inches
limited, speed `±1 kn`, vertical armour `±1 in`, horizontal armour `±0.5 in`.

The app's revision model (`@bluewave/phase-engine` `applyReviseProject` →
`classifyRevision`) classified a change by **hull progress** and **change kind**
into the T0–T3 tiers, but enforced **no magnitude**. SB-3 `INC-14` cross-checks
the model against the manual: the limits were absent, so this is a rule change
amending DESIGN-21.

## Decision

### 1. Versioned limits

`RevisionBalance` gains `inPlace: RevisionLimits` with the six p27 magnitudes in
canonical units, authored in `balance.yaml` and validated by
`checkRevisionBalance`. They are distinct from the retained-hull rebuild limits
(DESIGN-23 §21), which stay untouched.

### 2. One validator

`inPlaceRevisionFindings(source, target, limits)` in `@bluewave/ship-design`
compares two `RevisionFacts` (displacement, designed speed, thickest vertical and
horizontal armour, largest main-gun and secondary-gun calibre) and returns
BLOCKING findings for each breached limit: `REVISION_DISPLACEMENT_EXCEEDED`,
`REVISION_SPEED_EXCEEDED`, `REVISION_VERTICAL_ARMOUR_EXCEEDED`,
`REVISION_HORIZONTAL_ARMOUR_EXCEEDED`, `REVISION_MAIN_GUN_UNCHANGEABLE`,
`REVISION_SECONDARY_GUN_LIMIT`. The displacement allowance is
`max(10 % of current, 1000 t)`; the main- and secondary-gun rules fire only when
the current calibre is above 6 inches and the calibre changes.

### 3. Enforcement at revision time

`applyReviseProject` compiles the current draft, reads both fact sets, and — when
the change was classified as an in-place revision (T0/T1) but breaches a p27
limit — rejects it with `REVISION_LIMITS_EXCEEDED`, naming the breached limits.
A change already classified T2/T3 is on the redesign/rebuild path and is not
blocked by the in-place limits.

### 4. Secondary >6 in: recorded deviation

WS1 re-read the manual (printed p27): "Main guns over 6 in cannot be changed.
Secondary guns over 6 in **can be changed to a limited extent**." The two rules
are deliberately contrasted. The shipped rule treats a secondary gun above 6 in
as **refresh-only** (blocked on any calibre change) — the same as the main-gun
rule and therefore **stricter than the manual's wording**. The manual gives no
magnitude for "a limited extent", and inventing one is prohibited
(`docs/research/manual-designing-ships-revision-limits.md`), so this conservative
reading is kept and recorded here as a deliberate deviation, not presented as the
manual's rule. A future owner who sources a bound must implement it as a versioned
`balance.yaml` constant plus an ADR, not in code. See ticket `INC-14b`.

## Consequences

- A player modifying a class before building is bounded by the manual's limits,
  not an invented set, and gets a specific reason code when they are exceeded.
- DESIGN-21's header and `docs/adr/AMENDMENTS.md` record the amendment (ADR-0095).
- The p27 limits are authored constants like the tier thresholds; tuning is a
  content edit, not a code change.

## Alternatives considered

- **Escalate a breached in-place change to T2 automatically.** Rejected for now:
  the engine's T2 applies a study cost it does not model; a clear rejection is
  the deterministic, honest outcome until redesign/rebuild are fully modelled.
- **Enforce on the draft diff instead of compiled facts.** Rejected: displacement
  and speed are derived by the compile, so the check reads compiled facts for the
  same values every other rule uses.
