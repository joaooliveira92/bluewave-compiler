# Validation Report: M2 "First Month at the Admiralty" — INC-3 `ui-state.json` sidecar

## Outcome

`PASS`

## Scope delivered

INC-3 implements the per-campaign **renderer-owned** UI-state sidecar
(`ui-state.json`) per spec §7 "Dismissal" and §8 "Persistence" — one mechanism
for both priority-dismissal and first-month-inspection state:

- `apps/desktop/src/main/uiState.ts` — `UI_STATE_FILENAME`, `emptyUiState`,
  `resolveUiState` (pure expiry rule), `loadUiState` (tolerant read),
  `saveUiState` (atomic tmp→rename + `AbortSignal`, matching `SaveStore`),
  `readUiState`/`writeUiState` (server-side `turnNumber` stamping, merge-preserve
  for `firstMonthInspection`).
- `apps/desktop/src/shared/campaign-command-contract.ts` — `UiState`,
  `WriteUiStatePayload` (merge semantics documented), `ReadUiStateResult`,
  `WriteUiStateResult`, `CAMPAIGN_COMMAND_NAMES` + 2 `execute` overloads.
- `apps/desktop/src/main/campaignCommandSchemas.ts` — `FirstMonthInspectionSchema`
  (closed enum, `lastCompletedStep` 0..6), `UiStateSchema`, `WriteUiStatePayloadSchema`
  (fingerprints ≤ 64 entries × ≤ 256 chars; `turnNumber` intentionally absent from the wire).
- `apps/desktop/src/main/campaignBridge.ts` — dispatch wiring for
  `readUiState`/`writeUiState` (Zod boundary, `INVALID_PAYLOAD`).
- `apps/desktop/src/main/uiState.test.ts` (13 tests) + `campaignBridge.test.ts`
  (+ boundary/dispatch happy-path cases); `preload/index.ts` stale-command-count
  comment fixed.
- `docs/adr/ADR-0038-ui-state-sidecar.md` — non-authoritative persistence decision.

Deferred/out of scope (recorded, not dropped): the sidecar is not yet consumed by
the INC-2/INC-7 renderer writers (subsequent frontier tickets); `AbortSignal` is
checked at entry only and not plumbed through `dispatchCampaignCommand` (matches
every other command in the registry — sync-write rationale, unit-tested).

## Requirements evidence (acceptance criterion → proving test)

1. **Atomic write, keyed by campaignId, tolerant read** — `uiState.test.ts`
   "writes ui-state.json atomically (tmp -> rename) with no tmp leftover";
   "removes the tmp artifact when the write fails"; "is tolerant of a missing
   ui-state.json"; "is tolerant of a corrupt ui-state.json (unparseable or wrong
   shape -> defaults)".
2. **Fingerprints expire on turn advance** — `resolveUiState` pure-function test
   - integration "expires dismissals on turn advance and preserves inspection
     across the real `commitMonth`".
3. **Inspection persists / survives save/load per-campaign** —
   "persists outside the authoritative envelope and survives a save/load cycle";
   "merge-preserves the sibling feature: a dismissal-only write retains the
   stored inspection state"; "explicit not_started/0 write resets the stored
   inspection state".
4. **Never authoritative, never into `MonthExecutor`** — "never affects the
   authoritative envelope/hash or MonthExecutor output" (identical post-commit
   `rawHash` with and without a populated sidecar; sidecar is a sibling of save
   ids, never inside a SaveStore id dir).
5. **Narrow IPC, Zod-validated, no renderer→engine leakage** —
   `campaignBridge.test.ts` `INVALID_PAYLOAD` (bad status enum, missing
   `lastCompletedStep`, fingerprint > 256, array > 64, step 7, step −1,
   non-array, non-string) + `SESSION_NOT_FOUND`; server-side `turnNumber` stamp.
6. **Goldens 10/10 unchanged** — `node scripts/verify-golden-hashes.cjs` and
   two-process determinism, below.
7. **Tests cover write/read, corrupt recovery, expiry** — all present.

## Commands and observed results

```text
pnpm -w turbo run build --force        -> 18/18 tasks successful, 0 cached
pnpm exec tsc -b                       -> clean (exit 0)
pnpm exec vp lint <7 INC-3 files>      -> Found 0 warnings and 0 errors
pnpm exec vp fmt --check <7 INC-3 files> -> All matched files use the correct format
pnpm -w turbo run test --force --continue -> 35/36 tasks successful; ONLY failure:
    @bluewave/content-schema#test  (pre-existing, tracked-at-HEAD: test/nation.test.ts
    Cannot find module '../../../content/research/nations/1880/index.ts' — unrelated
    to INC-3; also the historically documented pre-existing content-schema
    nation.test.ts import failure)
    @bluewave/desktop -> Test Files 64 passed (64); Tests 470 passed (470)
node scripts/verify-golden-hashes.cjs  -> "All 10 hashes match golden reference"
node packages/cross-process-test/dist/run-child.js (x2) -> byte-identical (cmp clean)
```

Pre-existing repo-wide gate items (NOT introduced by INC-3, left untouched per
`.ai/AUTONOMOUS-AGENT.md` failure policy — no broad rewrites to pass validation):
`vp fmt --check` flags 71 tracked files and `vp lint` reports 19 errors, all
confined to files at HEAD I did not modify (`prototype/desktop-e2e-harness/`
drafts, plus formatting drift in files committed by earlier INC-1/C-1/new-game
sprints). All 7 INC-3 files pass both gates scoped.

## Determinism evidence

- Content artifact hash: unchanged (no content touched).
- Initial snapshot hash: unchanged (no schema touched).
- Closing snapshot hash: unchanged.
- Golden hashes: **10/10 match** (`node scripts/verify-golden-hashes.cjs`).
- Two-process determinism: cross-process child run twice → **byte-identical**.
- Processes and operating systems: macOS (darwin), Node 24, pnpm 11.21.0.

## Canonical artifact changes

**None.** No authoritative package, schema, contract, or golden changed; the
sidecar is renderer-owned UI state with zero hash surface (proven by the
identical-post-commit-`rawHash` test and 10/10 goldens).

## Review

Reviewer: **NEEDS_REWORK** (1 HIGH: full-replace write semantics would let a
dismissal-only writer erase inspection state) → repaired (merge-preserve
semantics + two-writer/reset tests) + MEDIUM (source-size bounds: fingerprints
≤ 256, array ≤ 64, `lastCompletedStep` ≤ 6) + LOWs (AbortSignal unit test, stale
comment, bridge happy-path coverage) → re-review: **APPROVE**, no new findings.

## Working tree

Clean at session end (only INC-3 files + ADR-0038 staged; `dev` branch, 3 commits
ahead of `origin/dev`).
