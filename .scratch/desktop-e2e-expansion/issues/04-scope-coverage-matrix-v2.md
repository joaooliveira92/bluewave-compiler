# Desktop E2E Expansion — 04: Scope & Coverage Matrix v2: which flows graduate

Type: grilling
Status: open
Blocked by: 01 — Observable surface of the current commissioning flow & uncovered production screens
Blocked by: 02 — Fixed-seed multi-month behaviour & suite wall-clock

## Question

Beyond repairing the create-side baseline (ticket 03), which un-covered
**user-visible flows** graduate into the E2E Coverage Matrix v2, and which stay
out? The prior coverage map's scope was the MVP critical path; this expansion
re-opens it against the today-reachable production surface (Overview,
Construction, Fleet, Research & Technology, Diplomacy & War, Treasury, landing/
campaign-file, settings) with unit-test coverage already existing for the
screen state logic.

Candidates to admit or rule out, one judgment each (defaults in brackets are
suggestions to react to, not decisions):

- Research priority set-and-submit flow — apply on next turn [, in].
- Diplomacy command queue flow (declare war / NAP / alliance / blockade-area
  select / accept peace) — apply on next turn [, in].
- Treasury read-only projection [, in — cheap, guards the projection wiring].
- First-month guided inspection tour (auto-open on fresh compile) [, in —
  it is first-run UX of the loop, but confirm from ticket 01 whether it
  interferes with existing specs first].
- Recent Campaigns list (listCampaigns + localStorage recency) on the landing
  [, decide].
- Settings screens: Campaign Preferences (save-on-close) and Options (save/
  close) [, delegated — these were the prior map's deferred OOS patch,
  graduating only via a fresh destination, which this is].
- Multi-month depth (ticket 06), compile-breadth matrix (ticket 07) —
  in/out as their own decisions.
- Row-11 verify-mismatch honesty fix (ticket 05) — in/out as its own decision.

Also decide the **matrix shape**: one new `screens.spec.ts` per flow vs a
second serial narrative file vs extending `mvp-loop.spec.ts`, and whether
fixture/start-state follows the prior "serial files share one compiled
campaign" pattern or compiles per-file. Record the decided matrix (Delta over
coverage-matrix.md v1) as the resolution; the implementation is handed off.