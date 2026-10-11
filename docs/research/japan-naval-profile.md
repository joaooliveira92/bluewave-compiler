# Research: national naval profile — Japan (1880–1899)

Companion to `national-naval-profiles-uk-france.md` and `national-naval-profiles-germany.md`; method, source
grades and confidence labels identical. Authored for the `japan` (canonical `NationNavalProfile`) of the
`scen_1880` national-naval initiative (`docs/ships-nation-orientation.md`, ADR-0088/0089 line of work). This is a
**research-only** pass: no code, no content YAML, no spec is authored here. Captured 2026-10-11.

Read first: `.ai/ENGINEERING-CONTRACT.md` (Content + Factual grounding), `docs/ships-nation-orientation.md`,
`docs/research/ship-building-1880-ships-by-nation.md` §6.4 (the in-service Japanese hulls, reused not re-derived),
`docs/research/national-naval-profiles-uk-france.md` (method), the shipped draft
`content/production/1880/ship-building/naval-profiles.yaml` (UK/France/Germany), `content/production/1880/research.yaml`.

## 0. Question

What are the grounded figures and national differentiators needed to author a **date-banded `NationNavalProfile`
(1880–1899) for Japan**, plus ~15 shared-family national models and six 1880 opening designs (B, CA, CL, DD, KE,
AMC), with procurement and naming policy?

This note answers that; it does **not** author the profile.

## 1. Method, source grades and confidence labels

Every figure carries a named source and one of: **VERIFIED** (read directly in a period/near-primary text, or two
independent sources agree); **SINGLE-SOURCE** (one source, or a secondary compilation citing print works I could
not open); **ESTIMATE** (derived by me, calculation/inference shown); **UNVERIFIED** (no usable source, or
sources conflict; a range is given). **Wikipedia is not cited as a source anywhere.**

| Tag    | Source                                                                                                  | Grade / reach                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [NP]   | navypedia.org Japanese class pages (Ivan Gogin), slugs given per row. **Read directly this session.**   | Compilation built on Conway's _1860–1905_ + national histories; **not itself primary** → SINGLE-SOURCE. |
| [NA86] | T. A. Brassey (ed.), _The Naval Annual 1886_ (archive.org `navalannual1886`, full text read directly).  | Contemporary annual. Contains **only marginal Japan content** (a turning-power line "Fu Soo"; plate list Hi-yei/Kin-go p. 252) — no Japan chapter. VERIFIED where read; unusable as a Japan industry source. |
| [CW]   | Conway's _All the World's Fighting Ships 1860–1905_ (1979). **Not opened** online; relayed via [NP].     | Print secondary; SINGLE-SOURCE (relayed).                                                      |
| [J98]  | Jane's _Fighting Ships_ (1st ed. 1898). **Not opened.**                                                  | Print secondary; lead only.                                                                     |
| [R07]  | A. Roksund, _The Jeune École: The Strategy of the Weak_ (Brill, 2007). **Not opened.**                   | Print secondary; SINGLE-SOURCE (relayed) for doctrine narrative.                                |
| [SBN]  | `docs/research/ship-building-1880-ships-by-nation.md` §6.4 (in-repo; itself [NP]-based).                | Reused per brief; SINGLE-SOURCE.                                                                |
| [REPO] | Shipped content (`countries.yaml`, `possessions.yaml`, `research.yaml`) — **not a historical source**.   | Repo framing only; do not treat as historical grounding.                                        |

Limits: Conway's itself was not reachable; [NP] is a single compilation, so nearly every ship figure is
SINGLE-SOURCE. **No Japanese naval-annual, yard-return or budget table was opened** — the industrial multipliers,
research weights and design weights below are therefore explicit **BALANCE TARGET / ESTIMATE**, not measurements.
Moulded depth is not given by [NP] for any ship (UNVERIFIED), as in the UK/France note.

Conversions: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 ihp = 0.7457 kW; 1 kn = 0.5144 m/s.

---

# A. National naval profile (1880–1899)

## A.1 Strategic posture

1880 Japan is a **newly-modernising Meiji island state building its first Imperial Japanese Navy almost entirely
from foreign — chiefly British — yards and designs**: a small ironclad/corvette fleet, a coastal and regional
(Korea Strait / Yellow Sea) focus, **no colonial empire yet**, and a very high receptiveness to foreign
technology and doctrine.

