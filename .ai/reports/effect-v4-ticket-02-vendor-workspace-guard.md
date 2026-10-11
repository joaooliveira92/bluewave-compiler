# Validation Report: EFFECT-V4 ticket 02 — Wire vendored packages into the workspace + single-copy guard

## Outcome

`PASS`

## Scope delivered

Ticket `.scratch/effect-v4-vendor-migration/issues/02-vendor-workspace-graph-guard.md`
(proves MIG-VENDOR-4, MIG-GRAPH-1, MIG-GRAPH-2). The vendored `effect@4.0.2` and
`@effect/vitest@4.0.2` copies (from ticket 01, commit `6fc7ed9d`) are now the
**only** resolvable `effect` in the pnpm graph:

- `vendor/effect` and `vendor/effect-vitest` are pnpm workspace members.
- `pnpm-workspace.yaml` top-level `overrides:` maps `effect` and `@effect/vitest`
  to `workspace:*`, so any (incl. transitive/peer) request resolves to the
  vendored copies. (pnpm 11 reads `overrides` from `pnpm-workspace.yaml`, not
  `package.json#pnpm.overrides`; the spec/plan wording was corrected accordingly.)
- `scripts/assert-single-effect.mjs` is a hard `pnpm preflight` gate: it fails if
  more than one distinct `effect` resolution exists, if any registry `effect`
  (or `@effect/vitest`) is resolved, or if the lockfile is missing/empty/
  unrecognized (fail-closed). It ships 9 embedded self-test fixtures, run inside
  `pnpm preflight`.
- Root `test:run` excludes the vendored members (`--filter='!./vendor/*'`), so
  `pnpm -r exec vp test run` no longer runs in the test-less vendor packages.

Deferred (by design, out of this ticket): the first real consumer of `effect` and
any Zod→Effect-Schema migration (tickets 05+). No `effect` import was added to any
domain/application code.

## Requirements evidence

| Requirement  | Implementation                                                                                                                     | Proving test / evidence                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| MIG-VENDOR-4 | `pnpm-workspace.yaml:4-5` (`packages:` += vendor dirs); `pnpm-workspace.yaml:13-20` (`overrides`)                                  | lockfile importers `vendor/effect`, `vendor/effect-vitest`; `pnpm install --frozen-lockfile` no-op                                  |
| MIG-GRAPH-1  | `scripts/assert-single-effect.mjs` (`checkLockfile`, `runSelfTest`); `package.json` `preflight`; `test:run` filter                 | `node scripts/assert-single-effect.mjs` exit 0; `--self-test` 9/9; seeded duplicate fixtures + empty/garbage fixtures exit non-zero |
| MIG-GRAPH-2  | `pnpm-workspace.yaml` overrides + vendored wrapper `package.json` version `4.0.2` satisfying `@effect/vitest` peer `effect ^4.0.2` | lockfile has zero `packages:`/`snapshots:` key `effect@<version>`; only `link:../effect`                                            |

## Commands and observed results

```text
pnpm -w turbo run build --force      -> Tasks: 20 successful, 20 total (0 cached); EXIT 0
pnpm -w turbo run typecheck --force  -> Tasks: 37 successful, 37 total (0 cached); EXIT 0
pnpm lint                            -> 0 warnings, 0 errors (1928 files); EXIT 0
pnpm format                          -> All matched files use the correct format (2150 files); EXIT 0
node scripts/assert-single-effect.mjs            -> ok (no registry effect; workspace:vendor/effect); EXIT 0
node scripts/assert-single-effect.mjs --self-test -> self-test ok (9 fixtures); EXIT 0
  (fail-closed repro: empty + header-less lockfile -> EXIT 1 "unrecognized pnpm-lock.yaml ... failing closed")
pnpm install --frozen-lockfile       -> Already up to date; no lockfile mutation; EXIT 0
pnpm preflight                       -> preflight ok; self-test ok; guard ok; docs-check ok (325 links, 98 ADRs); EXIT 0
pnpm test:run                        -> Test Files 241 passed (241); Tests 1554 passed (1554); EXIT 0
pnpm test:cross-process              -> {"success":true, ...}; EXIT 0
node scripts/verify-golden-hashes.cjs -> All 10 hashes match golden reference; EXIT 0
git status --short                   -> modified: package.json, pnpm-workspace.yaml, pnpm-lock.yaml, ticket md, spec/plan md; new: scripts/assert-single-effect.mjs
```

