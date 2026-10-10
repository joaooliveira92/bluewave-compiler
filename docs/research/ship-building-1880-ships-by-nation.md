# Research: Ship-building catalogue — warships IN SERVICE by January 1880, by nation

Factual grounding for the `scen_1880` **historical reference designs** (starting points) in the
component-level ship designer (ADR-0063 / ADR-0064, `.scratch/ship-building/`). Research-only; no
content/constants are authored here. Captured 2026-10-10.

This note is the companion to `docs/research/ship-building-early-band.md` (same table style:
`item | figure | unit | source | confidence`). It answers one question for the content author: **which
representative warships of each `scen_1880` nation were actually completed by 1 Jan 1880, and what were
their real specifications?**

## Question

For each of the 14 nations in the 1880 scenario (United Kingdom, Germany, United States, Japan, France,
Italy, Russia, Austria-Hungary, Spain, Qing Dynasty, Ottoman Empire, Netherlands, Portugal, Brazil),
find one to three representative warships **completed on or before 31 Dec 1879** — ideally of different
types (capital ironclad / cruiser / torpedo craft) — and record, per figure with a source and confidence
label: name, class, nation, type; completion/commissioning year; length, beam, draught, depth; displacement;
designed/best speed and ihp; main armament (model, calibre, count, mounting); secondary/light armament;
torpedo armament **as built**; armour (belt/deck/turret, material and type named); coal capacity; crew; cost.

## Method, sources and confidence labels

Confidence labels (identical to the early-band note):

- **VERIFIED** — read directly in a period primary/near-primary text, or in two independent sources that agree.
- **SINGLE-SOURCE** — one source only, or a secondary compilation that itself cites print works.
- **ESTIMATE** — derived by me from cited figures (calculation shown) or an inferred range.
- **UNVERIFIED** — no usable source found, or sources conflict; a plausible range is given instead.

**Wikipedia is not cited as a source anywhere in this note.** Wikipedia was used only as a *lead* to the
print/official work it cites (DANFS), and that row is capped at SINGLE-SOURCE.

Source grades used:

| Tag     | Source                                                                                                                                                                                                                                             | Grade / reach                                                                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [NP]    | **navypedia.org** class pages (URL slug given per row, e.g. `uk/brit_bb1_devastation.html`), © Ivan Gogin. Read directly (full text fetched).                                                                                                        | Compilation built principally on Conway's _All the World's Fighting Ships 1860–1905_ + the standard national histories; **not itself a primary**. SINGLE-SOURCE.       |
| [NA86]  | T. A. Brassey (ed.), **_The Naval Annual 1886_** (1st volume; archive.org id `navalannual1886`, full text `NavalAnnual1886_djvu.txt` read directly).                                                                                                | Contemporary (1886) annual = period near-primary. Read directly → VERIFIED for the figures actually read.                                                             |
| [NE]    | **naval-encyclopedia.com** articles `industrial-era/the-imperial-brazilian-navy.php` and `industrial-era/old-navy-1865-85.php`, read directly (several pages state "Source: Conway's").                                                                | Secondary compilation. SINGLE-SOURCE.                                                                                                                                  |
| [DANFS] | US Navy, **_Dictionary of American Naval Fighting Ships_**, entry "Trenton i", incorporated verbatim into a Wikipedia lead article (the DANFS page itself returned a transport error; only the relayed text was read).                                | Official US Navy reference, **relayed not opened**. SINGLE-SOURCE.                                                                                                     |

Limits: this session could not open Conway's itself, and archive.org OCR of Brassey's tabular pages is
known column-scrambled (see the early-band note); the 1886 annual is nonetheless legible in its prose
tables. navypedia is a single compilation: **nearly every row below is SINGLE-SOURCE** unless [NA86]
corroborates the same figure (tonnage/cost/gun), in which case the row is marked VERIFIED with both cited.

Conversions: 1 in = 25.4 mm; 1 long ton = 1.016 t; 1 ft = 0.3048 m; 1 ihp = 0.7457 kW. navypedia reports
length in metres as pp/wl/oa; the row names which. **Moulded depth was not obtained for any ship** — it is
recorded as "not found / UNVERIFIED" throughout (navypedia gives draught and, rarely, hold depth).

### Reader's warning — ships NOT in service on 1 Jan 1880 (do not author as starting assets)

Several of the ships named in the brief were **not** complete at the scenario date. They are excluded from
the findings and listed in §5: **HMS _Inflexible_** (completed 1881), **French _Amiral Duperré_** (1883),
**Italian _Italia_** (1885) and **_Dandolo_** (1882), **SMS _Tegetthoff_** (1881), **Qing _Dingyuan_**
(completed 1885), the **US _Amphitrite_ class** (1890s), **Brazilian _Riachuelo_** (1883) and **_Aquidabã_**
(1887). **Italian _Caio Duilio_** completed **6 Jan 1880 — five days after** the 1 Jan start: treat as NOT in
service. Note also that the source "Wikipedia lead" used in `docs/research/p1-1880-torpedo-armament.md`
calls _Duilio_ "completed Jan 1880"; the precise date (6.1.1880) puts it just outside the window.

---

## 1. United Kingdom (Royal Navy)

The only navy with genuine choices. All ships below were in service by Jan 1880. _Inflexible_ is excluded.

### HMS _Devastation_ — turret (mastless) ironclad — [NP] `uk/brit_bb1_devastation.html`

