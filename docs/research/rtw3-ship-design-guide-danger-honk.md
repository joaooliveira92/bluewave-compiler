# Research: Steam community "Ship Design Guide (1890 to 1970)" (Rule the Waves 3) — mechanics and heuristics

Source: Danger Honk, "Ship Design Guide (1890 to 1970)", Steam Community guide, <https://steamcommunity.com/sharedfiles/filedetails/?id=3413683220>.
Posted 3 Feb 2025, updated 18 Feb 2025, marked WIP. Accessed 2026-10-08 (full text read via a browser tab; `WebFetch` returned HTTP 429).
Research-only; no code or catalogue edited. All content below is paraphrased, not quoted. Tag `[G]` = this guide.

## Method and source grade

- The guide is a single player's community write-up of *Rule the Waves 3* (RTW3, Naval Warfare Simulations). It is **secondary and experiential**, not an official source. It links to no manual, developer post or data file.
- Labels: **FACT-CLAIM** (stated as how the game works; plausible but not independently verified here), **OPINION** (author's preference or heuristic), **NUMERIC-OBSERVED** (a number the author reports from play, unverified), **DISPUTED** (contradicted in the guide's own comments).
- Primary sources (RTW3 manual, NWS/Matrix pages) were **not reached**. A web search found only Steam discussion threads, none of which was opened. Every FACT-CLAIM here is therefore UNVERIFIED against the manual.
- Scope note: the guide covers 1890-1978 and is mostly campaign-timing and fleet-composition advice. Only a minority of it is ship-design mechanics, and only the 1890-1899 slice overlaps Bluewave's EARLY band (see `content-0-scenario-era-bands.md`, `ship-building-early-band.md`).

## 1. Findings: mechanics claimed as game fact

| # | Claim (paraphrased) | Label | Cite |
| - | ------------------- | ----- | ---- |
| F1 | Build time rises with displacement; the author finds ~6 kt (kiloton) hulls the sweet spot, about 22 months in 1890 and 24 months for a sub-10 kt cruiser in 1898. Going bigger lengthens build time sharply. | FACT-CLAIM + NUMERIC-OBSERVED | [G] 1890 Protected Cruisers; 1898 Armored Cruisers |
| F2 | Shipyard size limits displacement early in the game. | FACT-CLAIM | [G] 1898 |
| F3 | Armour is divided by hit-zone region, each with its own role: turret (T), turret top (TT), deck, belt (B), belt ends (BE), upper belt (BU), deck ends (DE), conning tower (CT). Belt may be a "narrow" or "inclined" layout. | FACT-CLAIM | [G] 1909 Battleships |
| F4 | Non-penetrating turret hits do no damage, unlike superstructure or deck hits. | FACT-CLAIM | [G] 1909 Battleships |
| F5 | A turret's hit chance rises with the number of turrets, regardless of size. Roughly 20% of turret hits land on the turret top. | NUMERIC-OBSERVED | [G] 1909 Battleships |
| F6 | Deck armour of about 3 in stops penetrations and, more importantly, splinter damage (about 3.5 in against 15 in guns). | NUMERIC-OBSERVED | [G] 1909 Battleships |
| F7 | DE shields the superstructure from about 40% of direct hits and from splinters. BU gives similar cover but would need to be prohibitively heavy. B and BE should match to avoid hull damage. A narrow belt costs about +2% hull hit chance. | NUMERIC-OBSERVED | [G] 1909 Battleships |
| F8 | The all-or-nothing armour tech (AoN, ~1912) redirects superstructure hits onto the turret top and hull. It makes DE and BE less important and raises unprotected hull hits by about 20%. It also reduces armour weight (per the 1914-18 section). | FACT-CLAIM + NUMERIC-OBSERVED | [G] 1909 and 1914-18 Battleships |
| F9 | Secondary vs tertiary battery: tertiary guns cannot be hit for turret damage (only disabled by hull hits), so minimum secondary plus a tertiary battery is preferred. | FACT-CLAIM | [G] 1909 Battlecruisers; Design Principles |
| F10 | Turret and CT armour can be removed in a refit; deck and belt armour cannot. Belt armour is wasted space after a carrier conversion. | FACT-CLAIM | [G] 1909 Battlecruisers; 1898 |
| F11 | 6 in is the maximum gun calibre for an 1890 cruiser, up to 14 guns (two 2-gun turrets plus 10 casemates). | FACT-CLAIM | [G] 1890 |
| F12 | Krupp armour (~1898) is a major armour improvement. Rangefinders arrive around then. 2-gun turret ROF penalty is reduced. Heavy-gun quality of -1 is possible. | FACT-CLAIM | [G] 1898 |
| F13 | Turret layout unlocks: 4 centerline turrets after 1907, 6 in 1908. 3-gun turrets are available by 1909, 4-gun by ~1914. | FACT-CLAIM | [G] 1909 and 1914-18 |
| F14 | Destroyer hulls unlock in steps (900 t, 1100 t in 1912, 1500 t in 1914, 2000 t by 1923). Torpedo launchers are 1-tube, 2-tube (1912), 3-tube (1914). | FACT-CLAIM | [G] 1908-1932 |
| F15 | Refits cost money and raise maintenance; age alone does not raise maintenance cost (apart from random events). Fire-control techs unlocked mid-construction can be fitted with no refit penalty. | FACT-CLAIM | [G] Design Principles - Refits |
| F16 | Engine weight grows disproportionately past a hidden per-tech speed threshold. Reliable engines trade top speed for better chase and flee performance in battle. Unit machinery lowers damage effect and softens the speed penalty from engine damage. | FACT-CLAIM | [G] Design Principles - Engines |
| F17 | Operating range governs a raider's ability to sink merchants. Speed governs outcomes against interceptors. | FACT-CLAIM | [G] 1890 FS/TP/Raiding |
| F18 | Colonial-service (FS) tonnage requirements per sea zone can be filled by any combination of ships that sum to the requirement. Trade-protection (TP) ships must be set to TP, not FS, to count for anti-submarine work. | FACT-CLAIM | [G] 1890 FS/TP |
| F19 | Conversion rules are class- and size-bound: ships over 25 kt need 8 in guns to convert to carriers, and unarmoured ships cannot mount them. Ships below ~24 kn take a spotting penalty. Corvettes max out at 2500 t. | FACT-CLAIM | [G] 1902 Minelayer; 1932 DD |
| F20 | Overweight ships, per Steam discussion snippets surfaced by search (not the guide), are more prone to design flaws and take more flooding damage. | UNVERIFIED (search snippet only) | web search result, steamcommunity.com/app/2008100/discussions |

