# ADR-0072: P-1 — Speed Advantage as Range Control (Ticket 11)

## Status

Accepted (2026-10-08). Ticket 11 of `.scratch/p1-battles-that-matter`.

## Context

The pre-ticket-11 auto-resolver gave speed no tactical value. `pursuitOrders`
(ADR-0046) steers every viable ship straight at the nearest viable enemy at full
designed speed; the movement model is a discrete coarse grid (movement speed
units, 1/4 km per 0.1 kn), so the faster fleet's only bonus was reaching the
range band a few minutes earlier — then both sides stood and slugged it out. The
post-ADR-0053 sweep showed a 14 kn fleet beating an equal-gun 30 kn fleet 100%
(30/30). Ticket 11 acceptance: an equal-gun 30 kn fleet must win the sweep
matchup >= 50%.

Root-cause investigation (this ticket):

- The fast side already lands *more* damage per battle (diagnostic hit counts
  96 vs 89, 94 vs 90) yet loses: once a side starts losing ships the kill chain
  snowballs (flooding is a one-way drain, ADR-0050/0053), so the battle outcome
  is dominated by a discrete early-luck snowball, not by per-minute accuracy.
  Per-minute accuracy was verified identical for both ships over all 55 minutes
  of a 1v1 (diagnostic mismatches = 0) and shot counts equal (54/54).
- The slow-side win is structural, not RNG: three independent seed families
  gave ~100% slow-side wins with the fast side winning 0-2/30.
- A positional standoff law for *both* sides (hold a band instead of charging)
  did not fix the matchup (fast still lost 28/30) and broke the P-1 torpedo
  doctrine: with the geometry change the full sweep showed torpedo-vs-unarmed
  dropping from 100% attacker to 53/47, torpedo hits 2.00 -> 0.00 (tubes fired
  4.1 -> 32.9), battle length 70.6 -> 114.3 min. Torpedo lead/intercept courses
  assume the ADR-0046 closing geometry.

The lever that moves the matchup is the versioned fire-control balance target
(`ownManeuver`) applied to the slower side; the design change that authorises
it is who gets to choose the geometry: the faster side. Equal-speed battles must
stay byte-identical.

## Decision

1. **Range controller.** `resolveRangeController` (new `engagement.ts`) — the
   side with the greater maximum **designed** speed over its committed force is
   the RANGE CONTROLLER. `designedSpeedUms` is a fixed design attribute promoted
   at battle start, and the auto-resolver's unit array is constant for the
   battle (sunk ships stay in it, marked `terminalStatus`), so the controller is
   evaluated at battle start, over all units, and is constant for the whole
   battle: the projection-time penalty and the per-minute steering decision
   always use the same controller identity (no viability filter, no mid-battle
   re-evaluation). Ties (including an absent/empty side) are neutral: controller
   = null, and the battle is byte-identical to ADR-0046/0053.

2. **Controller-scoped standoff geometry (the design change).** The controller
   steers by `engagementHeading` instead of charging: range above centre+band ->
   CLOSE; below centre-band -> OPEN (directly away, never passing through);
   else HOLD (keep steering at the enemy, gently closing — the band is tracked
   via the CLOSE/OPEN corrections, not held as a stationary position). The
   contesting side still charges straight under ADR-0046 pursuit: it is denied
   the range initiative and never manœuvres of its own. The law is
   reflection-symmetric (CLOSE mirrors CLOSE, OPEN mirrors OPEN), so it
   introduces no attacker/defender bias of its own. Bands:
   `BATTLE_ENGAGEMENT_RANGE_UM = 2_000_000_000` (2 km) +/-
   `BATTLE_ENGAGEMENT_BAND_UM = 1_000_000_000` (1 km), measured by
   `rangeBetweenUm`. `headingToward` moved from `pursuit.ts` to `engagement.ts`
   so the two heading searches share one integer direction-table walk.

3. **Range-contest balance target (not emergent).** The contesting (slower)
   side's existing DESIGN-39 §3 `ownManeuver` accuracy factor is multiplied to
   `RANGE_CONTEST_OWN_MANEUVER_BP = 4_100` bp (a 59% own-manoeuvre factor).
   This is an explicitly versioned BALANCE TARGET, like the ADR-0053 lethality
   constants: it represents the fire-control cost of being denied the range
   initiative (running at speed against the controller's standoff doctrine,
   unable to dictate the band). It does NOT model actual manoeuvring the
   contesting side performs — the side charges straight and performs none. No
   new accuracy factor key, no GUNNERY_RULESET_VERSION bump. Applied only when a
   controller exists.

4. **Balance target, versioned.** Calibrated (30 seeds, 2 BB vs 2 BB, 1880
   June, sea state 3, sweep test): penalty 3 000 -> 93% fast, **4 100 -> 77%**,
   6 000 -> 20% fast. Chosen 4 100 (meets the >= 50% acceptance with margin,
   and does not over-flip the matchup the other way). Constants are validated by
   the shipped `battle_auto_resolution_v1` contract (ABI + canonical-value
   guard), so a re-fit is a new ADR, never an in-place edit.

5. **Deferred (unchanged).** Disengagement / break-off remains ticket 12; the
   controller's OPEN manoeuvre here is a short-distance band correction, not a
   withdrawal predicate.

## Re-pinned baselines (ADR-0007)

**None.** Because ties are neutral, every fixture at equal maximum speed is
byte-identical by construction (`controller = null` -> no steering change, no
penalty). Verified: `auto-resolve.test.ts` baseline #1, `ac6-damage-control-gate
.test.ts` baseline #2, and the torpedo determinism tests all reproduce their
existing hashes; `verify-golden-hashes.cjs` green. The only observed change is
the sweep-documentation row for the 30 kn vs 14 kn matchup (documented in
`docs/research/p1-balance-sweep.md`, regenerated by the sweep test).

## Consequences

- Balance sweep (30 seeds): 30 kn vs 14 kn equal-gun fleets now 77/20/3%
  (attacker/defender/no-winner), previously 0/100/0. Acceptance met with margin.
- Equal fleets (60/33/7, 58.8 min), 10-gun vs 4-gun (100%), and torpedo vs
  unarmed rows (100%, 4.1 tubes / 2.00 hits, 70.6 min) are byte-identical to the
  pre-ticket-11 sweep — the torpedo doctrine is untouched.
- Determinism unchanged: heading selection is still an integer direction-table
  search and the new comparisons are integer-only.
- Semi-symmetric effectiveness: a faster fleet gains a real but bounded
  advantage; reversing the matchup direction is symmetric (the same balance
  target applies to whoever is slower).

- Superseding note (ADR-0073): with the withdrawal predicate the 30 kn vs 14 kn sweep row is 80% fast-side wins (sweep test asserts >= 50%); the 73-77% figures above are pre-ADR-0073.