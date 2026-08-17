# Nation confirmation screen

**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec the "Naval Appointment" nation-confirmation screen (diagnosis doc step 1)
that replaces/enriches the existing `NationSelectionScreen` +
`DossierSlidePanel`, which today shows flag/nation-name/flavor-summary content
only — no appointment title, doctrine, budget category, rivals, or difficulty
rating.

Cover:
- Exact content per nation: appointment title (adapt per nation per the doc's
  examples), doctrine, strategic regions, budget category, shipbuilding
  capacity, research strengths/weaknesses, national characteristics, likely
  rivals, difficulty rating. Decide how much of this is hand-authored per
  nation vs. derived from existing engine data.
- Layout: header, central presentation, bottom controls (Change Nation,
  Continue as [Nation]).
- The "Recommended Setup" button: define it minimally as applying the
  "Admiral" preset (from the Preferences+Presets ticket) plus the default
  fleet method — not a bespoke recommendation engine.
- How this screen hands off into the reordered flow (nation now comes
  *first*, before Preferences/Archetype/Identity).

"Compare Nations" is out of scope (see map).

## Answer

### Interaction model

The doc's "transition to a full-screen presentation" is **not** a new screen —
it's the existing `DossierSlidePanel` (slide-up over the `GlobePanel`,
triggered from `FleetDispatchCard` focus in `NationSelectionScreen`), enriched
in place. No new full-screen route, no change to the grid-then-panel
interaction pattern.

- **Entry**: a nation is focused/selected on `FleetDispatchBoard`, same as
  today.
- **Exit**: player clicks "Continue as [Nation]" → confirmed nation id flows
  forward into the (now-first) step of the commissioning flow. The exact
  state-machine reorder in `useNewGameFlow.ts` (nation moving from step 3 to
  step 1, `NewGameDraft` gaining a nation field) is implementation work for
  the final assembled spec, not decided per-ticket.

### Header

`DossierHeader`'s static "Admiralty Intelligence Dossier" label is replaced
by the appointment title + nation name, **no date/era** (era isn't chosen
yet in the reordered flow — the date appears later, in the commissioning
review):

> **You have been appointed [Appointment Title]**
> **[Nation Name]**

The "Fleet record · {countryCode}" subline and `NationEmblem` stay as-is.

### Content model

All fields below are **presentation-only** — hand-authored flavor content,
never authoritative engine state, consistent with the existing
`nationFlavorText.ts` ADR-0003 pattern. No engine changes needed. (The
hybrid "derive from engine data where it exists" principle was the starting
point, but research found no nation-level numeric data anywhere in
`packages/campaign`/`campaign-engine` to derive from — so today every field
is authored. If nation-level engine stats appear later, budget
category/shipbuilding capacity could migrate to derived values without
changing this screen's contract.)

New fields fold into the **existing 3-tab accordion**, no 4th tab:

| Tab | Existing content | New content added |
|---|---|---|
| Economy | flavor paragraph | Budget category, Shipbuilding capacity, Research strengths/weaknesses |
| Military | flavor paragraph | Doctrine, Difficulty rating, Likely rivals |
| Diplomacy | flavor paragraph | Strategic regions, National characteristics |

### Difficulty rating

Fixed per-nation tier, 1 (easiest) – 5 (hardest), cosmetic only. Difficulty
tracks *complexity of commitments*, not fleet size — a large navy with many
rivals and global reach (UK) is harder to play well than a small navy with
a narrow, regional scope (Spain), matching the doc's "recommended for
experienced players" framing for major powers.

### Per-nation content (all 10 playable nations)

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

### Bottom controls

- **Change Nation** — collapses the dossier panel back to grid focus; no new
  navigation/component.
- **Continue as [Nation]** — renamed from "Confirm Selection"; advances to
  the next commissioning step.
- **Recommended Setup** — applies the "Admiral" preset (forward reference:
  Preferences + Presets ticket) plus the default fleet method, pre-filling
  the remaining flow while leaving every screen still editable. Not a
  bespoke recommendation engine.
- "Compare Nations" — cut (see map's Out of scope).
