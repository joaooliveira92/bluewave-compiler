# National content completeness report (UK / France / Germany)

Validated by `validateAllNations` (`@bluewave/ship-design/test/nationCompleteness.test.ts`) at release:
all three nations return **zero issues**. Reference designs are classified in the test's classification map.

## Completeness (per nation)
| Check | UK | France | Germany |
| --- | --- | --- | --- |
| Resolvable opening profile (1880-01) | yes | yes | yes |
| Hard capability + doctrine sections complete | yes | yes | yes |
| Component references valid; variant dates ordered | yes | yes | yes |
| Date bands non-overlapping and ordered | yes | yes | yes |
| Six legal classified starters (B/CA/CL/DD/KE/AMC) | yes | yes | yes |
| Viable procurement path per role group | yes | yes | yes |
| Dock/industrial fit + standard-budget affordability | yes | yes | yes |
| No release placeholder | yes | yes | yes |
| Deterministic runtime resolution | yes | yes | yes |

## Opening starters and classification
| Nation | B | CA | CL | DD | KE | AMC |
| --- | --- | --- | --- | --- | --- | --- |
| UK | alexandra_1877 (HISTORICAL_RECONSTRUCTION) | starter_armoured_cruiser_1880 | starter_protected_cruiser_1880 | starter_torpedo_gunboat_1880 | starter_corvette_1880 | starter_armed_liner_1880 |
| France | redoutable_1878 (HISTORICAL_RECONSTRUCTION) | starter_armoured_cruiser_fr_1880 | starter_protected_cruiser_fr_1880 | starter_torpedo_gunboat_fr_1880 | starter_corvette_fr_1880 | starter_armed_liner_fr_1880 |
| Germany | sachsen_1878 (HISTORICAL_RECONSTRUCTION) | starter_armoured_cruiser_de_1880 | starter_protected_cruiser_de_1880 | starter_torpedoboat_de_1880 | starter_gunboat_de_1880 | starter_armed_liner_de_1880 |
(Everything not marked otherwise is `DOCTRINE_TEMPLATE`.)

## Provenance summary
- **VERIFIED / DERIVED:** UK and France component-variant gun values (navweaps/Text Book of Gunnery relayed), White
  1894 hull fractions, the shared component catalogue and plants.
- **ESTIMATE:** hull-form and profile shape, dimensions, dates where a source named them only indirectly.
- **BALANCE_TARGET:** all industrial multipliers, displacement ceilings, design weights, procurement shares,
  engagement range/research priorities, and Germany's industrial profile.

## Remaining low-confidence values
- Germany build-time/cost/reliability/variance multipliers and 26 cm / 15 cm shell masses (Jordan/Gröner print
  sources needed).
- French yard/dock capacities and moulded depths (carried from the UK/France note).
- Greek/Italian/etc. nations are not authored (out of scope).
