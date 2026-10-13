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

**ContentPack**:
The compiled content artifact produced by the content compiler. It exposes the canonical
`nations` collection together with areas, routes, possessions, ports, and technology chains.
The on-disk surface for the nations collection (the YAML file name, the manifest key, and the
compiler input field) intentionally keeps the legacy "countries" naming.
_Avoid_: countries collection (only the on-disk name)

### Ship part model (ADR-0154)

**Part**:
A fittable catalogue entity: one record, one stable id. Display names are never matched.
_Avoid_: component (legacy), equipment

**Part family**:
The closed discriminator fixing a part's spec shape: `gun`, `gun_mount`, `ammunition`,
`torpedo_launcher`, `torpedo`, `propulsion_plant`, `armour_material`, `sensor`, `fitting`.

**Interface**:
An exact, case-sensitive token from `interfaces/1` naming what a part plugs into. A part
provides one; a slot accepts one or more. Calibre, side or date are never interfaces.

**Constraint**:
A closed-vocabulary predicate a slot applies to a candidate part's resolved spec. It
refines an interface, never replaces one.

**Platform**:
A hull form as the root assembly, declaring slots directly or through slot templates.

**Slot**:
A named mount point or armour region with accepted interfaces, `mountCount` bounds,
placement, nominal arc and constraints.

**Assembly**:
A part with its own slots (a gun mount holds guns and ammunition).

**Battery assembly**:
A `gun_mount` part representing a grouped central-battery installation (`mountCount: 1`,
`gunsPerMount: n`). It claims no rotating multi-gun mount.

**Loadout entry**:
One filled slot: slot, part, `mountCount`, placement, parameters and nested entries.
_Avoid_: placement (legacy), fit

**`mountCount`**:
Installed units of an entry's part; the only quantity on an entry.
_Avoid_: barrels, tubes

**`gunsPerMount`**:
Guns in one gun mount, a gun-mount spec field.

**Contained units**:
Units inside an entry, derived by the compiler: `mountCount × gunsPerMount` for a gun mount.

**Application basis**:
How a quantity component scales: `PER_LOADOUT_ENTRY` (once), `PER_PART_UNIT`
(× `mountCount`) or `PER_CONTAINED_UNIT` (× contained units).
_Avoid_: PER_FIT, PER_MOUNT

**Lifecycle**:
A part's `availableFrom` (inclusive), `availableUntil` (exclusive), `requires` and
`supersedes`. Supersession never implies refit compatibility.

**Revision**:
A dated delta to the same part's spec, with its own provenance.

**Prototype**:
The part a variant `extends`: one level, same family; the variant may not change the
interface, family, field meaning, or a quantity's kind or basis.

**Engine behaviour class**:
A closed, code-owned enum a ship type references (`capital_combatant`, `cruiser`, …).

**Visual trait**:
A closed presentation key read only by rendering; never reaches simulation.

**Data-quality finding**:
A named, enumerated inherited inconsistency (e.g. DQ-TORPEDO-001), reported apart from
migration differences.

**Translation disposition**:
A migration-provenance label for a reclassified legacy placement (e.g.
`RECLASSIFIED_AS_CENTRAL_BATTERY`); never simulation-facing.
