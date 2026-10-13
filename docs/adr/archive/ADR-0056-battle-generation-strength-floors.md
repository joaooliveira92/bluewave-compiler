# ADR-0056: Battle-Generation Strength Floors — Per-Side Fix Now, Unit Deferred

## Status

Accepted (2026-10-07). Part 1 implemented; part 2 recorded as a deferral with a concrete next step.

Tracked in `docs/DEFERRALS.md` (D-1).

## Context

Building the desktop Tactical Sandbox (ADR-0057) showed that no real turn can generate a battle. The
canonical rule (`docs/rules/battle-generation.md` §6.1, §6.2, §10) requires a minimum eligible combat
strength **per side**: 300 points for a Fleet Battle, 150 for a Cruiser Battle. Two separate problems:

1. **Bug — the floor was not applied per side.** `generateBattles` (`packages/combat/src/generation/
   pipeline.ts`) computed `attackerStrength` and `defenderStrength` from the *same* list (all eligible
   assets of both sides), so a strong side carried a weak opponent over the floor.
2. **Gap — the unit of "effective strength" is not defined.** The rules fix the numbers (300, 150) but
   never define what a "point" is. The implementation feeds `ship.firepower` through
   `resolveShipStrength` (`phase-engine/src/battles.ts`). Production 1880 ships have firepower 14-26, so
   the whole UK navy sums to 50 and France to 22.

Measured on the production 1880 pack (completed ships only): UK 3 ships, France/Germany/Italy/Russia/
Austria-Hungary/Japan/Ottoman/Spain 1 each, Brazil/Netherlands/Portugal/Qing/USA 0. Ship stats are
firepower 14-26, armor 15-20, hit points 22-52.

Real contact is independently impossible today (movement is not implemented in the desktop app), so
neither problem changes any real campaign's outcome yet.

## Decision

1. **Fixed (bug):** the floor is evaluated per side (`attackerEligible` for the attacker,
   `defenderEligible` for the defender), as the rules text requires. Pinned by three tests in
   `packages/combat/test/generation/pipeline.test.ts` (weak defender, weak attacker, both strong); the
   first two fail against the old code. No existing test, golden hash (10/10) or cross-package suite
   changed (combat 3,674, phase-engine 145).
2. **Deferred (gap), not changed:** the strength unit stays `ship.firepower`. Changing it alters
   authoritative gameplay (how often battles occur) and cannot be validated until ships can make
   contact, so it is recorded here rather than guessed. The options, with their effect on the 1880 pack:

   | Unit for "effective strength" | Effect on the floors (300 fleet / 150 cruiser) |
   | --- | --- |
   | `firepower` (today) | Unreachable: UK 50, France 22. |
   | `firepower x armor` | One ship usually clears both floors (France 440), so a "fleet" battle needs a single ship. |
   | `firepower x hit points` | Same, more strongly (France 880). |
   | Keep the unit, scale the floors by fleet-size setting | Preserves "fleet" meaning; needs a rules change. |

   Recommended next step: decide the unit together with movement/contact (the floor's job is to keep
   trivial skirmishes from being Fleet Battles; whether a 1-ship engagement should be a Cruiser Battle
   is a design question), as a **versioned ruleset constant** with an ADR and a golden refresh, so the
   change is explicit and reversible. Until then the sandbox's `strengthScale` (ADR-0057) is the only
   way to see a battle, and it says so in every result.

## Consequences

- Generation now matches the rules text for sides of unequal strength; lopsided matchups that used to
  slip through no longer do.
- `gbr_malta_temp` (UK Mediterranean fleet) has no `designVersionId`; that is the known content gap
  already tracked in `docs/research/content-5-1880-pack-audit-2026-08-17.md` (needs
  `des_gbr_temeraire`) and listed as unresolved in `apps/desktop/test/production-promotion.test.ts`.
  It is not patched here: a historical ship design is content work, not an engine fix.
- Anyone changing `resolveShipStrength` or the floors must update this ADR and re-run the goldens.