| posture                        | applies? | justification (one line)                                                                                                      | source | confidence |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| coastal defence                | **YES**  | home/inland/Kyushu coasts only; no overseas possessions in 1880; ironclads are small coast-defence types                     | [REPO] `possessions.yaml`; [NP] | SINGLE-SOURCE |
| regional warfare               | **YES**  | the fleet's stated purpose is Korea / Yellow-Sea security against Qing and Russia                                             | [REPO] `countries.yaml` doctrine; [NP] 1875/1882 Programmes | SINGLE-SOURCE |
| torpedo warfare                | **YES (strong)** | Jeune-École "torpedo equalizer"; 1879–80 orders for Yarrow 100-ft torpedo boats, 350 mm Whitehead tubes on every new class    | [NP] 1-go TB, Kotaka, Fusō/Kongō tubes | SINGLE-SOURCE |
| distant water operations       | weak / aspirational | no station empire; long-range cruisers appear only from 1885 (Naniwa, Elswick)                                     | [NP]; [REPO] | ESTIMATE |
| battle fleet concentration     | **NO**   | no battle fleet in 1880; Japan's first battleship is the **captured** Chinese _Chen Yuan_ (1895)                              | [NP] `jap_bb_chin_yen.htm` | SINGLE-SOURCE |
| commerce defence               | **NO**   | negligible ocean trade to defend in 1880 (NYK founded 1885)                                                                  | [REPO]; reasoning | ESTIMATE |
| commerce raiding               | **NO**   | not a 1880 doctrine; guerre-de-course thinking arrives with the 1890s cruiser programme                                       | [R07] relayed | SINGLE-SOURCE |
| colonial presence              | **NO**   | Taiwan (1895) and Korea are post-1880; `possessions.yaml` has only the three home coasts                                    | [REPO]; [NP] | SINGLE-SOURCE |

**Recommended primary postures: `regional_warfare` + `coastal_defence`, with `torpedo_warfare` strong/co-equal.**
Everything is **aspirational and imported**: the fleet is built abroad, so "posture" must not be read as
domestic capability. Evidence of foreign dependence, read directly from [NP] builder fields:

- _Fusō_ — Samuda Bros, Poplar, **UK** (central-battery ironclad, comp. 1.1878).
- _Kongō_ — Earle, Hull, **UK**; _Hiei_ — Milford Haven SB, Pembroke, **UK** (armoured corvettes, 1878).
- _Naniwa_/_Takachiho_ — Armstrong, Elswick, **UK** (protected cruisers, 1885–86).
- _Tsukushi_ — Armstrong, Elswick, **UK** (ex-Chilean _Arturo Prat_, bought 1885).
- _Chiyoda_ — J & G Thomson, Clydebank, **UK** (1891); _Yoshino_ — Armstrong, Elswick, **UK** (1893).
- _Matsushima_/_Itsukushima_ — F C de la Méditerranée, La Seyne, **FRANCE** (1888–92).
- _Kotaka_ and the _1-go_-class torpedo boats — Yarrow, Poplar, **UK** (1888 / 1880).
- _Fuji_ — Thames Iron Wks; _Yashima_ — Armstrong, Elswick (battleships, 1897).

Bias note: the `[REPO]` framing ("Korea central", "concentrate limited forces") is consistent with the sourced
builder list and the 1875/1882 Programme histories in [NP], but the *intent* narrative is repo content, not a
primary source. Label any authored strategic text accordingly.

## A.2 Industrial capability

