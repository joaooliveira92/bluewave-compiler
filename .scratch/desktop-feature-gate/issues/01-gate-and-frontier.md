# 01: Gate the desktop feature candidates and pick the frontier

Type: task
Status: resolved

## Question

Which engine-built, accepted capabilities ("missing features the engine
already built") should the desktop surface next, and what is the number-one
frontier increment for this session?

## Candidate ledger (engine-built, desktop-missing)

| # | Candidate                                   | Engine anchor (SPRINT-PLAN / PROGRESS)                          | Desktop today                                       | Effort | Frontier? |
| -- | ------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- | ------ | --------- |
| 1  | **Tactical battle-outcome surfacing**        | B-6 `battle_resolution`: `BattleResolved` events; `wars.battles[].result` (winner/loser/attackerLosses/defenderLosses/damageReport/explanation); war-score deltas | `closingSnapshot.activeWars` is `unknown[]`; turn report shows only event kind, not outcome | Low–Med | **YES** |
| 2  | Strategic weather surfacing (per-area)       | B-5/ADR-0025 `weather_generation` `StrategicWeatherState` on snapshot | not surfaced                                   | Med     | no       |
| 3  | AI planning read-only view                   | B10d `@bluewave/ai` `AiPlan` (legal-only plans)                  | `lastAiPlan` exists in sim state; not rendered well | Low     | no       |
| 4  | Divisions/formation view                       | B-1/ADR-0012 permanent divisions + commands                     | fleet screen shows divisions read-only              | Low     | no       |
| 5  | Design-template read-only catalog            | B10b `DesignTemplateSchema` + compiled designs                  | not rendered (re-authoring out of scope)           | Med     | no       |

## Answer

Gate halts on candidates the engine already builds and the desktop can surface
without touching authoritative behavior. **Frontier = candidate 1, tactical
battle-outcome surfacing.** Rationale:

- It is the explicitly recorded next frontier of the prior
  desktop-engine-feature-gate effort (`.scratch/desktop-engine-feature-gate/map.md`).
- The engine gives a complete, ready surface: `BattleResolved` domain events
  already flow through `commitMonth`'s `domainEvents`, and `WarState.battles[]`
  carries resolved `result` objects (winner/loser/losses/explanation) — the
  desktop currently discards them (`activeWars: unknown[]`).
- It is a read-only/load-bearing surface change (projection/bridge/renderer),
  which is safe to run concurrently with the phase-engine agent: no
  engine/combat/phase-engine edit, no golden-hash change.
- Measurable outcome: the turn report shows the month's resolved battles with
  winner/loser, war-score delta, and ship losses, derived from the engine —
  nothing fabricated.

Candidates 2–5 stay recorded (not dropped) and may graduate as their own
sprints once the frontier's seam (projection → bridge → renderer → turn report)
is proven.

## Comments

- 2026-08-15: gate resolved by the orchestrator. Delete/neutralize nothing;
  candidates 2–5 remain in the map's "Not yet specified" fog for later sessions.