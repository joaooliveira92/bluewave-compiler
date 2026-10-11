# ADR-0112: Wire the smoke and air battle stages; defer mine, submarine and coastal warfare

## Status

Accepted (2026-10-11).

Supersedes: ADR-0097

## Context

ADR-0097 deferred five built-but-unreachable combat modules for the first release:
the in-battle **smoke** (C-5), **air combat** (D-3) and **air defense** (D-4)
tactical stages (present in `advanceMinute` but never supplied a context by
`resolveBattleAuto`), and **mine warfare** (C-2), **submarines** (C-3) and
**coastal defense** (C-4) (not referenced by `phase-engine` at all).

The ticket `.scratch/playable-loop/issues/03-wire-m3-m4-battle-modules.md`
requires each unreachable module to be either wired at its correct boundary or
explicitly deferred with a reason — silence is the only wrong answer.

## Decision

1. **Smoke, air combat and air defense are wired.** `resolveBattleAuto` now
   projects a `SmokeContext`, `AirCombatContext` and `AirDefenseContext` from
   optional, authoritative capability declarations carried by the immutable
   `BattleManifest` (`smokeSources`, `airGroups`, `airDefenseInstallations`) and
   always supplies them to `advanceMinute`. The stages run in the production
   auto-resolution path; a battle that declares no capability projects an empty
   context, which is a strict byte-identical no-op — never a fabricated
   capability. This is distinct from the previous state, where the stages could
   not run at all.
2. **No golden re-pin.** Because capability is declared, not inferred (no
   automatic funnel smoke, no phantom air groups), every existing manifest keeps
   its exact bytes and every existing battle fixture keeps its exact hashes. The
   ADR-0097 objection ("wiring smoke re-pins battle goldens") no longer applies:
   wiring a *reachable* stage and *seeding* a capability are separate decisions.
3. **Mine warfare, submarines and coastal defense remain deferred**, at a
   clearly named boundary (see below). They are not forced into `resolveBattleAuto`
   because their design is strategic/pre-battle, not per-minute tactical.
4. **Nothing is silently dropped.** The reachability table
   (`docs/architecture/module-reachability.md`) and this ADR are the record.

### Deferral: mine warfare (C-2)

- **Architectural reason.** Mine warfare resolves as a monthly,
  area-level pressure/clearance ledger (`AreaMinePressureRecord`, laying value,
  sweeping allocation, decay, post-war persistence) — a strategic phase, not a
  per-minute tactical stage. Forcing it into `resolveBattleAuto` would put
  monthly economics inside a minute loop.
- **Intended invocation boundary.** A new `mine_warfare` strategic month phase
  (order: after `resolve_diplomacy`, before `battle_generation`) in
  `packages/phase-engine`, consuming area mine pressure and producing the
  monthly resolution record. Mine hazards *inside* a generated battle would be a
  later `battle_generation` enrichment (`MINE_BATTLE_GENERATION_POLICY_ID`).
- **Minimum future integration point.** Register the phase in
  `packages/phase-engine/src/registry.ts`, add it to the month pipeline
  (`packages/phase-engine/src/month.ts`), and persist its state on the campaign
  snapshot.

### Deferral: submarines (C-3)

- **Architectural reason.** Submarines resolve strategic mission effectiveness,
  screening balance, sea-state detection and coastal restriction over a
  month/area, and their policy changes are gated on a future trade-warfare
  resolution that does not exist yet (ADR-0088 marks `COMMERCE_RAIDING` /
  `MINELAYING` unmodelled). This is strategic, not tactical.
- **Intended invocation boundary.** A `submarine_operations` strategic month
  phase consuming committed submarine assets and producing the
  `SubmarineOperationsRecord`; submarine attack opportunities could later feed
  `battle_generation`.
- **Minimum future integration point.** Same phase-registry seam as mines;
  requires a campaign submarine state model (none exists — `nation` carries no
  typed submarine assets yet).

### Deferral: coastal defense (C-4)

- **Architectural reason.** Coastal batteries defend fixed land positions under
  placement, land-target damage and area mine pressure — a strategic/positional
  concern. There is no un-DESIGN'd tactical seam for it, and the 1880 first
  release has no coastal-battery combat content.
- **Intended invocation boundary.** A `coastal_defense` strategic month phase
  (area-level battery placement + land-target damage), optionally feeding
  coastal-defense elements into `battle_generation`.
- **Minimum future integration point.** Same phase-registry seam; requires
  authored coastal-battery content.

## Alternatives considered

- **Force all six modules into `resolveBattleAuto`.** Rejected: mine/submarine/
  coastal are strategic; an area mine ledger has no per-minute meaning.
- **Auto-seed funnel smoke from steamships.** Rejected: the manifest does not
  declare smoke capability, so inferring it would fabricate a capability and
  re-pin every battle golden. Capability must be declared.
- **Keep deferring smoke/air.** Rejected by the ticket: contexts, unlike phases,
  are a bounded wiring change and are now proven reachable and deterministic.

## Consequences

- The production auto-resolution path invokes the smoke, air-combat and
  air-defense stages whenever a battle declares the capability; the campaign
  populates those declarations when air/smoke content lands.
- Mine/submarine/coastal remain unreachable and are contractually deferred with
  a named boundary and minimum integration point.
- `docs/architecture/module-reachability.md` is updated to the new outcome.
