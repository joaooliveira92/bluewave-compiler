# INC-3 — `ui-state.json` per-campaign sidecar

**What to build:** The small per-campaign renderer-owned UI-state sidecar,
per [the assembled spec](../spec.md) §7 (dismissal) and §8 (guided
inspection). One mechanism for both priority-dismissal and
first-month-inspection state.

- `ui-state.json` in the campaign save directory, keyed by `campaignId`,
  written atomically (tmp-dir → rename, matching `SaveStore.save`), read
  **tolerantly** (missing/corrupt → empty defaults — never crashes).
- Shape: `{ turnNumber, dismissedFingerprints: string[],
  firstMonthInspection?: { status, lastCompletedStep } }`. Entries expire by
  comparing against the current `turnNumber` (dismissal expires on turn
  advance).
- **Renderer-owned and never authoritative** — never part of the
  authoritative envelope/hash, never loaded into simulation state
  (ENGINEERING-CONTRACT: UI state is never authoritative).
- Served through a narrow IPC path (e.g. an add/read command pair) with Zod
  validation at the boundary; `AbortSignal` on the write path where it fits
  the existing command conventions.

**Blocked by:** None — can start immediately (pure new infrastructure)

**Status:** ready-for-agent

- [ ] `ui-state.json` is written atomically (tmp → rename), keyed by
      `campaignId`, and read tolerantly (missing/corrupt → defaults)
- [ ] Dismissal fingerprints expire on turn advance (turnNumber comparison)
- [ ] First-month-inspection state persists and survives save/load
      per-campaign
- [ ] The sidecar is never part of the authoritative envelope/hash and never
      fed into `MonthExecutor`
- [ ] Narrow IPC surface, Zod-validated, no renderer→engine state leakage
- [ ] Goldens 10/10 unchanged (new sidecar has zero hash surface)
- [ ] Tests cover write/read, tolerant-corrupt recovery, and expiry