| item                            | figure / direction                                                                                                                        | unit   | source | confidence |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------- |
| Shipbuilding base               | **Yokosuka K K** (Yokosuka Naval Arsenal) built _Amagi_ (1878), _Banjo_ (1880), _Kaimon_/_Tenryū_ (1884–85), _Katsuragi_/_Musashi_ (1887–88), _Hashidate_ (1894); **Onohama K K, Kobe** built _Yamato_ (1888) and TB _25-go_ (1895); **Kure K K** refit _Fusō_ 1899–1900 | — | [NP] builder fields | VERIFIED (direct) |
| Founding dates                  | Yokosuka arsenal founded **1865** (French mission); Kure and Sasebo naval districts 1886/1889; Sasebo/Kure ports level 5–6 in repo | year   | [CW] relayed; [REPO] `ports.yaml` | SINGLE-SOURCE |
| Domestic build ceiling (actual) | largest *domestically built* hull by the early 1890s: _Hashidate_ **4,217 t** (Yokosuka, comp. 1894); _Katsuragi_ 1,476 t (1887)         | t      | [NP] | SINGLE-SOURCE |
| Import dependence               | capital ships and heavy ordnance **bought abroad** (all ironclads/battleships/armoured cruisers through the 1890s)                       | —      | [NP] builder fields | VERIFIED (direct) |
| Programme cadence               | **1875 Programme** (Fusō, Kongō, Hiei); **1882 Programme** (Kotaka, Katsuragi class, Tsukushi purchase, 22-go TB); **1893 Programme** (Fuji/Yashima) | year   | [NP] project histories | SINGLE-SOURCE |
| Build-time modifier             | **SLOWER**: small yards, foreign-designed hulls, imported guns/machinery. Propose **10500–11000 bp**                                         | ×      | ESTIMATE (no sourced JP multiplier) | ESTIMATE / **BALANCE TARGET** |
| Cost modifier                   | **HIGHER**: imported ships, guns, armour and machinery attract freight/licence/political cost. Propose **10800–11200 bp**                 | ×      | ESTIMATE | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement      | 1880 **~4.0M** / 1885 **~4.5M** / 1890 **~5.0M kg** (domestic-build ceiling; **imported hulls bypass it** — Fuji 12,533 t by 1897)          | kg     | ESTIMATE from [NP] builders (Hashidate 4,217 t) | ESTIMATE |
| Heavy-gun production            | **IMPORTED** — Krupp RKL (Fusō, Kongō, Amagi, Kaimon, Katsuragi, Naniwa, Chin Yen), Armstrong (Tsukushi 10-in, Naniwa 15.2 cm, Yoshino, Fuji), Canet 32 cm (Matsushima). No Japanese heavy-gun factory evidenced in-band | — | [NP] armament fields | VERIFIED (direct) |
| Armour-plate production         | **IMPORTED** (inference): wrought iron on Fusō, compound on Kongō, Harvey on Yoshino/Matsushima, all foreign or foreign-designed. No [NP] evidence of a Japanese plate mill in-band | — | [NP]; [EB] relayed | ESTIMATE |
| Machinery reliability           | imported/foreign-supervised plant (Penn, Earle; "built under French supervision" — Kaimon). Propose **8600 bp** (near UK compound, slightly lower)                              | bp     | [NP] project histories | ESTIMATE / **BALANCE TARGET** |
| Construction-quality variance   | **higher** than the UK — a learning navy, some overweight. Propose **3500 bp**                                                             | bp     | ESTIMATE | ESTIMATE / **BALANCE TARGET** |
| Torpedo supply                  | **Whitehead, 350 mm** bore (all tubes read are 350 mm); **imported**. Domestic torpedo production UNVERIFIED                              | mm     | [NP] armament fields | VERIFIED (bore) / ESTIMATE (supply) |
| Budget                          | `[REPO]`: `researchBudget 10`, treasury 130, income 12 (very constrained). Not a historical source; no Japanese annual was opened        | —      | [REPO] `research.yaml` | ESTIMATE |

## A.3 Gunnery / protection / propulsion doctrine

| field                         | Japan position                                                                                              | source | confidence |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| preferred engagement distance | **short (1,500–2,000 m)**: period practice; no rangefinders; QF close action praised after 1894              | [NP] Yoshino/Yalu notes | ESTIMATE (shape grounded) |
| main-gun emphasis             | **imported heavies**, few per ship (Fusō 4×23.5 cm; Naniwa 2×26 cm; Matsushima 1×32 cm)                      | [NP] | SINGLE-SOURCE |
| secondary emphasis            | **medium QF volume** once Elswick guns arrive (Yoshino 4×15.2 cm + 8×12 cm; Chiyoda 10×12 cm QF)             | [NP] | SINGLE-SOURCE |
| gun-quality priorities        | buy the best available (Krupp → Armstrong/Elswick → Canet); rate of fire matters                              | [NP] | SINGLE-SOURCE |
| AP vs HE                      | **AP/common** in-band (Krupp steel shot, Palliser pattern); no melinite-type HE until Shimose (1893, post-band) | [NP]; [SBN] | ESTIMATE |
| protection doctrine           | belt+deck on ironclads (Fusō belt 229–114, battery 229); protected deck on cruisers; small, lightly armoured  | [NP]; [SBN] §6.4 | SINGLE-SOURCE |
| propulsion                    | imported compound horizontal engines; locomotive-boiler torpedo boats; later VTE imported (Chiyoda, Yoshino)  | [NP] | SINGLE-SOURCE |
| speed margin                  | **high** for cruisers (Yoshino 22.5 kn, Chiyoda 19 kn, Naniwa 18.5 kn) — speed as the equalizer             | [NP] | SINGLE-SOURCE |

## A.4 Research preferences (canonical fields, priority 1–4)

Shipped draft `[REPO]`: Japan = `GUNNERY: 2` only (budget 10). Grounded recommendation (**ESTIMATE /
BALANCE TARGET** — a small, focused, absorb-and-adapt programme):

