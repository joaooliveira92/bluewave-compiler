# Decision 05: Damage-control pipeline extension

## Question

How should C-5 extend the existing B-4 10-stage damage pipeline to handle per-minute fire propagation, flooding resolution, and damage-control allocation?

## Options

**A. Extended pipeline (stages 5-8 become per-minute resolvers).** The existing 10-stage pipeline (DETERMINE_HIT_LOCATION → ... → EVALUATE_TERMINAL_STATE) runs only when a new damage event occurs. C-5 adds a **per-minute damage-control resolution** that runs after all new damage for the minute: (a) fire propagation/spread + suppression, (b) flooding ingress + dewatering, (c) damage-control team allocation, (d) performance recomputation, (e) terminal state re-evaluation. This is a separate `resolveDamageControl` stage in the minute-advance engine, running after `resolveDamage`.

**B. Inline per-minute extension.** Each damage event's pipeline is extended to include per-minute resolution steps in stages 5-8, making them both creation and resolution handlers.

**C. Separate module.** A completely separate `resolveShipState` module runs independently after the damage pipeline, recomputing fire/flooding/performance/terminal state every minute regardless of whether new damage occurred.

## Decision

**Option A.** A separate `resolveDamageControl` engine stage (step 8.6, after `resolveDamage` at 8.5) that runs every tactical minute regardless of whether new damage occurred. Inside, it:
1. Resolves each active FireSource (§19-22): spread probability, suppression allocation, rate-of-fire penalty
2. Resolves each active FloodingSource (§13-18): ingress vs pumping/repair, severity recalc, high-speed loss check
3. Updates damage-control resource allocation (§27-28)
4. Recomputes performance modifiers (§12)
5. Re-evaluates terminal state (§29-32)
This keeps the B-4 damage-event pipeline unchanged (it handles creation) while adding per-minute resolution. The design follows the weather-progression pattern (B-5's `resolveWeather` stage).