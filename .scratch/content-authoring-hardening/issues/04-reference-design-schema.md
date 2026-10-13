# 04: Reference-design content schema and strict validation

**Type:** implementation
**Status:** done
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** Reference designs are compiled but not schema-validated.
Author a content schema for a reference design (its requirement, hull, machinery
and armament draft shape) and route reference designs through the same strict
validator as every other collection, so a missing required field, a wrong-typed
field or an excess key fails with the file and field path. Keep the existing
duplicate-id and cross-file reference checks.

## Acceptance criteria

- [ ] Every reference-design record is validated by a content schema through the
      strict validator.
- [ ] A missing required field, a wrong-typed field, and an excess key each fail
      with a diagnostic naming the file and the field path.
- [ ] A bad fixture and a positive control exist for each failure class.
- [ ] The production pack still compiles; validation-only wiring does not change
      the artifact body hash.

## Notes

- The reference-design `draft` shape is the drawing board's domain shape; the
  schema must accept the real production designs.
- Reuse the ship-building validation path rather than adding a second loop.
