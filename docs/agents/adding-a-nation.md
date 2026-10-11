# Adding a nation (contributor guide)

Adding a nation is a **researched content task**. Do not add `if nationId === …` conditionals to the phase engine or
domain: express the difference through profile data.

## 1. Scaffold

```
node scripts/new-nation.mjs <nationId>
```

Writes `docs/nations/<nationId>-profile-draft.yaml` (every value a `PLACEHOLDER`) and
`docs/research/<nationId>-naval-profile.md`; never release content. The draft is already a full
`{ navalProfiles: [ … ] }` catalogue — the shape of
`content/production/<scenario>/ship-building/naval-profiles/<nationId>.yaml` (ADR-0109) — with every required
`provenance` block.

## 2. Research

Follow `docs/research/national-naval-profiles-uk-france.md`: source every figure, show unit conversions, and label
each `VERIFIED` / `DERIVED` / `ESTIMATE` / `BALANCE_TARGET`. Wikipedia is not a source. Cover posture, industry,
gunnery/protection/propulsion/torpedo doctrine, obligations, risk tolerance, research preferences, 8–15 variants,
six opening designs, naming.

## 3. Author the profile

Copy the `navalProfiles` block into
`content/production/<scenario>/ship-building/naval-profiles/<nationId>.yaml` (one file per nation). Replace every
`PLACEHOLDER` with a sourced value and a `provenance` block: `sourceStatus`, `confidence`, `kind`, `sources`,
`derivation`. Top-level, `industrialProfile` and `doctrineProfile` provenance are required, as is every `gunModels` /
`ammunitionPatterns` / `componentVariants` entry. Use `VERIFIED` only with a source; otherwise `ESTIMATE` (with a
source) or `PLACEHOLDER` — never `VERIFIED` with empty `sources`. Prefer shared component families; never duplicate
the catalog.

## 4. Six opening starters

Author `starter_*` designs in
`content/production/<scenario>/ship-building/reference-designs/<nationId>/starters.yaml` with `starterFor: B|CA|CL|DD|KE|AMC`.
Each must compile legal; classify each exactly one of
`HISTORICAL_RECONSTRUCTION | HISTORICALLY_INSPIRED | DOCTRINE_TEMPLATE | BALANCE_TEMPLATE` in
`packages/ship-design/test/helpers/referenceClassifications.ts`. Do not weaken classification to make a starter
legal — fix the design or the profile.

## 5. Validate

```
pnpm --filter @bluewave/ship-design exec vp test run nationCompleteness
```

Fix every issue, then run the full gate (`pnpm check` plus the packaged smoke).
