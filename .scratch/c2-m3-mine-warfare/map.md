# Wayfinder Map: M3 Mine Warfare (C-2)

## Destination

Scope the first coherent **vertical slice of DESIGN-35 (`docs/rules/mine-warfare.md`)**
as an engine-only, deterministic **mine-pressure lifecycle** in `@bluewave/combat`
(mirroring where `@bluewave/combat/weather/strategic-state.ts` lives): lay → reinforce
→ sweep (eligibility, values, dual-purpose equipment, regional aggregation, allocation)
→ decay → report/misidentify → persist across war/ownership changes → track knowledge
→ clear. Mine-**strike resolution** (tactical battle hazard generation, strategic
route-transit strikes, friendly fire) is explicitly deferred — see ticket 03. No
campaign-snapshot schema change, no phase-engine wiring this sprint (mirrors the
B-5-before-B-6 boundary: B-5 shipped the pure strategic-weather engine with a
registered-but-deferred phase; B-6 wired it authoritatively later). Golden hashes
must remain unchanged.

## Notes

- Domain: `@bluewave/combat` (pure, platform-independent, deterministic). Precedent
  for a *strategic/monthly* mechanic living in `@bluewave/combat` rather than
  `@bluewave/campaign-engine`: `packages/combat/src/weather/strategic-state.ts`
  (`generateStrategicWeather`, ADR-0022) + the later `weather_generation` phase
  wiring (ADR-0025, B-6). Mine pressure follows the same placement.
- DESIGN-35 is 611 lines / 31 sections — comparable size to DESIGN-40 (torpedoes,
  628 lines / 30 sections). DESIGN-40 was "too large for one sprint" per its own
  scoping ticket; DESIGN-35 requires the same scope-carving discipline.
- **Key finding driving the scope boundary (ticket 03):** DESIGN-35 §14–15 mine-strike
  eligibility/outcome applies in TWO contexts — (a) tactical battles (§11 battle-mine
  generation, §17 `BattleMineHazard`, needs a `@bluewave/combat` minute-advance engine
  stage mirroring `resolveTorpedoes`, not yet built) and (b) strategic ROUTE transit
  (§13 route risk). Route-transit strike application requires an accepted "ship in
  transit consumes risk" mechanic — that mechanic is `deployment-and-logistics.md`
  (DESIGN-25), which `docs/acceptance/m1-capability-registry.md` records as
  `CONTENT_ONLY`/deferred (ADR-0011) and `.ai/SPRINT-PLAN.md`'s cross-cutting list
  still shows as **unassigned**. Neither consuming mechanic exists yet. Building
  strike resolution now would mean building it against nothing, or building it twice.
  So this sprint ships the **pressure lifecycle** (the half with no missing
  dependency) and defers all **strike resolution** (the half blocked on either the
  tactical engine stage or DESIGN-25) to a **C-2 continuation** ticket, tracked
  explicitly rather than silently dropped.
