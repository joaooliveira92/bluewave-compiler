**Type:** grilling
**Status:** resolved
**Blocked by:** 13

## Question

Spec §16 (Monthly Naval Estimates Report) of [01-diagnosis.md](../01-diagnosis.md).

`commitMonth.ts` already produces report-entry-shaped data (a
`"ConstructionProgressed"` event type was found during the charting-session
IPC audit — a real report entry type, not invented). Reconcile the doc's
proposed `MonthlyCampaignReport` shape against what `commitMonth.ts` already
emits rather than assuming it's all new.

Decide:

1. **Report sections** (§16.3): for each of Treasury/Construction/Research/
   Diplomacy/Fleet/Priorities, confirm what `commitMonth.ts` already emits
   versus what needs adding. Add the **battle outcomes** line item decided
   during charting (plain-text losses/outcomes, no tactical UI) — likely
   its own small subsection or folded into Fleet, decide which reads more
   naturally.
2. **Report data model** (§16.4): reconcile `MonthlyCampaignReport` against
   the real report-entry shapes found in `commitMonth.ts`; adjust field
   names/types to match reality rather than the doc's invented interface
   where they diverge.
3. **Report history** (§16.6): confirm whether report persistence (most
   recent 12, read-only) already has a home in the real save model
   (cross-reference [Saving, loading & campaign-list](./16-saving-loading-campaign-list.md))
   or needs new storage.

## Answer

Verified against the real report surface: `CommitMonthResponse`
(`packages/campaign-engine/src/simulation.ts:85-91`) with its `MonthReport`
(`simulation.ts:17-23`), `DomainEvent[]` (`simulation.ts:25-30`), `FinancialLedgerEntry[]`
(`simulation.ts:32-38`), `ClosingSnapshotSummary` (revision, month,
`battleOutcomes`, `activeWars`), and the `commitMonth` assembly
(`commitMonth.ts:212-232`). Cross-referenced tickets 04 (priorities), 12
(diplomacy), 13 (phase list/atomicity), 16 (save metadata).

**Headline: the report is largely "document what's real" + a few small
additive projection sections. The `commitMonth` response already carries the
Treasury ledger, per-event construction/research progress, battle outcomes,
and the closing summary. Cuts: Diplomacy's monthly-change/label-change
sections (no monthly tension processing runs — ticket 12), Research budget-
effectiveness and settings-effect copy (no formula/explanation), Fleet's
per-ship "new maintenance effect" (only the aggregate `maintenanceCost` is
real), and Construction's "stalled projects" (no from-snapshot signal —
ticket 04). Report history has NO home yet — a new tolerant sidecar.**

### 1. Report sections (§16.3) — real vs. needs-adding

