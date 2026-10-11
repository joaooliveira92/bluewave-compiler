# Research: national naval profile — Russia (1880–1899)

Companion to `national-naval-profiles-uk-france.md` and `national-naval-profiles-germany.md`; method, source
grades and confidence labels identical (VERIFIED / SINGLE-SOURCE / DERIVED / ESTIMATE / UNVERIFIED; **Wikipedia is
not cited anywhere**). Every in-repo figure (gun families, plants, hull forms, balance) is reused from the
EARLY-band notes. Captured 2026-10-10.

## 0. Question

Ground a date-banded `NationNavalProfile` for **Russia** (`russia`, the canonical repo id), plus shared-family
national models and six 1880 opening reference designs, **without** projecting the 1890s–1900s Imperial fleet
(Borodino, Tsushima-era) back to 1880. The 1880 Russian navy is a huge, poor, technologically lagging empire with
three separated fleets (Baltic, Black Sea, Pacific), a coastal-defence/torpedo and cruiser-raiding tradition, and a
small blue-water cruiser force.

## 1. Method, sources, labels

Same labels and source grades as the two companion notes. Two new directly-read sources are added here:

| Tag | Source | Grade / reach |
| --- | --- | --- |
| `[NA86]` | T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`, full OCR text read via `curl` this session (pp. 20–21, 264–270, 301–304, 360–363, 502–504). | **Primary annual (1886).** Sections read directly. |
| `[NP]` | navypedia.org Russian class pages (Ivan Gogin), built principally on Conway's _All the World's Fighting Ships 1860–1905_ + national histories. **Fetched directly this session** (ids in §Sources). | Secondary compilation → SINGLE-SOURCE. |
| `[NW]` | navweaps.com (Tony DiGiulian) Russian gun pages; compilation of Russian print works (Shirokorad, Amirkhanov). **Fetched directly this session.** | Compilation → SINGLE-SOURCE. |
| `[SA1880]` | `docs/research/ship-building-1880-ships-by-nation.md` §6.2 (in-repo; navypedia-derived). | In-repo, re-used, not re-derived. |
| `[PRE]` | `docs/research/ship-building-1880-pre-era-armament.md` §3 (in-repo). | In-repo ordnance table. |
| `[CW]` | Conway's _All the World's Fighting Ships 1860–1905_ (Campbell 1979); S. McLaughlin, _Russian & Soviet Battleships_ (2003). **Not opened** this session (only relayed via `[NP]`/`[SA1880]`). | Print secondary; SINGLE-SOURCE (relayed). |

Limits: Conway's and McLaughlin were **not opened** online; every figure resting on them is at most SINGLE-SOURCE.
`[NA86]` is a period annual and its Russian ordnance/industry passages are read directly (VERIFIED as read).
Where a figure could not be grounded, an explicitly labelled ESTIMATE/UNVERIFIED is given rather than a point value.

Conversions: 1 ihp = 0.7457 kW; 1 lb = 0.4536 kg; 1 in = 25.4 mm; 1 long ton = 1016.05 kg; 1 kn = 0.5144 m/s.

---

# A. Strategic posture

The 1886 annual is explicit: "**In Russia the coast-defence vessels and cruisers had absorbed practically the entire
resources of the Naval Department. The ironclad fleet includes only one first-rate actually completed, the _Peter
the Great_, 9,340 tons.**" `[NA86]` p. 21. This is the single anchor for the 1880–1886 posture.

| posture | applies? | justification (one line) | source | confidence |
| --- | --- | --- | --- | --- |
| coastal_defence | **primary** | Popovkas (Novgorod, Vitse-Admiral Popov), monitors and coast-defence ironclads for Kronstadt and the Black Sea; coast defence "absorbed practically the entire" effort `[NA86]` p. 21. | `[NA86]`; `[NP]` Novgorod/Pervenets | VERIFIED (statement) |
| torpedo_warfare | **primary** | Very large flotillas and an early torpedo-war tradition: 1886 Baltic had 10 boats >100 ft, 74 of 70–100 ft, 20 <70 ft (21 without Whiteheads); Black Sea 12+8+6; Pacific 6 `[NA86]` pp. 269–270. | `[NA86]`; `[NP]` Vzryv/Batum | VERIFIED (counts) |
| distant_water_operations | **primary** | Three separated fleets on three coasts with no sea link (Baltic, Black Sea, Pacific); a Siberian squadron and Pacific station ships were kept in being. | `[NA86]` pp. 269–270, 503; `[CW]` relayed | SINGLE-SOURCE |
| commerce_raiding | **secondary** | Volunteer (Black Sea) Fleet armed merchantmen (Holsatia, Moskwa, St. Petersburg…) and auxiliary cruisers (Czar, Czarevna, Czaritza) were a standing guerre-de-course wing against British trade. | `[NA86]` p. 269 | VERIFIED (ships) |
| regional_warfare | **secondary** | The Baltic and Black Sea are separate theatres with local opponents (Germany/Sweden; Turkey); no ocean battle-fleet concentration in 1880. | `[NA86]` p. 21 | SINGLE-SOURCE |
| battle_fleet_concentration | **weak / emerging** | Only one first-rate completed in 1880 (Petr Velikiy); the 1881 twenty-year programme laid down 11 + 4 first/second-class ironclads for the Baltic and 8 for the Black Sea — a battle line was planned, not held. | `[NA86]` pp. 21, 504; `[NP]` Ekaterina II | VERIFIED (programme) |
| colonial_presence | **minimal** | Possessions are contiguous empire (Siberia, Vladivostok 1860), not a coaling-station empire; a small Pacific squadron only. | `[NA86]` pp. 269, 503 | SINGLE-SOURCE |
| commerce_defence | **no** | No trade-defence obligation comparable to Britain's; the cruiser force is designed to raid, not to police trade routes. | `[NA86]` pp. 264–269 | ESTIMATE |

Recommended primary postures: **coastal_defence + torpedo_warfare**, with **distant_water_operations** and
**commerce_raiding** co-equal secondaries and **battle_fleet_concentration** a weak, growing preference.

### A.1 In-service 1880 ships (re-used from `[SA1880]` §6.2 — do not re-derive)

- **Petr Velikiy** turret ship (completed 15.10.1876): 9,790/10,460 t ("9,340" per `[NA86]`); 103.5 oa / 98.1 pp ×
  19.0 × 8.28 m; 2 HRCR, 6,400 ihp, 12.3 kn (engines defective until 1881 Elder refit); 2×2 305 mm (12-in
  obr.1867) in 2 twin turrets; 6×87 mm + 2×4 25 mm; belt 356–292 (ends 254–203), citadel/turrets 356, deck 76;
  coal 1,200 t; crew 440. `[NP]`/`[SA1880]` VERIFIED (displ; two sources) / SINGLE-SOURCE rest.
- **Novgorod** circular coast-defence monitor (1874): 2,491 t; 30.8 × 30.8 × 4.11 m; 6 HC, 3,000 ihp, 6–7 kn; 1×2
  279 mm obr.1867 in 1 twin barbette; 2×87 mm; sides 229–178, barbette 229, deck 70; coal 160 t; crew 149.
  Sister _Vitse-Admiral Popov_ (1876). `[NP]` SINGLE-SOURCE.
- **General-Admiral** armoured cruiser/frigate (20.9.1875; sister _Gertsog Edinburgskiy_ 1877): 5,031 t; 91.0 oa /
  87.1 wl × 14.6 × 7.01 m; 1 VC, 4,470 ihp, 12.3 kn; 6×203 mm + 2×152 mm + 4×87 mm; belt 152–127 (complete),
  deck 25; coal 1,000 t; crew 490. **The first armoured cruisers in the world** (`[NP]`). `[NP]` SINGLE-SOURCE.

---

# B. Industrial capability

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| Yard base | State yards at Kronstadt, St. Petersburg (New Admiralty, Galerny Island, Baltic/Nevsky), Nikolayev and Sevastopol; private St. Petersburg works (Semyannikov & Poletika, Carr & McFerson, Franko-Russkiy) | — | `[NA86]` p. 504; `[NP]` class pages | VERIFIED (yards named) |
| Capacity shortfall | "**The resources of the Royal Dockyards and private establishments of the country are insufficient, and many vessels have therefore been ordered abroad.**" (1886) | — | `[NA86]` p. 502 | **VERIFIED (primary, verbatim)** |
| 1881 twenty-year programme | Baltic 11 first-class + 4 second-class ironclads + 11 gunboats + 10 _Iris_-size cruisers + 6 transports; Black Sea 8 first-class ironclads + 6 despatch + 8 torpedo boats; Pacific 4 gunboats + 4 torpedo boats. Cost: shipbuilding 185,623,500 / artillery 22,857,000 / torpedoes 6,709,000 roubles | ships / roubles | `[NA86]` p. 504 | VERIFIED (as printed) |
| Navy Estimates | £3,940,590 (1886) vs £3,550,110 (1885) | GBP/yr | `[NA86]` p. 301 (from _Revue Maritime_) | VERIFIED (as printed) |
| Material policy | Hulls of ironclads and cruisers to be "**built in Russia of Russian material**"; foreign material only "such… as could not be easily and reasonably obtained in the country" | — | `[NA86]` p. 504 | VERIFIED (primary, verbatim) |
| Build-time modifier | SLOWER/SAME as the 1894 baseline; foreign-designed hulls (Nakhimov = _Imperieuse_ copy) built in Russian yards took 4–5 years. Propose **10800 bp** (range 10500–11200) | ×10000 | ESTIMATE from completion slips | ESTIMATE / **BALANCE TARGET** |
| Cost modifier | Higher per hull (small series, state yards, imported mountings/armour systems). Propose **11000 bp** (range 10500–11200) | ×10000 | ESTIMATE; `[NA86]` p. 503 (foreign orders) | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement | ~10,000 t (1880) → ~11,000 t (1885) → ~11,500 t (1890) | t | ESTIMATE from completed classes (Ekaterina II 11,048 t 1888; Imperator Aleksandr II 10,010 t 1890) | ESTIMATE |
| Heavy-gun production | **DOMESTIC — Obukhov (Obuchoff/OSZ) works**; "the Gun Factory and Aboukhoff Works" (`[NA86]` p. 360); "Russian heavy guns are either made by Krupp on designs of similar character…, **or copied by the Russians in their own steel**" (`[NA86]` p. 363). Obukhov founded **1863** (year UNVERIFIED). | — | `[NA86]` pp. 360, 363; `[NW]` OSZ/Obukhovski | VERIFIED (as read); year UNVERIFIED |
| Armour-plate production | **DOMESTIC/LICENSE — Izhora (Isherski) works**: "the Obuchoff and Isherski armour-plate manufactories have been enlarged" (`[NA86]` p. 503); early 12-in compound plates "made under Messrs. **Cammell's direction** in the new Russian factories" (`[NA86]` p. 362) → licence-built under British direction | — | `[NA86]` pp. 362–363 | VERIFIED (primary, verbatim) |
| Machinery reliability | **LOW** — Petr Velikiy's engines "had never been satisfactory" and were replaced by Elder (Glasgow) 1881 (`[NP]`); mounts for Ekaterina II built by Easton & Anderson, Erith (`[NA86]` p. 362); torpedo boats bought from Schichau, Elbing (`[NA86]` p. 503). Propose **8000 bp** | ×10000 | `[NP]`; `[NA86]` pp. 362, 503 | ESTIMATE / **BALANCE TARGET** |
| Construction-quality variance | **HIGH** — Dmitriy Donskoy "not well subdivided" (British report, `[NP]`); Chesma "somewhat deficient in stability" (`[NP]`). Propose **4500 bp** | ×10000 | `[NP]`; ESTIMATE | ESTIMATE / **BALANCE TARGET** |

Direction of every multiplier is grounded (slower, costlier, lower-reliability, higher-variance); the magnitude is
a balance choice inside the ±15 % band (as in the UK/France/Germany notes).

---

# C. Doctrine

| field | Russia position | source | confidence |
| --- | --- | --- | --- |
| engagement range | short — period norm; Russian heavy RML/BL practice and low freeboard favour close action. Propose **1,500–2,000 m** | `[NA86]`; period contrast in UK/France note | ESTIMATE (period) |
| main-gun emphasis | strong but slow: 12-in obr.1867 then 12"/30 M1877 (ROF ≈ 1 round / 3 min 50 s on Ekaterina II), mounted in **twin barbettes/turrets** in a triangular/central redoubt | `[NW]` 12-30 m1877; `[NA86]` p. 264 | SINGLE-SOURCE |
| secondary-battery emphasis | **heavy and mixed**: 9-in (229 mm), 8-in (203 mm) and 6-in (152 mm) in casemates/open on the main deck, largely unarmoured | `[NW]` 9-35/8-35/6-35; `[NA86]` p. 264 | SINGLE-SOURCE |
| gun-quality priorities | domestic Obukhov copies of Krupp designs; the 12"/35 M1886 was "noted weak" and chase-hooped 1891 | `[NA86]` p. 363; `[NW]` 12-35 m1886 | VERIFIED (statement) |
| AP vs HE | mixed; black powder bag charges through the 1880s, AP/cast-iron shot the period norm. Propose hePreference **~4,500–5,000 bp** | `[NA86]`; `[PRE]` | ESTIMATE / **BALANCE TARGET** |
| fire-control priority | minimal in-band; no rangefinding until the 1890s | — | ESTIMATE |
| rate-of-fire | slow (heavy BL 0.25–0.35/min); light Hotchkiss/Nordenfelt guns 20–50/min | `[NW]` | SINGLE-SOURCE |

---

# D. Research priorities (1–4)

Shipped draft `research.yaml` russia = `MACHINERY: 2, GUNNERY: 2`. Grounded recommendation (priority 1–4):

| field | priority | justification | source | confidence |
| --- | --- | --- | --- | --- |
| TORPEDOES | 4 | The defining Russian arm: enormous flotillas; early torpedo-war experience (1877–78); domestic 381 mm tubes | `[NA86]` pp. 269–270; `[NP]` | VERIFIED (counts) |
| GUNNERY | 3 | Domestic Obukhov heavy-gun works; the 12"/30 M1877 and 6"/35 M1877 are real Russian designs | `[NA86]` p. 360; `[NW]` | VERIFIED (statement) |
| MINES_AND_ASW | 3 | Russia was a pioneer of mine warfare and mine/torpedo defence; 100 mines per capital ship as built | `[NP]` Ekaterina II | SINGLE-SOURCE |
| HULL_CONSTRUCTION | 3 | "Hulls… built in Russia of Russian material"; steel/iron hulls and protective decks in service by 1886 | `[NA86]` p. 504; `[NP]` Rynda | VERIFIED (statement) |
| MACHINERY | 2 | Lagging: defective domestic engines, foreign machinery/mounts bought in | `[NP]` Petr Velikiy; `[NA86]` pp. 362, 503 | SINGLE-SOURCE |
| INFRASTRUCTURE | 2 | Docks at Kronstadt/Sevastopol/Nikolayev, but "resources… insufficient" and ships ordered abroad | `[NA86]` p. 502 | VERIFIED (verbatim) |
| DAMAGE_CONTROL | 2 | Poor subdivision on cruisers (Dmitriy Donskoy) | `[NP]` | SINGLE-SOURCE |
| SHIP_DESIGN | 2 | Foreign-derived designs (Nakhimov = _Imperieuse_ copy); unconventional popovkas | `[NA86]` p. 264; `[NP]` | SINGLE-SOURCE |
| SUBMARINES | 2 | Early Russian interest (Dzhevetsky 1881; Nordenfelt purchased 1887) — **research preference only** | `[CW]` relayed | UNVERIFIED |
| FIRE_CONTROL | 1 | No in-band rangefinding | — | UNVERIFIED |

> **DESIGN-55 guard.** SUBMARINES / MINES_AND_ASW are recorded as *research preferences* only. Any submarine or
> mine mechanic that is deferred/unaccepted must not be treated as reachable content in this profile; the profile
> carries the preference weight, nothing else.

---

# E. Component access

`status` ∈ DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED | UNAVAILABLE. Foreign signature heavies are
UNAVAILABLE; Russian versions sit on the shared families with a national model (§F).

| family id | status | producer / note | source | confidence |
| --- | --- | --- | --- | --- |
| `gun_rml_12in_25ton` | DOMESTIC | 12-in obr.1867, Obukhov | `[SA1880]` §6.2; `[PRE]` | SINGLE-SOURCE |
| `gun_rml_11in_25ton` | DOMESTIC | 11-in obr.1867, Obukhov (Novgorod) | `[NP]` Novgorod | SINGLE-SOURCE |
| `gun_rml_8in_9ton` | DOMESTIC | 8-in obr.1867, Obukhov (General-Admiral, Minin) | `[NP]` | SINGLE-
SOURCE |
| `gun_rml_64pdr_71cwt` | DOMESTIC | 6-in obr.1867 (152 mm RML), Obukhov | `[NP]` | SINGLE-SOURCE |
| `gun_bl_12in_25` | DOMESTIC | 12"/30 (305 mm) Pattern 1877, Obukhov; **Krupp design, Russian steel** | `[NW]`; `[NA86]` p. 363 | SINGLE-SOURCE |
| `gun_bl_92in_315` | DOMESTIC | 9"/35 (229 mm) Pattern 1877, Obukhov (family is 9.2-in; bore abstraction) | `[NW]` 9-35 m1877 | SINGLE-SOURCE |
| `gun_bl_6in_26` | DOMESTIC | 6"/35 (152 mm) Pattern 1877 (Brink), Obukhov | `[NW]` 6-35 m1877 | SINGLE-SOURCE |
| `gun_qf_12pdr` | LICENSE_BUILT | 75 mm/50 Pattern 1892 (Canet licence) at OSZ & Perm | `[NW]` 29-50 m1891 | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr` | LICENSE_BUILT | 47 mm Hotchkiss; Russian production from 1888 at Tula | `[NW]` 47mm Hotchkiss | SINGLE-SOURCE |
| `gun_qf_6pdr` | IMPORTED | 57 mm Hotchkiss (later Russian service) | `[NW]` 57 mm page | SINGLE-SOURCE |
| `gun_nordenfelt_1in` | IMPORTED | Nordenfelt 1-in licence | `[NA86]` p. 300 | SINGLE-SOURCE |
| `gun_maxim_303` | IMPORTED | Maxim (later) | `[NW]` | SINGLE-SOURCE |
| `tube_14in_above_water` | DOMESTIC | 381 mm trainable tube (Obukhov/Whitehead licence) | `[NP]` | SINGLE-SOURCE |
| `tube_14in_submerged` | DOMESTIC | 381 mm submerged bow tube | `[NP]` | SINGLE-SOURCE |
| `gun_bl_274mm_m1875` | UNAVAILABLE | French 27 cm | — | rule |
| `gun_bl_263mm_rkl20` | UNAVAILABLE | German 26 cm Krupp | — | rule |
| `gun_bl_135in_30` | UNAVAILABLE | British 13.5-in | — | rule |
| `gun_bl_12in_35` | UNAVAILABLE | British 12-in/35 | — | rule |
| `gun_bl_10in_32` | UNAVAILABLE | British 10-in | — | rule |
| `gun_qf_6in_40` | UNAVAILABLE | British 6-in QF (Russia used 6"/35 domestic) | — | rule |
| `gun_qf_47in` | UNAVAILABLE | British 4.7-in (Russia used 75 mm Canet) | — | rule |
| `gun_rml_16in_80ton`, `gun_rml_125in_38ton`, `gun_rml_12in_35ton`, `gun_rml_10in_18ton*`, `gun_rml_7in_7ton` | UNAVAILABLE | British RMLs not in Russian service | — | rule |

`hardCapabilities`: maxGunCaliberUm 305000; maxArmourThicknessUm 406000 (Ekaterina II belt); domesticTorpedoDiameterUm
381000; hullForms `[torpedo_boat_form, protected_cruiser_form, coast_defence_form, pre_dreadnought_form,
merchant_liner_form]`; domesticPlants `[compound_cylindrical, triple_expansion_cylindrical, locomotive_boiler_tb]`.

---

# F. National component variants (12)

Each maps a shared family id → Russian national designation with sourced shell mass / parameters and a `mounts`
list. `caliberUm` is overridden where the family's nominal bore differs.

| family id | RU national model | parameters (sourced) | mounts | source | confidence |
| --- | --- | --- | --- | --- | --- |
| `gun_rml_12in_25ton` | **12-in obr.1867** (Petr Velikiy; Ekaterina II as designed) | cal 305; shell ~331,700 g (EST by analogy with the M1877); charge/MV not recovered | TURRET, BARBETTE | `[SA1880]` §6.2; `[PRE]` §3 | SINGLE-SOURCE (cal/year); shell/MV UNVERIFIED |
| `gun_rml_11in_25ton` | **11-in obr.1867** (Novgorod, Popov) | cal 279; shell/MV not recovered | BARBETTE | `[NP]` Novgorod | UNVERIFIED |
| `gun_rml_8in_9ton` | **8-in obr.1867** (General-Admiral, Minin) | cal 203; shell/MV not recovered | BARBETTE, DECK_OPEN | `[NP]` | UNVERIFIED |
| `gun_rml_64pdr_71cwt` | **6-in obr.1867** (152 mm RML, General-Admiral) | cal 152; shell/MV not recovered | BROADSIDE_BATTERY, CASEMATE | `[NP]` | UNVERIFIED |
| `gun_bl_12in_25` | **12"/30 (305 mm) Pattern 1877**, Obukhov | shell 331,700 g (AP/HE); shrapnel 390,000 g; charge 121–123 kg; MV 570 m/s; ROF ≈ 1/3 min 50 s; mount 116–160 t | BARBETTE, TURRET | `[NW]` WNRussian_12-30_m1877 | SINGLE-SOURCE (VERIFIED as read) |
| `gun_bl_92in_315` | **9"/35 (229 mm) Pattern 1877**, Obukhov | cal 229; shell light 126,000 g / heavy 188,400 g; charge 72–74 kg; MV 653 / 569 m/s; single casemate 77 t | CASEMATE | `[NW]` WNRussian_9-35_m1877 | SINGLE-SOURCE (bore abstraction: family 9.2-in) |
| `gun_bl_6in_26` | **6"/35 (152 mm) Pattern 1877** (Brink), Obukhov | shell heavy 55,000 g / light 41,500 g; charge 22.9 kg; MV 578–710 m/s; ROF 1/min; mount 10.3–10.6 t | CASEMATE, DECK_OPEN | `[NW]` WNRussian_6-35_m1877 | SINGLE-SOURCE |
| `gun_bl_12in_25` | **12"/35 (305 mm) Pattern 1886** (Krupp design, Obukhov 1891) | shell light 331,700 g / heavy 455,000 g; charge 147–154 kg; MV 610 / 637 m/s; **barrel weak, chase-hooped 1891** | BARBETTE, TURRET | `[NW]` WNRussian_12-35_m1886 | SINGLE-SOURCE |
| `gun_qf_12pdr` | **75 mm/50 Pattern 1892** (Canet licence) | shell 4,900 g; charge 1.5 kg; MV 823 m/s; ROF 12–15; mount ~4 t | DECK_OPEN, DECK_SHIELDED | `[NW]` WNRussian_29-50_m1891 | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr` | **47 mm Hotchkiss** (Tula from 1888) | shell 1,500 g; 5-barrel 578 kg / single 235 kg; MV 450 / 701 m/s | DECK_OPEN | `[NW]` WNRussian_47mm_Hotchkiss | SINGLE-SOURCE |
| `tube_14in_above_water` | **381 mm torpedo tube, above-water trainable** | bore 381; trainable carriage | — | `[NP]` | SINGLE-SOURCE |
| `tube_14in_submerged` | **381 mm torpedo tube, submerged bow** | bore 381; fixed bow | — | `[NP]` | SINGLE-SOURCE |

Note: two families (`gun_bl_12in_25`, `gun_bl_92in_315`) take a Russian model *and* the 12"/35 M1886 also sits on
`gun_bl_12in_25`; a profile may register it as a separate model with `introductionMonth: "1891-01"`.

---

# G. Six 1880 opening reference designs (doctrine templates, ESTIMATE)

Each is a legal 1880-01 starting point (or a doctrine template where the type post-dates 1880), grounded in Russian
practice: heavily armoured, slow, mixed armament, coastal/torpedo. **Moulded depth is UNVERIFIED for every ship**
(no source gives it) — `depthToMainDeck` is ESTIMATE throughout. Torpedo-bore caveat: the catalogue's 1880 model is
the 356 mm Whitehead; Russian ships actually carried 381 mm tubes (recorded as the national variant).

### RU-B — Ekaterina-II-type barbette/turret ship (doctrine template)
| item | value | source | confidence |
| --- | --- | --- | --- |
| hull form | `pre_dreadnought_form` | rule | rule |
| L × B × T (wl) | 103,500 × 21,000 × 8,480 mm | `[NP]` Ekaterina II | SINGLE-SOURCE |
| depthToMainDeck | 13,000 mm (EST) | — | UNVERIFIED |
| blockCoeffBp | 5,900 (derived from 11,048 t, 103.5×21.0×8.48) | DERIVED | ESTIMATE |
| target displacement | 11,000,000 kg | `[NP]` | SINGLE-SOURCE |
| plant / power / fuel | `compound_cylindrical` / 6,800 kW (9,100 ihp) / coal 1,120,000 kg | `[NP]` | SINGLE-SOURCE |
| main (1880-legal) | 4 × 305 mm obr.1867 (`gun_rml_12in_25ton`) in 2 twin TURRET; 6-gun 12"/30 M1877 from 1883 | `[NP]`; `[NW]` | SINGLE-SOURCE |
| secondary | 6 × 152 mm + 8 × 47 mm Hotchkiss | `[NP]` | SINGLE-SOURCE |
| armour (compound) | belt 406–203 (ends 203–152), redoubt 305, deck 57, CT 292–203 | `[NP]` | SINGLE-SOURCE |
| doctrine note | slow, massively armoured Black Sea redoubt ship; 3 twin 12-in if the 1883 M1877 is available. | — | ESTIMATE |

### RU-CA — General-Admiral-type armoured cruiser (historical template)
| item | value | source | confidence |
| --- | --- | --- | --- |
| hull form | `protected_cruiser_form` | rule | rule |
| L × B × T (wl) | 87,100 × 14,600 × 7,010 mm | `[NP]` | SINGLE-SOURCE |
| depthToMainDeck | 9,000 mm (EST) | — | UNVERIFIED |
| blockCoeffBp | 5,500 (derived from 5,031 t) | DERIVED | ESTIMATE |
| target displacement | 5,031,000 kg | `[NP]` | SINGLE-SOURCE |
| plant / power / fuel | `compound_cylindrical` / 3,333 kW (4,470 ihp) / coal 1,000,000 kg | `[NP]` | SINGLE-SOURCE |
| main | 6 × 203 mm obr.1867 (`gun_rml_8in_9ton`) on upper deck | `[NP]` | SINGLE-SOURCE |
| secondary | 2 × 152 mm obr.1867 + 4 × 87 mm | `[NP]` | SINGLE-SOURCE |
| armour (wrought iron) | complete belt 152–127 (2.1 m high), deck 25 | `[NP]` | SINGLE-SOURCE |
| doctrine note | the world's first armoured cruiser: thin complete belt, long-range station/commerce-raiding hull. | — | SINGLE-SOURCE |

### RU-CL — Rynda/Vityaz-type protected corvette (doctrine template)
| item | value | source | confidence |
| --- | --- | --- | --- |
| hull form | `protected_cruiser_form` | rule | rule |
| L × B × T | 80,000 × 13,700 × 5,330 mm | `[NP]` Rynda (79.4 m) | SINGLE-SOURCE |
| depthToMainDeck | 7,000 mm (EST) | — | UNVERIFIED |
| blockCoeffBp | 5,600 (derived from 3,537 t) | DERIVED | ESTIMATE |
| target displacement | 3,500,000 kg | `[NP]` | SINGLE-SOURCE |
| plant / power / fuel | `compound_cylindrical` / 2,237 kW (3,000 ihp) / coal 500,000 kg | `[NP]` | SINGLE-SOURCE |
| main | 4 × 152 mm obr.1867 (`gun_rml_64pdr_71cwt`) broadside | `[NP]` | SINGLE-SOURCE |
| secondary | 4 × 87 mm + light Hotchkiss | `[NP]` | SINGLE-SOURCE |
| torpedo | 1 × 381 mm bow tube | `[NP]` | SINGLE-SOURCE |
| armour (steel) | protective deck 38 | `[NP]` | SINGLE-SOURCE |
| doctrine note | single-screw steel corvette for station/colony and distant-water commerce protection. | — | SINGLE-SOURCE |

### RU-DD — Batum/Vzryv torpedo boat (historical template)
| item | value | source | confidence |
| --- | --- | --- | --- |
| hull form | `torpedo_boat_form` | rule | rule |
| L × B × T | 30,600 × 3,660 × 1,910 mm | `[NP]` Batum | SINGLE-SOURCE |
| depthToMainDeck | 3,500 mm (EST) | — | UNVERIFIED |
| blockCoeffBp | 4,400 (game convention for small craft; computed ≈1,960 is unreliable at this scale) | ESTIMATE | ESTIMATE |
| target displacement | 43,000 kg | `[NP]` | SINGLE-SOURCE |
| plant / power / fuel | `compound_cylindrical` / 373 kW (500 ihp) / coal 10,000 kg | `[NP]` | SINGLE-SOURCE |
| main | none (light 37/47 mm Hotchkiss) | `[NP]` | SINGLE-SOURCE |
| torpedo | 2 × 381 mm bow tubes | `[NP]` | SINGLE-SOURCE |
| armour | none | `[NP]` | SINGLE-SOURCE |
| doctrine note | cheap coastal torpedo boat; bow tubes; importable from Schichau/Yarrow. | `[NA86]` p. 503 | SINGLE-SOURCE |

### RU-KE — colonial/Pacific gunboat (doctrine template)
| item | value | source | confidence |
| --- | --- | --- | --- |
| hull form | `coast_defence_form` | rule | rule |
| L × B × T | 66,000 × 10,670 × 3,500 mm | `[NP]` Koreets; `[NA86]` p. 270 (1886 gunboats 64 m) | SINGLE-SOURCE |
| depthToMainDeck | 6,000 mm (EST) | — | UNVERIFIED |
| blockCoeffBp | 4,800 (derived from 1,213 t) | DERIVED | ESTIMATE |
| target displacement | 1,220,000 kg | `[NA86]` p. 270 (1,224 t) | VERIFIED (as printed) |
| plant / power / fuel | `compound_cylindrical` / 1,119 kW (1,500 ihp) / coal 240,000 kg | `[NP]` | SINGLE-SOURCE |
| main (1880-legal) | 2 × 203 mm obr.1867 (`gun_rml_8in_9ton`) in shields; 2 × 8-in + 1 × 6-in from 1883 | `[NP]`; `[NA86]` p. 270 | SINGLE-SOURCE |
| secondary | 1 × 152 mm obr.1867 + 6 × Hotchkiss | `[NA86]` p. 270 | SINGLE-SOURCE |
| armour (steel) | deck 10, shields 19 | `[NP]` Koreets | SINGLE-SOURCE |
| doctrine note | shallow-draught barquentine-rigged station gunboat for the Pacific/Siberian squadron. | — | SINGLE-SOURCE |

### RU-AMC — Volunteer-Fleet auxiliary cruiser (doctrine template)
| item | value | source | confidence |
| --- | --- | --- | --- |
| hull form | `merchant_liner_form` | rule | rule |
| L × B × T | 115,000 × 14,000 × 7,500 mm | merchant-liner band | SINGLE-SOURCE |
| depthToMainDeck | 8,000 mm (EST) | — | UNVERIFIED |
| blockCoeffBp | 6,200 (game convention) | ESTIMATE | ESTIMATE |
| target displacement | 3,050,000 kg | `[NA86]` p. 269 (Thuringia 3,050 t) | VERIFIED (as printed) |
| plant / power / fuel | `compound_cylindrical` / 2,983 kW (4,000 hp) / coal 900,000 kg | `[NA86]` p. 269 | SINGLE-SOURCE |
| main | 4 × 152 mm-class (`gun_rml_64pdr_71cwt`) in opened mounts | `[NA86]` p. 269 (7 guns) | SINGLE-SOURCE |
| secondary | 4 × 47 mm Hotchkiss | ESTIMATE | ESTIMATE |
| armour | none (hull only) | rule | rule |
| doctrine note | armed fast liner of the Volunteer (Black Sea) Fleet for commerce raiding. | `[NA86]` p. 269 | SINGLE-SOURCE |

---

# H. Naming

Published 1880s Russian ship names as stems (facts; cited to class pages and `[NA86]`):

- **B:** Petr Velikiy, Ekaterina II, Chesma, Sinop, Georgii Pobedonosets, Navarin, Imperator Aleksandr II,
  Imperator Nikolai I, Dvenadsat Apostolov, Pervenets. `[NP]`; `[SA1880]` §6.2. SINGLE-SOURCE.
- **CA:** General-Admiral, Gertsog Edinburgskiy, Minin, Admiral Nakhimov, Vladimir Monomakh, Dmitriy Donskoy,
  Pamiat Azova, Rurik. `[NP]` class pages. SINGLE-SOURCE.
- **CL:** Kreyser, Dzhigit, Razboynik, Nayezdnik, Plastun, Strelok, Vestnik, Oprichnik, Rynda, Vityaz. `[NP]`
  Kreyser/Rynda. SINGLE-SOURCE.
- **DD:** Vzryv, Batum, Sukhum, Poti, Gagry, Gelendzhik, Sirena, Skorpion. `[NP]` torpedo-boat list. SINGLE-SOURCE.
- **KE:** Burun, Tucha, Burya, Groza, Dozhd, Grad, Yorsh, Mina, Sneg, Turza, Vikhr, Koreets, Mandzhur. `[NA86]`
  pp. 269–270; `[NP]`. SINGLE-SOURCE.
- **AMC:** Holsatia, Moskwa, St. Petersburg, Kostroma, Nijni-Novgorod, Konstantin, Vesta, Argonaut; auxiliaries Czar,
  Czarevna, Czaritza. `[NA86]` p. 269. SINGLE-SOURCE.

One-line convention per type:

| type | convention |
| --- | --- |
| B | Emperors, empresses, saints, Orthodox names and famous victories/battles (Petr Velikiy, Ekaterina II, Sinop, Chesma, Georgii Pobedonosets, Navarin). |
| CA | Admirals, princes and medieval Russian warriors (General-Admiral, Admiral Nakhimov, Dmitriy Donskoy, Vladimir Monomakh, Rurik). |
| CL | Clipper/corsair roles — speed, hunters, messengers (Kreyser, Dzhigit, Razboynik, Nayezdnik, Vestnik, Oprichnik) and place-flavoured corvettes (Rynda, Vityaz). |
| DD | Explosions/actions and Black Sea places (Vzryv, Batum); numbered boats later. |
| KE | Weather, birds and places (Burun, Groza, Dozhd, Korelts→Koreets, Mandzhur). |
| AMC | Names taken up from trade, largely Volunteers of the Black Sea Fleet (Holsatia, Moskwa, St. Petersburg). |

---

# I. Recommendations (concrete profile values)

| profile field | Russia candidate | basis | label |
| --- | --- | --- | --- |
| `strategicSituation.primary` | coastal_defence + torpedo_warfare (+ distant_water_operations, commerce_raiding) | §A | grounded (VERIFIED/SINGLE) |
| `industrialProfile.buildTimeMultiplierBp` | 10800 (range 10500–11200) | insufficient yards; foreign orders | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.costMultiplierBp` | 11000 (range 10500–11200) | `[NA86]` p. 503 | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.machineryReliabilityBp` | 8000 | Petr Velikiy engines | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.constructionQualityVarianceBp` | 4500 | Donskoy/Chesma | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.maxPracticalDisplacementKg` (1880/1885/1890) | 10.0M / 11.0M / 11.5M | completed classes | ESTIMATE |
| `industrialProfile.heavyGunProduction` | DOMESTIC | `[NA86]` pp. 360, 363 | grounded |
| `industrialProfile.armourPlateProduction` | DOMESTIC (LICENSE_BUILT early, Cammell direction) | `[NA86]` pp. 362–363 | grounded |
| `doctrineProfile.engagementRangeM` | 1500–2000 | period | ESTIMATE |
| `doctrineProfile.hePreferenceBp` | 4500–5000 | black-powder AP norm | ESTIMATE / **BALANCE TARGET** |
| `researchPreferences` | TORPEDOES 4, GUNNERY 3, MINES 3, HULL 3, (see §D) | §D | grounded shape / ESTIMATE |
| `componentAccess` / `gunModels` / `componentVariants` | §E/§F (12 variants) | — | mixed per row |
| `namingPolicy` | §H | published lists | grounded (SINGLE-SOURCE) |

Keep every cost/build-time modifier inside ±15 % and label it BALANCE TARGET; ship every ESTIMATE/UNVERIFIED with
its label (the merchant-liner discipline).

---

# J. Deferred (needs an owner or a decision-request)

- **12-in / 11-in / 8-in / 6-in obr.1867 gun values** — shell, charge, MV and penetration were not recovered;
  `[PRE]` §3 explicitly marks them UNVERIFIED. A print source (Shirokorad, _Morskaya Artilleriya Rossiyskogo Flota
  1867–1922_; Obukhov catalogue) is needed before the models are release-grade. Until then the RML families inherit
  their British figures (misleading) or carry an ESTIMATE flag.
- **Moulded depth for every design** — no source gives it (carried over from the earlier notes). Depths are ESTIMATE.
- **Russian dock capacity / max displacement per yard** — grounded only indirectly from completed classes;
  `[NA86]` p. 502 states the shortfall but gives no per-dock tonnage. A Brassey yard table would settle it.
- **Obukhov founding year (1863)** and **Izhora works** — the works are named and their existence/expansion verified
  (`[NA86]` pp. 360, 362–363), but the founding year is UNVERIFIED.
- **`research.yaml` field-priority keys** — the shipped file uses two keys only; the brief's nine-field enum must be
  confirmed before the profile references TORPEDOES/MINES_AND_ASW/etc.
- **AMC/KE/CA/CL doctrine templates** — only Petr Velikiy, Novgorod, General-Admiral and the torpedo boats are true
  1880 ships; confirm fictional-but-legal starters are acceptable (the existing `reference-designs.yaml` already does
  this for the UK/France/Germany).
- **Naming dataset** — stems listed; full curation (transliteration, collision handling) is content authoring.

---

# K. Verdict

**Qualified yes — the Russia profile is authorable now, with per-figure labels.** The *shape* (coastal-defence and
torpedo primacy, weak battle line, three separated fleets, commerce-raiding cruisers, imported early machinery
against domestic Obukhov guns/Izhora armour) rests on the directly-read `[NA86]` (VERIFIED) and the directly-read
`[NP]`/`[NW]` pages (SINGLE-SOURCE). The gun models (12"/30 M1877, 9"/35 M1877, 6"/35 M1877, 75 mm Canet, 47 mm
Hotchkiss) are grounded in `[NW]`. What is ESTIMATE/BALANCE TARGET (multipliers, max displacement, doctrine
weights, moulded depths, the doctrine templates) is labelled as such. What is genuinely missing (obr.1867 gun
values, dock capacities, Obukhov founding year) is deferred and flagged — none of it blocks a first profile.

## Source list

1. T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886` (full OCR, read directly via
   `curl`): pp. 20–21 (comparative strength), 264–270 (Notes on the Russian Navy), 301–304 (Russian estimates and
   programme), 360–363 (Russian ordnance/mounts), 502–504 (Russian construction activity and programme).
2. navypedia.org Russian class pages (read directly this session): `russia/ru_bb_pyotr_velikiy.htm`,
   `ru_bb_novgorod.htm`, `ru_cr_general_admiral.htm`, `ru_bb_ekaterina_ii.htm`, `ru_bb_imerator_alexandr_ii.htm`,
   `ru_bb_pervenets.htm`, `ru_cr_minin.htm`, `ru_cr_knyaz_pozharskiy.htm`, `ru_cr_vladimir_monomakh.htm`,
   `ru_cr_dmitriy_donskoy.htm`, `ru_cr_admiral_nakhimov88.htm`, `ru_cr_rynda.htm`, `ru_cr_kreyser.htm`,
   `ru_dd_vzryv.htm`, `ru_dd_batum.htm`, `ru_dd_leytenant_ilyin.htm`, `ru_dd_kazarskiy.htm`, `ru_of_burun.htm`,
   `ru_of_koreets.htm`.
3. navweaps.com Russian gun pages (read directly this session): `WNRussian_Main.php`,
   `WNRussian_12-30_m1877.php`, `WNRussian_12-35_m1886.php`, `WNRussian_9-35_m1877.php`,
   `WNRussian_6-35_m1877.php`, `WNRussian_8-35_m1885.php`, `WNRussian_29-50_m1891.php`,
   `WNRussian_47mm_Hotchkiss.php`.
4. In-repo companions: `docs/research/ship-building-1880-ships-by-nation.md` §6.2;
   `ship-building-1880-pre-era-armament.md` §3; `content-1-fleets-and-ship-classes.md` §4;
   `national-naval-profiles-uk-france.md`; `national-naval-profiles-germany.md`;
   `content/production/1880/ship-building/{components,plants,hull-forms,naval-profiles,reference-designs}.yaml`.
5. Print works named as leads (not opened this session): Conway's _All the World's Fighting Ships 1860–1905_
   (Campbell 1979); S. McLaughlin, _Russian & Soviet Battleships_ (2003); A. V. Shirokorad, _Morskaya Artilleriya
   Rossiyskogo Flota 1867–1922_; Jane's _Fighting Ships_.
