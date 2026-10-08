# Research: RTW3 campaign main-screen semantics (readouts, tabs, buttons)

Ticket: `.scratch/campaign-command-screen/issues/03-rtw3-semantics.md` (map: `.scratch/campaign-command-screen/map.md`). Accessed 2026-10-08. Research only; no code edited. All content is paraphrased. Features and meaning only, no layout copying (ADR-0059, memory `clone-features-not-ui`).

## Sources and grades

| Tag | Source | Grade |
| --- | ------ | ----- |
| [M] | *Rule the Waves 3* Game Manual, PDF `RuleTheWaves3ManualPatch2026` (Naval Warfare Simulations / Matrix Games), from the Steam "View the manual" link <https://store.steampowered.com/manual/2008100>. Downloaded and text-extracted in full (149 PDF pages; printed page numbers equal PDF page numbers). Page numbers below are printed pages. | **Primary (official)** |
| [R] | Existing repo notes: `rtw3-official-manual-ship-rules-and-1890s-history.md` (same manual, ship rules), `rtw3-parity-engine-roadmap.md`, `rtw3-war-panel-engine-surface.md`, `rtw3-intel-and-submarines-engine-surface.md`, ADR-0059, ADR-0060, ADR-0067 | Repo (primary-derived) |
| [O] | Owner screenshots described in `map.md` (2026-10-08, Italy May 1935) | Owner-supplied; used only for the list of labels |

Existing material checked first: the repo notes above already cover ship-type rules (ADR-0067) and engine surface per feature, but **none documents what each main-screen readout means**. This note fills that gap from [M].

Not reached / not found: the manual contains **no chapter describing the main screen as such**. There is no numeric colour-threshold table, no definition of "Build requirement", no definition of the intel-level scale, no "Treaty time" field, and no description of Almanac, Show history, Mobilization or Auto-build subs as UI items. Those are marked NOT IN MANUAL below. No developer forum post or patch note was opened; the web search returned only Steam player threads and a review site (not primary), so nothing from them is used as fact.

## 1. Readouts (nation panel, budget panel, status)

Confidence key: DOC = stated in [M]; INFER = reasonable reading of [M] text, not stated for the label; NONE = not in [M].

### 1.1 Nation panel

