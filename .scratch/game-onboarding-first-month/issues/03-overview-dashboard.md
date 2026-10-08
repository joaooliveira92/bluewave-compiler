**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec §6 (Overview Dashboard) of [01-diagnosis.md](../01-diagnosis.md).

Decide the Overview dashboard's composition for Milestone 2:

1. **Header summary, Naval Position, Foreign Situation panels** (§6.2):
   cross-check each listed field against the real domain facts gathered
   during charting (Treasury's aggregate `treasury`/`income`/`expenses`/
   `maintenanceCost` fields; Fleet's `name`/`designId`/`status`-only model
   plus a design-catalog join for hull/displacement; Diplomacy's real
   `tension`/`relation` fields, now including read-only war/blockade state
   per the map's Notes). Cut or reshape any field the real data can't back,
   same discipline as the rest of this map.
2. **Immediate Priorities panel**: this ticket only decides *how the panel
   presents* priority cards (layout, "up to five sorted by severity",
   empty state) — the underlying priority *system* is
   [its own ticket](./04-immediate-priorities-engine.md). Don't redesign the
   priority engine here; treat its `StrategicPriority` shape as given.
3. **Recent Developments panel** (§6.2): decide what "chronological list of
   changes from the most recently resolved turn" actually draws from —
   likely the Monthly Naval Estimates report's entries (see
   [Monthly report](./15-monthly-naval-estimates-report.md)) rather than a
   separate feed. Confirm no separate report-independent implementation is
   needed.
4. **Empty states** (§6.3): confirm the doc's example copy is usable as-is
   or needs adjusting once real field availability (from item 1) is known.

## Notes for the resolving session

- This ticket can proceed without waiting on the Priorities/Treasury/Fleet/
  Diplomacy tickets to close — it only needs to reference their *already
  known* real data shapes (captured in the map's Notes), not their finished
  screens. Flag (don't silently assume) if a later ticket's answer
  invalidates something decided here.

## Answer

**Correction to the map's Notes before proceeding**: the map describes Fleet
as "`name`/`designId`/`status`-only." Verified against
`packages/campaign/src/state.ts:6-22`, this is inaccurate — the real `Ship`
type has **no `status` field at all**, but *does* carry `classId`,
`firepower`, `armor`, `speed`, `constructionProgress`, and
`isUnderConstruction` directly (no join needed for those). Only hull
type/displacement require the design-catalog join
(`snapshot.designs.get(designVersionId) → design.hullType`). Flagging per
this ticket's own instruction; the map's Notes should be corrected.

### 1. Header Summary, Naval Position, Foreign Situation

All fields from doc §6.2 are kept, with these reshapes:

- **Player appointment title** → repurposed to the real persisted
  `admiralName` field (Milestone 1 identity). No "appointment title" concept
  exists anywhere in the domain; `admiralName` serves the doc's intent
  (identify who's in command) without inventing new state.
- **Fleet strength summary, active construction project count, highest
  foreign tension** (header) — none are backed by an existing aggregate
  field; all three are derived fresh. This ticket decides *that* they're
  derived and *what* they summarize; the derivation itself belongs to the
  projection-builder ticket (Ticket Group B).
- **Total monthly maintenance** (Naval Position) — `NationState.maintenanceCost`
  is documented as always `0` before the first `commitMonth`, making it
  unreliable at the exact moment Overview first matters. Reuse the
  re-derivation pattern `OpeningBriefingProjection.treasury` already uses
  (compute `fleetMaintenance` fresh from ships) rather than reading the raw
  aggregate.
- **Largest available dock** (Naval Position) → renamed to **"Largest port
  capacity"** (or equivalent non-"dock" wording). No real dock entity exists;
  this is the same approximate port-`level` proxy already reused elsewhere
  in the engine (`largestDockCapacity`, `PlayerProjection.economy.shipyardCapacity`).
  Kept, but relabeled to stop implying a domain concept that doesn't exist —
  same discipline as the shell ticket's `foreign-relations` → `diplomacy`
  rename.
- **Relations label** (Foreign Situation) — the label taxonomy
  (cordial/neutral/strained/hostile/war-imminent) doesn't exist yet; it's
  [Diplomacy tension-threshold policy](./11-diplomacy-tension-threshold-policy.md),
  currently open. This panel is specified **as depending on** that ticket's
  output — name the field, describe it as "the label the threshold-policy
  ticket defines" — rather than inventing a shadow taxonomy or dropping the
  field. Real blocking relationship; should be wired as a native blocking
  edge.
- **Tension trend** ("increased/decreased/unchanged since previous month")
  → **cut**. No previous-turn tension is stored anywhere (only current
  `tension` on `DiplomaticRelation`); adding a `previousTension` field is
  persisted-state/save-schema surface area not worth spending against this
  milestone's "prove the strategic loop" goal for a trend arrow. Left as a
  future-milestone candidate, not a new ticket now.

### 2. Immediate Priorities panel presentation

Doc's shape accepted as-is: card list (title/summary/severity
badge/`destination` link), hard cap at 5, sorted by severity per the given
`StrategicPriority`/sort rules (ticket 04's concern), no pagination, doc's
empty-state copy verbatim ("The Admiralty has identified no urgent
concerns."). Per-severity visual treatment (color/icon) is implementation
detail, not a spec decision.

### 3. Recent Developments source

Confirmed: draws from the Monthly Naval Estimates report's entries (see
[Monthly report](./15-monthly-naval-estimates-report.md)) — no separate
report-independent activity-feed concept exists anywhere in the codebase
(`packages/phase-engine`'s only related primitive is the single
`"ConstructionProgressed"` event type). Specified as an explicit forward
dependency: "renders the most recently resolved turn's report entries,
exact entry shape TBD by ticket 15" — the *source* is decidable now (this
ticket's job); the report's precise entry shape is legitimately ticket 15's
job, not a blocker here.

### 4. Empty states

Doc's four example empty states stand as-is ("no active construction," "no
monthly developments," "no immediate priorities," "no foreign relations").
No new empty state is needed for the cut tension-trend indicator (it was a
per-relationship inline detail, not a standalone region — it simply doesn't
render). No empty state needed for a portless nation either — no code path
produces one; every nation has a home port by construction.