| field             | priority | justification                                                                 | source | confidence |
| ----------------- | -------- | ----------------------------------------------------------------------------- | ------ | ---------- |
| GUNNERY           | 4        | the one field Japan demonstrably pushed: imports the best artillery and drills it hard | [NP] | ESTIMATE |
| INFRASTRUCTURE    | 4        | the binding constraint is yards/docks/coaling (Yokosuka, Kure, Sasebo)        | [NP]; [REPO] | ESTIMATE |
| TORPEDOES         | 3        | torpedo-equalizer doctrine; early Yarrow boats and 350 mm tubes               | [NP] | ESTIMATE |
| SHIP_DESIGN       | 3        | "learns faster than builds" (repo); absorbing foreign designs                 | [REPO]; [NP] | ESTIMATE |
| MACHINERY         | 2        | buys foreign machinery; compound then VTE                                     | [NP] | ESTIMATE |
| HULL_CONSTRUCTION | 2        | composite/steel hulls under foreign supervision                               | [NP] | ESTIMATE |
| DAMAGE_CONTROL    | 2        | subdivision present (Chiyoda 84 WT compartments) but not a stated priority    | [NP] `jap_cr_chiyoda` | ESTIMATE |
| FIRE_CONTROL      | 2        | no in-band rangefinding                                                       | [NP] | ESTIMATE |
| MINES_AND_ASW     | 2        | mine awareness (Kaimon lost to a mine, 1904) but no in-band programme         | [NP] | ESTIMATE |
| SUBMARINES        | 1        | no in-band submarine                                                         | [NP] | ESTIMATE |

