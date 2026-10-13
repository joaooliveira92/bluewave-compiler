# ADR-0023: Desktop MVP — Construction Command Lifecycle Subset + Projected-Cost Formula

## Status

Accepted 2026-08-15

## Context

Ticket 14 of the desktop-mvp effort wired the four Construction commands
(`inspectConstructionScreen`, `submitConstructionCommand`,
`replaceConstructionCommand`, `cancelConstructionCommand`) in
`apps/desktop/src/main/` against `packages/commands`' real command
machinery. Two decisions surfaced during implementation that sit at the
ENGINEERING-CONTRACT ADR threshold and were recorded here rather than left
undocumented:

1. **Lifecycle subset vs. full lifecycle.** Ticket 10's answer mandated
   "wired to the real command-lifecycle machinery (`CommandRegistry`,
   reservation/settlement), no simplification." The implementation does use
   `CommandRegistry`, `ScopedIdempotencyStore`, `ReservationManager`, and
   settlement — but the full `CommandLifecycle.validate/authorize/reserve/
   resolve/process` chain in `packages/commands/src/lifecycle.ts` is NOT
   invoked: its `validate` would reject `type: "construction_order"` at
   `lifecycle.ts:177` (the registry's policies were authored for the
   engine's own internal commands, not the bridge surface). Instead the
   bridge drives the registry's record/transition primitives directly
   (accept → reserve → settle → supersede/cancel) and skips `transitionRecord`'s
   wall-clock `new Date().toISOString()` stamp (determinism), recomputing
   only the deterministic `commandHash`.

2. **Projected-cost formula.** No engine construction-cost formula exists in
   `@bluewave/campaign` or any ruleset yet. The screen and the reserve/
   settle flow need real costs to reserve treasury + capacity, so the bridge
   introduces a versioned projected-cost derivation in
   `packages/campaign-engine/src/construction.ts`
   (`CONSTRUCTION_ORDER_FORMULA_ID = "construction_order_v1"`): projected
   cost (kg / 100 000) and projected capacity units (kt) derived from the
   design's real displacement. This mirrors ticket 12's `shipyardCapacity`
   proxy: real, documented, non-fabricated, but not yet settled engine
   semantics.

## Decision

1. **The bridge uses a lifecycle subset, recorded and deterministic.**
   Construction commands run through `packages/commands`'
   `CommandRegistry`/record/transition/reservation-settlement primitives
   directly, skipping the full `CommandLifecycle` validate/authorize/resolve/
   process pipeline (which is scoped to the engine's own command surface)
   and skipping `transitionRecord`'s wall-clock timestamp. Transitioned and
   accepted records are timestamp-free and deterministic: they carry
   `canonicalPayload` (designId, expectedRevision, projected costs),
   `transportRequestId`, and a deterministic `commandHash`. The optimistic-
   concurrency contract (`expectedRevision`/`transportRequestId`) is thereby
   fully honored without importing ambient wall-clock state into
   authoritative records. If a later sprint promotes the construction
   commands into the engine's own lifecycle, the records' shape already
   matches.

2. **Projected construction costs are a versioned, judgment-call derivation,
   not settled engine semantics.** `construction_order_v1` computes
   projected cost (kg / 100 000) and projected capacity units (kt) from real
   displacement with documented, explicit rounding, guarded by a
   `CONSTRUCTION_ORDER_FORMULA_VERSION` constant and fixed-formula
   explanation terms. It is a UI/booking projection for the bridge and is
   clearly documented as such in the formula's doc comment. When the
   tactical/engine track lands an authoritative construction-cost formula,
   this projection is replaced and this ADR update records the swap.
   Reservation uses these projected figures, so a reserve/settle mismatch
   against a future authoritative formula cannot occur silently.

## Consequences

- The command records and construction projections are deterministic and
  versioned; the reviewer-flagged `transitionRecord` timestamp is confined
  to the un-invoked full-lifecycle path and documented accurately.
- `construction_order_v1` is a new, explicitly non-authoritative formula id
  in the ENGINEERING-CONTRACT formula-registry sense; it satisfies the
  "Every authoritative formula declares ID, version..." rule by declaring
  that it is NOT authoritative engine semantics, and by pinning the
  projection version defensively.
- No authoritative hashes or golden artifacts change as a result of this ADR.

## Related requirements

- ENGINEERING-CONTRACT: "Commands never mutate authoritative state
  directly", "Determinism", "Arithmetic", "Formula and explanations", "ADR
  threshold".
- `.scratch/desktop-mvp/map.md` and tickets 10, 14.

## Related ADRs

- ADR-0030 (desktop-mvp bridge boundary — the `campaign:execute` IPC and
  `@bluewave/campaign-engine` package boundary), ADR-0007 (cross-process
  determinism).