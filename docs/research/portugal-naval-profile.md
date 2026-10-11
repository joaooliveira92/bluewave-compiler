# Research: national naval profile — Portugal (`portugal`, 1880–1899)

Companion to `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
`italy-naval-profile.md`, `japan-naval-profile.md`, `russia-naval-profile.md`, `usa-naval-profile.md`,
`qing-naval-profile.md`, `spain-naval-profile.md`; method, source grades and confidence labels are identical.
Every in-repo figure (gun families, plants, hull forms, balance) is reused from the EARLY-band notes, never
re-derived here. Captured 2026-10-11.

Authored for the `portugal` (canonical `NationNavalProfile`) of the `scen_1880` national-naval initiative
(`docs/ships-nation-orientation.md`, ADR-0088/0089 line of work). This is a **research-only** pass: no code,
no content YAML and no spec is authored here. The orchestrator/spec may then author the profile.

Read first: `.ai/ENGINEERING-CONTRACT.md` (Content + Factual grounding), `docs/ships-nation-orientation.md`,
`docs/research/ship-building-1880-ships-by-nation.md` §6.10 (the in-service Portuguese hull, reused not
re-derived), the shipped draft `content/production/1880/{countries,research,economies,possessions}.yaml` and
`content/production/1880/ship-building/{components,plants,hull-forms,balance}.yaml`. Portugal has **no**
`naval-profiles/portugal.yaml` and **no** `reference-designs/portugal/` yet — that is the gap this note fills.
DESIGN-55 §14 guard respected: no deferred mechanic is treated as reachable.

## 0. Question

What are the grounded figures and national differentiators needed to author a **date-banded
`NationNavalProfile` (1880–1899) for the Kingdom of Portugal**, plus 8–15 shared-family national models and six
1880 opening designs (B, CA, CL, DD, KE, AMC), with research priorities, component access and naming policy?

The defining fact, established before anything else: **in January 1880 Portugal had exactly one armoured ship** —
the small, British-built, Krupp-armed coast-defence casemate ironclad *Vasco da Gama* (1876) — plus a handful of
wooden/composite screw sloops, small colonial gunboats and one spar torpedo boat. It was the oldest and poorest
colonial empire in western Europe, guarding Angola, Mozambique, Goa, Macau, Timor and the Atlantic islands with a
tiny, scattered navy, no domestic heavy-gun or armour-plate industry, and a stated doctrine of *colonial patrol,
station presence, gunboat diplomacy and port defence* (`countries.yaml`, id `portugal`). Everything below is
shaped by that.

## 1. Method, source grades and confidence labels

Every figure carries a named source and one of:

- **VERIFIED** — read directly in a period primary/near-primary text (full text fetched and read), or two independent sources agree.
- **SINGLE-SOURCE** — one source only, or a secondary compilation that itself cites print works (named) which I could not open.
- **DERIVED** — computed by me from other cited figures (calculation shown).
- **ESTIMATE** — derived by me from other cited figures or an inferred range; not itself a source figure.
- **UNVERIFIED** — no usable source found, or sources conflict; a plausible range is given instead.

**Wikipedia is not cited as a source anywhere.** Where a page was used only as a lead to the print work it
cites, the print work is named and the row is at most SINGLE-SOURCE.

| Tag     | Source                                                                                                                                                                                                                                             | Grade / reach                                                            |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [NP]    | navypedia.org **Portugal** class pages (Ivan Gogin), built principally on Conway's _All the World's Fighting Ships 1860–1905_ + national histories. **Read directly this session** (slugs per row in the Source list).                                | Secondary compilation → **SINGLE-SOURCE**.                               |
| [NA86]  | T. A. Brassey (ed.), **_The Naval Annual 1886_** — archive.org id `navalannual1886`, full OCR text `NavalAnnual1886_djvu.txt` (49,093 lines) **read directly this session**: "Portugal—Unarmoured Ships" p. 261; turning-power table p. 291; illustration index (Vasco de Gama, plate 78). | **Primary contemporary annual** — figures actually read are **VERIFIED**. |
| [SBN]   | `docs/research/ship-building-1880-ships-by-nation.md` §6.10 (in-repo; itself [NP]-based): *Vasco da Gama*.                                                                                                              | In-repo, re-used, not re-derived; SINGLE-SOURCE.                         |
| [PRE]   | `docs/research/ship-building-1880-pre-era-armament.md` (in-repo): RML shell/charge/MV catalogue values.                                                                                                             | In-repo ordnance table; VERIFIED where Mackinlay is quoted.              |
| [REPO]  | Shipped content `content/production/1880/{countries,research,economies,possessions}.yaml` — **not a historical source**.                                                                                                | Repo framing only; do not treat as historical grounding.                 |
| [EB]    | _Encyclopaedia Britannica_ 11th ed. (1911), "Armour Plates" (via the UK/France note).                                                                                                                                 | Near-primary (contemporary reference).                                   |
| [CW]    | Conway's _All the World's Fighting Ships 1860–1905_ (1979). **Not opened** online; relayed only via [NP].                                                                                                            | Print secondary; SINGLE-SOURCE (relayed).                                |
| [J98]   | Jane's _Fighting Ships_ (1898). **Not opened.**                                                                                                                                                                       | Print secondary; lead only.                                              |

Limits: Conway's itself was not reachable; [NP] is a single compilation, so nearly every ship figure is
SINGLE-SOURCE. [NA86] is a period annual and its Portuguese passages are read directly (VERIFIED as read). **No
Portuguese naval budget/yard-return primary was opened** (the annual's Portuguese estimates page was not recovered
from the OCR; an escudo/reis figure is absent). Industrial multipliers, research weights and design weights are
therefore explicit **BALANCE TARGET / ESTIMATE**. Moulded depth is not given by [NP] for any Portuguese ship
(UNVERIFIED), as in every companion note. Torpedo bores read on Portuguese ships are **356 mm**, which equals the
catalogue's 14-in (356 mm) model exactly.

Conversions: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 ihp = 0.7457 kW; 1 kn = 0.5144 m/s.

---

# A. National naval profile (1880–1899)

## A.1 Strategic posture

The 1886 annual is blunt: Portugal's armoured list is a single ship — *Vasco da Gama*, the only Portuguese entry
in the annual's armoured-ship tables and the only Portuguese ship in the turning-power table `[NA86]` pp. 259,
291. The repo framing (`countries.yaml` id `portugal`, `doctrine.schools: [colonial_patrol, station_presence,
gunboat_diplomacy, port_defense]`) matches that shape.

| posture                      | applies?           | justification (one line)                                                                                                                                            | source                                   | confidence                 |
| ---------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------- |
| **colonial_presence**        | **PRIMARY**        | Angola, Mozambique, Goa, Macau, Timor and the Atlantic islands must be garrisoned and supplied; the navy's stated primary objective is the colonial empire.        | `possessions.yaml`; `areas.yaml`; [REPO] | VERIFIED (in-repo content) |
| **coastal_defence**          | **PRIMARY**        | Lisbon and the Tagus are the vital point; the one ironclad is a *coast-defence* casemate ship, and "port defence" is a stated school.                              | `[NA86]` p. 259; [NP] Vasco da Gama; `countries.yaml` | SINGLE-SOURCE / VERIFIED (in-repo) |
| **distant_water_operations** | **PRIMARY**        | Three separated colonial theatres (Atlantic/African west, Indian Ocean/Asia) with no sea link; distant stations demand long-endurance cruisers and gunboats.        | `[NA86]` p. 261; [NP]                    | SINGLE-SOURCE              |
| **commerce_defence**         | secondary          | Colonial trade protection and the British lifeline; a defensive, not offensive, use of cruisers.                                                                   | `countries.yaml`; [REPO]                 | VERIFIED (in-repo content) |
| **regional_warfare**         | secondary          | African colonial rivalry and the Pink Map (Angola↔Mozambique) create regional contingencies, but no concentration doctrine.                                        | `countries.yaml`; [REPO]                 | ESTIMATE                   |
| **torpedo_warfare**          | weak               | A real but tiny programme: *Fulminante* (1880, spar), *Espadarte* (1881, 356 mm), three 110-ft/60-t/20-kn boats building at Poplar (1886).                          | `[NA86]` pp. 261; [NP] Fulminante/Espadarte/N°2 | VERIFIED (as printed)      |
| battle_fleet_concentration   | **does NOT apply** | One obsolescent coast-defence ironclad; no battle line and no capability or budget to build one.                                                                   | `[NA86]` p. 259; `countries.yaml`         | SINGLE-SOURCE              |
| commerce_raiding             | **does NOT apply** | Not a Portuguese 1880 doctrine; effort goes to *defence* of the colonial sea lanes, not guerre de course.                                                          | reasoning; `[NA86]` passim                | DERIVED                    |

**Recommended primary postures: `colonial_presence + coastal_defence + distant_water_operations`**, with
`commerce_defence` co-equal, `regional_warfare` secondary and `torpedo_warfare` a weak preference. This is
deliberately *not* the UK/France/Germany list. The single foreign-built ironclad is an *industrial-capability*
fact (§A.2), not a battle-fleet posture.

### A.1.1 In-service 1880 ships (from [NP]/[SBN]/[NA86] — do not re-derive)

- **Vasco da Gama** coast-defence casemate ironclad (comp. 1876, **Thames Iron Works, Blackwall, UK**): 2,384 t;
  61.0 pp / 14.2 over battery (12.2 wl) × 5.79 m; 2 VC, 3,000 ihp (2,237 kW), 10.3 kn, endurance 2,500 nmi @9;
  2 × 1 **263/18 RK L/20 C/74** + 1 × 1 **149/22 RK L/22 C/75** + 4 × 1 **67/40 Krupp**; wrought-iron belt
  229–102 (complete), battery 254–152; coal 300 t; crew 232. `[NP]`/`[SBN]` — SINGLE-SOURCE. *[NA86]* p. 291
  prints a turning-trial figure of 285 yd diameter at "13.5 kn" (VERIFIED as printed; the speed exceeds her 10.3
  kn trial speed, so the printed value is suspect — flagged, not corrected) and p. 259 lists her as Portugal's
  sole armoured ship.
- **Bartolomeu Dias** wooden screw corvette (comp. 1858, **UK**): 2,377 t; 63.1 pp × 11.4 × 6.25 m; 1 HRCR,
  400 ihp (298 kW), 10 kn; 28 guns as built, **17 MLR** in the 1870s; coal 360 t; crew 473. `[NP]` — SINGLE-SOURCE.
- **Duque da Terceira** wooden screw sloop (comp. 1864, **Arsenal de Marinha de Lisboa — DOMESTIC**): 1,406 t;
  54.9 pp × 10.4 × 4.50 m; 660 ihp (492 kW), 10 kn; 13 guns as built, 1870s **8 × 163/14 Armstrong 70-pdr MLR**,
  1880s **2 × 149/22 RK L/25 C/75 + 2 × 65/40 Hotchkiss**; coal 200 t; crew 194. `[NP]` — SINGLE-SOURCE.
- **Gunboats** — *Tejo* class (Tejo 1869, Douro 1873, Quanza 1877; **Arsenal da Marinha, Lisboa — DOMESTIC**):
  578 t; 43.6 pp × 7.90 × 3.30 m; 400–500 ihp, 9–10 kn; **1 × 163/14 Armstrong 70-pdr MLR + 2 × 121/14
  Armstrong 40-pdr MLR**; crew 109. *Rio Lima* (1875, **Laird, UK**): 628 t; 1 × 178/16 Armstrong 6.5-ton MLR +
  4 × 121/14 40-pdr MLR. *Rio Tâmega*/*Rio Sado* (1875, **Laird, UK**): 635 t, same armament. *Mandovi*/*Bengo*
  (1879, **Laird, UK**): 455 t; 38.2 pp × 7.50 × 2.69 m; 10.5 kn; **1 × 152/26 A.15/28 + 2 × 87/21 K.87/24
  Krupp**. *Tavira*/*Faro* (1878): 160 t small colonial gunboats. `[NP]` — SINGLE-SOURCE.
- **Fulminante** spar torpedo boat (comp. 1880, **Thames Iron Wks, UK**): 40 t; 22.9 pp × 4.57 × 0.76 m; 1 VC,
  150 ihp, 11.5 kn; 2 spar torpedoes. `[NP]` — SINGLE-SOURCE. `[NA86]` p. 261 lists her and the *Espadarte*.

## A.2 Industrial capability

Direction of every multiplier is grounded (slower, costlier, low-reliability, higher-variance); the magnitude is a
balance choice inside the ±15 % band.

| item                              | figure / direction                                                                                                                                                                                                                          | unit        | source                                    | confidence                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------- | ----------------------------- |
| Foreign dependence (the key fact) | The ironclad and most efficient cruisers were **built abroad**: *Vasco da Gama* (Thames Iron Wks, UK), *Bartolomeu Dias* (UK), *Rio Lima*/*Rio Tâmega*/*Rio Sado*/*Mandovi*/*Bengo* (Laird, UK), *Fulminante* (Thames, UK), *Espadarte*/*N°2–4* (Yarrow, UK), *Afonso d'Albuquerque* (Thames, UK). | —           | [NP] builder fields; [NA86] p. 261          | VERIFIED (direct)             |
| Domestic yard                     | The **Arsenal da Marinha, Lisboa** built the *Duque da Terceira* (1864, 1,406 t), the *Tejo* class (1869–77, 578 t), *Rio Vouga* (1882, 710 t) and *Vilhena* (1882, 160 t). No other Portuguese warship yard is named in [NP].               | —           | [NP] builder fields                        | VERIFIED (direct)             |
| Domestic build ceiling (actual)   | Small: the largest **domestic** hull in [NP] is the *Duque da Terceira* at 1,406 t (1864); by 1880 the domestic builds were gunboats of 160–710 t. Larger hulls were all imported.                                                             | t           | [NP] builder/displacement fields            | SINGLE-SOURCE                 |
| Build-time multiplier             | **SLOWER/SAME** than the 1894 baseline: one small, hand-worked arsenal; even foreign orders took years. Propose **10800 bp** (range **10700–11200**).                                                                                        | ×           | [NP] completion slips; ESTIMATE             | ESTIMATE / **BALANCE TARGET** |
| Cost multiplier                   | **HIGHER**: imported ships, guns and armour attract freight/licence/political cost; tiny series; the 1880 programme was funded by London loans (`countries.yaml`). Propose **10900 bp** (range **10700–11200**).                              | ×           | `countries.yaml`; ESTIMATE (no cost series) | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement        | **1880 ≈ 1.4 M kg domestic** (largest domestic hull, *Duque da Terceira* 1,406 t); imported hulls bypass the ceiling (*Vasco da Gama* 2.384 M). 1885 ≈ 1.4 M; 1890 ≈ 2.0 M.                                                                  | kg          | [NP]; ESTIMATE from completed classes        | ESTIMATE                      |
| Heavy-gun production              | **IMPORTED**: Krupp 263/149/67 mm (Vasco da Gama), Krupp 87/21 (Mandovi), Krupp 76/16 (Vilhena); Armstrong RMLs (163/178 mm) and later Armstrong QF (152/100 mm). **No Portuguese heavy-gun factory evidenced in-band.**                     | —           | [NP] armament fields; `[NA86]` p. 261        | VERIFIED (direct)             |
| Armour-plate production           | **IMPORTED**: *Vasco da Gama*'s wrought-iron belt and battery were made in Britain (Thames Iron Wks build). No Portuguese plate mill named.                                                                                                   | —           | [NP] Vasco da Gama; [EB] relayed             | SINGLE-SOURCE                 |
| Machinery reliability             | Mostly imported/foreign-built plant (VC/HRCR/HSE); the domestic ships are small and old. Propose **8200 bp** (below the RN's 9,000 compound baseline).                                                                                        | bp          | [NP]; plants.yaml (compound 8500)            | ESTIMATE / **BALANCE TARGET** |
| Construction-quality variance     | **higher** than the UK — a dependent, cash-starved navy; old imported hulls kept in service for decades. Propose **3500 bp**.                                                                                                                 | bp          | [NP] (Vasco da Gama served to 1933); ESTIMATE | ESTIMATE / **BALANCE TARGET** |
| Budget                            | `[REPO]`: `researchBudget 4`, treasury 40, income 3, expenses 2 — the smallest of the fourteen nations. Not a historical source; **no Portuguese annual/escudo table was opened**.                                                             | —           | `[REPO]` `research.yaml`, `economies.yaml`   | ESTIMATE                      |

## A.3 Gunnery, protection and propulsion doctrine

| field                          | Portugal position (1880)                                                                                                                                     | source                                | confidence                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------- |
| preferred engagement distance  | **short (~1,500 m)** — the period's decisive close action; hand-worked RMLs and early Krupp BLs.                                                              | `[NA86]`; period fact                 | ESTIMATE (period)         |
| main-gun emphasis              | **few, heavy, imported**: 263 mm Krupp on the ironclad; the sloops/gunboats carry 149/163/178 mm imports.                                                     | [NP]; `[SBN]` §6.10                   | SINGLE-SOURCE             |
| secondary-battery emphasis     | **mixed and imported**: Krupp 149/87/67/76 mm, Armstrong 163/178/152/100 mm, Hotchkiss 65/47 mm.                                                              | [NP] each class                       | SINGLE-SOURCE             |
| gun-quality priorities         | buy the best available (Krupp → Armstrong); standardisation not prioritised (the fleet mixes Krupp BL and Armstrong RML/QF).                                 | [NP]; `[NA86]` p. 261                 | SINGLE-SOURCE             |
| AP-vs-HE preference            | **AP-dominant**: Krupp steel shot / Palliser armour-piercing was the standard period projectile.                                                              | `[PRE]`; period fact                  | SINGLE-SOURCE             |
| fire-control research priority | low in-band; no rangefinding before the 1890s.                                                                                                                | components.yaml (`rangefinder_optical` 1893) | DERIVED            |
| rate-of-fire preference        | low: heavy Krupp BL ~1 rds/min; hand-worked RML ~0.3–0.4 rds/min; Hotchkiss 47–65 mm 15–20/min.                                                               | `[PRE]`; [NP]                         | SINGLE-SOURCE / ESTIMATE  |
| protection doctrine            | **complete waterline belt + battery** on the one ironclad (229–102 / 254–152 wrought iron); sloops and gunboats **unarmoured** (wood/composite, coal-bunker side protection). | [NP] Vasco da Gama; [NP] sloops       | SINGLE-SOURCE             |
| propulsion                     | imported compound/HRCR and (for Vasco da Gama) 2-cylinder VC; all Portuguese 1880s ships are **compound, cylindrical boilers** — no TE before 1885.          | [NP]                                  | SINGLE-SOURCE             |
| speed margin                   | **low**: ironclad 10.3 kn; sloops 10–13 kn; gunboats 10–12 kn; the torpedo boats reach 19–20 kn.                                                              | [NP]; `[NA86]` p. 291                 | SINGLE-SOURCE             |
| endurance                      | designed for distant stations: Vasco da Gama 2,500 nmi @9; the gunboats carry 80–100 t coal.                                                                  | [NP]                                  | SINGLE-SOURCE             |

**Doctrine line:** colonial/coastal-defensive, short-range, AP-dominant, few imported Krupp/Armstrong guns, one
old foreign-built coast-defence ironclad, unarmoured sloops and gunboats, a tiny imported torpedo flotilla, no
rangefinder.

## A.4 Research preferences (canonical fields, priority 1–4)

Shipped draft `[REPO]`: Portugal = `{}` (none), `researchBudget 4`. Grounded recommendation (the shape is an
**ESTIMATE / BALANCE TARGET** — a poor, dependent, import-bound navy whose binding constraint is its yard and its
colonial coaling stations):

| field             | priority | justification                                                                          | source                        | confidence    |
| ----------------- | -------- | -------------------------------------------------------------------------------------- | ----------------------------- | ------------- |
| INFRASTRUCTURE    | 3        | the binding constraint: Arsenal da Marinha, docks and colonial coaling stations        | `[NP]` builder fields; [REPO] | SINGLE-SOURCE |
| GUNNERY           | 2        | all guns imported; some mounting/fitting knowledge                                     | `[NP]` armament fields        | ESTIMATE      |
| HULL_CONSTRUCTION | 2        | composite/wooden sloops and gunboats; steel hulls only later and imported              | `[NP]`                        | SINGLE-SOURCE |
| TORPEDOES         | 2        | small but real: *Fulminante* (1880), *Espadarte* (1881), N°2–4 (1886), 356 mm Whitehead | `[NA86]` p. 261; [NP]         | VERIFIED (as printed) |
| MACHINERY         | 2        | dependent on imported/foreign-built plant; slow domestic builds                        | `[NP]`                        | ESTIMATE      |
| DAMAGE_CONTROL    | 2        | subdivision not a stated priority; coal-bunker protection only                         | `[NP]`                        | ESTIMATE      |
| SHIP_DESIGN       | 2        | foreign-derived designs (Vasco da Gama = Thames; sloops = Laird/Yarrow)                | `[NP]`                        | SINGLE-SOURCE |
| MINES_AND_ASW     | 1        | port-defence framing only; no in-band mine programme evidenced                          | —                             | UNVERIFIED    |
| FIRE_CONTROL      | 1        | no in-band rangefinding                                                                | components.yaml               | DERIVED       |
| SUBMARINES        | 1        | **deferred mechanic (DESIGN-55 §14)** — Portugal's first submarine is 1913 (post-band); record the preference only | `[CW]` relayed                | UNVERIFIED    |

> **DESIGN-55 §14 guard.** SUBMARINES is recorded as a *research preference* only; no deferred mechanic is
> treated as reachable. Reconciliation: the shipped draft gives no fields; the grounded reading adds the low
> priorities above — a **content/balance decision** for the orchestrator, not a fact this note can settle.

---

# B. Component access (shared families)

Status ∈ DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED | UNAVAILABLE. The catalogue's gun families
are British RMLs/BLs, the French 27 cm and the German 26 cm. Portugal's signature is **imported Krupp heavies
and imported Armstrong RML/QF**; other nations' signature heavies are `UNAVAILABLE`.

| family id                        | status       | producer / note                                                                          | source / evidence                        | confidence    |
| -------------------------------- | ------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------- | ------------- |
| gun_rml_16in_80ton               | UNAVAILABLE  | British 80-ton — not used                                                                | —                                        | rule          |
| gun_rml_125in_38ton              | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_rml_12in_35ton               | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_rml_12in_25ton               | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_rml_11in_25ton               | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_rml_10in_18ton               | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_rml_10in_18ton_broadside     | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_rml_8in_9ton                 | **IMPORTED** | **Armstrong 178 mm 6.5-ton RML** (Rio Lima, Rio Tâmega/Sado)                             | [NP] Rio Lima/Tâmega                     | SINGLE-SOURCE |
| gun_rml_7in_7ton                 | UNAVAILABLE  | no grounded Portuguese use                                                               | —                                        | UNVERIFIED    |
| gun_rml_64pdr_71cwt              | **IMPORTED** | **Armstrong 163 mm 70-pdr RML** (Tejo/Douro/Quanza; Duque da Terceira 1870s)             | [NP] Tejo/Duque da Terceira              | SINGLE-SOURCE |
| gun_bl_274mm_m1875               | UNAVAILABLE  | French signature heavy                                                                   | —                                        | rule          |
| gun_bl_263mm_rkl20               | **IMPORTED** | **Krupp 263 mm RK L/20 C/74** (Vasco da Gama main)                                       | [NP] Vasco da Gama; [SBN] §6.10          | SINGLE-SOURCE |
| gun_bl_12in_25                   | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_bl_135in_30                  | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_bl_12in_35                   | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_bl_10in_32                   | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_bl_92in_315                  | UNAVAILABLE  | British — not used                                                                       | —                                        | rule          |
| gun_bl_6in_26                    | **IMPORTED** | **Krupp 149 mm RK L/22 C/75** overlay (Vasco da Gama 2nd; Duque da Terceira)             | [NP] Vasco da Gama/Duque da Terceira     | SINGLE-SOURCE |
| gun_qf_6in_40                    | **IMPORTED** | **Armstrong 152 mm A.15/28** overlay (Mandovi/Bengo; Rio Vouga; Afonso d'Albuquerque)    | [NP] Mandovi/Rio Vouga                   | SINGLE-SOURCE |
| gun_qf_47in                      | **IMPORTED** | **Armstrong 100 mm A.10/28** overlay (Rio Vouga; Rio Lima 1880s)                         | [NP] Rio Vouga                           | SINGLE-SOURCE |
| gun_qf_12pdr                     | **IMPORTED** | **Krupp 67/40, 76/16 C/75, 87/21 K.87/24** overlays (Vasco da Gama, Vilhena, Mandovi)    | [NP] Vasco da Gama/Vilhena/Mandovi       | SINGLE-SOURCE |
| gun_qf_6pdr                      | **IMPORTED** | **Hotchkiss 65/40** overlay (Duque da Terceira; Rio Tâmega)                              | [NP] Duque da Terceira/Rio Tâmega        | SINGLE-SOURCE |
| gun_hotchkiss_3pdr               | **IMPORTED** | **Hotchkiss 47/40** (Afonso d'Albuquerque; N°2–4)                                        | [NP] Afonso d'Albuquerque/N°2            | SINGLE-SOURCE |
| gun_nordenfelt_1in               | **IMPORTED** | Nordenfelt machine gun; in-band Portuguese use not evidenced (mark UNVERIFIED)           | —                                        | UNVERIFIED    |
| gun_maxim_303                    | UNAVAILABLE  | 1890s British — not in Portuguese 1880 service                                           | —                                        | rule          |
| tube_14in_above_water            | **IMPORTED** | **Whitehead 356 mm**, above-water (bore equals the catalogue's 14-in)                    | [NP] Espadarte/N°2                       | SINGLE-SOURCE |
| tube_14in_submerged              | **IMPORTED** | **Whitehead 356 mm**, submerged bow (Espadarte 2 bow; N°2–4 2 bow)                       | [NP] Espadarte/N°2                       | SINGLE-SOURCE |

`hardCapabilities` recommendation: `maxGunCaliberUm` **263000** (Vasco da Gama's Krupp 263 mm — the largest
in-catalogue Portuguese gun); `maxArmourThicknessUm` **229000** (1880 ironclad belt maximum); `domesticTorpedoDiameterUm`
**356000** (imported Whitehead, bore = catalogue); `hullForms` `[coast_defence_form, protected_cruiser_form,
torpedo_boat_form, merchant_liner_form]` (**no** `pre_dreadnought_form` in 1880); `domesticPlants`
`[compound_cylindrical]` (TE gated to 1885).

---

# C. National component variants (8–15)

Each row overlays one shared family with a Portuguese national designation, a sourced (or explicitly ESTIMATE)
shell mass/parameter set and a `mounts` list. Mounts ∈ TURRET | BARBETTE | CASEMATE | DECK_SHIELDED | DECK_OPEN |
BROADSIDE_BATTERY. **Introduction override:** the 149 mm Krupp overlays `gun_bl_6in_26` (catalogue intro 1883-01)
and the 67/87 mm and Armstrong rows overlay families intro'd 1884–1892; a Portuguese variant must **override
`introduction` to 1875-01 (Krupp) / 1880-01 (Armstrong)** to be legal on the historical ships and the 1880
starters (the Spain note's Hontoria 1879 precedent).

| family id (components.yaml)    | PT national model (designation)                                    | fields / values                                                                   | mounts                                | source                          | confidence                          |
| ------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------- | ----------------------------------- |
| `gun_bl_263mm_rkl20`           | **263 mm Krupp RK L/20 C/74** (Vasco da Gama main)                 | cal 263000; shell 250000 (family, ESTIMATE); intro 1875-01                        | CASEMATE, TURRET, BARBETTE            | [NP] Vasco da Gama; [SBN] §6.10 | SINGLE-SOURCE / ESTIMATE (shell)    |
| `gun_bl_6in_26`                | **149 mm Krupp RK L/22 C/75** (Vasco da Gama 2nd; Duque da Terceira) | cal 149000; shell ~45000 ESTIMATE; intro 1875-01                                  | CASEMATE, DECK_SHIELDED, BROADSIDE_BATTERY | [NP] Vasco da Gama/Duque        | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_12pdr`                 | **67 mm Krupp** (Vasco da Gama)                                    | cal 67000; shell ~4500 ESTIMATE; intro 1875-01                                    | DECK_OPEN                             | [NP] Vasco da Gama              | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_12pdr`                 | **76 mm Krupp C/75** (Vilhena)                                     | cal 76000; shell ~5000 ESTIMATE; intro 1880-01                                    | DECK_OPEN                             | [NP] Vilhena                    | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_12pdr`                 | **87 mm Krupp K.87/24** (Mandovi/Bengo)                            | cal 87000; shell ~7000 ESTIMATE; intro 1879-01                                    | DECK_OPEN                             | [NP] Mandovi/Bengo              | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_6in_40`                | **152 mm Armstrong A.15/28** (Mandovi/Bengo; Rio Vouga; Afonso d'Albuquerque) | cal 152000; shell 45000 (family); intro 1880-01                        | DECK_SHIELDED, DECK_OPEN, CASEMATE    | [NP] Mandovi/Rio Vouga          | SINGLE-SOURCE / ESTIMATE            |
| `gun_qf_47in`                  | **100 mm Armstrong A.10/28** (Rio Vouga; Rio Lima 1880s)           | cal 100000; shell ~14000 ESTIMATE; intro 1880-01                                  | DECK_OPEN, DECK_SHIELDED              | [NP] Rio Vouga                  | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_rml_64pdr_71cwt`          | **163 mm Armstrong 70-pdr MLR** (Tejo/Douro/Quanza; Duque da Terceira) | cal 163000; shell 31700 (70 lb, DERIVED); intro 1880-01                       | BROADSIDE_BATTERY, DECK_OPEN          | [NP] Tejo/Duque da Terceira     | SINGLE-SOURCE / DERIVED (shell)     |
| `gun_rml_8in_9ton`             | **178 mm Armstrong 6.5-ton MLR** (Rio Lima; Rio Tâmega/Sado)       | cal 178000; shell ~59000 (130 lb, DERIVED); intro 1880-01                         | DECK_OPEN, BROADSIDE_BATTERY          | [NP] Rio Lima/Tâmega            | SINGLE-SOURCE / DERIVED (shell)     |
| `gun_qf_6pdr`                  | **Hotchkiss 65/40** (Duque da Terceira; Rio Tâmega)                | cal 65000; shell 2720 (family); intro 1884-01                                     | DECK_OPEN                             | [NP] Duque da Terceira/Rio Tâmega | SINGLE-SOURCE                       |
| `gun_hotchkiss_3pdr`           | **Hotchkiss 47/40** (Afonso d'Albuquerque; N°2–4)                  | cal 47000; shell 1500 (family); intro 1886-01                                     | DECK_OPEN                             | [NP] Afonso d'Albuquerque/N°2   | SINGLE-SOURCE                       |
| `tube_14in_above_water`        | **356 mm Whitehead, above-water/beam**                             | bore 356000 (equals the catalogue 14-in); intro 1880-01                           | — (ABOVE_WATER_TRAINABLE)             | [NP] Espadarte/N°2              | SINGLE-SOURCE                       |
| `tube_14in_submerged`          | **356 mm Whitehead, submerged bow**                                | bore 356000; intro 1880-01                                                        | — (UNDERWATER_FIXED)                  | [NP] Espadarte/N°2              | SINGLE-SOURCE                       |

That is **13 model rows across 11 families** (several families carry two/three national models, which the
Japan/Spain notes precedent as legal). Notes:

- The **263 mm Krupp is an exact bore match** to the shared `gun_bl_263mm_rkl20` family (German 26 cm RK L/20
  C/74) — the one place where the imported national gun *is* the catalogue family.
- The **149/152/100/67/76/87 mm rows are bore-match overlays** (the catalogue has no dedicated Krupp 15 cm /
  6.7 cm / 7.6 cm / 8.7 cm family and no Armstrong 10 cm / 15.2 cm family); the mechanism mismatch is **surfaced
  as deferred** (§G), exactly as the Japan/Qing/Spain notes do.
- All shell masses except the British RML family values are **ESTIMATE** (the sources give the bore/designation,
  not the projectile weight). Mackinlay Table XVII or a period Portuguese ordnance list would upgrade them.
- The **121/14 Armstrong 40-pdr MLR** (Tejo, Rio Lima, Rio Tâmega) has **no shared family** — a deferred gap (§G).

---

# D. Six 1880 opening reference designs (B, CA, CL, DD, KE, AMC)

All are legal 1880-01 **DOCTRINE_TEMPLATE** starting points, not historical reconstructions (the historical hulls
are in §A.1.1). The B, CL and KE shapes are grounded in historical ships/lines (Vasco da Gama; Bartolomeu
Dias/Duque da Terceira/Afonso d'Albuquerque; Tejo/Rio Vouga/Mandovi); CA/DD/AMC are doctrine templates grounded
in Portuguese practice/lineage. **Moulded depth is UNVERIFIED for every Portuguese ship** — `depthToMainDeck` is
ESTIMATE throughout. Plant: `compound_cylindrical` (the only 1880 plant in `plants.yaml`; min 300 kW, max
8,000 kW). Only 1880-legal components are used (national variants with `introduction` ≤ 1880-01).

| slot | shape / inspiration (source)                                  | hull form               | Lwl/B/T (mm)              | depth (mm) | displ (kg) | plant / kW   | fuel (kg) | main / secondary                                                                     | armour scheme                                          | doctrine note                              |
| ---- | ------------------------------------------------------------- | ----------------------- | ------------------------- | ---------- | ---------- | ------------ | --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------ |
| **B**  | *Vasco da Gama* casemate ironclad, 1876 ([NP]/[SBN] §6.10) | `coast_defence_form`    | 61,000 / 14,200 / 5,790   | 9,000 EST  | 2,384,000  | compound_cylindrical / 2,240 | 300,000 | 2 × `gun_bl_263mm_rkl20` (263 mm Krupp, CASEMATE); 1 × `gun_bl_6in_26` (149 mm Krupp, DECK_SHIELDED); 4 × `gun_qf_12pdr` (67 mm Krupp, DECK_OPEN) | belt 229–102 wrought_iron (complete); battery 254–152 | small imported coast-defence casemate ironclad; Lisbon/Tagus |
| **CA** | 1890s protected-cruiser lineage (Dom Carlos I 1898) [NP]      | `protected_cruiser_form`| 95,000 / 13,500 / 6,000   | 8,000 EST  | 3,500,000  | compound_cylindrical / 4,000 | 500,000 | 2 × `gun_bl_6in_26` (149 mm Krupp, DECK_SHIELDED); 6 × `gun_rml_64pdr_71cwt` (163 mm, BROADSIDE); 2 × `tube_14in_above_water` | belt 102 wrought_iron; deck 38; magazine box 127      | fictional 1880 colonial cruiser (thin belt); doctrine template |
| **CL** | *Bartolomeu Dias* / *Duque da Terceira* / *Afonso d'Albuquerque* lineage ([NP]) | `protected_cruiser_form`| 85,000 / 12,000 / 5,500 | 7,500 EST | 2,400,000 | compound_cylindrical / 3,000 | 450,000 | 2 × `gun_bl_6in_26` (149 mm Krupp, DECK_SHIELDED); 6 × `gun_rml_64pdr_71cwt` (163 mm, DECK_OPEN); 2 × `tube_14in_above_water` | deck 50 wrought_iron; coal-bunker side protection      | long-endurance colonial cruiser / station ship |
| **DD** | *Espadarte* (1881) / N°2–4 (1886) Yarrow torpedo boats [NP]   | `torpedo_boat_form`     | 30,000 / 3,400 / 1,600    | 2,800 EST  | 55,000     | compound_cylindrical / 340 | 10,000  | 1 × `gun_nordenfelt_1in` DECK_OPEN; 2 × `tube_14in_submerged` (356 mm bow)           | nil                                                    | small torpedo craft; torpedo flotilla      |
| **KE** | *Tejo* (1869) / *Rio Vouga* (1882) / *Mandovi* (1879) gunboats [NP] | `coast_defence_form` | 62,000 / 8,400 / 2,700    | 4,500 EST  | 620,000    | compound_cylindrical / 520 | 100,000 | 1 × `gun_rml_64pdr_71cwt` (163 mm 70-pdr, DECK_SHIELDED); 2 × `gun_qf_12pdr` (87 mm Krupp, DECK_OPEN) | nil                                                    | colonial/coastal gunboat for Angola, Mozambique & Asia |
| **AMC**| Portuguese liner taken up from trade (doctrine template)      | `merchant_liner_form`   | 115,000 / 14,000 / 3,500  | 8,000 EST  | 3,500,000  | compound_cylindrical / 2,600 | 900,000 | 4 × `gun_rml_64pdr_71cwt` (163 mm, DECK_OPEN); 2 × `tube_14in_above_water`           | nil                                                    | armed liner for colonial trade protection  |

Block coefficients (ESTIMATE, `blockCoeffBp` ×10000): B ≈ 4640 (derived: 2,384 t / (1.025 × 61.0×14.2×5.79));
CA ≈ 5000; CL ≈ 5000; DD ≈ 4400 (game convention; the computed ≈2690 is unreliable at this scale, as in the
Russia/AH notes); KE ≈ 5000 (derived ≈4960 from Tejo 578 t / (1.025 × 43.6×7.9×3.3)); AMC ≈ 6200. All six are
ESTIMATE for dimensions, power and armour; the B, CL and KE shapes are grounded in the historical ships named.

> **DD scale + 1880 torpedo-boat plant.** The historical *Fulminante* (40 t, 1880) and *Espadarte* (53 t, 1881)
> used VC/locomotive-type plants; the catalogue's `locomotive_boiler_tb` is dated 1890 (a content gap for an 1880
> torpedo boat, same as the Japan/Qing notes). The template above uses `compound_cylindrical` (min 300 kW) at a
> legal `torpedo_boat_form` scale; the repo's generic DD starter is ~1,500 t (the same open content decision the
> Japan/Qing/Spain notes raise).

