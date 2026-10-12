# INC-3 — Halt/resume + delayed + project readouts

**State:** RESOLVED (engine slice; UI surface split to INC-3b) · **Frontier:** yes · **Blocked by:** INC-2
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R4, R5, R6, R31, R35) · **ADR:** none new (adds the mothball-cost-base PLACEHOLDER constant)

## What to build

Let a player steer a hull under construction: the manual's monthly instalment is the existing
per-package payment (no new schedule); a project can be **halted** and **resumed** (paying half the
mothballed maintenance while stopped); a project can be **delayed** for a month with no build cost
deducted; and the Construction screen shows the instalment, months left and launch month.

## Acceptance criteria

- [x] Payment→work is DESIGN-23 §6 unchanged: each month a project pays its share and converts it to
      work; zero payment yields zero progress. No separate "instalment plan" object exists.
- [x] `HaltConstruction` / `ResumeConstruction` commands are accepted. A `HALTED` project receives
      exactly `0` work and `0` ordinary work charge and pays preservation cost = **half the mothballed
      maintenance** (base is a versioned `balance.yaml` PLACEHOLDER constant); resume returns it to
      `ACTIVE` (or `AWAITING_CAPACITY` when capacity is unavailable).
- [x] A `DELAYED` month receives exactly `0` work and `0` ordinary charge (the build cost is not
      deducted), is not counted as an active completion month, and writes one delay record with a reason.
- [ ] Construction-screen rows offer halt/resume; halted rows show the half-mothball carrying cost;
      readouts show the monthly instalment, remaining months, total cost and launch month — every figure
      a compiled/derived value, never authored in the UI. **Split to INC-3b.**
- [ ] Display-vs-edit: each control issues a command; no readout invents data; UI navigation consumes no
      authoritative randomness. **Split to INC-3b.**
- [x] Tests: unit (halt → zero work/charge + preservation; delayed month charges nothing), boundary
      (resume with/without capacity), persistence (status round-trip), determinism (integer costs).
      Desktop render + `pnpm snap` of the row and readouts: **split to INC-3b.**

## Answer (engine slice, 2026-10-12)

Landed: `HaltConstruction`/`ResumeConstruction` command bodies + definitions; `applyHaltConstruction`
/ `applyResumeConstruction` (all status writes through `transitionConstructionProject`); the
appropriation phase charges no ordinary cost for `HALTED`/`DELAYED`, pays the preservation cost for
`HALTED`, writes one `ConstructionDelayed` event per delayed project with reason
`PROJECT_DELAYED_ZERO_WORK`, and resumes a delayed project the following month; the compiled
`constructionProjectReadout`; and the versioned `balance.yaml` PLACEHOLDER base
`mothballedMaintenancePerMonthMicro` with the manual's `preservationCostBp: 5000` half rule. Tests:
`halt-resume.test.ts` (commands), `halt-delay.test.ts` (phase engine), `halt-preservation.test.ts`
(ship-design), `halt-resume-roundtrip.test.ts` (persistence). `check:golden` and cross-process
determinism unchanged. The player surface is INC-3b.

## Notes for implementator

Domain function in the phase engine, commands in the command registry, row actions on the Construction
screen behind the existing construction bridge contract. The manual defines the *half* rule only — keep
the base a PLACEHOLDER constant.
