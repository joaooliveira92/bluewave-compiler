# 07: Decode the verified bundle at the artifact boundary

**Type:** implementation
**Status:** resolved
**Blocked by:** 04 — Reference-design content schema and strict validation; 05 — Campaign-file schemas — fleets, constructions, designs; 06 — Campaign-file schemas — economies, research, diplomacy
**Frontier:** no

**What to build:** The runtime consumer verifies the artifact by hash and then
asserts the decoded shape. Replace the assertions with schema decode so the
boundary's type is earned: a bundle that verifies by hash but no longer matches
its schema fails closed with a stable code, and no unchecked cast remains at that
boundary.

## Acceptance criteria

- [ ] The verified bundle is decoded through the content schemas; no
      `as unknown` assertion remains at the artifact boundary.
- [ ] A bundle that passes the hash check but violates a schema fails closed with
      a stable, actionable code.
- [ ] Existing artifact consumers (campaign compile, new-game options,
      ship-building content) behave identically on valid content.
- [ ] A tampered or schema-invalid artifact cannot reach month execution.
- [ ] The no-unknown-casts baseline is reduced accordingly.
