# Wayfinder Map: Desktop E2E Coverage

> **MAP COMPLETE — destination reached (no live tickets).** The way is clear:
> the follow-up suite implementation is the only remaining work, chartered
> as a fresh effort (`.scratch/desktop-e2e-suite/`) from the three handoff
> artifacts this map produced — `coverage-matrix.md` (what to cover), the
> harness prototype (`prototype/desktop-e2e-harness/`, what to build), and
> the config/CI spec (ticket 04, how to run it).

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
- [E2E Harness Shape](issues/02-e2e-harness-shape.md) — the shared harness
  contract, ratified: hermetic boot (`out/main/index.js`, no `--dev`),
  per-test `--user-data-dir` scratch + `mkdtemp`, one `dialog.showOpenDialog`
  stub via `app.evaluate` returning the per-test `saveDir` (create-side =
  scratch fresh compile; continuance = copied shipped package — never
  mutate the shipped tree), fixed u128 hex `SEED="ba44581c2f1d8e5c9753ffc80be8e6a0"`
  for deterministic months, serial files share one compiled campaign.
  Prototype asset: `prototype/desktop-e2e-harness/`; `playwright.config.ts`
  decisions delegated to ticket 04.
- [Spec Decomposition & Coverage Matrix](issues/03-spec-decomposition-coverage-matrix.md) —
  the handoff matrix (`coverage-matrix.md`): `e2e/mvp-loop.spec.ts` serial
  narrative rows 1–6 (new game → advance → construction submit/replace/cancel
  → fleet read-only honest empty), `e2e/continuance.spec.ts` rows 7–11
  (load/verify/replay/recover against fresh copies of the shipped package;
  recover + tamper-mismatch optional). Not in matrix: settings/dev screens,
  movement + save/close stubs (assert honest disabled surface), Battle Arena
  (graduates with M2 engine). DoD: every row passes hermetically in the
  macOS CI gate.
- [Config & Flake Guardrails](issues/04-config-flake-guardrails.md) — the
  config/CI invocation spec: single project, `testDir: "e2e"`, `workers: 1`,
  `timeout: 120_000`/`expect.timeout: 15_000`, `outputDir: "test-results"`,
  `reporter: CI ? "github" : "list"`, `retries: CI ? 2 : 0` +
  `trace: "on-first-retry"` (isolation makes retries safe); `test:e2e` stays
  `playwright test` (hermetic harness fails fast) with the gate running
  `pnpm build` first, no turbo wiring; new `desktop-e2e.yml` on
  `macos-latest`, `push: [dev, main]` + PR paths-filtered to
  `apps/desktop/**`, the production package, and the workflow file, mirroring
  the existing gates' setup steps; upload `test-results/` on failure.
  `--disable-gpu` kept as a documented CI-flake fallback, off by default.

## Not yet specified

<!-- cleared at map completion — see Out of scope for where each patch landed -->

## Out of scope

- Dev/prototype screens: Tactical Sandbox, Debugging & Telemetry, Map
  Prototype — throwaway/dev tooling, unit-covered; not part of the playable
  loop.
- Settings screens (Campaign Preferences, Options) E2E including save-on-close
  and display-preference persistence (previously "Not yet specified") — the
  critical path never surfaced them as load-bearing; graduates only via a
  fresh redrawn-destination effort.
- Battle Arena / tactical play e2e (previously "Not yet specified") — battle
  commands are `NOT_IMPLEMENTED`; graduates when the M2 tactical-combat track
  lands them in the bridge, as a future effort.
- Windows/Linux E2E (including xvfb concerns) — macOS-only app per the
  Desktop MVP map's distribution call; CI gate is `macos-latest` only.
- Asserting golden hashes / replay hash files inside E2E — owned by
  `packages/cross-process-test` (its `golden/hashes.json` gate in
  `determinism.yml`).
- The implementation of the suite itself — that is this map's handoff
  artifact, not something the map does.