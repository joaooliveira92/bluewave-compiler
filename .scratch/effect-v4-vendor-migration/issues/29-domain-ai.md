# 29 — Domain: `ai` (planner/generator/executor)

**Type:** implementation
**Status:** open
**Blocked by:** 24 (`commands`)
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

- [ ] `ai` uses Effect idioms appropriate to each boundary; any full-Effect use
      is justified by real async/IO/orchestration (`MIG-RUNTIME-1`).
- [ ] AI decisions remain deterministic for a fixed seed/inputs; no ambient
      randomness or wall-clock reads (`MIG-DET-1`).
- [ ] Generated commands/procurement outcomes unchanged (any hash-surface change
      → ADR note).
- [ ] `pnpm --filter @bluewave/ai test` green; `pnpm typecheck` green.

## Notes

- Do not introduce nondeterministic AI behavior; live-AI is a separate ADR-0091
  concern.
