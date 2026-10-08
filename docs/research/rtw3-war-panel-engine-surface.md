# Research — RTW3 war panel (F-1): what the engine really exposes

> Sprint: RTW3 parity / UX overhaul (`.scratch/rtw3-parity-ux-overhaul`, F-1, ticket 05).
> Method: source sweep of `packages/*/src` and `apps/desktop/src` (2026-10-07),
> no assumptions from the original game's manual. Purpose: decide, per RTW3
> war-panel item, whether the UI can show **real engine data** or must ship as an
> explicit **deferred** panel (AGENTS.md: deferred work is recorded, never faked).

## Findings

| RTW3 war-panel item | Engine surface today | Verdict |
|---|---|---|
| Your VP vs enemy VP | `DiplomacyWarRow.attackerWarScore` / `defenderWarScore` + `playerSide` (`packages/campaign-engine/src/diplomacy.ts:106`); month-by-month `warScoreChange` in `simulation.ts` | **Real.** Show player vs enemy score. |
| Blockades | `DiplomacyBlockadeRow` + `DeclareBlockade` command (`diplomacy.ts:123`) | **Real**, already on the Diplomacy screen. |
| Trade protection (e.g. "4 of 5") | No `tradeProtection` / trade-route state anywhere in `packages/*/src` or `apps/desktop/src` | **Deferred** — no engine concept. |
| ASW (RTW3 "17/0") | ASW exists only as tactical-combat modelling in `packages/combat/src/submarines/*`; no campaign-level ASW rating | **Deferred** — no campaign aggregate. |
| Submarine warfare policy (fleet support / prize rules / unrestricted) | Rules exist inside the tactical submarine model (`combat/submarines`), but there is no campaign command or state that sets a policy | **Deferred** — needs an engine command + state first. |
| Invasion planning (target, cost) | `INVASION` is a tactical battle mission type (`combat/generation/mission.ts`); no campaign-level invasion plan, target or cost | **Deferred** — no campaign mechanic. |

## Decision

1. Ship the **real** part now: a clear player-vs-enemy war-score readout per war
   (derived from `attackerWarScore`/`defenderWarScore` and `playerSide`; no new
   engine data, no rounding games).
2. Show the four unsupported items as a visible **"Not yet modelled by the engine"**
   panel on the Wars section, each with its one-line reason. They are never shown as
   numbers, zeros or disabled-but-looks-real controls.
3. Do **not** invent campaign mechanics in the UI. Giving these items real values is
   an engine ticket (new state + commands + determinism/golden impact), tracked as
   deferred follow-ups, not a renderer task.
4. The click-depth ledger keeps the war panel inside "Diplomacy & War" (≤ 3 clicks).

## Deferred follow-ups (engine work, out of scope here)
- Campaign-level trade-route / commerce-protection state.
- Campaign ASW rating derived from fleet composition.
- `SetSubmarinePolicy` campaign command + persisted policy consumed by the war model.
- Campaign invasion planning (target, cost, resolution).
