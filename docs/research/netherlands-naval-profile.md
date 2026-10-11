# Research: national naval profile — Netherlands (1880–1899)

Companion to `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md` and
`qing-naval-profile.md`; method, source grades and confidence labels identical (VERIFIED / SINGLE-SOURCE / DERIVED /
ESTIMATE / UNVERIFIED; **Wikipedia is not cited anywhere**). Authored for the `netherlands` canonical
`NationNavalProfile` of `scen_1880` (`docs/ships-nation-orientation.md`, ADR-0088/0089). **Research only**: no
code, content YAML or spec is authored here. Captured 2026-10-11.

## 0. Question

Ground a **date-banded `NationNavalProfile` (1880–1899)** for the **Netherlands** (repo id `netherlands`), plus
~12 shared-family national models and six 1880 opening designs (B, CA, CL, DD, KE, AMC), with posture, component
access, research priorities, procurement and naming. This note answers that; it does **not** author the profile.
The 1880 in-service hulls are **reused** from `docs/research/ship-building-1880-ships-by-nation.md` §6.9. The
shipped draft: `research.yaml` `netherlands` = empty `fieldPriorities` (budget 6); `countries.yaml` (`id:
netherlands`, "wealthy colonial trading power", "no battle fleet ambition"); `economies.yaml` (treasury 80,
income 7, expenses 3).

## 1. Method, source grades and confidence labels

**VERIFIED** = read directly in a period/near-primary text, or two independent sources agree; **SINGLE-SOURCE** =
one source, or a secondary compilation citing print works not opened; **DERIVED** = arithmetic from a source;
**ESTIMATE** = inferred, not itself a source figure; **UNVERIFIED** = no usable source / conflict, range given.
**Wikipedia is not cited anywhere.**

