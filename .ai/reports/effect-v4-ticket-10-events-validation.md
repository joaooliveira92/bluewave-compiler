# Validation Report: EFFECT-V4 ticket 10 — `events` validation Effect Schema boundary

## Outcome

`PASS`

## Scope delivered

Ticket `.scratch/effect-v4-vendor-migration/issues/10-boundary-events-validation.md`
(Wave 2). `packages/events/src/validation.ts` migrated atomically from Zod to
Effect Schema; `zod` removed from `packages/events/package.json`, `effect` added.
Proves **MIG-ZOD-1, MIG-WIRE-3, MIG-RUNTIME-1**.

- `nonEmptyString` (`z.string().trim().min(1)`) → `Schema.Trim.check(Schema.isMinLength(1))`
  (trims then checks: whitespace-only is rejected exactly as Zod, output trimmed).
- `safeInt` → `Schema.Finite.check(Schema.isInt(), Schema.isBetween({MIN_SAFE_INTEGER,
  MAX_SAFE_INTEGER}))`; `nonNegativeSafeInt` adds `Schema.isGreaterThanOrEqualTo(0)`.
- `timestamp: z.string().datetime({ offset: true })` → a **string-preserving**
  `Schema.isPattern(DATETIME_OFFSET_RE)`, the regex ported verbatim from Zod v4's
  `dateSource`/`timeSource`/`datetime({offset:true})` (never a `DateTime` object).
- `discoveryMonth` `YYYY-MM` pattern preserved (with the original Zod message).
- 7 tagged `Schema.Struct` bodies; `DomainEventBodySchema = Schema.Union([...])`.
- Envelope `superRefine(eventType === body.kind)` → `.check(Schema.makeFilter(...))`
  with the identical message.
- `parseDomainEventBody` / `parseDomainEventEnvelope` decode via
  `Schema.decodeUnknownSync(schema, { onExcessProperty: "error" })`, signatures and
  casts unchanged. Runtime-free (`Schema` only).

## Requirements evidence

| Requirement                           | Implementation                                      | Proving test / evidence                                                                                               |
| ------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| MIG-ZOD-1                             | `validation.ts` on Schema; `zod` removed            | `rg '"zod"\|from "zod"' packages/events` → empty; `pnpm --filter @bluewave/events test` 36 passed                     |
| MIG-WIRE-3                            | union + `eventType === body.kind`; string timestamp | `validation.test.ts` mismatch/excess/timestamp tests; byte-compat serialization test pins the exact JSON Zod produced |
| MIG-RUNTIME-1                         | only `Schema` imported                              | grep: no `Effect`/`Layer`/`ManagedRuntime` in `packages/events`                                                       |
| parity (trim, range, datetime, union) | `Schema.Trim`/`Finite`/`isPattern`/`Union`          | 14 total tests incl. whitespace-only, safe-int range, ISO offset matrix, nested excess                                |

## Commands and observed results

```text
pnpm -w turbo run build --force              -> 20 successful / 20 total (uncached), exit 0
pnpm -w turbo run typecheck --force          -> 37 successful / 37 total (uncached), exit 0
pnpm check                                   -> EXIT 0 (preflight, format, lint, lint:effect 0 errors,
                                                licenses, typecheck, build, test:run 241 files/1554 tests,
                                                balance-reports, e2e 30 passed)
node scripts/verify-golden-hashes.cjs        -> All 10 hashes match golden reference
pnpm test:cross-process (run 1)              -> {"success":true, ...}
pnpm test:cross-process (run 2)              -> identical; diff run1/run2 = BYTE-IDENTICAL
pnpm --filter @bluewave/events test          -> 4 files / 36 tests passed
rg '"zod"|from "zod"' packages/events        -> no matches
```

Adversarial reviewer verdict: **APPROVE** (no BLOCKER/HIGH; 4 LOW advisory). The
reviewer independently reconstructed the old Zod schema and diffed accept/reject
over 49 structured cases plus 500 k random / ~10 M structured timestamp strings →
**0 mismatches**; confirmed the ported regex is a source-string match to Zod v4's;
confirmed `canonicalSerialize` is key-order-insensitive so `EventLedger.hash()` is
unaffected by schema key ordering. One LOW (a misleading ADR reference in a
comment) was repaired.

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Initial snapshot hash: `16708259cc8018447fbe3c88c2ddfb737a27c3e51e8892c9b5fa112f6be896a5`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Command ledger hash: `48fa215feeaea217c0f3906ebf99c3deddb8697eb6090dd6ae3fa84ea3841a20`
- Event ledger hash: `26af2cf3b853a824b98cb33af1d85086748b2848253538f8986e38f014c20ee5`
- Financial ledger hash: `b5b481d9de8ab2d165920cfe61c1d4baa8440b5ca81b90fc41b121fa99fbbf7a`
- Random-decision ledger hash: `cb9e67f9a76ac4c5cc79f85eade020775beaef9053d1f4c0d6ff19eb3100f678`
- Replay result: `replayVerificationHash 097f9929…`, `"success": true`
- Battle-generation hash: `dcdb85c43321b44523b881ccd12623d1689455f060b5d98487850184bbdcb9b6`
- Processes and operating systems used: two child processes, macOS (darwin-arm64), Node per repo engine

Goldens 10/10 **unchanged**. Determinism gate deprecated (ADR-0103); run and
reports unchanged.

## Canonical artifact changes

None. Event-envelope wire shape, field names, ordering and timestamp semantics
unchanged; existing fixtures serialize to the same bytes.

## Tests added

- `packages/events/test/validation.test.ts`: kept 5 existing tests; added 9 parity
  tests (trim/whitespace-only, safe-int range + non-finite, timestamp ISO matrix
  accept/reject, discriminated-union decode of every member, byte-compatible
  envelope serialization, nested-body excess).

## Security and cancellation

Trust boundary unchanged; strict excess-key rejection preserved (previous
`.strict()`), `onExcessProperty: "error"` at the boundary. No new ambient I/O;
runtime-free.

## Performance observations

None material.

## ADRs and dependencies

- No new ADR; adopts ADR-0105's strict `onExcessProperty: "error"` policy (noted
  in the file). Dependencies: `effect` added (`workspace:*`), `zod` removed from
  `packages/events`.

## Known limitations and deferred requirements

- The strict-option constant is declared locally (events does not depend on
  `content-schema`); a shared runtime-free helper is a possible later cleanup
  (reviewer LOW 2). The `nonNegativeSafeInt` failure message text differs from
  Zod's (accept/reject parity preserved; unasserted) (reviewer LOW 3).

## Changed files

- `packages/events/src/validation.ts`, `packages/events/test/validation.test.ts`,
  `packages/events/package.json`, `pnpm-lock.yaml`.
- Traceability: ticket 10, `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`, this report.
- (Also included: formatting fix to `.ai/reports/effect-v4-ticket-08-content-schema.md`.)

## Git and remote status

- Branch: `dev`
- Commits: see the accompanying
  `feat(events): migrate domain-event validation to Effect Schema (ticket 10)`
  commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Independently re-ran the forced build (20/20), forced typecheck (37/37), the full
`pnpm check` (EXIT 0 incl. e2e 30), golden verify (10/10), and two
`test:cross-process` runs (byte-identical, `success:true`). Confirmed no `zod`
remains in `packages/events`, the package is runtime-free, and no consumer uses
the exported `*Schema` objects via `.parse`/`.safeParse`.
