# C-5 Smoke + Damage-Control Research Notes

## Smoke mechanics (DESIGN-42 §§7-23)

DESIGN-42 provides exact constant values for all smoke mechanics. No primary-source research is needed — the design doc ships exact values for:

- Wind retention multipliers (§8): 9_500/9_000/8_000/6_500 bp
- Funnel smoke fuel multipliers (§11): coal 15_000, mixed 12_500, oil 7_500, nuclear 0
- Power-setting multipliers (§11): 5 bands from 5_000 to 15_000 bp
- Smokescreen: 9_000 density, 500m width, 100m height (§15)
- Smoke floats: 4 capacity, 8_500 density, 400m width, 25kt max speed (§§17-19)
- Smoke generators: 3 charges, 9_000 density, 500m width, 20min cooldown (§§20-22)

All values are authoritative contract constants, not BALANCE TARGETs. Implementation is a direct transcription of the design doc.

## Damage-control constants (DESIGN-41 §§13-22, §24-25, §27-28)

Similarly, DESIGN-41 ships exact values:

- Flooding severity thresholds: 500/1_500/3_000 bp (§14)
- Speed/stability multipliers per severity: §15 exact tables
- Speed-pressure multipliers: 6 bands (§16)
- High-speed loss base probability: 500/1_500/2_000/5_000 bp (§17)
- Fire-risk multipliers by ship type: §20 exact table
- Fire ROF penalty: 4-band multipliers (§22)
- Fire night signature: 5-band multipliers (§24)
- Damage-control priority: 9-step ordered list (§28)

All values are shipped as TypeScript constants per Decision 07. No YAML authoring needed.

## Existing code patterns

- Weather module (`packages/combat/src/weather/`): `StrategicWeatherState`, `BattleWeatherState`, per-minute `resolveWeather` stage (step 7.5), `WeatherEventRecord`, canonical ordering, contracts.
- Damage pipeline (`packages/combat/src/damage/`): `ShipDamageState`, 10-stage pipeline, `resolveDamage` stage (step 8.5), immediate fire/flooding creation, magazine hazard, basic SINKING/FOUNDERED.
- Mines module (`packages/combat/src/mines/`): pure value model, per-module `reasonCodes.ts`, `constants.ts`, `contracts.ts`, `index.ts` barrel export pattern.
- Module structure precedent: `model.ts` → `constants.ts` → `reasonCodes.ts` → `contracts.ts` → `index.ts`.

## Coupling points

- Fire smoke (§25): `smokeStrength = floor(fireIntensity * smokeFuelMultiplierBp * ventilationMultiplierBp / 10_000^2)` creates a `SmokeSourceRecord` → consumed by the smoke module's drift/decay (INC-2). This is the primary coupling between the two modules.
- Smoke optical multiplier (§9): computed per-minute by line intersection → consumed by gunnery accuracy (B-3), spotting (B-2). **Deferred.** The multiplier is computed and recorded in `SmokeEventRecord` but not wired into gunnery/spotting formulas until the integration pass.
- Funnel smoke (§11): every operating propulsion plant produces funnel smoke every minute. This always runs when a ship is in battle with propulsion. No special trigger needed beyond `resolveSmoke` stage existence.