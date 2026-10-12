# Production-readiness status

**Date:** 2026-10-12 · **Branch:** `dev` · **Driver:** production-readiness mission
(`.scratch/handoff/production-readiness-prompt.md`).

## Environment caveat (acted on, not trusted)

A second autonomous writer committed to `dev` throughout this session, and twice
ran `git reset`/ref-lock races against this work. State was re-derived from Git
before every write; every change below landed as a small, immediately-committed
step with explicit pathspecs. The other writer's in-flight sprint (SB-3
building-ships: ADR-0129…0132, then INC-5c/INC-14) interleaves this history.

## Workstreams

### WS7 — tracker pruning — DONE (`57133aeb`)

Deleted 27 fully-completed `.scratch` efforts (spec destination reached, every
ticket resolved), the stale `refactor.txt`/`shipbuilding.txt`, and the dangling
`.ai/specs/*.md` pointers; rewrote `.ai/specs/README.md`. Tagged
`scratch-archive-2026-10-12` on the pre-prune HEAD. `docs-check`, doc-budgets and
no-unknown-casts stayed green.

### WS5 — stale ticket statuses — DONE (`4e2fce47`)

B-3/B-4/C-1/C-2/C-3 were marked `READY_FOR_AGENT`/`open` while the capabilities
exist and are tested. Verified with
`pnpm --filter @bluewave/combat exec vp test run test/gunnery test/damage test/torpedo test/mines test/submarines`
→ **123 files, 1879 tests passed**; deleted the five superseded folders + their
pointers.

### WS1 (blocker slice) — golden hashes — DONE (`71585dd4`)

`determinism.yml` was red on `dev`: `golden/hashes.json` had not moved since
`bccfb2a1` (2026-10-08) despite 92 authoritative commits since (notably ADR-0129's
compatibility bump). Confirmed deterministic (two fresh child runs byte-identical),
re-pinned, and recorded old→new in `.ai/reports/release-readiness-golden-repin.md`.
`node scripts/verify-golden-hashes.cjs` → all 10 match.

### WS6 — test-suite signal quality — PARTIAL

- **DONE (`44cc5d20`):** `scripts/verify-test-focus.mjs` added to the preflight
  gate set — `.only` always fails; `.skip` fails unless annotated
  (`// test-focus-allow-skip: <reason>`). The one legitimate Electron-conditional
  skip is annotated. Fixtures + `pnpm test:scripts` (67) green.
- **NOT DONE:** the base-ui HoverCard `act()` warning flood (~103 lines per
  drawing-board test file) is _diagnosed, not fixed_: base-ui `PreviewCard`
  open/close timers (`SECTION_OPEN_DELAY`/`SECTION_CLOSE_DELAY`) and floating-ui
  rAF updates fire after the tests' synchronous `fireEvent`. Recommended fix:
  per-file `vi.useFakeTimers` advanced inside `act` for the hover-card tests
  (ticket `.scratch/test-hygiene/issues/01`).

### WS2 — release-readiness gaps — DONE

- **01 perf tripwire (`cab45522`):** `apps/desktop/src/main/perf/monthAdvance.perf.test.ts`
  drives the real `MonthExecutor` for 12 months over the production 1880 pack at a
  fixed seed; measured **1071ms baseline**, ceiling **3300ms (3x)**. Gated behind
  `BLUEWAVE_PERF=1` and run as a dedicated `quality.yml` step. The strategy-map
  budget is documented as a manual DevTools check (ticket resolution).
- **02 crash observability (`f0d1d11c` + ADR-0133):** local-only support bundle at
  `<userData>/support` (error + versions + platform; no save data), main
  `uncaughtException`/`unhandledRejection` + renderer `error`/`unhandledrejection`
  handlers that never hide a failure, validated renderer→main IPC, no network call.
  9 tests force a crash and assert the bundle exists. The Electron boundary
  allowlist test was extended for the one new channel/member (landed inside the
  other writer's commit `83191272` after a ref-lock race).

### WS3 — save compatibility — COVERED, corpus not extended

Ticket 03 was already resolved (ADR-0113 reject-on-mismatch; round-trip +
per-prior-version rejection tests in
`packages/persistence/test/save-compatibility-policy.test.ts`). The mission's
"per-released-version fixture corpus" was **not** added as checked-in save bytes:
no released version exists yet, and the ticket's own resolution designates the
current round-trip test as the corpus seed. Recorded as the remaining delta.

### WS4 — design-doc / ADR reconciliation — MECHANICAL PART GREEN, CONTENT AUDIT REMAINING

`pnpm preflight`'s docs gates are green: every DESIGN-referencing ADR is
classified in `docs/adr/AMENDMENTS.md` and `docs/check` fails on drift. The
broader "80+ behaviour-changing ADRs vs `Canonical design baseline`" content audit
(and the behaviour-changing ADRs that map to no DESIGN doc) is **large and not
completed** in this session.

### WS1 — cut the release — NOT CUT

Blocked, precisely:

1. The other writer is still landing authoritative behaviour on `dev`; a release
   cannot be frozen mid-sprint.
2. Golden hashes must be re-verified at the freeze (any further authoritative
   commit must re-pin in its own commit).
3. Signing secrets (`MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`,
   `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, `WIN_CSC_LINK`,
   `WIN_CSC_KEY_PASSWORD`) cannot be verified from this environment; the draft
   release should be cut by tag after the freeze so `release.yml` produces signed
   dmg/zip/nsis/AppImage artifacts.
4. `CHANGELOG.md` "Unreleased" should move under the new version and
   `apps/desktop/package.json` bumped to match the tag at that point.

## Validation evidence (this session)

| Gate                                    | Result                                                                                                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm preflight`                        | **11/11** (incl. the new test-focus gate)                                                                                                                                                    |
| `pnpm format`                           | green (after `076d7adf` formatted 8 files)                                                                                                                                                   |
| `pnpm typecheck`                        | **37/37** at HEAD                                                                                                                                                                            |
| `pnpm build --force`                    | **20/20**                                                                                                                                                                                    |
| `pnpm check:licenses`                   | ok (167 deps, 10 licences)                                                                                                                                                                   |
| `pnpm check:balance-reports`            | ok                                                                                                                                                                                           |
| `pnpm test:run`                         | 1782 passed pre-boundary-fix; after the boundary fix the only full-run failure is a **load-flake** in the other writer's 21s AI-procurement suite (passes in isolation: ship-design 887/887) |
| `node scripts/verify-golden-hashes.cjs` | all 10 match                                                                                                                                                                                 |

## Remaining, in leverage order

1. **Cut the release** once the behaviour sprint freezes (golden re-pin + CHANGELOG
   - version + `v*` tag → draft release; verify signed artifacts).
2. **WS4 content audit** — annotate the owning DESIGN docs for the behaviour-changing
   ADRs listed in `.scratch/doc-reconciliation/issues/01`.
3. **WS6 act-warnings** — fake timers flushed in `act` for the drawing-board hover tests.
4. **WS3 corpus** — check in a save fixture per released version on the first release.
