# Ticket 03 — Launch Legality

**Type:** decision
**Status:** resolved
**Blocked by:** 01-scope-boundary

## Question

What is the authoritative launch-legality surface for the C-1 slice, and which
DESIGN-40 §5 authority semantics are represented versus deferred?

## Decision

Ship pure, fail-closed launch-legality functions covering DESIGN-40 §6 (all
predicates), §7 (underwater-tube speed limit), and §8 (above-water launcher
limits), plus the `torpedo_launch_authority_v1` policy:

- **Authority (§5 policy):** the shipped tactical policy `torpedo_launch_authority_v1`
  as a versioned contract defining the three modes `ADMIRAL` / `REAR_ADMIRAL` /
  `CAPTAIN` and their legality semantics (ADMIRAL/REAR_ADMIRAL prohibit manual
  launch; CAPTAIN permits manual launch through the command contract). A legality
  guard enforces the mode; the actual player/AI command plumbing is deferred. A
  launch lacking authority fails with `TORPEDO_LAUNCH_AUTHORITY_DENIED` /
  `TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED`.
- **§6 predicates:** every predicate listed (authority, tubes operational,
  compatible load, reload/interlocks, contact confidence ≥ `4_000` bp, not
  friendly, arc/bearing, range, arming, fire-solution quality, own-speed limit,
  maneuver/fire-control limit, sea state, friendly-fire safety, ammunition
  reservation). Failure consumes no torpedo and produces one explicit reason code.
- **§7:** `currentSpeedMicrometresPerSecond <= 12_861_100` (== 25 kn legal, > 25 kn
  illegal) for `UNDERWATER_FIXED`/`UNDERWATER_TRAINABLE`; checked at command
  validation AND at the exact firing substep; post-issuance acceleration →
  `UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED`, no torpedo consumed, command completed
  with a failed-launch outcome (DESIGN-40 §7 governs). `SUBMARINE_INTERNAL` uses
  model-specific limits (C-3).
- **§8:** above-water defaults — fixed tube `30` kn, trainable mount `35` kn —
  exact integers; a launcher definition MAY supply a narrower value; missing
  metadata → `TORPEDO_LAUNCH_SPEED_LIMIT_MISSING`.
- Fog-of-war: torpedo targeting reuses `validateTargetOrder` (the single
  `TACTICAL_FOG_OF_WAR_VIOLATION` choke point) then applies the higher `4_000` bp
  contact-confidence gate.

## Deferred (recorded)

- Player `ManualTorpedoLaunchCommand` / `DivisionTorpedoAttackOrder` command layer +
  tactical AI launcher selection (§5.1–5.4) — later command/AI slice.

## Rationale / authority

DESIGN-40 §5–8 are normative. §6 already lists all predicates; §7 pins the exact
threshold; §8 pins defaults with a MAY-narrow escape. Seam map confirms
`validateTargetOrder` (`packages/combat/src/targeting.ts:14-36`) is the single
fog-of-war choke point and there is no 4_000-bp contact precedent yet
(gunnery uses 2_000 bp).