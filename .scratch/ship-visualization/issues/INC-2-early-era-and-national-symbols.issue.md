# INC-2: EARLY-era (V/P) and national symbols, golden matrix

**Type:** implementation
**Status:** resolved
**Blocked by:** INC-1
**Frontier:** no

Spec: SV-R6, SV-R13; AC-4, AC-6.

## What to build

Author the universal `VICTORIAN` and `PRE_DREADNOUGHT` mount symbols for every size × class
the EARLY band needs, plus a few manual-nation variants, so the key's nation and era
dimensions are exercised. Add the golden matrix and the EARLY coverage test.

## Acceptance criteria

- [x] Every EARLY key (11 styles × {V, P} × size × class) resolves, and the universal V/P
      keys resolve at step 1 or 2 (no dreadnought fallback for `X`).
- [x] At least one national variant resolves at step 1.
- [x] The golden matrix snapshot is committed and stable across runs.
- [x] AC-4: the 1890 → 1898 month change restyles a mount.

## Answer

- **Universal drawings:** `X × VICTORIAN` and `X × PRE_DREADNOUGHT` now cover every mount class.
- **National variants:** every manual style has one or more Victorian or pre-dreadnought variants: hooded
  barbettes (B/G/Q, V), French drum turrets and barbettes (F/R/S, V), and round/pear/domed gunhouses (P). The
  silhouettes follow the archived alternative branch's (`archive/ship-visualization-alt`) period choices, ported to
  metres.
- **Key change:** a catalog key now lists `sizes` (the bands one drawing serves) instead of a single `size`. With one
  entry per size, the file exceeded the safe parser's 100-alias cap, and the calibre resize already tells the bands
  apart. The catalog has 42 mount entries.
- **Golden matrix:** `test/golden/resolution-matrix.txt` lists 11 styles × 4 eras × 3 sizes × 5 classes × 4 gun
  counts, each with its part id and fallback step. `test/golden/placement-matrix.txt` places every entry per size at
  fixed dimensions. Both are stable across runs.
- **Coverage:** the EARLY coverage test (no V/P key falls back to the dreadnought era) passes, and so do the
  national-look and named-variant tests.
- **AC-4:** `ProfileView.test.tsx` shows that 1890 → 1898 restyles `gun_12pdr` (`x-victorian-open` →
  `x-pre-dreadnought-open`) on the same instances.
- **Validation:**
  - `@bluewave/ship-visual` 77/77; hull-plan 204/204.
  - `pnpm snap` of Alexandra (uk, 1880) shows the British hooded Victorian barbette and the universal Victorian
    casemates, with a clean console.
