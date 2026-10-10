# Research: Ship-building catalogue — PRE-1880 armament (guns in service by January 1880)

Factual grounding for the pre-1880 gun components missing from
`content/production/1880/ship-building/components.yaml` (no gun introduced before 1883 exists there,
so no gun-armed warship can be built at the `scen_1880` January 1880 start). Research-only; no catalogue
file is authored here. This note follows the method, source grades and confidence labels of
`docs/research/ship-building-early-band.md` §"Method, source grades and confidence labels" and its
style (markdown tables, `item | figure | unit | source | confidence`). Captured 2026-10-10.

Because the task explicitly covers guns *entered before 1883*, this note is deliberately **narrower** than
the two earlier EARLY-band notes: it does not repeat 1880s–1899 BL/QF data. Read this alongside
`ship-building-early-band.md` (which begins at the BL 9.2"/31.5 of 1881) and `ship-building-early-band-2.md`.

## Method, sources and what could not be reached

| Tag    | Source                                                                                                                                                                                                                              | Grade                                                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [TB87] | G. Mackinlay, _Text Book of Gunnery, 1887_ (2nd ed., London: HMSO), archive.org `1887-textbook-of-gunnery-second-edition` — **read directly as full text**. Contains **Table XVI** (British service rifled ordnance) and **Table XVII** (foreign ordnance, shortened from Capt. Orde Browne's table in Brassey's _Naval Annual 1886_): gun mass/nature, calibre, charge, projectile, M.V., energy and perforation. | Primary (HMSO service manual). OCR: the vertical column headers of Table XVI were lost; where a figure is doubtful it is flagged. |
| [B86]  | T. A. Brassey (ed.), _The Naval Annual 1886_ (London: J. Griffin), archive.org `navalannual1886` — **read directly as full text**. Contains the French Commission's comparative tables "Artillery in France and Abroad" (pp. 476–479): French, English and German guns with **calibre and "calculated thickness of iron plate pierced by gun, point blank fire"**, plus a French narrative on the 100-ton Italian guns and coast defence. | Primary/contemporary annual (French official report reprinted).                                                                 |
| [B82]  | T. A. Brassey, _The British Navy, vol. II_ (London: Longmans, 1882), archive.org `britishnavyitss04brasgoog` — **read directly**. p. 95 "Cost of Woolwich Guns": Krupp 71-ton £22,000; Armstrong 100-ton coiled wrought-iron £16,000; Woolwich (Fraser) wrought-iron coil 80-ton £10,000; Krupp steel 5 francs/kg vs Armstrong 3 francs/kg. | Primary (contemporary).                                                                                                         |
| [TOC77]| _Treatise on the Construction and Manufacture of Ordnance in the British Service_, War Office, 1877 — **not opened** (archive.org `treatiseonconst00offigoog` has no OCR text file); treated as a print lead only, figures carried from the Wikipedia leads below.                                                                  | Primary but relayed (SINGLE-SOURCE max).                                                                                       |
| [WP]   | Wikipedia gun articles, used **only to find leads**: they name the print works (Brassey 1882; Mackinlay 1887; Treatise on Construction of Service Ordnance 1877/1879; Treatise on Ammunition 1877; Text Book of Gunnery 1893/1902; The Engineer 1876; Journal of the Royal Artillery 1999). Every [WP] row is capped at SINGLE-SOURCE and the named print work is given. **Wikipedia is never a source.** | Lead only.                                                                                                                     |
| [NW]   | navweaps.com (Tony DiGiulian), per the brief. **Checked and found not to cover these guns**: the British index starts at the 10"/32 and 12"/25 BL (1885), the German index at the 24 cm/35 K L/35 and 28 cm/35–40 MRK, the French index at the 305 mm models of 1887+; there are **no pages for the Woolwich RMLs, the French 27/32/34 cm mle 1870/1875, the German 26 cm RK L/22, or the Italian 450 mm Armstrong 100-ton**. | Cross-check (negative result).                                                                                                 |
| [DEV]  | _The Engineer_ (1876, vol. XLII), _Journal of the Royal Artillery_ (1999) — **not opened**; reached only through [WP]'s 100-ton-gun article.                                                                                          | Print secondary relayed.                                                                                                       |

Limits: archive.org OCR of the rotated foreign-ordnance tables in [TB87] Table XVII and the ship tables in
[B86] is column-scrambled; only isolated rows are legible and each such row is flagged. The 1877 and 1879
Treatises, the RML gun handbooks, and the 1902 _Text Book of Gunnery_ (cgsc.cdmhost.com link returns 403 in
this session) were not opened. navweaps.com has no page for any gun in this note. Where a figure could not
be grounded, an explicit labelled ESTIMATE with the calculation is given rather than a point value.

Conversions used throughout: 1 lb = 0.4536 kg; 1 long ton = 1,016.05 kg; 1 cwt = 112 lb = 50.80 kg;
1 in = 25.4 mm; 1 fps = 0.3048 m/s; 1 yd = 0.9144 m.

### How [TB87] Table XVI is read

Table XVI lists, for each British gun, the **nature/weight of the gun** (e.g. "16-in., 80 tons"),
**charge (full)**, **projectile** (Palliser shot for the heavy natures; filled common shell for the light
ones), **muzzle velocity**, **energy**, and **"Perforation of wrought iron"** in three columns. The three
perforation columns' range headings were lost in OCR (see §Gaps), so this note uses the **point-blank
"calculated thickness of iron plate"** figures from [B86]'s French Commission table as the sourced
penetration value wherever possible, and reports the [TB87] three-column series as a range with the
uncertainty flagged.

---

## 1. British rifled muzzle-loaders (RML), Woolwich pattern

All charge/projectile/M.V. figures are read from [TB87] Table XVI (primary). Gun masses are the gun's own
designation tonnage (the authoritative service weight). Penetration is [B86] French Commission
"iron plate pierced, point-blank" unless noted. In-service years: [WP] leads to the named print works,
capped SINGLE-SOURCE; undated entries are marked UNVERIFIED with the range I could support.

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| **RML 16-in 80-ton** — in service | 1880 (first & only ship HMS _Inflexible_ 1880; also Dover coast turret) | year | [WP]→[B82]/[TB87] | SINGLE-SOURCE |
| 16-in — calibre | 406.4 (16 in) | mm | 16 × 25.4 | VERIFIED (arithmetic) |
| 16-in — gun mass | 80 long tons (81,284) | t (kg) | [TB87] Table XVI ("16-in., 80 tons") | VERIFIED (primary) |
| 16-in — projectile (Palliser/common/shrapnel) | 1,684 (763.9) | lb (kg) | [TB87]; [WP] | VERIFIED ([TB87]); [WP] agrees |
| 16-in — full charge, prismatic brown | 450 (204.1) | lb (kg) | [TB87] | VERIFIED (primary) |
| 16-in — muzzle velocity | 1,590 (484.6) | fps (m/s) | [TB87] | VERIFIED (primary) |
| 16-in — perforation of wrought iron | 24.7 / 23.1 / 21.3 (three columns, ranges illegible) | in | [TB87] | SINGLE-SOURCE (range headers lost) |
| 16-in — point-blank iron plate pierced | 74 cm (29.2) | cm (in) | [B86] p.477 French Commission table | SINGLE-SOURCE (contemporary report) |
| 16-in — ROF | ~1 round / 2½–4 min (≈0.25–0.4) | rds/min | [WP]→[DEV] (100-ton analogue 1/6 min); no direct source | ESTIMATE for the exact figure |
| 16-in — unit cost | £10,000 | GBP | [B82] p.95 (Woolwich Fraser 80-ton coil gun) | VERIFIED (primary) |
| 16-in — role by 1880 | MAIN (capital) | — | judgement from armament | VERIFIED (classification) |
| **RML 12.5-in 38-ton** — in service | 1875 (designed Jan 1875; first ship HMS _Dreadnought_ 1879) | year | [WP]→Treatise on Construction of Service Ordnance 1877 | SINGLE-SOURCE |
| 12.5-in — calibre | 317.5 (12.5 in) | mm | 12.5 × 25.4 | VERIFIED (arithmetic) |
| 12.5-in — gun mass | 38 long tons (38,610) | t (kg) | [TB87] Table XVI ("12.5-in., 38 tons") | VERIFIED (primary) |
| 12.5-in — projectile | 809 lb 6 oz (367.1) | lb (kg) | [TB87] (Mk II); [WP] 800–809 | VERIFIED ([TB87]) |
| 12.5-in — full charge (Mk II), Prism2 black | 210 (95.3) | lb (kg) | [TB87] | VERIFIED (primary) |
| 12.5-in — full/battering charge (Mk I), P / P2 | 130 (59.0) | lb (kg) | [WP]→Treatise … 1877 p.347 | SINGLE-SOURCE |
| 12.5-in — muzzle velocity (Mk II / Mk I) | 1,575 (480) / 1,425 (434) | fps (m/s) | [TB87] (Mk II); [WP] (Mk I) | VERIFIED ([TB87]); SINGLE-SOURCE (Mk I) |
| 12.5-in — perforation of wrought iron | 18.4 / 17.5 / 15.9 (ranges illegible) | in | [TB87] | SINGLE-SOURCE |
| 12.5-in — point-blank iron plate pierced | 46 cm (18.1) | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| 12.5-in — ROF | ~1 round / 3–5 min (≈0.2–0.33) | rds/min | no direct source | ESTIMATE (heaviest single-turret RMLs are slower than 10-in) |
| 12.5-in — role by 1880 | MAIN (capital) | — | — | VERIFIED |
| **RML 12-in 35-ton** — in service | c.1868 (designed 1867–68) | year | no direct source | UNVERIFIED (range 1867–1869) |
| 12-in 35-ton — calibre | 304.8 (12 in) | mm | 12 × 25.4 | VERIFIED (arithmetic) |
| 12-in 35-ton — gun mass | 35 long tons (35,562) | t (kg) | [TB87] Table XVI ("12-in., 35 tons") | VERIFIED (primary) |
| 12-in 35-ton — projectile | 706 lb 12 oz (320.6) | lb (kg) | [TB87] | VERIFIED (primary) |
| 12-in 35-ton — full charge, P2 | 140 (63.5) | lb (kg) | [TB87] | VERIFIED (primary) |
| 12-in 35-ton — muzzle velocity | 1,390 (423.7) | fps (m/s) | [TB87] | VERIFIED (primary) |
| 12-in 35-ton — perforation of wrought iron | 15.9 / 14.4 / 13.2 (ranges illegible) | in | [TB87] | SINGLE-SOURCE |
| 12-in 35-ton — point-blank iron plate pierced | 37 cm (14.6) | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| 12-in 35-ton — ROF | ~1 round / 3–5 min (≈0.2–0.33) | rds/min | no direct source | ESTIMATE |
| 12-in 35-ton — role by 1880 | MAIN (capital) | — | — | VERIFIED |
| **RML 12-in 25-ton** — in service | 1866 (Mk I), 1867 (Mk II) | year | [WP]→Treatise … 1877 pp.92–94 | SINGLE-SOURCE |
| 12-in 25-ton — calibre | 304.8 (12 in) | mm | 12 × 25.4 | VERIFIED (arithmetic) |
| 12-in 25-ton — gun mass (Mk II) | 25 long tons (25,401); Mk I 23.5 t (23,900) | t (kg) | [TB87] ("12-in., 25 tons"); [WP] | VERIFIED ([TB87]) |
| 12-in 25-ton — projectile (Palliser / common) | 608 lb 6 oz (276.0) / 497 lb (225.4) | lb (kg) | [TB87] (Palliser); [WP] (common) | VERIFIED ([TB87]); SINGLE-SOURCE (common) |
| 12-in 25-ton — battering charge, P2 (full charge P) | 85 (38.6) / full 55 (24.9) | lb (kg) | [TB87]; [WP]→Treatise on Ammunition 1877 | VERIFIED ([TB87]); SINGLE-SOURCE (full) |
| 12-in 25-ton — muzzle velocity | 1,292 (393.8) (battering; 1,300 quoted for 600-lb shell) | fps (m/s) | [TB87]; [WP] | VERIFIED ([TB87]) |
| 12-in 25-ton — perforation of wrought iron | 13.5 / 12.6 / 11.4 (ranges illegible) | in | [TB87] | SINGLE-SOURCE |
| 12-in 25-ton — point-blank iron plate pierced | 33 cm (13.0) | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| 12-in 25-ton — ROF | ~1 round / 2½–4 min (≈0.25–0.4) | rds/min | no direct source | ESTIMATE |
| 12-in 25-ton — unit cost | £1,715 13s 5d | GBP | [WP]→[B82] p.38 | SINGLE-SOURCE (relayed; volume read for other pages) |
| 12-in 25-ton — role by 1880 | MAIN | — | — | VERIFIED |
| **RML 11-in 25-ton** — in service | c.1866–67 | year | no direct source | UNVERIFIED |
| 11-in — calibre | 279.4 (11 in) | mm | 11 × 25.4 | VERIFIED (arithmetic) |
| 11-in — gun mass | 25 long tons (25,401) | t (kg) | [TB87] ("11-in., 25 tons") | VERIFIED (primary) |
| 11-in — projectile (Palliser) | 543 lb 2 oz (246.3) | lb (kg) | [TB87] | VERIFIED (primary) |
| 11-in — full charge, P | 85 (38.6) | lb (kg) | [TB87] | VERIFIED (primary) |
| 11-in — muzzle velocity | 1,360 (414.5) | fps (m/s) | [TB87] | VERIFIED (primary) |
| 11-in — perforation of wrought iron | 14.3 / 12.8 / 11.5 (ranges illegible) | in | [TB87] | SINGLE-SOURCE |
| 11-in — point-blank iron plate pierced | 33 cm (13.0) | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| 11-in — ROF | ~1 round / 2½–4 min (≈0.25–0.4) | rds/min | no direct source | ESTIMATE |
| 11-in — role by 1880 | MAIN on central-battery ironclads (_Alexandra_, _Temeraire_); SECONDARY elsewhere | — | existing fleet note | VERIFIED (classification) |
| **RML 10-in 18-ton** — in service | c.1867–68 (Mk II) | year | no direct source | UNVERIFIED |
| 10-in — calibre | 254 (10 in) | mm | 10 × 25.4 | VERIFIED (arithmetic) |
| 10-in — gun mass | 18 long tons (18,289) | t (kg) | [TB87] ("10-in., 18 tons") | VERIFIED (primary) |
| 10-in — projectile (Palliser) | 400 (181.4) | lb (kg) | [WP] | SINGLE-SOURCE |
| 10-in — full charge, P | 70 (31.8) | lb (kg) | [TB87] | VERIFIED (primary) |
| 10-in — muzzle velocity | 1,379 (420.3) | fps (m/s) | [TB87] | VERIFIED (primary) |
| 10-in — perforation of wrought iron | 12.9 / 11.6 / 10.4 (ranges illegible) | in | [TB87] | SINGLE-SOURCE |
| 10-in — point-blank iron plate pierced | 30 cm (11.8) | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| 10-in — ROF | ~1 round / 2–3 min (≈0.33–0.5) | rds/min | no direct source | ESTIMATE |
| 10-in — role by 1880 | SECONDARY on large ships; MAIN on smaller ironclads | — | — | VERIFIED (classification) |
| **RML 9-in 12-ton** — in service | 1865 (Mk I) | year | [WP] | SINGLE-SOURCE |
| 9-in — calibre | 228.6 (9 in) | mm | 9 × 25.4 | VERIFIED (arithmetic) |
| 9-in — gun mass | 12 long tons (12,193) | t (kg) | [TB87] ("9-in., 12 tons") | VERIFIED (primary) |
| 9-in — projectile (Palliser/common) | 250–256 (113–116) | lb (kg) | [WP]→Treatise on Ammunition 1877 / [TB87] (253 lb 5 oz) | SINGLE-SOURCE |
| 9-in — battering charge P / full charge RLG | 50 (22.7) / 30 (13.6) | lb (kg) | [WP]→Treatise on Ammunition 1877 p.220; [TB87] | VERIFIED ([TB87]); SINGLE-SOURCE (split) |
| 9-in — muzzle velocity | 1,440 (438.9) (battering 1,420) | fps (m/s) | [TB87]; [WP] | VERIFIED ([TB87]) |
| 9-in — perforation of wrought iron | 11.3 / 9.6 / 8.4 (ranges illegible) | in | [TB87] | SINGLE-SOURCE |
| 9-in — point-blank iron plate pierced | 25 cm (9.8) | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| 9-in — ROF | ~1 round / 1½–2 min (≈0.5–0.67) | rds/min | no direct source | ESTIMATE |
| 9-in — unit cost | £1,000 (1875) / £739 17s 8d (1882) | GBP | [WP]→Hansard 22 Jun 1875; [B82] p.38 | SINGLE-SOURCE (relayed) |
| 9-in — role by 1880 | SECONDARY | — | — | VERIFIED |
| **RML 8-in 9-ton** (the 8-in RML actually in service — **not** an 11-ton gun) | c.1866–68 | year | no direct source | UNVERIFIED |
| 8-in — calibre | 203.2 (8 in) | mm | 8 × 25.4 | VERIFIED (arithmetic) |
| 8-in — gun mass | 9 long tons (9,144) | t (kg) | [TB87] ("8-in., 9 tons") | VERIFIED (primary) |
| 8-in — projectile (Palliser) | ~175 (79.4) | lb (kg) | no direct source | UNVERIFIED (use 175 lb; range 160–190) |
| 8-in — full charge, P | 35 (15.9) | lb (kg) | [TB87] | VERIFIED (primary) |
| 8-in — muzzle velocity | 1,384 (421.8) | fps (m/s) | [TB87] | VERIFIED (primary) |
| 8-in — perforation of wrought iron | 9.6 / 8.1 / 7.0 (ranges illegible) | in | [TB87] | SINGLE-SOURCE |
| 8-in — point-blank iron plate pierced | 21 cm (8.3) | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| 8-in — ROF | ~1 round / 1–1½ min (≈0.67–1.0) | rds/min | no direct source | ESTIMATE |
| 8-in — role by 1880 | SECONDARY | — | — | VERIFIED |
| **RML 7-in 7-ton** — in service | c.1866–69 | year | no direct source | UNVERIFIED |
| 7-in — calibre | 177.8 (7 in) | mm | 7 × 25.4 | VERIFIED (arithmetic) |
| 7-in — gun mass | 7 long tons (7,112) | t (kg) | [TB87] ("7-in., 7 tons") | VERIFIED (primary) |
| 7-in — projectile | ~115 (52.2) | lb (kg) | no direct source | UNVERIFIED (use 115 lb; range 110–120) |
| 7-in — full charge, P | 30 (13.6) | lb (kg) | [TB87] | VERIFIED (primary) |
| 7-in — muzzle velocity | 1,561 (475.8) | fps (m/s) | [TB87] | VERIFIED (primary) |
| 7-in — perforation of wrought iron | 9.5 / 7.7 / 6.4 (ranges illegible) | in | [TB87] | SINGLE-SOURCE |
| 7-in — point-blank iron plate pierced | 18 cm (7.1) | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| 7-in — ROF | ~1 round / 1–1½ min (≈0.67–1.0) | rds/min | no direct source | ESTIMATE |
| 7-in — role by 1880 | SECONDARY | — | — | VERIFIED |
| **RML 64-pdr 71-cwt (converted, 6.29-in)** — in service | 1870 | year | [WP]→Treatise on Construction … 1879 pp.233–238 | SINGLE-SOURCE |
| 64-pdr 71-cwt — calibre | 159.8 (6.29 in) | mm | [WP]; [B86] p.477 (160 mm) | SINGLE-SOURCE |
| 64-pdr 71-cwt — gun mass | 7,896 lb (3,582) | lb (kg) | [WP]→Treatise … 1879 | SINGLE-SOURCE |
| 64-pdr 71-cwt — projectile | 64 (29.0) | lb (kg) | [WP]; [B86] | SINGLE-SOURCE |
| 64-pdr 71-cwt — full charge, black powder (silk bag) | 8 (3.6) | lb (kg) | [TB87] (64-pr. 8 lb R.L.G.); [WP] | VERIFIED ([TB87]) |
| 64-pdr 71-cwt — muzzle velocity | 1,230 (374.9); 1,260 (384.0) for 64-cwt | fps (m/s) | [WP]; [TB87] | SINGLE-SOURCE ([WP]); VERIFIED ([TB87] for 64-cwt) |
| 64-pdr 71-cwt — point-blank iron plate pierced | 12 cm (4.72); 64-cwt version 13 cm (5.1) | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| 64-pdr 71-cwt — ROF | 1 round / 3 min (≈0.33); 64-cwt 1 round / ~1½ min | rds/min | [WP]; [TB87] worked example | SINGLE-SOURCE ([WP]); VERIFIED ([TB87] 64-cwt) |
| 64-pdr 71-cwt — role by 1880 | SECONDARY (sea service; obsolete in that role by 1886) | — | [WP]→Treatise 1886 | SINGLE-SOURCE |
| **RML 40-pdr 35-cwt (4.75-in)** — in RN service by 1880? | c.1860s; the [TB87] Table XVI lists it as service ordnance in 1886 | year | [TB87] Table XVI | UNVERIFIED for a naval (sea-service) date by Jan 1880 — treat as **not confidently in RN service by 1880** |
| 40-pdr — calibre | 120.7 (4.75 in) | mm | [TB87] (4.75 in); 4.75 × 25.4 | VERIFIED (arithmetic) |
| 40-pdr — gun mass | 35 cwt (1,778) | cwt (kg) | [TB87] Table XVI | VERIFIED (primary) |
| 40-pdr — projectile | 40 (18.1) | lb (kg) | [TB87] | VERIFIED (primary) |
| 40-pdr — full charge, R.L.G. | 7 (3.2) | lb (kg) | [TB87] | VERIFIED (primary) |
| 40-pdr — muzzle velocity | 1,425 (434.3) | fps (m/s) | [TB87] | VERIFIED (primary) |
| 40-pdr — point-blank iron plate pierced | not listed for the 40-pdr | cm | [B86] | UNVERIFIED (ESTIMATE ~9 cm / 3.5 in, scaled from the 64-pdr 12 cm) |
| 40-pdr — role by 1880 | SECONDARY / land-service; RN sea service doubtful | — | — | UNVERIFIED |

## 2. Early British breech-loader in service by 1880

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| **BL 6-in 80-pdr Mk I** — in service | 1880 (first British 6-in BL after the switch from ML) | year | [WP]→[NW] WNBR_6-26_mk1 / Treatises | SINGLE-SOURCE |
| BL 6-in 80-pdr — calibre | 152.4 (6 in) | mm | 6 × 25.4 | VERIFIED (arithmetic) |
| BL 6-in 80-pdr — gun mass | 80 cwt (4,064); rebuilt 81 cwt (4,115) | cwt (kg) | [WP]→Treatise on Service Ordnance 1893 / TBG 1902 | SINGLE-SOURCE |
| BL 6-in 80-pdr — projectile | 80 (36.3); service projectile 78 lb 7 oz (35.6) | lb (kg) | [WP]→Victorian Navy manuals; [NW] path | SINGLE-SOURCE |
| BL 6-in 80-pdr — full charge, S.P. (gunpowder); "battering" pebble | 34 (15.4) / 42 (19.1) | lb (kg) | [WP]→"List of Service Ordnance 1891" in Brassey's Naval Annual 1894 | SINGLE-SOURCE |
| BL 6-in 80-pdr — muzzle velocity | 1,880 (573.0) | fps (m/s) | [WP]→Brassey 1894 | SINGLE-SOURCE |
| BL 6-in 80-pdr — point-blank iron plate pierced | 21 cm (8.3) ("6-inch of 81 cwt") | cm (in) | [B86] p.477 | SINGLE-SOURCE |
| BL 6-in 80-pdr — ROF | not sourced; breech-loader, so faster than the 64-pdr | rds/min | — | UNVERIFIED (ESTIMATE 1.5–3 rds/min for a hand-worked 4-ton BL; no source) |
| BL 6-in 80-pdr — role by 1880 | MAIN on gunboats/small cruisers; SECONDARY on larger | — | — | VERIFIED (classification) |

---

## 3. Foreign heavy guns in service by January 1880

Foreign ordnance data in this section is from [TB87] Table XVII (shortened from Capt. Orde Browne's table
in [B86]) where legible, and from [B86]'s French Commission "Artillery in France and Abroad" comparative
tables (pp. 476–479). Both are contemporary primaries, but the Table XVII OCR is column-scrambled and each
row is SINGLE-SOURCE at best; the [B86] tables are cleaner.

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| **French 27 cm mle 1870/1875 (274 mm)** — the gun of _Redoutable_ (1876) and _Devastation_ (1879) | in service 1870s | year | [B86] French Commission table | SINGLE-SOURCE |
| French 27 cm — calibre | 274 (274–274.4 mm; 10.7–10.8 in) | mm | [B86] p.476 | SINGLE-SOURCE |
| French 27 cm — projectile | 476.2 (216.0) (Patt. 1875) | lb (kg) | [TB87] Table XVII | SINGLE-SOURCE (OCR) |
| French 27 cm — full charge | 165.3 (75.0) (Patt. 1875) | lb (kg) | [TB87] Table XVII | SINGLE-SOURCE (OCR) |
| French 27 cm — muzzle velocity | 1,736 (529.1) (Patt. 1875) | fps (m/s) | [TB87] Table XVII | SINGLE-SOURCE (OCR) |
| French 27 cm — point-blank iron plate pierced | mle 1870: 34 cm (13.4); mle 1870 naval: 40 cm (15.7); mle 1875 no.1: 42 cm (16.5); mle 1875: 37 cm (14.6); mle 1875 naval: 46 cm (18.1) | cm (in) | [B86] p.476 | SINGLE-SOURCE |
| French 27 cm — ROF | no source | rds/min | — | UNVERIFIED (ESTIMATE 1–2 rds/min for a hand-worked 1870s BL/ML; no source) |
| French 27 cm — role by 1880 | MAIN (capital) | — | — | VERIFIED |
| **French 34 cm mle 1875 (340 mm)** — the barbette gun of _Amiral Duperré_ (1879) | in service 1875 | year | [B86] French Commission table | SINGLE-SOURCE |
| French 34 cm — calibre | 340 (13.3–13.8 in) | mm | [B86] p.476 | SINGLE-SOURCE |
| French 34 cm — point-blank iron plate pierced | mle 1875 short: 55 cm (21.7); mle 1875 long: 58 cm (22.8) | cm (in) | [B86] p.476 | SINGLE-SOURCE |
| French 34 cm — projectile / charge / M.V. | **not legibly recovered** | — | — | UNVERIFIED (ESTIMATE projectile ~350–380 kg, charge ~90–100 kg, M.V. ~500 m/s by scaling from the 27 cm and 42 cm rows; no source) |
| French 34 cm — role by 1880 | MAIN (capital) | — | — | VERIFIED |
| **French 32 cm (320 mm) mle 1870/1870–81 (coast)** | in service 1870s | year | [B86] | SINGLE-SOURCE |
| French 32 cm — calibre | 320 (12.5 in) | cm | [B86] p.476 | SINGLE-SOURCE |
| French 32 cm — point-blank iron plate pierced | short 1870: 41 cm (16.1); 1870–79: 48 cm (18.9); 1875: 51 cm (20.1); 1870–81 coast: 62 cm (24.4) | cm (in) | [B86] p.476 | SINGLE-SOURCE |
| French 32 cm — full charge (Patt. 1881) | 357.1 (162.0) | lb (kg) | [TB87] Table XVII (legible row) | SINGLE-SOURCE (OCR) |
| French 32 cm — projectile (Patt. 1881) | 925.9 (420.0) | lb (kg) | [TB87] Table XVII | SINGLE-SOURCE (OCR) |
| French 32 cm — role by 1880 | MAIN / coast | — | — | VERIFIED |
| **German 26 cm RK L/22** (Sachsen / Preussen / Kaiser classes) | in service 1870s (Sachsen class 1878) | year | existing fleet note; [B86] German table lists a 26 cm Krupp | SINGLE-SOURCE |
| German 26 cm — calibre | 260 (10.2 in) | mm | existing fleet note; [B86] | SINGLE-SOURCE |
| German 26 cm — projectile / charge / M.V. | **not legibly recovered from [TB87] Table XVII** | — | — | UNVERIFIED (a legible Krupp 26 cm row in the Austria block of Table XVII gives charge ~105 lb / projectile 395.7 lb, but that is the Austrian 26 cm, not the German L/22; do not treat as the German figure) |
| German 26 cm — point-blank iron plate pierced | 36–37 cm (14.2–14.6) (short-hooped Krupp 26 cm in [B86]) | cm (in) | [B86] p.478 German table | SINGLE-SOURCE (OCR of the 26 cm row partly lost) |
| German 26 cm — role by 1880 | MAIN on coast-defence/armoured corvettes | — | — | VERIFIED (classification) |
| **Italian 450 mm (17.72-in) Armstrong 100-ton** (Duilio / Dandolo; also Malta/Gibraltar) | in service 1877 (Italy); Dandolo/Devastation era | year | [WP]→[B82]/[TB87] | SINGLE-SOURCE |
| 100-ton — calibre | 450 (17.72 in) | mm | [TB87] Table XVI ("17.72-in., 100 tons") | VERIFIED (primary) |
| 100-ton — gun mass | 100 long tons (101,605); ~103 t (104,653) with mount fittings per [WP] | t (kg) | [TB87]; [WP] | VERIFIED ([TB87]); SINGLE-SOURCE ([WP] 103 t) |
| 100-ton — projectile (Palliser/common) | 1,968 (892.7) (AP); 2,000 (907) HE/shrapnel | lb (kg) | [TB87] (1,968 lb); [WP] (2,000 lb) | VERIFIED ([TB87]); SINGLE-SOURCE ([WP]) |
| 100-ton — full charge, prismatic black | 450 (204.1) | lb (kg) | [TB87] Table XVI | VERIFIED (primary) |
| 100-ton — muzzle velocity | 1,548 (471.8) | fps (m/s) | [TB87] | VERIFIED (primary) |
| 100-ton — perforation of wrought iron | 24.5 / 23.2 / 21.4 (ranges illegible) | in | [TB87] | SINGLE-SOURCE |
| 100-ton — point-blank iron plate pierced | [B86]'s French report states the 100-ton's penetration is **inferior to the French 42 cm** and its hard-iron projectiles break up; no clean cm figure | — | [B86] p.478 | SINGLE-SOURCE (qualitative) |
| 100-ton — ROF | 1 round / 6 min (≈0.17) | rds/min | [WP]→_Journal of the Royal Artillery_ 1999 | SINGLE-SOURCE |
| 100-ton — mount mass | mobile mount 20,680; platform 24,118; base 2,032 (coast mounting) | kg | [WP]→_The Engineer_ 1876 | SINGLE-SOURCE (a coast, not ship, mount) |
| 100-ton — unit cost | £16,000 (Armstrong 100-ton coiled wrought-iron) | GBP | [B82] p.95 | VERIFIED (primary) |
| 100-ton — role by 1880 | MAIN (capital) | — | — | VERIFIED |
| **Russian 12-in (305 mm) mle 1867/1877** (Petr Veliky) | in service 1870s | year | existing fleet note | SINGLE-SOURCE |
| Russian 12-in — calibre | 305 (12 in) | mm | existing fleet note | SINGLE-SOURCE |
| Russian 12-in — projectile / charge / M.V. / penetration | **not recovered** | — | — | UNVERIFIED (ESTIMATE projectile ~330–340 kg, charge ~80–90 kg, M.V. ~420–440 m/s by analogy with the 12-in 35-ton RML; no source) |
| Russian 12-in — role by 1880 | MAIN (capital) | — | — | VERIFIED |
| **Austro-Hungarian 28 cm (Tegetthoff class)** — Krupp BL | in service 1870s (Tegetthoff completed 1881) | year | existing fleet note; [TB87] Table XVII | SINGLE-SOURCE |
| Austrian 28 cm — calibre | 280 (11 in) | mm | [TB87] Table XVII (28) | SINGLE-SOURCE (OCR) |
| Austrian 28 cm — projectile | 557.8 (253.0) | lb (kg) | [TB87] Table XVII | SINGLE-SOURCE (OCR) |
| Austrian 28 cm — full charge | 123.5 (56.0) | lb (kg) | [TB87] Table XVII | SINGLE-SOURCE (OCR) |
| Austrian 28 cm — point-blank iron plate pierced | 40 cm (15.7) (Krupp 28 cm hooped) | cm (in) | [B86] p.478 | SINGLE-SOURCE |
| Austrian 28 cm — muzzle velocity / ROF | not recovered | — | — | UNVERIFIED (ESTIMATE M.V. ~430–450 m/s; ROF ~1 rds/min for a hand-worked Krupp BL; no source) |
| Austrian 28 cm — role by 1880 | MAIN (capital) | — | — | VERIFIED |
| **Japanese 24 cm (240 mm) Krupp** (Fusō, Kongō) | in service late 1870s (Fusō completed 1878) | year | existing fleet note | SINGLE-SOURCE |
| Japanese 24 cm — calibre | 240 (9.4 in) | mm | existing fleet note | SINGLE-SOURCE |
| Japanese 24 cm — projectile / charge / M.V. / penetration | **not recovered** | — | — | UNVERIFIED (ESTIMATE projectile ~160–190 kg, charge ~25–35 kg, M.V. ~430–450 m/s by analogy with the Krupp 26 cm / Austrian 28 cm; no source) |
| Japanese 24 cm — role by 1880 | MAIN (capital) | — | — | VERIFIED |

---

## 4. US smoothbore / rifled monitors and the Qing 12-in

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| **US 15-in Dahlgren (smoothbore)** — Amphitrite-class monitors | in service 1860s–1880s | year | existing fleet note | SINGLE-SOURCE |
| US 15-in — calibre | 381 (15 in) smoothbore | mm | — | VERIFIED (arithmetic/classification) |
| US 15-in — projectile | shot 440 (199.6); shell 330 (149.7); 15-in cored shot ~400 (181) | lb (kg) | no source opened | UNVERIFIED (standard US ordnance-manual figures; not verified in this session) |
| US 15-in — full charge, black powder | 50 (22.7) (for 440-lb shot); reduced 35 (15.9) | lb (kg) | no source opened | UNVERIFIED |
| US 15-in — muzzle velocity | ~1,150–1,250 (350–381) | fps (m/s) | no source opened | UNVERIFIED (ESTIMATE range) |
| US 15-in — penetration | low (smoothbore, no rifling) | — | — | UNVERIFIED (smoothbore: treat as poor / not armour-piercing) |
| US 15-in — role by 1880 | MAIN on monitors | — | — | VERIFIED (classification) |
| **US 11-in Dahlgren (smoothbore)** | — | year | — | UNVERIFIED |
| US 11-in — projectile / charge / M.V. | shell 136 (61.7) / shot 166 (75.3); charge 20 (9.1); M.V. ~1,230 (375) | lb (kg) / fps | no source opened | UNVERIFIED (estimates from US ordnance practice) |
| **US 10-in Dahlgren (smoothbore)** — Amphitrite class as built | — | year | existing fleet note (Amphitrite "gun-only armament") | SINGLE-SOURCE |
| US 10-in — projectile / charge / M.V. | shell 104 (47.2) / shot 124 (56.2); charge 15 (6.8); M.V. ~1,280 (390) | lb (kg) / fps | no source opened | UNVERIFIED |
| **US 10-in Parrott (rifled)** | — | year | — | UNVERIFIED |
| US 10-in Parrott — projectile / charge | ~300 lb (136) shell for the 10-in (300-pdr) rifle; charge ~15–20 lb | lb (kg) | no source opened | UNVERIFIED |
| **Qing 12-in (305 mm) Krupp — Dingyuan / Zhenyuan** | **NOT in service by Jan 1880** — ships laid down 1881, completed 1885; four 305 mm Krupp BL | year | existing fleet note | VERIFIED (exclude from the 1880 catalogue) |

Note on the US guns: the three Dahlgren natures are **smoothbores** (no rifling; spherical/oblong projectiles,
short range, essentially no wrought-iron perforation against modern armour) whereas the Parrotts are
**rifled**. The Amphitrite class as built in the late 1870s is usually described with 10-in smoothbores
(turret monitors), refitted later with 10-in BL rifles. Because no period US ordnance manual was opened in
this session, every US figure above is UNVERIFIED; a component author should treat these as placeholder
ranges, not catalogue values.

---

## 5. Catalogue-ready summary

One row per gun with the exact numeric values a component author would plug in. **Every value tagged; all
ESTIMATE / UNVERIFIED values are flagged so the author can decide.** Masses/shells/charges are integers in
kg (lb × 0.4536, rounded); M.V. in m/s (fps × 0.3048); penetration is wrought-iron point-blank where sourced.
`ROF` is practical sustained rounds/min.

| gun | in service | calibre mm | gun mass kg | shell kg | charge kg | propellant | MV m/s | ROF | pen. cm WI (pt-blank) | role | conf. summary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RML 16-in 80-ton | 1880 | 406 | 81,284 | 764 | 204 | prism brown | 485 | 0.25–0.4 (EST) | 74 | MAIN | mass/charge/shell/MV/penn VERIFIED–SINGLE; year SINGLE; ROF ESTIMATE |
| RML 12.5-in 38-ton | 1875 | 318 | 38,610 | 367 | 95 (Mk II) / 59 (Mk I) | Prism2 / P2 | 480 (Mk II) / 434 (Mk I) | 0.2–0.33 (EST) | 46 | MAIN | VERIFIED ([TB87]); Mk I + year SINGLE |
| RML 12-in 35-ton | c.1868 | 305 | 35,562 | 321 | 63.5 | P2 | 424 | 0.2–0.33 (EST) | 37 | MAIN | VERIFIED ([TB87]); year UNVERIFIED; ROF ESTIMATE |
| RML 12-in 25-ton | 1866 | 305 | 25,401 | 276 (Palliser) / 225 (common) | 38.6 (battering) | P/P2 | 394 | 0.25–0.4 (EST) | 33 | MAIN | VERIFIED ([TB87]); year/cost SINGLE; ROF ESTIMATE |
| RML 11-in 25-ton | c.1866–67 | 279 | 25,401 | 246 | 38.6 | P | 414 | 0.25–0.4 (EST) | 33 | MAIN/SEC | VERIFIED ([TB87]); year UNVERIFIED; ROF ESTIMATE |
| RML 10-in 18-ton | c.1867–68 | 254 | 18,289 | 181 | 31.8 | P | 420 | 0.33–0.5 (EST) | 30 | SEC/MAIN small | VERIFIED ([TB87]); shell SINGLE; year UNVERIFIED; ROF ESTIMATE |
| RML 9-in 12-ton | 1865 | 229 | 12,193 | 113 | 22.7 (battering) / 13.6 (full) | P / RLG | 439 | 0.5–0.67 (EST) | 25 | SEC | VERIFIED ([TB87]); split charge/year/cost SINGLE; ROF ESTIMATE |
| RML 8-in 9-ton | c.1866–68 | 203 | 9,144 | 79 (UNVERIFIED 73–86) | 15.9 | P | 422 | 0.67–1.0 (EST) | 21 | SEC | mass/charge/MV/penn VERIFIED–SINGLE; shell+year+ROF UNVERIFIED/ESTIMATE |
| RML 7-in 7-ton | c.1866–69 | 178 | 7,112 | 52 (UNVERIFIED 50–54) | 13.6 | P | 476 | 0.67–1.0 (EST) | 18 | SEC | mass/charge/MV/penn VERIFIED–SINGLE; shell+year+ROF UNVERIFIED/ESTIMATE |
| RML 64-pdr 71-cwt | 1870 | 160 | 3,582 | 29 | 3.6 | black (RLG) | 375 | 0.33 | 12 | SEC | mass/shell/charge/year SINGLE; MV/penn/ROF SINGLE |
| RML 40-pdr 35-cwt | c.1860s (sea service by 1880 doubtful) | 121 | 1,778 | 18 | 3.2 | RLG | 434 | n/a | ~9 (EST) | SEC/land | mass/proj/charge/MV VERIFIED ([TB87]); year+penn UNVERIFIED/ESTIMATE |
| BL 6-in 80-pdr Mk I | 1880 | 152 | 4,064 (80 cwt) / 4,115 (81 cwt) | 36 | 15.4 (SP) / 19.1 (pebble) | S.P. / pebble | 573 | 1.5–3 (EST) | 21 | MAIN small/SEC | mass/shell/charge/MV/penn SINGLE; ROF ESTIMATE |
| French 27 cm mle 1870/1875 | 1870s | 274 | not recovered | 216 | 75 | black | 529 | 1–2 (EST) | 34–46 | MAIN | calibre/proj/charge/MV/penn SINGLE ([TB87]/[B86]); mass+ROF UNVERIFIED/ESTIMATE |
| French 34 cm mle 1875 | 1875 | 340 | not recovered | ~365 (EST) | ~95 (EST) | black | ~500 (EST) | 1–2 (EST) | 55–58 | MAIN | calibre/penn SINGLE; shell/charge/MV/mass/ROF UNVERIFIED/ESTIMATE |
| French 32 cm mle 1870/1881 | 1870s | 320 | not recovered | 420 (Patt 1881) | 162 (Patt 1881) | black | not recovered | 1–2 (EST) | 41–62 | MAIN/coast | calibre/penn/proj/charge SINGLE; MV/mass/ROF UNVERIFIED |
| German 26 cm RK L/22 | 1870s | 260 | not recovered | not recovered | not recovered | black | not recovered | ~1 (EST) | 36–37 | MAIN | calibre/penn SINGLE ([B86]); rest UNVERIFIED |
| Italian 450 mm Armstrong 100-ton | 1877 | 450 | 101,605 (gun) / 104,653 (with fittings) | 893 (AP) / 907 (HE) | 204 | prism black | 472 | 0.17 | Table XVI 21–25 in; [B86] says < French 42 cm | MAIN | mass/calibre/shell/charge/MV VERIFIED ([TB87]); ROF/cost/pen SINGLE |
| Russian 12-in mle 1867/1877 | 1870s | 305 | not recovered | ~335 (EST) | ~85 (EST) | black | ~430 (EST) | ~1 (EST) | not found | MAIN | calibre/year SINGLE; all else UNVERIFIED/ESTIMATE |
| Austrian 28 cm (Tegetthoff) | 1870s | 280 | not recovered | 253 | 56 | black | ~440 (EST) | ~1 (EST) | 40 | MAIN | calibre/proj/charge/penn SINGLE ([TB87]/[B86]); mass/MV/ROF UNVERIFIED/ESTIMATE |
| Japanese 24 cm Krupp | late 1870s | 240 | not recovered | ~175 (EST) | ~30 (EST) | black | ~440 (EST) | ~1 (EST) | not found | MAIN | calibre/year SINGLE; shell/charge/MV/ROF UNVERIFIED/ESTIMATE |
| US 15-in Dahlgren (smoothbore) | 1860s | 381 | not recovered | 200 (shot) / 150 (shell) | 23 | black | 350–381 (EST) | ~0.5–1 (EST) | low (smoothbore) | MAIN monitor | all UNVERIFIED |
| US 11-in Dahlgren (smoothbore) | 1860s | 279 | not recovered | 62 (shell) / 75 (shot) | 9 | black | ~375 (EST) | ~1 (EST) | low (smoothbore) | MAIN/SEC | all UNVERIFIED |
| US 10-in Dahlgren (smoothbore) | 1860s | 254 | not recovered | 47 (shell) / 56 (shot) | 7 | black | ~390 (EST) | ~1 (EST) | low (smoothbore) | MAIN monitor | all UNVERIFIED |
| US 10-in Parrott (rifled) | 1860s | 254 | not recovered | ~136 (300-pdr shell) | ~8 | black | not recovered | ~0.5 (EST) | not found | SEC | all UNVERIFIED |
| Qing 12-in Krupp (Dingyuan) | **NOT before 1880** (ships 1881–85) | 305 | — | — | — | — | — | — | — | — | EXCLUDE from the 1880 catalogue |

---

## 6. Gaps and confidence

| item | status | primary that would settle it |
| --- | --- | --- |
| [TB87] Table XVI three "perforation of wrought iron" columns' range headings | UNVERIFIED (OCR lost the vertical headers) | a clean scan of the 1887 Table XVI (or the 1902 Table XII), or the RN "List of Service Rifled Ordnance 1886" |
| In-service years for the 12-in 35-ton, 11-in 25-ton, 10-in 18-ton, 8-in 9-ton, 7-in 7-ton, 64-pdr 64-cwt | UNVERIFIED (ranges given) | Treatise on Construction … 1877/1879 (opened only via [WP]); the RML gun handbooks |
| RML projectile weights for the 10-/9-/8-/7-in in [TB87] | partially legible (10-in from [WP], 9-in from [WP], 8-/7-in UNVERIFIED) | clean 1887 Table XVI, or the RML gun handbooks |
| Practical ROF for all heavy RMLs | ESTIMATE (only the 64-pdr 64-cwt 1½-min and 100-ton 6-min examples are primary; heavy RML reload already BALANCE TARGET 120,000–300,000 ms in `docs/research/b3-m2-gunnery.md`) | HMS _Vernon_ drill books; RN gunnery practice records |
| Ship turret/barbette mount masses (all) | UNVERIFIED except the 100-ton coast mount ([WP]→_The Engineer_ 1876) | Elswick/Vickers catalogue; Trans. INA papers on mountings |
| Per-gun cost for the 12-in 25-ton and 9-in 12-ton | SINGLE-SOURCE relayed via [WP]→[B82] p.38; only the 80-ton £10,000, 100-ton £16,000 and the £200/ton rule are source-verified | Brassey 1882 p.38 (volume opened, that page not isolated) |
| French 34 cm / 32 cm charge, projectile, M.V. | UNVERIFIED / partly legible | [TB87] Table XVII clean scan; Brassey 1886's own French ordnance table |
| German 26 cm RK L/22 charge/projectile/MV | UNVERIFIED (Table XVII German rows OCR-scrambled) | Gröner; Krupp catalogue; Brassey 1886 German ordnance table |
| Russian 12-in M1867/1877; Japanese 24 cm Krupp | UNVERIFIED (no legible primary row this session) | Obukhov/Krupp catalogues; Marine-Almanach; Conway's |
| All US Dahlgren/Parrott figures | UNVERIFIED (no US ordnance manual opened) | US Navy _Ordnance Instructions for the United States Navy_ (1866/1876 eds.) |
| Breech-loader BL 6-in 80-pdr ROF | UNVERIFIED | Handbook for the 6-in B.L. gun (1880s) |

## 7. Deferred

- **Qing 12-in (Dingyuan)**: not in service by January 1880 (ships 1881–85); deferred to a post-1885 refit/design,
  not the 1880 catalogue start.
- **US monitors as first-class threat values**: the Amphitrite class's as-built armament (10-in smoothbores)
  and its later 10-in BL rifles need a US ordnance manual before they can be authored as more than placeholders.
- **RML 40-pdr sea service by 1880**: the primary needed (an RN armament return ca. 1878–80) was not opened;
  it should be treated as land/garrison only unless that return says otherwise.
- **Mount/turret masses for all heavy guns**: still open; a decision-request is appropriate before authoring
  a `mount mass` component field.

## Source list

1. G. Mackinlay, _Text Book of Gunnery, 1887_ (2nd ed., HMSO) — archive.org `1887-textbook-of-gunnery-second-edition`
   (read as full text; Table XVI, pp. 312–313; Table XVII, pp. 314–315).
2. T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886` (read as full text;
   French Commission "Artillery in France and Abroad", pp. 476–479).
3. T. A. Brassey, _The British Navy, vol. II_ (1882) — archive.org `britishnavyitss04brasgoog`
   (read as full text; p. 95 "Cost of Woolwich Guns").
4. navweaps.com — index pages checked (`WNBR_Main.php`, `WNUS_Main.php`, `WNGER_Main.php`, `WNFR_Main.php`):
   **no coverage of any pre-1883 gun in this note** (negative cross-check).
5. Print works named as leads (not opened this session): _Treatise on the Construction and Manufacture of
   Ordnance in the British Service_ (War Office 1877, archive.org `treatiseonconst00offigoog`; 1879 ed.
   `treatiseonconst00owengoog`); _Treatise on Ammunition_ (1877); _Text Book of Gunnery_ 1893/1902;
   _The Engineer_ vol. XLII (1876); _Journal of the Royal Artillery_ (1999); Brassey's _Naval Annual_ 1894
   (6-in 81-cwt 80-pdr data); Hogg & Thurston, _British Artillery Weapons & Ammunition 1914–1918_ (1972).
