# CONTENT-3 — 03: INTERWAR ship-design templates

## Question

Which production ship-design templates to author for the INTERWAR band, as real
classes, with engine constraints?

## Type

research

## Status

resolved

## Notes

`DesignTemplateSchema` (content-schema `design.ts`): `designId`, `nationId`,
`className`, `hullType`, `displacementKg` (int kg), `speedUms` (m/s), `armorBeltUm`
(mm), `mainGuns:{caliber,count,mounts}`, `machineryType`, `hitPoints`,
`crewComplement`. CONTENT-1/2 convention: integer inputs accepted by the
compiler's `SafeInt`; `nationId` uses the 14-pack slug set.

## Answer

Ten real INTERWAR classes (grounded specs from the research worker), authored as
integer-converted templates in the follow-up sprint:

| class | nation | yr | disp lt | kt | belt in | mm | calibre mm | count | mounts | crew |
|---|---|---|---|---|---|---|---|---|---|---|
| Nelson | uk | 1927 | 33,300 | 23 | 14 | 356 | 406 | 9 | 3 | 1,361 |
| King George V | uk | 1937 | ~38,000 | 28 | 14.7 | 373 | 356 | 10 | 3 | 1,422 |
| North Carolina | usa | 1937 | 36,600 | 28 | 12 | 305 | 406 | 9 | 3 | 1,880 |
| Yamato | japan | 1937 | 70,000 | 27 | 16 | 410 | 460 | 9 | 3 | 2,767 |
| Bismarck | germany | 1936 | 41,000 | 30 | 12.6 | 320 | 380 | 8 | 4 | 2,065 |
| Scharnhorst | germany | 1935 | 32,100 | 31 | 12.6 | 320 | 283 | 9 | 3 | 1,669 |
| Littorio | italy | 1934 | 40,081 | 30 | 11 | 280 | 381 | 9 | 3 | 1,830 |
| Richelieu | france | 1935 | 37,250 | 32 | 12.9 | 327 | 380 | 8 | 2 | 1,569 |
| Nagato | japan | 1920 | 32,200 | 26.5 | 12 | 305 | 410 | 8 | 4 | 1,333 |
| Myōkō (CA) | japan | 1929 | 11,633 | 35.5 | 4 | 102 | 203 | 10 | 5 | 773 |

Implementation conversions (per CONTENT-2): `displacementKg = round(lt*1016)`;
`speedUms = round(kt*0.5144)`; `armorBeltUm` = mm belt; `hitPoints` ≈
displacement_t/200; `crewComplement` = crew. Machinery: geared steam turbines,
oil-fired. `hullType`: `"fast_battleship"` (NC/KGV/Yamato/Bismarck/Scharnhorst/
Littorio/Richelieu), `"battleship"` (Nelson/Nagato), `"heavy_cruiser"` (Myōkō).
Unique ids `des_iw_<nation>_<class>` / `fam_iw_<nation>_<class>`.

Sources: `docs/research/content-3-interwar-era-tech-and-design.md`.