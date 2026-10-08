# ADR-0061: Persisted ship-loss records (the "ships sunk" ledger)

Status: accepted (2026-10-07). Roadmap item 3 (`docs/research/rtw3-parity-engine-roadmap.md`), ticket 08.

## Decision
- `BattleResult` gains optional `lostShips: LostShipRecord[]` = `{ shipId, name, classId, nationId, month, cause? }`.
- `collectLostShips` (phase-engine) runs in `battle_resolution` **before** `applyBattleConsequences` removes the
  ships, with the same rule (on the sunk lists, or damage takes hp to 0) and fleet order, so the ledger and the
  fleets cannot disagree (unit-tested). `cause` is the observational ADR-0052 cause; it is absent for ships lost
  only through the hp rule and omitted entirely when nothing was lost.
- The legacy (M1) battle path does not record ships; it has no per-ship result.
- `buildBattleHistory` exposes `lostShips` (name, class, owner, month, cause) next to the existing id list; the
  Diplomacy & War battle history lists them by name with the cause.
- Old saves keep working: the field is optional, so earlier battles show counts and a note.

## Consequences
Snapshots that resolve battles now carry extra data, so hashes of battle-containing runs change; runs with no
battles are unchanged. All determinism, replay and golden checks pass.

## Not done
- **Scrapping:** the engine has no scrap mechanic; "Ships sunk or scrapped" shows only sunk ships.
- Ships lost outside battles (e.g. disasters) do not exist in the engine.
