# ADR-0088: Opening ship types, availability policy and engine-side enforcement

## Status

Accepted 2026-10-10. Builds on ADR-0063 (component-level compiler), ADR-0066 (SubmitDesign) and DESIGN-22.

## Context

The campaign opens in January 1880, in the pre-dreadnought era. Before this change:

- `compileDesign` classified a design only when its category was one of five `EARLY_SHIP_TYPES` (`BB B CA CL DD`). Any
  other category string was **silently left unclassified and legal**, so a command, an imported file or a stale UI could
  carry a `BC`, a `CV` or a made-up type to construction. `BB`, the dreadnought-style battleship, was classifiable and
  buildable with no technology gate.
- `KE` (corvette / colonial gunboat) and `AMC` (armed merchant cruiser) are in the DESIGN-22 registry but had no
  predicates, hull form or starter design.
- The main process mapped a category to an engine hull type with `?? "coast_defense_ship"`, so a new type would have been
  filed as a coast-defence ship; the engine trusted the hull type the command named.
- A construction order revalidated nothing and no fleet limit existed for auxiliaries.
- A failed classification was reported as one summary sentence, not as one finding per rule, so no failure could be
  shown next to the control that fixes it.

## Decision

1. **One registry, owned by the domain** (`packages/ship-design/src/shipTypes.ts`, `shipTypeData.ts`): the 14 DESIGN-22
   ids as a closed union, with category, roles, description, recommended use, weaknesses, relative cost and build time,
   torpedo policy, auxiliary flag, required hull trait and an availability requirement. Numeric limits stay in
   `ClassificationRules` (`classificationRules.ts`); the player-facing envelope is **derived** from them
   (`shipTypeEnvelope`), so the UI never restates a number.
2. **One availability policy** (`shipTypeAvailability.ts`, `evaluateShipTypeAvailability`): era band, technology,
   nation capability, scenario restriction and "mechanics implemented", each failing with a stable code
   (`SHIP_TYPE_UNREGISTERED`, `_ERA_NOT_REACHED`, `_TECHNOLOGY_REQUIRED`, `_CAPABILITY_REQUIRED`,
   `_MECHANICS_NOT_IMPLEMENTED`, `_RESTRICTED`, `AMC_FLEET_LIMIT_EXCEEDED`, `AMC_FAST_LIMIT_EXCEEDED`). Messages are
   generic and never name a technology (fog of war).
3. **The compile is the gate.** `compileDesign` evaluates availability first; an unavailable or unregistered type is a
   BLOCKING finding (never a throw), so `SubmitDesign` at apply time, the main-process pre-check, ReviseProject and the
   Drawing Board all refuse it for the same reason. `validateDraftShape` additionally refuses an unregistered category at
   command issue and when a design file or edit log is decoded.
4. **Opening roster:** `B CA CL DD KE AMC`. `BB` needs `sd_dreadnought_design` (1906) and `BC` stays locked because its
   predicate (era speed schedule, armour-index precedence) is not implemented; `CV CVL AV SS MTB TR` are locked because
   their mechanics are not in this designer. `BB` keeps its predicate so a three-turret big-gun design is recognised as
   one and reported as a mismatch instead of passing as a `B` or `CA`.
5. **Rules.** KE and AMC predicates follow DESIGN-22 sections 14-15 (precedence: AMC before CL/DD/KE, the merchant-hull
   rule 10). Where DESIGN-22 is silent the following **versioned gameplay constants** apply (`ClassificationRules`,
   constants documented in place): DD may not mount a gun above 6 inches of any role (`ddMaxGunUm`; cruiser-scale
   weapons), a CL may not carry a belt above 2 inches (`clBeltMaxUm`; a belted cruiser is a CA), KE and AMC read the
   largest gun of **any** role (DESIGN-22 says "maximum gun caliber"; the old facts read only `MAIN_GUN`, so an 8-inch
   `SECONDARY_GUN` passed). Every failed rule is its own BLOCKING finding with a stable code, the affected setting group
   and a suggested correction, next to the `INTENDED_CLASSIFICATION_ILLEGAL` summary. A CL with no armour deck is a
   WARNING, an AMC an ADVISORY, a KE that cannot take colonial service an ADVISORY (`colonialService.ts`).
