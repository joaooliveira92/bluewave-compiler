# 21 — Wave 3 exit gate & rollback checkpoint

**Type:** gate
**Status:** done
**Blocked by:** none (20 done)
**Frontier:** no

## What to build

Orchestrator-run acceptance of **Wave 3 — Foundation core** before the domain
core wave begins.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE3-ENTRY,
  MIG-WAVE3-EXIT, MIG-RB-3, MIG-RUNTIME-1, MIG-RUNTIME-2, MIG-GATE-TYPE-1,
  MIG-GATE-UNIT-1**; Wave Plan table row 3.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.

## Acceptance criteria

- [x] Entry gate satisfied: Wave 2 exit met (`MIG-WAVE3-ENTRY`).
- [x] Remainder-`events` migrated (ticket 20); `contracts`, `deterministic`,
      `random`, `armament` verified runtime-free and closed not-needed (16–19);
      no pure package imports `Effect`/`Layer`/`ManagedRuntime`
      (`MIG-RUNTIME-1`, `MIG-RUNTIME-2`).
- [x] `pnpm typecheck` clean under tsgo with `skipLibCheck: true`
      (`MIG-GATE-TYPE-1`).
- [x] Focused package tests green (`MIG-GATE-UNIT-1`); `pnpm check` green.
- [x] Single-copy guard green.
- [x] Rollback point recorded: reverting to the Wave 2 exit state restores a
      green `pnpm check` (`MIG-RB-3`).

## Notes

- On failure, revert Wave 3 to the Wave 2 exit state (ticket 15) and re-open the
  failing ticket; do not proceed to Wave 4.
- This ticket gates the Wave 4 tickets (22–32).

## Comments

### Audit note (ticket 00, 2026-10-12)

Wave 3 shrank to one implementation ticket (20). The gate also re-runs
`node apps/desktop/scripts/check-renderer-bundle.mjs` (with the `~effect/`
marker added by ticket 14) against a fresh `electron-vite build` to prove `MIG-EXCL-1` still holds.

### Gate PASS (orchestrator-run, 2026-10-12)

Evidence in `.ai/reports/effect-v4-wave3-exit-gate.md`.

- **Entry:** Wave 2 exit met (ticket 15).
- **Runtime-free:** `rg` for `Layer`/`ManagedRuntime`/`Context`/`Effect.run*`
  over `packages`/`apps` finds only unrelated domain `Layer` enums; the sole
  `effect` runtime symbol is `Effect.succeed([])` in
  `packages/persistence/src/schemas.ts:50`. `contracts`, `deterministic`,
  `random`, `armament` import no `effect`.
- **Events migrated:** ticket 20 (`80f60f89`) — four runtime-free
  `Data.TaggedError`s, message text verbatim, envelope unchanged.
- **Gates:** `pnpm --filter @bluewave/events test` 5 files / 40 tests;
  `pnpm typecheck` 37/37; `pnpm lint:effect` 0 errors; `pnpm check` EXIT 0
  (e2e 33); single-copy guard ok; renderer bundle clean (no yaml/effect, 20 chunks).
- **Rollback point:** Wave 2 exit state `88de12f9` (verified-green gate commit).
  Reverting the Wave 3 code delta (`packages/events/src/**` +
  `packages/events/test/errors.test.ts`, from `80f60f89`) restores it. The
  ticket-20 commit also carried a whitespace-only reformat of the Wave 2 gate
  report.
