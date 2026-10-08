# Validation Report: M2 "First Month at the Admiralty" — INC-13 + INC-4 (Campaign-list screen + Treasury read-only screen)

## Outcome

`PASS`

## Scope delivered

Two frontier-ordered implementation tickets landed on `dev` since the last report
(`INC-14` + `INC-2`, `.ai/reports/game-onboarding-first-month-inc14-inc2.md`):

**INC-13 — Campaign-list screen + `SaveMetadata` extension** (spec §17.4).

- The additive `SaveMetadataSchema` fields (`campaignName`, `nationId`,
  `campaignDate`) and their save-time population already existed (committed
  earlier); this ticket verified them and added a focused persistence test
  (`packages/persistence/test/persistence.test.ts` "writes the additive
  INC-13 campaign-list fields at save time and lists them", math verified
  against `store.ts:110-121`).
- **New `listCampaigns` IPC command** (`apps/desktop/src/main/commands/continuityCommands.ts`,
  wired in `campaignBridge.ts`, name + `CampaignCommandClient` overload in
  `shared/campaign-command-contract.ts`): prompts for the package directory
  via the same native dialog as `loadCampaign`, returns `SaveStore.list(saveDir)`
  (real `SaveMetadata[]`, deterministically newest-first, corrupt/incompatible
  dirs skipped). Read-only — registers no session, mutates no state.
- **New `CampaignListScreen`** (`apps/desktop/src/renderer/screens/campaign-list/`:
  `CampaignListScreen.tsx` + `useCampaignList.ts` + `campaign-list-screen-state.ts`),
  mounted in the app's `file` mode (`App.tsx`). Six columns: campaign name /
  nation / current date / last saved / save-format version / campaign status.
  Legacy/degraded records render `—`; date falls back to `Turn N`; the status
  column renders `—` (not derivable from `SaveMetadata` — no fabrication).
  Load goes through the real `loadCampaign` + `CompatibilityChecker`.

**INC-4 — Treasury read-only projection screen** (spec §9).

- `packages/campaign-engine/src/projection.ts` — added `maintenanceCost` to
  `PlayerProjectionEconomy`, reusing the exact `fleetMaintenance` derivation
  that already backs `projectedSurplusDeficit` (additive, non-authoritative;
  goldens unaffected). Spec §9 field list updated to document this extension.
- Replaced INC-14's `TreasuryStubRoute` with a real `TreasuryRoute` →
  `TreasuryScreen` (`campaign-screen-registry.tsx`; sidebar entry/search target
  already final). New `screens/treasury/`: `TreasuryScreen.tsx` +
  `useTreasuryScreen.ts` + `treasury-screen-state.ts`.
- Income (government allocation), expenditure (fleet maintenance / construction /
  research + total), result (projected surplus-deficit / available funds /
  projected month-end funds), all from the real `inspectCampaign` projection.
  **No budget controls, no editable inputs, no Treasury command, no
  renderer-side derivation except the total-expenditure and month-end sums.**
  Surplus/deficit may legitimately be negative (honest `Deficit`/`Surplus`).

**Design decisions (recorded):**

- Campaign status column renders `—`: `SaveMetadata` carries no
  `isTerminal`/in-flight signal (those live on `CampaignSessionState` only after
  load); deriving a status pre-load would fabricate. Reviewer confirmed honest.
- `listCampaigns` reuses `loadCampaign`'s native-dialog directory model (the app
  has no fixed save directory), so the screen lists a selected package's saves.
- `maintenanceCost` added to the projection so Treasury's fleet-maintenance row
  is internally consistent with `projectedSurplusDeficit` (spec §9's literal
  two-field list extended; documented in spec).
- `saveCampaign`/`closeCampaign` remain declared-but-`NOT_IMPLEMENTED` in
  `campaignBridge` (separate manual-save concern; **out of scope** here, recorded
  not fixed).

## Requirements evidence (acceptance criterion → proving test)

**INC-13:**