6. **Merchant hull.** Hull forms may carry `traits: [merchant_derived]` (content-schema); `merchant_liner_form` is the
   first. AMC requires it.
7. **Hull type is the type's own.** `HULL_TYPE_FOR_SHIP_TYPE` is the single mapping; the main process has no fallback
   and the engine's `applySubmitDesign` rejects a command whose `hullType` is not the mapped one. The combat classifier
   and construction labels gained the new families (`pre_dreadnought`, `armoured_cruiser`, `protected_cruiser`,
   `corvette`, `armed_merchant_cruiser`).
8. **Construction orders** (`phase-engine/src/constructionOrder.ts`, `orderEligibility.ts`): `placeConstructionOrder` is
   the only function that adds a new-ship project to a snapshot, and it is platform-independent. It checks that the design
   exists and belongs to the nation, recompiles a design made from a draft under today's rules (a component made
   obsolete, a ruleset change, a tampered stored draft or a missing content pack refuses the order), and applies the AMC
   limits (decision below). The desktop main process only supplies the session snapshot and content, reserves money and
   persists the returned snapshot; it holds no gameplay rule and no longer exports a way to add a project without the
   policy. Submit and replace both go through it, so both entry points share one check.
9. **Starter designs** are reference designs with `starterFor: <type>` in `reference-designs.yaml`, compiled by the same
   pipeline (`buildShipTypeRoster`). `B` and `DD` reuse historical designs; `CA`, `CL`, `KE`, `AMC` and an 1880 `DD` are new
   and labelled as non-historical estimates.
10. **UI:** a "Ship types" panel (progressive disclosure, grouped by category, availability and cost/time as text) and a
    Brief selector offering only available types. Locked types are omitted (the application convention); one line says
    more arrive with later eras.

## AMC fleet limit (decision record)

**Provenance.** The rule is not new: DESIGN-22 section 15 (`docs/rules/ship-classification.md`) fixes "total active AMC
count no more than 20 % of active commissioned cruiser count, rounded down, minimum allowance 2; fast AMC count no more
than 25 % of active AMC count, rounded down, minimum 1; fast = designed speed at or above 22 knots", states these are
fleet authorisation limits applied to the construction order, and section 26 names the reason code
`AMC_FLEET_LIMIT_EXCEEDED`. The RTW3 manual figure for fast AMC liners (up to 25 kn, p. 135) is in
`docs/research/rtw3-official-manual-ship-rules-and-1890s-history.md`. The values live in `ClassificationRules`
(`amcFleetShareBp 2000`, `amcFleetMinAllowance 2`, `amcFastShareBp 2500`, `amcFastMinAllowance 1`,
`amcFastSpeedUms 22 kn`) and are read from `ShipBalance.classification` when a pack sets it, so a ruleset can change them.

**Definitions DESIGN-22 leaves open, decided here** (`auxiliaryFleetCounts`):
- *Cruiser:* a ship of hull type CA or CL (including the authored `heavy_cruiser` / `light_cruiser` labels). BC, B, DD,
  KE and AMC do not count.
- *Active commissioned:* operational (`isShipOperational`): launched and not made unavailable by a rebuild. A hull still
  building and an unavailable ship are not counted. The engine has no reserve or mothball state; if one is added it must
  be excluded here.
- *AMC counted:* every AMC of the nation, commissioned or in an unfinished new-construction project, whatever its
  availability, so queueing several cannot exceed the limit before any launches. A project being replaced is excluded.
- *Applies to:* a new construction order only. It is not a classification predicate (a design still compiles).
- *Losses:* a fleet that falls above the allowance because cruisers were lost keeps every ship; only new AMC orders are
  refused until the count is back under it. Nothing is scrapped or reclassified.

