# P-1 — Battles that matter (spec)

Track P (ADR-0045). Make the M3 torpedo mechanics change real campaign battle outcomes.

## Problem

`resolveBattleAuto` (`packages/combat/src/battleResolution/resolve.ts`) — the only path a
campaign battle takes — runs gunnery + weather + damage. Torpedoes, damage control, smoke
and mines are never given a context, so their engine stages are no-ops in every campaign.
The production designs carry no torpedo armament, so there is nothing to wire even if the
resolver supported it.

## User stories

- As a player in 1880, when my ironclad squadron meets the enemy, ships that historically
  carried Whitehead tubes can torpedo the enemy at close range, and the battle report shows it.
- As a designer of the campaign, torpedo armament is authored content, research-grounded,
  and compiled deterministically like every other design field.

## Acceptance criteria

| AC   | Requirement                                                                                                                          | Proof                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| AC-1 | `DesignTemplateSchema` accepts optional `torpedoArmament: [{ mountType, tubeCount, torpedoModelId }]` (closed mount enum, tubes ≥ 1) | content-schema tests                                        |
| AC-2 | Compiled designs carry `torpedoArmament`; a design without it compiles to a byte-identical `compiledHash` (no golden churn)         | campaign compiler tests                                     |
| AC-3 | The 16 1880-roster designs carry the as-built armament in `docs/research/p1-1880-torpedo-armament.md`                                 | production-pack compile test                                |
| AC-4 | `projectBattle` builds torpedo launcher wirings (one per mount) + per-ship torpedo target contexts from compiled designs            | combat projection tests                                     |
| AC-5 | `resolveBattleAuto` runs a deterministic torpedo doctrine: a launcher with loaded tubes fires one tube per minute at the nearest legal enemy contact inside the model's range; launcher/track/damage states thread minute-to-minute; torpedo damage feeds the §32 battle-end decision | combat auto-resolution tests                                |
| AC-6 | Battles between ships without torpedo armament keep byte-identical minute hashes and result hashes                                  | pinned unarmed `resultHash` baseline test + goldens 10/10    |
| AC-7 | Campaign reachability (ADR-0045 gate): a compiled production-pack battle between torpedo-armed ships emits torpedo records and its outcome differs from the same battle with armament stripped | combat/campaign integration test                            |
| AC-8 | Two-process determinism of a torpedo-armed auto-resolved battle                                                                     | cross-process test                                          |

## Decisions

- As-built fits only; refits and unsourced counts are not authored (research note "Rule").
- `whitehead_14in_1886` stands in for every 1880 14-in tube (recorded approximation).
- Doctrine is deliberately simple and deterministic (one tube per launcher per minute,
  nearest legal target, within model max range). Tactical AI depth belongs to P-6.
- **ADR-0047 (ticket 07):** the DESIGN-41 damage-control stage runs in
  `resolveBattleAuto` iff the battle contains a unit with `torpedoArmament` — the
  deterministic form of AC-6's hash freeze; unarmed battles keep pre-P-1
  semantics until ticket 09. Severity thresholds are basis points of
  displacement (§14): mass stays in kg, `bp = floor(mass × 10_000 / displacementKg)`
  is applied only at severity evaluation.

## Deferred (recorded, not dropped)

- Unarmed-battle damage-control progression (DESIGN-41 §13/§19/§44 vs AC-6) —
  ticket 09, per ADR-0047; amends AC-6 and re-pins baselines via ADR-0007.
- DESIGN-41 §17 high-speed-loss effect + `FLOODING_HIGH_SPEED_LOSS_CHECK`
  emission (needs a spatial compartment model on `ShipDamageState`) — ADR-0047.
- DESIGN-41 §1/§27 persistent damage-control resources (state-schema change) and
  §15 speed/stability severity multipliers — ADR-0047.
- Smoke: deliberate smoke-screen doctrine is a WWI-era tactic; deferred until the
  campaign reaches PRE_WAR battles.
- Mines in battle areas: blocked on DESIGN-25 route strikes (C-2 continuation).
- Post-1900 design torpedo armament (needs 18-in/21-in fits research).
- Fleet depth: 14 ships total in the 1880 pack — tracked as content sprint CONTENT-4
  (1880 fleet depth: cruisers, torpedo boats).

## Definition of done

All ACs proven; `pnpm check` green; goldens 10/10 (or regenerated per ADR-0007 with reason);
report under `.ai/reports/`; SPRINT-PLAN/PROGRESS updated.
