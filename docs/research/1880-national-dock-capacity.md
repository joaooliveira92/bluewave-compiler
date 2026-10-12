# Research: 1880 national dock ceiling (`maximumNewConstructionMassKg`)

Research-only note. Grounds a per-nation **dock ceiling** for the 14 `scen_1880` nations,
distinct from `industrialProfile.maxPracticalDisplacementKg` (a production/throughput figure, *not*
a dock limit). Captured 2026-10-12. No content/constants are authored here.

## Question

The RtW3 manual (`docs/manual.pdf`, printed pp. 32–33) states dock size "is used as a limit to the
largest ship your nation can build and operate" and "You cannot build ships larger than your current
dock size"; dock steps grow 1000–2000 t at a time. What **`maximumNewConstructionMassKg`** (kg)
should each of the 14 `scen_1880` nations start with, grounded so that the dock can at least fit the
largest warship that nation actually built or had under construction around Jan 1880?

Principle applied (per the task): **dock ≥ largest 1880 warship the nation built or had under
construction**, rounded **UP to the next 1,000 t**. Where a nation had no large ironclad, its largest
contemporary warship is used.

## Sources

| tag | source | status |
| --- | --- | --- |
| [NP] | navypedia.org class pages (slug inline) | read directly this session where marked; single compilation (Conway's-based) → SINGLE-SOURCE |
| [SCEN] | `content/production/1880/designs.yaml`, `fleets.yaml`, `constructions.yaml` | in-repo scenario reference hulls (largest hull each nation actually fields) |
| [SBN] | `docs/research/ship-building-1880-ships-by-nation.md` | in-repo research note (per-nation in-service ships) |
| [NA86] | Brassey (ed.), *The Naval Annual 1886*, archive.org `navalannual1886` | period near-primary (per [SBN] table) |
| [NE] | naval-encyclopedia.com (Conway's-sourced) | secondary compilation |
| [RTW3SEM] | `docs/research/campaign-command-screen-rtw3-semantics.md` (p. 33) | in-repo manual-derived semantics (dock step 1000–2000 t) |

**Wikipedia is not cited.** No `docs/OPEN-ISSUES.md` item was resolved.

## Findings — recommended dock ceiling per nation

`kg` column = the value a content author can copy straight into the naval profile.

| nationId | largest 1880 warship (class; displacement t) | source | confidence | recommended `maximumNewConstructionMassKg` | derivation |
| --- | --- | --- | --- | --- | --- |
| uk | HMS *Inflexible*, masted turret ship; 11,880 normal (laid down 1874, launched 1876, comp. 1881) | [NP] `uk/brit_bb1_inflexible.html`; [SCEN] `des_gbr_inflexible` = 11,880,000 | SINGLE-SOURCE | **12,000,000** | 11,880 → next 1,000 t = 12,000 t |
| france | *Amiral Duperré*, barbette ship; 11,030 normal (laid down 1876, launched 1879, comp. 1883) | [NP] `france/fr_bb_amiral_duperre.htm`; [SCEN] `des_fra_amiral_duperre` = 11,200,000 | SINGLE-SOURCE | **12,000,000** | 11,200 (scenario) → 12,000 t |
| germany | SMS *Kaiser*, central-battery ironclad; 8,799 normal / 8,940 full (comp. 1875) | [NP] `germany/ger_bb_kaiser.htm`; [SBN] §3 | SINGLE-SOURCE | **9,000,000** | 8,799 (normal) → 9,000 t |
| russia | *Petr Velikiy*, turret ship; 9,790 normal / 10,460 full (comp. 1876); scenario fields a 10,570 t hull | [NP] `russia/ru_bb_pyotr_velikiy.htm`; [SCEN] `des_rus_petrveliky` = 10,570,000 | SINGLE-SOURCE (normal-range figures VERIFIED in [SBN] §6.2) | **11,000,000** | 10,570 (scenario max) / 10,460 (full) → 11,000 t |
| austria_hungary | SMS *Custoza*, centre-battery ship; 7,609 normal (comp. 1875); *Tegetthoff* 7,510 under constr. | [NP] `austrohungary/ah_bb_custoza.htm`; [SCEN] `des_aut_tegetthoff` = 7,510,000 | SINGLE-SOURCE | **8,000,000** | 7,609 (largest 1880) → 8,000 t |
| italy | *Italia*, barbette battleship; 13,678 normal / 15,407 full (laid down 1876, launched 1880) | [NP] `italy/it_bb_italia.htm`; [SCEN] `des_ita_italia` = 13,900,000 | SINGLE-SOURCE | **14,000,000** | 13,900 (scenario) → 14,000 t |
| japan | *Fusō*, central-battery ironclad; 3,717 normal (comp. 1878) | [SBN] §6.4; [NP] `japan/jap_bb_fuso78.htm`; [SCEN] `des_jpn_fuso` = 3,720,000 | SINGLE-SOURCE | **4,000,000** | 3,720 → 4,000 t |
| qing | *Dingyuan*, turret ironclad; ~7,220 (ordered 1880, built Germany, comp. 1885) | [SCEN] `des_chi_dingyuan` = 7,220,000; [SBN] §5 | ESTIMATE | **8,000,000** | 7,220 → 8,000 t |
| ottoman_empire | *Mesudiye*, central-battery ironclad; 8,938 normal (comp. 1875) | [NP] `turkey/tu_bb_mesudiye.htm`; [SBN] §6.7 | SINGLE-SOURCE | **9,000,000** | 8,938 → 9,000 t |
| spain | *Numancia*, broadside ironclad; 7,189 normal (comp. 1864) | [NP] `spain/sp_bb_numancia.htm` (read directly) | SINGLE-SOURCE | **8,000,000** | 7,189 → 8,000 t |
| netherlands | *Atjeh*, unprotected cruiser; 3,425–3,669 normal (comp. 1877) | [NP] `netherlands/nl_cr_atjeh.htm` (read directly); [SBN] §6.9 | ESTIMATE | **4,000,000** | 3,669 → 4,000 t (see ESTIMATE list) |
| portugal | *Vasco da Gama*, coast-defence casemate ironclad; 2,384 normal (comp. 1876) | [NP] `portugal/pr_bb_vasco_da_gama.htm`; [SBN] §6.10 | SINGLE-SOURCE | **3,000,000** | 2,384 → 3,000 t |
| brazil | *Sete de Setembro*, casemate ironclad; 2,174 (comp. 1874) | [NE] (Conway's relay); [SBN] §6.11 | SINGLE-SOURCE | **3,000,000** | 2,174 → 3,000 t |
| usa | *Amphitrite*, monitor; 3,990 normal (laid down 1874–75, under construction) | [NP] `usa/us_mon_amphitrite.htm` (read directly) | SINGLE-SOURCE | **4,000,000** | 3,990 → 4,000 t |

## Method and limits

- **Rounding.** Values are the sourced displacement rounded **up** to the next 1,000 t, matching the
  RtW3 dock-step granularity of 1000–2000 t ([RTW3SEM], p. 33). These are normal displacements as
  given by the sources; full-load displacement can run ~5–15 % higher (e.g. *Italia* 15,407 t full),
  which the round-up step roughly absorbs. A slip/dock is conventionally sized on launch/normal.
- **"Under construction" is included, per the task.** *Inflexible* (launched 1876, comp. 1881),
  *Amiral Duperré* (launched 1879, comp. 1883), *Italia* (launched 1880, comp. 1885), *Tegetthoff*
  (comp. 1881), *Dingyuan* (ordered 1880, comp. 1885) and the US *Amphitrite* monitors were all laid
  down and incomplete at 1 Jan 1880, so they raise the ceiling even though they are not in-service
  starting assets. **Brazil's *Riachuelo* (5,610 t) is excluded** — laid down 31.8.1881, after the
  scenario window.
- **Foreign-built flagships.** For Qing (*Dingyuan*, German-built), the Ottomans (*Mesudiye*,
  UK-built), Portugal (*Vasco da Gama*, UK-built) and Brazil (large hulls imported), the value above
  is a **"possess / operate" ceiling** (the manual's "build and operate") grounded in the nation's own
  flagship, not a domestic-build capacity. Their *domestic* build ceilings were far lower ([NP]/[NE]
  builder fields: Qing ~2,150 t, Portugal ~1,406 t, Brazil ~2,174 t; see the per-nation
  `*-naval-profile.md` notes). If the orchestrator instead wants `maximumNewConstructionMassKg` to gate
  *domestic* building only, these four values must be revised down — that is a documented open choice,
  not resolved here.
- **Distinct from production.** `industrialProfile.maxPracticalDisplacementKg` is a throughput/quality
  figure, not a dock limit. The recommended dock ceilings sit at or above the current production value
  for every nation except the USA (dock 4,000,000 < production 6,000,000) — that is acceptable, since
  the dock is the hard cap and the production figure modulates cost/time up to it. Cross-check:

  | nation | current maxPractical 1880 | recommended dock | | nation | current maxPractical 1880 | recommended dock |
  | --- | --- | --- | --- | --- | --- | --- |
  | uk | 10,000,000 | 12,000,000 | | austria_hungary | 7,700,000 | 8,000,000 |
  | france | 9,000,000 | 12,000,000 | | italy | 11,000,000 | 14,000,000 |
  | germany | 9,000,000 | 9,000,000 | | japan | 4,000,000 | 4,000,000 |
  | russia | 10,000,000 | 11,000,000 | | qing | 2,000,000 | 8,000,000 |
  | ottoman_empire | 9,000,000 | 9,000,000 | | netherlands | 2,000,000 | 4,000,000 |
  | spain | 7,200,000 | 8,000,000 | | portugal | 1,400,000 | 3,000,000 |
  | usa | 6,000,000 | 4,000,000 | | brazil | 2,200,000 | 3,000,000 |

- **Source limits.** navypedia is a single Conway's-based compilation and is **not complete for the
  1870s** — it omits several older ironclads (e.g. the Netherlands' mid-1870s armoured ships). Values
  are SINGLE-SOURCE unless two sources agree. All [NP] pages above were read in full this session
  except where [SBN] is the only citation.

## ESTIMATE values (inference, not a directly-read figure)

| nationId | why ESTIMATE |
| --- | --- |
| qing | navypedia has **no** Chinese pre-1885 ironclad page (Dingyuan slug 404); value is derived from the scenario design (`des_chi_dingyuan` = 7,220,000 kg) and the historical 1880 order. The ship was German-built. Confirm against Conway's "China" chapter before locking. |
| netherlands | navypedia's Dutch capital-ship list omits mid-1870s ironclads; the value uses the largest hull it *does* list ([NP] *Atjeh* 3,669 t) plus the repo's own finding that "the largest armoured ships are ~3.5 kt" coast-defence ships. A claim of a larger 1870s Dutch turret-ram exists only as a lead (not citable here) and is **not** backfilled. If confirmed, the ceiling would rise to 6,000 t. |
| usa | Grounded on *Amphitrite* (3,990 t), the largest hull the scenario fields. **Alternative flagged:** USS *Puritan* (6,060 t, laid down 1875, launched 1882) was also an incomplete hull in 1880; if counted, the US ceiling would be 7,000 t. The scenario models only *Amphitrite*, and the US "New Navy" monitors were legally "repairs", so 4,000 t is recommended — an open choice to confirm. |

## Deferred

- **Domestic-build vs possess/operate semantics** of `maximumNewConstructionMassKg` for Qing, the
  Ottomans, Portugal and Brazil (imported flagships). Needs an owner decision (see Method above).
- **USA *Puritan*** inclusion/exclusion (4,000 t vs 7,000 t).
- **Netherlands pre-1880 armoured ceiling** — needs Conway's or *The Naval Annual 1886* Dutch armoured
  list opened (the [NA86] existence check in the Netherlands profile lists *Buffel*, *Hyena*,
  *Prins Hendrik der Nederlanden*, *Stier* — none larger than *Atjeh*).

## Final authored values (scenario-starter floor applied)

The dock must also admit the largest hull each nation fields in the scenario itself (its
`reference-designs/<nation>/starters.yaml` templates), otherwise a nation could not order its own
opening designs. The authored value is therefore
`max(historical flagship, largest scenario reference hull)` rounded up to the next 1,000 t. The
scenario starters are the binding constraint for seven nations (marked ★); the rest keep the
historical figure.

| nationId | authored `maximumNewConstructionMassKg` | binding source |
| --- | --- | --- |
| uk ★ | 13,000,000 | scenario B starter 12,679 t (Majestic-like) |
| france | 12,000,000 | Amiral Duperré 11,200 t |
| germany | 9,000,000 | SMS Kaiser 8,799 t |
| russia | 11,000,000 | Petr Velikiy 10,570 t |
| austria_hungary | 8,000,000 | SMS Custoza 7,609 t |
| italy | 14,000,000 | Italia 13,900 t |
| japan ★ | 5,000,000 | scenario CA starter 4,865 t |
| qing ★ | 10,000,000 | scenario B starter 9,377 t |
| ottoman_empire | 9,000,000 | Mesudiye 8,938 t |
| spain | 8,000,000 | Numancia 7,189 t |
| netherlands ★ | 5,000,000 | scenario CA starter 4,865 t |
| portugal ★ | 5,000,000 | scenario CA starter 4,865 t |
| brazil ★ | 5,000,000 | scenario CA starter 4,865 t |
| usa ★ | 5,000,000 | scenario CA starter 4,865 t |

The four mass limits are authored equal (one physical dock); they may diverge in a later era when
repair/rebuild/conversion docks are modelled separately. The authored value is validated against
every opening design by `validateNationCompleteness` (`NATION_STARTER_EXCEEDS_DOCK`).
