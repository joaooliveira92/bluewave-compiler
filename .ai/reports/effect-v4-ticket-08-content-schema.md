# Validation Report: EFFECT-V4 ticket 08 + 09 — `content-schema` / `content-compiler` Effect Schema boundary

## Outcome

`PASS`

## Scope delivered

Ticket `.scratch/effect-v4-vendor-migration/issues/08-boundary-content-schema.md`
(the largest Zod boundary), with its paired coupling
`.scratch/effect-v4-vendor-migration/issues/09-boundary-content-compiler-validate.md`
landed in the same coherent change (08 alone cannot leave a green tree). Proves
**MIG-ZOD-1, MIG-ZOD-2, MIG-WIRE-2, MIG-RUNTIME-1** (and advances Wave 2).

- All 16 `packages/content-schema/src/*` files migrated **atomically** from Zod to
  Effect Schema; `zod` removed from `packages/content-schema/package.json` and
  `packages/content-compiler/package.json`; no dual Zod+Schema definition and no
  `zod` import remains in either package.
- **Strictness policy (ADR-0105):** every content-schema decode uses
  `{ onExcessProperty: "error" }`, centralized in the new `decode.ts`
  (`decodeStrict` / `decodeStrictResult` / `CONTENT_DECODE_OPTIONS` /
  `ContentSchema`). This preserves every previous Zod `.strict()` rejection exactly
  and tightens previously-open `z.object` schemas **fail-closed** (never a
  weakening). `Schema.Record` dynamic-key maps still accept arbitrary keys.
- `z.number()` → `Schema.Finite` everywhere (Zod v4 parity: rejects
  `NaN`/`±Infinity`).
- `schema-validator.ts` re-expressed over Effect Schema (`Schema.ConstraintDecoder<A,
  never>`), decoding with `{ onExcessProperty: "error", errors: "all" }`, emitting
  the existing `SCHEMA` diagnostic shape (`stage`, `sourceLocation`, missing-key
  remediation), preserving the `T | undefined` contract.
- `content-compiler/stages/validate.ts` off `ZodSchema`; map value typed with the
  re-exported `ContentSchema`. No stage ordering or emitted-artifact change.
- Every transitive consumer migrated: `ship-design` test helpers, `phase-engine`
  test helpers, `campaign/designCompilation`, desktop `main` + renderer content
  loaders, and all `content-schema` tests.

**Deferred (recorded, ADR-0105 "Known deviations"):** renderer decoupling so the
renderer no longer transitively bundles Effect (`MIG-EXCL-1`) → Wave 5; per-consumer
`Mutable<>` if a caller needs to mutate a decoded value. Both are non-blocking and
documented, not hidden.

## Requirements evidence

| Requirement              | Implementation                                              | Proving test / evidence                                                                                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIG-ZOD-1/2              | 16 files on Effect Schema; `decode.ts`; `zod` removed       | `rg '"zod"\|from "zod"' packages/content-schema packages/content-compiler` → empty; `pnpm --filter @bluewave/content-schema test` 48 passed                                                                               |
| Strict parity per schema | `decode.ts` strict option; nested rejection                 | `test/parity.test.ts` (top-level + nested-array excess reject, record keys still accepted), `test/nation.test.ts` strict, `test/naval-profile.test.ts` real catalogue + nested excess                                     |
| Non-finite parity        | `Schema.Finite` everywhere                                  | `test/parity.test.ts` rejects `NaN`/`±Infinity` where Zod did                                                                                                                                                             |
| MIG-WIRE-2               | real production pack + compiler fixtures decode identically | `apps/desktop/test/production-pack.test.ts` (zero diagnostics, stable hashes); `pnpm --filter @bluewave/content-compiler test` 14 passed; compiler fixture codes `DUP-ID`/`REF`/`TECHNOLOGY_PREREQUISITE_CYCLE` unchanged |
| MIG-RUNTIME-1            | only `Schema`/`SchemaIssue` imported                        | grep: no `Effect`/`Layer`/`ManagedRuntime`/`Effect.run*` in `content-schema/src`                                                                                                                                          |
| validator diagnostics    | `schema-validator.ts`                                       | `test/schema-validator.test.ts` (success, excess → `SCHEMA` + `Expected no excess property`, missing key → remediation, `(root)`)                                                                                         |
| ticket 09 coupling       | `validate.ts` uses `ContentSchema`                          | `pnpm --filter @bluewave/content-compiler test` green; `zod` gone                                                                                                                                                         |

