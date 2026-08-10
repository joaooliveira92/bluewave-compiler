# DESIGN-35: Mine Warfare

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-35`

Mine Pressure:

- Area.
- Laying side or nation.
- Target belligerents.
- Strength.
- Freshness.
- Source composition.
- Detection confidence.
- Last swept date.

Mine Sources:

- Bases.
- Coastal artillery.
- Mine-capable ships.
- Minelaying submarines.
- Scenario minefields.

Minesweeping:

- Eligible ships generate regional sweeping value.
- Dual ASW/mine equipment reduces both capabilities according to ruleset.
- Sweeping reduces mine pressure and battle-mine generation.

Resolution:

- Pre-battle mining and sweeping round.
- Monthly operational mining.
- Mine-strike checks.
- Battle minefield generation.

Effects:

- Damage or loss.
- Route risk.
- Defensive standoff.
- Battle hazards.
- Reports that may misidentify mines as torpedo attacks.

Persistence:

- Mines decay according to type and time.
- Post-war mines remain until decay or clearance where applicable.
- Ownership change does not automatically remove minefields.
- Friendly-fire risk is possible where knowledge is incomplete.
