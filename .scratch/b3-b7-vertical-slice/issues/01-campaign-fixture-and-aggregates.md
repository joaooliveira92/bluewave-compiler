# 01 — Campaign fixture and state aggregates

**What to build:** Create the 1880 fixture (unmistakably non-production) and a campaign compiler that produces typed immutable state aggregates from it. The fixture includes two playable nations (GBR playable, one AI), two adjacent strategic areas, one possession and port per nation, a minimal technology prerequisite chain, one legacy fleet per participant, one continuing construction project, balanced opening economy, one bilateral diplomatic relation, and one deterministic battle opportunity. The campaign compiler extends the B0 content-compiler with campaign-specific stages that produce `CampaignState`, `WorldState`, `NationState`, `FleetState`, `ResearchState`, `WarState`, `PersistenceManifest`, `PoliticalState`, and `IntelligenceState`.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] 1880 fixture YAML files (scenario, nations, areas, routes, possessions, ports, tech, fleets, construction, economy, diplomacy)
- [x] Campaign state aggregate types in `packages/campaign` package
- [x] Campaign compiler stages producing state from fixture
- [x] Production validators remain strict — fixture-only constructs cannot appear in production packs
- [x] Repeated campaign compilation yields identical initial snapshot hash
- [x] ADR for campaign package boundaries and aggregate ownership

## Answer

Implemented `packages/campaign` with `CampaignCompiler` class, 10 state aggregate types, and the 1880 fixture. The compiler wraps the content compiler and adds campaign-specific YAML parsing for fleets, economies, constructions, diplomacy, and research. All 4 tests pass (valid compilation, determinism, missing-nations error, cancellation). ADR-0006 created.
