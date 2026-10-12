# 00 — Reconcile the Effect v4 migration tracker against the code

**Type:** verification
**Status:** done
**Blocked by:** None (can start immediately)
**Frontier:** no

## What to build

The plan-first reconciliation gate: verify the real state of the Effect v4
adoption against the code and correct this tracker in place. This ticket writes
no production code. It produces a gap report and a corrected delta plan, then
re-flags the frontier so the remaining execution tickets (12–38) are trustworthy.

Do **not** create a parallel tracker; this ticket updates the existing one.

## Required reading (self-contained)

- `docs/adr/ADR-0100`–`ADR-0107` (adopt / vendor / Zod→Schema / determinism
  demotion / persistence beachhead / content-schema boundary / ratchet gates /
  verification) and `ADR-0125` (renderer content IPC).
- `.scratch/effect-v4-vendor-migration/spec.md` + `plan.md`; this `issues/`
  directory (01–38).
- `AGENTS.md`, `.ai/ENGINEERING-CONTRACT.md`, `agent-patterns/effect-idioms.md`.

## Acceptance criteria

- [x] Vendored pin and single-copy invariant verified:
      `node scripts/vendor-effect-sync.mjs --verify`,
      `node scripts/assert-single-effect.mjs`, and the `effect`/`@effect/vitest`
      `overrides` in `pnpm-workspace.yaml` still force one resolution.
- [x] Every ticket 01–38 is classified against the **code** (not its frontmatter)
      as verified-done / actually-open / already-satisfied / not-needed; any
      "done" ticket whose criteria are unmet is reopened, and any open ticket
      already satisfied is closed.
- [x] Runtime-usage policy checked against the ADR-0100 table: which `packages/*`
      are runtime-free vs. full-runtime, and whether any pure package leaked
      `Effect`/`Layer`/`ManagedRuntime`.
- [x] Remaining validation residue enumerated: `apps/desktop/src/renderer/zodJitless.ts`
      (imported by `main.tsx` as `./n.js`) and the `zod@^4.6.5` dependency in
      `apps/desktop/package.json` (ticket 14); renderer must end with no Effect
      and no Zod.
- [x] Gap report written: each finding as `file_path:line_number` + the replacing
      Effect v4 idiom + risk/effort.
- [x] Corrected delta plan recorded: the ordered remaining tickets, their blocking
      edges, and what is explicitly deferred — with `Frontier:` flags and
      `Blocked by:` lines updated in this tracker to match.
- [x] No production code, config, content, or test changes (audit only).

## Notes

- This ticket gates the current open frontier (12, 13); it must not re-gate the
  already-verified Wave 0/1 tickets except to reopen a specific one it proves
  unmet.
- If the audit shows adoption is already complete, say so and close the remaining
  execution tickets rather than manufacturing work.

## Comments

### Audit report (2026-10-12, `dev` @ `07c2f362` + the owner's uncommitted archetype WIP, untouched)

**Headline.** Adoption is **not** complete, but the tracker was badly stale.
The Zod → Effect Schema conversion is **finished in code**: tickets 12 and 13
were implemented and committed (`5df46569`, `652da67e`, `0c7370d4`, `248cd6ed`)
while their files still said `open`. The only Zod left is a renderer shim, one
`package.json` line, and stale comments — ticket 14 is the real frontier, not
12/13. Waves 3–5 are largely **unsupportable as written**: the renderer imports
`ship-design`/`campaign`/`campaign-engine` (and so transitively `contracts`), so
putting `effect` into those packages breaks `MIG-EXCL-1`/ADR-0125 (guarded by
`apps/desktop/scripts/check-renderer-bundle.mjs`, whose marker is itself weak — §5-C), and the "full Effect" row of
ADR-0100 names `ai`/`phase-engine`, which contain no async/IO at all.

#### 1. Pin and single-copy invariant (AC 1) — all green

