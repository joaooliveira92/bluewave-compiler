# Research: national naval profile — United States (`usa`, 1880–1899)

Companion to `national-naval-profiles-uk-france.md` and `national-naval-profiles-germany.md`; method, source
grades and confidence labels are identical. Every in-repo figure (gun families, plants, hull forms, balance) is
reused from the EARLY-band notes, never re-derived here. **Research only:** this note authors no code, no content
YAML and no spec. Captured 2026-10-11.

The profile must be authored for the canonical repo id `usa` (canonical `NationNavalProfile`), overlaying the
shared catalogue at `content/production/1880/ship-building/` (`components.yaml`, `gun-families.yaml`,
`plants.yaml`, `hull-forms.yaml`, `balance.yaml`). The existing shipped US country record
(`content/production/1880/countries.yaml` id `usa`) and research draft
(`content/production/1880/research.yaml` `usa`) already carry the shape; this note supplies the grounded figures
the orchestrator/spec may then author.

## 0. Question

What are the grounded figures and national differentiators needed to author a date-banded `NationNavalProfile`
(1880–1899) for the **United States**, plus national component variants over the shared catalogue and six 1880
opening reference designs (B, CA, CL, DD, KE, AMC), with procurement and naming policy?

The defining fact, established before anything else: in January 1880 the US had **no modern seagoing
ironclad**, **no modern breech-loading heavy gun**, **no compound/steel armour on a completed ship**, and **no
service torpedo**. The only armour afloat was in Civil-War coast-defence monitors; the only "new" cruising ship
was the wooden screw frigate `Trenton`. This is a post-Civil-War retrenchment navy with an enormous latent
industrial base, not a small version of the RN. Canonical postures and every multiplier below are shaped by that.

## 1. Method, source grades and confidence labels

Every figure carries a named source and one of:

- **VERIFIED** — read directly in a period primary/near-primary text (full text fetched and read), or two independent sources agree.
- **SINGLE-SOURCE** — one source only, or a secondary compilation that itself cites print works (named in the row) which I could not open.
- **DERIVED** — computed by me from other cited figures (arrow ships) or inferred from the profile shape.
- **ESTIMATE** — derived by me from other cited figures (calculation shown) or an inferred range; not itself a source figure.
- **UNVERIFIED** — no usable source found, or sources conflict; a plausible range is given instead.

**Wikipedia is not cited as a source anywhere.** Where a page was used only as a lead to the print work it
cites, the print work is named and the row is at most SINGLE-SOURCE.

| Tag     | Source                                                                                                                                                                                                  | Grade / reach                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [B86]   | T. A. Brassey (ed.), **_The Naval Annual 1886_** (1st volume; archive.org id `navalannual1886`). Read directly this session as full text (`NavalAnnual1886_djvu.txt`, 49,093 lines): "Notes on the United States Navy" (pp. 283–288); "A Gun-Foundry Board" (pp. 357–360); Appendix—United States (pp. 505–508); comparative estimates (pp. 24–25). | **Primary contemporary annual** — figures actually read are VERIFIED as printed.           |
| [NP]    | **navypedia.org** US class pages (Ivan Gogin), built principally on Conway's _All the World's Fighting Ships 1860–1905_ + national histories. Read directly this session: `usa/usa_index`, `usa_battleships`, `usa_cruisers`, `usa_other`, `us_mon_canonicus`, `us_mon_amphitrite`, `us_cr_galena`.                                       | Secondary compilation. SINGLE-SOURCE.                                                       |
| [SBN]   | `docs/research/ship-building-1880-ships-by-nation.md` §6.5 (in-repo): USS `Trenton` ([DANFS] relay), USS `Canonicus` ([NP]), torpedo rams `Alarm`/`Intrepid` ([NE]).                                    | In-repo note; SINGLE-SOURCE.                                                               |
| [PA]    | `docs/research/ship-building-1880-pre-era-armament.md` §4 (in-repo): US Dahlgren smoothbores and Parrott rifles. **Every US gun figure there is explicitly UNVERIFIED** (no US ordnance manual opened). | In-repo note; UNVERIFIED.                                                                  |
| [DANFS] | US Navy, _Dictionary of American Naval Fighting Ships_, "Trenton i" — relayed via [SBN], not opened (the DANFS page returned a transport error).                                                       | Official US reference, relayed. SINGLE-SOURCE.                                             |
| [NE]    | naval-encyclopedia.com "US Old Navy (1865–85)" — relayed via [SBN], not opened this session.                                                                                                            | Secondary compilation. SINGLE-SOURCE.                                                       |
| [CW]    | Conway's _All the World's Fighting Ships 1860–1905_ (1979), Roberts US chapter — **not opened online**; reached only through [NP].                                                                        | Print secondary; relayed. SINGLE-SOURCE.                                                    |
| [NW]    | navweaps.com — checked: **no coverage of any pre-1883 US gun** (negative cross-check).                                                                                                                  | n/a.                                                                                        |

