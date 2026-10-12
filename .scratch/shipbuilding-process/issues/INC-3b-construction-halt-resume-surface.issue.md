# INC-3b — Construction halt/resume/delay player surface

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** INC-3
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

- [ ] Construction rows offer halt/resume, issuing the `HaltConstruction`/`ResumeConstruction`
      commands through the bridge.
- [ ] Halted rows display the preservation (half-mothball) carrying cost.
- [ ] Rows display the monthly instalment, remaining months, total cost and launch month, all from
      the compiled `constructionProjectReadout`.
- [ ] Display-vs-edit: each control issues a command; no readout invents data.
- [ ] Desktop render test + `pnpm snap` of the row and readouts (screenshot + `aria.yaml`, console
      clean, no churn warning); the e2e path covers order → halt → advance month → launch.

## Notes for implementator

One component per file under the construction screen's `components/`; re-export from the barrel. The
readout helper and command bodies already exist in `@bluewave/phase-engine` / `@bluewave/commands`.
This is part of WS5; keep the surface consistent with the other construction panels.
