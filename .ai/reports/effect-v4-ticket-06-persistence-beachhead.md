# Validation Report: EFFECT-V4 ticket 06 — `persistence` beachhead (Schema save boundary + tagged errors)

## Outcome

`PASS`

## Scope delivered

Ticket `.scratch/effect-v4-vendor-migration/issues/06-persistence-beachhead.md`
(Wave 1 beachhead; proves MIG-ZOD-1, MIG-WIRE-1, MIG-WIRE-4, MIG-WAVE1-EXIT).
The `@bluewave/persistence` save boundary adopted Effect, wire-frozen:

- `packages/persistence/src/schemas.ts` migrated Zod → **Effect Schema**
  (`Schema.Struct`/`Record`/`Array`/`String`/`Finite`/`Unknown`/`optional`;
  `.default([])` → `Schema.withDecodingDefaultType(Effect.succeed([]))`;
  `parse`/`safeParse` → `Schema.decodeUnknownSync`/`decodeUnknownResult`).
  **No `zod` import remains and the `zod` dependency is removed** from the package.
- New `packages/persistence/src/errors.ts`: the five `PERSISTENCE_*` codes as
  in-process `Data.TaggedError` classes (`_tag` = the code) with
  `toDiagnostic()` projecting byte-identically to the collector's
  `addError`/`addWarning`. **The `DiagnosticCollector` public contract is
  retained** (adoption ticket 06 deferred that decision, recorded in ADR-0104).
- `store.ts`/`recovery.ts`/`compatibility.ts`: decode sites switched to Effect
  Schema; `CompatibilityChecker` routes through the tagged error internally with
  identical collector output. IO, atomic tmp→rename→pointer, `AbortSignal`, and
  `error.name === "AbortError"` semantics are **unchanged**.
- **ADR-0104** records the beachhead scope (Schema boundary, tagged errors added
  not substituted, collector retained, raw sync IO kept — async Effect platform
  FileSystem would break the synchronous public API, wire frozen).

Deferred (recorded): an async Effect-`platform` IO rewrite behind the facade and
routing the remaining public failure sites through the tagged vocabulary (both
compatible with this change).

## Requirements evidence

| Requirement    | Implementation                                               | Proving test / evidence                                                                                                                                                          |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIG-ZOD-1      | `schemas.ts` on Effect Schema; `zod` removed                 | `rg zod packages/persistence` → none; `package.json` has `effect: workspace:*`                                                                                                   |
| MIG-WIRE-1     | `errors.ts` tagged classes; codes survive                    | `errors.test.ts`: `_tag === code`; `toDiagnostic()` byte-identical to `addError`/`addWarning`                                                                                    |
| MIG-WIRE-4     | round-trip proof                                             | `schema-serialization.test.ts`: real on-disk `campaign.json` decodes and `canonicalSerialize(decoded) === canonicalSerialize(parsed)`, envelope/rawHash gates pass, save reloads |
| MIG-WAVE1-EXIT | cancellation/rollback preserved; API compatible; check green | save path diff is decode-sites only; abort/rollback byte-identical; `pnpm check` EXIT 0                                                                                          |
| Wire parity    | Zod-v4 semantics pinned                                      | excess-key strip parity, `.default([])` parity, optional parity, **non-finite rejection parity** (`Schema.Finite`)                                                               |
| MIG-GRAPH-1    | single copy                                                  | `assert-single-effect.mjs` exit 0; importer links `../../vendor/effect`                                                                                                          |

## Commands and observed results

```text
pnpm --filter @bluewave/persistence typecheck -> exit 0
pnpm --filter @bluewave/persistence test      -> 8 files / 64 tests passed (was 6 / 55); exit 0
rg "zod" packages/persistence                 -> no matches
node scripts/assert-single-effect.mjs         -> ok (no registry effect; workspace:vendor/effect); exit 0
pnpm check                                    -> EXIT 0 end-to-end (preflight, format, lint, lint:effect, licenses, typecheck, build, test:run, balance-reports, e2e 30 passed); docs-check 330 links / 103 ADRs
node scripts/verify-golden-hashes.cjs         -> All 10 hashes match golden reference; exit 0
pnpm test:cross-process                       -> {"success":true, ...}; exit 0
```

