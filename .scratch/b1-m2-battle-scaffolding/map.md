# Wayfinder Map — B-1 (M2 Battle Generation & Tactical Setup Scaffolding)

Effort slug: `b1-m2-battle-scaffolding`.

## Notes

B-1 is the first M2 sprint: battle generation + tactical-setup scaffolding. It was
scoped through the orchestrator pipeline (spec-creator → research → reviewer).
The normative implementation plan is `.ai/specs/b1-battle-scaffolding.md`; this map
records the decisions and the dependency-ordered increment tickets.

Pipeline record:

- **spec-creator** → `.ai/specs/b1-battle-scaffolding.md` (14 AC → REQ → tests;
  6 increments; 7 proposed ADRs; definition of done).
- **research** → `docs/research/b1-battle-scaffolding.md` (canonical ship fields
  carry into battle; DESIGN-26 records are normative not research; one genuine gap:
  no typed shipType → resolved by ADR B-1-2).
- **reviewer** → APPROVE with 3 follow-ups (ADR B-1-7, AC-12 no-op-hash pin,
  spec/research supersession) — all applied.

## Decisions so far

- **B-1-1** Package boundary: permanent divisions in `@bluewave/campaign`;
  generation + tactical setup in `@bluewave/combat`.
- **B-1-2** `CanonicalShipType` derived deterministically from DESIGN-22 predicates
  over `CompiledDesignVersion` (versioned `ship_type_classifier_v1`); not authored.
- **B-1-3** Reachable mission subset: only `FLEET_BATTLE` + `CRUISER_BATTLE`
  generate; other 7 registered but proven-unreachable empty records.
- **B-1-4** Headless decision policy: AUTO_RESOLVE default; pending-hold for a
  player battle with no policy (never silently declined/auto-resolved).
- **B-1-5** `computeManifestHash` over the canonicalized pre-seed manifest; seed
  stored in a seed-envelope field excluded from manifest hash.
- **B-1-6** Auto-resolution proof = the resolver's declared surface only.
- **B-1-7** Reachable opportunity predicate (`opportunity_reachability_v1`):
  FLEET/CRUISER opportunity from opposing active-war surface presence co-located
  post-movement; no mission/contact record in B-1 (movement/spotting = B-2).
  Added per reviewer; MUST precede INC-3.
- Golden regen at INC-2 (divisions schema) and INC-6 (phase + manifests) per
  ADR-0007 with documented old/new + cause.

## Fog

- Actual design-growth complexities inside DESIGN-37 (e.g., exact §15 weight
  formula integerization) will surface during INC-3/INC-4 implementation; keep
  under the B-1 ADRs and escalate only on genuine contradiction.
- `speedUms` legacy scale may mis-fire the §15 DD-scout threshold for player-created
  divisions (pack divisions empty in B-1) — validation note for the implementator.

## Backlog

Increment tickets 01–06 (dependency order) live in `issues/`. They are the
implementation plan; each resolves to the corresponding spec increment.
