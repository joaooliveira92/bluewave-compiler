# Research: national naval profile — Austria-Hungary (1880–1899)

Companion to `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`,
`italy-naval-profile.md`, `japan-naval-profile.md`, `russia-naval-profile.md`; method, source grades and confidence
labels are identical (VERIFIED / SINGLE-SOURCE / DERIVED / ESTIMATE / UNVERIFIED; **Wikipedia is not cited
anywhere**). Authored for the `austria_hungary` (canonical `NationNavalProfile`) of the `scen_1880` national-naval
initiative (`docs/ships-nation-orientation.md`, ADR-0088/0089 line of work). This is a **research-only** pass: no
code, no content YAML, no spec is authored here. Captured 2026-10-11.

## 0. Question

What are the grounded figures and national differentiators needed to author a **date-banded `NationNavalProfile`
(1880–1899)** for the **Austro-Hungarian Empire** (k.u.k. Kriegsmarine, repo id `austria_hungary`), plus ~13
shared-family national models and six 1880 opening designs (B, CA, CL, DD, KE, AMC), with component access,
research priorities and naming policy?

This note answers that; it does **not** author the profile. The shipped draft is
`content/production/1880/research.yaml` (`austria_hungary` = `GUNNERY: 2, MACHINERY: 2`), `countries.yaml`
(`id: austria_hungary`, "Deter Italy in the Adriatic") and `economies.yaml` (treasury 240, income 22).

## 1. Method, source grades and confidence labels

Every figure carries a named source and one of: **VERIFIED** (read directly in a period/near-primary text, or two
independent sources agree); **SINGLE-SOURCE** (one source, or a secondary compilation citing print works I could
not open); **DERIVED** (arithmetic from a sourced figure); **ESTIMATE** (derived/inferred by me; not itself a
source figure); **UNVERIFIED** (no usable source, or sources conflict; a range is given). **Wikipedia is not cited
as a source anywhere.** (The older `p1-1880-torpedo-armament.md` cites Wikipedia for the AH rows; those are
re-grounded here from navypedia.)