| Check | Result |
| --- | --- |
| `node scripts/vendor-effect-sync.mjs --verify` | ok: `effect@4.0.2`, `@effect/vitest@4.0.2` match the published tarballs |
| `node scripts/assert-single-effect.mjs` | ok (no registry `effect`; `workspace:vendor/effect`) |
| `pnpm-workspace.yaml:2-5,13-20` | `vendor/effect` + `vendor/effect-vitest` are members; `overrides:` forces `effect`/`@effect/vitest` → `workspace:*` |
| `pnpm preflight` | 8/8 gates passed |
| `pnpm lint:effect` | exit 0 (warnings only: `node-builtin-import`, `global-random`, `prefer-typed-schema-decoder`, mostly in tests) |
| `pnpm --filter @bluewave/combat test` | 288 files / 3797 tests passed |
| `pnpm --filter @bluewave/desktop exec vp test run src/main` | 30 files / 335 tests passed |
| `pnpm --filter @bluewave/combat --filter @bluewave/desktop typecheck` | exit 0 |
| `node apps/desktop/scripts/check-renderer-bundle.mjs` (existing `out/`) | clean: no yaml/effect in 20 chunks |
| `pnpm why zod` | one resolution: `@bluewave/desktop` (dependencies) only |

#### 2. Classification of 01–38 (AC 2)

| # | Verdict | Evidence / action |
| --- | --- | --- |
| 01–04 | verified-done | Rows of §1; ADR-0100–0103 present; `@effect/tsgo` pinned exact (`package.json:44`); `repos/effect` excluded from lint/fmt. |
| 05 | verified-done | `packages/diagnostics/src/index.ts:33` `DiagnosticError extends Data.TaggedError`; only `Data` imported, so runtime-free. |
| 06 | verified-done, **deviation recorded** | Criteria met. "Effect runtime drives IO" was *not* delivered: ADR-0104 §6 keeps sync `node:fs`; `Effect` is imported only at `packages/persistence/src/schemas.ts:22,50` for `Effect.succeed([])` decoding defaults (no execution). Async/Effect facade deferred to ticket 34. Not reopened — no criterion is unmet. |
| 07 | verified-done | |
| 08 | verified-done | 14 `content-schema` files import `effect`; no `zod`; deps = `effect`. |
| 09 | verified-done | `content-compiler` has no `zod`/`effect` import; consumes the `content-schema` decode view. |
| 10, 11 | verified-done | Schema only, no `zod`. `Frontier: yes` was stale → `no`. |
| 12 | **already-satisfied → closed** | All six files import only `{Result, Schema}` from `effect`; no `zod` in `packages/combat`; 288 files green. |
| 13 | **already-satisfied → closed** | All seven files import only `{Result, Schema, SchemaIssue}`; no `zod` in `src/main`; preload/renderer have no `effect`; 335 main tests green. The `zod` dependency line is kept alive only by the renderer shim → carried by 14. |
| 14 | **actually-open → Frontier: yes** | Residue in §4. All blockers (08–13) are done. |
| 15 | actually-open | Blocked by 14 only. Its "every §4.1 boundary is on Schema" criterion is already true. |
| 16 | **not-needed** | `BluewaveError` (`packages/contracts/src/index.ts:57`) is value-reachable from the renderer via `SafeInt`; a top-level `Data.TaggedError(...)` would bundle `effect` there (`MIG-EXCL-1`). See §5-A. |
| 17 | **not-needed** | `deterministic`: 113 LOC, no schema, no IO, 3 `RangeError` precondition throws (`fixedMath.ts:8,9,27`); hash-critical; renderer-reachable. |
| 18 | **not-needed** | `random`: 94 LOC, 0 throws, 0 error classes; `MIG-RUNTIME-2` forbids swapping the ledger. |
| 19 | **not-needed** | `armament`: no own error type; 4 `BluewaveError` throws (`arithmetic.ts:16,30,47,50`); renderer-reachable. |
| 20 | actually-open (small) | `events` is not renderer-reachable; 4 plain throws: `ledger.ts:22,28`, `explanation.ts:15,44`. |
| 21 | gate, actually-open | Re-blocked on 20 only; criteria trimmed (see ticket). |
| 22 | **not-needed** | `campaign` is value-imported by the renderer (`PreTurnReviewDialog.tsx:3` `advanceMonth`). Throws are `BluewaveError` (`division.ts:138-192`). IO leak `campaignInput.ts:7-8` is a policy matter, deferred (§6). |
| 23 | **not-needed** | `ship-design` is imported 70× by the renderer, incl. a **value** import of `EditError` (`useDrawingBoard.ts:11,102`). Making its 8 error classes `Data.TaggedError` pulls `effect` into the renderer. |
| 24 | actually-open (small) | `commands` not renderer-reachable; 22 throws, none `BluewaveError`: 5 plain `Error` (`settlement.ts:19,22,24,31,33`) + 17 `throw Object.assign(new Error(msg), { code })` (`lifecycle.ts:60,65,426`, `canonicalization.ts:68`, `definition.ts:236`, `settlement.ts:162,167`, `specRules.ts:62,69,183,215`, `validation.ts:93`, `registry.ts:11,17,35,45,49`). |
| 25 | **not-needed** | `campaign-engine` remainder: 0 throws, 0 error classes, 0 async/IO; `priorities.ts` already Schema; `sideEffects:false`. |
| 26 | actually-open (tiny), **rescoped** | Combat's 429/432 throws are `BluewaveError` (stays plain, §5-A). Residual plain throws: `air-combat/records.ts:43`, `mines/contracts.ts:153,170`. 26 now owns all three. |
| 27, 28 | **not-needed** | Nothing left after 26: every other combat throw is `BluewaveError`; the only 4 `async` sites are determinism-harness child mains (`simulation/run-*-child.ts`, deprecated machinery, ADR-0103). |
| 29 | actually-open, **rescoped** | `ai`: 651 LOC, 0 async/IO/`node:` imports → runtime-free only. 9 plain throws `aiPlanner.ts:36,41,49`, `aiCommandGenerator.ts:24,37,46,74,131,158`; hand-rolled SafeInt coercion duplicates `contracts`. |
| 30 | actually-open, **rescoped** | `phase-engine`: 8244 LOC, 0 async/IO/`node:` imports → a `Layer`/`Context.Service` rewrite is "blind wrapping" (ADR-0100 §2). Rescoped to its 8 throws: `snapshotClone.ts:61,124,595,604,614,636`, `financial-ledger.ts:33`, `commandLifecycle.ts:524` (`Object.assign(new Error, {code})`). |
| 31, 32 | **not-needed** | 31's only throw (`financial-ledger.ts:33`) moves to 30; 32 (`battles`, `battlePhases`, `replay`, `tacticalReplay`) has zero throws. |
| 33 | gate, actually-open | Blocked by 30 only. |
| 34 | actually-open | Real IO surfaces exist (§6); ticket must start with an inventory. |
| 35 | actually-open | Real orchestration surface: `apps/desktop/src/main/index.ts:149-171,217`; 28 `node:` imports across 16 main/CLI files. |
| 36 | actually-open | `apps/compiler-cli/src/main.ts:2` sync `readFileSync`; low value, real boundary. |
| 37, 38 | gate/final, actually-open | Edges unchanged. |

