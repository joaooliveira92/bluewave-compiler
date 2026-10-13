# Building-ships process: manual-parity map

## Destination

A production-ready spec — handed to spec-creator → `to-tickets` → implement — that brings
the app's **building-ships** process into line with the authoritative reference
`docs/manual.pdf`: **BUILDING SHIPS** (printed p30–33) and **APPENDIX 1** ship-type
definitions (printed p131–134). Scope is the app's playable **EARLY** era band; later-era
constructs are recorded as deferred tickets; the effort is **delta-only** over SB-1/SB-2
(`.scratch/ship-building/`).

## Notes

- **Domain:** naval construction — design classification, order/batch, funding, halt/delay,
  acceleration, docks, shipyard capacity, foreign yards, rebuild.
- **Reference is authoritative:** `docs/manual.pdf`. Where the app's normative rules specs
  (`docs/rules/ship-classification.md` DESIGN-22, `docs/rules/construction-repair-and-rebuild.md`
  DESIGN-23, `docs/rules/ship-design.md` DESIGN-21) or code disagree with the manual, resolve
  the disagreement and record the outcome — ADR when hard to reverse / surprising / a real
  trade-off; glossary when vocabulary shifts.
- **Standing preferences:** manual authoritative; match mechanics, not UI; EARLY band;
  delta-only over SB-1/SB-2; production-ready means end-to-end including the player surface;
  no fabricated values — every value from the manual or a cited source, else PLACEHOLDER.
- **Skills per session:** `grilling` + `domain-modeling`; `research` for research tickets;
  `to-spec` at hand-off.
- **Tracker:** local markdown (`docs/agents/issue-tracker.md`).
- **Citation caution:** use **p131–134** for APPENDIX 1 (verified against the PDF bookmark tree);
  the pre-existing `docs/research/rtw3-official-manual-ship-rules-and-1890s-history.md` cites it
  at p133–135 (off by +2).

## Decisions so far

<!-- one line per resolved ticket: name, gist, link -->

- [Manual ship-type definitions reference](issues/01-manual-ship-type-definitions-reference.md):
  Appendix 1's eleven types tabulated with exact bounds (p131–134); tech-scaled maxima are
  unscheduled BALANCE TARGETs.
- [Manual building-ships reference](issues/02-manual-building-ships-reference.md): the BUILDING
  SHIPS rules captured p30–33 (instalments, halting, acceleration, batch 1–12, rebuild list,
  docks, capacity, foreign yards); no numeric constants in the manual for the industry modifier,
  acceleration count, dock multiplier, impoundment probability, or mothball cost base.
- [Fidelity and deviation policy](issues/03-fidelity-and-deviation-policy.md): DESIGN-21/22/23
  stay normative, amended by ADR (ADR-0095); the manual is the intended-behaviour reference;
  deviations recorded (ADR-0067 precedent); richer-than-manual depth kept; hand-off is a sprint
  spec + ADRs; `pnpm check` + determinism is the bar; EARLY band confirmed.
- [Classification fidelity to Appendix 1](issues/04-classification-fidelity.md): EARLY-band
  classification already matches the manual for all implemented types; deviations live in
  ADR-0067/0088; only new item is a DESIGN-22 §9 annotation for the 2000 t gap-fill. BC, the
  carriers, SS/MTB/TR and era-scaled CL/CV maxima are deferred with later bands.
- [Work, payment, halt and delay](issues/05-work-payment-halt-and-delay.md): the manual's monthly
  instalment is the existing per-package payment (DESIGN-23 §6) — no separate schedule; add
  `HALTED`/`DELAYED` statuses (§7, zero work/charge, halted carrying cost = half the mothballed
  maintenance), a halt/resume command, and a status-enum migration; mothball cost base is a
  PLACEHOLDER constant.
- [Acceleration and capacity pressure](issues/06-acceleration-and-capacity-pressure.md): DESIGN-23
  §8–9 already reproduces the manual's 10% faster / +5% cost (`10_500`/`11_000` bp); the "limited
  number" is the §9 capacity-pressure delay, not a count cap; move acceleration into the phase engine
  with a `SetAcceleration` command.
- [Class-order batch and naming](issues/07-class-order-batch-and-naming.md): implement DESIGN-23 §3–5
  — `OrderConstructionCommand` of 1..12 ships of one compiled design version, reservations before any
  project, a deterministic per-nation naming policy; >12 rejected.
- [Dock size and shipyard capacity](issues/08-dock-size-and-shipyard-capacity.md): the manual's dock
  mechanics already live in DESIGN-13 §4–6 (dock ceiling + `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`, 12-month
  expansion with 1000–2000 t era steps, private seeded expansion); add the manual's national concurrency
  cap (`shipyardCapacityMultipleBp × dockSize`, BALANCE TARGET) with rebuilds/AMC/corvettes excluded and
  submarines counted, alongside DESIGN-13 §7's work pools.
- [Foreign-yard construction](issues/09-foreign-yard-construction.md): the manual's foreign-yard
  properties map one-to-one onto DESIGN-13 §13–14 (builder dock limit, war-effects impoundment by
  tension, treaty delivery guarantee, tech-insight research points); implement as written.
- [Rebuild parity](issues/10-rebuild-parity.md): the rebuild suite maps onto the refit kinds
  (machinery, fire control, armour edits already done via tickets 21/28); add a `BULGE` action and
  armament-change validation; defer CV/CVL conversion and BC→BB reclassification; cross-check that
  design revisions use the manual's p27 limits.
