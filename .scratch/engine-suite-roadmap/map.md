# Wayfinder Map: Bluewave Engine-Suite Roadmap (B9–B10)

## Destination

Complete the Bluewave engine and compiler through B9 (Electron desktop shell) and B10 (Milestone 1 gameplay expansion), producing milestone briefs that can be handed off for implementation. B8 is already implemented — this map covers only the remaining roadmap.

## Notes

- Domain: `engine-suite.md` is canonical for roadmap order and scope. `.ai/ENGINEERING-CONTRACT.md`, `.ai/IMPLEMENTATION-PROMPT.md`, and `.ai/ROADMAP.md` govern implementation.
- Skills: `/grilling` and `/domain-modeling` for scope decisions; `/research` for any vendor/tool investigation before committing.
- B9 decisions already settled in charting session: `electron-vite` at `apps/desktop`, strict CSP, `compile` IPC channel only (MVP), process/IPC smoke test.
- B10 split into 4 sub-milestones (B10a–B10d).
- Every ticket produces a milestone brief at `.ai/briefs/<slug>.md` with defined scope, out-of-scope, acceptance criteria, and stop conditions.
- Do not resolve more than one non-research ticket per session.

## Decisions so far

<!-- populated as tickets are resolved -->

- [Electron Packaging Target Format](.scratch/engine-suite-roadmap/issues/01-electron-packaging-targets.md) — Use electron-builder with macOS dmg+zip, Windows nsis, Linux AppImage. Full research at `.scratch/engine-suite-roadmap/research/electron-packaging.md`.
- [B9 Desktop Content Display: CLI-only vs Read-only Render](.scratch/engine-suite-roadmap/issues/02-b9-desktop-content-display.md) — CLI-only for B9. Read-only render deferred to later milestone.

## Not yet specified

- Detailed scope boundaries between B10 sub-milestones (e.g., which economy features go in B10a vs deferred)

## Out of scope

- Anything already delivered in B0–B8 (compiler, campaign, commands, phases, persistence, battle, cross-process determinism)
- Production balance claims, full historical scenarios, or tactical combat UI
- Online/multiplayer features