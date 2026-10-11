# Research: national naval profile — Brazil (Empire of Brazil, 1880–1899)

Companion to `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
`italy-naval-profile.md`, `japan-naval-profile.md`, `russia-naval-profile.md`, `usa-naval-profile.md`,
`austria_hungary-naval-profile.md`, `spain-naval-profile.md`, `qing-naval-profile.md`; method, source grades
and confidence labels are identical (VERIFIED / SINGLE-SOURCE / DERIVED / ESTIMATE / UNVERIFIED;
**Wikipedia is not cited anywhere**). Authored for the `brazil` (canonical `NationNavalProfile`) of the
`scen_1880` national-naval initiative (`docs/ships-nation-orientation.md`, ADR-0088/0089 line of work).
This is a **research-only** pass: no code, no content YAML and no spec is authored here. Captured 2026-10-11.

## 0. Question

What are the grounded figures and national differentiators needed to author a **date-banded `NationNavalProfile`
(1880–1899)** for the **Empire of Brazil** (repo id `brazil`), plus ~8–15 shared-family national models,
six 1880 opening reference designs (B, CA, CL, DD, KE, AMC), component access, research priorities and
naming policy? This note answers that; it does **not** author the profile. The in-service 1880 hulls were
collected in `docs/research/ship-building-1880-ships-by-nation.md` §6.11 and are **reused, not re-derived**;
the `Javary` class (there UNVERIFIED) is now grounded here.

## 1. Method, source grades and confidence labels

Every figure carries a named source and one of: **VERIFIED** (read directly in a period/near-primary text, or
two independent sources agree); **SINGLE-SOURCE** (one source, or a secondary compilation citing print works
I could not open); **DERIVED** (arithmetic from a sourced figure); **ESTIMATE** (derived/inferred by me; not
itself a source figure); **UNVERIFIED** (no usable source, or sources conflict; a range is given). **Wikipedia
is not cited as a source anywhere.**

| Tag    | Source                                                                                                                                                                                                                       | Grade / reach                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [SBN]  | `docs/research/ship-building-1880-ships-by-nation.md` §6.11 (Sete de Setembro). **In-repo, already grounded.**                                                                                                               | Reused; confidence as carried.                                                                       |
| [NE]   | naval-encyclopedia.com, "The Imperial Brazilian Navy" (`industrial-era/the-imperial-brazilian-navy.php`). **Fetched and read directly this session.** Page states "Source: Conway's … 1860-1905" and lists Conway/Warship 1999 references. | Secondary compilation → SINGLE-SOURCE.                                                               |
| [NP]   | navypedia.org Brazilian class pages (Ivan Gogin), built principally on Conway's _All the World's Fighting Ships 1860–1905_. **Fetched directly this session** (slugs §Sources).                                              | Secondary compilation → SINGLE-SOURCE.                                                              |
| [NA86] | T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`, full text `NavalAnnual1886_djvu.txt` **read directly this session** ("Notes on the Brazilian Navy", p. 214; "Brazilian Ships" plate).            | Contemporary annual = period near-primary. **Read directly → VERIFIED for figures actually read.** |
| [PRE]  | `docs/research/ship-building-1880-pre-era-armament.md` §5 (British RML shell/charge/MV). **In-repo.**                                                                                                                        | Reused; SINGLE-SOURCE.                                                                               |
| [REPO] | Shipped content (`countries.yaml`, `economies.yaml`, `research.yaml`, `fleets.yaml`, `possessions.yaml`). **Not a historical source** — repo framing only.                                                                     | Framing, not grounding.                                                                              |
| [CW]   | Conway's _All the World's Fighting Ships 1860–1905_ (1979). **Not opened this session**; relayed via [NE]/[NP].                                                                                                              | Print secondary; SINGLE-SOURCE (relayed).                                                            |

Limits: Conway's was not reachable; [NE]/[NP] are compilations, so nearly every ship figure is SINGLE-SOURCE
(where [NA86] corroborates a tonnage/speed/gun it is marked VERIFIED with both named). No Brazilian naval
budget, yard return or dock-capacity table was opened. Multipliers, research weights and design weights below
are therefore explicit **BALANCE TARGET / ESTIMATE**, not measurements. Moulded depth is not given by any
source for any Brazilian ship (UNVERIFIED), as in the other national notes.

Conversions: 1 in = 25.4 mm; 1 long ton = 1016.05 kg; 1 ihp = 0.7457 kW; 1 kn = 0.5144 m/s; 1 ft = 0.3048 m.

---

# A. National naval profile (1880–1899)

1880 Brazil is a **stable, coffee-and-rubber-rich constitutional monarchy under Pedro II, with the largest
navy in South America** ([REPO] `countries.yaml`). Its fleet is overwhelmingly **a legacy of the Paraguayan
War (1864–70)**: Civil-War-era river monitors, low-freeboard coast-defence turret ships and composite
casemate ironclads, plus a handful of wooden/composite cruisers and sloops. It has **no blue-water battle
fleet**: the modern turret ironclads _Riachuelo_ and _Aquidabã_ were ordered/built in Britain and are
**not in service until 1883/1887**. Heavy guns and armour are **imported** (Whitworth, Armstrong, Krupp,
Forges et Chantiers); the domestic capability is limited to the Rio arsenal and a genuine, small
**naval-architecture lineage** (Napoleão Level, Trajano de Carvalho, João Cândido Brasil). Posture is
**regional hegemony + river/coast defence**, with the South Atlantic/Cape route as a distant concern.

## A.1 Strategic posture