| Tag    | Source                                                                                                                                                                                                                                     | Grade / reach                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [NP]   | navypedia.org Austro-Hungarian class pages (Ivan Gogin), built principally on Conway's _All the World's Fighting Ships 1860–1905_ + national histories. **Fetched directly this session** (slugs in §Sources).                                  | Secondary compilation → SINGLE-SOURCE.                                                              |
| [NA86] | T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`, full text `NavalAnnual1886_djvu.txt` **read directly this session** (Notes on the Austrian Navy pp. 210–211; Austrian fleet exercises 1885 p. 145; Austrian estimates pp. 494–495; torpedo-manufacture passage p. 46). | Contemporary annual = period near-primary. **Read directly → VERIFIED for figures actually read.** |
| [TB87] | G. Mackinlay, _Text Book of Gunnery, 1887_ (HMSO), Table XVII (foreign ordnance), via `ship-building-1880-pre-era-armament.md` §3 (the Austrian 28 cm row).                                                                                 | Primary service manual; read at second hand here → SINGLE-SOURCE.                                   |
| [SBN]  | `docs/research/ship-building-1880-ships-by-nation.md` §6.3 (Kaiser Max class; III/IV torpedo boats). **In-repo, already grounded.**                                                                                                        | Reused; confidence as carried in that note.                                                         |
| [PRE]  | `docs/research/ship-building-1880-pre-era-armament.md` §3/§5 (Krupp / Austrian ordnance values). **In-repo.**                                                                                                                               | Reused; SINGLE-SOURCE.                                                                               |
| [REPO] | Shipped content (`countries.yaml`, `possessions.yaml`, `economies.yaml`, `research.yaml`). **Not a historical source** — repo framing only.                                                                                                 | Framing, not grounding.                                                                             |
| [CW]   | Conway's _All the World's Fighting Ships 1860–1905_ (1979). **Not opened this session**; relayed only via [NP].                                                                                                                             | Print secondary; SINGLE-SOURCE (relayed) where [NP] relays it.                                      |

Limits: Conway's was not reachable; [NP] is a single compilation, so nearly every ship figure is SINGLE-SOURCE.
The 1886 annual is a period annual and its Austrian passages are read directly (VERIFIED as read). **No AH naval
budget in kronen, yard-return or dock-capacity table was opened** — the industrial multipliers, research weights
and design weights below are explicit **BALANCE TARGET / ESTIMATE**, not measurements. Moulded depth is not given
by [NP] for any AH ship (UNVERIFIED), as in the UK/France/Germany/Italy/Japan/Russia notes.

Conversions: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 ihp = 0.7457 kW; 1 kn = 0.5144 m/s.

---

# A. National naval profile (1880–1899)

1880 Austria-Hungary is a **continental dual monarchy with one narrow Adriatic window**: a compact, professional,
politically and financially constrained navy based on the **Pola** arsenal, whose stated purpose is **to deter
Italy in the Adriatic** and defend imperial prestige. It is a **coast-defence, torpedo and mine** navy — a small
ironclad battle line, no ocean-station empire, and an outsized torpedo tradition because **Whitehead's torpedo
works at Fiume were inside the Dual Monarchy** [NA86] p. 46.

## A.1 Strategic posture

| posture                        | applies?          | justification (one line)                                                                                                                     | source                              | confidence    |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------- |
| coastal_defence                | **primary**       | one narrow Adriatic coast with a belt of islands and the Pola arsenal; the ironclads are small central-battery casemate ships (Kaiser Max 3,548 t, Kaiser/Custoza/Erzherzog Albrecht), not ocean battleships. | `[REPO]` `countries.yaml`; [NP]     | VERIFIED (in-repo) / SINGLE-SOURCE |
| regional_warfare (Adriatic)    | **primary**       | the navy exists to deter Italy in the Adriatic (`countries.yaml` `strategicObjectives.primary`); no service outside home waters.               | `[REPO]` `countries.yaml`           | VERIFIED (in-repo) |
| torpedo_warfare                | **primary/strong** | the 1885 fleet exercises are a night torpedo-flotilla attack on the ironclad fleet (concentric attack in three groups off Lissa) [NA86] p. 145; the III/IV boats (Yarrow, 1879) and Zara/Spalato torpedo ships; 30 first-class + 7 second-class TBs by Jan 1886. | [NA86] pp. 145, 211; [NP]           | VERIFIED (counts/exercise) |
| battle_fleet_concentration     | **weak**          | a small defensive line (Kaiser, Erzherzog Albrecht, Custoza, Kaiser Max ×3, + Tegetthoff from 1881), never a blue-water battle fleet; no first-rate beyond ~7,600 t. | [NP]; [REPO]                        | SINGLE-SOURCE |
| mines / mine defence           | **secondary**     | the AH navy was a mine and mine-defence practitioner (Adriatic barrier doctrine); carried as a research preference only (DESIGN-55 guard).     | [NP]; ESTIMATE                       | ESTIMATE / **BALANCE TARGET** |
| commerce_defence               | **weak**          | small Adriatic/Austrian merchant marine (Österreichischer Lloyd, Trieste); no ocean trade-protection obligation comparable to Britain's.       | `[REPO]`; ESTIMATE                  | ESTIMATE |
| commerce_raiding               | **no**            | not an 1880 AH doctrine; the navy is defensive/coastal, not a guerre-de-course service (unlike France/Russia).                                | reasoning                           | ESTIMATE |
| colonial_presence              | **no**            | `possessions.yaml` has no overseas holdings; only Adriatic/Dalmatian coastal areas (no coaling-station empire).                              | `[REPO]` `possessions.yaml`         | VERIFIED (in-repo) |
| distant_water_operations       | **no/negligible** | no station squadron; the fleet is a single home (Adriatic) command.                                                                           | `[REPO]`; [NP]                      | SINGLE-SOURCE |

**Recommended primary postures: `coastal_defence` + `regional_warfare` + `torpedo_warfare`**, with
`battle_fleet_concentration` a weak, defensive fourth and `mines/mine-defence` a research preference only.
`commerce_raiding`, `commerce_defence`, `colonial_presence` and `distant_water_operations` are **not** 1880 AH
postures.

### A.1b In-service 1880 ships (re-used from `[SBN]` §6.3 — do not re-derive; corroborated [NP] this session)

- **Kaiser Max class** central-battery casemate ironclad (Don Juan d'Austria 26.6.1876, Kaiser Max 26.10.1876,
  Prinz Eugen 11.1878): 3,548 t; 75.9 oa / 73.2 wl × 15.3 × 6.15 m; 1 × 2-cyl HRCR, 4 rectangular boilers,
  2,755 ihp, 13.3 kn; 8 × 209 mm G. L/20 C.68; 4 × 87 mm G. L/24 M.75 + 2 × 66 mm; **4 × 350 mm TT added 1880**
  (1 bow, 2 beam, 1 stern) [NP also gives 2,000 nmi at 10 kn end.]; belt 205 (ends 120–102), casemate 125,
  bulkheads 115 on 254 mm teak; coal 380 t; crew 400. `[SBN]`/`[NP]` SINGLE-SOURCE.
- **Kaiser** central-battery ship (1869/73 rebuild): 5,194/5,720 t; 77.8 wl / 81.0 oa × 16.2–17.8 × 7.37–7.90 m;
  2,786 ihp, 11.5 kn; 10 × 229 mm Armstrong 12-ton MLR + 6 × 106 mm; belt 152–102, casemate 140; coal 440 t.
  3 × 350 mm TT added 1885. `[NP]` `ah_bb_kaiser.htm` SINGLE-SOURCE.
- **Erzherzog Albrecht** central-battery ship (1874): 5,980 t; 89.7 oa / 87.9 wl × 17.2 × 6.72 m; 3,969 ihp,
  12.8 kn; 8 × 235 mm G. L/22 C.74 + 6 × 87 mm; belt 205, casemates 175; coal 500 t. 4 × 350 mm TT added 1880s.
  `[NP]` `ah_bb_erzherzog_albrecht.htm` SINGLE-SOURCE.
- **Custoza** central-battery ship (1875): 7,609/7,731 t; 95.0 oa / 92.1 pp × 17.7 × 7.90 m; 4,158 ihp, 13.7 kn;
  8 × 263 mm G. L/22 C.73 + 6 × 87 mm + 2 × 66 mm; belt 230, casemates 175–150; coal 600 t; crew 548. 4 × 350 mm
  TT added 1882. **The largest in-service AH ironclad in Jan 1880.** `[NP]` `ah_bb_custoza.htm` SINGLE-SOURCE.
- **Lissa** (older casemate ship, from the 1885 exercise flagship) — [NA86] p. 145 names her as Vice-Admiral
  Sterneck's flagship of the ironclad fleet; not otherwise dimensioned here. [NA86] VERIFIED (name/role).
- **III / IV torpedo boats** (Yarrow-built variant of _Lightning_, completed 1879): 27 t; 26.4 × 3.30 × 1.50 m;
  1 HC, 1 locomotive boiler, 430 ihp, 17.5 kn; 2 × 356 mm bow TT; crew 10. `[SBN]`/`[NP]` `ah_dd_iii.htm`
  SINGLE-SOURCE.
- **Saïda** screw corvette (completed 14.8.1879): 2,662 t; 79.4 × 13.1 × 5.83 m; 1 × 2-cyl HSE, 1,790 ihp, 12 kn;
  11 × 149 mm G. L/26 C.78 + 1 × 66 mm; coal 270 t. `[NP]` `ah_cr_saida.htm` SINGLE-SOURCE.
- **Radetzky class** frigates (Radetzky 10.8.1873, Laudon 22.7.1874): 3,394/3,956 t; 79.1 oa / 77.1 pp × 14.3 ×
  7.00 m; 15 × 149 mm G. L/26 C/72 + 2 × 66 mm. `[NP]` `ah_cr_radetzky.htm` SINGLE-SOURCE.
- **Leitha / Maros** river monitors (1871–72): 310 t; 50.0 × 8.10 × 1.10 m; 2 HSE, 700 ihp, 8–9 kn; 1 × 2 149 mm
  G. L/21 M.61; iron side 44, deck 25, CT 50. `[NP]` `ah_of_leitha.htm` SINGLE-SOURCE.
- **Excluded (not in service Jan 1880):** SMS _Tegetthoff_ (laid 1876, completed 10/1881 — 7,431 t, 6 × 283 mm
  G. L/22 C.75, belt 370), _Zara_ (6/1881) / _Spalato_ (7/1880) torpedo ships. `[SBN]`/`[NP]` SINGLE-SOURCE.

## A.2 Industrial capability

| item                            | figure / direction                                                                                              | unit   | source                                    | confidence        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------- | ----------------- |
| Navy estimates (1886)           | ordinary £1,231,028; ordinary + extraordinary £1,447,925; construction of new vessels £162,750                 | £      | [NA86] pp. 494–495                        | VERIFIED          |
| Personnel (1886)                | 1 vice-admiral, 2 rear-admirals, 18 captains, 48 commanders, 192 lieutenants, 7,340 seamen; total 8,574         | men    | [NA86] p. 495                             | VERIFIED          |
| 1886 new construction           | Kronprinz Erzherzog Rudolf 6,900 t (armoured); Ersatz Ferdinand Max 5,100 t; Leopard 1,530 t torpedo vessel; Ersatz Seehund 1,530 t; 2 × 135-ft + 8 second-class torpedo boats | ships  | [NA86] p. 495                             | VERIFIED          |
| Shipbuilding base               | state **Marinearsenal Pola** (Pola arsenal) + private **Stabilimento Tecnico Triestino (STT), San Rocco/Triest** (both build the ironclads and cruisers); Hungarian yard at Újpest built the Leitha monitors | —      | [NP] builder fields                       | VERIFIED (direct) |
| Heavy-gun production            | **IMPORTED — Krupp** in this band: the AH guns are Krupp-designed (209 mm, 235 mm, 263 mm, 283 mm G. L/…; the Panther "is to carry two long-range Krupp guns" [NA86] p. 211). Škoda naval ordnance is a **later** (1890s) development | —      | [NA86] p. 211; [NP]; [PRE] §3             | SINGLE-SOURCE     |
| Armour-plate production         | **IMPORTED early** (wrought-iron plates on all in-service ironclads); **Witkowitz (Vítkovice, Moravia)** becomes a plate source later (1880s–90s). No in-band evidence of a domestic plate mill | —      | [NP] (wrought iron); ESTIMATE             | ESTIMATE          |
| Machinery reliability           | competent but small-series: AH built its own (STT/Pola) machinery; Tegetthoff's original 2-cyl HRCR made 6,706 ihp/14 kn and was re-engined by **Schichau** in 1893. Propose **8600 bp** | bp     | [NP] Tegetthoff; plants.yaml (TE 9000)    | ESTIMATE / **BALANCE TARGET** |
| Build-time multiplier           | **SLOWER** than the 1894 baseline: small yards, dual-monarchy budget politics, some rebuilding-by-stealth. Propose **10400–10900 bp** | ×      | [NP] completion slips; [REPO]             | ESTIMATE / **BALANCE TARGET** |
| Cost multiplier                 | **higher per hull**: small series, state + private yards, imported Krupp guns and (early) armour. Propose **10500–11000 bp** | ×      | ESTIMATE (from Krupp import + small series) | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement (1880/1885/1890) | ~7,700 t / ~7,700 t / ~8,400 t                                                                         | t      | [NP] Custoza 7,609 (largest in 1880); Tegetthoff 7,431; Habsburg 8,340 (1902 class) → 1890 estimate | ESTIMATE (from completed classes) |
| Construction-quality variance   | moderate–low for a small professional service (Pola/STT had a good record). Propose **3000 bp**                | bp     | ESTIMATE                                  | ESTIMATE / **BALANCE TARGET** |

The AH has **one real industrial differentiator and one real gap**: it is world-class in **torpedo manufacture**
(Whitehead at Fiume — "At the present time we are dependent on **Austria** for our supply", the French Commission
wrote in 1886 [NA86] p. 46), and it is **dependent on imports** for heavy guns and (early) armour. Both are
grounded; the multipliers are BALANCE TARGET inside ±15 %.

## A.3 Gunnery doctrine

| field                         | AH position                                                                                                         | source                       | confidence    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------- |
| preferred engagement distance | **short (~1,500 m)**: period practice; the Lissa (1866) ram/close-action heritage shaped Romako's bow-battery designs | [NP] Custoza/Tegetthoff; period | ESTIMATE (period) |
| main-gun emphasis             | **moderate**: 209 mm (8.2-in) on Kaiser Max up to 283 mm (11-in) on Tegetthoff — fewer, mostly casemate-mounted Krupp BLs, not huge calibres | [NP]                         | SINGLE-SOURCE |
| secondary-battery emphasis    | **light**: 87 mm and 66 mm L/24–L/18 Krupp BLs; later 47 mm SFK Hotchkiss and 25 mm Nordenfelt machine guns       | [NP]                         | SINGLE-SOURCE |
| gun-quality priorities        | buy the best available (Krupp) rather than develop a domestic heavy; rate of fire secondary                        | [NA86] p. 211; [NP]          | SINGLE-SOURCE |
| AP-vs-HE preference           | **AP-dominant**: black-powder Krupp steel shot / hardened projectile is the norm; no melinite-type HE in-band       | [TB87] via [PRE]; [NA86]      | SINGLE-SOURCE |
| fire-control research priority| minimal in-band; no rangefinding until the 1890s                                                                   | ESTIMATE                     | ESTIMATE |
| rate-of-fire preference       | slow: hand-worked Krupp BL heavy guns ~1 rds/min; light QF/MG only later                                           | [PRE] §3 (ROF EST)           | ESTIMATE |

## A.4 Protection doctrine

| field                         | AH position                                                                                                        | source                       | confidence    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------- |
| belt vs protected deck        | **complete waterline belt + armoured casemate/citadel** on the ironclads (wrought iron on teak); the early cruisers were unarmoured | [NP] Kaiser Max/Custoza/Tegetthoff | SINGLE-SOURCE |
| armour coverage               | belt protects the full length, extending ~1.2–1.7 m above and below wl; casemate connected to the belt's upper edge | [NP] Kaiser Max/Custoza      | SINGLE-SOURCE |
| secondary-battery protection  | secondary guns largely unprotected or in light shields until the 1890s                                             | [NP]                         | SINGLE-SOURCE |
| conning-tower                | fitted; moderate (Tegetthoff 175–127; Leitha 50)                                                                     | [NP]                         | SINGLE-SOURCE |
| stability margin              | reasonable; the small casemate ships had modest freeboard and were stable; no recorded instability scandal          | [NP]; ESTIMATE               | ESTIMATE |
| survivability-vs-speed        | **survivability first** on the ironclads (Romako "emphasised less speed and fewer guns, in favour of high defensive capability" — [NP] Custoza project history) | [NP] Custoza | SINGLE-SOURCE |

## A.5 Propulsion doctrine

| field                    | AH position                                                                                       | source                       | confidence    |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------- | ------------- |
| preferred speed margin   | **low–moderate**: ironclads 11.5–13.7 kn; torpedo ships 14.3 kn; torpedo boats 17.5 kn           | [NP]                         | SINGLE-SOURCE |
| machinery type           | horizontal compound (HSE/HRCR) + rectangular/cylindrical boilers; locomotive boilers in torpedo craft; **VTE later** (1893 Tegetthoff refit) | [NP]                         | SINGLE-SOURCE |
| reliability tolerance    | moderate; small service, careful engineering; the AH built its own engines but re-engined ships later | [NP] Tegetthoff               | SINGLE-SOURCE |
| coal endurance           | modest (ironclads 1,520–3,000 nmi @10; Zara 1,160 @8.5)                                          | [NP]                         | SINGLE-SOURCE |
| forced-draught acceptance| accepted on torpedo craft (trials +1 kn reported for Panther); ironclads natural draught          | [NA86] p. 211                | VERIFIED (as read) |
| domestic vs imported     | machinery and hull **domestic** (Pola/STT); heavy guns **imported (Krupp)**; early armour **imported**; torpedoes **domestic (Whitehead, Fiume)** | [NA86]; [NP] | SINGLE-SOURCE |

## A.6 Torpedo doctrine

| field                            | AH position                                                                                                   | source               | confidence    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------- | ------------- |
| torpedo priority                 | **high / defining**: the flotilla is the offensive arm; the 1885 exercise is a night massed torpedo attack  | [NA86] p. 145        | VERIFIED      |
| preferred tube count             | ironclads 3–4 × 350 mm; Zara/Spalato 3 × 350 mm (2 bow + 1); torpedo boats 2 × 356 mm bow                    | [NP]                 | SINGLE-SOURCE |
| above-water vs submerged         | both: bow + beam + stern 350 mm on ironclads; bow tubes on torpedo craft                                      | [NP]                 | SINGLE-SOURCE |
| use on cruisers / capital ships  | yes, both (Kaiser/Erzherzog Albrecht/Custoza/Kaiser Max all received 350 mm tubes in 1880–85)                 | [NP]                 | SINGLE-SOURCE |
| torpedo-boat procurement         | **very high intensity**: I (1875), II (1878), III/IV (1879, Yarrow), V/IX (1881), XI (1883–86), Adler (1886, 22.4 kn), Sperber, Bussard, XXVII (1886–91); 30 first-class + 7 second-class + 1 third-class by Jan 1886 | [NA86] p. 211; [NP]  | VERIFIED (counts) / SINGLE-SOURCE |
| torpedo production               | **DOMESTIC** — the Whitehead torpedo works at Fiume supplied other navies (France "dependent on Austria for our supply" 1886) | [NA86] p. 46         | VERIFIED (as read) |

## A.7 Global obligations

| field                        | AH position                                                                     | source                       | confidence    |
| ---------------------------- | ------------------------------------------------------------------------------- | ---------------------------- | ------------- |
| foreign-station tonnage      | **none** — a single home (Adriatic) command                                     | `[REPO]`; [NP]               | SINGLE-SOURCE |
| endurance requirements       | low/scaled to the Adriatic (1,500–3,000 nmi)                                    | [NP]                         | SINGLE-SOURCE |
| accommodation requirements   | modest                                                                          | [NP]                         | SINGLE-SOURCE |
| colonial-service capability  | none; river monitors (Leitha/Maros) for the Danube and coast-defence gunboats   | [NP] `ah_of.htm`             | SINGLE-SOURCE |
| number of overseas regions   | 0 in 1880 (Adriatic/Dalmatian coastal areas only)                               | `[REPO]` `possessions.yaml`  | VERIFIED (in-repo) |

## A.8 Risk tolerance

| field                         | AH position                                                                  | source                       | confidence    |
| ----------------------------- | ---------------------------------------------------------------------------- | ---------------------------- | ------------- |
| unproven components           | **moderate** — Romako's Tegetthoff was innovative (bow-battery, single-curvature belt) but the service was conservative in funding | [NP] Tegetthoff | SINGLE-SOURCE |
| minimum reliability           | moderate/high (small professional service)                                   | ESTIMATE                     | ESTIMATE |
| acceptable stability margin   | moderate                                                                     | ESTIMATE                     | ESTIMATE |
| overweight tolerance          | low–moderate (cost-constrained; "one conversion was three times as expensive as building a new warship" — [NP] Kaiser Max) | [NP] | SINGLE-SOURCE |
| preferred tech maturity       | proven for hulls/machinery; imported (Krupp) for heavy ordnance              | [NA86] p. 211; [NP]          | SINGLE-SOURCE |
| refit frequency               | moderate–high (repeated re-arm/rebuild: Kaiser 1882/85; Custoza 1882; Tegetthoff 1893) | [NP]              | SINGLE-SOURCE |

## A.9 Research preferences (canonical fields, priority 1–4)

Shipped draft: `research.yaml` `austria_hungary` = `GUNNERY: 2, MACHINERY: 2`. Grounded recommendation:

| field              | priority | justification                                                                                 | source                  | confidence    |
| ------------------ | -------- | --------------------------------------------------------------------------------------------- | ----------------------- | ------------- |
| TORPEDOES          | 4        | the defining AH arm: Whitehead manufacture at Fiume + massed-flotilla exercise doctrine        | [NA86] pp. 46, 145; [NP] | VERIFIED (statement) / SINGLE-SOURCE |
| MINES_AND_ASW      | 3        | AH mine/mine-defence practice in the Adriatic (research preference only — DESIGN-55 guard)      | [NP]; ESTIMATE           | ESTIMATE / **BALANCE TARGET** |
| MACHINERY          | 3        | competent domestic marine engineering (Pola/STT); VTE from 1893                                 | [NP] Tegetthoff          | SINGLE-SOURCE |
| HULL_CONSTRUCTION  | 3        | Romako's iron/steel casemate hulls; steel hulls on Panther (1885)                               | [NP]; [NA86] p. 211      | SINGLE-SOURCE |
| GUNNERY            | 3        | imported Krupp heavies; some domestic light ordnance later (Škoda 1890s)                        | [NA86] p. 211; [NP]      | SINGLE-SOURCE |
| SHIP_DESIGN        | 3        | Romako's innovative bow-battery Tegetthoff (single-curvature belt, overlapping arcs)            | [NP] Tegetthoff          | SINGLE-SOURCE |
| INFRASTRUCTURE     | 2        | Pola arsenal + STT; no overseas bases                                                           | [NP]                     | SINGLE-SOURCE |
| DAMAGE_CONTROL     | 2        | casemate subdivision, coal bunkers, pumps                                                        | [NP]                     | SINGLE-SOURCE |
| FIRE_CONTROL       | 1        | not prioritised in-band                                                                         | ESTIMATE                 | ESTIMATE |
| SUBMARINES         | 1        | no in-band AH submarine (first boats 1909); Whitehead relevance is torpedo, not boat            | [CW] relayed             | SINGLE-SOURCE |

> **DESIGN-55 guard.** MINES_AND_ASW and SUBMARINES are recorded as *research preferences* only. Any mine/submarine
> mechanic that is deferred/unaccepted must not be treated as reachable content in this profile; the profile
> carries the preference weight, nothing else.
>
> **Reconciliation note.** The shipped `research.yaml` gives `GUNNERY: 2, MACHINERY: 2`. The grounded reading puts
> **TORPEDOES** at 4 (the Whitehead/Fiume signature) and GUNNERY/MACHINERY co-equal at 3. The difference is a
> **BALANCE TARGET / content decision** for the orchestrator, not a fact this note can settle.

---

# B. Component access (shared families)

Status ∈ DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED | UNAVAILABLE. The catalogue's gun families are
British RMLs/BLs, the French 27 cm and the German (Krupp) 26 cm; **the AH signature light/medium Krupp guns have
no dedicated family and are overlaid on the nearest family with a calibre/shell override (§C).** Other nations'
signature domestic heavies are UNAVAILABLE.

| family id                        | status         | producer / note                                                                                       | source                       | confidence    |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------- | ------------- |
| `gun_bl_263mm_rkl20`             | IMPORTED       | **Krupp 26 cm / 28 cm** — the AH heavy (Custoza 263 mm, Tegetthoff 283 mm); Krupp-family match            | [NP]; [TB87] via [PRE] §3    | SINGLE-SOURCE |
| `gun_rml_8in_9ton`               | IMPORTED       | overlay family for the **Krupp 209 mm / 235 mm** AH heavies (mechanism mismatch; see §G deferred)         | [NP]                         | SINGLE-SOURCE |
| `gun_bl_6in_26`                  | IMPORTED       | overlay family for the **Krupp 149 mm / 15 cm** AH medium (Saïda, Radetzky, secondary)                  | [NP]                         | SINGLE-SOURCE |
| `gun_rml_64pdr_71cwt`            | IMPORTED       | overlay family for the **Krupp 87 mm G. L/24 M.75** light secondary                                    | [NP]                         | SINGLE-SOURCE |
| `gun_qf_12pdr`                   | IMPORTED       | overlay family for the **Krupp 66 mm G. L/18 M.75** light secondary                                    | [NP]                         | SINGLE-SOURCE |
| `gun_qf_47in`                    | IMPORTED       | **47 mm SFK L/33 H (Hotchkiss pattern)** light QF — 1890s AH tertiary                                    | [NP]                         | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr`             | IMPORTED       | **Hotchkiss 47 mm / 3-pdr**                                                                             | [NP]                         | SINGLE-SOURCE |
| `gun_qf_6pdr`                    | IMPORTED       | **57 mm / 6-pdr Hotchkiss-Nordenfelt** class light gun                                                 | [NP]                         | SINGLE-SOURCE |
| `gun_nordenfelt_1in`             | IMPORTED       | **25 mm Nordenfelt** (2 × 5 25/41 on AH ships)                                                          | [NP]                         | SINGLE-SOURCE |
| `gun_maxim_303`                  | IMPORTED       | Maxim; post-band                                                                                        | [NP]                         | UNVERIFIED    |
| `tube_14in_above_water`          | **DOMESTIC**   | **35 cm Whitehead, above-water/beam** — Whitehead works, **Fiume** (Austria supplied France)            | [NA86] p. 46; [NP]           | VERIFIED (as read) |
| `tube_14in_submerged`            | **DOMESTIC**   | **35 cm Whitehead, submerged bow** — Fiume                                                              | [NA86] p. 46; [NP]           | VERIFIED (as read) |
| `gun_rml_16in_80ton`             | UNAVAILABLE    | British 80-ton; not used                                                                                | —                            | SINGLE-SOURCE |
| `gun_rml_125in_38ton`            | UNAVAILABLE    | British; not used                                                                                       | —                            | SINGLE-SOURCE |
| `gun_rml_12in_35ton`             | UNAVAILABLE    | British; not used                                                                                       | —                            | SINGLE-SOURCE |
| `gun_rml_12in_25ton`             | UNAVAILABLE    | British; not used                                                                                       | —                            | SINGLE-SOURCE |
| `gun_rml_11in_25ton`             | UNAVAILABLE    | British; not used                                                                                       | —                            | SINGLE-SOURCE |
| `gun_rml_10in_18ton` / `_broadside` | UNAVAILABLE | British; not used                                                                                       | —                            | SINGLE-SOURCE |
| `gun_rml_7in_7ton`               | UNAVAILABLE    | British; not used                                                                                       | —                            | SINGLE-SOURCE |
| `gun_bl_274mm_m1875`             | UNAVAILABLE    | French 27 cm signature                                                                                  | —                            | SINGLE-SOURCE |
| `gun_bl_12in_25`                 | UNAVAILABLE    | British 12-in/25 signature                                                                              | —                            | SINGLE-SOURCE |
| `gun_bl_135in_30`                | UNAVAILABLE    | British 13.5-in signature                                                                               | —                            | SINGLE-SOURCE |
| `gun_bl_12in_35`                 | UNAVAILABLE    | British 12-in/35 signature                                                                              | —                            | SINGLE-SOURCE |
| `gun_bl_10in_32`                 | UNAVAILABLE    | British 10-in signature                                                                                 | —                            | SINGLE-SOURCE |
| `gun_bl_92in_315`                | UNAVAILABLE    | British 9.2-in; not used                                                                                | —                            | SINGLE-SOURCE |
| `gun_qf_6in_40`                  | UNAVAILABLE    | British QF (AH light QF is Hotchkiss-licensed 47 mm)                                                    | —                            | SINGLE-SOURCE |