| Readout [O] | Meaning from [M] | Unit / range | Confidence |
| --- | --- | --- | --- |
| **Prestige** | Reputation with the monarch/president, politicians and officer corps. Raised by naval victories and "tough" event answers; lowered by "soft" answers, defeats, mismanagement, unmet obligations (foreign-station tonnage, trade protection, running out of funds). Loss is proportional (high prestige loses more). Acts as a currency spent on events, and as removal of officers (costs prestige), early promotion (costs prestige). At **16 or below** there is a risk of being sacked (game lost). End-of-game victory-point score and Hall of Fame. (p. 12, 61, 56, 46, 70, 13) | Integer-like score; only hard number: 16 = sack risk. Upper bound not stated | DOC |
| **Fleet morale** | Moved by events, victories and, indirectly, national unrest. Directly sets ship crew quality in battle. Unpaid sailors (running out of funds) also lower it. (p. 62, 13) | Scale and bounds not stated | DOC (semantics), NONE (scale) |
| **Unrest level** | Mood of workers and lower classes. Raised by high military spending (the biggest factor), long wars, being blockaded, cramped ship accommodation, defeats, events. Lowered by war breaking out (initially only), social programmes (event answers), victories, lower military spending. High unrest: strikes, demands for a lower military budget, and in wartime revolution and defeat (less likely in liberal democracies). Acts as a brake on the naval budget. (p. 62, 77) | Scale and bounds not stated | DOC (semantics), NONE (scale) |
| **Tonnage on foreign stations** | Each nation must keep a minimum naval presence, as tonnage, in every area where it holds possessions; the requirement depends on the number and value of possessions. Only ships with Active or Foreign Station status count. Ships equipped for colonial service count 1.5x; cramped-accommodation or short-range ships count for less than displacement. Shortfall can cost prestige and cause revolts in the affected areas. Not enforced in wartime while blockaded. Global-naval-power nations must keep at least 10% of tonnage on foreign stations. (p. 46, 59) | Tons (displacement) per area, vs a required tonnage per area. A nation-level readout is therefore presumably "held vs required" | DOC (rule), INFER (the single readout is a roll-up) |
| **Dock size** | Largest ship the nation can build and operate. Grows in steps of 1000-2000 t depending on era; each dock step takes one year to build; may also grow by itself with private shipbuilding. Also the base for shipyard capacity. (p. 33) | Tons | DOC |
| **Shipyard capacity** | Maximum total tonnage that may be under construction at once, a **multiple of dock size** (the multiplier value is not given). Submarines under construction count; ships under rebuild, AMCs and small corvettes do not. (p. 33) The [O] label shows a triple; the manual does not define a triple. The natural reading is used / maximum / free tonnage but this is INFER only. | Tons | DOC (rule), NONE (triple) |
| **Build requirement** | NOT IN MANUAL under this name. Candidates, all INFER: the foreign-station or trade-protection obligations (p. 46, 69-70), or a dock-size gate on the largest ship. Needs the owner to say what the field shows, or a screenshot tooltip, before it is specified. | | NONE |
| **Treaty limits / time** | Arms-limitation treaties come out of disarmament-conference events. A treaty sets a displacement limit and main-calibre limit for ships newly laid down, and a total warship-tonnage cap across all nations. Ships under construction that violate it when signed are scrapped; existing ships may be kept, rebuilt and modernised even over the limit. Liberal democracies must comply strictly; others may cheat up to 10% on displacement; no cheating on calibre. (p. 65) The manual has no "time" field (expiry); it is not described. | Tons and inches (calibre) | DOC (limits), NONE (time) |
| **Invasion range** | Shown "in the lower left of the main screen". Range in nautical miles from the nearest friendly port to the nearest enemy port of the target possession; if greater, no invasion. Modified by Amphibious-operations tech; raised for global naval powers and surprise-attack nations in the first year of a war; lowered when blockaded. A map button draws range circles. (p. 74-75) | Nautical miles | DOC |
| **Tension** (per other nation) | Each pair has a tension level; rising tension raises war risk. Canals block at tension 7 or higher with the owner. So the scale is at least 0-7+. (p. 60, 15) | Integer level, upper bound not stated | DOC (partial) |

### 1.2 Budget panel

| Readout [O] | Meaning from [M] | Confidence |
| --- | --- | --- |
| **Yearly budget** | Function of the nation's base resources and the share of spending devoted to the navy; base resources grow about 3-5% a year, fall on lost wars, rise on won wars; colonies add income that declines over time. The navy share moves with events and tension (up in tense periods). (p. 12-13) | DOC |
| **Monthly budget** | The yearly budget is paid to the navy in monthly payments. (p. 13) | DOC |
| **Maintenance** | Ongoing cost of ships by readiness: Active (full), Reserve (cheaper, slow to reach effectiveness), Mothballed (cheapest, poorly trained crews). Ships under repair cost about **2x** active maintenance; mothballing halts repair and its extra cost; fleet exercise ships cost 2x; special training adds to maintenance (see 3). In wartime maintenance rises sharply, and the main screen shows a prediction of the cost if all ships were Active. (p. 51-53) | DOC |
| **Construction** | Cost of a ship is paid in monthly instalments over its build time. Halted ships cost half their mothballed maintenance; accelerated construction is 10% faster for +5% cost; a delayed ship pays no instalment that month. Design studies (1-4 months) also cost money. (p. 26, 31) | DOC |
| **Naval aircraft** | NOT IN MANUAL as a budget line. Air spending is described only through air units and airbases (p. 113-114); treat the line as air-force upkeep and procurement, INFER. | NONE |
| **Research %** | Share of the budget spent on research, **maximum 12%**, **diminishing returns above 10%**. Priorities per area are relative high/medium/low; if an area has nothing left, its points move to other areas. (p. 16) | DOC |
| **Extra training** | Special training subjects, max **two** at once; each adds maintenance cost; 12 months to reach proficiency; benefit vanishes at once if spending stops. Subjects and cost: Gunnery +30% maintenance for 10% better gun accuracy; Night fighting +20% (spotting, hesitation, 10% accuracy at night); Torpedo tactics +20%; Damage control +20%. Cheaper for Japan. (p. 52-53) | DOC |
| **Intelligence** | Spending level per other nation (see 1.3). Starts gradually; an asterisk marks "not yet at full capability". (p. 63) | DOC (semantics), NONE (money scale) |
| **Total expenses** | Sum of the lines above. Not defined in [M]. | INFER |
| **Monthly balance** | Not defined in [M]. What [M] does say about the sign: running out of funds upsets the finance ministry, lowers prestige and lowers fleet morale (unpaid sailors); a large saved surplus held for long may be taken by the ministry. (p. 13) So a negative balance is a risk state and a surplus is a bounded good. No colour rule exists in [M]. | NONE (colour), DOC (consequences) |

