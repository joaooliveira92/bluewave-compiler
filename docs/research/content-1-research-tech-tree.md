# Research: Content Sprint 1 — EARLY Era Technology Tree (1880–1899)

Historical research notes for authoring the EARLY-era research technology progression
for the `scen_1880` production pack. Research-only; no collection files authored here.

**Scope.** Real, historically-grounded naval technology for the EARLY era band
(January 1880 – December 1899). Game schema consumed:

```
{id, name, category, researchFieldId?, prerequisites:[{techId}], cost(integer),
 discoveryWeight(1..1e6), year(1880-1970), availabilityMonth?}
```

**Conventions used.**

- `category` = `EARLY` for every tech (era band; see content-0 era bands).
- `researchFieldId` = one of the fifteen canonical fields (DESIGN-20 §1).
- `prerequisites` entry shape: `{techId}`.
- Root technologies (year 1880, no prerequisites) model pre-existing / immediate
  state of the art at scenario start; nothing is researched-away.
- `year` = canonical historical availability year (inventive/adoption year), the
  primary driver of the game's historical timing modifier (DESIGN-20 §12.2).
- `cost` scales by frontier depth: roots 50–100, mid-tier ~150–300, late-1890s
  leaders ~300–600. This is a _relative_ cost, not historical.
- `discoveryWeight` reflects prominence/attractiveness of the innovation
  (1..1e6). Roots low (always eligible anyway), late leaders higher to out-compete
  peers in weighted selection. Shipped historical timing modifier (DESIGN-20
  §12.2) further biases toward the canonical month.
- `availabilityMonth` defaults to January of `year` unless noted (e.g. mid-year).

**DAG discipline.** Every tech references only techs listed in this file; the
graph is acyclic, ordered by field then by year, with prerequisites earlier in
the chain. Roots list no prerequisites. No cross-era forward references.

Every dated claim cites a Wikipedia article title so it can be re-verified.

---

## 1. Field-by-field technology list (grouped, DAG roots → late-1890s)

### 1.1 HULL_CONSTRUCTION

Wrought iron → compound armor → nickel/harvey → cementite; steel hulls generalising.

| techId                   | name                            | year | cost | weight | prerequisites           | notes / source                                                                                                                                                                                    |
| ------------------------ | ------------------------------- | ---- | ---- | ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hc_wrought_iron_hull`   | Wrought Iron Hull Construction  | 1880 | 50   | 1_000  | — (root)                | State of the art at start. Iron armour / wrought iron plating was the norm into the 1880s. Source: _Harvey armor_ (predecessors: "uniform homogeneous iron or steel plates" to the 1880s).        |
| `hc_compound_armor`      | Compound Armor                  | 1886 | 120  | 4_000  | `hc_wrought_iron_hull`  | Hard steel face on elastic iron back; "appeared in the mid-1880s". Source: _Harvey armor_.                                                                                                        |
| `hc_all_steel_hull`      | All-Steel (Mild Steel) Hull     | 1886 | 140  | 4_000  | `hc_wrought_iron_hull`  | Transition from iron to mild steel hull plating through the 1880s. Source: _Quick-firing gun_ context + _History of the steam engine_ (steel boilers); _Harvey armor_ (steel plate era).          |
| `hc_nickel_steel_armor`  | Nickel-Steel Armor              | 1889 | 150  | 5_000  | `hc_compound_armor`     | Discovery of nickel-steel alloys (1889) rendered compound armor obsolete. Source: _Harvey armor_.                                                                                                 |
| `hc_harvey_armor`        | Harvey Cemented Armor           | 1892 | 260  | 8_000  | `hc_nickel_steel_armor` | Harvey process case-hardened face; early 1890s (1894 8-inch plate cited). Source: _Harvey armor_.                                                                                                 |
| `hc_steel_hull_standard` | Standardized Steel Construction | 1892 | 200  | 6_000  | `hc_all_steel_hull`     | Steel-bearing-ship building best practice during the pre-dreadnought build-up. Source: _Harvey armor_ (steel construction 1890s) / _Quick-firing gun_ (1890s battleship superstructure in steel). |

> User-flagged "Nitrocellulose" belongs to explosives/ordnance, not hulls; placed
> correctly under GUNNERY §1.4 (smokeless propellant chain).

### 1.2 MACHINERY

Compound → triple expansion; draft and boiler evolution from Scotch/return-tube to
forced draft and water-tube (Belleville).

| techId                  | name                                 | year | cost | weight | prerequisites          | notes / source                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------ | ---- | ---- | ------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mac_compound_engine`   | Compound (Two-Stage) Engine          | 1880 | 60   | 1_000  | — (root)               | Compounding established before 1880 (Cornish compounding, §4 of _History of the steam engine_). State of the art at start.                                                                                                          |
| `mac_triple_expansion`  | Triple-Expansion Engine              | 1881 | 130  | 5_000  | `mac_compound_engine`  | First ship with triple-expansion machinery, SS _Aberdeen_, 1881; widely adopted by warships through the 1880s. Source: _History of the steam engine_ (expansive "triple expansion engines" §High-pressure engines).                 |
| `mac_forced_draft`      | Forced-Draft Boilers                 | 1885 | 140  | 5_000  | `mac_triple_expansion` | Induced/forced-draft systems to raise boiler output on torpedo boats and cruisers, 1880s. Source: _List of boiler types by manufacturer_ (high-output boiler developments, 1880s–90s).                                              |
| `mac_water_tube_boiler` | Water-Tube Boilers (Belleville type) | 1894 | 300  | 10_000 | `mac_forced_draft`     | Belleville early marine water-tube boiler developed in France; fleet trials/warship adoption mid-1890s (French 1894–95 completed ships carried QF in same era). Source: _List of boiler types by manufacturer_ → Belleville boiler. |