| Tag    | Source                                                                                                                                                                                                                     | Grade / reach                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [NP]   | navypedia.org Netherlands class pages (Ivan Gogin), built principally on Conway's _1860–1905_ + national histories. **Fetched directly this session** (slugs §Sources).                                                        | Secondary compilation → SINGLE-SOURCE.                                                            |
| [NA86] | T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`, `NavalAnnual1886_djvu.txt` **read directly this session** (turning-powers table p. 291; index/plates pp. 254–256).                               | Contemporary annual = period near-primary. **VERIFIED for figures read**; the p. 255 Dutch descriptive body did not OCR legibly. |
| [SBN]  | `docs/research/ship-building-1880-ships-by-nation.md` §6.9. **In-repo.**                                                                                                                                                    | Reused; confidence as carried there.                                                              |
| [PRE]  | `docs/research/ship-building-1880-pre-era-armament.md` §5 (RML/Armstrong shell/charge/MV; incl. the RML 9-in 12-ton row). **In-repo.**                                                                                        | Reused; VERIFIED ([TB87]) for British RMLs.                                                       |
| [REPO] | Shipped content (`countries.yaml`, `research.yaml`, `economies.yaml`, `possessions.yaml`, `ports.yaml`). **Not a historical source.**                                                                                        | Framing only.                                                                                     |
| [CW]   | Conway's _All the World's Fighting Ships 1860–1905_ (1979, Netherlands chapter). **Not opened**; relayed via [NP].                                                                                                            | Print secondary; SINGLE-SOURCE (relayed).                                                         |

Limits: Conway's unreachable; [NP] is one compilation, so nearly every ship figure is SINGLE-SOURCE. The 1886
annual's Dutch descriptive list (pp. 254–256) OCR'd as plate captions only; **no Dutch budget, yard return or dock
table was opened**. Multipliers, research/design weights are **BALANCE TARGET / ESTIMATE**. Moulded depth is not
given by [NP] for any Dutch ship (UNVERIFIED). Conversions: 1 in = 25.4 mm; 1 ihp = 0.7457 kW; 1 kn = 0.5144 m/s.

---

# A. National naval profile (1880–1899)

1880 Netherlands is a **small, wealthy, neutral trading and colonial power**: a low-lying home coast defended by
shallow-draught coast-defence ships (monitors, turret rams, gunboats) and a large **Netherlands Indies** commitment
(Aceh War from 1873) held by long-endurance cruisers and sloops. The fleet is professional, colonial-focused and
shallow-water-optimised, with **no battle-fleet ambition**; guns and armour are **imported** (Krupp, Armstrong),
while the state yard and a few small private yards build the hulls (`[REPO]` `countries.yaml`; [NP]; [CW] relayed).

## A.1 Strategic posture

| posture                    | applies?           | justification (one line)                                                                                     | source                                  | confidence    |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ------------- |
| colonial_presence          | **primary**        | the Indies is the economic core; cruisers/sloops/gunboats hold the East Indies station and the Aceh campaign. | [NP]; `[REPO]`                          | SINGLE-SOURCE |
| coastal_defence            | **primary**        | home defence is monitors/turret rams/gunboats (Zuiderzee, river mouths, water-line tradition); no ocean ironclads. | [NP] Matador/Schorpionen/Adder; `[REPO]` | SINGLE-SOURCE |
| distant_water_operations   | **secondary**      | the Indies plus Suriname/Curaçao; endurance 1,500–3,500 nmi at 10 kn.                                          | [NP] Atjeh/Alkmaar/Sommelsdijk          | SINGLE-SOURCE |
| commerce_defence           | **secondary**      | large merchant marine and the stated "Trade Protection" primary objective, but no great-power cruiser force.  | `[REPO]` `countries.yaml`               | framing       |
| torpedo_warfare            | **weak / emerging** | 2nd-class **spar** boats 1876–79; first tube boats (Ardjoeno, 450 mm) only 1887.                              | [NP] `nl_dd_v`, `nl_dd_ardjoeno`        | VERIFIED (dates) |
| regional_warfare           | **weak**           | neutral state; Aceh is a colonial campaign, not inter-state regional war.                                     | `[REPO]`; reasoning                     | ESTIMATE      |
| battle_fleet_concentration | **no**             | `[REPO]` states "No battle fleet ambition"; the largest armoured ships are ~3.5 kt coast-defence ships.       | `[REPO]`; [NP]                          | framing / SINGLE |
| commerce_raiding           | **no**             | not a Dutch doctrine; the navy is defensive/colonial.                                                         | reasoning                               | ESTIMATE      |

**Recommended primary postures: `coastal_defence` + `colonial_presence`**; `distant_water_operations` and
`commerce_defence` secondary; `torpedo_warfare` weak/emerging; `regional_warfare` weak; `battle_fleet_concentration`
and `commerce_raiding` **not** postures. Defining differentiator: **neutral colonial trade defence + shallow-water
coast defence, backed by imported ordnance.**

## A.2 In-service 1880 ships (re-used from `[SBN]` §6.9; corroborated [NP] this session)

- **Matador** monitor (Fijenoord; comp. 1879; sister **Draak** 1878, Rijkswerf): 1,968 t; 63.9 × 14.5 × 3.20 m;
  2 HC, 690 ihp, 7.5 kn; **1 × 2 283/20 mm Krupp No.1** in 1 twin turret; iron side 140–115, turret 305–230, deck
  25; coal 109 t; crew 131. (Draak: 2,198 t; 65.1 × 15.0 × 3.63; 807 ihp, 8.4 kn; side 205–140.)
- **Schorpionen** turret ram (La Seyne; comp. 9.1868; sister **Stier**, Laird, 1868): 2,140 t; 62.5 × 11.9 × 4.82 m;
  2,225 ihp, 13 kn; **1 × 2 229/14 mm Armstrong 12.5-ton RML** in 1 turret; iron side 152, turret 278–203, deck
  25–19; coal 246 t; crew 136. (Modernised 1880s: 229 replaced by 1 × 1 283/20 Krupp.)
- **Atjeh** unprotected cruiser (Rijkswerf Amsterdam; comp. 1.11.1877; class to 1887): 3,425–3,669 t;
  91.8 × 12.5 × 6.40 m; 2,700–3,300 ihp, 13.5–14.8 kn; **6 × 173/22 Krupp No.1 + 8 × 120/16 Krupp No.1**; no
  armour; coal 440–580 t; crew 277–306. **No Dutch protected cruiser before _Sumatra_ (1891).**
- **Adders/monitors** (1871–78): 1,555 t; 58.6–59.6 × 13.4 × 2.97 m; 560–740 ihp, 7–8 kn; **1 × 2 229/14
  Armstrong** (Luipaard: 1 × 283/20 Krupp); iron side 140, turret 285–203. **Rendell gunboats** — Hydra class
  (1872–76): 218 t, 25.9 × 8 × 2.2 m, 1 × 229/14 Armstrong; Wodan class (1877–84): 264–280 t, 27.8 × 8.2 × 2.3 m,
  **1 × 283/20 Krupp**. **Batavia 4-class colonial screw ships** (1876–80): 837 t; 53.6 × 9.0 × 3.69 m; 8.4–9.3 kn;
  1 × 178/16 Armstrong + 2 × 120/16 Krupp. `[NP]` `nl_bb_adder`, `nl_of_hydra73`, `nl_of_wodan`, `nl_of_batavia`.
- **[NA86] existence check (VERIFIED):** the 1886 annual's turning-powers table lists **Buffel, Hyena, Prins
  Hendrik der Nederlanden and Stier** afloat (p. 291); the index confirms "Netherlands, armoured ships p. 255".

## A.3 Grounded post-1880 hulls used to shape the doctrine templates (not 1880 starters)

| ship / class                          | builder / date                          | key figures                                                                                                                     | source | confidence |
| ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| Sumatra (protected cruiser)           | Rijkswerf Amsterdam; comp. 1891         | 1,693 t; 70.0 × 11.3 × 4.67 m; 2,350 ihp, 17 kn; 1 × 209/32 Krupp, 1 × 149/32, 2 × 120/32; deck 38, shields 100; 2 × 356 TT (beam) | [NP] `nl_cr_sumatra` | SINGLE-SOURCE |
| Koningin Wilhelmina der Nederlanden   | Rijkswerf Amsterdam; comp. 1894         | 4,530 t; 99.8 × 14.9 × 6.07 m; 4,600 ihp, 15.8 kn; 1 × 283/27, 1 × 209/32, 2 × 173/32 Krupp; deck 50 + 75 slopes, barbette/turret 280 | [NP] `nl_cr_koningin_wilhelmina_der_niderlanden` | SINGLE-SOURCE |
| Holland class (protected cruisers)    | Rijkswerf / De Schelde / Fijenoord; 1898–1900 | 3,840–3,970 t; 93.3–94.7 oa × 14.8 × 5.41 m; 10,000 ihp, 20 kn; 2 × 149/37 + 6 × 120/37 Krupp; Harvey-Ni deck 57; 2 × 450 TT | [NP] `nl_cr_holland` | SINGLE-SOURCE |
| Evertsen class (coast-defence battleships) | De Schelde / Nederlandsche / Rijkswerf; 1895–96 | 3,464 t; 86.2 × 14.3 × 5.23 m; 4,700 ihp, 16 kn; 2 × 209/32 barbette + 1 × 209 shield, 2 × 149/32, 6 × 75/37; belt 150–100, barbette 240; 3 × 450 TT | [NP] `nl_bb_evertsen` | SINGLE-SOURCE |
| Ardjoeno class (1st-class torpedo boats) | Yarrow / Rijkswerf / Fijenoord; 1887–92 | 79–90 t; 38.4–39.2 × 3.97 × ~1.9 m; 680–1,089 ihp, 19.1–22.8 kn; 2 × 37/20 Hotchkiss; 2 × 450 TT (bow)               | [NP] `nl_dd_ardjoeno` | SINGLE-SOURCE |
| Sommelsdijk (composite sloop)         | Rijkswerf Amsterdam; comp. 1882         | 997 t; 54.5 × 9.51 × 3.58 m; 759 ihp, 11.4 kn; 1 × 149/22 Krupp + 3 × 120/16 Krupp; coal 180 t                        | [NP] `nl_cr_sommelsdijk` | SINGLE-SOURCE |

## A.4 Industrial capability

| item                            | figure / direction                                                                                                                                                       | unit   | source                                    | confidence        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------- | ----------------- |
| Shipbuilding base               | state **Rijkswerf Amsterdam**; private **Fijenoord (Schiedam)**, **Nederlandsche Stoomboot Mij (Rotterdam)**, **De Schelde (Vlissingen)**, **Christie, Nolet & De Kuyper**; foreign **Mitchell/Laird/Yarrow (UK)**, **La Seyne (FR)** | —      | [NP] builder fields                       | VERIFIED (direct) |
| Domestic build ceiling (actual) | largest domestically built hulls: **Koningin Wilhelmina 4,530 t (1894)**, **Atjeh 3,669 t (1877)**, **Evertsen 3,464 t**                                                 | t      | [NP] class pages                          | SINGLE-SOURCE     |
| Build-time multiplier           | **slower**: small hand-worked yards, small series. Propose **10600 bp** (10300–10800)                                                                                    | ×10000 | ESTIMATE from completion slips; [REPO]    | ESTIMATE / **BALANCE TARGET** |
| Cost modifier                   | **higher per hull**: small series + imported ordnance freight/commission. Propose **10600 bp** (10300–10800)                                                             | ×10000 | ESTIMATE                                  | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement      | **1880 ~3.7M / 1885 ~3.9M / 1890 ~4.6M kg** (domestically built ceiling; imported hulls bypass it)                                                                        | kg     | ESTIMATE from [NP] completed classes      | ESTIMATE          |
| Heavy-gun production            | **IMPORTED — Krupp and Armstrong**; no Dutch heavy-gun factory evidenced in-band                                                                                          | —      | [NP] armament fields; [REPO]              | VERIFIED (direct) |
| Armour-plate production         | **IMPORTED** (inference): 1880 armour is wrought iron, later compound/Harvey; no [NP] evidence of a Dutch plate mill in-band                                              | —      | [NP]; ESTIMATE                            | ESTIMATE          |
| Machinery reliability           | domestic compound engines (Fijenoord/NSM), competent but small; consistent with `compound_cylindrical` (8,500 bp). Propose **8600 bp**                                    | bp     | [NP]; plants.yaml; [REPO]                 | ESTIMATE / **BALANCE TARGET** |
| Construction-quality variance   | **moderate**: some overweight/speed shortfalls (small yards, imported guns); better than France, worse than Britain. Propose **3200 bp**                                  | bp     | [NP]; ESTIMATE                            | ESTIMATE / **BALANCE TARGET** |
| Budget (repo framing only)      | navy share "comparatively generous" (protects the Indies trade); `researchBudget 6`. **Not a historical source.**                                                        | —      | `[REPO]`                                  | framing, not grounding |

Direction of every multiplier is grounded (slower, costlier, moderate reliability/variance); magnitude is a balance
choice inside ±15 %. The Netherlands is **import-dependent for guns and armour** but has a **real domestic
hull-and-machinery capability** (unlike Qing).

## A.5 Doctrine

| field                         | Dutch position                                                                                                    | source / basis                       | confidence                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------- |
| preferred engagement distance | **short (~1,500–2,000 m)**: period practice; hand-worked RML/BL, no rangefinders in-band                          | period contrast; [NA86]              | ESTIMATE / **BALANCE TARGET** |
| main-gun emphasis             | **few imported Krupp heavies per ship** (Matador 2 × 283; Atjeh 0 heavies, 6 × 173; Evertsen 3 × 209)              | [SBN] §6.9; [NP]                     | SINGLE-SOURCE                 |
| secondary emphasis            | **medium Krupp** 173/149/120/75 mm in shields/broadside; 37 mm Hotchkiss light                                    | [NP] class pages                     | SINGLE-SOURCE                 |
| gun-quality priorities        | buy the best available (Krupp BL then QF); no domestic design                                                     | [NP]; [REPO]                         | SINGLE-SOURCE                 |
| AP-vs-HE preference           | **AP/common-dominant**, black-powder; no melinite HE in-band. Propose `hePreferenceBp ≈ 4500`                      | [PRE]; [NA86]                        | ESTIMATE / **BALANCE TARGET** |
| fire-control priority         | **nil in-band** (no rangefinder; Barr & Stroud is 1893)                                                           | components.yaml `rangefinder_optical`| DERIVED                       |
| rate of fire                  | slow: hand-worked RML/Krupp BL ~0.25–1 rds/min; light Hotchkiss ~15–20 rds/min                                     | [PRE] §5; [NP]                       | ESTIMATE                      |
| torpedo priority              | **weak in 1880** (spar torpedoes only); 1st-class boats with 450 mm tubes from 1887                                | [NP] `nl_dd_v`, `nl_dd_ardjoeno`     | VERIFIED (dates)              |
| protection: belt vs deck      | monitors/turret-rams: **iron waterline belt + turret**; cruisers: **thin protective deck + shields**               | [NP] Matador/Schorpionen/Sumatra     | SINGLE-SOURCE                 |
| propulsion                    | domestic compound (HC/VCE) + cylindrical boilers; VTE from ~1890s                                                 | [NP]; plants.yaml                    | SINGLE-SOURCE                 |
| accommodation                 | STANDARD (long-endurance colonial cruisers)                                                                       | [NP]; `[REPO]`                       | ESTIMATE                      |

**Doctrine line:** shallow-water coast defence with imported Krupp heavies backed by medium Krupp guns, iron belt +
turret at home, thin deck + shields abroad; short-range, black-powder AP, no fire control, no meaningful torpedo arm
in 1880.

## A.6 Research priorities (canonical fields, priority 1–4)

Shipped draft: `research.yaml` `netherlands` = **empty `fieldPriorities`** (budget 6). Grounded recommendation
(**ESTIMATE / BALANCE TARGET** — low budget, import-absorbing, hull/machinery-capable colonial navy; no field > 3):

| field             | priority | justification                                                                          | source / basis                  | confidence     |
| ----------------- | -------- | -------------------------------------------------------------------------------------- | ------------------------------- | -------------- |
| HULL_CONSTRUCTION | 3        | domestic shallow-draught composite/iron/steel hulls (Alkmaar → Atjeh → Holland)          | [NP] class pages                | ESTIMATE       |
| INFRASTRUCTURE    | 3        | the binding constraint is the small state/private yards and the home + Indies docks     | `[REPO]` `ports.yaml`; [NP]     | ESTIMATE       |
| MACHINERY         | 3        | Fijenoord / Nederlandsche Stoomboot build marine engines; tropical reliability matters   | [NP] builders                   | ESTIMATE       |
| MINES_AND_ASW     | 3        | coastal mine/torpedo defence of the water-line and river mouths is a real Dutch arm      | `[REPO]`; ESTIMATE              | ESTIMATE / **BALANCE TARGET** |
| GUNNERY           | 2        | buys and drills imported Krupp/Armstrong guns; little domestic development               | [NP]; [REPO]                    | ESTIMATE       |
| TORPEDOES         | 2        | early spar boats; tube craft from 1887                                                   | [NP] `nl_dd_v`, `nl_dd_ardjoeno`| ESTIMATE       |
| DAMAGE_CONTROL    | 2        | subdivision fitted on iron/steel hulls but not emphasised                                | [NP]                            | ESTIMATE       |
| SHIP_DESIGN       | 2        | colonial shallow-draft optimisation is real but largely conventional                      | [NP]; [REPO]                    | ESTIMATE       |
| FIRE_CONTROL      | 1        | no rangefinder in-band                                                                   | components.yaml                 | ESTIMATE       |
| SUBMARINES        | 1        | no Dutch submarine in-band (first Dutch boat 1906)                                       | [CW] relayed                    | SINGLE-SOURCE  |

> **DESIGN-55 guard.** MINES_AND_ASW is a *research preference* only; any deferred mine/ASW mechanic must not be
> treated as reachable content. **Reconciliation note.** The shipped file leaves `fieldPriorities` empty; the
> difference is a **BALANCE TARGET / content decision**, not a fact.

---

# B. Component access (shared families)

Status ∈ DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED | UNAVAILABLE. Dutch signature Krupp/Armstrong
guns are **IMPORTED**, overlaid on the nearest family (§C); other nations' signature heavies stay **UNAVAILABLE**.

| family id                        | status       | producer / note                                                                                              | source                        | confidence    |
| -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------- |
| `gun_bl_263mm_rkl20`             | **IMPORTED** | **Krupp** — nearest *Krupp-built* family; carries the Dutch **283/20 and 283/27 No.1/No.2** as an overlay     | [NP] matador/wodan/koningin_w | SINGLE-SOURCE |
| `gun_rml_8in_9ton`               | **IMPORTED** | **Armstrong** — overlay for the **229/14 12.5-ton RML** and for the **209/32 Krupp** (203 mm family)         | [SBN] §6.9; [NP]              | SINGLE-SOURCE |
| `gun_rml_7in_7ton`               | **IMPORTED** | **Krupp** — overlay for the **173/22 Krupp No.1**                                                            | [SBN] §6.9; [NP]              | SINGLE-SOURCE |
| `gun_bl_6in_26`                  | **IMPORTED** | **Krupp** — overlay for the **149/22–149/37 No.1/No.2/No.3**                                                 | [NP] class pages              | SINGLE-SOURCE |
| `gun_qf_47in`                    | **IMPORTED** | **Krupp** — overlay for the **120/16–120/37 No.1/No.2**                                                      | [SBN] §6.9; [NP]              | SINGLE-SOURCE |
| `gun_qf_12pdr`                   | **IMPORTED** | **Krupp** — overlay for the **75/37 Krupp No.1**                                                             | [NP] evertsen/holland         | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr`             | **IMPORTED** | **Hotchkiss 37 mm** — all classes                                                                            | [NP] class pages              | SINGLE-SOURCE |
| `gun_rml_64pdr_71cwt`            | **IMPORTED** | **Armstrong 17.8 cm 7.17-ton RML** — Batavia first pair                                                       | [NP] `nl_of_batavia`          | SINGLE-SOURCE |
| `tube_14in_above_water`          | **IMPORTED** | **356 mm Whitehead**, above-water/beam (Sumatra 1891)                                                        | [NP] `nl_cr_sumatra`          | SINGLE-SOURCE |
| `tube_14in_submerged`            | **IMPORTED** | **450 mm Whitehead**, submerged bow/stern (Ardjoeno 1887; Evertsen; Holland) — **bore differs from the 356 mm family** | [NP] `nl_dd_ardjoeno` | SINGLE-SOURCE |
| `gun_rml_16in_80ton`, `gun_rml_12in_35ton`, `gun_rml_12in_25ton`, `gun_rml_11in_25ton`, `gun_rml_10in_18ton`, `gun_rml_10in_18ton_broadside`, `gun_rml_125in_38ton` | UNAVAILABLE | British RMLs not in Dutch service                    | brief (rule)                  | rule          |
| `gun_bl_12in_25`, `gun_bl_135in_30`, `gun_bl_12in_35`, `gun_bl_10in_32`, `gun_bl_92in_315` | UNAVAILABLE | British BL families not in Dutch service                                                                     | brief (rule)                  | rule          |
| `gun_bl_274mm_m1875`             | UNAVAILABLE | French 27 cm signature                                                                                       | brief (rule)                  | rule          |
| `gun_qf_6in_40`, `gun_qf_6pdr`, `gun_nordenfelt_1in`, `gun_maxim_303` | UNAVAILABLE | not evidenced in Dutch service in-band; post-band for a 1880 starter                                        | [NP] (negative result)        | rule          |

