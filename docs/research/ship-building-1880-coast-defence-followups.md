# Research: 1880 coast-defence follow-ups — Spain 300-pdr, F3 gun ceilings, non-UK Krupp values

Grounds three follow-up decisions left open by `ship-building-1880-coast-defence-armament.md`
and `ship-building-1880-ships-by-nation.md` (§6.8 Spain, §6.10 Portugal). Research-only: no code,
content YAML, spec or brief is authored here. Captured 2026-10-11.

Confidence labels: **VERIFIED** (period primary read, or two sources agree) · **SINGLE-SOURCE** (one
source, incl. a secondary relaying a named print work) · **ESTIMATE** (inferred) · **UNVERIFIED** (no
usable source; range given). Wikipedia is used only to identify/reach the print work it cites; those
rows are capped at SINGLE-SOURCE and the print work is named. Conversions: 1 lb = 0.4536 kg;
1 long ton = 1,016.05 kg.

## 0. Question

1. Is the Spanish 254 mm Armstrong **300-pdr** (on *Numancia* / *Vitoria*) the repo's
   `gun_rml_10in_18ton` (400 lb / 181 kg shell), or a **distinct** 10-inch 12-ton / 300-pdr gun
   (~136 kg shell)? — override or new family?
2. For netherlands, portugal, brazil, japan, spain, austria_hungary, qing: is there a period source
   giving a **separate domestic** heavy-gun ceiling (~1880), or should `maxImportedGunCaliberUm`
   stay absent?
3. Re-source non-UK ESTIMATE/UNVERIFIED values where a print source exists: (a) German 26 cm RK L/20
   `gun_bl_263mm_rkl20`; (b) Portuguese 149 / 67 mm Krupp shells; (c) Krupp gun masses for Dutch 283,
   Japanese 235/173, Austro-Hungarian 209 mm.

## 1. Spain 254 mm Armstrong 300-pdr — **DISTINCT gun (option b)**

**Finding: the Spanish gun is the Armstrong 10-inch 12-ton "300-pdr", not the Woolwich 10-inch
18-ton.** A 300-pdr by definition fires a ~300 lb (136 kg) projectile; the repo family
`gun_rml_10in_18ton` is the 18-ton gun firing 400 lb (181 kg). They are different guns.

| field | Spanish 300-pdr (recommended) | repo `gun_rml_10in_18ton` | source | confidence |
| --- | --- | --- | --- | --- |
| bore | 254 mm (10 in) | 254 mm | [B86]/[NW]/[NP] | VERIFIED |
| gun mass | **~12 long tons = ~12,190 kg** | 18,289 kg (18 t) | name "12-ton", [B86] p.331 | SINGLE-SOURCE |
| projectile | **300 lb = 136.1 kg** rifled (Armstrong) | 400 lb = 181.4 kg Palliser | [W-NUM] (Conway's-derived); [B86] | SINGLE-SOURCE |
| propellant charge | not recovered | 31.8 kg (70 lb "P") | — | UNVERIFIED |
| MV | not recovered | 1,379 fps (420 m/s) | — | UNVERIFIED |

Evidence:

- **[B86] Brassey's *Naval Annual 1886*, p.331, read directly** (`NavalAnnual1886_djvu.txt`, lines
  28327/28346): the *Huáscar* "carried two **10-in. 12-ton rifle muzzle-loading 300 pdrs. on Sir W.
  Armstrong's system**". This fixes the nomenclature: a "300-pdr Armstrong" is the **10-inch
  12-ton**, distinct from the British service 10-inch 18-ton (400 lb/181 kg, Mackinlay Table XVI).
