# ADR-0001: Monorepo Structure and Package Boundaries

## Status

Accepted

## Context

The Bluewave engine and compiler requires a strict separation of concerns between domain logic, deterministic primitives, content handling, and platform adapters. The engineering contract mandates a directed package graph, public package exports, and no internal cross-package source imports.

## Decision

Use pnpm workspaces with Turborepo as the build orchestrator. Each package is a standalone TypeScript composite project with explicit exports.

### Package layout

- `packages/contracts` — branded integer types, unit types, checked arithmetic, rounding modes.
- `packages/diagnostics` — structured diagnostic collector with stable codes, severity, stage, source location, and entity ID.
- `packages/deterministic` — canonical JSON serializer (stable key ordering), SHA-256 hashing, domain-separated hash contexts, artifact envelopes.
- `packages/content-schema` — Zod schemas for pack manifest, ruleset manifest, and all entity types; safe YAML parser with size/nesting limits.
- `packages/content-compiler` — typed immutable compiler stages (parse → validate → normalize → compile), orchestrator, structured diagnostics propagation.
- `packages/test-support` — fixture helpers and valid/invalid fixture definitions.
- `apps/compiler-cli` — CLI application with validate, compile, inspect, verify, compare commands.

### Package rules

- Domain packages (`contracts`, `diagnostics`, `deterministic`) must not depend on Node, filesystem, or platform APIs.
- `content-schema` may depend on `yaml` and `zod` but not on the filesystem.
- `content-compiler` depends on `content-schema`, `diagnostics`, `deterministic`, `contracts`, and filesystem (for reading input files).
- `compiler-cli` depends on all packages and owns the CLI entry point.
- Every package declares a `package.json` `exports` field with `types` and `default` entries.
- Cross-package imports use `workspace:*` protocol.

## Consequences

- Clear dependency direction prevents circular imports.
- Packages can be tested independently.
- Adding a new package requires updating the root `tsconfig.json` references.
- Turborepo caches build outputs per package and pipeline stage.
