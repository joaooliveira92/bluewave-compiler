# Research: Ship-building catalogue — EARLY band (1880–1899) weapons, armour, propulsion, hulls, weights, range

Factual grounding for the component-level ship compiler's catalogue (ADR-0063 / ADR-0064, `.scratch/ship-building/`)
for the EARLY era band (Jan 1880 – Dec 1899, see `content-0-scenario-era-bands.md`). Research-only; no
catalogue files are authored here. Captured 2026-10-08.

## Method, source grades and confidence labels

Every figure carries a named source and one of these labels:

- **VERIFIED** — read directly in a period primary/near-primary text (full text fetched and read) or in two independent sources that agree.
- **SINGLE-SOURCE** — one source only, or a secondary compilation that itself cites print works (named in the row) which I could not open.
- **ESTIMATE** — derived by me from other cited figures (calculation shown) or an inferred range; not itself a source figure.
- **UNVERIFIED** — no usable source found, or sources conflict; a plausible range is given instead of a point value.

Source grades used (Wikipedia is **not** cited as a source; where a Wikipedia article was used to find a lead, the print work it
cites is named and the row is at most SINGLE-SOURCE):

| Tag  | Source                                                                                                                                                                                                         | Grade                                                                                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [W]  | W. H. White (Director of Naval Construction), _A Manual of Naval Architecture_, 3rd/4th ed., London: John Murray, 1894 (full text read: archive.org id `manualofnavalarc00whitrich`; OCR, page numbers from running heads) | Primary (the RN designer's own handbook). OCR errors on fractions; flagged where relevant.                |
| [B2] | T. A. Brassey (ed.), _The Naval Annual 1902_, Portsmouth: J. Griffin (archive.org id `brasseysnavala1902brasuoft`)                                                                                             | Primary/contemporary annual; includes retrospective 1890s data.                                           |
| [B8] | T. A. Brassey (ed.), _The Naval Annual 1898_ (archive.org id `CASGA_120405`)                                                                                                                                   | Primary/contemporary annual; table OCR is largely scrambled, only isolated rows legible.                  |
| [BO] | US Navy Bureau of Ordnance, _The Whitehead Torpedo_ (1898), Navy Dept. Washington; transcription at legacy.maritime.org/doc/whitehead                                                                          | Primary (service manual).                                                                                  |
| [EB] | _Encyclopaedia Britannica_, 11th ed. (1911), art. "Armour Plates" (Wikisource transcription)                                                                                                                   | Near-primary (contemporary reference, 1911).                                                               |
| [NW] | navweaps.com (Tony DiGiulian) — a compilation of primary tables (Treatise on Ammunition, Text Book of Gunnery, Brassey, Jane's, Okun's metallurgy tables); accepted as a compilation of primary data, per brief | Compilation. NOTE: several of its gun pages list charges/ROF for later (WWI/WWII) ammunition; flagged.   |
| [TG] | _Text Book of Gunnery_ (HM Stationery Office, 1887), Table XVI — **not opened**; reached only via a secondary article                                                                                          | Primary but SINGLE-SOURCE (relayed).                                                                      |
| [CW] | Conway's _All the World's Fighting Ships 1860–1905_ (1979); Burt, _British Battleships 1889–1904_ (2013); Lyon, _The First Destroyers_ (1996); Gröner (1990); Dodson (2016) — reached via encyclopaedia summaries, **not opened** | Print secondary; SINGLE-SOURCE (relayed).                                                                 |

Limits of this note: archive.org OCR of Brassey's ship tables is column-scrambled, so ship-by-ship Brassey rows are mostly
unusable; Jane's _Fighting Ships_ (first 1898) and Armstrong/Elswick/Krupp/Whitehead catalogues were not reachable online in this
session. Rootsweb/USNI/Dreadnought Project pages returned HTTP 403 and were not worked around.

---

## 1. Naval weapons (1880–1899)

Conversions: 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 in = 25.4 mm; 1 fps = 0.3048 m/s; 1 yd = 0.9144 m.
All gun data below are from [NW] (compiling Treatise on Ammunition, Text Book of Gunnery, Brassey) unless stated. Gun mass includes breech
mechanism unless noted. "Charge" is the **full-service** charge for the service-entry propellant (black/brown prismatic, SP, or cordite where
stated); ROF is practical sustained fire, not cyclic maximum.

### 1.1 Heavy breech-loaders

| item                                      | figure                                            | unit    | source                                                                  | confidence                                                                    |
| ----------------------------------------- | ------------------------------------------------- | ------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| BL 12"/25 Mk I/II — in service            | 1885                                              | year    | [NW] WNBR_12-25_mk1                                                     | SINGLE-SOURCE                                                                 |
| 12"/25 — calibre                          | 305                                               | mm      | 12 in × 25.4                                                            | VERIFIED (arithmetic)                                                         |
| 12"/25 — gun mass                         | 43.8 long tons (44,500)                           | t (kg)  | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 12"/25 — AP shell                         | 714 lb (324)                                      | lb (kg) | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 12"/25 — charge                           | 295 lb prismatic brown (134)                      | lb (kg) | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 12"/25 — muzzle velocity                  | 1,914 (583)                                       | fps (m/s)| [NW]                                                                   | SINGLE-SOURCE                                                                 |
| 12"/25 — ROF                              | 0.3–0.5                                           | rds/min | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 12"/25 — penetration                      | 20.5 in (521) wrought iron @ 1,000 yd             | in (mm) | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| BL 13.5"/30 Mk I–IV (Royal Sovereign) — in service | 1885                                     | year    | [NW] WNBR_135-30_mk1                                                    | SINGLE-SOURCE                                                                 |
| 13.5"/30 — calibre                        | 343                                               | mm      | 13.5 × 25.4                                                             | VERIFIED (arithmetic)                                                         |
| 13.5"/30 — gun mass                       | 67 long tons (68,100)                             | t (kg)  | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 13.5"/30 — shell                          | 1,250 lb (567) all types                          | lb (kg) | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 13.5"/30 — charge                         | 630 lb SBC (286); 187 lb cordite (84.8) later     | lb (kg) | [NW]                                                                    | SINGLE-SOURCE (cordite entry post-1895)                                      |
| 13.5"/30 — muzzle velocity                | 2,016 (614) SBC; 2,099 (640) cordite              | fps (m/s)| [NW]                                                                   | SINGLE-SOURCE                                                                 |
| 13.5"/30 — ROF                            | 0.3–0.5 (one round per ~2 min for good crews)     | rds/min | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 13.5"/30 — penetration                    | 28 in (711) iron @ 1,000 yd; 11 in (279) Krupp @ 3,000 yd | in (mm) | [NW]                                                          | SINGLE-SOURCE                                                                 |
| BL 12"/35 Mk VIII (Majestic) — in service | 1895                                              | year    | [NW] WNBR_12-35_mk8                                                     | SINGLE-SOURCE                                                                 |
| 12"/35 Mk VIII — gun mass                 | 46 long tons (46,700)                             | t (kg)  | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 12"/35 Mk VIII — shell                    | 850 lb (386)                                      | lb (kg) | [NW]; also [B2] "850-lb. shot", 12-in. V≈2,500 f.s. for existing guns  | VERIFIED (two sources)                                                        |
| 12"/35 Mk VIII — charge                   | 174 lb Cordite (78.9) (1908–14 loads)             | lb (kg) | [NW]                                                                    | ESTIMATE for 1895 (page lists 1908+ charges; 1895 cordite load likely similar, range 170–200 lb / 77–91 kg) |
| 12"/35 Mk VIII — muzzle velocity          | 2,350 (716) per [NW]; ~2,500 f.s. quoted for "existing 12-in. guns" in [B2] p.~300 | fps (m/s) | [NW]; [B2]                                              | SINGLE-SOURCE (the two disagree by ~6%: range 716–762 m/s)                    |
| 12"/35 Mk VIII — ROF                      | 1 per 70 s ready-use, then 1 per 100 s (0.6–0.86); improved mounts 1.33 | rds/min | [NW]                                                          | SINGLE-SOURCE                                                                 |
| 12"/35 Mk VIII — penetration              | 33 in (838) iron @ 1,000 yd; 12 in (305) steel @ 3,100 yd; 8.5 in (216) KC @ 10,000 yd | in (mm) | [NW]                                         | SINGLE-SOURCE                                                                 |
| 12" 1902 reference: 12-in. gun penetration | 46 in iron for "up-to-date 12-in. B.L." vs 18 in for best 12.5-in. gun of 1875 | in      | [B2] pp. 289–290                                                       | VERIFIED (contemporary statement)                                             |
| BL 10"/32 Mk I–IV — in service            | 1885                                              | year    | [NW] WNBR_10-32_mk1-4                                                   | SINGLE-SOURCE                                                                 |
| 10"/32 — calibre                          | 254                                               | mm      | 10 × 25.4                                                               | VERIFIED (arithmetic)                                                         |
| 10"/32 — gun mass                         | 29.5 long tons (30,000); Mk I 32.3 (32,800)       | t (kg)  | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 10"/32 — AP shell                         | 500 lb (227)                                      | lb (kg) | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 10"/32 — charge                           | 252 lb prismatic brown (114.3); half 126 lb       | lb (kg) | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 10"/32 — muzzle velocity                  | 2,040 (622); half 1,393 (425)                     | fps (m/s)| [NW]                                                                   | SINGLE-SOURCE                                                                 |
| 10"/32 — ROF                              | ~0.5                                              | rds/min | [NW]                                                                    | SINGLE-SOURCE                                                                 |
| 10"/32 — penetration                      | 20.4 in (518) iron @ 1,000 yd                     | in (mm) | [NW]                                                                    | SINGLE-SOURCE                                                                 |

### 1.2 Medium guns

| item                                    | figure                                                      | unit    | source                                                                             | confidence                                                             |
| --------------------------------------- | ----------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| BL 9.2"/31.5 Mk III–VII — in service    | 1881                                                        | year    | [NW] WNBR_92-31_mk3                                                                | SINGLE-SOURCE                                                          |
| 9.2"/31.5 — calibre                     | 234                                                         | mm      | 9.2 × 25.4                                                                         | VERIFIED (arithmetic)                                                  |
| 9.2"/31.5 — gun mass                    | 22–24 long tons (22,400–24,400)                             | t (kg)  | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 9.2"/31.5 — shell                       | 380 lb CPC (172.4)                                          | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 9.2"/31.5 — charge                      | 163 lb prismatic brown (73.9)                               | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 9.2"/31.5 — muzzle velocity             | 2,065 (629)                                                 | fps (m/s)| [NW]                                                                              | SINGLE-SOURCE                                                          |
| 9.2"/31.5 — ROF                         | ~1                                                          | rds/min | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 9.2"/31.5 — penetration                 | 5 in (127) vertical armour @ 6,000 yd (from _Big Gun Monitors_) | in (mm) | [NW]                                                                           | SINGLE-SOURCE (armour type not stated; likely iron/steel mix)         |
| BL 6"/26 Mk III/IV/VI — in service      | Mk I 1880s (page gives no date for Mk I–II)                 | year    | [NW] WNBR_6-26_mk1                                                                 | UNVERIFIED for year (range 1881–1887)                                  |
| 6"/26 — gun mass                        | not given on page                                           | —       | [NW]                                                                               | UNVERIFIED (ESTIMATE 4.0–4.5 long tons / 4,000–4,600 kg from scale between 6"/40's 6.6 t and shorter bore — no source) |
| 6"/26 — shell                           | 100 lb (45.3)                                               | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 6"/26 — charge                          | 48 lb EXE/prismatic (21.8)                                  | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 6"/26 — muzzle velocity                 | 1,960 (597)                                                 | fps (m/s)| [NW]                                                                              | SINGLE-SOURCE                                                          |
| 6"/26 — ROF                             | ~4                                                          | rds/min | [NW]                                                                               | SINGLE-SOURCE                                                          |
| QF 6"/40 Mk I–III — in service          | 1892 (designed 1888)                                        | year    | [NW] WNBR_6-40_mk1                                                                 | SINGLE-SOURCE                                                          |
| 6"/40 — gun mass                        | 6.6 long tons (6,700)                                       | t (kg)  | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 6"/40 — shell                           | 100 lb CPC/HE (45.3)                                        | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 6"/40 — charge                          | 29.75 lb EXE (13.5); 13.25 lb Cord 30 (6.0); 15.94 lb MD26 (7.2) | lb (kg) | [NW]                                                                          | SINGLE-SOURCE (EXE is the 1892 original; cordite from ~1896; MD is post-1900) |
| 6"/40 — muzzle velocity                 | 1,882 (574) EXE; 2,230 (680) Cord; 2,243 (684) MD           | fps (m/s)| [NW]                                                                              | SINGLE-SOURCE                                                          |
| 6"/40 — ROF                             | 5–7                                                         | rds/min | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 6"/40 — penetration                     | not given by [NW]; [B2] p.~338 tabulates the "Majestic and Royal Sovereign 6"/40" in a penetration/ROF table whose columns OCR-scramble | — | [B2]                                       | UNVERIFIED (ESTIMATE 6–9 in iron-equivalent at close range; no source)  |
| QF 4.7" (Elswick/Hotchkiss pattern) — British service | 1887                                         | year    | [NW] WNBR_47-40_mk1                                                                | SINGLE-SOURCE                                                          |
| 4.7" QF — gun mass                      | 2.07–2.1 long tons (2,100–2,150)                            | t (kg)  | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 4.7" QF — shell                         | 45 lb (20.4)                                                | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 4.7" QF — charge                        | 12.0 lb SP (5.4); 5.44 lb Cord 20 (2.5)                     | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 4.7" QF — muzzle velocity               | 1,786 (544) SP; 2,125 (648) Cord                            | fps (m/s)| [NW]                                                                              | SINGLE-SOURCE                                                          |
| 4.7" QF — ROF                           | 5–6                                                         | rds/min | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 4.7" QF — penetration                   | listed 11.7 in (297) wrought iron at 0 yd, from an 1893 newspaper (NYT) trial report | in (mm) | [NW]                                                       | UNVERIFIED (implausibly high for 45-lb shell; treat as ESTIMATE 5–8 in / 125–200 mm at point-blank) |

### 1.3 Light QF guns and machine guns

| item                                    | figure                                                      | unit    | source                                                                             | confidence                                                             |
| --------------------------------------- | ----------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| QF 12-pdr 12-cwt 3"/40 — in service     | 1894 (first used in the "27-knot" destroyers)               | year    | [NW] WNBR_3-40_mk1                                                                 | SINGLE-SOURCE                                                          |
| 12-pdr — gun mass                       | 0.6 long tons (510 kg, gun + breech)                        | kg      | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 12-pdr — shell                          | 12.5 lb (5.67)                                              | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 12-pdr — charge                         | page lists 2.09 lb SC (0.95) / 2.75 lb NF (1.25): later propellants | lb (kg) | [NW]                                                                      | ESTIMATE for 1894 (black/cordite load ~2–3 lb; range 0.9–1.4 kg)      |
| 12-pdr — muzzle velocity                | 2,235 (681)                                                 | fps (m/s)| [NW]                                                                              | SINGLE-SOURCE                                                          |
| 12-pdr — ROF                            | 15                                                          | rds/min | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 12-pdr — mounting                       | 1,253 kg (PI* pedestal); 2,489 kg (HA/LA IX, later)         | kg      | [NW]                                                                               | SINGLE-SOURCE (PI* is the 1890s-appropriate value)                    |
| QF 6-pdr 8-cwt 2.244"/40 — in service   | 1884                                                        | year    | [NW] WNBR_6pounder_m1                                                              | SINGLE-SOURCE                                                          |
| 6-pdr — calibre                         | 57                                                          | mm      | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 6-pdr — gun mass                        | 849 lb (385)                                                | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 6-pdr — shell                           | 6.0 lb (2.72)                                               | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 6-pdr — charge                          | pre-WWII "0.243 lb CT (0.11)"; WWII 0.55–0.70 lb (0.25–0.32) | lb (kg) | [NW]                                                                              | ESTIMATE for 1884 (black powder ~0.9–1.3 lb / 0.4–0.6 kg, no source) |
| 6-pdr — muzzle velocity                 | 1,765 (538)                                                 | fps (m/s)| [NW]                                                                              | SINGLE-SOURCE                                                          |
| 6-pdr — ROF                             | 20                                                          | rds/min | [NW]                                                                               | SINGLE-SOURCE                                                          |
| Hotchkiss 3-pdr 47 mm/40 — in service   | 1886 (design c.1885)                                        | year    | [NW] WNBR_3pounder_H_mk1                                                           | SINGLE-SOURCE                                                          |
| 3-pdr — gun mass                        | 528 lb (240)                                                | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 3-pdr — shell                           | 3.3 lb HE (1.5); complete round 5.7 lb (2.6)                | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 3-pdr — charge                          | 0.54 lb MD (0.24) WWI; earlier loads not given              | lb (kg) | [NW]                                                                               | ESTIMATE for 1886 (0.2–0.35 kg)                                       |
| 3-pdr — muzzle velocity                 | 1,884 (574) new gun; 1,873 (571) average                    | fps (m/s)| [NW]                                                                              | SINGLE-SOURCE                                                          |
| 3-pdr — ROF                             | 20                                                          | rds/min | [NW]                                                                               | SINGLE-SOURCE                                                          |
| 3-pdr — mount mass                      | 0.7 long ton (0.8 t)                                        | kg      | [NW]                                                                               | SINGLE-SOURCE (≈ 710 kg)                                              |
| 1-in. 4-barrel Nordenfelt (RN Mk III) — period | adopted late 1870s; service 1880–1890s              | year    | secondary article citing [TG] 1887 Table XVI                                       | SINGLE-SOURCE (relayed)                                                |
| 1-in. Nordenfelt — mass                 | 447 lb (203)                                                | lb (kg) | [TG] via secondary                                                                 | SINGLE-SOURCE (relayed)                                                |
| 1-in. Nordenfelt — bullet               | 7.25 oz (0.206 kg) solid steel                              | oz (kg) | [TG] via secondary                                                                 | SINGLE-SOURCE (relayed)                                                |
| 1-in. Nordenfelt — muzzle velocity      | 1,464 (446)                                                 | fps (m/s)| [TG] via secondary                                                                 | SINGLE-SOURCE (relayed)                                                |
| 1-in. Nordenfelt — ROF                  | not found in a primary                                      | rds/min | —                                                                                  | UNVERIFIED (ESTIMATE 150–300 practical; 600 is sometimes quoted for the .45 volley gun cyclic) |
| .45-in 5-barrel Nordenfelt naval MG — in service | adopted by RN in the 1880s                         | year    | HBSA (Historical Breechloading Smallarms Assoc.) knowledge page                    | SINGLE-SOURCE                                                          |
| .45 Nordenfelt — barrels / round        | 5 barrels; .45" Gardner black-powder cartridge              | —       | HBSA                                                                               | SINGLE-SOURCE                                                          |
| .45 Nordenfelt — rate of fire           | 10-barrel variant fired 3,000 rds in 3 min 3 s (≈ 980 rds/min, demonstration); practical 450–600 quoted elsewhere | rds/min | HBSA; other web summaries | SINGLE-SOURCE (practical = ESTIMATE 150–300) |
| .45 Nordenfelt — gun mass / MV          | not given                                                   | —       | —                                                                                  | UNVERIFIED (ESTIMATE 90–160 kg incl. pedestal-mount head; MV ~ 400–430 m/s)   |
| .303" Maxim Mk I (British) — in service | 1888                                                        | year    | [NW] WNRussian_7.62mm_Maxim_MG                                                     | SINGLE-SOURCE (naval adoption by RN later, 1890s)                      |
| Maxim — gun mass / mount                | 58.4 lb (26.5) gun; 160 lb (72.6) mount                     | lb (kg) | [NW]                                                                               | SINGLE-SOURCE                                                          |
| Maxim — cyclic rate                     | 500                                                         | rds/min | [NW]                                                                               | SINGLE-SOURCE (practical sustained 250–300 is ESTIMATE; water-jacket limits) |
| Maxim — muzzle velocity / bullet        | 2,000 fps (610 m/s); 0.5 oz (14 g); charge 0.11 oz (3 g)    | —       | [NW]                                                                               | SINGLE-SOURCE                                                          |

### 1.4 Whitehead torpedoes and tubes

| item                                    | figure                                                      | unit    | source                                                                             | confidence                                                             |
| --------------------------------------- | ----------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Whitehead Mark I (45 cm / 17.7 in) — length | 11 ft 8 in (3.55 m)                                    | m       | [BO] ch. 1                                                                         | VERIFIED                                                               |
| Mark I — diameter                       | 17.7 in (450 mm)                                            | mm      | [BO]                                                                               | VERIFIED                                                               |
| Mark I — mass ready for launch          | 845 lb war condition (383 kg); 836 lb exercise (379 kg)     | lb (kg) | [BO]                                                                               | VERIFIED                                                               |
| Mark I — warhead                        | 98.75 lb dry gun-cotton + 20 % water = 118.5 lb wet (53.7 kg) | lb (kg)| [BO]                                                                               | VERIFIED                                                               |
| Mark I — air charge                     | 50 lb at 1,350 lb/in² (90 atm); 7.154 ft³ flask             | lb      | [BO]                                                                               | VERIFIED                                                               |
| Mark I — engine                         | 3-cylinder single-acting Whitehead engine, cut-off at ⅓ stroke | —    | [BO]                                                                               | VERIFIED                                                               |
| Mark I — speed/range (US service 1894–1913) | 26.5 kn / 800 yd (732 m) effective                      | kn / yd | secondary summary of NHHC "Torpedo History: Whitehead Torpedo Mk1" (not opened)    | SINGLE-SOURCE (relayed)                                                |
| 14-in (356 mm) Whitehead (RN service from 1877) — speed/range | 18 kn over 600 yd (549 m), 26.5-lb (12 kg) warhead (1877 model); ~24 kn by 1884 | kn / yd / kg | encyclopaedia summary, underlying source not named | UNVERIFIED (use: 18–24 kn, 550–750 m, warhead 12–35 kg; a 65–70 lb / 29–32 kg guncotton head is claimed for an experimental 1883–85 "Mark IV") |
| 14-in Whitehead — total mass / length   | not found in a primary                                      | kg / m  | —                                                                                  | UNVERIFIED (ESTIMATE 250–400 kg, 3.9–4.6 m; scaled from the 16-in 1868 model quoted at 650 lb / 14 ft and the 17.7-in 845 lb) |
| Above-water 14-in carriage/launcher — mass | not found in a primary                                  | kg      | —                                                                                  | UNVERIFIED (ESTIMATE 0.8–2.0 t incl. mount; no source)                |
| Submerged bow 14-in tube — mass         | not found in a primary                                      | kg      | —                                                                                  | UNVERIFIED (ESTIMATE 1.5–3.5 t incl. air impulse gear and door)       |
| Torpedoes carried — HMS _Lightning_ (1876) | 1 bow tube plus 2 reload cradles amidships (14-in) = 3 | count   | secondary museum summary (RMG collection model); HMS _Lightning_ page of the History of the Torpedo, Univ. of Melbourne, cites _The Engineer_ 1877 | SINGLE-SOURCE |
| Torpedoes carried — larger ships        | not found                                                   | count   | —                                                                                  | UNVERIFIED (ESTIMATE 2–3 per tube incl. reload; battleships 4–7 tubes, see §4 armaments) |

---

## 2. Armour types

Introduction years and resistance factors are from [EB] (1911) and [B2] (1902); a third secondary (Naval Gazing, a modern popular blog) is cited
only for the cross-check noted. "Factor" = resistance per unit thickness relative to wrought iron = 1.00 (British "figure of merit" convention),
so a plate of thickness t resists like (factor × t) inches of wrought iron.

| item                                       | figure                                                                  | unit      | source                                                                 | confidence                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Wrought iron — baseline                    | factor 1.00; dominant pre-1876                                          | —         | [EB]                                                                   | VERIFIED                                                                                            |
| Steel armour (Schneider/Creusot) — introduced | 1876                                                                  | year      | [EB]                                                                   | SINGLE-SOURCE (a blog gives 1876, "introduced by the French": consistent)                           |
| Compound armour (Cammell/Wilson) — introduced | 1877                                                                  | year      | [EB]                                                                   | SINGLE-SOURCE                                                                                       |
| Steel and compound vs wrought iron, 1880–90 | 1.3 : 1 (a 25–30 % gain)                                               | factor    | [EB]                                                                   | SINGLE-SOURCE (blog agrees: ~25 %)                                                                  |
| Nickel steel (Schneider) — introduced      | 1889                                                                    | year      | [EB]                                                                   | SINGLE-SOURCE                                                                                       |
| Nickel steel vs wrought iron               | ~1.35 (blog: only ~+5 % over plain steel/compound)                      | factor    | blog cross-check; no clean primary figure                              | ESTIMATE (range 1.3–1.4)                                                                            |
| Harvey (face-carburised nickel steel) — patented/introduced | 1891 (US trials 1890 per blog)                          | year      | [EB]                                                                   | SINGLE-SOURCE                                                                                       |
| Harvey vs wrought iron                     | "twice the resisting power of wrought iron" = 2.0                       | factor    | [EB] "Armour Plates"                                                   | SINGLE-SOURCE; conflicts with blog "15–20 % better than nickel steel" (→ ~1.6) which is a thickness-for-thickness-vs-nickel-steel statement, not a wrought-iron factor. Use 1.9–2.0. |
| Krupp cemented (KC) — introduced           | 1893 (replaced Harvey by ~1895–96)                                      | year      | [EB]                                                                   | SINGLE-SOURCE                                                                                       |
| Krupp non-cemented plate vs wrought iron   | 2.25                                                                    | factor    | [EB]                                                                   | SINGLE-SOURCE                                                                                       |
| KC (cemented) figure of merit              | ~2.7 for good 6-in plates; ~2.3 for 12-in; "not more than 2" against capped shot | factor | [EB]                                                                | SINGLE-SOURCE                                                                                       |
| KC 12-in plate, Brassey's own estimate     | 2.33 (Krupp plate defeated a 2.33 blow, June 1896); Carnegie plate pierced at 2.30 / defeated 2.09 (1898); acceptance tests at 1.9–2.0 | factor | [B2] pp. ~364–366 (1902 reports on trials) | VERIFIED (two sources agree with [EB] 2.3 for 12 in) |
| Wrought iron → Krupp for a 12-in plate     | resistance up in proportion 10 : 23                                     | ratio     | [B2] p. 289                                                            | VERIFIED (agrees with 2.3)                                                                          |
| KC vs Harvey                               | ~+15 % (so Harvey ≈ 2.0 → KC ≈ 2.3)                                    | ratio     | blog cross-check; consistent with [EB] and [B2]                        | SINGLE-SOURCE (consistent)                                                                          |
| Density of iron/steel armour               | 7.833 g/cm³ (0.283 lb/in³); i.e. ≈ 7,830 kg/m³ (1 inch = 40.8 lb/ft²) | kg/m³     | [NW] Okun metallurgical tables (Sept 2009)                             | SINGLE-SOURCE (use 7,850 as a rounded catalogue value; wrought-iron and compound densities differ by a few % — UNVERIFIED, range 7,600–7,850) |
| Typical armour-weight rule                 | 1 in plate = 40.8 lb/ft² = 199 kg/m²                                    | kg/m²     | [NW] (same page)                                                       | VERIFIED (arithmetic from density)                                                                 |
| Brassey 1902 summary: Harvey/KC "equivalent in wrought iron" of belt systems | belts of 9 in KS (Krupp) rate 29–35 in wrought-iron equivalent in 1900-era battleships | in | [B2] pp. 300–301                                  | VERIFIED (contemporary table; King Edward VII class 9" KS belt etc.)                                |
| Brassey 1902: older battleships' water-line | Royal Sovereign, Canopus, Duncan and similar ≤ ~26 in wrought-iron equivalent | in    | [B2] p. 301                                                            | VERIFIED                                                                                            |

### 2.1 Representative armour fits (belt/deck)

| item                                       | figure                                                                  | unit      | source                                                                 | confidence                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| HMS _Royal Sovereign_ class (1889) belt     | 14–18 in (356–457) compound; barbette 11–17 in; deck 2.5–3 in; casemate 6 in | in (mm) | summary of [CW] Burt/Conway's                                     | SINGLE-SOURCE (relayed); [B2] confirms the barbettes are "17-in." armour                            |
| HMS _Majestic_ class (1895) belt/deck      | 9 in (229) Harvey belt; deck 2.5–4.5 in; barbette 14 in; turret faces 10 in | in (mm) | summary of [CW] Burt                                                   | SINGLE-SOURCE (relayed)                                                                             |
| HMS _Edgar_ class (1893) protected cruiser | 5 in (127) slope / 3 in (76) flat steel deck; 6 in casemates; 10 in conning tower | in (mm) | summary of [CW] Conway's                                          | SINGLE-SOURCE (relayed)                                                                             |
| Siegfried class coast-defence (1890)       | belt 240 mm centre / 180 mm ends; deck 30 mm; turrets 200 mm            | mm        | summary of [CW] Gröner                                                 | SINGLE-SOURCE (relayed); armour type (compound) not stated                                          |
| SMS _Sachsen_ class (1878)                 | belt 203–254 mm (8–10 in) wrought iron; deck 50–75 mm; barbettes 254 mm | mm        | summary of [CW] Gröner/Dodson                                          | SINGLE-SOURCE (relayed)                                                                             |
| HMS _Inflexible_ (1881)                    | 24 in citadel belt (from existing note `content-1-fleets-and-ship-classes.md`) | in   | existing repo note                                                    | SINGLE-SOURCE (carried from existing note; not re-checked)                                         |

---

## 3. Propulsion plants

Primary source for this section: [W] ch. XIV "Progress in Marine Engineering", Table "Weights and rates of coal consumption for war-ship machinery"
(pp. 562–563) and the text pp. 554–561. The weights are for the complete propelling machinery (engines + boilers + water) at **contract-trial
indicated power** (natural-draught 8-hour trial for forced-draught ships). Table-column assignment in the OCR is jumbled for the middle rows;
rows are used only where the numbers are internally consistent.

| item                                       | figure                                                                  | unit      | source                                                                 | confidence                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Compound engines, cylindrical boilers 1870–80 | boiler pressure 60–65 psi; machinery ≈ 360 lb/ihp (163 kg/ihp = 219 kg/kW); coal ≈ 2¼–2½ lb/ihp/h | psi; lb/ihp | [W] p. 562                                          | SINGLE-SOURCE (OCR: row alignment uncertain; fraction glyph lost)                                    |
| Compound 1880–85                           | boiler 90–130 psi; piston speed 600–800 ft/min; machinery 310–330 lb/ihp (141–150 kg/ihp = 189–201 kg/kW); coal ≈ 2–2¼ lb/ihp/h | — | [W] p. 562                                | SINGLE-SOURCE (OCR as above)                                                                        |
| Triple-expansion vertical, cylindrical boilers 1885–92 (the _Royal Sovereign_/_Majestic_ era) | boiler 130–155 psi; piston speed 700–900 ft/min; machinery 260–300 lb/ihp (118–136 kg/ihp = 158–183 kg/kW); coal 2–2¼ lb/ihp/h | — | [W] p. 562                  | VERIFIED (numbers legible; coal fraction glyph "2–2¼" assumed)                                     |
| Triple-expansion — introduction year       | table row starts 1885 for war-ships; merchant use from early 1880s       | year      | [W] p. 562                                                             | SINGLE-SOURCE (first RN fitting year not stated; UNVERIFIED for a single date; range 1882–1886)    |
| Locomotive boilers in groups (torpedo gunboats, 1890–93) | 155 psi; piston speed ~800; machinery 150–180 lb/ihp (68–82 kg/ihp = 91–110 kg/kW) | — | [W] p. 562                                          | VERIFIED (numbers legible)                                                                          |
| Single large locomotive boiler (first-class torpedo boat, 1890–93, forced draught) | 180–200 psi; piston speed 900–1000; machinery 70–80 lb/ihp (32–36 kg/ihp = 43–49 kg/kW) | — | [W] p. 562                                       | VERIFIED                                                                                            |
| Coal consumption rule                      | 2 lb/ihp/h ≈ 0.907 kg/ihp/h = 1.217 kg/kWh                              | —         | arithmetic on [W]                                                      | ESTIMATE (derived)                                                                                  |
| A cruising trial: 4,500 ihp, 13 kn, Spithead–Madeira–Spithead | coal 1¾ lb/ihp/h (≈ 1.06 kg/kWh); 675 t coal for 2,600 nmi vs ~1,350 t for the "old machinery" | lb/ihp/h | [W] p. 560                                         | VERIFIED (ship unnamed in the passage; modern engines re-fitted)                                    |
| Rule of thumb for sustained power          | RN practice: minimum 60 % of natural-draught 8-h power for continuous steaming; effective machinery weight then 400–500 lb per continuous ihp | — | [W] p. 563 | VERIFIED                                                                                            |
| Forced draught (closed stokehold)          | 2 in water-gauge → +60–70 % ihp vs natural draught for cylindrical boilers (formerly); limit later ~1 in → +20–25 % | — | [W] p. 561                                        | VERIFIED                                                                                            |
| Boiler power density — cylindrical, forced | 20–25 ihp per ton of boilers+water (3–4 h); natural draught + triple 16–18 ihp/t | ihp/t  | [W] p. 554                                                             | VERIFIED                                                                                            |
| Boiler power density — locomotive          | single 45–50 ihp/t; groups 30–35 ihp/t                                  | ihp/t     | [W] p. 554                                                             | VERIFIED                                                                                            |
| Boiler power density — water-tube (Thornycroft) | claimed 68 ihp/t (single boiler); Danish cruiser _Geiser_ 1892: 8 boilers, 3,157 ihp on 108 t (≈ 30 ihp/t at <1 in air, est. 45 max); _Speedy_ 1893: 28 ihp/t at 0.6 in over 8 h, 43 ihp/t at 1.7 in over 3 h | ihp/t | [W] p. 555–556 | VERIFIED (contemporary trial reports as quoted by the RN's DNC)                                   |
| Water-tube vs locomotive in service        | _Speedy_ (Thornycroft water-tube) showed >30 % gain over a locomotive-boilered sister; _Geiser_ boilers 108 t vs 168 t for six cylindrical boilers | — | [W] p. 556 | VERIFIED                                                                                            |
| Water-tube introduction (naval)            | experimental in 1870s–80s; French Navy "employing the type for all classes in construction" and RN _Powerful_ class to have ≈ 25,000 ihp water-tube boilers (1894 text) | year | [W] pp. 554–556 | VERIFIED (statements; individual Belleville/Yarrow/Normand years: SINGLE-SOURCE below)        |
| HMS _Powerful_ (1895) — Belleville boilers | 48 Belleville boilers, 210 psi; 25,000 ihp (18,600 kW); 22 kn           | psi; ihp  | summary of [CW] Burt/Roberts                                           | SINGLE-SOURCE (relayed)                                                                             |
| Yarrow / Normand / Niclausse boiler dates  | Yarrow-built destroyers (e.g. _Havock_ 1893) used locomotive-type boilers; Yarrow large-tube/Normand-Du Temple dates not retrieved | — | —                                                 | UNVERIFIED (search IMarEST/_Engineering_ 1890s; ESTIMATE: Normand 1880s–90s torpedo boats, Yarrow water-tube 1890s) |

### 3.1 Representative ships (propulsion)

| item                                       | figure                                                                  | unit      | source                                                                 | confidence                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| HMS _Royal Sovereign_ (1889)               | 14,200 t, 380 × 75 ft; 16.77 kn on the measured mile at 9,760 ihp; ~10,500 ihp would give 17 kn; 14 kn needs ~6,400 ihp | kn / ihp | [W] ch. XVII (power data); 155 psi, 8 cylindrical boilers, designed 11,000 ihp, trial max 13,360 ihp per [CW] relay | VERIFIED for [W] figures; boilers SINGLE-SOURCE |
| _Admiral_ class (compound, 1880s)          | 10,000 t, 325 × 68 ft; ~5,000 ihp for 14 kn; ~12,000 ihp for 17 kn      | ihp       | [W] ch. XVII                                                           | VERIFIED                                                                                            |
| HMS _Majestic_ (1895)                      | 2 × 3-cyl triple expansion, 8 Scotch boilers; 10,000 ihp normal, 12,000 forced; 16 / 17 kn | ihp / kn | summary of [CW] Burt                                                | SINGLE-SOURCE (relayed)                                                                             |
| HMS _Edgar_ class                          | twin screw, 12,000 ihp forced; 20 kn                                    | ihp / kn  | summary of [CW] Conway's; Brassey 1895–1906                           | SINGLE-SOURCE (relayed)                                                                             |
| HMS _Havock_ (1893, Yarrow)                | 2 locomotive boilers, 2 triple-expansion engines; ~3,500 ihp (Brassey 1898 row: 3,500 ihp, 26.77 kn); c.27 kn | ihp / kn | [B8] row for Havock (legible); summary of [CW] Lyon           | VERIFIED for 3,500 ihp / 26.77 kn in [B8]; boiler type SINGLE-SOURCE                               |
| HMS _Speedy_ (1893, torpedo gunboat)       | 8 Thornycroft water-tube boilers, 3,500 ihp design (trial 4,703 ihp / 20.21 kn); design 18.7 kn | ihp / kn | [W] p. 556 (water-tube trial); summary of [CW] Chesneau & Kolesnik, Brassey 1895 | VERIFIED for trial concept; ihp/kn SINGLE-SOURCE                                         |
| Siegfried class (1890)                     | 2 triple-expansion, 8 boilers; 4,500–5,250 ihp (metric); 14.6–15.1 kn   | ihp / kn  | summary of [CW] Gröner                                                 | SINGLE-SOURCE (relayed)                                                                             |
| SMS _Sachsen_ (1878)                       | 2 × 3-cyl single-expansion, 8 trunk boilers; 5,500 ihp; 13 kn          | ihp / kn  | summary of [CW] Gröner                                                 | SINGLE-SOURCE (relayed)                                                                             |
| HMS _Devastation_ (1871)                   | 13¾ kn needs 6,600 ihp; machinery 1,150 long tons (≈ 390 lb/ihp = 177 kg/ihp = 237 kg/kW) | kn / ihp | [W] pp. 642–643 (comparison with the Russian circular ship)       | VERIFIED                                                                                            |

---

## 4. Hull data for four classes

Block coefficient: C_B = V / (L·B·T). Volume V = displacement(long tons) × 35 ft³/ton (salt water) — or tonnes ÷ 1.025 t/m³ in metric. L is
between perpendiculars (LBP) where given. Calculations are shown so the catalogue can regenerate them.

| class / ship (year)                        | displacement          | L (LBP)        | B        | T (mean/design)  | depth       | L/B   | C_B calc                                          | hull-structure fraction                  | source                                                              | confidence                                                             |
| ------------------------------------------ | --------------------- | -------------- | -------- | ---------------- | ----------- | ----- | ------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Torpedo boat / TBD** HMS _Havock_ (1893) | 240 t light; 275 t full (summary of [CW] Lyon); [B8] row: 240 t | 180 ft [B8] (185 oa [CW]) | 18.5 ft | 5.25 ft [B8 col.] ; 7.5 ft full load [CW] | n/a         | 9.7   | 240×35 / (180×18.5×5.25) = 8,400/17,483 = **0.48** (light); 275×35/(180×18.5×7.5) = **0.39** (full) | 30–35 % (all torpedo boats) per [W]      | [B8] (isolated legible row); [CW] summary; [W] p. 412, p. 416      | VERIFIED for dimensions in [B8] (draught column assignment uncertain); C_B = ESTIMATE range 0.38–0.48 |
| Torpedo boat, 1st class (typical RN, 1880s) | 93 t                  | 130 ft [W]     | n/a      | n/a              | n/a         | n/a   | n/a                                               | 30–35 %                                  | [W] p. 139 stability table ("English first class 130 ft, 93 t, GM 1.47 ft") | VERIFIED                                                               |
| Torpedo gunboat HMS _Speedy_ (1893)        | 810 t                 | 230 ft         | 27 ft    | 12 ft            | n/a         | 8.5   | 810×35/(230×27×12) = 28,350/74,520 = **0.38**    | not given (30–35 % class figure assumed) | summary of [CW] Chesneau & Kolesnik, Brassey 1895                  | SINGLE-SOURCE (dims); C_B ESTIMATE                                     |
| **Protected cruiser** HMS _Edgar_ (1893)   | 7,700 t [B2 table lists 7,700] | 360 ft LBP (387.5 ft oa per [CW]) | 60 ft | 24 ft | n/a  | 6.0 (LBP) / 6.5 (oa) | 7,700×35 / (360×60×24) = 269,500/518,400 = **0.52**; with 387.5 ft = **0.48** | **38 %** (typical swift protected cruiser: structure 20.5 + fittings 17.5) | [B2] (displacement); [CW] (dims); [W] p. 416–417           | VERIFIED displacement; L is ambiguous (LBP vs oa) → C_B range 0.48–0.52 |
| **Coast-defence ship** Siegfried class (1890) | 3,500 t metric (3,445 long) | 76.4 m (250.7 ft) wl | 14.9 m (48.9 ft) | 5.74 m (18.8 ft) | n/a  | 5.13 | (3,500/1.025) / (76.4×14.9×5.74) = 3,414.6/6,534.2 = **0.52** | 31 % if like _Devastation_ (turret ship, low freeboard); 30–35 % per [W] | summary of [CW] Gröner/Dodson; [W] p. 412, p. 642                  | SINGLE-SOURCE (dims); C_B ESTIMATE                                     |
| Coast-defence/barbette ship SMS _Sachsen_ (1878) | 7,635 t metric   | 98.2 m (322 ft) | 18.4 m (60.4 ft) | 6.43 m mean | n/a   | 5.34  | (7,635/1.025) / (98.2×18.4×6.43) = 7,449/11,618 = **0.64** | n/a                                      | summary of [CW] Gröner                                             | SINGLE-SOURCE (dims); C_B ESTIMATE                                     |
| HMS _Devastation_ (1871; turret, low freeboard) | 9,300 t           | n/a            | n/a      | n/a              | n/a         | n/a   | n/a                                               | **hull 2,880 t = 31 %** of displacement  | [W] pp. 642–643                                                     | VERIFIED                                                               |
| **Pre-dreadnought** HMS _Majestic_ (1895)  | 14,900 t normal [B2]  | 390 ft (421 ft oa) | 75 ft | 27 ft (30 ft max) | n/a      | 5.2   | 14,900×35 / (390×75×27) = 521,500/789,750 = **0.66** | **38 %** (structure 18 + fittings 20) | [B2] (displacement); [CW] (dims); [W] p. 416                        | VERIFIED displacement; C_B ESTIMATE (T=27 ft summary value)           |
| HMS _Royal Sovereign_ (1889)               | 14,150 t [B2]; 14,200 t [W] | 380 ft (410.5 oa) | 75 ft | 27.5 ft         | n/a         | 5.07  | 14,150×35 / (380×75×27.5) = 495,250/783,750 = **0.63** | 38 %                                     | [B2], [W] (L, B, displacement), [CW] (T)                            | VERIFIED displacement; C_B ESTIMATE                                    |
| Hull weight, broadside iron-clads (reference) | —                  | —              | —        | —                | —           | —     | —                                                 | iron hulls with fittings: ~55 % early, 40–45 % later broadside; turret ships 30–35 %; unarmoured iron RN ships 40–50 %; armoured Hercules 4,022/8,676 = 46 %; "new ship" estimate 4,574/9,088 = 50 % | [W] pp. 411–412, ch. XVII | VERIFIED |

Depth (moulded) was **not found** for any of these ships; ESTIMATE from freeboard statements: _Royal Sovereign_ freeboard 17 ft 3 in [W] p.~20
(→ moulded depth to upper deck ≈ draught + freeboard ≈ 44–45 ft), no other depths available (UNVERIFIED for the other three classes).

---

## 5. Weight-fraction breakdowns

All fractions are % of load/normal displacement. Primary sources: [W] pp. 416–417 (generic modern war-ships, as printed), [W] ch. XVII
tables. Named-ship breakdowns from Brassey/Jane's were **not recoverable** (tables scrambled); the White percentages are the RN
Director of Naval Construction's own typical distributions, so they are the strongest primary available.

| class / ship                                    | hull | machinery | fuel | armour | armament + equip | notes / crew                                                                                           | source                                  | confidence                                                      |
| ----------------------------------------------- | ---- | --------- | ---- | ------ | ---------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------------- |
| Pre-dreadnought battleship (steel, "first-class battle-ship of the present day", 1890s; unnamed, RS/Majestic generation) | 38 (structure 18 + fittings 20) | 15 (machinery **and coal combined**) | incl. | 30 (incl. deck protective plating) | 17 (armament + equipment) | Total 100. Crew: _Majestic_ 672–794; _Royal Sovereign_ 670–692 [CW relay] | [W] p. 416 | VERIFIED (percentages); crews SINGLE-SOURCE (relayed)           |
| Protected cruiser ("typical swift protected cruiser of high speed, large coal supply, heavily armed") | 38 (structure 20.5 + fittings 17.5) | 35 (machinery and coal) | incl. | 16 (protective material) | 11 | Total 100. _Edgar_ crew 544 [CW relay]                                       | [W] p. 416–417                          | VERIFIED (percentages); crew SINGLE-SOURCE                     |
| Coast-defence / turret ship — HMS _Devastation_ (9,300 t) | 31 (2,880 t) | 12.4 (1,150 t) | 12.9 (1,200 t) | armour + armament + equipment = 43.8 (4,070 t "dead weight") | (included) | Machinery 390 lb/ihp for 6,600 ihp @ 13¾ kn                                          | [W] pp. 642–643                         | VERIFIED (1871 ship; best primary breakdown for the class)     |
| Same class — turret ships generally            | 30–35 | —         | —    | —      | —                | Low freeboard, ≤ 4 heavy guns; Russian circular ironclads only 20 %                                      | [W] p. 412                              | VERIFIED                                                        |
| Coast-defence — Siegfried (1890)               | ESTIMATE 32 | ESTIMATE 13–15 | ESTIMATE 6–7 (220 t coal / 3,445 t) | ESTIMATE 25–30 (240 mm belt, 200 mm turrets) | ESTIMATE ~10–12 | Crew 276 (20 officers + 256) [CW relay]                                         | derived; crew summary of [CW] Gröner    | ESTIMATE (fraction); crew SINGLE-SOURCE                         |
| Torpedo boat (small, forced-draught loco boiler) | 30–35 | **> hull** (≈ 34–38) | (in loads) | 0 | loads (armament + coal + equipment) "nearly as much as the hulls" (≈ 28–33 combined) | Crew: _Havock_ 43 [B8] / 46 [CW]; machinery 70–80 lb/ihp [W] p. 562                              | [W] p. 416; [W] p. 562; [B8]            | VERIFIED (qualitative + hull 30–35 %); sub-splits ESTIMATE     |
| Torpedo gunboat _Speedy_                       | ESTIMATE 33 | ESTIMATE 28–32 | ESTIMATE 10–12 | ESTIMATE 0–2 (shield only) | ESTIMATE 15–20 | Crew 91 [CW relay]                                                            | derived; [CW]                           | ESTIMATE                                                        |
| Earlier-period reference — armoured ironclad _Hercules_ (8,676 t) | 46 (4,022 t) | machinery+coal 21 (1,826 t) | incl. | belt 14.9 (1,292 t) + batteries 4.6 (398 t) = 19.5 | equipment + armament 13.1 (1,138 t) | for scale; Minotaur-type broadside, not EARLY-band | [W] ch. XVII table                      | VERIFIED                                                        |

### 5.1 Provisions and accommodation per man

| item                                       | figure                                                                  | unit      | source                                                                 | confidence                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Merchant-ship crew-space minimum (Merchant Shipping Act 1867) | 72 ft³ (2.04 m³) and 12 ft² (1.11 m²) per man                | ft³, ft²  | [W] ch. II (tonnage law discussion)                                    | VERIFIED (as a legal minimum for merchant crews, not RN)                                           |
| RN seamen's allowance (hammock/mess space) | 72 ft³ widely cited; a Victorian medical writer wanted 100 ft³           | ft³       | web summary of period medical journals; no primary read                | UNVERIFIED (use 2–3 m³/man incl. mess; ESTIMATE 2.0–2.8 m³ for battleships; torpedo boats far lower, ~1 m³) |
| Hammock width                              | 14–16 in (36–41 cm) per seaman                                          | in        | web summary                                                            | UNVERIFIED                                                                                          |
| Provisions per man per day                 | RN daily ration (WWI-era scale, secondary summary of King's Regulations & Admiralty Instructions 1913): 1 lb bread, ½ lb fresh meat or ¼ lb salt pork, 1 lb vegetables or ¼ lb peas, plus biscuit / flour / suet / sugar / tea | lb | secondary summary; primary page returned HTTP 403 | UNVERIFIED for 1880–99; ESTIMATE 1.1–1.5 kg/man/day (food only), 3-month store ≈ 100–135 kg/man |
| Fresh water / other stores                 | not found                                                               | —         | —                                                                      | UNVERIFIED (ESTIMATE 5–15 L/man/day incl. distilled water for boilers separate)                    |

---

## 6. Ranges and coal bunkerage

| item                                       | figure                                                                  | unit      | source                                                                 | confidence                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| HMS _Majestic_ class — bunkers             | 1,100 t normal; up to 1,900 t maximum                                   | long tons | summary of [CW] Burt                                                   | SINGLE-SOURCE (relayed)                                                                             |
| Majestic — radius                          | 7,000 nmi at 10 kn; 4,420 nmi at 14.6 kn                                | nmi       | summary of [CW] Burt                                                   | SINGLE-SOURCE; note 7,000/1,900 t = 3.7 nmi/t vs 7,000/1,100 = 6.4 nmi/t — the 7,000 nmi presumably refers to full 1,900 t at ~0.55 lb/ihp... treat as UNVERIFIED, ESTIMATE 4,500–7,000 nmi at 10 kn |
| HMS _Royal Sovereign_ class — bunkers      | 1,420 t max; range 4,720 nmi at 10 kn                                   | long tons / nmi | summary of [CW] Burt                                             | SINGLE-SOURCE (relayed); ≈ 3.3 nmi/t                                                               |
| HMS _Powerful_ (1895) — bunkers            | 1,500 t normal; 3,100 t max; 7,000 nmi at 14 kn                         | long tons / nmi | summary of [CW] Burt/Roberts                                      | SINGLE-SOURCE (relayed)                                                                             |
| HMS _Edgar_ class — endurance              | 10,000 nmi at 10 kn (bunker tonnage not retrieved)                      | nmi       | summary of [CW] Conway's                                               | SINGLE-SOURCE; UNVERIFIED for bunkers (ESTIMATE 800 t normal / 1,250 t max; 8 nmi/t not stated)    |
| SMS _Sachsen_                              | 420 t standard (700 t max after modifications); 1,940 nmi at 10 kn      | tons / nmi| summary of [CW] Gröner/Dodson                                          | SINGLE-SOURCE (relayed); ≈ 4.6 nmi/t                                                               |
| Siegfried class                            | 220 t (580 t after reconstruction); 1,490 nmi at 10 kn (3,400 nmi rebuilt) | tons / nmi | summary of [CW] Gröner                                              | SINGLE-SOURCE (relayed); ≈ 6.8 nmi/t as built                                                      |
| HMS _Havock_ (1893)                        | 3,000 nmi (sic, surely at ~10 kn?) per [CW] relay; [B8] row ends with 57 (or 60 for _Hasty_) which may be coal capacity in tons | nmi / t | [B8]; summary of [CW] Lyon                         | UNVERIFIED (range 55–60 t coal; at 27 kn only ~0.8 hr of coal per ton: radius at full speed ≈ 300–400 nmi ESTIMATE; 3,000 nmi at 10 kn is implausible for 57 t coal — treat as ESTIMATE 1,200–1,800 nmi at 10 kn) |
| HMS _Speedy_                               | bunker/radius not retrieved                                             | —         | —                                                                      | UNVERIFIED (ESTIMATE 150–200 t, 2,000–3,000 nmi at 10 kn)                                          |
| Coal energy rule used for catalogue        | 2 lb/ihp/h at full power; cruising ~1¾ lb/ihp/h                         | lb/ihp/h  | [W] pp. 560, 562                                                       | VERIFIED                                                                                            |
| Speed–power relation, large ships          | larger ships gain at higher speed: _Royal Sovereign_ needs 6,400 ihp for 14 kn vs _Admiral_ 5,000 ihp (smaller ship) but 10,500 ihp for 17 kn vs 12,000 ihp | ihp | [W] ch. XVII                                                       | VERIFIED                                                                                            |
| Cruising-power fraction                    | war-ships at cruising speed usually develop only 10–15 % of max power   | %         | [W] p. 554                                                             | VERIFIED                                                                                            |

---

## Gaps and confidence

Every item below is **ESTIMATE or UNVERIFIED**, with the primary that would settle it.

| item | status | primary source that would settle it |
| ---- | ------ | ----------------------------------- |
| Charge weights for 12-pdr (1894), 6-pdr (1884), 3-pdr (1886) | ESTIMATE (navweaps lists WWI/WWII charges) | Treatise on Ammunition 1887/1893 ed. (Table of QF ammunition); Elswick catalogue 1890 |
| 12"/35 Mk VIII 1895 cordite load and MV (716 vs ~762 m/s) | ESTIMATE / conflict | Treatise on Ammunition 1900; Brassey 1898–99 gun tables |
| 6"/26 gun mass and in-service year | UNVERIFIED | Admiralty Gun Dept. "Handbook for 6-inch B.L. gun" (1880s); Brassey 1886 |
| 6"/40 penetration; 4.7" QF penetration (11.7 in from NYT 1893) | UNVERIFIED | Elswick range-and-penetration tables; _Text Book of Gunnery_ 1902 |
| 1-in Nordenfelt ROF, .45 Nordenfelt weight/MV/practical ROF | UNVERIFIED | _Text Book of Gunnery_ 1887 Table XVI (print); Nordenfelt catalogue 1886 |
| Maxim practical sustained ROF (250–300 rds/min) | ESTIMATE | RN Maxim handbook 1890s; Maxim-Nordenfelt catalogue 1897 |
| 14-in Whitehead mass, length, warhead, range (1877–1885); 1877 figure 26.5-lb warhead / 18 kn / 600 yd | UNVERIFIED | Whitehead & Co. Fiume price list/catalogue 1880s; RN "Torpedo Manual" 1880s; _Engineer_ 1877 Thornycroft paper |
| Tube + mount mass (above-water carriage, submerged bow tube), torpedoes carried per tube/ship | UNVERIFIED / ESTIMATE | RN Torpedo drill books (HMS _Vernon_ 1880s–90s); Brassey ship tables (torpedo columns) |
| Nickel steel factor (1.35) | ESTIMATE | Schneider/Creusot 1889 trials; Brassey 1890/91 armour chapter |
| Harvey 2.0 vs ~1.6 (conflict between [EB] and the blog) | SINGLE-SOURCE / conflict | Brassey 1892–94 reports on Harvey trials (US Indian Head, Annapolis 1890–91) |
| Density of wrought iron/compound vs steel | UNVERIFIED | Admiralty Manual of Seamanship or armour specs (Cammell 1880s); metallurgical handbook |
| Triple-expansion first RN fitting year; Belleville/Yarrow/Normand/Niclausse entry-into-service years | UNVERIFIED (1882–1886; 1890s) | Transactions of the Institution of Naval Architects 1889–1895; _Engineering_ 1890–1895 |
| Compound-era weights/coal (1870–85 rows) | SINGLE-SOURCE (OCR alignment) | White 1894 p. 562 re-read from the scan; or Durston paper, Trans. INA 1892 |
| Hull C_B (all) | ESTIMATE (derived, mean-draught ambiguity) | Admiralty ship books; Parkes, _British Battleships_ appendix; Brassey 1898–1902 dimension tables (clean scan) |
| Depth (moulded) for all four classes | UNVERIFIED | Admiralty "Particulars of ships" ; Jane's 1898 |
| Weight breakdown for named ships (_Majestic_, _Edgar_, _Havock_, _Siegfried_) | ESTIMATE (only White's typical class splits and the _Devastation_ table are primary) | Trans. INA papers by White/Durston/Biles; Jane's 1898 weights; Parkes |
| Crew counts for _Majestic_/_Edgar_/_Speedy_/_Siegfried_ | SINGLE-SOURCE (relayed from Conway's/Gröner) | Navy List 1896 or Brassey 1898 ship tables |
| RN accommodation m³/man and hammock width; provisions kg/man; water/man | UNVERIFIED / ESTIMATE | RN King's Regulations & Admiralty Instructions 1880s–1900 (victualling scales); Admiralty Committee on ship ventilation 1883 |
| Coal bunker + radius for _Edgar_, _Havock_, _Speedy_; _Majestic_ radius inconsistency | UNVERIFIED / conflict | Brassey 1895–1898 ship tables; Jane's 1898; trial reports (_Engineering_) |
| Brassey 1898 _Havock_ row column assignment (draught 5.25 ft; coal 57 t) | SINGLE-SOURCE (OCR) | clean scan of Brassey 1898 Part II |

---

## Suggested catalogue values (derived — not source figures)

Units: kg, mm, kW, g per kWh; integers. Conversions: 1 ihp = 0.7457 kW; 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 in = 25.4 mm.
**All values below are DERIVED by arithmetic from the table entries above; confidence follows the weakest input.**

### Weapons

| catalogue item | calibre mm | gun mass kg | shell kg | charge kg | MV m/s | practical ROF rds/min | pen. mm (iron @1,000 yd) | derived from | conf. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BL 12"/25 | 305 | 44,500 | 324 | 134 | 583 | 0.4 | 521 | 43.8 t; 714 lb; 295 lb; 1,914 fps | SINGLE-SOURCE |
| BL 13.5"/30 | 343 | 68,100 | 567 | 286 | 614 | 0.4 | 711 | 67 t; 1,250 lb; 630 lb; 2,016 fps | SINGLE-SOURCE |
| BL 12"/35 Mk VIII | 305 | 46,700 | 386 | 79 (ESTIMATE; range 77–91) | 716 | 0.7 | 838 | 46 t; 850 lb; 174 lb; 2,350 fps | SINGLE-SOURCE |
| BL 10"/32 | 254 | 30,000 | 227 | 114 | 622 | 0.5 | 518 | 29.53 t; 500 lb; 252 lb; 2,040 fps | SINGLE-SOURCE |
| BL 9.2"/31.5 | 234 | 23,400 | 172 | 74 | 629 | 1.0 | n/a (127 mm @ 5.5 km) | 23 t; 380 lb; 163 lb; 2,065 fps | SINGLE-SOURCE |
| BL 6"/26 | 152 | 4,300 (ESTIMATE) | 45 | 22 | 597 | 4 | n/a | 100 lb; 48 lb; 1,960 fps | UNVERIFIED (mass) |
| QF 6"/40 | 152 | 6,700 | 45 | 13 (EXE load) | 574 EXE / 680 cordite | 6 | n/a | 6.6 t; 100 lb; 29.75 lb; 1,882/2,230 fps | SINGLE-SOURCE |
| QF 4.7"/40 | 120 | 2,130 | 20 | 5 (SP 5.4; cord 2.5) | 544 SP / 648 cord | 5 | n/a | 2.1 t; 45 lb; 12 lb | SINGLE-SOURCE |
| QF 12-pdr 12-cwt | 76 | 510 | 6 | 1 (ESTIMATE) | 681 | 15 | n/a | 510 kg; 12.5 lb; 2,235 fps | SINGLE-SOURCE |
| QF 6-pdr 8-cwt | 57 | 385 | 3 | 0 (0.4 ESTIMATE; store as 400 g) | 538 | 20 | n/a | 849 lb; 6 lb; 1,765 fps | SINGLE-SOURCE |
| Hotchkiss 3-pdr | 47 | 240 | 1.5 | 0 (0.3 ESTIMATE; store as 300 g) | 574 | 20 | n/a | 528 lb; 3.3 lb; 1,884 fps | SINGLE-SOURCE |
| Nordenfelt 1-in 4-barrel | 25 | 203 | 0.21 (store 206 g) | n/a | 446 | 200 (ESTIMATE) | n/a | 447 lb; 7.25 oz; 1,464 fps | SINGLE-SOURCE / ESTIMATE |
| Maxim .303 | 8 | 27 (+73 mount) | 0.014 (14 g) | 0.003 | 610 | 250 (ESTIMATE sustained; 500 cyclic) | n/a | 58.4 lb; 160 lb; 2,000 fps | SINGLE-SOURCE |
| Whitehead 14-in torpedo | 356 | n/a | warhead 12–32 kg (store 27; ESTIMATE) | n/a | 9.3–12.3 m/s (18–24 kn) | 1 per tube per 2 min (ESTIMATE) | n/a | 18 kn / 600 yd / 26.5 lb (secondary) | UNVERIFIED |
| Whitehead 17.7-in (45 cm) Mk I | 450 | 383 (torpedo mass) | warhead 54 | n/a | 13.6 (26.5 kn) | n/a | n/a | 845 lb; 118.5 lb wet gun-cotton; 800 yd | VERIFIED mass/warhead; speed SINGLE-SOURCE |
| Above-water 14-in carriage | — | 1,400 (ESTIMATE; range 800–2,000) | — | — | — | — | — | no source | UNVERIFIED |
| Submerged bow 14-in tube | — | 2,500 (ESTIMATE; range 1,500–3,500) | — | — | — | — | — | no source | UNVERIFIED |

### Armour (percent resistance relative to wrought iron = 100; density 7,850 kg/m³; 1 mm = 7.85 kg/m²)

| catalogue item | intro year | resistance factor per mm (×100) | derived from | conf. |
| --- | --- | --- | --- | --- |
| Wrought iron | pre-1880 | 100 | baseline | VERIFIED |
| Compound | 1877 | 130 | [EB] 1.3 | SINGLE-SOURCE |
| Steel (Schneider/Creusot) | 1876 | 130 | [EB] 1.3 | SINGLE-SOURCE |
| Nickel steel | 1889 | 135 | ESTIMATE (blog + [EB]) | ESTIMATE |
| Harvey | 1891 | 200 (use 190–200) | [EB] 2.0 | SINGLE-SOURCE |
| Krupp cemented | 1893 | 230 (12-in; up to 270 for 6-in plates) | [B2] 2.33; [EB] 2.3–2.7 | VERIFIED (two sources) |

Representative thicknesses (mm): Majestic belt 229 Harvey (≈ 458 mm wrought-iron equivalent); Royal Sovereign belt 356–457 compound (≈ 460–590 mm WI-eq.); Edgar deck 76–127 steel; Siegfried belt 240; Sachsen belt 203–254 iron.

### Propulsion (derived; full-power, trial-weight basis)

| catalogue item | era | specific mass kg/kW | fuel g/kWh | boiler pressure kPa | typical power kW | conf. |
| --- | --- | --- | --- | --- | --- | --- |
| Compound, cylindrical boilers | 1880–85 | 195 (189–201) | 1,370 (2–2¼ lb/ihp/h = 1,217–1,369; use 1,300) | 90–130 psi = 620–900 | 2,000–6,000 | SINGLE-SOURCE (OCR) |
| Triple expansion, cylindrical (natural draught) | 1885–99 | 170 (158–183) | 1,220 (2 lb/ihp/h) | 130–155 psi = 900–1,070 | 4,000–10,000 (e.g. Royal Sovereign 7,280 kW at 9,760 ihp) | VERIFIED |
| Locomotive-boiler groups (TGB) | 1890–93 | 100 (91–110) | 1,400 (ESTIMATE; forced draught raises lb/ihp/h) | 155 psi = 1,070 | 1,500–3,000 | VERIFIED |
| Single locomotive boiler (torpedo boat) | 1890–93 | 46 (43–49) | 1,500 (ESTIMATE) | 180–200 psi = 1,240–1,380 | 150–2,600 | VERIFIED (mass); fuel ESTIMATE |
| Water-tube (Thornycroft/Yarrow/Belleville), triple | 1893–99 | 80 (ESTIMATE; boiler-only data 28–68 ihp/t vs cylindrical 16–25; so ~25–40 % lighter plant than cylindrical) | 1,200 (ESTIMATE) | 210 psi = 1,450 (_Powerful_) | up to 18,600 (Powerful 25,000 ihp) | SINGLE-SOURCE / ESTIMATE |

(Pressure conversion: 1 psi = 6.895 kPa.)

### Hulls and weight fractions (integer % of displacement; displacement in kg = long tons × 1,016)

| class | representative | displacement kg | L / B / T (m) | C_B | hull % | machinery+fuel % | armour % | armament+equip % | conf. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Torpedo boat / TBD | Havock | 244,000 (240 t) | 54.9 / 5.64 / 1.6–2.3 | 0.40–0.48 (use 0.44) | 33 | 38 | 0 | 29 | ESTIMATE (dims SINGLE-SOURCE) |
| Protected cruiser | Edgar | 7,823,000 | 110 (LBP 360 ft) / 18.3 / 7.3 | 0.50 | 38 | 35 | 16 | 11 | VERIFIED (shares) |
| Coast-defence ship | Siegfried (Devastation shares) | 3,500,000 | 76.4 / 14.9 / 5.7 | 0.52 | 31 | 25 (12 mach + 13 coal, from _Devastation_) | 30 (armour) | 14 (armament + equip) | ESTIMATE (shares from _Devastation_, mixed) |
| Pre-dreadnought battleship | Majestic | 15,139,000 (14,900 t) | 118.9 / 22.9 / 8.2 | 0.66 | 38 | 15 (machinery and coal) | 30 | 17 | VERIFIED (shares); C_B ESTIMATE |

(Note: the _Devastation_ split puts armour, armament and equipment together at 43.8 %; the 30/14 split above assigns them by analogy with the battleship ratio 30 : 17 — flagged ESTIMATE.)

### Range and stores

| item | value | derived from | conf. |
| --- | --- | --- | --- |
| Coal bunker, battleship (normal) | 1,117,000 kg (1,100 t) normal; 1,930,000 kg (1,900 t) max | Majestic | SINGLE-SOURCE |
| Coal bunker, protected cruiser | ESTIMATE 800,000–1,250,000 kg | Edgar (no source) | UNVERIFIED |
| Coal bunker, coast-defence | 223,000 kg (220 t) as built | Siegfried | SINGLE-SOURCE |
| Coal bunker, TBD | ESTIMATE 55,000–61,000 kg (55–60 t) | Havock | UNVERIFIED |
| Crew (battleship / cruiser / coast-defence / TBD) | 700 / 544 / 276 / 45 | [CW] relay; [B8] 43 for Havock | SINGLE-SOURCE |
| Provisions | ESTIMATE 120 kg per man for a 90-day store (food only) | 1.3 kg/day × 90 | UNVERIFIED |
| Accommodation | ESTIMATE 2.5 m³/man (battleship), 1.5 m³ (cruiser/coast-defence), 1.0 m³ (TBD); merchant legal floor 2.04 m³ | [W] 72 ft³ | UNVERIFIED |
| Radius at 10 kn | battleship 4,500–7,000 nmi; cruiser ~10,000 nmi (relay); coast-defence ~1,500–1,900 nmi; TBD ~1,500 nmi (ESTIMATE) | various | SINGLE-SOURCE / ESTIMATE |

## Source list

1. W. H. White, _A Manual of Naval Architecture_ (London: John Murray, 1894). archive.org `manualofnavalarc00whitrich`.
2. T. A. Brassey (ed.), _The Naval Annual 1902_. archive.org `brasseysnavala1902brasuoft`; _The Naval Annual 1898_, archive.org `CASGA_120405`.
3. US Navy Bureau of Ordnance, _The Whitehead Torpedo_ (1898), https://legacy.maritime.org/doc/whitehead
4. _Encyclopaedia Britannica_, 11th ed. (1911), "Armour Plates" (Wikisource transcription).
5. navweaps.com gun pages: WNBR_12-25_mk1, WNBR_12-35_mk8, WNBR_135-30_mk1, WNBR_10-32_mk1-4, WNBR_92-31_mk3, WNBR_6-26_mk1, WNBR_6-40_mk1, WNBR_47-40_mk1, WNBR_3-40_mk1, WNBR_6pounder_m1, WNBR_3pounder_H_mk1, WNRussian_7.62mm_Maxim_MG; Okun metallurgical tables (`index_nathan/metalprpsept2009.php`).
6. Print secondaries reached only via summaries (not opened): Conway's _All the World's Fighting Ships 1860–1905_ (1979); R. A. Burt, _British Battleships 1889–1904_ (2013); H. Lyon, _The First Destroyers_ (1996); E. Gröner (1990); A. Dodson (2016); _Text Book of Gunnery_ (1887) Table XVI.
7. HBSA, "Nordenfelt .45 naval machine gun" (hbsa-uk.org knowledge page).
8. Univ. of Melbourne, _The History of the Torpedo_ (torp.esrc.unimelb.edu.au), HMS _Lightning_ entry (cites _The Engineer_ 1877).