Adversarial reviewer verdict: **NEEDS_REWORK → repaired → PASS**. The reviewer's
HIGH finding was a genuine fail-closed parity break: Zod v4 `z.number()` rejects
`NaN`/`Infinity`/`-Infinity`, but `Schema.Number` accepts them (so a crafted save
with `1e400` would no longer be refused at structural validation). Repair: all
seven numeric fields mapped to `Schema.Finite` (exact `z.number()` parity), a
non-finite-rejection regression test added, and the `z.number → Schema.Finite`
mapping corrected in ADR-0104, the plan, and the spec. The reviewer's MEDIUM
(collector/throw retention) and LOW items were addressed by documenting the
retention decision and the ADR-0032 supersession in ADR-0104.

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Replay result: `replayVerificationHash 097f9929…`; `"success": true`
- Processes and operating systems used: two child processes, macOS (darwin-arm64), Node per repo engine

Goldens 10/10 unchanged — the save path is not a hash surface and the schema
swaps no bytes (proven byte-for-byte by the MIG-WIRE-4 test). ADR-0103 note: the
determinism gate is deprecated; it was run and reports **unchanged**.

## Canonical artifact changes

None. No on-disk wire shape changed; existing saves load (compatibility,
recovery, corruption-fuzz, month-input, battle-generation suites green). Golden
hashes unchanged.

## Tests added

- `test/schema-serialization.test.ts` (5 tests): real-artifact Schema decode
  canonical-byte parity; full store reload; excess-key/default parity; optional
  pointer parity; **non-finite number rejection parity**.
- `test/errors.test.ts` (4 tests): `_tag`/`code` for all five classes; error- and
  warning-severity collector projection byte-parity; default-stage parity.

## Security and cancellation

Trust boundary: the save artifacts remain validated fail-closed before
reconstruction (the HIGH repair restores exact parity). Path-traversal defenses,
opaque save-id validation, atomic tmp→rename→pointer, and abort/rollback are
untouched. No new ambient I/O; the package links the vendored `effect` only.

## Performance observations

None material. Schema decode is at load/save boundaries only.

## ADRs and dependencies

- **ADR-0104** (persistence Effect beachhead) — records Schema ownership, the
  `.default` v4 mapping, empirical Struct parity, mutable-type restatement,
  tagged errors added, collector retained, raw sync IO kept, wire frozen.
  Supersedes the passing Zod reference in ADR-0032 §5.
- Dependencies: `effect` added (`workspace:*`), `zod` removed from the package.
  Root `zod` retains until Wave 2 removes the last boundary.

## Known limitations and deferred requirements

- The `throw` + `DiagnosticCollector` mix is intentionally retained for this wave
  (adoption ticket 06); the tagged classes are the preparatory vocabulary. A
  later wave may route the remaining public failure sites through them.
- Full async Effect `platform` FileSystem IO is out of scope while `SaveStore` is
  synchronous (ADR-0104 §6).

## Changed files

- `packages/persistence/package.json`, `src/schemas.ts`, `src/errors.ts` (new),
  `src/store.ts`, `src/recovery.ts`, `src/compatibility.ts`, `src/index.ts`,
  `test/schema-serialization.test.ts` (new), `test/errors.test.ts` (new),
  `pnpm-lock.yaml`.
- Docs: `docs/adr/ADR-0104-*.md` (new), `docs/adr/README.md`,
  `scripts/adr-index.cjs`.
- Traceability: `.scratch/effect-v4-vendor-migration/issues/06-*.md`,
  `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`, `spec.md`/`plan.md` mapping
  corrections, this report.

## Git and remote status

- Branch: `dev`
- Commits: see the accompanying `feat(persistence): own the save boundary with Effect Schema and tagged PERSISTENCE_* errors` commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Independently re-ran persistence typecheck/tests, the guard, `pnpm check`
(EXIT 0), golden verify (10/10), and cross-process (`success:true`) after the
reviewer repair. Confirmed the save path diff is decode-sites only (atomicity /
abort / rollback untouched), no `zod` remains in the package, and goldens are
unchanged.