- [Player-facing building-ships flow](issues/11-player-facing-building-ships-flow.md): the
  Construction screen + Drawing Board surface the batch order dialog, instalments, halt/resume,
  accelerate, a dock/capacity panel and foreign-yard ordering, with the `pnpm snap` + aria + e2e bar.

## Status

All decision tickets are resolved and the route to the destination is clear: the app's normative
rules docs (DESIGN-13/22/23) already encode the manual, so the spec is a **fidelity-verified
implementation plan** over SB-1/SB-2 — implement the specified-but-unbuilt mechanics (halt/delay,
batch ordering, engine acceleration, dock ceiling/growth, national capacity, foreign yards, bulges
and armament-change validation) plus the player surface. Hand off to `to-spec` → `to-tickets`.

### Implementation progress (2026-10-12)

- **Reachability wired end-to-end** (the sprint's first priority): `placeConstructionBatch`,
  `authorizeDockExpansion`, `placeForeignConstructionOrder`, and the halt/resume/`SetAcceleration`
  commands are reachable through the command registry (`packages/commands`) and the desktop main
  bridge, each proven by a `MonthExecutor` dispatch test and/or a desktop `commitMonth` round-trip.
- **INC-10** foreign war effects + impoundment + delivery guarantee landed and wired into the monthly
  appropriation.
- **Review debt:** INC-9f reason codes and INC-9e guards landed; the duplicated order guards/cost
  resolution refactored; the ship-dimension deferral recorded with owner `INC-16`.
- **Player surface:** Construction halt/resume/accelerate controls (INC-3b partial, INC-4b) landed
  with render tests, `pnpm snap` and a `construction-steering` e2e.
- **Remaining frontier:** cost/time readouts (INC-3b), dock/capacity/batch/foreign surfaces
  (INC-5b..INC-9b), rebuild surfaces (INC-12b/INC-15b), builder priority (INC-9c), and INC-11
  (blocked on content-technology materialisation; owner `.scratch/content-runtime-integrity/`).
- **INC-3c** status-aware construction readout landed: held/delayed/impounded/on-hold rows report the
  schedule unavailable with the reason (never a misleading instalment/launch), and foreign rows derive
  their instalment/launch from the contract schedule; golden/determinism unchanged.

### Deferred player surfaces closed (2026-10-13)

- **INC-9b** foreign-builder surface landed on the Construction screen's build dialog: a new read-only
  `previewForeignConstruction` engine projection (candidate builders, dock ceiling, free `NEW_CONSTRUCTION`
  capacity, §13.2 capability verdict, tension-scaled impoundment risk, delivery-guarantee status) behind a new
  `previewForeignConstructionCommand` bridge command, a `ForeignContractPanel`, and `previewForeign`/
  `placeForeignOrder` in `useConstructionScreen`. Render tests, an e2e (`construction-foreign`) and a `pnpm snap`
  of the dialog with `Builder = French Republic` back it.
- **INC-12b / INC-15b** rebuild surfaces were already delivered by the shared design-workspace `RebuildPanel`
  (BULGE blister mass + protection/speed projection, armament change, standard rebuild; no CV/CVL or BC→BB
  conversions); the tickets are marked resolved against it rather than deferred.



## Not yet specified

- **Era-threshold content:** exact values and period bands for DD/CL/CV maximum-displacement
  growth, the BC speed rise, and the CA→heavy-cruiser morph the manual notes. Graduates from
  "Classification fidelity to Appendix 1".
- **Dock-growth content:** period bands and per-step tonnage (1000–2000 t) and the
  private-shipbuilding auto-increase trigger. Graduates from "Dock size and shipyard capacity".
- **Naming content:** ship/class name pools and uniqueness policy for batch auto-naming.
  Graduates from "Class-order batch and naming".
- **Foreign-yard resolution detail:** impound timing, treaty-delivery guarantee, and the
  technology-insight transfer. Graduates from "Foreign-yard construction".
- **AI consumption of ship type:** the manual says "the AI relies heavily on ship type" — how
  far AI decision-making must be type-driven. Unclear until classification fidelity resolves.
- **Treaties vs classification/docks:** displacement and tonnage-cap interaction (may belong to
  a separate diplomacy effort).
- **Submarines and coastal artillery** built "like ships" in the same manual span — whether this
  map reaches them or they stay with the existing `c3-m3-submarines` / `c4-m3-coastal-defenses`
  efforts.

## Out of scope

- **Rebuilding the design/drawing-board model** — SB-1/SB-2 (`.scratch/ship-building/`) own it;
  this map verifies rather than rebuilds.
- **Cloning RTW3's UI** — mechanics are matched, not screens.
- **Later-era constructs beyond the EARLY playable band** — dreadnought BB/BC evolution, carriers
  and CV conversions, missiles, helicopter AV; recorded as deferred, not built here. Includes the
  **BC predicate, BB↔BC armour-index precedence, and the manual ↔ DESIGN-22 §12 BC speed
  divergence** (ticket "Classification fidelity to Appendix 1").
- **DESIGN-23 latent defects, scrapping/salvage, treaty inspection** — beyond the manual's
  BUILDING SHIPS span.
- **DESIGN-21 design-study/similarity** beyond what batch and repeat orders require.
- **Submarine and coastal-artillery design** — separate efforts.