| posture                    | applies?                     | justification (one line)                                                                                                                                                            | source                                 | confidence        |
| -------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------- |
| regional_warfare           | **primary**                  | the fleet's purpose is South American hegemony — rivalry with Argentina and Chile, control of the Plate/Paraná basin won in the Paraguayan War. `[REPO]` strategicObjectives "Regional Hegemony". | `[REPO]` `countries.yaml`; [NE]        | VERIFIED (in-repo) / SINGLE-SOURCE |
| coastal_defence            | **primary**                  | all 1880 in-service armour is coastal/riverine: low-freeboard turret monitors (_Javary_), 490 t river monitors (_Pará_), a composite casemate ironclad (_Sete de Setembro_).       | [NE]; [NP] `br_bb_para`/`br_bb_riachuelo` | SINGLE-SOURCE    |
| distant_water_operations   | **weak**                     | a few wooden/composite cruisers and the "Esquadra de Evoluções" cruise Brazilian waters; no real station empire (the African Division was disbanded in 1830).                        | [NE]; [REPO]                           | SINGLE-SOURCE     |
| commerce_defence           | **weak–moderate**            | `[REPO]` strategicObjectives secondary is "Trade Protection" (coffee/rubber exports); but no dedicated trade-protection cruiser force until the 1890s.                              | `[REPO]` `countries.yaml`              | VERIFIED (in-repo) |
| torpedo_warfare            | **weak / emerging**          | four torpedo boats bought by 1879; the Practical School of Torpedoes founded 30.11.1883; the 1883/87 turret ships carry 356 mm tubes. Capability is nascent, not a doctrine.       | [NE]; [NP] `br_bb_riachuelo`           | SINGLE-SOURCE     |
| battle_fleet_concentration | **very weak / aspirational** | no ironclad in service Jan 1880; _Riachuelo_ (1883) and _Aquidabã_ (1887) are coast/regional turret ships, not a line of battle.                                                     | `[SBN]` §5; [NP] `br_bb_riachuelo`     | VERIFIED (dates)  |
| commerce_raiding           | **no**                       | not an 1880 Brazilian doctrine; the service is defensive/regional and prestige-driven, not a guerre-de-course navy.                                                                 | reasoning                              | ESTIMATE          |
| colonial_presence          | **no**                       | `possessions.yaml` lists Brazilian coastal/estuary provinces only (Amazon, NE coast, Rio/São Paulo, South); no coaling-station empire.                                              | `[REPO]` `possessions.yaml`            | VERIFIED (in-repo) |

**Recommended primary postures: `regional_warfare` + `coastal_defence`**, with `distant_water_operations`,
`commerce_defence` and `torpedo_warfare` weak. `battle_fleet_concentration` is very weak/aspirational;
`commerce_raiding` and `colonial_presence` are **not** 1880 Brazilian postures. The defining differentiator is
**regional hegemony + a river/coast ironclad heritage + import dependence for modern ships and ordnance**.

## A.2 In-service 1880 ships (re-used from `[SBN]` §6.11; `Javary`/`Pará` now grounded)

- **Sete de Setembro** / _Independência_-class composite casemate ironclad (Arsenal de Marinha da Corte, Rio;
  laid 8.1.1868 / launched 16.5.1874 / commissioned 4.7.1874; reclassified a floating battery in 1879):
  2,174 t; 73.4 × 14.2 × 3.81 m; 2 shafts compound, 4 boilers, 2,000 ihp (1,491 kW), 12 kn;
  **4 × 300-pdr Whitworth RML in a central casemate (pivot)** + 2-pdr + several Nordenfelt/Hotchkiss MG; no
  torpedo documented; wrought-iron belt 114, casemate 114, deck 12.7; crew 185. `[SBN]` §6.11 / [NE] SINGLE-SOURCE.
- **Javary**-class coast-defence turret ships _Javary_ / _Solimões_ (Forges et Chantiers de la Méditerranée,
  France; 1874–75): **3,700 t; 73 × 17.7 × 3.75 m; armour midships & casemate 300–304, bow/stern 177–180,
  deck 76, CT 100; 2 steam engines, 2,500 hp (1,864 kW), 2 shafts, 11 kn; two twin turrets, 4 × 254 mm
  Whitworth RML, 2 × 37 mm Nordenfelt, 2 MG; crew 135.** Low freeboard, poor seakeeping — floating
  fortifications for sheltered water (Guanabara Bay). [NE] SINGLE-SOURCE (existence corroborated [NA86] p. 214).
- **Pará**-class river monitors (Arsenal de Marinha, Rio; 1867–68; _Pará_, _Rio Grande_, _Alagoas_, _Piauí_,
  _Ceará_, _Santa Catharina_): **490 t; 39.0 × 8.54 × 1.51 m; 2 HDA, 2 rectangular boilers, 180 hp (134 kW),
  8 kn; 1 × 163/23 Whitworth 120-pdr MLR (or 1 × 127/24 70-pdr MLR); iron belt 102–51, turret 152–76, deck 13;
  crew 43.** [NP] `br_bb_para` SINGLE-SOURCE.
- **Guanabara** wooden corvette (Rio; comp. 1.2.1879): **1,914 t; 61.0 pp × 12.6 × 5.41 m; 1 HSE, 3,000 hp
  (2,237 kW), 13 kn; 9 × 127/24 Whitworth 70-pdr MLR + 2 × 76/23 9-pdr MLR + 1 spar torpedo; crew 287.**
  [NP] `br_cr_guanabara` SINGLE-SOURCE.
- **Parnaíba** wooden sloop (Rio; comp. 1878): **742 t; 52.5 pp × 8.92 × 3.48 m; 1 HSE, 900 hp (671 kW),
  11.5 kn; 6 × 127/24 Whitworth 70-pdr MLR; crew 149.** [NP] `br_cr_parnaiba` SINGLE-SOURCE.
- **Trajano** wooden sloop (Rio; comp. 17.7.1873; designer Trajano A. de Carvalho): ~1,400 t; 61 × 9.4 × 4.6 m;
  Penn machinery 2,400 ihp (1,790 kW), 12 kn; 3 × 70-pdr Whitworth; mixed wood/iron/steel. [NE] SINGLE-SOURCE.
- **Piratini** (ex-_Destroyer_, John Ericsson, USA; launched 1878, purchased/renamed 10.1891): 165 t;
  39.6 × 5.18 × 2.70 m; 1 VSE, 1 locomotive boiler, 1,000 hp, 15 kn; iron breastwork 406; 2 × 37 mm Hotchkiss,
  1 Howell torpedo tube. [NP] `br_dd_piratini` SINGLE-SOURCE. (Purchased, not built in 1880 — see §G.)
- **Torpedo boats**: four purchased by 1879 ([NE]); the first Brazilian first-class steel boats _Núm.1–5_ were
  Yarrow-built and commissioned **1882** (40–52 t; 30.5–33.5 × 3.81 × 1.68 m; 500 hp; 20 kn; 1 × 37 mm
  Hotchkiss, 2 × 356 mm bow TT). [NP] `br_dd_no1` SINGLE-SOURCE.
- **Excluded (not in service Jan 1880):** _Riachuelo_ (comp. 19.11.1883), _Aquidabã_ (comp. 1887),
  _Almirante Tamandaré_ (1890–93), _Primeiro de Março_ (1881), _Almirante Barroso_ (1882). `[SBN]` §5; [NP].

## A.2b Grounded post-1880 hulls shaping the doctrine templates (not 1880 starters)

