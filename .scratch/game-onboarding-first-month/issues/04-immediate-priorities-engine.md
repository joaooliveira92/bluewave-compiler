**Type:** grilling
**Status:** open
**Blocked by:** 11

## Question

Spec §7 (Immediate Priorities System) of [01-diagnosis.md](../01-diagnosis.md).

No priority/warning-card system exists anywhere in the engine today — this
is a wholly new subsystem. Decide:

1. **Priority shape and types** (§7.2–§7.3): confirm the `StrategicPriority`
   interface and the eight priority types are all buildable from real data.
   `obsolete_active_class` in particular depends on an "obsolescence score"
   the doc itself flags as possibly not trustworthy yet (§7.4) — verify
   current state via a research subagent before committing to it; fall back
   to the doc's own suggested technology-gap-only comparison, or cut the
   type entirely, if no trustworthy signal exists.
2. **Trigger rules and thresholds** (§7.4): adopt the doc's numeric
   constants as-is (8% research minimum, the cash-reserve/deficit formulas,
   `remainingMonths <= 2`, etc.) — this was decided during charting and is
   not open for renegotiation here. `high_foreign_tension` depends on
   [Diplomacy tension-threshold policy](./11-diplomacy-tension-threshold-policy.md),
   which this ticket is blocked by — use its resolved threshold, don't
   invent one.
3. **Sorting and dismissal** (§7.5–§7.6): confirm feasibility of the sort
   key (severity → financial risk → time-to-consequence → stable type order
   → stable id) against real data availability for "direct financial risk"
   and "shortest time to consequence" per priority type. Confirm dismissal
   metadata storage (campaign UI metadata, keyed by fingerprint) fits the
   real persistence model from [Saving, loading & campaign-list](./16-saving-loading-campaign-list.md).

## Notes for the resolving session

- This is likely the single largest ticket on the map — budget accordingly,
  and split further mid-session if needed rather than forcing a shallow
  resolution.
