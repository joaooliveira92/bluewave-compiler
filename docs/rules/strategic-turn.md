# DESIGN-10: Strategic Monthly Turn Pipeline

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-10`

Stable Snapshots:

- MonthOpeningSnapshot
- CommandLockSnapshot
- PostMovementSnapshot
- BattleEligibilitySnapshot
- PostBattleSnapshot
- BlockadeSnapshot
- MonthClosingSnapshot

Authoritative Phase Order:

0.  Validate Previous Snapshot

- Verify hashes, invariants, and phase cursor.

1.  Open Month

- Advance scheduled calendar effects.
- Update elapsed war, service, project, and training months.

2.  Apply Scheduled Global Events

- Canal completion or disruption.
- Scenario events.
- Treaty expiration.
- Government transitions already scheduled.

3.  Apply Scheduled National Events

- Political mandates.
- Economic changes.
- Officer and institutional events.

4.  Present Mandatory Player Decisions

- Event choices.
- Peace offers.
- Treaty negotiations.
- Insolvency interventions.
- Required political responses.

5.  Generate AI Strategic Plans

- AI observes only information legally available at MonthOpeningSnapshot.

6.  Collect Player Commands

- Player issues budget, design, construction, movement, policy, and other orders.

7.  Validate and Reserve Commands

- Validate legality.
- Reserve treasury and capacity.
- Produce accepted or rejected command records.

8.  Lock All Commands

- Player and AI commands become immutable for the month.
- Produce CommandLockSnapshot.

9.  Resolve Diplomacy

- Alliances.
- Incidents.
- War declarations.
- War entry.
- Access rights.
- Canal permissions.

10. Resolve Political and Budget Changes

- Appropriation changes.
- Mandates.
- Confidence and unrest effects that apply before spending.

11. Post Monthly Revenue

- Naval appropriation.
- Possession income.
- Reparations.
- Scheduled grants.

12. Pay Mandatory Obligations

- Maintenance.
- Existing project commitments.
- Contractual payments.
- Required personnel and support costs.

13. Resolve Insolvency Allocation

- Apply payment priority.
- Pause or reduce non-mandatory spending.
- Record arrears where permitted.
- Apply morale and confidence effects.

14. Resolve Projects

- Design studies.
- Construction.
- Rebuilds and repairs.
- Infrastructure.
- Aircraft development.
- Radar and equipment production.

15. Resolve Research

- Apply paid research allocation.
- Progress fields.
- Discover technologies.
- Schedule installations or adoption requirements.

16. Resolve Personnel and Readiness

- Working up.
- Mobilization.
- Training.
- Officer assignments.
- Promotions.
- Crew recovery.
- Squadron re-equipment.

17. Resolve Strategic Movement

- Validate routes against current diplomacy.
- Resolve one monthly movement edge or ruleset-defined movement allowance.
- Resolve fuel, breakdown, and interdiction conditions.
- Produce PostMovementSnapshot.

18. Resolve Pre-Battle Operational Effects

- Mine preparation.
- Reconnaissance.
- Intelligence updates.
- Surprise conditions.
- Air and submarine availability.

19. Generate Tactical Engagements

- Determine eligible battles.
- Select forces through constraints.
- Produce BattleEligibilitySnapshot.

20. Resolve Battles

- Player may fight or auto-resolve.
- Apply tactical results immediately to participating assets.
- A ship cannot enter a second battle unless explicitly allowed by the ruleset.

21. Apply Battle Consequences

- Damage.
- Losses.
- Crew and officer outcomes.
- War contribution.
- Political effects.
- Reports.

22. Resolve Amphibious Operations

- Launch prepared invasions.
- Resolve invasion battle or abstraction.
- Establish occupation where successful.

23. Resolve Blockade

- Use PostBattleSnapshot.
- Establish, maintain, weaken, or break blockades.
- Produce BlockadeSnapshot.

24. Resolve Trade Warfare

- Trade protection.
- Raiders.
- Submarine warfare.
- Merchant losses.
- Operational mines.
- Neutral incidents.

25. Resolve Supply and Fuel

- Local base support.
- Wartime oil shortages.
- Remote deployment penalties.
- Merchant-import consequences.

26. Resolve Political End-of-Month Effects

- Unrest.
- War exhaustion.
- Strikes.
- Colonial unrest.
- Revolution checks.
- Institutional confidence.

27. Resolve Peace Negotiations

- Evaluate war state.
- Draft and validate settlement terms.
- Apply accepted settlements atomically.

28. Resolve Compliance

- Treaty compliance.
- Foreign-station obligations.
- Political mandates.
- Construction restrictions.

29. End-of-Month AI Administration

- Fill eligible command vacancies.
- Update plans.
- Generate non-authoritative recommendations.

30. Evaluate Terminal Conditions

- Dismissal.
- Unsupported national collapse.
- Scenario termination.
- End date.

31. Generate Reports

- Financial.
- Construction.
- Research.
- Intelligence.
- Operations.
- Political.
- War.
- Compliance.

32. Canonicalize State

- Normalize ordering.
- Rebuild required projections.
- Validate invariants.

33. Compute Hashes

- Aggregate hashes.
- Snapshot hash.
- Command/event ledger hash.
- RNG manifest hash.

34. Persist Autosave

- Save atomically at MonthClosingSnapshot.

35. Close Month

- MonthClosingSnapshot becomes next MonthOpeningSnapshot.
