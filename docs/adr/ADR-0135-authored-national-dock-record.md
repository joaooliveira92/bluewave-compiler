# ADR-0135: Authored national dock record (distinct from the production ceiling)

## Status

Accepted (2026-10-12).

## Context

DESIGN-16 section 4 makes the national dock the hard limit on the largest hull a
nation may build, repair, rebuild or convert, and section 4.1 requires every dock
to declare four explicit mass limits: "A missing limit MUST fail with
`DOCK_LIMIT_MISSING`. The implementation MUST NOT copy another limit implicitly."
The reference manual agrees ("You cannot build ships larger than your current dock
size", BUILDING SHIPS, printed pp32–33).

The domain model (`@bluewave/ship-design` `dock.ts`) existed but was unwired, and
its only constructor (`dockRecordFromCeiling`) projected a single ceiling across
all four limits — exactly the implicit copy the design forbids. SB-3 `INC-5` first
bound the ceiling from the naval profile's industrial
`maxPracticalDisplacementKg`, but that is a **production/throughput** figure, not a
dock: at 1880 it is 10,000 t for the UK while the real `des_gbr_inflexible` is
10,886 t, so the binding refused a legitimate domestic order and was reverted
(`INC-5c`).

## Decision

1. **The dock is authored content, not derived.** Each naval profile gains a
   `dock` block (`NationNavalProfile.dock`) with the four explicit mass limits, an
   optional dimension predicate, and a provenance block. The values are grounded
   in `docs/research/1880-national-dock-capacity.md`: the largest hull the nation
   fields in the scenario (historical flagship or scenario starter), rounded up to
   the manual's next 1,000 t dock step.
2. **No implicit copy.** `dockRecordFromCeiling` is removed; `dockRecordFromDefinition`
   reads each limit explicitly (a missing one stays absent so `missingDockLimits`
   fails with `DOCK_LIMIT_MISSING`), and `dockRecordFor(profile)` projects the
   authored block to a complete `DockRecord`.
3. **Enforcement at order time.** `constructionOrderEligibility` refuses a domestic
   new construction whose compiled displacement exceeds the nation's dock with
   `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT` (and `DOCK_LIMIT_MISSING` when the dock is
   incomplete). A pack with no profile keeps nation-neutral orders unchanged. The
   per-yard `YardDemand` fit (SB-1) is unchanged and composes with it.
4. **The dock is materialised into campaign state.** `NationState` gains an optional
   `dock` (plain numbers, no ship-design type dependency); once present it overrides
   the content-derived dock, which is the hook dock expansion mutates. It is absent
   by default, so existing snapshots and golden hashes are unchanged.
5. **The completeness gate admits the nation's own hulls.** `validateNationCompleteness`
   fails an opening design that exceeds its nation's dock (`NATION_STARTER_EXCEEDS_DOCK`),
   so a mis-authored dock cannot silently lock a nation out of its own designs.

## Consequences

- The manual's dock rule is enforced against an authored, sourced figure instead of
  a mis-used production number; the UK dock (13,000 t) admits `des_gbr_inflexible`
  (10,886 t) and its scenario starter (12,679 t) while refusing an oversized hull.
- DESIGN-16 section 4.1's "no implicit copy" rule is honoured in code and pinned by
  `packages/ship-design/test/dock.test.ts`.
- Dock expansion (SB-3 `INC-6`) has a persisted home; it is recorded as deferred,
  not dropped.

## Alternatives considered

- **Keep `maxPracticalDisplacementKg` as the dock.** Rejected: it is a production
  figure and refused real domestic ships (`INC-5c`).
- **Derive the dock from the largest global `Facility`.** Rejected: the three
  facilities are a shared reference environment, so every nation would get the same
  30,000 t ceiling and the check would be a no-op.
- **Store the dock on the construction project.** Rejected: the dock is a nation
  property that dock expansion mutates, not a per-order term (unlike the pricing
  ADR-0090 persists).
