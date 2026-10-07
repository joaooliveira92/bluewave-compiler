# Research — RTW3 "Ships sunk or scrapped" ledger (F-5): what the engine records

> Sprint: RTW3 parity / UX overhaul (`.scratch/rtw3-parity-ux-overhaul`, ticket 08).
> Method: source sweep (2026-10-07). Same rule as the war panel: show real data;
> state the rest; never invent.

## Findings

| Item | Engine surface today | Verdict |
|---|---|---|
| Resolved battles, sides, area, winner | `snapshot.wars.battles[]` (`BattleInstance.result`: `winnerId`, `loserId`) — append-only, so order is chronological | **Real** |
| Ships sunk per battle | `BattleResult.attackerLosses` / `defenderLosses` — **ship ids only** | **Real as counts** |
| Ship name / class of a lost ship | `applyBattleConsequences` (`packages/phase-engine/src/battles.ts:238`) **removes** a sunk ship from its fleet; the id is the only thing kept | **Not recoverable** — deferred |
| Cause of loss | Per-ship cause exists only in the tactical battle report (ADR-0052, "observational"); not persisted in campaign state | **Deferred** |
| Date of a battle | `BattleInstance` has no month/date field | **Deferred** |
| "Scrapped" ships | There is no scrap command or state anywhere in the engine | **No engine concept** — deferred |

## Decision
1. Ship a read-only **Battle history** on Diplomacy & War via a new `inspectBattleHistory`
   command over a pure `buildBattleHistory(snapshot, playerNationId)` — outcome for the
   player, sides, area, and loss **counts**. Ship and battle ids are debug-only.
2. State the limitation in the UI ("Ship names are not recorded once a ship is lost").
3. Engine follow-ups (they change authoritative state, so each needs an ADR and a golden
   update — not a renderer change): persist `{name, classId}` and the month on each
   loss; persist per-ship cause of loss; decide whether "scrapping" is a mechanic.
