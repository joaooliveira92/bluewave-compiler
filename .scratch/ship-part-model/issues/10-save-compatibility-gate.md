# 10: Save compatibility 2.0.0 gate and fixture-migration support (P2)

**Type:** implementation
**Status:** open
**Blocked by:** 09
**Frontier:** no
**Requirements:** SPM-R21 (mechanism; activation is ticket 11) · Stories 31, 32, 50

## What to build

When design data changes shape, older saves are refused cleanly instead of being half
translated. This ticket **implements** that refusal but does **not activate** it. The
active compatibility version stays 1.2.0 until ticket 11 switches content and pipeline
in the same change. No supported repository state may have old production content
active while 1.2.0 saves are refused.

- Compatibility is checked before a campaign snapshot or workspace edit log is
  deserialised.
- A mismatched campaign save is refused through the existing
  `PERSISTENCE_COMPATIBILITY_MISMATCH` diagnostic (ADR-0113 §2), which names the
  unsupported data-model version. The file is left byte-identical.
- A mismatched workspace draft is not restored. The workspace starts from the default
  design, and the old draft is left untouched: it is preserved (renamed with its version
  suffix) before anything could overwrite it.
- The 2.0.0 compatibility declaration is defined but not made current. Ticket 11 flips
  it by changing one value.
- Developer fixtures:
  - First, inventory the maintained development fixtures that would need conversion to
    2.0.0.
  - Only if some do, add an offline, explicitly versioned developer tool
    (1.2.0 → 2.0.0) that converts exactly those. It is excluded from the desktop bundle
    and from save loading.
  - If none do, document the tool contract (inputs, versioning, bundle exclusion) and
    write no translation code.
  - Build no general-purpose migration framework either way.

## Acceptance criteria

- [ ] Save-load seam tests run with the 2.0.0 declaration injected as current:
  - a 1.2.0 campaign is refused before decoding, the diagnostic appears and the file's
    bytes are unchanged;
  - a 1.2.0 draft is not restored and is preserved under its renamed path before the
    first new save.
- [ ] With the real current version (still 1.2.0), every existing save and draft test
      passes unchanged.
- [ ] No runtime translation path exists. If the migrator was built, a packaged-bundle
      check proves it is absent from the bundle.
- [ ] The fixture inventory and its outcome (tool built for N fixtures, or contract only)
      are recorded in this ticket's comments.
