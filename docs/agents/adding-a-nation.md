# Adding a nation (contributor guide)

Adding a nation is a **researched content task**. Do not add `if nationId === …` conditionals to the phase engine or
domain: express the difference through profile data.

## 1. Scaffold

```
node scripts/new-nation.mjs <nationId>
```

This writes `docs/nations/<nationId>-profile-draft.yaml` (every value a `PLACEHOLDER`) and
`docs/research/<nationId>-naval-profile.md`. It never writes into release content.

## 2. Research

Fill the note using the method in `docs/research/national-naval-profiles-uk-france.md`: name a source for every
figure, show unit conversions, and label each value `VERIFIED` / `DERIVED` / `ESTIMATE` / `BALANCE_TARGET`. Wikipedia is not a source. State the strategic posture, industry, gunnery/protection/propulsion/
torpedo doctrine, obligations, risk tolerance, research preferences, 8–15 national component variants, six opening
designs and naming.

## 3. Author the profile

Copy the draft block into `content/production/<scenario>/ship-building/naval-profiles/<nationId>.yaml` (one file per
nation). Replace every
`PLACEHOLDER` with a sourced/classified value and give each a `provenance` block:
- `sourceStatus`, `confidence`, `kind` (`historical_fact` | `game_conversion` | `balance_adjustment`);
- `sources` with `sourceId`, title, author/year and page/section;
- `derivation` with the original value+unit, conversion, converted value+unit.
Prefer shared component families (`components.yaml` ids) with a national model; never duplicate the catalog.

## 4. Six opening starters

Author `starter_*` designs in `reference-designs/<nationId>/starters.yaml` with `starterFor: B|CA|CL|DD|KE|AMC` and `nationId: <id>`.
Each must compile legal under the nation's catalogue. Classify each exactly one of:
`HISTORICAL_RECONSTRUCTION | HISTORICALLY_INSPIRED | DOCTRINE_TEMPLATE | BALANCE_TEMPLATE` (supply it in the
completeness test's classification map, or replace a shared template). Do not weaken global classification to make a
starter legal — fix the design or the profile.

## 5. Validate

```
pnpm --filter @bluewave/ship-design exec vp test run nationCompleteness
```

Fix every issue. Then run the full gate (`pnpm check` plus the packaged smoke) and update the completeness report.
