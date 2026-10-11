# Research: 1880 coast-defence / casemate gun ballistics (ADR-0114 candidates)

Grounds the ordnance of the specific historical coast-defence / casemate ships that ADR-0114
lists as deferred because the shared catalogue lacks their guns, so a content author can add
first-class armament families **without inventing values**. Research-only: no code, content YAML,
spec or brief is authored here.

## 0. Question

For each gun below, record bore (mm / in), gun mass, projectile mass+type, propellant charge
(and whether black powder / RML / BL), nominal muzzle velocity, rate of fire, and mount type, with
an explicit confidence label and a named source. Guns:

1. Dutch **283 mm (11.1 in) Krupp No.1** — *Matador* (1879), 1 twin turret.
2. Austro-Hungarian **209 mm (8.2 in) G. L/20 C.68** — *Kaiser Max* class (1876–78), 8 in a central casemate.
3. Brazilian **Whitworth 300-pdr RML** — *Sete de Setembro* (1874), 4 in a central casemate (actual bore required).
4. Japanese **235 mm RKL/22 C/72** and **173 mm RKL/25 C/72 Krupp** — *Fusō* (1878).
5. US **381 mm (15 in) Dahlgren smoothbore** — *Canonicus* (1864). A smoothbore, not a rifle.
6. Portuguese **Krupp 149 mm RK L/22 C/75** and **67 mm** — *Vasco da Gama* (1876); plus confirmation of
   whether its **2 × 263 mm RK L/20 C/74** main guns are the repo's `gun_bl_263mm_rkl20`.

## 1. Method, sources and confidence labels

**VERIFIED** = read directly in a period primary text (or arithmetic from it, two independent
sources agree); **SINGLE-SOURCE** = one source, or a secondary compilation relaying print works
not opened here; **ESTIMATE** = inferred, not itself a source figure; **UNVERIFIED** = no usable
source, range given. Wikipedia is used **only to find the print work it cites**; every row so
derived is capped at SINGLE-SOURCE and the named print work is given.

