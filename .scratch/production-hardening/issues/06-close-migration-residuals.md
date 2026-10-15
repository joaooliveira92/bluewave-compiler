# 06: Close the migration residuals

**What to build:** the two loose ends the migration left are resolved. The design/construction
validation path no longer changes a reason code on a content-load failure — it returns the sanctioned
typed reason (with a regression test), preserving the wire contract. The `as unknown` assertions in
the design command module are removed, so the unknown-casts ratchet baseline shrinks. No cast, reason
code, or baseline entry is left as a silent exception.

**Blocked by:** 01 — Land the Effect runtime migration on `dev`

**Status:** ready-for-agent

- [ ] A content-load failure on the design/construction validation path returns the original
      sanctioned reason (or a recorded, tested replacement), never a silently collapsed failure.
- [ ] The `as unknown` assertions in the design command module are eliminated; the
      unknown-casts baseline is reduced accordingly and the gate stays green.
- [ ] Byte-identical `BridgeResult` behaviour is preserved for the happy path and each remaining
      failure reason.
- [ ] The change is documented where the previous behaviour differed, so the delta is auditable.
