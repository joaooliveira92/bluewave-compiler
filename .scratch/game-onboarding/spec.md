# Spec: Campaign Commissioning Flow

Everything between nation selection and the existing, unchanged strategic
Overview dashboard. Assembled from the eight resolved decision tickets on the
[Campaign Commissioning Flow map](./map.md) (`wayfinder:map`). Source idea:
[01-diagnosis.md](./01-diagnosis.md), a Rule the Waves 3-inspired design doc —
treated as inspiration/reference copy throughout, not a binding spec; several
of its proposals were cut or reshaped (see Out of scope, below).

Domain: Bluewave Compiler, a naval strategy game (`apps/desktop`,
`packages/campaign`, `packages/campaign-engine`).

## Flow order

1. Nation confirmation
2. Rules of the Naval Age (era/scale/uncertainty preferences + presets)
3. Archetype (unchanged)
4. Admiral & Campaign Identity
5. Starting-fleet method
6. Final commissioning review
7. World-generation presentation
8. Opening strategic briefing
9. → existing, unchanged Overview dashboard

Nation now comes first (was step 3 in today's `useNewGameFlow.ts`
preferences → archetype → nation → launch order). The exact state-machine
reorder in `useNewGameFlow.ts` (nation moving to step 1, `NewGameDraft`
gaining a nation field, and precise interleaving of steps 2–5 above) is
implementation work, not pinned by any ticket — left to whoever builds this
spec.

---

## 1. Nation confirmation screen

Evolves the existing `DossierSlidePanel` accordion **in place** — not a new
full-screen route. Same grid-then-panel interaction as today
(`NationSelectionScreen` + `FleetDispatchBoard` + `DossierSlidePanel`).

- **Entry**: nation focused/selected on `FleetDispatchBoard`, as today.
- **Exit**: "Continue as [Nation]" click carries the confirmed nation id
  forward into the flow.

**Header**: `DossierHeader`'s static "Admiralty Intelligence Dossier" label
is replaced by:

> **You have been appointed [Appointment Title]**
> **[Nation Name]**

No date/era shown — era isn't chosen yet at this point in the reordered
flow; the date appears later, in the Opening Strategic Briefing. The "Fleet
record · {countryCode}" subline and `NationEmblem` stay as-is.

**Content model**: all new fields are presentation-only, hand-authored
flavor content (consistent with the existing `nationFlavorText.ts` ADR-0003
pattern) — no engine changes. No nation-level numeric engine data exists to
derive any of this from; if it appears later, budget category/shipbuilding
capacity could migrate to derived values without changing this screen's
contract.

New fields fold into the **existing 3-tab accordion**, no 4th tab:

| Tab | Existing content | New content added |
|---|---|---|
| Economy | flavor paragraph | Budget category, Shipbuilding capacity, Research strengths/weaknesses |
| Military | flavor paragraph | Doctrine, Difficulty rating, Likely rivals |
| Diplomacy | flavor paragraph | Strategic regions, National characteristics |

**Difficulty rating**: fixed per-nation tier, 1 (easiest)–5 (hardest),
cosmetic only. Tracks *complexity of commitments*, not fleet size — a large
navy with many rivals and global reach (UK) is harder to play well than a
small, regional navy (Spain).

**Per-nation content** (all 10 playable nations):

