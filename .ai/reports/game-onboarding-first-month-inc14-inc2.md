# Validation Report: M2 "First Month at the Admiralty" — INC-14 + INC-2 (campaign shell header + Immediate Priorities projection)

## Outcome

`PASS`

## Scope delivered

Two frontier-ordered implementation tickets landed on `dev` since the last report
(`INC-3`, `.ai/reports/game-onboarding-first-month-inc3.md`):

**INC-14 — Campaign shell + header wiring** (commit `5f8f348`, spec §5 — foundation slice):

- `apps/desktop/src/renderer/shell/campaign-screen-registry.tsx` — sixth nav section **Treasury** (sidebar entry + route rendering a "not yet available" stub until INC-4; same conditional-registration pattern as debug-only screens).
- `apps/desktop/src/renderer/shell/strategic-destination.ts` — `StrategicDestination` rename `"foreign-relations"` → `"diplomacy"` (no `foreign-relations` remains); focus fields stay unvalidated per ticket's follow-up note.
- `apps/desktop/src/renderer/shell/site-header-state.ts` + `HeaderSecondaryRow.tsx` — header shows **current date** (`month.year`/`month.month`), **current funds** (`economy.treasury`), **nation name** (INC-1 field), **projected surplus/deficit** (INC-1 field), Advance Month (pre-existing), save state (`saving`/`saveMessage`), and a forward-wired **active-alerts count slot** for INC-2's priorities projection (populated once INC-2 lands; INC-14 wires the slot only).
- `apps/desktop/src/renderer/shell/campaign-shell-state.ts` + `useCampaignShell.ts` — campaign-shell state extension through `useCampaignShell` preserved across `commitMonth`.
- Tests: `SiteHeader.test.tsx` (+31), `site-header-state.test.ts` (+66), `campaign-screen-registry.test.tsx`, `campaign-shell-state.test.ts`, `useCampaignShell.test.ts` (141), `strategic-destination.test.ts` (53), `App.test.tsx` (+7). Route ownership: renderer owns navigation, all campaign mutations via command client (unchanged).

**INC-2 — Immediate Priorities projection** (commit `ebadc5c`, spec §7 — pure read-only engine projection):

- `packages/campaign-engine/src/priorities.ts` (360 lines, re-exported via `src/index.ts`) — `buildPrioritiesProjection(snapshot, playerNationId)` pure over `CampaignSnapshot`; 6 of 8 doc types ship (`monthly_deficit`, `critical_cash_reserve`, `low_research_spending`, `construction_near_completion`, `high_foreign_tension`, `no_active_construction`); `obsolete_active_class` + `construction_stalled` cut with recorded reasons (no obsolescence score/design→tech mapping; no month-over-month `completedWork` delta).
- Centralized, named, documented, unit-tested constants: `MIN_RESEARCH_SHARE_BP = 800`, `NEAR_COMPLETION_WORK_RATIO = 0.9`, cash-reserve inequality (`treasury < max(totalMonthlyExpenditure, 1)`), deficit-criticality (`treasury + projectedBalance < 0`). `HIGH_TENSION_THRESHOLD = 8` **imported** from `diplomacy.ts` (`tensionLabel`/`isHighTension`) — never re-declared.
- `construction_near_completion` uses work-ratio proxy (`completedWork / totalWork >= 0.9`) not months (spec §7 recorded deviation — months-to-completion underivable). Cash triggers consume INC-1's two new `PlayerProjection.economy` fields. Deterministic 5-key sort: severity → direct financial risk → time-to-consequence → stable type order → fingerprint. `id`/`fingerprint` derive deterministically from condition identity; `destination` never `treasury`.
- 9 new tests in `packages/campaign-engine/test/priorities.test.ts` (79/79 campaign-engine). Pure read-only — never wired into `MonthExecutor`.

Deferred/out of scope (recorded, not dropped): INC-2's projection is not yet consumed by the renderer (Overview INC-6, pre-turn review INC-10, naval estimates INC-12); dismissal policy is a consumer concern (`ui-state.json` sidecar INC-3 holds the persisted state). INC-14's Treasury stub is replaced by INC-4's read-only figures.

## Requirements evidence (acceptance criterion → proving test)

**INC-14:**

1. **Six nav sections present; Treasury renders a stub until INC-4** — `campaign-screen-registry.test.tsx` "registers six sections including Treasury stub".
2. **Header shows date, funds, nation name, projected surplus/deficit from INC-1 fields; alert-count slot forward-wired to INC-2** — `site-header-state.test.ts` "derives header from projection economy fields" + `SiteHeader.test.tsx` "renders nation / projected balance / alerts slot".
3. **`StrategicDestination` uses `"diplomacy"` (no `"foreign-relations"`); focus fields unvalidated** — `strategic-destination.test.ts` "rejects foreign-relations; accepts diplomacy; focus fields unconstrained".
4. **Route ownership matches as-is (renderer navigation, command-client mutations)** — `App.test.tsx` + `useCampaignShell.test.ts` "navigation via renderer state; commits via command client; shell preserved across commitMonth".
5. **Goldens 10/10 unchanged** — `verify-golden-hashes.cjs` + two-process byte-identical (below).