No "done" ticket was reopened. 12, 13, 16–19, 22, 23, 25, 27, 28, 31, 32 are
closed (`resolved` for not-needed, `done` for already-implemented); 14 becomes the frontier.

#### 3. Runtime-usage policy vs. ADR-0100 (AC 3)

- **No `Layer`, `ManagedRuntime`, `Context`, fiber or `Effect.run*` exists
  anywhere** outside `vendor/`/`repos/`. The single `Effect` import is
  `persistence/src/schemas.ts:22` (`Effect.succeed` decoding default).
- Runtime-free subset in use (`Schema`/`Data`/`Result`): `content-schema` (14
  files), `combat` (8), `events` (1), `campaign-engine` (1), `diagnostics` (1,
  `Data`), `persistence` (4), desktop `src/main` (9).
- No `effect` import at all: `contracts`, `deterministic`, `random`,
  `armament`, `campaign`, `ship-design`, `commands`, `ai`, `phase-engine`,
  `content-compiler`, `compiler-cli`, `test-support`, `cross-process-test`.
- **Leaks: none.** Renderer (`src/renderer`, `src/preload`, `src/shared`) has
  zero `effect`/`@effect` imports (`content-boundary.test.ts:18-19` guards it).
- **Table mismatches to fix at the source of truth (ADR-0100 §2):**
  `ai` and `phase-engine` sit in the "IO / orchestration — full Effect" row but
  have no IO; `content-compiler` (fs-bound: `stages/parse.ts:2-3`,
  `fullSurface.ts:2-3`, `artifact.ts:2-3`, `shipBuildingDiscovery.ts:2-3`) is
  in no row; `campaign` is in the "pure" row but reads the filesystem
  (`campaignInput.ts:7-8`).

#### 4. Remaining validation residue (AC 4) — ticket 14's scope

