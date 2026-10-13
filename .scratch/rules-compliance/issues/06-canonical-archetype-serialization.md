# 06: Canonical archetype serialization

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** Campaign archetype selection is serialized with raw
`JSON.stringify`, so its byte shape depends on object insertion order rather than
the canonical contract. Route it through the canonical serializer so the bytes
are defined by the serializer, not by how a literal happened to be written. Ship
an `assert-canonical-serialization` gate that fails on raw `JSON.stringify` in the
authoritative roots, allowlisting the canonical serializer itself and any reviewed
exception.

## Acceptance criteria

- [ ] Archetype selection serialization goes through the canonical serializer;
      identical selections produce identical bytes regardless of key order.
- [ ] No golden or hash changes for existing campaigns.
- [ ] A new `assert-canonical-serialization` gate fails on a raw-`JSON.stringify`
      fixture in an authoritative root and passes on the real tree, with a
      bad-fixture / good-fixture pair.
- [ ] The gate is registered in `run-gates.mjs` and invoked by CI
      (`verify-check-parity` green).
- [ ] Affected campaign-engine tests stay green.

## Notes

- Respects the ENGINEERING-CONTRACT serialization rule ("never treat JavaScript
  insertion order as the canonical contract").
