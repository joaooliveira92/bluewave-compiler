# INC-3 — Halt/resume + delayed + project readouts

**State:** READY_FOR_AGENT · **Frontier:** no · **Blocked by:** INC-2
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R4, R5, R6, R31, R35) · **ADR:** none new (adds the mothball-cost-base PLACEHOLDER constant)

## What to build

Let a player steer a hull under construction: the manual's monthly instalment is the existing
per-package payment (no new schedule); a project can be **halted** and **resumed** (paying half the
mothballed maintenance while stopped); a project can be **delayed** for a month with no build cost
deducted; and the Construction screen shows the instalment, months left and launch month.

## Acceptance criteria

- [ ] Payment→work is DESIGN-23 §6 unchanged: each month a project pays its share and converts it to
      work; zero payment yields zero progress. No separate "instalment plan" object exists.
- [ ] `HaltConstruction` / `ResumeConstruction` commands are accepted. A `HALTED` project receives
      exactly `0` work and `0` ordinary work charge and pays preservation cost = **half the mothballed
      maintenance** (base is a versioned `balance.yaml` PLACEHOLDER constant); resume returns it to
      `ACTIVE` (or `AWAITING_CAPACITY` when capacity is unavailable).
- [ ] A `DELAYED` month receives exactly `0` work and `0` ordinary charge (the build cost is not
      deducted), is not counted as an active completion month, and writes one delay record with a reason.
- [ ] Construction-screen rows offer halt/resume; halted rows show the half-mothball carrying cost;
      readouts show the monthly instalment, remaining months, total cost and launch month — every figure
      a compiled/derived value, never authored in the UI.
- [ ] Display-vs-edit: each control issues a command; no readout invents data; UI navigation consumes no
      authoritative randomness.
- [ ] Tests: unit (halt → zero work/charge + preservation; delayed month charges nothing), boundary
      (resume with/without capacity), persistence (status round-trip), determinism (integer costs);
      desktop render + `pnpm snap` of the row and readouts.

## Notes for implementator

Domain function in the phase engine, commands in the command registry, row actions on the Construction
screen behind the existing construction bridge contract. The manual defines the *half* rule only — keep
the base a PLACEHOLDER constant.
