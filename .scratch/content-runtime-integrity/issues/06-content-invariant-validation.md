# 06 — Extend compile validation: graph and reference invariants

**Type:** implementation
**Status:** open (partial — 2 of 6 invariants landed; 3 deferred, see Comments)
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

## Comments

**Partial — graph invariants landed; three invariants deferred (no content model
to validate against).**

Landed in `packages/content-compiler/src/stages/validate.ts`:

- **CRI-INV-1 (cycles).** The technology prerequisite graph is now checked with a
  DFS cycle finder that reports one concrete cycle and names its members; the
  diagnostic carries the offending source file, the cycle members as
  `relatedLocations`, and a remediation (`TECHNOLOGY_PREREQUISITE_CYCLE`). The
  ship-component `upgradePath` graph gets the same treatment
  (`COMPONENT_UPGRADE_CYCLE`). The previous Kahn pass named only residual nodes
  (including downstream-of-cycle nodes) and carried no file/field path.
- **CRI-INV-2 (self-reference).** A technology that lists itself as a
  prerequisite and a component that lists itself in its `upgradePath` now fail
  with `SELF_REFERENCE` (file + entity + remediation). Previously the self-edge
  was silently skipped.
- **CRI-INV-6 (paired tests).** Each landed invariant has a bad fixture and a
  positive control: technology cycle (bad) + acyclic chain (positive); component
  upgrade cycle (bad) + acyclic upgrade chain (positive); technology self-ref
  (bad); component upgrade self-ref (bad). The production pack still compiles
  (`content:check` green, artifact hash unchanged `b54fd387…`), which is the
  full-surface positive control.

**Deferred (grounded: the fields/catalogue do not exist yet).**

- **CRI-INV-3 (localization keys).** The only localization-key field in the
  content model is `Nation.displayNameKey` (`packages/content-schema/src/nation.ts`);
  there is no localization catalogue, locale file, or resolver anywhere in the
  repo (recon confirms none). "A missing key fails validation" cannot be proven
  without a catalogue, and introducing one is explicitly out of scope ("an
  i18n/localization framework … does not introduce a localization system").
  Deferred until a key catalogue exists.
- **CRI-INV-4 (asset references).** No content-schema field references an asset;
  assets are owned by the renderer (`nationAssetManifest.ts`) and resolve at
  runtime to an `unavailable` state. There is nothing to resolve at compile time.
  Deferred until content carries asset references.
- **CRI-INV-5 (deprecated identifiers).** No deprecation/migration mechanism or
  mapping exists for content identifiers. The `remediation` diagnostic field is
  the ready hook, but an empty mechanism would be speculative generality.
  Deferred until a deprecation mapping is introduced (versioned ruleset
  constant or content file) and there is a real renamed id to migrate.

These deferrals are recorded, not silently dropped (AGENTS.md). Re-scope CRI-INV-3/4/5
as a follow-up once the content model gains the corresponding fields.

Tests: content-compiler 24 (was 18; +6 invariant tests). Production pack
`content:check` green; artifact byte-stable.