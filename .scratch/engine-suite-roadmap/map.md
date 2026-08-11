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

## Not yet specified

- Detailed scope boundaries between B10 sub-milestones (e.g., which economy features go in B10a vs deferred)
- Whether B10a depends on B9 for desktop UX (e.g., CLI-only vs Electron-aware brief)
- Electron packaging target format (dmg/zip for macOS, nsis/portable for Windows, AppImage/deb for Linux)
- B9 brief should also cover: should the desktop app display compiled content (read-only render) or only CLI integration for now?

## Out of scope

- Anything already delivered in B0–B8 (compiler, campaign, commands, phases, persistence, battle, cross-process determinism)
- Production balance claims, full historical scenarios, or tactical combat UI
- Online/multiplayer features