# Ship-building: sourcing the remaining content placeholders (ticket 30, ticket 22)

Research note for `.scratch/ship-building/issues/30-sourced-content-values.md` and the open item of ticket 22. Research only:
no content, code or ticket was edited. Researched 2026-10-09 from archive.org OCR full texts (`_djvu.txt`), checked against
page images where the OCR of a table was unreadable (`https://archive.org/download/<id>/page/n<leaf>_w1200.jpg`). Page
numbers are the printed running headers.

Status key: **VERIFIED** = value read in a primary or contemporary source; **SECONDARY** = compilation (navweaps, Wikipedia)
or a value derived by arithmetic from read figures; **ESTIMATE** = reasoned, no source.

## Sources

| Key    | Source                                                                                                                               | archive.org id                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [B86]  | T. A. Brassey (ed.), _The Naval Annual 1886_                                                                                         | `navalannual1886`                                                      |
| [B89]  | _The Naval Annual 1888-9_                                                                                                            | `navalannual1888-1889`                                                 |
| [B91]  | _The Naval Annual 1891_                                                                                                              | `navalannual1891`                                                      |
| [B92]  | _The Naval Annual 1892_                                                                                                              | `navalannual1892`                                                      |
| [B94]  | _The Naval Annual 1894_                                                                                                              | `CASGA_120401`                                                         |
| [B96]  | _The Naval Annual 1896_                                                                                                              | `CASGA_120403`                                                         |
| [B98]  | _The Naval Annual 1898_                                                                                                              | `CASGA_120405`                                                         |
| [B01]  | _Brassey's Naval Annual 1901_                                                                                                        | `brassey-s-naval-annual-1901`                                          |
| [B02]  | _The Naval Annual 1902_                                                                                                              | `brasseysnavala1902brasuoft`                                           |
| [B03]  | _The Naval Annual 1903_                                                                                                              | `CASGA_120409` (pp. 356-357 read from the page images, leaves 495-496) |
| [B04]  | _The Naval Annual 1904_                                                                                                              | `CASGA_120410`                                                         |
| [W]    | W. H. White, _A Manual of Naval Architecture_ (1894 ed.)                                                                             | `manualofnavalarc00whitrich`                                           |
| [TA02] | _Treatise on Ammunition_, 1902                                                                                                       | `TreatiseOnAmmunition1902`                                             |
| [NW]   | navweaps.com gun pages `WNBR_12-25_mk1`, `WNBR_135-30_mk1`, `WNBR_12-35_mk8`, `WNBR_6-40_mk1`, `WNBR_47-40_mk1` (fetched 2026-10-09) | compilation                                                            |

## 1. Gun mount deck footprint and internal volume

### 1.1 Barbette and turret diameters read

