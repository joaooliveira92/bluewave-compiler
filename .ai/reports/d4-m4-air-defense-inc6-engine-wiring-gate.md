# D-4 INC-6 — Air-defense engine wiring + two-process + gate

Date: 2026-10-06 · Verdict: **PASS** · Ticket: `.scratch/d4-m4-air-defense/issues/06-engine-wiring-two-process-gate.md`

## Delivered

- `packages/combat/src/air-defense/engineWiring.ts` — `resolveAirDefense` step-7.8 stage
  (ADR-0042 decision 21).
- `packages/combat/src/simulation/engine.ts` — optional `airDefense` context on
  `AdvanceMinuteInput`/`AdvanceMinutesInput`; `airDefenseRecords`/`airDefenseStates` on
  `MinuteResult`; snapshot surface only when records exist; per-defender state threading.
- `packages/combat/src/index.ts` — air-defense barrel exported from the package root.
- `packages/cross-process-test/src/run-air-defense-child.ts` + cross-process test.

## Acceptance

| AC    | Evidence                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| AC-18 | `combat/test/air-defense/integration.test.ts` — absent/empty context hashes equal baseline; records, ammo threading, determinism |
| AC-19 | `cross-process-test/test/cross-process.test.ts` "Air-defense cross-process determinism" — two child runs identical, records > 0  |
| AC-20 | integration test boundary checks; `resolver.ts` / `strength.ts` untouched (`git diff` empty)                                     |

## Validation gate

```
pnpm turbo run build --force          18/18 successful
npx tsc -b                            clean
pnpm lint / pnpm format               clean
pnpm -r exec vp test run              all green — combat 3603, desktop 528, cross-process 6/6 file
node scripts/verify-golden-hashes.cjs All 10 hashes match golden reference
```

## Limitation (recorded, ADR-0045)

Like the air-combat stage, air defense is reachable through `advanceMinutes` but no
campaign battle builds an `airDefense` context yet; campaign reachability is Track P work.
