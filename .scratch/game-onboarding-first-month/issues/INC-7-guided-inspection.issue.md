# INC-7 — Guided first-month inspection

**What to build:** The DOM-based, renderer-only spotlight guide, per [the
assembled spec](../spec.md) §8 — the seven-step first-month tour over the six
real section screens + the Advance Month header action.

- Seven-step sequence: Overview → Treasury → Research → Construction →
  Fleet → Foreign Relations → Advance Month (step 7 highlights the header
  button but is purely informational — clicking it is not wired to guide
  completion).
- Non-blocking overlay: highlight ring from `getBoundingClientRect()` over
  the shared shell, fixed-position step card (title / 1–2 sentences / Next /
  Back after first / End inspection / "N of 7"), recomputed on resize/re-nav.
  No focus trap, no `pointer-events` trap, respects `prefers-reduced-motion`.
- All six "must not" behaviors hold: no blocking navigation, no domain-state
  mutation, no manufactured values, no preventing save/Advance Month, no
  reopening after completion.
- Persistence: `FirstMonthInspectionState { status, lastCompletedStep }` with
  `status` in `not_started | in_progress | completed | dismissed`, stored in
  the INC-3 `ui-state.json` sidecar (per-campaign, survives save/load,
  resumes mid-guide). A **Restart guided inspection** command is available
  from Help/campaign settings.
- Autosave after a first-month-inspection status change (spec §17:
  genuinely-new trigger).
- Visual click-through details (ring radius, scrim opacity, card position)
  are judged against real layouts during this ticket — presentation only,
  no change to steps/behavior/persistence.

**Blocked by:** INC-3 (sidecar persistence), INC-4 (Treasury screen), INC-5
(Research), INC-6 (Overview)

**Status:** done

- [x] Seven-step sequence highlights the six real screens + the header
      Advance button (step 7 informational only)
- [x] Overlay is non-blocking: normal navigation/save/Advance stay usable;
      no focus trap
- [x] All six "must not" behaviors verified (no domain mutation, no
      blocking, no reopening after completion)
- [x] Inspection state persists per-campaign via the `ui-state.json` sidecar
      and resumes from the last completed step after save/load
- [x] Restart-guided-inspection command present; `prefers-reduced-motion`
      honored
- [x] Autosave fires on inspection-status change
- [x] Component tests cover step navigation, the "must not" behaviors, and
      persistence