`hardCapabilities` (recommended): `maxGunCaliberUm` 283000 (Tegetthoff 28 cm / Krupp); `maxArmourThicknessUm`
370000 (Tegetthoff belt, 1881) — or 230000 in-service Jan 1880 (Custoza); `domesticTorpedoDiameterUm` 350000
(Whitehead, Fiume); `hullForms` `[torpedo_boat_form, protected_cruiser_form, coast_defence_form,
pre_dreadnought_form, merchant_liner_form]`; `domesticPlants` `[compound_cylindrical, triple_expansion_cylindrical]`.

---

# C. National component variants (~13)

Each row overlays one shared family with an AH national designation, a sourced (or explicitly ESTIMATE) shell
mass/parameter set, and a `mounts` list. Mounts ∈ TURRET | BARBETTE | CASEMATE | DECK_SHIELDED | DECK_OPEN |
BROADSIDE_BATTERY.

| family id               | AH national model                                   | shell / params (override)                                                                   | mounts                        | source                       | confidence |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------- | ---------- |
| `gun_bl_263mm_rkl20`    | **26 cm G. L/22 C.73 (Krupp)** — Custoza             | cal 263000; shell **179500 g** (`395.7 lb`); charge ~47600 g (`105 lb`); pen ~36 cm WI pt-blank | CASEMATE                      | [TB87] Table XVII via [PRE]; [NP] Custoza | SINGLE-SOURCE (shell/charge) |
| `gun_bl_263mm_rkl20`    | **28 cm G. L/22 C.75 (Krupp)** — Tegetthoff (1881)   | cal 280000; shell **253000 g** (`557.8 lb`); charge **56000 g** (`123.5 lb`); pen **40 cm** WI pt-blank; MV ~440 (EST); ROF ~1 | CASEMATE | [TB87]/[B86] via [PRE] §3 | SINGLE-SOURCE (cal/shell/charge/pen); MV/ROF ESTIMATE |
| `gun_rml_8in_9ton`      | **20.9 cm G. L/20 C.68 (Krupp)** — Kaiser Max ×8     | cal 209000; shell ~100000 g (EST); charge ~25000 g (EST)                                      | CASEMATE                      | [NP] Kaiser Max; shell/charge ESTIMATE | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_rml_8in_9ton`      | **23.5 cm G. L/22 C.74 (Krupp)** — Erzherzog Albrecht ×8 | cal 235000; shell ~140000 g (EST); charge ~33000 g (EST)                                  | CASEMATE                      | [NP] Erzherzog Albrecht; ESTIMATE     | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_bl_6in_26`         | **15 cm G. L/24 M.75 / 149 mm G. L/26 C.78 (Krupp)** | cal 150000 (149000); shell ~40000 g (EST); charge ~8000 g (EST)                                | CASEMATE, DECK_OPEN, BROADSIDE_BATTERY | [NP] Saïda/Radetzky; ESTIMATE | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_rml_64pdr_71cwt`   | **8.7 cm G. L/24 M.75 (Krupp)**                      | cal 87000; shell ~9000 g (EST); charge ~1600 g (EST)                                          | CASEMATE, DECK_OPEN           | [NP] Kaiser Max/Custoza; ESTIMATE      | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_12pdr`          | **6.6 cm G. L/18 M.75 (Krupp)**                      | cal 66000; shell ~4000 g (EST)                                                                | DECK_OPEN, DECK_SHIELDED      | [NP]; ESTIMATE                        | SINGLE-SOURCE (cal) / ESTIMATE (shell) |
| `gun_qf_47in`           | **4.7 cm SFK L/33 H (Hotchkiss)**                    | cal 47000; shell 20400 g (family) → **AH 47 mm shell ~1500 g** (record the bore/hotchkiss model) | DECK_OPEN                     | [NP] (1890s); family                 | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr`    | **Hotchkiss 47 mm / 3-pdr**                          | cal 47000; shell 1500 g (family); ROF ~20                                                     | DECK_OPEN                     | [NP]; family                          | SINGLE-SOURCE |
| `gun_qf_6pdr`           | **5.7 cm (6-pdr) Hotchkiss-Nordenfelt light gun**    | cal 57000; shell 2720 g (family)                                                              | DECK_OPEN                     | [NP]; family                          | SINGLE-SOURCE |
| `gun_nordenfelt_1in`    | **2.5 cm Nordenfelt 4- or 5-barrel**                 | cal 25000; bullet 206 g (family); AH used 2 × 5 25/41                                         | DECK_OPEN                     | [NP]; family                          | SINGLE-SOURCE |
| `tube_14in_above_water` | **35 cm Whitehead, above-water/beam** (Fiume)        | bore 350000; trainable carriage; AH lists 2–4                                                 | — (ABOVE_WATER_TRAINABLE)     | [NA86] p. 46; [NP]                    | VERIFIED (as read) |
| `tube_14in_submerged`   | **35 cm Whitehead, submerged bow** (Fiume)           | bore 350000; fixed bow                                                                        | — (UNDERWATER_FIXED)          | [NA86] p. 46; [NP]                    | VERIFIED (as read) |

Notes:
- AH tubes are **350 mm (13.8 in)**, not the catalogue's 356 mm — record the bore (same caveat as
  `p1-1880-torpedo-armament.md` and `[SBN]` §4). The III/IV torpedo boats actually carried **356 mm** bow tubes.
- The first two models are the **genuine Krupp-family match** (`gun_bl_263mm_rkl20`); rows 3–4 (`209 mm`/`235 mm`)
  and rows 5–7 are **overlays** with a calibre override — the mechanism mismatch (RML family carrying a Krupp BL)
  is **surfaced as deferred** (§G) exactly as the Japan note does for Krupp RKL.
- All AH shell masses except the 26 cm and 28 cm are **ESTIMATE** (the sources give the bore/designation, not the
  projectile weight). A period ordnance table (Mackinlay Table XVII clean, Marine-Almanach) would upgrade them.

---

# D. Six 1880 opening designs (B, CA, CL, DD, KE, AMC)

All are legal 1880-01 **DOCTRINE_TEMPLATE** starting points, not historical reconstructions (the historical hulls
are in §A.1b). The B and DD shapes are grounded in historical in-service ships; CA/CL/KE/AMC are doctrine
templates grounded in AH practice/lineage. **Moulded depth is UNVERIFIED for every AH ship** — `depthToMainDeck`
is ESTIMATE throughout. Plant: `compound_cylindrical` (the only 1880 plant in `plants.yaml`; min 300 kW, max
8,000 kW). The `locomotive_boiler_tb` plant is dated 1890 and is a **content gap** for an 1880 torpedo boat
(same gap flagged in the Japan note).

| slot | shape / inspiration (source)                              | hull form               | Lwl/B/T (mm)              | depth (mm) | displ (kg) | plant / kW | fuel (kg) | main / secondary                                                  | armour scheme                                  | doctrine note |
| ---- | --------------------------------------------------------- | ----------------------- | ------------------------- | ---------- | ---------- | ---------- | --------- | ----------------------------------------------------------------- | ---------------------------------------------- | ------------- |
| **B**  | Kaiser Max-class casemate ironclad (historical 1876–78) [NP]/[SBN] | coast_defence_form      | 73,200 / 15,300 / 6,150   | 9,500 EST  | 3,548,000  | compound_cylindrical / 2,055 | 380,000 | 8 × `gun_rml_8in_9ton` (AH 20.9 cm Krupp) CASEMATE; 4 × `gun_qf_12pdr` (87 mm) + 2 × 66 mm | belt 205 mm wrought iron on teak; casemate 125; bulkheads 115 | small, slow, heavily-armoured Adriatic coast-defence ironclad; torpedo-fitted |
| **CA** | Romako lineage → Kaiserin und Königin Maria Theresia (1894) [NP] | protected_cruiser_form  | 100,000 / 15,500 / 6,500  | 9,000 EST  | 5,500,000  | compound_cylindrical / 6,000 | 700,000 | 2 × `gun_bl_263mm_rkl20` (AH 24 cm Krupp) in single BARBETTE fwd/aft; 6 × `gun_bl_6in_26` (149 mm); 2 × `tube_14in_above_water` | thin belt 100 wrought iron; deck 40; barbettes 100 | fast, lightly-armoured cruiser with Krupp heavies; Adriatic scout/raider |
| **CL** | Radetzky-class frigate / Saïda corvette (historical 1873/1879) [NP] | protected_cruiser_form  | 85,000 / 13,000 / 5,500   | 8,000 EST  | 3,000,000  | compound_cylindrical / 2,200 | 300,000 | 6 × `gun_bl_6in_26` (149 mm) DECK_OPEN/BROADSIDE; 2 × `gun_qf_12pdr` (66 mm); 2 × `tube_14in_above_water` | none (steel hull; coal-bunker side protection) | long-range steel scout/station cruiser; light, fast, torpedo-armed |
| **DD** | III/IV torpedo boats (Yarrow, 1879) [NP]/[SBN]            | torpedo_boat_form       | 30,000 / 3,300 / 1,500    | 2,500 EST  | 40,000     | compound_cylindrical / 320 | 8,000     | none (2 × `gun_nordenfelt_1in` light); 2 × `tube_14in_submerged` (356 mm bow) | nil | Yarrow/Reed 100-ft-type torpedo boat; the AH asymmetrical weapon (see §G scale note) |
| **KE** | Leitha river monitor (1871) / Albatros gunboat (1874) [NP] | coast_defence_form      | 60,000 / 10,000 / 2,500   | 4,500 EST  | 600,000    | compound_cylindrical / 600 | 90,000    | 2 × `gun_bl_6in_26` (149 mm) + 2 × `gun_qf_12pdr` (66 mm); 2 × `gun_nordenfelt_1in` | side 44 mm iron + deck 25 + CT 50 | shallow-draught river/coast-defence gunboat for the Danube and Dalmatian coast |
| **AMC**| Österreichischer Lloyd / Austro-Americana fast liner taken up from trade [REPO] | merchant_liner_form     | 115,000 / 14,000 / 7,500  | 8,000 EST  | 3,500,000  | compound_cylindrical / 2,600 | 900,000 | 4 × `gun_bl_6in_26` (149 mm) open mounts; 2 × `tube_14in_above_water` | none (hull only) | armed fast liner for Adriatic/Mediterranean commerce protection/raiding (doctrine template) |

Block coefficients (ESTIMATE, `blockCoeffBp` ×10000): B ≈ 5030 (derived: 3,548 t / (1.025 × 73.2×15.3×6.15));
CA ≈ 5330; CL ≈ 4800; DD ≈ 4400 (game convention; the computed ≈2020 is unreliable at this scale, as in the Russia
note); KE ≈ 4800; AMC ≈ 6200 (game convention, as in the Russia note). All six are ESTIMATE for dimensions,
power and armour; the B shape and the DD's tube fit are grounded in the historical ships named.

> **DD scale note.** The historical III/IV boat is 26.4 m / 27 t — **below** `torpedo_boat_form.lengthMinMm`
> (30,000 mm), so a legal 1880 DD must be scaled (as above) or the form minimum relaxed. The Zara/Spalato torpedo
> ships (838 t, 67.2 m, 350 mm bow tubes, completed 1880/81) are the legal in-service-adjacent alternative if a
> larger torpedo-craft slot is wanted. Surface as a content decision (see §G).

---

# E. Recommendations (concrete profile values, non-normative)

| profile field | AH candidate | basis | label |
| --- | --- | --- | --- |
| `strategicSituation` postures | `[coastal_defence, regional_warfare, torpedo_warfare]` (+ weak `battle_fleet_concentration`) | §A.1 | grounded shape (VERIFIED/SINGLE) |
| `industrialProfile.buildTimeMultiplierBp` | 10400–10900 | small yards, dual-monarchy budget politics | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.costMultiplierBp` | 10500–11000 | small series, imported Krupp guns/early armour | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.machineryReliabilityBp` | 8600 | domestic Pola/STT engines | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.constructionQualityVarianceBp` | 3000 | professional small service | ESTIMATE / **BALANCE TARGET** |
| `industrialProfile.maxPracticalDisplacementKg` (1880/1885/1890) | 7.7M / 7.7M / 8.4M | Custoza 7,609 (largest 1880); Tegetthoff 7,431 | ESTIMATE |
| `industrialProfile.heavyGunProduction` | IMPORTED (Krupp; Škoda later) | [NA86] p. 211; [NP] | grounded |
| `industrialProfile.armourPlateProduction` | IMPORTED (early; Witkowitz later) | [NP] wrought iron; ESTIMATE | ESTIMATE |
| `doctrineProfile.engagementRangeM` | 1500 | short period range (Lissa heritage) | ESTIMATE / grounded shape |
| `doctrineProfile.hePreferenceBp` | 4000 (AP-dominant, black powder) | [TB87] via [PRE] | ESTIMATE / **BALANCE TARGET** |
| `researchPreferences` | TORPEDOES 4, MINES 3, MACHINERY 3, HULL 3, GUNNERY 3, SHIP_DESIGN 3 (see §A.9) | §A.9 | grounded shape / ESTIMATE |
| `componentAccess` | §B (Krupp IMPORTED; Whitehead tubes DOMESTIC; foreign heavies UNAVAILABLE) | §B | grounded shape |
| `gunModels` / `componentVariants` | §C (~13) | §C | mixed per row |
| `designs` | §D (6) | §D | mixed per row; ESTIMATE |
| `namingPolicy` | §F | published names | grounded (SINGLE-SOURCE) |
| `hardCapabilities.maxGunCaliberUm` | 283000 (Tegetthoff 28 cm) | [NP]; [PRE] §3 | SINGLE-SOURCE |
| `hardCapabilities.domesticTorpedoDiameterUm` | 350000 (Whitehead, Fiume) | [NA86] p. 46; [NP] | grounded |
| `hardCapabilities.maxArmourThicknessUm` | 370000 (Tegetthoff belt, 1881) / 230000 in-service Jan 1880 | [NP] | SINGLE-SOURCE |

