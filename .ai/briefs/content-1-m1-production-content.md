# Milestone CONTENT-1 — M1-Era Production Content Pack (scen_1880)

## Objective

Author the first **production** content pack at `content/production/1880/`
(`type: "production"`) covering the M1/EARLY era slice for the `scen_1880`
anchor scenario (start January 1880), and prove it compiles deterministically
through the existing compiler with zero engine change. The pack is grounded in
real, research-backed data (nations, world geography, 1880 ironclad fleets,
EARLY-era tech tree, ship-design templates) and is separately validated from
the non-production fixtures.

## Canonical requirements

- `.ai/briefs/content-0-production-pack-charter.md` — locked scenario
  (`scen_1880`), six decisions, anchor rule.
- `docs/research/content-0-content-map.md` — required collections + DESIGN-55
  §12 classification policy.
- DESIGN-55 §11 (era bands), §12 (content classification), §14 (unsupported
  isolation), §17 (full-support); content only `SUPPORTED_MECHANICAL` where an
  owning capability is `ACCEPTED`.
- ENGINEERING-CONTRACT "Content" + "Persistence/compatibility" + "Determinism".
- M1 accepted capabilities: economy (B10a), research/design (B10b). Diplomacy
  (B10c) is blocked on a decision request → no reachable diplomacy content.

## Starting state

Verified (2026-08-11): 32 turbo tasks green; A-3 (B10c) still blocked on its
decision request; CONTENT-0 charter done. Compiler consumes a pack dir
(`pack.json` + enumerated YAML array files); campaign collections (fleets/
economies/constructions/research/designs) are wired by the desktop path
(`runCompilation`).

## In scope

- Author 14 countries, ~100 areas, 35+ routes, ~70 possessions, ~95 ports,
  34 EARLY technologies, 16 ship designs, 22 fleets, 14 economies, 9
  constructions, and 14 research states.
- Everything declared `SUPPORTED_MECHANICAL` (no reachable locked content):
  diplomacy intentionally omitted (B10c pending).
- A focused test locking deterministic compile + golden hashes.

## Out of scope

- Later era bands (PRE_WAR..LATE) — CONTENT-1 covers the M1/EARLY slice.
- New mechanics (Track A/B/C/D/E).
- Diplomacy relations (B10c blocked).
- `ScenarioSupportManifest` / era-coverage matrix / release report (REL-1).

## Required implementation

- Pack layout per CONTENT-0: `content/production/1880/`, `pack.json`
  `type: "production"`, all files enumerated in `files`.
- Country ids are uppercase ISO tags matching the compiler's playable-slot
  logic (`GBR` playable).
- Design templates authored with **integer** `speedUms`/`displacementKg`/
  `armorBeltUm` because the campaign compiler normalizes these through
  `SafeInt` (schema allows float but the compiler rejects it — recorded, no
  engine change per content-sprint scope).
- Technologies form an acyclic DAG with defined prerequisites (no
  `TECHNOLOGY_PREREQUISITE_CYCLE`).

## Acceptance tests

- `runCompilation(content/production/1880)` returns `success: true`,
  `diagnostics: []`, 14 nations (incl. GBR, FRA, CHI), and stable
  `snapshotHash`/`contentArtifactHash` across repeated compiles.
- Pack validates under the strict content schemas (unknown-field rejection,
  duplicate-id, missing-reference, tech-cycle checks).
- `pnpm -w turbo run build test` green (32 tasks) including the new
  production-pack test (format-clean).

## Determinism proof

- Pack compiles twice → identical hashes:
  - content hash `449532384b604c69dd9740bd92b3357e05f62a98fbdde9bcea36a0e409275f0f`
  - snapshot hash `f3e72642371e5a112f5ed8ec99778e763386ccd1024352d4228f6055c375d3f3`
- No engine or authoritative-rule data changed; golden M1 fixture hashes unchanged.

## Compatibility and versions

- No format, formula, RNG, command, event, save, or migration impact. New
  content pack only; pins content `0.1.0` and ruleset `1.0`.

## Performance observations

- None measured; pack is small (a few hundred YAML records). No wall-clock
  data is authoritative.

## Stop conditions

In addition to permanent agent rules:

- If any `CONTENT_ONLY_LOCKED` feature could become reachable without an
  accepted owning capability, stop and require the §14 reachability proof.
- If the campaign compiler's `SafeInt` normalization of design fields
  required a schema/engine change, stop (that is an engine-scope decision) —
  here avoided by authoring integer values.

## Required delivery

- Content pack YAML + `pack.json`;
- wayfinder map + issues (`.scratch/content-1-m1-production-content/`);
- research notes (`docs/research/content-1-*.md`);
- brief (this file), traceability (SPRINT-PLAN, PROGRESS), validation report;
- Conventional Commits; no self-merge.
