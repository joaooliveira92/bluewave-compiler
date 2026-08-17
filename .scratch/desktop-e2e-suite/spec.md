# Desktop E2E Suite — spec

> The way to the destination is already charted. This effort implements the
> suite handed off by the wayfinder map at
> `.scratch/desktop-e2e-coverage/map.md` (COMPLETE). Canonical spec for this
> effort = the map's three handoff artifacts — read all three before working
> a ticket:
>
> 1. **Coverage matrix** — `.scratch/desktop-e2e-coverage/coverage-matrix.md`
>    (what to cover: spec rows 1–11 + definition of done + stub-surface
>    contract + out-of-matrix scope).
> 2. **Harness prototype** — `prototype/desktop-e2e-harness/` (the harness
>    contract the suite builds on; `fixtures.draft.ts` is the skeleton).
> 3. **Config/CI spec** — `.scratch/desktop-e2e-coverage/issues/04-config-flake-guardrails.md`
>    (ratified playwright config shape + retries/trace + `desktop-e2e.yml`
>    invocation).

## Ready-for-agent pointer

Frontier: work the ticket with the lowest number whose blockers are all
resolved (`issues/` listed in dependency order). T1 (harness scaffold) is
the entry point and the immediately grabbable ticket.

## Engineering contract

Applies in full (`.ai/ENGINEERING-CONTRACT.md`). Notable for this effort:
test-only changes; no authoritative simulation state touched; the harness
must not weaken determinism (fixed seed, serial workers); e2e asserts
user-visible behavior only — hash/integrity verification belongs to the
existing unit + cross-process tests; clean working tree, small Conventional
Commits, exact validation commands in each ticket's report.

## Key standing decisions (from the map — do not re-litigate)

- Hermetic boot: `_electron.launch` on the built `out/main/index.js`, no
  `--dev`; per-test `--user-data-dir` scratch; fail fast if the build is
  missing.
- Dialog: one `dialog.showOpenDialog` stub via `app.evaluate`, mutated
  method; continuance fixtures are **copies** of the shipped production
  package, never the shipped tree.
- Fixed seed: `ba44581c2f1d8e5c9753ffc80be8e6a0` (valid u128 hex) → typed
  into New Game Preferences.
- Serial: `workers: 1`, `fullyParallel: false`; serial files share one
  compiled campaign; strict isolation across files.
- `pnpm install --frozen-lockfile` must run first — the working tree's
  `@playwright/test` symlink is currently incomplete (MODULE_NOT_FOUND).

## Out of scope (from the map — do not slip in)

- Settings screens (Campaign Preferences, Options) and dev/prototype
  screens (Tactical Sandbox, Debugging & Telemetry, Map Prototype).
- Movement ordering / save / close bridge commands (still
  `NOT_IMPLEMENTED`; assert honest disabled surface only).
- Battle Arena e2e — graduates when the M2 engine lands battle commands.
- Changing any authoritative package, content pack, or the shipped fixture
  package contents.