Keep every cost/build-time modifier inside **±15 %** and label it BALANCE TARGET; ship every ESTIMATE/UNVERIFIED
with its label (the merchant-liner discipline). The proposed multipliers sit at the high (slow/expensive) end of
the band, consistent with a small, import-dependent, politically constrained service.

---

# F. Naming policy

Published 1880s Austro-Hungarian ship names as stems (historical facts; cited to [NP] class pages and [NA86] fleet
notes). Published names for each type:

| type          | convention (one line)                                                                                            | stems (published names)                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **B**         | Habsburg dynastic/imperial titles, archdukes and admirals, plus famous battles (Custoza, Lissa)                    | Kaiser, Erzherzog Albrecht, Custoza, Kaiser Max, Don Juan d'Austria, Prinz Eugen, Tegetthoff, Lissa, Kronprinz Erzherzog Rudolf, Kronprinzessin Erzherzogin Stefanie, Radetzky, Erzherzog Karl |
| **CA**        | Habsburg empress/archduke and patron-saint names                                                                   | Kaiserin und Königin Maria Theresia, Kaiser Karl VI, Sankt Georg                                                                              |
| **CL**        | geographic (Adriatic towns/islands), rivers, animals of prey, admirals                                             | Saïda, Radetzky, Laudon, Donau, Panther, Tiger, Kaiser Franz Joseph I, Zenta, Zrínyi, Novara, Helgoland, Admiral Spaun                          |
| **DD**        | torpedo boats **numbered** (roman numerals); later named after birds/animals and phenomena                         | I, II, III, IV, V, IX, XI, XXVII, XXXIII; Adler, Sperber, Bussard, Natter, Viper, Python, Kaiman; Blitz, Meteor, Planet, Trabant, Satellit, Magnet |
| **KE**        | rivers and small animals/birds (river monitors and gunboats)                                                        | Leitha, Maros, Körös, Temes, Enns, Sava, Stör, Wels; Albatros, Möwe, Kerka, Dalmat                                                   |
| **AMC**       | liner names taken up from trade (Österreichischer Lloyd / Austro-Americana)                                         | (Österreichischer Lloyd / Austro-Americana liner names; no dedicated naval series in-band)                                                    |

