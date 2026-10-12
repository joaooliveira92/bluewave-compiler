# INC-6 — Dock expansion + private expansion

**State:** RESOLVED (engine slice; UI action split to INC-6b) · **Frontier:** yes · **Blocked by:** INC-5
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R16, R17) · **ADR:** none new (DESIGN-13 §5–6 shipped)

## What to build

Let a nation expand its docks — one year, a fixed era step — and let private shipbuilding occasionally
raise the dock on its own, so late-era hulls become buildable. This is the manual's "docks take one
year to build, +1000–2000 t per step" and "dock size may occasionally increase by itself".

## Acceptance criteria

- [ ] `dock_expansion_v1`: `baseDurationMonths` is exactly `12`; a completed step raises every covered
      dock mass limit by the era's exact step (EARLY `1_000_000` kg = 1000 t); the applicable era is
      locked at authorization (later calendar advancement does not change the stored step).
- [ ] A step completes only when **both** elapsed active project months reach the duration **and** paid
      work reaches total work; elapsed time alone never completes it. A halted month contributes zero.
- [ ] `private_dock_expansion_opportunity_v1`: minimum `7_500` bp trailing-12-month dock utilisation,
      `60`-month cooldown, at most one active event per nation, stream
      `event/month/nation/private_dock_expansion`, nations and possessions processed in ascending id
      order; a successful event creates a **normal** expansion project, never an instant increase, and a
      possession without explicit eligibility receives no inferred development.
- [ ] The Construction screen offers a dock-expansion action (12 months, next era step).
- [ ] Tests: unit (step by era; both completion conditions; eligibility/cooldown/one-active); boundary
      (the `9..18` month permitted range; exactly `12` shipped); determinism (era step and event stream
      keyed; same seed → same event).

## Notes for implementator

Expansion is a normal dockyard project of type `INFRASTRUCTURE`; the private event is a phase-engine
event on the §6 stream that creates that project. Do not let the event change dock size directly.

## Answer (engine slice, 2026-10-12)

Landed `@bluewave/ship-design/src/dockExpansion.ts` (the versioned `dock_expansion_v1` policy: exactly
12 months, the era-step schedule with EARLY 1_000_000 kg, the 6..24 clamp, the both-conditions
completion rule, the dock-limit raise) and `@bluewave/phase-engine/src/dockExpansion.ts` (the
INFRASTRUCTURE project shape, authorization with the era step locked at authorization month, the
per-month `elapsedActiveMonths` counter that only ACTIVE/ACCELERATED months advance, and the seeded
`private_dock_expansion_opportunity_v1` resolver: ≥7_500 bp trailing-12-month utilisation, 60-month
cooldown, one active per nation, ascending nation/possession order, stream
`event/month/nation/private_dock_expansion`, creating a normal project — never an instant increase).
New optional state: `ConstructionProject.{elapsedActiveMonths,dockExpansionDurationMonths,dockExpansionStepKg}`
and `NationState.dockExpansion`. `check:golden` and cross-process determinism unchanged (the private
event draws only for explicitly eligible nations; the reference run has no dock content).

**Flagged for WS6 reconciliation:** `DOCK_EXPANSION_BASE_TOTAL_WORK_UNITS` (1_200) and
`PRIVATE_DOCK_EXPANSION_EVENT_WEIGHT_BP` (2_500) are genuinely unsourced (DESIGN-16 fixes duration,
era step and thresholds but no cost/work or event weight). They are authored as versioned,
provenance-commented constants in `dockExpansion.ts` rather than `balance.yaml` PLACEHOLDERs, because
the dock-expansion policy is infrastructure, not the ship-building balance file. Confirm the intended
home and move to a versioned balance target if required.

The Construction-screen expansion action is INC-6b.
