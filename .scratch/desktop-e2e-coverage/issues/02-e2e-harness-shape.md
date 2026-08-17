# Desktop E2E Coverage — 02: E2E Harness Shape

Type: prototype
Status: resolved
Blocked by: 01

## Answer

Harness contract settled and ratifiable by the user (approved). Prototype
asset: `prototype/desktop-e2e-harness/` — `README.md` (contract),
`fixtures.draft.ts` (skeleton), `exemplar.draft.spec.ts` (narrative).

Locked decisions:

- **Hermetic boot**: `_electron.launch({ args: [<desktop>/out/main/index.js, "--user-data-dir=<scratch>"] })`, no `--dev` (prod `loadFile`); `ELECTRON_RUN_AS_NODE: ""`; fail fast if `out/main/index.js` is missing.
- **Per-test isolation**: `--user-data-dir=<scratch>/userdata` launch arg (research 01 verified — never `evaluate`→`setPath`); `mkdtemp` scratch tree per test, removed in `finally`.
- **Dialog stub**: `app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] }); }, saveDir)` — mutate method, never replace module.
- **saveDir by flow**: create-side = scratch (fresh compile); continuance = `copyFixturePackage()` — a copied shipped package (never mutate the shipped tree).
- **Seed**: `SEED = "ba44581c2f1d8e5c9753ffc80be8e6a0"` (valid u128 hex, the fixture package's own) typed into preferences → deterministic `commitMonth`.
- **Isolation vs sharing (user-ratified judgment call)**: default one fresh app per test; serial spec files (`mode: "serial"`) share one compiled campaign via a file-scoped save dir for the create-side narrative (compile → advance → construction → fleet). Strict per-test isolation across files; `workers: 1`.
- **Assertions**: user-visible only (getByRole/text; `data-testid` only where ambiguous — deferred to ticket 04).

`playwright.config.ts` shape (projects/reporter/traces/build-prerequisite) is
ticket 04's decision, documented as such in the prototype. Selector plumbing
is a ticket-04 concern; the exemplar's `getByTestId` names are placeholders.