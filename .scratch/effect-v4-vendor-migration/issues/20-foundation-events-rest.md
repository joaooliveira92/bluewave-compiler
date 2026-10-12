# 20 — Foundation: `events` remainder on Effect `Data`/typed errors

**Type:** implementation
**Status:** done
**Blocked by:** none (15 done)
**Frontier:** no

## What to build

Complete the `@bluewave/events` migration beyond the Wave 2 validation boundary:
adopt Effect `Data`/typed errors across the event envelope/body construction
surface, keeping the package runtime-free and the envelope wire format
unchanged.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-WIRE-3**; Wave 3.
- `packages/events/src/**`.
- `.scratch/effect-v4-vendor-migration/plan.md` §3, §5.1.

## Acceptance criteria

- [x] Event construction/envelope modules use Effect `Data`/`Schema`/tagged
      errors where appropriate; envelope wire format unchanged (`MIG-WIRE-3`).
- [x] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [x] Existing event tests green; `pnpm --filter @bluewave/events test` green;
      `pnpm typecheck` green.

## Notes

- Ticket 10 already converted `events/validation.ts`; this covers the rest of the
  package.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Rescoped to the concrete gap.** `events` is not reachable from the renderer.
Remaining plain throws: `ledger.ts:22,28` (`Error`: duplicate/ordering),
`explanation.ts:15,44` (`TypeError`). Target: `Data.TaggedError` subclasses
(runtime-free, `_tag` = existing code/message prefix; the message text must stay
identical for callers that match it). Envelope wire format unchanged.
Blocked-by corrected: 16–19 are closed, so this follows the Wave 2 exit directly.

### Evidence (2026-10-12)

Added `packages/events/src/errors.ts` with four runtime-free `Data.TaggedError`
classes (`DuplicateEventIdError`, `EventSequenceNotIncreasingError`,
`NonFiniteNumberError`, `EmptyFormulaIdentifierError`), re-exported from the
barrel. `ledger.ts` and `explanation.ts` throw them with the `message` text
carried verbatim from the old plain `Error`/`TypeError`; `envelope.ts` /
`validation.ts` are untouched (`MIG-WIRE-3`). Only `{ Data }` is imported
(`MIG-RUNTIME-1`).

| Check | Result |
| --- | --- |
| `pnpm --filter @bluewave/events test` | 5 files / 40 tests passed (new `errors.test.ts` asserts `_tag`, `name`, fields and exact messages) |
| `pnpm typecheck` | 37/37 |
| `pnpm lint:effect` | 0 errors; no `events` warnings |
| `pnpm check` | EXIT 0 end-to-end; desktop e2e 33 passed |

Reviewer verdict APPROVE (no BLOCKER/HIGH); its MEDIUM finding (the
`NonFiniteNumberError` field named `name` shadowed `Error.name`) was fixed by
renaming the field to `valueName`, and the test now asserts `name`/`_tag` and
exact message strings. Compatibility note: `instanceof TypeError` for the two
explanation preconditions becomes `false` (they are now tagged `Error`s); no
repo consumer matches on `TypeError` or `error.name` for these sites.
