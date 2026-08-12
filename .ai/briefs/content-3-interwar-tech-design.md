# Milestone CONTENT-3 — INTERWAR-Band Technology & Ship-Design Continuation (scen_1880)

## Objective

Scope and then author the next slice of the `scen_1880` production pack: the
**INTERWAR era band (Jan 1920 – Dec 1939)** research-technology tree and ship-
design templates, continuing the EARLY→PRE_WAR DAG (`content/production/1880/`),
with **zero engine change**. This sprint lands the scoping brief + research +
wayfinder; the YAML records authoring is the follow-up CONTENT-3 implementation
sprint this brief founders.

## Canonical requirements

- CONTENT-0 charter + CONTENT-1/2 briefs — locked `scen_1880`; all five era bands
  reachable; `type:"production"` pack; acyclic DAG conventions; integer design inputs.
- DESIGN-55 §11 (INTERWAR = Jan 1920–Dec 1939), §12 (classification), §13/§14
  (unreachable-locked isolation), §17 (full support), §20 (coverage).
- DESIGN-20 (Research), DESIGN-21 (Ship Design) — owning capabilities `ACCEPTED`.
- DESIGN-03 §6 (tech variation) — `TechnologyVariationProfile` stays valid.
- ENGINEERING-CONTRACT "Content", "Arithmetic" (SafeInt), "Determinism".

## Starting state

Verified (2026-08-12): CONTENT-1 (EARLY) + CONTENT-2 (PRE_WAR) production content
authored and deterministically compiled; Research/Design `ACCEPTED`; the
production-pack test passes; full suite green except the pre-existing unrelated
`content-schema/test/nation.test.ts` broken import (tracked separately). CONTENT-2
hash base: content `c3be5604…`, snapshot `cb1f1497…`.

## In scope

- Define the INTERWAR-band slice: 24 research techs (ticket 02) + 10 design
  templates (ticket 03), all `SUPPORTED_MECHANICAL`.
- Land this scoping brief, the wayfinder map
  (`.scratch/content-3-interwar-tech-design/`), and research notes
  (`docs/research/content-3-*.md`).

## Out of scope

- Authoring the YAML records themselves (follow-up implementation sprint).
- Any new mechanic (Track A/B/C/D/E).
- AVIATION / CARRIER_OPERATIONS / RADAR_AND_ELECTRONICS / MISSILES /
  AMPHIBIOUS_OPERATIONS INTERWAR content (M4/M5/$) — deferred, DESIGN-55 §14.
- Deployment (DESIGN-25), blockades (B10c) — deferred, mechanics-gated.
- `ScenarioSupportManifest`, era-coverage matrix, release validation (REL-1).

## Required implementation

- **Public contracts:** INTERWAR techs use `category: INTERWAR`,
  `researchFieldId` from the fifteen-field registry, `prerequisites` only within
  authored set (acyclic, no cross-era forward refs); designs use integer inputs
  accepted by `SafeInt`.
- **Classification:** every authored item `SUPPORTED_MECHANICAL`; no
  `CONTENT_ONLY_LOCKED` item authored (no reachable-locked content, §14).
- **Determinism:** content addition changes the production-pack content hash
  (intended authoritative cause); golden updated only with that cause.

## Acceptance tests

- Scoping deliverable: brief + wayfinder map + tickets 01–05 + research note(s).
- Implementation (follow-up): compile `content/production/1880` with new techs +
  designs, `success:true`, `diagnostics:[]`, no `TECHNOLOGY_PREREQUISITE_CYCLE`;
  identical `contentArtifactHash`/`snapshotHash` across repeated compiles; strict
  schema validation; `pnpm -w turbo run build test` green (minus the separately
  tracked pre-existing `nation.test.ts` suite).

## Determinism proof

- This scoping sprint authors no engine code or authoritative data — **no golden
  hash changes here**. The follow-up implementation records old/new content
  hashes with the intended cause and version impact.

## Compatibility and versions

- No format/formula/RNG/command/event/save/migration impact at scoping time.
  Follow-up adds content only (pack `0.2.0`→`0.3.0`, ruleset `1.0`), no engine
  change. Deferred families remain unauthored (no reachable-locked content).

## Performance observations

- None measured; scoping-only. Follow-up pack remains small; no wall-clock data
  authoritative.

## Stop conditions

In addition to permanent agent rules:

- If a tech's prerequisites force a cross-era forward reference or cycle, stop
  (authoring defect — do not bend the DAG).
- If authoring any deferred-family (AVIATION/CARRIER/RADAR/MISSILES/AMPHIBIOUS)
  content or any `CONTENT_ONLY_LOCKED` reachable item, stop and require §14 proof.
- If the compiler's `SafeInt` normalization required a schema/engine change, stop
  (engine-scope decision) — avoided by integer inputs.
- Never descend into deployment/blockade content; record as deferred, not dropped.

## Required delivery

- Scoping brief (this file), wayfinder map + tickets, research notes;
- traceability update (SPRINT-PLAN, PROGRESS);
- Conventional Commits; no self-merge.
