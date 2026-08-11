# Bluewave

A deterministic naval campaign engine with canonical 1880-era content, compiled from
YAML packs through a content compiler into typed content packs and campaign snapshots.

## Language

**Nation**:
The canonical entity representing a country in the scenario canon, uniquely identified by
a lowercase `NationId`. `Nation` is the canonical domain term; "country" is deprecated.
_Avoid_: Country

**NationId**:
The lowercase snake_case stable identifier for a Nation, drawn from the 24-member canonical
enum (e.g. `uk`, `germany`, `qing`). It is the identity layer key for every nation reference
throughout the compiled content.
_Avoid_: CountryId, 3-letter id

**tag**:
The uppercase 3-letter presentation code carried by a Nation (e.g. `GBR`). It is a compact,
legacy-compatible label, not an identity key.
_Avoid_: country tag