1. **`SaveMetadataSchema` accepts the three new optional fields; legacy records render `—`** — `persistence.test.ts` new save-time test + `campaign-list-screen-state.test.ts` "labels a modern save" / "falls back to the honest turnNumber for a legacy save".
2. **Campaign-list screen lists real saves with all six columns and loads through `loadCampaign`/`CompatibilityChecker`** — `CampaignListScreen.test.tsx` "renders real saves with all six columns"; load button calls `loadCampaign` (`CampaignListScreen.tsx`).
3. **Corrupt/incompatible saves skipped** — `SaveStore.list` already skips (store.ts:462+); `listCampaigns` test "returns an empty list for a directory with no valid saves".
4. **New fields written at save time** — `persistence.test.ts` new test.
5. **Tests cover schema extension + list rendering + legacy records** — 3 `listCampaigns` tests (continuityCommands.test.ts), 5 reducer tests, 3 component tests.
6. **Goldens 10/10 unchanged** — `verify-golden-hashes.cjs` (below).

**INC-4:**

1. **Treasury route renders real income/expenditure/result figures with honest copy** — `TreasuryScreen.test.tsx` "renders the real income / expenditure / result figures from the projection".
2. **Every displayed number from the projection; no renderer-side derivations, no fabricated categories** — `treasury-screen-state.test.ts` "summarizes every row from the projection"; only sums are total-expenditure + month-end funds.
3. **No Treasury command; no editable input** — `TreasuryScreen.test.tsx` "renders no budget controls of any kind" (no button/input/combobox).
4. **Component tests cover each row against a fixture projection** — `TreasuryScreen.test.tsx` (3 tests incl. honest deficit).
5. **Goldens 10/10 unchanged** — `verify-golden-hashes.cjs` (below).

## Validation (orchestrator gate)

- `pnpm -w turbo run build --force` — **18/18, 0 cached**.
- `pnpm -w tsc -b` — clean.
- `pnpm lint` — **no findings in any changed file**; 21 pre-existing unrelated
  errors in untouched files (`content-schema/test/nation.test.ts`,
  `prototype/desktop-e2e-harness/*`, `combat/test/torpedo/records.test.ts`,
  `campaign-engine/test/priorities.test.ts`).
- `pnpm format` — **all changed files clean**; remaining issues are pre-existing
  unrelated files (not touched).
- Full test suite (run serially; the initial `turbo run test` hit parallel
  worker EPIPE resource crashes): desktop **507/507** (70 files), campaign-engine
  **79/79**, phase-engine **145/145**, compiler-cli **95/95**, persistence
  **47/47**, cross-process-test **14/14** (incl. two-process byte-identical
  determinism), content-schema **10/12** — the only failure is the documented
  pre-existing unrelated `content-schema/test/nation.test.ts` broken import
  (deferred to owner at final validation; not introduced here).
- `node scripts/verify-golden-hashes.cjs` — **"All 10 hashes match golden
  reference"** (no authoritative hash change).

## Changed files

- `packages/campaign-engine/src/projection.ts` (+`maintenanceCost`)
- `packages/persistence/test/persistence.test.ts` (+INC-13 save-time test)
- `apps/desktop/src/shared/campaign-command-contract.ts` (+`listCampaigns`)
- `apps/desktop/src/main/commands/continuityCommands.ts` (+`listCampaigns`)
- `apps/desktop/src/main/campaignBridge.ts` (+case)
- `apps/desktop/src/main/campaignBridge.test.ts`, `commands/continuityCommands.test.ts`
- `apps/desktop/src/renderer/screens/campaign-list/` (new: 3 files + 2 tests)
- `apps/desktop/src/renderer/screens/treasury/` (new: 3 files + 2 tests)
- `apps/desktop/src/renderer/shell/campaign-screen-registry.tsx` (+test),
  `App.tsx`, `overview-screen-state.test.ts`, `useCampaignShell.test.ts`
- `content-schema`/`prototype`/`combat` untouched (pre-existing failures only)

## Deferred / limitations

- `saveCampaign`/`closeCampaign` wiring (separate manual-save concern) and the
  campaign-status derivation (needs per-save terminal/in-flight state) — recorded,
  out of scope.
- The campaign-list screen auto-prompts for a package directory on mount
  (consistent with the app's dialog-driven save model; reviewer-flagged optional).

## Next

`INC-13` + `INC-4` complete. Remaining frontier in blocking order (spec §10–§12,
§14–§16): INC-5 (research allocation UX), INC-6 (Overview dashboard), INC-7
(guided inspection), INC-8 (construction wizard), INC-9 (foreign relations),
INC-10 (pre-turn review), INC-11 (resolution presentation), INC-12 (naval
estimates). C-3-IMPL (submarines) remains queued on the implementation track.
