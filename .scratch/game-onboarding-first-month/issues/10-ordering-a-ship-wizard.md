**Type:** grilling
**Status:** open
**Blocked by:** 09

## Question

Spec §12.4–§12.7 (Ordering a Ship, Design Eligibility, Ship Naming, Order
Command) of [01-diagnosis.md](../01-diagnosis.md).

Split out from [Construction: active projects & state model](./09-construction-projects-state-model.md)
per charting decision — this is a distinct multi-step wizard (select design
→ review summary → name ship → review dock/cost/completion/balance impact →
confirm) with its own naming/validation/eligibility rules, too much to fold
into one session with the state-model ticket.

Decide:

1. **Flow steps** (§12.4): confirm each of the 10 steps is backed by real
   data (design catalog, dock capacity, projected cost via the real
   `construction_order_v1` formula from [ticket 09](./09-construction-projects-state-model.md),
   projected balance impact from [Treasury](./06-treasury-budget.md)).
2. **Design eligibility rules** (§12.5): confirm each of the six eligibility
   conditions is checkable against real data; confirm "insufficient current
   cash doesn't make a design ineligible if construction pays over time" is
   true of the real cost formula (which appears to be a one-time cost
   based on displacement, not a pay-over-time model — verify this before
   assuming the doc's framing holds).
3. **Ship naming** (§12.6): confirm `namingConvention`/`shipNameReuse`
   (captured as UI-only during the Commissioning Flow effort, per that
   map's ticket 03) are available to read here; decide the generated-name
   fallback and reuse-disabled dedupe logic exactly as the doc specifies
   (this section is concrete and implementable as-is, low risk).
4. **Order command** (§12.7): map `PlaceConstructionOrderCommand`/`Result`
   onto the real `submitConstructionCommand`/`replaceConstructionCommand`/
   `cancelConstructionCommand` family found in the charting-session IPC
   audit, rather than inventing new command names.

## Notes for the resolving session

- Reach for `/prototype` here — this is exactly the kind of multi-step
  wizard the prior map's "Starting-fleet-method screen" ticket needed a
  prototype to judge.
