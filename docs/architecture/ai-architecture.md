# DESIGN-50: AI Architecture

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-50`

AI Components:

- StrategicPlanner
- BudgetAllocator
- ForceStructurePlanner
- DesignRequirementGenerator
- ShipDesignAgent
- ConstructionScheduler
- RefitPlanner
- DeploymentPlanner
- DiplomaticPlanner
- WarPlanner
- InvasionPlanner
- IntelligencePlanner
- OfficerAdministrator
- BattleAcceptancePolicy
- TacticalDoctrineController

AI Rules:

- Reads legal knowledge, not global truth.
- Issues validated domain commands.
- Respects budget, technology, treaties, capacity, and logistics.
- Does not mutate state directly.
- Is deterministic.
- Produces explanation traces.
- Difficulty changes policy quality or information assistance explicitly.
- Hidden combat-stat bonuses are prohibited unless declared by difficulty rules.

AI Planning:

- Uses:
  - strategic objectives;
  - national traits;
  - government;
  - known rival capability;
  - budget forecast;
  - technology forecast;
  - treaty state;
  - war risk.
- Maintains multi-year force-structure goals.
- Can revise plans after failed validation or changed circumstances.
