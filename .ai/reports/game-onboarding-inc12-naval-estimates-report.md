# Validation Report: game-onboarding-first-month INC-12 (Monthly Naval Estimates report + history sidecar)

## Outcome

`PASS_WITH_LIMITATIONS` — the INC-12 deliverable is complete and every scoped gate is
green. The full `pnpm check` chain stops on a **pre-existing, unrelated** e2e failure
(`e2e/ship-types.spec.ts`, shipbuilding armour `BELT_MAIN` selector) that reproduces at
`HEAD` without this change (see "Commands and observed results"). It is outside this
ticket's surface and is documented, not repaired (failure policy).

## Scope delivered

Implemented entirely under `apps/desktop/**` + the shared desktop contract:

- **Monthly Naval Estimates report** rendered from the real `CommitMonthResponse`, with
  sections **Treasury** (real `MonthReport` figures + `researchExpense` from the ledger
  `RESEARCH_EXPENDITURE` category + `governmentAllocation` from `NAVAL_APPROPRIATION` +
  real `financialLedger` rows), **Construction** (per-project work from
  `ConstructionProgressed`; completed ships + newly-active projects from pre→post
  snapshot deltas), **Research** (`ResearchProgressed` + `TechnologyDiscovered`),
  **Priorities** (the INC-2 `buildPrioritiesProjection` over the canonical post-month
  snapshot, with new/resolved/continuing derived from the previous report's
  fingerprints), **Fleet** (additions + active total), and **Battle Outcomes** (its own
  plain-text subsection from `closingSnapshot.battleOutcomes`).
- **`monthly-reports.json` sidecar** (per-campaign, app-owned): atomic tmp→rename write,
  tolerant read (missing/corrupt → empty), keyed by `campaignId` via save-dir location,
  pruned to the most recent 12, **never** in the authoritative envelope/hash and never
  read by `MonthExecutor`. Main appends one derived entry per successful `commitMonth`;
  the renderer reads it read-only via a new `readMonthlyReports` bridge command.
- Overview's "Recent Developments" now reads the sidecar (replacing the in-memory-only
  month history); `month-summary.ts` and its shell plumbing were removed.

**Explicitly cut (absent, not empty), per spec §16:** Diplomacy section, research
budget-effectiveness/settings effects, per-ship maintenance effect, construction
"stalled".

**Not built:** a separate full-screen report surface — the pinned design names the
existing Overview card as the report surface.

## Requirements evidence

| Ticket acceptance criterion                                             | Implementation                                                                                                                      | Proving test                                                                                                                 |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Sections render faithfully from real fields                             | `main/commands/commitMonth/reportEntry.ts`, `renderer/screens/overview/components/MonthReport*Section.tsx`, `MonthlyReportView.tsx` | `reportEntry.test.ts` (derivations), `MonthReportCard.test.tsx` (sections), `monthlyReports.test.ts` (entry ↔ real response) |
| No CUT section anywhere                                                 | `MonthlyReportEntry` type + sections                                                                                                | `MonthReportCard.test.tsx` "never renders a CUT section"                                                                     |
| Battle Outcomes own subsection, plain text                              | `MonthReportBattleOutcomesSection.tsx`                                                                                              | `MonthReportCard.test.tsx` (`region` "Battle Outcomes")                                                                      |
| `monthly-reports.json` atomic/tolerant/keyed/pruned/never-authoritative | `main/monthlyReports.ts`                                                                                                            | `monthlyReports.test.ts` (tmp cleanup, abort, missing/corrupt→empty, prune-12, sibling-of-save-ids, envelope/hash unchanged) |
| `generatedAt` from save metadata, never `Date.now()`                    | `commitMonth.ts` (`saveMetadata.timestamp`)                                                                                         | `monthlyReports.test.ts` compares to `metadata.json` `timestamp`                                                             |
| Overview reads sidecar read-only                                        | `useMonthlyReports.ts`, `useOverviewModel.ts`, `OverviewScreen.tsx`                                                                 | `useMonthlyReports` wiring + `embedded-cards.test.tsx`, screen capture                                                       |
| Goldens unchanged; tests cover sections + sidecar                       | —                                                                                                                                   | `check:golden` 11/11; desktop suite 2010 passed                                                                              |

## Commands and observed results

```text
pnpm --filter @bluewave/desktop test
  → 292 test files passed | 1 skipped (293); 2010 tests passed | 1 skipped

pnpm typecheck
  → 40 successful, 40 total (tsc -b / --noEmit)

pnpm lint            (vp lint .)
  → Found 0 warnings and 0 errors (2352 files)

pnpm format          (vp fmt --check .)
  → All matched files use the correct format (2658 files)

pnpm check:golden
  → All 11 hashes match golden reference

pnpm check:determinism
  → cross-process determinism: two runs byte-identical

pnpm check:equivalence
  → equivalence determinism: two fresh processes byte-identical
     (report sha256 ebd0ddb6d0ad3b0768e2a1140caf44084cf7964918e3e043202263fe04d5d5f4)
     catalogue determinism: byte-identical (parts sha256 bcc06ad1e42565902db1b06fa72e0f7416bddf9c20c778451889bb3bd9109dcb)

pnpm check
  → FAILED at apps/desktop test:e2e: e2e/ship-types.spec.ts:27 timed out waiting for
    getByTestId('shipbuilding-dialog').getByRole('textbox', {name: 'Thickness of BELT_MAIN (mm)'})
    27 passed, 1 failed, 2 did not run

  Pre-existence proof: `git stash push -u -- apps/desktop` (removing this change),
    `pnpm --filter @bluewave/desktop build`, `pnpm --filter @bluewave/desktop test:e2e e2e/ship-types.spec.ts`
  → SAME failure at HEAD 378ea4aa without this change; `git stash pop` restored the work.
```

