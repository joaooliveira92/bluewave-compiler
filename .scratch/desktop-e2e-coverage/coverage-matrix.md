# Desktop E2E Coverage Matrix

Version 1 — produced from **03 Spec Decomposition & Coverage Matrix**.
This is the handoff contract for the follow-up suite implementation: every
flow below becomes a Playwright spec in `apps/desktop/e2e/`, built on the
harness contract from **02 E2E Harness Shape** (`prototype/desktop-e2e-harness/`).

## Definition of done (suite)

"Covered" = every spec row below has a passing Playwright test that boots the
**built** app hermetically (no dev server), stubs the native dialog to its
stated fixture, asserts only user-visible behavior, and passes in the macOS
CI gate (ticket 04). Selector plumbing is the implementer's call: prefer
`getByRole`/stable text; add `data-testid` only where copy is genuinely
ambiguous. Labels below are the current real copy — verify at build time.

## Fixtures and seeds

- `SEED = "ba44581c2f1d8e5c9753ffc80be8e6a0"` — valid u128 hex, typed into
  New Game Preferences `Campaign Seed`. Fixed ⇒ deterministic `commitMonth`
  (months derive `campaignSeed:month:<turn>`).
- Shared save: one file-scoped scratch save dir created by the first spec in
  `mvp-loop.spec.ts` (serial mode, `workers: 1`).
- Continuance fixture: `copyFixturePackage()` —
  `content/production/1880/bluewave-austria_hungary-scen_1880/` copied to a
  scratch tree; the shipped tree is never mutated.
  **UPDATE (ticket 02):** the shipped package is currently **absent** from
  the worktree (it was untracked). The continuance suite will source its
  fixture from the create-side compile flow (a fixed-seed compile produces
  the same SaveStore shape) or a committed pristine fixture — resolution
  tracked on suite ticket 06.

## Specs

### `e2e/mvp-loop.spec.ts` (serial — one compiled campaign, chained narrative)

| row | spec                                    | flow / buttons                              | fixture | key user-visible assertions |
|-----|------------------------------------------|---------------------------------------------|---------|------------------------------|
| 1   | New Game compiles                        | landing "Bluewave Naval Staff" → New Game → archetype ("Choose your archetype"; pick a preset) → preferences (fill Campaign Seed `SEED`, defaults) → nation (pick Austria-Hungary) → Start Campaign | stubbed dialog → file-scoped `saveDir` (fresh compile) | lands on Overview: "Campaign Overview" header; Identity shows nation **Austria-Hungary**; turn shows **0** |
| 2   | Advance a month                          | navigate Simulation & Turn → primary action (~"Advance / Continue") | same shared save            | turn/calendar advanced past 0 (month header changes); no error card; prior state consistent |
| 3   | Construction: submit                     | Construction Commands screen → Shipyard Ledger tab → pick a design → Submit command → Save | same shared save        | design row appears in the construction command table with status ≈ Building/under construction (screen renders snapshot `constructionProjects`) |
| 4   | Construction: replace                    | select the in-flight command → Replace with another design → Save | same shared save          | table shows the replacement design; no in-flight residue (replace is failure-atomic) |
| 5   | Construction: cancel                     | select the command → Cancel → Save        | same shared save             | command leaves the live table; snapshot reflects cancel |
| 6   | Fleet visibility (read-only)    | Fleet Movement screen                     | same shared save             | "Fleet Movement" panel renders; divisions list shows the compiler's honest empty state (no error card); movement command surfaces disabled (submit gate) |

### `e2e/continuance.spec.ts` (serial; each spec points the dialog at a fresh copy of the production package)

| row | spec                        | flow                                    | fixture                        | key assertions                           |
|-----|------------------------------|-------------------------------------------|--------------------------------|-------------------------------------------|
| 7   | Load restores a save        | landing → Load → dialog → package copy → Overview | fresh `copyFixturePackage` | Overview restored: nation Austria-Hungary, turn **0**, same campaign identity |
| 8   | Verify reports integrity    | landing → Verify → dialog → package copy | fresh copy                     | integrity report surfaces OK / valid state; Overview reachable after |
| 9   | Replay is deterministic     | landing → Replay → dialog → package copy | fresh copy                    | replay-completed / "Replay verified" indicator; battle boundaries replay clean |
| 10  | Recover repairs a damaged package | **optional e2e**: corrupt the copy snapshot (`campaign.json` tamper) **before** boot; landing → Recover → dialog → the corrupted copy | tampered copy                 | recover surfaces the corruption and restores a playable package (opens to Overview), never crashes |
| 11  | Tamper → verify mismatch    | **optional e2e**: tamper the copy; landing → Verify → dialog → the corrupted copy | tampered copy                 | verification surfaces mismatch (integrity failure, not silent OK) |

Notes: rows 10–11 validate the user-visible surface of corruption paths
(strong hash/determinism checks live in `packages/persistence` +
`packages/cross-process-test`; e2e must not re-implement hashes). If the
corrupted-package fixture fights the harness (recover dialog on a malformed
package), keep row 10 as the minimum and mark row 11 covered by unit.

### Not in the matrix (deliberately out of scope, per map)

- Settings screens (Campaign Preferences, Options) and dev/prototype screens
  (Tactical Sandbox, Debugging & Telemetry, Map Prototype) — unit-covered,
  not part of the playable loop.
- Movement ordering (fleet) — `NOT_IMPLEMENTED` stubs: row 6 asserts the
  honest disabled surface instead of pretending to cover movement.
- `saveCampaign`/`closeCampaign` stubs — if the UI surfaces them, assert the
  honest disabled state; not full flows until the bridge implements them.
- Battle Arena tab e2e — graduates when the M2 engine lands battle commands.

## Stub-surface contract

Any screen that renders a `NOT_IMPLEMENTED` bridge command must show an
honest disabled/empty/error surface; the matrix asserts that surface,
never fabricated success copy.

Implementers' ground rules: fixture copy helper and dialog stub — see
`prototype/desktop-e2e-harness/fixtures.draft.ts`.