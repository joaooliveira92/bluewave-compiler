**Type:** implementation
**Status:** closed
**Blocked by:** INC-1..INC-7
**Frontier:** no

# INC-8: Records + ordering + reason codes (§§29-31)

## Deliverable

- `CarrierOperationRecord` — immutable record per §29
- Canonical ordering per §30
- All 21 §31 reason codes shipped, set-equality guard
- `NO_DEFERRED_REASON_CODES` marker

## Acceptance criteria

AC-31 (records), AC-32 (ordering), AC-33 (reason codes).

**DONE 2026-08-29 — PASS.** Combat 222 files / 2992 tests green. Build 18/18. tsc -b clean.