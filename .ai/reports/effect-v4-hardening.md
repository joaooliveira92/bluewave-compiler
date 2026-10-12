# Effect v4 migration hardening — validation report

**Date:** 2026-10-12
**Branch:** `dev`
**Scope:** follow-up to the completed Effect v4 vendored migration
(`.scratch/effect-v4-vendor-migration/`, tickets 00–38). Hardens the Wave 4
typed-error commits (`2e668e99`, `e5bb77f1`, `ca0ea1d2`, `a2cc02eb`) for release.

## 1. Push & PR hygiene

- `git pull --rebase` — already up to date.
- `pnpm preflight` at session start — 8/8 (later 10/10 after the new gate).
- `git push origin dev` — `e77cea39..b3ba5d58`.
- **No PR to `main` opened.** The release boundary is **not declared**: P-2
  (ship designer) is un-gated and is the likely release blocker (see §7). Per the
  delivery contract, a PR into `main` happens only at a declared release
  boundary. `main` untouched.

## 2. Independent adversarial review (reviewer subagent)

Ran the `reviewer` role over the four Wave 4 commits against each ticket's
acceptance criteria + spec + engineering contract + repo standards, plus an
empirical `Data.TaggedError` probe against vendored `effect@4.0.2`.

**Verdict: ACCEPT** — no blocker or high findings. Findings:

| ID  | Sev  | File / symbol                                                     | Finding                                                                                   | Disposition                                                                                                                                                                                                                            |
| --- | ---- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | low  | `packages/phase-engine/test/errors.test.ts:36,61,91`              | Three `as any` casts; the private-`walk` test is introspection over a private seam        | **Fixed** — file rewritten to drive public APIs with typed fixtures; private-`walk` test removed (canonical public guard now covered in `commands`)                                                                                    |
| F2  | low  | `packages/combat/src/mines/contracts.ts:154,174`                  | The two `CombatInvariantError` rollup throws have no direct test                          | **Deferred** with rationale (see ticket 26 note): fail-closed guards reachable only on a registry bug; exercising them needs an injectable registry (scope creep); happy path + tamper-rejection covered by `contracts-rollup.test.ts` |
| F3  | low  | `packages/combat/src/mines/contracts.ts:148`                      | Stale comment said the rollup throws `BluewaveError`                                      | **Fixed** — comment now names `CombatInvariantError` (rollup) and `BluewaveError` (per-contract guard)                                                                                                                                 |
| F4  | low  | `.scratch/effect-v4-vendor-migration/spec.md` runtime-usage table | Spec table still listed `ai`/`phase-engine` as IO and contradicted the ADR-0100 amendment | **Fixed** — pointer added to the authoritative ADR-0100 §2 amendment                                                                                                                                                                   |
| F5  | info | all four `errors.ts`                                              | `JSON.stringify`/`structuredClone` of a tagged error adds `_tag` / drops it — latent trap | **No action** — audit found no consumer serializes a migrated error (§3); recorded here                                                                                                                                                |
| F6  | info | `tacticalReplay.ts:203`, `battleSandboxCommands.ts:525`           | Top-level `code` coupling is latent                                                       | **No action** — traced: the migrated throws are not on those call chains                                                                                                                                                               |

Reviewer behaviour-preservation analysis (independently reproduced here):
every catch site in the migrated closure matches on `instanceof Error` +
`.message`; `Data.TaggedError` extends `globalThis.Error` and keeps an own
`message` verbatim, so all are unchanged. The `instanceof BluewaveError` sites
cannot receive a migrated error (the converted throws were plain `Error` /
`Object.assign(Error, …)`, never `BluewaveError`). Reason codes and messages are
byte-identical to the pre-migration text.

## 3. Error-consumer correctness audit + regression tests

**Serialization audit.** `rg` over `packages` + `apps` found **no**
`JSON.stringify(error)` / `structuredClone(error)` on any migrated throw (the
only `structuredClone` uses are on snapshots/drafts; the only `JSON.stringify`
use is on a ship-design value). So the F5 `_tag` caveat is latent, not live. No
ADR note required.

**Consumer-site verification.**

