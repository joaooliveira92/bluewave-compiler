# ADR-0116: Per-scenario 1880 classification ruleset — coast-defence ships as capital

## Status

Accepted (2026-10-11). Amends DESIGN-22; follows ADR-0114.

## Context

`DESIGN-22_EARLY` classifies a **B** capital only at `displacement >= 5,000 t`,
`belt >= 6 in`, a main gun over 6 in, speed under 20 kn and one or two main
mounts. ADR-0114 showed this is the *real* blocker for the eight deferred
historical candidates: slow coast-defence/casemate ironclads of 1,300–4,000 t
with 4–6 in belts (Matador, Vasco da Gama, Sete de Setembro, Fusō, Numancia /
Vitoria, Kaiser Max) are below the B floor and belt, yet too slow to be CA/CL/DD,
so they classify as nothing and cannot be promoted as their nation's capital
starter without falsifying displacement or armour.

The mechanism to fix this *as data* already existed but was unused: `compile.ts`
and `orderEligibility.ts` read `ShipBalance.classification`, and `nationProfile` /
the roster already accept a `ClassificationRules`. No scenario had authored one,
so the canonical EARLY band was always used.

## Decision

Author a per-scenario classification ruleset at
`content/production/1880/ship-building/balance.yaml` → `ship.classification`. It
is the canonical `DESIGN_22_EARLY` with exactly three boundaries adjusted and a
`rulesetVersion` of `2`:

| Field | `DESIGN_22_EARLY` | 1880 scenario | Rationale |
| --- | --- | --- | --- |
| `bMinDisplacementKg` | 5,000,000 | 1,500,000 | monitors and casemate ironclads of ~1,500–4,000 t |
| `bBeltMinUm` | 152,400 (6 in) | 101,600 (4 in) | these ships carried 4–6 in belts |
| `bMaxSpeedUms` | 20 kn | 18 kn | the 1880 battle line is slower than 18 kn; the tightened bound stops the lower belt/floor capturing the 21-kn armoured-cruiser starters |
| `rulesetVersion` | 1 | 2 | the ruleset is versioned so a data change is identifiable |

Every other value is `DESIGN_22_EARLY`. The ruleset is a full, data-authored
`ClassificationRules`: `classificationRulesFromRecord` (`classificationRules.ts`)
rejects a partial one, so a missing boundary is a content error, never a silent
`undefined`. `buildShipTypeRoster` now derives the player-facing envelope from
`env.ctx.balance.classification`, so the roster, the Brief panel and the validator
cannot disagree.

### Only admits, never widens

The relaxation is downward (a lower floor, a thinner belt); the tightened speed
bound is the only restriction and it excludes every existing fast design. A test
pins that **no existing reference design changes its natural class** under the
scenario ruleset (uk/france/germany starters included), and that a coast-defence
fact set that is unclassifiable under `DESIGN_22_EARLY` classifies as `B` under
the 1880 ruleset. The canonical `DESIGN_22_EARLY` is untouched, so the historical
fixtures that test the global band keep testing it.

## Alternatives considered

- **A new coast-defence ship type (`CD`).** The historically cleanest model, but
  DESIGN-22 §1 requires a stable id, precedence ordinal, intended-class validator,
  treaty / AI-role / battle-role / maintenance mappings, save migration and a full test
  matrix for any added type. That is a much larger, gameplay-facing change; the
  ruleset decision is the smallest one that admits the ships. A distinct type
  remains open if coast-defence is later given its own role (recorded, not
  dropped).
- **Edit `DESIGN_22_EARLY` directly.** Rejected: it changes the global early band
  for every scenario, not just 1880.
- **Raise the belt floor to ~4.33 in and leave speed at 20 kn.** Rejected: the
  belt `2 in -> 4 in` threshold is the defensible historical one, and the speed
  bound is what separates a coast-defence B from a 21-kn cruiser.

## Consequences

- The ADR-0114 candidates that are legal under this ruleset can be promoted to
  their nation's capital starter (ADR-0117); uk/france/germany classifications are
  unchanged.
- `balance.yaml` is part of `shipBuildingContentHash`; the changed bytes are a
  **non-fatal replay-divergence warning** per ADR-0113 §4 (`REPLAY_CONTENT_CHANGED`),
  not a save-format change, and they do not touch the compiled `pack.json` hash.
- The scenario ruleset travels with the 1880 content, so a replay compiles the
  same classification it recorded.
