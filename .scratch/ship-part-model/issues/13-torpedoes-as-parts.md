# 13: Torpedoes as parts and the compiled torpedo interface for combat (P4)

**Type:** implementation
**Status:** resolved (13a + 13b done)
**Blocked by:** 11
**Frontier:** no
**Requirements:** SPM-R17, SPM-R26 (P4 gate) · Stories 5, 12, 34, 35

## What to build

Torpedoes become catalogue parts: dimensions, warhead, speed settings, range at speed,
reliability, cost and mass. The 1884 Whitehead warhead re-rating becomes a dated revision
with its own provenance. Launchers hold torpedoes through a nested slot. Combat reads a
compiled torpedo record through a narrow typed interface (part id, revision, diameter,
warhead, mass, speed settings, range at speed, reliability, launch types), and the combat
torpedo performance constants are removed. Launch, hit, interception, reliability,
damage, flooding, salvo and AI-employment algorithms stay in code.

**Boundary:** this ticket runs in parallel with its sibling. It owns torpedo part data and the typed `CompiledTorpedo` boundary, and
it does not change ship-type records or classification rules (ticket 12), even if both are in flight at once.

## Acceptance criteria

- [x] (13b) No torpedo performance value remains in combat code. A test or grep gate proves it.
- [x] (13b) Combat goldens are byte-identical, and cross-process battle determinism passes.
- [x] (13a) A P4 equivalence report shows zero `changed`.
- [x] (13a) Resolving the Whitehead torpedo before and after its 1884 revision gives the
      revised warhead, and its provenance points at the revision.

## Resolution (13b, 2026-10-14)

Slice 13b is done; ticket 13 is resolved. See ADR-0157 §13b resolution.

- **Combat reads `CompiledTorpedo`.** A `CompiledTorpedoRegistry` is threaded on
  `TorpedoContext.torpedoes` (keyed by part id); `torpedoProjection` builds it from the design's
  compiled snapshot and every former `torpedoModelById` read is re-expressed on the neutral record.
  `packages/combat/src/torpedoes/model.ts` is deleted.
- **Gate.** `scripts/verify-no-torpedo-model-constants.mjs` (wired into `pnpm preflight`) fails on
  any retired symbol in `packages/combat/src` and on a `CompiledTorpedo` sample literal outside the
  two cross-process test harnesses.
- **Decisions.** Effective month = the model's effective (latest) revision (`9999-12`), reproducing
  the constants; `technologyPrerequisiteIds` is modelled; `ownerNationIds` / `productionRequirementId`
  / `depthKeepingProfile` are dropped (unread).
- **Fidelity.** The compiled snapshot rides the design version for both the parts read path and the
  legacy/player path; the campaign hash excludes it. Launcher-family membership is re-expressed as
  mount type + physical bore (documented, tested).
- **P4.** Equivalence byte-identical (`ebd0ddb6…`, zero `changed`, 91/91, 823/823); 11 golden hashes
  unchanged; cross-process determinism byte-identical.

### Follow-ups (non-blocking, from the adversarial review)

- **Phase-engine legacy-path fill not unit-pinned.** The authored/campaign path is covered
  end-to-end (`cross-process-test` `production-pack-loop` P-1 AC-7), and the parts read path is
  covered by `partCatalogue.test.ts`; the legacy `buildDesignVersion` fill branch
  (`designVersion.ts`, `pricing.torpedoOf`) has no direct test because phase-engine test content
  carries no `partModel` and the `as unknown` cast the shortcut needs is gate-forbidden. A fixture
  that loads the compiled part model would pin it.

## Resolution (13a, 2026-10-14)

Slice 13a is done; 13b is open. Committed together with this note. See ADR-0157.

