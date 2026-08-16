# Ticket 01 — Scope Boundary

**Type:** decision
**Status:** resolved
**Blocked by:** none

## Question

DESIGN-40 spans the torpedo model (§1), launcher state (§2), ammunition/inventory
(§3), platform compatibility (§4), command authority (§5), launch eligibility (§6),
speed limits (§7–8), fire solution (§9–10), salvo (§11), launch timing/failure (§12),
track (§13), hit resolution (§14), detonation (§15), damage package (§16) with
flotation (§17), progressive flooding (§18), machinery (§19), system shock (§20),
tube-hit hazard (§21), chain reaction (§22), oxygen (§23), friendly-fire safety
(§24), evasion (§25), persistence (§26), records (§27), ordering (§28), reason codes
(§29), and 30 §30 validation items. What is the first bounded, engine-only vertical
slice for the M3 torpedo sprint? (Precedent: B-3 scoped only DESIGN-39's core
gunnery fire-resolution subset.)

## Decision

Ship the **torpedo fire-resolution** slice: `TorpedoModelDefinition` (§1),
`TorpedoLauncherState` (§2), local ammunition/reload mechanics (§3), platform
compatibility predicates (§4), launch-eligibility predicates (§6), underwater-tube
speed limit (§7, exact `12_861_100` µm/s), above-water launcher limits (§8),
fire-solution quality (§10, 11-factor product + one FLOOR), salvo (§11), launch
timing/failure (§12, base failure `100` bp, `TORPEDO_STUCK_IN_TUBE`),
`TorpedoTrack` (§13), hit resolution (§14), detonation outcomes (§15), the
`TorpedoDamagePackage` (§16) incl. flotation (§17), flooding **creation** (§18),
machinery (§19), system shock (§20), underwater-tube hit hazard (§21), chain
reaction (§22), oxygen torpedoes (§23), friendly-fire safety (§24, 1_000 m),
records/ordering (§27–28), reason codes (§29), and the §30 items that pertain to
this slice. The `torpedo_launch_authority_v1` policy contract (§5) ships as an
authoritative constant + legality guard; the command/AI layer does not. See map
"Decisions so far".

## Deferred (recorded, never dropped)

- §5 player manual-launch command + `DivisionTorpedoAttackOrder` + tactical AI
  launch authority — later command/AI slice (the authority policy guard ships).
- §3 production/inventory delivery + local supply; §4 refit under DESIGN-23.
- §18 per-minute progressive-flooding **resolution** — C-5 (damage control,
  reserved Stage 7).
- §25 target evasion — ship-maneuver track.
- §26 damage persistence into campaign — later battle-results slice.
- §7 submarine-launch speed limits (`SUBMARINE_INTERNAL`) — C-3.
- Aerial torpedoes — D-track. Mine/coastal-defense — C-2/C-4.

## Rationale / authority

Bounded first slice keeps the sprint a coherent vertical path (a launcher aims,
legalizes, and fires a torpedo at a contact; the track runs; it hits or not;
detonates or not; and a damaging hit produces a torpedo damage package through the
existing damage pipeline) and defers large independent mechanical blocks to tracks
that already own them (command/AI, damage control C-5, submarines C-3).