| ship / class                       | builder / date                       | key figures                                                                                                          | source | confidence |
| ---------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| Riachuelo (turret ironclad)        | Samuda, Poplar, UK; comp. 19.11.1883 | 5,610 t normal / 6,100 full; 93.0 pp × 15.9 × 5.99 m; 2 VC, 10 cyl boilers, 7,300 hp, 16.7 kn; compound belt 292–178, turrets 254, CT 254; **2 × 2 234/31 Armstrong BL**, 6 × 140/31 70-pdr Armstrong BLR, 15 × 37 mm, **5 × 356 TT (4 beam, 1 stern)**; crew 367 | [NP] `br_bb_riachuelo`; [NA86] p. 214 | SINGLE-SOURCE (armament/speed corroborated [NA86]) |
| Aquidabã (turret ironclad)         | Samuda, Poplar, UK; comp. 1887       | 4,921 t; 85.3 × 15.9 × 5.59 m; 2 IC, 8 cyl boilers, 6,500 hp, 15.8 kn; belt 292–178, turrets 254; 2 × 2 234/31, 4 × 140/31, 13 × 37 mm, 5 × 356 TT; crew 277 | [NP] `br_bb_aquidaba` | SINGLE-SOURCE |
| Almirante Barroso (composite corvette) | Rio Arsenal; launched 17.4.1882  | ~2,050 t; 71.25 × 10.97 × 5.10 m; ~2,200 hp + full rig, 12–13 kn; 6 × 70-pdr Whitworth (barbettes), 4 × 25 mm + 6 × 11 mm Nordenfelt; crew ~285 | [NE] | SINGLE-SOURCE |
| Almirante Tamandaré (protected cruiser) | Rio Arsenal; launched 20.3.1890    | 3,938 t; 95.9 × 14.43 × 6.02 m; 2 HTE, 7 boilers, 7,500 hp, 17 kn; 10 × 152 mm Armstrong QF, 2 × 120 mm, 10 × 47 mm Hotchkiss; deck 40, casemates 76, CT 51. **"notoriously unreliable"** — Brazil's inexperience with large steel hulls | [NE] | SINGLE-SOURCE |
| Marshal Deodoro (coast-defence BB) | F C de la Méditerranée, FR; 1898–1900 | 3,162 t; 81.5 × 14.4 × 4.19 m; 2 TE, 8 boilers, 3,400 ihp, 15 kn; 2 × 234 mm Armstrong, 4 × 120 mm, 6 × 57 mm, 2 × 450 mm TT | [NE] | SINGLE-SOURCE |

## A.3 Industrial capability

| item                            | figure / direction                                                                                                                                            | unit   | source                                    | confidence        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------- | ----------------- |
| Shipbuilding base               | state **Arsenal de Marinha da Corte (Rio de Janeiro)**, plus Salvador, Recife, Santos, Niterói, Pelotas; foreign yards Samuda (UK), Forges et Chantiers de la Méditerranée (FR), Laird (UK), John Ericsson (US), Yarrow (UK) | — | [NE] (arsenals list); [NP] builder fields | VERIFIED (direct) |
| Domestic build ceiling (actual) | largest *domestically built* warship by 1880: **Sete de Setembro 2,174 t** (Rio, 1874); by 1890: **Almirante Tamandaré 3,938 t** (Rio, 1890–93, unreliable). Modern capital ships **imported** (Riachuelo 5,610 t, UK) | t | [SBN]/[NP]; [NE]                          | SINGLE-SOURCE     |
| Build-time multiplier           | **slower**: small hand-worked arsenals; even the 1890 Tamandaré was riddled with workmanship defects. Propose **10500 bp** (range 10300–11200)              | ×10000 | ESTIMATE from completion slips; [NE]      | ESTIMATE / **BALANCE TARGET** |
| Cost modifier                   | **higher per hull**: imports attract freight/commission and prestige pricing (Tamandaré cost 3,700,000 réis; Barroso ~790,000$000). Propose **10500 bp** (range 10300–11000) | ×10000 | ESTIMATE; [NE]                            | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement      | **1880 ~2.2M / 1885 ~2.5M / 1890 ~4.0M kg** (domestic ceiling); **imported hulls bypass it** (Riachuelo 5,610 t, 1883)                                         | kg     | ESTIMATE from completed classes ([NE]/[NP]) | ESTIMATE        |
| Heavy-gun production            | **IMPORTED — Whitworth, Armstrong (UK), Krupp** (and Forges et Chantiers guns on French-built hulls); no domestic heavy-gun factory evidenced in-band        | —      | [NE]/[NP] armament fields                 | VERIFIED (direct) |
| Armour-plate production         | **IMPORTED** (inference): every 1880 in-service plate is wrought iron on an imported or arsenal-fitted hull; Riachuelo's compound plate was British. No [NE]/[NP] evidence of a Brazilian plate mill in-band | —      | [NE]/[NP]; ESTIMATE                       | ESTIMATE          |
| Machinery reliability           | foreign plant (Penn, Humphreys & Tennant, compound/VSE, cylindrical boilers) competent; *domestically built* large hulls unreliable (Tamandaré). Propose **8500 bp** | bp     | [NE]; plants.yaml (compound 8500)         | ESTIMATE / **BALANCE TARGET** |
| Construction-quality variance   | **HIGH**: Sete de Setembro obsolete/poorly manoeuvring; Tamandaré "design and workmanship difficulties". Propose **4400 bp**                                | bp     | [NE]; [SBN] §6.11                         | ESTIMATE / **BALANCE TARGET** |
| Budget (repo framing only)      | treasury 60, income 5, expenses 2; `researchBudget 4`; naval appropriation "moderate". **Not a historical source.**                                            | —      | `[REPO]` `economies.yaml`/`research.yaml` | framing, not grounding |

Direction of every multiplier is grounded (slower, costlier, lower-reliability, high-variance); the magnitude is
a balance choice inside the ±15 % band (as in the other national notes). Brazil is **import-dependent for guns
and armour** but has a genuine, small **domestic hull-construction and naval-architecture** capability.

## A.4 Doctrine

