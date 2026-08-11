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

- [01-b9-electron-brief.md](.scratch/engine-suite-roadmap/issues/01-b9-electron-brief.md) — B9 scope resolved. Sub-decisions: packaging (electron-builder, dmg+zip/nsis/AppImage), renderer (CLI-only), brief produced at `.ai/briefs/b9-desktop-shell.md`.
- [Electron Packaging Target Format](.scratch/engine-suite-roadmap/issues/01-electron-packaging-targets.md) — Use electron-builder with macOS dmg+zip, Windows nsis, Linux AppImage. Full research at `.scratch/engine-suite-roadmap/research/electron-packaging.md`.
- [B9 Desktop Content Display: CLI-only vs Read-only Render](.scratch/engine-suite-roadmap/issues/02-b9-desktop-content-display.md) — CLI-only for B9. Read-only render deferred to later milestone.
- [B9 Milestone Brief](.scratch/engine-suite-roadmap/issues/03-b9-milestone-brief.md) — B9 brief produced at `.ai/briefs/b9-desktop-shell.md`. Covers scope, packaging, CLI-only, acceptance criteria, and stop conditions.
- [B10a economy and construction scope](.scratch/engine-suite-roadmap/issues/02-b10a-economy-construction.md) — B10a brief at `.ai/briefs/b10a-economy-construction.md`. Economy: treasury + income, maintenance, ledger, appropriation, obligation. Construction: ship projects with paid-work rule, completion promotes to FleetState. Fixture: 3 nations (GBR, FRA, GER).
- [B10b research and ship design scope](.scratch/engine-suite-roadmap/issues/03-b10b-research-design.md) — B10b brief at `.ai/briefs/b10b-research-design.md`. Research: 15-field priority system, 8-stage pipeline, expenditure-driven, deterministic discovery selection. Ship design: YAML-authored design templates, `CompiledDesignVersion` immutable records, design-family lineage, integrated with construction. Fixture extends 3-nation with tech tree and design templates.
- [B10c diplomacy and war scope](.scratch/engine-suite-roadmap/issues/04-b10c-diplomacy-war.md) — B10c brief at `.ai/briefs/b10c-diplomacy-war.md`. Diplomacy: declare war, peace treaties, alliances, non-aggression pacts, trade agreements, single-scalar tension. War/peace: war lifecycle with side model, war score from battles, national contribution, surrender (score>=80), basic blockade (+2/mo), mutual-defense alliance auto-entry, new `RESOLVE_DIPLOMACY` phase. All treaties (DESIGN-30) deferred. No settlement terms, no separate peace, no war goals, no occupation/merchant/exhaustion subsystems.
- [B10d AI legality and scenario readiness](.scratch/engine-suite-roadmap/issues/05-b10d-ai-scenario.md) — B10d brief at `.ai/briefs/b10d-ai-scenario.md`. AI: legal-only command generation with uniform random selection, `AI_PLANNING` phase, deterministic idempotency and RNG. Scenario readiness: 6-gate acceptance (compile → 1st turn → battle → save/load → replay → 24-month smoke test). New `@bluewave/ai` package. Supports 2+ AI participants.

## Not yet specified

<!-- All B10 sub-milestones resolved -->

## Out of scope

- Anything already delivered in B0–B8 (compiler, campaign, commands, phases, persistence, battle, cross-process determinism)
- Production balance claims, full historical scenarios, or tactical combat UI
- Online/multiplayer features
