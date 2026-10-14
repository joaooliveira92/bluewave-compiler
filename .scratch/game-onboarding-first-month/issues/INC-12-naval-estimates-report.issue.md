# INC-12 — Monthly Naval Estimates report + history sidecar

**What to build:** The Monthly Naval Estimates report surface + the
`monthly-reports.json` history sidecar, per [the assembled spec](../spec.md)
§16.

- Render the real `CommitMonthResponse` faithfully: **Treasury** (opening/
  closing funds, maintenance, construction spend, research expense derived
  from the real ledger `RESEARCH_EXPENDITURE` category, government allocation
  from `NAVAL_APPROPRIATION`); **Construction** (per-project progress from
  `ConstructionProgressed` events, completed ships + newly active from
  pre→post deltas); **Research** (per-tech progress + discoveries from real
  events); **Priorities** (INC-2 projection over the post-month snapshot with
  new/resolved/continuing against the previous report's fingerprints);
  **Fleet** (additions/totals); **Battle Outcomes** (dedicated subsection from
  `closingSnapshot.battleOutcomes`, plain text).
- **Cuts (do not build):** Diplomacy section (no monthly changes), research
  budget-effectiveness + settings effects, per-ship maintenance effect,
  construction "stalled".
- Report data model = the real `CommitMonthResponse` + a thin derived view
  (no invented interface; `generatedAt` from `SaveMetadata.timestamp`, never
  `Date.now()` in an authoritative path).
- **History sidecar:** `monthly-reports.json` in the campaign save directory
  (same family as INC-3's `ui-state.json` — atomic write, tolerant read,
  keyed by `campaignId`, never in the authoritative envelope), storing the
  most recent **12** reports + the priority fingerprints; pruned to 12 at
  write. Overview's Recent Developments (INC-6) reads it read-only.

**Blocked by:** INC-1, INC-2, INC-3

**Status:** resolved (2026-10-14)

- [x] Report renders the real response sections faithfully; no cut section
      exists anywhere
- [x] Battle Outcomes is its own subsection (plain text, no tactical UI)
- [x] `monthly-reports.json` persists the last 12 reports + priority
      fingerprints (atomic write, tolerant read, never authoritative)
- [x] Report `generatedAt` comes from save metadata, never `Date.now()` in an
      authoritative path
- [x] Overview's Recent Developments reads the history sidecar
- [x] Goldens unchanged (11/11); component/engine tests cover the sections +
      the sidecar

## Resolution (2026-10-14)

Implemented entirely under `apps/desktop/**` + the shared desktop contract, mirroring
the INC-3 `ui-state.json` sidecar pattern. `main/monthlyReports.ts` owns the sidecar
(atomic tmp→rename, tolerant read, prune-12, sibling of the save ids, never in the
envelope/hash); `main/commands/commitMonth.ts` appends one `MonthlyReportEntry` per
successful commit (`generatedAt` = `SaveMetadata.timestamp`) built by the pure
`commands/commitMonth/reportEntry.ts`; a new `readMonthlyReports` bridge command serves
the renderer read-only. Overview's "Recent Developments" (`MonthReportCard` +
`MonthlyReportView` + six section components) now renders the stored report, replacing
the in-memory month history (`lib/month-summary.ts` deleted). Cut sections are absent by
type, not empty.

Evidence: `.ai/reports/game-onboarding-inc12-naval-estimates-report.md`.
Desktop 2010 passed; typecheck 40/40; lint 0/0; format clean; goldens 11/11;
cross-process + equivalence byte-identical. `pnpm check` stops only on a pre-existing
unrelated e2e failure (`e2e/ship-types.spec.ts`, shipbuilding armour), reproduced at
HEAD without this change. This completes the game-onboarding-first-month INC frontier
(INC-1..INC-14); next desktop frontier is `fleet-movement-strategy-map` INC-1.