**INC-2:**

1. **`buildPrioritiesProjection` returns the 6 types with correct triggers against real snapshot data (no fabricated values)** — `priorities.test.ts` per-type trigger tests (deficit, cash reserve, research share, near-completion, high tension, no construction).
2. **All named constants are centralized in `priorities.ts` and unit-tested** (`MIN_RESEARCH_SHARE_BP=800`, `NEAR_COMPLETION_WORK_RATIO=0.9`, cash-reserve + deficit predicates) — same file, constant-value + boundary tests.
3. **`HIGH_TENSION_THRESHOLD`/`isHighTension` are imported from `diplomacy.ts`, not re-declared** — source import + `isHighTension` high-tension test.
4. **`obsolete_active_class` + `construction_stalled` are absent (cut with recorded reasons)** — "never emits obsolete_active_class / construction_stalled".
5. **Sort is deterministic (identical inputs → identical order) per the 5-key chain** — "deterministic 5-key sort" test.
6. **`id`/`fingerprint` derive deterministically from condition identity** — fingerprint/id identity tests.
7. **`destination` maps to a real screen (`overview | construction | fleet | research | diplomacy`); no `treasury` destination** — destination mapping test.
8. **Goldens 10/10 unchanged; two-process determinism byte-identical** — below.

## Commands and observed results

```text
pnpm -w turbo run build --force              -> 18/18 tasks successful, 0 cached
npx tsc -b                                   -> clean (exit 0)
pnpm -w turbo run test --force --continue    -> 35/36 tasks successful; ONLY failure:
    @bluewave/content-schema#test  (pre-existing, tracked-at-HEAD: test/nation.test.ts
    Cannot find module '../../../content/research/nations/1880/index.ts' — unrelated
    to INC-2/INC-14; the historically documented pre-existing content-schema failure)
    @bluewave/desktop            -> Test Files 66 passed (66); Tests 488 passed (488)
    @bluewave/campaign-engine    -> Tests 79 passed (79) — includes 9 new priorities tests
node scripts/verify-golden-hashes.cjs       -> "All 10 hashes match golden reference"
node packages/cross-process-test/dist/run-child.js (x2) -> byte-identical (cmp clean)
pnpm lint                                    -> Found 0 warnings and 21 errors — ALL confined to files at HEAD not touched by INC-2/INC-14
    (prototype/desktop-e2e-harness/fixtures.draft.ts + content-schema/nation.test.ts); the 15 INC-14 + 3 INC-2 files lint clean
```

Pre-existing repo-wide gate items left untouched per `.ai/AUTONOMOUS-AGENT.md` failure policy (no broad rewrites to pass validation): `pnpm lint` + `pnpm format --check` still flag 71 tracked files of formatting drift from earlier sprints (`prototype/desktop-e2e-harness` drafts etc.). All INC-2/INC-14 files pass both gates scoped (verified `tsc -b` + per-package `vitest` green; `turbo build` 18/18).

## Determinism evidence

- Content artifact hash: unchanged (no content touched).
- Initial/closing snapshot hash: unchanged (no authoritative schema change; INC-2 is pure projection, INC-14 is renderer shell).
- Golden hashes: **10/10 match** (`node scripts/verify-golden-hashes.cjs`).
- Two-process determinism: cross-process child run twice → **byte-identical**.
- Processes/OS: macOS (darwin), Node 24, pnpm 11.21.0.

## Canonical artifact changes

**None.** No authoritative package, schema, contract, or golden changed
(INC-2 is a read-only projection over the snapshot, never into `MonthExecutor`; INC-14 is renderer-owned shell/header state). Proven by 10/10 goldens + byte-identical two-process runs and the `MonthExecutor` hash surface being untouched (INC-3's earlier byte-identical proof still holds).

## Review

Inline orchestrator review (the `.opencode/agents/` reviewer is shimmed as generic subagent):

- **INC-14:** No blocker/high findings in this validation pass. The reviewer gap flagged in the prior boot (missing validation report) is closed by this report. The `foreign-relations→diplomacy` rename was verified codebase-wide (no remaining `foreign-relations` literal); header alerts slot is forward-wired (not populated) per ticket — intentional.
- **INC-2:** Mirrors the spec's recorded cuts (`obsolete_active_class`, `construction_stalled`) with reasons; `HIGH_TENSION_THRESHOLD` import verified; constants centralized + tested. No blocker/high findings.
- Verdict: **APPROVE** for this batch (INC-14 + INC-2). The next frontier tickets remain `INC-13` (campaign-list, blocked by INC-14) and `INC-4` (Treasury screen, blocked by INC-1 + INC-14).

## Working tree

Clean at session end. `dev` branch, 6 commits ahead of `origin/dev` (`4a5eb20`, `be69161`, `bd01e4a`, `0aed350`, `5f8f348`, `ebadc5c`). This report + the follow-up SPRINT-PLAN refresh are the only uncommitted artifact changes.