| Mount (ship)                                  | Guns                 | Dimension                                                                                                                                                                     | Source                | Status                                                                                               |
| --------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| Benbow (Admiral class)                        | 2 x 16.25-in (110 t) | each barbette covers "about 45 ft. in width by 60 ft. in length" on the upper deck, pear-shaped "to allow room for loading"; ammunition trunk 10 ft diameter                  | [B86] p. 169          | VERIFIED                                                                                             |
| Howe (Admiral class)                          | 2 x 13.5-in          | barbettes pear-shaped; parapet about 20 ft above the waterline and 10 ft above the weather deck; ammunition by armoured trunks                                                | [B91] p. 127          | VERIFIED (no plan size)                                                                              |
| Royal Sovereign                               | 2 x 13.5-in          | pear-shaped, greater diameter 38 ft 2 in, small end radius 6 ft, extreme length 54 ft 1 in; armour 17 in (sides), 11 and 16 in (small end); **650 t** of barbette armour each | [B92] p. 91           | VERIFIED                                                                                             |
| Royal Sovereign                               | 2 x 13.5-in          | barbette "39 to 54" ft as viewed from the enemy                                                                                                                               | [B03] p. 356 table    | VERIFIED (agrees with [B92])                                                                         |
| Majestic                                      | 2 x 12-in (Mk VIII)  | barbette 37½ ft; turret (gunhouse) 40 ft broadside-on or 23 ft end-on                                                                                                         | [B03] p. 356 table    | VERIFIED                                                                                             |
| Formidable / King Edward VII                  | 2 x 12-in            | barbette 37½ / 37 ft; turret 23 ft end-on                                                                                                                                     | [B03] p. 356          | VERIFIED (later ships; confirm the 12-in twin standard)                                              |
| "Standard British size for our latest design" | 2 x 12-in            | 37½ ft; foreign twin barbettes 11 to 27 ft, so "the British barbette is from 45 to 80 per cent. heavier for a given thickness"                                                | [B03] p. 357          | VERIFIED                                                                                             |
| Cressy class (9.2-in)                         | 1 x 9.2-in           | "the turret is 16 ft., the barbette 19 ft., and the lower portion ... a tube only 3½ ft. in diameter"; "the smallest of all British barbettes"                                | [B03] p. 357          | VERIFIED (9.2-in/46 Mk X era; the OCR misreads 16 as 10 and 3½ as 31, corrected from the page image) |
| Libertad / Constitucion (Swiftsure)           | 2 x 10-in            | barbette 22½ ft                                                                                                                                                               | [B03] p. 357          | VERIFIED (1903 private-yard design, 10-in/45; more compact than 1890s RN practice)                   |
| 12-in Mk VIII BII mounting (Majestic)         | 2 x 12-in            | revolving weight 184 tons; BII barbette pear-shaped with external rammer; BIII (Caesar, Illustrious) circular                                                                 | [NW] `WNBR_12-35_mk8` | SECONDARY. Cross-check: content mass (46.7 + 32) x 2 + 20 = 177 t, consistent                        |
| Collingwood                                   | 2 x 12-in/25         | open pear barbettes (photo caption); no dimensions                                                                                                                            | [NW] `WNBR_12-25_mk1` | not found                                                                                            |

### 1.2 Plan area (derived)

Plan area of a circle is pi/4 x D². The pear shape is taken as the convex hull of a 38 ft 2 in circle and a 6 ft-radius
small end whose far edge is 54 ft 1 in from the near edge: **133.0 m²**. As bounds, a circle of the greater diameter gives
106.3 m² and the 38 x 54 ft ellipse gives 150.6 m².

| Mount                                                          | Plan area per mount | Per barrel  | Status                                                                                                    |
| -------------------------------------------------------------- | ------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| 13.5-in twin (Royal Sovereign pear)                            | 133.0 m²            | **66.5 m²** | SECONDARY (derived from [B92] p. 91)                                                                      |
| 12-in twin (Majestic, 37½ ft)                                  | 102.6 m²            | **51.3 m²** | SECONDARY (derived from [B03] p. 356; a lower bound for the pear-shaped BII, exact for the circular BIII) |
| 10-in twin (22½ ft)                                            | 36.9 m²             | **18.5 m²** | SECONDARY (derived from [B03] p. 357; a 1903 design, so it probably understates an 1885 10-in/32 mount)   |
| 9.2-in single (19 ft barbette)                                 | 26.3 m²             | **26.3 m²** | SECONDARY (derived from [B03] p. 357; 1900s design)                                                       |
| Benbow 16.25-in twin (45 x 60 ft pear, 6 ft small end assumed) | about 174 m²        | about 87 m² | ESTIMATE (small-end radius not printed); calibre outside the catalogue                                    |

Scaling observation: British twin-barbette plan area grows from about 37 m² (10-in) to 103 m² (12-in) to 133 m² (13.5-in)
and 174 m² (16.25-in). The pear-shaped, end-on-loading mounts (Admiral, Royal Sovereign, Majestic BII) are 30-40 % larger
than circular ones of the same calibre ([B03] pp. 356-357).

### 1.3 Barbette depth and internal volume

