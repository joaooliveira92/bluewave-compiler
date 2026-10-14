# CONTENT-2 — 02: PRE_WAR technology tree (1900–1919)

## Question

Which PRE_WAR technology items should the production pack continue the EARLY DAG
with, and in which research fields, with what historically grounded years?

## Type

research

## Status

resolved

## Notes

- EARLY tails to seed on (CONTENT-1): `hc_harvey_armor` (1892),
  `mac_water_tube_boiler` (1894), `sd_predreadnought_design` (1893),
  `gun_capped_ap_shell` (1895), `fc_basic_rangefinding` (1898),
  `torp_gyroscopic_steering` (1896), `sub_practical_military_design` (1897),
  `m_asw_mine_laying` (1885), `infra_modern_dockyard` (1893),
  `dc_watertight_bulkheads` (1888).
- Dreadnought revolution (1906, first all-big-gun **and** first turbine
  battleship) and fire-control maturation (Dreyer/Dumaresq/Argo; director firing
  by mid-1916) are the era's spine. Krupp cemented (KCA) armor and 13.5"/15"
  super-dreadnought guns define the ship-design frontier.

## Answer

Acyclic PRE_WAR tech set (implemented in the follow-up sprint), grouped by field:

| Field | item (working id) | year | seeds on |
|---|---|---|---|
| HULL_CONSTRUCTION | `hc_krupp_cemented_armor` (KCA/VC) | 1900 | `hc_harvey_armor` |
| HULL_CONSTRUCTION | `hc_all_or_nothing_armor` (US style) | 1910 | `hc_krupp_cemented_armor` |
| HULL_CONSTRUCTION | `hc_high_tensile_structural_steel` | 1905 | `hc_steel_hull_standard` |
| MACHINERY | `mac_steam_turbine` (capital-ship) | 1906 | `mac_water_tube_boiler` |
| MACHINERY | `mac_oil_fired_boilers` | 1911 | `mac_steam_turbine` |
| MACHINERY | `mac_geared_turbines` | 1915 | `mac_steam_turbine` |
| SHIP_DESIGN | `sd_dreadnought_design` | 1906 | `sd_predreadnought_design`, `hc_krupp_cemented_armor` |
| SHIP_DESIGN | `sd_battlecruiser_design` | 1908 | `sd_dreadnought_design` |
| SHIP_DESIGN | `sd_super_dreadnought_design` | 1912 | `sd_dreadnought_design` |
| GUNNERY | `gun_superfiring_turret` | 1910 | `gun_big_gun_12in` |
| GUNNERY | `gun_big_gun_12in` | 1905 | `gun_capped_ap_shell` |
| GUNNERY | `gun_135in_heavy_guns` | 1912 | `gun_big_gun_12in` |
| GUNNERY | `gun_15in_heavy_guns` | 1915 | `gun_135in_heavy_guns` |
| FIRE_CONTROL | `fc_coincidence_rangefinder` (Barr & Stroud 9-ft) | 1905 | `fc_basic_rangefinding` |
| FIRE_CONTROL | `fc_mechanical_gun_direktor` (Dumaresq/Dreyer) | 1910 | `fc_coincidence_rangefinder` |
| FIRE_CONTROL | `fc_director_firing` | 1913 | `fc_mechanical_gun_direktor` |
| TORPEDOES | `torp_long_range_18in` | 1904 | `torp_gyroscopic_steering` |
| TORPEDOES | `torp_21in_ww1` | 1912 | `torp_long_range_18in` |
| MINES_AND_ASW | `m_asw_automatic_contact_mine` | 1906 | `m_asw_mine_laying` |
| MINES_AND_ASW | `m_asw_depth_charge_1916` | 1916 | `m_asw_automatic_contact_mine` |
| SUBMARINES | `sub_diesel_electric` | 1910 | `sub_practical_military_design` |
| SUBMARINES | `sub_ww1_ocean_boat` | 1915 | `sub_diesel_electric`, `torp_long_range_18in` |
| INFRASTRUCTURE | `infra_dreadnought_drydock` | 1906 | `infra_modern_dockyard` |
| INFRASTRUCTURE | `infra_oil_basing` | 1912 | `infra_coaling_station` |
| DAMAGE_CONTROL | `dc_torpedo_bulkhead` | 1908 | `dc_watertight_bulkheads` |

Deferred (see ticket 01): AVIATION / CARRIER_OPERATIONS / RADAR_AND_ELECTRONICS /
MISSILES PRE_WAR techs. RADAR & MISSILES have no pre-1919 firsts anyway.

Sources: `docs/research/content-2-prewar-era-tech-and-design.md` (high-trust
sources per item); CONTENT-1 EARLY DAG.