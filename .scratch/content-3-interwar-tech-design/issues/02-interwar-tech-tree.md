# CONTENT-3 — 02: INTERWAR technology tree (1920–1939)

## Question

Which INTERWAR technology items continue the production pack DAG, in which
research fields, with what grounded years?

## Type

research

## Status

resolved

## Notes

- Seeds from PRE_WAR tails (all authored in CONTENT-2): `hc_krupp_cemented_armor`,
  `hc_all_or_nothing_armor`, `hc_high_tensile_structural_steel`,
  `mac_steam_turbine`, `mac_oil_fired_boilers`, `mac_geared_turbines`,
  `sd_dreadnought_design`, `sd_battlecruiser_design`, `sd_super_dreadnought_design`,
  `gun_big_gun_12in`, `gun_superfiring_turret`, `gun_135in_heavy_guns`,
  `gun_15in_heavy_guns`, `fc_coincidence_rangefinder`,
  `fc_mechanical_gun_direktor`, `fc_director_firing`, `torp_long_range_18in`,
  `torp_21in_ww1`, `m_asw_automatic_contact_mine`, `sub_diesel_electric`,
  `sub_ww1_ocean_boat`, `infra_dreadnought_drydock`, `infra_oil_basing`,
  `dc_torpedo_bulkhead`.
- Era spine (grounded): Washington-treaty design (1922); 16-in (Nelson 1927,
  North Carolina 1937) and 14-in treaty (KGV 1937) guns; fast battleships
  (1937); analog fire control (Admiralty Fire Control Table, Ford Rangekeeper);
  ASDIC/sonar; Type 93 oxygen torpedo.

## Answer

Acyclic INTERWAR techs (24; implemented in the follow-up sprint), by field with
grounded year and seed:

| Field | item | year | seeds on |
|---|---|---|---|
| GUNNERY | `gun_16in_heavy_guns` | 1927 | `gun_15in_heavy_guns` |
| GUNNERY | `gun_superheavy_ap` | 1937 | `gun_16in_heavy_guns` |
| GUNNERY | `gun_14in_treaty_guns` | 1937 | `gun_15in_heavy_guns` |
| GUNNERY | `gun_quadruple_turret` | 1936 | `gun_14in_treaty_guns` |
| MACHINERY | `mac_high_pressure_steam` | 1937 | `mac_oil_fired_boilers` |
| MACHINERY | `mac_improved_geared_turbines` | 1937 | `mac_geared_turbines` |
| HULL_CONSTRUCTION | `hc_internal_inclined_belt` | 1927 | `hc_all_or_nothing_armor` |
| HULL_CONSTRUCTION | `hc_side_protection_system` | 1937 | `dc_torpedo_bulkhead` |
| HULL_CONSTRUCTION | `hc_improved_cemented_armor` | 1937 | `hc_krupp_cemented_armor` |
| HULL_CONSTRUCTION | `hc_thicker_belt_armor` | 1937 | `hc_all_or_nothing_armor` |
| SHIP_DESIGN | `sd_washington_treaty_design` | 1922 | `sd_dreadnought_design` |
| SHIP_DESIGN | `sd_treaty_cruiser_design` | 1922 | `sd_battlecruiser_design` |
| SHIP_DESIGN | `sd_fast_battleship_design` | 1937 | `sd_super_dreadnought_design` |
| FIRE_CONTROL | `fc_analog_fire_control_computer` | 1932 | `fc_director_firing` |
| FIRE_CONTROL | `fc_gyro_stabilized_director` | 1935 | `fc_director_firing` |
| TORPEDOES | `torp_improved_long_range` | 1933 | `torp_21in_ww1` |
| TORPEDOES | `torp_oxygen_torpedo` | 1933 | `torp_21in_ww1` |
| MINES_AND_ASW | `m_asw_asdic_sonar` | 1928 | `m_asw_automatic_contact_mine` |
| MINES_AND_ASW | `m_asw_improved_contact_mine` | 1930 | `m_asw_automatic_contact_mine` |
| SUBMARINES | `sub_modern_diesel_electric` | 1935 | `sub_diesel_electric` |
| SUBMARINES | `sub_fleet_ocean_submarine` | 1939 | `sub_ww1_ocean_boat` |
| INFRASTRUCTURE | `infra_fleet_support_base` | 1938 | `infra_oil_basing` |
| DAMAGE_CONTROL | `dc_watertight_subdivision` | 1937 | `dc_torpedo_bulkhead` |
| DAMAGE_CONTROL | `dc_magazine_flash_protection` | 1936 | `dc_torpedo_bulkhead` |

Deferred (not authored): AVIATION / CARRIER_OPERATIONS / RADAR_AND_ELECTRONICS /
MISSILES / AMPHIBIOUS_OPERATIONS INTERWAR techs — unit families M4/M5.

Sources: `docs/research/content-3-interwar-era-tech-and-design.md` (verified:
Nelson/North Carolina/King George V/Type 93/ASDIC, etc.).