No source prints a barbette height or working-chamber volume. The height of the Royal Sovereign's barbette armour can be
derived: 650 t of armour ([B92] p. 91) over the pear perimeter (142.8 ft) at 40 lb per sq ft per inch of plate, with a mean
thickness of 14-17 in, gives **4.6-5.5 m** of armour height. Howe's parapet is 10 ft (3.0 m) above the weather deck ([B91]
p. 127), so roughly 1.5-2.5 m of the barbette is inside the hull above the protective deck, plus the ammunition trunk (10 ft
diameter, [B86] p. 169) down to the magazines.

Taking **5.0 m** (ESTIMATE, derived) as the depth of hull volume each mount uses:

| Mount         | Area/barrel x 5.0 m | Content today (3 L/kg heuristic) |
| ------------- | ------------------- | -------------------------------- |
| 13.5-in       | 332 m³              | 339 m³                           |
| 12-in Mk VIII | 256 m³              | 236 m³                           |
| 10-in         | 92 m³               | 150 m³                           |
| 9.2-in        | 132 m³              | 112 m³                           |

The derived figures land within about 10 % of the existing heuristic for the 13.5-in, 12-in and 9.2-in, and 40 % lower for
the 10-in. The depth is an estimate, so volume can be labelled at best "SECONDARY area x ESTIMATE depth".

### 1.4 Light and medium guns

| Item                                                                                           | Value                                                                                    | Source                | Status                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QF 4.7-in single mount weight                                                                  | "about 8 tons" (Trafalgar BDI, Barfleur BDII, cruiser UDI/GII; casemate and open mounts) | [NW] `WNBR_47-40_mk1` | SECONDARY. **Conflict**: content uses 1.2 t per barrel + 0.6 t fixed (1.8 t). The navweaps figure may include shield or casemate fittings; not resolved |
| QF 6-in/40 mount weight                                                                        | N/A on navweaps (content 7.6 t from research note 2)                                     | [NW]                  | —                                                                                                                                                       |
| Gun lengths (for a swept-circle estimate)                                                      | 6-in/40 6.331 m overall; 4.7-in 4.930 m                                                  | [NW]                  | SECONDARY                                                                                                                                               |
| Casemate, shield or pedestal deck area (6-in, 4.7-in, 12-pdr, 6-pdr, 3-pdr, Nordenfelt, Maxim) | not found in any volume read                                                             | —                     | unsourced                                                                                                                                               |

## 2. Magazines, shell rooms and general equipment

### 2.1 Rounds per gun and stowage

| Item                            | Value                                                                                                                                                                                      | Source                 | Status                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------- |
| 12-in/25 stowage                | Collingwood 85 rounds per gun                                                                                                                                                              | [NW] `WNBR_12-25_mk1`  | SECONDARY                                                                                      |
| 13.5-in/30 stowage              | 80 rounds per gun; outfit approved 30 June 1891: 20 AP, 12 Palliser, 39 common, 10 shrapnel (81)                                                                                           | [NW] `WNBR_135-30_mk1` | SECONDARY                                                                                      |
| 12-in/35 Mk VIII stowage        | 80 rounds per gun; 24 ready rounds in the working chamber (BIII), 3 per gun in the gunhouse; 16 ready-use rounds in each Majestic gun shield                                               | [NW] `WNBR_12-35_mk8`  | SECONDARY                                                                                      |
| Rectangular powder cases, naval | "D" 24 x 32 x 13 in (163.6 L) takes BL 10-in 63-lb Prism brown and 13.5-in cordite cartridges; "G" 36½ x 24½ x 13½ in (197.9 L) takes BL 13.5-in 93¾-lb and 46-lb 14-oz cordite cartridges | [TA02] pp. 77-78       | VERIFIED dimensions; **cartridges per case not stated**, so no volume per round can be derived |
| Metal-lined powder case Mk IV   | whole 17 x 17 x 20½ in, half 13½ x 13½ x 16½ in, quarter 10¾ x 10¾ x 14 in; the whole size takes BL cartridges "up to 6-inch inclusive"                                                    | [TA02] p. 74           | VERIFIED dimensions; cartridges per case not stated                                            |

