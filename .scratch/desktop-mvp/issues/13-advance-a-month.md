# 13 — Advance a Month

**What to build:** `commitMonth` wired to `MonthExecutor`
(`packages/phase-engine/src/month.ts`), with any triggered battle
auto-resolved inline via `packages/combat/src/autoResolution.ts`, per
[Simulation Contract](09-simulation-contract.md). No
`generateBattle`/`resolveBattle`/`resolveTacticalBattle` round-trip for
this slice.

**Blocked by:** [New Game → Overview](12-new-game-to-overview.md).

- [ ] From an open campaign, advancing a month on the Simulation screen
      produces a real `MonthReport` (opening/closing treasury, maintenance,
      construction spending) — not placeholder data.
- [ ] If the monthly pipeline triggers a battle, the month still completes
      via auto-resolution — the UI never blocks waiting on tactical input.
- [ ] Overview reflects the post-commit state (new treasury, turn number)
      after returning from Simulation.
- [ ] The month's updated state is persisted (round-trips through save/load).