| Country id | Nation | Appointment title | Doctrine | Strategic regions | Budget category | Shipbuilding capacity | Research strengths / weaknesses | National characteristics | Likely rivals | Difficulty |
|---|---|---|---|---|---|---|---|---|---|---|
| `gb` | United Kingdom | First Sea Lord | Global sea control, two-power standard | North Sea, Mediterranean, Indian Ocean, Far East, overseas possessions | Very Large | World-leading | Strengths: capital ship design, naval gunnery. Weaknesses: overstretched budget across theaters | Worldwide deployment burden; public expects naval supremacy | Germany, France, Russia | 5 |
| `de` | Germany | State Secretary of the Imperial Naval Office | Risk fleet, high-seas concentration | North Sea, Baltic | Large | Advanced, fast-growing | Strengths: metallurgy, engine design. Weaknesses: shallow overseas basing network | Rapid industrial expansion; political pressure to rival Britain | United Kingdom, France, Russia | 4 |
| `us` | United States | Chief of Naval Operations | Hemispheric defense, emerging blue-water ambition | Atlantic seaboard, Caribbean, Pacific coast | Large | Advanced, expanding fast | Strengths: industrial capacity, shipyard scale. Weaknesses: limited overseas basing, inexperienced officer corps | Isolationist public opinion; growing two-ocean strategic problem | United Kingdom, Japan | 3 |
| `fr` | France | Chief of the Naval General Staff | Coastal defense plus colonial cruiser warfare | Mediterranean, Atlantic, colonial routes | Large | Advanced | Strengths: submarine and torpedo innovation. Weaknesses: fleet doctrine inconsistency between administrations | Political instability affecting naval policy continuity | Germany, United Kingdom, Italy | 4 |
| `jp` | Japan | Chief of the Imperial Japanese Navy General Staff | Decisive-battle doctrine, regional sea denial | Home waters, Yellow Sea, Western Pacific | Moderate, growing | Developing, rapidly modernizing | Strengths: crew discipline, torpedo tactics. Weaknesses: smaller industrial base than Western rivals | Rapid modernization; strong national naval ambition | Russia, China, United States | 3 |
| `it` | Italy | Chief of Staff of the Regia Marina | Mediterranean coastal defense | Central Mediterranean, Adriatic | Moderate | Developing | Strengths: cruiser and light-forces design. Weaknesses: limited heavy-industry capacity | Constrained budget relative to ambitions | France, Austria-Hungary | 3 |
| `ru` | Russia | Chief of the Naval Staff | Fleet-in-being, coastal and regional defense | Baltic, Black Sea, Far East | Moderate | Developing, uneven | Strengths: numerical manpower. Weaknesses: split fleet across disconnected theaters, industrial backwardness | Political instability; logistically fragmented navy | Japan, Germany, United Kingdom | 3 |
| `ah` | Austria-Hungary | Marinekommandant | Coastal and Adriatic defense | Adriatic Sea | Modest | Limited | Strengths: coastal fortification integration. Weaknesses: minimal blue-water experience | Multi-ethnic empire constrains unified naval policy | Italy | 2 |
| `es` | Spain | Chief of the Naval General Staff | Colonial and home-waters defense | Iberian coast, remaining colonial possessions | Limited | Minimal | Strengths: coastal familiarity. Weaknesses: post-1898 fleet rebuilding from a low base | Recovering from recent naval losses; modest ambitions | France, United Kingdom | 1 |
| `qing` | China (Qing) | Imperial Naval Commissioner | Coastal defense, treaty-port protection | Yellow Sea, coastal treaty ports | Limited | Minimal | Strengths: manpower reserves. Weaknesses: fragmented command, minimal domestic shipbuilding industry | Foreign naval pressure in home waters; weak central industrial base | Japan, United Kingdom | 2 |

**Bottom controls**:
- **Change Nation** — collapses the dossier panel back to grid focus; no new
  navigation/component.
- **Continue as [Nation]** — renamed from "Confirm Selection"; advances the
  flow.
- **Recommended Setup** — applies the "Admiral" preset (§2) plus the default
  fleet method (`generated`, §5), pre-filling the remaining flow while
  leaving every screen still editable. Not a bespoke recommendation engine.
- "Compare Nations" — cut (§Out of scope).

---

## 2. Rules of the Naval Age (preferences + presets)

Replaces today's raw-dropdown `new-game-preferences` screen
(`RulesetOptionsSection`, `ScenarioSection`) with one screen — era, campaign
scale, and historical-uncertainty settings **kept merged**, not split into 4
separate full-screen steps per the diagnosis doc.

**Layout** — three grouped `GlassCard` sections, top to bottom:
1. **Preset picker** (pinned at top — Cadet / Admiral / Naval Historian /
   Alternate History / Custom pills).
2. **Era & Scale** — scenario/era select (today's `ScenarioSection`
   dropdown) + fleet size.
3. **Historical Uncertainty** — research speed, technology variation,
   historical budget, tactical realism, difficulty — each rendered as a
   labeled choice with a plain-language blurb beneath it instead of a bare
   `SelectItem` value.

**Presets → real engine setting-id bundles** (all six ids sourced from
`packages/campaign/src/scenario.ts` / `fleetSize.ts` / `researchSpeed.ts` /
`technologyVariation.ts`):