| `file:line` | Finding | Replacement | Risk / effort |
| --- | --- | --- | --- |
| `apps/desktop/src/renderer/zodJitless.ts:19-21` | Only remaining `import … from "zod"` in the tree (`z.config({ jitless: true })`). | Delete the file. No Effect idiom: the renderer keeps no validator. | low / XS |
| `apps/desktop/src/renderer/main.tsx:1-3` | `import "./zodJitless.js"` (the ticket text said `./n.js`; the real specifier is `./zodJitless.js`) + its comment. | Remove import + comment; `./shell/App.js` becomes the first import. | low / XS |
| `apps/desktop/tsconfig.web.json:33` | `include` entry for the deleted file. | Remove the entry (otherwise `tsc -b` errors on a missing file). | low / XS |
| `apps/desktop/package.json:43` | `"zod": "^4.6.5"` — the sole `pnpm why zod` hit. | Remove; `pnpm install` rewrites `pnpm-lock.yaml:169,4291,7631`; `--frozen-lockfile` must pass. | low / XS |
| `apps/desktop/src/main/csp.ts:12-16` | Comment claims the renderer disables Zod's `allowsEval` probe. | Reword: no library in the renderer probes `unsafe-eval`; keep CSP unchanged. | low / XS |
| `apps/desktop/scripts/packaged-smoke.mjs:42-45` | Same stale claim in the benign-console-errors comment. **The file had uncommitted owner changes at audit time** — re-read before editing. | Reword; keep the `BENIGN_CONSOLE_ERRORS` pattern as is. | low / XS |
| `scripts/test/verify-package-dependencies.test.mjs:15` | `zod` as a fixture string. | Leave (fixture, not a dependency). | none |
| `repos/effect/package.json:82` | Upstream source mention. | Leave (read-only subtree, not a workspace member). | none |

After removal the renderer bundle also drops Zod, which is the only reason it
was ever there; `check-renderer-bundle.mjs` needs no change. Historical
"previously Zod `.strict()`" comments in `events`, `combat`, `persistence`,
`content-schema` and desktop `main` are provenance for parity tests, not
residue — leave them.

#### 5. Gap report beyond Zod (AC 5)

**A. Renderer reachability constrains Waves 3–4 (blocking finding).** The
renderer value-imports `@bluewave/ship-design` (70×), `@bluewave/campaign-engine`
(≈100 import sites) and `@bluewave/campaign` (`advanceMonth`), whose `package.json` closure
is `armament, campaign, campaign-engine, content-compiler, content-schema,
contracts, deterministic, diagnostics, persistence, random, ship-design`. Only
`campaign-engine` and `content-schema` declare `"sideEffects": false`, which is
why their existing `effect` import tree-shakes out and the guard passes.
`BluewaveError` is thrown by `SafeInt`; a top-level
`class … extends Data.TaggedError(…)` is a retained side effect and would
bundle `effect` — `MIG-EXCL-1` is absolute ("renderer: nothing"), whatever the
byte cost. **Confirmed by experiment, not assumed** (esbuild 0.25.12 against
`vendor/effect`; entry = `class BluewaveError extends Data.TaggedError(...)`
thrown by a `SafeInt`-style function, tree-shaking on): `effect` is retained —
30.6 KB unminified, 13.6 KB minified, `~effect/` ×11. (Reviewer reproduced
independently: ≈13.6 KB minified.) **Verdict: the renderer-reachable packages
keep their plain error classes.** This follows ADR-0100 §2 as written, so no
ADR is needed to close 16–19/22/23/25; the only ADR-worthy change is the
`ai`/`phase-engine`/`content-compiler`/`campaign` table amendment owned by 30. Safe targets for
Effect idioms are the packages the renderer cannot reach: `events`, `commands`,
`combat`, `ai`, `phase-engine`.