| Tag    | Source                                                                                                                                                                                                                                                                  | Grade / reach                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [OI66] | Bureau of Ordnance, USN, _Ordnance Instructions for the United States Navy_, 4th ed. (Washington: GPO, 1866) — Project Gutenberg #19058, **read directly this session** (service-charge table; powder-proof table; monitors chapter; shell-box/allowance tables). | Period service manual = **primary. VERIFIED**.                                |
| [TB87] | G. Mackinlay, _Text Book of Gunnery_, 2nd ed. (HMSO, 1887), archive.org `1887-textbook-of-gunnery-second-edition`, **read directly this session** (`…_djvu.txt`), **Table XVII** ("Foreign Ordnance", shortened from Capt. Orde Browne's table in [B86]). | Primary; foreign-table OCR is column-scrambled → only isolated rows legible → **SINGLE-SOURCE**. |
| [B86]  | T. A. Brassey (ed.), _The Naval Annual 1886_ — archive.org `navalannual1886`, **read directly this session**: French Commission "Artillery in France and Abroad" (penetration, pp. 476–479); index (Whitworth 9-in B.L. gun, p. 304); 300-pdr Armstrong RML 10-in 12-ton (p. ~28346 of OCR). | Contemporary annual = **primary. VERIFIED for figures read**; else SINGLE-SOURCE. |
| [NP]   | navypedia.org class pages (Ivan Gogin), built principally on Conway's _1860–1905_ + national histories — **fetched directly this session** (slugs §Sources).                                                                                                     | Secondary compilation → **SINGLE-SOURCE**.                                    |
| [CON]  | Conway's _All the World's Fighting Ships 1860–1905_ (1979), "Brazil" (Lyon) — **not opened**; relayed via Wikipedia (which cites Lyon p. 406).                                                                                                                            | Print secondary, relayed → **SINGLE-SOURCE**.                                 |
| [PRE]  | `docs/research/ship-building-1880-pre-era-armament.md` §3/§5 (in-repo; itself [TB87]/[B86]-based).                                                                                                                                                                       | Reused; confidence as carried.                                                |
| [NAT]  | The national notes `austria_hungary-`, `netherlands-`, `japan-`, `portugal-`, `brazil-naval-profile.md` (in-repo; [NP]-based).                                                                                                                                          | Reused; SINGLE-SOURCE unless noted.                                           |

Conversions: 1 in = 25.4 mm; 1 lb = 0.4536 kg; 1 long ton = 1,016.05 kg; 1 fps = 0.3048 m/s.
Note a nominal-calibre trap: Krupp named guns by round centimetres but bored them slightly larger
(26 cm → 263 mm; 28 cm → 283 mm). Similarly **235 mm = 9.25 in, not 9.45 in** (9.45 in = 240 mm);
the task's "9.45 in" is the 24 cm nominal, the actual bore is ~235 mm [NP].

## 2. Per-gun findings

### 2.1 Dutch 283 mm (11.1 in) Krupp No.1 — *Matador*, 1 × 2 turret

| field | value | source | confidence |
| --- | --- | --- | --- |
| bore | **283 mm (11.14 in)** | [NP] `nl_bb_matador.htm` ("1 × 2 – 283/20 Krupp No.1") | SINGLE-SOURCE (inch DERIVED) |
| gun type | **Krupp Ringkanone, BL, built-up steel, black powder** | [NP]; sibling `gun_bl_263mm_rkl20` | VERIFIED (classification) |
| gun mass | not recovered (plausible 26–32 t) | — | **UNVERIFIED** (range) |
| projectile | **~253 kg (557.8 lb)** — Krupp forged-steel AP/shot | [TB87] Table XVII Austrian 28 cm row, via [PRE] §3 | SINGLE-SOURCE (same Krupp 28 cm family; **different mark** L/20 vs L/22) |
| charge | **~56 kg (123.5 lb) black powder** | [TB87] Table XVII, via [PRE] §3 | SINGLE-SOURCE (analogy as above) |
| muzzle velocity | ~430–450 m/s | [PRE] §3 (EST) | ESTIMATE |
| rate of fire | ~1 rd/min | hand-worked Krupp BL | ESTIMATE |
| mount | **1 twin turret** | [NP] | SINGLE-SOURCE |
| penetration | **40 cm wrought iron, point-blank** (Krupp 28 cm) | [B86] p. 478, via [PRE] §3 | SINGLE-SOURCE |

### 2.2 Austro-Hungarian 209 mm (8.2 in) G. L/20 C.68 — *Kaiser Max*, 8 × 1 central casemate

| field | value | source | confidence |
| --- | --- | --- | --- |
| bore | **209 mm (8.23 in)** | [NP] `ah_bb_kaiser_max.htm` ("8 × 1 – 209/18 G. L/20 C.68") | SINGLE-SOURCE (inch DERIVED) |
| gun type | Krupp-pattern **BL, black powder** | [NAT] austria (treats AH heavies as Krupp BL) | SINGLE-SOURCE (designation) |
| gun mass | not recovered (plausible ~9–10 t for a 21 cm Krupp) | — | **UNVERIFIED** |
| projectile | **~100 kg (EST)** — steel AP/common | [PRE] §3 / [NAT] austria (EST) | ESTIMATE |
| charge | **~25 kg (EST)** black powder | [NAT] austria (EST) | ESTIMATE |
| muzzle velocity | ~430 m/s (EST) | [NAT] austria (EST) | ESTIMATE |
| rate of fire | ~1 rd/min | hand-worked BL | ESTIMATE |
| mount | **central battery / casemate, 8 × 1** | [NP] | SINGLE-SOURCE |

No legible [TB87] Table XVII row exists for the 20.9 cm (the Austrian block there lists 28/26/15/12/9 cm only),
so shell/charge/MV cannot be upgraded beyond ESTIMATE from the sources opened.

### 2.3 Brazilian Whitworth 300-pdr RML — *Sete de Setembro*, 4 × 1 central casemate

**Actual bore: 9-inch = 229 mm.** The "300-pdr Whitworth" was not one bore; the Brazilian gun is the
**9-inch Whitworth RML** (distinct from the 10-inch / 12-ton **Armstrong** 300-pdr also current in 1886,
which [B86] documents).

| field | value | source | confidence |
| --- | --- | --- | --- |
| bore | **9 in (229 mm)** | [CON] (Lyon p. 406) via Wikipedia lead "…9-inch (229 mm) solid shot…" | **SINGLE-SOURCE** |
| gun type | **Whitworth RML** (muzzle-loading, hexagonal-bore rifled), black powder | [CON] via Wikipedia; [NP]/naval-encyclopedia "300-pdr Whitworth muzzle-loading rifled" | SINGLE-SOURCE |
| gun mass | **18 long tons (18,289 kg)** | [CON] (Lyon p. 406) via Wikipedia | **SINGLE-SOURCE** |
| projectile | **~300 lb solid shot (136.1 kg)** | [CON] via Wikipedia (same row) | **SINGLE-SOURCE** |
| charge | not recovered (~30–50 lb black, EST by 9-in RML analogy) | — | **UNVERIFIED** (ESTIMATE) |
| muzzle velocity | not recovered (~400–440 m/s, EST by 9-in RML analogy) | — | **UNVERIFIED** (ESTIMATE) |
| rate of fire | low, ~0.5 rd/min (hand-worked casemate pivot) | — | ESTIMATE |
| mount | **central casemate, 4 × 1 on pivots (fore/aft corners)** | [NP]/[CON]/naval-encyclopedia | SINGLE-SOURCE |

### 2.4 Japanese Krupp 235 mm RKL/22 C/72 and 173 mm RKL/25 C/72 — *Fusō*, 4 + 2

| field | 235 mm (9.25 in) main | 173 mm (6.81 in) secondary | source | confidence |
| --- | --- | --- | --- | --- |
| bore | **235 mm (9.25 in)** | **173 mm (6.81 in)** | [NP] `jap_bb_fuso78.htm` ("4 × 1 – 235/20 RKL/22 C/72, 2 × 1 – 173/22 RKL/25 C/72") | SINGLE-SOURCE (inch DERIVED) |
| gun type | Krupp RKL (Ringkanone L/22), **BL, black powder** | Krupp RKL (L/25), **BL, black powder** | [NP] | SINGLE-SOURCE |
| gun mass | not recovered (plausible ~16–18 t) | not recovered (plausible ~5–6 t) | — | **UNVERIFIED** |
| projectile | ~150–190 kg (EST) | ~52–57 kg (EST) | [PRE] §3 / [NAT] japan (EST) | ESTIMATE |
| charge | ~25–35 kg black (EST) | ~8–14 kg black (EST) | [PRE] §3 (EST) | ESTIMATE |
| muzzle velocity | ~430–460 m/s (EST) | ~450–480 m/s (EST) | [PRE] §3 (EST) | ESTIMATE |
| rate of fire | ~1 rd/min | ~1–2 rd/min | hand-worked BL | ESTIMATE |
| mount | **central battery (broadside)** | **deck / broadside** | [NP]; [NAT] japan | SINGLE-SOURCE |

### 2.5 US 381 mm (15 in) Dahlgren smoothbore — *Canonicus*, 1 × 2 turret

This is a **smoothbore** muzzle-loader (Rodman-cast Dahlgren), so it fires with low velocity for its
calibre, is not an armour-piercing rifle, and reloads slowly. The Canonicus class carried the **long**
15-in (*Tecumseh* pattern, 43,000 lb) with the muzzle outside the turret, not the short *Passaic* gun [NP].

| field | value | source | confidence |
| --- | --- | --- | --- |
| bore | **381 mm (15 in), smoothbore** | arithmetic; [NP] ("381/12 long Dahlgren SB") | **VERIFIED** |
| gun mass | **43,000 lb (19,504 kg)** (long pattern) | [OI66] powder-proof table ("XV-inch, 43,000 lbs") | **VERIFIED** |
| projectile | proof shell **330 lb (149.7 kg)**; cored shot **400 lb (181.4 kg)** | [OI66] powder-proof table | **VERIFIED** (proof projectiles) |
| projectile (service) | shell **~352 lb (159.7 kg)**; solid shot **~440 lb (199.6 kg)** | Ripley 1984, via Wikipedia table (lead) | SINGLE-SOURCE |
| charge | black powder — **distant 50 lb (22.7 kg), ordinary 35 lb (15.9 kg), near 35 lb**; special **60 lb (27.2 kg) solid-shot charge** for up to 20 close-range rounds | [OI66] service-charge table + note | **VERIFIED** |
| muzzle velocity | ~350–400 m/s (~1,150–1,300 fps) | no source opened | **UNVERIFIED** (ESTIMATE) |
| rate of fire | very low, ~0.1–0.2 rd/min (~1 rd / 5–10 min); the *Passaic* smoke-box "slowed the rate of fire" | [OI66] monitors chapter; drill estimate | ESTIMATE |
| mount | **1 × 2 turret** | [NP] `us_mon_canonicus.htm` | SINGLE-SOURCE |

### 2.6 Portuguese Krupp 149 mm RK L/22 C/75 and 67 mm — *Vasco da Gama*

| field | 149 mm (5.87 in) | 67 mm (2.64 in) | source | confidence |
| --- | --- | --- | --- | --- |
| bore | **149 mm (5.87 in)** | **67 mm (2.64 in)** | [NP] `pr_bb_vasco_da_gama.htm` ("1 × 1 – 149/22 RK L/22 C/75, 4 × 1 – 67/40 Krupp") | SINGLE-SOURCE (inch DERIVED) |
| gun type | Krupp RK L/22, **BL, black powder** | Krupp, **BL, black powder** | [NP] | SINGLE-SOURCE |
| gun mass | not recovered | not recovered | — | **UNVERIFIED** |
| projectile | ~45 kg (EST) | ~4.5 kg (EST) | [NAT] portugal (EST) | ESTIMATE |
| charge | not recovered (EST) | not recovered (EST) | — | **UNVERIFIED** (ESTIMATE) |
| muzzle velocity | not recovered (EST) | not recovered (EST) | — | **UNVERIFIED** (ESTIMATE) |
| rate of fire | ~1 rd/min (EST) | ~5–10 rd/min (EST) | hand-worked BL | ESTIMATE |
| mount | **casemate / deck shielded** | **deck open** | [NP]; [NAT] portugal | SINGLE-SOURCE |

## 3. Cross-cutting: is the *Vasco da Gama* 263 mm the repo's `gun_bl_263mm_rkl20`?

**Yes.** Reasoning, with sources:

- [NP] designates the *Vasco da Gama* main guns **"2 × 1 – 263/18 RK L/20 C/74"** — a Krupp **26 cm
  Ringkanone L/20**, actual bore **263 mm**.
- The repo family `gun_bl_263mm_rkl20` is `26 cm RK L/20 (Krupp)`, `caliberUm: 263000` — the **same
  Krupp 26 cm RK L/20 model** (the German Sachsen/Preussen/Kaiser armament). The Portuguese ship used
  the export version of the same Krupp product.
- Therefore the bore/model match is exact; the family is the correct first-class home for the
  Portuguese main gun.

Caveat for the author: the existing family's numeric values (`gunMassKg 26000`, `shellMassG 250000`,
`propellantChargeBp 2400`) are themselves **ESTIMATE / MEDIUM** (see `gun-models.yaml` provenance). The
only *sourced* neighbouring Krupp 26 cm row is the **Austrian L/22 C.73** ([TB87] via [PRE] §3 /
[NAT] austria): projectile **395.7 lb (179.5 kg)**, charge **~105 lb (47.6 kg)** — but that is a
**different mark** (L/22, not L/20), so it should not silently replace the family value. The family's
`supportedMountTypes` are `[TURRET, BARBETTE]`; the Portuguese use is **CASEMATE** — a national overlay
would need CASEMATE (or a `_casemate` variant) added.

