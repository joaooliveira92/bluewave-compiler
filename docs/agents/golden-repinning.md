# Golden hash re-pinning

Goldens are the cross-process determinism proof (ADR-0007): `golden/hashes.json`
records the canonical hashes of the reference runs. A change to authoritative
behaviour changes those hashes; that is expected and allowed — but it must be
**deliberate and reviewable**, never a silent side effect.

## When to re-pin

Only when you intend to change authoritative behaviour (a tuning change, a content
change, a bug fix in resolution). A hashing change with no behavioural cause is a
regression — investigate, do not re-pin.

## Procedure

1. Run the determinism path and confirm the failure is the expected set:
   `node scripts/verify-golden-hashes.cjs`.
2. Confirm the cause is a code/content change you made, not nondeterminism: run the
   cross-process child twice (`node scripts/cross-process-test/dist/run-child.js`)
   and check the two processes agree before re-pinning.
3. Re-pin: `node scripts/regenerate-golden-hashes.cjs`.
4. Review the diff: every changed hash should be explainable by the change. If a
   baseline moved that your change should not have touched, stop.
5. State the re-pin in the ADR / sprint report with the old→new hash pairs
   (the form used in ADR-0053/ADR-0094).

## Guard

`pnpm check` and CI run `verify-golden-hashes.cjs` plus a cross-process
determinism proof. `verify-golden-repin.mjs` additionally fails any commit that
edits authoritative source without re-pinning `golden/hashes.json` in the same
commit; a deliberate no-output change records a `Golden-Repin: not-needed`
trailer. Pre-guard history is grandfathered via `scripts/golden-repin.baseline`.

The guard is scoped to the reference run's inputs (`run-child.ts`): authored
`content/**` is exempt, as is the reference-inert dock plumbing in
`REFERENCE_RUN_EXEMPTIONS` (ADR-0136); other package source stays gated.