## Auxiliary contract of the AMC (what the simulation does today)

| Area | Behaviour | Source |
|---|---|---|
| Construction | order refused above the limits; counted while queued | this ADR |
| Combat strength | classified `AMC` by hull type `armed_merchant_cruiser`; the fire model has an AMC constant | `combat/tactical/shipType.ts`, `damage/fireConstants.ts` |
| Fleet organisation | may serve in PATROL and INDEPENDENT division roles only, never CORE, SUPPORT, SCOUT or SCREEN | DESIGN-26 section 14, `roleEligibility` |
| Maintenance | no auxiliary-specific maintenance: it is paid like any ship through its components | not modelled |
| Commerce raiding, trade protection, minelaying | **not simulated**: DESIGN-33 defines them but the campaign has no merchant or raiding state | not modelled |

The UI states the last row as "Not yet simulated" in a type's details and the AMC text promises only patrol and
independent duty. Implementing DESIGN-33 sections 10 and 11 is outside this change.

## Merchant hull data status

No source in the repository gives hull-weight or resistance data for a merchant liner (the only figure is the 25 kn
fast-liner ceiling). `merchant_liner_form`'s hull coefficients are borrowed from `protected_cruiser_form` (PLACEHOLDER in
`hull-forms.yaml`, counted by the release ratchet), and its Admiralty coefficient, form complexity and stability windows
are ESTIMATES in `balance.yaml`. They are isolated as named per-form entries, not code. **The AMC is therefore not
production-ready as a balanced ship**: the rules, enforcement and limits are complete, the numbers behind its hull are not.

## Alternatives considered

- *Keep silent non-classification for unknown types and filter in the UI.* Rejected: that is the defect.
- *Gate the opening roster by the technology tree (protected cruiser 1885, torpedo boat 1882, pre-dreadnought 1893).*
  Rejected: the DESIGN-22 protected-cruiser exception says the EARLY band needs no gate, and 1880 ironclads are class
  `B`; component and plant availability already decide what can be built (a type can be available with no legal design
  yet, which the roster states as "No starter design yet").
- *Make `BB` unclassifiable in the EARLY band.* Rejected: the natural-class mismatch is what stops a disguised big-gun
  ship passing as a `CA`.
- *A new `mercantile` design pipeline for AMC.* Rejected: a hull trait on the existing pipeline is enough.
- *Reuse `heavy_cruiser` for CA.* Rejected: it names the later treaty-era class the opening campaign must not offer.

## Consequences

- An unregistered category is no longer a throw or a silent pass anywhere in the compile; two tests that asserted the old
  behaviour were rewritten (`compile.test.ts` "throws only on corrupt context", `classification.test.ts`
  "categories outside the active band"), and the `torpedo_gunboat` test fixture now uses `DD`.
- Destroyers cannot mount 8-inch secondary guns and cruisers cannot carry a heavy belt: existing authored designs were
  checked (all reference designs compile with no blocking finding at their month).
- KE and AMC at the 1880 start can mount only the 1-inch machine gun (no other gun at or below 6 inches exists before
  1883); this is a content fact, not a rule.
- `merchant_liner_form` coefficients are borrowed from `protected_cruiser_form` (PLACEHOLDER, ratchet 0 to 1) and its
  stability windows and Admiralty coefficient are ESTIMATES; all want research pass 3 (ticket 30).
- AMC combat value, maintenance and fleet organisation as an auxiliary beyond the construction limit and its advisory
  are **not** implemented here; the engine has no auxiliary role to attach them to.

## Migration

No save-format change. Saved designs gain a stricter check: a design file or edit log whose category is not a registered
type is refused with `INVALID_DRAFT` / `SHIP_TYPE_UNREGISTERED` rather than defaulted. Designs already in a snapshot keep
their stored hull type (a pre-existing `coast_defense_ship` still classifies as `B`). A saved CL/DD draft that now breaks
the new gun or belt rule is shown with blocking findings and must be edited; nothing is converted to another type.