### 1.3 SHIP_DESIGN

Design integration that structures the new steel, high-speed, QF-armed navy.

| techId                     | name                      | year | cost | weight | prerequisites                             | notes / source                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------- | ---- | ---- | ------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sd_ironclad_design`       | Modern Ironclad Design    | 1880 | 55   | 1_000  | — (root)                                  | Late ironclad design practice at scenario start. Source: _Harvey armor_ (armoured ships before compound era).                                                                                                                                   |
| `sd_protected_cruiser`     | Protected Cruiser Design  | 1885 | 160  | 5_000  | `sd_ironclad_design`                      | Armoured-deck (protected) cruisers as a distinct type from the mid-1880s. Source: _Whitehead torpedo_ / _Quick-firing gun_ (torpedo-boat threat driving small fast cruisers & escort type).                                                     |
| `sd_torpedo_ram_design`    | Torpedo-Ship & Ram Design | 1886 | 140  | 4_000  | `sd_ironclad_design`                      | Torpedo-boat design refinement (see TORPEDOES §1.5). Source: _Whitehead torpedo_ ("By the 1880s ... navies ... deploying torpedo boats").                                                                                                       |
| `sd_predreadnought_design` | Pre-Dreadnought Design    | 1893 | 350  | 14_000 | `sd_protected_cruiser`, `hc_harvey_armor` | Classic pre-dreadnought: mixed heavy + QF battery, steel hull, compound/harvey armour, triple expansion; dominant 1890s. Source: _Quick-firing gun_ ("key characteristic of the pre-dreadnought battleship, the dominant design of the 1890s"). |

### 1.4 GUNNERY

Breech-loading rifled guns already at hand → quick-firing guns → smokeless propellant
→ capped armour-piercing shells.

| techId                 | name                                           | year | cost | weight | prerequisites                           | notes / source                                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------- | ---- | ---- | ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gun_breech_rifled`    | Breech-Loading Rifled Guns                     | 1880 | 60   | 1_000  | — (root)                                | BL rifled guns already standard at 1880 (RML just displaced / BL rising). Source: _Quick-firing gun_ (breech-loading prerequisite of QF); _Whitehead torpedo_ era.                                                  |
| `gun_qf_light`         | Quick-Firing Light Guns (Nordenfelt/Hotchkiss) | 1886 | 150  | 6_000  | `gun_breech_rifled`                     | 1-inch Nordenfelt from 1880; Hotchkiss 3-pdr (47mm) QF from 1886; anti-torpedo-boat. Source: _Quick-firing gun_.                                                                                                    |
| `gun_qf_medium`        | Quick-Firing Medium Guns (4.7"/6")             | 1889 | 220  | 8_000  | `gun_qf_light`                          | QF 4.7-inch in HMS _Sharpshooter_ (1889); QF 6-inch in HMS _Royal Sovereign_ (launched 1891). Source: _Quick-firing gun_.                                                                                           |
| `gun_smokeless_powder` | Smokeless Propellant (Cordite/Poudre B)        | 1890 | 260  | 9_000  | `gun_qf_light`                          | Poudre B (France) 1884; Ballistite (Nobel) 1887/88; Cordite (Abel & Dewar) patented 1889, production from 1889. Source: _Cordite_.                                                                                  |
| `gun_capped_ap_shell`  | Improved AP & Capped Shells                    | 1895 | 300  | 9_000  | `gun_smokeless_powder`, `gun_qf_medium` | Hardened/armour-piercing projectile development against Harvey/Nickel armour in the 1890s (common-pointed "CP" shell family). Source: _Quick-firing gun_ (common pointed shells) / _Harvey armor_ (armour-AP race). |

