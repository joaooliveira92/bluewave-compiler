# Research: Content-1 — Ship Classification & National Economy ~1880

Research-only notes for authoring game content in the `scen_1880` pack (start
January 1880). Sources are Wikipedia primary/definitional articles plus the
Maddison project GDP dataset, with per-claim citations. Game-tuning economy
figures are **BALANCE TARGET** (non-normative) per the project's
`docs/rules`/README contract and are clearly marked as such; they are grounded
in the historical relative ranking, not in any normative spec value.

Target content hooks:

- `design templates` → `hullType` string field
- `design templates` → `machineryType` string field
- `economies.yaml` → `{ nationId, treasury, income, expenses }`
- `fleets.yaml` → capital ship counts

The economies schema lives in `packages/campaign/src/compiler.ts:282–311`
(defaults `treasury=500, income=100, expenses=50`, plus a
`navalAppropriationRateBp=2000` constant at :303). IDs in `countries.yaml` are
ISO alpha-3-style tags (`GBR`, `FRA`, …) — matched by `nationId` at :288.

---

## 1. Ship hull types in service / designed by 1880

Intended IDs are `snake_case`; sizes are typical full-load displacement ranges;
"role" is the fleet function. All definitions are classically period-accurate
and confirmed by the cited articles.

### 1.1 Ironclad line-of-battle types

| hullType id            | Name                                | ~Displacement  | Role                                                           | Notes                                                                                                                                                                                |
| ---------------------- | ----------------------------------- | -------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ironclad_turret_ship` | Ironclad turret ship                | 7,000–12,000 t | High-freeboard heavy in turrets; ocean capital ship            | The main heavy type of the 1880s; e.g. RN `Devastation`-class "breastwork monitors"/turret battleships, `Inflexible` (1876). Precursor of the modern battleship. [Ironclad, §Navies] |
| `central_battery_ship` | Central battery / casemate ironclad | 5,000–9,000 t  | Capital ship with guns in an armored central citadel/casemate  | UK term central battery, continental term casemate ship. RN built 18 (Bellerophon 1865 onward); standard into early 1880s. [Central battery ship]                                    |
| `broadside_ironclad`   | Broadside ironclad frigate          | 4,000–9,000 t  | Early high-freeboard ironclad, full gun deck                   | 1860s type still in service in 1880 (Warrior class, Gloire class) but obsolescent. [Ironclad]                                                                                        |
| `coast_defense_ship`   | Coast defense ship                  | 1,500–8,000 t  | Coastal battleship/armored ship, shallow draft, high freeboard | Period 1860–1920; used by nations unable to afford full battleships (Netherlands, Nordic, Portugal, Ottoman, China, Brazil, Japan-related `kaibōkan`). [Coastal defence ship]        |
| `monitor`              | Monitor / breastwork monitor        | 1,500–6,000 t  | Low-freeboard coastal turret ship                              | Union built ~50; by 1870s mostly reserve except new British/French coastal types. [Ironclad, §ACW; Coastal defence ship]                                                             |

### 1.2 Cruising types (armored / unarmored)

| hullType id           | Name                        | ~Displacement | Role                               | Notes                                                                                                               |
| --------------------- | --------------------------- | ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `armored_cruiser`     | Armored cruiser             | 4,000–9,000 t | Long-range cruiser with belt armor | First true armored cruiser: Russian `General-Admiral` (1873). [Armored cruiser; Ironclad, §Navies]                  |
| `protected_cruiser`   | Protected cruiser           | 2,500–7,000 t | Cruiser with armored deck, no belt | Type named for its armored deck over machinery; late-19th C. "second/third-class" sizes common. [Protected cruiser] |
| `unprotected_cruiser` | Unprotected cruiser / scout | 1,500–4,000 t | Unarmored cruiser                  | Included for completeness of 1880 cruiser inventories.                                                              |
| `sloop`               | Sloop-of-war                | 800–2,000 t   | Colonial/patrol, general purpose   | Unarmored steam/sail small warship; used widely for empire policing.                                                |

### 1.3 Coastal and flotilla types

| hullType id    | Name            | ~Displacement | Role                                                               | Notes                                                                                                                                          |
| -------------- | --------------- | ------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `torpedo_boat` | Torpedo boat    | 30–200 t      | Fast coastal attacker, self-propelled Whitehead torpedo            | Late-1870s/1880s introduction; Jeune École staple; Russia used them widely in the Russo-Turkish War 1877–78. [Torpedo boat; Ironclad, §Navies] |
| `gunboat`      | Gunboat         | 200–1,500 t   | Shallow-draft gun platform, river/colonial                         | Standard colonial/coastal workhorse of the era.                                                                                                |
| `frigate`      | (Screw) frigate | 2,000–6,000 t | Unarmored cruising frigate; by 1880 largely superseded by cruisers | "Armoured frigate" label applied to early ironclads; unarmored screw frigates were obsolescent by 1880. [Ironclad; Marine steam engine]        |

> Design guidance: for the early 1880s pack, the available/computable heavy types
> should be `ironclad_turret_ship`, `central_battery_ship`, `broadside_ironclad`,
> `coast_defense_ship`, and `monitor`; the cruiser types surface as the era
> progresses, with `protected_cruiser`/`armored_cruiser` being genuinely 1880s
> entries. `torpedo_boat`/`gunboat`/`sloop` supply the flotilla layer.

---

## 2. Machinery types of the era

| machineryType id         | Name                                             | Availability ~1880                            | Notes                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reciprocating_compound` | Reciprocating compound (double-expansion) engine | Standard through the 1870s–1880s              | Marine compound engines (two pressure stages) spread from the mid-1860s (John Elder; first ocean-viable, Alfred Holt ~1865 at 60 psi). The default machinery for commerce and naval ships in 1880. [Marine steam engine, "Compound"]                                                                                                                        |
| `triple_expansion`       | Triple-expansion (multiple-expansion) engine     | At the very end of the window — arriving 1881 | Expands steam in three stages; first successful commercial installation was SS _Aberdeen_ (1881, ~125–150 psi); an earlier 1874 experiment (_Propontis_) had boiler problems. **Effectively a brand-new "next-gen" machinery at Jan 1880** — treat as an EARLY-era advanced option, not yet standard. [Marine steam engine, "Triple or multiple expansion"] |

