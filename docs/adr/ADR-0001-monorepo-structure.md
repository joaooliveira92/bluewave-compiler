# ADR-0001: Monorepo Structure and Package Boundaries

## Status

Accepted (package layout and dependency rules refreshed 2026-10-10).

## Context

The Bluewave engine and compiler requires a strict separation of concerns between domain logic, deterministic primitives, content handling, the monthly turn engine, and platform adapters. The engineering contract mandates a directed, acyclic package graph, public package exports, and no internal cross-package source imports. The graph has grown well past the compiler-era layout, so this ADR records the current package set and the rules that keep it directed.

## Decision

Use pnpm workspaces with Turborepo as the build orchestrator. Each package is a standalone TypeScript composite project with explicit exports. Dependencies point one way — leaf primitives at the bottom, the monthly phase engine composing them, and the applications as the only platform entry points.

### Package layout

Domain and authoritative primitives:

- `packages/contracts` — branded integer (`SafeInt`) types, checked arithmetic, rounding modes. Root of the graph; no dependencies.
- `packages/diagnostics` — structured diagnostic collector with stable codes, severity, stage, source location, and entity ID.
- `packages/deterministic` — canonical JSON serializer (stable key ordering), SHA-256 hashing, domain-separated hash contexts, artifact envelopes, fixed-point math.
- `packages/armament` — platform-independent authoritative armament domain model and resolver (ADR-0093); neutral so both ship-design and combat can consume it.
- `packages/random` — SHA-256 domain-separated seeded PRNG with an audit ledger.
- `packages/content-schema` — Zod schemas for pack manifest, ruleset manifest, and all entity types; safe YAML parser with size/nesting limits.
- `packages/content-compiler` — typed immutable compiler stages (parse → validate → normalize → compile), orchestrator, structured diagnostics propagation.

Campaign and engine:

- `packages/campaign` — campaign compiler and state aggregates (world, nations, fleets, research, construction, war, diplomacy, intelligence, divisions, officers, design compilation).
- `packages/ship-design` — component-level ship compiler (DESIGN-21/63): design drafts, classification, cost, construction, national construction profiles.
- `packages/commands` — command definitions and envelopes, the 7-step command lifecycle, authorization, idempotency, ledger, reason codes.
- `packages/events` — domain event envelopes, event types, explanation trees, ledger.
- `packages/combat` — deterministic tactical battle engine and auto-resolution: movement/spotting/contact, gunnery, armor/damage, weather, torpedoes, mines, submarines, coastal defense, smoke, damage control, aircraft/air-combat, air defense, carrier operations, and battle generation.
- `packages/ai` — legal-only uniform-random AI planning (`AiPlanner`/`AiCommandGenerator`/`AiPhaseExecutor`) via keyed RNG.
- `packages/persistence` — content-addressed atomic save/load, snapshot serialization, compatibility, recovery.
- `packages/phase-engine` — ordered monthly turn pipeline (17 registered phases), month executor, replay verifier, financial ledger, AI procurement.

Boundary and support:

- `packages/campaign-engine` — desktop read-only projections over the compiled snapshot plus the `campaign:execute` bridge commands.
- `packages/ship-visual` — era- and nation-aware ship visual part catalog and resolver (ADR-0148): maps a design's mounts to visual parts. Pure data/resolution; holds no authoritative state.
- `packages/test-support` — fixture helpers and valid/invalid fixture definitions.
- `packages/cross-process-test` — cross-process determinism proof harness (child-process runners for the full pipeline and battle subsystems).
- `packages/content-codemod` — deterministic, staged-only migration of the legacy ship-building content into the parts representation (ship-part-model ticket 11c); developer tooling that never activates production content.

Applications:

- `apps/compiler-cli` — CLI application (`bwc`) with validate, compile, inspect, verify, compare, campaign, turn, and replay commands, plus a battle debug surface.
- `apps/desktop` — Electron + React 19 game client (main / preload / renderer).

### Dependency direction

- `contracts` is the root. `armament`, `diagnostics`, `deterministic`, and `random` depend only on `contracts` (and `deterministic` on `@noble/hashes`).
- `content-schema` depends on `contracts` + `diagnostics`; `content-compiler` adds `deterministic`.
- `campaign` depends on `contracts`, `diagnostics`, `deterministic`, `content-schema`, `content-compiler`.
- `ship-design` depends on `contracts`, `deterministic`, `random`, `armament`, and `content-schema` for types only (the part-model read path is typed by its strict schemas; no runtime import, so no Effect in the renderer); `events` depends on `campaign`, `contracts`, `deterministic`, `diagnostics`.
- `commands` depends on `contracts`, `deterministic`, `diagnostics`, `campaign`, `content-schema`, `ship-design`; `combat` depends on `contracts`, `deterministic`, `diagnostics`, `campaign`, `random`, `events`.
- `ai` and `persistence` depend on the campaign/command layer; `campaign-engine` depends on `campaign` + `content-schema`.
- `ship-visual` depends on `content-schema` + `diagnostics` — pure visual resolution, no authoritative state; the desktop renderer consumes its part types and resolver.
- `content-codemod` (developer tooling) depends on `content-schema`, `deterministic` and `ship-design`; its I/O is confined to its loader and publisher boundary, and it is excluded from production bundles.
- `phase-engine` composes the domain packages (campaign, commands, combat, events, persistence, random, ship-design, ai, campaign-engine, content-schema, contracts, deterministic, diagnostics) and owns the authoritative turn loop.
- `apps/*` depend on the packages and own the CLI entry point and platform adapters. The desktop renderer never imports engine packages or filesystem APIs; the Electron main process resolves built workspace packages (ADR-0008, ADR-0030).

### Package rules

- Domain/authoritative packages (`contracts`, `diagnostics`, `deterministic`, `armament`, `content-schema`, `content-compiler`, `ship-design`, `campaign`, `commands`, `random`, `events`, `ai`, `combat`, `phase-engine`) must not import `os`, `process`, `child_process`, `timers`, or `perf_hooks`; file reads are permitted only at the compile/IO boundary in `content-compiler` and `campaign`. Enforced by the ambient-input audit in `packages/cross-process-test/test/ambient-input.test.ts`.
- Infrastructure/boundary packages (`persistence`, `campaign-engine`, `test-support`, `cross-process-test`) and `apps/*` may use Node and filesystem APIs.
- Every package declares a `package.json` `exports` field with `types` and `default` entries.
- Cross-package imports use the `workspace:*` protocol and never reach into another package's `src/`.
- The **Dependency direction** above is asserted by `packages/cross-process-test/test/package-graph.test.ts`: every workspace dependency must point to a strictly lower layer (so the graph is acyclic), `contracts` is the root, and no library depends on an app. A new package must be added to that test's layer map.
- Adding a package requires updating the root `tsconfig.json` references and, if it is authoritative, the ambient-input audit's domain list.

## Consequences

- Clear dependency direction prevents circular imports.
- Packages can be tested independently.
- Adding a new package requires updating the root `tsconfig.json` references (and the domain-package audit list where applicable).
- Turborepo caches build outputs per package and pipeline stage.