### 1.5 TORPEDOES

Whitehead self-propelled torpedo (already 1866) → 1880s refinement → torpedo boats.

| techId                     | name                                       | year | cost | weight | prerequisites            | notes / source                                                                                                                                                         |
| -------------------------- | ------------------------------------------ | ---- | ---- | ------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `torp_whitehead_torpedo`   | Whitehead Self-Propelled Torpedo           | 1880 | 70   | 1_500  | — (root)                 | Perfected 1866; in service with many navies by 1870s; 1877 achieving 18mph/830yd. Source: _Whitehead torpedo_.                                                         |
| `torp_torpedo_boat`        | Torpedo Boat Development                   | 1882 | 130  | 5_000  | `torp_whitehead_torpedo` | 1880s navies "began deploying torpedo boats to carry them into battle". Source: _Whitehead torpedo_.                                                                   |
| `torp_torpedo_gunnery`     | Torpedo Run Training & QF Defence Doctrine | 1886 | 150  | 4_000  | `torp_torpedo_boat`      | The torpedo-boat threat drove both faster QF and torpedo tactics; evolution of the destroyer concept late 1880s–90s. Source: _Whitehead torpedo_ + _Quick-firing gun_. |
| `torp_gyroscopic_steering` | Gyroscopic Steering (Obry gear)            | 1896 | 260  | 9_000  | `torp_whitehead_torpedo` | Course-keeping solution: gyroscope patented by Ludwig Obry, rights bought by Whitehead 1896. Source: _Whitehead torpedo_.                                              |

### 1.6 MINES_AND_ASW

Basic contact mines and the spar-torpedo legacy.

| techId               | name                        | year | cost | weight | prerequisites        | notes / source                                                                                                                                                                        |
| -------------------- | --------------------------- | ---- | ---- | ------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `m_asw_contact_mine` | Contact Mine (Horn/Mooring) | 1880 | 50   | 800    | — (root)             | Static/still contact mines in use before 1880; "static or passively mobile" mines predate the Whitehead. Source: _Whitehead torpedo_ (note on mines being the older "torpedo").       |
| `m_asw_spar_torpedo` | Spar/Outrigger Torpedo      | 1880 | 50   | 800    | — (root)             | Civil-War-era explosive spar carried by small boats; pre-dates self-propelled torpedo. Source: _Whitehead torpedo_ (explosive-boat lineage; "torpedo" fish usage).                    |
| `m_asw_mine_laying`  | Systematic Minefield Laying | 1885 | 110  | 3_500  | `m_asw_contact_mine` | Port-defence contact-minefields became standard practice (coastal fortification synergy, §1.8). Source: _List of boiler types_ n/a — see _Naval mine_ (port defence doctrine, 1880s). |

### 1.7 SUBMARINES

Early experimental submarines — deliberately narrow, experimental, late lock.