| item                 | figure                                                                 | unit   | source | confidence   |
| -------------------- | ---------------------------------------------------------------------- | ------ | ------ | ------------ |
| class / sister       | _Devastation_ class; _Thunderer_ (**completion differs**: 1873 vs 1877) | —      | [NP]   | SINGLE-SOURCE |
| nation / type        | UK / mastless sea-going turret ship                                    | —      | [NP]   | SINGLE-SOURCE |
| laid down / launched / completed | 12.11.1869 / 12.7.1871 / 19.4.1873 (lead); _Thunderer_ 26.5.1877 | date | [NP] | SINGLE-SOURCE |
| displacement normal  | 9,387 (_Thunderer_ 9,390); 9,330 per period annual                     | t      | [NP]; [NA86] l.4639 | VERIFIED (two sources, ~0.6 % apart) |
| length               | 86.9 pp / 93.6 oa                                                      | m      | [NP]   | SINGLE-SOURCE |
| beam                 | 19.0                                                                   | m      | [NP]   | SINGLE-SOURCE |
| draught              | 8.03                                                                   | m      | [NP]   | SINGLE-SOURCE |
| depth (moulded)      | not found                                                              | m      | —      | UNVERIFIED   |
| machinery            | 2 × 2-cyl HSE trunk, 8 rectangular boilers; 2 shafts                   | —      | [NP]   | SINGLE-SOURCE |
| power                | 6,640                                                                  | ihp    | [NP]   | SINGLE-SOURCE |
| max speed            | 13.8                                                                   | kn     | [NP]   | SINGLE-SOURCE |
| main armament        | 2 × 2 **305 mm (12 in) RML Mk II** = 4 guns in **2 twin turrets**      | mm × n | [NP]   | SINGLE-SOURCE |
| secondary (as built) | none; **1879 refit added 8 × 1 11.4 mm (0.45-in) Nordenfelt-class**    | mm × n | [NP]   | SINGLE-SOURCE |
| torpedo (as built)   | **2 × 356 mm (14-in) tubes, added 1879**                               | tubes  | [NP]   | SINGLE-SOURCE |
| armour — material    | **wrought iron**                                                       | —      | [NP]   | SINGLE-SOURCE |
| armour — belt        | 305 – 216 (two strakes)                                                | mm     | [NP]   | SINGLE-SOURCE |
| armour — deck        | 76 – 51                                                                | mm     | [NP]   | SINGLE-SOURCE |
| armour — turret      | 356 – 254                                                              | mm     | [NP]   | SINGLE-SOURCE |
| armour — breastwork  | 305 – 254; CT 229 – 152                                                | mm     | [NP]   | SINGLE-SOURCE |
| coal                 | 1,600                                                                  | t      | [NP]   | SINGLE-SOURCE |
| endurance            | 4,700 @ 10                                                             | nmi (kn)| [NP]  | SINGLE-SOURCE |
| crew                 | 358                                                                    | —      | [NP]   | SINGLE-SOURCE |
| cost (hull)          | £291,000                                                               | £      | [NA86] l.3604 | VERIFIED (as printed; the annual's date column is scrambled) |

### HMS _Dreadnought_ (1875) — turret ironclad — [NP] `uk/brit_bb1_dreadnought.html`

| item                 | figure                                                              | unit   | source | confidence   |
| -------------------- | ------------------------------------------------------------------- | ------ | ------ | ------------ |
| nation / type        | UK / turret ship (enlarged _Devastation_, central citadel)          | —      | [NP]   | SINGLE-SOURCE |
| laid down / launched / completed | 10.9.1870 / 8.3.1875 / **15.2.1879**                    | date   | [NP]   | SINGLE-SOURCE |
| displacement normal  | 10,886; 10,820 per period annual                                    | t      | [NP]; [NA86] l.3602 | VERIFIED (two sources, ~0.6 % apart) |
| length               | 97.5 pp / 104.6 oa                                                  | m      | [NP]   | SINGLE-SOURCE |
| beam                 | 19.5                                                                | m      | [NP]   | SINGLE-SOURCE |
| draught              | 8.08                                                                | m      | [NP]   | SINGLE-SOURCE |
| depth                | not found                                                           | m      | —      | UNVERIFIED   |
| machinery            | 2 × 2-cyl VC, 12 cylindrical boilers; 2 shafts                      | —      | [NP]   | SINGLE-SOURCE |
| power                | 8,206                                                               | ihp    | [NP]   | SINGLE-SOURCE |
| max speed            | 14.5                                                                | kn     | [NP]   | SINGLE-SOURCE |
| main armament        | 2 × 2 **318 mm (12.5 in) RML Mk I** = 4 guns in **2 twin turrets**  | mm × n | [NP]   | SINGLE-SOURCE |
| secondary            | none as built (10 × 11.4 mm MG added 1884)                          | —      | [NP]   | SINGLE-SOURCE |
| torpedo (as built)   | **2 × 356 mm (14-in) tubes, beam**                                  | tubes  | [NP]   | SINGLE-SOURCE |
| armour — material    | **wrought iron**                                                    | —      | [NP]   | SINGLE-SOURCE |
| armour — belt        | 356 – 203 (lower edge); fore end extended to support the ram       | mm     | [NP]   | SINGLE-SOURCE |
| armour — deck        | 76 – 64                                                             | mm     | [NP]   | SINGLE-SOURCE |
| armour — turret      | 356 (two 178 mm plates)                                             | mm     | [NP]   | SINGLE-SOURCE |
| armour — citadel      | 356 – 279; bulkheads 279 – 330; CT 356 – 152                       | mm     | [NP]   | SINGLE-SOURCE |
| coal                 | 1,800                                                               | t      | [NP]   | SINGLE-SOURCE |
| endurance            | 5,700 @ 10                                                          | nmi (kn)| [NP]  | SINGLE-SOURCE |
| crew                 | 369                                                                 | —      | [NP]   | SINGLE-SOURCE |
| cost (hull)          | £493,035                                                            | £      | [NA86] l.3602 | VERIFIED (as printed) |

### HMS _Alexandra_ — central-battery ironclad — [NP] `uk/brit_bb1_alexandra.html`

| item                 | figure                                                                    | unit   | source | confidence   |
| -------------------- | ------------------------------------------------------------------------- | ------ | ------ | ------------ |
| nation / type        | UK / central-battery ironclad (improved _Sultan_)                         | —      | [NP]   | SINGLE-SOURCE |
| laid down / launched / completed | 5.3.1873 / 7.4.1875 / **31.1.1877**                          | date   | [NP]   | SINGLE-SOURCE |
| displacement normal  | 9,492; 9,490 per `content-1` note                                         | t      | [NP]   | SINGLE-SOURCE |
| length               | 99.1 pp / 104.9 oa                                                        | m      | [NP]   | SINGLE-SOURCE |
| beam                 | 19.5                                                                      | m      | [NP]   | SINGLE-SOURCE |
| draught              | 8.00                                                                      | m      | [NP]   | SINGLE-SOURCE |
| depth                | not found                                                                 | m      | —      | UNVERIFIED   |
| machinery            | sails + 2 × 3-cyl IVC, 12 cylindrical boilers; 2 shafts (first RN vertical compound engines) | — | [NP] | SINGLE-SOURCE |
| power                | 8,498                                                                     | ihp    | [NP]   | SINGLE-SOURCE |
| max speed            | 15.1 (fastest steamer afloat on completion)                               | kn     | [NP]   | SINGLE-SOURCE |
| main armament        | 2 × 1 **279 mm (11 in) RML Mk II** + 10 × 1 **254 mm (10 in) RML Mk I/II** | mm × n | [NP]  | SINGLE-SOURCE |
| mounting             | lower battery: 6 × 254 in broadside (3/side) + 254 in fwd corners; upper battery: 2 × 279 fwd corners + 2 × 254 aft corners | — | [NP] | SINGLE-SOURCE |
| secondary            | 6 × 1 100/21 20-pdr 16-cwt BL (saluting); replaced 1884 by 6 × 102 mm BL | mm × n | [NP] | SINGLE-SOURCE |
| torpedo (as built)   | **4 × 356 mm (14-in) torpedo carriages** (above-water)                    | carr.  | [NP]   | SINGLE-SOURCE (conflicts with `p1-1880-torpedo-armament.md`, which found "no tube count"; navypedia here gives 4) |
| armour — material    | **wrought iron**                                                          | —      | [NP]   | SINGLE-SOURCE |
| armour — belt        | 305 – 152 (3.2 m deep)                                                    | mm     | [NP]   | SINGLE-SOURCE |
| armour — deck        | 38 – 25                                                                   | mm     | [NP]   | SINGLE-SOURCE |
| armour — battery     | lower 305, upper 203; bulkheads 203 – 127                                 | mm     | [NP]   | SINGLE-SOURCE |
| coal                 | 680                                                                       | t      | [NP]   | SINGLE-SOURCE |
| endurance            | 2,700 @ 10                                                                | nmi (kn)| [NP]  | SINGLE-SOURCE |
| crew                 | 674                                                                       | —      | [NP]   | SINGLE-SOURCE |
| second ship          | sister _Temeraire_ (central battery + barbette) completed 1877, ~8,540 t, belt 280 mm — [NP] `uk/brit_bb1_temeraire.html` (not fetched in detail) | — | [NP] | SINGLE-SOURCE |

### HMS _Iris_ — steel dispatch vessel / early "cruiser" — [NP] `uk/brit_cr_iris.htm`

| item                 | figure                                                       | unit   | source | confidence   |
| -------------------- | ------------------------------------------------------------ | ------ | ------ | ------------ |
| nation / type        | UK / despatch vessel (steel; re-classed 2nd-class cruiser in the late 1880s) | — | [NP] | SINGLE-SOURCE |
| class                | _Iris_ class: _Iris_ (completed 4.1879) and _Mercury_ (9.1879) | —    | [NP]   | SINGLE-SOURCE |
| laid down / launched / completed | _Iris_: 11.10.1875 / 12.4.1877 / **4.1879**; _Mercury_ 16.3.1876 / 17.4.1878 / **9.1879** | date | [NP] | SINGLE-SOURCE |
| displacement normal  | 3,730                                                        | t      | [NP]   | SINGLE-SOURCE |
| length               | 91.4 pp; oa 101.5 (_Iris_) / 96.0 (_Mercury_)                | m      | [NP]   | SINGLE-SOURCE |
| beam                 | 14.0                                                         | m      | [NP]   | SINGLE-SOURCE |
| draught              | 6.71                                                         | m      | [NP]   | SINGLE-SOURCE |
| depth                | not found                                                    | m      | —      | UNVERIFIED   |
| machinery            | sails + 2 × 4-cyl HC direct-action, 8 oval + 4 cylindrical boilers; 2 shafts | — | [NP] | SINGLE-SOURCE |
| power                | 6,000 (design); _Iris_ 7,330 ihp trials; _Mercury_ 7,735 ihp | ihp    | [NP]   | SINGLE-SOURCE |
| max speed            | 17.5 design; _Iris_ 17.89 kn, _Mercury_ 18.57 kn (fastest warship afloat at completion) | kn | [NP] | SINGLE-SOURCE |
| main armament        | 10 × 1 **160 mm (6.3 in) 64-pdr 71-cwt RML**, 4/side + 1 fwd + 1 aft | mm × n | [NP] | SINGLE-SOURCE |
| secondary            | none as built                                                | —      | [NP]   | SINGLE-SOURCE |
| torpedo as built     | **none** (rearmed 1880; 4 × 356 mm TC added 1886–87)         | —      | [NP]   | SINGLE-SOURCE |
| armour               | **nil** — steel hull, extensive subdivision; coal bunkers in wing compartments give the only side protection | — | [NP] | SINGLE-SOURCE |
| coal                 | 780 full / 500 nominal                                       | t      | [NP]   | SINGLE-SOURCE |
| endurance            | 6,000 @ 10; ~2,000 @ full speed                              | nmi (kn)| [NP]  | SINGLE-SOURCE |
| crew                 | 275                                                          | —      | [NP]   | SINGLE-SOURCE |

### HMS _Lightning_ — first-class torpedo boat — [NP] `uk/brit_dd_tb1.htm`; and _TB2_ class — [NP] `uk/brit_dd_tb2.htm`

| item                     | figure                                                                 | unit   | source | confidence   |
| ------------------------ | ---------------------------------------------------------------------- | ------ | ------ | ------------ |
| nation / type            | UK / first RN purpose-built torpedo boat                               | —      | [NP]   | SINGLE-SOURCE |
| _Lightning_ (TB1) completed | 1877 (Thornycroft)                                                  | year   | [NP]   | SINGLE-SOURCE |
| _Lightning_ dimensions   | 25.6 oa / 24.7 pp × 3.1 × 1.60                                         | m      | [NP]   | SINGLE-SOURCE |
| _Lightning_ displacement | 28 normal / 32 full                                                   | t      | [NP]   | SINGLE-SOURCE |
| _Lightning_ machinery    | 1 × 2-cyl VCE, 1 locomotive boiler; 1 shaft; 460 ihp; 18 kn            | —      | [NP]   | SINGLE-SOURCE |
| _Lightning_ torpedo (as built) | **2 × 406 mm (16-in) TL**; **1879 refit: 1 × 406 mm (16-in) bow TT**; 1880s: 2 × 356 mm (14-in) TC | tubes | [NP] | SINGLE-SOURCE |
| _Lightning_ coal / crew  | 3 t / 15                                                                | t / —  | [NP]   | SINGLE-SOURCE |
| **TB2 class** (TB2–TB12, 11 boats) completed | TB2–TB9 **1878–79**; TB10–TB12 1880 (TB2–TB9 in service by Jan 1880) | year | [NP] | SINGLE-SOURCE |
| TB2 dimensions           | 26.5 oa / 26.3 pp × 3.1 × 1.60                                         | m      | [NP]   | SINGLE-SOURCE |
| TB2 displacement/machinery | 28 normal / 32 full; 1 × 2-cyl VCE + 1 loco boiler; 460 ihp; 20 kn   | t / kn | [NP]   | SINGLE-SOURCE |
| TB2 torpedo (as built)   | **1 × 406 mm (16-in) tube**; 1880s: 2 × 356 mm (14-in) dropping gear   | tubes  | [NP]   | SINGLE-SOURCE |
| TB2 crew                 | 15                                                                     | —      | [NP]   | SINGLE-SOURCE |
| **TB51–62** (2nd-class, 12 boats) completed | 1878: TB51–56; 1879: TB57–62                             | year   | [NP]   | SINGLE-SOURCE |
| TB51 dimensions/displacement | 18.5 oa × 2.29 × 0.92; 10.7 t; 120–150 ihp; 15 kn                | m / t  | [NP]   | SINGLE-SOURCE |
| TB51 torpedo (as built)  | **2 × 356 mm (14-in) TC**                                              | carr.  | [NP]   | SINGLE-SOURCE |
| TB51 crew                | 7                                                                      | —      | [NP]   | SINGLE-SOURCE |

> **Torpedo size caveat (repo-relevant):** the earliest RN torpedo craft (1877–79) mounted **16-in
> (406 mm)** tubes; the **14-in (356 mm) Whitehead** the repo keys on appears on these hulls only in
> 1880s re-arms, and as-built on the second-class TB51 (356 mm carriages). The French and Austro-Hungarian
> boats below used 380 mm and 356 mm respectively. Author the tube bore the source gives, not a single
> global "1880 = 14-in" rule (see §4).

---

## 2. France (Marine Nationale)

### _Redoutable_ — central-battery ironclad (steel hull, iron armour) — [NP] `france/fr_bb_redoutable.htm`

| item                 | figure                                                              | unit   | source | confidence   |
| -------------------- | ------------------------------------------------------------------- | ------ | ------ | ------------ |
| nation / type        | France / central-battery ironclad; first major warship with a steel hull | —  | [NP]   | SINGLE-SOURCE |
| laid down / launched / completed | 18.7.1873 / 18.9.1876 / **31.12.1878**                  | date   | [NP]   | SINGLE-SOURCE |
| displacement normal  | 9,224 (9,430 full per `content-1`)                                  | t      | [NP]   | SINGLE-SOURCE |
| length               | 97.1 wl / 100.7 oa                                                  | m      | [NP]   | SINGLE-SOURCE |
| beam                 | 19.7                                                                | m      | [NP]   | SINGLE-SOURCE |
| draught              | 7.80 max                                                            | m      | [NP]   | SINGLE-SOURCE |
| depth                | not found                                                           | m      | —      | UNVERIFIED   |
| machinery            | 1 HRCR compound, 8 oval boilers; 1 shaft                            | —      | [NP]   | SINGLE-SOURCE |
| power                | 6,200                                                               | ihp    | [NP]   | SINGLE-SOURCE |
| max speed            | 14.7                                                                | kn     | [NP]   | SINGLE-SOURCE |
| main armament        | 8 × 1 **274 mm (10.8 in) M1875** (4 in battery corners + 4 on upper deck) | mm × n | [NP] | SINGLE-SOURCE |
| secondary            | 6 × 1 **139 mm (5.5 in) M1870** + 12 × 5 **37 mm (1.5 in) revolving** | mm × n | [NP]  | SINGLE-SOURCE |
| torpedo (as built)   | **2 × 350 mm (13.8 in) TT, above-water, beam**                      | tubes  | [NP]   | SINGLE-SOURCE |
| armour — material    | **wrought iron**                                                    | —      | [NP]   | SINGLE-SOURCE |
| armour — belt        | 350 – 220 (complete, 1.5 m below to 1.5 m above wl)                 | mm     | [NP]   | SINGLE-SOURCE |
| armour — deck        | 60 – 45                                                             | mm     | [NP]   | SINGLE-SOURCE |
| armour — battery     | 300 – 240                                                           | mm     | [NP]   | SINGLE-SOURCE |
| coal                 | 620                                                                 | t      | [NP]   | SINGLE-SOURCE |
| endurance            | 2,840 @ 10                                                          | nmi (kn)| [NP]  | SINGLE-SOURCE |
| crew                 | 705                                                                 | —      | [NP]   | SINGLE-SOURCE |
| cost (hull)          | £356,000                                                            | £      | [NA86] l.3605 | VERIFIED (as printed) |

### _Tempête_ — breastwork monitor (coast defence) — [NP] `france/fr_bb_tempete.htm`

| item                 | figure                                                          | unit   | source | confidence   |
| -------------------- | --------------------------------------------------------------- | ------ | ------ | ------------ |
| nation / type        | France / shallow-draught breastwork monitor (coast defence)     | —      | [NP]   | SINGLE-SOURCE |
| class                | _Tempête_ class: _Tempête_ (completed **1879**), _Vengeur_ (1882) | —    | [NP]   | SINGLE-SOURCE |
| completion           | **1879**                                                        | year   | [NP]   | SINGLE-SOURCE |
| displacement normal  | 4,793                                                           | t      | [NP]   | SINGLE-SOURCE |
| length               | 73.6 pp / 76.0 oa                                               | m      | [NP]   | SINGLE-SOURCE |
| beam                 | 17.6                                                            | m      | [NP]   | SINGLE-SOURCE |
| draught              | 5.79 max                                                        | m      | [NP]   | SINGLE-SOURCE |
| depth                | not found                                                       | m      | —      | UNVERIFIED   |
| machinery            | 1 HC, 4 cylindrical boilers; 1 shaft                            | —      | [NP]   | SINGLE-SOURCE |
| power / speed        | 2,000 ihp / 11.7 kn                                             | ihp / kn | [NP] | SINGLE-SOURCE |
| main armament        | 1 × 2 **274 mm (10.8 in) M1875 No.2** = 2 guns in **1 twin turret** | mm × n | [NP] | SINGLE-SOURCE |
| secondary            | none as built (4 × 5 37 mm added 1880s)                         | —      | [NP]   | SINGLE-SOURCE |
| torpedo (as built)   | none (sister _Vengeur_ received 2 × 350 mm in the 1880s)        | —      | [NP]   | SINGLE-SOURCE |
| armour — material    | **wrought iron**                                                | —      | [NP]   | SINGLE-SOURCE |
| armour — belt        | 330 – 250                                                       | mm     | [NP]   | SINGLE-SOURCE |
| armour — deck        | 50                                                              | mm     | [NP]   | SINGLE-SOURCE |
| armour — turret      | 350 – 300; breastwork 330                                       | mm     | [NP]   | SINGLE-SOURCE |
| coal                 | 200                                                             | t      | [NP]   | SINGLE-SOURCE |
| crew                 | 174                                                             | —      | [NP]   | SINGLE-SOURCE |

### Torpilleur "N°27" — torpedo boat — [NP] `france/fr_dd_no27.htm`

| item                 | figure                                                     | unit   | source | confidence   |
| -------------------- | ---------------------------------------------------------- | ------ | ------ | ------------ |
| nation / type        | France / 1st-class (sea-going) torpedo boat                | —      | [NP]   | SINGLE-SOURCE |
| class / completion   | N°27 (Normand, Le Havre), **completed 1879** (ordered 12.11.1877; prototype of the "33-metre" type) | year | [NP] | SINGLE-SOURCE |
| displacement normal  | 43                                                         | t      | [NP]   | SINGLE-SOURCE |
| length / beam / draught | 31.8 wl / 3.30 / 0.90                                   | m      | [NP]   | SINGLE-SOURCE |
| machinery            | 1 × 2-cyl VCR, 1 locomotive boiler; 1 shaft                | —      | [NP]   | SINGLE-SOURCE |
| power / speed        | 320–500 ihp / 18 kn                                        | ihp / kn | [NP] | SINGLE-SOURCE |
| torpedo (as built)   | **1 × 380 mm (15-in) bow TT**; converted to compressed air 1880 | tube | [NP]  | SINGLE-SOURCE |
| crew                 | 12                                                         | —      | [NP]   | SINGLE-SOURCE |
| note                 | from 1877–80 France also built N°22, N°24, N°20, N°26, N°28, N°31 (all completed by 1880) | — | [NP] | SINGLE-SOURCE |

---

## 3. Germany (Kaiserliche Marine)

Germany's first-class torpedo boats only date from 1884; the only torpedo craft in service in Jan 1880 is
the torpedo steamship _Ulan_.

### SMS _Kaiser_ — central-battery ironclad (steel armour) — [NP] `germany/ger_bb_kaiser.htm`

| item                 | figure                                                          | unit   | source | confidence   |
| -------------------- | --------------------------------------------------------------- | ------ | ------ | ------------ |
| nation / type        | Germany / central-battery armoured frigate (last foreign-built German capital ship) | — | [NP] | SINGLE-SOURCE |
| class / completed    | _Kaiser_ class: _Kaiser_ **13.2.1875**, _Deutschland_ **20.7.1875** | date | [NP]  | SINGLE-SOURCE |
| displacement normal / full | 8,799 / 8,940 (Kaiser)                                    | t      | [NP]   | SINGLE-SOURCE |
| length               | 88.5 wl / 89.3 oa                                               | m      | [NP]   | SINGLE-SOURCE |
| beam                 | 19.1                                                            | m      | [NP]   | SINGLE-SOURCE |
| draught              | 7.93                                                            | m      | [NP]   | SINGLE-SOURCE |
| depth                | not found                                                       | m      | —      | UNVERIFIED   |
| machinery            | 1 HSE, 8 rectangular boilers; 1 shaft                           | —      | [NP]   | SINGLE-SOURCE |
| power / speed        | 5,700 ihp / 14.5 kn                                             | ihp / kn | [NP] | SINGLE-SOURCE |
| main armament        | 8 × 1 **263 mm (10.4 in) RKL/20 C/74** + 1 × 1 **209 mm (8.2 in) RKL/22.5 C/68** | mm × n | [NP] | SINGLE-SOURCE |
| secondary            | (as built, the 209 mm is the only light gun; 1882 re-arm)       | —      | [NP]   | SINGLE-SOURCE |
| torpedo (as built)   | **none** (5 × 350 mm TT installed at the 1897 reconstruction)   | —      | [NP]   | SINGLE-SOURCE |
| armour — material    | **steel** (belt on teak backing)                                | —      | [NP]   | SINGLE-SOURCE |
| armour — belt        | 254 – 127                                                       | mm     | [NP]   | SINGLE-SOURCE |
| armour — deck        | 51 – 38                                                         | mm     | [NP]   | SINGLE-SOURCE |
| armour — casemate    | 203 – 178; bulkheads 178; CT 50 (Kaiser) / 100 (Deutschland)    | mm     | [NP]   | SINGLE-SOURCE |
| coal                 | 684                                                             | t      | [NP]   | SINGLE-SOURCE |
| endurance            | 2,470 @ 10                                                      | nmi (kn)| [NP]  | SINGLE-SOURCE |
| crew                 | 656                                                             | —      | [NP]   | SINGLE-SOURCE |

### SMS _Sachsen_ — central-citadel ironclad / "armoured corvette" — [NP] `germany/ger_bb_sachsen.htm`

| item                 | figure                                                          | unit   | source | confidence   |
| -------------------- | --------------------------------------------------------------- | ------ | ------ | ------------ |
| nation / type        | Germany / armoured corvette (central citadel, four barbettes)   | —      | [NP]   | SINGLE-SOURCE |
| class / completed    | _Sachsen_ class; only **_Sachsen_ completed 20.10.1878** is in service Jan 1880 (_Bayern_, _Württemberg_ 1881; _Baden_ 1883) | date | [NP] | SINGLE-SOURCE |
| displacement normal / full | 7,677 / 7,935 (Sachsen)                                  | t      | [NP]   | SINGLE-SOURCE |
| length               | 98.2 oa / 93.0 wl                                               | m      | [NP]   | SINGLE-SOURCE |
| beam                 | 18.4                                                            | m      | [NP]   | SINGLE-SOURCE |
| draught              | 6.53                                                            | m      | [NP]   | SINGLE-SOURCE |
| depth                | not found                                                       | m      | —      | UNVERIFIED   |
| machinery            | 2 HSE, 8 rectangular boilers; 2 shafts                          | —      | [NP]   | SINGLE-SOURCE |
| power / speed        | 5,000 ihp / 13.5 kn                                             | ihp / kn | [NP] | SINGLE-SOURCE |
| main armament        | 6 × 1 **263 mm (10.2 in) RKL/22 C/76** — 2 side-by-side fwd in a pear-shaped barbette, 4 in a square barbette amidships | mm × n | [NP] | SINGLE-SOURCE |
| secondary            | 6 × 1 **87 mm (3.4 in) RKL/24** + 8 × 1 **37 mm (1.5 in) SK**   | mm × n | [NP]   | SINGLE-SOURCE |
| torpedo (as built)   | **none** (3 × 350 mm TT installed 1886)                         | —      | [NP]   | SINGLE-SOURCE |
| armour — material    | **wrought iron** (patented sandwich)                            | —      | [NP]   | SINGLE-SOURCE |
| armour — citadel      | 254 – 203 sides, 152 transverse bulkheads                     | mm     | [NP]   | SINGLE-SOURCE |
| armour — deck        | 75 – 50                                                         | mm     | [NP]   | SINGLE-SOURCE |
| armour — barbettes   | 254; CT 140                                                     | mm     | [NP]   | SINGLE-SOURCE |
| coal                 | 700                                                             | t      | [NP]   | SINGLE-SOURCE |
| endurance            | 1,940 @ 10                                                      | nmi (kn)| [NP]  | SINGLE-SOURCE |
| crew                 | 317                                                             | —      | [NP]   | SINGLE-SOURCE |

### SMS _Ulan_ — torpedo steamship — [NP] `germany/ger_dd_ulan.htm`

| item                 | figure                                                       | unit   | source | confidence   |
| -------------------- | ------------------------------------------------------------ | ------ | ------ | ------------ |
| nation / type        | Germany / torpedo steamship (ex-torpedo steamer N°IV)        | —      | [NP]   | SINGLE-SOURCE |
| completed / rebuilt  | completed **8.10.1876**; rebuilt **1878** to mount torpedo tube | year | [NP]  | SINGLE-SOURCE |
| displacement normal / full | 374 / 438                                              | t      | [NP]   | SINGLE-SOURCE |
| length / beam / draught | 36–38 oa (35.05 wl) / 8.00 / 4.57 deep load            | m      | [NP]   | SINGLE-SOURCE |
| machinery            | 1 VSE, 4 Belleville cylindrical boilers; 1 shaft             | —      | [NP]   | SINGLE-SOURCE |
| power / speed        | 800 ihp / 12 kn                                              | ihp / kn | [NP] | SINGLE-SOURCE |
| armament             | 3 × 5 **37 mm (1.5 in) RV L/30** + torpedo                   | mm × n | [NP]   | SINGLE-SOURCE |
| torpedo (as built, 1878) | **1 × 381 mm (15-in) bow TT** (spar torpedo removed 1878) | tube   | [NP]   | SINGLE-SOURCE |
| coal / crew          | 25 t / 41                                                    | t / —  | [NP]   | SINGLE-SOURCE |
| note                 | Germany's first 1st-class torpedo boats (N°XVIII etc.) date from 1884 — none in service Jan 1880 | — | [NP] | SINGLE-SOURCE |

---

## 4. Torpedo armament cross-reference — "as built" by nation (for the 14-in tube question)

The repo authors **14-in (356 mm) Whitehead tubes for 1880** (`docs/research/p1-1880-torpedo-armament.md`).
That is correct for some navies and wrong for others at Jan 1880. Author the bore each source gives; this
table prevents a global "1880 = 14-in" guess.

| ship / class (completion)          | nation | as-built torpedo armament              | source | confidence   |
| ---------------------------------- | ------ | -------------------------------------- | ------ | ------------ |
| _Devastation_ (1873)               | UK     | 2 × 356 mm above-water (added 1879)    | [NP]   | SINGLE-SOURCE |
| _Dreadnought_ (1879)               | UK     | 2 × 356 mm, beam                       | [NP]   | SINGLE-SOURCE |
| _Alexandra_ (1877)                 | UK     | 4 × 356 mm carriages (source conflict) | [NP]   | SINGLE-SOURCE |
| _Lightning_ (1877)                 | UK     | 2 × **406 mm** (TL); 1 × 406 mm bow TT (1879) | [NP] | SINGLE-SOURCE |
| TB2 class (1878–79)                | UK     | 1 × **406 mm** tube                    | [NP]   | SINGLE-SOURCE |
| TB51 class (1878–79)               | UK     | 2 × **356 mm** carriages (2nd class)   | [NP]   | SINGLE-SOURCE |
| _Redoutable_ (1878)                | FR     | 2 × **350 mm**, above-water beam       | [NP]   | SINGLE-SOURCE |
| N°27 (1879)                        | FR     | 1 × **380 mm** bow tube                | [NP]   | SINGLE-SOURCE |
| _Kaiser_ / _Sachsen_ (1875/78)     | DE     | none as built                          | [NP]   | SINGLE-SOURCE |
| _Ulan_ (1878 rebuild)              | DE     | 1 × **381 mm** bow tube                | [NP]   | SINGLE-SOURCE |
| _Principe Amedeo_ / _Palestro_     | IT     | none as built                          | [NP]   | SINGLE-SOURCE |
| _Petr Velikiy_ (1876)              | RU     | none as built; 2 × 356 mm carriages added **1880** | [NP] | SINGLE-SOURCE |
| _Novgorod_ (1874)                  | RU     | none                                   | [NP]   | SINGLE-SOURCE |
| _General-Admiral_ (1875)           | RU     | none as built (381 mm added 1890)      | [NP]   | SINGLE-SOURCE |
| _Kaiser Max_ class (1876–78)       | AH     | none as built; **4 × 350 mm added 1880** | [NP] | SINGLE-SOURCE |
| III / IV (1879)                    | AH     | **2 × 356 mm bow TT**                  | [NP]   | SINGLE-SOURCE |
| _Fusō_ (1878)                      | JP     | none as built (2 × 350 mm added 1885)  | [NP]   | SINGLE-SOURCE |
| _Kongō_ / _Hiei_ (1878)           | JP     | none as built (2 × 350 mm bow added 1880s) | [NP] | SINGLE-SOURCE |
| _Mesudiye_ / _Avnillah_            | OT     | none documented as built               | [NP]   | SINGLE-SOURCE |
| _Numancia_ / _Vitoria_             | ES     | none as built (356 mm added 1900)      | [NP]   | SINGLE-SOURCE |
| _Vasco da Gama_ (1876)             | PT     | none documented                        | [NP]   | SINGLE-SOURCE |
| _Sete de Setembro_ (1874)          | BR     | none documented (4 TB bought by 1879)  | [NE]   | SINGLE-SOURCE |

**Recommendation:** keep the repo's `whitehead_14in_1886` model only for the hulls whose source says 356 mm.
Where a source gives 350/380/381/406 mm, either author a distinct tube bore or record the mismatch as an
approximation in the design's provenance (as `p1-1880-torpedo-armament.md` already does for the 1886 model).

---

## 5. NOT in service on 1 Jan 1880 (exclusion list)

| ship / class                                   | nation | type                     | completion (per source)             | source | confidence   |
| ---------------------------------------------- | ------ | ------------------------ | ----------------------------------- | ------ | ------------ |
| HMS _Inflexible_                               | UK     | masted turret ironclad   | **1881** (comp. of class, 1 ship)   | [NP] `uk/brit_bb1_inflexible.html` | SINGLE-SOURCE |
| _Amiral Duperré_                               | FR     | barbette ship            | **1883**                            | [NP] `france/fr_bb_amiral_duperre.htm` | SINGLE-SOURCE |
| _Caio Duilio_                                  | IT     | turret ironclad (100-ton guns) | **6.1.1880** (5 days after start) | [NP] `italy/it_bb_duilio80.htm` | SINGLE-SOURCE |
| _Dandolo_                                      | IT     | turret ironclad          | **11.4.1882**                       | [NP] | SINGLE-SOURCE |
| _Italia_ / _Lepanto_                          | IT     | barbette ironclad        | **1885 / 1887** (navypedia class 1885–1887) | [NP] `italy/it_bb_italia.htm` | SINGLE-SOURCE |
| SMS _Tegetthoff_ (1878)                        | AH     | central-battery ironclad | **1881**                            | [NP] `austrohungary/ah_bb_tegetthoff.htm` | SINGLE-SOURCE |
| _Dingyuan_ / _Zhenyuan_                        | Qing   | turret ironclad          | ordered 1880, **completed 1885**    | [NP] not listed (no Chinese BB before 1885) | UNVERIFIED (print timelines) |
| _Amphitrite_ class                             | US     | double-turret monitor    | **1891–1896**                       | [NP] `usa/us_mon_amphitrite.htm` (1891–96) | SINGLE-SOURCE |
| _Riachuelo_                                    | BR     | turret ironclad          | **1883**                            | [NP] `brazil/br_bb_riachuelo.htm` | SINGLE-SOURCE |
| _Aquidabã_                                     | BR     | turret ironclad          | **1887**                            | [NP] `brazil/br_bb_aquidaba.htm` | SINGLE-SOURCE |
| _Kang Chi_ (Foochow)                           | Qing   | composite sloop          | **9.1.1880** (excluded, marginal)   | [NP] `china/ch_cr_wei_yuen.htm` | SINGLE-SOURCE |

> The `content-1-fleets-and-ship-classes.md` note is correct that _Inflexible_, _Amiral Duperré_,
> _Tegetthoff_, _Dingyuan_ and the _Amphitrite_ class were unfinished at 1880 — this note confirms it and
> adds that **_Caio Duilio_ (6 Jan 1880) and Qing _Kang Chi_ (9 Jan 1880) are also just outside** the window.

---

## 6. Findings — in-service ships by nation (compact spec sheets)

Each cell carries its own confidence. `[NP]` = navypedia class page (slug in heading); corroborating
sources named inline. **Moulded depth not found for any ship (UNVERIFIED).**

### 6.1 Italy — _Principe Amedeo_ (and _Palestro_) — central-battery ironclad — [NP] `italy/it_bb_principe_amedeo.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completion | _Principe Amedeo_ **15.12.1874**; _Palestro_ **11.7.1875** (launched 1871 per [NA86] l.2871) | date | [NP]; [NA86] | SINGLE-SOURCE (launch corroborated [NA86]) |
| displacement normal / full | 5,761 / 6,020 (P.A.); _Palestro_ 6,318 full | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 79.7 / 17.4 / 7.90 (P.A.); _Palestro_ 78.8 pp / 17.3 / 8.00 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 HSE, 6 cylindrical boilers; 6,117 ihp; P.A. 12.2 kn, _Palestro_ 12.9 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 1 × 1 **279 mm (11 in) Armstrong 25-ton RML** + 6 × 1 **254 mm (10 in) Armstrong 18-ton RML No1** | mm × n | [NP] | SINGLE-SOURCE |
| mounting | _Principe Amedeo_: one central casemate with all six 254s; _Palestro_: three casemates | — | [NP] | SINGLE-SOURCE |
| torpedo (as built) | none | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / deck / battery | belt 220; battery 140; CT 60 (no separate deck given) | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 580 t / 548 | t / — | [NP] | SINGLE-SOURCE |

### 6.2 Russia — _Petr Velikiy_ (turret ship), _Novgorod_ (circular monitor), _General-Admiral_ (armoured cruiser)

**Petr Velikiy** — [NP] `russia/ru_bb_pyotr_velikiy.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completion | **15.10.1876** | date | [NP] | SINGLE-SOURCE |
| displacement normal / full | 9,790 / 10,460; "9,340 t" per period annual (only completed first-rate Russian ironclad) | t | [NP]; [NA86] l.2899 | VERIFIED (two sources; period figure differs ~5 % — loading basis differs) |
| length / beam / draught | 103.5 oa / 98.1 pp; 19.0; 8.28 max | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 2 HRCR, 12 rectangular boilers; 6,400 ihp; 12.3 kn (defective engines until 1881 refit) | — | [NP] | SINGLE-SOURCE |
| main armament | 2 × 2 **305 mm (12 in) obr.1867** = 4 guns in **2 twin turrets** | mm × n | [NP] | SINGLE-SOURCE |
| secondary | 6 × 1 **87 mm (3.4 in) 4-pdr obr.1867** + 2 × 4 **25 mm (1 in) Palmkrantz** | mm × n | [NP] | SINGLE-SOURCE |
| torpedo (as built) | none; 2 × 356 mm carriages added **1880**; 2 × 381 mm bow TT in 1882 refit | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / deck / turret | belt 356–292 (ends 254–203); deck 76; citadel 356; turrets 356 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 1,200 t / 440 | t / — | [NP] | SINGLE-SOURCE |

**Novgorod** (circular coast-defence ship) — [NP] `russia/ru_bb_novgorod.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completion | **1874** | date | [NP] | SINGLE-SOURCE |
| displacement normal | 2,491 | t | [NP] | SINGLE-SOURCE |
| length = beam / draught | 30.8 × 30.8 / 4.11 max (circular) | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 6 HC, 8 cylindrical boilers; 3,000 ihp; 6–7 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 1 × 2 **279 mm (11 in) obr.1867** in **1 twin barbette** | mm × n | [NP] | SINGLE-SOURCE |
| secondary | 2 × 1 87 mm (3.4 in) 4-pdr | mm × n | [NP] | SINGLE-SOURCE |
| torpedo | none | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — side / barbette / deck | sides 229–178; barbette 229; deck 70 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 160 t / 149 | t / — | [NP] | SINGLE-SOURCE |
| sister | _Vitse-Admiral Popov_ (1876), same family — [NP] | — | [NP] | SINGLE-SOURCE |

**General-Admiral** (armoured cruiser/frigate) — [NP] `russia/ru_cr_general_admiral.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completion | **20.9.1875**; sister _Gertsog Edinburgskiy_ **1877** | date | [NP] | SINGLE-SOURCE |
| displacement normal | 5,031 (G.E. 4,838) | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 91.0 oa / 87.1 wl; 14.6; 7.01 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 VC, 12 rectangular boilers; 4,470 ihp; 12.3 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 6 × 1 **203 mm (8 in) obr.1867** + 2 × 1 **152 mm (6 in) obr.1867** + 4 × 1 87 mm (3.4 in) | mm × n | [NP] | SINGLE-SOURCE |
| torpedo (as built) | none (381 mm added 1890) | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / deck | belt 152–127 (complete, 2.1 m high); deck 25 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 1,000 t / 490 | t / — | [NP] | SINGLE-SOURCE |

### 6.3 Austria-Hungary — _Kaiser Max_ class (central battery), III/IV (torpedo boats)

**Kaiser Max class** — [NP] `austrohungary/ah_bb_kaiser_max.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| class / completion | _Don Juan d'Austria_ **26.6.1876**, _Kaiser Max_ **26.10.1876**, _Prinz Eugen_ **11.1878** | date | [NP] | SINGLE-SOURCE |
| displacement normal | 3,548 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 75.9 oa / 73.2 wl; 15.3; 6.15 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 × 2-cyl HRCR, 4 rectangular boilers; 2,755 ihp; 13.3 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 8 × 1 **209 mm (8.2 in) G. L/20 C.68** | mm × n | [NP] | SINGLE-SOURCE |
| secondary | 4 × 1 **87 mm (3.4 in) G. L/24 M.75** + 2 × 1 **66 mm (2.6 in) G. L/18** | mm × n | [NP] | SINGLE-SOURCE |
| torpedo (as built) | none; **4 × 350 mm TT (bow/beam/stern) added 1880** | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** (on 254 mm teak) | — | [NP] | SINGLE-SOURCE |
| armour — belt / casemate / bulkheads | belt 205 (ends 120–102); casemate 125; bulkheads 115 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 380 t / 400 | t / — | [NP] | SINGLE-SOURCE |
| other in-service AH ironclads | _Kaiser_ (1873), _Erzherzog Albrecht_ (1874), _Custoza_ (1875) — [NP] `ah_bb_kaiser.htm`, `ah_bb_erzherzog_albrecht.htm`, `ah_bb_custoza.htm` | — | [NP] | SINGLE-SOURCE |

**III / IV torpedo boats** — [NP] `austrohungary/ah_dd_iii.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completion | **1879** (Yarrow-built; variant of _Lightning_) | date | [NP] | SINGLE-SOURCE |
| displacement normal | 27 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 26.4 / 3.30 / 1.50 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 HC, 1 locomotive boiler; 430 ihp; 17.5 kn | — | [NP] | SINGLE-SOURCE |
| torpedo (as built) | **2 × 356 mm (14-in) bow TT** | tubes | [NP] | SINGLE-SOURCE |
| crew | 10 | — | [NP] | SINGLE-SOURCE |
| note | _Zara_ / _Spalato_ torpedo ships were completed **1881 / 1880** — excluded | — | [NP] | SINGLE-SOURCE |

### 6.4 Japan — _Fusō_ (central-battery ironclad), _Kongō_ / _Hiei_ (armoured corvettes)

**Fusō** — [NP] `japan/jap_bb_fuso78.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completion | **1.1878** | date | [NP] | SINGLE-SOURCE |
| displacement normal | 3,717 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 68.9 wl / 67.1 pp; 14.6; 5.49 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 2 Penn HTC, 8 cylindrical boilers; 3,500 ihp; 13 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 4 × 1 **235 mm (9.45 in) RKL/22 C/72** + 2 × 1 **173 mm (6.7 in) RKL/25 C/72** | mm × n | [NP] | SINGLE-SOURCE |
| secondary | 4 × 1 **79 mm (3.1 in) RKL/27** + 2 × 1 **75 mm (3 in) KL/11** | mm × n | [NP] | SINGLE-SOURCE |
| torpedo (as built) | none (2 × 350 mm beam TT added 1885) | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / deck / battery | belt 229–114 (2.36 m high); battery 229; bulkheads 152 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 360 t / 250 | t / — | [NP] | SINGLE-SOURCE |

**Kongō / Hiei** — [NP] `japan/jap_cr_kongo.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completion | _Kongō_ **1.1878**, _Hiei_ **23.3.1878** | date | [NP] | SINGLE-SOURCE |
| displacement normal / full | 2,248 / 3,718 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 70.5 wl / 67.1 pp; 12.5; 5.49 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 × 2-cyl HC, 6 cylindrical boilers; 2,450–2,490 ihp; 13.7–14 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 3 × 1 **173 mm (6.7 in) RKL/20 C/67** | mm × n | [NP] | SINGLE-SOURCE |
| secondary | 6 × 1 **149 mm (5.9 in) RKL/25 C/74** + 2 × 1 75 mm (3 in) KL/11 | mm × n | [NP] | SINGLE-SOURCE |
| torpedo (as built) | none (2 × 350 mm bow TT added 1880s) | — | [NP] | SINGLE-SOURCE |
| armour — material | **compound** | — | [NP] | SINGLE-SOURCE |
| armour — belt | 114 – 76 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 280 t / 314 | t / — | [NP] | SINGLE-SOURCE |

### 6.5 United States — _Trenton_ (screw frigate), _Canonicus_ (monitor)

The US had no modern seagoing ironclad in service in Jan 1880 — only Civil-War monitors and the unfinished
_Amphitrite_ class. _Trenton_ is the newest cruising ship; a monitor represents the "coastal heavy gun".

**USS _Trenton_** — [DANFS] (relayed)

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| class / type | _Trenton_ (unique), wooden screw frigate | — | [DANFS] | SINGLE-SOURCE |
| completed (commissioned) | **14.2.1877** | date | [DANFS] | SINGLE-SOURCE |
| displacement | 3,800 long tons (3,900 t) | t | [DANFS] | SINGLE-SOURCE |
| length / beam / draught | 253 ft (77.1 m) / 48 ft (14.6 m) / 20 ft 6 in (6.25 m) | m | [DANFS] | SINGLE-SOURCE |
| power / speed | not given / 14 kn | kn | [DANFS] | UNVERIFIED (ihp absent) |
| main armament | 11 × **8 in (203 mm) muzzle-loading rifles** + 2 × 20-pdr (9.1 kg) BL rifles | mm × n | [DANFS] | SINGLE-SOURCE |
| armour | none (wooden hull) | — | [DANFS] | SINGLE-SOURCE |
| crew | 477 | — | [DANFS] | SINGLE-SOURCE |
| **caution** | the general-characteristics block on the lead page is unsourced to a named print work; navypedia has no _Trenton_ page. Treat every value above as SINGLE-SOURCE and prefer a Conway's re-check before authoring. | — | — | — |

**USS _Canonicus_** (representative monitor) — [NP] `usa/us_mon_canonicus.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| class / type | _Canonicus_ class (9 ships, 1864–71), iron monitor, coast defence | — | [NP] | SINGLE-SOURCE |
| commissioned | 16.4.1864 (_Mahopac_ 22.9.1864; _Ajax_ delivered 1.1.1871) — several in service Jan 1880 | date | [NP] | SINGLE-SOURCE |
| displacement normal | 2,100 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 68.0–68.6 / 13.1–13.2 / 3.78–3.96 mean | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 Ericsson VL, 2 boilers; 320 ihp; 8 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 1 × 2 **381 mm (15 in) long Dahlgren SB** in **1 turret** | mm × n | [NP] | SINGLE-SOURCE |
| torpedo | none | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — side / turret / deck | side 127–76; turret 254; deck 38 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 140–150 t / 100 | t / — | [NP] | SINGLE-SOURCE |
| alternatives in service | torpedo rams _Alarm_ (1874; 800 t, 48.3 m, 10 kn, 1 × 15-in, 3 spar torpedoes) and _Intrepid_ (1874; 1,150 t, 11 kn, 4 × 24-pdr howitzers + 1 torpedo tube) — [NE] `old-navy-1865-85.php` | — | [NE] | SINGLE-SOURCE |

### 6.6 Qing Dynasty — _Wei Yuen_ (composite sloop), _Fei Ting_ (iron flatiron gunboat)

No Qing ironclad existed before 1885; _Dingyuan_ was ordered in 1880 and completed in 1885. The newest
Chinese warships in service by 1879 are the Foochow composite sloops and Rendel flatiron gunboats.

**Wei Yuen** — [NP] `china/ch_cr_wei_yuen.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| class / type | _Wei Yuen_ class composite sloop (Peiyang fleet); _Chao Wu_ (Nanyang) completed 1879 | — | [NP] | SINGLE-SOURCE |
| completed | _Wei Yuen_ **14.9.1877**; _Chao Wu_ **1879** | date | [NP] | SINGLE-SOURCE |
| displacement normal | 1,258 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 66.2 oa / 64.0 pp; 8.99; 3.81 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 HC, 4 cylindrical boilers; 750 ihp; 11 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 1 × 1 **160 mm (6.3 in) Armstrong RML** + 6 × 1 **121 mm (4.75 in) Armstrong 40-pdr BLR** | mm × n | [NP] | SINGLE-SOURCE |
| torpedo | none | — | [NP] | SINGLE-SOURCE |
| armour — material | iron shield only | — | [NP] | SINGLE-SOURCE |
| armour | gun shield 32–13 | mm | [NP] | SINGLE-SOURCE |
| crew | 180 | — | [NP] | SINGLE-SOURCE |

**Fei Ting** — [NP] `china/ch_of_fei_ting.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| class / type | _Fei Ting_ (ex-Gamma) / _Tse Tien_ (ex-Delta) Rendel "flatiron" iron gunboats | — | [NP] | SINGLE-SOURCE |
| completed | **12.1876** | date | [NP] | SINGLE-SOURCE |
| displacement normal | 420 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 36.6 / 9.14 / 2.44 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 2 HCR, 1 cylindrical boiler; 270 ihp; 9.5 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 1 × 1 **318 mm (12.5 in) Armstrong 38-ton RML** | mm × n | [NP] | SINGLE-SOURCE |
| secondary | 2 × 1 **70 mm (2.8 in) RK L/25** + 1 × 4 25 mm Nordenfelt | mm × n | [NP] | SINGLE-SOURCE |
| armour | iron shield 13; CT 13 | mm | [NP] | SINGLE-SOURCE |
| crew | 30 | — | [NP] | SINGLE-SOURCE |

### 6.7 Ottoman Empire — _Mesudiye_ (central battery), _Avnillah_ (casemate ironclad)

**Mesudiye** — [NP] `turkey/tu_bb_mesudiye.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| class / type | _Mesudiye_ (Reed design, based on HMS _Hercules_); central-battery ironclad | — | [NP] | SINGLE-SOURCE |
| completed | **12/1875** (navypedia text says "1876-7" — conflict; use 1875) | date | [NP] | SINGLE-SOURCE (internal conflict) |
| displacement normal | 8,938 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 102.4 / 17.9 / 7.90 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 × 2-cyl HSE, 8 rectangular boilers; 7,431 ihp; 13.7 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 12 × 1 **254 mm (10 in) Armstrong 18-ton RML** (battery) + 3 × 1 **178 mm (7 in) Armstrong 7.5-ton RML** (upper deck, 2 fwd/1 aft) | mm × n | [NP] | SINGLE-SOURCE |
| torpedo (as built) | none documented | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / deck / battery | belt 305–152 (ends 127–76); battery 254–178; CT 203 (no separate deck) | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 600 t / 700 | t / — | [NP] | SINGLE-SOURCE |

**Avnillah** — [NP] `turkey/tu_bb_avnillah.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| class / type | _Avnillah_ class (with _Muin-i Zafer_); casemate ironclad | — | [NP] | SINGLE-SOURCE |
| completed | **1870** | date | [NP] | SINGLE-SOURCE |
| displacement normal | 2,362 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 71.9 oa / 69.0 pp; 11.0; 5.00 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 HC, 4 rectangular boilers; 2,200 ihp; 12 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 4 × 1 **203 mm (8 in) Armstrong 9-ton RML** (casemate) | mm × n | [NP] | SINGLE-SOURCE |
| torpedo | none as built | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / casemate | belt 152–127; casemate 127 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 220 t / 145 | t / — | [NP] | SINGLE-SOURCE |

### 6.8 Spain — _Numancia_, _Vitoria_ (broadside ironclads), _Puigcerdá_ (monitor)

**Numancia** — [NP] `spain/sp_bb_numancia.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completed | **17.12.1864** (iron-hulled broadside ironclad) | date | [NP] | SINGLE-SOURCE |
| armament as of 1880 (after 1876 refit) | 2 × 1 **254 mm (10 in) Armstrong 300-pdr RML** + 8 × 1 **160 mm (6.3 in) Palliser RML** | mm × n | [NP] | SINGLE-SOURCE |
| displacement normal | 7,189 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 96.1 oa / 96.0 pp; 17.4; 8.22 max | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 HRCR, 8 rectangular boilers; 3,700 ihp; 10 kn | — | [NP] | SINGLE-SOURCE |
| torpedo (as built) | none (356 mm added 1900) | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / battery | belt 130 (ends 10); battery 120 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 1,100 t / 500 | t / — | [NP] | SINGLE-SOURCE |

**Vitoria** — [NP] `spain/sp_bb_vitoria.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completed | **15.11.1867** (broadside ironclad) | date | [NP] | SINGLE-SOURCE |
| armament as of 1880 (after 1869 refit) | 4 × 1 **254 mm (10 in) Armstrong 300-pdr RML** + 3 × 1 **203 mm (8 in) Armstrong 9-ton RML** (+ survivors of the original 68-pdrs) | mm × n | [NP] | SINGLE-SOURCE |
| displacement normal | 7,135 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 96.4 pp; 17.4; 8.07 max | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 1 HRCR, 8 rectangular boilers; 4,500 ihp; 12 kn | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / battery | belt 130; battery 120 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 875 t / 500 | t / — | [NP] | SINGLE-SOURCE |

**Puigcerdá** (monitor) — [NP] `spain/sp_bb_puigcerda.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completed | **1875** | date | [NP] | SINGLE-SOURCE |
| displacement normal | 552 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 39.0 / 9.00 / 2.50 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | —; 328 ihp; 8 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 1 × 1 **160 mm (6.3 in) Palliser RML** + 1 × 2 **121 mm (4.75 in) SBML** in **1 twin turret** | mm × n | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / turret | belt 100; turret 100–80 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 23 t / 59 | t / — | [NP] | SINGLE-SOURCE |

### 6.9 Netherlands — _Matador_ (monitor), _Schorpionen_ (turret ram), _Atjeh_ (unprotected cruiser)

No Dutch **protected** cruiser existed before _Sumatra_ (1891) — substitute the _Atjeh_ unprotected cruiser.

**Matador** — [NP] `netherlands/nl_bb_matador.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completed | **1879** (sister _Draak_ 1878) | date | [NP] | SINGLE-SOURCE |
| displacement normal | 1,968 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 63.9 / 14.5 / 3.20 max | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 2 HC, 4 cylindrical boilers; 690 ihp; 7.5 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 1 × 2 **283 mm (11.1 in) Krupp No.1** in **1 twin turret** | mm × n | [NP] | SINGLE-SOURCE |
| torpedo | none | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — side / turret / deck | side 140–115; turret 305–230; deck 25 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 109 t / 131 | t / — | [NP] | SINGLE-SOURCE |

**Schorpionen** (turret ram) — [NP] `netherlands/nl_bb_schorpionen.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completed | _Schorpionen_ **9.1868**, _Stier_ **1868** (the brief's _Buffel_ is a sister of this 1868 group; navypedia's page lists only _Schorpionen_/_Stier_) | date | [NP] | SINGLE-SOURCE |
| displacement normal | 2,140 (Stier 2,078) | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 62.5 / 11.9 / 4.82 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 2 HRCR, 4 rectangular boilers; 2,225 ihp; 13 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 1 × 2 **229 mm (9 in) Armstrong 12.5-ton RML** in **1 turret** | mm × n | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — side / turret / deck | side 152; turret 278–203; deck 25–19 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 246 t / 136 | t / — | [NP] | SINGLE-SOURCE |

**Atjeh** (unprotected cruiser) — [NP] `netherlands/nl_cr_atjeh.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completed | _Atjeh_ **1.11.1877**; _Tromp_ 1878? | date | [NP] | SINGLE-SOURCE |
| displacement normal | 3,425–3,669 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 91.8–92.1 / 12.5 / 6.40–6.96 | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | —; 2,700–3,300 ihp; 13.5–14.8 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 6 × 1 **173 mm (6.8 in) Krupp No.1** + 8 × 1 **120 mm (4.7 in) Krupp No.1** | mm × n | [NP] | SINGLE-SOURCE |
| armour | none (unprotected cruiser) | — | [NP] | SINGLE-SOURCE |
| coal / crew | 440–580 t / 277–306 | t / — | [NP] | SINGLE-SOURCE |

### 6.10 Portugal — _Vasco da Gama_ (coast-defence casemate ironclad)

[NP] `portugal/pr_bb_vasco_da_gama.htm`

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| completed | **1876** | date | [NP] | SINGLE-SOURCE |
| displacement normal | 2,384 | t | [NP] | SINGLE-SOURCE |
| length / beam / draught | 61.0 pp / 14.2 over battery (12.2 wl) / 5.79 max | m | [NP] | SINGLE-SOURCE |
| machinery / power / speed | 2 VC; 3,000 ihp; 10.3 kn | — | [NP] | SINGLE-SOURCE |
| main armament | 2 × 1 **263 mm (10.4 in) RK L/20 C/74** + 1 × 1 **149 mm (5.9 in) RK L/22 C/75** + 4 × 1 **67 mm (2.6 in) Krupp** | mm × n | [NP] | SINGLE-SOURCE |
| torpedo | none documented | — | [NP] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NP] | SINGLE-SOURCE |
| armour — belt / battery | belt 229–102 (complete); battery 254–152 | mm | [NP] | SINGLE-SOURCE |
| coal / crew | 300 t / 232 | t / — | [NP] | SINGLE-SOURCE |

