# Research: national naval profile — Qing Dynasty (China, 1880–1899)

Companion to `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
`italy-naval-profile.md`, `japan-naval-profile.md`, `russia-naval-profile.md`,
`usa-naval-profile.md`, `austria_hungary-naval-profile.md`; method, source grades and confidence labels are
identical (VERIFIED / SINGLE-SOURCE / DERIVED / ESTIMATE / UNVERIFIED; **Wikipedia is not cited anywhere**).
Authored for the `qing` (canonical `NationNavalProfile`) of the `scen_1880` national-naval initiative
(`docs/ships-nation-orientation.md`, ADR-0088/0089 line of work). This is a **research-only** pass: no code, no
content YAML and no spec is authored here. Captured 2026-10-11.

## 0. Question

What are the grounded figures and national differentiators needed to author a **date-banded `NationNavalProfile`
(1880–1899)** for the **Qing Dynasty** (repo id `qing`, canonical `NationNavalProfile`), plus ~12 shared-family
national models and six 1880 opening reference designs (B, CA, CL, DD, KE, AMC), with component access, research
priorities and naming policy?

This note answers that; it does **not** author the profile. The shipped draft is
`content/production/1880/research.yaml` (`qing` = `GUNNERY: 2`, `researchBudget 8`), `countries.yaml`
(`id: qing`, "regional fleets, Beiyang dominant") and `economies.yaml` (treasury 100, income 9, expenses 4). The
in-service 1880 hulls were already collected in
`docs/research/ship-building-1880-ships-by-nation.md` §6.6 and are **reused, not re-derived**, here.

## 1. Method, source grades and confidence labels

Every figure carries a named source and one of: **VERIFIED** (read directly in a period/near-primary text, or two
independent sources agree); **SINGLE-SOURCE** (one source, or a secondary compilation citing print works I could
not open); **DERIVED** (arithmetic from a sourced figure); **ESTIMATE** (derived/inferred by me; not itself a
source figure); **UNVERIFIED** (no usable source, or sources conflict; a range is given). **Wikipedia is not cited
as a source anywhere.** (The older `p1-1880-torpedo-armament.md` cites Wikipedia; the Qing rows are re-grounded
here from navypedia.)

| Tag    | Source                                                                                                                                                                                                                                                    | Grade / reach                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [NP]   | navypedia.org Chinese class pages (Ivan Gogin), built principally on Conway's _All the World's Fighting Ships 1860–1905_ + national histories. **Fetched directly this session** (slugs in §Sources).                                                       | Secondary compilation → SINGLE-SOURCE.                                                              |
| [NA86] | T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`, full text `NavalAnnual1886_djvu.txt` **read directly this session** ("Notes on the Chinese Navy—Armoured and Unarmoured Ships", p. 219; turning-power table p. 289). | Contemporary annual = period near-primary. **Read directly → VERIFIED for figures actually read.** |
| [SBN]  | `docs/research/ship-building-1880-ships-by-nation.md` §6.6 (Wei Yuen; Fei Ting). **In-repo, already grounded.**                                                                                                                                          | Reused; confidence as carried in that note.                                                         |
| [PRE]  | `docs/research/ship-building-1880-pre-era-armament.md` §5 (British RML shell/charge/MV values). **In-repo.**                                                                                                                                                | Reused; SINGLE-SOURCE.                                                                               |
| [REPO] | Shipped content (`countries.yaml`, `possessions.yaml`, `economies.yaml`, `research.yaml`, `fleets.yaml`). **Not a historical source** — repo framing only.                                                                                                  | Framing, not grounding.                                                                             |
| [CW]   | Conway's _All the World's Fighting Ships 1860–1905_ (1979). **Not opened this session**; relayed only via [NP].                                                                                                                                            | Print secondary; SINGLE-SOURCE (relayed) where [NP] relays it.                                      |

Limits: Conway's was not reachable; [NP] is a single compilation, so nearly every ship figure is SINGLE-SOURCE.
**No Chinese naval budget (taels), yard return or dock-capacity table was opened** — the 1886 annual has a Chinese
ordnance/programme note but no Chinese estimates chapter. The industrial multipliers, research weights and design
weights below are therefore explicit **BALANCE TARGET / ESTIMATE**, not measurements. Moulded depth is not given by
[NP] for any Chinese ship (UNVERIFIED), as in the UK/France/Germany/Italy/Japan/Russia/AH notes.

Conversions: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 ihp = 0.7457 kW; 1 kn = 0.5144 m/s;
1 ft = 0.3048 m. Qing ship names appear in both pinyin and Wade-Giles transliterations in the sources (Dingyuan =
Ting Yuen; Zhenyuan = Chen Yuen; Chaoyong = Tshao-Yong; Yangwei = Yang Wai); both are recorded.

---

# A. National naval profile (1880–1899)

1880 Qing China is a **vast, fiscally fragmented empire modernising by import under the Self-Strengthening
Movement**: modern warships are bought abroad (Armstrong/Mitchell in Britain; Vulcan/Howaldt in Germany) and the
domestic arsenals (Foochow, Jiangnan/Kiangnan) build small composite and steel hulls under foreign direction. The
navy is **not one service but regional fleets** — Peiyang/Beiyang (Weihaiwei/Taku), Nanyang (Shanghai), Foochow and
Kwangtung — with Beiyang dominant; authority, finance and doctrine sit with regional viceroys, not the court
(`[REPO]` `countries.yaml`). In January 1880 there is **no ironclad in service** (Dingyuan, ordered 1880, completed
1885) — only composite sloops and Rendel flatiron gunboats. Posture is **coastal/regional defence with no
blue-water ambition and near-total import dependence**.

## A.1 Strategic posture

