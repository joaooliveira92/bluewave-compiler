# Decision Request: Victory-Level Classification Predicate for Battle War-Score Effects

## Status

**RESOLVED 2026-08-12 — Option A (owner-delegated autonomy).** Implemented as
ADR-0010: classify by the losing side's damaged-hitpoint fraction of its committed
HP (`>= 0.50` decisive, `>= 0.25` major, else minor) → `+10`/`+5`/`+2` (+/-) to
war score, via versioned `WAR_SCORE_*`/`VICTORY_*` ruleset constants in
`packages/campaign/src/warConstants.ts`. `BattleResolver` unchanged (criterion 15);
predicate derives from exposed `BattleResult.damageReport` + `loserId` + the
battle's committed loser fleets. Shipped in B10c (`packages/phase-engine/src/month.ts`
battle-resolved victory block). Acceptance evidence: `.ai/reports/a3-b10c-diplomacy-war.md`.

## Trigger

Sprint A-3 (B10c Diplomacy & War), `.ai/briefs/b10c-diplomacy-war.md`, requires
war-score updates from battle outcomes. The brief states:

> A `warScore` integer per side (`-100..100`, DESIGN-31 §8). Updated by battle
> outcomes using the shipped DESIGN-31 §10 values: minor victory `+2`, major
> victory `+5`, decisive victory `+10`, and the corresponding negatives for
> defeat.

The difficulty: no authoritative source defines **how a battle result maps to
one of the three victory levels** (minor/major/decisive). The values are given;
the classification predicate is not. This is a materially constraining
ambiguity because the chosen predicate changes the authoritative war score,
which in turn drives peace eligibility and surrender.

## Evidence

- `.ai/briefs/b10c-diplomacy-war.md` (War score, Peace eligibility, Surrender;
  acceptance criteria 3, 6, 14).
- `docs/rules/war-and-peace.md` DESIGN-31 §8 (score scale), §9 (typed
  `WarScoreEffect` sources), §10 (ship values `+2`/`+5`/`+10` and negatives).
  No predicate/classification rule is present; §10 lists values only.
- `docs/rules/tactical-combat.md` references "battle-result classification"
  (lines 180, 657) but never defines the classification predicate.
- `docs/rules/battle-generation.md` "result policy" is referenced (line 62) but
  not specified for victory levels.
- `SOURCE-DESIGN-v1.0.md` (untouched source): only "More than marginal victory
  normally succeeds" (line 2542); no minor/major/decisive predicate.
- `packages/combat/src/resolver.ts` `BattleResolver.resolve` returns
  `BattleResult` = `{ winnerId, loserId, attackerLosses, defenderLosses,
damageReport, explanation }`. It computes an internal `damageRatio` but does
  not expose it or any victory level. B10c criterion 15 requires the resolver
  to remain **unchanged**, so the classification must be derived from the
  exposed result fields.
- Repo-wide `rg` for victory/classification thresholds: no authoritative rule.

## Why agent judgment is insufficient

A default classification derived from the exposed `BattleResult` fields is
defensible under several different rules that produce different war-score
outcomes:

- by fraction of the losing side's ships **destroyed** vs. **damaged**;
- by the **damage ratio** (effective strength ratio) already computed inside
  the resolver (not exposed); or
- by absolute loss counts / ship count thresholds.

Each mapping changes the war score, which changes peace eligibility and
surrender timing. This is not a routine local naming or formatting choice; it
is a normative gameplay rule. The engineering contract and the autonomous-agent
operating prompt both prohibit silently inventing canonical content that
changes authoritative outcomes.

## Options

### Option A: Outer-boundary damage-ratio predicate (recommended if any)

- Behavior: derive the victory level from the share of the losing side's total
  starting hit points that appear in `damageReport` versus the losses. E.g.
  small ratio → minor, moderate → major, near-total → decisive, with explicit
  thresholds.
- Advantages: deterministic, uses only exposed `BattleResult` fields, no
  resolver change.
- Risks: the threshold values are still a judgment call; must be recorded as
  versioned ruleset constants / an ADR.
- Compatibility impact: new war-score behavior; no prior war-score existed, so
  no migration.
- Migration impact: none (new capability).
- Scope and effort: small; needed to unblock B10c.

### Option B: Author the predicate in the canonical design first

- Behavior: a human/owner amends DESIGN-31 or the B10c brief to define an
  explicit minor/major/decisive predicate (and thresholds) before implementation.
- Advantages: canonical — no invented rule.
- Risks: requires owner input; blocks B10c.
- Compatibility impact: authoritative rule fixed before coding.
- Migration impact: none.
- Scope and effort: owner decision + doc edit.

### Option C: Single-value war score for B10c MVP (defer levels)

- Behavior: treat every battle victory as a single fixed value (e.g. `+5`) and
  all levels as deferred, keeping the score monotonic and deterministic.
- Advantages: no classification predicate needed; simplest.
- Risks: deviates from the brief's explicit `+2/+5/+10` shipped values; would
  weaken an acceptance criterion.
- Compatibility impact: narrower than the brief.
- Migration impact: none.
- Scope and effort: minimal, but contradicts the accepted brief.

## Recommendation

Option B is cleanest against the contract (no invented canonical rule), but it
requires owner input. If the owner delegates the predicate to the agent, Option
A is the fastest grounded path: a deterministic, documented, versioned
classification derived from the exposed `BattleResult` fields, recorded via an
ADR and exposure of the internal `damageRatio` (or a pure re-derivation). Do
not implement the disputed behavior before approval.

## Work safely completed while blocked

(Sprint A-3 is at its investigation stage; no B10c code has been written. Prior
session sprints A-0/A-0b/A-1/A-2 are independently complete and committed:

- B10b acceptance PASS (`.ai/reports/a0-b10b-acceptance.md`)
- B9 acceptance PASS_WITH_LIMITATIONS (`.ai/reports/a1-b9-acceptance.md`)
- B10a acceptance PASS (`.ai/reports/a2-b10a-acceptance.md`)
- Commits `334ad70`, `15453f2`, `47b8b44`, `451c906`, `80d57bc`)

The SPRINT-PLAN "Immediate next action" already points at A-3 so the next run
resumes at this decision request.)