| field                         | Brazil position                                                                                              | source / basis                       | confidence                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ----------------------------- |
| preferred engagement distance | **short (~1,500–2,000 m)**: period practice; riverine/coastal, hand-worked RML/BLR, no rangefinders          | [NA86]; period contrast              | ESTIMATE / **BALANCE TARGET** |
| main-gun emphasis             | **few imported heavies per ship** (Sete de Setembro 4 × 300-pdr casemate; Javary 4 × 254 mm in 2 twins)      | [SBN]/[NP]/[NE]                      | SINGLE-SOURCE                 |
| secondary emphasis            | **medium Whitworth RML**: 127 mm 70-pdr, 163 mm 120-pdr, 76 mm 9-pdr; casemate/turret/broadside              | [NP] `br_bb_para`/`br_cr_*`          | SINGLE-SOURCE                 |
| gun-quality priorities        | buy the best available (Whitworth RML, then Armstrong BL/QF on the 1883+ ships); prestige-sensitive          | [NE]; [NA86] p. 214                  | SINGLE-SOURCE                 |
| AP-vs-HE preference           | **AP/common-dominant**, black-powder charges; the Riachuelo note stresses armour-piercing performance         | [NA86] p. 214; [PRE]                 | ESTIMATE / **BALANCE TARGET** |
| fire-control priority         | **nil in-band** (no rangefinder; Barr & Stroud is 1893)                                                       | components.yaml `rangefinder_optical`| DERIVED                       |
| rate of fire                  | slow: hand-worked RML heavy ~0.25–0.4 rds/min; light Hotchkiss/Nordenfelt 20–50 rds/min                       | [PRE] §5                             | ESTIMATE                      |
| torpedo priority              | **emerging**: 4 boats by 1879; Practical School of Torpedoes 1883; 356 mm tubes on the 1883/87 turret ships   | [NE]; [NP] `br_bb_riachuelo`         | SINGLE-SOURCE                 |
| protection: belt vs deck      | **belt + casemate + deck** wrought iron (Sete de Setembro 114/114/12.7; Javary 300–304 mid / 177–180 ends)    | [SBN]/[NP]/[NE]                      | SINGLE-SOURCE                 |
| propulsion                    | horizontal compound / vertical compound + cylindrical boilers; sails on the wooden cruisers                  | [NP] machinery fields; plants.yaml   | SINGLE-SOURCE                 |
| accommodation                 | SPARTAN–STANDARD (cramped monitors)                                                                          | [NE]; `[REPO]`                       | ESTIMATE                      |

**Doctrine line:** regional/riverine and coastal, short-range, few imported Whitworth/Armstrong heavies backed
by medium RMLs, wrought-iron belt+casemate protection, nascent torpedo arm, no fire control.

## A.5 Research priorities (canonical fields, priority 1–4)

Shipped draft: `research.yaml` `brazil` = `{}` (budget 4). Grounded recommendation (**ESTIMATE / BALANCE
TARGET** — a small, import-absorbing, prestige-driven service with a real but limited domestic design/hull
lineage; no field rises above 3):

| field             | priority | justification                                                                                            | source / basis                          | confidence          |
| ----------------- | -------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------- |
| HULL_CONSTRUCTION | 3        | composite wood/iron hulls built at Rio (Sete de Setembro, monitors, Tamandaré); the domestic capability   | [SBN]; [NP]; [NE]                       | ESTIMATE            |
| SHIP_DESIGN       | 3        | a genuine naval-architecture lineage (Napoleão Level, Trajano de Carvalho, João Cândido Brasil)           | [NE]                                    | SINGLE-SOURCE / ESTIMATE |
| INFRASTRUCTURE    | 3        | the binding constraint: small arsenals/docks cap domestic hull size; torpedo school/docks at Rio           | [NE]; `[REPO]`                          | ESTIMATE            |
| MACHINERY         | 3        | domestic compound machinery (Sete de Setembro; Penn for Trajano); but large plants still foreign          | [NP]; plants.yaml                       | ESTIMATE            |
| GUNNERY           | 2        | guns are imported (Whitworth/Armstrong); drill/prestige absorbing rather than domestic development        | [NE]/[NP] armament fields; [NA86]       | ESTIMATE            |
| TORPEDOES         | 2        | emerging: Practical School of Torpedoes 1883; imported boats and Whitehead tubes                          | [NE]; [NP] `br_dd_no1`                  | ESTIMATE            |
| MINES_AND_ASW     | 2        | riverine mine awareness from the Paraguayan War; no in-band programme (research preference only — DESIGN-55 guard) | ESTIMATE                        | ESTIMATE / **BALANCE TARGET** |
| DAMAGE_CONTROL    | 1        | minimal subdivision on the composite hulls                                                               | [NP]                                    | ESTIMATE            |
| FIRE_CONTROL      | 1        | no rangefinder in-band                                                                                    | components.yaml                         | ESTIMATE            |
| SUBMARINES        | 1        | no in-band submarine                                                                                      | `[CW]` relayed                          | SINGLE-SOURCE       |

> **DESIGN-55 guard.** MINES_AND_ASW and SUBMARINES are recorded as *research preferences* only. Any mine/
> submarine mechanic that is deferred/unaccepted must not be treated as reachable content in this profile.

> **Reconciliation note.** The shipped `research.yaml` leaves `fieldPriorities` empty. The grounded reading
> proposes HULL_CONSTRUCTION / SHIP_DESIGN / INFRASTRUCTURE / MACHINERY at 3. The difference is a **BALANCE
> TARGET / content decision** for the orchestrator, not a fact this note can settle.

---

# B. Component access (shared families)

Status ∈ DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED | UNAVAILABLE. The catalogue's gun families
are British RMLs/BLs, the French 27 cm and the German (Krupp) 26 cm; Brazil's signature Whitworth RMLs and
Armstrong BL/QF guns are **IMPORTED** and overlaid on the nearest family with a calibre/shell override (§C).
Other nations' signature domestic heavies are UNAVAILABLE (per the brief).

