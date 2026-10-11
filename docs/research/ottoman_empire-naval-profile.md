# Research: national naval profile — Ottoman Empire (1880–1899)

Companion to `national-naval-profiles-uk-france.md` (method/source grades and confidence labels are identical:
VERIFIED / SINGLE-SOURCE / DERIVED / ESTIMATE / UNVERIFIED; **Wikipedia is not cited anywhere**). Grounds a
date-banded `NationNavalProfile` for the **Ottoman Empire** (`ottoman_empire`, canonical repo id), its shared-family
national models, component access, research priorities, naming policy and six 1880 opening reference designs. This
is a **research-only** pass: no code, no content YAML, no spec is authored here. Captured 2026-10-11.

## 0. Question

What grounded figures and national differentiators author the **`ottoman_empire` NationNavalProfile (1880–1899)**:
a declining Mediterranean/Black-Sea power under Abdul Hamid II with a large-on-paper but decaying ironclad fleet, a
coast-defence and Straits (Dardanelles/Bosphorus) focus, imported British (Armstrong) guns and armour, and weak
finances and industry? Plus component access, 8–15 national variants, six 1880 opening designs (B, CA, CL, DD, KE,
AMC) and naming policy.

This note answers that; it does **not** author the profile. Shipped draft: `content/production/1880/research.yaml`
`ottoman_empire` = `GUNNERY: 2`; `countries.yaml` (`id: ottoman_empire`, "Homeland Defense — preserve territorial
integrity, defend the Straits against Russia"); `economies.yaml` (treasury 180, income 16, expenses 7).

## 1. Method, sources, labels

Every figure carries a named source and one of: **VERIFIED** (read directly in a period/near-primary text, or two
independent sources agree); **SINGLE-SOURCE** (one source, or a secondary compilation citing print works not
opened); **DERIVED** (arithmetic from a sourced figure); **ESTIMATE** (derived/inferred by me; not a source
figure); **UNVERIFIED** (no usable source, or sources conflict; a range given). **Wikipedia is not cited.**

| Tag    | Source                                                                                                                                                                                                    | Grade / reach                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [NP]   | navypedia.org Ottoman/Turkish class pages (Ivan Gogin), built principally on Conway's _All the World's Fighting Ships 1860–1905_ + national histories. **Fetched directly this session** (slugs in §Sources). | Secondary compilation → SINGLE-SOURCE.                                                                     |
| [NA86] | T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`, full text `NavalAnnual1886_djvu.txt` **downloaded and searched this session**. Ottoman ship-evolution/practice table (the annual's comparative evolutions table) read directly; the Ottoman ship-data page is OCR-scrambled. | Contemporary annual = period near-primary. **Read directly → VERIFIED for the figures actually read.**      |
| [SBN]  | `docs/research/ship-building-1880-ships-by-nation.md` §6.7 (Mesudiye, Avnillah). **In-repo, already grounded.**                                                                                             | Reused; confidence as carried.                                                                             |
| [PRE]  | `docs/research/ship-building-1880-pre-era-armament.md` §1/§3/§5 (British RML values; Armstrong RML families). **In-repo.**                                                                                   | Reused; labels as carried.                                                                                 |
| [REPO] | Shipped content (`countries.yaml`, `possessions.yaml`, `economies.yaml`, `research.yaml`, `content-1-*.md`). **Not a historical source** — repo framing only.                                                 | Framing, not grounding.                                                                                    |
| [CW]   | Conway's _All the World's Fighting Ships 1860–1905_ (1979); B. Langensiepen & A. Güleryüz, _The Ottoman Steam Navy 1828–1923_ (1995). **Not opened this session** (only relayed via [NP]).                    | Print secondary; SINGLE-SOURCE (relayed).                                                                  |

Limits: Conway's and Langensiepen/Güleryüz were **not opened**; [NP] is a single compilation, so nearly every ship
figure is SINGLE-SOURCE. The 1886 annual's Ottoman narrative/ship-table pages are OCR-scrambled in this archive
scan; only its comparative evolutions table (listing the Ottoman ironclads by name) was legible. **No Ottoman naval budget (in kuruş/£), yard return or
dock-capacity table was opened** — every multiplier, research weight and design weight below is explicit
**BALANCE TARGET / ESTIMATE**, not a measurement. Moulded depth is not given by [NP] for any Ottoman ship
(UNVERIFIED), as in the UK/France/Germany/Italy/Japan/Russia/AH notes.

Conversions: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 ihp = 0.7457 kW; 1 kn = 0.5144 m/s.

---

# A. National naval profile (1880–1899)

1880 Ottoman Empire is a **besieged Straits guardian**: a vast but contracting empire controlling the gate between
the Black Sea and the Mediterranean, with a nominally large ironclad fleet (~15–17 armoured ships, all but one
built or designed abroad) that is **decaying, laid up and materially unsupported**. The navy's purpose is
**homeland/straits defence** (Dardanelles and Bosphorus), a **fleet-in-being** in the Black Sea and Sea of Marmara,
**coastal defence**, and **mine and fortress reliance**; it cannot contest the open Mediterranean. The state is
**bankrupt** (defaulted 1875) and has **no domestic steel, armour or heavy-gun production**, so all warships and
ordnance are purchased abroad [REPO] `countries.yaml`; shape corroborated by [NP] project histories.

## A.1 Strategic posture

| posture                        | applies?          | justification (one line)                                                                                                                       | source                                | confidence             |
| ------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------- |
| coastal_defence                | **primary**       | one home theatre (Straits/Marmara/Aegean/Black Sea); the whole surviving ironclad force is coastal/Straits-oriented, and the navy "cannot contest the open Mediterranean" [REPO] `doctrine.summary`. | [REPO]; [NP]                          | VERIFIED (in-repo) / SINGLE-SOURCE |
| regional_warfare (Black Sea / Balkans) | **primary** | the navy fought Russia 1877–78 (Lütf-ü Celil lost off Braila on the Danube; Asar-i Tevfik/Osmaniye class used against Russia); the theatre is the Black Sea and the Straits. | [NP] Lütf-ü Celil; [REPO]             | SINGLE-SOURCE / VERIFIED (in-repo) |
| battle_fleet_concentration     | **weak**          | ~15–17 ironclads on paper (`content-1` relay), but they are old central-battery/broadside ships, many laid up and deteriorating without replacement (navy budget "barely covers maintenance" [REPO]); a fleet-in-being, never a sea-going line. | [NP]; [REPO]; `content-1` relay       | SINGLE-SOURCE / UNVERIFIED (count) |
| distant_water_operations       | **no / negligible** | no station squadron; no ocean-going cruiser force (no protected cruiser before 1895 [NP] `tu_cr.htm`); a single home command.                | [NP] `tu_cr.htm`; [REPO]              | SINGLE-SOURCE          |
| torpedo_warfare                | **weak / aspirational** | no torpedo craft in service before 1885 (first TBs Burhaneddin/Tevfik, 1885 [NP]); torpedo tubes added on ironclads only in the 1890s. Doctrine interest, not capability, in 1880. | [NP] `tu_dd.htm`, `tu_bb_assari_shevket.htm` | SINGLE-SOURCE   |
| commerce_defence               | **weak**          | a small, undeveloped merchant marine; some Levant trade, but no trade-protection obligation comparable to Britain's.                          | [REPO]; [NA86] Levant trade table     | ESTIMATE               |
| commerce_raiding               | **no**            | not an 1880 Ottoman doctrine or capability; the navy is defensive/Straits-bound.                                                             | reasoning                             | ESTIMATE               |
| colonial_presence              | **weak / nominal** | nominal Ottoman suzerainty (Egypt, Tunis until 1881, Libya/Hejaz, Mediterranean islands) but **no coaling-station empire or overseas squadron**; possessions are contiguous/near-coast. | [REPO] `possessions.yaml`; `content-1-world-geography` relay | VERIFIED (in-repo) / UNVERIFIED (relay) |

**Recommended primary postures: `coastal_defence` + `regional_warfare`**, with `battle_fleet_concentration` a weak
(fleet-in-being) third, `torpedo_warfare` and `colonial_presence` weak/aspirational, and `distant_water_operations`,
`commerce_raiding` and `commerce_defence` **not** 1880 Ottoman postures.

### A.1b In-service 1880 Ottoman ships (from [NP], read this session; Mesudiye/Avnillah re-used from [SBN] §6.7)

- **Osmaniye class** broadside ironclads (Osmaniye 11/1865, Aziziye 8/1865, Orhaniye 1866, Mahmudiye 1866; all
  Napier/Thames, UK): 6,400 t; 91.4 oa / 89.3 pp × 17.0 × 7.90 m; 1 HDA, 3,735 ihp, 12 kn; 1 × 229 mm Armstrong
  12.5-ton + 14 × 203 mm 9-ton + 10 × 175 mm 36-pdr Armstrong SBML; belt 140 (ends 76), battery 127; coal 750;
  crew 361. Four ships. [NP] `tu_bb_osmaniye.htm` SINGLE-SOURCE.
- **Mesudiye** central-battery ironclad (12/1875, Thames Iron Wks; Reed, based on HMS _Hercules_): 8,938 t; 102.4 ×
  17.9 × 7.90 m; 1 2-cyl HSE, 8 rectangular boilers, 7,431 ihp, 13.7 kn; 12 × 254 mm Armstrong 18-ton RML (battery)
  + 3 × 178 mm Armstrong 7.5-ton RML (upper deck); belt 305–152 (ends 127–76), battery 254–178, CT 203; coal 600;
  crew 700. **Largest in-service Ottoman ironclad in Jan 1880.** [SBN] §6.7 / [NP] `tu_bb_mesudiye.htm`
  SINGLE-SOURCE (completion internal conflict 12/1875 vs "1876-7").
- **Avnillah class** casemate ironclads (Avnillah, Muin-i Zafer; 1870, Thames): 2,362 t; 71.9 oa / 69.0 pp × 11.0 ×
  5.00 m; 1 HC, 2,200 ihp, 12 kn; 4 × 203 mm Armstrong 9-ton RML; belt 152–127 (ends 76), casemate 127; coal 220;
  crew 145. [SBN] §6.7 / [NP] `tu_bb_avnillah.htm` SINGLE-SOURCE.
- **Feth-i Bülend** / **Mukaddeme-i Hayir** casemate ironclads (1870 / 1874): 2,762 t; 72.0 pp × 12.0 × 5.51 m; 1 HC,
  3,250 / 3,000 ihp, 13 / 12 kn; 4 × 229 mm Armstrong 12.5-ton; belt 229–152 (ends 76), casemate 229–152; coal
  300/270; crew 169. **Mukaddeme-i Hayir was "the first large warship built in Turkey" (Tersane-i Amire, Istanbul)
  — and "suffered of very poor quality of construction" (guns/boilers landed 1898).** [NP] `tu_bb_fethi_bulend.htm`,
  `tu_bb_mukaddemei_hayir.htm` SINGLE-SOURCE (quality note VERIFIED as read).
- **Asar-i Şevket class** central-battery ironclads (Asar-i Şevket, Necm-i Şevket; 1870, La Seyne, France):
  2,047 t; 66.4 oa / 61.9 pp × 13.0 × 5.00 m; 1 HC, 1,750/1,900 ihp, 12 kn; 1 × 229 mm 12.5-ton + 4 × 178 mm
  6.5-ton Armstrong RML; belt 152–114, battery/barbette 114; coal 300; crew 170. [NP] `tu_bb_assari_shevket.htm`
  SINGLE-SOURCE.
- **Asar-i Tevfik** barbette-battery ironclad (1870, La Seyne): 4,687 t; 83.0 pp × 16.0 × 6.50 m; 1 HC, 3,560 ihp,
  13 kn; 8 × 229 mm 12.5-ton Armstrong RML; belt 203 (ends 76), battery 152, barbettes 127; coal 400; crew 320.
  [NP] `tu_bb_assari_tevfik.htm` SINGLE-SOURCE.
- **İclaliye** barbette-battery ironclad (1871, STT Triest): 2,228 t; 66.0 oa / 63.6 pp × 13.0 × 5.28 m; 1 HC,
  1,800 ihp, 12 kn; 2 × 229 mm 12.5-ton + 3 × 178 mm 6.5-ton; belt 152–114 (ends 102), battery 114, barbette 127;
  coal 300; crew 148. [NP] `tu_bb_iclaliye.htm` SINGLE-SOURCE.
- **Lütf-ü Celil class** coast-defence turret ships (Lütf-ü Celil [sunk 10.5.1877], Hifz-ur Rahman; 1870, Bordeaux):
  2,540 t; 64.4 oa / 62.1 pp × 13.6 × 4.40 m; 2 × 2-cyl HC, 2,000 ihp, 12 kn; 1 × 2 203 mm 9-ton + 1 × 2 178 mm
  6.5-ton Armstrong RML (turrets fore/aft); belt 140 (ends 117), side 76, turrets 140, deck 38; coal 300; crew 122.
  [NP] `tu_bb_lutfu_celil.htm` SINGLE-SOURCE.
- **Screw sloops** (Sinop class 1859–60, Beyrut class 1860–64, **Mansure class** Mansure/Lübnan/Muzaffer; 1864,
  Tersane-i Amire Istanbul/Izmir): 783 t bm; 55.1 oa / 52.6 pp × 9.30 × 4.40 m; 1 2-cyl HSE, 650 ihp, 10 kn;
  12 × 121 mm 37-pdr SBML; coal 120; crew 130. [NP] `tu_cr_mansure.htm`, `tu_cr_sinop.htm`, `tu_cr_beyrut.htm`
  SINGLE-SOURCE.
- **Excluded (not in service Jan 1880):** any torpedo boat (first is **Burhaneddin/Tevfik, 10–11/1885**, La Seyne:
  38 t; 31.7 oa / 30.8 pp × 3.60 × 1.70 m; 1 VC, 1 locomotive boiler, 525 ihp, 17 kn; 2 × 356 mm bow TT [NP]
  `tu_dd_burhaneddin.htm`); any protected cruiser (first Heybetnüma 1895); the 1894 Hamidiye/Torgud Reis
  battleships. `[NP]` `tu_dd.htm`, `tu_cr.htm`, `tu_bb.htm` SINGLE-SOURCE.

## A.2 Industrial capability

| item                            | figure / direction                                                                                                                                                     | unit     | source                                    | confidence             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------- | ---------------------- |
| Shipbuilding base               | **Tersâne-i Âmire (Imperial Arsenal), Istanbul** (built Mukaddeme-i Hayir, the first large domestic warship); **Tersane-i Amire, Izmir** (sloops). No modern private yards; foreign yards (Thames Iron Wks, Napier, La Seyne, STT) built nearly all ironclads. | —        | [NP] builder fields; [REPO] `countries.yaml` | VERIFIED (yards named) |
| Material policy (framing)       | "No domestic steel, armor, or heavy gun production; **all warships purchased abroad**; Imperial Arsenal in decline" | —        | [REPO] `baseResources.industrializationDescription` | VERIFIED (in-repo)     |
| Heavy-gun production            | **IMPORTED — Armstrong** (254 mm 18-ton, 203 mm 9-ton, 178 mm 7.5/6.5-ton, 229 mm 12.5-ton, 175 mm 36-pdr RMLs); Krupp for later (1882+) secondaries | —        | [NP] armament lines; [SBN] §6.7           | SINGLE-SOURCE          |
| Armour-plate production         | **IMPORTED** — all in-service ironclads carry **wrought-iron** plate (British/French yards); no in-band domestic plate mill | —        | [NP] armour lines                          | SINGLE-SOURCE          |
| Build-time modifier             | **SLOW** — a bankrupt state, one declining arsenal, everything ordered abroad, war losses 1877–78. Propose **10700–11200 bp** | ×10000   | ESTIMATE from completion slips/[NP]       | ESTIMATE / **BALANCE TARGET** |
| Cost modifier                   | **HIGHER per hull** — no domestic industry, imported guns/armour/machinery, foreign yards. Propose **11000–11200 bp** | ×10000   | ESTIMATE; [REPO] imports                  | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement      | **1880 ≈ 9.0 M kg → 1885 ≈ 9.0 M → 1890 ≈ 9.5 M** (Mesudiye 8,938 t is the largest in service and foreign-built; domestic ceiling far lower, ~2.8 M for Mukaddeme-i Hayir) | kg       | [NP]; [SBN] §6.7                          | ESTIMATE               |
| Machinery reliability           | **LOW** — domestic Mukaddeme-i Hayir "very poor quality... boilers landed 1898"; foreign-built ships fared better. Propose **7800 bp** | bp       | [NP] `tu_bb_mukaddemei_hayir.htm`         | ESTIMATE / **BALANCE TARGET** |
| Construction-quality variance   | **HIGH** — the one domestically-built large ironclad was a construction failure; mixed foreign quality. Propose **4500 bp** | bp       | [NP]; ESTIMATE                            | ESTIMATE / **BALANCE TARGET** |

Direction of every multiplier is grounded (slower, costlier, lower reliability, higher variance); the magnitude is a
balance choice inside the **±15 %** band (as in the UK/France/Germany/Russia/AH notes). The Ottoman sits at the
**high (slow/expensive) end**, with dominance of foreign procurement.

## A.3 Gunnery doctrine

| field                          | Ottoman position                                                                                                              | source                                   | confidence             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------- |
| preferred engagement distance  | **short (~1,500–2,000 m)** — period practice; low-freeboard coast-defence/ironclad actions, Straits/fortress support        | [NA86]; period contrast in UK/France note | ESTIMATE (period)      |
| main-gun emphasis              | **moderate, imported**: 254 mm (10-in) Armstrong 18-ton is the heaviest Ottoman gun; 229 mm 12.5-ton is the most common heavy | [NP]; [SBN] §6.7                         | SINGLE-SOURCE          |
| secondary-battery emphasis     | **heavy, mixed**: 203 mm 9-ton and 178 mm 7.5/6.5-ton Armstrong RMLs in battery/casemate/upper-deck                    | [NP]                                     | SINGLE-SOURCE          |
| gun-quality priorities         | buy the best available (Armstrong), no domestic heavy-gun industry; the fleet remained in being and was exercised afloat (13 Ottoman ironclads named in the 1886 annual's comparative evolutions table) | [NA86] evolutions table                  | VERIFIED (as read)     |
| AP-vs-HE preference            | **AP-dominant** — black-powder Palliser/shot period norm; no melinite-type HE in-band                                          | [PRE] §5; [NA86]                         | SINGLE-SOURCE          |
| fire-control research priority | minimal in-band; no rangefinding until the 1890s                                                                             | ESTIMATE                                 | ESTIMATE               |
| rate-of-fire preference        | slow: hand-worked heavy RML ~0.33–0.8 rds/min; light Nordenfelt/Hotchkiss 20–50/min only later                               | [PRE] §5                                  | SINGLE-SOURCE / ESTIMATE |

## A.4 Research priorities (canonical fields, priority 1–4)

Shipped draft: `research.yaml` `ottoman_empire` = `GUNNERY: 2`. Grounded recommendation:

| field              | priority | justification                                                                                   | source                    | confidence             |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------- | ------------------------- | ---------------------- |
| GUNNERY            | 3        | the fleet's whole offensive power is imported Armstrong RMLs; gunnery is the only real capability | [NP]; [NA86] evolutions table | SINGLE-SOURCE          |
| INFRASTRUCTURE     | 3        | Tersâne-i Âmire decline is the binding constraint; Straits fortresses and mine/dock works        | [REPO]; [NP]              | grounded (in-repo)     |
| MINES_AND_ASW      | 3        | mine-and-fortress reliance is the stated doctrine (research preference only — DESIGN-55 guard)   | [REPO] `doctrine.schools` | ESTIMATE / **BALANCE TARGET** |
| HULL_CONSTRUCTION  | 2        | no domestic steel; iron hulls, one failed domestic build                                        | [NP]; [REPO]              | SINGLE-SOURCE          |
| MACHINERY          | 2        | domestic engines unreliable; foreign machinery bought in                                       | [NP] Mukaddeme-i Hayir     | SINGLE-SOURCE          |
| TORPEDOES          | 2        | delayed adoption (no boat before 1885; tubes from the 1890s)                                     | [NP] `tu_dd.htm`          | SINGLE-SOURCE          |
| DAMAGE_CONTROL     | 2        | partial double bottoms (Avnillah, Asar-i Şevket); little subdivision                            | [NP]                      | SINGLE-SOURCE          |
| SHIP_DESIGN        | 2        | Reed-designed Mesudiye and foreign-derived hulls; no independent design line                    | [NP]; [SBN] §6.7          | SINGLE-SOURCE          |
| FIRE_CONTROL       | 1        | not prioritised in-band                                                                          | ESTIMATE                  | ESTIMATE               |
| SUBMARINES         | 1        | no in-band Ottoman submarine (Abdül Hamid 1886 was a Nordenfelt demonstrator, effectively a gift) | [NP] `tu_ss.htm`          | SINGLE-SOURCE          |

> **DESIGN-55 guard.** MINES_AND_ASW and SUBMARINES are recorded as *research preferences* only. Any mine/submarine
> mechanic that is deferred/unaccepted must not be treated as reachable content in this profile; the profile carries
> the preference weight, nothing else.

---

# B. Component access (shared families)

Status ∈ DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED | UNAVAILABLE. The Ottoman signature is
**imported Armstrong RMLs**; every foreign domestic heavy and every British BL/QF is UNAVAILABLE.

| family id                       | status       | producer / note                                                                   | source                     | confidence    |
| ------------------------------- | ------------ | ---------------------------------------------------------------------------------- | -------------------------- | ------------- |
| `gun_rml_10in_18ton`            | **IMPORTED** | **254 mm Armstrong 18-ton RML** — the Ottoman heavy (Mesudiye battery)             | [NP]; [SBN] §6.7           | SINGLE-SOURCE |
| `gun_rml_10in_18ton_broadside`  | **IMPORTED** | same gun, broadside/battery role (Osmaniye/central-battery fits)                    | [NP]                       | SINGLE-SOURCE |
| `gun_rml_8in_9ton`              | **IMPORTED** | **203 mm Armstrong 9-ton RML** (Avnillah, Osmaniye, Lütf-ü Celil, Asar-i Tevfik*)   | [NP]; [SBN] §6.7           | SINGLE-SOURCE |
| `gun_rml_7in_7ton`              | **IMPORTED** | **178 mm Armstrong 7.5-ton / 6.5-ton RML** (Mesudiye upper deck, Asar-i Şevket, İclaliye, Lütf-ü Celil) | [NP]; [SBN] §6.7 | SINGLE-SOURCE |
| `gun_rml_64pdr_71cwt`           | **IMPORTED** | overlay family for the **175 mm 36-pdr Armstrong SBML** (Osmaniye broadside)        | [NP]                       | SINGLE-SOURCE |
| `gun_nordenfelt_1in`            | **IMPORTED** | 25 mm Nordenfelt (later secondaries, 1880s–90s; from 1891 on Mesudiye)              | [NP] Mesudiye 1891         | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr`            | **IMPORTED** | 47 mm Hotchkiss (later)                                                              | [NP]                       | SINGLE-SOURCE |
| `gun_qf_6pdr`                   | **IMPORTED** | 57 mm Hotchkiss (later)                                                              | [NP]                       | SINGLE-SOURCE |
| `gun_qf_12pdr`                  | **IMPORTED** | 87 mm Krupp RK L/24 (1882 modernization)                                             | [NP] Avnillah 1882         | SINGLE-SOURCE |
| `tube_14in_above_water`         | **IMPORTED** | **356 mm Whitehead, above-water/beam** (added on ironclads in the 1890s)             | [NP]                       | SINGLE-SOURCE |
| `tube_14in_submerged`           | **IMPORTED** | **356 mm Whitehead, submerged bow** (1885 TBs; later)                                | [NP] Burhaneddin           | SINGLE-SOURCE |
| `gun_rml_11in_25ton`            | UNAVAILABLE  | Ottoman 229 mm is a 12.5-ton gun, not the 25-ton family; see §C overlay              | —                          | rule          |
| `gun_rml_12in_35ton`, `gun_rml_12in_25ton`, `gun_rml_125in_38ton`, `gun_rml_16in_80ton` | UNAVAILABLE | British RMLs not in Ottoman service | —                          | rule          |
| `gun_bl_135in_30`, `gun_bl_12in_35`, `gun_bl_12in_25`, `gun_bl_10in_32`, `gun_bl_92in_315`, `gun_bl_6in_26`, `gun_qf_6in_40`, `gun_qf_47in` | UNAVAILABLE | British BL/QF signatures; not used | —                          | rule          |
| `gun_bl_274mm_m1875`, `gun_bl_263mm_rkl20` | UNAVAILABLE | French 27 cm / German 26 cm signatures; not used | —                          | rule          |
| `gun_maxim_303`                 | IMPORTED     | Maxim; post-band                                                                     | [NP]                       | UNVERIFIED    |

`hardCapabilities` (recommended): `maxGunCaliberUm` **254000** (Armstrong 18-ton is the largest Ottoman gun);
`maxArmourThicknessUm` **305000** (Mesudiye belt); `domesticTorpedoDiameterUm` **356000** (the service bore — but
manufacture is IMPORTED, not domestic; see §J); `hullForms`
`[coast_defence_form, protected_cruiser_form, pre_dreadnought_form, torpedo_boat_form, merchant_liner_form]`;
`domesticPlants` `[compound_cylindrical]`.

---

# C. National component variants (~13)

Each row overlays one shared family with an Ottoman designation, a shell/parameter set (sourced where possible,
otherwise the family's British figure with the export caveat), and a `mounts` list. Mounts ∈ TURRET | BARBETTE |
CASEMATE | DECK_SHIELDED | DECK_OPEN | BROADSIDE_BATTERY.

| family id                      | Ottoman national model                                          | shell / params (override)                                                                                  | mounts                              | source                          | confidence                       |
| ------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------- | -------------------------------- |
| `gun_rml_10in_18ton`           | **254 mm Armstrong 18-ton RML** (Mesudiye battery)              | cal 254000; shell 181400 g; charge 31.8 kg; MV 420 m/s; ROF ~0.4 (family, British RML); gun 18,289 kg       | CASEMATE, BROADSIDE_BATTERY         | [NP]; [SBN] §6.7; [PRE] §1      | SINGLE-SOURCE (designation); family values |
| `gun_rml_10in_18ton_broadside` | **254 mm Armstrong 18-ton RML, broadside fit**                  | cal 254000; shell 181400 g; charge 31.8 kg; MV 420 m/s                                                      | BROADSIDE_BATTERY, DECK_OPEN        | [NP] Osmaniye-class fits        | SINGLE-SOURCE                    |
| `gun_rml_8in_9ton`             | **203 mm Armstrong 9-ton RML** (Avnillah, Osmaniye, Lütf-ü Celil, Asar-i Tevfik*) | cal 203000; shell 79400 g (family); charge 15.9 kg; MV 422 m/s                                              | CASEMATE, BROADSIDE_BATTERY, BARBETTE, TURRET | [NP]; [SBN] §6.7; [PRE] §1 | SINGLE-SOURCE (designation); family values |
| `gun_rml_7in_7ton`             | **178 mm Armstrong 7.5-ton RML** (Mesudiye upper deck)          | cal 178000; shell 52200 g (family); charge 13.6 kg; MV 476 m/s                                              | DECK_OPEN, DECK_SHIELDED, CASEMATE   | [NP]; [SBN] §6.7; [PRE] §1      | SINGLE-SOURCE (designation); family values |
| `gun_rml_7in_7ton`             | **178 mm Armstrong 6.5-ton RML** (Asar-i Şevket, İclaliye, Lütf-ü Celil) | cal 178000; shell ~43000 g (EST, lighter gun); charge ~12 kg (EST); MV ~470 m/s (EST)                       | BARBETTE, CASEMATE, DECK_OPEN        | [NP] (designation only)         | SINGLE-SOURCE (calibre); shell/charge ESTIMATE |
| `gun_rml_10in_18ton`           | **229 mm Armstrong 12.5-ton RML** (Osmaniye, Feth-i Bülend, Mukaddeme-i Hayir, Asar-i Tevfik, İclaliye, Asar-i Şevket) — *no 9-in family exists; overlay with calibre/mass override* | cal 229000; gun ~12,700 kg (DERIVED: 12.5 t); shell ~113000 g (EST by British 9-in 12-ton Palliser 113 kg); charge ~22.7 kg (EST); MV ~439 m/s (EST) | BROADSIDE_BATTERY, BARBETTE, CASEMATE | [NP] (designation); [PRE] §1 (analogue) | SINGLE-SOURCE (designation); params ESTIMATE |
| `gun_rml_64pdr_71cwt`          | **175 mm 36-pdr Armstrong SBML** (Osmaniye broadside; smoothbore) | cal 175000; shell ~16300 g (36 lb); charge ~4 kg (EST); smoothbore (poor armour penetration)                | BROADSIDE_BATTERY, DECK_OPEN         | [NP] Osmaniye                   | SINGLE-SOURCE (calibre); shell/charge ESTIMATE |
| `gun_qf_12pdr`                 | **87 mm Krupp RK L/24** (1882 modernization of Avnillah/Asar-i Şevket/İclaliye) | cal 87000; shell ~9000 g (EST); MV ~470 m/s (EST); ROF ~10 (family)                                        | DECK_OPEN, DECK_SHIELDED             | [NP] (designation only)         | SINGLE-SOURCE (calibre); params ESTIMATE |
| `gun_nordenfelt_1in`           | **25 mm Nordenfelt 4- or 5-barrel**                             | cal 25000; bullet 206 g (family)                                                                           | DECK_OPEN                            | [NP]; family                    | SINGLE-SOURCE                    |
| `gun_hotchkiss_3pdr`           | **47 mm Hotchkiss 3-pdr**                                       | cal 47000; shell 1500 g (family); ROF ~20                                                                  | DECK_OPEN                            | [NP]; family                    | SINGLE-SOURCE                    |
| `tube_14in_above_water`        | **356 mm Whitehead, above-water/beam**                          | bore 356000; trainable carriage; added from the 1890s                                                       | — (ABOVE_WATER_TRAINABLE)            | [NP]                            | SINGLE-SOURCE                    |
| `tube_14in_submerged`          | **356 mm Whitehead, submerged bow**                             | bore 356000; fixed bow                                                                                      | — (UNDERWATER_FIXED)                 | [NP] Burhaneddin                | SINGLE-SOURCE                    |
| `plant.compound_cylindrical`   | **Ottoman compound (foreign-built engines)**                    | 195 kg/kW; SFC 1300 g/kWh @60 %; reliability 8500 (family). Domestic builds unreliable (see §A.2)           | —                                    | plants.yaml; [NP]               | VERIFIED (plant) / SINGLE-SOURCE (Ottoman quality) |

Notes:
- The **229 mm 12.5-ton** is a genuinely Ottoman/Armstrong signature with **no matching shared family**; it is
  overlaid on `gun_rml_10in_18ton` with a calibre/mass override (the mechanism mismatch is surfaced in §J, exactly
  as the AH/Japan notes do for Krupp RKL).
- **All Ottoman shell/charge/MV figures except the shared family values are ESTIMATE** — the sources give the
  calibre and Armstrong designation, not the projectile weight. A period ordnance table (Mackinlay Table XVII
  clean, or an Armstrong/Elswick export catalogue) would upgrade them.
- The 178 mm gun appears as both **7.5-ton** and **6.5-ton** in [NP] (Mesudiye armament line vs project history);
  an internal conflict, marked SINGLE-SOURCE.

---

# D. Six 1880 opening designs (B, CA, CL, DD, KE, AMC)

All are legal 1880-01 **DOCTRINE_TEMPLATE** starting points, not historical reconstructions. The B and DD shapes
are grounded in historical ships (Mesudiye; Burhaneddin); CA/CL/KE/AMC are doctrine templates grounded in Ottoman
practice/lineage (Asar-i Tevfik; Mansure sloop). **Moulded depth is UNVERIFIED for every Ottoman ship** —
`depthToMainDeck` is ESTIMATE throughout. Plant: `compound_cylindrical` (the only 1880 plant in `plants.yaml`;
min 300 kW, max 8,000 kW). `locomotive_boiler_tb` is dated 1890 and is a **content gap** for an 1880 torpedo boat
(same gap flagged in the AH/Japan notes). Dimensions mm; displacement kg; power kW.

| slot | shape / inspiration (source)                                   | hull form              | Lwl/B/T (mm)             | depth (mm) | displ (kg) | plant / kW   | fuel (kg) | main / secondary                                                                     | armour scheme                                             | doctrine note                                                       |
| ---- | -------------------------------------------------------------- | ---------------------- | ------------------------ | ---------- | ---------- | ------------ | --------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------- |
| **B**  | Mesudiye central-battery ironclad (historical 1875) [NP]/[SBN] | pre_dreadnought_form   | 102,400 / 17,900 / 7,900 | 10,500 EST | 8,938,000  | compound_cylindrical / 5,541 (7,431 ihp) | 600,000   | 12 × `gun_rml_10in_18ton` (Ott. 254 mm) CASEMATE/BROADSIDE; 3 × `gun_rml_7in_7ton` (178 mm) DECK_OPEN | belt 305–152 (ends 127–76); battery 254–178; CT 203 wrought iron | largest fleet unit; slow, Straits/Black-Sea ironclad              |
| **CA** | Asar-i Tevfik barbette-battery ironclad (historical 1870) [NP] | protected_cruiser_form | 83,000 / 16,000 / 6,500  | 9,000 EST  | 4,687,000  | compound_cylindrical / 2,655 (3,560 ihp) | 400,000   | 8 × `gun_rml_10in_18ton` (Ott. 229 mm 12.5-ton overlay) BROADSIDE/BARBETTE; no secondary | belt 203 (ends 76); battery 152; barbettes 127 wrought iron       | fast, lightly-armoured cruiser/fleet-scout (doctrine template)      |
| **CL** | Mansure screw-sloop lineage / small cruiser (1864) [NP]        | protected_cruiser_form | 80,000 / 12,000 / 5,000  | 7,500 EST  | 2,500,000  | compound_cylindrical / 1,491 (2,000 ihp) | 300,000   | 6 × `gun_rml_8in_9ton` (203 mm) DECK_OPEN/BROADSIDE; 4 × `gun_rml_64pdr_71cwt` (175 mm SBML) | none (iron/steel hull; coal-bunker side protection)               | small station/scout cruiser; light, torpedo-armed in a later refit |
| **DD** | Burhaneddin torpedo boat (historical 1885) [NP]                | torpedo_boat_form      | 31,700 / 3,600 / 1,700   | 2,600 EST  | 38,000     | compound_cylindrical / 391 (525 ihp)     | 5,000     | none (light 25 mm Nordenfelt)                                                        | nil                                                       | small coastal torpedo boat; 2 × `tube_14in_submerged` (356 mm bow) |
| **KE** | Ottoman coast/Straits gunboat (doctrine template; [REPO] favoredTypes) | coast_defence_form     | 60,000 / 10,000 / 3,000  | 5,000 EST  | 1,000,000  | compound_cylindrical / 671 (900 ihp)     | 150,000   | 2 × `gun_rml_8in_9ton` (203 mm) DECK_SHIELDED; 2 × `gun_rml_64pdr_71cwt` (175 mm SBML) | light belt/shield + deck; CT                                   | shallow-draught coast/Straits gunboat for fortress support          |
| **AMC**| armed merchant liner taken up from trade (doctrine template) [REPO] | merchant_liner_form    | 115,000 / 14,000 / 7,500 | 8,000 EST  | 3,500,000  | compound_cylindrical / 2,600             | 900,000   | 4 × `gun_rml_8in_9ton` (203 mm) DECK_OPEN; 4 × `gun_rml_64pdr_71cwt` (175 mm SBML) | none (hull only)                                                | **weak/aspirational** — a small merchant marine makes this a marginal slot |

Block coefficients (ESTIMATE, `blockCoeffBp` ×10000): B ≈ 6000 (matches the shipped `mesudiye_1875` draft);
CA ≈ 5430 (derived: 4,687 t / (1.025 × 83.0×16.0×6.5)); CL ≈ 5210; DD ≈ 4400 (game convention; the computed ≈1980
is unreliable at this scale, as in the Russia/AH notes); KE ≈ 5430; AMC ≈ 6200 (game convention, as in the
Russia/AH notes). All six are ESTIMATE for dimensions/power/armour; the B and DD shapes are grounded in the
historical ships named.

> **DD scale note.** The historical Burhaneddin is 31.7 m / 38 t — **just above** `torpedo_boat_form.lengthMinMm`
> (30,000 mm), so the template is legal as written. No Ottoman torpedo craft existed in Jan 1880; authoring a DD
> starter is a **doctrine template**, not a historical asset.

---

# E. Naming policy

Published Ottoman ship names as stems (historical facts; cited to [NP] class pages and [NA86]).

| type   | convention (one line)                                                                                                     | stems (published names)                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **B**  | imperial/dynastic honorifics, sultans, provinces and abstract noble nouns (Mesudiye = "felicity", Osmaniye = "Ottoman")    | Mesudiye, Avnillah, Muin-i Zafer, Osmaniye, Aziziye, Orhaniye, Mahmudiye, Feth-i Bülend, Mukaddeme-i Hayir, Asar-i Şevket, Asar-i Tevfik, İclaliye, Hifz-ur Rahman, Necm-i Şevket |
| **CA** | (no 1880 Ottoman armoured cruiser) — later cruiser/admiral/prince names                                                   | Hamidiye, Mecidiye (later protected cruisers, 1903–04), Muavenet                                                                                        |
| **CL** | (no 1880 Ottoman protected cruiser) — place, virtue and duty names (Mansure = "victory", Muzaffer = "victorious")          | Mansure, Muzaffer, Sinop, Beyrut, Heybetnüma, Lütf-ü Hümayun, Zuhaf                                                                                     |
| **DD** | torpedo boats **numbered/later named** for Ottoman virtues, places and sea creatures; rivers/coasts                        | Burhaneddin, Tevfik (1885); Samsun, Muavenet-i Milliye (later); number series                                                                            |
| **KE** | gunboats/sloops: places, virtues, provinces and coasts (Sinop, Beyrut, Muzaffer)                                          | Sinop, Beyrut, Mansure, Muzaffer, Lübnan, Zuhaf                                                                                                         |
| **AMC**| names taken up from trade (small Ottoman merchant marine; no dedicated naval series in-band)                              | (Ottoman merchant/liner names; no dedicated naval series)                                                                                                |

All stems are SINGLE-SOURCE (published ship lists, [NP]/[NA86]). A full curated dataset (transliteration,
collision handling — Mesudiye vs Mesudiye-class, Muin-i Zafer vs Muzaffer) is content authoring, not research.

---

# F. Recommendations (concrete profile values, non-normative)

| profile field | Ottoman candidate | basis | label |
| --- | --- | --- | --- |
| `strategicSituation` postures | `[coastal_defence, regional_warfare]` (+ weak `battle_fleet_concentration`, weak `torpedo_warfare`/`colonial_presence`) | §A.1 | grounded shape (VERIFIED/SINGLE) |
| `industrialProfile.buildTimeMultiplierBp` | 10700–11200 | bankrupt state, one declining arsenal, foreign orders | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.costMultiplierBp` | 11000–11200 | no domestic industry; imported guns/armour/machinery | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.machineryReliabilityBp` | 7800 | Mukaddeme-i Hayir poor construction | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.constructionQualityVarianceBp` | 4500 | one failed domestic build; mixed foreign quality | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.maxPracticalDisplacementKg` (1880/1885/1890) | 9.0M / 9.0M / 9.5M | Mesudiye 8,938 t (foreign-built) | ESTIMATE |
| `industrialProfile.heavyGunProduction` | IMPORTED (Armstrong; Krupp later) | [NP]; [SBN] §6.7 | grounded (SINGLE) |
| `industrialProfile.armourPlateProduction` | IMPORTED (wrought iron) | [NP] | grounded (SINGLE) |
| `doctrineProfile.engagementRangeM` | 1500–2000 | short period range; Straits/fortress | ESTIMATE |
| `doctrineProfile.hePreferenceBp` | 4000 (AP-dominant, black powder) | [PRE] §5 | ESTIMATE / **BALANCE TARGET** |
| `researchPreferences` | GUNNERY 3, INFRASTRUCTURE 3, MINES_AND_ASW 3, then HULL/MACHINERY/TORPEDOES/DAMAGE/SHIP_DESIGN 2 (see §A.4) | §A.4 | grounded shape / ESTIMATE |
| `componentAccess` | §B (Armstrong RMLs IMPORTED; Whitehead tubes IMPORTED; foreign heavies UNAVAILABLE) | §B | grounded shape |
| `gunModels` / `componentVariants` | §C (~13) | §C | mixed per row |
| `designs` | §D (6) | §D | mixed per row; ESTIMATE |
| `namingPolicy` | §E | published lists | grounded (SINGLE-SOURCE) |
| `hardCapabilities.maxGunCaliberUm` | 254000 (Armstrong 18-ton) | [NP]; [SBN] §6.7 | SINGLE-SOURCE |
| `hardCapabilities.maxArmourThicknessUm` | 305000 (Mesudiye belt) | [NP]; [SBN] §6.7 | SINGLE-SOURCE |
| `hardCapabilities.domesticTorpedoDiameterUm` | 356000 (service bore; manufacture IMPORTED) | [NP] | grounded shape (see §J) |

Keep every cost/build-time modifier inside **±15 %** and label it BALANCE TARGET; ship every ESTIMATE/UNVERIFIED
with its label (the merchant-liner discipline). The proposed multipliers sit at the **high (slow/expensive) end** of
the band, consistent with a bankrupt, import-dependent, industrially undeveloped service.

---

# G. Deferred (needs an owner or a decision-request)

- **No shared family for the 229 mm Armstrong 12.5-ton RML** — a central Ottoman gun; overlaid on
  `gun_rml_10in_18ton` with a calibre/mass override. The orchestrator must confirm multiple models per family are
  legal, or add a dedicated family (`gun_rml_9in_12ton`).
- **Ottoman shell/charge/MV for the Armstrong export RMLs** — not recovered; all are ESTIMATE (the British RML
  family values stand in). A clean Mackinlay Table XVII or an Armstrong/Elswick export catalogue would settle it.
- **Moulded depth for every design** — no source gives it (carried over). Depths are ESTIMATE.
- **No Ottoman naval budget/yard/dock table opened** — the multipliers are grounded in *direction* only; a Brassey
  yard table or an Ottoman navy estimate would make them source-backed.
- **Mines and submarines** — the mine-and-fortress doctrine and the 1886 Nordenfelt submarine are recorded as
  research preferences only; any mine/submarine mechanic that is deferred must not be reachable content (DESIGN-55).
- **`domesticTorpedoDiameterUm` schema nuance** — the Ottomans had **no domestic torpedo manufacture**; the
  356 mm bore was imported (Whitehead). Using the field to carry the service bore is a framing choice; flag for the
  orchestrator.
- **AMC/CA/CL/KE are doctrine templates** — no 1880 Ottoman hull is a true B/CA/CL/DD/KE/AMC except Mesudiye and
  the sloops; confirm fictional-but-legal starters are acceptable (the existing `reference-designs.yaml` already
  does this for the UK/France/Germany/Russia/AH).

---

# H. Verdict

**Qualified yes — the Ottoman profile is authorable now, with per-figure labels.** The *shape* (besieged Straits
guardian; coastal_defence + regional_warfare; decaying, foreign-built ironclad fleet; imported Armstrong guns and
wrought-iron armour; bankrupt, industrially undeveloped state; weak/aspirational torpedo and colonial postures)
rests on the directly-read [NP] class pages (SINGLE-SOURCE) and the directly-read [NA86] comparative evolutions
table (VERIFIED), with [REPO] framing. The gun models are grounded gun-by-gun in [NP]/[SBN]; the multipliers,
max-displacement progression, doctrine weights, moulded depths and the doctrine templates are ESTIMATE /
**BALANCE TARGET** and labelled as such. What is genuinely missing (Ottoman gun shell/charge values, dock
capacities, a 9-in family) is deferred — none of it blocks a first profile.

## Source list

1. navypedia.org Ottoman/Turkish class pages (read directly this session): `ships/turkey/tu_index.htm`, `tu_bb.htm`,
   `tu_cr.htm`, `tu_dd.htm`, `tu_ss.htm`; `tu_bb_osmaniye.htm`, `tu_bb_mesudiye.htm`, `tu_bb_avnillah.htm`,
   `tu_bb_fethi_bulend.htm`, `tu_bb_mukaddemei_hayir.htm`, `tu_bb_assari_shevket.htm`, `tu_bb_assari_tevfik.htm`,
   `tu_bb_iclaliye.htm`, `tu_bb_lutfu_celil.htm`, `tu_cr_mansure.htm`, `tu_cr_sinop.htm`, `tu_cr_beyrut.htm`,
   `tu_dd_burhaneddin.htm`.
2. T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`, full text `NavalAnnual1886_djvu.txt`
   (downloaded; Ottoman comparative evolutions table read directly; Ottoman ship-data page OCR-scrambled).
3. In-repo companions: `docs/research/ship-building-1880-ships-by-nation.md` §6.7;
   `ship-building-1880-pre-era-armament.md` §1/§3/§5; `content-1-fleets-and-ship-classes.md` §9;
   `content-1-ship-classification-and-economy.md` §3–4; `content-1-world-geography.md` §2.9/3.9;
   `national-naval-profiles-uk-france.md`; `content/production/1880/{countries,economies,possessions,research}.yaml`;
   `content/production/1880/ship-building/{components,plants,hull-forms,armament/gun-mounts}.yaml`,
   `reference-designs/ottoman_empire/historical.yaml`.
4. Print works named as leads (not opened this session): Conway's _All the World's Fighting Ships 1860–1905_
   (1979); B. Langensiepen & A. Güleryüz, _The Ottoman Steam Navy 1828–1923_ (1995); G. Mackinlay, _Text Book of
   Gunnery 1887_ (Table XVII); Brassey's _Naval Annual_ yard/budget tables; Jane's _Fighting Ships_.

**No `docs/OPEN-ISSUES.md` decision was resolved here.** The 229 mm family gap and the `domesticTorpedoDiameterUm`
schema nuance are surfaced explicitly above and left for the orchestrator to decide whether they become
decision-requests.
