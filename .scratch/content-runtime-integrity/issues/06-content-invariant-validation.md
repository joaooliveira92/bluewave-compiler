# 06 — Extend compile validation: graph and reference invariants

**Type:** implementation
**Status:** open
**Blocked by:** 02
**Frontier:** no

## What to build

Compile-time validation additionally proves content-level invariants beyond
duplicate IDs and entity references:

- prerequisite / unlock graphs are acyclic;
- a design cannot require itself;
- localization keys referenced by content exist;
- asset references resolve;
- deprecated identifiers are rejected (or migrated where a mapping exists).

Each failure yields a diagnostic naming the offending file and field path.

Today some of these are proven only inside the ship-design release-nation
completeness check; this ticket lifts the generic ones into the compiler so every
pack — not just release nations — is covered.

## Acceptance criteria

- [ ] A cyclic prerequisite / unlock graph fails validation with a diagnostic
      naming the cycle.
- [ ] A self-referential requirement fails validation.
- [ ] A missing localization key referenced by content fails validation.
- [ ] A dangling asset reference fails validation.
- [ ] A deprecated identifier is rejected with a migration hint, or auto-migrated
      where a mapping exists.
- [ ] Each invariant has a bad-fixture test and a positive control (valid content
      still passes).

## Notes

- Grounds on the national content pipeline's completeness validator (which
  already proves several of these for release nations) and the content-package
  contract's "structurally valid is not necessarily valid content" rule.
- Keep the generic checks in the compiler/store boundary, not duplicated per
  feature. Prefer reusing the existing domain-completeness logic where it already
  exists rather than re-implementing it.
- Depends on 02 (the compiled surface must exist for the invariants to run
  against both collections and ship-building).