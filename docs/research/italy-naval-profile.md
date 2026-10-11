# Research: national naval profile — Italy (1880–1899)

Companion to `national-naval-profiles-uk-france.md` and `national-naval-profiles-germany.md`; method, source grades and
confidence labels are identical. Every in-repo figure (gun families, plants, hull forms, balance) is reused from the
EARLY-band notes (`ship-building-early-band.md`, `ship-building-1880-*.md`). Captured 2026-10-11.

This is a **research-only** pass: it grounds the canonical `NationNavalProfile` for `italy` (repo id `italy`), the
shared-family national models and six 1880 opening designs. It authors no code, no content YAML and no spec.

## 0. Question

What are the grounded figures and national differentiators needed to author a **date-banded NationNavalProfile
(1880–1899)** for the **Kingdom of Italy** (Regia Marina, founded 1861), plus national component variants overlaid on
the shared catalogue (`content/production/1880/ship-building/components.yaml`) and **six 1880 opening reference
designs** (B, CA, CL, DD, KE, AMC), with research priorities, component access and naming policy?

The existing shipped draft is `content/production/1880/research.yaml` (Italy = `HULL_CONSTRUCTION: 4, GUNNERY: 2`),
`countries.yaml` (`id: italy`) and one historical design, `principe_amedeo_1874` (`reference-designs.yaml`). This note
does **not** author the profile.

## 1. Method, source grades and confidence labels

Every figure carries a named source and one of:

- **VERIFIED** — read directly in a period primary/near-primary text (full text fetched and read), or two independent sources agree.
- **SINGLE-SOURCE** — one source only, or a secondary compilation that itself cites print works (named in the row) which I could not open.
- **DERIVED** — arithmetically derived from a sourced figure.
- **ESTIMATE** — derived by me from other cited figures or an inferred range; not itself a source figure.
- **UNVERIFIED** — no usable source found, or sources conflict; a plausible range is given instead.

**Wikipedia is not cited as a source anywhere.** (Note: the older `p1-1880-torpedo-armament.md` cites Wikipedia; its
Italy rows are re-grounded here from navypedia instead.)

Source grades used:

| Tag    | Source                                                                                                                                                                                                                          | Grade / reach                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [NP]   | navypedia.org class pages (Ivan Gogin) — built principally on Conway's _All the World's Fighting Ships 1860–1905_ + national histories. **Fetched directly this session** (`italy/it_bb_*.htm`, `it_cr_*.htm`, `it_dd_*.htm`, `it_of_*.htm`). | Secondary compilation → SINGLE-SOURCE.                                                 |
| [NA86] | T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org id `navalannual1886`, full text `NavalAnnual1886_djvu.txt` (1.27 MB) **read directly this session** (Italian estimates pp. 496–499; comparative strength; armour pp. 298–311; guns pp. 346–355; Spezia trials). | Contemporary annual = period near-primary. **Read directly → VERIFIED for figures actually read.** |
| [B82]  | T. A. Brassey, _The British Navy, vol. II_ (1882), `britishnavyitss04brasgoog`, p. 95 gun-cost table (via the pre-era armament note).                                                                                              | Primary (contemporary).                                                                |
| [TB87] | G. Mackinlay, _Text Book of Gunnery, 1887_ (HMSO), Tables XVI/XVII (via `ship-building-1880-pre-era-armament.md`).                                                                                                                  | Primary service manual; used at second hand here.                                      |
| [NP-era] | `docs/research/ship-building-1880-ships-by-nation.md` §6.1 (Principe Amedeo) and `ship-building-1880-pre-era-armament.md` §5 (RML catalogue values). **In-repo, already grounded.**                                              | Reused; confidence as carried in those notes.                                          |
| [CW]   | Conway's _All the World's Fighting Ships 1860–1905_ (1979). **Not opened this session.**                                                                                                                                           | Print secondary; SINGLE-SOURCE (relayed) only where navypedia is the relay.            |

Limits: [CW] was not opened online; navypedia was read directly. Moulded depth is still not available for any Italian
ship (UNVERIFIED). Where a figure could not be grounded, an explicit labelled ESTIMATE is given rather than a point value.

Conversions: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 ihp = 0.7457 kW; 1 kn = 0.5144 m/s.

---

# A. National naval profile (1880–1899)

## A.1 Strategic posture

| posture                        | justification (one line)                                                                                                                         | source                                | confidence    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------- |
| coastal defence                | Italy's two long coasts + islands and the two-sea (Tyrrhenian + Adriatic) problem; `countries.yaml` lists `coastal_defense`.                        | `countries.yaml` `doctrine.schools`   | VERIFIED (in-repo content) |
| regional warfare (Mediterranean) | A young Mediterranean power whose navy exists for the Mare Nostrum: fleet-in-being, local superiority, deterrence of France and Austria-Hungary. | `countries.yaml`; [NA86] pp. 20, 54   | SINGLE-SOURCE |
| battle-fleet concentration     | A small but ambitious battle line: Brin's Duilio (10,962 t) and Italia (13,678 t) were the world's largest warships in the mid-1880s.             | [NP] Duilio/Italia; [NA86] p. 20      | SINGLE-SOURCE |
| torpedo warfare                | Duilio carried 3 × 350 mm tubes and Italia 4; Brin's large ships were designed around the torpedo threat, and Italy ordered torpedo boats from 1881. | [NP] Duilio/Italia; [NA86] p. 54      | SINGLE-SOURCE |
| colonial presence (weak)       | Aspiration, not yet fact: Italy held only the Tyrrhenian and Adriatic coastal areas in 1880 (Assab 1882, Massawa 1885).                          | `possessions.yaml`; `countries.yaml`  | VERIFIED (in-repo content) |

