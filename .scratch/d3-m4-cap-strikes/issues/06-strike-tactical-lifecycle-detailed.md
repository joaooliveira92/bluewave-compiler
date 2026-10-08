## Question

What is the full strike mission lifecycle within a tactical battle? From launch (or already-airborne start) through formation, transit, target approach, attack, egress, and recovery.

DESIGN-43 defines mission role eligibility and attack modes (level bombing, dive bombing, torpedo attack, skip bombing, guided weapon).
DESIGN-44 defines carrier-side strike prep, launch, and recovery (§13-18) — these are strategic/operational, not tactical minute.

Open questions:
1. Does the strike mission have discrete state transitions during a tactical battle? E.g. EN_ROUTE → ON_TARGET → ATTACKING → EGRESSING → RETURNING?
2. Transit time from carrier to target: depends on speed, range, formation? Does it consume multiple tactical minutes? How is this calculated at battle generation?
3. Target approach: does the strike need to penetrate CAP/AA before attacking? How does this affect timing?
4. Attack resolution: one attack per target per squadron per pass? Multiple passes (dive bombers, torpedo bombers making multiple runs)?
5. Egress: after attack, the strike returns to carrier (or land base). Fuel checks, damage checks?
6. Recovery: uses D-2's recovery priority and deck-cycle states? Or simplified tactical recovery?
7. Does the strike carry over multiple battle minutes, or resolve in a single minute?
8. What about land-based strikes (aircraft from airbases, not carriers)?

Deliverable: proposed strike tactical lifecycle — states, transit time formula, attack resolution cadence, egress/recovery rules. Identify integration points with D-2 carrier operations (recovery priority, deck cycles, fuel/ordnance).