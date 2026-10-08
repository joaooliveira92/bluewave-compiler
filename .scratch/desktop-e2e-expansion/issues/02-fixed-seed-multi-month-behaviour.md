# Desktop E2E Expansion — 02: Fixed-seed multi-month behaviour & suite wall-clock

Type: research
Status: resolved
Blocked by: (none)

## Answer

Complete factual inventory filed at
[`docs/research/e2e-expansion-fixed-seed-multi-month-behaviour.md`](../../../docs/research/e2e-expansion-fixed-seed-multi-month-behaviour.md)
(179 lines). Key findings:

- **Month 2–3 deltas ARE observable for all four domains**: Research priorities change (full 15-field set, GUNNERY=4 on turn 1, MACHINERY=4 on turn 2 — but ALL 15 fields must be specified or the command is rejected); Diplomacy `DeclareWar` vs Italy produces `war_austria_hungary_italy_1880-02` status `DECLARED_NOT_ACTIVE` with `"at_war"` relation and tension 15; Construction `budget_project con_aut_tegetthoff 20` in month 2 completes it (100/100, COMPLETED), ship joins fleet in month 3; Treasury moves: 240 → 225 → 190 → 172.
- **Zero battles generated in 12 months** — AUT and ITA fleets in separate sea areas.
- **Cross-process determinism already proven** at unit level; e2e must NOT re-prove byte determinism — it proves correct UI rendering.
- **Estimated suite wall-clock**: ~4–8 min (12 tests, workers:1), CI with 2 retries up to 15–25 min. Each added serial test adds ~20–50s.

Research note: `docs/research/e2e-expansion-fixed-seed-multi-month-behaviour.md`

## Question

What deterministically **happens** when the fixed-seed Austria-Hungary campaign
advances past month 1, and what does the current suite cost — facts for the
multi-month-depth (ticket 06), compile-breadth (ticket 07) and CI-parallelism
(ticket 08) decisions?

Establish by reading `packages/` source/tests and, where ground truth needs a
run, by exercising **already-green engine paths only** (the CLI
`apps/compiler-cli` `advance`/`compare`/`inspect` commands or a one-off vitest
run against `@bluewave/phase-engine` + `@bluewave/campaign-engine` — never the
e2e suite itself):

1. **Month 2+ deltas for SEED `ba44581c2f1d8e5c9753ffc80be8e6a0`** — compile the
   production 1880 scenario as Austria-Hungary and advance ≥3 months: does
   Research (queued priorities applied on next turn) and Diplomacy (queued
   commands applied on next turn) produce **observable, distinctive** screen
   changes by month 2–3? Do Treasury figures move? Do Construction commands
   progress ("under construction", completion estimates)? Record concrete
   expected numbers/copy so a future spec has real assertions to key on.
2. **Battle generation under this seed/scenario** — does the phase pipeline
   generate any battle in, say, 12 months? If yes, at what turn/month and with
   what user-visible turn-report output (so the Battle Arena staging question in
   the map's fog has a number); if never, say so (that is the honest fact the
   scope decisions need).
3. **Cross-process determinism scope** — confirm the fixed-seed month advance is
   byte-deterministic across processes for this scenario (align with what
   `packages/cross-process-test` already proves, so e2e never re-proves it).
4. **Wall-clock budget** — estimate per-spec and whole-suite runtime for the
   current 3 spec files (boot ~?s, each row ~?s) from any recorded CI runs /
   Playwright output in the repo (or a dry measurement of `smoke` only), and
   what adding N serial screens would imply. State it as facts, not a
   recommendation.

Write the findings to `docs/research/e2e-expansion-fixed-seed-multi-month-behaviour.md`
(link it as this ticket's asset on resolution). No recommendations — facts only.