---

# E. Naming policy

Published 1880s Portuguese ship names are historical facts; cited to [NP] class pages and [NA86] (the
illustration index names *Vasco de Gama*; p. 261 names *Espadarte*, *Fulminante*, *Rio Ave*).

| type    | convention (one line)                                                                                                        | stems (published names)                                                                                                                        | source / confidence                 |
| ------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **B**   | Age-of-Discovery navigators and explorers, plus national/royal names                                                          | Vasco da Gama, Bartolomeu Dias, Fernão de Magalhães, Afonso de Albuquerque, Dom João II                                                         | [NP] Vasco da Gama; published lists — SINGLE-SOURCE |
| **CA**  | Royal/regnal and colonial names (the 1898 cruiser lineage)                                                                    | Dom Carlos I, Príncipe Real, Infante D. Henrique, São Gabriel, São Rafael                                                                       | [NP] (Dom Carlos I, São Gabriel) — SINGLE-SOURCE |
| **CL**  | Navigators/explorers, ducal and colonial names (the sloop/cruiser lineage)                                                    | Bartolomeu Dias, Afonso de Albuquerque, Duque da Terceira, Adamastor, São Gabriel, São Rafael, Dom Carlos I                                     | [NP] (each class page) — SINGLE-SOURCE |
| **DD**  | Marine animals, violent-action and numbered torpedo-boat names                                                                | Espadarte, Fulminante, Zezere, N°1, N°2, N°3, N°4                                                                                               | [NP] Espadarte/Fulminante/N°2 — SINGLE-SOURCE |
| **KE**  | Rivers (metropolitan, African and Indian), coastal towns and colonial places                                                  | Tejo, Douro, Quanza, Rio Lima, Rio Tâmega, Rio Sado, Rio Vouga, Mandovi, Bengo, Tavira, Faro, Vilhena, Zambeze, Limpopo, Diu, Massabi           | [NP] (each class page) — SINGLE-SOURCE |
| **AMC** | Liner names taken up from trade; no dedicated naval series in-band                                                            | (no in-band Portuguese naval series; Empresa Insulana de Navegação liners)                                                                      | rule                                |