Magazine capacities, magazine structural masses and the 0.5 mL per gram round-volume rule remain unsourced. The rounds per
gun above can size a heavy magazine (for example 2 twin 12-in mounts x 80 rounds), but the stowage volume per round cannot
be read from the sources found.

### 2.2 Weight-accounting finding (affects all general-equipment components)

White ([W] pp. 409-410) defines "weight of hull" as structure **plus** "fittings in magazines, shell-rooms, store-rooms,
cabins, crews' quarters, etc.; and arrangements for pumping, drainage, ventilation, electric lighting, working the cables,
hoisting the boats". His first-class battleship is 18 % structure + 20 % accessories and fittings = 38 %; his swift
protected cruiser is 20.5 % + 17.5 % = 38 % (VERIFIED). `hullCoeffMilliKg` is fitted to the 38 % totals
(`ship-building-early-band.md` hull table), so the masses of `magazine_*`, `quarters_crew`, `pumps_damage_control`,
`ventilation_plant` and (partly) `dynamo_small` are **already inside the fitted hull weight**. Adding them again as
components double-counts them. This is a design decision for the orchestrator (ADR candidate). One option is to give these
components zero or near-zero extra mass and keep only their volume, crew and power effects, citing [W] pp. 409-410.

### 2.3 Electrical plant

| Item                                                                                     | Value                                                                                                                                             | Source                                                                    | Status                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Blake (1889)                                                                             | three Siemens dynamos driven by a Willans engine, 400 A each; engine rooms cooled by four 4 ft 6 in fans; forced draught by twelve 5 ft 6 in fans | [B92] p. 107 (research note 2 cites "p. ~113"; the running header is 107) | VERIFIED; voltage, kW and mass not printed                 |
| Royal Naval Exhibition 1891, Siemens plant "of a character suitable for use in the Navy" | dynamos of 180, 24 and 48 kW driven by engines of 300, 80 and 60 ihp                                                                              | [B92] p. 125                                                              | VERIFIED (ratio 0.6 kW per ihp for the large set; no mass) |
| Dynamo set mass, quarters per man, funnel mass, pump and ventilation masses              | not found                                                                                                                                         | —                                                                         | unsourced                                                  |

## 3. Machinery in-service years, weights and consumption

### 3.1 Years

| Plant (content year)                             | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Status                                                                                                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Triple expansion (1885)                          | Torpedo gunboats of the 1885-86 programme (200 x 23 ft, 450 t, two dockyard-built and one by Laird): "the engines are two sets of triple expansion of the vertical type, and the boilers are four in number, of the locomotive type", 2,700 ihp ([B86] p. 80). Victoria's engines were "by far the largest triple-expansion engines yet supplied to the Navy" ([B89] p. 56), so smaller sets came earlier. White's machinery table starts the triple-expansion row at 1885 ([W] p. 562) | VERIFIED: in RN specification by early 1886 and in White's 1885 row. **Keep 1885-01.** The first-ship completion date was not read                                                     |
| Locomotive boiler, TB single-boiler plant (1890) | White's row "single large locomotive boiler" (torpedo boats, 180-200 psi, **70-80 lb per ihp**) is dated **1890-1893** ([W] p. 562). Locomotive boilers themselves are older: "almost exclusively used [in small swift vessels] for ten years past" ([W] p. 554, written 1894); Polyphemus was originally fitted with them ([W] p. 553); the 1885-86 torpedo gunboats had them ([B86] p. 80)                                                                                            | VERIFIED for the plant as parameterised (46 kg/kW = the 1890-93 row). **Keep 1890-01.** An earlier, heavier loco plant (groups, 150-180 lb/ihp, [W] p. 562) would date from about 1884 |
| Water-tube (1893)                                | "The Speedy is the first ship in the Navy fitted with a group of water-tube boilers. They are of the Thornycroft type ... over 4700 indicated horse-power, the contract being 4500" ([B94] p. 426). Speedy trials in 1893 ([W] p. 555); Speedy built at Chiswick, about 25 % more power than her sisters with shell boilers ([B96] p. 118)                                                                                                                                              | VERIFIED. **Keep 1893-01**                                                                                                                                                             |
| Compound (1880)                                  | White's table rows 1870-1880 and 1880-1885 compound ([W] p. 562)                                                                                                                                                                                                                                                                                                                                                                                                                        | VERIFIED                                                                                                                                                                               |

