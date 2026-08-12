---
Type: task
Status: resolved
Blocked by: 03
---

# B-1 / 04 — Composition validation, repair, manifest, seed, reservations

## Question

Stages 10–15: reachability/legality, repair, rejection, manifest, seed,
reservations, auto-resolution proof.

## Answer

Per spec INC-4: `revalidateReachabilityAndLegality`, `battle_composition_repair_v1`
(≤3 passes), rejection, `canonicalizeManifest` before seed, `deriveBattleSeed`
(stream `battle/battle_id/root`), `reserveAssets`, `proveAutoResolvable` (declared
resolver surface, ADR B-1-5/6). `WarState.battleManifests` + `BattleInstance.manifestHash`
schema impact begins here.
