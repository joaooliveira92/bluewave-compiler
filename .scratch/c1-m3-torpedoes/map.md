# Wayfinder Map: M3 Torpedoes (C-1)

## Destination

Scope and implement the first coherent **vertical slice of DESIGN-40
(`docs/rules/torpedoes.md`)** as an engine-only, deterministic, minute-advancing
**torpedo fire-resolution** in `@bluewave/combat`: model → launcher → ammunition →
launch legality → launch → track → hit → detonation → torpedo damage package
(flotation / flooding-creation / machinery / system shock / tube-hit hazard /
chain reaction), emitting immutable torpedo records through the existing
`BattleLedger` + `canonicalEventOrder`. Integration into the phase pipeline /
campaign persistence is deferred (same boundary rule as B-3 gunnery's B-6
deferral). **No** campaign snapshot schema change; golden hashes must remain
unchanged (no ADR-0007 regeneration) unless an authoritative cause is documented.

This chart follows the B-2/B-3/B-4/B-5 pattern exactly: B-3 scoped only the core
**gunnery fire-resolution** subset of DESIGN-39; C-1 scopes only a **torpedo
fire-resolution** subset of DESIGN-40, deferring command plumbing, evasion,
progressive-flooding resolution, and campaign persistence to later slices/tracks.

## Notes

- Domain: `@bluewave/combat` (pure, platform-independent, deterministic). Builds
  on B-1 (battle generation / tactical units) + B-2 (minute-advance engine,
  `BattleLedger`, `canonicalEventOrder`, reason-code catalog, `validateTargetOrder`
  fog-of-war) + B-3 (gunnery: stage pattern, contracts, two-process child) +
  B-4 (damage pipeline: flotation, flooding creation, component outcomes, turret
  states, magazine-hazard template, terminal seam) + B-5 (weather stage) + B-6
  (`resolveBattleAuto`; torpedo phase wiring deferred beyond C-1). `BattleResolver`/
  `StrengthCalculator` remain unmodified.
- Seam map (explore agent, 2026-08-16): torpedo stage slots in the minute-advance
  engine at a new substep (after damage), strict no-op when no `torpedo` context —
  preserving B-2…B-6 hashes. Damage reuse verdicts in `issues/05-damage-seams.md`.
- Skills: `/grilling` + `/domain-modeling` for scope; `/research` for torpedo
  grounding (`docs/research/c1-m3-torpedoes.md` — landed); `/to-tickets` for slicing.
- This is the **active M3-frontier track** — the plan's "Immediate next action".
  Do not let the desktop UI-* side tracks compete.
- ADR required: the C-1 scope/integration boundary + reason-code/constant policy
  (mirrors ADR-0018/0020), and any genuinely new reason codes / torpedo constants
  decisions (versioned-ruleset ADR rule).
- DESIGN-40 is ~628 lines with 30 §30 validation items spanning model, launcher,
  ammunition, compatibility, command authority, eligibility, speed limits, fire
  solution, salvo, launch, track, hit/detonation, damage package, flooding,
  machinery, shock, tube hazard, chain reaction, oxygen, friendly-fire safety,
  records, ordering, reason codes. Too large for one sprint; the scope boundary
  ticket carves the first bounded slice and records what is deferred (never
  silently dropped).

## Decisions so far

- [Scope Boundary](issues/01-scope-boundary.md) — **resolved.** This sprint ships
  the **torpedo fire-resolution** slice: `TorpedoModelDefinition` (§1),
  `TorpedoLauncherState` (§2), ammunition/inventory (§3 local-reload mechanics),
  platform compatibility (§4), launch-eligibility predicates (§6), underwater-tube
  speed limit (§7), above-water launcher limits (§8), fire-solution quality (§10),
  salvo (§11), launch timing/failure (§12), `TorpedoTrack` (§13), hit resolution
  (§14), detonation outcomes (§15), `TorpedoDamagePackage` (§16) incl. flotation
  (§17), flooding **creation** (§18, resolution → C-5), machinery (§19), system
  shock (§20), underwater-tube hit hazard (§21), chain reaction (§22), oxygen
  torpedoes (§23), friendly-fire safety (§24), records/ordering (§27–28), reason
  codes (§29), and the §30 validation items that pertain to this slice.
  **Deferred (recorded, follow-up INCs/tickets):** §5 player command plumbing
  (ManualTorpedoLaunchCommand / DivisionTorpedoAttackOrder / tactical AI) — the
  `torpedo_launch_authority_v1` policy contract + legality guard ships here, the
  command layer does not; §3 production/inventory delivery + §4 refit under
  DESIGN-23; §18 per-minute progressive-flooding **resolution** (C-5, the reserved
  Stage 7); §25 target evasion (ship-maneuver track); §26 damage persistence to
  campaign (later battle-results slice); submarine-launch specifics (§7 note, C-3);
  aerial torpedoes (D-track).