### 3.2 Weights per power

1 ihp = 0.7457 kW; 1 long ton = 1,016 kg; 1 lb/ihp = 0.6083 kg/kW.

| Plant                                                | Figure                                                                                                                                                                                                                                                                   | kg/kW                   | Source          | Status                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Triple expansion, cylindrical (natural draught)      | 260-300 lb/ihp (1885-1892)                                                                                                                                                                                                                                               | 158-182                 | [W] p. 562      | VERIFIED (content 170)                                                                                                                     |
| Locomotive, groups                                   | 150-180 lb/ihp (1890-1893)                                                                                                                                                                                                                                               | 91-110                  | [W] p. 562      | VERIFIED                                                                                                                                   |
| Locomotive, single large boiler (TB, forced draught) | 70-80 lb/ihp (1890-1893)                                                                                                                                                                                                                                                 | 43-49                   | [W] p. 562      | VERIFIED (content 46)                                                                                                                      |
| **Water-tube (Belleville), cruiser: Highflyer**      | main and auxiliary machinery 373.8 t + boilers 461.5 t = 835.3 long t for 10,000 ihp                                                                                                                                                                                     | **114**                 | [B01] p. 128    | SECONDARY (arithmetic on primary figures)                                                                                                  |
| Cylindrical sister: Minerva                          | 380.1 t + 557.8 t = 937.9 long t for 9,600 ihp; Highflyer lighter by 102.6 t                                                                                                                                                                                             | 133                     | [B01] p. 128    | SECONDARY (arithmetic). Minerva's 9,600 is her printed power; on a natural-draught basis her figure would be higher, consistent with White |
| Water-tube boilers only (Thornycroft)                | single boiler claimed 68 ihp per ton (boilers, water, boiler-room fittings); Geiser group 3,157 ihp for 108 t of boiler room (about 30 ihp/t, 45 max); Speedy 28 ihp/t at 0.6 in air pressure (8 h), 43 ihp/t at 1.7 in (3 h), more than 30 % over the locomotive sister | boiler room only: 32-49 | [W] pp. 555-556 | VERIFIED (boiler room only, not the whole plant)                                                                                           |
| Machinery per ihp, assorted RN ships                 | Inflexible 430 lb, Howe 220, Victoria 170, Medusa 161, gunboat Sandfly 82½, first-class TB engines about 60                                                                                                                                                              | —                       | [B91] p. 113    | VERIFIED                                                                                                                                   |
| Naiad (Apollo class)                                 | about 650 t including water, about 165 lb/ihp (forced-draught power)                                                                                                                                                                                                     | 100                     | [B92] p. 112    | VERIFIED                                                                                                                                   |

Content's 80 kg/kW for `triple_expansion_watertube` is lighter than the only complete water-tube warship plant found
(Highflyer, 114 kg/kW). A torpedo-gunboat-scale plant (Speedy) would be lighter, but no complete Speedy machinery weight was
found.

### 3.3 Coal consumption, water-tube versus cylindrical (Highflyer / Minerva trials)

1 lb/ihp-h = 608.3 g/kWh.

| Condition                         | Highflyer (Belleville)                                  | Minerva (cylindrical) | Source            |
| --------------------------------- | ------------------------------------------------------- | --------------------- | ----------------- |
| About 10 kn, first trials         | 3.46 lb/ihp-h (2,105 g/kWh); excess over Minerva 16.5 % | 2.88 (1,752)          | [B01] pp. 129-130 |
| About 10 kn after stoker training | 3.16 (1,922); excess 6.7 %                              | 2.88                  | [B01] p. 130      |
| Best figure                       | 2.36 at 9,132 ihp (1,436)                               | 2.11 (1,284)          | [B01] p. 130      |

