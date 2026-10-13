# 09: Placeholder release gate

**Type:** implementation
**Status:** resolved
**Blocked by:** 08 — Provenance field and `content:check` confidence report
**Frontier:** no

**What to build:** A release gate that fails when a shipping pack still carries an
unresolved placeholder (or otherwise-flagged) value, unless the value is on a
small, recorded, justified allowlist. This turns the "replace before release"
README lists into machinery.

## Acceptance criteria

- [ ] The gate fails a shipping pack that contains an unresolved placeholder
      value.
- [ ] The failure names the offending collection, record and field.
- [ ] A value on the recorded allowlist does not fail the gate, and each
      allowlist entry carries a justification.
- [ ] A pack with no placeholders passes.
- [ ] The gate is part of the preflight/CI path for release builds.

## Resolution

- `checkPlaceholderGate` / `collectPlaceholders` in `@bluewave/content-compiler`
  walk the compiled bundle for provenance records whose `sourceStatus` is
  `PLACEHOLDER` and name the collection, record id and nested field path.
- `content:gate` enforces it for shipping (`type: production`) packs, reading the
  committed `placeholder-allowlist.json` next to the pack; a non-production pack
  is skipped. An unresolved placeholder fails with a `PLACEHOLDER` diagnostic; an
  allowlist entry is admitted only with a non-empty justification.
- Committed `content/production/1880/placeholder-allowlist.json` (currently
  empty) records the admitted set.
- Wired into `pnpm preflight` as the `content placeholder gate` gate
  (`scripts/verify-content-gate.mjs`), so local green implies CI green.
- ADR-0147 records the decision.

Validation: `@bluewave/content-compiler` `releaseGate.test.ts` (5 tests) and
`@bluewave/compiler-cli` `content-gate.test.ts` (4 tests); `pnpm preflight` green
(17 gates).

