# INC-3 — Fire Solution + Salvo + Friendly-Fire Safety

**Type:** implementation
**State:** open
**Blocked by:** INC-2
**Frontier:** no

## Acceptance (spec AC-9..AC-11, AC-19)

- §10 fire-solution quality: `clamp(0, 10_000, floor(baseSolutionBp * Π11 multiplierBp / 10_000^10))` —
  explicit 11-factor manifest (range, bearing, target motion, own maneuver, crew,
  training, sea state, visibility, technology, damage, + base), exact integer product,
  ONE `FLOOR`; missing factor → `TORPEDO_FIRE_SOLUTION_FACTOR_MISSING` (never silent
  10_000); inputs are the firing side's knowledge estimates only
  (`test/torpedo/fire-solution.test.ts`).
- §10 minimums as shipped constants: automated `5_000`, Captain manual `4_000`, area/
  spread doctrine `3_000`, friendly-danger-sector `7_500` or prohibited; player may
  accept lower quality only to the Captain minimum (`test/torpedo/fire-solution.test.ts`).
- §11 salvo: exact tube ids, ≤ physical tube count, deterministic salvo policy over the
  9 §11 factors (authored constants), atomic ammunition reservation before any tube
  fires (`test/torpedo/salvo.test.ts`).
- §24 friendly-fire safety: danger sector from legal contact estimate + uncertainty +
  spread + range + friendly tracks; prohibited when confirmed friendly inside sector
  below `1_000` m minimum predicted separation; unidentified/low-confidence contact
  raises minimum solution quality; manual authority does not waive it
  (`test/torpedo/friendly-fire.test.ts`).

## Hints

Mirror `gunnery/accuracy.ts` (integer product + one FLOOR + factor-missing). The
friendly-fire separation is integer metres; solution quality is integer bp.