"Even at her best the Highflyer was beaten by the Minerva in regard to fuel consumption" ([B01] p. 130; VERIFIED). The
content sets water-tube SFC (1,200 g/kWh at 60 %) **below** triple-expansion cylindrical (1,220). The trials show it about
7-12 % **above**. Volume per kW, the part-load curve shape and reliability were not found for any plant.

## 4. Ticket 22: Hermes / Highflyer displacement and the Kent class

| Item                             | Value                                                                                                                                                      | Source                                 | Status                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hermes / Highflyer displacement  | "Three new second-class cruisers of **5600 tons** have been laid down, the Hyacinth at the London and Glasgow yard, the Hermes and Highflyer at Fairfield" | [B98] p. 12 (leaf 28)                  | **VERIFIED**. The 5,600 t point can become VERIFIED                                                                                                                  |
| Hermes / Highflyer commissioning | Hermes Oct 1899 (North America and West Indies); Highflyer 7 Dec 1899 (East Indies flagship)                                                               | [B01] pp. 24-25                        | VERIFIED (already in the build-time note)                                                                                                                            |
| Kent laid down                   | Portsmouth, 12 Feb 1900; launched 6 Mar 1901                                                                                                               | [B01] p. 21 (and the table on p. 23)   | VERIFIED                                                                                                                                                             |
| Kent class status                | "The Bedford, Berwick, Donegal, Monmouth, and Kent are in commission" (Kent class, 9,800 t)                                                                | [B04] p. 4 (leaf 20)                   | VERIFIED: commissioned before early 1904, so at most about 48 months from Kent's keel                                                                                |
| Kent / Bedford forecast          | expected to pass into the Fleet Reserve "during 1902-1903"; Monmouth "in 1903-1904"                                                                        | [B02] p. 396 (First Lord's memorandum) | VERIFIED as a forecast only; [B03] (statement in the documents section, page not recorded) reports Bedford and Kent tried but short of speed, needing new propellers |
| Kent commissioning date          | not printed in the volumes read (1 Oct 1903 is the commonly cited date, about 43½ months)                                                                  | —                                      | unsourced in primary; SECONDARY if Wikipedia is accepted                                                                                                             |

The Kent class is not usable as a VERIFIED table point (no month-exact completion). It does bound 9,800 t at 40-48 months
for 1900 keels, slower than the 30-month cruiser points: the class was delayed by its propellers.

## 5. Yard throughput

All weights are in long tons. A Duncan-class battleship is 14,000 t ([B01] p. 19 table).

| Ship (yard)                               | Keel         | Event                                             | Weight built                                                             | Rate              | Source          | Status                                                                                                                             |
| ----------------------------------------- | ------------ | ------------------------------------------------- | ------------------------------------------------------------------------ | ----------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Russell (Palmer, Jarrow)                  | 11 Mar 1899  | launched 19 Feb 1901 (23.3 months)                | launch weight 5,950 t                                                    | 255 t/month       | [B01] pp. 18-19 | VERIFIED inputs                                                                                                                    |
| Albemarle (Chatham Dockyard)              | 1 Jan 1900   | launched 5 Mar 1901 (14.1 months)                 | launch weight 5,100 t                                                    | 362 t/month       | [B01] pp. 18-19 | VERIFIED inputs                                                                                                                    |
| Montagu (Devonport Dockyard)              | 23 Nov 1899  | launched 5 Mar 1901 (15.4 months)                 | launch weight 4,987 t                                                    | 324 t/month       | [B01] pp. 18-19 | VERIFIED inputs                                                                                                                    |
| Exmouth (Laird, Birkenhead)               | 10 Aug 1899  | about Apr 1901 (about 20 months), not yet floated | "nearly 5000 tons of material worked into her hull, exclusive of armour" | about 250 t/month | [B01] pp. 18-19 | VERIFIED inputs; the month of writing is inferred (after the Duncan launch of 21 Mar, before the Cornwallis launch of 18 Jun 1901) |
| Majestic class (Portsmouth/Chatham, 1893) | Nov/Dec 1893 | first week                                        | 250 t "it is said"                                                       | burst rate only   | [B94] p. 11     | VERIFIED (hearsay in source)                                                                                                       |
| US cruiser Raleigh (Norfolk Navy Yard)    | —            | Jul-Oct 1892                                      | 219 t                                                                    | 73 t/month        | [B92] p. 458    | VERIFIED (foreign, slow yard)                                                                                                      |

Calibration (derived): with `construction.hullWorkPerTonneMicro` 40,000 work per tonne of hull, a slip building
**250-360 t of hull per month** delivers 10.0M-14.6M work per month on the hull. If the large yard (`maxDisplacementKg`
30,000 t) is to reproduce that rate, then `yardWorkPerTonneMonth` = 10.0M-14.6M / 30,000 = **335-485** (midpoint about 400,
i.e. 300 t/month). If it is instead meant to match a battleship-sized slip (about 15,000 t), the figure is 670-970, which
brackets today's 700. Today's 700 on the 30,000 t yard is 21M per month, about 525 t of hull per month, 1.5-2x the observed
rate. The answer depends on whether `maxDisplacement` (itself an ESTIMATE) is the slip's ship size or a yard total. That is
a design choice for the orchestrator. Ticket 20's constraint (a Majestic must finish inside `maxMonths`) must be re-checked
with any lower value.

## Proposed content changes

| File / key                                                           | Old                                                           | Proposed                                                                                                                                     | Status                                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| components `gun_bl_135in_30.deckFootprintMm2`                        | `"53157000 * barrels"`                                        | `"66490000 * barrels"`                                                                                                                       | SECONDARY (Royal Sovereign pear 38 ft 2 in x 54 ft 1 in, [B92] p. 91; area derived)     |
| components `gun_bl_12in_35.deckFootprintMm2`                         | `"36989000 * barrels"`                                        | `"51300000 * barrels"`                                                                                                                       | SECONDARY (Majestic barbette 37½ ft, [B03] p. 356; circle)                              |
| components `gun_bl_10in_32.deckFootprintMm2`                         | `"23500000 * barrels"`                                        | `"18470000 * barrels"` (or keep 23.5M as a 1880s-era allowance)                                                                              | SECONDARY (22½ ft twin 10-in barbette, [B03] p. 357; a 1903 design)                     |
| components `gun_bl_92in_315.deckFootprintMm2`                        | `"17578000 * barrels"`                                        | `"26340000 * barrels"`                                                                                                                       | SECONDARY (Cressy 9.2-in barbette 19 ft, [B03] p. 357; 1900s design)                    |
| components `gun_bl_135in_30.volumeLitre`                             | `"339300 * barrels"`                                          | `"332500 * barrels"`                                                                                                                         | SECONDARY area x ESTIMATE 5.0 m depth (depth derived from 650 t of armour, [B92] p. 91) |
| components `gun_bl_12in_35.volumeLitre`                              | `"236100 * barrels"`                                          | `"256500 * barrels"`                                                                                                                         | SECONDARY area x ESTIMATE depth                                                         |
| components `gun_bl_10in_32.volumeLitre`                              | `"150000 * barrels"`                                          | `"92350 * barrels"`                                                                                                                          | SECONDARY area x ESTIMATE depth                                                         |
| components `gun_bl_92in_315.volumeLitre`                             | `"112200 * barrels"`                                          | `"131700 * barrels"`                                                                                                                         | SECONDARY area x ESTIMATE depth                                                         |
| components `gun_bl_12in_25` footprint / volume                       | 35,015,000 mm² / 223,500 L per barrel                         | no change; analogy with the Royal Sovereign pear (66.5 m², 332 m³) or Majestic (51.3 m², 256 m³) possible                                    | ESTIMATE (Collingwood barbette dimensions not found)                                    |
| components `gun_qf_47in` mount mass                                  | 1,200 kg/barrel + 600 kg                                      | flag the conflict with navweaps "about 8 tons"; no change proposed                                                                           | SECONDARY conflict, unresolved                                                          |
| components magazine / dynamo / quarters / pumps / ventilation masses | 2,000-20,000 kg etc.                                          | decide on the double count (section 2.2); if accepted, cite [W] pp. 409-410 and carry mass in the hull                                       | VERIFIED definition; decision needed                                                    |
| plants `triple_expansion_watertube.weightMilliKgPerKw`               | 80000 (ESTIMATE)                                              | **114000**                                                                                                                                   | SECONDARY (Highflyer 835.3 t / 10,000 ihp, [B01] p. 128)                                |
| plants `triple_expansion_watertube.sfcGramPerKwh`                    | 1524/1332/1200/1278                                           | about 1.10 x the triple-expansion cylindrical curve: 1704/1489/1342/1429                                                                     | SECONDARY (Highflyer/Minerva ratio 1.07-1.12, [B01] pp. 129-130)                        |
| plants header years                                                  | TE 1885 "first RN fit 1882-86 UNVERIFIED"; loco 1890; WT 1893 | keep all four years; replace the UNVERIFIED text with [B86] p. 80, [B89] p. 56, [W] pp. 554 and 562, [B94] p. 426                            | VERIFIED                                                                                |
| plants `locomotive_boiler_tb.weightMilliKgPerKw`                     | 46000                                                         | keep (70-80 lb/ihp, [W] p. 562)                                                                                                              | VERIFIED                                                                                |
| balance `buildMonthsProvenance[1]` (5,600 t)                         | SECONDARY, "displacement is not in the volumes read"          | **VERIFIED**: "Brassey's Naval Annual 1898 p. 12 (5,600 t); 1901 p. 262 (about 2.5 years)"                                                   | VERIFIED                                                                                |
| balance `yardWorkPerTonneMonth`                                      | 700 (PLACEHOLDER)                                             | 400 if `maxDisplacement` is a yard total (30,000 t yard = 300 t of hull per month); 700 is defensible only if read per battleship-sized slip | SECONDARY (derived from [B01] pp. 18-19 launch weights)                                 |

## Still unsourced

- Deck footprint and volume of every light and medium mount: BL 6-in/26, QF 6-in/40, QF 4.7-in, 12-pdr, 6-pdr, 3-pdr,
  Nordenfelt, Maxim (no casemate, shield or pedestal dimensions in the volumes read).
- 12-in/25 (Collingwood) barbette dimensions.
- Barbette depth and working-chamber volume (only derived from the armour weight; no printed figure).
- Magazine capacities and masses, stowage volume per round (powder-case sizes are known, cartridges per case are not), and
  the 0.5 mL/g round-volume rule.
- Masses and volumes of dynamo sets, crew quarters per man, funnels, pumps and ventilation plant (but see the
  double-count finding in section 2.2).
- Torpedo tube volume and cost, and rangefinder mass.
- Volume per kW, part-load curve shape and reliability of all plants; locomotive-boiler SFC.
- Kent-class commissioning month in a primary source.
- Any figure for a whole yard's output (all throughput figures above are per slip).

## Marker accounting (for the ratchet in `packages/ship-design/test/placeholders.test.ts`)

- **components.yaml (34)**: 4 footprint markers (13.5-in, 12-in Mk VIII, 10-in, 9.2-in) can be replaced with SECONDARY
  values. 4 volume markers on the same guns can be replaced only if "SECONDARY area x ESTIMATE depth" is accepted. That
  leaves 26-30, unchanged for the 12-in/25, the 8 light guns, the 2 tubes, magazine, rangefinder, the general-equipment
  line and the header.
- **plants.yaml (1)**: the single marker (header line 2) also covers volume per kW, part-load shape and reliability, which
  are still unsourced, so it cannot be removed. The years and the water-tube weight/SFC inside it can be sourced.
- **balance.yaml (2)**: the yard-rate marker can go with a SECONDARY derived value. The header "EVERYTHING ELSE is a
  PLACEHOLDER" marker stays.
- **reference-designs.yaml (1)**: "Fittings and equipment weights" depends on the components and on the double-count
  decision. It stays until then.