| posture                        | applies?          | justification (one line)                                                                                                                                                                 | source                                | confidence        |
| ------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------- |
| coastal_defence                | **primary**       | the fleet's stated doctrine is coastal defence, Bohai-Gulf security and treaty-port defence; all 1880 hulls are coastal gunboats/sloops, not ocean ironclads. `[REPO]` doctrine.schools `[coastal_defense]`. | `[REPO]` `countries.yaml`; [NP]       | VERIFIED (in-repo) / SINGLE-SOURCE |
| regional_warfare               | **primary**       | four regional fleets (Peiyang, Nanyang, Foochow, Kwangtung) fighting their own waters; the fleet's purpose is Korea/Vietnam tributary and Yellow-Sea security, not power projection.        | `[REPO]` `countries.yaml`; [NP] builder/project notes | VERIFIED (in-repo) / SINGLE-SOURCE |
| distant_water_operations       | **weak**          | no station empire and no foreign squadron; cruisers are built for the Nanyang/Foochow regional commands (Nan Shui, Kai Chi) with riverine/coastal roles.                                 | [NP]; `[REPO]`                        | SINGLE-SOURCE     |
| torpedo_warfare                | **weak / emerging** | **no torpedo craft in service in 1880** — the first boats (Lei Fu/Lei Lung) were built by Vulcan, Bremen, in 1884; torpedo tubes appear on the 1884 Nanyang cruisers. Aspiration, not capability. | [NP] ch_dd_lei_fu / ch_cr_kai_chi / ch_cr_nan_shui | VERIFIED (builder dates) |
| commerce_defence               | **weak**          | a small steam merchant marine (China Merchants Steam Navigation Co., founded 1872) and treaty-port shipping exist, but trade protection is not a stated naval task.                     | `[REPO]`; ESTIMATE                    | ESTIMATE          |
| battle_fleet_concentration     | **very weak / aspirational** | no ironclad in service 1880; the Dingyuan/Zhenyuan pair (Vulcan, Stettin) was ordered in 1880 and completed 1885. A battle line is planned, not held.                               | `[SBN]` §5/§6.6; [NA86] p. 219        | VERIFIED (dates) / SINGLE-SOURCE |
| commerce_raiding               | **no**            | not an 1880 Qing doctrine; the navy is defensive/coastal and import-dependent, not a guerre-de-course service.                                                                          | reasoning                             | ESTIMATE          |
| colonial_presence              | **no**            | `possessions.yaml` has only the four Chinese coastal/estuary areas; Korea/Vietnam are tributary, not colonies, and no coaling-station empire exists.                                     | `[REPO]` `possessions.yaml`           | VERIFIED (in-repo) |

**Recommended primary postures: `coastal_defence` + `regional_warfare`**, with `distant_water_operations` and
`torpedo_warfare` weak/emerging, `commerce_defence` weak, and `battle_fleet_concentration` very weak/aspirational.
`commerce_raiding` and `colonial_presence` are **not** 1880 Qing postures. The defining differentiator is not a
posture at all but **institutional fragmentation + import dependence** (`[REPO]` `countries.yaml`
`identity.strategicProblem`: "Problem is institutional conversion, not scale").

## A.2 In-service 1880 ships (re-used from `[SBN]` §6.6 — do not re-derive; corroborated [NP] this session)