| Preset | fleetSize | researchSpeed | technologyVariation | historicalBudget | tacticalRealism | difficulty |
|---|---|---|---|---|---|---|
| Cadet | small | standard | none | standard | standard | easy |
| Admiral | standard | standard | some | standard | standard | normal |
| Naval Historian | large | slow | none | historical | realistic | hard |
| Alternate History | standard | fast | considerable | standard | standard | normal |
| Custom | — no bundle; whatever six values are currently set | | | | | |

**Preset/Custom interaction**: presets **pre-fill**, they don't lock. All
six dropdowns stay live; editing any one after picking a named preset
silently reverts the pill to "Custom" (no confirmation, no locked state) —
matches the existing `onPreferenceChange` wiring, no new UI state needed.

**Copy authorship**: ~15–18 short, hand-authored plain-language blurbs
across the five uncertainty settings' values, same authoring pattern as §1's
nation dossier copy. The diagnosis doc's own prose covers research speed and
technology variation directly; historical budget, tactical realism, and
difficulty need original 1–2 line blurbs describing gameplay consequence,
not just restating the label.

**Estimated starting navy / low-budget warning — cut to qualitative, not
numeric**: no engine surface computes ship-count ranges, and nation data is
qualitative flavor text, not numbers — nothing to compute the doc's literal
"6–10 capital ships" ranges from without new engine/data work. Kept in
reduced form: a short qualitative readout derived only from the fleetSize
preset's relative `FLEET_SIZE_BPS` multiplier (e.g. "Reduced fleet — faster
turns, fewer ships to manage" for `small`, "Recommended default" for
`standard`). No per-nation numbers, no ship-count ranges, no low-budget
nation+fleet-size cross-warning.

**Cut from this screen** (see §Out of scope for full detail): Aviation
Development toggle; "additional clone-friendly options" (battle frequency,
AI design quality, automation toggles, fog-of-war level, tutorial adviser,
ironman mode, etc.); numeric estimated-starting-navy ranges and low-budget
warning.

---

## 3. Archetype (unchanged)

`packages/campaign-engine/src/archetype.ts` already ships three named,
tagged, described presets (Merchant Prince / Shipyard Baron / Grand Admiral)
wired into `NewGameArchetypeScreen.tsx` with a consequence panel showing
real numeric effects. This already satisfies "doc flavor layers on top of
the unchanged Economy/Industry/Combat model" — **no changes**: no new copy,
no 4th preset, no screen changes.

---

## 4. Admiral & Campaign Identity

New step, does not exist today. Sits immediately after Archetype, before
Starting-fleet method / Commissioning Review — a single static-position
step, no branching. Back returns to Archetype preserving its selection;
Next goes onward.

**Fields**:
- **Admiral name** — free text, required (non-empty, trimmed), 60-char cap,
  placeholder `"e.g. John Fisher"`. No auto-generated default.
- **Campaign name** — free text, required (non-empty, trimmed), 60-char cap,
  placeholder `"e.g. Britannia Ascendant"`. No auto-generated default.
- **Naming convention** — `namingConvention: "historical" | "generated" | "custom"`,
  default `"historical"`.
- **Ship name reuse** — `shipNameReuse: "allowed" | "disabled"`, default
  `"disabled"`.
- **Measurement system** — `measurementSystem: "imperial" | "metric"`,
  default `"imperial"`.

The three enum fields are new UI-only concepts — no engine setting ids back
them. Captured in draft state and displayed later in the Commissioning
Review; **not** sent to `compileCampaign`, and no unit-conversion or
name-generation logic consumes them (that's future work — see §Out of
scope).

**Validation**: "Next" disabled until both admiral name and campaign name
are non-empty (post-trim). The three enum fields always have a valid
default, so they never block progress.

---

## 5. Starting-fleet method

### 5a. legacyFleetModeId → gameplay meaning

The engine validates three `legacyFleetModeId`s
(`packages/campaign/src/scenario.ts`) with **no fleet-generation behavior
implemented behind any of them** — confirmed by grep, the id only flows
through as a validated string, displayed verbatim in `RulesetPanel.tsx`.
Mapping onto the diagnosis doc's three player-facing options (note the
naming trap — `historical` is *not* the manual-build option):

- **`generated`** → doc's **Option A: Inherit an existing navy**. The
  recommended default — an operational-but-aging navy the player must
  modernize rather than design from scratch.
- **`disabled`** → doc's **Option B: Build the legacy fleet manually**.
  Read as "automatic generation is disabled," leaving construction to the
  player.
