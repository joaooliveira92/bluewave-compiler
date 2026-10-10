# Research: National naval profiles — United Kingdom and France (1880–1899)

Factual grounding for the **NationNavalProfile** system and the two-nation vertical slice
(`docs/ships-nation-orientation.md`, `.scratch/` national-naval initiative; ADR-0088 line of work). This is a
**research-only** content-authoring pass: no code, no content YAML, no spec is authored here. It supplies the
figures, the national differentiators, the component-variant overlays and the opening reference designs the
orchestrator/spec may then author.

Read first, method and labels identical to: `docs/research/ship-building-early-band.md` and
`docs/research/ship-building-merchant-liner.md`. Companion notes used throughout:
`ship-building-early-band-2.md`, `ship-building-1880-pre-era-armament.md`, `ship-building-1880-ships-by-nation.md`,
`ship-building-build-times.md`, `ship-building-content-sourcing.md`. Captured 2026-10-10.

## 0. Question

What are the grounded figures and national differentiators needed to author a **date-banded NationNavalProfile
(1880–1899)** for the **United Kingdom** and **France**, plus ~10 national component variants each (overlaid on
the shared catalogue at `content/production/1880/ship-building/components.yaml`), and **six 1880 opening
reference designs** per nation (B, CA, CL, DD, KE, AMC), with procurement and naming policy?

This note answers that; it does **not** author the profile. The existing shipped content already carries a
partial draft (`content/production/1880/research.yaml` `fieldPriorities`; `content/production/1880/ship-building/`
components, plants, hull-forms, reference-designs).

## 1. Method, source grades and confidence labels

Every figure carries a named source and one of:

- **VERIFIED** — read directly in a period primary/near-primary text (full text fetched and read), or two independent sources agree.
- **SINGLE-SOURCE** — one source only, or a secondary compilation that itself cites print works (named in the row) which I could not open.
- **ESTIMATE** — derived by me from other cited figures (calculation shown) or an inferred range; not itself a source figure.
- **UNVERIFIED** — no usable source found, or sources conflict; a plausible range is given instead.

**Wikipedia is not cited as a source anywhere.** Where a Wikipedia article was used only as a lead to the print
work it cites, the print work is named and the row is at most SINGLE-SOURCE.

Source grades used:

| Tag    | Source                                                                                                                                                                                                 | Grade / reach                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| [W]    | W. H. White (DNC), _A Manual of Naval Architecture_, John Murray, 1894 — archive.org `manualofnavalarc00whitrich` (full OCR read).                                                                      | **Primary** (RN designer's own handbook).                                                                  |
| [B82]  | T. A. Brassey, _The British Navy, vol. II_, Longmans, 1882 — `britishnavyitss04brasgoog` (full text read). Contains the Woolwich/Armstrong/Krupp gun-cost table p. 95.                                    | **Primary** (contemporary).                                                                                |
| [B86]  | T. A. Brassey (ed.), _The Naval Annual 1886_ — `navalannual1886` (full text read). French Commission "Artillery in France and Abroad" (pp. 476–479); yard passages.                                    | **Primary annual.**                                                                                        |
| [B94]  | _The Naval Annual 1894_ — `CASGA_120401` (read via `ship-building-content-sourcing.md`).                                                                                                               | **Primary annual.**                                                                                        |
| [TB87] | G. Mackinlay, _Text Book of Gunnery, 1887_ (HMSO) — `1887-textbook-of-gunnery-second-edition` (full text read). Table XVI (British) / XVII (foreign).                                                   | **Primary service manual;** Table XVII OCR column-scrambled, rows flagged.                                 |
| [EB]   | _Encyclopaedia Britannica_, 11th ed. (1911), art. "Armour Plates" (Wikisource).                                                                                                                        | Near-primary (contemporary reference).                                                                     |
| [NW]   | navweaps.com (Tony DiGiulian) — compilation of primary tables; specific page ids given per row.                                                                                                        | Compilation (accepted per brief). **Fetched directly this session** (see §Sources).                        |
| [NP]   | navypedia.org class pages (Ivan Gogin), built principally on Conway's _All the World's Fighting Ships 1860–1905_ + national histories. **Fetched directly this session.**                               | Secondary compilation → SINGLE-SOURCE.                                                                     |
| [CW]   | Conway's _All the World's Fighting Ships 1860–1905_ (1979); R. A. Burt, _British Battleships 1889–1904_ (2013); H. Lyon, _The First Destroyers_ (1996); E. Gröner (1990); Parkes, _British Battleships_ (1957); Le Masson/Friedman/Campbell (via [NW] source lists). **Not opened** in this session. | Print secondary; SINGLE-SOURCE (relayed).                                                                  |
| [R07]  | A. Roksund, _The Jeune École: The Strategy of the Weak_ (Brill, 2007). **Not opened.**                                                                                                                 | Print secondary; SINGLE-SOURCE (relayed) for doctrine narrative.                                           |
| [J98]  | Jane's _Fighting Ships_ (1st ed., 1898) — **not opened**; build-time note reached it only via Wikipedia claims, discarded.                                                                             | Print secondary; lead only.                                                                                |

Limits: [CW], [R07], [J98] and the French _Marine française_ histories were not opened online in this session;
rows resting on them are SINGLE-SOURCE. navweaps and navypedia were read directly. Where a figure could not be
grounded, an explicit labelled ESTIMATE with the calculation is given rather than a point value.

Conversions used throughout: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 cwt = 112 lb =
50.80 kg; 1 fps = 0.3048 m/s; 1 yd = 0.9144 m; 1 kn = 0.5144 m/s; 1 ihp = 0.7457 kW.

---

# A. National naval profiles (1880–1899)

The two profiles are deliberately **contrasting**: Britain is a global battle-fleet power with a huge cruiser
and coaling-station obligation; France is a continental/Mediterranean power whose navy, under the *Jeune École*,
pushed torpedo craft and commerce-raiding armoured cruisers and treated the battle line as one instrument among
several. Figures below are tagged; preference weights are BALANCE TARGET unless a source is named.

## A.1 United Kingdom

### A.1.1 Strategic posture

| posture                        | justification (one line)                                                                                                                       | source | confidence |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| battle-fleet concentration     | Naval Defence Act 1889 formalised the "two-Power standard"; the RN kept the world's largest battle fleet of turret/barbette ironclads.          | [CW]/[PAR] relayed; [B94] | SINGLE-SOURCE |
| colonial presence (+ distant-water operations) | Worldwide stations (Channel, Mediterranean, N. America & W. Indies, China, East Indies, Australia, Cape, Pacific) required cruisers and coaling stations. | [B86] station returns; [W] | SINGLE-SOURCE |
| commerce defence               | Trade protection by a large protected-cruiser force was the stated RN cruiser rationale of the 1889 Act.                                        | [CW]/[PAR] relayed | SINGLE-SOURCE |

Recommended primary postures: **battle-fleet concentration + colonial presence** (with commerce defence as the
third, weaker preference).

### A.1.2 Industrial capability

| item                            | figure                                                                            | unit        | source                                   | confidence |
| ------------------------------- | --------------------------------------------------------------------------------- | ----------- | ---------------------------------------- | ---------- |
| Annual programme (1889 Act)     | 70 ships / ~£21.5M over 4½ years (8 Royal Sovereign BB, 9 Edgar CL, 2 Blake, 8 Apollo, 4 TGB, …) | ships / £ | [CW]/[PAR] relayed                       | SINGLE-SOURCE |
| Shipbuilding capacity           | the world's largest: state yards (Woolwich, Chatham, Portsmouth, Devonport, Pembroke) + private (Elswick/Armstrong, Vickers, Fairfield, Laird, Palmer, Thames Ironworks) | — | [B82] (gun/yard context); [CW] relayed | SINGLE-SOURCE |
| Yard throughput (per slip)      | 250–360 t of hull per month (large battleship slip, 1899–1901 Duncan class)       | t/month     | [B01] p. 18–19 (via `ship-building-content-sourcing.md`) | VERIFIED |
| Build-time modifier             | FASTER than the 1894–1900 standard (larger yards, deeper docks). Propose **0.90–0.95×** | ×           | ESTIMATE (from verified throughput)      | ESTIMATE / **BALANCE TARGET** |
| Cost modifier                   | baseline 1.00 (UK is the reference; Woolwich gun £10,000 per 80-ton, the cheapest of the three powers, [B82] p. 95). Propose **0.95–1.00×** | ×           | [B82] p. 95                              | VERIFIED cost; **BALANCE TARGET** multiplier |
| Max practical displacement      | ~10,000 t (1880) → ~12,000 t (1885) → ~15,000 t (1890)                            | t           | ESTIMATE from completed classes (Devastation 9,387 t 1873; Majestic 14,900 t 1895) | ESTIMATE |
| Dock-size progression (max ship) | 1880 ≈ 10,000 t; 1885 ≈ 12,000 t (Admiral class); 1890 ≈ 15,000 t (Royal Sovereign/Majestic required dock enlargement) | t | [CW]/[PAR] relayed; [B94] | SINGLE-SOURCE |
| Heavy-gun production            | Royal Gun Factory **Woolwich** (state, Fraser/coil); **Elswick** (Armstrong); **Vickers** (from 1888); Whitworth. Cost: Woolwich 80-ton £10,000, Armstrong 100-ton £16,000, Krupp 71-ton £22,000; steel 3 fr/kg (Armstrong) vs 5 fr/kg (Krupp) | — | [B82] p. 95 | VERIFIED |
| Armour-plate production         | Cammell, Brown (Atlas), Beardmore, Vickers, Thames; adopted **Harvey** (US, 1891) then **Krupp cemented** (1893) | — | [EB] "Armour Plates"; [B02] | SINGLE-SOURCE (two sources agree on KC/year order) |
| Machinery reliability           | high: triple-expansion cylindrical reliable (reliabilityBp 9000 in plants.yaml); coal ~2 lb/ihp/h | — | [W] p. 562 | VERIFIED |
| Construction-quality variability | low: hulls generally on/near designed displacement; minor speed shortfalls on trials | — | [W]; [CW]/[PAR] relayed | SINGLE-SOURCE |

### A.1.3 Gunnery doctrine

| field                         | UK position                                                                                  | source | confidence |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ------ | ---------- |
| preferred engagement distance | short-to-medium; the RN trained for decisive close action; long-range fire considered unreliable | [W] ch. XVII; [NW] "2,000 m" French note as contrast | SINGLE-SOURCE |
| main-gun emphasis             | strong big-gun emphasis (12-in, 13.5-in barbette/turret pairs)                                | [NW] WNBR_12-25_mk1, WNBR_135-30_mk1 | SINGLE-SOURCE |
| secondary-battery emphasis    | substantial but subordinated; 6-in/9.2-in secondary plus many 6-in QF from 1892               | [NW] WNBR_6-26_mk1, WNBR_6-40_mk1 | SINGLE-SOURCE |
| gun-quality priorities        | reliability and standardised range tables over raw MV (6"/45 Mk VII deliberately down-loaded)  | [NW] WNBR_6-45_mk7 | SINGLE-SOURCE |
| AP-vs-HE preference           | AP (Palliser, then CPC/APC) dominant; HE/lyddite adopted late (post-1895)                     | [TB87] Table XVI; [NW] | SINGLE-SOURCE |
| fire-control research priority | medium: Barr & Stroud rangefinder (1893) fitted, but centralised director fire is post-band   | [CW] relayed; components.yaml `rangefinder_optical` | SINGLE-SOURCE |
| rate-of-fire preference       | moderate; hand-worked BL ROF low (0.3–0.7/min), QF secondary 5–7/min                          | [NW] | SINGLE-SOURCE |

Balanced battleship; volume of medium guns but big-gun primacy.

### A.1.4 Protection doctrine

| field                         | UK position                                                                                                 | source | confidence |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| belt vs protected deck        | **belt + protective deck** (complete waterline belt on capital ships; deck protects cruisers)              | [NP] Devastation/Dreadnought; [W] p. 416 | SINGLE-SOURCE |
| armour coverage               | full-length belt on BBs; higher proportion of displacement to armour than France (White: BB 30 % incl. deck)  | [W] p. 416 | VERIFIED (fraction) |
| secondary-battery protection  | 6-in in casemates/shields from the 1890s; earlier secondaries often unarmoured                              | [NW] WNBR_6-45_mk7 casemate note | SINGLE-SOURCE |
| conning-tower                | large armoured CT (229–356 mm on ironclads)                                                                  | [NP] | SINGLE-SOURCE |
| stability margin              | moderate; high freeboard, GM typically ~1.2–1.8 m on BBs                                                     | ESTIMATE from hull data | ESTIMATE |
| survivability-vs-speed        | survivability first on BB, speed first on cruisers                                                           | [CW]/[PAR] relayed | SINGLE-SOURCE |

### A.1.5 Propulsion doctrine

| field                    | UK position                                                                                       | source | confidence |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ------ | ---------- |
| preferred speed margin   | conservative (BB ~16–18 kn; CL ~19–20 kn; TBD ~27–30 kn)                                          | [W] ch. XVII; [B8] | VERIFIED |
| machinery type           | **triple-expansion vertical, cylindrical boilers** as standard from 1885; water-tube from 1893    | [W] p. 562; [B94] p. 426 | VERIFIED |
| reliability tolerance    | low tolerance for defects (reliable plant required)                                               | [W] p. 563 | SINGLE-SOURCE |
| coal endurance           | high (foreign stations); BB ~4,500–7,000 nmi at 10 kn; CL ~10,000 nmi                             | [CW] relayed | SINGLE-SOURCE |
| forced-draught acceptance | accepted for TB/TGB; capital ships natural draught with modest forced-draught margin              | [W] p. 561 | VERIFIED |
| domestic vs imported     | machinery and armour **domestic**; some armour material imported/licensed (Harvey US, Krupp German patent) | [EB] | SINGLE-SOURCE |

### A.1.6 Torpedo doctrine

| field                            | UK position                                                                     | source | confidence |
| -------------------------------- | ------------------------------------------------------------------------------- | ------ | ---------- |
| torpedo priority                 | secondary to the gun; on cruisers and capital ships for close action           | [NP] Devastation/Dreadnought 2 × 356 mm | SINGLE-SOURCE |
| preferred tube count             | capital 2–4 tubes; cruisers 4; TBs 1–2                                           | [NP]; [B8] Havock | SINGLE-SOURCE |
| above-water vs submerged         | both: above-water trainable carriages early, submerged bow/stern tubes by 1880s | [NP]; components.yaml `tube_14in_*` | SINGLE-SOURCE |
| use on cruisers / capital ships  | yes, both                                                                            | [NP] | SINGLE-SOURCE |
| torpedo-boat procurement         | **high intensity** but not Jeune-École scale: numbered TBs + "27-knotter" destroyers from 1893 | [NP]; [CW] Lyon relayed | SINGLE-SOURCE |

### A.1.7 Global obligations

| field                        | UK position                                                                 | source | confidence |
| ---------------------------- | --------------------------------------------------------------------------- | ------ | ---------- |
| foreign-station tonnage      | very high — the largest station commitment of any navy                     | [B86] station returns; [R07] | SINGLE-SOURCE |
| endurance requirements       | high (5,000–10,000 nmi cruising radius)                                    | [W]; [CW] relayed | SINGLE-SOURCE |
| accommodation requirements   | STANDARD (not spartan) for station ships; officers' quarters on flag ships  | [W] ch. II; `reference-designs.yaml` | SINGLE-SOURCE |
| colonial-service capability  | high — shallow-draught gunboats, coaling stations, floating docks          | [B86] | SINGLE-SOURCE |
| number of overseas regions   | ~7–8 (Channel/Home, Mediterranean, N. America & W. Indies, S. America, Cape/W. Africa, E. Indies, China, Australia) | [B86] station returns | SINGLE-SOURCE |

### A.1.8 Risk tolerance

| field                         | UK position                                                            | source | confidence |
| ----------------------------- | ---------------------------------------------------------------------- | ------ | ---------- |
| unproven components           | low willingness on capital ships; trials on small craft first          | [W] pp. 554–556 (Speedy as first water-tube ship) | VERIFIED |
| minimum reliability           | high (fleet must steam to station)                                     | [W] p. 563 | SINGLE-SOURCE |
| acceptable stability margin   | moderate                                                               | ESTIMATE | ESTIMATE |
| overweight tolerance          | low (contract penalties; ships near design displacement)               | [CW]/[PAR] relayed | SINGLE-SOURCE |
| preferred tech maturity       | mature/proven                                                          | [W] | SINGLE-SOURCE |
| refit frequency               | moderate (mid-life re-arm/rebuild, e.g. Devastation 1879)              | [NP] | SINGLE-SOURCE |

### A.1.9 Research preferences (canonical fields)

Existing shipped draft: `research.yaml` UK = `MACHINERY: 4, GUNNERY: 2, HULL_CONSTRUCTION: 2`. Grounded
recommendation (priority 1–4):

| field              | priority | justification                                                                  | source | confidence |
| ------------------ | -------- | ------------------------------------------------------------------------------ | ------ | ---------- |
| MACHINERY          | 4        | RN drove triple expansion into service first and standardised it ([W] p. 562)  | [W]; research.yaml | VERIFIED |
| HULL_CONSTRUCTION  | 3        | all-steel hulls, subdivision, protective decks (Shannon first RN use, [NP])     | [NP]; [W] | SINGLE-SOURCE |
| GUNNERY            | 3        | big-gun and QF secondary development, Barr & Stroud FC                        | [NW]; [CW] | SINGLE-SOURCE |
| INFRASTRUCTURE     | 3        | global docks/coaling stations are a British strategic signature                | [B86] | SINGLE-SOURCE |
| DAMAGE_CONTROL     | 2        | watertight subdivision, pumps, ventilation                                    | [W] pp. 409–410 | VERIFIED (fractions) |
| FIRE_CONTROL       | 2        | rangefinders fitted 1893; director fire post-band                             | components.yaml | SINGLE-SOURCE |
| TORPEDOES          | 2        | present but secondary                                                          | [NP] | SINGLE-SOURCE |
| SHIP_DESIGN        | 2        | mature balanced designs                                                        | [CW] relayed | SINGLE-SOURCE |
| MINES_AND_ASW      | 1        | low priority in-band                                                           | — | UNVERIFIED |
| SUBMARINES         | 1        | no in-band submarine; first RN boats 1901                                      | [CW] relayed | SINGLE-SOURCE |

---

## A.2 France

### A.2.1 Strategic posture

| posture                 | justification (one line)                                                                                                                     | source | confidence |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| commerce raiding        | the *Jeune École* (Adm. Aube, 1880s) argued the guerre de course against British trade was France's best asymmetric strategy                | [R07] | SINGLE-SOURCE |
| torpedo warfare         | the same school made the torpedo boat and torpedo the primary offensive arm; large flotillas funded from the 1880s                            | [R07]; [NP] N°27 | SINGLE-SOURCE |
| coastal defence         | the two-sea (Channel/Atlantic + Mediterranean) problem kept a large coast-defence and torpedo force                                            | [R07]; [NP] Tempête | SINGLE-SOURCE |
| battle-fleet concentration (secondary) | France still built pre-dreadnoughts (Redoutable → Bouvet → Charlemagne), but the line was smaller relative to Britain's | [NP]; [CW] relayed | SINGLE-SOURCE |

Recommended primary postures: **commerce raiding + torpedo warfare**, with coastal defence co-equal and
battle-fleet concentration a weaker preference.

### A.2.2 Industrial capability

| item                            | figure                                                                                                              | unit       | source                          | confidence |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------- | ---------- |
| Shipbuilding base               | state arsenals (Brest, Toulon, Lorient, Rochefort, Cherbourg) + private (Schneider/**Creusot**, **St-Chamond**, Châtillon-Commentry, Normand, Penhoët/St-Nazaire) | — | [CW]/[NP] relayed | SINGLE-SOURCE |
| Annual programme (1880s)        | smaller and slower than Britain's: the 1870s/80s programmes produced ~10–12 capital ships per decade plus many torpedo boats | ships | [R07]; [NP] | SINGLE-SOURCE |
| Build-time modifier             | SLOWER/SAME as standard. Propose **1.00–1.10×**                                                                      | ×          | ESTIMATE from completion dates (below) | ESTIMATE / **BALANCE TARGET** |
| Cost modifier                   | higher per hull (small series, state yards). Propose **1.05–1.10×**; but French armour (Creusot) was world-leading | ×          | ESTIMATE; [EB] | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement      | ~9,000 t (1880) → ~10,500 t (1885) → ~12,000 t (1890)                                                                 | t          | ESTIMATE from completed classes (Redoutable 9,224 t 1878; Hoche 10,820 t 1890; Masséna 11,735 t 1898) | ESTIMATE |
| Dock-size progression (max ship)| 1880 ≈ 9,000 t; 1885 ≈ 10,500 t; 1890 ≈ 12,000 t                                                                     | t          | [NP] completion list | SINGLE-SOURCE |
| Heavy-gun production            | state **Ruelle** (principal naval gun factory), plus **Creusot/Schneider**, **St-Chamond**, Châtillon-Commentry; Canet and Hotchkiss were private designers (QF guns) | — | [CW]/[NP] relayed; [NW] | SINGLE-SOURCE |
| Armour-plate production         | **Creusot (Schneider)** introduced steel armour 1876 and was a world exporter; St-Chamond and Châtillon-Commentry also produced plate; France was slower to adopt Harvey/Krupp cemented but bought/licensed KC by the late 1890s | — | [EB] "Armour Plates" | SINGLE-SOURCE |
| Machinery reliability           | lower / more experimental: France adopted water-tube boilers for all classes early, with attendant defects; higher coal consumption | — | [W] pp. 554–556 (VERIFIED statement) | VERIFIED (statement); defect rates UNVERIFIED |
| Construction-quality variability| high: overweight and stability problems (Hoche's excessive superstructure; Brennus; tumblehome hulls)               | — | [CW]/[NP] relayed | SINGLE-SOURCE |

### A.2.3 Gunnery doctrine

| field                         | France position                                                                                                    | source | confidence |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------ | ---------- |
| preferred engagement distance | **2,000 m (2,100 yd)** — the French explicitly regarded this as the likely battle range                            | [NW] WNFR_76-45_m1887 | SINGLE-SOURCE |
| main-gun emphasis             | strong but often in **single** turrets/barbettes, with mixed calibres (e.g. Bouvet 2 × 305 + 2 × 274)              | [NW] WNFR_10-45_m1893, WNFR_12-40_m1893 | SINGLE-SOURCE |
| secondary-battery emphasis    | **heavy**: 164.7 mm (6.5-in) and 138.6 mm (5.46-in) batteries in numbers; French secondaries were larger-calibre than British | [NW] WNFR_65-45_m1893, WNFR_55-45_m1891 | SINGLE-SOURCE |
| gun-quality priorities        | high muzzle velocity and QF rate of fire; Canet/Hotchkiss QF patents exported worldwide                             | [NW] WNFR_26-50_m1888; WNRussian_29-50_m1891 | SINGLE-SOURCE |
| AP-vs-HE preference           | **Melinite HE/SAP** favoured (Mélinite burster standard); APC exists but HE volume is distinctive                   | [NW] WNFR_76-45_m1887, WNFR_65-45_m1893 | SINGLE-SOURCE |
| fire-control research priority| lower than gunnery/machinery; rangefinding later                                                                    | ESTIMATE | ESTIMATE |
| rate-of-fire preference       | faster: QF 65 mm 10/min, 138.6 mm 4/min, 164.7 mm 3/min, 19 cm 1/min                                                | [NW] | SINGLE-SOURCE |

### A.2.4 Protection doctrine

| field                         | France position                                                                                                     | source | confidence |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| belt vs protected deck        | **belt + heavy deck + citadel** on capital ships; cruisers often **thin complete belt** (armoured cruisers) and turtle-back decks | [NP] Redoutable, Tempête; [NW] WNFR_76-45_m1887 | SINGLE-SOURCE |
| armour coverage               | often a narrower/thinner belt but very thick over magazines and turrets; French armoured cruisers were lightly armoured relative to size | [NP]; [CW] relayed | SINGLE-SOURCE |
| secondary-battery protection  | mixed; turreted/casemate 164.7 mm on later ships, open mounts earlier                                                 | [NW] WNFR_65-45_m1893 | SINGLE-SOURCE |
| conning-tower                | fitted; moderate thickness                                                                                           | [NP] | SINGLE-SOURCE |
| stability margin              | **narrow** — French designs pushed high superstructure/freeboard and were criticised for instability (Hoche, Brennus) | [CW]/[NP] relayed | SINGLE-SOURCE |
| survivability-vs-speed        | speed/offensive power prioritised over protection on cruisers                                                        | [R07]; [CW] relayed | SINGLE-SOURCE |

### A.2.5 Propulsion doctrine

| field                    | France position                                                                                     | source | confidence |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ------ | ---------- |
| preferred speed margin   | moderate (BB ~14.5–18 kn; armoured cruiser ~19–21 kn; TB ~18–27 kn)                                  | [NP]; [W] | SINGLE-SOURCE |
| machinery type           | **water-tube boilers adopted early and widely** (Belleville, Niclausse, Normand, Lagrafel d'Allest) — White: the French Navy was "employing the type for all classes in construction" | [W] pp. 554–556 | VERIFIED (statement) |
| reliability tolerance    | **higher tolerance** for defects/trials; machinery faults accepted during service                    | [W]; [CW] relayed | SINGLE-SOURCE |
| coal endurance           | lower coal stowage than British equivalents (Redoutable 620 t vs Devastation 1,600 t)                 | [NP] | SINGLE-SOURCE |
| forced-draught acceptance| high (torpedo craft built around forced draught)                                                     | [W] p. 561 | VERIFIED |
| domestic vs imported     | machinery and guns **domestic**; armour domestic and exported (Creusot); some licence-building of Canet/Hotchkiss designs | [EB]; [NW] | SINGLE-SOURCE |

### A.2.6 Torpedo doctrine

| field                            | France position                                                                                         | source | confidence |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| torpedo priority                 | **primary offensive arm** under the Jeune École; large flotillas and torpedo armament on all classes    | [R07] | SINGLE-SOURCE |
| preferred tube count             | capital ships 2+; the torpedo boat was the weapon platform                                            | [NP] Redoutable 2 × 350 mm | SINGLE-SOURCE |
| above-water vs submerged         | both; large-bore bow tubes (380 mm) on torpedo boats, beam above-water on ironclads                     | [NP] N°27 380 mm bow; Redoutable 350 mm beam | SINGLE-SOURCE |
| use on cruisers / capital ships  | on both; French preference for torpedo armament on cruisers is a stated soft preference                  | [R07] | SINGLE-SOURCE |
| torpedo-boat procurement         | **very high intensity** — dozens of numbered "torpilleurs" and the 33-metre type; the defining French programme of the 1880s | [NP]; [R07] | SINGLE-SOURCE |

### A.2.7 Global obligations

| field                        | France position                                                              | source | confidence |
| ---------------------------- | ---------------------------------------------------------------------------- | ------ | ---------- |
| foreign-station tonnage      | much lower than Britain; concentrated in the **Mediterranean** and **Indochina/W. Africa** | [B86] station returns; [R07] | SINGLE-SOURCE |
| endurance requirements       | lower (regional/Mediterranean), though colonial cruisers need range           | [NP] Redoutable 2,840 nmi | SINGLE-SOURCE |
| accommodation requirements   | modest; cramped on torpedo craft                                              | [NP] | SINGLE-SOURCE |
| colonial-service capability  | present but secondary; avisos/gunboats for Indochina, Africa, Pacific         | [CW]/[NP] relayed | SINGLE-SOURCE |
| number of overseas regions   | ~4–5 (Mediterranean, Atlantic/Channel, Indochina, W. Africa, Pacific)         | [B86] | SINGLE-SOURCE |

### A.2.8 Risk tolerance

| field                         | France position                                                                 | source | confidence |
| ----------------------------- | ------------------------------------------------------------------------------- | ------ | ---------- |
| unproven components           | **high willingness** (experimental hulls, water-tube boilers, unconventional layouts) | [W] pp. 554–556; [R07] | SINGLE-SOURCE |
| minimum reliability           | lower bar; accepts machinery defects                                             | [W]; [CW] relayed | SINGLE-SOURCE |
| acceptable stability margin   | narrower; instability a recurring French criticism                               | [CW]/[NP] relayed | SINGLE-SOURCE |
| overweight tolerance          | higher (French ships frequently exceeded designed displacement)                   | [NP] (Shannon note contrast); [CW] relayed | SINGLE-SOURCE |
| preferred tech maturity       | leading-edge / experimental                                                      | [R07] | SINGLE-SOURCE |
| refit frequency               | moderate–high (continuous re-boilering and re-arm)                               | [NP] (Rigault 1890 reboilered) | SINGLE-SOURCE |

### A.2.9 Research preferences (canonical fields)

Existing shipped draft: `research.yaml` France = `GUNNERY: 4, MACHINERY: 2, HULL_CONSTRUCTION: 2`. Grounded
recommendation:

| field              | priority | justification                                                                   | source | confidence |
| ------------------ | -------- | ------------------------------------------------------------------------------- | ------ | ---------- |
| GUNNERY            | 4        | QF guns, Melinite, high-MV medium batteries — the French signature               | [NW]; [B86] French Commission tables | SINGLE-SOURCE |
| TORPEDOES          | 4        | Jeune École primacy; Canet/Whitehead large-bore torpedoes                        | [R07]; [NP] | SINGLE-SOURCE |
| MACHINERY          | 3        | early water-tube adoption (Belleville etc.)                                      | [W] pp. 554–556 | VERIFIED (statement) |
| HULL_CONSTRUCTION  | 3        | steel hulls early (Redoutable first major steel-hulled warship), armoured-cruiser lineage | [NP] Redoutable | SINGLE-SOURCE |
| SUBMARINES         | 3        | France led early submarine work (Gymnote 1888, Narval 1899) — real French first   | [CW] relayed | SINGLE-SOURCE |
| MINES_AND_ASW      | 2        | torpedo/mine flotilla doctrine                                                    | [R07] | SINGLE-SOURCE |
| SHIP_DESIGN        | 2        | experimental layouts                                                              | [CW] relayed | SINGLE-SOURCE |
| FIRE_CONTROL       | 2        | present but not prioritised                                                       | ESTIMATE | ESTIMATE |
| INFRASTRUCTURE     | 2        | domestic docks; fewer overseas bases than Britain                                 | [B86] | SINGLE-SOURCE |
| DAMAGE_CONTROL     | 2        | subdivision fitted but less emphasised                                            | [W] pp. 409–410 | VERIFIED (fractions) |

---

# B. National component variants

The shared catalogue is `content/production/1880/ship-building/components.yaml`. Reuse its ids as the **families**;
each nation's model overlays one family. Field deltas are the values a variant would set. Values below are from
[NW]/[TB87]/[B86] unless noted. The British models largely *are* the shipped catalogue values (the catalogue was
built from the British reference); the French models are the genuine national deltas.

## B.1 United Kingdom (~11 variants)

| family id (components.yaml) | UK national model | fields changed / values | source | confidence |
| --------------------------- | ----------------- | ----------------------- | ------ | ---------- |
| `gun_bl_12in_25` | **BL 12-in/25 Mk I/II** (Colossus, Collingwood) | gun 44,500 kg; shell 324 kg; charge 134 kg; MV 583 m/s; ROF 0.3–0.5; pen 521 mm iron @1,000 yd | [NW] WNBR_12-25_mk1 | SINGLE-SOURCE |
| `gun_bl_135in_30` | **BL 13.5-in/30 Mk I–IV** (Royal Sovereign) | gun 68,100 kg; shell 567 kg; charge 286 kg SBC; MV 614 m/s (640 cordite); ROF 0.3–0.5; pen 711 mm iron @1,000 yd | [NW] WNBR_135-30_mk1 | SINGLE-SOURCE |
| `gun_bl_12in_35` | **BL 12-in/35 Mk VIII** (Majestic/Canopus) | gun 46,700 kg; shell 386 kg; charge 79 kg (EST); MV 716 m/s; ROF 0.6–0.9; pen 838 mm iron @1,000 yd | [NW] WNBR_12-35_mk8; [B2] | SINGLE-SOURCE / VERIFIED shell |
| `gun_bl_10in_32` | **BL 10-in/32 Mk I–IV** (Victoria, Barfleur) | gun 30,000 kg; shell 227 kg; charge 114 kg; MV 622 m/s; ROF ~0.5; pen 518 mm iron @1,000 yd | [NW] WNBR_10-32_mk1-4 | SINGLE-SOURCE |
| `gun_bl_92in_315` | **BL 9.2-in/31.5 Mk III–VII** | gun 23,400 kg; shell 172 kg; charge 74 kg; MV 629 m/s; ROF ~1 | [NW] WNBR_92-31_mk3 | SINGLE-SOURCE |
| `gun_bl_6in_26` | **BL 6-in/26 Mk I–VI** | gun 5,080 kg (Mk II Fraser); shell 45.3 kg; charge 21.8 kg EXE/PBl; MV 597 m/s; ROF ~4; **weak construction, chase-hooped after 1891 Cordelia burst** | [NW] WNBR_6-26_mk1 | SINGLE-SOURCE (unreliability VERIFIED) |
| `gun_qf_6in_40` | **QF 6-in/40 Mk I–III** | gun 6,700 kg; shell 45.3 kg; charge 13.5 kg EXE; MV 574 (EXE)/680 (cord) m/s; ROF 5–7 | [NW] WNBR_6-40_mk1 | SINGLE-SOURCE |
| `gun_qf_47in` | **QF 4.7-in/40 Mk I–IV** | gun 2,130 kg; shell 20.4 kg; charge 5.4 kg SP; MV 544 (SP)/648 (cord) m/s; ROF 5–6 | [NW] WNBR_47-40_mk1 | SINGLE-SOURCE |
| `gun_qf_12pdr` | **QF 12-pdr 12-cwt** | gun 510 kg; shell 5.67 kg; MV 681 m/s; ROF 15; pedestal mount 1,253 kg | [NW] WNBR_3-40_mk1 | SINGLE-SOURCE |
| `gun_qf_6pdr` | **QF 6-pdr 8-cwt** | gun 385 kg; shell 2.72 kg; MV 538 m/s; ROF 20 | [NW] WNBR_6pounder_m1 | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr` | **Hotchkiss 3-pdr 47 mm** | gun 240 kg; shell 1.5 kg; MV 574 m/s; ROF 20 | [NW] WNBR_3pounder_H_mk1 | SINGLE-SOURCE |
| `tube_14in_above_water` / `tube_14in_submerged` | **Whitehead 14-in Mk IV (1886)** | torpedo 300 kg; warhead 26 kg; 24 kn/549 m; tube above 1,400 kg, submerged 2,500 kg (EST) | [W] §2 of early-band note; components.yaml | SINGLE-SOURCE |
| `plant.triple_expansion_cylindrical` | **RN triple-expansion, cylindrical boilers** | 170 kg/kW; SFC 1,220 g/kWh @60 %; reliability high (9000 bp) | [W] p. 562; plants.yaml | VERIFIED |
| armour material `harvey`/`krupp` | **Harvey (1891) then Krupp cemented (1893)** | resistance factor 1.95 (Harvey) / 2.30 (KC) × wrought iron | [EB]; [B2] pp. 364–366 | VERIFIED (two sources) |

## B.2 France (~12 variants)

| family id (components.yaml) | FR national model (delta vs UK) | fields changed / values | source | confidence |
| --------------------------- | ------------------------------- | ----------------------- | ------ | ---------- |
| `gun_bl_274mm_m1875` | **Canon de 27 cm Mle 1875** (already the catalogue's French heavy) | shell 216 kg; charge 75 kg; MV 529 m/s; pen 34–46 cm iron pt-blank | [TB87] Table XVII; [B86] p. 476 | SINGLE-SOURCE |
| `gun_bl_12in_25` (heavy BL family) | **Canon de 305 mm Mle 1893/1896** (Bouvet/Iéna/Suffren) | gun 46,000–48,000 kg; shell 349 kg; charge 89–111 kg; MV 780–815 m/s; ROF ~1; **single or twin turret, no barbette** | [NW] WNFR_12-40_m1893 | SINGLE-SOURCE |
| `gun_bl_274mm_m1875` (27 cm family) | **Canon de 274 mm Mle 1887/1893** (Bouvet/Masséna secondary) | gun 34,960 kg; shell 216–255 kg; charge 67.5 kg BM13; MV 815 m/s; ROF ~2 | [NW] WNFR_10-45_m1893 | SINGLE-SOURCE |
| `gun_qf_6in_40` (6-in QF family) | **Canon de 164.7 mm Mle 1887/1891/1893** | gun 7,040 kg; shell 54.9 kg APC; charge 9.6–13.1 kg BM9/10; MV 770–865 m/s; ROF ~3 | [NW] WNFR_65-45_m1893 | SINGLE-SOURCE |
| `gun_bl_6in_26` (medium BL family) | **Canon de 16 cm Mle 1887** (Dupuy de Lôme) | see 19 cm note; 16 cm secondary of France's first armoured cruiser; **placeholder on [NW]** — values not recovered | [NW] WNFR_Main (16 cm/45 M1887 placeholder) | UNVERIFIED |
| `gun_qf_47in` (light QF family) | **Canon de 138.6 mm Mle 1884/1888/1891** | gun ~4,100 kg; shell 36.5 kg AP / 31.5 kg HE; MV 725/765 m/s; ROF ~4 | [NW] WNFR_55-45_m1891 | SINGLE-SOURCE |
| `gun_qf_47in` (light QF family) | **Canon de 100 mm Mle 1891/1892** | shell 16.0 kg SAP; MV 703 m/s (Mle 1892/45) or 510 m/s (Mle 1892/26) | [NW] WNFR_39-45_m1892 | SINGLE-SOURCE |
| `gun_qf_12pdr` | **Canon de 65 mm (9-pdr) Mle 1888/1891** | gun 540 kg; shell 4.0–4.17 kg; charge 0.875 kg BM3; MV 715 m/s; ROF ~10 | [NW] WNFR_26-50_m1888 | SINGLE-SOURCE |
| `gun_qf_6pdr` | **Canon de 57 mm (6-pdr) Hotchkiss** | Hotchkiss design, French-served; ~6 lb shell; MV ~540 m/s (same family as British) | [NW] WNFR_Main (57 mm Hotchkiss) | SINGLE-SOURCE |
| `gun_qf_47in` (light family) | **Canon de 75 mm/50 Canet Mle 1891** | gun 879–910 kg; shell 4.9–5.0 kg; charge 1.5 kg; MV 823 m/s; ROF 12–15; **French-designed, licence-built by Russia** | [NW] WNRussian_29-50_m1891 | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr` | **Canon de 47 mm / 37 mm Hotchkiss** | 3-pdr 1.5 kg @574 m/s; 1-pdr 37 mm revolver; French ships used both heavily | [NW] WNFR_Main | SINGLE-SOURCE |
| `tube_14in_above_water` / `tube_14in_submerged` | **French 350/380 mm Whitehead tubes** | N°27: 1 × 380 mm bow tube; Redoutable: 2 × 350 mm beam; **bore differs from the 356 mm family** | [NP] fr_dd_no27, fr_bb_redoutable | SINGLE-SOURCE |
| `plant.triple_expansion_cylindrical` | **French TE / water-tube (Belleville, Niclausse, Normand)** | adopts water-tube for all classes early; heavier fuel burn, lower reliability | [W] pp. 554–556 | VERIFIED (statement) |
| armour material `compound`/`steel` | **Creusot steel armour (1876)**, later Krupp cemented licensed | resistance factor 1.30 (steel); Creusot was the world leader and exporter | [EB] "Armour Plates" | SINGLE-SOURCE |

Notes:
- The French **bore conventions differ**: "19 cm" is actually 194 mm, "27 cm" is 274 mm, "16 cm" is ~164 mm ([NW] WNFR_76-45_m1887 explicitly says primary documents use the metric name). A national variant should store the French designation, not the nominal bore.
- The French QF guns are the genuine differentiator (Canet/Hotchkiss); the British QF guns are largely Elswick/Hotchkiss-pattern too, so the *shared* QF family with national models is the honest model.

---

# C. Six 1880 opening reference designs per nation

Each is a legal 1880-01 starting point (or, where the type did not exist in 1880, a **national doctrine template**
using a named historical inspiration). Dimensions are as sourced; **moulded depth is UNVERIFIED for almost all
ships** (no source gives it — `ship-building-1880-ships-by-nation.md` §). Torpedo bōre caveat: the catalogue's
1880 model is the 14-in (356 mm) Whitehead; RN 1877–79 boats actually carried 16-in (406 mm) and French boats
350/380 mm (recorded approximation).

## C.1 United Kingdom

### UK-B — *Devastation*-class turret ironclad (1873) — historical
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| L × B × T | 86.9 pp (93.6 oa) × 19.0 × 8.03 m | [NP] `uk/brit_bb1_devastation.html` | SINGLE-SOURCE |
| depth (moulded) | not found (ESTIMATE ~13 m) | — | UNVERIFIED |
| displacement | 9,387 t normal | [NP]; [B86] l.4639 | VERIFIED (two sources) |
| speed / power | 13.8 kn / 6,640 ihp | [NP] | SINGLE-SOURCE |
| main | 4 × 305 mm (12-in) RML Mk II, 2 twin turrets | [NP] | SINGLE-SOURCE |
| secondary | none as built (1879: 8 × 11.4 mm Nordenfelt) | [NP] | SINGLE-SOURCE |
| armour (iron) | belt 305–216; deck 76–51; turret 356–254; CT 229–152 | [NP] | SINGLE-SOURCE |
| machinery | 2 × 2-cyl HSE trunk, 8 rectangular boilers, 2 shafts | [NP] | SINGLE-SOURCE |
| torpedo | 2 × 356 mm above-water (added 1879) | [NP] | SINGLE-SOURCE |

### UK-CA — HMS *Shannon* armoured cruiser (1877) — historical (first RN armoured cruiser)
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| L × B × T | 79.3 pp × 16.5 × 6.78 m (hold depth) | [NP] `uk/brit_cr_shannon.htm` | SINGLE-SOURCE |
| depth | 6.78 m hold | [NP] | SINGLE-SOURCE |
| displacement | 5,455 t normal | [NP] | SINGLE-SOURCE |
| speed / power | 12.3 kn / 3,369 ihp | [NP] | SINGLE-SOURCE |
| main | 2 × 254 mm (10-in) RML Mk I/II + 7 × 229 mm (9-in) RML Mk IV | [NP] | SINGLE-SOURCE |
| secondary | 6 × 100 mm 20-pdr 16-cwt BL | [NP] | SINGLE-SOURCE |
| armour (iron) | belt 229–152 on teak; bulkheads 229–203; deck 76–38; CT 229 | [NP] | SINGLE-SOURCE |
| machinery | sails + 1 × 4-cyl HC, 8 cylindrical boilers, 1 shaft | [NP] | SINGLE-SOURCE |
| torpedo | 4 × 356 mm carriages (added 1881) | [NP] | SINGLE-SOURCE |

### UK-CL — HMS *Iris* steel despatch vessel / 2nd-class cruiser (1879) — historical
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| L × B × T | 91.4 pp (101.5 oa) × 14.0 × 6.71 m | [NP] `uk/brit_cr_iris.htm` | SINGLE-SOURCE |
| displacement | 3,730 t normal | [NP] | SINGLE-SOURCE |
| speed / power | 17.9–18.6 kn / 6,000 ihp design | [NP] | SINGLE-SOURCE |
| main | 10 × 160 mm (6.3-in) 64-pdr 71-cwt RML | [NP] | SINGLE-SOURCE |
| secondary | none as built | [NP] | SINGLE-SOURCE |
| armour | nil; steel hull, subdivision, coal-bunker side protection | [NP] | SINGLE-SOURCE |
| machinery | sails + 2 × 4-cyl HC, 8 oval + 4 cylindrical boilers, 2 shafts | [NP] | SINGLE-SOURCE |
| torpedo | none as built (4 × 356 mm added 1886–87) | [NP] | SINGLE-SOURCE |

### UK-DD — *TB2* class first-class torpedo boat (1878–79) — historical
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| L × B × T | 26.5 oa / 26.3 pp × 3.1 × 1.60 m | [NP] `uk/brit_dd_tb2.htm` | SINGLE-SOURCE |
| displacement | 28 normal / 32 full | [NP] | SINGLE-SOURCE |
| speed / power | 20 kn / 460 ihp | [NP] | SINGLE-SOURCE |
| main | none | [NP] | SINGLE-SOURCE |
| torpedo | 1 × 406 mm (16-in) tube (1880s: 2 × 356 mm dropping gear) | [NP] | SINGLE-SOURCE |
| machinery | 1 × 2-cyl VCE + 1 locomotive boiler | [NP] | SINGLE-SOURCE |
| crew | 15 | [NP] | SINGLE-SOURCE |

### UK-KE — colonial composite sloop (national doctrine template; inspiration *Doterel*/composite gunboat class, 1879)
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| historical inspiration | RN composite sloops/gunboats (Doterel class, 1879; Arab class 1874) | [CW] relayed | SINGLE-SOURCE |
| L × B × T | ~50 × 9.5 × 3.5 m | ESTIMATE (no dimensions opened) | ESTIMATE |
| displacement | ~1,100 t | ESTIMATE (Doterel-class figure, [CW] relayed) | ESTIMATE |
| speed | ~11 kn | ESTIMATE | ESTIMATE |
| main | 4 × 160 mm 64-pdr RML (broadside) | ESTIMATE from RN sloop armament | ESTIMATE |
| machinery | compound, cylindrical boilers | [W] p. 562 | VERIFIED (plant) |
| endurance | ~2,500 nmi at 8 kn | [W] | SINGLE-SOURCE |

> The shipped `starter_corvette_1880` in `reference-designs.yaml` already fills this slot as a fictional legal
> template (62 m, 620 t, 11 kn, machine guns). It is a doctrine template, not a historical class.

### UK-AMC — armed merchant cruiser (national doctrine template)
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| historical inspiration | RN practice of arming fast liners on station/for fleet manoeuvres (post-1887) | [CW]/[PAR] relayed | SINGLE-SOURCE |
| L × B × T | ~115 × 14 × 7.5 m (from `merchant_liner_form` band) | hull-forms.yaml; `ship-building-merchant-liner.md` | SINGLE-SOURCE |
| displacement | ~3,500 t (template) | reference-designs.yaml `starter_armed_liner_1880` | ESTIMATE |
| speed | ~13 kn (older single-screw liner; new liners 18+) | `ship-building-merchant-liner.md` | SINGLE-SOURCE |
| main | 4–6 × 160 mm 64-pdr RML or 6-in BL in open mounts | ESTIMATE | ESTIMATE |
| armour | none (hull only) | merchant_liner_form | rule |
| machinery | compound, cylindrical | [W] p. 562 | VERIFIED (plant) |

## C.2 France

### FR-B — *Redoutable* central-battery ironclad (1878) — historical (already in `reference-designs.yaml`)
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| L × B × T | 97.1 wl (100.7 oa) × 19.7 × 7.80 m | [NP] `france/fr_bb_redoutable.htm` | SINGLE-SOURCE |
| displacement | 9,224 t normal | [NP] | SINGLE-SOURCE |
| speed / power | 14.7 kn / 6,200 ihp | [NP] | SINGLE-SOURCE |
| main | 8 × 274 mm (10.8-in) Mle 1875 (4 battery corners + 4 upper deck) | [NP] | SINGLE-SOURCE |
| secondary | 6 × 139 mm Mle 1870 + 12 × 5 37 mm revolving | [NP] | SINGLE-SOURCE |
| armour (iron) | belt 350–220; deck 60–45; battery 300–240 | [NP] | SINGLE-SOURCE |
| machinery | 1 × HRCR compound, 8 oval boilers, 1 shaft | [NP] | SINGLE-SOURCE |
| torpedo | 2 × 350 mm above-water beam | [NP] | SINGLE-SOURCE |
| hull material | **steel hull** (first major warship) | [NP] | SINGLE-SOURCE |

### FR-CA — *croiseur-cuirassé* doctrine template (inspiration: *Dupuy de Lôme* lineage, 1890)
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| historical inspiration | France's first armoured cruiser *Dupuy de Lôme* (1890), 19 cm + 16 cm Mle 1887 | [NW] WNFR_76-45_m1887 | SINGLE-SOURCE |
| L × B × T | ~110 × 15 × 7 m (ESTIMATE; Dupuy de Lôme dimensions not fetched) | [CW] relayed | ESTIMATE |
| displacement | ~6,500 t (ESTIMATE; Dupuy de Lôme ~6,300 t) | [CW] relayed | ESTIMATE |
| speed | ~19 kn | [CW] relayed | SINGLE-SOURCE |
| main | 2 × 194 mm (19 cm) Mle 1887 single turrets (bow/stern) | [NW] | SINGLE-SOURCE |
| secondary | 6 × 164 mm (16 cm) Mle 1887 | [NW] | SINGLE-SOURCE |
| armour (steel) | belt ~100 mm Creusot steel; deck 40–60; turrets ~100 | [NW] mount notes; [EB] | ESTIMATE |
| machinery | TE, water-tube | [W] pp. 554–556 | SINGLE-SOURCE |
| torpedo | 2 × 380/450 mm | ESTIMATE | ESTIMATE |

> In 1880 this type did not exist; the note gives it as a doctrine template so the type slot is fillable. A legal
> 1880-01 French CA would instead use a 27 cm Mle 1875 main (catalogue id `gun_bl_274mm_m1875`) and wrought-iron
> belt, as the shipped `starter_armoured_cruiser_1880` does for the UK.

### FR-CL — *Rigault de Genouilly*-class wooden cruiser (1878) — historical
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| L × B × T | 73.9 wl × 10.8 × 5.36–5.49 m | [NP] `france/fr_cr_rigault_de_genouilly.htm` | SINGLE-SOURCE |
| displacement | 1,722 (R. de G.) / 1,800 (Éclaireur) t | [NP] | SINGLE-SOURCE |
| speed / power | 15 kn / 2,400 ihp | [NP] | SINGLE-SOURCE |
| main | 8 × 139 mm Mle 1870 (broadside + bow/stern chasers) | [NP] | SINGLE-SOURCE |
| secondary | 6–8 × 5 37 mm M1885 | [NP] | SINGLE-SOURCE |
| armour | none (wooden hull, iron beams) | [NP] | SINGLE-SOURCE |
| machinery | 1 × HC, 6 cylindrical boilers, 1 shaft | [NP] | SINGLE-SOURCE |
| endurance | 3,100 nmi at 10 kn; coal 205 t | [NP] | SINGLE-SOURCE |

### FR-DD — Torpilleur "N°27" (1879) — historical
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| L × B × T | 31.8 wl × 3.30 × 0.90 m | [NP] `france/fr_dd_no27.htm` | SINGLE-SOURCE |
| displacement | 43 t | [NP] | SINGLE-SOURCE |
| speed / power | 18 kn / 320–500 ihp | [NP] | SINGLE-SOURCE |
| torpedo | 1 × 380 mm bow tube | [NP] | SINGLE-SOURCE |
| machinery | 1 × 2-cyl VCR + 1 locomotive boiler | [NP] | SINGLE-SOURCE |
| crew | 12 | [NP] | SINGLE-SOURCE |
| note | 1877–80 sisters: N°20, 22, 24, 26, 28, 31 | [NP] | SINGLE-SOURCE |

### FR-KE — French aviso / colonial gunboat (national doctrine template; inspiration *Hussard*/*Forbin* avisos)
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| historical inspiration | French 1880s avisos (colonial station gunboats) | [CW]/[NP] relayed | SINGLE-SOURCE |
| L × B × T | ~55 × 9 × 4 m | ESTIMATE | ESTIMATE |
| displacement | ~1,000 t | ESTIMATE | ESTIMATE |
| speed | ~12 kn | ESTIMATE | ESTIMATE |
| main | 2–4 × 139 mm Mle 1870 | [NP] Rigault 139 mm | SINGLE-SOURCE (gun) |
| machinery | compound, cylindrical | [W] p. 562 | VERIFIED (plant) |

### FR-AMC — armed fast liner / *croiseur auxiliaire* (national doctrine template)
| item | value | source | confidence |
| ---- | ----- | ------ | ---------- |
| historical inspiration | French practice of arming transatlantic liners as commerce raiders | [R07]; [CW] relayed | SINGLE-SOURCE |
| L × B × T | ~115 × 14 × 7.5 m | `merchant_liner_form` | SINGLE-SOURCE |
| displacement | ~3,500 t (template) | reference-designs.yaml | ESTIMATE |
| speed | ~13 kn older / 18+ new | `ship-building-merchant-liner.md` | SINGLE-SOURCE |
| main | 4–6 × 138.6 mm QF in open mounts | [NW] WNFR_55-45_m1891 (gun) | SINGLE-SOURCE |
| armour | none | rule | rule |

---

# D. Procurement policy and naming policy

## D.1 Procurement policy (what the AI should prefer, given budget)

Crucially, the two nations should **not** get artificially equal fleets. Recommended policy axes (weights are
BALANCE TARGET; the *shape* is the grounded differentiator):

| axis                        | UK                                                                 | France                                                            | source for the shape |
| --------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- | -------------------- |
| battle-line proportion      | high (≈25–35 % of naval budget; the two-Power battle fleet)        | lower (≈15–25 %; the line is one instrument, not the centrepiece) | [R07]; [CW]/[PAR] relayed |
| cruiser emphasis            | **very high** (trade protection + stations; Edgar/Blake/Apollo)    | high but toward **armoured cruisers** (Dupuy de Lôme lineage)     | [R07]; [CW] relayed |
| torpedo-craft emphasis      | moderate–high (numbered TBs, "27-knotters" from 1893)              | **very high** (torpedo boats are the strategic arm)               | [R07]; [NP] |
| foreign procurement appetite | low (self-sufficient; exports)                                     | low–moderate (licenses Canet/Hotchkiss abroad; buys armour material) | [EB]; [NW] |
| appetite for unproven tech   | low on capital ships; trials on small craft                        | **high** (machinery, layouts, submarines)                         | [W] pp. 554–556; [R07] |

Cargo-cult guard: these are **soft preferences** guiding templates/AI scoring, never hard blockers.

## D.2 Naming policy

| type          | UK convention                                                                                     | France convention                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| battleship    | classical/admiralty/royal and national names (Devastation, Dreadnought, Alexandra, Royal Sovereign, Majestic, Canopus, Formidable, Duncan) | heroic/Republican/professional names (Redoutable, Amiral Duperré, Hoche, Vauban, Bouvet, Brennus, Charles Martel, Carnot, Jauréguiberry, Masséna) |
| cruiser       | geographic/classical/abstract (Shannon, Iris, Leander, Edgar, Blake, Powerful, Apollo, Diadem)     | descriptive/admiral names (Dupuy de Lôme, Amiral Charner, Latouche-Trèville, Chanzy, D'Entrecasteaux, Guichen, Friant, Descartes, Jurien de la Gravière) |
| destroyer/TB  | early RN TBs **numbered**; destroyers named for weapons/speed/animals (Havock, Hornet, Daring, Decoy, Ferret) | torpedo boats **numbered** (N°27, N°20…); contre-torpilleurs named as weapons (Durandal, Pique, Pertuisane, Arquebuse, Hallebarde) |
| gunboat/aviso | birds/animals/tribes (Condor, Curlew, Landrail, Bulldog, Osprey, Doterel)                          | descriptive/colonial (Rigault de Genouilly, Éclaireur; avisos Hussard, Forbin)                                  |

Authentic 1880s name stems (published ship names are historical facts; cited to the ship lists):
- **UK BB:** Devastation, Thunderer, Dreadnought, Alexandra, Temeraire, Colossus, Collingwood, Royal Sovereign, Empress of India, Ramillies, Majestic, Canopus.
  Source: [NP] class pages; [B86]/[B94] ship tables. SINGLE-SOURCE.
- **UK cruisers:** Shannon, Iris, Mercury, Leander, Mersey, Edgar, Blake, Powerful, Apollo, Diadem. Source: [NP]; [CW] relayed. SINGLE-SOURCE.
- **UK TB/Destroyer:** numbered TB51–62; Havock, Hornet (from 1893). Source: [NP]; [B8]. SINGLE-SOURCE.
- **UK gunboats/sloops:** Condor, Curlew, Landrail, Bulldog, Kite, Osprey, Doterel. Source: [CW] relayed; [TB87]. SINGLE-SOURCE.
- **FR BB:** Redoutable, Devastation (Fr.), Amiral Duperré, Hoche, Brennus, Charles Martel, Carnot, Jauréguiberry, Masséna, Bouvet, Charlemagne. Source: [NP]; [NW] class lists. SINGLE-SOURCE.
- **FR cruisers:** Dupuy de Lôme, Amiral Charner, Latouche-Trèville, Chanzy, Friant, Descartes, D'Assas, Catinat, Guichen, Châteaurenault, Jurien de la Gravière. Source: [NW] ship-class lists; [NP]. SINGLE-SOURCE.
- **FR TB/Destroyer:** numbered torpilleurs (N°20, 22, 24, 26, 27, 28, 31); Durandal, Pique, Pertuisane, Arquebuse, Hallebarde. Source: [NP]; [NW] WNFR_26-50_m1888. SINGLE-SOURCE.
- **FR avisos/cruisers (light):** Rigault de Genouilly, Éclaireur. Source: [NP]. SINGLE-SOURCE.

---

# E. Recommendations (concrete values)

Where **historical fact** (sourced), **game conversion** (arithmetic from a sourced figure) and **balance
adjustment** (gameplay choice with no historical magnitude) differ, they are labelled. Proposed profile values
(non-normative; the orchestrator authors the final YAML):

| profile field | UK candidate | France candidate | basis | label |
| --- | --- | --- | --- | --- |
| `strategicSituation.primary` | battle-fleet concentration + colonial presence | commerce raiding + torpedo warfare | §A.1.1 / §A.2.1 | grounded (SINGLE-SOURCE) |
| `industrialProfile.buildTimeMultiplierBp` | 9000–9500 | 10000–11000 | verified RN throughput vs French completion slip | conversion + **BALANCE TARGET** |
| `industrialProfile.costMultiplierBp` | 9500–10000 | 10500–11000 | Woolwich cost lowest [B82] p. 95 | grounded cost + **BALANCE TARGET** |
| `industrialProfile.maxPracticalDisplacementKg` (1880/1885/1890) | 10.0M / 12.0M / 15.0M | 9.0M / 10.5M / 12.0M | completed classes | ESTIMATE |
| `industrialProfile.machineryReliabilityBp` | 9000 | 8200 | plants.yaml TE 9000; White on French water-tube | grounded + **BALANCE TARGET** |
| `industrialProfile.constructionQualityVarianceBp` | low (≈2000) | high (≈4000) | French overweight/instability | ESTIMATE / **BALANCE TARGET** |
| `doctrineProfile.engagementRangeM` | 2000–3000 | 2000 | French 2,000 m explicit [NW] | grounded (SINGLE-SOURCE) |
| `doctrineProfile.hePreferenceBp` | 4000 (AP-dominant) | 7000 (Melinite) | [TB87]; [NW] | grounded (SINGLE-SOURCE) |
| `doctrineProfile.torpedoWeight` | 0.9 | 1.45 | Jeune École | **BALANCE TARGET** (shape grounded) |
| `doctrineProfile.speedWeight` (CL) | 1.10 | 1.00 | RN speed emphasis | **BALANCE TARGET** |
| `doctrineProfile.enduranceWeight` (CL) | 1.40 | 1.05 | station obligation | **BALANCE TARGET** (shape grounded) |
| `doctrineProfile.colonialWeight` | 1.25 | 0.90 | overseas regions | **BALANCE TARGET** |
| `researchPreferences` | MACHINERY 4, HULL 3, GUNNERY 3, INFRA 3 (see §A.1.9) | GUNNERY 4, TORPEDOES 4, MACHINERY 3, HULL 3, SUBMARINES 3 (see §A.2.9) | §A.1.9 / §A.2.9 | grounded shape |
| `componentVariants` | ~11 UK models (§B.1) | ~12 FR models (§B.2) | §B | mixed (BUSY labels per row) |
| `designs` | §C.1 (6) | §C.2 (6) | §C | mixed (BUSY labels per row) |
| `procurementPolicy` axes | §D.1 | §D.1 | §D.1 | **BALANCE TARGET** + grounded shape |
| `namingPolicy` | §D.2 | §D.2 | published ship lists | grounded (SINGLE-SOURCE) |

Multiplier guidance from the brief: keep ordinary cost/build-time modifiers within **±5–15 %**; the UK/French
spread proposed above is ~10 % and ~10 % respectively, consistent with RTW3's ~10 % "efficient/undeveloped"
construction-time spread cited in `docs/ships-nation-orientation.md`.

---

# F. Deferred (needs an owner or a decision-request)

- **Moulded depth for every design** — no source gives it (carried over from the earlier notes). Hull weight/cost depend on it; until a source or a documented convention is agreed, depths are ESTIMATE and must be labelled.
- **French dock capacity / max displacement per yard** — grounded only indirectly from completed classes; a *Brassey 1886/1888–9* yard table or a French *Annuaire* would settle it. ESTIMATE until then.
- **French 16 cm Mle 1887 gun values** — navweaps lists it only as a "place holder"; shell/charge/MV are UNVERIFIED. A decision-request or a print source (Jordan & Caresse, _French Armoured Cruisers_) is needed before authoring that variant.
- **UK 6-in/26 strength/reliability** — the Mk I/II/III series were chase-hooped after bursts (Cordelia 1891, six dead). The catalogue treats `gun_bl_6in_26` as reliable; a national "British 6-in BL, weak construction (pre-1891)" variant and a reliability penalty is a defensible historical refinement — needs an owner (interacts with gunnery balance).
- **AMC and KE are doctrine templates in both nations** — no 1880 hull is a true B/CA/CL/DD/KE/AMC for either navy except the historical types named. Confirm with the orchestrator that fictional-but-legal starters are acceptable (the existing `reference-designs.yaml` already does this for the UK).
- **`research.yaml` field-priority keys** — the shipped file uses `MACHINERY/GUNNERY/HULL_CONSTRUCTION` only. The brief's canonical list adds TORPEDOES/SUBMARINES/etc. Confirm the canonical field enum before the profile references the new keys (this note assumes the nine-field list in the brief).
- **Naming dataset** — name stems are listed; a full curated dataset (with collision handling and French gender/particle rules) is content authoring, not research, and is deferred to the spec/implementator.

---

# G. Verdict: is there enough grounding to author both profiles for release?

**Qualified yes — the two profiles are authorable now, with per-figure labels.**

- **Strongly grounded:** the *shape* of both nations (Britain = global battle fleet + cruiser/station empire;
  France = Jeune-École commerce raiding + torpedo warfare + experimental machinery) rests on [W], [B82], [B86],
  [EB] and the directly-read [NW]/[NP] pages. The component-variant overlays for the two nations are grounded
  gun-by-gun: the British models largely *are* the shipped catalogue (VERIFIED/SINGLE-SOURCE), and the French
  models (194 mm, 164.7 mm, 138.6 mm, 100 mm, 65 mm Canet/Mle 1887 guns; 305/274 mm turret guns; Creusot steel)
  are SINGLE-SOURCE from navweaps, which quotes the print works.
- **The qualitative differentiators are strong and sourceable:** engagement range (French 2,000 m, explicit),
  HE/Melinite vs AP preference, secondary-battery calibre (French 16–19 cm vs British 6–9.2 in), water-tube
  adoption (White, VERIFIED), torpedo primacy (Roksund, SINGLE-SOURCE).
- **What is ESTIMATE/BALANCE TARGET and must be labelled as such:** every cost/build-time multiplier, the
  max-displacement/dock progression, stability margins, construction-quality variance, AI design weights, and
  the fictional KE/AMC/C A-1880 templates. These are gameplay abstractions built on a grounded shape — not
  historical measurements.
- **What is genuinely missing:** FR/UK moulded depths, French yard capacities, the French 16 cm gun values, and
  the exact canonical research-field enum. None of these blocks authoring a first profile; they are deferred
  items that stay labelled until a print source is obtained.

Recommendation to the orchestrator: author both profiles now with the values in §E; ship every
ESTIMATE/UNVERIFIED figure with its label and a provenance record (the merchant-liner discipline), keep all
multipliers inside ±15 % and labelled BALANCE TARGET, and raise decision-requests only for the §F items that a
print source must settle.

## Source list

1. W. H. White, _A Manual of Naval Architecture_, John Murray, 1894 — `manualofnavalarc00whitrich`.
2. T. A. Brassey, _The British Navy, vol. II_ (1882) — `britishnavyitss04brasgoog` (p. 95 gun costs).
3. T. A. Brassey (ed.), _The Naval Annual 1886_ — `navalannual1886`; _1894_ — `CASGA_120401`.
4. G. Mackinlay, _Text Book of Gunnery, 1887_ (HMSO) — `1887-textbook-of-gunnery-second-edition` (Tables XVI/XVII).
5. _Encyclopaedia Britannica_, 11th ed. (1911), "Armour Plates" (Wikisource).
6. navweaps.com (read directly this session): `WNBR_12-25_mk1`, `WNBR_135-30_mk1`, `WNBR_12-35_mk8`, `WNBR_12-40_mk9`, `WNBR_10-32_mk1-4`, `WNBR_92-31_mk3`, `WNBR_6-26_mk1`, `WNBR_6-40_mk1`, `WNBR_6-45_mk7`, `WNBR_47-40_mk1`, `WNBR_3-40_mk1`, `WNBR_6pounder_m1`, `WNBR_3pounder_H_mk1`; `WNFR_76-45_m1887`, `WNFR_65-45_m1893`, `WNFR_55-45_m1891`, `WNFR_39-45_m1892`, `WNFR_26-50_m1888`, `WNFR_12-40_m1893`, `WNFR_10-45_m1893`; `WNRussian_29-50_m1891`; index pages `WNBR_Main.php`, `WNFR_Main.php`.
7. navypedia.org (read directly this session): `uk/brit_cr_shannon.htm`, `uk/brit_bb1_devastation.html`, `uk/brit_bb1_dreadnought.html`, `uk/brit_cr_iris.htm`, `uk/brit_dd_tb2.htm`, `france/fr_bb_redoutable.htm`, `france/fr_cr_rigault_de_genouilly.htm`, `france/fr_dd_no27.htm`.
8. Print works named as leads (not opened this session): Conway's _All the World's Fighting Ships 1860–1905_ (1979); R. A. Burt, _British Battleships 1889–1904_ (2013); H. Lyon, _The First Destroyers_ (1996); O. Parkes, _British Battleships_ (1957); A. Roksund, _The Jeune École: The Strategy of the Weak_ (Brill, 2007); Jane's _Fighting Ships_ (1898); Jordan & Caresse, _French Armoured Cruisers 1887–1932_.
9. Repo companions: `docs/research/ship-building-early-band.md`, `ship-building-early-band-2.md`, `ship-building-1880-pre-era-armament.md`, `ship-building-1880-ships-by-nation.md`, `ship-building-build-times.md`, `ship-building-content-sourcing.md`, `ship-building-merchant-liner.md`; `docs/ships-nation-orientation.md`.
