# E2E Harness Prototype — decision artifact (ticket 02)

Rough-but-concrete shape for the shared Playwright harness every
`apps/desktop/e2e/*.spec.ts` builds on. **Not** the implementation — the suite
is a follow-up effort handed off from the Desktop E2E Coverage map. This is
the contract that effort builds to without re-litigating.

Mechanics grounded in **01 — Playwright/Electron E2E API Facts**
(`docs/research/desktop-1-e2e-playwright-api-facts.md`).

## Decisions (locked here)

1. **Hermetic boot** — `_electron.launch({ args: [<apps/desktop>/out/main/index.js, "--user-data-dir=<scratch>"] })`, **no `--dev`**, prod `loadFile` branch. Built-app path resolved relative to `e2e/` (`../out/main/index.js`). No browser download; Playwright drives the app's own Electron binary. Keep `ELECTRON_RUN_AS_NODE: ""` (parity with the smoke spec).
   - Fail fast if `out/main/index.js` is missing with "run `pnpm build` (or `electron-vite build`) first" — the CI/package script (ticket 04) makes build a prerequisite, the harness just refuses to hang.
   - Pack dir (`content/production/1880`) is resolved from `import.meta.dirname` inside the built bundle (`contentPack.ts`) — launch `cwd` is irrelevant. Test runs from anywhere.
2. **Per-test isolation** — `--user-data-dir=<scratch>/userdata` (verified: moves userData + session storage). Never `evaluate`→`app.setPath`. Each test gets its own scratch tree (`mkdtemp`).
3. **Dialog stubbing** — after boot: `app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] }); }, saveDir)`. Mutate the method, never replace the module. Works on Electron 41.10.4; one stub covers both the compile save-dialog and the continuance open-dialog call sites.
4. **saveDir meaning** — the per-test dir the stubbed dialog returns:
   - *create-side* spec: scratch dir → `compileCampaign` writes a fresh save there;
   - *continuance* spec: a **copy** of the shipped production package
     `content/production/1880/bluewave-austria_hungary-scen_1880/` (copy
     fixture first — Load/Verify/Replay/Recover write inside the package;
     never mutate the shipped tree).
5. **Teardown** — `finally`: `app.close().catch(() => {})` (no timeout arg; Playwright SIGKILLs stragglers on teardown) then remove the scratch tree. Re-enable keep-on-failure (leave scratch) is a ticket-04 flake-ops decision.
6. **Serial + shared-campaign pattern** — default fixture = one fresh app per test. For a multi-screen narrative (compile → advance → construction → fleet), a spec file uses `test.describe.configure({ mode: "serial" })`; the first spec compiles into a *file-scoped* scratch save dir (module-level `let`), later specs share it by opening that dir. `workers: 1` makes file-scoped sharing safe; cross-file is fully isolated.
7. **Seed** — `SEED = "ba44581c2f1d8e5c9753ffc80be8e6a0"` (valid u128 hex — the same seed the shipped production package carries; month outcomes derive `campaignSeed:month:<turn>`, so a fixed seed = deterministic advance). Typed into the New Game Preferences "Campaign Seed" field by `startNewGame`.
8. **Assertions are user-visible** — assert through the DOM (text/roles; the shell's controls have stable copy per existing screens). Prefer `getByRole`/text; add `data-testid` only where selectors are genuinely ambiguous (left to ticket 04). No bridge/envelope assertions here — that's `src/main` unit tests.

## Contract (files that the writer produces in `apps/desktop/e2e/`)

- `fixtures.ts` — `test` extended with `{ e2e: E2EHarness }`, re-exported `expect`, `SEED`.
- `launch.ts` or inside `fixtures.ts` — boot + stub + teardown (prototype combines them).
- `flows.ts` — workflow helpers on top of the harness: `startNewGame`, `openSave`, `advanceMonth`, `landing(expect)`, `expectOnOverview` care.
- `fixture-package/` README pointer — how to (re)seed the fixture copy (script or `fs.cp` from the shipped package).

`playwright.config.ts` shape (projects, `workers: 1`, `reporter`, traces) is **ticket 04's** decision — the harness only documents its own prerequisites.

## Prototype assets

- `fixtures.draft.ts` — the harness skeleton (types + boot + stub + teardown + fixture extension).
- `exemplar.draft.spec.ts` — one serial narrative spec exercising the contract (compile → advance → construction → fleet), plus a continuance spec skeleton, written against the draft API.

Draft code is intentionally uncompiled here (no `pnpm install` run, props unknown) — the implementer compiles and tunes it.