All stems are SINGLE-SOURCE (published ship lists). A full curated dataset (collision handling, accents/particles)
is content authoring, deferred to the spec/implementator.

---

# F. Recommendations (concrete profile values — non-normative)

| profile field                                     | Portugal candidate                                                              | basis                              | label                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------ |
| `strategicSituation.postures`                     | `[colonial_presence, coastal_defence, distant_water_operations, commerce_defence]` (+ `regional_warfare`, weak `torpedo_warfare`) | §A.1 | grounded shape (SINGLE-SOURCE) |
| `industrialProfile.buildTimeMultiplierBp`         | 10800 (range 10700–11200)                                                       | §A.2 small domestic arsenal        | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.costMultiplierBp`              | 10900 (range 10700–11200)                                                       | §A.2 imports + London loans        | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.machineryReliabilityBp`        | 8200                                                                            | imported plant; old hulls          | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.constructionQualityVarianceBp` | 3500                                                                            | dependent, cash-starved service    | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.maxPracticalDisplacementKg`    | 1880 1.4M / 1885 1.4M / 1890 2.0M (domestic; imported bypasses)                  | §A.2 completed classes             | ESTIMATE                       |
| `industrialProfile.heavyGunProduction`            | IMPORTED (Krupp + Armstrong)                                                    | §A.2 [NP] armament fields          | VERIFIED (direct)              |
| `industrialProfile.armourPlateProduction`         | IMPORTED                                                                        | §A.2 [NP]/[EB]                     | SINGLE-SOURCE                  |
| `hardCapabilities.maxGunCaliberUm`                | 263000 (Krupp 263 mm)                                                           | §B                                 | grounded shape                 |
| `hardCapabilities.maxArmourThicknessUm`           | 229000 (1880 ironclad belt)                                                     | §B                                 | grounded shape                 |
| `hardCapabilities.domesticTorpedoDiameterUm`      | 356000 (imported Whitehead; bore = catalogue)                                   | §B                                 | SINGLE-SOURCE                  |
| `doctrineProfile.engagementRangeM`                | 1500                                                                            | §A.3 period                        | ESTIMATE / **BALANCE TARGET**  |
| `doctrineProfile.hePreferenceBp`                  | 3500 (AP-dominant, Krupp steel shot/Palliser)                                   | §A.3                               | **BALANCE TARGET**             |
| `softPreferences.speedOverArmourBp`               | 4500                                                                            | coast-defence first                | **BALANCE TARGET**             |
| `softPreferences.enduranceWeightBp`               | 12000                                                                           | three scattered colonial theatres  | **BALANCE TARGET**             |
| `softPreferences.riskToleranceBp`                 | 3000                                                                            | fleet preservation / British cover | **BALANCE TARGET**             |
| `softPreferences.colonialServiceWeightBp`         | 13000                                                                           | Angola/Mozambique/Goa/Macau/Timor  | **BALANCE TARGET**             |
| `softPreferences.torpedoOnCruisersBp`             | 8000                                                                            | small flotilla                     | **BALANCE TARGET**             |
| `researchPreferences`                             | §A.4 (INFRA 3, then 2s and 1s)                                                  | §A.4                               | grounded shape / ESTIMATE      |
| `componentAccess`                                 | §B                                                                              | §B                                 | mixed per row                  |
| `gunModels` + `componentVariants`                 | §C (13 rows, 11 families)                                                       | §C                                 | SINGLE-SOURCE / ESTIMATE       |
| `designs`                                         | §D (6)                                                                          | §D                                 | ESTIMATE                       |
| `namingPolicy`                                    | §E                                                                              | published ship lists               | grounded (SINGLE-SOURCE)       |

