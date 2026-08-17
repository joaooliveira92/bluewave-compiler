# Validation Report: M2 First Month at the Admiralty — charting sprint

## Outcome

`PASS` (charting/spec-writing sprint with one small engine task).

## Scope delivered

Advanced the wayfinder effort `.scratch/game-onboarding-first-month/` (spec
for Milestone 2, "First Month at the Admiralty") by resolving **6 frontier
decision tickets** against the real codebase, and implemented the one `task`
ticket (diplomacy tension-threshold policy):

- **07 Research allocation** — confirmed the real weight-based model is fully
  implemented end-to-end; M2 adds only field-level edit UX (no basis-points,
  no "balancing category"; cap = `MAX_HIGH_PRIORITY_FIELDS = 5`); command is
  the real `SetResearchPriorityCommand`.
- **08 Fleet inspection** — real `Ship` fields + design join; per-row
  maintenance cost and "most expensive class" cut; no ship actions.
- **09 Construction projects state model** — adopted real 4-state enum; no
  `paused`/`cancelled` state added (stall is a display derivation); real
  resolution policy authoritative.
- **11 Diplomacy tension-threshold policy (task, implemented)** — added
  `tensionLabel`, `isHighTension`, `HIGH_TENSION_THRESHOLD = 8` to
  `packages/campaign-engine/src/diplomacy.ts` + `test/tension-label.test.ts`.
- **16 Saving/loading & campaign-list** — save/load mature; new campaign-list
  screen needs an additive optional 3-field `SaveMetadata` extension.
- **18 Guided-inspection spotlight prototype** — interaction model decided
  (DOM renderer-only spotlight, non-blocking, no focus trap).

Tickets resolved: **12/18**. Remaining open: 04, 10, 12, 13, 14, 15 (13 is
the next frontier). Assembling the single M2 spec awaits all tickets per
`map.md`.

## Requirements evidence

Charting effort only; the one code change (ticket 11) is additive to the
diplomacy domain projection layer:
- `campaign-engine/src/diplomacy.ts` — `tensionLabel`, `isHighTension`,
  `HIGH_TENSION_THRESHOLD`, `TENSION_LABELS`, `TENSION_LABEL_BANDS`.
- `campaign-engine/test/tension-label.test.ts` — 8 tests (band edges, high-
  tension threshold, label/taxonomy coverage, `isHighTension` ↔ label
  agreement).

## Commands and observed results

```text
$ pnpm exec tsc -b                                  (packages/campaign-engine) → exit 0
$ pnpm exec vp test run test/tension-label.test.ts → 1 file, 8 tests passed
$ pnpm exec vp test run                             (campaign-engine full) → 11 files, 65 tests passed
$ pnpm exec vp lint src/diplomacy.ts test/tension-label.test.ts → 0 warnings, 0 errors
$ pnpm exec vp fmt --check src/diplomacy.ts test/tension-label.test.ts → all files correct
$ pnpm typecheck                                    (repo) → Tasks: 33 successful, 33 total
```

## Determinism evidence

The only code change is an additive pure function over the existing 0..10
numeric `tension` field — it reads no RNG, wall-clock, env, locale, or
filesystem, and alters no authoritative state. **No canonical artifact, hash,
or ruleset changed** (no content/ruleset edit, no authoritative simulation
path modified). Cross-process/golden gate not re-run because no authoritative
output changed; recorded as not-applicable to this additive change.

## Canonical artifact changes

None. `tensionLabel`/`isHighTension` are new pure derivations; the
`resolve_diplomacy` `rngAllowed: false` flag was deliberately **not** flipped
(deferred to Advance Month flow, ticket 13).

## Tests added

`packages/campaign-engine/test/tension-label.test.ts` — unit tests for the
label taxonomy and high-tension threshold.

## Security and cancellation

No new I/O, trust boundary, or cancellation surface introduced.

## Performance observations

None collected (no simulation-path change).

## ADRs and dependencies

None. The tension taxonomy/threshold is a documented engine-side constant set
(local design decision, no new dependency). If a later sprint makes monthly
tension randomness real, that resolution-behavior change will need its own
ADR + phase-flag change.

## Known limitations and deferred requirements

- Spec assembly is deferred until all 18 charting tickets resolve (next
  frontier: **13 Advance Month flow**, then 04/10/12/14/15).
- C-3-IMPL (submarines) on the implementation track remains queued, not
  dropped.
- Concrete guided-inspection visual prototype (ticket 18) deferred to the
  implementation sprint (presentation detail only).