- **Wei Yuen** composite sloop (Peiyang; Foochow Arsenal; laid 2.9.1876 / comp. 14.9.1877; sister Chao Wu
  (Nanyang) 1879; class also Kang Chi comp. 9.1.1880, Teng Ch'ing 1881, Heng Hai 7/1885, Kuang Chia 7/1885):
  1,258 t; 66.2 oa / 64.0 pp × 8.99 × 3.81 m; 1 HC, 4 cylindrical boilers, 750 ihp, 11 kn; **1 × 160/14 mm
  Armstrong MLR + 6 × 121/22 mm Armstrong 40-pdr BLR**; no torpedo; iron gun-shield 32–13 mm only; crew 180.
  `[SBN]` §6.6 / [NP] `ch_cr_wei_yuen.htm` SINGLE-SOURCE.
- **Fei Ting** (ex-Gamma) Rendel "flatiron" iron gunboat (Nanyang; Mitchell, Chesterfield; comp. 12.1876; sister
  Tse Tien ex-Delta): 420 t; 36.6 × 9.14 × 2.44 m; 2 HCR, 1 cylindrical boiler, 270 ihp, 9.5 kn;
  **1 × 318/16 mm Armstrong 38-ton MLR**; secondary 2 × 70/22 mm RK L/25 C/73 Krupp + 1 × 4 25/42 mm Nordenfelt;
  iron shield 13 mm, CT 13; crew 30. `[SBN]` §6.6 / [NP] `ch_of_fei_ting.htm` SINGLE-SOURCE.
- **Excluded (not in service Jan 1880):** Dingyuan / Zhenyuan (ordered 1880, completed 1885), Kang Chi
  (9.1.1880, marginal), the 1881+ Mitchell steel cruisers and the 1884 Foochow/Howaldt cruisers. `[SBN]` §5.

### A.2b Grounded post-1880 hulls used to shape the doctrine templates (not 1880 starters)

| ship / class                          | builder / date                     | key figures                                                                                          | source | confidence |
| ------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ------ | ---------- |
| Dingyuan / Zhenyuan (barbette ironclad) | Vulcan, Stettin; comp. 1885        | 7,430 t; 308.4 ft wl; 4 × 30.5 cm (12-in) Krupp in 2 twin barbette turrets; 6,200 ihp; 14.4 kn; citadel 14-in, turrets 12-in compound plate | [NA86] p. 219 | VERIFIED (as printed) |
| Yang Wai / Tshao-Yong (steel cruiser)  | Mitchell, Tyne; supplied 1881      | 1,350 t; 210 ft pp × 32 ft × 21 ft 9 in hold; twin screws, 2,600 ihp; 2 × 10-in Armstrong BL centre-pivot + 4 × 4.75-in + 2 × 9-pdr BL; steel protective deck + coal bunkers | [NA86] p. 219 | VERIFIED (as printed) |
| Nan Shui / Nan Thin (steel cruiser)    | Howaldtwerke, Kiel; comp. 1884     | 2,200 t; 77.0 wl / 84.0 oa × 11.0 × 5.49 m; 1 HC, 8 cyl boilers, 2,400 ihp, 15 kn; 2 × 209/20 mm RK L/22 + 8 × 120/32 mm RK L/35 + 10 × 4 25 mm Nordenfelt; 1 × 356 mm bow TT; coal 600 t | [NP] `ch_cr_nan_shui.htm` | SINGLE-SOURCE |
| Kai Che (Kai Chi) class (composite cruiser) | Foochow Arsenal; 1884–88         | 2,100–2,150 t; 76.2–76.9 wl × 11.0 × 5.49–5.64 m; 1 HC/HTE, 8 cyl boilers, 2,400 ihp, 14.5–17 kn; 2 × 209/20 mm RK L/22 or 3 × 178/26 mm Armstrong BLR + 7 × 120/121 mm; 2 × 356 mm beam TT; coal 360 t; crew 300 | [NP] `ch_cr_kai_chi.htm` | SINGLE-SOURCE |
| Hai Ch'ang Ch'ing (composite flatiron) | Canton DYd; comp. 6.1877            | 430 t; 38.1 × 9.14 × 2.41 m; 2 HR, 70 ihp, 7.5 kn; 1 × 279/12 mm Armstrong 25-t MLR + 2 × 76/28 mm 12-pdr BLR; coal 40 t; "too lightly built and was not a success" | [NP] `ch_of_hai_chang_ching.htm` | SINGLE-SOURCE |
| Lei Fu / Lei Lung (torpedo boats)      | Vulcan, Bremen; comp. 1884         | 64 t; 35.0 wl × 3.96 × 1.68 m; 1 VTE, 2 boilers, 700 ihp, 19.8 kn; 2 × 5 37/17 mm Hotchkiss; 2 × 356 mm bow TT; coal 10 t; crew 20 | [NP] `ch_dd_lei_fu.htm` | SINGLE-SOURCE |

## A.3 Industrial capability

| item                            | figure / direction                                                                                                                                        | unit   | source                                        | confidence        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------- | ----------------- |
| Shipbuilding base               | state/regional arsenals **Foochow (Fuzhou)**, **Jiangnan (Kiangnan, Shanghai)**, Tientsin, Canton; foreign yards **Armstrong/Mitchell (UK)**, **Vulcan/Howaldt (Germany)** | —      | [NP] builder fields; [NA86] p. 219            | VERIFIED (direct) |
| Import dependence               | capital ships and heavy ordnance **bought abroad**: all 1880 in-service heavies are Armstrong (UK); Dingyuan's 30.5 cm guns are Krupp (Germany); Nan Shui built at Kiel | —      | [NP] armament/builder fields; [NA86] p. 219   | VERIFIED (direct) |
| Domestic build ceiling (actual) | largest *domestically built* hull by 1880s: **Kai Che 2,150 t** (Foochow, 1884); Wei Yuen 1,258 t (Foochow, 1877)                                            | t      | [NP] `ch_cr_kai_chi` / `ch_cr_wei_yuen`      | SINGLE-SOURCE     |
| Build-time multiplier           | **slower**: small hand-worked arsenals, foreign-supervised, composite/steel by trial. Propose **10800 bp** (range 10600–11200)                             | ×10000 | ESTIMATE from completion slips; [REPO]        | ESTIMATE / **BALANCE TARGET** |
| Cost modifier                   | **higher per hull**: imports attract freight/commission, and corruption consumes an estimated 20–40 % of naval procurement (`[REPO]` framing). Propose **10900 bp** (range 10600–11200) | ×10000 | ESTIMATE; `[REPO]` `countries.yaml`           | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement      | **1880 ~2.0M / 1885 ~2.2M / 1890 ~2.5M kg** (domestic-build ceiling); **imported hulls bypass it** (Dingyuan 7,430 t, 1885)                              | kg     | ESTIMATE from [NP] completed classes (Kai Che 2,150 t) | ESTIMATE |
| Heavy-gun production            | **IMPORTED — Armstrong (UK) and Krupp (Germany)**; no domestic heavy-gun factory evidenced in-band                                                       | —      | [NP] armament fields; [NA86] p. 219           | VERIFIED (direct) |
| Armour-plate production         | **IMPORTED** (inference): the only in-service 1880 armour is a light iron gun-shield (32–13 mm); Dingyuan's compound plate was foreign. No [NP] evidence of a Chinese plate mill in-band | —      | [NP]; ESTIMATE                                | ESTIMATE          |
| Machinery reliability           | foreign plant (HC/compound, cylindrical boilers) competent but poorly maintained, foreign-supervised domestic assembly, inconsistent readiness (`[REPO]`). Propose **8400 bp** | bp     | [NP]; plants.yaml (TE 9000); `[REPO]`         | ESTIMATE / **BALANCE TARGET** |
| Construction-quality variance   | **HIGH**: "too lightly built and was not a success" (a domestic flatiron); corruption and inconsistent standardisation (`[REPO]`). Propose **4800 bp**   | bp     | [NP] `ch_of_hai_chang_ching`; `[REPO]`        | ESTIMATE / **BALANCE TARGET** |
| Budget (repo framing only)      | central revenue ~GBP 12M/yr; Beiyang ~GBP 0.5–1M/yr from provincial revenue; `researchBudget 8`. **Not a historical source.**                            | £      | `[REPO]` `countries.yaml` / `research.yaml`   | framing, not grounding |

Direction of every multiplier is grounded (slower, costlier, lower-reliability, high-variance); the magnitude is a
balance choice inside the ±15 % band (as in the UK/France/Germany/Italy/Japan/Russia/AH notes). Qing is **import-
dependent for guns and armour** but **not** a leader in any industrial category.

## A.4 Doctrine

| field                         | Qing position                                                                                                          | source / basis                       | confidence                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------- |
| preferred engagement distance | **short (~1,500 m)**: period practice; coastal/riverine, hand-worked RML/BL, no rangefinders                            | [NA86]; period contrast              | ESTIMATE / **BALANCE TARGET** |
| main-gun emphasis             | **few imported heavies per ship** (Fei Ting 1 × 318 mm; Wei Yuen 1 × 160 mm; Dingyuan 4 × 305 mm from 1885)            | [SBN] §6.6; [NA86] p. 219            | SINGLE-SOURCE                 |
| secondary emphasis            | **medium Armstrong/Krupp**: 121 mm 40-pdr, 120 mm Krupp, 70–76 mm, 25/37 mm MG; broadside/sponson mounts              | [NP]; [SBN] §6.6                     | SINGLE-SOURCE                 |
| gun-quality priorities        | buy the best available (Armstrong RML then Krupp BL); prestige-sensitive, arms-length from any domestic design          | [NA86] p. 219; `[REPO]`              | SINGLE-SOURCE                 |
| AP-vs-HE preference           | **AP/common-dominant**, black-powder bag charges; no melinite-type HE in-band. Propose `hePreferenceBp ≈ 4500`         | [PRE]; [NA86]                        | ESTIMATE / **BALANCE TARGET** |
| fire-control priority         | **nil in-band** (no rangefinder; Barr & Stroud is 1893)                                                                 | components.yaml `rangefinder_optical` (1893) | DERIVED                       |
| rate of fire                  | slow: hand-worked RML heavy ~0.25–0.4 rds/min; light Hotchkiss/Nordenfelt 20–50 rds/min                                | [PRE] §5                             | ESTIMATE                      |
| torpedo priority              | **nil in 1880** — no torpedo craft or tubes in service; first boats 1884, tubes on the 1884 cruisers                   | [NP] builder/armament dates          | VERIFIED (dates)              |
| protection: belt vs deck      | none on 1880 hulls beyond a light iron gun-shield; the 1884 cruisers add steel protective decks/casemates             | [NP]; [SBN] §6.6                     | SINGLE-SOURCE                 |
| propulsion                    | foreign/foreign-supervised horizontal compound + cylindrical boilers; VTE on the 1884 Vulcan torpedo boats             | [NP]; plants.yaml                    | SINGLE-SOURCE                 |
| accommodation                 | SPARTAN–STANDARD (cramped on gunboats)                                                                                 | [NP]; `[REPO]`                       | ESTIMATE                      |

**Doctrine line:** coastal/regional, short-range, few imported heavies backed by medium Armstrong/Krupp guns,
protective gun-shields only, no torpedo in 1880, no fire control.

## A.5 Research priorities (canonical fields, priority 1–4)

Shipped draft: `research.yaml` `qing` = `GUNNERY: 2` (budget 8). Grounded recommendation (**ESTIMATE / BALANCE
TARGET** — a low-capability, import-absorbing, institutionally fragmented programme; no field rises above 3):

| field             | priority | justification                                                                                      | source / basis                  | confidence     |
| ----------------- | -------- | -------------------------------------------------------------------------------------------------- | ------------------------------- | -------------- |
| GUNNERY           | 3        | the visible modernising effort is artillery: import and absorb Armstrong/Krupp guns and drill them | `[REPO]`; [NA86] p. 219         | ESTIMATE       |
| INFRASTRUCTURE    | 3        | the binding constraint is the small arsenals/docks (Foochow, Jiangnan) that cap domestic hull size | `[REPO]`; [NP] Foochow builders | ESTIMATE       |
| HULL_CONSTRUCTION | 3        | Foochow composite/steel hull construction is the domestic capability (Wei Yuen → Kai Che)           | [NP] class pages                | ESTIMATE       |
| SHIP_DESIGN       | 3        | design is absorbed from foreign advisers rather than generated; copies of foreign cruisers          | `[REPO]` `shipDesign`; [NP]     | ESTIMATE       |
| MACHINERY         | 2        | buys foreign machinery; compound then VTE under foreign supervision                                | [NP]; plants.yaml               | ESTIMATE       |
| TORPEDOES         | 2        | torpedo boats ordered (first from 1881, delivered 1884) but no in-band doctrine                     | [NP] ch_dd_lei_fu               | ESTIMATE       |
| MINES_AND_ASW     | 2        | coastal-mining awareness, no in-band programme (research preference only — DESIGN-55 guard)         | ESTIMATE                        | ESTIMATE / **BALANCE TARGET** |
| DAMAGE_CONTROL    | 1        | minimal subdivision on the composite hulls                                                          | [NP]                            | ESTIMATE       |
| FIRE_CONTROL      | 1        | no rangefinder in-band                                                                              | components.yaml                 | ESTIMATE       |
| SUBMARINES        | 1        | no in-band submarine                                                                                | `[CW]` relayed                  | SINGLE-SOURCE  |

> **DESIGN-55 guard.** MINES_AND_ASW and SUBMARINES are recorded as *research preferences* only. Any mine/submarine
> mechanic that is deferred/unaccepted must not be treated as reachable content in this profile; the profile
> carries the preference weight, nothing else.
>
> **Reconciliation note.** The shipped `research.yaml` gives `GUNNERY: 2`. The grounded reading raises GUNNERY to 3
> and sets INFRASTRUCTURE / HULL_CONSTRUCTION / SHIP_DESIGN co-equal at 3 (the import-and-absorb shape). The
> difference is a **BALANCE TARGET / content decision** for the orchestrator, not a fact this note can settle.

---

# B. Component access (shared families)

Status ∈ DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED | UNAVAILABLE. The catalogue's gun families are
British RMLs/BLs, the French 27 cm and the German (Krupp) 26 cm; the Qing signature Armstrong/Krupp guns are
**IMPORTED** and overlaid on the nearest family with a calibre/shell override (§C). Other nations' signature
domestic heavies are UNAVAILABLE (per the brief).

| family id                        | status         | producer / note                                                                                              | source                       | confidence    |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------- | ------------- |
| `gun_rml_125in_38ton`            | **IMPORTED**   | **Armstrong 12.5-in 38-ton RML** (318 mm) — Fei Ting's main; overlay for the Qing heavy                       | [SBN] §6.6; [NP] fei_ting     | SINGLE-SOURCE |
| `gun_rml_11in_25ton`             | **IMPORTED**   | **Armstrong 11-in 25-ton RML** (279 mm) — Hai Ch'ang Ch'ing main                                             | [NP] hai_chang_ching         | SINGLE-SOURCE |
| `gun_rml_8in_9ton`               | **IMPORTED**   | overlay for the **Krupp 20.9 cm RK L/22** (Nan Shui / Kai Che) — mechanism mismatch (see §G deferred)         | [NP] nan_shui / kai_chi      | SINGLE-SOURCE |
| `gun_rml_7in_7ton`               | **IMPORTED**   | **Armstrong 7-in (178 mm) BLR** — Kai Che's alternate main                                                 | [NP] kai_chi                 | SINGLE-SOURCE |
| `gun_rml_64pdr_71cwt`            | **IMPORTED**   | **Armstrong 160 mm MLR / 121 mm 40-pdr BLR** — Wei Yuen's armament                                          | [SBN] §6.6; [NP] wei_yuen     | SINGLE-SOURCE |
| `gun_bl_263mm_rkl20`             | UNAVAILABLE    | German 26 cm signature; Qing's Krupp heavy (30.5 cm on Dingyuan) has no family and this is not it           | brief (rule)                 | rule          |
| `gun_bl_274mm_m1875`             | UNAVAILABLE    | French 27 cm signature                                                                                        | brief (rule)                 | rule          |
| `gun_bl_12in_25`                 | UNAVAILABLE    | British 12-in/25 signature                                                                                    | brief (rule)                 | rule          |
| `gun_bl_135in_30`                | UNAVAILABLE    | British 13.5-in signature                                                                                     | brief (rule)                 | rule          |
| `gun_bl_12in_35`                 | UNAVAILABLE    | British 12-in/35 signature                                                                                    | brief (rule)                 | rule          |
| `gun_qf_47in`                    | **IMPORTED**   | overlay for **Krupp 12 cm RK L/35 C/80 / Armstrong 120 mm 40-pdr** (bore match; Qing guns are BL not QF)      | [NP] nan_shui / kai_chi      | SINGLE-SOURCE |
| `gun_qf_12pdr`                   | **IMPORTED**   | overlay for **Krupp 7 cm RK L/25 C/73** (Fei Ting) and **Armstrong 76 mm 12-pdr BLR**                         | [SBN] §6.6; [NP] fei_ting     | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr`             | **IMPORTED**   | **Hotchkiss 37 mm** — Lei Fu boats, later cruisers                                                            | [NP] lei_fu / kai_chi        | SINGLE-SOURCE |
| `gun_nordenfelt_1in`             | **IMPORTED**   | **25 mm Nordenfelt 4-barrel** — Fei Ting, Nan Shui (2 × 5)                                                    | [SBN] §6.6; [NP] nan_shui     | SINGLE-SOURCE |
| `gun_qf_6in_40`                  | IMPORTED       | Armstrong 6-in QF (1890s refits); post-band for a 1880 starter                                                | [NP]                          | SINGLE-SOURCE |
| `gun_qf_6pdr`, `gun_maxim_303`   | IMPORTED       | light guns/Maxim, post-band                                                                                   | [NP]                         | UNVERIFIED    |
| `tube_14in_above_water`          | **IMPORTED**   | **356 mm Whitehead**, above-water/beam (Kai Che's 2 beam TT)                                                  | [NP] kai_chi                 | SINGLE-SOURCE |
| `tube_14in_submerged`            | **IMPORTED**   | **356 mm Whitehead**, submerged bow (Nan Shui 1 bow; Lei Fu 2 bow)                                            | [NP] nan_shui / lei_fu       | SINGLE-SOURCE |
| `gun_rml_16in_80ton`, `gun_rml_12in_35ton`, `gun_rml_12in_25ton`, `gun_rml_10in_18ton*` | UNAVAILABLE | British RMLs not in Qing service (closest Qing fit overlaid as above) | —                            | rule          |
| `gun_bl_10in_32`, `gun_bl_92in_315`, `gun_bl_6in_26` | UNAVAILABLE | British BL/QF families not in 1880 Qing service (a 1890s 6-in QF import is the only later exception) | —                            | rule          |

`hardCapabilities` (recommended): `maxGunCaliberUm` **318000** (Fei Ting's Armstrong 12.5-in); `maxArmourThicknessUm`
**356000** (Dingyuan citadel 14-in, 1885, imported) — or **32000** in-service Jan 1880 (Wei Yuen's gun-shield);
`domesticTorpedoDiameterUm` **356000** (imported Whitehead; no domestic torpedo production evidenced);
`hullForms` `[torpedo_boat_form, protected_cruiser_form, coast_defence_form, pre_dreadnought_form,
merchant_liner_form]`; `domesticPlants` `[compound_cylindrical]` (TE gated to 1885; locomotive boiler 1890).

---

# C. National component variants (~12)

Each row overlays one shared family with a Qing national designation, a sourced (or explicitly ESTIMATE) shell
mass/parameter set, and a `mounts` list. Mounts ∈ TURRET | BARBETTE | CASEMATE | DECK_SHIELDED | DECK_OPEN |
BROADSIDE_BATTERY. Shell masses from [PRE] §5 where the British RML family value applies; otherwise ESTIMATE by
bore.

| family id               | Qing national model                                            | shell / params (override)                                                              | mounts                        | source                       | confidence |
| ----------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------- | ---------- |
| `gun_rml_125in_38ton`   | **Armstrong 12.5-in 38-ton RML (318 mm)** — Fei Ting            | cal 318000; shell **367100 g** (family; 810 lb); charge ~95000 g (EST); MV ~480 m/s (EST) | DECK_SHIELDED                 | [SBN] §6.6; [NP] fei_ting; [PRE] §5 | SINGLE-SOURCE (cal/shell); charge/MV ESTIMATE |
| `gun_rml_11in_25ton`    | **Armstrong 11-in 25-ton RML (279 mm)** — Hai Ch'ang Ch'ing     | cal 279000; shell **246300 g** (family); charge 38600 g; MV 414 m/s; ROF ~0.3           | DECK_SHIELDED                 | [NP] hai_chang_ching; [PRE] §5 | SINGLE-SOURCE |
| `gun_rml_8in_9ton`      | **Krupp 20.9 cm RK L/22 C/72** — Nan Shui / Kai Che             | cal 209000; shell ~100000 g (EST); charge ~25000 g (EST)                                | DECK_OPEN, DECK_SHIELDED, CASEMATE | [NP] nan_shui / kai_chi; ESTIMATE | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_rml_7in_7ton`      | **Armstrong 7-in (178 mm) BLR** — Kai Che                       | cal 178000; shell **52200 g** (family); charge 13600 g; MV 476 m/s; ROF ~0.8            | DECK_SHIELDED, DECK_OPEN      | [NP] kai_chi; [PRE] §5       | SINGLE-SOURCE (cal) / ESTIMATE |
| `gun_rml_64pdr_71cwt`   | **Armstrong 160 mm MLR** — Wei Yuen main                        | cal 160000; shell **29000 g** (family); charge 3600 g black; MV 375 m/s; ROF ~0.33       | DECK_SHIELDED, BROADSIDE_BATTERY | [SBN] §6.6; [PRE] §5     | SINGLE-SOURCE |
| `gun_rml_64pdr_71cwt`   | **Armstrong 121 mm (40-pdr) BLR** — Wei Yuen secondary          | cal 121000; shell ~18000 g (EST by 40-lb nominal); charge ~3600 g (EST)                  | BROADSIDE_BATTERY, DECK_OPEN  | [SBN] §6.6; [NP] wei_yuen    | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_47in`           | **Krupp 12 cm RK L/35 C/80 / Armstrong 120 mm 40-pdr BLR**      | cal 120000; shell 20400 g (family; family is a QF, Qing guns are BL — bore match only)   | DECK_OPEN, DECK_SHIELDED, BROADSIDE_BATTERY | [NP] nan_shui / kai_chi; family | SINGLE-SOURCE (cal) / ESTIMATE (mechanism) |
| `gun_qf_12pdr`          | **Krupp 7 cm RK L/25 C/73** — Fei Ting                          | cal 70000; shell ~4500 g (EST between 57/76 mm); ROF low                                | DECK_OPEN                     | [SBN] §6.6; [NP] fei_ting    | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_12pdr`          | **Armstrong 76 mm 12-pdr BLR** — Hai Ch'ang Ch'ing              | cal 76000; shell 5670 g (family)                                                         | DECK_OPEN, DECK_SHIELDED      | [NP] hai_chang_ching; family | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr`    | **Hotchkiss 37 mm** — Lei Fu / later cruisers                   | cal 37000; shell 1500 g (family); ROF ~20                                                | DECK_OPEN                     | [NP] lei_fu; family          | SINGLE-SOURCE |
| `gun_nordenfelt_1in`    | **Nordenfelt 25 mm 4-barrel** — Fei Ting, Nan Shui              | cal 25000; bullet 206 g (family)                                                         | DECK_OPEN                     | [SBN] §6.6; [NP] nan_shui; family | SINGLE-SOURCE |
| `tube_14in_above_water` | **35.6 cm Whitehead, above-water/beam** (Kai Che 2 beam)        | bore 356000; trainable carriage                                                          | — (ABOVE_WATER_TRAINABLE)     | [NP] kai_chi                 | SINGLE-SOURCE |
| `tube_14in_submerged`   | **35.6 cm Whitehead, submerged bow** (Nan Shui 1; Lei Fu 2 bow) | bore 356000; fixed bow                                                                   | — (UNDERWATER_FIXED)          | [NP] nan_shui / lei_fu       | SINGLE-SOURCE |

Notes:
- Qing tubes are actually **356 mm (14-in)** — the catalogue's own model applies, unlike Japan/AH (350 mm). Record
  the bore and the source year (Nan Shui/Kai Che/Lei Fu are 1884, **not** 1880 service).
- Rows 3–4 and the 12 cm row are **overlays** (a Krupp BL or Armstrong BL carried on an RML/QF family) because the
  catalogue has no dedicated Krupp 209 mm / 12 cm family; the mechanism mismatch is **surfaced as deferred** (§G),
  exactly as the Japan/AH notes do.
- All shell masses except the British RML family values are **ESTIMATE** (the sources give the bore/designation, not
  the projectile weight). Mackinlay Table XVII or a period Chinese ordnance list would upgrade them.

---

# D. Six 1880 opening designs (B, CA, CL, DD, KE, AMC)

All are legal 1880-01 **DOCTRINE_TEMPLATE** starting points, not historical reconstructions (the historical hulls
are in §A.2). The B, CL and KE shapes are grounded in historical ships/lines (Dingyuan; Wei Yuen; Fei Ting); CA/DD/
AMC are doctrine templates grounded in Qing practice/lineage. **Moulded depth is UNVERIFIED for every Qing ship** —
`depthToMainDeck` is ESTIMATE throughout. Plant: `compound_cylindrical` (the only 1880 plant in `plants.yaml`; min
300 kW, max 8,000 kW). The `locomotive_boiler_tb` plant is dated 1890 and is a **content gap** for an 1880 torpedo
boat (same gap flagged in the Japan/AH notes). No Qing ironclad or torpedo boat is legal in 1880-01; both slots are
doctrine templates.

| slot | shape / inspiration (source)                                   | hull form               | Lwl/B/T (mm)              | depth (mm) | displ (kg) | plant / kW | fuel (kg) | main / secondary                                                                  | armour scheme                                                   | doctrine note |
| ---- | -------------------------------------------------------------- | ----------------------- | ------------------------- | ---------- | ---------- | ---------- | --------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------- |
| **B**  | Dingyuan-class barbette ironclad (ordered 1880, comp. 1885) [NA86]/[NP] | coast_defence_form      | 94,000 / 18,000 / 6,100   | 9,000 EST  | 7,430,000  | compound_cylindrical / 4,600 | 700,000 | 4 × `gun_rml_125in_38ton` (318 mm Armstrong) in 2 twin BARBETTE; 6 × `gun_rml_64pdr_71cwt` (121 mm) | citadel 356 mm compound + barbette 305 + deck 50 (Dingyuan fit; armour IMPORTED) | imported barbette coast-defence ironclad; the Beiyang flagship template (historical 30.5 cm Krupp has no family — see §G) |
| **CA** | Nan Shui / Kai Che steel-cruiser lineage (1884) [NP]           | protected_cruiser_form  | 84,000 / 11,500 / 5,490   | 7,500 EST  | 2,200,000  | compound_cylindrical / 1,800 | 600,000 | 2 × `gun_rml_8in_9ton` (209 mm Krupp) DECK_SHIELDED; 8 × `gun_qf_47in` (120 mm) BROADSIDE; 1 × `tube_14in_submerged` | deck 50 + coal bunkers (thin casemate 25, "probably armoured casemates") | fast imported-steel Nanyang cruiser; ram bow, 15 kn, torpedo-armed |
| **CL** | Wei Yuen composite sloop (1877) [SBN]/[NP]                     | coast_defence_form      | 66,000 / 11,000 / 3,810   | 5,800 EST  | 1,258,000  | compound_cylindrical / 560 | 200,000 | 1 × `gun_rml_64pdr_71cwt` (160 mm) DECK_SHIELDED; 6 × `gun_rml_64pdr_71cwt` (121 mm) BROADSIDE | gun-shield 32–13 mm iron only; nil hull                       | composite-hulled, rigged Peiyang/Nanyang sloop; colonial/station cruising |
| **DD** | Lei Fu-class torpedo boat (Vulcan, 1884) [NP]                  | torpedo_boat_form       | 35,000 / 3,960 / 1,680    | 2,800 EST  | 64,000     | compound_cylindrical / 520 | 10,000 | none (2 × `gun_hotchkiss_3pdr`); 2 × `tube_14in_submerged` (356 mm bow)            | nil                                                             | steel torpedo boat bought from Vulcan; Qing torpedo arm is imported, ordered from 1881, delivered 1884 |
| **KE** | Fei Ting Rendel flatiron iron gunboat (1876) [SBN]/[NP]        | coast_defence_form      | 62,000 / 10,400 / 2,400   | 4,200 EST  | 600,000    | compound_cylindrical / 400 | 40,000  | 1 × `gun_rml_125in_38ton` (318 mm 38-ton RML) DECK_SHIELDED; 2 × `gun_qf_12pdr` (70/76 mm) | fixed iron shield 13–25 mm; CT 13                             | small, shallow-draught flatiron/station gunboat for river/coast defence; the classic Rendel shape |
| **AMC**| China Merchants Steam Navigation Co. liner taken up from trade [REPO] | merchant_liner_form     | 115,000 / 14,000 / 3,500  | 8,000 EST  | 3,500,000  | compound_cylindrical / 2,600 | 900,000 | 4 × `gun_qf_12pdr` (76 mm) DECK_OPEN; 1 × `tube_14in_above_water`                 | none (hull only)                                                | armed ocean liner (doctrine template; the 1872 China Merchants fleet was coastal, so this is aspirational) |

Block coefficients (ESTIMATE, `blockCoeffBp` ×10000): B ≈ 7000 (derived: 7,430 t / (1.025 × 94.0×18.0×6.1));
CA ≈ 4600 (2,200 t / (1.025 × 77×11×5.49)); CL ≈ 5600; DD ≈ 4400 (game convention; the computed ≈2690 is
unreliable at this scale, as in the Russia/AH notes); KE ≈ 5000; AMC ≈ 6100. All six are ESTIMATE for dimensions,
power and armour; the B, CL and KE shapes are grounded in the historical ships named.

> **B-armament caveat.** The historical Dingyuan mounted **four 30.5 cm Krupp BL** guns. The catalogue has no such
> family and the brief marks `gun_bl_263mm_rkl20` UNAVAILABLE, so the B template uses the nearest *Qing-available*
> heavy — the Armstrong 12.5-in 38-ton RML (`gun_rml_125in_38ton`). A dedicated 30.5 cm Krupp family is the correct
> fix and is surfaced as deferred (§G).

> **DD scale note.** The historical Lei Fu is 35.0 m / 64 t — at the low end of `torpedo_boat_form` (30,000 mm min)
> and legal, but the only 1880 plant (`compound_cylindrical`, min 300 kW) is heavier than the boat's real VTE; the
> shape above is a legal approximation (surface as a content decision, §G).

---

# E. Recommendations (concrete profile values, non-normative)

| profile field | Qing candidate | basis | label |
| --- | --- | --- | --- |
| `strategicSituation` postures | `[coastal_defence, regional_warfare]` (+ weak `distant_water_operations`, `torpedo_warfare`) | §A.1 | grounded shape (VERIFIED/SINGLE) |
| `industrialProfile.buildTimeMultiplierBp` | 10800 (range 10600–11200) | small hand-worked arsenals; imports | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.costMultiplierBp` | 10900 (range 10600–11200) | imports + corruption framing | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.machineryReliabilityBp` | 8400 | foreign plant, poor maintenance | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.constructionQualityVarianceBp` | 4800 | "too lightly built"; corruption | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.maxPracticalDisplacementKg` (1880/1885/1890) | 2.0M / 2.2M / 2.5M (domestic; imported bypasses) | Kai Che 2,150 t; Dingyuan 7,430 t (imported) | ESTIMATE |
| `industrialProfile.heavyGunProduction` | IMPORTED (Armstrong/Krupp) | [NP]; [NA86] p. 219 | grounded |
| `industrialProfile.armourPlateProduction` | IMPORTED | [NP]; ESTIMATE | ESTIMATE |
| `doctrineProfile.engagementRangeM` | 1500 | short period range | ESTIMATE / grounded shape |
| `doctrineProfile.hePreferenceBp` | 4500 (AP/common, black powder) | [PRE]; [NA86] | ESTIMATE / **BALANCE TARGET** |
| `researchPreferences` | GUNNERY 3, INFRASTRUCTURE 3, HULL 3, SHIP_DESIGN 3 (see §A.5) | §A.5 | grounded shape / ESTIMATE |
| `componentAccess` | §B (imports; foreign heavies UNAVAILABLE) | §B | grounded shape |
| `gunModels` / `componentVariants` | §C (~13 rows) | §C | mixed per row |
| `designs` | §D (6) | §D | mixed per row; ESTIMATE |
| `namingPolicy` | §F | published names | grounded (SINGLE-SOURCE) |
| `hardCapabilities.maxGunCaliberUm` | 318000 (Armstrong 12.5-in) | §B | SINGLE-SOURCE |
| `hardCapabilities.maxArmourThicknessUm` | 356000 (Dingyuan citadel, 1885) / 32000 in-service Jan 1880 | [NA86] p. 219; [SBN] | grounded |
| `hardCapabilities.domesticTorpedoDiameterUm` | 356000 (imported Whitehead) | [NP] | grounded |

Keep every cost/build-time modifier inside **±15 %** and label it BALANCE TARGET; ship every ESTIMATE/UNVERIFIED
with its label (the merchant-liner discipline). The proposed multipliers sit at the high (slow/expensive) end of
the band, consistent with a small, fragmented, import-dependent service.

---

# F. Naming policy

Published 1880s Qing ship names as stems (historical facts; cited to [NP] class pages and [NA86] p. 219). Names
appear in pinyin and Wade-Giles in the sources.

| type          | convention (one line)                                                                                                   | stems (published names)                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **B**         | two-character auspicious/poetic names, often 遠/鎮/定 ("far/distant" + "settle/guard")                                     | Dingyuan (Ting Yuen), Zhenyuan (Chen Yuen), Jiyuan, Zhiyuan, Jingyuan, Laiyuan (Jingyuen), Chaoyong (Tshao-Yong), Yangwei (Yang Wai)           |
| **CA**        | auspicious/poetic two-character compounds; foreign-built cruisers                                                         | Jiyuan, Chaoyong, Yangwei, Nan Shui, Nan Thin                                                                                                 |
| **CL**        | auspicious/poetic two-character compounds; Foochow composite/steel sloops                                                 | Wei Yuen, Chao Wu, Kang Chi, Teng Ch'ing, Heng Hai, Kuang Chia, Kai Che, Ching Ch'ing, King Ch'ing, Huan T'ai                                  |
| **DD**        | torpedo boats use the 雷 ("lei", thunder/torpedo) prefix + a character                                                     | Lei Fu, Lei Lung, Lei Chen, Chang Tse, Chen Tse, Chien 1, Hu Peng; later Kuang Ping, Fei Ting, Fei Ying                                       |
| **KE**        | place/nature-flavoured names for gunboats (喙/海/澄/廣 …)                                                                    | Fei Ting, Tse Tien, Hai Ch'ang Ch'ing, Kwangtung, Tien Chi, Tse Hai, Wei Ching, Chen Hai, Kuang Yuan, Kuang Keng, Chen Sheng                   |
| **AMC**       | names taken up from trade (China Merchants Steam Navigation Co.); no dedicated naval series in-band                       | (China Merchants liner names; no naval series grounded in-band — UNVERIFIED)                                                                   |

All stems are SINGLE-SOURCE (published ship lists, [NP]/[NA86]); the AMC series is **UNVERIFIED** (no naval naming
series). A full curated dataset (pinyin/Wade-Giles collision handling, the Jingyuan/Jingyuen ambiguity) is content
authoring, not research.

---

# G. Deferred (needs an owner or a decision-request)

- **Krupp 30.5 cm family (the real Dingyuan heavy).** The historical Dingyuan/Zhenyuan mounted four **30.5 cm
  (12-in) Krupp BL** guns [NA86] p. 219. The catalogue has no such family and the brief marks the German 26 cm
  `gun_bl_263mm_rkl20` UNAVAILABLE, so the B template uses the nearest Qing-available Armstrong RML. A dedicated
  family (e.g. `gun_krupp_305mm_l25`) or a decision to leave the historical fit unauthorable is needed. **This is
  the single biggest gap for a Qing capital ship.**
- **Krupp 209 mm / 12 cm and Armstrong BL medium families.** The Qing signature medium guns (209 mm RK L/22, 120 mm
  RK L/35, 121 mm 40-pdr) have no dedicated shared family; this note overlays the nearest RML/QF family with a
  calibre override (mechanism mismatch). The orchestrator must confirm multiple models per family are legal, or add
  dedicated families. Interacts with schema, not balance.
- **Shell masses for every gun except the British RML family values** are ESTIMATE (the sources give the bore/model,
  not the projectile weight). A clean Mackinlay Table XVII read (or a Chinese ordnance list) would upgrade them.
- **Moulded depth for every design** — no source gives it (carried over from the earlier notes); depths are ESTIMATE.
- **Pre-1880 torpedo-boat plant.** The Lei Fu used a VTE; the catalogue's `locomotive_boiler_tb` is dated 1890 and
  `compound_cylindrical` is heavier. A legal 1880 DD starter is possible only as a scaled approximation (surface).
- **`maxPracticalDisplacementKg` semantics** — does the ceiling gate *domestic build* only (then ~2.0–2.5 M and the
  imported Dingyuan 7,430 t is legal) or all construction (then the field is wrong for Qing)? Surface; do not resolve.
- **Armour-plate and heavy-gun production = IMPORTED** are inferences (absence of evidence in [NP] of domestic mills/
  factories), not sourced statements that none existed. A Conway's China chapter would settle it.
- **Chinese budget / yard capacity.** No tael budget, yard return or dock table was opened; the `[REPO]` figures
  (central ~GBP 12M/yr, Beiyang ~GBP 0.5–1M/yr, 20–40 % corruption) are **repo framing, not historical**.
- **Build-time/cost/reliability/variance multipliers** — BALANCE TARGET (no single sourced Qing multiplier).
- **`research.yaml` priority conflict** — shipped `GUNNERY: 2` vs this note's GUNNERY 3 / INFRA 3 / HULL 3 /
  SHIP_DESIGN 3. A content/balance decision, not a fact.
- **CA/DD/AMC are doctrine templates** — the Qing had no armoured cruiser and no torpedo boat in 1880; only the B
  (Dingyuan, ordered 1880), the CL (Wei Yuen) and the KE (Fei Ting) are true 1880-associated ships. Confirm
  fictional-but-legal starters are acceptable (the existing `reference-designs.yaml` already does this for the
  UK/France/Germany/Italy/Japan/Russia/AH).
- **Naming dataset** — stems listed; a full curated dataset is content authoring, deferred to the spec/implementator.

No `docs/OPEN-ISSUES.md` decision was resolved here.

---

# H. Verdict

**Qualified yes — the Qing profile is authorable now, with per-figure labels.**

- **Strongly grounded (read directly):** the *shape* — a fragmented, import-dependent, coastal/regional moderniser
  with four regional fleets, no 1880 ironclad, a small domestic composite-sloop capability (Foochow), imported
  Armstrong/Krupp guns and Whitehead tubes — rests on the directly-read [NP] class pages (with builder and armament
  fields) and the directly-read [NA86] p. 219 (Dingyuan/Chen Yuen; Nan Shuin/Nan Thin; Yang Wai/Tshao-Yong) and
  `[SBN]` §6.6 (Wei Yuen, Fei Ting).
- **Grounded gun data:** the Qing 160/121 mm Armstrong, 318 mm 38-ton Armstrong, 279 mm 25-ton Armstrong,
  209/120 mm Krupp, 70/76 mm and 25/37 mm light guns are all [NP]- or [NA86]-sourced; the British RML family shell
  masses carry [PRE] §5.
- **What is ESTIMATE/BALANCE TARGET and must be labelled as such:** every industrial multiplier, the
  max-displacement progression, construction-quality variance, all research weights, most shell masses, and the
  CA/DD/AMC (and B-armament) templates. These are gameplay abstractions on a grounded shape.
- **What is genuinely missing:** the 30.5 cm Krupp family (the signature heavy), the Krupp 209/120 mm families,
  Chinese budget/yard data, moulded depths, and the exact canonical research-field enum. None blocks a first
  profile; each is a labelled deferred item or a decision-request.

Recommendation to the orchestrator: author the profile now with the values in §E; ship every ESTIMATE/UNVERIFIED
figure with its label and a provenance record; keep all multipliers inside ±15 % and labelled BALANCE TARGET; and
raise a decision-request for the 30.5 cm Krupp family (and the Krupp/Armstrong medium overlays) before authoring
Qing capital-ship armament beyond the Armstrong RML shapes.

## Source list

1. navypedia.org Chinese pages, read directly this session: `china/ch_index.htm`, `china/ch_cr.htm`,
   `china/ch_cr_wei_yuen.htm`, `china/ch_cr_kai_chi.htm`, `china/ch_cr_nan_shui.htm`, `china/ch_of.htm`,
   `china/ch_of_fei_ting.htm`, `china/ch_of_hai_chang_ching.htm`, `china/ch_dd.htm`, `china/ch_dd_lei_fu.htm`.
2. T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886` (`NavalAnnual1886_djvu.txt`, read
   directly): "Notes on the Chinese Navy—Armoured and Unarmoured Ships" p. 219 (Dingyuan/Chen Yuen; Nan Shuin/
   Nan Thin; Yang Wai/Tshao-Yong); turning-power table p. 289 (Tshao-Yang / Tshi-Yuen).
3. `docs/research/ship-building-1880-ships-by-nation.md` §6.6 (Wei Yuen; Fei Ting) and §5 (exclusions) —
   in-repo, [NP]-derived.
4. `docs/research/ship-building-1880-pre-era-armament.md` §5 (British RML shell/charge/MV values) — in-repo.
5. Print works named as leads (not opened this session): Conway's _All the World's Fighting Ships 1860–1905_
   (1979, China chapter); Jane's _Fighting Ships_ (1898); the Beiyang Fleet monographs (E. J. Dreyer,
   _China at War 1901–1949_; L. Sondhaus relayed).
6. In-repo companions and repo framing: `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
   `italy-naval-profile.md`, `japan-naval-profile.md`, `russia-naval-profile.md`, `usa-naval-profile.md`,
   `austria_hungary-naval-profile.md`, `docs/ships-nation-orientation.md`;
   `content/production/1880/{countries,possessions,economies,research,designs,fleets}.yaml`,
   `content/production/1880/ship-building/{components,gun-families,plants,hull-forms,balance,naval-profiles,
   reference-designs}.yaml`.
