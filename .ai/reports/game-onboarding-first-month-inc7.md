# Validation Report: M2 "First Month at the Admiralty" — INC-7 (Guided inspection)

## Outcome

`PASS` — seven-step DOM spotlight guide with ui-state persistence, restart, and autosave.

## Scope delivered

One frontier-ordered implementation ticket (spec §8):

**INC-7 — Guided first-month inspection** (spec §8, blocked by INC-3/4/5/6 — all done).

- **guided-inspection-state.ts** — pure helpers: `GUIDED_INSPECTION_STEPS` (7 steps: Overview → Treasury → Research → Construction → Fleet → Diplomacy → Advance Month header, last `screenId: null` informational), `shouldAutoOpen`/`isInspectionFinished`/`resumeStepIndex`/`nextInspectionState`/`dismissedInspectionState`/`restartedInspection`, `GUIDED_STEP_COUNT=7`, clamp 0..6.
- **GuidedInspectionOverlay.tsx** — DOM-based renderer-only spotlight: highlight ring from `getBoundingClientRect()` (recomputed on resize + 300ms interval for SPA re-nav), dim scrim, fixed-position step card (title/description/`N of 7`/Next/Back/End inspection), `pointer-events:none` overlay with `pointer-events:auto` card (non-blocking: normal navigation/save/Advance Month stay usable), no focus trap, respects `prefers-reduced-motion` (transition `none` when reduced, otherwise 180ms), `aria-live="polite"` + `role="dialog"`.
- **useGuidedInspection.ts** — bridge to `readUiState`/`writeUiState` sidecar (`ui-state.json` INC-3): tolerant read (missing/corrupt → defaults), `in_progress` resumes from `lastCompletedStep+1`, `completed`/`dismissed` never auto-reopens, `advance`/`dismiss`/`restart` persist via `writeUiState` (merge-preserve `dismissedFingerprints`), `writeUiState` itself is the autosave (spec §17 genuinely-new trigger, no authoritative save).
- **Screen targets** — `data-guided-target` on six screens (`overview`, `treasury`, `research`, `construction`, `fleet`, `diplomacy`) + header `Advance Month` button (`advance-month`).
- **Restart command** — `Restart guided inspection` in `CampaignPreferencesScreen` display tab (`writeUiState` with `not_started/0`, tolerant `dismissedFingerprints` carry-forward).
- **App integration** — `CampaignShellApplication` renders overlay when `campaign` mode + `guided.visible` (sessionId from `shell.state.mode.campaign`), `onNavigate` delegates to `shell.actions.selectScreen`.

All six "must not" behaviors hold: no blocking navigation, no domain-state mutation, no manufactured values, no preventing save/Advance Month, no reopening after completion (tested via state helpers + overlay non-blocking).

## Requirements evidence

1. Seven-step sequence highlights six real screens + header Advance button (step 7 informational only, `Complete` on last) — `GUIDED_INSPECTION_STEPS` + overlay `stepIndex` 0..6.
2. Overlay is non-blocking: `pointer-events-none` scrim, `pointer-events-auto` card, no `aria-modal`, normal navigation via `onNavigate` — overlay test "non-blocking".
3. All six must-not behaviors verified via pure state (no domain writes, `dismissed`/`completed` never auto-open, `isInspectionFinished` guard) + overlay pointer-events + no manufactured values.
4. Inspection state persists per-campaign via `ui-state.json` sidecar and resumes from last completed step after save/load — `readUiState`/`writeUiState` merge, `resumeStepIndex`, `resolveUiState` preserves `firstMonthInspection` across turns.
5. Restart command present; `prefers-reduced-motion` honored — preferences button + overlay `matchMedia("(prefers-reduced-motion: reduce)")` branch.
6. Autosave fires on inspection-status change — `useGuidedInspection` `advance`/`dismiss`/`restart` call `writeUiState` (genuinely-new §17 trigger, no `saveCampaign` needed as sidecar is renderer-owned).
7. Component tests cover step navigation, must-not, and persistence — `guided-inspection-state.test.ts` (10) + `GuidedInspectionOverlay.test.tsx` (6).

## Validation (orchestrator gate)

- `pnpm -w turbo run build --force` — 18/18 green (desktop `electron-vite` 3301 modules).
- `pnpm tsc -b` — clean (exit 0; one pre-existing `content-schema/test/nation.test.ts` import unrelated excluded from gate).
- `node scripts/verify-golden-hashes.cjs` — `All 10 hashes match golden reference`.
- `pnpm --filter @bluewave/desktop test` — 72 files 523 passed (was 507; +16 from this ticket: 10 state + 6 overlay), zero failures after tolerant `readUiState` guard.
- `INC-6` already committed (`12454bb`); this report covers `INC-7` delta.

## Changed files

- `apps/desktop/src/renderer/shell/guided-inspection-state.ts` — new pure state helpers + step registry.
- `apps/desktop/src/renderer/shell/GuidedInspectionOverlay.tsx` — new DOM spotlight overlay.
- `apps/desktop/src/renderer/shell/useGuidedInspection.ts` — new bridge hook (tolerant read, merge write, autosave).
- `apps/desktop/src/renderer/shell/App.tsx` — imports + `useGuidedInspection` + conditional overlay render.
- `apps/desktop/src/renderer/screens/campaign-preferences/CampaignPreferencesScreen.tsx` — restart button + handler.
- `apps/desktop/src/renderer/shell/SiteHeader.tsx` — `data-guided-target='advance-month'` on Advance button.
- `apps/desktop/src/renderer/screens/overview/OverviewScreen.tsx` — `data-guided-target='overview'`.
- `apps/desktop/src/renderer/screens/treasury/TreasuryScreen.tsx` — `data-guided-target='treasury'`.
- `apps/desktop/src/renderer/screens/research/ResearchScreen.tsx` — `data-guided-target='research'`.
- `apps/desktop/src/renderer/screens/construction/ConstructionScreen.tsx` — `data-guided-target='construction'`.
- `apps/desktop/src/renderer/screens/fleet/FleetScreen.tsx` — `data-guided-target='fleet'`.
- `apps/desktop/src/renderer/screens/diplomacy/DiplomacyScreen.tsx` — `data-guided-target='diplomacy'`.
- `apps/desktop/src/renderer/shell/guided-inspection-state.test.ts` — new (10 tests).
- `apps/desktop/src/renderer/shell/GuidedInspectionOverlay.test.tsx` — new (6 tests).
- `.scratch/game-onboarding-first-month/issues/INC-7-guided-inspection.issue.md` — marked `done`.
- `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md` — frontier advance.

## Traceability

- Spec §8 (Guided First Month Inspection) — all shapes/behaviors per ticket 05 + 18 prototype.
- Issue `.scratch/game-onboarding-first-month/issues/INC-7-guided-inspection.issue.md` → `Status: done`.
- SPRINT-PLAN / PROGRESS refreshed to `INC-8` next (separate commit).
