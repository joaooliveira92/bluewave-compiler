**Type:** grilling
**Status:** open
**Blocked by:** 13

## Question

Spec §15 (Monthly Resolution Presentation) of [01-diagnosis.md](../01-diagnosis.md).

No progress-streaming mechanism exists for month resolution (no
`subscribeToMonthProgress` equivalent found in the charting-session IPC
audit) — `commitMonth.ts` processes a month in one request/response. This
mirrors the situation the prior map's world-generation-presentation ticket
faced (`.scratch/game-onboarding/issues/07-world-generation-presentation.md`),
which resolved on a **cosmetic timed sequence racing the opaque call**, not
real progress events.

Decide:

1. **Real stage progress vs. cosmetic sequence** (§15.1–§15.2): given the
   real phase list decided in [Advance Month flow](./13-advance-month-flow.md),
   decide whether building genuine IPC progress streaming for month
   resolution is worth it for M2, or whether the same cosmetic-sequence
   pattern from the world-generation ticket applies here too. Recommend
   reusing the cosmetic-sequence precedent unless the resolved phase list
   makes real progress trivially cheap to wire.
2. **Stage copy** (§15.1): confirm the seven listed stage labels match the
   real phase list's actual order and content from ticket 13; adjust
   wording to stay truthful per the doc's own "must not claim fine-grained
   percentage completion" rule.
3. **Failure presentation** (§15.3): confirm the failure UI's claims
   ("previous month remains intact", retry safety) are backed by the atomic
   persistence guarantees already established in
   [Advance Month flow](./13-advance-month-flow.md).
