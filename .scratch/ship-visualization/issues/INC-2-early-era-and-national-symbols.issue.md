# INC-2: EARLY-era (V/P) and national symbols, golden matrix

**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** yes

Spec: SV-R6, SV-R13; AC-4, AC-6.

## What to build

Author the universal `VICTORIAN` and `PRE_DREADNOUGHT` mount symbols for every size × class
the EARLY band needs, plus a few manual-nation variants, so the key's nation and era
dimensions are exercised. Add the golden matrix and the EARLY coverage test.

## Acceptance criteria

- [ ] Every EARLY key (11 styles × {V, P} × size × class) resolves, and the universal V/P
      keys resolve at step 1 or 2 (no dreadnought fallback for `X`).
- [ ] At least one national variant resolves at step 1.
- [ ] The golden matrix snapshot is committed and stable across runs.
- [ ] AC-4: the 1890 → 1898 month change restyles a mount.