`hardCapabilities` (recommended): `maxGunCaliberUm` **283000**; `maxArmourThicknessUm` **305000** (Matador turret);
`domesticTorpedoDiameterUm` **450000** (usage bore from 1887 — but **imported**, no domestic torpedo production
evidenced); `hullForms` `[coast_defence_form, protected_cruiser_form, torpedo_boat_form, merchant_liner_form]` (no
`pre_dreadnought_form`); `domesticPlants` `[compound_cylindrical]`.

---

# C. National component variants (~12)

Each row overlays one shared family with a Dutch designation, sourced/ESTIMATE overrides, and `mounts` ∈ TURRET |
BARBETTE | CASEMATE | DECK_SHIELDED | DECK_OPEN | BROADSIDE_BATTERY. Shell masses from [PRE] §5 where a British RML
family value applies; Krupp shell masses are ESTIMATE (Mackinlay's foreign rows are OCR-scrambled).

| family id               | Dutch national model                                          | overrides / values                                                                                   | mounts                                   | source                       | confidence |
| ----------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------- | ---------- |
| `gun_bl_263mm_rkl20`    | **28 cm Krupp No.1 L/20 (283 mm)** — Matador/Draak/Wodan       | cal 283000; shell ~253000 g (EST, Austrian 28 cm Krupp row); charge ~56000 g; MV ~440 m/s (EST); ROF ~1 | TURRET, DECK_SHIELDED                    | [NP] matador/wodan/draak; [PRE] | SINGLE-SOURCE (cal) / ESTIMATE (shell/MV) |
| `gun_bl_263mm_rkl20`    | **28 cm Krupp No.2 L/27 (283 mm)** — later monitors/Wodan      | cal 283000; shell ~253000 g (EST); MV ~470 m/s (EST)                                                 | TURRET, DECK_SHIELDED                    | [NP] `nl_of_wodan` (mod note) | SINGLE-SOURCE (cal) / ESTIMATE |
| `gun_rml_8in_9ton`      | **Armstrong 9-in 12.5-ton RML (229 mm)** — Schorpionen/Adder/Hydra | cal 229000; shell **113000 g**; charge 22700 g; MV 439 m/s; ROF ~0.5–0.67                         | TURRET, DECK_SHIELDED                    | [SBN] §6.9; [PRE] §5         | SINGLE-SOURCE (cal); shell VERIFIED ([TB87]) |
| `gun_rml_8in_9ton`      | **Krupp 20.9 cm No.1/No.2 (209 mm)** — Evertsen/Sumatra/Koningin Wilhelmina | cal 209000; shell ~80000 g (EST) — on the 203 mm family (mechanism mismatch)            | TURRET, BARBETTE, DECK_SHIELDED          | [NP] evertsen/sumatra        | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_rml_7in_7ton`      | **Krupp 17.3 cm No.1 (173 mm)** — Atjeh/Koningin Wilhelmina/Batavia | cal 173000; shell ~52000 g (EST by 178 mm family); charge ~13600 g; MV ~476 m/s                | DECK_SHIELDED, BROADSIDE_BATTERY, CASEMATE | [SBN] §6.9; [NP]; [PRE]    | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_bl_6in_26`         | **Krupp 15 cm No.1/No.2 (149 mm)** — Alkmaar/Sommelsdijk/Evertsen/Sumatra | cal 149000; shell 45000 g (152 mm family, bore override); charge 21800 g (EST)             | DECK_SHIELDED, CASEMATE, BROADSIDE_BATTERY | [NP] class pages           | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_rml_64pdr_71cwt`   | **Armstrong 17.8 cm 7.17-ton RML (178 mm)** — Batavia pair       | cal 178000; shell ~50000 g (EST); charge ~13600 g                                                    | DECK_SHIELDED, BROADSIDE_BATTERY          | [NP] `nl_of_batavia`; [PRE]  | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_47in`           | **Krupp 12 cm No.1/No.2 (120 mm)** — Atjeh/Alkmaar/Batavia/Sumatra | cal 120000; shell 20400 g (family); charge ~5000 g; MV ~600 m/s (EST)                             | DECK_SHIELDED, DECK_OPEN, BROADSIDE_BATTERY | [SBN] §6.9; [NP]           | SINGLE-SOURCE |
| `gun_qf_12pdr`          | **Krupp 7.5 cm No.1 (75 mm)** — Evertsen/Sumatra/Holland        | cal 76000; shell 5670 g (family)                                                                     | DECK_OPEN, DECK_SHIELDED                 | [NP] evertsen/holland        | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr`    | **Hotchkiss 37 mm (1.5-pdr)** — all classes                      | cal 37000; shell ~500 g (EST); ROF ~20                                                               | DECK_OPEN                                | [NP] class pages             | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `tube_14in_above_water` | **35.6 cm Whitehead, above-water (beam)** — Sumatra 1891         | bore 356000; ABOVE_WATER_TRAINABLE                                                                   | —                                        | [NP] `nl_cr_sumatra`         | SINGLE-SOURCE |
| `tube_14in_submerged`   | **45 cm Whitehead, submerged bow/stern** — Ardjoeno/Evertsen/Holland | bore **450000** (differs from the family's 356000 — approximation)                                | —                                        | [NP] `nl_dd_ardjoeno`        | SINGLE-SOURCE |

Notes: the Dutch heavies are **Krupp BL**, not British RMLs; rows 1–2 and 4–9 are overlays (calibre/designation
override on a different-mechanism family where no Krupp family exists) — the mismatch is **deferred** (§G). All
shell masses except the British RML family values are **ESTIMATE**.

---

# D. Six 1880 opening designs (B, CA, CL, DD, KE, AMC)

Legal 1880-01 **DOCTRINE_TEMPLATE** starters, not historical reconstructions (historical hulls in §A.2). B/CL/KE are
grounded in historical lines (Matador/Draak; Sumatra; Batavia/Sommelsdijk); CA/DD/AMC are doctrine templates.
**Moulded depth is UNVERIFIED for every Dutch ship** — `depthToMainDeck` is ESTIMATE. Plant: `compound_cylindrical`
(the only 1880 plant; min 300 kW, max 8,000 kW). No Dutch ironclad/coast-defence battleship or tube torpedo boat is
legal in 1880-01; B and DD are templates.

| slot | shape / inspiration (source)                                  | hull form              | Lwl/B/T (mm)            | depth (mm) | displ (kg) | plant / kW | fuel (kg) | main / secondary                                                                   | armour scheme                                       | doctrine note |
| ---- | ------------------------------------------------------------- | ---------------------- | ----------------------- | ---------- | ---------- | ---------- | --------- | ---------------------------------------------------------------------------------- | --------------------------------------------------- | ------------- |
| **B**  | Matador/Draak low-freeboard monitor (1878–79) [NP]/[SBN]     | coast_defence_form     | 65,100 / 15,000 / 3,630 | 6,500 EST  | 2,200,000  | compound_cylindrical / 600 | 109,000 | 1 × 2 `gun_bl_263mm_rkl20` (283 Krupp) in 1 twin TURRET; 2 × `gun_hotchkiss_3pdr` | iron side 205–140, turret 305–230, deck 25 (IMPORTED) | shallow-draught home monitor: iron belt + twin Krupp turret, 7.5–8.4 kn |
| **CA** | Koningin Wilhelmina der Nederlanden (1894) [NP]               | protected_cruiser_form | 99,800 / 14,900 / 6,070 | 8,500 EST  | 4,530,000  | compound_cylindrical / 2,400 | 411,000 | 1 × 1 `gun_bl_263mm_rkl20` (283) TURRET; 1 × 1 `gun_rml_8in_9ton` (209) + 2 × 1 `gun_rml_7in_7ton` (173) DECK_SHIELDED | deck 50 + 75 slopes, barbette/turret 280 compound, CT 240 | largest Dutch cruiser shape: European-station armoured cruiser with imported heavy turret |
| **CL** | Sumatra protected cruiser (1891) [NP]                         | protected_cruiser_form | 70,000 / 11,300 / 4,670 | 7,000 EST  | 1,693,000  | compound_cylindrical / 1,750 | 276,000 | 1 × 1 `gun_rml_8in_9ton` (209) DECK_SHIELDED; 1 × 1 `gun_bl_6in_26` (149) + 2 × 1 `gun_qf_47in` (120) DECK_SHIELDED | protective deck 38, shields 100, CT 150; 2 × `tube_14in_above_water` | colonial protected cruiser: 17 kn, thin deck, mixed imported Krupp battery |
| **DD** | Ardjoeno 1st-class torpedo boat (1887) [NP]                   | torpedo_boat_form      | 38,400 / 3,970 / 1,830  | 2,800 EST  | 82,000     | compound_cylindrical / 600 | 10,000 | 2 × `gun_hotchkiss_3pdr`; 2 × `tube_14in_submerged` (approx of the 450 mm bow)      | nil | steel torpedo boat (approximation of the 1887 type on a legal 1880 plant/tube model — content gap, §G) |
| **KE** | Sommelsdijk composite colonial sloop (1882) [NP]              | coast_defence_form     | 54,500 / 9,510 / 3,580  | 5,500 EST  | 997,000    | compound_cylindrical / 570 | 180,000 | 1 × 1 `gun_bl_6in_26` (149) DECK_SHIELDED; 3 × 1 `gun_qf_47in` (120) BROADSIDE | nil (composite hull, iron frame) | endurance colonial sloop/gunboat for East Indies station (3,500 nmi at 10 kn) |
| **AMC**| Nederlandsche Stoomboot Mij / Rotterdamsche Lloyd liner from trade [REPO] | merchant_liner_form | 110,000 / 13,500 / 6,500 | 8,000 EST | 3,500,000 | compound_cylindrical / 2,600 | 900,000 | 4 × `gun_qf_47in` (120) DECK_OPEN; 1 × `tube_14in_above_water`                     | none (hull only) | armed ocean liner (doctrine template); the Dutch merchant marine is the reserve cruiser pool |

Block coefficients (ESTIMATE, `blockCoeffBp` ×10000): B ≈ 6050 (2,200 t / (1.025 × 65.1×15.0×3.63)); CA ≈ 4900;
CL ≈ 4470; DD ≈ 4000 (game convention; computed ≈2870 unreliable at this scale, as in the Qing note); KE ≈ 5240;
AMC ≈ 3540. All six are ESTIMATE for dimensions, power and armour.

> **B-armament caveat.** The historical Matador/Draak mounted **two 28 cm Krupp** guns; the catalogue has no Dutch
> 28 cm family, so B uses the nearest *Krupp-built* family `gun_bl_263mm_rkl20` with a calibre override to 283 mm.
> A dedicated 28 cm Krupp family is the correct fix (deferred, §G). **DD scale note.** Ardjoeno's real tubes are
> 450 mm; the catalogue's 1880 model is 356 mm, so DD approximates with 356 mm.

---

# E. Recommendations (concrete profile values, non-normative)

| profile field | Dutch candidate | basis | label |
| --- | --- | --- | --- |
| `strategicSituation` postures | `[coastal_defence, colonial_presence]` (+ secondary `distant_water_operations`, `commerce_defence`; weak `torpedo_warfare`) | §A.1 | grounded shape |
| `industrialProfile.buildTimeMultiplierBp` / `costMultiplierBp` | 10600 / 10600 (10300–10800) | small yards/series + imports | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.machineryReliabilityBp` / `constructionQualityVarianceBp` | 8600 / 3200 | domestic compound engines; moderate variance | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.maxPracticalDisplacementKg` (1880/1885/1890) | 3.7M / 3.9M / 4.6M | Atjeh 3,669 t; Koningin Wilhelmina 4,530 t | ESTIMATE |
| `industrialProfile.heavyGunProduction` / `armourPlateProduction` | IMPORTED / IMPORTED | [NP] | grounded / ESTIMATE |
| `doctrineProfile.engagementRangeM` / `hePreferenceBp` | 1800 / 4500 | short period range; black-powder AP | ESTIMATE / **BALANCE TARGET** |
| `researchPreferences` | HULL 3, INFRA 3, MACHINERY 3, MINES 3, then 2s (§A.6) | §A.6 | grounded shape / ESTIMATE |
| `componentAccess` / `gunModels` / `componentVariants` / `designs` | §B / §C / §C / §D | §B–D | mixed per row |
| `namingPolicy` | §F | published names | grounded (SINGLE-SOURCE) |
| `hardCapabilities.{maxGunCaliberUm, maxArmourThicknessUm, domesticTorpedoDiameterUm}` | 283000 / 305000 / 450000 | §B | grounded |
| `designWeights` (B/CA/CL/DD/KE/AMC) | protection/speed balanced, torpedo low (DD high), colonial high on CL/KE/AMC | §D | **BALANCE TARGET** |
| `procurementPolicy.buildOrder` | [B, KE, CL, CA, DD, AMC] | §D | **BALANCE TARGET** |

Keep every cost/build-time modifier inside **±15 %** and label it BALANCE TARGET; ship every ESTIMATE/UNVERIFIED with
its label. The proposed multipliers sit mid-band (slower/costlier than the UK, cheaper than import-only Qing).

---

# F. Naming policy

Published 1880s–1900s Dutch names as stems (historical facts; cited to [NP] class pages and [NA86] p. 291).

| type          | convention (one line)                                                                                                | stems (published names)                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **B**         | monitor/turret-ram names: **predators and mythical/strong animals**                                                  | Matador, Draak, Schorpionen, Stier, Buffel, Guinea, Adder, Haai, Hyena, Luipaard, Panter, Wesp, Reus, Cerberus                  |
| **CA**        | armoured/coast-defence ships: **Dutch provinces, naval heroes, royalty**                                             | Evertsen, Piet Hein, Kortenaer, Koningin Wilhelmina der Nederlanden, De Zeven Provinciën, Jacob van Heemskerck, M. H. Tromp     |
| **CL**        | cruisers: **colonial possessions, islands and naval heroes**                                                         | Sumatra, Java, Holland, Zeeland, Friesland, Gelderland, Noord Brabant, Utrecht, Atjeh, Tromp, De Ruyter, Van Speyk, Koningin Emma |
| **DD**        | torpedo boats: **early boats numbered; later Indonesian volcanoes/places and creatures**                              | I, II, III, IV, V, X, XIII, XIX, XXI; Ardjoeno, Krakatau, Idjen, Dempo, Cycloop, Foka, Batok, Habang, Goentoer, Empong          |
| **KE**        | colonial sloops/gunboats: **East Indies places**; home gunboats: **predators / Norse myth**                          | Batavia, Samarang, Madura, Bonaire, Padang, Bali, Benkoelen, Makasser, Alkmaar, Sommelsdijk; Ever, Hydra, Havik, Vos, Bever, Sperwer, Wodan, Thor, Tyr, Freyr, Balder, Heimdall |
| **AMC**       | names taken up from trade (Nederlandsche Stoomboot Mij / Rotterdamsche Lloyd liners); no dedicated naval series in-band | (Dutch liner names; no naval series grounded in-band — UNVERIFIED)                                                             |

All stems except the AMC series are SINGLE-SOURCE (published lists); the AMC series is **UNVERIFIED**. A full
curated dataset is content authoring, not research.

---

# G. Deferred (needs an owner or a decision-request)

- **A dedicated 28 cm (283 mm) Krupp family.** The real Dutch heavies are **283/20 and 283/27 Krupp No.1/No.2**
  [NP]. No such family exists; this note overlays the *Krupp-built* `gun_bl_263mm_rkl20` (26 cm) with a calibre
  override. A dedicated family (e.g. `gun_krupp_283mm_l20`) is the correct fix — **the biggest gap for Dutch
  capital/coast-defence armament.**
- **Dedicated Krupp 209/173/149 mm medium families.** These are overlaid on British RML/BL families (mechanism
  mismatch). Confirm multiple models per family are legal or add dedicated families; interacts with schema, not balance.
- **Shell masses for every Krupp gun** are ESTIMATE (sources give bore/designation, not projectile weight); a clean
  Mackinlay Table XVII read or a Krupp catalogue would upgrade them.
- **The 1886 annual's Dutch descriptive list (pp. 254–256) did not OCR** — only the plate/index and turning-powers
  table were readable; a clean Brassey scan would upgrade the 1880s figures to VERIFIED.
- **Moulded depth for every design** — no source gives it; depths are ESTIMATE.
- **Torpedo bore mismatch** — the catalogue's 1880 model is 356 mm; the Dutch used **450 mm** from 1887. A distinct
  450 mm tube or a recorded approximation is needed.
- **Pre-1887 torpedo-plant gap** — the only 1880 plant is `compound_cylindrical`; `locomotive_boiler_tb` is dated
  1890, so the DD starter is a scaled approximation.
- **`maxPracticalDisplacementKg` semantics** — domestic-build ceiling only (~3.7–4.6 M) or all construction? Surface;
  do not resolve.
- **Armour-plate and heavy-gun production = IMPORTED** are inferences (absence of evidence in [NP]), not sourced
  statements that none existed.
- **Dutch budget / yard capacity** — no estimate/yard/dock table opened; `[REPO]` figures are framing, not historical.
- **Build-time/cost/reliability/variance multipliers** — BALANCE TARGET (no single sourced Dutch multiplier).
- **`research.yaml` priority conflict** — shipped empty `fieldPriorities` vs HULL/INFRA/MACHINERY/MINES at 3; a
  content/balance decision, not a fact.
- **CA/DD/AMC are doctrine templates** — no Dutch armoured cruiser before 1894, no tube torpedo boat before 1887.
- **Naming dataset** — stems listed; a full curated dataset is deferred to the spec/implementator.

No `docs/OPEN-ISSUES.md` decision was resolved here.

---

# H. Verdict

**Qualified yes — the Dutch profile is authorable now, with per-figure labels.** The *shape* — a small, neutral,
colonial trading power with shallow-water coast defence (monitors, turret rams, Rendell gunboats), colonial
cruisers/sloops, imported Krupp/Armstrong guns and iron/compound armour, and a domestic hull-and-machinery
capability — rests on the directly-read [NP] class pages (builder + armament fields) and the directly-read [NA86]
turning-powers table/index. Dutch 283/229/209/178/173/149/120/75 mm guns are all [NP]-sourced (designation/calibre);
the 229 mm RML carries the [PRE] §5 shell value. ESTIMATE/BALANCE TARGET: every industrial multiplier, the
max-displacement progression, quality variance, all research weights, most Krupp shell masses, and the CA/DD/AMC
(and B-armament) templates. Missing (each a labelled deferred item): the dedicated 28 cm Krupp family, the Krupp
medium families, most Krupp shell masses, Dutch budget/yard data, moulded depths, the torpedo bore mismatch.
Recommendation: author now with §E; keep multipliers inside ±15 % labelled BALANCE TARGET; raise a decision-request
for the 28 cm Krupp family (and Krupp medium overlays) before authoring Dutch capital-ship armament.

## Source list

1. navypedia.org Netherlands pages, **read directly this session**: `netherlands/nl_bb_matador.htm`,
   `nl_bb_draak.htm`, `nl_bb_schorpionen.htm`, `nl_bb_adder.htm`, `nl_bb_evertsen.htm`, `nl_cr_atjeh.htm`,
   `nl_cr_sumatra.htm`, `nl_cr_koningin_wilhelmina_der_niderlanden.htm`, `nl_cr_holland.htm`, `nl_cr_alkmaar.htm`,
   `nl_cr_sommelsdijk.htm`, `nl_of_batavia.htm`, `nl_of_wodan.htm`, `nl_of_hydra73.htm`, `nl_dd_ardjoeno.htm`,
   `nl_dd_v.htm`.
2. T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886` (`NavalAnnual1886_djvu.txt`, read
   directly): turning-powers table (Netherlands) p. 291; index/plates pp. 254–256.
3. `docs/research/ship-building-1880-ships-by-nation.md` §6.9 — in-repo, [NP]-derived.
4. `docs/research/ship-building-1880-pre-era-armament.md` §5 — in-repo (RML/Armstrong values; Austrian 28 cm row).
5. Print works named as leads (not opened): Conway's _All the World's Fighting Ships 1860–1905_ (1979, Netherlands
   chapter); Jane's _Fighting Ships_ (1898); A. Roksund, _The Jeune École: The Strategy of the Weak_ (Brill, 2007).
6. In-repo companions/framing: `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
   `qing-naval-profile.md`, `docs/ships-nation-orientation.md`; `content/production/1880/**`.