Limits: [CW] and the US Navy _Ordnance Instructions_ (1866/1876), which would settle every Dahlgren/Parrott
figure, were not opened. The `[B86]` "Table of United States Naval Ordnance" (p. ~31813 in the OCR) is
**rotated 180° and unreadable** — it could not be used. The 1886 annual describes the state the navy had
reached *from* 1880 (the ABC cruisers are 1885–89), so it is used for the strategic/industrial *shape* and for
the 1886 re-armament programme, never as a 1880 ship list. Where a figure could not be grounded, a labelled
ESTIMATE is given rather than a point value.

Conversions: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1,016.05 kg; 1 fps = 0.3048 m/s; 1 ihp = 0.7457 kW.

---

## 2. Strategic posture (1880)

| posture                        | applies?       | justification (one line)                                                                                                                                                                                                     | source                                     | confidence     |
| ------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------- |
| **coastal_defence**            | **PRIMARY**    | The only armour afloat was coast-defence monitors (Canonicus class, 2,100 t, 8 kn); the Navy's stated function was coastal defence, and in 1886 the committee recorded "no armour on a completed vessel … that can resist an enemy's guns". | [NP] `us_mon_canonicus`; [B86] pp. 507–508; [SBN] §6.5 | SINGLE-SOURCE / VERIFIED (statement) |
| **commerce_defence**           | **PRIMARY**    | A small cruising force for trade protection and hemispheric interests; the 1886 bill's "Swift Cruiser" and 3 protected cruisers were its realisation. US registered merchant tonnage ~1.35–1.63 M (1879–80).                     | [B86] pp. 506, 510; [NP] `us_cr_galena`      | SINGLE-SOURCE  |
| **regional_warfare**           | secondary      | Two ocean frontiers, no isthmian canal, and hemispheric (Monroe Doctrine) obligations invite short-range regional war, not a battle line.                                                                                     | shape from `countries.yaml`; [B86] p.507     | DERIVED        |
| distant_water_operations       | weak           | Pacific / Asiatic / South Atlantic stations and a Pacific coaling interest (Pago Pago, 1878), but no station empire.                                                                                                          | [CW]/[NP] relayed                            | ESTIMATE       |
| battle_fleet_concentration     | **does NOT apply** | No battle fleet and no sea-going ironclad in service in 1880; the 1886 committee's "Our Navy is not equal to what it was in 1860".                                                                                            | [B86] pp. 505–507; [NP]                      | VERIFIED (statement) |
| commerce_raiding               | **does NOT apply** | Not the US doctrine of 1880 (that is the later/Confederate legacy and the Jeune-École); US effort went to *defence* of trade, not attack.                                                                                    | [B86] passim                                 | DERIVED        |
| torpedo_warfare                | **does NOT apply** | "All nations, except America, are supplying themselves with the Whitehead torpedo; but our Government has absolutely no movable torpedoes … beyond the stage of experiment" (1886).                                           | [B86] p. 508                                 | VERIFIED (statement) |
| colonial_presence              | weak / no      | No colonies in 1880 (Alaska and a Pago Pago coaling interest aside); no overseas-station tonnage obligation.                                                                                                                  | [B86]; [CW] relayed                          | DERIVED        |

**Recommended `postures`:** `[coastal_defence, commerce_defence, regional_warfare]` (primary–primary–secondary).
This is deliberately *not* the UK list (`battle_fleet_concentration, colonial_presence, commerce_defence`); it
is the retrenchment navy. The enormous latent industry is an **industrial-capability** fact (§3), not a posture.

## 3. Industrial capability