### 6.11 Brazil — _Sete de Setembro_ (_Independência_ class) casemate ironclad; _Javary_ class monitors

[NE] `industrial-era/the-imperial-brazilian-navy.php` (page states "Source: Conway's ... 1860-1905")

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| class / type | _Sete de Setembro_ / _Independência_ casemate ironclad (composite wood/iron hull) | — | [NE] | SINGLE-SOURCE |
| commissioned | **4.7.1874** | date | [NE] | SINGLE-SOURCE |
| displacement | 2,174 | t | [NE] | SINGLE-SOURCE |
| length / beam / draught | 73.4 / 14.2 / 3.81 | m | [NE] | SINGLE-SOURCE |
| machinery / power / speed | 2 shafts compound, 4 boilers; 2,000 ihp; 12 kn | — | [NE] | SINGLE-SOURCE |
| main armament | 4 × 1 **300-pdr Whitworth RML** in a central casemate (pivot) | mm × n | [NE] | SINGLE-SOURCE |
| secondary | 2-pdr + several Nordenfelt/Hotchkiss machine guns | — | [NE] | SINGLE-SOURCE |
| torpedo (as built) | none documented (Brazil bought 4 torpedo boats by 1879) | — | [NE] | SINGLE-SOURCE |
| armour — material | **wrought iron** | — | [NE] | SINGLE-SOURCE |
| armour — belt / casemate / deck | belt 114; casemate 114; deck 12.7 | mm | [NE] | SINGLE-SOURCE |
| crew | 185 | — | [NE] | SINGLE-SOURCE |
| other in service | _Javary_ class coast-defence turret ships (1874) — details truncated in source, UNVERIFIED | — | [NE] | UNVERIFIED |

