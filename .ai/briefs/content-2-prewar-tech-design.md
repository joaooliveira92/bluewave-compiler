# Milestone CONTENT-2 — PRE_WAR-Band Technology & Ship-Design Continuation (scen_1880)

## Objective

Scope and then author the next slice of the `scen_1880` production pack:
the **PRE_WAR era band (Jan 1900 – Dec 1919)** research-technology tree and
ship-design templates, continuing the EARLY DAG written in CONTENT-1
(`content/production/1880/`), with **zero engine change**. This sprint lands the
scoping brief + research + wayfinder; the _implementation_ of the YAML records
(techs + designs + pack manifest update) is the follow-up CONTENT-2
implementation sprint this brief founders.

## Canonical requirements

- `.ai/briefs/content-0-production-pack-charter.md` — locked scenario `scen_1880`;
  all five era bands reachable; `type:"production"` pack at `content/production/1880/`.
- `.ai/briefs/content-1-m1-production-content.md` — EARLY tech/design conventions:
  acyclic DAG, integer `speedUms`/`displacementKg`/`armorBeltUm`, `category` = era
  band, `prerequisites:[{techId}]`, `year` 1880–1970, `discoveryWeight` 1..1e6.
- DESIGN-55 §11 (era bands: PRE_WAR = Jan 1900–Dec 1919), §12 (classification),
  §13/§14 (unreachable-locked isolation), §17 (full support), §20 (coverage).
- DESIGN-20 (Research), DESIGN-21 (Ship Design) — owning capabilities `ACCEPTED` (A-0b).
- DESIGN-03 §6 (tech variation) — `TechnologyVariationProfile` must stay valid.
- ENGINEERING-CONTRACT "Content", "Arithmetic" (SafeInt), "Determinism".

## Starting state

Verified (2026-08-11): 32 turbo tasks green; golden determinism hashes stable;
CONTENT-1 production pack authored + deterministically compiled at
`content/production/1880/`; Research (B10b) and Ship Design (B10b) `ACCEPTED`
(A-0b PASS); the fifteen canonical research fields live in
`packages/content-schema/src/research-fields.ts`; `DesignTemplateSchema` in
`packages/content-schema/src/design.ts`. A-3 (B10c) remains blocked on its
decision request (unrelated; blockade content deferred here).

## In scope

- Define the PRE_WAR-band slice: technology items (ticket 02) and design
  templates (ticket 03), all `SUPPORTED_MECHANICAL` (own capabilities accepted,
  prerequisites in authored set, acyclic).
- Land this scoping brief, the wayfinder map
  (`.scratch/content-2-prewar-tech-design/`), and research notes
  (`docs/research/content-2-*.md`).
- Declare the acceptance/classification gates the implementation must meet.

## Out of scope

- Authoring the YAML records themselves (follow-up implementation sprint).
- Any new mechanic (Track A/B/C/D/E).
- **Deployment** (DESIGN-25) and **blockades** (B10c) content — deferred,
  mechanics-gated (see ticket 01).
- **AVIATION / CARRIER_OPERATIONS** PRE_WAR techs — deferred to M4/D-track (their
  unit mechanic is not accepted; authoring a reachable AVIATION tech would
  violate §14).
- `ScenarioSupportManifest`, era-coverage matrix, release-validation report
  (REL-1).

## Required implementation

- **Public contracts locked:** PRE_WAR techs use `category: PRE_WAR`,
  `researchFieldId` from the fifteen-field registry, `prerequisites` referencing
  only the authored EARLY∪PRE_WAR set (acyclic, no cross-era forward refs);
  designs use integer inputs accepted by the campaign compiler's `SafeInt`.
- **Classification:** every authored item `SUPPORTED_MECHANICAL` (owning
  capability Research/Design accepted); no `CONTENT_ONLY_LOCKED` item authored in
  this slice so no reachable-locked content (§14).
- **Determinism:** authoring PRE_WAR content changes the production-pack content
  hash (new content = intended authoritative cause); the change is versioned and
  the golden updated only with that cause, never to paper over a failure.

## Acceptance tests

- Scoping deliverable: `.ai/briefs/content-2-prewar-tech-design.md` exists and
  cites DESIGN-55 §11/§12/§14 and the accepted Research/Design capabilities;
  wayfinder map + tickets 01–05; research note(s) under `docs/research/` citing
  high-trust sources per item.
- Implementation (follow-up) must: compile `content/production/1880` with the new
  PRE_WAR techs + designs, `success:true`, `diagnostics:[]`, no
  `TECHNOLOGY_PREREQUISITE_CYCLE`; identical `contentArtifactHash`/`snapshotHash`
  across repeated compiles; strict schema validation (unknown-field, duplicate-id,
  missing-reference, tech-cycle); `pnpm -w turbo run build test` green including
  the production-pack test.

## Determinism proof

- This scoping sprint authors no engine code or authoritative data, so **no
  golden hash changes here** (matching CONTENT-0). The follow-up implementation
  adds PRE_WAR records and will record old/new content hashes with the intended
  authoritative cause and version impact.

## Compatibility and versions

- No format, formula, RNG, command, event, save, or migration impact at scoping
  time. The follow-up implementation adds content only (pins content `0.1.0` →
  `0.2.0`, ruleset `1.0`), no engine change. AVIATION/CARRIER/deployment/blockade
  remain deferred (no reachable-locked content).

## Performance observations

- None measured; scoping-only. Follow-up pack remains small (tens of YAML
  records); no wall-clock data authoritative.

## Stop conditions

In addition to permanent agent rules:

- If a PRE_WAR tech's prerequisites force a cross-era forward reference or a
  cycle, stop (that is an authoring defect, not a reason to bend the DAG).
- If authoring PRE_WAR AVIATION/CARRIER content or anything `CONTENT_ONLY_LOCKED`
  that could become reachable without an accepted owning capability, stop and
  require the §14 reachability proof.
- If the campaign compiler's `SafeInt` normalization of design fields required a
  schema/engine change, stop (engine-scope decision) — avoided by integer inputs.
- Never descend into deployment/blockade content while DESIGN-25 is unassigned and
  B10c is blocked; log them as deferred, not silently dropped.

## Required delivery

- Scoping brief (this file), wayfinder map + tickets, research notes;
- traceability update (SPRINT-PLAN, PROGRESS);
- Conventional Commits; no self-merge.
