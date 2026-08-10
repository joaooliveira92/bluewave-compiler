# DESIGN-39: Gunnery

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-39`

Gunnery State:

- Battery.
- Target.
- Acquisition progress.
- Range estimate.
- Fire-control solution.
- Ammunition.
- Fire mode.
- Damage state.

Accuracy Factors:

- Fire-control technology.
- Crew quality.
- Officer effects.
- Special training.
- Range.
- Visibility.
- Radar.
- Own and target maneuver.
- Previous salvos.
- Sea state.
- Smoke.
- Damage.
- Multiple attackers.
- Glare and twilight.
- Target evasion.

Rate-of-Fire Factors:

- Gun and mount.
- Crew.
- Technology.
- Turn state.
- Sea state.
- Smoke interference.
- Damage.
- Range.
- Ammunition state.

Gun Quality:

- Range from -3 through +2.
- Modifies range, penetration, and applicable rate of fire.

Autoloaders:

- Approximately 10% higher normal rate of fire.
- Approximately 30% rapid-fire improvement after straddling.
- Approximately 25% heavier.
- Improved AA performance where applicable.

Dual-Purpose Guns:

- Approximately 25% heavier.
- Serve surface and AA roles.

Armor Resolution:

- Shell and gun definition.
- Range.
- Impact zone.
- Impact angle.
- Armor quality.
- Obliquity.
- Penetration margin.
- Outcome:
  - no effect;
  - splinter effect;
  - partial penetration;
  - full penetration;
  - pass-through;
  - dud;
  - critical penetration.

Armor Limits:

- Belt maximum 20 inches.
- Turret maximum 26 inches.
- Armor above 12 inches receives reduced proportional effectiveness according to
  manufacturing rules.
- Armor of 2 inches or more protects against qualifying splinters.

Target Allocation:

- Threat.
- Suitability.
- Range.
- Identification.
- Current engagement.
- Overkill.
- Objective relevance.
- Ammunition conservation.
- Manual orders constrain this evaluation.
