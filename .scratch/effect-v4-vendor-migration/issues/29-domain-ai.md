# 29 — Domain: `ai` (planner/generator/executor)

**Type:** implementation
**Status:** done
**Blocked by:** none (24 done)
**Frontier:** no

## What to build

Adopt Effect idioms across `@bluewave/ai` (`aiPlanner`, `aiCommandGenerator`,
`aiPhaseExecutor`). The AI policy must stay deterministic; use the full Effect
runtime only where genuine async/IO/orchestration exists — pure planning stays
runtime-free.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-DET-1**; "Runtime-usage policy" (ai listed as orchestration-permitted).
- `packages/ai/src/**`.
- `docs/adr/ADR-0091-live-ai-procurement.md` (AI policy context);
  `.ai/ENGINEERING-CONTRACT.md` (determinism).

## Acceptance criteria

- [x] `ai` uses Effect idioms appropriate to each boundary; any full-Effect use
      is justified by real async/IO/orchestration (`MIG-RUNTIME-1`).
- [x] AI decisions remain deterministic for a fixed seed/inputs; no ambient
      randomness or wall-clock reads (`MIG-DET-1`).
- [x] Generated commands/procurement outcomes unchanged (any hash-surface change
      → ADR note).
- [x] `pnpm --filter @bluewave/ai test` green; `pnpm typecheck` green.

## Notes

- Do not introduce nondeterministic AI behavior; live-AI is a separate ADR-0091
  concern.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Rescoped to runtime-free typed errors.** `ai` is 651 LOC with no async, no
`node:` import and no IO, so `Layer`/`ManagedRuntime` would be "blind wrapping"
(ADR-0100 §2). Findings: plain throws `aiPlanner.ts:36,41,49`,
`aiCommandGenerator.ts:24,37,46,74,131,158`; local SafeInt coercions at
`aiPlanner.ts:36-49` and `aiCommandGenerator.ts:37-46` duplicate
`@bluewave/contracts`. Target: `Data.TaggedError` + reuse `SafeInt`.
`ai` is not renderer-reachable.

### Evidence (2026-10-12)

**Delivered.** Added `packages/ai/src/errors.ts` —
`AiError extends Data.TaggedError("AiError")<{ message: string }>` (imports only
`{ Data } from "effect"`, so the package stays runtime-free per ADR-0100 §2; no
`Layer`/`ManagedRuntime`/"blind wrapping"). Converted all nine plain throws
(`aiPlanner.ts` ×3, `aiCommandGenerator.ts` ×6), preserving every `message`
byte-for-byte. Re-exported `AiError` from `index.ts`; added `effect` to
`packages/ai/package.json`. De-duplicated the hand-rolled SafeInt checks by
routing them through `SafeInt.isSafeInt` from `@bluewave/contracts` (identical
accept/reject to `Number.isSafeInteger`, same messages); no decision, random
draw, timestamp, or hash-surface changed.

| Check | Result |
| --- | --- |
| `rg "throw new (Error\|TypeError\|RangeError)\|throw Object\.assign" packages/ai/src` | no matches |
| `pnpm --filter @bluewave/ai test` | 4 files / 37 tests passed (+13 new `errors.test.ts`) |
| `pnpm --filter @bluewave/ai typecheck` | exit 0 |
| `pnpm typecheck` | 37/37 successful |
| `pnpm lint:effect` | 0 errors (278 pre-existing warnings) |
| `pnpm install --no-frozen-lockfile` | lockfile `+3` for the new `effect` dep; `assert-single-effect` ok |
| `node scripts/verify-no-unknown-casts.mjs` | no new assertions (300 remain; `as unknown` counts unchanged) |

**Residual:** none. The three `aiPlanner` throws (`Invalid SafeInt`, `Not
SafeInt`, `SafeInt overflow sub`) are fail-closed inside `buildBudgetCommand`'s
local `try/catch`, so only the `aiCommandGenerator` throws are reachable from
the public API and are covered directly by `test/errors.test.ts`.

### Hardening follow-up (2026-10-12)

Independent adversarial review returned **ACCEPT** (no findings for ticket 29).
The `SafeInt.isSafeInt` swap was verified accept/reject-identical to
`Number.isSafeInteger` (including `NaN`/`Infinity`); `test/errors.test.ts` drives
the public `AiCommandGenerator` API only. Report:
`.ai/reports/effect-v4-hardening.md`.

