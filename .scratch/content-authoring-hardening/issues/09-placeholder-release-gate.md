# 09: Placeholder release gate

**Type:** implementation
**Status:** open
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
