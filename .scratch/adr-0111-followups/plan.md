# ADR-0111 follow-ups — plan (inspection first)

Scen_1880 opening month is **1880-01**. The completeness gate
(`validateNationCompleteness`) requires, for every profiled nation, six opening
starters that each compile **and classify as their declared type**
(`nationCompleteness.ts` → `NATION_STARTER_CLASS`). The authored classification
rules are `DESIGN_22_EARLY` (`classificationRules.ts`).

Key structural thresholds (compiled `totalKg`, µm):

| Type | classes as | needs |
| --- | --- | --- |
| B | capital | displ ≥ 5,000,000 kg; BELT_MAIN ≥ 152,400 µm (6 in); main gun > 152,400 µm; speed < 20 kn; 1–2 main mounts |
| CA | armoured cruiser | displ > 4,000,000; speed > 19 kn; belt 2–12 in; main 6–11 in |
| CL | protected cruiser | displ 2,000,000–7,999,999; speed > 16 kn; belt ≤ 2 in (or no belt + deck + ≤ 8 in single mounts) |
| KE | colonial | displ < 2,500,000; belt ≤ 2 in; any gun ≤ 6 in |
| DD | torpedo craft | displ < 2,000,000; speed > 19 kn; torpedo; no qualifying armour; any gun ≤ 6 in |
| AMC | armed merchant | merchant hull; displ > 1,700,000; no qualifying armour; any gun ≤ 6 in |

## Per-candidate eligibility (R2)

| Ship | Nation | Current B starter | displ (t) | belt (mm) | main gun | speed (kn) | B? | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Matador (monitor) | netherlands | `starter_b_netherlands_1880` (clone) | 1,968 | 140 | 283 mm | 7.5 | no | displ < 5,000 t; belt < 6 in; slow → no class at all |
| Vasco da Gama | portugal | `starter_b_portugal_1880` (clone) | 2,384 | 229 | 263 mm | 10.3 | no | displ < 5,000 t; slow → no class |
| Sete de Setembro | brazil | `starter_b_brazil_1880` (clone) | 2,174 | 114 | 300-pdr | 12 | no | displ/belt fail |
| Fusō | japan | `starter_b_japan_1880` (clone) | 3,717 | 229 | 235 mm | 13 | no | displ < 5,000 t |
| Numancia / Vitoria | spain | `starter_b_spain_1880` (clone) | 7,189 / 7,135 | 130 | 254 mm | 10 / 12 | no | belt 130 < 152 mm; slow |
| Wei Yuen | qing | `starter_b_qing_1880` (clone) | 1,258 | 0 | 160 mm | 11 | no | displ < 2,000 t; speed < 16 kn → no class |
| Canonicus / Trenton | usa | `starter_b_usa_1880` (clone) | 2,100 / 3,800 | 127 / 0 | 381 mm SB / 203 mm | 8 / 14 | no | displ/belt fail; smoothbore prohibited |
| Kaiser Max | austria_hungary | `starter_b_austria_hungary_1880` (clone) | 3,548 | 205 | 209 mm | 13.3 | no | displ < 5,000 t |

**Conclusion.** The R2 blocker is not the gun catalogue: even once the missing
families exist, none of the listed ships can be a legal *B* starter, and the
slow, belted coast-defence ships do not classify as CA/CL/KE/DD/AMC either
(`naturalClass` → null). Promoting any of them would fail
`NATION_STARTER_CLASS`/`NATION_STARTER_ILLEGAL` in the release gate. This is a
classification-schema limitation, not a content gap; the candidates stay
`DOCTRINE_TEMPLATE` and the blockers are recorded in ADR-0114.

## R3 (enabler) — domestic ceiling vs imported obtainable

`hardCapabilities.maxGunCaliberUm` is documented as the *domestic* ceiling but is
enforced as an absolute cap even for families the profile marks `IMPORTED`
(`componentVariants.ts`). Add an optional `maxImportedGunCaliberUm`:
the largest obtainable imported calibre. A `DOMESTIC` family is capped by
`maxGunCaliberUm`; an `IMPORTED`/`LICENSED` family is capped by
`maxImportedGunCaliberUm ?? maxGunCaliberUm`. No domestic ceiling is inflated and
`componentAccess` import semantics are preserved. Per-nation values are left
unset until a print source justifies a domestic figure (no invention).

## R4 — re-sourcing

Non-UK shell masses / moulded depths currently `ESTIMATE`/`UNVERIFIED` stay as
they are unless a real period source is found (Mackinlay *Text Book of Gunnery*,
Brassey *Naval Annual*, Conway's 1860–1905). No label is promoted without a
citation.

## Deliverables

- R3: schema field (`content-schema` + `nationProfile`) + enforcement + tests.
- ADR-0114 (National content) recording R3 and the R2 blocker analysis.
- Extended `historicalStarters.test.ts` guard that the deferred candidates stay
  unpromoted (no false substitution) and that imports are access-aware.
- Updated `docs/nations/national-content-completeness.md`.