| `file:line` | Finding | Effect v4 idiom | Risk / effort |
| --- | --- | --- | --- |
| `packages/contracts/src/index.ts:57-65` | `class BluewaveError extends Error` — 1707 refs / 310 files; `instanceof` at `phase-engine/src/battlePhases.ts:291`, `combat/src/damage/pipeline.ts:197,225`, `compiler-cli/src/combatDiagnostics.ts:43` | `Data.TaggedError("BluewaveError")` **(rejected: renderer bundle)** | high / S — closed 16 |
| `packages/ship-design/src/{edits.ts:44,persistence.ts:11,units.ts:18,engineAdapter.ts:49,contextBuilder.ts:32,construction.ts:249,study.ts:23,formula/ast.ts:8}` | 8 `Error` subclasses, 42 plain `throw new Error/RangeError`; `EditError` value-imported by the renderer (`useDrawingBoard.ts:11,102`) | `Data.TaggedError` **(rejected: renderer bundle)** | high / M — closed 23 |
| `packages/events/src/ledger.ts:22,28`; `explanation.ts:15,44` | plain `Error`/`TypeError` | `Data.TaggedError` with the existing code string as `_tag` | low / XS — 20 |
| `packages/commands/src/{settlement.ts:19,22,24,31,33,162,167; lifecycle.ts:60,65,426; canonicalization.ts:68; definition.ts:236; specRules.ts:62,69,183,215; validation.ts:93; registry.ts:11,17,35,45,49}` | 22 throws: 5 plain `Error` + 17 `throw Object.assign(new Error(msg), { code })`; codes also embedded in message text | `Data.TaggedError` carrying `code`; message string preserved | low / M — 24 |
| `packages/combat/src/air-combat/records.ts:43`; `mines/contracts.ts:153,170` | 3 plain `Error` throws among 432 | `Data.TaggedError` (combat-local) or the existing `BluewaveError` | low / XS — 26 |
| `packages/ai/src/aiPlanner.ts:36,41,49`; `aiCommandGenerator.ts:24,37,46,74,131,158` | 9 plain throws; local SafeInt coercions duplicate `contracts` | `Data.TaggedError`; reuse `SafeInt` from `@bluewave/contracts`; **no Effect runtime** | low / S — 29 |
| `packages/phase-engine/src/snapshotClone.ts:61,124,595,604,614,636`; `financial-ledger.ts:33`; `commandLifecycle.ts:524` | 8 throws (7 plain + 1 `Object.assign(new Error, {code})`) | `Data.TaggedError`; **no `Layer`/`Context.Service`** (no IO) | low / S — 30 |

**C. The renderer-bundle guard's marker is weak.**
`apps/desktop/scripts/check-renderer-bundle.mjs:17` looks for `EffectTypeId`.
In the esbuild experiment above `EffectTypeId` appears 8× unminified but **0×
minified**, while the stable `~effect/` namespace strings appear 11× in both.
The renderer build is minified, so the guard can pass on a bundle that contains
`effect`. A direct check of the existing `apps/desktop/out/renderer` for
`~effect/` found nothing, so the shipped bundle *is* clean today. Fix
(code change, so not done here): add `"~effect/"` to `MARKERS`; folded into
ticket 14 as an adjacent step, and the Wave 3/4 gates (21, 33) must use it.

**B. IO surfaces that genuinely need the Effect runtime (Wave 5).**

| `file:line` | Finding | Effect v4 idiom | Risk / effort |
| --- | --- | --- | --- |
| `apps/desktop/src/main/index.ts:149-171,217` | 6 `ipcMain.handle/on` + async `whenReady`; no runtime | one `ManagedRuntime` built from an app `Layer`; handlers via `runPromise` | medium / M — 35 |
| `apps/desktop/src/main/{project.ts:25,contentArtifact.ts:20}` | `ProjectFormatError`, `ContentArtifactError extends Error`; 12 plain throws in `main` (`project.ts:35,41,55,96,156`, `compiler.ts:24`, `researchCommands.ts:247`, `researchDeterminismChild.ts:63,82,90,94,97`) | `Data.TaggedError` (main is not renderer-reachable) | low / S — 35 |
| `packages/persistence/src/{store.ts:1-11,recovery.ts:1-2}` | sync `node:fs`; public `SaveStore` is sync (ADR-0104 §6) | behind an async facade only if 34 proves a need; else stays | high (API break) / M — 34 |
| `packages/content-compiler/src/{stages/parse.ts:2-3,fullSurface.ts:22-34,artifact.ts:2-3,safePath.ts:13,18}` | sync fs + 5 plain throws; renderer-reachable by `package.json` closure | stays plain unless the CLI/main boundary needs a typed failure | medium / S — 34 |
| `apps/compiler-cli/src/main.ts:2`; `safePath.ts:13,18` | sync `readFileSync`; plain throws | `runPromise` entrypoint over Effect internals | low / S — 36 |

#### 6. Corrected delta plan (AC 6)