All stems are SINGLE-SOURCE (published ship lists, [NP]/[NA86]). A full curated dataset (collision handling, the
Kaiser vs Kaiser Max vs Kaiser Franz Joseph I disambiguation) is content authoring, not research.

---

# G. Deferred (needs an owner or a decision-request)

- **Krupp medium/light gun families.** The AH signature 209/235 mm Krupp BLs (and the 149/87/66 mm guns) have
  **no dedicated shared family**; the catalogue is British-RML/BL- and German-26cm-centric. This note overlays the
  nearest family with a calibre/shell override (RML family carrying a Krupp BL). The orchestrator must confirm
  multiple models per family (one per nation) are legal, or add dedicated families (e.g. `gun_krupp_209mm_l20`).
  Interacts with schema, not balance. **This is the single biggest gap for AH capital-ship armament.**
- **AH shell masses for every gun except the 26 cm and 28 cm** are ESTIMATE (the sources give the bore/model, not
  the projectile weight). A clean Mackinlay Table XVII read, or the Austrian _Marine-Almanach_, would settle them.
- **Moulded depth for every design** — no source gives it (carried over from the earlier notes); depths are ESTIMATE.
- **DD scale.** The historical III/IV torpedo boat (26.4 m / 27 t) is below the `torpedo_boat_form` length minimum
  (30 m); a legal 1880 DD must be scaled or the form minimum relaxed. The Zara/Spalato torpedo ships (838 t, 67 m)
  are the legal alternative. Content decision.