| techId                          | name                                        | year | cost | weight | prerequisites                                | notes / source                                                                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------- | ---- | ---- | ------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sub_experimental`              | Experimental Submersibles                   | 1885 | 120  | 3_000  | — (root)                                     | Late-1870s/1880s experimental boats; French Goubet submarine (1880s) among them. Source: _Submarine_ (Goubet, 1887/89 experimental submersibles); _Whitehead torpedo_ ("engineers began to envision submarines armed with Whitehead torpedoes" by the 1880s). |
| `sub_practical_military_design` | Practical Military Submarine (Holland type) | 1897 | 320  | 7_000  | `sub_experimental`, `torp_whitehead_torpedo` | John P. Holland's US Navy boats; USS _Holland_ launched 1897. Source: _Holland Torpedo Boat Company_ / _Holland I_ (RN); _Whitehead torpedo_ (RN earliest submarines fitted with Whitehead from HMS _Holland 1_).                                             |

### 1.8 INFRASTRUCTURE

Dry docks, coaling stations, coastal fortifications — the logistic shore spine.

| techId                        | name                     | year | cost | weight | prerequisites                              | notes / source                                                                                                                                                                                            |
| ----------------------------- | ------------------------ | ---- | ---- | ------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `infra_dry_dock`              | Dry Docks & Repair Yards | 1880 | 50   | 800    | — (root)                                   | Existing graving/repair dock practice at start; majors expanded docks for new steel battleships. Source: general engineering base (_History of the steam engine_ boiler construction); treat as baseline. |
| `infra_coaling_station`       | Coaling Stations & Bases | 1880 | 50   | 800    | — (root)                                   | Coal-bunker network for steamship fleets. Source: _History of the steam engine_ (coal-fired marine engines — coaling requirement).                                                                        |
| `infra_coastal_fortification` | Coastal Fortifications   | 1885 | 130  | 3_500  | `m_asw_mine_laying`                        | Modern breech/QF coast artillery and Bofors-type defence (1880s–90s). Source: _Quick-firing gun_ (QF used as coast artillery from the late 1880s).                                                        |
| `infra_modern_dockyard`       | Modern Steel Dockyard    | 1893 | 260  | 5_000  | `infra_dry_dock`, `hc_steel_hull_standard` | Shipyards re-tooled for steel hulls, heavy lifts and big pre-dreadnought slips through the 1890s. Source: _Harvey armor_ (steel plate fabrication, 1890s) / pre-dreadnought build-up era.                 |

### 1.9 DAMAGE_CONTROL (EARLY capability)

Minimal but real early band: pumping/compartmentation preceding subdivided
watertight bulkheads that reach PRE_WAR.

| techId                    | name                            | year | cost | weight | prerequisites                              | notes / source                                                                                                                                                                      |
| ------------------------- | ------------------------------- | ---- | ---- | ------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dc_iron_subdivision`     | Iron Hull Subdivision & Pumping | 1880 | 55   | 900    | — (root)                                   | Iron-hull compartmentation and steam pumping in use by 1880. Source: _Harvey armor_ predecessor (armoured iron ships) / general iron-ship practice.                                 |
| `dc_watertight_bulkheads` | Watertight Bulkhead Practice    | 1888 | 140  | 4_000  | `dc_iron_subdivision`, `hc_all_steel_hull` | Steel-hull watertight subdivision refined in the 1880s for torpedo/ram defence. Source: _Harvey armor_ (steel construction 1880s) context; _Whitehead torpedo_ (underwater threat). |

### 1.10 Unused fields in EARLY

The following canonical fields have **no** EARLY-era technology and are left empty
for this band (their first techs belong to later bands): `FIRE_CONTROL` beyond a
single 1898 root (see below), `AVIATION`, `CARRIER_OPERATIONS`,
`RADAR_AND_ELECTRONICS`, `MISSILES`, `AMPHIBIOUS_OPERATIONS`.

- **FIRE_CONTROL (early)** — primitive, late-band-only; a single stub for the
  1898–99 seam into PRE_WAR:

| techId                  | name                          | year | cost | weight | prerequisites   | notes / source                                                                                                                                                                                                                                             |
| ----------------------- | ----------------------------- | ---- | ---- | ------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fc_basic_rangefinding` | Basic Rangefinding & Spotting | 1898 | 300  | 8_000  | `gun_qf_medium` | First stereoscopic/coincidence rangefinders and rudimentary sport spotting at end of century; true plotting is a PRE_WAR tech. Source: _Fire-control system_ (early rangefinding, late 1890s); _Quick-firing gun_ (aimed rapid fire driving ranging need). |

---

## 2. Quick reference: full DAG (edges only)

```
HULL_CONSTRUCTION
  hc_wrought_iron_hull
  hc_compound_armor         -> hc_wrought_iron_hull
  hc_all_steel_hull         -> hc_wrought_iron_hull
  hc_nickel_steel_armor     -> hc_compound_armor
  hc_harvey_armor           -> hc_nickel_steel_armor
  hc_steel_hull_standard    -> hc_all_steel_hull