## 2. Findings: author opinion and heuristics (not game facts)

- O1. Conservative armour: armour is heavy and goes obsolete, so skip it on carriers and destroyers and use minimal turret armour. Contrast with O4 for battleships.
- O2. Early cruiser: 3 in turret and belt, 1 in deck, raise the deck to 2 in if the ship dies too easily. Max 6 in guns, about 5 torpedoes, a 6 kn hull.
- O3. 1898 cruiser: keep it under 10 kt, no more than 3 in turret and 2 in belt and deck, 24 kn so a later carrier conversion is cheap.
- O4. "True" battleship: 6 centerline turrets, 16 in guns, 3.5 in deck, 4 in turret top, 3 in DE, narrow and inclined belt, maximum turret armour, belt around 0.9 times turret thickness. Turret armour is the top priority.
- O5. Battlecruisers: fast "glass cannon" ships are preferred.
- O6. Time procurement around tech arrivals; delay building until a key tech lands, to avoid an immediate refit.
- O7. Single-gun raiders: speed and range matter, armament barely does. Purpose-built raiders are usually not worth the money.
- O8. Submarines: build only 3 to avoid the research penalty, otherwise skip. ASW is mostly useful for trade protection.
- O9. Later guidance (carriers, missiles, 1900-1978) is outside Bluewave's current scope.

## 3. DISPUTED / unreliable items

- A comment on the guide (Oct 2025) says the 1898 recommendation of a 2 in belt cruiser with 12 in guns is illegal under the manual and in game: cruisers need more than 2 in of armour and guns of 11 in or less. This suggests a **class-legality rule keyed to armour thickness and gun calibre exists in RTW3's manual**. It is a single comment, not verified.
- Another comment says speed cannot exceed 21 kn before 1925, which conflicts with the guide's 24-25 kn minelayer advice. The author did not answer in the captured text.
- The guide is WIP and the author says it is not comprehensive and is tuned to personal preference.

## 4. Gaps and uncertainties

- No gun, armour, speed or cost formulas are given; all thresholds are observed percentages and tiers. There is no weight-budget formula, no stability or seakeeping detail, no crew or cost trade-off numbers, and no range figures.
- Hit-location percentages (20%, 40%, 2%, 20%) are observations from RTW3's abstract hit model. They need not apply to Bluewave's armour-region model.
- The RTW3 manual and NWS/Matrix documentation were not reachable here, so mechanics claims cannot be graded above single-source community report.
- Tech years are RTW3's tech tree and may be randomised or country-dependent (the guide itself says "60% chance" of AoN by 1914).

