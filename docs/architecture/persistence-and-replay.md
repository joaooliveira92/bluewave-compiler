# DESIGN-52: Save, Load, Replay, And Persistence

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-52`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Save boundaries, authoritative-state persistence, rebuildable projections, random-decision continuity, compiled-design artifacts, atomic writes, compatibility, migration, load validation, and replay MUST use the explicit contracts, hashes, ordering, and failure behavior defined here. Runtime inference and untracked external-file dependencies are prohibited.

## 1. Stable Save Boundaries

A canonical save may be created only at one of these boundaries:

- committed `MonthOpeningSnapshot`;
- committed `MonthClosingSnapshot`; or
- committed tactical-minute boundary when the active battle and scenario permit battle saving.

Strategic saves MUST NOT capture a partially applied phase, command transaction, settlement transaction, damage transaction, or ledger append.

Tactical saves MUST NOT capture a partially resolved tactical minute or substep.

A request outside a stable boundary MUST be deferred to the next eligible boundary or rejected with `SAVE_BOUNDARY_NOT_STABLE`.

## 2. Save Package

Every save MUST be a self-contained `CampaignSavePackage` containing:

- one save manifest;
- authoritative campaign snapshot;
- active battle snapshot or `NONE`;
- command, event, transaction, and causal-ledger segments required after the snapshot;
- RNG manifest;
- compiled-design artifact store;
- embedded or content-addressed canonical content dependencies;
- migration history;
- integrity index; and
- package hash.

A save package MUST NOT require mutable process memory, UI state, cache state, or an untracked local file to recover authoritative campaign state.

## 3. Save Manifest

Every `SaveManifest` MUST contain:

- `saveFormatVersion`;
- `rulesetVersion` and `rulesetHash`;
- `formulaVersion` and `formulaManifestHash`;
- `aiPolicyVersion` and `aiPolicyManifestHash`;
- `rngAlgorithmVersion`;
- ordered content-pack identifiers, versions, and hashes;
- scenario identifier, version, and hash;
- campaign identifier;
- campaign seed identifier or protected seed material;
- current campaign month;
- current strategic phase cursor;
- stable save-boundary type;
- authoritative strategic snapshot hash;
- active battle identifier and hash or `NONE`;
- RNG manifest hash;
- compiled-design artifact index hash;
- command, event, transaction, and causal-ledger positions;
- migration-history hash;
- integrity-index hash;
- creation timestamp for presentation only;
- save writer build identifier; and
- manifest hash.

The creation timestamp and writer build identifier MUST NOT participate in simulation outcomes.

A missing required field MUST fail with `SAVE_MANIFEST_INCOMPLETE`.

## 4. Authoritative State Registry

The save format MUST define one versioned `AuthoritativeStateRegistry` listing every persisted authoritative aggregate type.

The registry MUST include at least:

- campaign and scenario runtime state;
- playable-slot and nation-instance state;
- economy, budget, ledger, and project state;
- possessions, ownership, control, and infrastructure;
- diplomacy, treaty, war, peace, and objective state;
- research, technology, design, construction, and inventory state;
- ships, divisions, officers, personnel, aircraft, squadrons, and fleet state;
- deployment, logistics, blockade, trade, submarine, mine, and amphibious state;
- knowledge, intelligence, reports, and assertions;
- active tactical battle state when present;
- all command, event, decision, and reservation state required for continuation;
- random-decision state required by Section 8; and
- migration and compatibility state.

Every aggregate type MUST declare schema version, canonical serializer, canonical ordering, invariant validator, and migration entry point.

Undeclared aggregate state MUST fail packaging with `AUTHORITATIVE_STATE_TYPE_UNREGISTERED`.

## 5. Authoritative and Derived Classification

Every persisted data type MUST declare exactly one persistence classification:

- `AUTHORITATIVE_PERSISTED`;
- `AUTHORITATIVE_CONTENT_ADDRESSED`;
- `DERIVED_REBUILDABLE`;
- `EPHEMERAL_NOT_PERSISTED`; or
- `PRESENTATION_ONLY`.

A type classified as `DERIVED_REBUILDABLE` MUST provide:

- deterministic rebuild function identifier and version;
- authoritative input types;
- canonical ordering;
- invalidation keys;
- output hash algorithm; and
- reconstruction tests.

A derived value without a deterministic rebuild contract MUST be reclassified as authoritative and persisted.

## 6. Derived Projections

Derived projections MAY be included in a save only as disposable cache entries.

Every included projection MUST contain:

- projection type and version;
- source snapshot and knowledge hashes;
- formula version;
- projection hash; and
- `authority: CACHED_PROJECTION`.

During load, cached projections MUST be discarded when any pinned hash or version differs.

The loader MUST be capable of deleting every cached projection and rebuilding it from authoritative state without changing any authoritative hash.

Examples include UI views, maintenance warnings, classification caches, intelligence projections, report indexes, searchable lists, and precomputed summaries.

A cached projection MUST NOT resolve a conflict against authoritative state.

## 7. Canonical Serialization

All authoritative state MUST use canonical serialization with:

- explicit schema version;
- stable field identifiers;
- UTF-8 strings normalized to Unicode NFC;
- integer and fixed-point numeric values only for authoritative simulation fields;
- explicit `NONE` values where schemas require them;
- maps serialized by ascending canonical key;
- sets serialized as sorted arrays;
- arrays serialized in their domain-defined canonical order;
- no undefined values;
- no wall-clock-dependent fields in authoritative hashes; and
- no platform-native object serialization.

Floating-point values MUST NOT be persisted as authoritative simulation operands unless a versioned design revision defines an exact canonical encoding.

Serialization of the same state MUST produce identical bytes on every supported platform.

## 8. RNG Persistence Contract

Every random decision domain MUST declare one of these persistence modes:

- `KEYED_DERIVATION`;
- `STREAM_CURSOR`; or
- `EXPLICIT_STATE`.

### 8.1 Keyed Derivation

For `KEYED_DERIVATION`, the save MUST persist:

- RNG algorithm version;
- campaign seed identifier or protected seed material;
- stream-family identifier;
- stable decision-key contract version;
- completed-decision ledger position;
- decision result records required for audit; and
- stream manifest hash.

A keyed decision MUST be reproducible from the exact key and MUST NOT depend on a mutable global cursor.

### 8.2 Stream Cursor

For `STREAM_CURSOR`, the save MUST persist:

- stream identifier;
- algorithm version;
- serialized generator state or seed;
- exact next-draw cursor as a non-negative integer;
- last committed decision identifier;
- consumed-draw count; and
- stream-state hash.

### 8.3 Explicit State

For `EXPLICIT_STATE`, the complete versioned generator state required for the next value MUST be persisted as canonical bytes with a hash.

### 8.4 No Ambiguous Position

Persisting only a campaign seed is insufficient for cursor-based or stateful streams.

Persisting only a cursor is insufficient when the algorithm requires other state.

A stream without a complete declared persistence mode MUST fail saving with `RNG_PERSISTENCE_CONTRACT_INCOMPLETE`.

## 9. RNG Manifest

Every save MUST contain one `RngManifest` with entries ordered by stream identifier.

Each entry MUST contain:

- stream identifier and family;
- persistence mode;
- algorithm and key-contract versions;
- seed reference;
- cursor or explicit state when applicable;
- committed decision count;
- last committed decision identifier;
- expected next-decision identity when knowable or `NONE`;
- entry hash; and
- audit-ledger range.

The manifest hash MUST cover every entry.

Loading MUST fail before simulation continues when an authoritative RNG entry is missing, duplicated, corrupt, or incompatible.

## 10. Compiled Design Artifact

Every immutable `CompiledDesignVersion` referenced by any persisted ship, named class, project, contract, treaty record, battle state, historical record, or migration MUST be available through one `CompiledDesignArtifact`.

Each artifact MUST contain:

- compiled-design identifier;
- source draft identifier and revision or `NONE` for imported legacy artifacts;
- design-family identifier;
- complete normalized mechanical design payload;
- component definitions or pinned component references;
- technology-manifest references;
- classification result;
- cost and construction-work results;
- design warning and penalty records;
- compiler, content, formula, and ruleset versions;
- dependency hashes;
- canonical serialized bytes; and
- artifact hash.

An artifact MUST be sufficient to reconstruct every authoritative mechanical value required by ships and projects without reading an editable design source file.

## 11. Design Artifact Storage Modes

Each compiled-design artifact MUST use exactly one storage mode:

- `EMBEDDED`;
- `PACKAGE_CONTENT_ADDRESSED`; or
- `VERIFIED_EXTERNAL_CONTENT_STORE`.

### Embedded

The canonical artifact bytes are stored inside the save package.

### Package Content Addressed

The artifact is stored once in the save package's object store under its cryptographic hash. Every reference pins that hash.

### Verified External Content Store

This mode is permitted only when:

- the external store is an installed immutable canonical content store;
- the manifest pins store identifier, object identifier, version, and cryptographic hash;
- the save package contains a complete fallback embedded artifact or legally redistributable recovery object; and
- load verifies the downloaded or installed bytes before use.

An arbitrary filesystem path, user-edited design file, workshop working directory, temporary file, or repository-relative source file is not a valid artifact store.

## 12. Design Artifact Closure

Before save commit, the writer MUST compute the transitive closure of all referenced compiled designs.

The closure MUST include artifacts referenced by:

- active and historical ships;
- ships under construction, repair, rebuild, conversion, transfer, or scrapping;
- named classes and design families;
- foreign-construction contracts;
- treaty declarations and inspections;
- current and historical battle manifestations;
- captured or transferred ships;
- replacement or continuity content;
- officer, objective, event, or report history where mechanical reconstruction requires the design; and
- migration dependencies.

Every referenced identifier MUST resolve to exactly one artifact hash.

A missing or conflicting artifact MUST fail with `COMPILED_DESIGN_ARTIFACT_MISSING` or `COMPILED_DESIGN_ARTIFACT_HASH_CONFLICT`.

## 13. No Untracked External Design Dependency

A save MUST load successfully after the original design editor files, source JSON, authoring workspace, repository checkout, and mutable mod working directory have been deleted, provided the pinned canonical content pack and save package remain available.

The save manifest MUST NOT contain an authoritative dependency on:

- absolute or relative source-file path;
- modification time;
- directory name;
- editor session identifier;
- local database row without exported artifact bytes;
- mutable cloud-document URL; or
- unverified external object.

If such a dependency is found, save validation MUST fail with `UNTRACKED_EXTERNAL_DESIGN_DEPENDENCY`.

## 14. Content and Ruleset Pinning

A campaign is pinned by default to its original:

- save-format version;
- ruleset version and hash;
- formula manifest;
- AI-policy manifest;
- RNG algorithm and key-contract versions;
- content packs and hashes;
- scenario and hash; and
- compiled-design artifact hashes.

A patch or installation update MUST NOT silently replace any pinned simulation dependency for an existing campaign.

Presentation-only resources MAY change when they do not alter identifiers, authoritative values, or hashes.

## 15. Autosave Policy

The system MUST create a strategic autosave after every successfully completed month at `MonthClosingSnapshot`.

Battle autosaves MAY occur only at committed tactical-minute boundaries and MUST use an explicit interval within `1..30` tactical minutes.

The shipped battle-autosave interval is exactly `5` tactical minutes when battle saving is enabled.

A new battle autosave MUST NOT overwrite the previous recovery save until validation and pointer commit succeed.

## 16. Atomic Save Transaction

Every save write MUST execute these steps in order:

1. acquire a logical save-generation identifier;
2. freeze the committed source snapshot and relevant ledgers;
3. compute authoritative dependency closure;
4. serialize canonical package objects to a new temporary package;
5. compute object hashes and integrity index;
6. validate schemas, references, invariants, content closure, artifacts, and RNG manifest;
7. reopen the package through the normal loader in validation mode;
8. recompute authoritative hashes;
9. atomically rename or commit the new package object;
10. atomically update the active-save pointer;
11. retain the previous valid save as recovery; and
12. append a save-commit record.

A failure before pointer commit MUST leave the prior active and recovery saves unchanged.

## 17. Save Integrity Index

Every save MUST contain an `IntegrityIndex` with one entry per package object.

Each entry MUST contain:

- object type;
- stable object identifier;
- schema version;
- canonical byte length;
- cryptographic hash;
- dependency identifiers and hashes;
- required or optional classification; and
- ordering ordinal.

The package hash MUST cover the manifest, integrity index, and ordered object hashes.

The shipped cryptographic hash algorithm is `SHA-256`.

A future algorithm change requires a save-format migration.

## 18. Recovery Saves

The system MUST retain at least:

- current active save;
- immediately previous validated strategic save; and
- most recent validated battle autosave when an active battle exists.

Recovery selection MUST use manifest generation, stable boundary, validation result, and committed pointer records, not filesystem modification time alone.

The UI MUST clearly identify recovery source and month or tactical minute.

## 19. Load Pipeline

Loading MUST execute these stages in order:

1. read package header and manifest;
2. validate package and object hashes;
3. validate save-format compatibility;
4. resolve and validate pinned content, scenario, ruleset, formula, AI, RNG, and design artifacts;
5. apply supported format and content migrations in order;
6. deserialize authoritative state;
7. validate references and ledger positions;
8. validate RNG state and decision continuity;
9. discard untrusted or stale derived projections;
10. rebuild derived projections;
11. run cross-domain invariants;
12. recompute strategic and battle hashes;
13. compare hashes with migrated expected values;
14. create a load-validation report; and
15. expose the campaign only after full success.

A failed stage MUST NOT expose a partially loaded campaign as playable.

## 20. Load Outcomes

Load result MUST be exactly one of:

- `LOADED_EXACT`;
- `LOADED_AFTER_SUPPORTED_MIGRATION`;
- `RECOVERED_FROM_PREVIOUS_VALID_SAVE`;
- `REJECTED_INCOMPATIBLE`;
- `REJECTED_CORRUPT`; or
- `REJECTED_MISSING_DEPENDENCY`.

The UI MUST distinguish incompatibility, missing content, unsupported migration, hash corruption, missing design artifact, RNG corruption, and invariant failure.

The loader MUST NOT silently reset values, drop assets, reroll decisions, replace designs, or substitute current rules.

## 21. Derived Projection Rebuild

Projection rebuild MUST use only migrated authoritative state and pinned formulas.

The rebuild pipeline MUST be ordered by declared projection dependency graph and ascending projection identifier tie-breaking.

A dependency cycle MUST fail with `DERIVED_PROJECTION_DEPENDENCY_CYCLE`.

After rebuilding, cached projections MUST be compared against newly computed hashes when cached versions were present. A mismatch discards the cache and records diagnostics; it MUST NOT alter authoritative state.

## 22. Invariant Validation

Load-time invariant validation MUST include:

- unique identities and references;
- one legal owner and valid control state per possession;
- non-negative resources, inventory, capacity, and project progress;
- ledger balance and transaction closure;
- command, event, and causal-ledger continuity;
- ship, division, officer, personnel, squadron, and project compatibility;
- war, alliance, treaty, and peace consistency;
- strategic location uniqueness;
- active-battle reservation uniqueness;
- RNG manifest completeness and continuity;
- compiled-design artifact closure;
- content and ruleset pinning; and
- snapshot and aggregate hash consistency.

An invariant failure MUST be classified as migration-repairable or unrecoverable. Runtime guesswork is prohibited.

## 23. Migration Contract

Every supported migration MUST have one immutable `MigrationDefinition` containing:

- migration identifier;
- source and target save-format versions;
- source and target content, ruleset, formula, AI, and RNG compatibility predicates;
- ordered transformation steps;
- preconditions;
- postconditions;
- identity and artifact mapping;
- RNG-state mapping;
- expected hash-translation policy;
- rollback behavior;
- validation fixtures; and
- migration hash.

Migrations MUST be deterministic, idempotent for their declared source version, and append one migration-history record.

## 24. Migration History

Every applied migration MUST append a `MigrationHistoryEntry` containing:

- migration identifier and hash;
- source and target versions and hashes;
- pre-migration package hash;
- post-migration package hash;
- transformed object counts;
- warnings;
- validation result;
- applied order; and
- entry hash.

Migration history is authoritative audit state and MUST NOT be deleted by later saves.

## 25. Ruleset Migration

A campaign ruleset may change only through an explicit supported ruleset migration.

The migration MUST define treatment of:

- existing numeric values;
- active projects;
- compiled designs;
- classification;
- technology availability and progress;
- AI state;
- RNG streams and pending decisions;
- wars, treaties, objectives, and events;
- active battle state; and
- replay compatibility.

If no migration exists, the campaign MUST remain pinned to the original ruleset or load must fail with `RULESET_MIGRATION_UNSUPPORTED`.

Silent formula changes are prohibited.

## 26. Canonical Corruption

Canonical corruption is unrecoverable when any condition holds and no supported deterministic repair exists:

- required package object hash mismatch;
- duplicate authoritative identity with conflicting state;
- broken balanced-ledger history that cannot be reconstructed from valid records;
- missing required compiled-design artifact;
- incompatible or missing RNG state that would change future decisions;
- missing content dependency without embedded canonical fallback;
- impossible cross-domain reference;
- unsupported partially committed transaction;
- strategic or battle hash mismatch after supported migration and rebuild; or
- active battle state lacking complete manifest or provenance.

The loader MUST reject with a structured diagnostic report and preserve the original file unchanged.

## 27. Tactical Replay Manifest

Every completed or resumable battle MUST have one `TacticalReplayManifest` containing:

- battle identifier;
- immutable initial battle snapshot and hash;
- battle manifest and hash;
- battle seed;
- RNG algorithm and decision-contract versions;
- ordered tactical command log;
- ordered battle-event or decision ledger;
- weather and environment source hashes;
- ruleset, formula, AI-policy, and content hashes;
- optional periodic minute checkpoints and hashes;
- final result hash or `NONE`; and
- replay-manifest hash.

Tactical replay MUST NOT depend on renderer frames, input-device polling frequency, or wall-clock timing.

## 28. Tactical Replay Procedure

Tactical replay MUST:

1. validate all manifest dependencies;
2. load the immutable initial battle snapshot;
3. restore RNG derivation or stream state;
4. replay commands at their authoritative quantized tactical times;
5. resolve battle minutes through the pinned ruleset and formulas;
6. compare optional checkpoint hashes;
7. compare final state and result hashes; and
8. produce a replay-validation report.

A checkpoint mismatch MUST stop verification at the first mismatching minute and report the expected and actual hashes.

## 29. Strategic Replay Manifest

Every campaign MUST support a `StrategicReplayManifest` containing:

- compiled initial campaign snapshot and hash;
- campaign seed and RNG manifest;
- ordered monthly commands;
- ordered decisions and event choices;
- ordered scenario and system events;
- month and phase boundary hashes;
- content, scenario, ruleset, formula, AI-policy, and RNG hashes;
- compiled-design artifact index;
- migration history; and
- final snapshot hash or `NONE`.

The initial snapshot MUST already contain or reference every required compiled design and canonical dependency.

## 30. Strategic Replay Procedure

Strategic replay MUST:

1. load the pinned initial campaign snapshot;
2. validate dependency and artifact closure;
3. restore RNG state or derivation contracts;
4. apply commands and decisions at their exact month and phase;
5. generate and apply system events through pinned streams;
6. resolve strategic phases in canonical order;
7. compare every available phase or month hash;
8. stop at the first divergence; and
9. produce a deterministic divergence report.

A replay MUST NOT use current default rules, current content, or regenerated design files in place of pinned dependencies.

## 31. Replay Checkpoints

Replay checkpoints MAY be stored to accelerate verification.

Every checkpoint MUST contain:

- boundary identifier;
- authoritative snapshot bytes or content-addressed reference;
- ledger positions;
- RNG manifest state;
- design artifact index hash;
- dependency hashes;
- checkpoint hash; and
- preceding replay-chain hash.

A checkpoint is trusted only after verifying its chain from the replay initial state or a prior trusted checkpoint.

## 32. Save and Replay Privacy

Save packages MAY encrypt protected seed material or private player metadata.

Encryption MUST NOT alter canonical plaintext simulation hashes. The manifest MUST identify encryption format and key requirement separately from authoritative content hashes.

A missing decryption key MUST produce `REJECTED_MISSING_DEPENDENCY`, not corruption.

## 33. Export and Portability

A portable save export MUST include:

- complete save package;
- embedded compiled-design artifacts;
- legally redistributable canonical content objects unavailable by immutable public identifier;
- compatibility and migration metadata;
- integrity index; and
- export-validation report.

A portable export MUST validate in an environment where authoring files and mutable caches are absent.

## 34. Records and Reports

Every save, autosave, load, recovery, migration, replay, export, integrity validation, projection rebuild, and corruption rejection MUST create an immutable persistence-operation record containing:

- operation identifier and type;
- source and destination package identifiers;
- stable boundary;
- versions and hashes;
- object counts;
- design artifact counts;
- RNG manifest result;
- migration result;
- invariant result;
- outcome and reason codes;
- diagnostic report hash; and
- operation-record hash.

Human-readable logs MUST be generated from these records and remain non-authoritative.

## 35. Canonical Ordering

Save objects MUST be ordered by:

1. object classification;
2. aggregate type ordinal;
3. stable object identifier;
4. schema version; and
5. object hash.

Design artifacts MUST be ordered by compiled-design identifier and artifact hash.

RNG entries MUST be ordered by stream identifier.

Ledger segments MUST follow their native canonical sequence.

Migration entries MUST follow application order.

Database insertion order, archive entry order, filesystem enumeration order, UI order, localized names, and wall-clock time MUST NOT affect package hashes.

## 36. Required Reason Codes

The subsystem MUST define at least:

- `SAVE_BOUNDARY_NOT_STABLE`;
- `SAVE_MANIFEST_INCOMPLETE`;
- `AUTHORITATIVE_STATE_TYPE_UNREGISTERED`;
- `DERIVED_STATE_NOT_REBUILDABLE`;
- `CANONICAL_SERIALIZATION_FAILED`;
- `RNG_PERSISTENCE_CONTRACT_INCOMPLETE`;
- `RNG_MANIFEST_INCOMPLETE`;
- `RNG_STATE_CORRUPT`;
- `COMPILED_DESIGN_ARTIFACT_MISSING`;
- `COMPILED_DESIGN_ARTIFACT_HASH_CONFLICT`;
- `UNTRACKED_EXTERNAL_DESIGN_DEPENDENCY`;
- `SAVE_CONTENT_DEPENDENCY_MISSING`;
- `SAVE_RULESET_HASH_MISMATCH`;
- `SAVE_PACKAGE_HASH_MISMATCH`;
- `SAVE_ATOMIC_COMMIT_FAILED`;
- `SAVE_RECOVERY_SELECTED`;
- `LOAD_MIGRATION_UNSUPPORTED`;
- `RULESET_MIGRATION_UNSUPPORTED`;
- `DERIVED_PROJECTION_DEPENDENCY_CYCLE`;
- `LOAD_INVARIANT_VALIDATION_FAILED`;
- `CANONICAL_SAVE_CORRUPTION`;
- `TACTICAL_REPLAY_DIVERGED`;
- `STRATEGIC_REPLAY_DIVERGED`;
- `REPLAY_DEPENDENCY_MISSING`;
- `PORTABLE_SAVE_EXPORT_INCOMPLETE`; and
- `PERSISTENCE_STATE_INVARIANT_FAILED`.

## 37. Validation and Acceptance

Automated validation MUST prove that:

1. saves are created only at MonthOpeningSnapshot, MonthClosingSnapshot, or committed tactical-minute boundaries;
2. no save contains a partially applied phase, transaction, battle minute, or ledger append;
3. every save package is self-contained for authoritative continuation;
4. every manifest contains all declared versions, dependency hashes, snapshot hashes, RNG hash, design-artifact hash, ledger positions, and migration history;
5. every authoritative aggregate type is registered with schema, serializer, ordering, validator, and migration entry point;
6. each persisted type has exactly one persistence classification;
7. every derived projection has a deterministic rebuild contract or is persisted as authoritative;
8. all cached projections can be deleted and rebuilt without changing authoritative hashes;
9. canonical serialization produces identical bytes across supported platforms;
10. authoritative simulation numbers use integer or fixed-point canonical encoding;
11. every RNG domain declares KEYED_DERIVATION, STREAM_CURSOR, or EXPLICIT_STATE;
12. keyed streams persist exact algorithm, seed reference, key-contract version, decision ledger, and manifest hash;
13. cursor streams persist exact generator state, next cursor, draw count, and last decision;
14. no RNG stream relies on an ambiguous seed-only or cursor-only representation;
15. every compiled design referenced by active or historical authoritative state resolves to exactly one artifact hash;
16. compiled-design artifacts contain complete normalized mechanical values, dependencies, versions, bytes, and hashes;
17. compiled designs use only embedded, package-content-addressed, or verified-external-with-fallback storage;
18. save validation computes the complete transitive design-artifact closure;
19. deleting authoring design files does not prevent loading a valid portable save;
20. no authoritative dependency uses a mutable path, timestamp, editor session, working directory, or unverified object;
21. campaigns remain pinned to original ruleset, formulas, AI policy, RNG, content, scenario, and design hashes by default;
22. strategic autosave occurs after every completed month;
23. battle autosave uses exactly five-minute stable intervals in the shipped policy;
24. atomic save writes use temporary package, validation-mode reload, hash recomputation, atomic package commit, atomic pointer commit, and retained prior recovery save;
25. failure before pointer commit leaves previous valid saves unchanged;
26. the integrity index covers every package object and uses SHA-256 in the shipped format;
27. recovery selection uses validated manifests and pointers rather than modification time alone;
28. load executes all fifteen stages in the declared order and never exposes partial state;
29. loading never silently resets state, rerolls decisions, replaces designs, or substitutes current rules;
30. projection rebuild uses migrated authoritative state and pinned formulas only;
31. load invariants cover identities, ownership, resources, ledgers, assets, wars, locations, reservations, RNG, artifacts, content, and hashes;
32. every migration is explicit, deterministic, versioned, validated, and appended to immutable history;
33. ruleset changes require an explicit supported migration;
34. unrecoverable corruption is rejected with structured diagnostics and leaves the source file unchanged;
35. tactical replay uses initial battle snapshot, manifest, seed, command log, decision ledger, and pinned dependencies;
36. strategic replay uses compiled initial state, monthly commands, decisions, events, RNG, content, ruleset, and design artifacts;
37. replay stops at the first checkpoint or boundary hash divergence;
38. replay never depends on rendering frames or wall-clock timing;
39. portable export validates without authoring files or mutable caches; and
40. identical authoritative state, commands, decisions, dependencies, RNG state, and artifacts produce identical save bytes, load state, replay results, records, and hashes.