MACHINERY
  mac_compound_engine
  mac_triple_expansion      -> mac_compound_engine
  mac_forced_draft          -> mac_triple_expansion
  mac_water_tube_boiler     -> mac_forced_draft

SHIP_DESIGN
  sd_ironclad_design
  sd_protected_cruiser      -> sd_ironclad_design
  sd_torpedo_ram_design     -> sd_ironclad_design
  sd_predreadnought_design  -> sd_protected_cruiser, hc_harvey_armor

GUNNERY
  gun_breech_rifled
  gun_qf_light              -> gun_breech_rifled
  gun_qf_medium             -> gun_qf_light
  gun_smokeless_powder      -> gun_qf_light
  gun_capped_ap_shell       -> gun_smokeless_powder, gun_qf_medium

TORPEDOES
  torp_whitehead_torpedo
  torp_torpedo_boat         -> torp_whitehead_torpedo
  torp_torpedo_gunnery      -> torp_torpedo_boat
  torp_gyroscopic_steering  -> torp_whitehead_torpedo

MINES_AND_ASW
  m_asw_contact_mine
  m_asw_spar_torpedo
  m_asw_mine_laying         -> m_asw_contact_mine

SUBMARINES
  sub_experimental
  sub_practical_military_design -> sub_experimental, torp_whitehead_torpedo

INFRASTRUCTURE
  infra_dry_dock
  infra_coaling_station
  infra_coastal_fortification   -> m_asw_mine_laying
  infra_modern_dockyard         -> infra_dry_dock, hc_steel_hull_standard

DAMAGE_CONTROL
  dc_iron_subdivision
  dc_watertight_bulkheads  -> dc_iron_subdivision, hc_all_steel_hull

FIRE_CONTROL
  fc_basic_rangefinding    -> gun_qf_medium
```

**Total EARLY techs: 30.** Roots (year 1880, no prerequisites): `hc_wrought_iron_hull`,
`mac_compound_engine`, `sd_ironclad_design`, `gun_breech_rifled`, `torp_whitehead_torpedo`,
`m_asw_contact_mine`, `m_asw_spar_torpedo`, `sub_experimental`, `infra_dry_dock`,
`infra_coaling_station`, `dc_iron_subdivision` (11 roots).

---

## 3. Cost & discovery-weight balance summary

Range of `cost`: 50 (roots) → 350 (`sd_predreadnought_design`, late-1890s leader).
Largest single dependency chains accumulate to a realistic progression; no single
path exceeds ~4 unlocks to the top pre-1900 node.

`discoveryWeight` values land within `800..14_000`, comfortably inside the allowed
`1..1_000_000`. Late-1890s leaders (water-tube boiler, pre-dreadnought design) carry
the highest weights so weighted selection (DESIGN-20 Stage 6) favours them once the
historical timing window opens, while roots (always eligible) keep modest weights.

## 4. Sources

- _Harvey armor_ — compound armor mid-1880s; nickel-steel 1889; Harvey early 1890s; Krupp supersedes late 1890s; steel fabrication.
- _Whitehead torpedo_ — self-propelled torpedo perfected 1866; 1870s adoption; 1880s torpedo boats; gyroscopic gear/Obry 1896; USN acquisition 1892; submarine linkage.
- _Cordite_ — Poudre B 1884; Ballistite 1887/88; Cordite patented & produced 1889; dev by Abel, Dewar, Kellner.
- _Quick-firing gun_ — 1-inch Nordenfelt 1880; Hotchkiss 3-pdr 1886; QF 4.7-inch 1889; QF 6-inch 1891; pre-dreadnought QF 1890s; coast-artillery use; common-pointed shells.
- _History of the steam engine_ — compounding; triple-expansion engines; coal-fired marine practice.
- _List of boiler types by manufacturer_ — Belleville (and other) marine water-tube boilers; forced-draft/high-output boiler evolution.
- _Submarine_ / _Holland Torpedo Boat Company_ — Goubet 1880s experimental boats; Holland 1890s practical submarine.
- _Naval mine_ — contact-mine port-defence doctrine (general).
- _Fire-control system_ — early rangefinding/spotting at the end of the 1890s.

> Authoring note for the collection file: populate these into
> `content/production/1880/technologies.yaml` under `files.technologies` (per
> content-0 pack layout), assigning `category: EARLY`, `researchFieldId` as per
> §1, and dropping `availabilityMonth` when it is January of `year`.
