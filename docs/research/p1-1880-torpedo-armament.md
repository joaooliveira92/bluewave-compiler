# Research — P-1 1880 roster torpedo armament (as built)

> Purpose: ground the `torpedoArmament` authored on the 16 `familyCreationMonth: "1880-01"`
> designs in `content/production/1880/designs.yaml` (ADR-0045 Track P, P-1).
> Captured 2026-10-06.

## Rule

Author **as-built** torpedo armament only — the fit a ship carried at or near the Jan 1880
scenario start. Tubes documented as added later (1885+ refits) are **not** authored; that
keeps the 1880 pack date-correct and leaves refits to a future refit mechanic. A design whose
sources give no countable tube fit is authored with **no** torpedo armament (never guessed).

All 1880 tubes are 14-in (356 mm) Whitehead-pattern; the shipped model closest to them is
`whitehead_14in_1886` (`torpedo_models_v1`, `docs/research/c1-m3-torpedoes.md` §3.1). Using it
for 1880-built fits is a recorded approximation (same diameter/propulsion family; the 1886
redesign is slightly faster).

Mount mapping: "submerged bow" → `UNDERWATER_FIXED`; "above water / broadside / carriage /
traversable" → `ABOVE_WATER_TRAINABLE`.

## Findings

| Design             | As-built fit (source quote)                                                               | Authored                                  |
| ------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| Inflexible         | "4 × 14-in torpedo tubes (two submerged bow tubes, two on carriages)" [1]                 | 2 underwater fixed + 2 above-water        |
| Dreadnought (1875) | no torpedo armament documented [2]                                                        | none                                      |
| Devastation        | "2 × 14-inch torpedo launchers (added 1879)" [3]                                          | 2 above-water                             |
| Alexandra          | carried early 16-in Whitehead torpedoes from surface carriages; no tube count given [4]   | none (count unsourced)                    |
| Redoutable         | "four torpedo tubes … in the hull above the waterline, two per side" [5]                  | 4 above-water                             |
| Amiral Duperré     | "Four 356 mm (14 in) torpedo tubes in above-water mounts" [6]                             | 4 above-water                             |
| Kaiser             | five 35 cm tubes installed at later reconstruction; none as built [7]                     | none                                      |
| Sachsen            | "After 1886, three 35 cm torpedo tubes were installed" [8]                                | none (post-1880 fit)                      |
| Petr Veliky        | "one fixed or bow tube … and one launching carriage" [9]                                  | 1 underwater fixed + 1 above-water        |
| Ekaterina II       | "seven above-water 14-inch torpedo tubes" (class built 1883–94) [10]                      | 7 above-water                             |
| Tegetthoff         | two 35 cm tubes installed in the 1893–94 modernization; none as built [11]                | none                                      |
| Duilio             | "three 356 mm (14 in) torpedo tubes" [12]                                                 | 3 above-water (placement unsourced)       |
| Italia             | "four 356 mm (14 in) torpedo tubes … on the broadside above the waterline" [13]          | 4 above-water                             |
| Amphitrite         | gun-only armament documented [14]                                                         | none                                      |
| Fusō (1877)        | two above-water tubes "added in late 1885" [15]                                           | none (post-1880 fit)                      |
| Dingyuan           | "Three 14 in torpedo tubes … all above water" [16]                                        | 3 above-water                             |

Post-1900 designs (Dreadnought 1906 onward) are out of P-1 scope: the 1880 campaign does not
reach them until 1906, and they need 18-in/21-in models. Recorded as deferred in the P-1 spec.

## Sources

1. Wikipedia, "HMS Inflexible (1876)".
2. Wikipedia, "HMS Dreadnought (1875)".
3. Wikipedia, "HMS Devastation (1871)".
4. Wikipedia, "HMS Alexandra (1875)".
5. Wikipedia, "French ironclad Redoutable".
6. Wikipedia, "French ironclad Amiral Duperré".
7. Wikipedia, "SMS Kaiser (1874)".
8. Wikipedia, "Sachsen-class ironclad".
9. naval-encyclopedia.com, "Russian battleships" (Petr Veliky entry).
10. Wikipedia, "Ekaterina II-class battleship".
11. Wikipedia, "SMS Tegetthoff (1878)".
12. Wikipedia, "Italian ironclad Duilio".
13. Wikipedia, "Italia-class ironclad".
14. Wikipedia, "Amphitrite-class monitor".
15. Wikipedia, "Japanese ironclad Fusō".
16. Wikipedia, "Dingyuan-class ironclad".
