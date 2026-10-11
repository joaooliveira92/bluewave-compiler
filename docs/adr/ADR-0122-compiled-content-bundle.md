# ADR-0122: Compiled content bundle — one hash-pinned artifact for the full authored surface

## Status

Accepted (2026-10-11).

## Context

The compiler pipeline (ADR-0004: parse → validate → normalize → compile) only
ever compiled the content-pack collections listed in `pack.json`. The
ship-building catalogue that sits beside a pack
(`ship-building/components.yaml`, `plants.yaml`, `hull-forms.yaml`,
`balance.yaml`, `armament/*.yaml`, per-nation `naval-profiles/*.yaml` and
`reference-designs/*/*.yaml`) was **never** validated by the compiler: the
Electron main process and the renderer each read and parsed those YAML files
directly at runtime. What CI proved and what the app executed were two different
things.

This ticket is the producer half of "validated content is the only thing that
runs": compile the **whole** authored surface into one deterministic, inert,
hash-pinned artifact that a runtime can consume without re-parsing YAML. The
consumer half (main reading the artifact, packaged resolution) is a later ticket.

## Decision

### 1. The ship-building catalogue is first-class compiler collections

The ship-building catalogue flows through the **same four stages** as the
content-pack collections — not a second pipeline. `CompilerInput` gains optional
file groups (`shipComponentFiles`, `propulsionPlantFiles`, `hullFormFiles`,
`shipBalanceFiles`, `gunFamilyFiles`, `gunModelFiles`, `gunMountFiles`,
`ammunitionFiles`, `navalProfileFiles`, `referenceDesignFiles`). The groups are
optional so that the content-pack-only boundary is untouched (§5).

- Parse reads each file through `parseYamlSafe` (the single strict-YAML entry
  point, see ADR-0005) and extracts the named array from wrapper mappings
  (`{ components: [...] }`, `{ designs: [...] }`, …); `balance.yaml` is kept
  whole as an object document.
- Validate applies each collection's `@bluewave/content-schema` schema, rejects
  duplicate ids, and rejects dangling cross-file references with the source file
  and a field path in the diagnostic (`DUP-ID`, `REF`).
- Normalize sorts by id (naval profiles by `nationId`); reference designs keep
  their discovery order because it is meaningful at runtime (UK-first, ADR-0109).
- Compile emits the bundle.

### 2. One artifact, one manifest, inert JSON

`content:build` writes exactly two files into the output directory:

- `content-artifact.json` — the compiled bundle: the content-pack collections
  plus an optional `shipBuilding` section shaped like the runtime's
  `ShipBuildingData` (minus `technologies`, which is a bundle-root collection).
  Its first field is `generatedBy`, the do-not-edit marker.
- `content-manifest.json` — `{ manifestVersion, doNotEdit, contentVersion,
  artifactKind, compatibilityVersion, algorithm, bodyHash, bodyLength }`.

The artifact is **inert JSON**, deliberately not generated TypeScript: content
stays authored YAML compiled to data, never executable modules. `bodyHash` is the
SHA-256 of the canonical serialization of the bundle
(`canonicalSerialize`, ADR-0003) wrapped in the versioned `content-bundle`
envelope; `contentVersion` is the semantic version from `pack.json`. Because the
serializer sorts keys and Normalize fixes collection order, two builds over
unchanged content are byte-identical and cross-process stable.

### 3. `content:check` / `content:build` are aliases over the existing CLI

Designer-facing `content:check` (validate, write nothing) and `content:build`
(emit the artifact) are thin configurations of the **same** `Compiler` invoked
with the full surface, discovered from `pack.json` plus the conventional
ship-building paths (the same convention the desktop loader uses). They are not a
second pipeline. `content:build` writes atomically (temp file then rename) and
`content:check` writes nothing.

### 4. The artifact is generated, never a second source of truth

The canonical output location is `content/generated/<scenario>/`, which is
**git-ignored**: the artifact is rebuilt from authored YAML whenever it is
needed (release build, packaging, local check) rather than committed. Committing
it would tempt hand-edits and create a second source of truth. The do-not-edit
marker records the policy in the generated files themselves.

### 5. `bwc compile` / `bwc validate` are unchanged

The existing `compile`/`validate` verbs and their wire formats are untouched:
they pass no ship-building groups, so `CompilerOutput.pack` and the
`content-pack` envelope are byte-compatible with today. The full-surface
boundary is a new, additive CLI surface (`content:check`/`content:build`), not a
change to the low-level `bwc` verbs.

## Consequences

- A runtime can load the catalogue with `JSON.parse` only; the artifact is the
  single thing CI validated and the single thing the app runs.
- Any change to the recorded content hash is an **expected content update**
  surfaced through the artifact, never a nondeterminism failure.
- Ticket 03 consumes `artifact.shipBuilding`; ticket 05 ships the generated
  directory as an app resource. Because the artifact is not committed, packaging
  must run `content:build` first.
- No new package is introduced; the seam is the existing compiler.

## References

- ADR-0003 (canonical serialization and hashing)
- ADR-0004 (compiler stage architecture)
- ADR-0005 (content parsing and schema validation; strict-YAML policy v1)
- ADR-0109 (ship-building content per nation)

## Amendments

- **2026-10-11 — campaign-file collections (`ADR-0124`).** The six campaign-file
  collections (`fleets`/`economies`/`constructions`/`diplomacy`/`research`/
  `designs`) join the artifact as a `ContentBundle.campaign` section, compiled
  through the same four stages, and `CampaignCompiler` consumes them decoded from
  the bundle. The `campaign` section is omitted for content-pack-only builds, so
  §5's byte-compatibility holds.