- **Schema and content.** `TorpedoSpecFields` now carries the SPM-R17 fields (diameter, mass,
  warhead type + physical/equivalent mass, propulsion, ordered speed/range settings, arming
  distance, reliability per 100,000, guidance, launch types, hazard policy, optional oxygen
  wake modifier). `buildTorpedoPartModel` builds the whole buildable torpedo catalogue (the 8
  shipped `torpedo_models_v1` models) inside `buildPartCatalogue`, and the codemod emits
  `parts/torpedo.yaml`; the 1880 pack declares it and the lock is refreshed
  (`5a7ab05b…` → `4083aa93…`). `TORPEDO_SOURCE_FIELDS` documents one destination per model
  field; the builder fails `TORPEDO_READ_PATH_UNMAPPED_FIELD` for an unmapped one.
- **1884 revision.** Base warhead 12 kg (1877 pattern), dated revision `1884-01` → the model's
  27 kg with `VERIFIED` provenance (`docs/research/ship-building-early-band-2.md` §2).
  `resolvePartRevision`/`resolvePart` and the compiled record name the revision.
- **`CompiledTorpedo`.** A neutral contract in `@bluewave/armament`, produced by
  `compileTorpedo(part, month)` in `ship-design` from a strictly decoded part with typed
  failures. **Combat still reads the existing legacy per-model constants; nothing routes
  through `CompiledTorpedo` yet.**
- **Launchers and waivers.** Unchanged: 19 launcher records (2 bases + 17 variants), 5
  `DQ-TORPEDO-001` waivers, 9 affected entries. Declaring torpedo parts makes every waiver
  `forPart` resolve to a real torpedo part; no waiver widens.
- **Equivalence.** `pnpm check:equivalence` byte-identical (`ebd0ddb6…`), zero `changed`,
  91/91 designs, 823/823 placements. Campaign goldens unchanged (`check:golden`, 11/11).

### Deferred to 13b

Combat reading `CompiledTorpedo`; retiring the per-model constants and adding the grep/no-reader
gate; the P4 combat goldens and cross-process determinism proof; and the fate of the engine
fields with no content home (`ownerNationIds`, `technologyPrerequisiteIds`,
`productionRequirementId`, `depthKeepingProfile`).

Also a decision 13b must record (ADR-0157, `docs/DEFERRALS.md` D-8): the reference designs and
the battle-resolution child read the 14-inch at 1880, before the 1884 re-rating, so a
design-month compile yields the 12 kg first pattern, not the 27 kg constant. 13b must choose the
month the compiled torpedo is resolved at (the model's effective revision, or the design month
with a reviewed, re-pinned combat change) — the P4 golden must be re-derived, not assumed
identical. `technologyPrerequisiteIds` is read by combat's torpedo compatibility
(`torpedoes/compatibility.ts`), so 13b must model or drop it explicitly.

## Authorization (2026-10-14)

Owner authorized P3/P4. The spec's "Proposed" item that gates this ticket — the
`CompiledTorpedo` fields — is fixed by SPM-R17's enumerated field list and
recorded in ADR-0157 together with the torpedo-part spec fields.

## Slicing (2026-10-14)

| Slice | Delivers | Acceptance criteria |
| --- | --- | --- |
| **13a** Torpedo parts and `CompiledTorpedo` | `TorpedoSpecFields` completed to SPM-R17 (range at speed, launch types, warhead type/mass, mass, cost, reliability); `CompiledTorpedo` typed record; torpedo parts built from the catalogue and the codemod (`parts/torpedo.yaml`); launchers hold torpedoes through the nested `torpedo` slot; the 1884 Whitehead warhead re-rating as a dated revision with provenance; content lock refresh. Additive: combat still reads its constants until 13b. | AC 3–4 |
| **13b** Combat reads `CompiledTorpedo` | The narrow compiled-torpedo interface is the only torpedo data combat reads; per-model performance constants leave combat with a grep/no-reader gate; P4 equivalence report zero `changed`; combat goldens byte-identical and cross-process determinism pass. | AC 1–3 |
