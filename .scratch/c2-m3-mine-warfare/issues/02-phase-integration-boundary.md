# Ticket 02 — Phase / Engine Integration Boundary

**Type:** decision
**Status:** resolved
**Blocked by:** 01-scope-boundary

## Question

DESIGN-35 covers laying/pressure/sweeping/decay/reports, which read as a
strategic, per-area, monthly-cadence mechanic, and battle-mine hazard generation,
which reads as a tactical, per-battle mechanic (DESIGN-38 §3 step 9 lists "gun,
torpedo, missile, mine, submarine, and air actions" together in the minute-advance
substep schedule). Does the C-2 slice run in the B-2..B-6 minute-advance tactical
engine (`@bluewave/combat` simulation), as a strategic-phase mechanic
(`phase-engine` + `CampaignSnapshot`), or both? Where does the code live?

## Decision

**Both, sequenced — this sprint ships only the strategic half, as a pure function
set with no phase/snapshot wiring.**

- Package placement: `@bluewave/combat` (`packages/combat/src/mines/`), **not**
  `@bluewave/campaign-engine`. Precedent: strategic weather generation
  (`generateStrategicWeather`, a per-area monthly mechanic) already lives in
  `packages/combat/src/weather/strategic-state.ts`, not campaign-engine — the
  combat package already houses both tactical (minute-advance) and strategic
  (monthly) deterministic simulation logic; mine pressure follows the same
  placement rather than inventing a new cross-package boundary.
- **No `phase-engine` registration this sprint** (stricter than the B-5
  precedent, which registered a no-op `weather_generation` phase stub in the same
  sprint it shipped the pure engine). C-2 defers even the stub because the
  authoritative snapshot shape (`AreaMinePressureRecord[]` on `CampaignSnapshot`,
  keyed by area/participant/mine-type/target-set — a 4-tuple key, unlike weather's
  simple per-area array) is a real design decision that belongs with the sprint
  that actually wires it, not one guessed now and possibly reworked later.
- **No `CampaignSnapshot` schema change.** Functions take explicit inputs
  (existing pressure records, laying actions, sweeping ships, campaign month) and
  return explicit outputs (updated records, decay/sweep/report/persistence
  results) — the same shape as `resolveGunnery`/`resolveTorpedoes` take explicit
  battery/launcher inputs rather than reading ambient state.
- Golden hashes unchanged; no `ADR-0007` regeneration.
- The tactical minute-advance engine stage (mirroring `resolveTorpedoes`,
  strict-no-op when no mine context, threading a `mineHazardStates` field like
  `torpedoTracks`) is explicitly **out of scope** — see ticket 03. When it lands,
  it will consume the `AreaMinePressureRecord` type this sprint ships as its
  input, not duplicate it.

## Deferred (recorded)

- `phase-engine` `mine_warfare_generation` phase (even as a no-op stub) +
  `CampaignSnapshot.minePressure` field — deferred to the sprint that wires this
  authoritatively (mirrors B-6's weather wiring, ADR-0025).
- Tactical `resolveMineHazards`-style engine stage — C-2 continuation (ticket 03).

## Rationale / authority

DESIGN-38 §3 step 9 confirms mines DO have a tactical, per-minute substep
alongside torpedoes — so "both" is the correct final answer, not a false
dichotomy. But DESIGN-35's own resolution order (§12) sequences "monthly
operational mine laying" (item 6) after "battle-mine hazard generation" (item 4)
and "battle mine-strike resolution" (item 5) — i.e., DESIGN-35 itself treats the
strategic monthly cycle as the outer loop and the battle-local hazard as one
input consumed within it, not the other way around. Building the strategic
pressure model first, and having the (deferred) tactical stage consume it later,
matches the canonical ordering rather than fighting it. Registering nothing in
`phase-engine` yet (rather than a no-op stub) avoids committing to a snapshot
shape before the consuming sprint is scoped — the 4-tuple pressure-record key
(area × participant × mine-type × target-set) is materially different from
weather's flat per-area array and deserves its own sizing pass.