| family id                                             | status       | producer / note                                                                                            | source                                  | confidence    |
| ----------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------- |
| `gun_rml_10in_18ton`                                  | **IMPORTED** | **Whitworth 10-in (254 mm) RML** — Javary-class turret main                                                 | [NP] `br_bb_riachuelo` / [NE] Javary    | SINGLE-SOURCE |
| `gun_rml_10in_18ton_broadside`                        | **IMPORTED** | **Whitworth 300-pdr RML** — Sete de Setembro casemate main (secondary-tagged family)                        | [SBN] §6.11; [NE]                       | SINGLE-SOURCE |
| `gun_rml_64pdr_71cwt`                                 | **IMPORTED** | **Whitworth 120-pdr (163 mm) RML** / **70-pdr (127 mm) RML** — Pará monitors, Guanabara, Parnaíba, Trajano | [NP] `br_bb_para`/`br_cr_*`             | SINGLE-SOURCE |
| `gun_rml_7in_7ton`                                    | **IMPORTED** | overlay for medium Whitworth BLR on the composite cruisers (bore approx.)                                   | [NE]                                    | SINGLE-SOURCE |
| `gun_bl_92in_315`                                     | **IMPORTED** | **Armstrong 234 mm (9.2-in)/31 BL** — Riachuelo & Aquidabã main (1883/87)                                   | [NP] `br_bb_riachuelo`; [NA86] p. 214   | SINGLE-SOURCE |
| `gun_bl_6in_26`                                       | **IMPORTED** | **Armstrong 140 mm (70-pdr) BLR** — Riachuelo/Aquidabã secondary                                            | [NP] `br_bb_riachuelo`                  | SINGLE-SOURCE |
| `gun_qf_6in_40`                                       | **IMPORTED** | Armstrong 152 mm QF — Almirante Tamandaré (1890s)                                                           | [NE]                                    | SINGLE-SOURCE |
| `gun_qf_47in`                                         | **IMPORTED** | Armstrong/Hotchkiss 120 mm — post-band cruisers                                                             | [NE]                                    | SINGLE-SOURCE |
| `gun_qf_12pdr`, `gun_qf_6pdr`                         | **IMPORTED** | Hotchkiss 57/76 mm — Marshal Deodoro and later ships                                                        | [NE]                                    | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr`                                  | **IMPORTED** | **Hotchkiss 37 mm** — torpedo boats, upper decks                                                            | [NP] `br_dd_piratini`/`br_dd_no1`       | SINGLE-SOURCE |
| `gun_nordenfelt_1in`                                  | **IMPORTED** | **Nordenfelt 25 mm / 11 mm** — Sete de Setembro, Javary, Almirante Barroso                                  | [SBN] §6.11; [NE]                       | SINGLE-SOURCE |
| `gun_maxim_303`                                       | IMPORTED     | Maxim .303, post-band                                                                                       | [NE]                                    | UNVERIFIED    |
| `tube_14in_above_water`                               | **IMPORTED** | **356 mm Whitehead**, above-water/beam (Riachuelo/Aquidabã 4 beam; Núm.1 bow)                              | [NP] `br_bb_riachuelo`/`br_dd_no1`      | SINGLE-SOURCE |
| `tube_14in_submerged`                                 | **IMPORTED** | **356 mm Whitehead**, submerged stern (Riachuelo/Aquidabã 1 stern)                                          | [NP] `br_bb_riachuelo`                  | SINGLE-SOURCE |
| `gun_bl_274mm_m1875`, `gun_bl_263mm_rkl20`            | UNAVAILABLE  | French 27 cm / German 26 cm signatures                                                                      | brief (rule)                            | rule          |
| `gun_bl_12in_25`, `gun_bl_135in_30`, `gun_bl_12in_35`, `gun_bl_10in_32` | UNAVAILABLE | British BL signatures not in Brazilian service                                     | brief (rule)                            | rule          |
| `gun_rml_16in_80ton`, `gun_rml_12in_35ton`, `gun_rml_12in_25ton`, `gun_rml_11in_25ton`, `gun_rml_8in_9ton` | UNAVAILABLE | British RMLs not in Brazilian service (overlay only where §C names it)         | —                                       | rule          |

`hardCapabilities` (recommended): `maxGunCaliberUm` **254000** (Javary 10-in Whitworth; Sete de Setembro's
300-pdr bore is ~229–254 mm UNVERIFIED); `maxArmourThicknessUm` **304000** (Javary casemate 300–304 mm,
imported); `domesticTorpedoDiameterUm` **356000** (imported Whitehead); `hullForms`
`[torpedo_boat_form, protected_cruiser_form, coast_defence_form, pre_dreadnought_form, merchant_liner_form]`;
`domesticPlants` `[compound_cylindrical]` (TE gated to 1885; locomotive boiler 1890).

---

# C. National component variants (~15)

Each row overlays one shared family with a Brazilian designation, a sourced (or explicitly ESTIMATE) shell
mass/parameter set, and a `mounts` list. Mounts ∈ TURRET | BARBETTE | CASEMATE | DECK_SHIELDED | DECK_OPEN |
BROADSIDE_BATTERY. Shell masses from [PRE] §5 where the British RML family value applies; otherwise ESTIMATE
by bore (the sources give the bore/designation, not the projectile weight).

| family id                        | Brazilian model                                             | shell / params (override)                                                          | mounts                          | source                                                   | confidence |
| -------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------- | ---------- |
| `gun_rml_10in_18ton`             | **Whitworth 10-in (254 mm) RML** — Javary turret main        | cal 254000; shell 181400 g (family); charge ~31800 g; MV ~420 m/s (EST); ROF ~0.4    | TURRET, BARBETTE                | [NP] `br_bb_riachuelo`; [NE] Javary; [PRE] §5            | SINGLE-SOURCE (cal/shell); charge/MV ESTIMATE |
| `gun_rml_10in_18ton_broadside`   | **Whitworth 300-pdr RML** (~229–254 mm EST) — Sete de Setembro | cal ~229000 (UNVERIFIED); shell ~136000 g (300 lb); charge EST; ROF ~0.33          | CASEMATE, BROADSIDE_BATTERY     | [SBN] §6.11; [NE]                                        | SINGLE-SOURCE (300-pdr); bore/shell ESTIMATE |
| `gun_rml_64pdr_71cwt`            | **Whitworth 120-pdr (163 mm) RML** — Pará monitors            | cal 163000; shell ~54400 g (120 lb); charge EST; ROF ~0.33                          | CASEMATE, DECK_SHIELDED         | [NP] `br_bb_para`                                        | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_rml_64pdr_71cwt`            | **Whitworth 70-pdr (127 mm) RML** — Guanabara / Parnaíba / Trajano | cal 127000; shell ~31700 g (70 lb); charge EST; ROF ~0.4                        | BROADSIDE_BATTERY, DECK_OPEN    | [NP] `br_cr_guanabara`/`br_cr_parnaiba`; [NE] Trajano     | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_rml_7in_7ton`               | **Whitworth 120-pdr BLR** (178 mm approx.) — composite cruisers | cal 178000; shell 52200 g (family); charge 13600 g; MV 476 m/s; ROF ~0.8          | BROADSIDE_BATTERY, DECK_OPEN    | [NE]; [PRE] §5                                           | SINGLE-SOURCE (cal) / ESTIMATE |
| `gun_bl_92in_315`                | **Armstrong 234 mm (9.2-in)/31 BL** — Riachuelo / Aquidabã main | cal 234000; shell 172000 g (family); charge 74 kg; MV 629 m/s; ROF ~1              | TURRET                          | [NP] `br_bb_riachuelo`/`br_bb_aquidaba`; [NA86] p. 214    | SINGLE-SOURCE |
| `gun_bl_6in_26`                  | **Armstrong 140 mm (70-pdr) BLR** — Riachuelo / Aquidabã secondary | cal 140000; shell ~31700 g (70 lb); charge EST; ROF ~1                         | DECK_SHIELDED, CASEMATE         | [NP] `br_bb_riachuelo`; [NA86] p. 214                    | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_6in_40`                  | **Armstrong 152 mm QF** — Almirante Tamandaré                 | cal 152000; shell 45000 g (family); charge 13.5 kg; MV 574–680 m/s; ROF 5–7        | DECK_SHIELDED, CASEMATE         | [NE]                                                     | SINGLE-SOURCE |
| `gun_qf_47in`                    | **Armstrong / Hotchkiss 120 mm** — post-band cruisers         | cal 120000; shell 20400 g (family); charge 5.4 kg; MV 544–648 m/s; ROF 5–6         | DECK_OPEN, DECK_SHIELDED        | [NE]; family                                             | SINGLE-SOURCE |
| `gun_qf_6pdr`                    | **Hotchkiss 57 mm** — Marshal Deodoro                         | cal 57000; shell 2720 g (family); ROF 12                                           | DECK_OPEN                       | [NE]; family                                             | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr`             | **Hotchkiss 37 mm** — torpedo boats / upper decks            | cal 47000; shell 1500 g (family); ROF ~20                                          | DECK_OPEN                       | [NP] `br_dd_piratini`/`br_dd_no1`; family                | SINGLE-SOURCE |
| `gun_nordenfelt_1in`             | **Nordenfelt 25 mm / 11 mm** — casemate & deck MG            | cal 25000; bullet 206 g (family); ROF high                                         | DECK_OPEN                       | [SBN] §6.11; [NE]; family                                 | SINGLE-SOURCE |
| `gun_maxim_303`                  | **Maxim .303** — post-band light MG                          | cal 8000; bullet 14 g (family); ROF ~250                                           | DECK_OPEN                       | [NE]; family                                              | UNVERIFIED    |
| `tube_14in_above_water`          | **356 mm Whitehead, above-water/beam** — Riachuelo/Aquidabã (4 beam); Núm.1 (bow) | bore 356000; trainable carriage           | — (ABOVE_WATER_TRAINABLE)       | [NP] `br_bb_riachuelo`/`br_dd_no1`                       | SINGLE-SOURCE |
| `tube_14in_submerged`            | **356 mm Whitehead, submerged stern** — Riachuelo/Aquidabã   | bore 356000; fixed stern                                                           | — (UNDERWATER_FIXED)            | [NP] `br_bb_riachuelo`/`br_bb_aquidaba`                  | SINGLE-SOURCE |

Notes:
- The **300-pdr Whitworth** bore is not stated by [NE]/[SBN]; the historical Whitworth 300-pdr was ~9–10 in.
  It is recorded as **~229 mm (UNVERIFIED)** and overlaid on the 10-in family with a calibre override — a
  mechanism/bore mismatch surfaced as deferred (§G).
- All shell masses except the British RML family values are **ESTIMATE**. A clean Mackinlay Table XVII read
  or a Brazilian ordnance list would upgrade them.
- The Brazilian tubes are **356 mm (14-in)**, matching the catalogue's own model on the 1883+ ships; they are
  **not** in 1880 service.

---

# D. Six 1880 opening designs (B, CA, CL, DD, KE, AMC)

All are legal 1880-01 **DOCTRINE_TEMPLATE** starting points, not historical reconstructions (the historical
hulls are in §A.2). The B, CA and CL shapes are grounded in historical ships/lines (Sete de Setembro / Javary;
Riachuelo lineage; Guanabara / Parnaíba); DD/KE/AMC are doctrine templates grounded in Brazilian practice.
**Moulded depth is UNVERIFIED for every Brazilian ship** — `depthToMainDeck` is ESTIMATE throughout. Plant:
`compound_cylindrical` (the only 1880 plant in `plants.yaml`; min 300 kW, max 8,000 kW). The
`locomotive_boiler_tb` plant is dated 1890 and is a **content gap** for an 1880 torpedo boat (same gap flagged
in the Japan/AH/Qing notes). Brazil had no ironclad **in service** in 1880-01 and no purpose-built torpedo
boat until 1882; both slots are doctrine templates.

| slot | shape / inspiration (source)                              | hull form               | Lwl/B/T (mm)             | depth (mm) | displ (kg) | plant / kW                | fuel (kg) | main / secondary                                                                  | armour scheme                                                   | doctrine note |
| ---- | --------------------------------------------------------- | ----------------------- | ------------------------ | ---------- | ---------- | ------------------------- | --------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------- |
| **B**  | Sete de Setembro composite casemate ironclad (1874) [SBN]/[NE] | coast_defence_form  | 73,400 / 14,200 / 3,810  | 8,000 EST  | 2,174,000  | compound_cylindrical / 1,491 | 200,000   | 4 × `gun_rml_10in_18ton_broadside` (300-pdr) CASEMATE; 4 × `gun_nordenfelt_1in`   | belt 114 + casemate 114 + deck 12.7 wrought iron (imported plate) | composite wood/iron casemate ironclad; the Paraguayan-War river/coast heritage |
| **CA** | Riachuelo-lineage turret ironclad (ordered 1881, comp. 1883) [NP]/[NA86] | coast_defence_form | 93,000 / 15,900 / 5,990 | 9,500 EST | 5,610,000 | compound_cylindrical / 3,000 | 400,000 | 4 × `gun_rml_10in_18ton` (254 mm, EST for 234 mm) in 2 twin TURRET; 6 × `gun_rml_64pdr_71cwt` | belt 292–178 + turret 254 (imported compound; modeled wrought iron) | imported steel turret ship; ram bow, four turrets en échelon, torpedo-armed (post-1880 target) |
| **CL** | Guanabara wooden corvette (1879) [NP]                     | protected_cruiser_form  | 61,000 / 12,600 / 5,410  | 7,500 EST  | 1,914,000  | compound_cylindrical / 1,400 | 394,000   | 9 × `gun_rml_64pdr_71cwt` (127 mm 70-pdr) BROADSIDE; 2 × 9-pdr; 1 spar torpedo    | nil (wooden hull)                                               | wooden rigged screw corvette; station/South-Atlantic cruising and training |
| **DD** | Núm.1-class torpedo boat (Yarrow, 1882) [NP]              | torpedo_boat_form       | 33,500 / 3,810 / 1,680   | 2,800 EST  | 52,000     | compound_cylindrical / 400 | 8,000     | 1 × `gun_hotchkiss_3pdr`; 2 × `tube_14in_above_water` (356 mm bow TT)              | nil                                                             | steel first-class TB bought from Yarrow; Brazil's torpedo arm is imported and did not exist in 1880 |
| **KE** | Primeiro de Março / Pará-lineage station gunboat (1878–81) [NP]/[NE] | coast_defence_form | 52,500 / 8,920 / 3,480 | 5,200 EST | 742,000  | compound_cylindrical / 500 | 130,000   | 6 × `gun_rml_64pdr_71cwt` (127 mm 70-pdr) BROADSIDE; 2 × `gun_nordenfelt_1in`     | nil / light iron shield only                                    | shallow-draught river/station gunboat and sloop for the Amazon and Plate |
| **AMC**| Coffee/rubber trade liner taken up from trade [NE]/[REPO] | merchant_liner_form     | 115,000 / 14,000 / 3,500 | 8,000 EST  | 3,500,000  | compound_cylindrical / 2,600 | 900,000   | 4 × `gun_rml_64pdr_71cwt` (127 mm) DECK_OPEN; 2 × `gun_nordenfelt_1in`             | none (hull only)                                                | armed ocean liner (doctrine template; Brazil's merchant marine was growing but no armed-liner series is grounded) |

Block coefficients (ESTIMATE, `blockCoeffBp` ×10000): B ≈ 6900 (derived: 2,174 t / (1.025 × 73.4×14.2×3.81));
CA ≈ 6200 (5,610 t / (1.025 × 93×15.9×5.99)); CL ≈ 5600; DD ≈ 4400 (game convention; computed ≈1500 is
unreliable at this scale, as in the Russia/AH/Qing notes); KE ≈ 5000; AMC ≈ 6100. All six are ESTIMATE for
dimensions, power and armour; the B, CA and CL shapes are grounded in the historical ships named.

> **B-armament caveat.** The historical Sete de Setembro mounted **four 300-pdr Whitworth RML** in a casemate.
> The catalogue has no 300-pdr family, so the B template uses the nearest Brazilian-available heavy
> (`gun_rml_10in_18ton_broadside`, 254 mm) with a calibre override. A dedicated Whitworth 300-pdr family (or a
> confirmed bore) is the correct fix and is surfaced as deferred (§G).

---

# E. Recommendations (concrete profile values, non-normative)

| profile field | Brazil candidate | basis | label |
| --- | --- | --- | --- |
| `strategicSituation` postures | `[regional_warfare, coastal_defence]` (+ weak `distant_water_operations`, `commerce_defence`, `torpedo_warfare`) | §A.1 | grounded shape (VERIFIED/SINGLE) |
| `industrialProfile.buildTimeMultiplierBp` | 10500 (range 10300–11200) | small hand-worked arsenals | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.costMultiplierBp` | 10500 (range 10300–11000) | imports + prestige pricing | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.machineryReliabilityBp` | 8500 | foreign plant; unreliable domestic hulls | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.constructionQualityVarianceBp` | 4400 | Sete de Setembro obsolete; Tamandaré defects | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.maxPracticalDisplacementKg` (1880/1885/1890) | 2.2M / 2.5M / 4.0M (domestic; imported bypasses) | Sete de Setembro 2,174 t; Riachuelo 5,610 t (imported) | ESTIMATE |
| `industrialProfile.heavyGunProduction` | IMPORTED (Whitworth/Armstrong/Krupp) | [NE]/[NP]; [NA86] | grounded |
| `industrialProfile.armourPlateProduction` | IMPORTED | [NE]/[NP]; ESTIMATE | ESTIMATE |
| `doctrineProfile.engagementRangeM` | 1750 | short period range | ESTIMATE / grounded shape |
| `doctrineProfile.hePreferenceBp` | 4000 (AP/common, black powder) | [NA86] p. 214; [PRE] | ESTIMATE / **BALANCE TARGET** |
| `researchPreferences` | HULL 3, SHIP_DESIGN 3, INFRASTRUCTURE 3, MACHINERY 3, GUNNERY 2, TORPEDOES 2 (see §A.5) | §A.5 | grounded shape / ESTIMATE |
| `componentAccess` | §B (imports; foreign heavies UNAVAILABLE) | §B | grounded shape |
| `gunModels` / `componentVariants` | §C (~15 rows) | §C | mixed per row |
| `designs` | §D (6) | §D | mixed per row; ESTIMATE |
| `namingPolicy` | §F | published names | grounded (SINGLE-SOURCE) |
| `hardCapabilities.maxGunCaliberUm` | 254000 (Javary 10-in Whitworth) | §B | SINGLE-SOURCE |
| `hardCapabilities.maxArmourThicknessUm` | 304000 (Javary casemate) | [NE]/[NP] | grounded |
| `hardCapabilities.domesticTorpedoDiameterUm` | 356000 (imported Whitehead) | [NP] | grounded |

Keep every cost/build-time modifier inside **±15 %** and label it BALANCE TARGET; ship every ESTIMATE/
UNVERIFIED with its label (the merchant-liner discipline). The proposed multipliers sit near the centre of the
band (Brazil is slower/costlier than Britain but less extreme than Qing).

---

# F. Naming policy

Published 1880s Brazilian ship names as stems (historical facts; cited to [NE] and [NP] class pages).

| type    | convention (one line)                                                                                  | stems (published names)                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **B**   | national dates and battle names, plus river/province names                                              | Sete de Setembro (7 Sept 1822 independence), Independência, Riachuelo (battle), Aquidabã, Javary, Solimões                                       |
| **CA**  | battle/province names, same series as the capital ships                                                  | Riachuelo, Aquidabã, Independência, Tamandaré (admiral)                                                                                         |
| **CL**  | provinces, rivers and naval heroes/designers                                                            | Guanabara, Parnaíba, Trajano, Niterói, Primeiro de Março, Almirante Barroso, Imperial Marinheiro                                                |
| **DD**  | early boats numbered; later boats indigenous/river names                                                | Núm.1–Núm.5; Tamborim, Sabino Vieira, Alpha, Araguari, Moxotó, Potí, Inhanduá, Goiás                                                             |
| **KE**  | Brazilian provinces and rivers                                                                          | Pará, Rio Grande, Alagoas, Piauí, Ceará, Santa Catharina, Primeiro de Março                                                                     |
| **AMC** | names taken up from trade (coffee/rubber liners); no dedicated naval series in-band                     | (no naval series grounded in-band — UNVERIFIED)                                                                                                 |

All stems are SINGLE-SOURCE (published ship lists, [NE]/[NP]); the AMC series is **UNVERIFIED**. A full curated
dataset (diacritics, collision handling) is content authoring, not research.

---

# G. Deferred (needs an owner or a decision-request)

- **Whitworth 300-pdr RML family (the Sete de Setembro heavy).** No shared family and the bore is not stated by
  [NE]/[SBN] (historical ~9–10 in). The B template overlays a 254 mm family with an override. A dedicated family
  or a confirmed bore (Conway's Brazilian chapter) is needed. **This is the biggest gap for a Brazilian capital ship.**
- **Whitworth medium-bore families.** The 127 mm 70-pdr and 163 mm 120-pdr Whitworth RMLs, and the 140 mm
  Armstrong BLR, have no dedicated family; this note overlays the nearest family with a calibre override
  (mechanism mismatch). Confirm multiple models per family are legal, or add dedicated families.
- **Shell masses** for every gun except the British RML family values are ESTIMATE (the sources give the bore/
  model, not the projectile weight). A clean Mackinlay Table XVII read or a Brazilian ordnance list would upgrade.
- **Moulded depth for every design** — no source gives it; depths are ESTIMATE.
- **Pre-1880 torpedo-boat plant.** The 1882 Núm.1 used a vertical compound + cylindrical boiler; the
  catalogue's `locomotive_boiler_tb` is dated 1890 and `compound_cylindrical` is heavier. A legal 1880 DD
  starter is only a scaled approximation (surface).
- **`maxPracticalDisplacementKg` semantics** — does the ceiling gate *domestic build* only (then the imported
  Riachuelo 5,610 t is legal) or all construction? Surface; do not resolve.
- **Armour-plate and heavy-gun production = IMPORTED** are inferences (absence of evidence in [NE]/[NP] of
  domestic mills/factories), not sourced statements that none existed. A Conway's Brazil chapter would settle it.
- **Brazilian budget / yard capacity.** No réis budget, yard return or dock table was opened; the `[REPO]`
  figures (treasury 60, income 5, expenses 2, researchBudget 4) are **repo framing, not historical**.
- **Build-time/cost/reliability/variance multipliers** — BALANCE TARGET (no single sourced Brazilian multiplier).
- **`research.yaml` priority gap** — shipped `fieldPriorities` empty vs this note's HULL/ SHIP_DESIGN/
  INFRASTRUCTURE/ MACHINERY at 3. A content/balance decision, not a fact.
- **CA/DD/AMC are doctrine templates** — Brazil had no armoured cruiser and no torpedo boat in service in
  1880; only the B (Sete de Setembro), the CL (Guanabara/Parnaíba) and the KE (Primeiro de Março/Pará) are
  true 1880-associated ships. Confirm fictional-but-legal starters are acceptable (the existing
  `reference-designs.yaml` already does this for the other nations).
- **Naming dataset** — stems listed; a full curated dataset is content authoring, deferred to the spec/implementator.

No `docs/OPEN-ISSUES.md` decision was resolved here; any mine/submarine research preference is DESIGN-55-guarded.

---

# H. Verdict

**Qualified yes — the Brazil profile is authorable now, with per-figure labels.**

- **Strongly grounded (read directly):** the *shape* — a stable regional power with the largest South
  American navy, a Paraguayan-War river/coast ironclad heritage, no blue-water battle fleet in 1880, and
  import dependence for modern ships, guns (Whitworth/Armstrong/Krupp) and armour — rests on the directly-read
  [NE] article, the directly-read [NP] class pages (with builder and armament fields), the directly-read
  [NA86] p. 214 (Riachuelo's armament, speed and trial data), and `[SBN]` §6.11 (Sete de Setembro).
- **Grounded gun data:** the 10-in (254 mm) and 300-pdr Whitworth RMLs, the 127 mm 70-pdr and 163 mm 120-pdr
  Whitworth RMLs, the 234 mm Armstrong main and 140 mm Armstrong BLR of the 1883/87 turret ships, and the
  356 mm Whitehead tubes are [NP]/[NE]-sourced; the British RML family shell masses carry [PRE] §5.
- **What is ESTIMATE/BALANCE TARGET and must be labelled as such:** every industrial multiplier, the
  max-displacement progression, construction-quality variance, all research weights, most shell masses, and
  the CA/DD/AMC (and B-armament) templates. These are gameplay abstractions on a grounded shape.
- **What is genuinely missing:** the Whitworth 300-pdr family (the signature heavy), the Whitworth medium
  families, Brazil's budget/yard data, moulded depths, and the exact canonical research-field enum. None
  blocks a first profile; each is a labelled deferred item or a decision-request.

Recommendation to the orchestrator: author the profile now with the values in §E; ship every ESTIMATE/UNVERIFIED
figure with its label and a provenance record; keep all multipliers inside ±15 % and labelled BALANCE TARGET;
and raise a decision-request for the Whitworth 300-pdr family (and the Whitworth medium overlays) before
authoring Brazilian capital-ship armament beyond the 254 mm shape.

## Source list

1. naval-encyclopedia.com, "The Imperial Brazilian Navy" (`industrial-era/the-imperial-brazilian-navy.php`),
   read directly this session (Sete de Setembro, Javary/Solimões, Pará, Trajano, Guanabara, Parnaíba,
   Almirante Barroso, Primeiro de Março, Riachuelo/Aquidabã, Tamandaré, Marshal Deodoro) — states "Source:
   Conway's … 1860-1905".
2. navypedia.org Brazilian pages, read directly this session: `brazil/br_index.htm`, `br_bb.htm`, `br_cr.htm`,
   `br_dd.htm`, `br_bb_riachuelo.htm`, `br_bb_aquidaba.htm`, `br_bb_para.htm`, `br_cr_guanabara.htm`,
   `br_cr_parnaiba.htm`, `br_dd_piratini.htm`, `br_dd_no1.htm`.
3. T. A. Brassey (ed.), _The Naval Annual 1886_ (1st volume), archive.org `navalannual1886` — "Notes on the
   Brazilian Navy" p. 214 and the "Brazilian Ships" plate, read directly.
4. `docs/research/ship-building-1880-ships-by-nation.md` §5/§6.11 (in-repo).
5. `docs/research/ship-building-1880-pre-era-armament.md` §5 (in-repo).
6. Print works named as leads (not opened): Conway's _All the World's Fighting Ships 1860–1905_ (1979);
   _Warship_ 1999–2000, "Brazilian Imperial Navy Ironclads 1864–1874" (George A. Gratz); Prado Maia,
   _A Marinha de Guerra do Brasil na Colônia e no Império_.
