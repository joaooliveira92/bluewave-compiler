# 30 — `phase-engine` foundation + orchestration

**Type:** implementation
**Status:** done
**Blocked by:** none (24, 26, 29 done)
**Frontier:** no

## What to build

Adopt the full Effect runtime across the `@bluewave/phase-engine` foundation:
`index`, `registry`, `month`, `monthContext`, `phase-guard`, `snapshotClone`,
`commandLifecycle`, `commandPhases`. This is an orchestration boundary, so
`Effect`/`Layer`/`Context.Service` are permitted; typed errors and `Scope`-based
lifecycle replace ad-hoc failure handling.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-DET-1**; "Runtime-usage policy" (phase-engine is orchestration).
- `packages/phase-engine/src/{index,registry,month,monthContext,phase-guard,snapshotClone,commandLifecycle,commandPhases}.ts`.
- `.ai/ENGINEERING-CONTRACT.md` (state authority, cancellation).

## Acceptance criteria

- [x] The listed modules use Effect `Layer`/`Context.Service`/typed errors as
      appropriate for orchestration (`MIG-RUNTIME-1`).
- [x] Monthly phase execution order and outputs unchanged; deterministic
      behavior preserved (fixed seed/inputs ⇒ identical results) (`MIG-DET-1`).
- [x] Public entry surface remains compatible (facade rule).
- [x] `pnpm --filter @bluewave/phase-engine typecheck` green; focused tests
      green.

## Notes

- Full-Effect use is expected here; keep pure helpers pure.
- Domain phase modules (ticket 31) and battle/replay (ticket 32) are separate.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Rescoped; absorbs 31.** `phase-engine` is 8244 LOC with 0 async, 0 `node:`
imports and 0 IO: it is a synchronous deterministic pipeline, so an Effect
`Layer`/`Context.Service` rewrite would be exactly the "blind wrapping of pure
functions" ADR-0100 §2 forbids, and would add fiber surface to the determinism
spine. Scope: type the 8 throws (`snapshotClone.ts:61,124,595,604,614,636`,
`financial-ledger.ts:33`, `commandLifecycle.ts:524`) with `Data.TaggedError`; the one consumer that catches
`BluewaveError` (`battlePhases.ts:291`) is unchanged.

**Required deliverable:** amend ADR-0100's runtime-usage table so `ai` and
`phase-engine` sit in the runtime-free row, `content-compiler` is listed as an
IO package, and `campaign`'s filesystem read is acknowledged. Not renderer-reachable.
Blocked-by corrected: 25, 27, 28 are closed.

### Evidence (2026-10-12)

**Delivered (code).** Added `packages/phase-engine/src/errors.ts` —
`PhaseEngineError extends Data.TaggedError("PhaseEngineError")<{ message; code? }>`
(imports only `{ Data } from "effect"`; runtime-free — no `Layer`/`Context`/
`ManagedRuntime`/`Effect.run*`). Converted all 8 throws: 6 in
`snapshotClone.ts`, 1 in `financial-ledger.ts`, and the
`Object.assign(new Error(msg), { code })` in `commandLifecycle.ts:524`
(`code`/`message` verbatim). Re-exported from `index.ts`; added `effect` to
`packages/phase-engine/package.json`. The `BluewaveError` consumer at
`battlePhases.ts:291` is untouched.

**Delivered (docs).** Amended ADR-0100 §2's runtime-usage table: `ai` and
`phase-engine` moved to the runtime-free row (no IO), `content-compiler` added
to the IO row (fs-bound), `commands`/`content-schema`/`diagnostics` added to the
runtime-free row, and `campaignInput.ts`'s in-package filesystem read
acknowledged as policy debt (with a dated amendment note).

| Check | Result |
| --- | --- |
| `rg "throw new (Error\|TypeError\|RangeError)\|throw Object\.assign" packages/phase-engine/src` | no matches |
| `pnpm --filter @bluewave/phase-engine test` | 32 files / 314 tests passed (+5 new `errors.test.ts`) |
| `pnpm --filter @bluewave/phase-engine typecheck` | exit 0 |
| `pnpm typecheck` | 37/37 successful |
| `pnpm lint:effect` | 0 errors (278 pre-existing warnings) |
| `node scripts/docs-check.cjs` | ok (126 ADRs indexed) |

**Residual:** none for phase-engine's throws; the ADR table is now accurate.

### Hardening follow-up (2026-10-12)

Independent adversarial review returned **ACCEPT** with one low finding (F1): the
three `as any` casts in `test/errors.test.ts`. **Fixed** — the file now drives
only public APIs (`cloneSnapshot`, `FinancialLedger.append`) with typed fixtures
(a `null` non-null-assertion for the null guard; a self-referential
`politics.shells` for the circular-reference guard) and a direct
`PhaseEngineError` construction for the `code` contract. The private-`walk`
introspection test was removed; the canonical public invalid-transition guard is
now covered by `packages/commands/test/error-consumers.test.ts` via the public
`transitionRecord`. A new `test/error-consumers.test.ts` exercises
`TacticalReplayVerifier.verify`'s fail-closed catch. Report:
`.ai/reports/effect-v4-hardening.md`.

