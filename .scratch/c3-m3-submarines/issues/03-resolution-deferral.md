# Ticket 03 — Tactical / ASW / Friendly-Fire / Loss-Application Deferral

**Type:** decision
**Status:** resolved
**Blocked by:** 01

## Question

Several DESIGN-34 sections are battle-integration or strategic-consumer
dependent. Which are deferred, why, and what value-only pieces ship so nothing is
silently dropped?

## Decision

Deferred in full to later slices (recorded, never dropped):

- **§2 tactical allocation + §3 tactical loss application** — needs an **accepted
  battle manifest** + provenance wiring (persistent-unit one-to-one / flotilla-pool
  exact-quantity), asset reservation, `SUBMARINE_ASSET_DOUBLE_ALLOCATED` /
  `SUBMARINE_PROVENANCE_INVALID`. Requires battle/attack machinery analogous to
  C-1's torpedo tactical context; not yet present in a battle-integration slice.
- **§21 post-battle returning-ship interception** — needs "an enemy battle ended
  in the submarine's operational area" integration + a distinct keyed decision +
  battle-local attack manifest + committed post-battle returning-ship state.
- **§22 ASW resolution application** — needs enemy ASW strength, trade-protection
  regional coverage, ASW intelligence under **DESIGN-29 (intelligence-and-
  knowledge, unassigned)**, mission exposure, screening consumer.
- **§23–24 friendly-fire identification risk + outcomes** — needs DESIGN-29
  knowledge/report/confidence/identification + ASW contact generation + rules of
  engagement; the five outcome types require a typed provenance-preserving result.
- **§19 strategic attack loss application** — DESIGN-34 §19 explicitly: "MUST NOT
  apply a warship loss directly without the owning battle or attack resolver."

Value-only pieces that DO ship this sprint (pure computations, no consumer):

- §10 long-range ASW vulnerability multipliers (10_500/10_750/11_000/11_500) as an
  explicit versioned table — the *vulnerability profile*, not the ASW resolution.
- §14 sea-state detection multipliers — the *detection-risk profile*, not an
  ASW-resolution application.
- §18 heavy-ship screening balance — `screenRatioBp` formula + opportunity-
  multiplier table as a pure derived value (feeds later ASW/attack slices).
- §19 attack-opportunity **selection** via keyed stream
  `submarine/month/war/area/attack_opportunity` producing typed opportunity
  records — no loss application.
- §23 `submarine_friendly_identification_v1` base misidentification probability
  (500 bp) + the clamp formula as a value-only function — no risk/outcome
  application.

## Rationale / authority

Each deferred item has a candidate consuming mechanic that does not yet exist
(battle/attack machinery, DESIGN-29 intelligence) or an owning resolver DESIGN-34
explicitly requires. Building them now would mean inventing the missing mechanic's
shape as a side effect — prohibited scope creep (`.ai/AUTONOMOUS-AGENT.md` stop
conditions). The value-only pieces are explicit, versioned, and independently
testable, so the deferred resolution can consume them later without re-derivation.