Adversarial reviewer verdict: **APPROVE** (one MEDIUM — fail-open on a corrupt
lockfile — and cheap LOWs were repaired before this gate: fail-closed header/
section check, legacy leading-`/` key stripping, `--self-test` wired into
preflight, corrected `pnpm why` evidence note).

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Initial snapshot hash: `16708259cc8018447fbe3c88c2ddfb737a27c3e51e8892c9b5fa112f6be896a5`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Command ledger hash: `48fa215feeaea217c0f3906ebf99c3deddb8697eb6090dd6ae3fa84ea3841a20`
- Event ledger hash: `26af2cf3b853a824b98cb33af1d85086748b2848253538f8986e38f014c20ee5`
- Financial ledger hash: `b5b481d9de8ab2d165920cfe61c1d4baa8440b5ca81b90fc41b121fa99fbbf7a`
- Random-decision ledger hash: `cb9e67f9a76ac4c5cc79f85eade020775beaef9053d1f4c0d6ff19eb3100f678`
- Replay result: `replayVerificationHash 097f9929…`; `"success": true`
- Processes and operating systems used: two child processes, macOS (darwin), Node per repo engine

Goldens: 10/10 unchanged. This ticket changes no domain code, so authoritative
hashes are expected to be unchanged — and they are.

## Canonical artifact changes

None. No content/ruleset/serializer/hash-affecting change. `pnpm-lock.yaml`
changed (overrides + two new vendor importers), plus benign pnpm re-resolution
normalizations (`@jridgewell/sourcemap-codec` 1.5.5→1.6.0 on one edge;
`@vitest/ui@5.0.3(vitest@5.0.3)`→`@vitest/ui@5.0.3` peer-suffix dedupe). Both are
lockfile-only and self-consistent under `--frozen-lockfile` (verified no-op).

## Tests added

- `scripts/assert-single-effect.mjs` `--self-test`: 9 embedded fixtures
  (zero-resolution→ok; single workspace link→ok; same link from two depths dedupes
  →ok; registry `effect@4.0.2` package entry→fail; two distinct link targets→fail;
  registry `@effect/vitest@4.0.2`→fail; legacy `/effect@4.0.2` key→fail; empty
  lockfile→fail-closed; header-less garbage→fail-closed). Negative fixtures make
  the checker load-bearing; the "two distinct link targets" fixture satisfies the
  ticket's seeded duplicate-resolution requirement.

## Security and cancellation

Not applicable to runtime security/abort surfaces (no long-running I/O). The guard
is fail-closed: missing, empty, or unrecognized lockfile exits non-zero. No ambient
I/O (clock/RNG/env/network) in the guard; `checkLockfile` is pure.

## Performance observations

`pnpm preflight` gained one self-test run (9 fixtures) and one lockfile scan —
sub-millisecond. No measurable build/test regression.

## ADRs and dependencies

- No new ADRs in this ticket (the four governing ADRs are ticket 03's deliverable).
- No new dependency. The guard is dependency-free (no YAML package).
- Documented deviation: pnpm-11 `overrides` live in `pnpm-workspace.yaml`
  (top-level), not `package.json#pnpm.overrides`; spec/plan text corrected.

## Known limitations and deferred requirements

- No consumer declares `effect` yet (ticket 05), so the sole resolution is the
  workspace link auto-installed for `@effect/vitest`'s peer. The guard accepts the
  zero-resolution case by design.
- `pnpm why effect -r` prints nothing on pnpm 11.21.0 (it does not report `link:`
  dependencies); the lockfile scan + guard are the authoritative proof.
- `vendor/*/ai-docs/package.json` declare `@effect/*` specs but are NOT workspace
  members (packages globs are exact); they must never enter the graph.

## Changed files

- Root config: `pnpm-workspace.yaml` (members + overrides), `package.json`
  (`preflight` gate, `test:run` filter), `pnpm-lock.yaml` (regenerated).
- Scripts: `scripts/assert-single-effect.mjs` (new guard + self-test).
- Traceability: `.scratch/effect-v4-vendor-migration/issues/02-*.md` (ACs, status,
  comments), `spec.md`/`plan.md` (override-location wording),
  `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`, this report.

## Git and remote status

- Branch: `dev`
- Commits: see the accompanying `chore(effect): wire vendored packages into the workspace + single-copy guard` commit
- Working tree: clean after commit
- Push status: not pushed (local sprint; no push requested)
- Pull request: none
- Merge performed: no

## Secondary consistency check

Re-read every changed file after the repair; re-ran the guard, `--self-test`,
`pnpm install --frozen-lockfile` (no-op), and the full gate. Confirmed no
`effect@<version>` key in `packages:`/`snapshots:`, `vendor/**`/`repos/**`
untouched, and `vendor/**` still excluded from lint/format (`vite.config.ts`).
