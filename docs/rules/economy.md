# DESIGN-13: Economy And Accounting

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-13`

Economic State:

- Base resources.
- Naval appropriation rate.
- Monthly appropriation.
- Treasury.
- Committed obligations.
- Arrears.
- Possession income.
- Wartime modifiers.
- Economic growth.
- Financial ledger.

Base Resource Growth:

- Canonical annual growth normally falls within approximately 3–5%.
- Actual growth uses scenario, government, war, event, and ruleset modifiers.
- Growth is applied at an explicit annual phase.
- War and peace settlements may permanently change base resources.

Financial Ledger:

- Opening treasury.
- Recurring naval appropriation.
- Possession income.
- Event income.
- Reparations.
- Construction expenditure.
- Rebuild and repair expenditure.
- Maintenance.
- Research.
- Intelligence.
- Training.
- Infrastructure.
- Aircraft and missile procurement.
- Treaty or scrapping losses.
- Closing treasury.

Payment Priority:

1. Legally mandatory obligations.
2. Minimum active-fleet maintenance.
3. Critical repairs and safety expenses.
4. Existing construction commitments.
5. Required foreign contracts.
6. Research and intelligence minimums.
7. Training.
8. New discretionary projects.

Insolvency:

- Treasury may not silently become negative.
- Payments are reduced or deferred according to priority.
- Unpaid eligible commitments become explicit arrears.
- Construction receives progress only for paid work.
- Insolvency can reduce:
  - institutional confidence;
  - fleet morale;
  - project progress;
  - readiness.
- Persistent insolvency triggers political intervention.

Surplus:

- Treasury carries over.
- Excessive surplus may trigger a political reclamation event.
- Confiscation is an explicit event or ruleset rule, never an invisible mutation.

Research Spending:

- Up to 12% of naval appropriation.
- Spending above 10% receives diminishing marginal effectiveness.
- Actual research progress is based on paid, not merely allocated, expenditure.

Construction:

- Paid through completed work units.
- Halted projects perform no construction work.
- Halted projects incur half the mothballed maintenance equivalent or the
  ruleset's canonical preservation cost.
- Accelerated projects:
  - cost 5% more total work-equivalent value;
  - receive a work-rate increase calibrated to approximately 10% faster
    completion;
  - can increase delay pressure on other construction.

Wartime Costs:

- Active maintenance increases.
- Mobilized personnel, fuel, ammunition, repairs, and operations add costs.
- Exact multipliers are ruleset constants and must be explainable in reports.