Executable order (a ticket is on the frontier when its row's blockers are done):

| Order | Ticket | Blocked by | Frontier now |
| --- | --- | --- | --- |
| 1 | 14 remove `zod` (§4 residue) | none (08–13 done) | **yes** |
| 2 | 15 Wave 2 exit gate | 14 | no |
| 3 | 20 `events` remainder (4 throws) | 15 | no |
| 4 | 21 Wave 3 exit gate | 20 | no |
| 5 | 24 `commands` (5 throws + payload error) | 21 | no |
| 5 | 26 `combat` residual (3 throws) | 21 | no |
| 5 | 29 `ai` (runtime-free typed errors) | 24 | no |
| 6 | 30 `phase-engine` (7 throws; **ADR-0100 table amendment**) | 24, 26, 29 | no |
| 7 | 33 Wave 4 exit gate | 30 | no |
| 8 | 34 facade unification — **first deliverable: an inventory** of surfaces that need Effect types | 33 | no |
| 9 | 35 desktop `ManagedRuntime`; 36 compiler-cli `runPromise` | 34 | no |
| 10 | 37 final acceptance → 38 Wave 5 gate | 35, 36 → 37 | no |

Edge corrections: 22 (`campaign`) is closed, so 24 now follows gate 21 directly;
26–30 lose their 22/25/27/28 edges; old edge `23 ← 19` bypassed the Wave 3 gate
(`MIG-WAVE4-ENTRY`) and is moot now that 23 is closed.

**Explicitly deferred (not scheduled, recorded so they are not silently dropped):**

1. `BluewaveError`/`ship-design`/`campaign` error classes → `Data.TaggedError`:
   deferred until the renderer can consume an Effect-free error contract (e.g.
   a plain-TS error package with `_tag`, or renderer-side `sideEffects:false`
   proven by the bundle guard). Revisit only with an ADR.
2. Hand-rolled reason-code validators — `combat` (~290 `validate*/parse*/assert*`
   helpers), `commands` (`diplomacyValidation.ts`, `divisionValidation.ts`, 28
   in total): they return structured reason-code results, not throws; moving
   them to `Schema` would reorder issue output and risks `MIG-WIRE-3`.
3. `persistence` async/Effect IO facade (ADR-0104 §6) and routing remaining
   `SaveStore` failure sites through `PERSISTENCE_*` tagged errors (ADR-0104
   consequences): decided by ticket 34's inventory.
4. `campaignInput.ts:7-8` filesystem read inside a "pure" package: policy
   question (move to `content-compiler`/main boundary), not an Effect gap.
5. `DiagnosticCollector` → Ref-backed service: not pursued (ADR-0104).

**Stale text found in the planning docs (not edited — superseded by ADRs):**
`plan.md` §4.2 `optionalWith({ default })` and "Struct is closed by default"
(ADR-0104 §2–3: v4 uses `withDecodingDefaultType`, and the decoder *strips*
excess keys); `plan.md` header `Status: proposed`; ADR-0100 §2 table rows for
`ai`/`phase-engine`/`content-compiler`/`campaign` (§3 above).

#### 7. Tracker edits made

`Status`/`Frontier`/`Blocked by` lines and an "Audit note (ticket 00)" were
updated in tickets 08, 10, 11 (stale `Frontier`), 12, 13 (closed), 14
(frontier), 15, 16–33 (as per §2/§6), 34 (inventory-first) and 35 (concrete
targets). Closed-not-needed tickets use the documented `resolved` status and
`Blocked by: none`; the reason is in each ticket's `## Comments`. A
"Reconciliation" note was added under the wave table in `spec.md` so
`MIG-WAVE3-EXIT`/`MIG-WAVE4-EXIT` no longer contradict the tracker. The
`.ai/specs/effect-v4-vendor-migration.md` pointer line (which introduced this
ticket) was already modified before the audit started and is committed with it.
No production code, config, content or test file was touched.

### Final status (2026-10-12) — migration complete

The corrected delta plan (§6) was executed to completion on `dev`:

- **Wave 4:** tickets 24 (`e5bb77f1`), 26 (`2e668e99`), 29 (`ca0ea1d2`),
  30 (`a2cc02eb`, incl. the ADR-0100 table amendment); exit gate 33
  (`.ai/reports/effect-v4-wave4-exit-gate.md`).
- **Wave 5:** tickets 34/35/36 closed as a documented decision (**ADR-0128**):
  facade flips are barred by renderer reachability (`MIG-EXCL-1`/ADR-0125) and
  the blind-wrapping prohibition (ADR-0100 §2); no `ManagedRuntime`/`runPromise`
  facade introduced (no composable async service graph). Ticket 37 final
  acceptance and 38 Wave 5 exit gate passed
  (`.ai/reports/effect-v4-final-acceptance.md`): `pnpm check` EXIT 0, packaged
  Electron smoke 14/14, cross-process hashes unchanged, renderer bundle clean,
  127 ADRs indexed.
- **State:** every ticket 00–38 is `done`/`resolved`; no ticket remains open.