| Site                                                                        | Match                          | Result                                                                                                                                |
| --------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/phase-engine/src/tacticalReplay.ts:203`                           | `"code" in e`                  | Migrated throws unreachable on this chain; fallback `TACTICAL_REPLAY_ERROR` preserved. Covered by new `test/error-consumers.test.ts`. |
| `packages/phase-engine/src/battlePhases.ts:291`                             | `instanceof BluewaveError`     | Cannot receive a migrated error (they are not `BluewaveError`).                                                                       |
| `packages/combat/src/damage/pipeline.ts:197,225`                            | `instanceof BluewaveError`     | Same; migrated combat throws not on these chains.                                                                                     |
| `apps/compiler-cli/src/combatDiagnostics.ts:43`                             | `instanceof BluewaveError`     | A tagged `CombatInvariantError` correctly falls to `internal-error` (same as the old plain `Error`). New regression case added.       |
| `apps/desktop/src/main/commands/{contentCommands,battleSandboxCommands}.ts` | `err.code` / `"code" in error` | Only string `reason`/`diagnostics` cross IPC; no migrated error object is serialized.                                                 |

**Regression tests added (public consumer paths).**

- `packages/commands/test/error-consumers.test.ts` — invalid transition via the
  public `transitionRecord` (now re-exported) caught by `code`; settlement policy
  - settlement invariant rejections; registry issuer-parity — all assert
    `code`/`message` reach the caller unchanged.
- `packages/phase-engine/test/error-consumers.test.ts` — `TacticalReplayVerifier`
  fail-closed catch surfaces a stable `TACTICAL_REPLAY_ERROR: <message>`.
- `apps/compiler-cli/test/combatDiagnostics.test.ts` — tagged
  `CombatInvariantError` → `internal-error`.
- `packages/combat/test/air-combat/records.test.ts` (ticket 26) already asserts
  `assertAirCombatRecordHash`'s `_tag`/`name`/`code`/`message`.

## 4. Test quality

- Removed all three `as any` from `packages/phase-engine/test/errors.test.ts`.
  The file now uses a `null` non-null-assertion for the null guard and a
  **typed** self-referential `politics.shells` fixture for the circular-reference
  guard; the private-`walk` introspection test was removed.
- Audited all five new error test files (`combat` via `records.test.ts`,
  `commands`, `ai`, `phase-engine`, `events`, `persistence`): the `commands`,
  `ai`, `events` and `persistence` files already drive public APIs; `phase-engine`
  is now clean.
- `rg "as any" packages/{commands,phase-engine}/test/error*` → only a comment.

## 5. Hard runtime-import gate (codifies ADR-0128)

Added `scripts/assert-runtime-free.mjs` — a fail-closed, deterministic guard:

- **Guarded roots:** the ADR-0100 §2 runtime-free packages + the
  renderer-reachable `campaign-engine` + `apps/desktop/src/main` (15 roots).
  `persistence`/`content-compiler`/`compiler-cli` are IO boundaries and are
  deliberately not guarded.
- **Rule:** an allowlist of the runtime-free subset (`Data`, `Equal`, `Hash`,
  `Option`, `Predicate`, `Result`, `Schema`, `SchemaIssue`) plus the matching
  `effect/<Name>` subpaths. Everything else — `Effect`/`Layer`/`Context`/
  `ManagedRuntime`, namespace/default imports, `effect/unstable/*`, `@effect/*`,
  re-exports, dynamic imports — fails. An unrecognised `effect` export fails
  rather than slipping through.
- **Self-test:** 15 embedded fixtures (`--self-test`), plus
  `scripts/test/assert-runtime-free.test.mjs` (13 tests) under `pnpm test:scripts`.
- **Wiring:** two `preflight` gates (`runtime-free guard self-test` →
  `runtime-free imports`) in `scripts/run-gates.mjs`, per ADR-0107.
- **Docs:** `docs/agents/runtime-free-gate.md` (budgeted at 250 words), linked
  from `AGENTS.md` and listed in `scripts/README.md`.

Current tree: **ok** — the only runtime symbol in the repo remains
`Effect.succeed([])` in `packages/persistence/src/schemas.ts` (an IO boundary,
not guarded), exactly as ADR-0128 §4 states.

## 6. ADR-0128 second opinion (self-grill)

Conducted a documented self-grill of ADR-0128's decision tree (autonomous
mandate). Evidence gathered:

- `apps/desktop/src/main` has `async`/`Promise` wrappers and IPC handlers, but
  they wrap a synchronous `node:fs` pipeline and native dialogs — no composable
  service graph. `compiler-cli` and `content-compiler` are synchronous.
- The renderer's only `@bluewave/persistence` import is **type-only**
  (`SaveMetadata`); the clean build confirms `renderer bundle clean: no
  yaml/effect across 20 chunk(s)`. So exposing an Effect-typed facade on a
  renderer-reachable package would still bundle `effect` (MIG-EXCL-1 holds).
- No `Effect.run*` exists anywhere.

**Outcome: ADR-0128 is kept.** Added an explicit **"Revisit triggers"** section
(4 triggers, headed by "the first non-renderer-reachable async IO seam
introduces a `ManagedRuntime`") and a note that the boundary is machine-checked
by the new gate; a deliberate reversal must update `RUNTIME_FREE_ROOTS` in the
same change. Tickets 34–36 remain closed (not reopened).

## 7. P-2 scope note (recorded, not started)

`docs/PROGRESS.md` now records that the vendored Effect v4 migration is complete
and certified, and that the **likely release blocker is P-2 (ship designer)**:
`.scratch/ship-building/` has largely landed (tickets 00–35, ADRs 0063–0078) but
is un-gated (frontier 22, 26, 28, 30, then a P-2 gate). P-2 was **not started**.

## Validation gate — exact commands & observed results

| Command                                 | Result                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `pnpm preflight`                        | **10/10 passed** (incl. new runtime-free self-test + real gate)                                               |
| `pnpm format`                           | All matched files use the correct format (2319 files)                                                         |
| `pnpm lint`                             | 0 warnings, 0 errors                                                                                          |
| `pnpm lint:effect`                      | 0 errors, 278 pre-existing warnings                                                                           |
| `pnpm test:scripts`                     | 59 tests pass (incl. the new 13-test runtime-free fixture)                                                    |
| `pnpm typecheck`                        | 37/37 successful                                                                                              |
| `pnpm -w turbo run build --force`       | 20/20 (0 cached); `renderer bundle clean: no yaml/effect across 20 chunk(s)`                                  |
| `pnpm test:run`                         | green (all packages; `phase-engine` 33 files/315 tests, `commands` 3, `ai` 4, `combat` 288, `compiler-cli` 8) |
| `pnpm check:balance-reports`            | ok                                                                                                            |
| `node scripts/verify-golden-hashes.cjs` | All 10 hashes match golden reference                                                                          |
| `pnpm test:cross-process` (×2)          | byte-identical, `success:true` — no hash change                                                               |
| `pnpm test:e2e`                         | **33 passed**                                                                                                 |
| `pnpm check`                            | **green end-to-end**                                                                                          |

No authoritative hash changed (errors are not hash-surface inputs). No ADR-0007
regeneration was required.

## Changed files

**Source / gates**

- `scripts/assert-runtime-free.mjs` (new)
- `scripts/test/assert-runtime-free.test.mjs` (new)
- `scripts/run-gates.mjs` (+2 preflight gates)
- `scripts/doc-budgets.manifest.json` (budget `runtime-free-gate.md` 250;
  `scripts/README.md` 500→520 for the new gate row)
- `scripts/README.md` (+ gate row)
- `packages/commands/src/index.ts` (re-export `transitionRecord`)
- `packages/combat/src/mines/contracts.ts` (comment fix)

**Tests**

- `packages/phase-engine/test/errors.test.ts` (rewritten; no `as any`)
- `packages/phase-engine/test/error-consumers.test.ts` (new)
- `packages/commands/test/error-consumers.test.ts` (new)
- `apps/compiler-cli/test/combatDiagnostics.test.ts` (+1 case)

**Docs / traceability**

- `docs/adr/ADR-0128-effect-v4-runtime-wave-not-warranted.md` (+ revisit triggers)
- `docs/agents/runtime-free-gate.md` (new)
- `AGENTS.md`, `docs/PROGRESS.md`
- `.scratch/effect-v4-vendor-migration/issues/{24,26,29,30}.md` (hardening notes)
- `.scratch/effect-v4-vendor-migration/spec.md` (runtime table pointer)
- `.ai/reports/effect-v4-hardening.md` (this report)

## Blockers

None. P-2 (ship designer) is the recorded next release-critical work and was not
started. A PR to `main` was not opened because no release boundary is declared.
