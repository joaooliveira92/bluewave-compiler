**Type:** task
**Status:** resolved
**Blocked by:** none

## Question

Neither a qualitative tension-label taxonomy (cordial / neutral / strained /
hostile / war-imminent, per doc §13.3) nor a "high tension" numeric
threshold (needed by doc §7.4's `high_foreign_tension` priority trigger)
exists anywhere in the engine today — only the raw numeric `tension` field
and the `relation` enum (`neutral | allied | at_war | trade_agreement`) are
real (`packages/campaign-engine/src/diplomacy.ts`).

This is real, well-scoped **engine** work (a `task` ticket, not a design
decision): define one centralized threshold (or small set of banded
thresholds) and a pure label function in the domain/engine layer that both
the Foreign Relations page and the priority engine can call, rather than
either the renderer or two separate tickets inventing their own
interpretation of the numeric tension score (the doc itself prohibits
renderer-invented thresholds in both §7.4 and §13.3).

Do the work:

1. Locate where `tension` is defined and currently consumed
   (`packages/campaign-engine/src/diplomacy.ts` and callers).
2. Add a small, named, documented threshold/labeling function (e.g.
   `tensionLabel(tension: number): TensionLabel`, plus a `HIGH_TENSION_THRESHOLD`
   constant) alongside the existing diplomacy domain code — band count and
   exact cutoffs are the implementer's judgment call (5 labels matching the
   doc's suggested taxonomy is a reasonable default), but must be
   engine-owned, not duplicated in two UI tickets.
3. Confirm it's consumable from both
   [Immediate priorities engine](./04-immediate-priorities-engine.md) and
   [Foreign Relations page](./12-foreign-relations-page.md) without an
   Electron/React dependency.

## Answer

Implemented in `packages/campaign-engine/src/diplomacy.ts` (pure, no
React/Electron dependency, re-exported via `campaign-engine/src/index.ts`):

- **Function:** `tensionLabel(tension: number): TensionLabel`
- **High-tension predicate:** `isHighTension(tension: number): boolean`
- **Constant:** `HIGH_TENSION_THRESHOLD = 8`
- **Label taxonomy** (`TENSION_LABELS`, over the real 0..10 tension scale —
  compiler validates authored tension in `0..10`; `@bluewave/campaign` exports
  `TENSION_PEACE = 5`, `TENSION_WAR = 10`):

  | tension | label |
  | ------- | ----- |
  | `>= 10` | `war_imminent` |
  | `>= 8`  | `hostile` |
  | `>= 6`  | `strained` |
  | `>= 3`  | `neutral` |
  | `< 3`   | `cordial` |

  `HIGH_TENSION_THRESHOLD = 8` is the band lower bound of `hostile` — the
  "high foreign tension" trigger for the priority engine's
  `high_foreign_tension` (ticket 04) and Foreign Relations' warning treatment
  (ticket 12) both call `isHighTension` / `tensionLabel`, so neither re-derives
  the interpretation.

Consumable from both `04-immediate-priorities-engine` and
`12-foreign-relations-page` via the `@bluewave/campaign-engine` public export,
with no Electron/React dependency.

**RNG note:** the resolved Determinism/RNG audit (ticket 17) found
`resolve_diplomacy`'s `PhaseRegistry` entry is `rngAllowed: false`. Whether M2
adds bounded monthly tension randomness (doc §13.4) is a **resolution-behavior
decision owned by [Advance Month flow](./13-advance-month-flow.md)**, not this
task — flipping the flag would change authoritative resolution, so it is
**not** changed here. This ticket delivers only the label/threshold policy.
(Verified by `packages/campaign-engine/test/tension-label.test.ts`.)

## Notes for the resolving session

- [Determinism/RNG audit](./17-determinism-rng-audit.md) (resolved) found
  `resolve_diplomacy`'s `PhaseRegistry` entry is currently
  `rngAllowed: false`. If monthly tension change (doc §13.4) is meant to
  carry bounded randomness, that's a small additional registry change this
  ticket should make (flip the flag) — not silently assumed available.