- [Integration Boundary](issues/02-phase-integration-boundary.md) — **resolved.**
  Torpedoes run as a pure **engine-stage** (`resolveTorpedoes`) inside the
  minute-advance simulation, after damage, emitting torpedo records via the
  existing `BattleLedger`+`canonicalEventOrder`; strict no-op when no torpedo
  context (B-2…B-6 hashes unchanged). No phase-engine change, no snapshot change.
- [Launch Legality](issues/03-launch-legality.md) — **resolved.** §6 predicates +
  §7/§8 speed limits + `torpedo_launch_authority_v1` policy guard ship as pure
  functions; a launch consumes no torpedo on failure and returns one explicit
  reason code; the §7 threshold is the exact integer `12_861_100` µm/s.
- [Fire Solution & Salvo](issues/04-fire-solution-salvo.md) — **resolved.** §10
  11-factor basis-point product, integer arithmetic, one `FLOOR`, `clamp(0,10_000)`;
  missing factor → `TORPEDO_FIRE_SOLUTION_INSUFFICIENT`/factor-missing failure.
  §11 exact tube ids, ≤ physical tubes, atomic ammunition reserve.
- [Damage Seams](issues/05-damage-seams.md) — **resolved.** Torpedo damage
  **reuses** B-4 `resolveStructureFlotation`, `applyTurretDamage`, `ComponentOutcome`
  vocabulary, `evaluateMagazineHazard` evaluator shape, `evaluateTerminalSeam`,
  and the deepFreeze+envelope record pattern; **new** torpedo logic for the §17
  flotation formula, §18 flooding-source creation (torpedo rates), §19 weighted
  machinery selection, §20 shock-probability + keyed stable-order selection,
  §21/§22 tube-hit hazard + chain reaction, §23 oxygen effects.
- [Reason Codes & Contracts](issues/06-reason-codes-contracts.md) — **resolved.**
  New `torpedoes/reasonCodes.ts` shipping the §29 in-slice codes with a
  `reason-codes-torpedoes.test.ts` set-equality partition (in-slice / deferred /
  reused catalog); versioned contracts `torpedo_v1` + `torpedo_launch_authority_v1`
  + `underwater_tube_hit_hazard_v1` with `SHIPPED_*_CONTRACT` + validate guards;
  research-grounded `torpedo_models_v1` constant set from
  `docs/research/c1-m3-torpedoes.md`.

## Not yet specified (later INC slices / follow-up tickets)

- **In-slice (this sprint)**: §18 progressive-flooding **creation** only
  (per-minute resolution → C-5); §5 authority policy ships, command plumbing does
  not; production/inventory-delivery gating (§3) and DESIGN-23 refits (§4) deferred.
  These are **recorded, not dropped** — the spec's "Out of scope" section lists
  every DESIGN-40 item not in this slice plus the owning track.

## Out of scope for C-1

- Phase-engine/campaign persistence (later battle-results slice; `resolveBattleAuto`
  torpedo wiring), player manual-launch commands + tactical AI launch authority
  (§5), target evasion (§25), progressive-flooding resolution + damage control
  (C-5, DESIGN-41 remainder), submarine launch mechanics (C-3), mine/coastal-defense
  (C-2/C-4), aerial torpedoes (D-track), smoke (C-5), production-pack YAML changes
  (content tracked separately).