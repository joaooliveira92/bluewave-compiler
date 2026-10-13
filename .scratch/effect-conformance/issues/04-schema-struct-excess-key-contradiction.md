# Resolve Schema.Struct excess-key contradiction (probe)

**Type:** prototype
**Status:** open
**Blocked by:** none

## Question

`agent-patterns/effect-idioms.md` claims "`Schema.Struct` is closed by default (excess
keys rejected), matching Zod `.strict()`." ADR-0104 §3 and ADR-0105 §2 claim the
opposite: `Schema.Struct` **strips** excess keys on decode, and strict rejection comes
only from the `{ onExcessProperty: "error" }` decode option. At most one is true.

Build a cheap, executable probe under `prototype/` (or `.scratch/`) against the
vendored `vendor/effect` to settle the real `effect@4.0.2` behaviour:

1. Decode `{a, extra}` through a plain `Schema.Struct({a})` — is `extra` stripped,
   kept, or rejected?
2. Same with `{ onExcessProperty: "error" }` — rejected?
3. Confirm against vendored `packages/effect/src/Schema.ts` and its tests.

Then decide the disposition: fix the code, fix the doc (`effect-idioms.md`), fix the
ADRs, or some combination — recording which authority (vendored behaviour) proved it.
Record the probe as an asset linked from this ticket.

## Answer

_(empty)_