## Commands and observed results

```text
pnpm -w turbo run build --force              -> 20 successful / 20 total (uncached), exit 0
pnpm typecheck                               -> 37 successful / 37 total, exit 0
pnpm format                                  -> All matched files use the correct format (2165 files)
pnpm lint                                    -> Found 0 warnings and 0 errors (1936 files)
pnpm lint:effect                             -> Found 257 warnings and 0 errors (all pre-existing determinism warnings)
pnpm preflight                               -> ok; assert-single-effect ok (no registry effect; workspace:vendor/effect); docs-check ok (331 links, 104 ADRs)
pnpm check:licenses                          -> ok (168 production dependencies across 10 licenses)
pnpm test:run                                -> 241 files / 1554 tests passed, exit 0
pnpm check:balance-reports                   -> ok (reports match the deterministic benchmark)
node scripts/verify-golden-hashes.cjs        -> All 10 hashes match golden reference
pnpm test:cross-process (run 1)              -> {"success":true, ...} exit 0
pnpm test:cross-process (run 2)              -> identical output; diff of run1/run2 = BYTE-IDENTICAL
pnpm test:e2e                                -> 30 passed
pnpm --filter @bluewave/content-schema test  -> 8 files / 48 tests passed
pnpm --filter @bluewave/content-compiler test -> 4 files / 14 tests passed
pnpm --filter @bluewave/ship-design test     -> 54 files / 666 tests passed
pnpm --filter @bluewave/phase-engine test    -> 31 files / 309 tests passed
pnpm --filter @bluewave/campaign test        -> 10 files / 114 tests passed
rg '"zod"|from "zod"' packages/content-schema packages/content-compiler -> no matches
```

Adversarial reviewer verdict: **APPROVE** (no BLOCKER/HIGH). Three MEDIUM findings
were reconciled by the orchestrator in ADR-0105's "Known deviations and
follow-ups": (1) renderer transitively bundles Effect → recorded `MIG-EXCL-1`
deviation deferred to Wave-5 decoupling; (2) exported types are the readonly
Effect view vs ADR-0104's `Mutable<>` → per-consumer `Mutable<>` policy recorded
(no present mutator; workspace typecheck green); (3) `SCHEMA` diagnostic
granularity/text change → recorded, stable contract (code/stage/sourceLocation +
accept/reject) preserved and asserted.

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

Goldens 10/10 **unchanged** — content-schema compiles/validates but is not a hash
surface, and no wire shape changed. Determinism gate is deprecated (ADR-0103); it
was run and reports unchanged.

## Canonical artifact changes

None. No content-pack/IPC/event wire shape changed; the real production pack
compiles with zero diagnostics and identical recompile hashes; golden hashes
unchanged.

## Tests added

- `packages/content-schema/test/parity.test.ts` (6 tests): top-level + nested
  excess rejection, record-key tolerance, non-finite rejection parity.
- `packages/content-schema/test/naval-profile.test.ts` (2 tests): real authored
  naval-profile catalogue decodes; nested excess rejected.
- `packages/content-schema/test/schema-validator.test.ts` (4 tests): success,
  strict-excess `SCHEMA` diagnostic, missing-key remediation, `(root)` path.
- `packages/content-schema/test/decode-helpers.ts`: shared decode test helpers.
- Migrated `nation.test.ts`, `armament.test.ts`, `ship-component.test.ts`,
  `research-design.test.ts` to the Effect decode API with every original
  accept/reject assertion preserved (no test deleted, skipped or loosened).

## Security and cancellation

