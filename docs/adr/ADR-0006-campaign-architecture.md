# ADR-0006: Campaign Package and Aggregate Architecture

## Status

Accepted

## Context

The B3-B7 vertical slice requires a campaign compiler that produces typed immutable state aggregates from content and fixture data. The engineering contract mandates that domain/authoritative logic remain independent of presentation and platform adapters, and that canonical, derived, cached, ledger, and ephemeral authority categories remain distinct.

## Decision

### Package boundary

Create `packages/campaign` as a new domain package depending on `content-compiler`, `content-schema`, `diagnostics`, `deterministic`, and `contracts`. The campaign package owns all campaign lifecycle code: compilation, command execution, phase engine, persistence, and battle resolution.

### Aggregates

Each aggregate is a plain TypeScript type (no class, no mutable methods):

- **CampaignSnapshot** — versioned container holding all campaign state for a turn
- **CampaignState** — snapshot plus envelope and hash
- **WorldState** — static game world: areas, routes, ports
- **NationState** — per-nation: treasury, income, expenses, fleets, research, construction projects, playable/AI flag
- **FleetState** — fleet with ships, location, battle tracking
- **ResearchState** — technology progress with invested points and completion
- **WarState** — war declarations and battle instances
- **PoliticalState** — diplomatic relations with shell for future expansion
- **IntelligenceState** — shell for future expansion
- **PersistenceManifest** — save metadata with version pins

### Campaign compiler

Extends the content-compiler pipeline: first compiles content via the existing `Compiler`, then reads campaign-specific YAML (fleets, economies, constructions, diplomacy, research), then assembles the `CampaignSnapshot`. The campaign compiler is a separate class (`CampaignCompiler`) that wraps the content compiler.

### Fixture-first approach

All B3-B7 development uses a non-production 1880 fixture with clearly reduced scope. Production validators remain strict; fixture-only constructs cannot appear in production packs. The fixture establishes the contract for all subsequent tickets.

## Consequences

- Campaign state is immutable and can be hashed deterministically.
- Adding a new aggregate (e.g., `LogisticsState`) requires adding the type and updating the compiler.
- The campaign compiler can be tested independently of the content compiler.
- Future tickets (02-10) build on these aggregates without structural changes.
