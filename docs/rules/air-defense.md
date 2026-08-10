# DESIGN-45: Air Defense

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-45`

Defense Layers:

1. CAP.
2. Heavy SAM.
3. Medium SAM.
4. Light SAM.
5. Heavy AA.
6. Medium AA.
7. Light AA.
8. CIWS and terminal defense.

AA State:

- Gun category.
- Director.
- Radar.
- Crew.
- Damage.
- Ammunition.
- Target attack type.

Resolution Outcomes:

- kill
- damage
- abort
- disruption
- no_effect

Disruption:

- Separate from physical aircraft damage.
- Reduces attack accuracy and cohesion.

AA Rules:

- Heavy AA engages aircraft attacking own or nearby ships.
- Medium AA engages before release against applicable attacks.
- Light AA timing depends on aircraft speed and attack profile.
- Light AA always has an opportunity to disrupt where eligible.
- Up to four AA directors provide normal scaling.
- More than four radar-directed medium-AA groups have diminishing returns.
- More than eight are mostly redundant.
- More than six CIWS systems are strongly redundant; approximately four is
  normally sufficient.

CAP:

- Uses:
  - airborne CAP;
  - ready CAP;
  - refueling CAP;
  - alert level;
  - endurance.
- Radar and fighter direction affect interception.
- Repeated attacks can exhaust CAP.

Attack-Layer Matching:

- Heavy ASM against heavy defenses.
- Medium ASM against medium defenses.
- Light ASM against light defenses and heavy AA.
- Bombing and rockets against applicable AA layers.
- Torpedo, skip, and dive bombing against terminal AA layers.
