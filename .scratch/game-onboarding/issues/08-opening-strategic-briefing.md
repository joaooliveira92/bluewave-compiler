# Opening strategic briefing

**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec the opening strategic briefing (diagnosis doc step 9) shown once, right
after world generation, before the player reaches the existing (unchanged)
Overview dashboard. Five pages only — Regional Commitments is out of scope
(see map), and the closing choice offers only "Take command" (see map).

Cover, per page, using real existing data sources:
- **Appointment** — templated appointment text per nation/date.
- **State of the navy** — ship-class inventory, using existing Fleet/Overview
  screen data.
- **Treasury position** — monthly estimate breakdown and qualitative status
  (healthy/narrow/deficit/critical), using existing economy data.
- **Foreign intelligence** — per-rival relations/tension/estimated strength,
  using existing `diplomacy.ts` / DiplomacyScreen data; always express
  foreign ship counts as estimates unless intelligence quality is excellent.
- **Immediate concerns** — spec the *categories* of auto-generated concern
  (obsolescence, budget shortfall, understaffed region, near-complete
  construction, etc.) and their display; leave exact trigger
  thresholds/rules as an implementation detail, not a UX decision to pin now.

Also cover the "Take command" closing button and transition into the
existing dashboard.

## Answer

**Structure**: linear 5-page sequence (Appointment / State of the Navy /
Treasury / Foreign Intelligence / Immediate Concerns), Back always
available (returns to the prior page, never exits the briefing), no
skip logic. Generic "Next"/"Back" throughout, except page 1's button
keeps the doc's flavorful "Review Naval Estimates" label (costs nothing,
doc-specific), and page 5's action is "Take command" (closing button,
transitions into the existing unchanged Overview dashboard).

**Page 1 — Appointment**: reuses ticket 01's existing per-nation
appointment title (e.g. "First Sea Lord") and dossier-derived flavor text
verbatim — no new authoring. Shows the scenario's start date (era) as the
date line, filling the gap ticket 01 deliberately left open when it chose
not to show a date on the nation-confirmation screen itself.

**Page 2 — State of the Navy**: ships six fields derivable from real data
via joins already present in the engine — ship-class inventory counts
(`FleetShipView.designId` → design catalog → `hullType` →
`constructionShipTypeLabel`, tallied), ships-under-construction count
(`buildConstructionProjectQueue()`), most-expensive-active-class
(`projectedConstructionOrderCosts()` joined against active ships' designs),
largest-available-dock (`FleetPort.capacity`, an existing
documented-as-approximate proxy), total maintenance expense
(`MonthReport.maintenanceCost`), current construction expenditure
(`MonthReport.newConstructionSpending`). Cut entirely, no fabricated
placeholders: reserve count, overseas count, oldest capital ship (no data
path — no age/date-built field, no reserve/overseas ship states exist
anywhere). "Free monthly balance" also dropped from this page specifically
to avoid duplicating the Treasury page's surplus figure.

**Page 3 — Treasury Position**: shows government allocation, fleet
maintenance, construction spending, and research expenditure (all real:
`MonthReport`, `PlayerProjectionEconomy`, `research.ts`'s `researchBudget`)
plus a projected monthly surplus/deficit. "Other naval expenses" cut
entirely — no computed remainder row, since nothing backs what that
remainder would represent. Qualitative status (healthy/narrow/deficit/
critical) kept as lightweight UI-only threshold logic over the real
projected-surplus number, exact thresholds left as an implementation
detail (same treatment given page 6's concern triggers).

**Page 4 — Foreign Intelligence** (doc's page 5, renumbered after cutting
Regional Commitments): shows only the two real fields per rival —
relations label and tension score (`DiplomacyRelationRow`,
`buildDiplomacyScreenProjection()`). No estimated ship-count row, no
intelligence-quality tiering — both are genuinely new domain concepts
(fog-of-war modeling) with no derivation path, consistent with this map's
pattern of cutting rather than inventing new engine concepts. No
qualitative naval-strength stand-in either — ticket 01's dossier data
describes the player's own nation, not a comparative per-rival assessment,
and stretching it to cover foreign powers was judged too big a reach for
two fields' worth of content.

**Page 5 — Immediate Concerns** (doc's page 6): specs four categories +
display only, exact trigger thresholds remain an implementation detail
(per this ticket's original framing) — obsolescence, budget shortfall,
near-complete construction, low research spending. "Understaffed region"
cut from the category list: it depends on the Regional Commitments /
required-presence domain model, which the map's Out of scope section
already rules out entirely for this effort — keeping it would smuggle
that scope back in.

**Closing**: single "Take command" button (Guided inspection / Delegate
routine administration already out of scope on the map), transitions into
the existing, unchanged Overview dashboard.
