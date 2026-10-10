# ADR-0089: National naval profiles (NationNavalProfile)

## Status

Accepted 2026-10-10. Builds on ADR-0088 (opening ship types) and the opening-roster calibration; implements
`docs/ships-nation-orientation.md` phase 1-2 for two contrasting nations (United Kingdom, France).

## Context

The opening roster made every nation share one global component catalogue and one global classification ruleset.
Nation data existed (`content/production/1880/countries.yaml`: identity, doctrine, shipDesign, ai, economy) but was
**dropped at compile time** — `NationState` carried only name/tag/isPlayable, and `ShipContext.capabilities` /
`restrictedShipTypes` were never populated. The campaign AI was a stub (fund existing projects, randomise research
fields) and the ship-design AI was nation-agnostic (a global archetype table). A nation could not be recognised from
the fleet it built.

## Decision

1. **One platform-independent domain model** (`packages/ship-design/src/nationProfile.ts`): `NationNavalProfile`,
   date-banded (`activeFrom`/`activeUntil`, `resolveNavalProfile`), with an explicit split between **hard capability**
   (`HardCapabilities`: calibre/armour/torpedo ceilings, hull forms, plants, restricted types, capability grants) and
   **soft doctrine** (`SoftPreferences` and `DoctrineProfile`: speed-vs-armour, endurance, risk tolerance, colonial
   weight, torpedo-on-cruisers, engagement range, HE/AP preference). The model also carries `IndustrialProfile`
   (build-time/cost/reliability/variance multipliers and a date-banded displacement ceiling), `ResearchPreference[]`,
   `ComponentAccess`, gun models, ammunition patterns, component variants, role-specific `DesignWeights`,
   `ProcurementPolicy`, `NamingPolicy` and per-value `Provenance`.
2. **Hard capability can only restrict; it can never widen the global rules.** `catalogueForNation`
   (`componentVariants.ts`) derives a nation's catalogue from the shared one by dropping `UNAVAILABLE` families,
   enforcing the calibre ceiling, and overlaying national models — it never adds a component the shared catalogue
   lacks. Global classification (`classRuleFailures`, `evaluateShipTypeAvailability`) stays authoritative; the
   profile only supplies `capabilities`/`restrictedShipTypes` inputs. This is guarded by tests.
3. **Shared families, national models** (`componentVariants.ts`): a family is a `components.yaml` entry; a
   `GunModelDef`/`ComponentVariantDef` overlays a bounded field set (`lintVariantOverrides`). Guns are kept separate
   from their **mount** (`MountType`: turret/barbette/casemate/deck/broadside/tube) and their **ammunition pattern**
   (`AmmunitionPatternDef`, with `preferredAmmunition` picking by doctrine bias), so the same 6-in gun in a casemate
   and a turret are distinct national items.
4. **National identity changes AI evaluation, not just names** (`nationalDesignPolicy.ts`): `scoreDesign` is a
   weighted utility over ship facts using role-specific weights; `rankCandidatesForNation` orders candidates;
   `varyDesignWeights` applies a bounded ±10% variation seeded by campaign (`national-identity:<nation>:<type>`);
   `planProcurement` turns the profile's shares and build order into a deterministic, budget-respecting procurement
   order. All integer, all deterministic.
5. **Content + validation.** Profiles are authored in `content/production/1880/ship-building/naval-profiles.yaml`
   (with the shared families it overlays), validated structurally by `NationNavalProfileSchema` (strict Zod, in
   `content-schema`) and semantically by `validateNavalProfiles`/`lintNavalArms` (references, date ranges, modifier
   bounds ±15%, design-weight coverage, procurement completeness, provenance, no release placeholder). A
   `Nation × Ship Type × Year × Budget` matrix test (108 cells) proves legality, role classification, dock fit,
   affordability monotonicity, determinism and cross-nation differentiation.
6. **UI honesty**: `nationProfileBrief` derives a player-facing brief (doctrine, industrial strengths and
   limitations, obligations, imported/licence-built components, starter philosophy) rendered by
   `NationalIdentityPanel`; it never restates a number the model already holds.

## Alternatives considered

- *Duplicate the component catalogue per nation.* Rejected: unmaintainable and hides the shared-family structure.
- *Per-nation hard-coded engine branches.* Rejected: it would let national modifiers bypass global classification.
- *A new package for national identity.* Rejected (ENGINEERING-CONTRACT: no speculative packages); ship-design
  already owns components, classification and the design AI, so the model lives there.
- *Make soft preferences hard gates.* Rejected: the brief requires preferences to guide, not block; a legal design
  must stay legal under every profile.

## Consequences

- `NW` deployments: the profile is optional; `environmentFor(month)` (no nation) is unchanged, so existing packs,
  fixtures and reference designs compile identically. `environmentFor(month, nationId)` applies the national
  catalogue and adds `ShipContext.navalProfile`.
- `starterFor`/`buildShipTypeRoster` take an optional `nationId`; omitted, the previous nation-neutral choice holds.
- New content: two profiles and six French starters were added; `redoutable_1878` became France's B starter.
- Deferred (documented in the research note): moulded depths, French yard capacities, the French 16 cm Mle 1887 gun
  values, and the exact canonical research-field enum for fields outside those already used. Cost/build-time
  multipliers, dock progressions and AI weights are labelled BALANCE TARGET.
- No save-format change: the profile is resolved from content, not persisted on `NationState`.

## Migration

No save or wire-format change. Older packs without `naval-profiles.yaml` continue to load (the collection is
optional); the production 1880 pack now includes it.