> If only one priority-4 must be chosen, **GUNNERY** (per the shipped draft's direction) is the safer pick;
> INFRASTRUCTURE-4 is the alternative. Surface this to the orchestrator; do not silently fix.

## A.5 Component access (shared families)

Japanese signature: **imported Krupp/Armstrong guns and imported Whitehead torpedoes**; other nations' signature
domestic heavies are `UNAVAILABLE`. Status values: DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED |
UNAVAILABLE.

| family id                  | status        | producer (import source)        | evidence |
| -------------------------- | ------------- | ------------------------------- | -------- |
| gun_bl_263mm_rkl20         | IMPORTED      | Krupp (Germany)                 | [NP] Naniwa 2×26 cm RKL/35; Fusō/Kongō/Amagi/Kaimon/Katsuragi/Chin Yen all Krupp RKL |
| gun_bl_10in_32             | IMPORTED      | Armstrong (UK)                  | [NP] Tsukushi 2×254 mm Armstrong 25-ton BLR |
| gun_bl_12in_25             | IMPORTED      | Canet / F C de la Méditerranée  | [NP] Matsushima 1×320 mm Canet M1887 (overlays this 12-in family) |
| gun_bl_6in_26              | IMPORTED      | Krupp / Armstrong               | [NP] 15 cm RKL and 15.2 cm Armstrong QF |
| gun_qf_6in_40              | IMPORTED      | Armstrong / Elswick             | [NP] Naniwa/Yoshino 15.2 cm |
| gun_qf_47in                | IMPORTED      | Armstrong / Elswick             | [NP] Yoshino/Chiyoda 12 cm QF |
| gun_qf_12pdr               | IMPORTED      | Armstrong                       | [NP] Katsuragi 76 mm/40 Armstrong N |
| gun_qf_6pdr                | IMPORTED      | Hotchkiss                       | [NP] every class |
| gun_hotchkiss_3pdr         | IMPORTED      | Hotchkiss                       | [NP] every class |
| gun_nordenfelt_1in         | IMPORTED      | Nordenfelt                      | [NP] 25 mm 4-barrel on all pre-1900 classes |
| tube_14in_above_water      | IMPORTED      | Whitehead (UK)                  | [NP] 350 mm above-water (Fusō, Naniwa, Chiyoda) |
| tube_14in_submerged        | IMPORTED      | Whitehead (UK)                  | [NP] 350 mm bow tubes (Kongō, 1-go TB, Yoshino) |
| gun_rml_16in_80ton         | UNAVAILABLE   | British RML — not used          | —        |
| gun_rml_125in_38ton        | UNAVAILABLE   | British RML — not used          | —        |
| gun_rml_12in_35ton/25ton   | UNAVAILABLE   | British RML — not used          | —        |
| gun_rml_11in_25ton         | UNAVAILABLE   | British RML — not used          | —        |
| gun_rml_10in_18ton(_broadside) | UNAVAILABLE | British RML; Japanese pre-1880 heavies are **Krupp RKL** (see variants) | [NP] |
| gun_rml_8in_9ton / 7in_7ton / 64pdr_71cwt | UNAVAILABLE | British RML; used only as overlay families for Krupp RKL models | [NP] |
| gun_bl_135in_30            | UNAVAILABLE   | British 13.5-in — not used      | —        |
| gun_bl_12in_35             | UNAVAILABLE   | British 12-in/35 — not used (Fuji used 12-in/40 Armstrong G, a distinct gun) | [NP] |
| gun_bl_92in_315            | UNAVAILABLE   | British 9.2-in — not used       | —        |
| gun_bl_274mm_m1875         | UNAVAILABLE   | French 27 cm signature — not used | —      |
| gun_maxim_303              | IMPORTED      | Maxim                           | post-band |
| magazine_* / fittings      | DOMESTIC      | built in Japan                  | rule     |

> The pre-1880 Japanese heavies (**Krupp RKL 23.5/17.3/14.9/12 cm**) have **no dedicated shared family**: the
> catalogue is British-RML-centric. The variants below overlay the nearest RML family with a caliber/shell
> override. That overlay convention is an implementation decision and is **surfaced as deferred**.

---

# B. National component variants (~15)

`gunModels` + `componentVariants` mapped onto the shared families of
`content/production/1880/ship-building/components.yaml`. Shell masses are [NP]-sourced where the source gives a
bore/model, otherwise ESTIMATE (calculation from the bore/period pattern). Mounts ∈ TURRET | BARBETTE | CASEMATE |
DECK_SHIELDED | DECK_OPEN | BROADSIDE_BATTERY.

| shared family              | JP designation                                          | shell / params (override)                                        | mounts                       | source | confidence |
| -------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------- | ------ | ---------- |
| gun_rml_10in_18ton         | **23.5 cm RKL/22 C/72** (Krupp; Fusō main)              | caliber 235000; shell ~155000 g; rof ~30 (hand)                  | BROADSIDE_BATTERY            | [NP] Fusō | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| gun_rml_8in_9ton           | **17.3 cm RKL/25 C/72** (Krupp; Fusō 2nd, Kongō main)   | caliber 173000; shell ~55000 g                                   | BROADSIDE_BATTERY, DECK_OPEN | [NP] Fusō/Kongō | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| gun_rml_64pdr_71cwt        | **14.9 cm RKL/25 C/74** (Krupp; Kongō 2nd, Banjo)       | caliber 149000; shell ~40000 g                                   | BROADSIDE_BATTERY            | [NP] Kongō/Banjo | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| gun_rml_7in_7ton           | **12 cm RKL/25 C/78** (Krupp; Amagi, Kaimon, Katsuragi) | caliber 120000; shell ~15000 g                                   | DECK_OPEN, BROADSIDE_BATTERY | [NP] Amagi/Kaimon/Katsuragi | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| gun_bl_263mm_rkl20         | **26 cm RKL/35 C/84** (Krupp; Naniwa barbette)          | caliber 263000; shell ~250000 g; rof 100                         | BARBETTE, TURRET             | [NP] Naniwa | SINGLE-SOURCE (bore) / ESTIMATE (shell) |
| gun_bl_12in_25             | **Canet 32 cm/38 M1887** (Matsushima)                   | caliber 320000; shell ~450000 g; rof ~20 (1 rds/5 min)           | TURRET                       | [NP] Matsushima | SINGLE-SOURCE (bore/model) / ESTIMATE (shell) |
| gun_bl_10in_32             | **25.4 cm Armstrong 25-ton BLR** (Tsukushi)             | caliber 254000; shell ~181000 g                                  | CASEMATE                     | [NP] Tsukushi | SINGLE-SOURCE (bore/weight) / ESTIMATE (shell) |
| gun_qf_6in_40              | **15.2 cm/40 Armstrong QF** (Naniwa refit, Yoshino)     | caliber 152000; shell 45300 g; rof 500                           | DECK_SHIELDED, CASEMATE      | [NP] Naniwa/Yoshino | SINGLE-SOURCE |
| gun_qf_47in               | **12 cm/40 Armstrong QF** (Yoshino, Chiyoda, Matsushima) | caliber 120000; shell 20400 g; rof 500                          | DECK_SHIELDED, DECK_OPEN     | [NP] Yoshino/Chiyoda | SINGLE-SOURCE |
| gun_qf_12pdr               | **7.6 cm/40 Armstrong N 12-pdr** (Katsuragi)            | shell 5670 g                                                     | DECK_OPEN                    | [NP] Katsuragi | SINGLE-SOURCE (family) |
| gun_qf_6pdr                | **5.7 cm Hotchkiss 6-pdr**                              | shell 2720 g                                                     | DECK_OPEN                    | [NP] | SINGLE-SOURCE (family) |
| gun_hotchkiss_3pdr         | **4.7 cm Hotchkiss 3-pdr**                              | shell 1500 g                                                     | DECK_OPEN                    | [NP] | SINGLE-SOURCE (family) |
| gun_nordenfelt_1in         | **2.5 cm Nordenfelt 4-barrel**                          | shell 206 g                                                      | DECK_OPEN                    | [NP] | SINGLE-SOURCE (family) |
| tube_14in_above_water      | **35 cm Whitehead, above-water beam** (Fusō, Naniwa)    | tube bore 350000; torpedo model whitehead                          | —                            | [NP] | SINGLE-SOURCE (bore) |
| tube_14in_submerged        | **35 cm Whitehead, submerged bow** (Kongō, 1-go TB)     | tube bore 350000; torpedo model whitehead                          | —                            | [NP] | SINGLE-SOURCE (bore) |

Notes:
- Japanese tubes are **350 mm (13.8 in)**, not the catalogue's 356 mm: record the bore, do not assume the
  catalogue's 14-in (same caveat as `p1-1880-torpedo-armament.md` and `[SBN]` §4).
- The first four rows are **Krupp RKL** overlays on British-RML families (see the deferred note in §A.5).
- Ammunition: Japanese in-band use is **AP/common** (Krupp steel shot; Armstrong common), no melinite HE. A
  `jp_ap_common` / `jp_he_common` pair is defensible but is BALANCE TARGET.

---

# C. Six 1880 opening designs (B, CA, CL, DD, KE, AMC)

All are legal 1880-01 **DOCTRINE_TEMPLATE** starting points, not historical reconstructions (the historical hulls
are in `[SBN]` §6.4 and `reference-designs.yaml`). Dimensions and armour from [NP]; depth, block coefficient and
the non-historical cruisers/liners are ESTIMATE. Plant: `compound_cylindrical` (the only 1880 plant in
`plants.yaml`); a pre-1880 `locomotive_boiler_tb` is a **content gap** (the catalogue plant is dated 1890).

| slot | inspiration (source)             | Lwl/B/T (mm)                 | depth (mm) | displ (kg) | plant | kW | fuel (kg) | main / secondary | armour scheme | doctrine note |
| ---- | -------------------------------- | ---------------------------- | ---------- | ---------- | ----- | -- | --------- | ---------------- | ------------- | ------------- |
| **B**  | _Fusō_ 1878 (Samuda, UK) [NP]  | 68900 / 14600 / 5490         | 10500 EST  | 3,717,000  | compound_cylindrical | 2610 | 360,000 | 4×23.5 cm RKL/22 (BROADSIDE) + 2×17.3 cm RKL/25 (DECK_OPEN) | belt 229 mm wrought iron + battery 229 / blkhds 152 | small imported central-battery ironclad; coast/regional |
| **CA** | _Chiyoda_ 1891 (Thomson) [NP]  | 92000 / 12800 / 4270         | 8000 EST   | 2,400,000  | compound_cylindrical | 4176 | 427,000 | 2×25.4 cm Armstrong 25-ton BLR (CASEMATE) + 8×12 cm QF (DECK_SHIELDED) | belt 92 mm compound + deck 35–25 | fast, lightly belted Elswick-pattern armoured cruiser |
| **CL** | _Naniwa_ 1885 (Elswick) [NP]   | 95000 / 14000 / 6100         | 8000 EST   | 3,650,000  | compound_cylindrical | 5221 | 800,000 | 2×26 cm RKL/35 Krupp (BARBETTE) + 6×15.2 cm QF (DECK_SHIELDED) | protected deck 76 flat / 51 slopes; coal bunkers | Elswick-pattern protected cruiser; Krupp heavy + Armstrong QF |
| **DD** | _1-go_ class TB 1880 (Yarrow) [NP] | 30500 / 3680 / 990       | 2200 EST   | 40,000     | compound_cylindrical | 462 | 8,000 | 2×4.7 cm Hotchkiss (DECK_OPEN); **3×35 cm tubes** (2 bow + 1) | nil | Yarrow/Reed 100-ft-type torpedo boat; torpedo equalizer |
| **KE** | _Kaimon_ 1884 (Yokosuka) [NP]  | 64100 / 9910 / 4980          | 5600 EST   | 1,358,000  | compound_cylindrical | 945 | 197,000 | 1×17.3 cm RKL/25 + 6×12 cm RKL/25 + 1×7.9 cm | nil (shields only) | domestically built, French-supervised composite corvette; home waters |
| **AMC**| _[REPO]_ liner template (aspirational) | 115000 / 14000 / 3500 | 8000 EST   | 3,500,000  | compound_cylindrical | 2600 | 900,000 | 4×12 cm Armstrong QF (DECK_OPEN) + 2×35 cm tubes | nil | armed ocean-mail liner (NYK only from 1885 — very aspirational) |

> The `starterFor` lineage: B→Fusō-like; CA→Chiyoda-like; CL→Naniwa-like; DD→the historical 1-go class (a
> genuine 1880 Japanese torpedo boat); KE→Kaimon-like; AMC→doctrine template. The DD's historical plant was a
> locomotive boiler (not in the 1880 catalogue); the keel-level displacement (40 t) is far below the repo's
> generic `starter_torpedo_gunboat_1880` (~1,500 t) — the orchestrator must decide which scale the DD slot uses.

---

# D. Naming policy

Authentic published name stems (ship names are historical facts; cited to the [NP] class pages / [SBN]):

| type          | stems (published)                                                                                                             | convention (one line) |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **B**         | Fusō, Kongō, Hiei, Chin'en (captured 1895), Fuji, Yashima, Shikishima, Asahi, Mikasa, Kashima                                | classical/poetic Chinese-derived names (mythic realms, mountains, legendary sites) |
| **CA**        | Chiyoda, Asama, Tokiwa, Izumo, Iwate, Azuma, Yakumo                                                                           | mountains and geographic/poetic names |
| **CL**        | Naniwa, Takachiho, Yoshino, Suma, Akitsushima, Hashidate, Itsukushima, Matsushima, Chitose, Takasago                          | poetic/geographic (dances, villages, scenic places) |
| **DD**        | early: numbered (_1-go_–_4-go_, _22-go_, _25-go_); later: Murakumo, Ikazuchi, Akatsuki, Shirakumo, Harusame, Fumizuki, Satsuki | numbered torpedo boats, then natural phenomena (clouds, thunder, weather) |
| **KE**        | Banjo, Amagi, Kaimon, Tenryū, Katsuragi, Yamato, Musashi, Tsukushi, Maya, Oshima                                              | old provinces, mountains, islands, rivers |
| **AMC**       | (liner names taken up from trade)                                                                                             | ocean-mail liner names; no dedicated naval series in-band |

Sources: [NP] `jap_bb_fuso78`, `jap_cr_kongo`, `jap_bb_chin_yen`, `jap_bb_fuji`, `jap_cr_chiyoda`, `jap_cr_naniwa`,
`jap_cr_kaimon`, `jap_cr_katsuragi`, `jap_cr_amagi`, `jap_of_banjo`, `jap_tb_1`, `jap_tb_22`; `[SBN]` §6.4.

---

# E. Recommendations (concrete values, non-normative)

| profile field | JP candidate | basis | label |
| --- | --- | --- | --- |
| `strategicSituation` postures | `[regional_warfare, coastal_defence, torpedo_warfare]` | §A.1 | grounded shape (SINGLE-SOURCE) |
| `industrialProfile.buildTimeMultiplierBp` | 10500–11000 | small yards, import dependence | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.costMultiplierBp` | 10800–11200 | imports | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.machineryReliabilityBp` | 8600 | imported/foreign-supervised plant | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.constructionQualityVarianceBp` | 3500 | learning navy | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.maxPracticalDisplacementKg` (1880/1885/1890) | 4.0M / 4.5M / 5.0M | Hashidate 4,217 t (Yokosuka 1894) | ESTIMATE |
| `industrialProfile.heavyGunProduction` | IMPORTED | all heavies Krupp/Armstrong/Canet | VERIFIED (direct) |
| `industrialProfile.armourPlateProduction` | IMPORTED | wrought/compound/Harvey all foreign | ESTIMATE |
| `doctrineProfile.engagementRangeM` | 1500–2000 | period practice | ESTIMATE |
| `doctrineProfile.hePreferenceBp` | 3500 (AP/common) | no melinite in-band | **BALANCE TARGET** |
| `researchPreferences` | GUNNERY 4, INFRASTRUCTURE 4, TORPEDOES 3, SHIP_DESIGN 3 (see §A.4) | §A.4 | ESTIMATE |
| `componentAccess` | §A.5 (imports; foreign heavies UNAVAILABLE) | §A.5 | grounded shape |
| `gunModels` / `componentVariants` | §B (~15) | §B | mixed (per-row) |
| `designs` | §C (6) | §C | mixed (per-row; ESTIMATE) |
| `namingPolicy` | §D | published names | grounded (SINGLE-SOURCE) |
| `hardCapabilities.maxGunCaliberUm` | ~320000 (Canet 32 cm) | [NP] Matsushima | SINGLE-SOURCE |
| `hardCapabilities.domesticTorpedoDiameterUm` | 350000 (imported, not domestic) | [NP] | SINGLE-SOURCE |
| `hardCapabilities.maxArmourThicknessUm` | ~457000 (imported Fuji belt, 1897) / ~229000 in-band (Fusō battery) | [NP] | SINGLE-SOURCE |

Multiplier guidance: keep ordinary cost/build-time modifiers within **±5–15 %** (design constraint per
`ships-nation-orientation.md`; Japan sits at the high end of cost because it imports). The proposed values are
~10.5–11 % and ~8–12 % respectively.

---

# F. Deferred (needs an owner or a decision-request)

- **Krupp RKL families.** The pre-1880 Japanese heavies (Krupp 23.5/17.3/14.9/12 cm) have no shared family; the
  catalogue is British-RML. The note proposes overlaying the nearest RML family with a caliber/shell override —
  the orchestrator must confirm multiple models per family (one per nation) are legal, or add dedicated families
  (e.g. `gun_krupp_235mm_rkl22`). Interacts with schema, not balance.
- **DD scale.** The historical _1-go_ class is 40 t; the repo's generic 1880 DD starter
  (`starter_torpedo_gunboat_1880`) is ~1,500 t. Which scale the DD slot should use is an open content decision.
- **Locomotive-boiler plant.** All 1880 torpedo boats (Yarrow 1-go, Kotaka) used locomotive boilers; the
  catalogue's `locomotive_boiler_tb` is dated 1890. A pre-1880 torpedo-boat plant (or an allowed-date override)
  is needed before a legal 1880 DD starter using one can compile.
- **`maxPracticalDisplacementKg` semantics.** Does the ceiling gate *domestic build* only (then ~4–5M and imported
  Fuji 12,533 t is legal) or all construction (then the field is wrong for Japan)? Surface; do not resolve.
- **Japanese industry/budget primary source.** No Japanese naval annual, yard return or budget table was opened.
  Every industrial multiplier and the research weights remain ESTIMATE until a print source (Conway's Japan
  chapter; Jentschura/Jung/Ostrowski, _Warships of the Imperial Japanese Navy 1869–1945_; Evans & Peattie,
  _Kaigun_) is opened. (Note: _Kaigun_/_Conway's_ are print and were not reachable this session.)
- **Armour-plate production = IMPORTED** is an inference (absence of evidence in [NP] of a Japanese mill), not a
  sourced statement that none existed. A Conway's Japan chapter would settle it.
- **Shell masses** for the Krupp RKL and Canet 32 cm guns are ESTIMATE (the sources give the bore/model, not the
  projectile weight). A period ordnance table (Mackinlay, or Brassey's foreign-gun tables) would upgrade them.
- **AMC** is a doctrine template with no 1880 Japanese ocean-mail fleet (NYK founded 1885); confirm fictional
  templates are acceptable (the UK/France/`reference-designs.yaml` already do this).
- **Research-field enum.** `research.yaml` uses `GUNNERY/MACHINERY/HULL_CONSTRUCTION` only; this note assumes the
  ten-field canonical list in the brief. Confirm before the profile references the new keys.

---

# G. Verdict

**Qualified yes — the Japanese profile is authorable now, with per-figure labels and no release placeholder.**

- **Strongly grounded (read directly):** the *shape* — a small, foreign-built, coast/region-oriented fleet with a
  strong torpedo arm and total import dependence for capital ships and heavy ordnance — rests on the [NP] builder
  and armament fields (Samuda, Earle, Armstrong/Elswick, Yarrow, Thomson, F C de la Méditerranée; Krupp RKL,
  Armstrong, Canet guns; 350 mm Whitehead tubes) and the 1875/1882/1893 Programme histories.
- **Grounded ship data** (reused from `[SBN]` §6.4): Fusō and Kongō/Hiei are the in-service 1880 ironclad/corvette
  pair; the _1-go_ class (1880) is a genuine in-service Japanese torpedo boat; Naniwa, Tsukushi, Chiyoda, Yoshino,
  Matsushima and Fuji ground the CL/CA/B lineages and the naming.
- **What is ESTIMATE/BALANCE TARGET and must be labelled as such:** every industrial multiplier, the
  displacement/dock progression, stability/quality variance, all research weights, the shell masses for the
  Krupp/Canet guns, and the CA/CL/KE/AMC (and scaled DD) templates. These are gameplay abstractions on a grounded
  shape.
- **What is genuinely missing:** a Japanese industry/budget primary source, the Krupp-RKL family treatment, the
  DD scale, and the pre-1880 torpedo-boat plant. None blocks a first profile; each is a labelled deferred item or
  a decision-request.

## Source list

1. navypedia.org Japanese class pages, read directly this session: `japan/jap_bb_fuso78.htm`,
   `jap_cr_kongo.htm`, `jap_bb_chin_yen.htm`, `jap_bb_fuji.htm`, `jap_cr_chiyoda.htm`, `jap_cr_yoshino.htm`,
   `jap_cr_naniwa.htm`, `jap_cr_hashidate.htm`, `jap_cr_kaimon.htm`, `jap_cr_katsuragi.htm`, `jap_cr_amagi.htm`,
   `jap_cr_tsukushi.htm`, `jap_of_banjo.htm`, `jap_tb_1.htm`, `jap_tb_kotaka.htm`, `jap_tb_22.htm`; indices
   `jap_index.htm`, `jap_battleships.htm`, `jap_cruisers.htm`, `jap_destroyers.htm`, `jap_other.htm`.
2. T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886` (`NavalAnnual1886_djvu.txt`,
   read directly; **only marginal Japan content** — turning powers p. 291, plate list p. 252).
3. Conway's _All the World's Fighting Ships 1860–1905_ — **not opened**; relayed via navypedia.
4. Jane's _Fighting Ships_ (1898) — **not opened**; lead only.
5. A. Roksund, _The Jeune École: The Strategy of the Weak_ (Brill, 2007) — **not opened**; relayed.
6. In-repo companions: `docs/research/ship-building-1880-ships-by-nation.md` §6.4 (and §4 torpedo cross-ref),
   `docs/research/national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
   `docs/research/p1-1880-torpedo-armament.md`; `docs/ships-nation-orientation.md`.
7. Repo content framing (not historical sources): `content/production/1880/countries.yaml` (japan),
   `possessions.yaml`, `areas.yaml`, `ports.yaml`, `research.yaml`, `ship-building/*.yaml`.