**Colour thresholds: none are documented in [M].** The screenshot's red negative balance is a UI convention, not a rule. Any Bluewave threshold should be a Bluewave design decision (colour never the only signal, ADR-0059 section 4).

### 1.3 Right-hand column (nation flags, intel, relations)

- **Intel level per nation** (the +/- control): player sets an intelligence collection level for each other nation. Effects: may reveal research in other nations (boosting your own), details of enemy ships (armament, armour thickness, torpedo protection), war plans; in wartime reduces unavoidable unexpected battles and raises ASW effectiveness. It takes time to build up (asterisk while ramping). There is a **detection risk** that raises tension with that nation. (p. 63-64) Level scale and cost per level: NONE.
- **Information visible without intel on foreign ships**: ships under construction show only type and displacement; completed ships show type, displacement, number and calibre of guns or launchers, and speed ("official numbers may mislead"). (p. 64)
- **Relations** (the "All relations" button): tension, alliance and treaty state per nation. Alliances lower tension and bring the ally into war and battles (ships, bases, coastal batteries), make technology sales easier and cheaper, allow aircraft licences; downsides are entanglement and raising others' tension; revoked by rising tension (more so for fascist/communist with liberal democracy), not during war (a separate peace may be sought instead). (p. 65-66)
- **Almanac**: NOT IN MANUAL.

## 2. Tabs (top strip) and area tree

| Tab [O] | Meaning from [M] | Page |
| --- | --- | --- |
| **Map** (first tab) | Strategic map of the world: possessions marked by owning nation's flag. Hover an area: tooltip lists ships of all nations deployed there, with total strength in parentheses (the value used for blockade); the figures are before movement, to preserve fog of war. Click an area or possession when zoomed for details. A tree on the left offers more map options. Drag between areas to give movement orders. An invasion-range button draws range circles. | 14, 49, 69, 75 |
| **Ships in service** (second tab) | List of all active ships. Right-click for reserve, mothball, open design, raider mission, move; multi-select works. Columns include speed with letter flags (L long range, S short range, c colonial service, a cramped accommodation) and Status: AF active, RF reserve, MB mothballed, R raider, FS foreign station, TP trade protection, WU working up; a number is months in repair; an asterisk means the ship needs maintenance and should go to an area with enough base capacity; H = repair halted while mothballed. Hotkeys: F foreign stations, A active, M move, D select division, T trade protection. | 47-48, 140 |
| **Ships under construction** | Ships being built; right-click to halt or accelerate construction. | 48, 31 |
| **Submarines** | Submarines are not designed, they are standard types from research: coastal, medium range, long range, minelaying, missile. Count against shipyard capacity. Wartime policy: fleet support, prize rules, unrestricted. | 34-36 |
| **Coastal fortifications** | Coastal artillery batteries built in a chosen possession from predefined types (position within the possession is random and not player-chosen, by design); they add local minefields, gain AA over time, and late-game missile batteries. Land airbases are built here (start capacity 20 aircraft, expand in steps of 20, tech-limited). | 36, 113 |
| **Ships sunk or scrapped** | NOT IN MANUAL (no chapter on this list). Content is self-evident from the label. | |
| **Area overview** | NOT IN MANUAL by name. Area rules: ships are deployed per area; the count allowed depends on the area's base value; exceeding it hurts maintenance and crew quality, checked at end of turn; no bases in an area allows only a handful of ships (single cruisers). The "area details dialog" has a Move ships button. | 45, 49 |
| **Base overview** | NOT IN MANUAL by name; presumably possessions with base values and fortifications ("base values and fortifications can be improved by the player"). | 13 |
| **Officers** | Ranks Commander, Captain, Rear Admiral, Admiral; Commander commands a CL or DD division, Captain a CA/B/BB/BC/CV/CVL or DD division, Rear Admiral a division of CL or heavier, Admiral commands geographic areas and may change fleet organisation before battle. No commanders for individual destroyers. Ability rating: brilliant, above average, average, below average, incompetent; hidden at first, revealed over years and in battle; it shifts crew quality across a bracket. Promotion chance after about 5 years in rank. Player assigns from a pool to empty slots each turn; the AI fills any left empty. Removing an officer or promoting early costs prestige. Naval Academy (via the doctrine screen, needs tech) gives more and slightly better officers. | 54-56 |
| **Area tree toggle: Ships / Possessions** | Left tree selects an area/possession to inspect; the possessions list is also the way to pick an invasion target (select an enemy possession in range). | 14, 75 |