## 4. Recommendations for the implementator (non-normative)

Author-ready (SINGLE-SOURCE or better, per field):

- **Gun 5 (US 15-in Dahlgren SB):** the strongest entry — **VERIFIED** bore (381 mm), gun mass
  (43,000 lb), proof projectiles (330/400 lb) and charges (50/35/60 lb) from [OI66]; service
  shot/shell (440/352 lb) SINGLE-SOURCE (Ripley). MV and ROF must be ESTIMATE.
- **Gun 3 (Whitworth 300-pdr):** **SINGLE-SOURCE** bore 9-in/229 mm, gun mass 18 t, and ~300 lb shot
  (Conway's via Wikipedia); charge/MV ESTIMATE. It is a genuine RML family, not a BL.
- **Gun 1 (Dutch 283) / Gun 4 (Japanese 235 & 173):** **SINGLE-SOURCE** bore + mount only; all
  ballistics ESTIMATE (reuse the ranges already labelled ESTIMATE in [PRE]).
- **Gun 2 (AH 209):** **SINGLE-SOURCE** bore + mount only; ballistics ESTIMATE.
- **Gun 6 (Portuguese 149/67):** **SINGLE-SOURCE** bore + mount only; ballistics ESTIMATE. The
  263 mm main gun is an **exact family match** to `gun_bl_263mm_rkl20` (§3).

Must remain **ESTIMATE / BALANCE TARGET** (do **not** present as sourced):

- Every muzzle velocity and rate of fire except the US 15-in charges (the US MV/ROF are ESTIMATE too).
- Every Krupp projectile mass/charge here except the Dutch 283 analogy (SINGLE-SOURCE, different mark).
- Every gun mass except the US 15-in (VERIFIED) and the Whitworth 18 t (SINGLE-SOURCE).
- The Brazilian charge/MV; all AH 209, Japanese 235/173, Dutch 283 (charge/MV), Portuguese 149/67 numbers.

## 5. Deferred (needs an owner or a decision-request)

- **Krupp gun masses, charges and MVs (283/209/235/173/149/67 mm):** no legible period table exists in
  the sources opened here; [TB87] Table XVII's foreign rows are OCR-scrambled beyond the Austria
  28/26/15/12/9 cm block. A clean Krupp catalogue, Gröner's _German Warships_, or a legible Table XVII
  scan would upgrade these from ESTIMATE.
- **A dedicated Dutch 28 cm (283 mm) Krupp family** and dedicated Krupp 209/235/173 mm families: the
  catalogue has no Krupp families at these bores, so a content author adding them is a **schema/content
  decision**, not a research fact (surfaced, not resolved here).
- **`gun_bl_263mm_rkl20` mount types:** the shared family lists TURRET/BARBETTE only; the Portuguese
  *Vasco da Gama* mounts it in CASEMATE. Add CASEMATE (or a variant) before authoring the B design.
- **US 15-in muzzle velocity:** standard references quote ~1,150 fps, but no period source was opened;
  BOTH MV and ROF stay UNVERIFIED/ESTIMATE.
- **The 15-in service projectile split (330 lb proof shell vs ~352 lb service shell):** the primary
  proof table and the secondary service figure differ; flag rather than reconcile silently.

No entry in `docs/OPEN-ISSUES.md` was resolved here (none matches gun calibre/armament).

## 6. Verdict

**Two guns are author-ready with grounded (SINGLE-SOURCE or VERIFIED) figures; the rest can only be
authored at bore/designation level with every ballistic constant labelled ESTIMATE.** The **US 15-in
Dahlgren smoothbore** is the best-grounded entry — its bore, gun mass, proof projectiles and black-powder
charges come straight from the 1866 US _Ordnance Instructions_ (VERIFIED), and only its (low) muzzle
velocity and (very low) rate of fire remain ESTIMATE. The **Brazilian Whitworth 300-pdr** is a genuine
9-inch (229 mm), 18-ton RML firing ~300 lb shot (Conway's via Wikipedia = SINGLE-SOURCE), with charge/MV
ESTIMATE. The **Dutch 283**, **Austro-Hungarian 209**, **Japanese 235/173** and **Portuguese 149/67**
Krupp guns are groundable only at bore and mount type from navypedia (SINGLE-SOURCE); all their
shell/charge/MV/ROF values remain ESTIMATE (the Dutch 283 can borrow the sourced Austrian Krupp 28 cm
projectile/charge as a labelled analogy). The Portuguese 263 mm main gun is a confirmed **exact match**
to the existing `gun_bl_263mm_rkl20` family (same Krupp 26 cm RK L/20, 263 mm bore), so no new family is
needed for it — only a CASEMATE mount overlay.

## Source list

1. Bureau of Ordnance, USN, _Ordnance Instructions for the United States Navy_, 4th ed. (GPO, 1866),
   Project Gutenberg eBook #19058 — **read directly this session** (service-charge table; powder-proof
   table; "Monitors" chapter; shell-box and allowance tables).
2. G. Mackinlay, _Text Book of Gunnery_, 2nd ed. (HMSO, 1887), archive.org
   `1887-textbook-of-gunnery-second-edition` — **read directly this session**, Table XVII ("Foreign
   Ordnance", pp. 314–315; shortened from Orde Browne in [B86]).
3. T. A. Brassey (ed.), _The Naval Annual 1886_, archive.org `navalannual1886` — **read directly this
   session** (French Commission tables pp. 476–479; index p. 304; 300-pdr Armstrong RML).
4. navypedia.org pages, **fetched directly this session**: `netherlands/nl_bb_matador.htm`,
   `austrohungary/ah_bb_kaiser_max.htm`, `japan/jap_bb_fuso78.htm`, `usa/us_mon_canonicus.htm`,
   `portugal/pr_bb_vasco_da_gama.htm`, `usa/usa_battleships.htm`.
5. Wikipedia articles, used **only as lead-finders** for the print works named: *Dahlgren gun*
   (Ripley 1984), *Brazilian ironclad Sete de Setembro* (Conway's 1860–1905 / Lyon p. 406); BRL
   `Whitworth rifle`.
6. In-repo companions: `ship-building-1880-pre-era-armament.md` §3/§5; `austria_hungary-naval-profile.md`;
   `netherlands-naval-profile.md`; `japan-naval-profile.md`; `portugal-naval-profile.md`;
   `brazil-naval-profile.md`; `content/production/1880/ship-building/armament/gun-models.yaml`.
7. Print leads **not opened**: Conway's _All the World's Fighting Ships 1860–1905_ (Lyon, "Brazil");
   Gröner, _German Warships 1815–1945_ (Krupp 26/28 cm RK data); a clean Krupp catalogue; a clean
   [TB87] Table XVII scan.
