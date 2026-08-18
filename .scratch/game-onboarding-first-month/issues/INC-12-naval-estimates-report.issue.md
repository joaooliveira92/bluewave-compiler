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

**Status:** ready-for-agent

- [ ] Report renders the real response sections faithfully; no cut section
      exists anywhere
- [ ] Battle Outcomes is its own subsection (plain text, no tactical UI)
- [ ] `monthly-reports.json` persists the last 12 reports + priority
      fingerprints (atomic write, tolerant read, never authoritative)
- [ ] Report `generatedAt` comes from save metadata, never `Date.now()` in an
      authoritative path
- [ ] Overview's Recent Developments reads the history sidecar
- [ ] Goldens 10/10 unchanged; component/engine tests cover the sections +
      the sidecar
