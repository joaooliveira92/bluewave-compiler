# DESIGN-41: Damage, Fire, And Flooding

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-41`

Damage Resolution Pipeline:

1. Determine hit location.
2. Resolve armor interaction.
3. Apply local component damage.
4. Apply structure and flotation contribution.
5. Create immediate fire or flooding.
6. Resolve secondary hazards.
7. Update performance.
8. Enter terminal state where applicable.

Damage Categories:

- Local component damage.
- Structure.
- Flotation.
- Fire.
- Progressive flooding.
- Critical effects.

Critical Effects:

- Rudder.
- Machinery.
- Magazine.
- Fire control.
- Bridge or conning tower.
- Electrical system.
- Severe waterline damage.
- Torpedo or mine catastrophe.
- Aviation-fuel or ordnance event.

Turrets:

- operational
- jammed
- disabled
- destroyed
- burned_out

Flooding:

- Reduces speed and stability.
- Lower speed improves control.
- Approximately 10 knots is normally a safe target for controlling serious
  flooding.
- High speed with major flooding increases loss risk.

Fire:

- Damages superstructure and systems.
- Reduces rate of fire.
- Obstructs carrier operations.
- Increases nighttime visibility.
- Generates smoke.
- Carriers, transports, AMCs, AVs, and pre-dreadnoughts have higher risk.
- Aluminum superstructure saves approximately 10% hull weight but increases fire
  vulnerability.

Damage-Control Resources:

- Teams.
- Pumping capacity.
- Firefighting capacity.
- Electrical power.
- Crew availability.
- Player or AI priorities.

Terminal States:

- Mission-killed ships may still float.
- Sinking ships may remain afloat for hours.
- Stabilized ships may survive.
- Abandoned ships may be scuttled, captured, or recovered.
- Sinking credit and VP timing use explicit battle rules.

Survivors:

- Rescue may provide battle score.
- Requires eligible friendly ships and acceptable enemy threat.