| Section | Real today (`commitMonth.ts`) | Needs adding |
| --- | --- | --- |
| **Treasury** | `report.openingTreasury`, `report.closingTreasury`, `report.maintenanceCost`, `report.newConstructionSpending` (real, `commitMonth.ts:212-219`); government allocation + research expense derivable from `financialLedger` (`NAVAL_APPROPRIATION`, `RESEARCH_EXPENDITURE` categories, `month.ts:272,307`); surplus/deficit = `closingTreasury − openingTreasury`. | "Research expense" as a named line (derive from ledger `RESEARCH_EXPENDITURE`; `RESEARCH_EXPENDITURE` is real). "Other real engine-backed expenses" — the real ledger categories ARE the honest "other" list (`MAINTENANCE_EXPENDITURE`, `APPROPRIATION`, `CONSTRUCTION_BUDGET`, `RESEARCH_EXPENDITURE`, `NAVAL_APPROPRIATION`) — render the ledger rows, no invented balancing row (matches ticket 06's decision). |
| **Construction** | `ConstructionProgressed` domain events carry per-project work progress (`commitMonth.ts:458-459`: `projectId`, `previousWork → newWork`) — the "progress by project" entries are real. | "Completed ships" — derivable from the fleet ship-set delta (pre→post `isUnderConstruction: false` additions; the same pre→post pattern `collectBattleOutcomes` uses, `commitMonth.ts:263-275`) or from projects reaching `totalWork`. "Newly active projects" — derivable from `status` becoming `ACTIVE` in the month's project snapshots. **"Stalled projects" CUT** — no from-snapshot signal (ticket 04's finding; the transient report delta doesn't persist per-project). |
| **Research** | `ResearchProgressed` events carry per-tech progress (`commitMonth.ts:461`); `TechnologyDiscovered` events (`commitMonth.ts:466`) — "progress by research area" + "discoveries" are real. | **"Budget effectiveness" + "settings effects" CUT** — no research-effectiveness formula and no explainable speed/variation effect surface exists; the spec shows the real per-tech progress + discoveries only. |
| **Diplomacy** | `resolve_diplomacy` runs but monthly tension changes do NOT (ticket 12; `rngAllowed: false`, no change processing). | **"Tension changes" + "relationship label changes" CUT** (no changes occur). "Nations reaching warning thresholds" — real via ticket 11's `isHighTension`/`tensionLabel` over current relations (a read-only derivation), folded into the **Priorities** section as `high_foreign_tension` rather than a separate Diplomacy block. |
| **Fleet** | Fleet ship additions derivable (see Construction "completed ships"). Active totals real (`nation.fleets[].ships.length` post-month). | **"New maintenance effect from completed ships" CUT** — only the aggregate `maintenanceCost` is real (`month.ts:679`); per-ship maintenance attribution isn't modeled. |
| **Priorities** | Nothing (the priorities engine is ticket 04's new read-only projection). | New — the report's Priorities section = the ticket-04 projection (`buildPrioritiesProjection`) over the post-month snapshot: new/resolved/continuing derived by comparing against the previous report's stored priorities (see §3). |
| **Battle outcomes** (charting addition) | Real — `closingSnapshot.battleOutcomes` (`commitMonth.ts:229,263-275`), plain-text losses/outcomes, no tactical UI. | Nothing. **Decision: its own small "Battle Outcomes" subsection** (it already renders as one in the Turn Report accordion; keeping it distinct from Fleet reads naturally and matches the shipped surface). |

### 2. Report data model (§16.4) — reconcile to the real shape

The doc's `MonthlyCampaignReport` is replaced by the **real `CommitMonthResponse`** + a thin derived view; no new invented interface:

- `reportId` → the month's save identity (real: `SaveMetadata.saveId` / `campaignId`, ticket 16).
- `campaignId` → real (`record.state.snapshot.campaignId`).
- `turn` → real (`nextTurnNumber` / `revision`).
- `period.from` → the resolved month (`record.month`); `period.to` → the new month (`nextMonth`, real via `advanceMonth`, `commitMonth.ts:167`).
- `treasury` → real `MonthReport` + the two derived lines (research expense from ledger, government allocation from `NAVAL_APPROPRIATION`) — **all numbers from `report`/`financialLedger`, none invented** (ticket 06's read-only discipline).
- `construction` / `research` / `fleet` → the domain-event + pre→post-delta derivations from §1.
- `diplomacy` → **dropped as a section** (nothing monthly changes); its one real contribution (`isHighTension`) lives under Priorities.
- `priorities` → the ticket-04 projection, new.
- `generatedAt` → real persistence metadata, **not** an engine field: `SaveMetadata.timestamp` (ticket 16) or the sidecar's own write time. Never `Date.now()` inside an authoritative path (doc §16.4's "must not affect simulation determinism" — satisfied by construction; the report is app-layer, never hashed into the snapshot).

### 3. Report history (§16.6) — new tolerant sidecar

Verified: **no report persistence exists.** `SaveMetadata` (ticket 16) is per-save listing metadata (`saveId`, timestamps, hashes — `schemas.ts:101-110`); the snapshot schema has no report field and reports are never hashed (adding them to the authoritative snapshot would be a schema/hash change — not done). The `CommitMonthResponse` is app-layer and ephemeral. **Decision: a new per-campaign `monthly-reports.json` sidecar** in the campaign save directory — the same family as ticket 04's `ui-state.json` (renderer/app-owned, written atomically via tmp-dir → rename, read tolerantly (missing/corrupt → empty), keyed by `campaignId`, **never part of the authoritative envelope/hash**). It stores the most recent 12 reports (the §1 derived view + the ticket-04 priority fingerprints so §1's "new/resolved/continuing" comparison has a baseline). Prune-to-12 at write. The Overview reads it read-only (doc §16.6 "most recent 12, read-only"). No migration (new file); legacy campaigns simply have no history.

### Net spec effect

M2's Monthly Naval Estimates Report = the real `CommitMonthResponse` rendered faithfully: Treasury (real ledger + two derived lines), Construction progress + completed ships + newly active (real events/deltas; **stalled cut**), Research progress + discoveries (real events; **effectiveness/settings cut**), Priorities (ticket-04 projection, new/resolved/continuing), Fleet (real additions/totals; **per-ship maintenance cut**), and a dedicated Battle Outcomes subsection (real). Diplomacy's monthly-change section dropped. The report data model reconciles to `CommitMonthResponse` + derived view; report history is a new tolerant `monthly-reports.json` sidecar (last 12, read-only, outside the authoritative envelope). No authoritative schema change; goldens stay 10/10.

## Notes for the resolving session

- [Determinism/RNG audit](./17-determinism-rng-audit.md) (resolved) found
  `resolve_diplomacy`'s `PhaseRegistry` entry is currently
  `rngAllowed: false` — if [ticket 11](./11-diplomacy-tension-threshold-policy.md)'s
  monthly-change design needs randomness, confirm that flag was flipped
  there rather than assuming it's available.
