# Milestone B0-B2: Deterministic Content-Compiler Bootstrap

## Objective

Create a greenfield TypeScript monorepo and compile one minimal manifest-driven YAML content pack into a canonical hashed artifact, while invalid packs fail with stable deterministic diagnostics and no partial output.

## Canonical requirements

BW-ARC-001, BW-CMP-001, BW-CMP-002, BW-DET-001, BW-DET-003, BW-RUL-001, BW-RUL-002.

## In scope

- pnpm workspace and Turborepo;
- strict TypeScript and declared package exports;
- initial packages: `contracts`, `deterministic`, `diagnostics`, `content-schema`, `content-compiler`, `test-support`;
- `compiler-cli` application;
- pinned runtime/package-manager policy;
- formatting, linting, type checking, tests, builds, architecture checks, CI entry points, secret and dependency scanning;
- ADRs for monorepo boundaries, integers, serializer/hash, compiler stages, and content parsing;
- initial requirement index;
- safe integers, units, checked arithmetic, and explicit rounding helpers;
- structured diagnostics with stable code, severity, stage, source location/path, entity ID, related locations, and remediation;
- safe YAML parsing with size and nesting limits;
- explicit content-pack manifest;
- strict minimal schemas for pack manifest, ruleset manifest, country identity, area, route edge, possession, port, and technology prerequisite chain;
- typed immutable compiler stages;
- semantic reference validation;
- canonical JSON serialization and SHA-256 envelope;
- `validate`, `compile`, `inspect`, `verify`, and `compare` CLI commands;
- human and JSON output modes;
- AbortSignal propagation and atomic output cleanup;
- valid fixture and invalid fixtures for parse error, unknown field, duplicate ID, missing reference, unsafe path, excessive size/depth, and semantic invalidity.

## Out of scope

Campaign compilation, monthly engine, commands, persistence saves, RNG decisions, AI, tactical simulation, Electron functionality, production historical content, dynamic plugins, arbitrary expressions, mod scripts.

## Acceptance tests

1. Clean frozen install, format, lint, typecheck, architecture checks, tests, and build pass.
2. Repeated compilation produces byte-identical artifact and identical SHA-256 hash.
3. Reordered source files and YAML object keys do not change canonical output.
4. Set/collection ordering rules are explicit and tested.
5. Unknown fields, duplicate IDs, missing references, malformed YAML, and semantic failures emit stable ordered diagnostics.
6. JSON diagnostic mode contains no ANSI and has deterministic ordering.
7. An aborted or failed compile leaves no final artifact and removes temporary files.
8. Output path traversal is rejected.
9. Unsafe YAML constructs are rejected or inert.
10. Integer constructors reject fractions, unsafe integers, and out-of-range values.
11. Every rounding mode has positive, negative, tie, and boundary tests as applicable.
12. Domain/compiler packages contain no forbidden ambient input access.
13. CLI exit categories are documented and tested.
14. `inspect` and `verify` recompute and verify the artifact envelope rather than trusting stored hash text.

## Determinism proof

Record the compiled content artifact hash from at least two clean child processes. Cross-OS comparison is deferred to B8, but the CI workflow and artifact-report format should permit it.

## Stop conditions

Stop if the canonical source does not provide enough information to choose a gameplay-relevant field, if a production dependency has material unresolved license/security risk, or if deterministic serialization requires changing an approved contract.

## Required delivery

Use the validation-report and pull-request templates. Create small Conventional Commits, ending with a suggested milestone commit:

```text
feat(content): compile canonical content artifacts deterministically
```
