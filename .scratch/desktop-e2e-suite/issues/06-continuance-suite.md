# 06 — Continuance suite: load / verify / replay / recover

**What to build:** the save-continuity half of the suite. From the landing
screen, the player's package operations work against a real on-disk
production save: Load restores the package to Overview (Austria-Hungary,
turn 0), Verify reports integrity, Replay completes deterministically, and
Recover repairs a damaged package — optionally with a tamper→mismatch check.
Every spec targets a **copy** of the shipped production package; the shipped
tree is never mutated.

**Blocked by:** 01 — Harness scaffold runs green (the create-side narrative
is not a prerequisite — this file is independent, but the fixture-copy
helper from the harness is).

**Fixture sourcing (updated — the previously-shipped package is gone):** the
`content/production/1880/bluewave-austria_hungary-scen_1880/` package that the
coverage matrix pointed at was untracked and is **no longer in the working
tree** (recorded by ticket 02). Continuance fixture options to resolve:
(a) generate the package via the create-side compile flow (ticket 02's
spec already produces an on-disk SaveStore package with the fixed seed) and
copy it; or (b) regenerate + commit a pristine fixture package in the repo.
Pick (a) unless the committed fixture is wanted for CI immutability.

**Status:** resolved

- [x] Spec file (`continuance` suite) with exclusive paths to a fresh copy of
      a production package for each row (matrix rows 7–10; row 11 findings
      below).
- [x] Load: Overview restored with the package's nation and turn (restored to
      turn 0; campaign identity intact).
- [x] Verify: integrity report surfaces an OK/valid state; the app remains
      operable (can reach Overview).
- [x] Replay: deterministic replay completes cleanly end to end — no
      hash/golden assertions here, per the map (owned by the cross-process
      gate).
- [x] Recover: a tampered copy surfaces the corruption and recovers to a
      playable package (opens to Overview) without crashing.
- [x] Shipped fixture package untouched (copies only; this ticket's fixture
      is compiled fresh, never sourced from the shipped tree).
- [x] All assertions user-visible only; hermetic; serial; workers: 1.
- [x] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).

## Answer

Resolved. `apps/desktop/e2e/continuance.spec.ts`, serial, independent of
`mvp-loop.spec.ts`.

**Fixture sourcing — option (a) taken.** The shipped
`content/production/1880/bluewave-austria_hungary-scen_1880/` package is
still absent (ticket 02's finding stands). Two "setup" specs compile master
fixture packages via the same create-side flow as `mvp-loop.spec.ts` row 1,
into their own `mkdtemp` trees (outside any per-test harness scratch, so
they survive teardown across the file's later specs — mirrors
`sharedSaveDir`'s pattern):
- `masterPackageDir` — a fresh compile, turn 0 only (Load/Verify/Replay/the
  row-11 investigation all target copies of this).
- `recoverMasterPackageDir` — a fresh compile **plus one advanced month**
  (two saves on disk), because Recover needs a predecessor save to revert
  to; a turn-0-only package has none.

`fixtures.ts`'s `copyFixturePackage` was generalized from a hardcoded
shipped-package source to `copyFixturePackage(sourceDir, scratchRoot)` — the
hardcoded constant pointed at a directory that no longer exists.

**Tamper mechanism:** `tamperActiveSave()` reads `pointer.json` for the
active save id, then rewrites that save's `campaign.json` with a mutated
`snapshot.campaignId` (valid JSON, so the failure is specifically
`SaveStore.load`'s rawHash mismatch — `packages/persistence/src/store.ts`
— not a parse error). Deterministic, no flakiness observed across repeated
runs.

**Row 10 (Recover):** tamper the two-revision package's active (turn-1)
save; Recover reverts to the turn-0 predecessor
(`RecoveryManager.revert`), reporting "Recovery complete — active revision
0"; the recovered package then opens cleanly to Overview.

**Row 11 (tamper → Verify mismatch) — NOT covered, and here's why:**
investigating this row surfaced a real renderer honesty gap, not a flaky
fixture. `verifyCampaign` correctly returns `outcome: "success"` with
`value: { valid: false, issues: [...] }` for a corrupt package (verify
itself never fails — it *reports*). But
`verificationResultFromBridge` (`renderer/screens/campaign-file/utils/
package-operations.ts`) maps every `outcome: "success"` response to the
`"verify"` result kind without inspecting `valid`, and
`OperationResultMessage`'s verify branch (`OperationStatus.tsx:60-67`)
unconditionally renders "Package verified — campaign …, active revision …"
— it never reads `response.valid` or `response.issues`. **A tampered
package's Verify currently shows the identical "Package verified" success
copy as a healthy one.** This is a stub-surface contract violation
(`OperationResultMessage` fabricates success copy for a failed integrity
check), but fixing it means editing renderer source, which is out of scope
for this test-only effort (`.ai/ENGINEERING-CONTRACT.md`). Writing a row-11
test against today's behavior would assert the bug as correct and hide it
in a green suite — worse than not covering it. Per the coverage matrix's
own allowance ("If the corrupted-package fixture fights the harness … keep
row 10 as the minimum and mark row 11 covered by unit"), row 11 stays
covered by `packages/persistence`'s unit tests; this finding is recorded in
`continuance.spec.ts` as a comment and here as a flagged follow-up (a
renderer bug ticket, not an e2e-suite gap).

**Validation**: `pnpm --filter @bluewave/desktop build` then
`pnpm --filter @bluewave/desktop test:e2e` → `13 passed` (full suite: smoke
+ mvp-loop rows 1–6 + continuance setup ×2 + rows 7–10). `tsc --noEmit
--strict` on the e2e files → clean; `vp lint apps/desktop/e2e` → 0
warnings/errors; desktop unit suite → `49 files / 360 tests passed`,
unaffected.