Keep every cost/build-time modifier inside ±15 % (`docs/ships-nation-orientation.md` §108); the Portuguese
spread above is ~8–12 %, at the higher-cost end because the navy imports. Ship every ESTIMATE/UNVERIFIED figure
with its label and a provenance record.

---

# G. Deferred (needs an owner or a decision-request)

- **The 121 mm Armstrong 40-pdr MLR is not in the catalogue.** It is the standard secondary of the Tejo, Rio
  Lima and Rio Tâmega gunboats; no shared family exists. A new family or a decision to leave it unauthorable is
  needed before the gunboats can carry their historical secondary.
- **Krupp 15 cm / 6.7 cm / 7.6 cm / 8.7 cm and Armstrong 10 cm / 15.2 cm have no dedicated families.** The
  §C rows overlay the nearest shared family (BL 6-in, QF 12-pdr, QF 6-pdr, QF 4.7-in, QF 6-in); the mechanism
  mismatch is flagged. Confirm multiple models per family are legal, or add dedicated families.
- **Portuguese shell masses are ESTIMATE.** The sources give the bore/designation, not the projectile weight. A
  period annual ordnance table (Brassey foreign-gun tables) or a Portuguese ordnance list would upgrade them
  before release (no PLACEHOLDER may ship).
- **`maxPracticalDisplacementKg` semantics.** Does the ceiling gate *domestic build* only (then imported hulls
  like *Vasco da Gama* 2,384 t are legal) or all construction? Surface; do not resolve.
