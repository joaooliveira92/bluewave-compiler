# Research: RTW3 official manual ship-type rules, plus 1890-1900 historical grounding (verifies the Danger Honk guide note)

Follow-up to `rtw3-ship-design-guide-danger-honk.md`. Accessed 2026-10-08. Research only; no code or catalogue edited. All content is paraphrased.

## Sources and grades

| Tag | Source | Grade |
| --- | ------ | ----- |
| [M] | *Rule the Waves 3* Game Manual (Naval Warfare Simulations / Matrix Games), PDF "RuleTheWaves3ManualPatch2026", linked from the Steam store "View the manual" link: <https://store.steampowered.com/manual/2008100> (redirects to a `shared.fastly.steamstatic.com/store_item_assets/steam/apps/2008100/manuals/...RuleTheWaves3ManualPatch2026.pdf` file; downloaded and text-extracted). Page numbers below are the printed page numbers. | **Primary (official)** |
| [S] | Steam store page, <https://store.steampowered.com/app/2008100/Rule_the_Waves_3/> (only used to locate [M]) | Primary (official) |
| [WP] | Wikipedia ship/class articles listed in section 3 (used for dates and specs; each cites Conway's *All the World's Fighting Ships 1860-1905* and Brassey's *Naval Annual*, which were **not opened** here) | Secondary, SINGLE-SOURCE |
| [BN] | Existing repo notes `ship-building-early-band.md` / `-2.md`, which read Brassey's Naval Annual volumes on archive.org directly | Primary-derived (already in repo) |

Not reached: a developer (NWS) forum post or patch note on a pre-1925 speed cap; Jane's, Conway's, navweaps.com and Navypedia pages (Navypedia URL guesses returned 404; navweaps not fetched). The search tool returned only Steam discussion threads, which are player posts and not primary.

## 1. Official manual answers to the four questions

### (a) Armoured cruiser minimum armour and maximum gun calibre: FOUND, and the guide's commenter is right

[M] Appendix 1, "Ship type definitions used by the game" (p. 133-135), says anything outside these parameters is an illegal ship type and that the program enforces them because the AI depends on ship type and to stop unrealistic designs.

- **Armoured cruiser (CA)** (p. 134): displacement above 4000 t, speed above 19 kn, belt armour **more than 2 in and no more than 12 in**, main guns **at least 6 in and no more than 11 in**. In the 1920s the CA becomes the heavy cruiser under the same CA label.
- **Light cruiser (CL)** (p. 133): above 2000 t and below 8000 t, speed above 16 kn, main gun no larger than 6 in. Exception: protected cruisers may have single-mounted guns up to 8 in. Light cruisers must have armour for most of the game (unarmoured only with the late missile-cruiser tech).
- **Destroyer (DD)** (p. 133): below 2000 t (rises with tech, up to 3800 t late), speed above 19 kn, must have torpedoes, cannot be armoured.
- **Pre-dreadnought battleship (B)** (p. 134): at least 5000 t, belt at least 6 in, main guns above 6 in, speed below 20 kn, no more than 2 main turrets.
- **Dreadnought battleship (BB)** (p. 134-135): at least 3 main turrets, above 8000 t, belt above 6 in, main guns above 10 in.
- **Battlecruiser (BC)** (p. 134): guns above 10 in with speed above 23 kn, or 3 main turrets with speed above 21 kn; the speed threshold rises over time.
- Splinter rule (p. 39): 2 in of armour and above protects against splinter damage; below 2 in, the risk is inversely proportional to thickness. This is the only manual number behind the "2 in" folk wisdom.
- Protected cruisers (p. 38): armour deck with sloping sides and no belt. The "Belt" field for them means the thickness of the slope; they cannot have an upper belt. Before the light-cruiser configuration tech, all light cruisers must be protected cruisers.

### (b) Pre-1925 speed cap of about 21 kn: NOT FOUND

The manual states no general speed cap by year. The only 21 kn figure in [M] is the BC alternative threshold (3 turrets, above 21 kn). Speed numbers that do appear: CV spotting penalty below 24 kn (p. ~124); AMC fast liners up to 25 kn (p. 135); torpedoes cannot be fired above 25 kn (p. ~64); vibration penalty above 25 kn at full speed (p. ~57). Engine tech is described only as VTE first, turbines around 1904 (p. 39). The guide commenter's "21 kn before 1925" may be a derived effect of engine tech weight/threshold, but it is **unconfirmed**. The guide's own F16 (hidden per-tech weight threshold) is also not in the manual.

### (c) Build time versus displacement: PARTIAL

[M] p. 31: build time depends on ship type and is modified by an efficient or undeveloped shipbuilding industry; cost is paid in monthly instalments; accelerated construction is 10% faster for +5% cost; delayed ships do not pay that month. Player notes (p. 131): build times are "several years", so ships are often obsolete on arrival. No months-per-ton table is given, so the guide's "6 kt, 22-24 months" (F1) stays unverified. The manual does confirm F2: dock size caps the largest buildable ship, grows 1000-2000 t per step, a dock takes one year to build, and total tonnage under construction is capped at a multiple of dock size (p. 33).

### (d) Which armour can be removed in a refit: manual DIFFERS from the guide

[M] "Rebuilding ships" (p. 32): rebuild actions include changing main armament within compatible calibres, swapping the secondary/tertiary battery if casemated or turreted at 6 in or less, replacing machinery, improving fire control, adding bulges (more torpedo protection, less speed), **adding 1 in of deck armour**, **removing the conning tower**, or **changing the upper belt armour**, and rebuilding to a carrier. Nothing says turret armour can be removed, and nothing says belt armour is frozen. The guide's claim F10 (turret and CT armour removable, deck and belt not) is therefore only partly supported: CT removal and upper-belt change are official; deck can be thickened by 1 in; the turret claim is not in the manual.

### Verdict on the guide's other numbers

- F11 "6 in max for an 1890 cruiser": not in [M]. The official CL limit is 6 in (8 in single mounts on protected cruisers); CA starts at 6 in.
- The 1898 "2 in belt cruiser with 12 in guns" was illegal: confirmed by [M] (CA guns max 11 in, belt must exceed 2 in).
- F3 region list: confirmed by the armour fields table (p. 137: Belt, BU, BE, D, DE, T, TT, SEC, CT, belt coverage for narrow belt). Narrow belt and all-or-nothing are described on p. 38-39.
- F15 refit costs/F9 battery rules, F6-F8 hit percentages: not in the manual text searched; stay NUMERIC-OBSERVED.

## 2. Cross-check against the repo

Compared `packages/ship-design/src/classification.ts` (DESIGN_22_EARLY), `docs/rules/ship-classification.md`, `armour.ts`, `machinery.ts`, `refit.ts`, ADR-0013 (`docs/adr/ADR-0013-b1-ship-type-classifier.md`).

| Topic | Repo | Manual | Status |
| ----- | ---- | ------ | ------ |
| CA displacement > 4000 t, speed > 19 kn | `caMinDisplacementKg` 4,000,000, `caMinSpeedUms` 19 kn | same | Consistent |
| CA belt > 2 in, <= 12 in | `caBeltMinUm`/`caBeltMaxUm` | same | Consistent |
| CA gun upper bound 11 in | `caGunMaxUm` | same | Consistent |
| CA gun lower bound | `maxMainGunUm > 6 in` (strict) | "at least 6 in" (inclusive) | **Conflict**: a 6 in-gun ship is CL in the repo, may be CA in RTW3. DESIGN-22 section 11 states 6 in classifies as CL deliberately, so treat as an intentional Bluewave resolution; record an ADR note if it matters |
| CL <= 6 in, 2000-8000 t, > 16 kn | present | same | Consistent |
| CL protected-cruiser exception (single mounts up to 8 in) | absent (`clMaxGunUm` 6 in) | present | **Gap**: an 1890s protected cruiser with a single 8 or 9.2 in gun needs a rule or is CA |
| DD < 2000 t, > 19 kn, torpedoes, no armour >= 2 in | present | "cannot be armoured" | Consistent (repo threshold 2 in) |
| B >= 5000 t, belt >= 6 in, gun > 6 in, < 20 kn, <= 2 turrets | present | same | Consistent |
| BB > 8000 t, >= 3 turrets, belt > 6 in, gun > 10 in | present | same | Consistent |
| BC 23 kn/21 kn rules, rising with time | EARLY band has none | present | Deferred (Dreadnought band) |
| Splinter at 2 in | `qualifyingArmourUm` = 2 in; splinter plating region in `armour.ts` | same | Consistent |
| Pre-1925 speed cap | `machinery.ts` has a model range `minSpeedMilliKnots`..`maxSpeedMilliKnots` and finds SPEED_OUT_OF_RANGE; bounds come from balance data, not a date table | none found | No conflict; no RTW3 basis for a hard year cap |
| Refit armour rules | `refit.ts` has `ARMOUR_MODIFICATION` and `MAJOR_RECONSTRUCTION` kinds with allowed component categories | deck +1 in, remove CT, change upper belt | Open: check `allowedCategories` for ARMOUR_MODIFICATION against this list |
| Build time | `construction.ts` `durationMonths`, DESIGN-23 work-rate model | type-based, "several years", accelerate +10%/+5% cost | Consistent in structure; no numeric RTW3 table to copy |
| Dock size caps ship size | not confirmed | confirmed | Check hull/yard limits |
| ADR-0013 | classifier is derived, versioned, never authored | enforces illegal types | Consistent in spirit; ADR is silent on thresholds (they live in DESIGN-22) |

## 3. Historical grounding, 1890-1900 (secondary; see grades)

All rows from [WP] (cites Conway's/Brassey's) unless noted; SINGLE-SOURCE. Completion dates are commissioning or "completed" as given. Durations are keel-laid to completed, computed by me.

| Class / ship | Type | Disp. (t) | Speed | Armour layout | Main armament | Keel to completion | Notes |
| ------------ | ---- | --------- | ----- | ------------- | ------------- | ------------------ | ----- |
| *Cressy* class (6 ships, 1898-1902) | armoured cruiser | 12,000 normal | 21 kn design on 21,000 ihp; *Cressy* 20.7 kn on trials | belt 2-6 in, decks 1-3 in, CT 12 in | 2 x 9.2 in, 12 x 6 in, 2 x 18 in tubes | *Cressy*: laid 12 Oct 1898, completed 28 May 1901, about 31 months | 30 Belleville boilers; cost about GBP 749-817k each. Would classify as CA under the repo rules |
| *Dupuy de Lome* (France) | armoured cruiser (first of type) | 6,300 normal | 20 kn design, 19.7 kn trials | 100 mm belt, 30 mm deck, 125 mm CT, 100 mm turrets | 2 x 194 mm, 6 x 164 mm | laid 4 Jul 1888, launched 27 Oct 1890, commissioned 15 May 1895, about 83 months | Long delay blamed on boiler problems; a clear reliability/delay example |
| *Diadem* class (8 ships, 1896-1903) | protected cruiser | 11,000 | about 20-20.75 kn on 16,500-18,000 ihp | armour deck 2.5-4 in, casemates 4.5 in, CT 12 in | 16 x 6 in, 14 x 12-pdr, 2 x 18 in tubes | *Diadem*: laid 23 Jan 1896, launched 21 Oct 1896 (9 months to launch); completion date not captured | Under the manual's rule this is a CL-size protected cruiser |
| HMS *Blake* | protected cruiser | 9,150 | 22 kn nominal | deck 3-6 in, casemates 6 in | 2 x 9.2 in, 10 x 6 in, 4 x 14 in tubes | laid Jul 1888, launched 23 Nov 1889, ready Feb 1892, about 43 months | 4 triple-expansion engines (2 main, 2 cruising), 20,000 ihp; a 9.2 in single-mount protected cruiser, which is the manual's CL exception case |
| *Majestic* class (9 ships, 1893-98) | pre-dreadnought battleship | 16,060 | 16 kn (17 forced), 10,000 ihp | Harvey belt 9 in, deck 3 in flat/4 in slope, barbettes 14 in (7 in below), turret faces 10 in, casemates 6 in, CT 14 in | 4 x 12 in, 12 x 6 in QF, 5 x 18 in tubes | HMS *Majestic*: laid Feb 1894, launched 31 Jan 1895, commissioned 12 Dec 1895, about 22 months | Fast dockyard build; engines modest (8 Scotch boilers) |
| *Havock* / *Hornet* (1893-94) | torpedo-boat destroyer | 275 full load | 27 kn | none | 1 x 12-pdr, 3 x 6-pdr, 3 x 18 in tubes | *Hornet*: laid 1 Jul 1892, launched 23 Dec 1893, completed Jul 1894, about 24 months | *Havock* locomotive boilers vs *Hornet* Yarrow water-tube; *Havock* was re-boilered with water-tube boilers in 1899-1900; bow tube later removed because the boat outran its torpedo. *Hornet* made 27.6 kn on trials |

Cross-reference with [BN] (primary Brassey volumes already in the repo): *Edgar* class (7,700 t, 10,000 ihp natural, trials 19.25 kn natural and 20.97 kn forced), *Powerful*/*Terrible* hulls built by contract in about 3 years at about GBP 31/t hull-plus-machinery; machinery about GBP 4/ihp. These are better graded than the [WP] rows above and were not re-derived here.

Observations useful for design-limit tuning:
- Battleships from British dockyards took about 22 months keel to commissioning in the mid-1890s, cruisers 30-45 months, destroyers about 24 months for a small hull with new boiler tech. The guide's "22-24 months for 6 kt" is in a plausible range for a mid-1890s battleship-scale hull but is a different class than the guide implies.
- Boiler novelty (Belleville, Yarrow, Amiraute) drove both trial shortfalls (*Cressy* 0.3 kn below 21 kn) and multi-year delay (*Dupuy de Lome*). Machinery reliability and delay are therefore historically grounded, not a game-only mechanic.
- Armoured cruisers of this decade at 6,000-12,000 t carried belts of 2-6 in (*Cressy*) to 4 in (*Dupuy de Lome*), 7.6 in-9.2 in mains (*Dupuy de Lome* 194 mm, *Cressy* 9.2 in), and 20-21 kn, which sits inside the CA window above (belt > 2 in, 19 kn, 11 in gun cap). A 2 in belt would sit exactly at the boundary and would not classify as CA.

## 4. Open questions

1. Is there a developer post or patch note explaining a speed ceiling before 1925 (the commenter's 21 kn)? Not found; try the NWS / Matrix forums or the game's data files if licensing allows reading them.
2. Months-per-displacement table: not in the manual. Derive Bluewave's from the historical rows above (22 months battleship, 31 months armoured cruiser) and ADR it, with a build-time multiplier like the manual's industry-efficiency modifier.
3. Should Bluewave add the protected-cruiser exception (single mounts up to 8 in classify as CL)? The repo has no protected-cruiser armour scheme; the 1890-1900 fleet includes several (Blake, Diadem, Powerful).
4. Does the repo's strict `> 6 in` CA gun bound need a recorded decision versus the manual's "at least 6 in"?
5. Check `ARMOUR_MODIFICATION` in `refit.ts` against the manual list (deck +1 in, remove CT, change upper belt).
6. Verify [WP] dates and specs against Conway's, Brassey 1900-1902 (archive.org `CASGA_120406`, `brasseysnavala1902brasuoft`) or Navypedia for any value that becomes a content-pack constant.

## 5. Licensing

The manual is copyrighted; only rules thresholds were paraphrased, as facts. Bluewave clones features, not RTW3 content: use the class thresholds only as a cross-check, and keep any adopted numbers recorded in Bluewave's own DESIGN-22 / ADRs.
