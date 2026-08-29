# Wayfinder Map: Desktop E2E Expansion

## Destination

A decision map finding its way to a **handoff plan / E2E Coverage Matrix v2** for
expanding the hermetic, CI-gated Playwright suite for `apps/desktop` past the
MVP critical path — **re-anchored to the current commissioning flow** (the suite
is red today), then extended across the reachable real-bridge screens (Research
& Technology, Diplomacy & War, Treasury, first-month guided inspection,
multi-month depth, compile breadth), in the same built-app/CI shape as
`.scratch/desktop-e2e-suite/`. This map produces decisions + the repair-run plan
+ the matrix; **the writing of the expanded suite is the follow-up effort**
(plan-don't-do; no override — user confirmed in the prior effort).

## Notes

- **Domain:** Bluewave, deterministic 1880–1970 naval strategy sim. "Desktop
  app" = `apps/desktop`: Electron 41 + React 19, frameless window, state-machine
  shell (no router), IPC bridge `campaign:execute`. The E2E suite boots the
  **built** app hermetically (`electron-vite build` → `out/main/index.js`, no
  `--dev`, no dev server) and asserts **user-visible behavior only**.
- **Predecessor maps (decisions stand):** `.scratch/desktop-e2e-coverage/`
  (COMPLETE — coverage matrix + harness prototype + config/CI spec) and
  `.scratch/desktop-e2e-suite/` (COMPLETE — 7/7 tickets resolved: harness,
  mvp-loop rows 1–6, continuance rows 7–10, CI gate `desktop-e2e.yml` live).
  Their standing decisions: hermetic boot, per-test `--user-data-dir` scratch,
  one dialog stub via `app.evaluate`, fixed seed `ba44581c2f1d8e5c9753ffc80be8e6a0`
  (valid u128 hex, typed into the UI), `workers: 1` serial, golden hashes stay
  in `@bluewave/cross-process-test` (never re-asserted in e2e).
- **AUDIT FINDING 1 — the suite is RED against current `dev`.** `pnpm test:e2e`
  fails the create-side specs (row 1 and the continuance setup). The
  commissioning flow was restructured since the suite was written: clicking
  "New Campaign" lands on a keyboard-driven nation selection ("Fleet Dispatch" /
  "Admiralty Registry" / "Playable nations" listbox, `NewGameNationScreen`,
  primary action "Continue") *before* any preferences; the seed field now lives
  in the "Rules of the Naval Age" step (Era & Scale → **"Campaign Seed"**, input
  id `campaignSeed`); the advance button is now "Next: Choose Archetype". Every
  create-side selector sequence in `mvp-loop.spec.ts` / `continuance.spec.ts`
  is stale. The map's ticket **03 Re-anchor the suite to the current
  commissioning flow** owns the repair; nothing expanded sits on a green
  baseline until it is resolved.
- **AUDIT FINDING 2 — unreachable-in-prod surface is large.** The production
  build (no `VITE_BLUEWAVE_DEBUG`) ships these campaign screens: Overview,
  Construction, Fleet, Research & Technology, Diplomacy & War, Treasury, plus
  settings (Campaign Preferences, Options) and the landing/campaign-file flow.
  **Simulation & Turn, Tactical Sandbox, Debugging & Telemetry are
  debug-gated** (`DEBUG_MODE = isDebugMode(...)` in `campaign-screen-registry.tsx`),
  so they NEVER render in the e2e build — Battle Arena / Turn Report /
  Strategic Overview are unreachable until a decision about a debug-build e2e
  variant (ticket **09**). Map Prototype is `import.meta.env.DEV`-only.
- **AUDIT FINDING 3 — bridge surface (29 commands).** Real today: listNewGameOptions,
  compileCampaign, inspectCampaign, inspectOpeningBriefing, inspectMap,
  inspectPriorities, commitMonth, loadCampaign, listCampaigns, verifyCampaign,
  replayCampaign, recoverCampaign, inspectConstructionScreen,
  submit/replace/cancelConstructionCommand, inspectFleetScreen,
  inspectResearchScreen, setResearchPriorityCommand, inspectDiplomacyScreen,
  submitDiplomacyCommand, readUiState, writeUiState. Still `NOT_IMPLEMENTED`:
  closeCampaign, saveCampaign, generateBattle, resolveBattle,
  resolveTacticalBattle, replayBattleBoundary, submit/replace/cancelMovementCommand.
  Guidance: movement stays honest-stub only (never fabricate success); battle
  staging graduates when the battle commands land.
- **AUDIT FINDING 4 — known renderer honesty gap (row 11).** `verificationResultFromBridge`
  (renderer/screens/campaign-file/utils/package-operations.ts) maps every
  `outcome:"success"` VerifyCampaignResponse to the "verify" result kind, and
  `OperationStatus.tsx`'s verify branch renders "Package verified …"
  unconditionally, never reading `response.valid`/`issues`. So a tampered
  package currently shows the same "verified" copy as a healthy one; the
  continuance suite therefore skipped row 11 ("tamper → verify mismatch").
  Whether the expansion fixes that renderer branch (task-forbidden in the
  test-only suite effort) is ticket **05**.
- **Skills:** `/grilling` + `/domain-modeling` for HITL tickets; `/research`
  (subagent) for AFK fact-finding; `/prototype` if a ticket needs a cheap
  artifact to react to. Do not resolve more than one non-research ticket per
  session.
- **CI cost-pressure:** the macOS gate is a single serial job (`workers: 1`).
  Expansion grows wall-clock; ticket **08** re-opens the deliberately-deferred
  parallelisation unlock ("a deliberate later unlock after isolation is
  proven" — the suite has since gone green→red; the unlock decision must
  consider the current baseline repair).

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [Observable surface of the current commissioning flow & uncovered production screens](issues/01-observable-surface-current-flow.md) —
  the commissioning flow is 8 steps (nation selection first; "Campaign Seed" is now in Rules of the Naval Age step, id `campaignSeed`; step labels changed); guided tour auto-opens but does not block clicks; reachable-but-uncovered screen copy documented. Full inventory:
  [`docs/research/e2e-expansion-current-flow-surface.md`](../../docs/research/e2e-expansion-current-flow-surface.md).
- [Fixed-seed multi-month behaviour & suite wall-clock](issues/02-fixed-seed-multi-month-behaviour.md) —
  month 2–3 deltas observable in all four domains (research/diplomacy/construction/treasury); zero battles in 12 months; cross-process determinism already proven by unit tests; suite wall-clock ~4–8 min, each added serial test ~20–50s. Full inventory:
  [`docs/research/e2e-expansion-fixed-seed-multi-month-behaviour.md`](../../docs/research/e2e-expansion-fixed-seed-multi-month-behaviour.md).

## Not yet specified

- **Battle Arena / full tactical-play e2e** (generate/resolve/replayBattleBoundary on real
  battles): graduates only when the bridge battle commands land real engine work —
  blocked on out-of-map engine/bridge delivery plus ticket **09**'s debug-gate
  decision. Too coarse to ticket now; revisit once those land.
- **Replay of battle boundaries in the turn record** from within the Simulation /
  Turn Report surface — same dependency as above; only becomes specifiable with
  the battle commands.

## Out of scope

- Dev/prototype screens: Tactical Sandbox, Debugging & Telemetry (debug-gated,
  dev tooling, unit-covered — the debug-gate *variant* question is in ticket 09,
  the screens themselves are not e2e targets), Map Prototype (DEV-only
  throwaway).
- Movement ordering full-flow e2e (submit/replace/cancelMovementCommand are
  still `NOT_IMPLEMENTED`; the honest disabled surface was already asserted in
  mvp-loop row 6 and stays the only movement coverage).
- Windows/Linux E2E (incl. xvfb) — macOS-only app per the Desktop MVP
  distribution call; the CI gate is `macos-latest`.
- Golden-hash / replay-hash assertions inside E2E — owned by
  `@bluewave/cross-process-test` (its `golden/hashes.json` gate in
  `determinism.yml`).
- Mutating the shipped production content tree to build fixtures — continuance
  fixtures are always copies (prior suite decision).
- The implementation of the expanded suite itself — that is this map's handoff
  artifact, not something the map does.