- **Pre-1880 torpedo-boat plant.** The III/IV and Zara used locomotive boilers; the catalogue's
  `locomotive_boiler_tb` is dated 1890. A pre-1880 torpedo-boat plant (or an allowed-date override) is needed for
  a legal 1880 DD starter using one (same gap as the Japan note).
- **Armour-plate production = IMPORTED** is an inference (wrought-iron plates on every in-service ironclad, no
  [NP] evidence of a domestic mill in-band); the **Witkowitz** attribution and its start date were not opened.
  A Conway's Austria-Hungary chapter or a Vítkovice history would settle it.
- **Build-time/cost/reliability/variance multipliers** — BALANCE TARGET (no single sourced AH multiplier); the
  small-yard/import/double-budget shape is grounded but the magnitude is within ±15 %.
- **AH naval budget in kronen** — not opened; the 1886 annual gives £ sterling. ESTIMATE only.
- **`research.yaml` priority conflict** — shipped `GUNNERY: 2, MACHINERY: 2` vs this note's TORPEDOES 4 / GUNNERY 3.
  A content/balance decision, not a fact.
- **CA/CL/KE/AMC are doctrine templates** — the AH had no armoured cruiser (before Maria Theresia 1894) and no
  ocean-station cruisers in 1880; only the B, the cruisers (Radetzky/Saïda) and the torpedo boats/monitors are
  true 1880 ships. Confirm fictional-but-legal starters are acceptable (the existing `reference-designs.yaml`
  already does this for the UK/France/Germany/Italy/Japan/Russia).