- **`historical`** → doc's **Option C: Curated historical-inspired fleet**.
  A balanced, nation/era-tailored navy labeled as historically inspired,
  generated rather than hand-built — not a manual-history-recreation mode.

No 4th id is needed. Implementing the actual fleet-generation/manual-build/
curation *behavior* is out of scope for this spec — this mapping only makes
the screen's copy truthful; the generation logic itself is a
separately-scoped future engine task. **Selecting any mode today doesn't
yet produce a real starting fleet.**

### 5b. Screen

- **Era-gating**: none at the UI level. All three modes are presented as
  selectable in every era — the engine's `supportedLegacyFleetModeIds` is
  identical across all 5 canonical scenarios; nothing gates manual-build to
  1900 the way the diagnosis doc's flavor text implies. The doc's "1900
  special case" framing is not carried forward as a constraint.
- **Default selection**: `generated` (Inherit an existing navy) — matches
  the doc's explicit recommendation and "Recommended for your first
  campaign" framing.
- **Manual-build (`disabled`) card**: fully selectable, descriptive-only.
  No Phase 1/Phase 2 ship-purchase breakdown, no numeric allocation figures
  — that mechanic doesn't exist in the engine. Shows title/blurb/
  recommendation framing plus a brief note that detailed fleet construction
  isn't available yet. Not omitted, not grayed-out — all three ids are
  equally real, equally unimplemented.
- **`generated`/`historical` cards**: same descriptive-only treatment — no
  numeric/statistical preview (no ship counts, no allocation figures).
- **Layout**: three-card select pattern, matching the Archetype screen and
  preset picker for visual consistency.

---

## 6. Final commissioning review

Summarizes every decision made in the preceding steps before world
generation. Reuses the exact settled vocabulary from §1/§2/§3/§5 verbatim
rather than re-inventing doc field names.

**Summary table rows** (top to bottom):