---

## 7. Designer-ready summary

All rows are **in service by 1 Jan 1880** (see §5 for the excluded ships). `D` = depth (moulded) — **not
found for any ship (UNVERIFIED)**; L/B/T are as given by the source and labelled. Confidence is the weakest
input for that row. Values are the source figures; where a range is given the source itself gave a range.

| Ship                      | Nation | Type                              | Displ (t)      | L / B / T (m)              | Speed (kn) | Main armament                          | Mounts            | Belt (mm) | Deck (mm) | Coal (t) | Crew | Conf.        |
| ------------------------- | ------ | --------------------------------- | -------------- | -------------------------- | ---------- | -------------------------------------- | ----------------- | --------- | --------- | -------- | ---- | ------------ |
| HMS _Devastation_         | UK     | turret ironclad                   | 9,387          | 93.6 oa / 19.0 / 8.03      | 13.8       | 305 mm × 4 (12-in RML Mks II)          | 2 twin turrets    | 305–216   | 76–51     | 1,600    | 358  | SINGLE-SOURCE |
| HMS _Dreadnought_ (1875)  | UK     | turret ironclad                   | 10,886         | 104.6 oa / 19.5 / 8.08     | 14.5       | 318 mm × 4 (12.5-in RML Mk I)          | 2 twin turrets    | 356–203   | 76–64     | 1,800    | 369  | SINGLE-SOURCE |
| HMS _Alexandra_           | UK     | central-battery ironclad          | 9,492          | 104.9 oa / 19.5 / 8.00     | 15.1       | 279 mm × 2 + 254 mm × 10 (RML)         | broadside battery | 305–152   | 38–25     | 680      | 674  | SINGLE-SOURCE |
| HMS _Iris_                | UK     | steel dispatch vessel / cruiser   | 3,730          | 101.5 oa / 14.0 / 6.71     | 17.9       | 160 mm × 10 (64-pdr RML)               | broadside         | 0         | 0         | 780      | 275  | SINGLE-SOURCE |
| HMS _Lightning_           | UK     | 1st-class torpedo boat           | 28             | 25.6 oa / 3.1 / 1.60       | 18         | —                                      | 1 × 406 mm tube   | 0         | 0         | 3        | 15   | SINGLE-SOURCE |
| TB2 class                 | UK     | 1st-class torpedo boat           | 28             | 26.5 oa / 3.1 / 1.60       | 20         | —                                      | 1 × 406 mm tube   | 0         | 0         | 3        | 15   | SINGLE-SOURCE |
| _Redoutable_              | FR     | central-battery ironclad (steel hull) | 9,224      | 100.7 oa / 19.7 / 7.80     | 14.7       | 274 mm × 8                             | battery + upper deck | 350–220 | 60–45     | 620      | 705  | SINGLE-SOURCE |
| _Tempête_                 | FR     | breastwork monitor (coast defence) | 4,793         | 76.0 oa / 17.6 / 5.79      | 11.7       | 274 mm × 2                             | 1 twin turret     | 330–250   | 50        | 200      | 174  | SINGLE-SOURCE |
| _Torpilleur_ N°27         | FR     | torpedo boat                      | 43             | 31.8 wl / 3.30 / 0.90      | 18         | —                                      | 1 × 380 mm bow TT | 0         | 0         | n/a      | 12   | SINGLE-SOURCE |
| SMS _Kaiser_              | DE     | central-battery ironclad (steel armour) | 8,799    | 89.3 oa / 19.1 / 7.93      | 14.5       | 263 mm × 8 + 209 mm × 1                | broadside battery | 254–127   | 51        | 684      | 656  | SINGLE-SOURCE |
| SMS _Sachsen_             | DE     | central-citadel ironclad          | 7,677          | 98.2 oa / 18.4 / 6.53      | 13.5       | 263 mm × 6                             | 4 barbettes       | 254–203   | 75–50     | 700      | 317  | SINGLE-SOURCE |
| SMS _Ulan_                | DE     | torpedo steamship                 | 374            | 37 oa / 8.0 / 4.57         | 12         | 37 mm × 15                             | revolving         | 0         | 0         | 25       | 41   | SINGLE-SOURCE |
| _Principe Amedeo_         | IT     | central-battery ironclad          | 5,761          | 79.7 / 17.4 / 7.90         | 12.2       | 279 mm × 1 + 254 mm × 6                | 1 casemate        | 220       | n/a       | 580      | 548  | SINGLE-SOURCE |
| _Petr Velikiy_            | RU     | turret ship                       | 9,790          | 103.5 oa / 19.0 / 8.28     | 12.3       | 305 mm × 4 (obr.1867)                  | 2 twin turrets    | 356–292   | 76        | 1,200    | 440  | VERIFIED (displ); rest SINGLE-SOURCE |
| _Novgorod_                | RU     | circular coast-defence monitor    | 2,491          | 30.8 × 30.8 / 4.11         | 6–7        | 279 mm × 2 (obr.1867)                  | 1 barbette        | 229–178   | 70        | 160      | 149  | SINGLE-SOURCE |
| _General-Admiral_         | RU     | armoured cruiser/frigate          | 5,031          | 91.0 oa / 14.6 / 7.01      | 12.3       | 203 mm × 6 + 152 mm × 2                | broadside         | 152–127   | 25        | 1,000    | 490  | SINGLE-SOURCE |
| SMS _Kaiser Max_ class    | AH     | central-battery (casemate) ironclad | 3,548       | 75.9 oa / 15.3 / 6.15      | 13.3       | 209 mm × 8                             | broadside casemate | 205      | n/a       | 380      | 400  | SINGLE-SOURCE |
| TB III / IV               | AH     | 1st-class torpedo boat           | 27             | 26.4 / 3.30 / 1.50         | 17.5       | —                                      | 2 × 356 mm bow TT | 0         | 0         | n/a      | 10   | SINGLE-SOURCE |
| _Fusō_                    | JP     | central-battery ironclad          | 3,717          | 68.9 wl / 14.6 / 5.49      | 13         | 235 mm × 4 + 173 mm × 2                | broadside battery | 229–114   | n/a       | 360      | 250  | SINGLE-SOURCE |
| _Kongō_                   | JP     | armoured corvette                 | 2,248          | 70.5 wl / 12.5 / 5.49      | 13.7       | 173 mm × 3 + 149 mm × 6                | broadside         | 114–76    | n/a       | 280      | 314  | SINGLE-SOURCE |
| USS _Trenton_             | US     | screw frigate (unarmoured)        | 3,800          | 77.1 / 14.6 / 6.25         | 14         | 203 mm × 11 (8-in MLR) + 20-pdr × 2    | broadside         | 0         | 0         | n/a      | 477  | SINGLE-SOURCE (DANFS relay) |
| USS _Canonicus_           | US     | monitor (coast defence)           | 2,100          | 68.3 / 13.2 / 3.9          | 8          | 381 mm × 2 (15-in Dahlgren SB)         | 1 turret          | 127–76    | 38        | 145      | 100  | SINGLE-SOURCE |
| _Wei Yuen_                | Qing   | composite sloop                   | 1,258          | 66.2 oa / 8.99 / 3.81      | 11         | 160 mm × 1 + 121 mm × 6                | deck/shield       | 0 (shield 32–13) | 0  | n/a      | 180  | SINGLE-SOURCE |
| _Fei Ting_                | Qing   | iron flatiron gunboat             | 420            | 36.6 / 9.14 / 2.44         | 9.5        | 318 mm × 1 (38-ton RML)                | 1 (shield)        | 0 (shield 13) | 0     | n/a      | 30   | SINGLE-SOURCE |
| _Mesudiye_                | OT     | central-battery ironclad          | 8,938          | 102.4 / 17.9 / 7.90        | 13.7       | 254 mm × 12 + 178 mm × 3               | battery + upper deck | 305–152 | n/a     | 600      | 700  | SINGLE-SOURCE |
| _Avnillah_                | OT     | casemate ironclad                 | 2,362          | 71.9 oa / 11.0 / 5.00      | 12         | 203 mm × 4                             | casemate          | 152–127   | n/a       | 220      | 145  | SINGLE-SOURCE |
| _Numancia_                | ES     | broadside ironclad                | 7,189          | 96.1 oa / 17.4 / 8.22      | 10         | 254 mm × 2 + 160 mm × 8 (1880 fit)     | broadside         | 130       | n/a       | 1,100    | 500  | SINGLE-SOURCE |
| _Vitoria_                 | ES     | broadside ironclad                | 7,135          | 96.4 pp / 17.4 / 8.07      | 12         | 254 mm × 4 + 203 mm × 3 (1880 fit)     | broadside + redoubt | 130     | n/a       | 875      | 500  | SINGLE-SOURCE |
| _Puigcerdá_               | ES     | monitor                           | 552            | 39.0 / 9.00 / 2.50         | 8          | 160 mm × 1 + 121 mm × 2                | 1 turret          | 100       | n/a       | 23       | 59   | SINGLE-SOURCE |
| _Matador_                 | NL     | monitor                           | 1,968          | 63.9 / 14.5 / 3.20         | 7.5        | 283 mm × 2 (Krupp)                     | 1 twin turret     | 140–115   | 25        | 109      | 131  | SINGLE-SOURCE |
| _Schorpionen_             | NL     | turret ram                        | 2,140          | 62.5 / 11.9 / 4.82         | 13         | 229 mm × 2 (Armstrong)                 | 1 turret          | 152       | 25–19     | 246      | 136  | SINGLE-SOURCE |
| _Atjeh_                   | NL     | unprotected cruiser               | 3,425–3,669    | 91.8 / 12.5 / 6.40         | 13.5–14.8  | 173 mm × 6 + 120 mm × 8 (Krupp)        | broadside         | 0         | 0         | 440–580  | 277–306 | SINGLE-SOURCE |
| _Vasco da Gama_           | PT     | coast-defence casemate ironclad   | 2,384          | 61.0 pp / 14.2 / 5.79      | 10.3       | 263 mm × 2 + 149 mm × 1                | raised battery    | 229–102   | n/a       | 300      | 232  | SINGLE-SOURCE |
| _Sete de Setembro_        | BR     | casemate ironclad                 | 2,174          | 73.4 / 14.2 / 3.81         | 12         | 300-pdr Whitworth RML × 4              | casemate (pivot)  | 114       | 12.7      | n/a      | 185  | SINGLE-SOURCE |