- DESIGN-55 §4 confirms M3 = torpedoes, mines, submarines, coastal defenses, smoke,
  detailed damage control (`docs/delivery/release-scope-and-implementation-order.md`
  — this is where DESIGN-55 actually lives; it has no dedicated `docs/architecture/`
  file, contrary to the task brief's guess).
- Skills: `/domain-modeling` for the AreaMinePressureRecord/MineTypeDefinition shape;
  research skill spirit applied but **not invoked as a background agent** — see
  `docs/research/c2-m3-mine-warfare.md` (explains why full research wasn't required
  for this slice: DESIGN-35's constants are already exact shipped integers, unlike
  DESIGN-40 which required grounding an open torpedo-model catalog).
- This is the **current M3 frontier** once C-1-IMPL completes; C-2 scoping can run in
  parallel with C-1-IMPL since it touches no `packages/combat/src/torpedoes/` or
  `packages/combat/test/torpedo/` files (verified: new module lives at
  `packages/combat/src/mines/`, disjoint from torpedo paths).
- ADR required at implementation time: the C-2 scope/integration boundary + the
  strike-resolution deferral rationale + reason-code/constant policy (mirrors
  ADR-0018/0020/0029 for prior Track B/C scoping sprints).

## Decisions so far

- [Scope Boundary](issues/01-scope-boundary.md) — **resolved.** Ships the
  **mine-pressure lifecycle**: `AreaMinePressureRecord` (§1), `MineTypeDefinition`
  (§2), mine sources (§3), laying value (§4), pressure increase/reinforcement (§5),
  minesweeping eligibility (§6), sweeping base values (§7), dual ASW/mine equipment
  (§8), effective sweeping value (§9), regional sweeping aggregation + allocation
  (§10), defensive standoff **value computation only** (§16), mine decay (§21),
  mine report (§19), mine/torpedo misidentification classifier (§20), post-war
  persistence (§22), ownership/control-change dispositions (§23), mine knowledge
  (§24), mine-clearance completion (§27), records/audit (§28), canonical ordering
  (§29), reason codes (§30, in-slice subset), and the §31 validation items that
  pertain to this slice. Strategic route risk (§13) ships as a **pure value
  computation** (formula only, no consuming movement-blocking mechanic — see ticket
  03). **Deferred:** §11 battle-mine hazard generation, §14–15 mine-strike
  eligibility/outcome (both battle and route-transit application), §17 battle
  hazards, §18 damage/loss application, §25–26 friendly-fire risk/outcome — all to
  the **C-2 continuation** (ticket 03).
- [Phase / Engine Integration Boundary](issues/02-phase-integration-boundary.md) —
  **resolved.** Mine-pressure lifecycle ships as a pure function set in
  `@bluewave/combat` (`packages/combat/src/mines/`), **not** wired into
  `phase-engine` or `CampaignSnapshot` this sprint — mirrors the B-5 (pure engine)
  → B-6 (authoritative snapshot wiring) sequencing. No snapshot schema change; no
  new phase registered even as a no-op stub (stricter than B-5, matches the C-1
  precedent of registering nothing until wiring is actually implemented). Goldens
  unchanged.
- [Strike-Resolution Deferral](issues/03-strike-resolution-deferral.md) —
  **resolved.** Mine-strike resolution (§11, §14–15, §17–18, §25–26) is deferred in
  full to a **C-2 continuation** sprint because it has two candidate consuming
  mechanics and neither is ready: (a) tactical battle mine hazard, which needs a new
  `@bluewave/combat` minute-advance engine stage (not yet built, analogous to but
  independent of `resolveTorpedoes`), and (b) strategic route-transit strikes, which
  need DESIGN-25 deployment/logistics (unassigned, `CONTENT_ONLY`/deferred per
  ADR-0011). Building strike resolution against neither would mean inventing the
  missing mechanic's shape as a side effect — expressly prohibited scope creep.
- [Sweeping & Dual-Equipment Formula Policy](issues/04-sweeping-dual-equipment.md) —
  **resolved.** All §6–10 formulas/thresholds are exact DESIGN-35 shipped integers
  (no BALANCE TARGET, no research needed); dual-equipment missing-mode default
  applies **only** when equipment is declared dual-purpose (fail-closed
  `DUAL_EQUIPMENT_MODE_MISSING` otherwise, per §8 literal text).
- [Reason Codes & Contracts](issues/05-reason-codes-contracts.md) — **resolved.**
  New `packages/combat/src/mines/reasonCodes.ts` shipping the DESIGN-35 §30 in-slice
  codes with a set-equality partition test; `mine_pressure_v1` +
  `mine_sweeping_v1` + `dual_asw_mine_equipment_v1` + `mine_defensive_standoff_v1` +
  `underwater_explosion_identification_v1` + `mine_decay_v1` versioned contracts.
- [Content/Constant Policy & Research Scope](issues/06-content-constant-policy.md) —
  **resolved.** No background research agent invoked; DESIGN-35's mechanical
  constants are already exact shipped integers (unlike DESIGN-40's open
  torpedo-model catalog). `docs/research/c2-m3-mine-warfare.md` records this finding
  plus light historical framing for the six canonical mine types, explicitly
  flagged as non-normative context, not a grounding requirement.

## Not yet specified (later slices / follow-up tickets)

- **C-2 continuation** (ticket 03): §11 battle-mine hazard generation + §17
  `BattleMineHazard` + tactical battle mine-strike resolution — a new
  `@bluewave/combat` minute-advance engine stage, sequenced after this sprint's
  pressure model exists as an authoritative input type. §13–15 route-transit strike
  application — blocked on DESIGN-25 acceptance. §25–26 friendly-fire risk/outcome —
  shares the same strike machinery, deferred alongside.
- **Phase-engine/snapshot wiring** — `mine_warfare_generation` phase +
  `AreaMinePressureRecord[]` on `CampaignSnapshot`, deferred to whenever the C-2
  continuation lands (mirrors B-6's weather wiring).
- **Submarine-laid mine laying mechanics** — align with C-3 (submarines); this
  sprint ships `SUBMARINE_LAID` as a data type only.
- **Scenario-special mine type** — data shape ships; specific scenario content is a
  content-track concern.
- **Command-layer mine-laying orders / mission plumbing** — later command/AI slice;
  this sprint ships eligibility/value formulas as pure functions.

## Out of scope for C-2

- Tactical battle-mine hazard generation and battle mine-strike resolution (§11,
  §17–18) — C-2 continuation.
- Strategic route-transit mine-strike application (§13 value ships, application
  doesn't) — blocked on DESIGN-25.
- Friendly-fire risk/outcome (§25–26) — shares strike machinery, deferred alongside.
- Phase-engine/campaign-snapshot wiring — deferred (mirrors B-5→B-6 sequencing).
- Submarine-laid mine operational mechanics (C-3), scenario-special mine content
  (content track), command-layer mine-laying orders (later command slice),
  amphibious/blockade consumption of defensive standoff (DESIGN-36 unassigned,
  DESIGN-32 basic-only), production-pack YAML changes (content tracked separately).