Fleet organisation is its own tab in [M] ("the fleet organization tab"), covered under Division editor below.

## 3. Buttons (3x5 action grid and right column)

| Button [O] | What it opens / does per [M] | Page | Confidence |
| --- | --- | --- | --- |
| **Design Ship** | Design window. Ship type is validated against Appendix 1 definitions (illegal types disallowed); report with Errors (must fix) and Notes. New class has a design study of 1-4 months with cost; derived classes get a discount; after the study, same-class ships build with no delay. Also reachable from right-click "open design". | 23-26, 133 | DOC |
| **Research** | Research menu: set area priorities high/medium/low (relative); the budget share is set separately (Research %). | 16 | DOC |
| **Messages** | NOT IN MANUAL. The tactical log is described (p. 81) but that is not this button. Treat as event/notification inbox, INFER. | | NONE |
| **Build ship** | Build dialog after design study: up to **12 ships** of one class per order, names auto-assigned; limited by budget, dock size and shipyard capacity. Can contract to foreign yards (limited by the builder's dock size; risk of impound in war depends on tension, none with a treaty; may reveal builder technology). | 30-33 | DOC |
| **Doctrine** | A doctrine screen: ammunition doctrine (e.g. diving shells, HE use, AA shell choice), torpedo type choice, and Naval Academy. Details of every option not read. | 44, 56, 93, 122 | DOC (partial) |
| **Mobilization** | NOT IN MANUAL as a screen. [M] describes the effects: Reserve ships need time to reach effectiveness; newly mobilised ships enter Working Up and cannot fight; in pre-war surprise attacks after 1935 the player can mobilise carriers. | 51, 67 | NONE (button), DOC (effects) |
| **Build sub** | Submarines are built from the standard types, like coastal artillery (no design), and count against shipyard capacity. | 34, 36 | DOC |
| **Air groups** | Opens "carrier air group management": add or modify squadrons (role and quantity) on airbases and carriers; an auto-assign button for the base. The player picks only the role; the aircraft type is assigned from available types and kept up to date automatically. New squadrons start with low experience; re-equipping or big size increases lower it. Floatplane and airship squadrons are automatic. | 113-114 | DOC |
| **All reserve** | NOT IN MANUAL. Reading: set all ships to Reserve status (p. 47, 51 give per-ship equivalent). | | NONE |
| **Build fort/base** | Coastal artillery and land airbases, built per possession. | 36, 113 | DOC |
| **Aircraft types** | List of the nation's aircraft types; a compare list shows estimates for other nations. "Request proposals for new aircraft": choose a role and two traits; one request at a time, 3-6 months; choose among prototypes. Private-venture offers cost to accept. | 114 | DOC |
| **Division editor** | Fleet organisation: permanent divisions with roles, ships and commanding officers. Optional; without it the battle generator groups ships. 1-5 ships per division (DD up to 6); same type (BB and B mixable; CA may join BC divisions); at least 3 recommended. First ship is the flagship. Division experience affects signalling, contact loss, fire distribution, spotting and slightly crew quality; rises over time, falls when ships or the commander change, small drop on flagship change. Wartime division training raises experience but removes the division from that turn's battles. | 57-58 | DOC |
| **Fleet Exercise** | One per year with ships the player selects; played out as a battle against part of the player's own fleet with no permanent damage; participating ships cost 2x active maintenance and gain experience; large exercises can raise tension. | 53 | DOC |
| **Show history** | NOT IN MANUAL. | | NONE |
| **Preferences** | Game preferences: which events pause the game or show message boxes, realism level, autosave interval during battles, floatplane launch method, captain's mode (manual torpedoes). | 23, 81, 89 | DOC (partial) |
| **Auto-build subs** | NOT IN MANUAL (an automation toggle; repo note `rtw3-intel-and-submarines-engine-surface.md` already lists it deferred). | | NONE |
| **Intel reports** | NOT IN MANUAL by name; intel outputs are the revealed foreign research and ship details (p. 63-64). | | NONE |
| **All relations** | See 1.3. | 65-66 | INFER |
| **Save / Copy game / Resign** | Nine save slots; save any time from the main screen or in battle; **copy game** duplicates to another slot to preserve a point in time; autosave every month, "Load autosave" recovers. **Resign** is NOT IN MANUAL. | 22-23 | DOC (save/copy), NONE (resign) |
| **Turn** | Executes the month: movement orders given earlier are executed when Turn is pressed; ships move to adjacent areas per strategic turn (one month); construction instalments, maintenance, research, intel and events resolve; autosave follows. In war each turn may bring a battle. | 22, 48-49, 77 | DOC |

## 4. Facts the command screen can rely on (summary)

1. Hard numbers in [M] for the screen: sack risk at prestige 16 or below; research share max 12% with diminishing returns above 10%; ships in repair cost 2x active maintenance; fleet exercise 2x, once a year; special training max two subjects (+30% / +20% / +20% / +20%); halted construction costs half mothballed maintenance; accelerated construction +10% speed for +5% cost; build up to 12 ships per order; dock steps of 1000-2000 t, one year each; colonial-service ships count 1.5x on foreign stations; blockade needs 110% of enemy strength in its build area (Britain x1.2, Russia x0.7); canal blocked at tension 7 or higher.
2. Nothing in [M] gives colour thresholds, ranges for prestige/morale/unrest, or the formulas behind them. Bluewave must set its own (versioned constants plus ADR if they affect state; presentation-only thresholds need no ADR but should be named in the spec).
3. Items that are label-only (no manual definition) and need a Bluewave decision rather than research: Build requirement, Treaty time, Messages, All reserve, Mobilization (as a screen), Show history, Auto-build subs, Resign, Almanac, Intel reports, Naval aircraft budget line, Shipyard capacity triple.

## 5. Pointers for the engine check (ADR-0059 rule 1)

Not a full inventory (ticket 02 owns that). From [R]: only the following are real today: war score and blockades, diplomacy and relations, research priority and the budget allocation command (ADR-0060: appropriation rate and research budget; Resign was deliberately not built and maps to Close), division commands (5), construction `BudgetProject`, save/close/copy. Intel, submarines, forts/bases, air, officers, doctrine, mobilization, exercise and training, treaties, prestige/morale/unrest and shipyard/dock modelling are listed as engine work in `rtw3-parity-engine-roadmap.md` and so would show as "Not yet modelled". Several of those readout semantics (prestige, unrest, morale, intel) are described in [M] in enough depth to specify the engine work; the numeric scales are not, so each needs a Bluewave constant.

## 6. Open questions for later tickets

- What does "Build requirement" show (owner screenshot or tooltip needed)?
- Is the shipyard-capacity triple used/max/free? ([M] gives only the rule.)
- Treaty "time": expiry date of the treaty or time since signing? Not in [M].
- Prestige, morale, unrest: Bluewave scales, bounds and display bands are undecided.