### Derived-from-sources values (ESTIMATE — arithmetic only; not source figures)

| item | value | derivation |
| --- | --- | --- |
| _Devastation_ length (ft) | 307 oa (285 pp) | 93.6 m / 0.3048; 86.9 m / 0.3048 |
| _Dreadnought_ (1875) displacement long tons | 10,714 | 10,886 t / 1.016 |
| _Redoutable_ belt mm→in | 13.8 – 8.7 in | 350/25.4; 220/25.4 |
| _Sachsen_ beam (ft) | 60.4 | 18.4 / 0.3048 |
| _Canonicus_ speed (m/s) | 4.1 | 8 kn × 0.5144 |

---

## 8. Gaps, conflicts and deferred items

| item | status | what would settle it |
| --- | --- | --- |
| **Moulded depth**, all ships | UNVERIFIED (not found) | Admiralty "Particulars of Ships", Jane's 1898, Brassey ship tables (clean scan) |
| navypedia is a single compilation | SINGLE-SOURCE for nearly every row | Open Conway's _1860–1905_ national chapters; re-read each class page |
| _Mesudiye_ completion (12/1875 vs "1876-7") | SINGLE-SOURCE, internal conflict | Conway's Campbell chapter; Turkish naval archives |
| HMS _Alexandra_ torpedo fit — navypedia says 4 × 356 mm carriages; `p1-1880-torpedo-armament.md` found "no count" | **CONFLICT** | RN Navy List 1880; _The Naval Annual_ 1886 torpedo tables |
| _Petr Velikiy_ displacement 9,790 (navypedia) vs 9,340 (period annual) | VERIFIED range, basis differs | loading basis (normal vs deep) — author with basis label |
| US `Trenton` general characteristics block | unsourced on the lead page; no navypedia page | Conway's US chapter (Roberts); DANFS original page |
| Chinese ships before 1885 | navypedia has no Chinese ironclad; only sloops/flatirons retrieved | Conway's "China" chapter; _Beiyang Fleet_ monographs |
| Brazilian 1870s ironclads | only `Sete de Setembro`/`Independência` sourced; `Javary` class truncated | Conway's "Brazil" chapter |
| Torpedo bores 350/380/381/406 mm vs repo's 14-in (356 mm) | global model mismatch | author per-ship; see §4 |
| Cost figures | only UK/France (period annual, scrambled date column) | Brassey's _Naval Annual_ cost tables (clean scan); Admiralty Estimates |
| Ships the brief named but unfinished (Inflexible, Amiral Duperré, Italia/Dandolo, Tegetthoff, Dingyuan, Amphitrite, Riachuelo, Aquidabã) | excluded — recorded in §5 | author as `isUnderConstruction` / design templates, not starting assets |

**No `docs/OPEN-ISSUES.md` decision was resolved here.** The only cross-note conflict raised (Alexandra's
torpedo count / the "Duilio in service Jan 1880" assumption in `content-1-fleets-and-ship-classes.md`) is
surfaced explicitly above and left for the orchestrator to decide whether it becomes a decision-request.

## Source list

1. navypedia.org class pages (all slugs cited inline per ship) — compilation built on Conway's _All the
   World's Fighting Ships 1860–1905_ and national histories.
2. T. A. Brassey (ed.), _The Naval Annual 1886_ (1st volume), archive.org id `navalannual1886`
   (full text `NavalAnnual1886_djvu.txt`, read directly) — period figures and cost tables.
3. naval-encyclopedia.com, "The Brazilian Imperial Navy" and "US Old Navy (1865-85)" (read directly).
4. US Navy, _Dictionary of American Naval Fighting Ships_, "Trenton i" — relayed, not opened.
