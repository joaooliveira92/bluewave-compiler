# ADR-0050: P-1 — Persist Shell-Created Fire and Flooding Sources

## Status

Accepted (2026-10-07). Follows ADR-0049.

## Context

Shell hits created fire and flooding *sources* (`createdFireSources`,
`createdFloodingSources`) that appeared only in the damage event record. They
were never written into `ShipDamageState`, so the step 8.6 damage-control stage
(now wired in every battle, ADR-0049) had nothing to progress in gunnery-only
battles.

## Decision

1. `persistCreatedSources` (`battleResolution/damage.ts`) appends a ship's
   created sources to its state after `resolveDamage`. It is pure
   post-processing of already-drawn event records: no extra random draws, so
   ledger order is unchanged. It returns the same state object (same hash) when
   nothing was created.
2. Fires: one record per location, merged at the higher intensity, so smoke
   cloud ids and `smoke_fire` event ids stay unique.
3. Flooding: appended verbatim (torpedo-path convention); rates sum in the
   flooding progression.
4. Persistence lives in the auto-resolution layer, not in `resolveDamage`, so
   other `resolveDamage` callers and their tests are untouched. No
   `ShipDamageState` shape change.

## Baseline re-pins (ADR-0007)

| Baseline | Old result hash | New result hash | Notes |
| --- | --- | --- | --- |
| auto-resolve #1 (`makeAutoInput()`) | `74d2dfe77b33…` | `e017125ea0d2…` | minutes 0–2 identical; 18 → 14 minutes |
| ac6-damage-control-gate #2 (4-gun) | `9c88d23f3931…` | `c6b73c6f73d1…` | minutes 0–2 identical; still 18 minutes |

Goldens are unaffected (no golden scenario resolves a battle). Full hashes and
changed minutes are in the test comments.

## Consequences

- Shell fires and flooding now burn and sink ships; gunnery-only battles end
  sooner (a real gameplay shift to check in the balance sweep).
- Damage saturates at 100 per ship, so per-seed damage totals can tie or invert
  with gun count. The gunnery-fidelity "more guns, more damage" check is now an
  aggregate over the seed set (1781 vs 1678 at pin time) instead of per seed.
- Ticket 09's deferred tests (progression, §32 end, determinism) are delivered
  in `shell-sources-persist.test.ts`.