All other `pnpm check` steps before `test:e2e` (preflight, format, lint, `lint:effect`,
`test:scripts`, licenses, typecheck, build, `content:verify`, `test:run`, `test:heavy`,
golden, determinism, equivalence, golden-repin, balance-reports) passed on the run that
then hit the e2e failure.

## Determinism evidence

- Content artifact hash: unchanged (no content/package touched).
- Initial/Closing snapshot, command/event/financial/random ledgers: unchanged.
- `pnpm check:golden`: 11/11 match; `pnpm check:determinism`: two runs byte-identical;
  `pnpm check:equivalence`: byte-identical (`ebd0ddb6…`).
- No `Date.now()`/ambient time/env/random/locale in any derived or authoritative path.
  The stored `priorities` array carries `toLocaleString()` text but is app-layer,
  non-authoritative, and never re-enters gameplay.
- Processes/OS: single macOS host; cross-process child run twice.

## Canonical artifact changes

None. `apps/desktop/**` only; no engine/content/save/hash surface changed.

## Tests added

- `main/commands/commitMonth/reportEntry.test.ts` — section derivations (completed
  ships, newly-active projects, construction/research/discovery event extraction).
- `main/monthlyReports.test.ts` — sidecar atomic write/tmp cleanup/abort, tolerant read,
  prune-12, never-authoritative, and real `commitMonth` ↔ entry integration.
- `renderer/screens/overview/MonthReportCard.test.tsx` and updated
  `month-report-format.test.ts`, `embedded-cards.test.tsx` — section rendering, CUT
  absence, Battle Outcomes subsection.
- Updated bridge/schema/shell tests for the new command and the sidecar data source.

## Security and cancellation

- `readMonthlyReports` IPC payload validated by `SessionIdPayloadSchema`; sidecar decoded
  with a strict Effect `Schema`; write path is a fixed filename under `saveDir` (no
  traversal); tmp→rename with `rmSync(tmp)` cleanup on failure; `AbortSignal` checked
  before any fs work.

## Performance observations

Non-authoritative. `pnpm snap` captured the Overview report; console reported
`structural=0 attributes=0` idle mutations (clean, no churn warning).

## ADRs and dependencies

No new ADR. No new dependency. The sidecar mirrors the existing `ui-state.json` pattern
(INC-3).

## Known limitations and deferred requirements

- **Pre-existing e2e failure** (`e2e/ship-types.spec.ts`, shipbuilding armour) — unrelated
  to this ticket, reproduces at HEAD. Should be triaged under the shipbuilding /
  ship-part-model effort.
- **Sidecar-write diagnostic is returned but not displayed** on the success path
  (reviewer LOW). The month still commits; the report entry is lost silently to the
  player.
- `appendMonthlyReport` does not de-duplicate by month (reviewer LOW; no live duplicate
  path exists because retries are blocked by `REVISION_MISMATCH`).
- The `defaultOpen` of the Overview panel is sampled once at mount, so a reloaded
  campaign's async history can mount the panel collapsed (reviewer LOW; matches the
  pre-existing `CollapsiblePanel` behaviour).
- No direct unit test for `useMonthlyReports` (revision-triggered reload / empty-on-error).

## Changed files

`apps/desktop/**` only — new: `main/monthlyReports.ts` (+test),
`main/commands/commitMonth/reportEntry.ts` (+test), six `MonthReport*Section.tsx`,
`MonthlyReportView.tsx`, `useMonthlyReports.ts`. Modified: shared contract, bridge,
schemas, `commitMonth.ts`, Overview screen/card/model/format, shell
(`CampaignShellContext`, `campaign-shell-state`, `useCampaignShell`). Deleted:
`renderer/lib/month-summary.ts` (+test).

## Git and remote status

- Branch: `dev`
- Commits: (see sprint final message)
- Working tree: clean for this ticket's paths after commit (a concurrent session's
  unrelated ship-part-model edits remain uncommitted and untouched)
- Push status: not pushed (no credentials action requested)
- Pull request: none
- Merge performed: **no**

## Secondary consistency check

Re-read the changed files after the implementator/reviewer reports (the reports are
specs, not the source of truth). Independently reproduced the pre-existing e2e failure at
HEAD via a scoped stash/rebuild/run. Confirmed `git status` contains only this ticket's
`apps/desktop/**` paths plus a concurrent session's unrelated files, and staged only the
former.