- Nation (§1)
- Era (scenario — doc's "Starting date" relabeled to match §2's "Era &
  Scale" vocabulary)
- Fleet size (relabeled from the doc's "Campaign scale," which isn't a real
  setting — reuses §2's real `fleetSize` setting)
- Research pace, Technology variation, Historical budget, Tactical realism,
  Difficulty (§2's remaining five real settings)
- Starting fleet method (§5: Inherit / Manual-build / Curated)
- Archetype (Merchant Prince / Shipyard Baron / Grand Admiral, unchanged)
- Naming convention, Ship name reuse, Measurement system (§4's three
  Identity enums — not in the doc's mockup, but committed to being
  surfaced here)
- Admiral, Campaign name (§4)

**Cut entirely** (no engine backing, would make the screen lie): Aviation
development, Tutorial adviser, Economic model, "Campaign scale" as a label.

**Active preset**: shown as a small heading annotation above/beside the six
§2 setting rows (e.g. "Rules of the Naval Age: Naval Historian", or
"Custom" if none active) — not a duplicate row.

**Strategic forecast panel**: templated, not hand-authored per nation×era
combination (125 combos is out of bounds for hand authorship). Built from
§1's per-nation dossier fields (doctrine, characteristics, regions) as the
constant part, plus a short "Expected pressures" bullet list mechanically
keyed off the chosen settings, reusing §2's qualitative setting blurbs as
the bullet source rather than new authored paragraphs.

**Buttons**: **Back**, **Begin Commission** only.
- **"Save as Preset"** — cut entirely. §2 designed a fixed 5-preset system
  with no persistence layer, preset editor, or storage decision. Adding
  real custom-preset saving here would be new, unscoped work; not even a
  disabled placeholder, since nothing was ever designed for it to wait on.
- **"Generate Another Starting Fleet"** — cut entirely, not even disabled.
  §5 confirmed no mode has real generation logic. Unlike §5's fleet-method
  cards (which only describe a mode, promising nothing), this button
  promises an observable action (reroll ship classes) with zero
  implementation behind it — a disabled version would still mislead.

---

## 7. World-generation presentation ("Establishing the Naval Order")

Replaces today's plain disabled-button "Starting…" state
(`NewGameNationScreen.tsx`) shown while `compileCampaign` runs.

**Progress model**: purely cosmetic, client-side, decoupled from real
progress. `compileCampaign` is one opaque bridge call with no per-stage
instrumentation — internally it does: create session → compile → validate
nation/slot → native OS save-directory dialog → `SaveStore.save` → write
session metadata → register session → return. No new bridge/engine
progress-reporting is added; the 9 checklist lines don't map to real
instrumented stages.

**Handling the indeterminate native save dialog**: the save-directory
prompt (`dialog.showSaveDialog`) sits inside the same opaque
`compileCampaign` call, of unknown/indefinite duration. `compileCampaign`'s
bridge contract stays **untouched** — no restructuring to split the prompt
into an earlier step. Instead: the fixed 9-line checklist + flavor-text
sequence plays over a bounded minimum duration (~2.5–3s, paced to be
readable), and if the real call hasn't resolved by then — including
however long the player takes on the native dialog — the screen holds on
the final checklist line (fully revealed, flavor-text still rotating)
until it does. **Flagged as a known rough edge**, not fixed by this effort;
a candidate for a future ticket if it proves janky in practice.

**Checklist lines** (doc's nine, reused verbatim):
1. Appointing foreign governments
2. Calculating national naval budgets
3. Establishing diplomatic relations
4. Generating naval technologies
5. Laying down existing ship classes
6. Assigning ships to overseas stations
7. Constructing naval bases and fortifications
8. Compiling foreign intelligence estimates
9. Preparing the January naval estimates

**Flavor-text messages**: reuse the doc's four verbatim (generic, not
nation/era-specific): "Foreign ship characteristics are based on
intelligence estimates.", "Technological discoveries will not always
follow history.", "A large fleet may become unsustainable during an
economic downturn.", "A navy built for the last war may be unsuited to the
next one." Rotate on a fixed interval (~2s), independent of the checklist
reveal pace.

**Transition to Opening Strategic Briefing**: automatic, no button — fires
once both the cosmetic minimum has elapsed and the real call has resolved
successfully.

**Error handling** — two treatments, not one generic error state:
- `SAVE_LOCATION_CANCELLED` (player hit Cancel on the OS file picker) —
  not a failure. Silently return to the Commissioning Review screen (§6)
  with selections intact, no error banner.
- The other five reasons (`INVALID_CAMPAIGN_CONFIGURATION`,
  `COMPILE_FAILED`, `UNKNOWN_PLAYER_SLOT`, `PLAYER_SLOT_NOT_SUPPORTED`,
  `SAVE_FAILED`) — replace the checklist/flavor-text UI with a real error
  state: short message + "Back to Commissioning Review" action.

---

## 8. Opening strategic briefing

Shown once, right after world generation, before the player reaches the
existing (unchanged) Overview dashboard. **5-page linear sequence**, Back
always available (returns to the prior page, never exits the briefing), no
skip logic. Generic "Next"/"Back" throughout, except page 1's button keeps
the doc's flavorful "Review Naval Estimates" label, and page 5's action is
"Take command."

Regional Commitments (doc's page 4) is cut entirely (§Out of scope); the
closing choice offers only "Take command" — "Guided inspection" and
"Delegate routine administration" are cut (§Out of scope).

### Page 1 — Appointment

Reuses §1's per-nation appointment title (e.g. "First Sea Lord") and
dossier-derived flavor text verbatim — no new authoring. Shows the
scenario's start date (era) as the date line, filling the gap §1
deliberately left open when it chose not to show a date on the
nation-confirmation screen itself.

### Page 2 — State of the Navy

Ships six fields derivable from real data via joins already present in the
engine:

- Ship-class inventory counts (`FleetShipView.designId` → design catalog →
  `hullType` → `constructionShipTypeLabel`, tallied)
- Ships-under-construction count (`buildConstructionProjectQueue()`)
- Most-expensive-active-class (`projectedConstructionOrderCosts()` joined
  against active ships' designs)
- Largest-available-dock (`FleetPort.capacity`, an existing
  documented-as-approximate proxy)
- Total maintenance expense (`MonthReport.maintenanceCost`)
- Current construction expenditure (`MonthReport.newConstructionSpending`)

**Cut entirely, no fabricated placeholders**: reserve count, overseas
count, oldest capital ship (no data path — no age/date-built field, no
reserve/overseas ship states exist anywhere). "Free monthly balance" also
dropped from this page specifically to avoid duplicating the Treasury
page's surplus figure.

### Page 3 — Treasury Position

Shows government allocation, fleet maintenance, construction spending, and
research expenditure (all real: `MonthReport`, `PlayerProjectionEconomy`,
`research.ts`'s `researchBudget`) plus a projected monthly surplus/deficit.

"Other naval expenses" cut entirely — no computed remainder row, since
nothing backs what that remainder would represent. Qualitative status
(healthy/narrow/deficit/critical) kept as lightweight UI-only threshold
logic over the real projected-surplus number, exact thresholds left as an
implementation detail (same treatment as page 5's concern triggers).

### Page 4 — Foreign Intelligence

Shows only the two real fields per rival — relations label and tension
score (`DiplomacyRelationRow`, `buildDiplomacyScreenProjection()`). No
estimated ship-count row, no intelligence-quality tiering — both are
genuinely new domain concepts (fog-of-war modeling) with no derivation
path. No qualitative naval-strength stand-in either — §1's dossier data
describes the player's own nation, not a comparative per-rival assessment.

### Page 5 — Immediate Concerns

Specs four categories + display only, exact trigger thresholds remain an
implementation detail:
- Obsolescence
- Budget shortfall
- Near-complete construction
- Low research spending

"Understaffed region" cut from the category list — it depends on the
Regional Commitments / required-presence domain model, which is out of
scope for this effort entirely.

### Closing

Single **"Take command"** button, transitions into the existing, unchanged
Overview dashboard.

---

## Out of scope

Work consciously ruled beyond this effort's destination — returns only if
the destination is redrawn, as a fresh effort:

- **Regional Commitments briefing page + any "required regional presence"
  domain model** — no possessions/regions-with-required-presence concept
  exists yet (only a possessions/ports layer on the world map with
  owner/name/location, no "required presence" semantics). Modeling that is
  its own domain-modeling effort.
- **Dashboard priorities/checklist panel and Guided First Month tour**
  (diagnosis doc steps 10–11) — future effort once the commissioning flow
  itself is solid.
- **Redesigning the archetype dimension system** to match the doc's
  Strategist/Engineer/Politician/Commander framing — the engine's existing
  Economy/Industry/Combat 3-dimension system stays; doc flavor layers on
  top as presentation only.
- **"Compare Nations" button** — cut, no dependency issues, just not core.
- **App-wide metric/imperial unit conversion and generated ship-naming
  logic** — the *settings* (naming convention, ship-name reuse, measurement
  system) are captured and shown in the commissioning review, but wiring
  them to reformat numbers or generate names throughout the app is later
  work.
- **"Guided inspection" / "Delegate routine administration" briefing-close
  buttons** — no destination exists for them yet; only "Take command" ships
  in this spec.
- **Doc's "Aviation Development" toggle and "additional clone-friendly
  options"** (battle frequency, AI design quality, automation toggles,
  fog-of-war level, tutorial adviser, ironman mode, etc.) — none exist as
  engine setting ids, no surface to spec against.
- **Numeric "Estimated starting navy" ship-count ranges + nation-budget
  low-budget warning** as the diagnosis doc describes them — would need new
  engine/nation-budget data work; kept only as a qualitative
  fleetSize-derived readout instead.
- **Fleet-generation/manual-build/curation behavior** behind the three
  `legacyFleetModeId`s (§5) — this spec only pins the id→meaning mapping so
  the screen's copy is truthful; the generation logic itself is a
  separately-scoped future engine task.
- **Restructuring `compileCampaign`'s bridge contract** (§7) — the
  indeterminate native save-dialog handling is a UI-level workaround, not a
  bridge fix; flagged as a known rough edge for a possible future ticket.
- **Estimated-enemy-ship-counts and intelligence-quality tiering** (§8 page
  4) — genuinely new fog-of-war domain concepts with no derivation path
  from existing data.
- **"Save as Preset" and "Generate Another Starting Fleet"** (§6) — no
  persistence layer or generation logic exists to back either.

## Handoff

This spec is ready to hand off to implementation tickets. Notable
implementation-sequencing items not pinned by any decision ticket (left to
whoever plans the implementation):

- The exact `useNewGameFlow.ts` state-machine reorder (nation to step 1,
  `NewGameDraft` gaining a nation field, interleaving of §2–§5).
- Absolute placement of the Admiral & Campaign Identity step (§4) relative
  to Nation Confirmation / Preferences / Fleet Method beyond "immediately
  after Archetype, before Commissioning Review."