Trust boundary unchanged: content packs are validated fail-closed before compile.
Strict excess-key rejection is a strengthening (previously-open `z.object`
schemas now reject unknown fields). `Schema.Record` dynamic-key tolerance is
preserved (verified). No new ambient I/O; content-schema links the vendored
`effect` (runtime-free `Schema` subset) only. YAML size/nesting/path defenses
(`yaml-parser.ts`) are untouched.

## Performance observations

None material. Schema decode is at compile/load boundaries only. Renderer bundle
size increases because the renderer transitively bundles Effect — recorded as the
ADR-0105 `MIG-EXCL-1` deviation (Wave-5 decoupling + bundle-size gate).

## ADRs and dependencies

- **ADR-0105** (content-schema Effect boundary — strict excess-key policy):
  atomicity, `Schema.Finite` non-finite parity, strict `onExcessProperty: "error"`
  policy + centralized helpers, `schema-validator` re-expression, `makeFilter`
  string-message decision, `NATION_IDS`/`Schema.Literals`, `content-compiler`
  coupling, runtime-free, and the three known deviations.
- Dependencies: `effect` added to `content-schema` (`workspace:*`); `zod` removed
  from `content-schema` and `content-compiler`. Root `zod` devDep retained until
  ticket 14 (last boundary).

## Known limitations and deferred requirements

- Renderer transitively bundles Effect Schema until the Wave-5 renderer decoupling
  (ADR-0105 deviation 1; `MIG-EXCL-1`).
- `SCHEMA` diagnostic granularity/text differs from Zod (one issue per key;
  missing-key remediation); stable contract preserved (ADR-0105 deviation 3).
- Exported types are readonly `typeof S.Type`; a future mutating consumer applies
  its own `Mutable<>` (ADR-0105 deviation 2).

## Changed files

- `packages/content-schema/src/`: `area.ts`, `design.ts`, `manifest.ts`,
  `nation.ts`, `naval-profile.ts`, `naval-profile-vocab.ts`, `port.ts`,
  `possession.ts`, `route.ts`, `ship-component.ts`, `technology.ts`,
  `armament.ts`, `schema-validator.ts`, `index.ts`, new `decode.ts`.
- `packages/content-schema/test/`: migrated `nation/armament/ship-component/
  research-design.test.ts`; new `parity.test.ts`, `naval-profile.test.ts`,
  `schema-validator.test.ts`, `decode-helpers.ts`.
- `packages/content-schema/package.json`, `packages/content-compiler/package.json`,
  `packages/content-compiler/src/stages/validate.ts`.
- `packages/campaign/src/designCompilation.ts`; `apps/desktop/src/main/shipBuildingContent.ts`;
  `apps/desktop/src/renderer/screens/construction/drawing-board/content.ts`.
- Consumers: `packages/ship-design/test/{earlyBand.test.ts, schemaCompat.test.ts,
  helpers/earlyContext.ts, helpers/armamentContext.ts}`;
  `packages/phase-engine/test/{submit-design,ship-type-enforcement,revise-project,
  construction-order,design-study,ai-procurement}.test.ts`.
- Docs/traceability: `docs/adr/ADR-0105-content-schema-effect-boundary.md`,
  `docs/adr/README.md`, `scripts/adr-index.cjs`, `.ai/SPRINT-PLAN.md`,
  `docs/PROGRESS.md`, tickets 08/09, this report, `pnpm-lock.yaml`.

## Git and remote status

- Branch: `dev`
- Commits: see the accompanying
  `feat(content-schema): migrate content validation to Effect Schema (tickets 08/09)`
  commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Independently re-ran, after the reviewer pass and ADR amendments: the forced
build (20/20), `pnpm typecheck` (37/37), `pnpm format` (clean), `pnpm lint` (0/0),
`pnpm lint:effect` (0 errors), `pnpm preflight` (single-copy guard + docs-check,
104 ADRs), license + balance-report checks, `pnpm test:run` (241/1554), golden
verify (10/10), two `pnpm test:cross-process` runs (byte-identical,
`success:true`), and `pnpm test:e2e` (30 passed). Confirmed no `zod` remains in
`content-schema`/`content-compiler`, content-schema is runtime-free, and the
production pack compiles with zero diagnostics.
