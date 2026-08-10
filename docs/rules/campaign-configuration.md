# DESIGN-03: Campaign Configuration

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-03`

Supported Historical Start Scenarios:

- scen_1880
- scen_1900
- scen_1920
- scen_1935
- scen_1960

Simulation End:

- December 1970, unless terminated earlier.

Strategic Turn:

- One calendar month.

Required Campaign Inputs:

- Scenario.
- Player slot.
- Historical continuity mode.
- Fleet-size setting.
- Research-speed setting.
- Technology-variation setting.
- Historical-budget option where supported.
- Legacy-fleet mode where supported.
- Tactical realism mode.
- Campaign difficulty profile.
- Campaign seed.

Fleet-Size Setting:

- Modifies national naval appropriations, sustainable fleet size, AI force
  targets, and generated legacy-fleet scale.
- Does not modify tactical statistics of individual ships.
- Uses ruleset-defined multipliers.
- Every multiplier must be present in the active ruleset.

Research-Speed Setting:

- Modifies research progress rates.
- Does not change prerequisites or technology effects.
- Uses fixed-point ruleset multipliers.

Technology Variation:

- None:
  - Uses canonical availability dates and effectiveness.
- Some:
  - May shift eligible technology dates by a ruleset-bounded small amount.
  - May apply bounded effectiveness variation to eligible technologies.
- Considerable:
  - May shift dates by up to six years where permitted.
  - May apply wider bounded effectiveness variation.
- Technology variation is materialized during campaign compilation.
- Variation does not consume runtime research RNG.
- The resulting technology manifest is immutable for the campaign.

Historical Continuity Modes:

- historical:
  - Uses canonical political and territorial continuity.
  - Historically unavailable playable slots remain inactive.
- alternate_continuity_v1:
  - Activates supported alternate continuities.
  - Uses explicit scenario definitions rather than procedural substitutions.
- No AI-only nation may silently replace a canonical playable slot.