- **DD scale + pre-1880 torpedo-boat plant.** The historical *Fulminante* (40 t, 1880) and *Espadarte* (53 t,
  1881) predate the catalogue's `locomotive_boiler_tb` (1890). Either a pre-1880 torpedo-boat plant is added, or
  the 1880 DD starter uses `compound_cylindrical` at a legal scale (as above). The DD slot scale (55 t vs the
  repo's ~1,500 t generic starter) is an open content decision.
- **Portuguese industry/budget primary source.** No Portuguese naval annual, yard return or escudo/reis budget
  was opened; the annual's Portugal estimates page was not recovered from the OCR. Every industrial multiplier
  and the research weights remain ESTIMATE until a print source is opened.
- **Moulded depth for every design** — no source gives it (carried over from the earlier notes). Depths are
  ESTIMATE.
- **CA is a doctrine template** — Portugal had no armoured cruiser in 1880; confirm fictional-but-legal starters
  are acceptable (the existing `reference-designs/` already does this for the UK/France/Spain).
- **Submarines / deferred mechanics** — Portugal's first submarine is 1913 (post-band); per DESIGN-55 §14 keep
  priority 1 / preference only.

**No `docs/OPEN-ISSUES.md` decision was resolved here** (the registry carries no Portugal item).

---

# H. Verdict

**Qualified yes — the Portuguese profile is authorable now, with per-figure labels.**

- **Strongly grounded (read directly):** the *shape* — one small, British-built, Krupp-armed coast-defence
  casemate ironclad (*Vasco da Gama*), a handful of wooden/composite sloops and small colonial gunboats, the
  Arsenal da Marinha as the only domestic yard, heavy import dependence on Krupp/Armstrong guns and British
  builders, colonial/coastal/distant-water duties (Angola, Mozambique, Goa, Macau, Timor, Atlantic islands), and
  a tiny torpedo flotilla — rests on the directly-read [NP] Portuguese class pages and the 1886 Brassey annual
  (Portugal—Unarmoured Ships p. 261; turning-power table p. 291; illustration index).
- **The national component models are grounded gun-by-gun:** the 263 mm Krupp is an exact match to the shared
  `gun_bl_263mm_rkl20` family; the 149/152/100/67/76/87 mm and Armstrong RML/QF rows are [NP]-sourced by
  bore/model; the 356 mm Whitehead tubes match the catalogue exactly.
- **What is ESTIMATE/BALANCE TARGET and must be labelled as such:** every cost/build-time/reliability/variance
  multiplier, the max-displacement progression, the doctrine weights, the Krupp/Armstrong shell masses, and the
  fictional CA/CL/DD/AMC templates.
- **What is genuinely missing:** the 121 mm Armstrong 40-pdr family, the dedicated Krupp 15 cm / 6.7 cm /
  7.6 cm / 8.7 cm and Armstrong 10 cm / 15.2 cm families, Portuguese shell masses, and a Portuguese
  budget/yard primary. None blocks a first profile; the 121 mm gunboat secondary is the one that materially
  limits a Portuguese gunboat.

Recommendation to the orchestrator: author the profile now with §F's values and §B–D's access/variant/design
tables; ship every ESTIMATE/UNVERIFIED figure with its label; keep all multipliers inside ±15 % and labelled
BALANCE TARGET; and raise a decision-request for the 121 mm Armstrong 40-pdr family before authoring the
gunboats' full historical armament.

## Source list

1. navypedia.org Portuguese class pages, read directly this session: `portugal/pr_index.htm`, `pr_bb.htm`,
   `pr_bb_vasco_da_gama.htm`, `pr_cr.htm`, `pr_cr_bartolomeu_dias.htm`, `pr_cr_duque_de_terceira.htm`,
   `pr_cr_afonso_dalbuquerque.htm`, `pr_of.htm`, `pr_of_zarco.htm` (Tejo), `pr_of_rio_lima.htm`,
   `pr_of_tamega.htm`, `pr_of_tavira.htm`, `pr_of_mandovi.htm`, `pr_of_rio_vouga.htm`, `pr_of_vilhena.htm`,
   `pr_dd.htm`, `pr_dd_fulminante.htm`, `pr_dd_no1.htm` (Espadarte), `pr_dd_no2.htm`.
2. T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`
   (`NavalAnnual1886_djvu.txt`, read directly): "Portugal—Unarmoured Ships" p. 261; turning-power table
   (Vasco de Gama) p. 291; illustration index (plate 78).
3. `docs/research/ship-building-1880-ships-by-nation.md` §6.10 (in-service Portuguese hull).
4. `docs/research/ship-building-1880-pre-era-armament.md` (RML catalogue values).
5. In-repo companions: `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
   `italy-naval-profile.md`, `japan-naval-profile.md`, `russia-naval-profile.md`, `usa-naval-profile.md`,
   `qing-naval-profile.md`, `spain-naval-profile.md`; `content/production/1880/{countries,research,economies,possessions}.yaml`,
   `content/production/1880/ship-building/{components,plants,hull-forms,balance}.yaml`.
6. Print works named as leads (not opened this session): Conway's _All the World's Fighting Ships 1860–1905_
   (1979); Jane's _Fighting Ships_ (1898).
