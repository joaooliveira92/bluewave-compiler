# Wayfinder Map: Desktop E2E Coverage

## Destination

A decision map finding its way to a **handoff plan** for a hermetic,
CI-gated Playwright E2E suite for `apps/desktop` covering the full MVP
critical path through the real Electron app: New Game (archetype → nation →
preferences) → Overview → advance a Strategic month → Construction ordering →
Fleet view → Save/Load/Verify/Replay/Recover. "Covered" = every flow in the
approved spec matrix has a Playwright spec that boots the **built** app
hermetically (no dev server), stubs native dialogs to real on-disk fixtures,
asserts **user-visible behavior only**, and passes in a dedicated macOS CI
gate. This map produces the decisions + the coverage matrix; **the writing of
the suite itself is a follow-up implementation effort** handed off from this
map (plan-don't-do override NOT in force — user confirmed).

## Notes

- Domain: Bluewave is a deterministic 1880–1970 naval strategy sim. The
  "desktop app" = `apps/desktop`: Electron 41 + React 19, frameless window,
  state-machine shell (no router), IPC bridge `campaign:execute` with 22
  commands (13 real, 9 `NOT_IMPLEMENTED` stubs). Unit coverage already exists
  in `src/main/*.test.ts` + colocated renderer/shell tests (vitest + jsdom;
  `vitest.config.ts` deliberately excludes `e2e/**`). Golden-hash
  determinism is owned by `packages/cross-process-test`, not e2e.
- The only Playwright test today is `apps/desktop/e2e/smoke.spec.ts`
  (feasibility check; boots with `--dev` so it needs a running dev server).
  Predecessor maps: **Desktop MVP** (`.scratch/desktop-mvp`) built the
  playable loop this suite covers; **Desktop Campaign Viewer** (superseded
  Editor/Viewer). Their decisions stand for what they built.
- Charting-session decisions (locked in conversation, not individually
  ticketed — recorded here so they're reachable):
  - **Launch** hermetic: `electron-vite build` then launch
    `out/main/index.js` with NO `--dev` (prod `loadFile` path). No
    `webServer`, no dev server.
  - **Scope** — full MVP critical path only; dev screens (Tactical Sandbox,
    Debugging & Telemetry, Map Prototype) and settings screens (Campaign
    Preferences, Options) are out of scope.
  - **CI**: dedicated `desktop-e2e.yml` on `macos-latest`, paths-filtered
    to `apps/desktop/**`, independent of turbo and of
    `determinism.yml`/`quality.yml`.
  - **Native dialogs**: stub `dialog.showOpenDialog` via `app.evaluate`;
    create-side specs point the save-dir at per-test scratch dirs;
    continuance specs (load/verify/replay/recover) point at the shipped
    package `content/production/1880/bluewave-austria_hungary-scen_1880/`.
  - **Isolation**: per-test scratch `userData` (localStorage recent-files,
    `session.json`) + per-test scratch save dirs; teardown empties them.
  - **Fixtures**: create-side specs compile fresh (real `compileCampaign`
    path into a scratch dir); continuance specs load the shipped production
    package.
  - **Assertion depth**: user-visible behavior only; envelope/IPC correctness
    stays in `src/main` unit tests; golden-hash verification stays in
    `packages/cross-process-test`. One job per layer.
  - **Parallelism**: serial initially (`workers: 1`); parallelizing is a
    deliberate later unlock after isolation is proven.
  - **Determinism**: `campaignSeed` is a player-typed UI field (New Game
    Preferences → "Campaign Seed", `new-game-preferences-screen-state.ts`);
    a spec types a fixed seed → month outcomes are deterministic.
- Skills: `/grilling` + `/domain-modeling` for HITL tickets; `/prototype`
  for the harness ticket; `/research` (subagent) for external API facts.
- Do not resolve more than one non-research ticket per session.

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [Playwright/Electron E2E API Facts](issues/01-playwright-electron-e2e-api-facts.md) —
  hermetic launch = `_electron.launch({ args: [out/main/index.js] })` with NO
  `--dev` (prod `loadFile`, no browser download); stub native dialogs by
  mutating `dialog.showOpenDialog` via `app.evaluate` (verified writable on
  Electron 41.10.4); isolate per test with a `--user-data-dir=<tmp>` launch
  arg (never `evaluate`→`setPath`, it's too late); `pnpm install` must re-run
  (broken symlink) before any spec. Full note:
  [`docs/research/desktop-1-e2e-playwright-api-facts.md`](../../docs/research/desktop-1-e2e-playwright-api-facts.md).

## Not yet specified

- Battle Arena / tactical play inside the Simulation screen's `BattleArenaTab`
  — the battle commands (`generateBattle`, `resolveBattle`, ...) are
  `NOT_IMPLEMENTED` stubs today; e2e for the battle tab graduates once the
  M2 tactical-combat engine track lands them in the bridge.
- Settings-screen flows (Campaign Preferences / Options, e.g. save-on-close,
  display preferences persistence) as E2E specs — deferred unless exercising
  the critical path surfaces them as load-bearing.

## Out of scope

- Dev/prototype screens: Tactical Sandbox, Debugging & Telemetry, Map
  Prototype — throwaway/dev tooling, unit-covered; not part of the playable
  loop.
- Settings screens (Campaign Preferences, Options) E2E — not on the critical
  path.
- Windows/Linux E2E (including xvfb concerns) — macOS-only app per the
  Desktop MVP map's distribution call; CI gate is `macos-latest` only.
- Asserting golden hashes / replay hash files inside E2E — owned by
  `packages/cross-process-test` (its `golden/hashes.json` gate in
  `determinism.yml`).
- The implementation of the suite itself — that is this map's handoff
  artifact, not something the map does.