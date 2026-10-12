# 10 — Boundary: `events` validation Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** done
**Blocked by:** 07 (Wave 1 exit)
**Frontier:** no

## What to build

Migrate `@bluewave/events` domain-event validation from Zod to Effect Schema
atomically, preserving the event-envelope wire format exactly (including the
`eventType === body.kind` cross-field rule and discriminated union).

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-ZOD-1, MIG-WIRE-3**;
  Wave 2.
- `packages/events/src/validation.ts`; `packages/events/src/envelope.ts`.
- `.scratch/effect-v4-vendor-migration/plan.md` §4.1–§4.3.

## Acceptance criteria

- [x] `packages/events/src/validation.ts` converted to Effect Schema; `zod`
      import and dependency removed; no dual definition (`MIG-ZOD-1`).
- [x] The discriminated union over `kind` and the `eventType must match
      body.kind` refinement are preserved with identical accept/reject behavior
      (`MIG-WIRE-3`).
- [x] Event-envelope serialization tests prove byte-compatible envelopes
      (`MIG-WIRE-3`).
- [x] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [x] `pnpm --filter @bluewave/events test` green; `pnpm typecheck` green.

## Notes

- Do not change event envelope field names, ordering, or the `YYYY-MM` timestamp
  regex semantics.

## Comments

**DONE 2026-10-11 — PASS (orchestrator pipeline).** `validation.ts` fully on
Effect Schema; `zod` removed from the package, `effect` added. `nonEmptyString`
→ `Schema.Trim.check(Schema.isMinLength(1))` (trims then checks, so
whitespace-only is rejected exactly as Zod); `safeInt`/`nonNegativeSafeInt` →
`Schema.Finite.check(isInt, isBetween, isGreaterThanOrEqualTo)`; `timestamp`
`datetime({offset:true})` ported **verbatim** from Zod v4's regex as a
string-preserving `isPattern` check (never a `DateTime` object); union +
`eventType === body.kind` filter preserved with the identical message. Reviewer
APPROVE (4 LOW advisory; comment wording repaired). Reviewer independently
diffed accept/reject vs the real Zod over 49 structured cases + 500k/10M-string
timestamp regex fuzz → **0 mismatches**. Gate: build 20/20 uncached, typecheck
37/37 forced, `pnpm check` EXIT 0 (format/lint/lint:effect/licenses/test:run
241 files/1554 tests/balance/e2e 30), goldens 10/10, cross-process
byte-identical `success:true`. Report
`.ai/reports/effect-v4-ticket-10-events-validation.md`.
