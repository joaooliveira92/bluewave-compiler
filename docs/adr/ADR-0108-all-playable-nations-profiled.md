# ADR-0108: Every playable nation has an authored naval profile

## Status

Accepted (2026-10-11). Closes the content gap recorded by ADR-0096.

## Context

ADR-0096 recorded that the 1880 production pack marks **ten** nations
`isPlayable: true` but only **three** (uk, france, germany) had an authored
`NationNavalProfile`; the other seven (usa, japan, italy, russia,
austria_hungary, spain, qing) resolved a nation-neutral ship-building
environment. The gap was enforced as an explicit `UNAUTHORED_PLAYABLE`
allowlist in `productionNationCoverage.test.ts`, which may only shrink.

## Decision

1. **Author the seven remaining profiles** through the ADR-0092 pipeline:
   a researched note per nation under `docs/research/<nation>-naval-profile.md`,
   a date-banded `navalProfiles` block in
   `content/production/1880/ship-building/naval-profiles.yaml`, and six
   classified opening starters in `reference-designs.yaml`.
2. **The starters are `DOCTRINE_TEMPLATE`s.** Each nation's B/CA/CL/DD/KE/AMC
   starter is cloned from the shared 1880 doctrine templates (the UK set), so it
   is legal at 1880-01, classifies as its own type, fits a dock and fits the
   standard opening budget. National identity is carried by the profile
   (postures, doctrine, industrial multipliers, gun/component variants,
   procurement, naming), not by a bespoke hull. Historical-reconstruction
   starters are deferred (see Consequences).
3. **`UNAUTHORED_PLAYABLE` is now empty.** `productionNationCoverage.test.ts`
   asserts full playable-nation coverage; a new playable nation without a profile
   now fails the gate outright.
4. **Provenance discipline is unchanged.** Every historical shape is labelled
   `ESTIMATE`/`DERIVED` and every gameplay weight/multiplier `BALANCE_TARGET`,
   with a source reference per profile and per variant; no release placeholder is
   authored. The first-class armament cut-over (`@bluewave/armament`) still covers
   uk/france/germany; the other nations compile on the documented legacy
   compatibility path.

## Alternatives considered

- **Deep historical-reconstruction starters per nation.** Correct and richer, but
  a multi-session sourcing effort per nation; deferred rather than fabricated.
- **Leave the allowlist partially populated.** Rejected: the ticket's end state is
  full coverage, and the gate already supports the empty set.
- **Per-nation bespoke hulls instead of cloned templates.** Rejected for this
  pass: it multiplies the calibration risk without changing playability; the
  profile data already differentiates the nations.

## Consequences

- All ten playable nations resolve a national environment from content alone and
  pass `validateAllNations` at release.
- Seven research notes and one profile block per nation are added; the
  completeness report (`docs/nations/national-content-completeness.md`) now covers
  ten nations.
- **Deferred (recorded, not dropped):** historical-reconstruction starters,
  nation-specific heavy-gun *families* that the shared catalogue lacks (e.g. the
  Italian 450 mm, the Spanish 320 mm Hontoria), sourced shell masses beyond the
  headline guns, and per-nation dock/throughput sources. A future pass can
  upgrade a `DOCTRINE_TEMPLATE` starter to `HISTORICAL_RECONSTRUCTION` and a
  label from `ESTIMATE` to `VERIFIED` without changing the profile shape.