- **Naming dataset** — stems listed; a full curated dataset is content authoring, deferred to the spec/implementator.

No `docs/OPEN-ISSUES.md` decision was resolved here.

---

# H. Verdict

**Qualified yes — the AH profile is authorable now, with per-figure labels.**

- **Strongly grounded (read directly):** the *shape* — a small, coast-defence, torpedo-and-mine Adriatic navy with
  a domestic Whitehead torpedo industry at Fiume, a defensive ironclad line, imported Krupp guns and a compact
  professional service — rests on the directly-read [NP] class pages and the directly-read [NA86] (the 1885 fleet
  exercise, the torpedo-manufacture passage, the 1886 estimates and new-construction list).
- **Grounded gun data:** the AH **26 cm** (shell 179.5 kg) and **28 cm** (shell 253.0 kg, charge 56.0 kg,
  penetration 40 cm) Krupp rows come from [TB87] Table XVII via [PRE] §3 (SINGLE-SOURCE); the AH tube bore (350 mm)
  and the Fiume manufacture are VERIFIED as read.
- **What is ESTIMATE/BALANCE TARGET and must be labelled as such:** every multiplier, the max-displacement
  progression, stability/quality variance, all research weights, most shell masses, and the CA/CL/DD-scaled/KE/AMC
  templates. These are gameplay abstractions on a grounded shape.
