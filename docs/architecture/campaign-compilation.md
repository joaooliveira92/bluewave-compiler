# DESIGN-09: Campaign Compilation

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-09`

Compiler Inputs:

- Canonical content pack.
- Ruleset.
- Scenario.
- Player slot.
- Continuity mode.
- Campaign settings.
- Structural seed.
- Campaign seed.

Compiler Pipeline:

1. Load and hash content.
2. Validate scenario participation.
3. Materialize scenario nation instances.
4. Materialize regimes and traits.
5. Materialize world ownership and infrastructure.
6. Materialize diplomacy and treaty state.
7. Materialize technologies and technology variation.
8. Materialize economies and budgets.
9. Materialize historical or generated fleets.
10. Materialize ongoing construction and rebuilds.
11. Materialize officers, crews, divisions, and deployment.
12. Materialize aircraft, submarines, and inventories.
13. Materialize political state and objectives.
14. Validate all aggregates.
15. Repair only explicitly repairable generated data.
16. Reject irreparable or incomplete input.
17. Canonicalize ordering and identifiers.
18. Produce initial snapshot.
19. Execute preflight checks.
20. Compute reproducibility hashes.
21. Persist the first stable campaign save.

Legacy Fleet Modes:

- 1880:
  - Automatic canonical generation.
- 1900:
  - Automatic generation or manual legacy construction.
- 1920:
  - Automatic canonical generation.
- 1935:
  - Automatic canonical generation.

Legacy Fleet Generation Requirements:

- Fleet must satisfy:
  - budget sustainability;
  - minimum operational capability;
  - foreign-station obligations;
  - treaty legality;
  - dock and infrastructure limits;
  - scenario technology;
  - national force doctrine;
  - maintenance affordability;
  - playable first-turn liquidity.
- Generated fleets include:
  - age cohorts;
  - design families;
  - individual ships;
  - historical refits;
  - readiness;
  - divisions;
  - officers;
  - deployment;
  - active projects.

Manual 1900 Legacy Construction:

- Starting allocation is divided between:
  - completed commissioned ships;
  - ships already under construction.
- Under-construction ships begin at the ruleset-defined legacy progress,
  nominally around 50%.
- The setup charge for completed historical work uses the explicit legacy
  subsidy rule, nominally 5% of the value of completed work.
- Subsidized historical work does not become future debt.
- Remaining unfinished work is paid normally.
- The compiler records:
  - full ship value;
  - historical work value;
  - setup charge;
  - subsidy;
  - remaining liability.