> Design guidance: at Jan 1880 the standard is `reciprocating_compound`;
> `triple_expansion` should gate as a technology unlock early in EARLY (1881+).
> Older simple-expansion (single-stage) engines were still common in small
> craft and older ships but are not needed as a distinct current machinery type.

---

## 3. National economic power ranking ~1880

The authoritative GDP grounding is **Maddison (2007), table A.4**, reproduced in
Wikipedia's _List of regions by past GDP (PPP)_ — values are total GDP (PPP) in
**millions of 1990 international dollars**, most recent column useful for this
era is **1870** (the anchor mid-point trend basis for 1880).

| Nation                                       |                            Maddison GDP 1870 (m 1990 Int$) | GDP index (UK=100) |
| -------------------------------------------- | ---------------------------------------------------------: | -----------------: |
| China                                        |                                                    189,740 |                189 |
| United Kingdom                               |                                                    100,180 |                100 |
| United States                                |                                                     98,374 |                 98 |
| Russia (former USSR)                         |                                                     83,646 |                 83 |
| Germany                                      |                                                     72,149 |                 72 |
| France                                       |                                                     72,100 |                 72 |
| Austria-Hungary (Eastern-Europe basis, est.) | ~44,000 (Austria alone 8,419; Eastern Europe total 50,163) |                ~44 |
| Italy                                        |                                                     41,814 |                 42 |
| Japan                                        |                                                     25,393 |                 25 |
| Spain                                        |                                                     19,556 |                 20 |
| Ottoman Empire (West-Asia basis, est.)       |                           ~19,000 (West Asia total 22,468) |                ~19 |
| Netherlands                                  |                                                      9,952 |                 10 |
| Brazil (Other Latin America basis, est.)     |                          ~9,700 (Other LatAm total 21,097) |                ~10 |
| Portugal                                     |                                                      4,219 |                  4 |

Source: _List of regions by past GDP (PPP)_ §"1–2008 (Maddison)", citing Maddison
2007 p. 379 table A.4. Austria-Hungary, Ottoman, and Brazil are interpolated
estimates (marked est.) from the closest regional aggregates, because Maddison
does not give standalone rows for them in this table.

### Relative naval strength (drives game economy)

