# Research: national naval profile — Spain (`spain`, 1880–1899)

Companion to `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
`italy-naval-profile.md`, `japan-naval-profile.md`, `russia-naval-profile.md`, `usa-naval-profile.md`;
method, source grades and confidence labels are identical. Every in-repo figure (gun families, plants, hull
forms, balance) is reused from the EARLY-band notes, never re-derived here. Captured 2026-10-11.

Authored for the `spain` (canonical `NationNavalProfile`) of the `scen_1880` national-naval initiative
(`docs/ships-nation-orientation.md`, ADR-0088/0089 line of work). This is a **research-only** pass: no code,
no content YAML and no spec is authored here. The orchestrator/spec may then author the profile.

Read first: `.ai/ENGINEERING-CONTRACT.md` (Content + Factual grounding), `docs/ships-nation-orientation.md`,
`docs/research/ship-building-1880-ships-by-nation.md` §6.8 (the in-service Spanish hulls, reused not
re-derived), the shipped draft `content/production/1880/{countries,research,economies,possessions}.yaml` and
`content/production/1880/ship-building/{components,plants,hull-forms,balance,naval-profiles,reference-designs}.yaml`.
DESIGN-55 §14 guard respected: no deferred mechanic is treated as reachable.

## 0. Question

What are the grounded figures and national differentiators needed to author a **date-banded
`NationNavalProfile` (1880–1899) for the Kingdom of Spain**, plus 8–15 shared-family national models and six
1880 opening designs (B, CA, CL, DD, KE, AMC), with research priorities, component access and naming policy?

The defining fact, established before anything else: **in January 1880 Spain had a tiny, ageing ironclad
squadron built almost entirely abroad** (Numancia and Vitoria, both foreign-built and already obsolescent), a
handful of unprotected cruisers and gunboats, and effectively **no domestic heavy-gun, armour-plate or
capital-ship industry**. It was a declining former first-rank empire guarding Cuba, Puerto Rico, the
Philippines and Guam with weak finances, a navy subordinate to the army, and a stated doctrine of *port
defence, colonial defence, cruiser patrol and fleet preservation* (`countries.yaml`, id `spain`). Everything
below is shaped by that.

## 1. Method, source grades and confidence labels

Every figure carries a named source and one of:

- **VERIFIED** — read directly in a period primary/near-primary text (full text fetched and read), or two independent sources agree.
- **SINGLE-SOURCE** — one source only, or a secondary compilation that itself cites print works (named) which I could not open.
- **DERIVED** — computed by me from other cited figures (calculation shown).
- **ESTIMATE** — derived by me from other cited figures or an inferred range; not itself a source figure.
- **UNVERIFIED** — no usable source found, or sources conflict; a plausible range is given instead.

**Wikipedia is not cited as a source anywhere.** Where a page was used only as a lead to the print work it
cites, the print work is named and the row is at most SINGLE-SOURCE.

| Tag     | Source                                                                                                                                                                                                                                  | Grade / reach                                                              |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [NP]    | navypedia.org **Spain** class pages (Ivan Gogin), built principally on Conway's _All the World's Fighting Ships 1860–1905_ + national histories. **Read directly this session** (slugs per row in the Source list).                        | Secondary compilation → **SINGLE-SOURCE**.                                  |
| [NA86] | T. A. Brassey (ed.), **_The Naval Annual 1886_** — archive.org id `navalannual1886`, full OCR text `NavalAnnual1886_djvu.txt` (49,093 lines) **read directly this session**: "Notes on the Spanish Navy" (p. 274), Spanish torpedo destroyer (p. 81), turning-power table (p. 292). | **Primary contemporary annual** — figures actually read are **VERIFIED**.   |
| [SBN]   | `docs/research/ship-building-1880-ships-by-nation.md` §6.8 (in-repo; itself [NP]-based): Numancia, Vitoria, Puigcerdá.                                                                                                                    | In-repo, re-used, not re-derived; SINGLE-SOURCE.                            |
| [PRE]   | `docs/research/ship-building-1880-pre-era-armament.md` (in-repo): RML shell/charge/MV catalogue values and the Brassey 1886 French-Commission penetration table.                                                                          | In-repo ordnance table; VERIFIED where Mackinlay is quoted.                 |
| [REPO]  | Shipped content `content/production/1880/{countries,research,economies,possessions,areas,ports}.yaml` — **not a historical source**.                                                                                                      | Repo framing only; do not treat as historical grounding.                    |
| [EB]    | _Encyclopaedia Britannica_ 11th ed. (1911), "Armour Plates" (via the UK/France note).                                                                                                                                                    | Near-primary (contemporary reference).                                      |
| [CW]    | Conway's _All the World's Fighting Ships 1860–1905_ (1979). **Not opened** online; relayed only via [NP].                                                                                                                                | Print secondary; SINGLE-SOURCE (relayed).                                   |
| [J98]   | Jane's _Fighting Ships_ (1898). **Not opened.**                                                                                                                                                                                          | Print secondary; lead only.                                                 |

Limits: Conway's itself was not reachable; [NP] is a single compilation, so nearly every ship figure is
SINGLE-SOURCE. [NA86] is a period annual and its Spanish passages are read directly (VERIFIED as read). **No
Spanish naval budget/yard-return primary was opened** (the annual's Spanish estimates page was not
recovered from the OCR; a peseta figure is absent). Industrial multipliers, research weights and design
weights are therefore explicit **BALANCE TARGET / ESTIMATE**. Moulded depth is not given by [NP] for any
Spanish ship (UNVERIFIED), as in every companion note. Torpedo bores read on Spanish ships are **356 mm**,
which happens to equal the catalogue's 14-in (356 mm) model exactly.

Conversions: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 ihp = 0.7457 kW; 1 kn = 0.5144 m/s.

---

# A. National naval profile (1880–1899)

## A.1 Strategic posture

The 1886 annual is blunt about the Spanish list: besides paddle corvettes, gun-vessels, training ships and
transports, the navy had only gunboats, small third-class gunboats, a few torpedo craft and **two ageing
broadside ironclads** (Numancia, Vitoria) plus the French-built Pelayo (*then under construction*, "will
apparently resemble the French barbette ships of the Marceau type") `[NA86]` pp. 274. The repo framing
(`countries.yaml` id `spain`, `doctrine.schools: [colonial_defense, port_defense, cruiser_patrol,
fleet_preservation]`) matches that shape.

| posture                        | applies?             | justification (one line)                                                                                                                                          | source                                   | confidence                  |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------- |
| **colonial_presence**          | **PRIMARY**          | Cuba, Puerto Rico, the Philippines and Guam must be garrisoned and supplied; the navy's primary purpose is "preserve colonies / honour".                          | `possessions.yaml`; `areas.yaml`; [REPO] | VERIFIED (in-repo content)  |
| **coastal_defence**            | **PRIMARY**          | Home coasts and ports (Ferrol, Cádiz, Cartagena) plus monitors (Puigcerdá), floating batteries and gunboats; "port defence" is a stated school.                    | `[NA86]` p. 274; [NP]; `countries.yaml`   | SINGLE-SOURCE / VERIFIED (in-repo) |
| **distant_water_operations**   | **PRIMARY**          | Two separated colonial theatres (Caribbean and Philippines) with no sea link; distant stations demand long-endurance cruisers and gunboats.                       | `[NA86]` p. 274; [NP] Reina Regente       | SINGLE-SOURCE               |
| **commerce_defence**           | secondary            | Cruiser patrol / trade protection to keep the colonial lifeline open (a defensive, not offensive, use of cruisers).                                              | `countries.yaml`; [REPO]                  | VERIFIED (in-repo content)  |
| **torpedo_warfare**            | secondary            | A real but small flotilla programme: "four torpedo despatch vessels and one torpedo boat-chaser … twelve first-class torpedo boats" (1886); the *Destructor* (1887) was one of the first torpedo-boat destroyers. | `[NA86]` pp. 81, 274; [NP] Destructor     | VERIFIED (as printed)       |
| **regional_warfare**           | weak                 | The Moroccan question and rivalry with the USA create regional contingencies, but no concentration doctrine.                                                     | `countries.yaml`; [REPO]                  | ESTIMATE                    |
| battle_fleet_concentration     | **does NOT apply**   | No battle fleet: two obsolescent ironclads in 1880; doctrine is explicitly "fleet preservation / avoidance of decisive battle".                                   | `[NA86]` p. 274; `countries.yaml`         | SINGLE-SOURCE               |
| commerce_raiding               | **does NOT apply**   | Not a Spanish 1880 doctrine; effort goes to *defence* of the colonial trade, not guerre de course.                                                                | reasoning; `[NA86]` passim                | DERIVED                     |

**Recommended primary postures: `colonial_presence + coastal_defence + distant_water_operations`**, with
`commerce_defence` co-equal and `torpedo_warfare` a secondary preference. This is deliberately *not* the
UK/France/Germany list. The tiny, foreign-built ironclad squadron is an *industrial-capability* fact (§A.2),
not a battle-fleet posture.

### A.1.1 In-service 1880 ships (re-used from `[SBN]` §6.8 — do not re-derive)

- **Numancia** broadside ironclad (comp. 17.12.1864, F C de la Méditerranée, La Seyne, **France**): 7,189 t;
  96.0 pp / 96.1 oa × 17.4 × 8.22 m; 1 HRCR, 8 rectangular boilers, 3,700 ihp (2,759 kW), 10 kn; 1880 fit
  **2 × 254 mm Armstrong 300-pdr RML + 8 × 160 mm Palliser RML**; wrought-iron belt 130 (ends 10), battery
  120; coal 1,100 t; crew 500. `[NP]`/`[SBN]` — SINGLE-SOURCE (VERIFIED design; blurb [NA86] p. 274).
- **Vitoria** broadside ironclad (comp. 15.11.1867, Thames Iron Wks, Blackwall, **UK**): 7,135 t; 96.4 pp ×
  17.4 × 8.07 m; 1 HRCR, 8 rectangular boilers, 4,500 ihp (3,356 kW), 12 kn; 1880 fit **4 × 254 mm Armstrong
  300-pdr RML + 3 × 203 mm Armstrong 9-ton RML**; wrought-iron belt 130, battery 120; coal 875 t; crew 500.
  `[NP]` (1869 modernisation confirms the 254/203 fit) — SINGLE-SOURCE.
- **Puigcerdá** monitor (1875, La Seyne, **France**): 552 t; 39.0 × 9.00 × 2.50 m; 328 ihp (245 kW), 8 kn;
  1 × 160 mm Palliser RML + 1 × 2 121 mm SBML in one twin turret; iron belt 100, turret 100–80; coal 23 t;
  crew 59. `[NP]`/`[SBN]` — SINGLE-SOURCE.

## A.2 Industrial capability

Direction of every multiplier is grounded (slower, costlier, low-reliability, higher-variance); the magnitude
is a balance choice inside the ±15 % band.

| item                              | figure / direction                                                                                                                                                                                                                         | unit        | source                                              | confidence                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------- | ------------------------------ |
| Foreign dependence (the key fact) | Every capital ship and most efficient cruisers were **built abroad**: Numancia (La Seyne, FR), Vitoria (Thames Iron Wks, UK), Pelayo (La Seyne, FR), Reina Regente (Thomson, Clydebank, UK), Isla de Luzón/Cuba (Armstrong, Elswick, UK), Velasco/Gravina (Thames Iron Wks, UK), Destructor (Thomson, UK), Cástor and the Somorrostro gunboats (La Seyne, FR). | —           | [NP] builder fields; [NA86] pp. 81, 274            | VERIFIED (direct)              |
| Domestic yards                   | State arsenals **Ferrol (El Ferrol), Cartagena, La Carraca (Cádiz), La Graña**, plus Santa Rosalia (Cartagena); they built the slower later sisters (Reina Regente's Alfonso XIII/Lepanto, Isla de Luzón's Marqués de la Ensenada, the Velasco class, Alfonso XII / Reina Cristina / Reina Mercedes, the General Concha gunboats). | —           | [NP] builder fields                                 | VERIFIED (direct)              |
| Domestic build ceiling (actual)  | Slow, material-starved: **Alfonso XII** laid 12.8.1881, completed 6.7.1891 ("delayed for 5 years by shortages of materials"); Reina Regente's **Lepanto** laid 1.10.1886, completed 26.1.1899 (147 months). | t / months  | [NP] Alfonso XII, Reina Regente                     | SINGLE-SOURCE (VERIFIED statement) |
| Programme cadence                | A "resuscitation" scheme was under execution in 1886: five rapid cruisers, three third-class cruisers (Cristóbal Colón, Don Antonio de Ulloa, Isabel II), torpedo craft and Philippine gun-vessels.                                          | —           | [NA86] pp. 81, 274                                  | VERIFIED (as printed)          |
| Build-time multiplier            | **SLOWER** than the 1894 baseline: small, material-starved domestic yards; even foreign orders took 18–31 months. Propose **10900 bp** (range **10600–11200**).                                                                              | ×           | [NP] completion slips; ESTIMATE                     | ESTIMATE / **BALANCE TARGET**  |
| Cost multiplier                  | **HIGHER**: imported ships, guns, armour and machinery attract freight/licence/political cost; small series. Propose **10700 bp** (range **10500–11000**).                                                                                 | ×           | ESTIMATE (no Spanish cost series opened)            | ESTIMATE / **BALANCE TARGET**  |
| Max practical displacement       | **1880 ≈ 7.2 M kg** (Numancia/Vitoria, foreign-built) → **1885 ≈ 9.7 M** (Pelayo, FR) → **1890 ≈ 9.8 M–11.0 M**; the **domestic** ceiling is far lower (~3.3 M in 1880; ~4.7 M by 1885). Imported hulls bypass the domestic ceiling.       | kg          | [NP]; ESTIMATE from completed classes               | ESTIMATE                       |
| Heavy-gun production             | **IMPORTED early, DOMESTIC later**: Armstrong 254/203/160 mm RMLs and Krupp medium guns (149/32, 120/27, 87/22, 75/24) were bought in; from **1879–1883** the domestic **Hontoria** BL family (160/25 and 120/25 M1879; 200/35, 160/35, 120/35, 140/36 M1883; 320/35, 280/35 M1883 for Pelayo) entered service. | —           | [NP] armament fields; [NA86] p. 81                  | SINGLE-SOURCE (designation)    |
| Armour-plate production          | **IMPORTED early, DOMESTIC later**: Pelayo's belt is **Creusot steel** (France); Spain's own ironclads are wrought iron. Domestic plate production is inferred only from the later domestic cruisers (no Spanish plate mill named in [NP]). | —           | [NP] Pelayo; [EB] relayed                           | SINGLE-SOURCE (stated) / ESTIMATE (domestic later) |
| Machinery reliability            | Mostly imported/foreign-designed plant (HRCR/HC/VC/HTE/VTE); the domestic builds ran late and required material imports. Propose **8300 bp** (below the RN's 9,000 compound baseline).                                                        | bp          | [NP]; plants.yaml (compound 8500)                   | ESTIMATE / **BALANCE TARGET**  |
| Construction-quality variance    | **higher** than the UK — a dependent, slow-building navy; the Aragón class were "heavily and clumsily built having been designed as ironclads". Propose **3800 bp**.                                                                         | bp          | [NP] Aragón; ESTIMATE                               | ESTIMATE / **BALANCE TARGET**  |
| Budget                           | `[REPO]`: `researchBudget 12`, treasury 180, income 16, expenses 7 — "the navy's share is constrained by the army's larger political weight" (`countries.yaml`). Not a historical source; **no Spanish annual/peseta table was opened**.   | —           | `[REPO]` `research.yaml`, `economies.yaml`          | ESTIMATE                       |

## A.3 Gunnery, protection and propulsion doctrine

| field                         | Spain position (1880)                                                                                                                                     | source                                       | confidence                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------- |
| preferred engagement distance | **short (~1,500 m)** — the period's decisive close action, ram and torpedo range; hand-worked RMLs and early Hontoria BLs.                                 | `[NA86]`; period fact                        | ESTIMATE (period)             |
| main-gun emphasis             | **few, heavy, imported**: 254 mm Armstrong 300-pdr on the ironclads; the domestic Hontoria 320 mm (Pelayo) arrives 1883–88.                                 | `[NP]`; `[SBN]` §6.8                         | SINGLE-SOURCE                 |
| secondary-battery emphasis    | **mixed and imported**: 160 mm Palliser / 203 mm Armstrong RMLs, then Krupp mediums (149/32, 120/27, 87/22, 75/24) and Hontoria 160/140/120 mm.             | `[NP]` Velasco/Aragón/Pelayo                  | SINGLE-SOURCE                 |
| gun-quality priorities        | buy the best available (Armstrong → Krupp → Hontoria); rate of fire and standardisation are not prioritised.                                              | `[NP]`; `[NA86]` p. 81                        | SINGLE-SOURCE                 |
| AP-vs-HE preference           | **AP-dominant**: Palliser armour-piercing shot was the standard period projectile; the catalogue RMLs carry Palliser shell values.                         | `[PRE]`; `[TB87]`                            | SINGLE-SOURCE                 |
| fire-control research priority| low in-band; no rangefinding before the 1890s.                                                                                                             | components.yaml (`rangefinder_optical` 1893)  | DERIVED                       |
| rate-of-fire preference       | low: heavy RML ~0.3–0.4 rds/min; Hontoria BL ~1 rds/min; Hotchkiss/Nordenfelt light guns 20–50/min.                                                       | `[PRE]`; `[NP]`                               | SINGLE-SOURCE / ESTIMATE      |
| protection doctrine           | belt + battery on the ironclads (130 mm iron); Pelayo later introduces a **Creusot-steel complete belt (450–300 mm) and barbettes (400–300 mm)**; cruisers are **thin deck-protected** (Reina Regente deck 120–25; Isla de Luzón deck 64–25). | `[NP]` Numancia/Pelayo/Reina Regente          | SINGLE-SOURCE                 |
| propulsion                    | imported compound/HRCR and (for Pelayo) 4-cylinder VC; later domestic builds use HC/VC; the 1880s Spanish cruisers are compound with cylindrical boilers. | `[NP]`                                        | SINGLE-SOURCE                 |
| speed margin                  | **moderate**: ironclads 10–12 kn; the 1888 cruisers reach 16–20 kn (Pelayo 16.7; Reina Regente 20.4 on trials); the 1887 Destructor 23 kn.                 | `[NP]`; `[NA86]`                              | SINGLE-SOURCE                 |
| endurance                     | designed for distant stations: Numancia 3,000 nmi @10; Reina Regente 7,200 nmi @10; Velasco 2,500 nmi @7; Destructor 4,000 nmi @10.                          | `[NP]`                                        | SINGLE-SOURCE                 |

**Doctrine line:** colonial/coastal-defensive, short-range, AP-dominant, few imported heavy guns, thin
deck-protected cruisers, small torpedo flotilla, no rangefinder.

## A.4 Research preferences (canonical fields, priority 1–4)

Shipped draft `[REPO]`: Spain = `GUNNERY: 2` only, `researchBudget 12`. Grounded recommendation (the shape
is an **ESTIMATE / BALANCE TARGET** — a poor, dependent, army-dominated navy with one genuine technical
programme, the Hontoria gun, and a binding yard/supply constraint):

| field             | priority | justification                                                                          | source                         | confidence     |
| ----------------- | -------- | -------------------------------------------------------------------------------------- | ------------------------------ | -------------- |
| INFRASTRUCTURE    | 3        | the binding constraint: yards/docks and material supply; the best ships were bought abroad | `[NP]` builder fields; `[NA86]` | SINGLE-SOURCE  |
| GUNNERY           | 3        | the one domestic technical programme — the Hontoria BL family (1879–1883)               | `[NP]` armament fields         | SINGLE-SOURCE  |
| HULL_CONSTRUCTION | 3        | steel hulls and the cellular system appear later (Alfonso XII: 12 watertight compartments); thin protected decks | `[NP]` Alfonso XII             | SINGLE-SOURCE  |
| DAMAGE_CONTROL    | 2        | subdivision fitted on the later cruisers but not a stated priority                       | `[NP]` Alfonso XII             | ESTIMATE       |
| TORPEDOES         | 2        | present but small: 12 first-class TBs + torpedo despatch vessels (1886); 356 mm tubes   | `[NA86]` p. 274; `[NP]`         | VERIFIED (as printed) |
| MACHINERY         | 2        | dependent on imported/foreign-designed plant; slow domestic builds                      | `[NP]`                         | ESTIMATE       |
| MINES_AND_ASW     | 2        | torpedo/port-defence flotilla doctrine                                                   | `[NA86]`                       | ESTIMATE       |
| SHIP_DESIGN       | 2        | foreign-derived designs (Pelayo = Marceau type) and copies                              | `[NP]` Pelayo                  | SINGLE-SOURCE  |
| FIRE_CONTROL      | 1        | no in-band rangefinding                                                                  | components.yaml                | DERIVED        |
| SUBMARINES        | 1        | **deferred mechanic (DESIGN-55 §14)** — Spain's Peral boat (1888) is a real national first but must not be treated as reachable content; record the preference only | `[CW]` relayed                 | UNVERIFIED     |

> **DESIGN-55 §14 guard.** SUBMARINES is recorded as a *research preference* only. No submarine mechanic that
> is deferred/unaccepted may be treated as reachable; the profile carries the preference weight, nothing else.
>
> Reconciliation: the shipped draft gives only `GUNNERY: 2`. The grounded reading keeps GUNNERY at 3 but adds
> INFRASTRUCTURE/HULL at 3 and TORPEDOES/DAMAGE_CONTROL/MINES at 2 — a **content/balance decision** for the
> orchestrator, not a fact this note can settle.

---

# B. Component access (shared families)

Status ∈ DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED | UNAVAILABLE. The catalogue's gun
families are British RMLs/BLs, the French 27 cm and the German 26 cm. Spain's signature is **imported
Armstrong RMLs**; the **domestic Hontoria guns are not a shared family** (a gap, §F). Other nations'
signature heavies are `UNAVAILABLE`.

| family id                        | status         | producer / note                                                                                          | source / evidence                              | confidence     |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------- |
| gun_rml_16in_80ton               | UNAVAILABLE    | British 80-ton — not used                                                                                | —                                              | rule           |
| gun_rml_125in_38ton              | UNAVAILABLE    | British — not used                                                                                       | —                                              | rule           |
| gun_rml_12in_35ton               | UNAVAILABLE    | British — not used                                                                                       | —                                              | rule           |
| gun_rml_12in_25ton               | UNAVAILABLE    | British — not used                                                                                       | —                                              | rule           |
| gun_rml_11in_25ton               | UNAVAILABLE    | British — not used                                                                                       | —                                              | rule           |
| gun_rml_10in_18ton               | **IMPORTED**   | **Armstrong 254 mm 300-pdr RML** (Numancia, Vitoria main)                                                | [NP] Numancia/Vitoria; [SBN] §6.8              | SINGLE-SOURCE  |
| gun_rml_10in_18ton_broadside     | **IMPORTED**   | same gun, broadside-battery role                                                                         | [NP]                                           | SINGLE-SOURCE  |
| gun_rml_8in_9ton                 | **IMPORTED**   | **Armstrong 203 mm 9-ton 180-pdr RML** (Vitoria, Aragón)                                                 | [NP] Vitoria/Aragón                            | SINGLE-SOURCE  |
| gun_rml_7in_7ton                 | UNAVAILABLE    | no grounded Spanish use                                                                                  | —                                              | UNVERIFIED     |
| gun_rml_64pdr_71cwt              | **IMPORTED**   | **160 mm Palliser RML** (Numancia; 160/16 Palliser MLR on Puigcerdá)                                     | [NP] Numancia/Puigcerdá                        | SINGLE-SOURCE  |
| gun_bl_274mm_m1875               | UNAVAILABLE    | French signature heavy                                                                                   | —                                              | rule           |
| gun_bl_263mm_rkl20               | UNAVAILABLE    | German signature heavy (Spain imported Krupp *mediums*, not this 26 cm battleship gun)                   | [NP] Aragón/Velasco                            | SINGLE-SOURCE  |
| gun_bl_12in_25                   | UNAVAILABLE    | British — not used                                                                                       | —                                              | rule           |
| gun_bl_135in_30                  | UNAVAILABLE    | British — not used                                                                                       | —                                              | rule           |
| gun_bl_12in_35                   | UNAVAILABLE    | British — not used                                                                                       | —                                              | rule           |
| gun_bl_10in_32                   | UNAVAILABLE    | British — not used                                                                                       | —                                              | rule           |
| gun_bl_92in_315                  | UNAVAILABLE    | British — not used (the Hontoria 200/35 is the Spanish 8-in; see §C)                                     | [NP]                                           | SINGLE-SOURCE  |
| gun_bl_6in_26                    | **DOMESTIC**   | **160 mm Hontoria** (M1879 160/25 and M1883 160/35) — bore-match overlay; producer Hontoria              | [NP] Reina Regente/Alfonso XII/Velasco         | SINGLE-SOURCE  |
| gun_qf_6in_40                    | UNAVAILABLE    | British 6-in QF — not used (Spain used Hontoria 160 mm)                                                  | [NP]                                           | rule           |
| gun_qf_47in                      | **DOMESTIC**   | **120 mm Hontoria** (M1879 120/25 and M1883 120/35) — bore-match overlay; producer Hontoria              | [NP] Pelayo/Isla de Luzón/General Concha       | SINGLE-SOURCE  |
| gun_qf_12pdr                     | **IMPORTED**   | **75 mm Krupp** (75/24 M1883) — approximate bore match                                                   | [NP] Aragón/Velasco                            | SINGLE-SOURCE  |
| gun_qf_6pdr                      | **IMPORTED**   | **57 mm Nordenfelt / Hotchkiss** (57/40, 57/42)                                                          | [NP] Pelayo/Reina Regente                      | SINGLE-SOURCE  |
| gun_hotchkiss_3pdr               | **IMPORTED**   | **47 mm Hotchkiss** — used heavily                                                                       | [NP] Reina Regente/Velasco/Cástor              | SINGLE-SOURCE  |
| gun_nordenfelt_1in               | **IMPORTED**   | **25 mm Nordenfelt 4-barrel**                                                                            | [NP] Pelayo/Temerario                          | SINGLE-SOURCE  |
| gun_maxim_303                    | **IMPORTED**   | Maxim; 1890s                                                                                             | [NP] Reina Regente/Alfonso XII                 | SINGLE-SOURCE  |
| tube_14in_above_water            | **IMPORTED**   | **Whitehead 356 mm**, above-water (bore equals the catalogue's 14-in)                                    | [NP] Destructor/Reina Regente                  | SINGLE-SOURCE  |
| tube_14in_submerged              | **IMPORTED**   | **Whitehead 356 mm**, submerged bow/beam                                                                | [NP] Isla de Luzón/Velasco/Destructor          | SINGLE-SOURCE  |

`hardCapabilities` recommendation: `maxGunCaliberUm` **254000** (largest in-catalogue Spanish gun, the
254 mm Armstrong 300-pdr; the 320 mm Hontoria has no family — §F); `maxArmourThicknessUm` **130000** (1880
ironclad belt; rises to ~450000 with Pelayo's Creusot belt, 1888); `domesticTorpedoDiameterUm` **356000**
(imported Whitehead, bore = catalogue); `hullForms`
`[coast_defence_form, protected_cruiser_form, torpedo_boat_form, merchant_liner_form]` (**no**
`pre_dreadnought_form` in 1880); `domesticPlants` `[compound_cylindrical]` (TE gated to 1885).

---

# C. National component variants (8–15)

Each row overlays one shared family with a Spanish national designation, a sourced shell mass/parameters and
a `mounts` list. Shell masses for the Armstrong RMLs are **DERIVED** from the published projectile
designation (300-pdr, 180-pdr, 64-pdr); the Hontoria and Krupp shell masses are **ESTIMATE** (the sources
give the bore/model, not the projectile weight). Mounts ∈ TURRET | BARBETTE | CASEMATE | DECK_SHIELDED |
DECK_OPEN | BROADSIDE_BATTERY.

| family id (components.yaml)      | ES national model (designation)                                   | fields / values                                                                     | mounts                                | source                          | confidence                          |
| -------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------- | ----------------------------------- |
| `gun_rml_10in_18ton`             | **254 mm Armstrong 300-pdr RML** (Numancia/Vitoria main)          | caliber 254000; shell **136000** (300 lb); MV/charge from the family (RML)          | BROADSIDE_BATTERY, DECK_OPEN          | [NP] Numancia/Vitoria; [SBN] §6.8 | SINGLE-SOURCE / DERIVED (shell)     |
| `gun_rml_10in_18ton_broadside`   | same gun, secondary broadside role                                | as above; SECONDARY role                                                            | BROADSIDE_BATTERY                     | [NP]; [SBN] §6.8                 | SINGLE-SOURCE / DERIVED             |
| `gun_rml_8in_9ton`               | **203 mm Armstrong 9-ton 180-pdr RML** (Vitoria, Aragón)          | caliber 203000; shell **81600** (180 lb)                                            | BROADSIDE_BATTERY, CASEMATE, DECK_SHIELDED | [NP] Vitoria/Aragón           | SINGLE-SOURCE / DERIVED (shell)     |
| `gun_rml_64pdr_71cwt`            | **160 mm Palliser RML** (Numancia; 160/16 on Puigcerdá)           | caliber 160000; shell 29000 (64 lb, family)                                         | BROADSIDE_BATTERY, DECK_OPEN          | [NP] Numancia/Puigcerdá         | SINGLE-SOURCE                       |
| `gun_bl_6in_26`                  | **160/25 Hontoria M1879** (Aragón 1885 fit, General Concha)       | caliber 160000; shell ~40000 ESTIMATE; intro 1879-01; DOMESTIC                       | DECK_SHIELDED, BROADSIDE_BATTERY      | [NP] Aragón/General Concha      | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| `gun_bl_6in_26`                  | **160/35 Hontoria M1883** (Reina Regente, Alfonso XII, Velasco)   | caliber 160000; shell ~40000 ESTIMATE; intro 1883-01; DOMESTIC                       | DECK_SHIELDED, CASEMATE, BROADSIDE_BATTERY | [NP] Reina Regente/Alfonso XII | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| `gun_qf_47in`                    | **120/25 Hontoria M1879** (Pilar, Aragón; El Cano, General Lezo)  | caliber 120000; shell ~20000 ESTIMATE; intro 1879-01; DOMESTIC                       | DECK_SHIELDED, DECK_OPEN              | [NP] Pilar/General Concha       | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| `gun_qf_47in`                    | **120/35 Hontoria M1883** (Pelayo, Isla de Luzón, Velasco)        | caliber 120000; shell ~20000 ESTIMATE; intro 1883-01; DOMESTIC                       | DECK_SHIELDED, DECK_OPEN              | [NP] Pelayo/Isla de Luzón       | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| `gun_rml_8in_9ton`               | **200/35 Hontoria M1883** (Pelayo secondary, Reina Regente main)  | caliber **200000**; shell ~90000 ESTIMATE; intro 1883-01; DOMESTIC; **BL-on-RML overlay (flag §F)** | DECK_SHIELDED, CASEMATE, BARBETTE     | [NP] Pelayo/Reina Regente       | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| `gun_qf_12pdr`                   | **75/24 Krupp M1883** (Aragón, Velasco)                           | shell ~6000 ESTIMATE; IMPORTED                                                      | DECK_OPEN                             | [NP] Aragón/Velasco             | SINGLE-SOURCE / ESTIMATE (shell)    |
| `gun_qf_6pdr`                    | **57 mm Nordenfelt / Hotchkiss 6-pdr**                            | shell 2720 (family)                                                                  | DECK_OPEN                             | [NP] Pelayo/Reina Regente       | SINGLE-SOURCE                       |
| `gun_hotchkiss_3pdr`             | **47 mm Hotchkiss 3-pdr**                                         | shell 1500 (family)                                                                  | DECK_OPEN                             | [NP] Reina Regente/Cástor       | SINGLE-SOURCE                       |
| `gun_nordenfelt_1in`             | **25 mm Nordenfelt 1-in 4-barrel**                                | bullet 206 (family)                                                                  | DECK_OPEN                             | [NP] Pelayo/Temerario           | SINGLE-SOURCE                       |
| `tube_14in_above_water`          | **356 mm Whitehead, above-water**                                 | bore 356000 (equals the catalogue 14-in); IMPORTED                                   | — (ABOVE_WATER_TRAINABLE)             | [NP] Destructor/Reina Regente   | SINGLE-SOURCE                       |
| `tube_14in_submerged`            | **356 mm Whitehead, submerged bow/beam**                          | bore 356000; IMPORTED                                                                | — (UNDERWATER_FIXED)                  | [NP] Isla de Luzón/Velasco      | SINGLE-SOURCE                       |

That is **16 model rows across 12 families** (several families carry two national models, which the Japan
and Russia notes precedent as legal). Notes:

- The Armstrong RMLs are the genuine import signature; the Hontoria BLs are the genuine domestic signature.
- The Hontoria and Krupp bores are taken from [NP] designations; the **shell masses are ESTIMATE** (no
  ordnance table was opened for Spain). A period annual or a Hontoria catalogue would upgrade them.
- The **200/35 Hontoria** row overlays an RML family because no 8-in BL family exists in the catalogue; the
  overlay flags a BL-vs-RML behaviour mismatch (same discipline as the Japan/US/Russia notes).
- The 320 mm and 280 mm Hontoria heavy guns (Pelayo) have **no shared family** — a deferred gap (§F).

---

# D. Six 1880 opening reference designs (doctrine templates, ESTIMATE)

Each is a legal 1880-01 starting point, **not** a historical reconstruction. Dimensions/power are ESTIMATES
tuned to compile under the 1880 catalogue; the **shape** is grounded in Spanish practice (slow, small,
foreign-designed, coast/colonial, thin armour). `depthToMainDeck` is UNVERIFIED for every Spanish ship
([NP] gives none). Plant: `compound_cylindrical` is the only 1880 plant in `plants.yaml` (the historical
locomotive-boiler plants of Cástor/Destructor are dated 1890 and are **not** legal at 1880-01 — §F).

| type | shape / inspiration (source)                                       | hull form               | Lwl × B × T × D (mm)              | target displ (kg) | plant                | kW   | fuel (kg) | main / secondary (family × barrels, mount)                                        | armour (mm, scheme)                                        | doctrine note                              |
| ---- | ------------------------------------------------------------------ | ----------------------- | --------------------------------- | ----------------- | -------------------- | ---- | --------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| **B**  | Numancia broadside ironclad, 1874 t (historical, [NP]/[SBN])       | `coast_defence_form`    | 96100 × 17400 × 8220 × 12000      | 7,189,000         | `compound_cylindrical` | 2760 | 1,100,000 | 2 × `gun_rml_10in_18ton` BROADSIDE + 8 × `gun_rml_64pdr_71cwt` BROADSIDE              | belt 130 wrought_iron; battery 120; ends 10; magazine box 130 | ageing broadside ironclad; coast/colonial  |
| **CA** | Carlos V / Infanta María Teresa lineage (1890s, doctrine template)  | `protected_cruiser_form`| 100000 × 15000 × 6100 × 8500      | 4,900,000         | `compound_cylindrical` | 6000 | 680,000   | 2 × `gun_rml_10in_18ton` DECK_OPEN (fwd/aft) + 6 × `gun_rml_64pdr_71cwt` BROADSIDE + 2 × `tube_14in_above_water` | belt 102 wrought_iron; deck 38; magazine box 127           | fictional 1880 armoured cruiser (thin belt); doctrine template |
| **CL** | Reina Regente protected cruiser (1888) / Velasco (1881)            | `protected_cruiser_form`| 90000 × 13500 × 6200 × 8000       | 4,000,000         | `compound_cylindrical` | 6000 | 700,000   | 4 × `gun_bl_6in_26` (Hontoria 160/25 M1879) DECK_SHIELDED + 4 × `gun_qf_47in` (Hontoria 120/25 M1879) DECK_OPEN + 2 × `tube_14in_above_water` | deck 50 wrought_iron; coal-bunker side protection          | fast colonial cruiser / patrol; Hontoria guns |
| **DD** | Cástor (1878) / Destructor (1887) lineage                          | `torpedo_boat_form`     | 55000 × 5500 × 1900 × 3500        | 350,000           | `compound_cylindrical` | 1500 | 40,000    | 1 × `gun_hotchkiss_3pdr` DECK_OPEN + 2 × `tube_14in_above_water`                       | nil                                                        | small torpedo craft; torpedo flotilla      |
| **KE** | General Concha gunboat (1885) / Pilar (1881) / Somorrostro (1875)  | `coast_defence_form`    | 50000 × 8500 × 2500 × 4500        | 515,000           | `compound_cylindrical` | 450  | 80,000    | 2 × `gun_rml_64pdr_71cwt` DECK_SHIELDED + 2 × `gun_nordenfelt_1in` DECK_OPEN           | nil                                                        | colonial/coastal gunboat for Cuba & the Philippines |
| **AMC**| Spanish liner taken up from trade (doctrine template)              | `merchant_liner_form`   | 115000 × 14000 × 3500 × 8000      | 3,500,000         | `compound_cylindrical` | 2600 | 900,000   | 4 × `gun_rml_64pdr_71cwt` DECK_OPEN + 2 × `tube_14in_above_water`                     | nil                                                        | armed liner for colonial trade protection  |

All six are **ESTIMATE** (dimensions, power, armour are gameplay shapes); the family choices and the B shape
are grounded in the historical ships named. Notes:

- The **B** mirrors the in-service Numancia (kept `coast_defence_form` as the UK Devastation reference
  design does). A Vitoria-based variant (12 kn, 4 × 254 + 3 × 203) is equally grounded.
- The **CA** is explicitly fictional — Spain had no armoured cruiser in 1880; it is a doctrine template.
- The **CL** uses the Hontoria M1879 guns (introduced 1879), so it is legal at 1880 once those models exist;
  a fallback using only the catalogue RMLs is available.
- The **DD** must use `compound_cylindrical` (min 300 kW, max 8000 kW); the historical Cástor/Destructor
  locomotive-boiler plants are dated 1890 in the catalogue (§F). The DD *scale* (350 t here) is a doctrine
  template, not a historical reconstruction — the repo's generic DD starter is ~1,500 t (the same open
  decision the Japan note raises).
- The **KE** mirrors General Concha (515 t, 11 kn, 120 mm Hontoria) but uses RML/machine-gun armament to be
  legal at 1880-01.
- The **AMC** takes its hull from `merchant_liner_form`; it is a doctrine template with no dedicated Spanish
  naval series.

---

# E. Naming policy

Published 1880s Spanish ship names are historical facts; cited to [NP] class pages and [NA86] (the
turning-power table names Mendez Munez, Numancia, Vitoria and Zaragoza as Spanish ironclads).

| type          | convention (one line)                                                                                              | stems (published names)                                                                                                       | source / confidence                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **B**         | Historic battles/sieges and provinces, plus royal and admiral names (Numancia = Roman siege; Vitoria, Zaragoza, Sagunto = battles/sieges). | Numancia, Vitoria, Sagunto, Zaragoza, Méndez Núñez, Pelayo, Carlos V                                                            | [NP]; [NA86] p. 292 — SINGLE-SOURCE     |
| **CA**        | Regnal/royal, province and admiral names                                                                           | Infanta María Teresa, Vizcaya, Almirante Oquendo, Cristóbal Colón, Carlos V, Princesa de Asturias                              | published lists relayed (no [NP] class page found; UNVERIFIED as opened) |
| **CL**        | Royal/regnal, provincial/colonial place, and admiral names                                                          | Reina Regente, Alfonso XIII, Lepanto, Isla de Luzón, Isla de Cuba, Marqués de la Ensenada, Velasco, Gravina, Infanta Isabel, Isabel II, Cristóbal Colón, Don Juan de Austria, Don Antonio de Ulloa, Conde de Venadito, Aragón, Navarra, Castilla | [NP] (each class page) — SINGLE-SOURCE  |
| **DD**        | Mythological/astronomical and torpedo-boat names (Cástor = the twin star; Ariete = ram; Furor, Terror = violent-action names) | Cástor, Rigel, Orión, Azor, Ariete, Acevedo, Retamosa, Barceló, Habana, Ejército, Destructor, Temerario, Nueva España, Galicia, Furor, Terror, Plutón | [NP] (each class page) — SINGLE-SOURCE  |
| **KE**        | Rivers, coastal places and saints' names                                                                            | Somorrostro, Ebro, Bidasoa, Teruel, Nervión, Toledo, Tajo, Arlanza, Turia, Segura, Pilar, Paz, Eulalia, Alsedo, Tarifa             | [NP] (each class page) — SINGLE-SOURCE  |
| **AMC**       | Liner names taken up from trade; no dedicated naval series in-band                                                  | (no in-band Spanish naval series)                                                                                              | rule                                     |

All stems are SINGLE-SOURCE (published ship lists) except the CA row, whose class page could not be opened
this session (navypedia omits the Infanta María Teresa class) — marked accordingly. A full curated dataset
(collision handling, accents/particles) is content authoring, deferred to the spec/implementator.

---

# F. Recommendations (concrete profile values — non-normative)

| profile field                                     | Spain candidate                                                                 | basis                              | label                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------ |
| `strategicSituation.postures`                     | `[colonial_presence, coastal_defence, distant_water_operations, commerce_defence]` (+ `torpedo_warfare` weak) | §A.1 | grounded shape (SINGLE-SOURCE) |
| `industrialProfile.buildTimeMultiplierBp`         | 10600–11200                                                                     | §A.2 slow domestic yards           | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.costMultiplierBp`              | 10500–11000                                                                     | §A.2 imports                       | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.machineryReliabilityBp`        | 8300                                                                            | imported plant; late builds        | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.constructionQualityVarianceBp` | 3800                                                                            | "clumsily built" Aragón; delays    | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.maxPracticalDisplacementKg`    | 1880 7.2M / 1885 9.7M / 1890 9.8M (imported; domestic ~3.3M→4.7M)               | §A.2 completed classes             | ESTIMATE                       |
| `industrialProfile.heavyGunProduction`            | IMPORTED (early) → DOMESTIC (Hontoria, later)                                    | §A.2 [NP] armament fields          | SINGLE-SOURCE                  |
| `industrialProfile.armourPlateProduction`         | IMPORTED (early) → DOMESTIC (inferred, later; Pelayo belt = Creusot steel)       | §A.2 [NP]/[EB]                     | SINGLE-SOURCE / ESTIMATE       |
| `hardCapabilities.maxGunCaliberUm`                | 254000 (in-catalogue; 320 mm Hontoria has no family)                            | §B                                 | grounded shape                 |
| `hardCapabilities.maxArmourThicknessUm`           | 130000 (1880 ironclad belt)                                                     | §B                                 | grounded shape                 |
| `hardCapabilities.domesticTorpedoDiameterUm`      | 356000 (imported Whitehead; bore = catalogue)                                   | §B                                 | SINGLE-SOURCE                  |
| `doctrineProfile.engagementRangeM`                | 1500                                                                            | §A.3 period                        | ESTIMATE / **BALANCE TARGET**  |
| `doctrineProfile.hePreferenceBp`                  | 3500 (AP-dominant, Palliser)                                                    | §A.3                               | **BALANCE TARGET**             |
| `softPreferences.speedOverArmourBp`               | 4500                                                                            | conservative, armour over speed    | **BALANCE TARGET**             |
| `softPreferences.enduranceWeightBp`               | 12000                                                                           | two colonial theatres              | **BALANCE TARGET**             |
| `softPreferences.riskToleranceBp`                 | 3000                                                                            | fleet preservation                 | **BALANCE TARGET**             |
| `softPreferences.colonialServiceWeightBp`         | 12500                                                                           | Cuba/Puerto Rico/Philippines/Guam  | **BALANCE TARGET**             |
| `softPreferences.torpedoOnCruisersBp`             | 8000                                                                            | small flotilla                     | **BALANCE TARGET**             |
| `researchPreferences`                             | §A.4 (INFRA 3, GUNNERY 3, HULL 3, then 2s)                                       | §A.4                               | grounded shape / ESTIMATE      |
| `componentAccess`                                 | §B                                                                              | §B                                 | mixed per row                  |
| `gunModels` + `componentVariants`                 | §C (16 rows, 12 families)                                                       | §C                                 | SINGLE-SOURCE / ESTIMATE       |
| `designs`                                         | §D (6)                                                                          | §D                                 | ESTIMATE                       |
| `namingPolicy`                                    | §E                                                                              | published ship lists               | grounded (SINGLE-SOURCE)       |

Keep every cost/build-time modifier inside ±15 % (`docs/ships-nation-orientation.md` §2); the Spanish spread
above is ~10–12 %, at the higher-cost end because the navy imports. Ship every ESTIMATE/UNVERIFIED figure
with its label and a provenance record.

---

# G. Deferred (needs an owner or a decision-request)

- **The 320 mm (and 280 mm) Hontoria heavy gun is not in the catalogue.** Pelayo's main armament (2 × 320/35
  and 2 × 280/35 Hontoria M1883) is Spain's signature heavy, but no shared family exists. A new family
  (e.g. `gun_bl_320mm_hontoria`) or a decision to leave it unauthorable is needed before a Spanish 1880–1890
  capital ship can carry its historical gun. **This is the single biggest gap.**
- **Hontoria BL / Krupp medium shells are ESTIMATE.** The sources give the bore/model, not the projectile
  weight. A period annual ordnance table (Brassey foreign-gun tables) or a Hontoria/Trubia catalogue would
  upgrade them before release (no PLACEHOLDER may ship).
- **BL-on-RML overlay.** The 200/35 Hontoria overlays `gun_rml_8in_9ton` (the only 203 mm family) because no
  8-in BL family exists; the family inherits muzzle-loader behaviour. Confirm multiple models per family are
  legal, or add a dedicated family (same deferred item as the Japan/US/Russia notes).
- **DD scale + pre-1880 torpedo-boat plant.** The historical Cástor (23 t, 1878) and Destructor (348 t,
  1887) used locomotive boilers; the catalogue's `locomotive_boiler_tb` is dated 1890. Either a pre-1880
  torpedo-boat plant is added, or the 1880 DD starter uses `compound_cylindrical` at a larger scale (as the
  UK/Italy starters do). The DD slot scale (350 t vs ~1,500 t) is an open content decision.
- **`maxPracticalDisplacementKg` semantics.** Does the ceiling gate *domestic build* only (then imported
  hulls like Pelayo 9,745 t are legal) or all construction? Surface; do not resolve.
- **Armour-plate production = IMPORTED early** is sourced for Pelayo (Creusot); the *domestic later* claim is
  an inference (absence of evidence of a Spanish plate mill in [NP]). A Conway's Spain chapter would settle it.
- **Spanish industry/budget primary source.** No Spanish naval annual, yard return or peseta budget was
  opened; the annual's Spain estimates page was not recovered from the OCR. Every industrial multiplier and
  the research weights remain ESTIMATE until a print source is opened.
- **Moulded depth for every design** — no source gives it (carried over from the earlier notes). Depths are
  ESTIMATE.
- **Infanta María Teresa-class CA names** — navypedia has no class page; the CA naming row rests on published
  lists relayed, not opened (UNVERIFIED as opened).
- **Submarines / deferred mechanics** — Peral's boat (1888) is a genuine Spanish first, but per DESIGN-55 §14
  it must not be treated as reachable content; keep priority 1 / preference only.
- **KE and AMC are doctrine templates** — confirm fictional-but-legal starters are acceptable (the existing
  `reference-designs.yaml` already does this for the UK/France).

**No `docs/OPEN-ISSUES.md` decision was resolved here** (the registry carries no Spain item).

---

# H. Verdict

**Qualified yes — the Spanish profile is authorable now, with per-figure labels.**

- **Strongly grounded (read directly):** the *shape* — a small, ageing, foreign-built ironclad squadron
  (Numancia, Vitoria, Puigcerdá), colonial/coastal/distant-water duties (Cuba, Puerto Rico, Philippines,
  Guam), weak domestic industry and heavy import dependence, a small but real torpedo programme, and the
  domestic Hontoria gun as the one technical signature — rests on the directly-read [NP] class pages and the
  1886 Brassey annual (Spanish notes p. 274; the torpedo destroyer p. 81; the turning-power table p. 292).
- **The national component models are grounded gun-by-gun:** the Armstrong 254/203/160 mm RMLs (Numancia,
  Vitoria) are exact bore matches to the catalogue's RML families; the Hontoria BLs and Krupp mediums are
  [NP]-sourced by bore/model; the 356 mm Whitehead tubes match the catalogue exactly.
- **What is ESTIMATE/BALANCE TARGET and must be labelled as such:** every cost/build-time/reliability/
  variance multiplier, the max-displacement progression, the doctrine weights, the Hontoria/Krupp shell
  masses, and the fictional CA/CL/DD/KE/AMC templates.
- **What is genuinely missing:** the 320 mm Hontoria family (the signature heavy), Spanish shell masses, a
  Spanish budget/yard primary, and the exact canonical research-field enum. None blocks a first profile; the
  320 mm family is the one that materially limits a Spanish capital ship.

Recommendation to the orchestrator: author the profile now with §F's values and §B–D's access/variant/design
tables; ship every ESTIMATE/UNVERIFIED figure with its label; keep all multipliers inside ±15 % and labelled
BALANCE TARGET; and raise a decision-request for the 320 mm Hontoria family before authoring Spanish
capital-ship armament beyond the Numancia/Vitoria RML shape.

## Source list

1. navypedia.org Spanish class pages, read directly this session: `spain/sp_index.htm`, `sp_bb.htm`,
   `sp_bb_numancia.htm`, `sp_bb_vitoria.htm`, `sp_bb_pelayo.htm`, `sp_bb_puigcerda.htm`, `sp_cr.htm`,
   `sp_cr_reina_regente88.htm`, `sp_cr_isla_de_luzon.htm`, `sp_cr_aragon.htm`, `sp_cr_velasco.htm`,
   `sp_cr_alfonso_xii.htm`, `sp_dd.htm`, `sp_dd_destructor.htm`, `sp_dd_temerario.htm`, `sp_dd_castor.htm`,
   `sp_of.htm`, `sp_of_somorrostro.htm`, `sp_of_pilar.htm`, `sp_of_general_concha.htm`.
2. T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`
   (`NavalAnnual1886_djvu.txt`, read directly): "Notes on the Spanish Navy" p. 274; Spanish torpedo
   destroyer (from _Engineering_) p. 81; turning-power table (Numancia/Vitoria/Zaragoza) p. 292.
3. `docs/research/ship-building-1880-ships-by-nation.md` §6.8 (in-service Spanish hulls).
4. `docs/research/ship-building-1880-pre-era-armament.md` (RML catalogue values; Brassey 1886 penetration table).
5. In-repo companions: `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
   `italy-naval-profile.md`, `japan-naval-profile.md`, `russia-naval-profile.md`, `usa-naval-profile.md`;
   `content/production/1880/{countries,research,economies,possessions,areas,ports}.yaml`,
   `content/production/1880/ship-building/{components,plants,hull-forms,balance,naval-profiles,reference-designs}.yaml`.
6. Print works named as leads (not opened this session): Conway's _All the World's Fighting Ships 1860–1905_
   (1979); Jane's _Fighting Ships_ (1898); A. Roksund, _The Jeune École_ (Brill, 2007).
