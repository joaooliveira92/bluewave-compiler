# CONTENT-2 — 03: PRE_WAR ship-design templates

## Question

Which production ship-design templates should be authored for the PRE_WAR band,
as real vessels/classes, constrained by the campaign compiler's design schema?

## Type

research

## Status

resolved

## Notes

`DesignTemplateSchema` requires: `designId`, `nationId`, `className`, `hullType`,
`displacementKg` (int, positive), `speedUms` (num), `armorBeltUm` (num),
`mainGuns:{caliber,count,mounts}`, `machineryType`, `hitPoints` (int), `crewComplement`
(int). CONTENT-1 convention: `speedUms`/`displacementKg`/`armorBeltUm` authored as
**integers** in the YAML because the campaign compiler normalizes them through
`SafeInt`.

## Answer

Production PRE_WAR design templates (real classes), integer stats as noted:

| class | nation | date | type | outline |
|---|---|---|---|---|
| Dreadnought-class (HMS _Dreadnought_) | GBR | 1906 | dreadnought | 10×12", 18,120 lt, ~21 kt |
| Invincible-class battlecruiser | GBR | 1908 | battlecruiser | 8×12", ~25 kt |
| Orion-class super-dreadnought | GBR | 1912 | super-dreadnought | 10×13.5", superfiring |
| Queen Elizabeth-class | GBR | 1915 | super-dreadnought | 8×15", oil-fired |
| South Carolina-class | USA | 1908 | dreadnought | 8×12", superfiring (all-big-gun) |
| Nassau-class | DEU | 1908 | dreadnought | 12×11", 6-turret broadside |
| Kōnig-class (15") later German | DEU | 1914 | super-dreadnought | 10×12"→15" line |
| Kongō-class battlecruiser | JPN | 1913 | battlecruiser | 8×14", Vickers 356 mm |
| Fuso-class | JPN | 1914 | super-dreadnought | 12×14" |
| Courbet-class | FRA | 1913 | dreadnought | 12×12" |
| Dante Alighieri-class | ITA | 1913 | dreadnought | 12×12", triples |

The follow-up implementation sprint authors the concrete integer inputs
(converting long-tons→kg, knots→m/s, belt inches→micrometres) under the
compiler's `SafeInt` acceptance, derives `hitPoints`/`crewComplement`
consistently, and assigns each design a `designFamilyId`.

Sources: `docs/research/content-2-prewar-era-tech-and-design.md`.