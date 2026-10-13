# ADR-0005: Content Parsing and Schema Validation

## Status

Accepted

## Context

Content is authored in YAML and compiled to canonical artifacts. The engineering contract requires safe YAML parsing without executable tags, arbitrary object construction, or arbitrary expressions. Schemas must be strict and reject unknown fields by default.

## Decision

### YAML parsing

- Use the `yaml` npm package (Eemeli Aro's `yaml`) with no custom tags.
- `parseYamlSafe` enforces:
  - Maximum file size: 10 MB.
  - Maximum nesting depth: 64 levels.
  - Maximum alias count: 100.
- Parse errors produce a `YAML-PARSE` diagnostic with stage `parse`.
- Size violations produce a `YAML-SIZE` diagnostic.
- Nesting violations produce a `YAML-NESTING` diagnostic.

### Schema validation

- Use `zod` for all boundary schemas.
- `validateAgainstSchema` wraps `schema.safeParse()` and converts Zod issues to diagnostics with code `SCHEMA`.
- Each schema is a separate file under `content-schema/src/` for maintainability.

### Current schemas

- `PackManifestSchema` — name, version, type (production/fixture/mod), optional files map, optional dependencies.
- `RulesetManifestSchema` — id, name, version.
- `CountrySchema` — id, name, tag (3-letter).
- `AreaSchema` — id, name, type (land/sea/coastal), optional controller.
- `RouteEdgeSchema` — id, from, to, type (land/sea/rail), distance (positive int).
- `PossessionSchema` — id, countryId, areaId, optional since.
- `PortSchema` — id, name, areaId, countryId, optional level (1-10).
- `TechnologyPrerequisiteChainSchema` — id, name, category, optional prerequisites, cost, year.

## Update (2026-10-11): strict-YAML parse policy v1

The YAML parsing above is owned by `parseYamlSafe`, the single parse entry point
(the compiler routes every file through it today; runtime loaders adopt it when
they consume the compiled artifact — `content-runtime-integrity`, ticket 03).
The policy is versioned (`YAML_POLICY_VERSION = 1`) and stricter than the
original text:

- Parsed with `schema: "core"`, `uniqueKeys: true`, `resolveKnownTags: false`,
  and a line counter for positional diagnostics.
- **Tags.** Only the core scalar/collection tags (`str`, `int`, `float`, `bool`,
  `null`, `seq`, `map`) are accepted; any other explicit tag — including YAML 1.1
  `!!binary`/`!!timestamp` and custom tags such as `!!js/function` — is rejected
  before `toJS`, so no tag constructs or executes a value (`YAML-UNSUPPORTED-TAG`).
- **Duplicate mapping keys** are rejected, naming the key and its location
  (`YAML-DUPLICATE-KEY`).
- **Aliases.** An explicit `Alias`-node count caps alias use at
  `MAX_YAML_ALIAS_COUNT = 100`: at most 100 alias nodes are accepted and the
  101st is rejected at its own location (`YAML-ALIAS-LIMIT`). `toJS` is also
  bounded by `MAX_YAML_ALIAS_COUNT + 1` as a resource-exhaustion safety net; a
  throw there maps to `YAML-PARSE` and is never promoted to `YAML-ALIAS-LIMIT`.
  The classification is deliberately message-independent, so a `yaml` upgrade
  cannot silently demote the code. A nested alias-expansion bomb that uses ≤100
  alias nodes therefore surfaces as `YAML-PARSE`.
- Caps preserved: `MAX_YAML_BYTES` (10 MB) → `YAML-SIZE`; `MAX_YAML_NESTING`
  (64) → `YAML-NESTING`. Malformed syntax remains `YAML-PARSE`.

The `zod` schema text above is superseded by ADR-0102 / ADR-0105.

## Consequences

- Unknown fields are silently stripped by Zod (`.strip()` is the default). Future work should add `.strict()` to reject unknown fields explicitly.
- YAML executables and arbitrary expressions are rejected by the parser.
- Schemas are independently testable and composable.
- Adding a new entity type requires a new schema file and registration in the validate stage.
