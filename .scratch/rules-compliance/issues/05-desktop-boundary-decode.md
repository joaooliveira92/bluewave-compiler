# 05: Desktop boundary decode for the project and pack loaders

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** The desktop main process trusts two external boundaries by
cast: the project loader does `JSON.parse(...) as ProjectManifest` and the pack
loader does `JSON.parse(...) as { files… }`. Decode both with the existing strict
schema — the same shapes the compiler already validates — and reject a malformed
project or pack with a typed error instead of admitting a bad shape. A new scoped
`assert-boundary-decode-desktop` gate freezes the rule so a future cast cannot
creep back in.

## Acceptance criteria

- [ ] The project loader decodes the manifest via schema; no boundary
      `JSON.parse(...) as T` cast remains.
- [ ] The pack loader decodes its manifest via schema; no boundary cast remains.
- [ ] A malformed project or pack is rejected with a typed error (stable `_tag`),
      not a silently-cast value.
- [ ] A new `assert-boundary-decode-desktop` gate fails on a boundary-cast fixture
      and passes on the real tree, with a bad-fixture / good-fixture pair.
- [ ] The gate is registered in `run-gates.mjs` and invoked by CI
      (`verify-check-parity` green).
- [ ] Existing desktop main tests stay green.

## Notes

- Sibling of ticket 04's compiler-scope boundary gate; same rule, disjoint scope.
- Reuse the existing content-schema shapes; do not add a parallel schema.
