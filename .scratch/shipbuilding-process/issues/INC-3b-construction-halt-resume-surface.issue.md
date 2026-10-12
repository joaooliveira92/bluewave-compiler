# INC-3b — Construction halt/resume/delay player surface

**State:** PARTIAL — halt/resume controls landed; the compiled cost/time readouts are a follow-up · **Frontier:** yes · **Blocked by:** INC-3
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R6, R31, R35) · **ADR:** none new
**Parent:** `INC-3-halt-resume-delayed-readouts.issue.md` (engine slice landed)

## What to build

The Construction screen consumes the engine slice: per-row **halt** / **resume** actions behind the
existing construction bridge contract; a halted row shows the half-mothball carrying cost; each row
shows the monthly instalment, remaining months, total cost and launch month from
`constructionProjectReadout` (compiled values, never authored in the UI). Every control issues a
`HaltConstruction`/`ResumeConstruction` command or a draft; no readout invents data; navigation
consumes no authoritative randomness.

## Acceptance criteria

- [x] Construction rows offer halt/resume, issuing the `HaltConstruction`/`ResumeConstruction`
      commands through the bridge. — `ProjectsCard` steering controls → `useConstructionScreen`
      → the queued command handlers; the engine applies them on the next `commitMonth`.
- [ ] Halted rows display the preservation (half-mothball) carrying cost. — **deferred** to the
      readouts follow-up below.
- [ ] Rows display the monthly instalment, remaining months, total cost and launch month, all from
      the compiled `constructionProjectReadout`. — **deferred** to the readouts follow-up below.
- [x] Display-vs-edit: each control issues a command; no readout invents data.
- [x] Desktop render test + `pnpm snap` of the row and controls (console clean, no churn warning); the
      e2e path covers order → halt → advance month. — `ProjectsCard.test.tsx`,
      `e2e/construction-steering.spec.ts`, `pnpm snap`.

## Deferred (owner: this backlog)

The compiled cost/time readouts (`constructionProjectReadout`: monthly instalment, remaining months,
total cost, launch month, half-mothball carrying cost) are not yet projected into `ProjectRow` /
`ConstructionProjectQueueEntry`. Tracked as the readouts follow-up; the engine helper already exists.

## Notes for implementator

One component per file under the construction screen's `components/`; re-export from the barrel. The
readout helper and command bodies already exist in `@bluewave/phase-engine` / `@bluewave/commands`.
This is part of WS5; keep the surface consistent with the other construction panels.