| item                              | figure / direction                                                                                                                                                          | unit        | source                                        | confidence                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------- | -------------------------------- |
| Annual programme (1868–1885)      | almost nil; Secretary Whitney (1885) reported that since 1868 the US had spent over **£15,000,000** on construction/repair/equipment/ordnance, "substantially thrown away". | £ / ships   | [B86] pp. 33–34                               | VERIFIED (as printed)            |
| Navy estimates (1886–7)           | Ordinary **£2,597,880** (1885–6: £2,718,140); extraordinary for increasing strength **£700,000** — vs the RN's net £12,993,000 (1886–7).                                     | £           | [B86] pp. 505–506, 3147                       | VERIFIED (as printed)            |
| 1886 re-armament bill (the "New Navy" turn) | proposed 2 × 6,000 t seagoing armoured ships + 3 × 5,000 t protected cruisers + 4 TB + 1 torpedo cruiser (£2.85M); Senate allowed 2 armoured + 1 swift cruiser + 1 TB + 1 dynamite cruiser + completion of 4 monitors (£2,215,600). | £ / t       | [B86] p. 506                                  | VERIFIED (as printed)            |
| Shipbuilding base                   | navy yards (Brooklyn, Norfolk, Portsmouth, Mare Island, Washington, Philadelphia, Boston, New York) + private (Cramp, John Roach, Harlan & Hollingsworth, Continental Iron Wks, Secor). | —           | [NP] builder columns                          | SINGLE-SOURCE                    |
| Build-time modifier                 | **SLOWER early / rusty**: 1870s navy-yard cruisers took 6–13 years (Galena laid 1872 → comm. 1880; Mohican laid 1872 → comm. 1885). Propose **10400–10600 bp**.              | ×           | [NP] `us_cr_galena` dates; ESTIMATE           | ESTIMATE / **BALANCE TARGET**    |
| Cost modifier                       | **near-neutral**: lower wages offset by idle/inefficient yards. Propose **9900–10200 bp**.                                                                                  | ×           | ESTIMATE (no US cost series opened)           | ESTIMATE / **BALANCE TARGET**    |
| Max practical displacement          | **1880 ≈ 6.0 M kg → 1885 ≈ 8.0 M → 1890 ≈ 11.0 M** (Trenton 3,800 t is the largest recent; Chicago 4,500 t 1889; Maine/Texas ~6,700–6,900 t 1895; Indiana 10,300 t 1895).     | kg          | [SBN]; [NP]; ESTIMATE from completed classes  | ESTIMATE                         |
| Heavy-gun production                | **DOMESTIC** — Washington Navy Yard gun factory (navy) and Watervliet (army); the 1883 Gun-Foundry Board (Adm. Simpson) recommended steel-hoop guns built up in government factories, steel parts by contract. **But a real 1868–88 gap**: "since the American war the armaments had naturally dropped in arrear"; in 1886 "no gun mounted that can pierce an enemy's armour". | — | [B86] pp. 357–360, 507 | VERIFIED (statement) |
| Armour-plate production             | **DOMESTIC (with import fallback)** — the 1886 Act required armour "of best obtainable quality and of domestic manufacture, provided contract … can be made with responsible parties; otherwise … import it". No modern armour plate existed in 1880 (Bethlehem Iron's plate came 1887–89). | — | [B86] p. 506 | VERIFIED (as printed) |
| Machinery reliability               | compound engines + Ericsson vibrating-lever (monitor) built at home; reliable but old. Propose **reliabilityBp 8800–9000** (plants.yaml `compound_cylindrical` = 8500).      | bp          | plants.yaml; ESTIMATE                         | ESTIMATE / **BALANCE TARGET**    |
| Construction-quality variability    | moderate: navy-yard rebuilds overweight ("a repaired wooden vessel … neither fight nor run away", Whitney 1885), but no French-style instability. Propose **3000–3500 bp**.  | bp          | [B86] pp. 33–34; ESTIMATE                     | ESTIMATE / **BALANCE TARGET**    |

## 4. Doctrine

| field                         | US position (1880)                                                                                                 | source / basis                                  | confidence                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ----------------------------- |
| preferred engagement distance | **short, ~1,000–1,500 m** — smoothbore Dahlgrens and no rangefinders; the period's battle range is short.           | [PA]; ESTIMATE (period)                         | ESTIMATE / **BALANCE TARGET** |
| main-gun emphasis             | few, very heavy, low-velocity muzzle-loaders in monitors (15-in Dahlgren)                                              | [SBN] §6.5/[PA]; [NP] `us_mon_canonicus`       | SINGLE-SOURCE                 |
| secondary-battery emphasis    | broadside batteries of 8-in/10-in rifles on cruising ships; "small guns" (Gatling/Hotchkiss revolvers)              | [B86] p. 288; [NP] `us_cr_galena`               | SINGLE-SOURCE                 |
| AP-vs-HE preference           | mixed, shell-heavy: Civil-War practice used solid shot (AP) and shell (HE) about equally; no modern capped AP. Proposed **hePreferenceBp ≈ 5000–6000**. | [PA]; ESTIMATE                                  | ESTIMATE / **BALANCE TARGET** |
| fire-control priority         | nil in 1880 (no rangefinder; Barr & Stroud is 1893).                                                                | components.yaml `rangefinder_optical` (1893)    | DERIVED                       |
| rate of fire                  | low; heavy RML/smoothbore ~0.3–1 rds/min hand-worked                                                               | [PA] §1                                         | ESTIMATE                      |
| torpedo priority              | **nil in 1880** — "absolutely no movable torpedoes"; first US Whitehead ~1890 (18-in).                              | [B86] p. 508; [NP]                              | VERIFIED (statement)          |
| protection: belt vs deck      | monitors: iron side 127–76 + turret 254 + deck 38; cruising ships: none (coal-bunker side protection only).          | [NP] `us_mon_canonicus`; [SBN] §6.5             | SINGLE-SOURCE                 |
| accommodation                 | STANDARD on cruisers; spartan in monitors.                                                                          | [NP]; countries.yaml                            | SINGLE-SOURCE                 |

**Doctrine line:** coastal/defensive, short-range, shell-heavy, few very heavy smoothbores, no torpedo, no rangefinder.

## 5. Research preferences (canonical fields, priority 1–4)

Grounded shape: the post-1880 US effort began with **guns and armour** (the 1883 Gun-Foundry Board; the 1886
armour/ordnance votes), then hulls/machinery (the ABCD cruisers, 1885–89). Torpedoes and fire control lag.

| field             | priority | justification                                                                     | source / basis                                  | confidence     |
| ----------------- | -------- | --------------------------------------------------------------------------------- | ----------------------------------------------- | -------------- |
| GUNNERY           | **4**    | the defining US weakness and the first reform target (Gun-Foundry Board 1883)      | [B86] pp. 357–360, 507                          | VERIFIED (statement) |
| HULL_CONSTRUCTION | **3**    | steel hulls, monitor rebuilding, the ABCD programme                               | [B86] pp. 283–288; [NP]                          | SINGLE-SOURCE  |
| MACHINERY         | **3**    | compound machinery domestic; TE to be introduced                                   | plants.yaml; [NP]                                | DERIVED        |
| TORPEDOES         | **2**    | behind all rivals in 1880 ("no movable torpedoes"), catching up later              | [B86] p. 508                                     | VERIFIED (statement) |
| INFRASTRUCTURE    | **2**    | navy yards + docks domestic; two-ocean problem                                    | [NP]                                             | DERIVED        |
| DAMAGE_CONTROL    | **2**    | subdivision in steel cruisers                                                      | [B86] p. 286                                     | SINGLE-SOURCE  |
| SHIP_DESIGN       | **2**    | design capability exists but idle                                                   | [B86] pp. 283–288                                | DERIVED        |
| FIRE_CONTROL      | **1**    | no rangefinder in-band                                                             | components.yaml                                  | DERIVED        |
| MINES_AND_ASW     | **1**    | not an 1880 US focus                                                               | —                                                | ESTIMATE       |
| SUBMARINES        | **1**    | none; deferred mechanics (DESIGN-55 §14) must not be treated as reachable          | —                                                | DERIVED        |

## 6. Component access

The US signature is **domestic Dahlgren smoothbores and Parrott rifles**, mapped to the **closest RML families**
in the shared catalogue (bore, not behaviour), plus domestic monitors. Every foreign modern BL/QF/torpedo
family is UNAVAILABLE. (Hard capability only ever restricts; it never grants — `docs/ships-nation-orientation.md`.)

| family id                     | status        | producer / note                                                                        |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------------- |
| `gun_rml_16in_80ton`          | DOMESTIC      | Washington Navy Yard / West Point foundry — US 15-in Dahlgren (bore-match 406 mm)       |
| `gun_rml_11in_25ton`          | DOMESTIC      | XI-in Dahlgren (exact bore match, 279 mm)                                                |
| `gun_rml_10in_18ton`          | DOMESTIC      | X-in Dahlgren (exact bore match, 254 mm)                                                 |
| `gun_rml_10in_18ton_broadside`| DOMESTIC      | X-in Parrott rifle (300-pdr)                                                             |
| `gun_rml_8in_9ton`            | DOMESTIC      | VIII-in Dahlgren converted MLR / Parrott rifle (203 mm)                                  |
| `gun_rml_7in_7ton`            | DOMESTIC      | smallest US rifle (20-pdr Parrott) — **approximate** bore match                          |
| `gun_rml_64pdr_71cwt`         | DOMESTIC      | VI.4-in Parrott rifle (100-pdr)                                                          |
| `gun_rml_125in_38ton`, `gun_rml_12in_25ton`, `gun_rml_12in_35ton` | UNAVAILABLE | no US equivalent                                                       |
| `gun_bl_274mm_m1875`, `gun_bl_263mm_rkl20` | UNAVAILABLE | French / German signature heavies                                          |
| `gun_bl_135in_30`, `gun_bl_12in_25`, `gun_bl_12in_35`, `gun_bl_10in_32`, `gun_bl_92in_315`, `gun_bl_6in_26` | UNAVAILABLE | UK modern BL — no US manufacture before 1888                |
| `gun_qf_6in_40`, `gun_qf_47in`, `gun_qf_12pdr`, `gun_qf_6pdr`, `gun_hotchkiss_3pdr`, `gun_nordenfelt_1in`, `gun_maxim_303` | UNAVAILABLE | no US QF/machine-gun family in the catalogue for 1880 |
| `tube_14in_above_water`, `tube_14in_submerged` | UNAVAILABLE | **no US torpedo in 1880**; first US Whitehead ~1890 (18-in)                |

**Mapping caveat (deferred refinement):** the RML families carry British charge/MV/penetration constants; the
US smoothbores had much lower velocity and no armour perforation (`[PA]` §4). The US models override
`attributes.shellMassG` only. A dedicated **smoothbore family** (or a per-model MV/penetration override) is the
correct fix and is deferred — see §11.

## 7. National component variants (gunModels + componentVariants)

Values from `[PA]` §4 (all **UNVERIFIED** — no US ordnance manual opened this session) unless noted. `mounts`
are catalogue mount types. These are **closest-catalogue-match overlays**, not new families.

| family id (shared)            | US national model (designation)                                  | shellMassG (shell / shot)     | mounts                              | source | confidence |
| ----------------------------- | ---------------------------------------------------------------- | ----------------------------- | ----------------------------------- | ------ | ---------- |
| `gun_rml_16in_80ton`          | **XV-inch Dahlgren smoothbore, Model 1862** (monitor turret)      | 150,000 / 199,600             | TURRET                              | [PA]   | UNVERIFIED |
| `gun_rml_11in_25ton`          | **XI-inch Dahlgren smoothbore** (main)                            | 62,000 / 75,300               | TURRET, BROADSIDE_BATTERY           | [PA]   | UNVERIFIED |
| `gun_rml_11in_25ton`          | **XI-inch Dahlgren smoothbore, broadside battery** (secondary)    | 62,000 / 75,300               | BROADSIDE_BATTERY                   | [PA]   | UNVERIFIED |
| `gun_rml_10in_18ton`          | **X-inch Dahlgren smoothbore** (monitor turret)                   | 47,200 / 56,200               | TURRET                              | [PA]   | UNVERIFIED |
| `gun_rml_10in_18ton_broadside`| **X-inch Parrott rifle (300-pdr)**                                | 136,000                       | BROADSIDE_BATTERY, BARBETTE         | [PA]   | UNVERIFIED |
| `gun_rml_8in_9ton`            | **VIII-inch Dahlgren converted MLR** (the `Trenton` fit)          | 79,400                        | BROADSIDE_BATTERY                   | [SBN] §6.5 ([DANFS] relay) | SINGLE-SOURCE |
| `gun_rml_8in_9ton`            | **VIII-inch Parrott rifle (150-pdr)**                             | 68,000                        | BROADSIDE_BATTERY, DECK_SHIELDED    | [PA]   | UNVERIFIED |
| `gun_rml_64pdr_71cwt`         | **VI.4-inch Parrott rifle (100-pdr)**                             | 45,000                        | DECK_OPEN, BROADSIDE_BATTERY        | [PA]   | UNVERIFIED |
| `gun_rml_7in_7ton`            | **XX-pdr Parrott rifle (3.67-in)** — approximate bore match       | 9,100                         | DECK_OPEN                           | [PA]   | UNVERIFIED |
| `gun_nordenfelt_1in`          | **US Gatling / Hotchkiss machine gun** (small-gun fit)            | 206 (bullet; family default)  | DECK_OPEN                           | [B86] p. 288; [NP] `us_cr_galena` | SINGLE-SOURCE (approximate) |

That is **10 variants across 8 families**, within the 8–15 target. **No componentVariants for torpedo tubes**
are authored: the US had none in 1880, so a tube overlay would be fictional (the DD starter therefore carries
no tubes — see §8).

## 8. Six 1880 opening reference designs (doctrine templates, ESTIMATE)

Each is a legal 1880-01 starting point shaped by US practice, **not** a historical reconstruction. Dimensions
and power are ESTIMATES tuned to compile under this content (hull-form length/L-B bands, plant min/max, only
`compound_cylindrical` at 1880-01). The implementator must verify each compiles and hits its target speed
(tuning exercise). `depthToMainDeck` is UNVERIFIED for every US ship (no source gives moulded depth).

| slot | inspiration (source)                              | hullFormId             | L×B×T×D (mm)                          | target displ (kg) | plant                | kW   | fuel (kg) | main armament (family × barrels, mount)              | secondary                | armour (mm, scheme)                                   | doctrine note                          |
| ---- | ------------------------------------------------- | ---------------------- | ------------------------------------- | ----------------- | -------------------- | ---- | --------- | ---------------------------------------------------- | ------------------------ | ---------------------------------------------------- | -------------------------------------- |
| B    | `Canonicus` monitor, 2,100 t ([NP],[SBN])          | `coast_defence_form`   | 68300 × 13200 × 3900 × 5000            | 2,100,000         | `compound_cylindrical` | 300  | 145,000   | `gun_rml_16in_80ton` × 2, TURRET (US 15-in Dahlgren) | —                        | belt 127, deck 38, turret 254, wrought_iron          | coast-defence monitor, 8 kn            |
| CA   | US armoured-cruiser lineage (New York 1893, template) | `protected_cruiser_form` | 100000 × 15000 × 6200 × 8500        | 4,900,000         | `compound_cylindrical` | 8000 | 700,000   | `gun_rml_10in_18ton_broadside` × 2, BARBETTE (10-in Parrott) | 8-in MLR × 6, broadside | belt 102 + deck 38 + magazine box 127, wrought_iron   | fictional 1880 US CA (thin belt); doctrine template |
| CL   | `Trenton` screw frigate, 3,800 t ([DANFS],[SBN])  | `protected_cruiser_form` | 80000 × 14600 × 6250 × 7500          | 3,800,000         | `compound_cylindrical` | 1900 | 500,000   | `gun_rml_8in_9ton` × 6, BROADSIDE_BATTERY            | 20-pdr Parrott × 2       | none; coal-bunker side protection                     | unarmoured cruising ship, 14 kn        |
| DD   | `Alarm`/`Intrepid` torpedo rams + Herreshoff boats ([NE],[SBN]) | `protected_cruiser_form` | 80000 × 11000 × 3300 × 6000 | 1,500,000 | `compound_cylindrical` | 3500 | 250,000 | `gun_rml_64pdr_71cwt` × 1, DECK_OPEN (6.4-in Parrott) | 20-pdr Parrott × 2       | none                                                  | **spar torpedo / ram, no tubes** (US had none), ~19 kn |
| KE   | `Galena`-class wooden sloop, 1,900 t ([NP])       | `coast_defence_form`   | 65800 × 11270 × 5020 × 6800           | 1,900,000         | `compound_cylindrical` | 850  | 170,000   | `gun_rml_8in_9ton` × 4, BROADSIDE_BATTERY            | 6.4-in Parrott × 1       | none                                                  | colonial / station sloop, 10–11 kn     |
| AMC  | armed US liner (template; merchant_liner_form)    | `merchant_liner_form`  | 115000 × 14000 × 3500 × 8000          | 3,500,000         | `compound_cylindrical` | 2600 | 900,000   | `gun_rml_8in_9ton` × 2, DECK_OPEN                    | —                        | none                                                  | armed merchant cruiser, 13 kn          |

Notes: the B and KE use `coast_defence_form` because the US had no `pre_dreadnought_form`-class hull (the
profile omits `pre_dreadnought_form` until the tech is acquired). The CA is explicitly fictional — the US had no
armoured cruiser before 1893 — and is a *doctrine template*, never to be labelled historical.

## 9. Naming policy

| type          | US convention                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| battleship/monitor (B) | Native-American tribes/chiefs and classical names (Canonicus, Mahopac, Ajax, Manhattan, Saugus, Tecumseh, Wyandotte, Miantonomoh, Monadnock, Terror, Puritan, Amphitrite). |
| cruiser (CA/CL) | states and cities (Trenton, Atlanta, Boston, Chicago, Newark, Baltimore, Philadelphia, San Francisco, New York, Brooklyn).          |
| destroyer/TB (DD) | torpedo boats **numbered** (Torpedo Boat No. 1, `Cushing`); destroyers for naval officers (Bainbridge, Barry, Decatur).            |
| gunboat/sloop (KE) | rivers, tribes and historic ships (Galena, Marion, Mohican, Quinnebaug, Swatara, Enterprise, Alert, Adams, Essex, Omaha, Yantic, Portsmouth, Saratoga). |
| AMC           | liner names taken up from trade (City of New York, City of Paris, America, Alaska).                                                 |

Authentic 1880s stems are published ship names (historical facts) from the sources above; a full curated dataset
is content authoring, deferred to the spec/implementator.

---

## 10. Recommendations (concrete profile values — non-normative)

| profile field                                     | US candidate                                                | basis                                        | label                          |
| ------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------- | ------------------------------ |
| `strategicSituation.postures`                     | `[coastal_defence, commerce_defence, regional_warfare]`      | §2                                           | grounded shape (SINGLE-SOURCE) |
| `hardCapabilities.maxGunCaliberUm`                | 381000 (15-in Dahlgren)                                      | §3; [SBN]                                    | grounded                       |
| `hardCapabilities.maxArmourThicknessUm`           | 356000 (rebuilt-monitor turret)                              | §3; ESTIMATE                                 | ESTIMATE                       |
| `hardCapabilities.domesticTorpedoDiameterUm`      | 0 (none) → tube families UNAVAILABLE                         | [B86] p. 508                                 | VERIFIED (statement)           |
| `hardCapabilities.hullForms`                      | `[coast_defence_form, protected_cruiser_form, torpedo_boat_form, merchant_liner_form]` (**no** `pre_dreadnought_form`) | §8 | grounded shape |
| `hardCapabilities.domesticPlants`                 | `[compound_cylindrical]` (TE gated to 1885)                   | plants.yaml                                  | grounded                       |
| `softPreferences.speedOverArmourBp`               | 4500                                                        | §3–4                                         | **BALANCE TARGET**             |
| `softPreferences.enduranceWeightBp`               | 9500                                                        | hemispheric, below UK's 14000                | **BALANCE TARGET**             |
| `softPreferences.riskToleranceBp`                 | 3000                                                        | conservative                                 | **BALANCE TARGET**             |
| `softPreferences.colonialServiceWeightBp`         | 8500                                                        | no station empire                            | **BALANCE TARGET**             |
| `softPreferences.torpedoOnCruisersBp`             | 6000                                                        | no torpedoes                                 | **BALANCE TARGET**             |
| `industrialProfile.buildTimeMultiplierBp`         | 10400–10600                                                 | §3 slow navy yards                           | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.costMultiplierBp`              | 9900–10200                                                  | §3 near-neutral                              | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.machineryReliabilityBp`        | 8800–9000                                                   | plants.yaml 8500                             | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.constructionQualityVarianceBp` | 3000–3500                                                   | §3 overweight rebuilds                       | ESTIMATE / **BALANCE TARGET**  |
| `industrialProfile.maxPracticalDisplacementKg`    | 1880 6.0M / 1885 8.0M / 1890 11.0M                          | §3 completed classes                         | ESTIMATE                       |
| `industrialProfile.heavyGunProduction`            | DOMESTIC (+ documented 1868–88 gap)                          | §3 [B86] pp. 357–360                         | VERIFIED (statement)           |
| `industrialProfile.armourPlateProduction`         | DOMESTIC (+ import fallback; no modern plate until 1887–89)  | §3 [B86] p. 506                              | VERIFIED (as printed)          |
| `doctrineProfile.engagementRangeM`                | 1200                                                        | §4                                           | ESTIMATE / **BALANCE TARGET**  |
| `doctrineProfile.hePreferenceBp`                  | 5500                                                        | §4                                           | **BALANCE TARGET**             |
| `researchPreferences`                             | §5 (GUNNERY 4, HULL 3, MACHINERY 3)                          | §5                                           | grounded shape                 |
| `componentAccess`                                 | §6                                                          | §6                                           | mixed (per row)                |
| `gunModels` + `componentVariants`                 | §7 (10 variants)                                             | §7                                           | UNVERIFIED/SINGLE-SOURCE       |
| `designs`                                         | §8 (6)                                                      | §8                                           | ESTIMATE                       |
| `procurementPolicy.buildOrder`                    | `[B, KE, CL, CA, DD, AMC]` (coastal/defence first)           | §2; ESTIMATE                                 | **BALANCE TARGET**             |
| `namingPolicy`                                    | §9                                                          | published ship lists                         | grounded (SINGLE-SOURCE)       |

Keep every multiplier inside the ±15 % band (`docs/ships-nation-orientation.md` §2); the US spread above is
~±5 %, consistent with RTW3's ~10 % "efficient/undeveloped" spread.

## 11. Deferred (needs an owner or a decision-request)

- **All Dahlgren/Parrott figures are UNVERIFIED** — the US Navy _Ordnance Instructions_ (1866/1876) or a clean
  US ordnance manual is needed before the §7 variants reach release (no PLACEHOLDER may ship).
- **Smoothbore family / per-model MV-penetration override** — mapping US smoothbores onto RML families imports
  British charge/MV/penetration; a real smoothbore family (or an override) is the correct fix. Needs an owner
  (interacts with gunnery balance).
- **US moulded depth** — no source gives it for any US ship; every §8 depth is ESTIMATE.
- **US torpedo tube variant** — deferred; the US had none in 1880. Author only after ~1890 (18-in Whitehead).
- **Max practical displacement / dock progression** — grounded only indirectly from completed classes; a US
  Navy-yard dock table or Brassey 1886/1888–9 yard return would settle it.
- **Submarines / deferred mechanics** — per DESIGN-55 §14, do not treat deferred mechanics as reachable; keep
  them UNAVAILABLE / priority 1, never authored as content.
- **`research.yaml` field-priority keys** — the shipped US row uses only `HULL_CONSTRUCTION`; the brief's
  canonical ten-field list is assumed (same open item as the UK/France note §F).
- **No `docs/OPEN-ISSUES.md` decision was resolved here.** The only new conflict raised is the smoothbore/RML
  mapping approximation (§6), surfaced and left for the orchestrator to decide whether it becomes a
  decision-request.

## Source list

1. T. A. Brassey (ed.), _The Naval Annual 1886_, archive.org id `navalannual1886` — read directly this session
   as full text (`NavalAnnual1886_djvu.txt`): "Notes on the United States Navy" (pp. 283–288); "U. S.
   Gun-Foundry Board" (pp. 357–360); Appendix—United States (pp. 505–508); comparative estimates (pp. 24–25).
2. navypedia.org US class pages (read directly this session): `usa/usa_index.html`, `usa/usa_battleships.html`,
   `usa/usa_cruisers.html`, `usa/usa_other.html`, `usa/us_mon_canonicus.html`, `usa/us_mon_amphitrite.html`,
   `usa/us_cr_galena.html`.
3. `docs/research/ship-building-1880-ships-by-nation.md` §6.5 (Trenton [DANFS] relay; Canonicus [NP];
   Alarm/Intrepid [NE]).
4. `docs/research/ship-building-1880-pre-era-armament.md` §4 (US Dahlgren/Parrott, all UNVERIFIED).
5. US Navy, _Dictionary of American Naval Fighting Ships_, "Trenton i" — relayed, not opened.
6. Print works named as leads (not opened): Conway's _All the World's Fighting Ships 1860–1905_ (1979, Roberts
   US chapter); US Navy _Ordnance Instructions for the United States Navy_ (1866/1876 eds.); Jane's _Fighting
   Ships_.
7. Repo companions: `docs/research/national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
   `ship-building-early-band.md`, `ship-building-content-sourcing.md`; `docs/ships-nation-orientation.md`;
   `content/production/1880/countries.yaml` (id `usa`), `research.yaml`, `ship-building/`.
