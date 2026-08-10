# DESIGN-42: Weather, Visibility, And Smoke

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-42`

Strategic Weather:

- Generated from area climate, season, and persistent weather state.
- Shared by battles in a consistent place and time unless temporal progression
  justifies change.

Weather Components:

- Sea state.
- Wind.
- Precipitation.
- Fog or mist.
- Time of day.
- Glare.
- Visibility.

Effects:

- Gunnery.
- Torpedoes.
- Submarines.
- Air operations.
- Ship speed.
- Formation cohesion.
- Foundering.
- Spotting and identification.

Smoke:

- Represented as deterministic spatial clouds.
- Attributes:
  - position;
  - shape;
  - density;
  - source;
  - age;
  - drift;
  - decay.
- Wind moves and disperses smoke.

Funnel Smoke:

- Coal ships generate more at high power.
- Oil ships generate less.
- Firing through smoke degrades accuracy.

Smokescreens:

- Eligible DD and CL ships may generate up to approximately five minutes.
- Requires approximately twenty minutes before reuse.
- Affects all fire through the screen.

Smoke Floats and Generators:

- Light cruisers may carry approximately three to five smoke floats.
- Later technology replaces floats with generators.
