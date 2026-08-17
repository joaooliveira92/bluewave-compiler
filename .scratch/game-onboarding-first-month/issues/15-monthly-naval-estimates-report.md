**Type:** grilling
**Status:** open
**Blocked by:** 13

## Question

Spec §16 (Monthly Naval Estimates Report) of [01-diagnosis.md](../01-diagnosis.md).

`commitMonth.ts` already produces report-entry-shaped data (a
`"ConstructionProgressed"` event type was found during the charting-session
IPC audit — a real report entry type, not invented). Reconcile the doc's
proposed `MonthlyCampaignReport` shape against what `commitMonth.ts` already
emits rather than assuming it's all new.

Decide:

1. **Report sections** (§16.3): for each of Treasury/Construction/Research/
   Diplomacy/Fleet/Priorities, confirm what `commitMonth.ts` already emits
   versus what needs adding. Add the **battle outcomes** line item decided
   during charting (plain-text losses/outcomes, no tactical UI) — likely
   its own small subsection or folded into Fleet, decide which reads more
   naturally.
2. **Report data model** (§16.4): reconcile `MonthlyCampaignReport` against
   the real report-entry shapes found in `commitMonth.ts`; adjust field
   names/types to match reality rather than the doc's invented interface
   where they diverge.
3. **Report history** (§16.6): confirm whether report persistence (most
   recent 12, read-only) already has a home in the real save model
   (cross-reference [Saving, loading & campaign-list](./16-saving-loading-campaign-list.md))
   or needs new storage.
