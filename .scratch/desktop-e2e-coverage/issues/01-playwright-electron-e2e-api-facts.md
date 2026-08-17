# Desktop E2E Coverage — 01: Playwright/Electron E2E API Facts

Type: research
Status: resolved
Blocked by: (none)

Research note: `docs/research/desktop-1-e2e-playwright-api-facts.md`

## Answer

Grounds the suite's launch, dialog-stubbing, and isolation mechanics. Key
decisions the follow-up implementation effort builds on:

1. **Hermetic launch**: `_electron.launch({ args: [out/main/index.js] })`
   without `--dev` runs the prod `loadFile` branch (verified in the built
   bundle). No `--dev`, no dev server. No browser download needed for
   Electron. Exe resolution = `require("electron/index.js")` unless
   `executablePath` passed. Use `waitForEvent("window", { predicate })`
   (fires per window created+loaded) or `firstWindow()`.
2. **Dialog stubbing works on Electron 41.10.4** — `showOpenDialog` is
   writable/configurable; canonical pattern
   `app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths: [p] }); }, p)`.
   Mutate the method, never replace the module (the `dialog` property is
   non-configurable).
3. **UserData isolation**: use a `--user-data-dir=<tmp>` launch arg (moves
   userData, sessionData, storage — verified). Do NOT use
   `evaluate` → `app.setPath("userData")` — it runs after `ready` and is too
   late.
4. **Broken install**: workspace `@playwright/test` is incompletely symlinked
   (`require('playwright/test')` → MODULE_NOT_FOUND). `pnpm install` must
   re-run before any spec can execute.
5. Pitfalls: `app.close()` has no timeout arg (force-kill via SIGKILL on
   teardown); launch `timeout` constant is 180s installed (30s in docs) —
   pass explicit timeouts for CI; keep `workers: 1`.

## Question

Ground the external API facts the rest of the suite's decisions hang off, in
primary sources (playwright.dev API docs, Electron docs) for the installed
`@playwright/test` ^1.49:

1. **Hemetic launch**: the canonical `@playwright/test` + `_electron.launch`
   pattern for launching a **built** Electron app — exact `args`/`env` shape
   to point at `apps/desktop/out/main/index.js` in prod (non-`--dev`) mode,
   how the Electron binary's path is resolved from the workspace, and how to
   wait for the renderer window (`app.waitForEvent("window")` caveats:
   devtools frame, `waitForLoadState`), so no Vite dev server is needed.
2. **Dialog stubbing**: how to override `dialog.showOpenDialog` in the main
   process from a test — `electronApp.evaluate` / `firstWindow().evaluate`
   surface; whether the override survives with `contextIsolation: true` and
   `sandbox: false`; what happens if the app under test requires the dialog
   handler. Note the exact call sites in `apps/desktop/src/main` that must be
   stubbed (`commands/compileCampaign.ts`, `commands/continuityCommands.ts`).
3. **Isolation**: per-test `userData` — `app.setPath("userData", …)` vs a
   `--user-data-dir` launch arg; which runtime state leaks between tests if
   not isolated (localStorage `bluewave-recent-files`, `session.json`
   sidecar, in-memory `CampaignSessionRecord`); reliable teardown
   (`app.close()`, killing orphaned Electron processes on failure).
4. **Version notes:** any changes in the installed `@playwright/test` that
   affect the above (supported Electron 41 pairing), and whether Playwright's
   Electron support requires downloading any additional browser.

Resolve via a `/research` subagent; write findings to
`docs/research/` following the repo's `desktop-N-<slug>` convention, cite
each claim's source, and update the `Research note` line above with the file.