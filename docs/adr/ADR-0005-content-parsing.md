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

## Consequences

- Unknown fields are silently stripped by Zod (`.strip()` is the default). Future work should add `.strict()` to reject unknown fields explicitly.
- YAML executables and arbitrary expressions are rejected by the parser.
- Schemas are independently testable and composable.
- Adding a new entity type requires a new schema file and registration in the validate stage.