**Recommended primary postures: `coastal_defence` + `regional_warfare`**, with `battle_fleet_concentration` and
`torpedo_warfare` co-equal and `colonial_presence` a weak fifth. `commerce_raiding`, `commerce_defence` and
`distant_water_operations` are **not** Italian postures in 1880 (Italy had no ocean-station empire and a small
merchant marine). This differs from the shipped draft (none authored yet) and is the grounded shape.

## A.2 Industrial capability

| item                             | figure                                                                                                              | unit       | source                                | confidence        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------- | ----------------- |
| Navy estimates (1873 → 1886)     | £1,211,780 (1873) → £2,475,070 (1886-87 ordinary); total ordinary+extraordinary 1886-87 £3,212,593; 1885-86 £3,188,977 | £          | [NA86] Italian estimates pp. 496, 499 | VERIFIED          |
| Ten-year programme overrun        | programme 1877–1887 originally £5,840,000; by 1882 already £1,981,812 **over** (~34 %)                               | £          | [NA86] p. 54                          | VERIFIED          |
| Fleet value (1886)               | £7,800,000; ordnance stores £3,480,000                                                                               | £          | [NA86] p. 497                         | VERIFIED          |
| Shipbuilding base                | state yards **Castellamare di Stabia, La Spezia, Venezia**; private **Orlando (Livorno), Ansaldo (Sampierdarena)**   | —          | [NP] yard fields; [NA86] p. 497       | SINGLE-SOURCE     |
| Heavy-gun production             | **imported from Armstrong/Elswick** in this band: 100-ton ML (Duilio/Dandolo), 100-ton BL (Italia), 105-ton BL (Lauria/Doria/Morosini), 343 mm (Re Umberto). Krupp supplied 119-ton coast guns for Spezia. Ansaldo/Italian works later. | —          | [NA86] pp. 346–348; [NP] Re Umberto   | SINGLE-SOURCE     |
| Armour-plate production          | **imported early** (Duilio's belt was **Creusot steel**); the **Spezia plate trials 1882–86** pitted steel against compound, and Italy's minister of marine defended **compound** armour. **Terni Steelworks founded 1884** → domestic licence-built plate from the mid-1880s. | —          | [NA86] pp. 302, 308–311; [NP] Duilio  | SINGLE-SOURCE     |
| Build-time multiplier            | **slower** than the 1894 baseline: Principe Amedeo took 9–10 years keel-to-completion; Re Umberto laid 1884, completed 1893. Propose **10800 bp**. | ×          | [NP] Principe Amedeo, Re Umberto      | ESTIMATE / **BALANCE TARGET** |
| Cost multiplier                  | **higher**: the 1877–87 programme overran its estimate ~34 %; small series, state yards, imported guns/armour. Propose **10900 bp**. | ×          | [NA86] p. 54                          | ESTIMATE / **BALANCE TARGET** |
| Max practical displacement (1880/1885/1890) | ~11,000 t / ~13,700 t / ~14,000 t                                                                            | t          | [NP] Duilio 10,962; Italia 13,678; Re Umberto 13,673 | ESTIMATE (from completed classes) |
| Machinery reliability            | compound/HSE + cylindrical boilers; Re Umberto later VTE. Lower bar than the RN: small-series, partly imported machinery, slow completion. Propose **8000 bp**. | —          | [NP]; plants.yaml (TE 9000)           | ESTIMATE / **BALANCE TARGET** |
| Construction-quality variance    | moderate–high: 9–10-year builds, weight growth, the **8 March 1880 Duilio 100-ton gun explosion** (double-loading) shaking public opinion against big ships. Propose **3500 bp**. | —          | [NP] Principe Amedeo, Ruggiero di Lauria | ESTIMATE / **BALANCE TARGET** |

The 1886 return of ships in course of construction [NA86] p. 497 (grounded): armoured — Lepanto 18,550 t, Re Umberto /
Sicilia / Sardegna 13,251–13,298 t, Lauria / Morosini / Doria 11,000 t; unarmoured — Etna/Vesuvio/Stromboli 3,530 t
deck-protected cruisers, Fieramosca 3,745 t, Tripoli/Goito 741 t, Folgore/Saetta 317 t torpedo vessels, plus 28
first-class torpedo boats.

## A.3 Gunnery doctrine

| field                         | Italy position                                                                                              | source                                | confidence    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------- |
| preferred engagement distance | **short** (~1,500 m): the period's decisive close action, ram and torpedo range; Italy's big guns were hand-worked RMLs/BLs. | [NA86] pp. 346–348; period fact      | SINGLE-SOURCE |
| main-gun emphasis             | **very strong**: 100-ton 450 mm (Duilio), 100-ton 432 mm (Italia), 105-ton (Lauria) — the largest afloat, all **Armstrong/Elswick imports** | [NP]; [NA86] pp. 346–348             | SINGLE-SOURCE |
| secondary-battery emphasis    | moderate: 149/152 mm, 120 mm, 75 mm Uchatius and 164 mm Palliser on the older ships                         | [NP] Italia, Caracciolo, Barbarigo    | SINGLE-SOURCE |
| gun-quality priorities        | raw power and prestige over standardisation; dependence on one foreign supplier (Elswick)                    | [NA86] pp. 346–348                    | SINGLE-SOURCE |
| AP-vs-HE preference           | **AP-dominant**: Palliser armour-piercing shot was the standard Italian projectile; the 100-ton gun's hard-iron projectiles broke up on steel-faced plate. | [TB87] Table XVI; [NA86] p. 478       | SINGLE-SOURCE |
| fire-control research priority | low in-band; rangefinders later                                                                             | ESTIMATE                              | ESTIMATE      |
| rate-of-fire preference       | low: the 100-ton gun fired ~1 round / 6 min (0.17/min)                                                       | [NP-era] (via [TB87]/[WP])            | SINGLE-SOURCE |

## A.4 Protection doctrine

| field                         | Italy position                                                                                                     | source                       | confidence    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ------------- |
| belt vs protected deck        | **Brin's spectrum**: Principe Amedeo (complete 220 mm iron belt) → Duilio (Creusot steel belt 550 mm) → Italia/Re Umberto (**no belt at all**, cellular raft + 100 mm deck) | [NP] Principe Amedeo/Duilio/Italia/Re Umberto | SINGLE-SOURCE |
| armour coverage               | early ships belt + battery; the Brin ships traded belt for speed and a **cellular waterline raft**                 | [NA86] pp. 250–252; [NP]     | SINGLE-SOURCE |
| secondary-battery protection  | casemates (Principe Amedeo), barbettes/citadel (Lauria); Italia had 480 mm internal citadel armour               | [NP]                          | SINGLE-SOURCE |
| conning-tower                | fitted; modest (Principe Amedeo 60 mm; Duilio citadel 430 mm)                                                       | [NP]                          | SINGLE-SOURCE |
| stability margin              | **narrow** — Brin's huge, lightly-armoured ships drew criticism (the French Admiral Jauréguiberry and Italian officers objected to "excessive concentration of responsibility" in a few large ships) | [NA86] pp. 54, 250–252        | SINGLE-SOURCE |
| survivability-vs-speed        | **speed first** on Brin's large ships (Italia 17.8 kn, Re Umberto 18.2–20.3 kn); protection sacrificed for speed and gun power | [NP] Italia/Re Umberto        | SINGLE-SOURCE |

## A.5 Propulsion doctrine

| field                    | Italy position                                                                                          | source                 | confidence    |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------- | ------------- |
| preferred speed margin   | **high**: Duilio 15 kn (1880), Italia 17.8 kn (1885), Re Umberto 18.2–20.3 kn (1893–95)                   | [NP]                   | SINGLE-SOURCE |
| machinery type           | vertical compound (VC/HSE) + cylindrical boilers; VTE later (Sardegna 1893); no early water-tube        | [NP]                   | SINGLE-SOURCE |
| reliability tolerance    | moderate; long build times and weight growth accepted                                                    | [NP]; [NA86] p. 54     | SINGLE-SOURCE |
| coal endurance           | Duilio 1,000 t / 3,760 nmi @10; Italia 3,000 t / 5,000 nmi @10 (Italy's large ships had long legs)       | [NP]                   | SINGLE-SOURCE |
| forced-draught acceptance | accepted on torpedo craft; capital ships natural draught                                                | [NP]                   | SINGLE-SOURCE |
| domestic vs imported     | **guns and armour imported early** (Elswick/Creusot), machinery partly domestic; torpedoes imported (Whitehead) | [NA86]; [NP]    | SINGLE-SOURCE |

## A.6 Torpedo doctrine

| field                            | Italy position                                                                                   | source            | confidence    |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------- | ------------- |
| torpedo priority                 | **high** for a battle-line navy: Brin's big ships were designed around the torpedo threat and carried tubes | [NP] Duilio/Italia; [NA86] p. 54 | SINGLE-SOURCE |
| preferred tube count             | Duilio 3 × 350 mm (1 bow, 2 beam); Italia 4 × 350 mm (1 bow, 2 beam, 1 stern)                     | [NP]              | SINGLE-SOURCE |
| above-water vs submerged         | both: beam above-water carriages and bow/stern tubes                                             | [NP]              | SINGLE-SOURCE |
| use on cruisers / capital ships  | both; the dispatch vessels (Barbarigo, Staffetta) each carried 1 × 350 mm beam tube               | [NP]              | SINGLE-SOURCE |
| torpedo-boat procurement         | **rising** but late: Italy's first purpose-built TB is Nibbio (1881, Thornycroft), so **none in service Jan 1880**; the 1886 programme had 28 first-class TBs + Tripoli/Goito/Folgore/Saetta | [NP] Nibbio; [NA86] p. 497 | SINGLE-SOURCE |

## A.7 Global obligations

| field                        | Italy position                                                                    | source                       | confidence    |
| ---------------------------- | --------------------------------------------------------------------------------- | ---------------------------- | ------------- |
| foreign-station tonnage      | **low** — regional Mediterranean navy, no ocean-station empire                     | `countries.yaml`; [NA86] p. 20 | VERIFIED (in-repo) |
| endurance requirements       | moderate; Italy's big ships carried 1,000–3,000 t coal for Mediterranean cruising  | [NP]                         | SINGLE-SOURCE |
| accommodation requirements   | modest; Brin's Italia could carry an infantry division (10,000 men)                | [NP] Italia                  | SINGLE-SOURCE |
| colonial-service capability  | nascent; gunboats for the Red Sea/Adriatic (Guardiano, Scilla)                     | [NP] gunboats                 | SINGLE-SOURCE |
| number of overseas regions   | 0 in 1880 (only Tyrrhenian + Adriatic coastal areas); Assab 1882, Massawa 1885     | `possessions.yaml`           | VERIFIED (in-repo) |

## A.8 Risk tolerance

| field                         | Italy position                                                                   | source                    | confidence    |
| ----------------------------- | -------------------------------------------------------------------------------- | ------------------------- | ------------- |
| unproven components           | **high willingness** on hull form and armament (Brin's radical Italia/Re Umberto) | [NP]; [NA86] pp. 250–252  | SINGLE-SOURCE |
| minimum reliability           | lower bar; long build times and weight growth accepted                            | [NA86] p. 54              | SINGLE-SOURCE |
| acceptable stability margin   | narrower; criticism of the huge lightly-armoured ships                            | [NA86] pp. 54, 250–252    | SINGLE-SOURCE |
| overweight tolerance          | higher (programme overran its estimate ~34 %)                                     | [NA86] p. 54              | VERIFIED      |
| preferred tech maturity       | leading-edge on design, dependent on imports for guns/armour                     | [NA86] pp. 346–348        | SINGLE-SOURCE |
| refit frequency               | moderate (Duilio 1890 + 3 × 120/40; Dandolo rebuilt 1895–98)                      | [NP] Duilio               | SINGLE-SOURCE |

## A.9 Research preferences (canonical fields)

Shipped draft: `research.yaml` Italy = `HULL_CONSTRUCTION: 4, GUNNERY: 2`. Grounded recommendation (priority 1–4):

| field              | priority | justification                                                                   | source                  | confidence    |
| ------------------ | -------- | ------------------------------------------------------------------------------- | ----------------------- | ------------- |
| GUNNERY            | 4        | the world's largest guns (100–105-ton Armstrong) are Italy's signature           | [NA86] pp. 346–348; [NP] | SINGLE-SOURCE |
| TORPEDOES          | 4        | Brin's ships designed around the torpedo; early tube armament; TB programme      | [NP]; [NA86] p. 54      | SINGLE-SOURCE |
| HULL_CONSTRUCTION  | 3        | Brin's cellular raft, all-steel hulls, huge light hulls (the shipped draft's 4 is defensible) | [NP] Italia/Re Umberto | SINGLE-SOURCE |
| MACHINERY          | 3        | high speed (17.8–20.3 kn) on compound/VTE plant                                   | [NP]                    | SINGLE-SOURCE |
| SHIP_DESIGN        | 3        | Brin's innovative, controversial designs                                          | [NP]; [NA86] pp. 250–252 | SINGLE-SOURCE |
| INFRASTRUCTURE     | 2        | Taranto arsenal, Spezia dry dock (both in the 1886 estimates)                     | [NA86] p. 496           | SINGLE-SOURCE |
| DAMAGE_CONTROL     | 2        | extensive watertight subdivision / cellular raft                                 | [NP] Duilio/Italia      | SINGLE-SOURCE |
| MINES_AND_ASW      | 2        | torpedo/coast-defence flotilla doctrine                                           | [NA86] p. 54            | SINGLE-SOURCE |
| FIRE_CONTROL       | 1        | not prioritised in-band                                                           | ESTIMATE                | ESTIMATE      |
| SUBMARINES         | 1        | no in-band Italian submarine (first boats 1890s)                                  | [CW] relayed            | SINGLE-SOURCE |

> Reconciliation note: the shipped `research.yaml` gives `HULL_CONSTRUCTION: 4, GUNNERY: 2`. The grounded reading puts
> **GUNNERY** at 4 (the giant imported Armstrong guns are the national signature) and **HULL_CONSTRUCTION** at 3–4
> (Brin's hull innovation). The difference is a **BALANCE TARGET / content decision** for the orchestrator, not a fact
> this note can settle.

---

# B. Component access (shared families)

Status ∈ DOMESTIC | LICENSE_BUILT | IMPORTED | CAPTURED_OR_STUDIED | UNAVAILABLE. The catalogue's gun families are
British RMLs/BLs, the French 27 cm and the German 26 cm; Italy's own signature heavies (450/432 mm Armstrong) are **not
in the catalogue** (a gap, §F).

| family id                        | status         | producer / note                                                                 | source                       | confidence    |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------- | ---------------------------- | ------------- |
| gun_rml_16in_80ton               | UNAVAILABLE    | British 80-ton; Italy used the 450 mm 100-ton (not in catalogue)                 | [NP] Duilio                  | SINGLE-SOURCE |
| gun_rml_125in_38ton              | UNAVAILABLE    | British                                                                          | —                            | SINGLE-SOURCE |
| gun_rml_12in_35ton               | UNAVAILABLE    | British                                                                          | —                            | SINGLE-SOURCE |
| gun_rml_12in_25ton               | UNAVAILABLE    | British                                                                          | —                            | SINGLE-SOURCE |
| gun_rml_11in_25ton               | IMPORTED       | **Armstrong 25-ton RML** — main gun of Principe Amedeo / Palestro                 | [NP] Principe Amedeo         | SINGLE-SOURCE |
| gun_rml_10in_18ton               | IMPORTED       | **Armstrong 18-ton RML No.1** — Principe Amedeo                                  | [NP] Principe Amedeo         | SINGLE-SOURCE |
| gun_rml_10in_18ton_broadside     | IMPORTED       | same gun in the central casemate                                                 | [NP] Principe Amedeo         | SINGLE-SOURCE |
| gun_rml_8in_9ton                 | IMPORTED       | Armstrong 203 mm RML on older Italian ironclads (proxy; LOW)                     | [NA86] comparative tables    | UNVERIFIED    |
| gun_rml_7in_7ton                 | UNAVAILABLE    | no grounded Italian use                                                          | —                            | UNVERIFIED    |
| gun_rml_64pdr_71cwt              | IMPORTED       | Armstrong 160 mm / 164 mm Palliser class light battery (proxy; LOW)              | [NP] Caracciolo (164/17)     | SINGLE-SOURCE |
| gun_bl_274mm_m1875               | UNAVAILABLE    | French signature heavy                                                           | —                            | SINGLE-SOURCE |
| gun_bl_263mm_rkl20               | UNAVAILABLE    | German signature heavy (Krupp 26 cm)                                             | —                            | SINGLE-SOURCE |
| gun_bl_12in_25                   | UNAVAILABLE    | British                                                                          | —                            | SINGLE-SOURCE |
| gun_bl_135in_30                  | UNAVAILABLE    | British family — **but see §F**: Re Umberto's 343/30 was an imported Armstrong of the same calibre | [NP] Re Umberto | SINGLE-SOURCE |
| gun_bl_12in_35                   | UNAVAILABLE    | British                                                                          | —                            | SINGLE-SOURCE |
| gun_bl_10in_32                   | UNAVAILABLE    | British family — Italy's 254/40 (Dandolo 1898) is the same calibre; import, later | [NP] Duilio                  | SINGLE-SOURCE |
| gun_bl_92in_315                  | UNAVAILABLE    | British                                                                          | —                            | SINGLE-SOURCE |
| gun_bl_6in_26                    | UNAVAILABLE    | British; Italy used the 152/40 Armstrong QF instead (see below)                   | [NP] Re Umberto              | SINGLE-SOURCE |
| gun_qf_6in_40                    | IMPORTED       | **Armstrong 152/40 QF (A91)** — Re Umberto, Sicilia, Sardegna (1893–95)           | [NP] Re Umberto              | SINGLE-SOURCE |
| gun_qf_47in                      | IMPORTED       | **Armstrong 120/40 QF (A91)**                                                     | [NP] Re Umberto, Duilio      | SINGLE-SOURCE |
| gun_qf_12pdr                     | IMPORTED       | **Armstrong 76/40 (12-pdr)**                                                      | [NP] Re Umberto              | SINGLE-SOURCE |
| gun_qf_6pdr                      | IMPORTED       | **Nordenfelt 57/43**                                                              | [NP] Re Umberto              | SINGLE-SOURCE |
| gun_hotchkiss_3pdr               | IMPORTED       | **Hotchkiss 37 mm** — used heavily on Italian ships                               | [NP] Re Umberto, Guardiano   | SINGLE-SOURCE |
| gun_nordenfelt_1in               | IMPORTED       | **Nordenfelt 1-in** machine gun                                                   | [NP] Italia                  | SINGLE-SOURCE |
| gun_maxim_303                    | IMPORTED       | Maxim; 1890s                                                                      | —                            | UNVERIFIED    |
| tube_14in_above_water            | IMPORTED       | **Whitehead 350 mm** above-water beam (Italy's bore is 350 mm, not 356)           | [NP] Duilio/Italia           | SINGLE-SOURCE |
| tube_14in_submerged              | IMPORTED       | **Whitehead 350 mm** submerged bow/stern                                          | [NP] Duilio/Italia           | SINGLE-SOURCE |

---

# C. National component variants (gunModels + componentVariants)

Each row overlays one shared family with an Italian national designation, a sourced shell mass/parameters and a
`mounts` list. Shell/charge/MV from [TB87]/[B86] for the RMLs; from navypedia designations and calibre for the 1890s
guns (the exact shell mass for the QF family is the family's own catalogue value, which is the British Elswick-pattern
gun Italy bought).

| family id (components.yaml) | IT national model | fields / values | mounts | source | confidence |
| --------------------------- | ----------------- | --------------- | ------ | ------ | ---------- |
| `gun_rml_11in_25ton` | **Armstrong 25-ton RML (279 mm)** (Principe Amedeo/Palestro) | shell 246 kg; charge 38.6 kg P; MV 414 m/s; ROF ~0.3 | CASEMATE, TURRET, BARBETTE | [TB87]/[B86]; [NP] Principe Amedeo | SINGLE-SOURCE |
| `gun_rml_10in_18ton` | **Armstrong 18-ton RML No.1 (254 mm)** (Principe Amedeo) | shell 181 kg; charge 31.8 kg P; MV 420 m/s; ROF ~0.4 | CASEMATE, TURRET | [TB87]/[B86]; [NP] | SINGLE-SOURCE |
| `gun_rml_10in_18ton_broadside` | same gun in the central casemate | as above; SECONDARY role | BROADSIDE_BATTERY | [TB87]; [NP] | SINGLE-SOURCE |
| `gun_rml_8in_9ton` | **Armstrong 203 mm RML** (older ironclads, proxy) | shell 79 kg; charge 15.9 kg P; MV 422 m/s | BROADSIDE_BATTERY, DECK_OPEN | [TB87]; [NA86] | UNVERIFIED (Italian use not directly read) |
| `gun_rml_64pdr_71cwt` | **Armstrong 160 mm / 164 mm Palliser light RML** (proxy) | shell 29 kg; charge 3.6 kg black; MV 375 m/s | BROADSIDE_BATTERY, DECK_OPEN | [TB87]; [NP] Caracciolo | SINGLE-SOURCE |
| `gun_bl_10in_32` | **Armstrong 254/40 BL** (Dandolo 1898 rebuild) | shell 227 kg (family value); mounts turret | TURRET | [NP] Duilio | SINGLE-SOURCE |
| `gun_qf_6in_40` | **Armstrong 152/40 QF (A91)** (Re Umberto) | shell 45.4 kg; MV ~700 m/s; ROF ~5 | DECK_SHIELDED, CASEMATE, TURRET | [NP] Re Umberto | SINGLE-SOURCE |
| `gun_qf_47in` | **Armstrong 120/40 QF (A91)** | shell 20.4 kg; ROF ~5–6 | DECK_SHIELDED, DECK_OPEN | [NP] Duilio/Re Umberto | SINGLE-SOURCE |
| `gun_qf_12pdr` | **Armstrong 76/40 (12-pdr)** | shell 5.67 kg; ROF ~15 | DECK_OPEN, DECK_SHIELDED | [NP] Re Umberto | SINGLE-SOURCE |
| `gun_qf_6pdr` | **Nordenfelt 57/43 (6-pdr)** | shell 2.72 kg; ROF ~20 | DECK_OPEN | [NP] Re Umberto | SINGLE-SOURCE |
| `gun_hotchkiss_3pdr` | **Hotchkiss 37 mm (1-pdr) / 3-pdr 47 mm** | shell 1.5 kg (3-pdr); ROF ~20 | DECK_OPEN | [NP] Re Umberto, Guardiano | SINGLE-SOURCE |
| `gun_nordenfelt_1in` | **Nordenfelt 1-in 4-barrel** | bullet 206 g; ROF ~200 | DECK_OPEN | [NP] Italia | SINGLE-SOURCE |
| `tube_14in_above_water` | **Whitehead 350 mm, above-water beam** | bore 350 mm (not 356); Duilio 3, Italia 4 | — (torpedoMount ABOVE_WATER_TRAINABLE) | [NP] Duilio/Italia | SINGLE-SOURCE |
| `tube_14in_submerged` | **Whitehead 350 mm, submerged bow/stern** | bore 350 mm | — (UNDERWATER_FIXED) | [NP] Duilio/Italia | SINGLE-SOURCE |

The two torpedo-tube variants carry the family's own mass/geometry; only the designation and bore note differ (the
catalogue's 356 mm model is a recorded approximation, exactly as the UK/France note does for the French 350/380 mm).

---

# D. Six 1880 opening reference designs (doctrine templates)

Each is a legal 1880-01 starting point, not a historical reconstruction. Dimensions/power are ESTIMATES tuned to
compile under the 1880 catalogue; the **shape** is grounded in Italian practice (small, fast, lightly armoured,
gun-heavy, torpedo-armed). Moulded depth is UNVERIFIED for every Italian ship. Plant ids from `plants.yaml`; the only
1880 plant is `compound_cylindrical` (min 300 kW).

| type | shape / inspiration | hull form | L×B×T (mm) | depth (mm) | target disp (kg) | plant / kW | fuel (kg) | main / secondary | armour | doctrine note |
| ---- | ------------------- | --------- | ---------- | ---------- | ---------------- | ---------- | --------- | ---------------- | ------ | ------------- |
| **B** | Principe Amedeo central-battery ironclad (historical, 5,761 t) | coast_defence_form | 79,700 × 17,400 × 7,900 | 9,500 | 5,761,000 | compound_cylindrical / 5,200 | 580,000 | 1 × `gun_rml_11in_25ton` fwd; 3+3 × `gun_rml_10in_18ton_broadside` | belt 220 mm wrought iron; battery 140; magazine box 220; no deck | small, fast, gun-heavy Mediterranean battle line |
| **CA** | Brin fast/lightly-armoured lineage (Marco Polo/Vettor Pisani, 1890s) | protected_cruiser_form | 100,000 × 15,000 × 6,100 | 8,500 | 4,900,000 | compound_cylindrical / 7,800 | 680,000 | 1+1 × `gun_rml_10in_18ton` (fwd/aft); 3+3 × `gun_rml_64pdr_71cwt`; 2 × `tube_14in_above_water` | belt 102 mm wrought iron; deck 38; magazine box 127 | fast, lightly-armoured cruiser with heavy guns and torpedoes |
| **CL** | Agostino Barbarigo / Staffetta steel dispatch vessel (1879) | protected_cruiser_form | 85,000 × 12,000 × 4,200 | 7,000 | 2,200,000 | compound_cylindrical / 2,300 | 300,000 | 5+5 × `gun_rml_64pdr_71cwt`; 2 × `tube_14in_above_water` | none | fast steel scout/dispatch cruiser, torpedo-armed |
| **DD** | Nibbio (1881, Thornycroft) first Italian torpedo boat | torpedo_boat_form | 40,000 × 4,500 × 1,600 | 3,000 | 200,000 | compound_cylindrical / 1,200 | 40,000 | 2 × `tube_14in_above_water`; 2 × `gun_nordenfelt_1in` | none | small, fast torpedo craft; Italian torpedo emphasis |
| **KE** | Guardiano/Sentinella iron gunboat (1874) / colonial sloop | coast_defence_form | 50,000 × 8,500 × 2,400 | 4,500 | 600,000 | compound_cylindrical / 700 | 90,000 | 4 × `gun_rml_64pdr_71cwt`; 2 × `gun_nordenfelt_1in` | none | colonial/coastal gunboat for the Adriatic and Red Sea stations |
| **AMC** | Italian fast liner taken up from trade | merchant_liner_form | 115,000 × 14,000 × 3,500 | 8,000 | 3,500,000 | compound_cylindrical / 2,600 | 900,000 | 4 × `gun_rml_64pdr_71cwt` open mounts; 2 × `tube_14in_above_water` | none | armed fast liner for commerce protection/raiding |

All six are ESTIMATE (dimensions, power, armour are gameplay shapes); the armament families and the B shape are
grounded in the historical ships named. The B starter deliberately mirrors the shipped `principe_amedeo_1874`
reference design so the two agree.

---

# E. Naming policy

Published 1880s Italian ship names (historical facts; cited to [NP] class pages and [NA86] fleet lists).

| type          | convention                                                                                                   | stems (published names)                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| battleship    | national/royal and heroic names — the Brin battleship names, kings, medieval admirals/condottieri            | Duilio, Dandolo, Italia, Lepanto, Ruggiero di Lauria, Francesco Morosini, Andrea Doria, Re Umberto, Sicilia, Sardegna, Principe Amedeo, Palestro |
| armoured cruiser | explorers, admirals, condottieri and cities                                                              | Marco Polo, Vettor Pisani, Giuseppe Garibaldi, Carlo Alberto, Varese, Ferruccio, San Giorgio, Pisa                    |
| protected/light cruiser | geographical names (regions, islands, volcanoes) and colonial battle-honours                          | Giovanni Bausan, Etna, Vesuvio, Stromboli, Dogali, Piemonte, Umbria, Lombardia, Etruria, Liguria                     |
| destroyer / TB | birds of prey, then stars/constellations (the Aldebaran groups)                                              | Nibbio, Avvoltoio, Sparviero, Aquila, Clio, Aldebaran, Vega, Procione, Arturo, Euterpe                               |
| gunboat / sloop | mythological/geographic sentinel names                                                                       | Guardiano, Sentinella, Scilla, Cariddi, Vedetta, Governolo                                                            |
| armed merchant cruiser | provincial/city and liner names taken up from trade                                                   | Duca di Galliera, Città di Torino, Sirio, Liguria, Lombardia                                                          |

All stems are SINGLE-SOURCE (published ship lists, [NP]/[NA86]). A full curated dataset (collision handling, the
`Principe Amedeo` vs `Caio Duilio` disambiguation) is content authoring, not research.

---

# F. Deferred (needs an owner or a decision-request)

- **The 100-ton 450 mm Armstrong gun is not in the catalogue.** Italy's signature heavy (Duilio/Dandolo 2 × 2 450/20
  Armstrong 100-ton MLR; Italia 432/26) has no shared family. A variant cannot be overlaid on a different calibre. A
  new family (e.g. `gun_rml_450mm_100ton`) or a decision to leave it unauthorable is needed. **This is the single
  biggest gap** for an Italian 1880 profile.
- **`gun_bl_135in_30` tension.** The brief directs UNAVAILABLE, and this note follows that. But the Re Umberto class
  (laid 1884, completed 1893–95) mounted **imported Armstrong 343 mm (13.5-in) BL guns** — the same calibre family. If
  the profile is extended to the 1890s, `gun_bl_135in_30` could legitimately become IMPORTED for Italy. Surface as a
  decision.
- **`gun_bl_10in_32` tension.** The Dandolo's 1895–98 rebuild mounted 2 × 2 Armstrong 254/40 BL — the same calibre as
  the British 10-in/32 family. Marked UNAVAILABLE per the brief's "other nations' signature heavies"; a 1890s Italian
  import variant is defensible.
- **Moulded depth for every design** — no source gives it (carried over from the earlier notes). Hull weight/cost depend
  on it; until a source or a documented convention is agreed, depths are ESTIMATE.
- **`research.yaml` priority conflict** — shipped `HULL_CONSTRUCTION: 4, GUNNERY: 2` vs this note's GUNNERY 4. A
  content/balance decision, not a fact.
- **Italian naval budgets in lira** — the 1886 annual gives £ sterling; a lira figure and the exchange rate were not
  opened (Italian _Bilancio_ / _Annuario_). ESTIMATE only.
- **Build-time/cost/reliability/variance multipliers** — BALANCE TARGET (no single sourced Italian multiplier); the
  1877–87 overrun is a VERIFIED anchor but the game multiplier is within ±15 %.
- **KE and AMC are doctrine templates** — no 1880 Italian hull is a true KE/AMC except the historical gunboats and
  armed liners named. Confirm with the orchestrator that fictional-but-legal starters are acceptable (the existing
  `reference-designs.yaml` already does this for the UK/France).
- **Naming dataset** — stems listed; a full curated dataset is content authoring, deferred to the spec/implementator.

No `docs/OPEN-ISSUES.md` decision was resolved here.

---

# G. Verdict

**Qualified yes — the Italian profile is authorable now, with per-figure labels.**

- **Strongly grounded:** the *shape* of the nation (young Mediterranean power, coastal/regional posture, small but
  ambitious Brin battle line, speed-and-gun over armour, torpedo emphasis, imported guns/armour, slow/expensive yards)
  rests on the directly-read navypedia class pages and the 1886 Brassey annual. The 1886 estimates, the fleet in
  construction, the 1877–87 programme overrun, the Spezia armour trials and the Elswick gun dependence are all VERIFIED
  from the annual.
- **The national component models are grounded gun-by-gun:** the Principe Amedeo Armstrong RMLs are the catalogue's own
  `gun_rml_11in_25ton`/`gun_rml_10in_18ton`; the 1890s Armstrong QFs (152/40, 120/40, 76/40, 57/43, 37 mm) are
  SINGLE-SOURCE from navypedia designations.
- **What is ESTIMATE/BALANCE TARGET and must be labelled as such:** every cost/build-time/reliability/variance
  multiplier, the max-displacement progression, the stability margins, AI weights, and the fictional CA/CL/DD/KE/AMC
  templates.
- **What is genuinely missing:** the 450 mm 100-ton family (the signature gun), moulded depths, lira budgets, and the
  exact canonical research-field enum. The 450 mm gap is the one that materially limits an 1880 Italian capital ship.

Recommendation to the orchestrator: author the profile now with the values in §A and the access/variant tables in
§B–C; ship every ESTIMATE/UNVERIFIED figure with its label and a provenance record; keep all multipliers inside ±15 %
and labelled BALANCE TARGET; and raise a decision-request for the 450 mm family and the `gun_bl_135in_30` /
`gun_bl_10in_32` import question before authoring Italian capital-ship armament beyond the Principe Amedeo shape.

## Source list

1. navypedia.org (read directly this session): `italy/it_bb_principe_amedeo.htm`, `it_bb_duilio80.htm`,
   `it_bb_italia.htm`, `it_bb_ruggiero_di_lauria.htm`, `it_bb_re_umberto.htm`, `it_cr.htm`, `it_cr_staffetta.htm`,
   `it_cr_barbarigo.htm`, `it_cr_caracciolo.htm`, `it_dd.htm`, `it_dd_nibbio.htm`, `it_of.htm`, `it_of_guardiano.htm`.
2. T. A. Brassey (ed.), _The Naval Annual 1886_, archive.org id `navalannual1886` (full text
   `NavalAnnual1886_djvu.txt`, read directly): Italian estimates pp. 496–499; comparative strength pp. 20–21, 54;
   armour/Spezia pp. 298–311; guns pp. 346–348.
3. T. A. Brassey, _The British Navy, vol. II_ (1882) — `britishnavyitss04brasgoog` p. 95 (gun costs), via
   `ship-building-1880-pre-era-armament.md`.
4. G. Mackinlay, _Text Book of Gunnery, 1887_ (HMSO) Tables XVI/XVII, via `ship-building-1880-pre-era-armament.md`.
5. In-repo companions: `docs/research/ship-building-1880-ships-by-nation.md` §6.1,
   `ship-building-1880-pre-era-armament.md`, `national-naval-profiles-uk-france.md`, `national-naval-profiles-germany.md`;
   `content/production/1880/{research,countries,economies,possessions,areas}.yaml`,
   `content/production/1880/ship-building/{components,plants,hull-forms,balance,naval-profiles,reference-designs}.yaml`.
6. Print works named as leads (not opened): Conway's _All the World's Fighting Ships 1860–1905_ (1979); A. Roksund,
   _The Jeune École_ (Brill, 2007); Jane's _Fighting Ships_ (1898).
