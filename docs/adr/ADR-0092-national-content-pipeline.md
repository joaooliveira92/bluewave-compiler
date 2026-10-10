# ADR-0092: National content-production pipeline

## Status

Accepted 2026-10-10. Extends ADR-0089/0090/0091 (profile model, runtime integration, live procurement).

## Context

The UK and France vertical slices proved the model and runtime, but adding a nation still meant hand-authoring a large
profile, six starters and provenance by hand, with no scaffold, no single completeness gate and no explicit
requirement that every material value be sourced or classified. The goal is to make adding a nation a **researched
content task**, not recurring domain/phase work.

## Decision

1. **A scaffold generator** (`scripts/new-nation.mjs`) writes a *draft* `NationNavalProfile` skeleton and a research-note
   stub under `docs/nations/` and `docs/research/` — never into release content — with every value a `PLACEHOLDER`.
   Because release validation rejects placeholders and missing provenance, generated content cannot reach release
   unfilled.
2. **Provenance policy.** `Provenance.sourceStatus` ∈ `VERIFIED | DERIVED | ESTIMATE | BALANCE_TARGET | PLACEHOLDER`;
   a `SourceReference` may carry `sourceId`/`section`; `Derivation` may carry explicit original/converted value+unit
   aliases; `Provenance` may carry a `note`. Release validation rejects `PLACEHOLDER` values and missing sources;
   `ESTIMATE` and `BALANCE_TARGET` are permitted but are never presented as measured history (the provenance `kind`
   separates `historical_fact` from `game_conversion`/`balance_adjustment`).
3. **A national completeness validator** (`@bluewave/ship-design`'s `nationCompleteness.ts`) proves a release nation
   has: a resolvable opening profile, complete hard/doctrine sections, valid component references, non-overlapping
   ordered date bands and valid variant dates, six legal classified opening designs (B/CA/CL/DD/KE/AMC) that are
   their own type and fit a dock and the standard opening budget, a viable procurement path per role group, and no
   release placeholders — deterministically. Reference designs are classified exactly one of
   `HISTORICAL_RECONSTRUCTION | HISTORICALLY_INSPIRED | DOCTRINE_TEMPLATE | BALANCE_TEMPLATE`.
4. **Germany** is implemented as the third slice entirely through this pipeline and the existing runtime — no
   nation-specific phase-engine conditional was added.

## Alternatives considered

- *Generate directly into `naval-profiles.yaml`.* Rejected: partial generated content could reach release; a draft
  area plus a release gate is safer.
- *A new taxonomy of provenance statuses per file.* Rejected: one vocabulary shared by domain and schema (ADR-0089)
  is simpler and test-enforced.
- *A nation-specific procurement branch for Germany.* Rejected: the profile data (weights, shares, access) already
  expresses the difference; a conditional would violate the "no `if nationId === ...`" rule.

## Consequences

- Adding a nation is: `node scripts/new-nation.mjs <id>` → research → replace placeholders → move the profile block →
  author six classified starters → run `nationCompleteness` → run the gate.
- Germany ships with a full profile, shared-family gun models/variants and six classified starters (B is the
  historical Sachsen; the rest are `DOCTRINE_TEMPLATE`).
- No new nations beyond Germany; global classification, access, AMC and order rules are unchanged.