Total GDP **overstates** naval power for the USA (huge GDP, tiny navy) and China
(huge GDP, not yet an industrialized naval power). The **relative naval
strength index** below therefore blends Maddison GDP with 1880-era naval
budget/fleet realities (UK spending roughly twice France; France well ahead of
Italy/Germany/Russia; USA/China far below their GDP rank), and is the number the
game economy should be tuned against.

**GAME TUNING / BALANCE TARGET — non-normative estimates.** The income/expense/
treasury figures scale a UK baseline of 100 (matching the economy compiler
default `income=100` in `compiler.ts:283`) and are intentionally
non-normative tuning guidance, not spec values. Re-scale if different
construction/maintenance cost constants are chosen.

| Nation                | Naval-strength index (UK=100) | Game income (BALANCE TARGET) | Game expenses (BALANCE TARGET) | Game treasury start (BALANCE TARGET) |
| --------------------- | ----------------------------: | ---------------------------: | -----------------------------: | -----------------------------------: |
| United Kingdom (GBR)  |                           100 |                          100 |                             38 |                                 1000 |
| France (FRA)          |                            68 |                           68 |                             26 |                                  700 |
| Russia (RUS)          |                            55 |                           55 |                             21 |                                  550 |
| Italy (ITA)           |                            38 |                           38 |                             14 |                                  400 |
| Germany (DEU/GER)     |                            30 |                           30 |                             12 |                                  320 |
| United States (USA)   |                            26 |                           26 |                             10 |                                  280 |
| Austria-Hungary (AUT) |                            22 |                           22 |                              9 |                                  240 |
| Ottoman Empire (OTT)  |                            16 |                           16 |                              7 |                                  180 |
| Spain (ESP)           |                            16 |                           16 |                              7 |                                  180 |
| Japan (JPN)           |                            12 |                           12 |                              5 |                                  130 |
| China (CHN)           |                             9 |                            9 |                              4 |                                  100 |
| Netherlands (NLD)     |                             7 |                            7 |                              3 |                                   80 |
| Brazil (BRA)          |                             5 |                            5 |                              2 |                                   60 |
| Portugal (PRT)        |                             3 |                            3 |                              2 |                                   40 |

> Rationale notes (BALANCE TARGET): `income` should be slightly above the naval
> index so the biggest navy (GBR) can sustain its ~30 capital ships plus new
> construction each month; `expenses` ≈ 35–40% of income models non-fleet
> running costs (leaving a construction surplus); `treasury` ≈ 10× monthly
> income gives the starting cash buffer. These are the values to drop into
> `economies.yaml` as-is if the compiler defaults remain the reference unit.

---

## 4. Ironclad / capital-ship fleet counts ~1880

Ranges sized from Conway's-era navy totals and the narrative in the cited
articles; treat as "ordered magnitude" starting-fleet targets, **not** exact
historical enumerations (authoring the actual classes is a separate CONTENT-1
work item).

| Nation          | Capital ships (ironclads / monitors) ~1880 | Notes                                                                                                                                                                           |
| --------------- | -----------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| United Kingdom  |                                     ~29–32 | World's largest navy for the whole ironclad period; broadside + central battery + turret ships; two-power standard agitation in the early 1880s. [Ironclad, §Navies]            |
| France          |                                     ~28–30 | Largest rival; building paused in fits under Jeune École influence in the 1870s–80s. [Ironclad, §Navies]                                                                        |
| Russia          |                                     ~20–24 | Baltic + Black Sea fleets; pioneered armored cruiser (General-Admiral 1873) and popovka monitors; many ships copies of British/French types. [Ironclad, §Navies]                |
| Italy           |                                     ~20–24 | Large ironclad programme; duilio-class super-guns; several casemate ships (Principe Amedeo). [Central battery ship]                                                             |
| Germany         |                                     ~10–12 | Casemate Kaiser-class and others; small but modernizing. [Central battery ship]                                                                                                 |
| United States   |                                     ~11–13 | Ended ACW with ~50 monitors, most laid up by the 1870s; five new large monitors ordered in the 1870s; fleet effectively tiny/in reserve. [Ironclad, §Navies]                    |
| Austria-Hungary |                                      ~9–11 | Casemate central-battery programme post-Lissa (Custoza, Tegetthoff). [Central battery ship]                                                                                     |
| Ottoman Empire  |                                     ~15–17 | Ironclad-long fleet (incl. the UK-built ironclads), though technologically mixed; used them against Russia 1877–78; in decline after the Russo-Turkish War. [Ironclad, §Navies] |
| Spain           |                                       ~5–6 | Including the circumnavigating Numancia; modest fleet. [Ironclad, §Navies]                                                                                                      |
| Japan           |                                        3–5 | Began with Kōtetsu/Azuma (1869); commissioning more from British/European yards through the 1880s. [Ironclad, §Navies]                                                          |
| China (Qing)    |                                        2–4 | Beiyang fleet building in the 1880s; paper-superior at Yalu (1894) but small in 1880. [Ironclad, §Navies]                                                                       |
| Netherlands     |                                        4–6 | Coast-defense-oriented fleet (coastal defence ships). [Coastal defence ship]                                                                                                    |
| Brazil          |                                        2–3 | Front-line capital ships early on; small fleet. [Coastal defence ship]                                                                                                          |
| Portugal        |                                        1–2 | Very small navy; coastal-defence focus. [Coastal defence ship]                                                                                                                  |