- **What is genuinely missing:** the Krupp medium-calibre gun families (the signature 209/235/149 mm), AH shell
  masses beyond the two heavies, the Witkowitz plate story, moulded depths and the DD scale. None blocks a first
  profile; each is a labelled deferred item or a decision-request.

Recommendation to the orchestrator: author the profile now with the values in §E; ship every ESTIMATE/UNVERIFIED
figure with its label and a provenance record; keep all multipliers inside ±15 % and labelled BALANCE TARGET; and
raise a decision-request for the Krupp gun families (and the DD scale) before authoring AH capital-ship armament
beyond the 26 cm/28 cm overlays.

## Source list

1. navypedia.org Austro-Hungarian pages, read directly this session: `austrohungary/ah_index.htm`, `ah_bb.htm`,
   `ah_cr.htm`, `ah_dd.htm`, `ah_of.htm`, `ah_bb_kaiser_max.htm`, `ah_bb_kaiser.htm`, `ah_bb_erzherzog_albrecht.htm`,
   `ah_bb_custoza.htm`, `ah_bb_tegetthoff.htm`, `ah_dd_iii.htm`, `ah_dd_zara.htm`, `ah_cr_saida.htm`,
   `ah_cr_radetzky.htm`, `ah_of_leitha.htm`.
2. T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`
   (`NavalAnnual1886_djvu.txt`, read directly): "Notes on the Austrian Navy" pp. 210–211 (Krupp guns, Panther,
   Adler 22.4 kn, torpedo-boat counts); "Exercises of the Austrian Fleet, 1885" p. 145 (night torpedo attack off
   Lissa); torpedo-manufacture passage p. 46 (France "dependent on Austria for our supply"); Austrian Navy
   Estimates pp. 494–495.
3. G. Mackinlay, _Text Book of Gunnery, 1887_ (HMSO), Table XVII (foreign ordnance), via
   `docs/research/ship-building-1880-pre-era-armament.md` §3/§5 (the Austrian 26 cm and 28 cm rows).
4. In-repo companions: `docs/research/ship-building-1880-ships-by-nation.md` §6.3,
   `ship-building-1880-pre-era-armament.md`, `national-naval-profiles-uk-france.md`,
   `national-naval-profiles-germany.md`, `italy-naval-profile.md`, `japan-naval-profile.md`,
   `russia-naval-profile.md`, `docs/ships-nation-orientation.md`;
   `content/production/1880/{countries,possessions,economies,research}.yaml`,
   `content/production/1880/ship-building/{components,plants,hull-forms,balance,naval-profiles,reference-designs}.yaml`.
5. Print works named as leads (not opened this session): Conway's _All the World's Fighting Ships 1860–1905_
   (1979); the Austrian _Marine-Almanach_; A. Roksund, _The Jeune École_ (Brill, 2007); Jane's _Fighting Ships_
   (1898).