- **[W-NUM] *Spanish ironclad Numancia*** (cites Conway's Lyon p.380 + Spanish sources), read directly:
  1876 = "8 x 250 mm Armstrong **300-pounder (136 kg)**"; 1885 = "8 x Armstrong **254 mm (10 in)
  300-pounder (136 kg)** guns". The projectile is explicitly **136 kg (300 lb)**.
- **[NP] navypedia** designates the guns **"254/14 Armstrong 300pdr MLR"**.

**Conflict surfaced (do not silently resolve).** navypedia's *Numancia* prose also calls the same
guns "**18t Armstrong weapons**", and "254/14" (14.5 cal) matches the 18-ton's 145.5 in bore-length.
So navypedia is internally inconsistent. The decisive field is the **projectile**: "300-pdr (136 kg)"
appears in both navypedia and [W-NUM], and a 300-pdr cannot fire a 400 lb shell.

**Recommendation: option (b) — a new, distinct family** (e.g. `gun_rml_10in_12ton_300pdr`), shared by
Spain and reusable for *Huáscar*. Reasons: projectile differs (136 vs 181 kg); gun mass differs
(~12.2 vs 18.3 t); and a shell-mass *override* would still leave the wrong gun mass, calibre-length
and mount metadata. Charge/MV stay **ESTIMATE/UNVERIFIED**. Flag the "18t" conflict; if the
orchestrator follows navypedia's prose, the guns are the 18-ton and no override is needed — but that
contradicts the "300-pdr (136 kg)" label twice.

## 2. F3 domestic vs import gun ceilings

Schema semantics (`packages/ship-design/src/nationProfile.ts`): `maxGunCaliberUm` is the **domestic**
ceiling; `maxImportedGunCaliberUm` is the optional larger **import** ceiling. The seven profiles set
only `maxGunCaliberUm` and `heavyGunProduction: IMPORTED`, so today the single value doubles as the
import ceiling.

**Finding: no period source opened here gives a separate *domestic* heavy-gun production figure for
any of the seven at ~1880.** All seven bought their heavy naval ordnance (Krupp / Armstrong / Whitworth);
none is documented casting its own heavy naval rifles in the sources consulted.

| nation | current `maxGunCaliberUm` | domestic heavy-rifle industry ~1880? | sourced domestic figure | recommendation |
| --- | --- | --- | --- | --- |
| netherlands | 305,000 | no plant; Krupp/Armstrong imported ([NP], profile note) | none found | leave `maxImportedGunCaliberUm` absent |
| portugal | 305,000 | Arsenal da Marinha = small arms/small guns only; ships & guns bought abroad ([NP], profile note) | none found | leave absent |
| brazil | 305,000 | heavy guns Whitworth/Armstrong imported; Navy arsenal made small arms ([NE]) | none found | leave absent |
| japan | 305,000 | Krupp imported; Osaka Arsenal heavy-gun production is later than 1880 ([NP], [KRUPP]) | none found | leave absent |
| spain | 320,000 | **lead only**: Trubia / Hontoria designs (e.g. Hontoria 200 mm M1883) are real domestic ordnance but date from the 1880s and no *calibre-ceiling* figure was found | none usable | leave absent (see Deferred) |
| austria_hungary | 283,000 | Krupp guns purchased; Austria *converted/relined* imported 21 cm barrels at Pola, not cast heavy rifles ([K21]) | none found | leave absent |
| qing | 318,000 | Kiangnan Arsenal made small guns; heavy guns Armstrong/Krupp imported ([NP]) | none found | leave absent |

**Recommendation:** for all seven, **do not add `maxImportedGunCaliberUm`**; keep the existing single
`maxGunCaliberUm` value as the (import) ceiling. The nearest near-misses (Spain Trubia/Hontoria;
Austria's Pola barrel conversions) are recorded as **Deferred** below — resolving them needs a
Spanish- or Austrian-language print source not opened here.

## 3. Re-sourcing non-UK Krupp values

The old note found Mackinlay Table XVII's German/foreign rows OCR-scrambled. The clean print data
exists in **H. von Müller, *Die Entwickelung der preußischen Küsten- und Schiffs-Artillerie 1860–1878*
(1879)** and **Marineverordnungsblatt 1885**, reached via the English/German Wikipedia gun articles
(which cite the pages). Those rows are **SINGLE-SOURCE** (print work named, relayed).

### (a) German 26 cm RK L/20 C/74 — component `gun_bl_263mm_rkl20`

| field | sourced value | current repo | source | confidence |
| --- | --- | --- | --- | --- |
| gun mass | **18,000 kg** (incl. breech) | 26,000 | [K26] (Von Müller 1879 p.289) | SINGLE-SOURCE |
| calibre | 260 mm orig., 262.5 mm adapted (263 nominal) | 263,000 | [K26] (Von Müller 1879 p.288) | SINGLE-SOURCE |
| projectile | AP hardened grenade c/69 **189.3 kg**; long grenade c/75 **172.5 kg**; c/82 long grenade L/2,6 **162 kg** | 250,000 | [K26] (Von Müller 1879 p.155; Hartmann 1896 p.952) | SINGLE-SOURCE |
| charge | **35 kg** (w/ 189.3 kg AP, 436 m/s) or **30 kg** (w/ 172.5 kg, 423 m/s); later **57 kg** P.P. C/82 | 2,400 bp (~60 kg) | [K26] (Von Müller 1879 p.155/952) | SINGLE-SOURCE |
| MV | 436 / 423 m/s (1880); 500 m/s (post-1882) | — | [K26] | SINGLE-SOURCE |

**Recommendation (author-ready):** `gunMassKg 18000`; `shellMassG 189300` (AP) or `172500` (HE);
charge 35 kg / 30 kg → `chargeBp` ≈ **1849** (35 000/189 300) or **1739** (30 000/172 500). The repo's
26 t / 250 kg / 24 kg are all **wrong** for this gun.

### (b) Portuguese 149 mm and 67 mm Krupp

- **149 mm RK L/22 C/75** = Krupp 15 cm RK L/22 ([K15], Von Müller 1879 p.288–289): gun **3,500 kg**,
  calibre 149.1 mm; projectiles **chilled-iron grenade 33.67 kg** (charge 7.75 kg, MV 449 m/s) and
  **long grenade 29.5 kg** (charge 7.75 kg, MV 477 m/s). Repo ESTIMATE was 45 kg → recommend
  `shellMassG 33670` (AP) / `29500` (HE), `gunMassKg 3500`, `chargeBp` ≈ 2302 (AP) / 2627 (HE).
  Confidence **SINGLE-SOURCE** (marks differ slightly: c/69/L; the Portuguese `C/75` is an export
  year designation).
- **67 mm Krupp:** **no print source found** (no 6.7 cm Krupp table opened). Stays **ESTIMATE**.

### (c) Krupp gun masses (currently ESTIMATE) — all SINGLE-SOURCE

| gun | bore | gun mass | source (print) |
| --- | --- | --- | --- |
| Dutch 283 mm "Krupp No.1" | 283 mm | **≈ 27,500 kg** (28 cm RK L/22) | [K28] (Von Müller 1879 p.288) |
| Japanese 235 mm RKL/22 C/72 | 235.4 mm | **15,500 kg** | [K24] (Von Müller 1879 p.288) |
| Japanese 173 mm RKL/25 C/72 | 172.6 mm | **5,600 kg** (17 cm RK L/25) | [K17] (Von Müller 1879 p.289) |
| Austro-Hungarian 209 mm G. L/20 | 209.2 mm | **9,400 kg** (barrel 8,910 + breech 490) | [K21] (S. 1875, *Mitt. a. d. Geb. d. Seewesens*) |

Caveats: the Dutch mount is designated **283/20 "Krupp No.1"** ([NP]), a different (shorter) mark than
the L/22 whose 27,500 kg is quoted — treat as a labelled analogy. The AH 209 mm figure is the Austrian
21 cm **L/20** conversion; charge **17 kg** (MV 424 m/s), but its shell mass is not given and stays
UNVERIFIED.

## Verdict — author-ready vs stays-ESTIMATE

**Author-ready (SINGLE-SOURCE or better):**
- Q1: Spanish gun is a **distinct** Armstrong 10-inch **12-ton 300-pdr**, ~136 kg shell, ~12.2 t gun
  ([B86] + [W-NUM]). Charge/MV UNVERIFIED.
- Q3(a): German 26 cm — gun 18,000 kg, shell 189.3/172.5 kg, charge 35/30 kg (Von Müller 1879).
- Q3(b): Portuguese 149 mm — gun 3,500 kg, shell 33.67/29.5 kg, charge 7.75 kg (Von Müller 1879).
- Q3(c): Krupp gun masses — Dutch 283 ≈ 27,500 kg; Japanese 235 = 15,500 kg; Japanese 173 = 5,600 kg;
  AH 209 = 9,400 kg, charge 17 kg.

**Stays ESTIMATE / UNVERIFIED:** Spanish 300-pdr charge & MV; Portuguese 67 mm shell; every shell
mass/charge not listed above; the AH 209 shell; all muzzle velocities except those just cited.

**Q2:** no sourced domestic ceiling → leave `maxImportedGunCaliberUm` absent for all seven.

## Sources

1. **[B86]** T. A. Brassey (ed.), *The Naval Annual 1886*, archive.org `navalannual1886` — read
   directly (pp. 331 *Shah*/*Huáscar* 10-in 12-ton 300-pdr).
2. **[W-NUM]** Wikipedia, *Spanish ironclad Numancia* (cites Conway's *1860–1905*, Lyon p.380) — read
   directly (254 mm Armstrong 300-pounder, 136 kg).
3. **[K26]** Wikipedia, *26 cm RK L/20* (cites Von Müller 1879, pp. 288–289, 155; Hartmann 1896,
   p. 952; Marineverordnungsblatt 1885) — read directly.
4. **[K24]** de.wikipedia, *24-cm-Ringkanone L/22* (Von Müller 1879, p.288) — read directly.
5. **[K17]** Wikipedia, *17 cm RK L/25* (Von Müller 1879, pp. 288–289) — read directly.
6. **[K28]** Wikipedia, *28 cm RK L/22* (Von Müller 1879, pp. 288, 296–297) — read directly.
7. **[K21]** Wikipedia, *21 cm RK L/19* (S. 1875, *Mittheilungen aus dem Gebiete des Seewesens*,
   pp. 2–7; Von Müller 1879) — read directly.
8. **[K15]** Wikipedia, *15 cm RK L/22* (Von Müller 1879, pp. 288–289) — read directly.
9. **[NP]** navypedia.org, fetched directly: `spain/sp_bb_numancia.htm`, `spain/sp_bb_vitoria.htm`,
   `netherlands/nl_bb_matador.htm`.
10. **Print leads not opened:** Conway's *1860–1905* (Spain); Mackinlay *Text Book of Gunnery* 1887
    Table XVII (foreign rows, OCR-scrambled); Spanish (Trubia/Hontoria) and Austrian (Pola/Skoda)
    heavy-gun histories.

## Deferred (needs an owner or a decision-request)

- **Spanish 300-pdr mark conflict:** navypedia's "18t"/"254/14" prose vs the 300-pdr (136 kg) label.
  The note recommends the distinct 12-ton family; the orchestrator owns the resolution.
- **Spain domestic ceiling (Trubia/Hontoria ~200 mm, 1883) and Austria's Pola barrel conversions:**
  plausible domestic ordnance leads, but no period *calibre-ceiling* figure was found; a
  Spanish/Austrian print source would be needed. No `docs/OPEN-ISSUES.md` item matches gun calibre —
  none was resolved here.
- **Charge/MV** for the Spanish 300-pdr and the **Portuguese 67 mm** shell mass remain UNVERIFIED.