---

## 5. Sources

- Wikipedia, _Ironclad warship_ — definitions (Hill's three characteristics),
  turret/central-battery/broadside taxonomy, ram era, "Navies" section (fleet
  narratives for UK, France, Russia, US, Japan, China, Ottoman), armored-cruiser
  origin (General-Admiral), torpedo boats in the Russo-Turkish War. Fetched via
  MediaWiki parse API (sections 19–20 "Fleets/Navies").
- Wikipedia, _Central battery ship_ — casemate/central battery definition, RN's
  18 examples, per-navy casemate programs (Austria, Russia, Germany, Italy,
  Greece, Chile).
- Wikipedia, _Coastal defence ship_ — definition, scope nations, displacement
  range 1,500–8,000 t.
- Wikipedia, _Protected cruiser_ — armored-deck/no-belt definition, late-19th-C.
- Wikipedia, _Armored cruiser_ — belt-armor cruiser, first example General-
  Admiral (1873).
- Wikipedia, _Torpedo boat_ — small fast torpedo carrier, late-19th-C. threat.
- Wikipedia, _Marine steam engine_ — "Compound" (double-expansion) and
  "Triple or multiple expansion" (SS _Aberdeen_, 1881; _Propontis_, 1874).
- Wikipedia, _List of regions by past GDP (PPP)_, §"1–2008 (Maddison)" — Maddison
  2007, p. 379 table A.4 (1870 GDP in m 1990 Int$).

### Repo-sourced grounding (for tuning targets only)

- `packages/campaign/src/compiler.ts:282–311` — economy defaults and the
  `{nationId, treasury, income, expenses}` record shape.
- README.md:18 / `.ai/SPRINT-PLAN.md:83` — `BALANCE TARGET` = non-normative
  tuning guidance (the status of §3's game numbers).

---

## 6. Key conclusions

1. Hull-type taxonomy for 1880 spans armored heavy types
   (`ironclad_turret_ship`, `central_battery_ship`, `broadside_ironclad`,
   `coast_defense_ship`, `monitor`) plus the emerging cruisers
   (`armored_cruiser`, `protected_cruiser`) and the flotilla layer
   (`torpedo_boat`, `gunboat`, `sloop`); obsolete `frigate` rounds out
   inventories.
2. At Jan 1880 the standard machinery is `reciprocating_compound`;
   `triple_expansion` is a just-arriving (1881) advanced option.
3. Relative GDP (UK=100) from Maddison 1870: USA 98, Russia 83, Germany 72,
   France 72, Italy 42, A-H ~44, Japan 25, Spain 20, Ottoman ~19, Netherlands
   10, Brazil ~10, Portugal 4, China 189 (large total, low naval weight).
4. Relative **naval strength** (the economy driver) is lower than GDP for
   USA/China and higher-order-correct for the naval powers; this index feeds the
   **BALANCE TARGET** income/expense/treasury numbers in §3 (UK=100 baseline).
5. Starting capital-ship counts ~1880 range from UK ~30 down to Portugal ~1–2;
   these size `fleets.yaml` starting fleets.