## 5. Cross-reference with the repo

Compared with `packages/ship-design/src/` (armour.ts, arrangement.ts, machinery.ts, cve.ts, trials.ts), `docs/adr/ADR-0063-component-level-ship-compiler.md`, and the two `ship-building-early-band*.md` notes.

| Guide topic | Bluewave status | Verdict |
| ----------- | --------------- | ------- |
| Armour regions (belt, belt ends, upper belt, deck, deck slope, turret face, barbette, CT, splinter plating, torpedo bulkhead/belt) | `ARMOUR_REGIONS` in `armour.ts` already has BELT_MAIN/UPPER/ENDS, DECK_MAIN/SLOPE, TURRET_FACE, BARBETTE, CONNING_TOWER, SPLINTER_PLATING, TORPEDO_*. | Confirms the region idea. Bluewave is a physical model (thickness, obliquity, penetration); the guide describes RTW3's abstract hit tables. |
| Turret top (TT) armour | No TURRET_TOP region. | Missing (and not historical for 1880-99 anyway). |
| Narrow/inclined belt trade-off | Not modelled as a toggle. Slope exists via `cosObliquityBp`. | Partially covered. |
| All-or-nothing scheme | No scheme concept, only per-region thickness and coverage warnings. | Missing; AoN is ~1912, out of EARLY scope. |
| Secondary vs tertiary battery hit rules | Zone-based arrangement (9 zones), no battery class. | Missing; RTW3-specific mechanic, copy only if the combat model needs it. |
| Armour not removable in refit but turret armour is | `refit.ts` exists; rule not checked. | Open question for SB-14 follow-up. |
| Reliability vs speed, hidden weight threshold | `machinery.ts` has `reliabilityBp`, `cve.ts` weights reliability. Weight growth is formula-driven. | Confirms the direction. Bluewave's explicit formula avoids a "hidden" threshold. |
| Build time vs displacement | Handled by the construction/project model (DESIGN-23). | Compare once balance data exist; guide's 22 and 24 months are RTW3 figures. |
| Overweight to flaws/flooding | `armour.ts` flood and `trials.ts` defect chance. | Consistent in spirit. |
| Fire control fitted mid-build with no refit penalty | Not seen. | Missing, low priority. |
| Class legality by armour/calibre (cruiser vs battleship) | `classification.ts` and ADR-0013 classifier exist. | Check whether the classifier already enforces a minimum armour for armoured cruisers. |
| Shipyard size limit by tech | Not confirmed in this pass. | Check against the hull/yard limits. |

## 6. Licensing and copying

- The guide is a copyrighted community text and its designs are RTW3's game data, mechanics and tech tree. Everything above is paraphrased and attributed. Do not paste the guide's text, build tables, or exact tech timelines into content packs.
- Bluewave clones features, not RTW3's UI or content. Hit-chance percentages and tech years from RTW3 are game-balance values and should not be used as Bluewave constants. Ground any such value in the history sources already used (`ship-building-early-band*.md`) or in Bluewave's own balance work (ADR-recorded).

## 7. Implications for Bluewave ship-building

1. Use the guide as a design-intent checklist, not a data source. It confirms the features players value: choose armour regions, trade speed against reliability, avoid overweight ships, time builds to tech.
2. The most relevant gaps for EARLY (1880-1899) are: (a) class legality tied to armour thickness and gun calibre (the guide's comment suggests RTW3 has one); (b) a battery-class distinction (main, secondary, tertiary) if combat will give them different hit rules; (c) which armour can be removed in a refit.
3. TT, AoN, narrow/inclined belt and DE/BE/BU are post-1900 abstractions. Defer them, record as deferred.
4. If a balance pass wants a "sweet-spot displacement" heuristic, derive it from Bluewave's own build-time model, not from the 6 kt number.
5. Follow-ups worth research: RTW3 official manual (class legality rules, yard limits, hit-location tables) if reachable, and a Bluewave check that the AI design builder (`ai.ts`) avoids over-armouring non-line ships.

## Source list

- [G] Danger Honk, "Ship Design Guide (1890 to 1970)", Steam Community, <https://steamcommunity.com/sharedfiles/filedetails/?id=3413683220> (accessed 2026-10-08); four comments on that page read the same day.
- Web search result snippets from steamcommunity.com/app/2008100/discussions (not opened), used only for F20.
