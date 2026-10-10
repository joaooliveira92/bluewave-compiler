# Research: 1880s transatlantic merchant-liner hull data (`merchant_liner_form` / AMC)

Factual grounding for the merchant-liner hull form used by the armed merchant cruiser (AMC, DESIGN-22 §15 /
ADR-0088). This replaces the PLACEHOLDER in `content/production/1880/ship-building/hull-forms.yaml`
(`merchant_liner_form.formBp` currently borrows `protected_cruiser_form`'s coefficients) and the ESTIMATE
`machinery.cFormX100.merchant_liner_form` in `balance.yaml`. Research-only; no content or code is authored here.
This is ticket 30 (release gate) / ADR-0088 "Merchant hull data status". Captured 2026-10-10.

Read first, method and labels identical to: `docs/research/ship-building-early-band.md` and
`docs/research/ship-building-early-band-2.md`.

## 1. Question

What are the grounded figures needed to refit `merchant_liner_form` for 1880s transatlantic merchant liners so an
AMC (a liner hull taken up from trade) is not balanced on a borrowed cruiser hull?

- **`formBp`** — the hull-form factor in `W = K · f_mat · f_scheme · f_sub · f_form · (L·B·D)^1.26`
  (`packages/ship-design/src/hull.ts`), fitted so `formBp` yields the hull-weight (structure + fittings) fraction of
  displacement. Warship fractions were fitted to White 1894 (BB/CA 38 %, coast-defence 31 %, TBD 33 %). A liner needs
  its own fraction.
- **`cFormX100`** — the Admiralty displacement coefficient ×100 in
  `requiredKw = D^(2/3)·V^3·0.7457 / C` (`packages/ship-design/src/machinery.ts`); fitted to trial ihp of sourced ships.
- The hull envelope fields: L/B range, `waterplaneCoeffBp`, block coefficient, `sheerBp`, `lcbPermille`, and the
  stability windows.

## 2. Method, source grades and confidence labels

Every figure carries a named source and one of: **VERIFIED** (read directly in a period primary/near-primary text),
**SINGLE-SOURCE** (one source, or a compilation relaying print works not opened), **ESTIMATE** (derived by me from other
cited figures, calculation shown), **UNVERIFIED** (no usable source; a plausible range is given). Wikipedia is **not**
a source.

| Tag  | Source                                                                                                                                                                                                                     | Grade                                                                                       |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [W]  | W. H. White (Director of Naval Construction), _A Manual of Naval Architecture_, London: John Murray, 1894. Full OCR read: archive.org id `manualofnavalarc00whitrich` (page numbers from running heads).                        | **Primary** (the RN designer's own handbook).                                               |
| [EL] | F. Elgar, "On Fast Ocean Steamships", _Trans. Institution of Naval Architects_ vol. 35 (1894), pp. 20–40 (discussion pp. 34–40). Full OCR read: archive.org id `transactionsroy02unkngoog`.                                  | **Primary** (INA paper by a Fairfield naval architect; includes the Campania table).        |
| [AF] | A. J. Maginnis, _The Atlantic Ferry: Its Ships, Men, and Working_, London: Whittaker, 1892 (also the 3rd ed. 1900). Full OCR read: ids `atlanticferryit01magigoog` and `cu31924030903011`.                                   | **Primary/near-primary** (period compilation with trial/passage data). Some tabular pages did not OCR. |
| [OS] | F. E. Chadwick, A. E. Seaton, W. H. Rideing, J. H. Gould et al., _Ocean Steamships_, New York: Scribner's, 1891. Full OCR read: id `oceansteamships00huntgoog`.                                                               | Near-primary; used only where a figure was legible (narrative, few numeric tables).         |
| [B94]| T. A. Brassey (ed.), _The Naval Annual 1894_ (archive.org id `CASGA_120401`). Read directly.                                                                                                                                  | Primary annual; one yard-capability passage used.                                            |

Conversions: 1 ft = 0.3048 m; 1 in = 25.4 mm; 1 long ton = 1016.05 kg; 1 kn = 0.5144 m/s; 1 ihp = 0.7457 kW;
1 lb = 0.4536 kg. GRT is a **volume** measure (register tons × 100 ft³), **not** displacement — the distinction is
central to the cFormX100 problem below.

What could **not** be reached: the INA volume for 1881 (vol. 22) that would carry a Servia / City of Rome paper is not
on archive.org under the `transactionsroy*` Google scans; Grace's Guide's Umbria page cites only Wikipedia and was
discarded; Brassey's merchant tables OCR column-scrambled (as in note 1). No specific 1880s liner's **published
hull-weight breakdown** was found in any source opened — see §3 and §9.

## 3. Hull weight (the critical value for `formBp`)

White states the hull-weight fraction (structure + fittings) of load displacement by type — this is exactly the
definition the engine's `hullStructureWeight` line uses (White pp. 409–410: the "weight of hull" includes "fittings in
magazines, shell-rooms, store-rooms, cabins, crews' quarters … pumping, drainage, ventilation, electric lighting"). The
existing warship calibration already uses White's fractions, so a liner fraction from the same table is like-for-like.

| item                                                              | figure                                  | unit | source            | confidence                                                                 |
| ---------------------------------------------------------------- | --------------------------------------- | ---- | ----------------- | -------------------------------------------------------------------------- |
| Iron cargo-steamers and sailing ships — hull fraction              | 25–30 % of displacement                 | %    | [W] p. 411        | VERIFIED (text read)                                                        |
| Iron **passenger-steamers** (elaborate fittings) — hull fraction   | **45–55 % of load displacement**        | %    | [W] p. 412        | VERIFIED (text read)                                                        |
| Wood mercantile hull fraction (context)                           | 35–45 %                                 | %    | [W] p. 411        | VERIFIED                                                                    |
| Worked example — passenger-steamer, 500 ft, 12,500 t disp. (steel) | hull steel 4,300 t + outfit 1,650 t = **5,950 t = 47.6 %**; machinery 1,750 t (14 %) | t / % | [W] pp. 412–413 | VERIFIED figures (White's own round illustration) — SINGLE-SOURCE that it is a "good speed" passenger-steamer |
| Same example, iron                                              | 5,000 + 1,650 = **6,650 t = 53.2 %**     | t / % | [W] pp. 412–413    | VERIFIED (illustration)                                                     |
| Worked example — cargo-steamer, 290 ft, 5,000 t disp. (steel)     | 1,000 + 300 = **1,300 t = 26 %**; iron 1,400 t = 28 %; machinery 260 t (5.2 %) | t / % | [W] pp. 412–413 | VERIFIED (illustration)                                                     |
| Steel vs iron hull weight saving (large liners)                   | 12–16 % (same paper: "present steel is 40–50 % stronger than iron … cannot be reduced so as to save more than 12 to 16 per cent.") | % | [W] p. 414; [EL] p. 34 | VERIFIED (two sources agree)                                                |
| Steel-in-hull weight law for the largest liners                   | varies "almost as the cube of the linear dimensions" (450 ft and over) | — | [EL] pp. 30–31 | VERIFIED (INA paper)                                                        |

**Reading it:** the engine's `formBp` for a liner should reproduce White's **steel passenger-steamer fraction ≈ 47.6 %**
(the material factor then handles iron). This is *higher* than the cruiser's 38 %, so the borrowed coefficient is on
the wrong side — a liner's hull-and-outfit is a heavier fraction of displacement than a warship's because of passenger
fitting, even though its *structural* steel is a smaller share. No named 1880s liner's actual hull weight was found; the
fraction is White's generic "good-speed passenger-steamer" illustration, not a weighed ship. That caps confidence at
ESTIMATE (derived from a VERIFIED fraction).

## 4. Representative liners (2–4 ships, published period data)

| ship (year, line) | LOA / LBP | beam (moulded/extreme) | depth | mean draught | GRT | ihp | trial speed | screws / engine | source | confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Oregon** (1883, Guion) | 500 ft long (152.4 m) | 54 ft (16.46 m) | 40 ft (12.19 m) | — | 7,375 t | not printed | — | single; compound 1×70 in HP + 2×104 in LP, 72 in stroke, 110 psi, ~310 t coal/day | [AF] | VERIFIED (figures read) |
| **Umbria / Etruria** (1884, Cunard) | 500 ft long (152.4 m) | — | — | 27 ft (8.23 m; dock limit) | 7,718 t | 14,000 (single screw) | 18.8 kn | single; triple/compound | [AF] (length/ihp/speed); [B94] (length); [EL] (draught limit) | SINGLE-SOURCE (dimensions) / VERIFIED (ihp, speed, length) |
| **Campania** (1893, Cunard) | LOA 622 ft (189.6 m), LBP 600 ft (182.9 m) | 66 ft moulded (20.12 m) | 41 ft 6 in moulded to upper deck (12.65 m) | 27 ft (8.23 m) | 12,950 t (under-deck 10,267) | ~28,000–30,000 (twin) | ~22–23 kn sea; 21.3 kn first westbound, 22.3 kn best day | twin; 5-cyl triple, 69 in stroke | [EL] table + text | VERIFIED (table legible; one OCR "80,000" is self-evidently ~30,000: "three and a half times the Great Eastern's ~8,000") |
| **City of Paris** (1889, Inman) | — | — | — | — | — | 18,500 (twin) | ~20 kn | twin | displacement 17,350 t [AF] | SINGLE-SOURCE |
| Britannic / Germanic (1874/85, White Star) | 455 ft (138.7 m) | — | — | — | — | — | 15–16 kn | — | [AF] | SINGLE-SOURCE (context) |

Derived ratio: Oregon L/B = 9.26; Campania L/B = 9.09; Umbria-class L/B (if 500×57¼ ft) ≈ 8.8.

**Campania displacement conflict:** White [W] p. 416 gives 18,000–19,000 t; [AF] (1892 appendix) gives "over 21,000
tons". Both period; the spread is carried into the cFormX100 range.

## 5. Propulsion: the Admiralty coefficient

White defines the displacement coefficient `C2 = D^(2/3)·V^3 / P` with D in tons, V in knots, P in ihp ([W] p. 624). The
engine's `cFormX100` is exactly `100 × C2` (checked: the Edgar row in `test/earlyBand.test.ts`, D=7,700, V=20, P=12,000
→ C2=260 → `cFormX100`=26,000 = the shipped value).

| ship | D (t) | V (kn) | ihp | C2 = D^(2/3)V³/P | cFormX100 | source of D | confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Etruria / Umbria class | 12,500 (White's same-class example) | 18.8 | 14,000 | 255.6 | **≈25,560** | [W] example, same class | ESTIMATE (D assumed) |
| Etruria (alt., if 14,300 t) | 14,300 | 18.8 | 14,000 | 279.6 | ≈27,960 | [AF] "Etruria, 14,300 tons" (unit ambiguous) | ESTIMATE |
| Campania | 18,000–19,000 | 22 | 28,000–30,000 | 253–290 | **≈25,300–28,900** | [W] / [AF] conflict | ESTIMATE (D and P ranges) |
| City of Paris | 17,350 | 20 | 18,500 | 289.8 | ≈28,980 | [AF] (VERIFIED figure) | ESTIMATE (V ~20 kn) |

**Range: cFormX100 ≈ 25,000–29,000, centred ≈ 26,000–27,000.** The current ESTIMATE 25,000 sits at the low edge but is
within ~4 % of the centre; the model's own calibration tolerance is 15 %.

## 6. Block coefficient, waterplane, LCB

| item | figure | source | confidence |
| --- | --- | --- | --- |
| "First-class ocean passenger steamers of very high speed" — coefficient of fineness | ~45–55 % (class 2 of White's table) | [W] p. 3 | VERIFIED that the class exists at that band; OCR column alignment of the 7-row table is uncertain, but class 3 "passenger steamers (common forms)" is 55–65 % |
| "Modern merchantmen" generally | 60–70 % | [W] p. 3 | VERIFIED |
| Merchant-steamer inclining table (~23 ships, incl. one transatlantic mail steamer), coefficient column | 0.53–0.78 (mostly 0.56–0.70) | [W] pp. 100–101 | VERIFIED values legible; row/column assignment partly OCR-scrambled |
| Umbria-class C_b derived | 0.56 (12,500 t; 152.4 × 17.45 × 8.23 m) | arithmetic on [W]/[AF] dims | ESTIMATE |
| Campania C_b derived | 0.61–0.68 (18,000–21,000 t; 182.9 × 20.12 × 8.23 m) | arithmetic on [EL]/[W]/[AF] | ESTIMATE |
| Waterplane coefficient (C_wp) for a liner | no source found | — | UNVERIFIED (approximation C_wp ≈ ⅔C_b + ⅓ gives ~0.71–0.76 for C_b 0.56–0.65) |
| LCB position | no source found | — | UNVERIFIED |

## 7. Stability (GM and range)

| item | figure | source | confidence |
| --- | --- | --- | --- |
| Fully laden merchant steamers, GM | "sometimes fall as low as 6 or 8 inches [0.15–0.20 m]; frequently … between 1½ and 3 feet [0.46–0.91 m], and occasionally … still higher" | [W] p. 96 | VERIFIED (text read) |
| Merchant-steamer inclining table, GM column | −1.0 ft (a transatlantic mail steamer, **light and unballasted**) up to 5.2 ft; most rows 0.2–2.9 ft | [W] pp. 100–101 | VERIFIED values (OCR partial) |
| Range of stability | "many of the fully laden merchant ships have much greater ranges of stability than the armoured war-ships" (warships ~70–80°; merchant greater) | [W] p. 135 | VERIFIED (qualitative; no liner-specific degree given — UNVERIFIED as a number) |
| Protected-cruiser class GM (comparator) | 1¾–2¼ ft (0.53–0.69 m) | note 2 (`ship-building-early-band-2.md`), [W] p. 97 | SINGLE-SOURCE |

## 8. Capacity and speed

| item | figure | source | confidence |
| --- | --- | --- | --- |
| Fast-liner speed ceiling | 25 kn | RTW3 official manual p. 135, already in `docs/research/rtw3-official-manual-ship-rules-and-1890s-history.md` (ADR-0088) | SINGLE-SOURCE (game reference) |
| In-band liner sea speeds | 18.8 kn (Etruria, 1884) to 22 kn (Campania, 1893) | [AF], [EL] | VERIFIED |
| Fast-AMC definition | designed speed ≥ 22 kn | DESIGN-22 §15 / ADR-0088 (repo rule) | rule, not history |

## 9. Recommendations (candidate values)

The engine fit used in `test/earlyBand.test.ts` sets `material=mild_steel`, `scheme=mixed`, `subdivision=grade 2`
(all factors 1.0), so `formBp` alone carries the fraction. The derivation below uses the exact `hull.ts` formula
`W = 9.9·(formBp/10⁴)·(L·B·D)^1.26` kg (L,B,D in metres), i.e. `formBp = 100·target%·disp·10⁷ / (100·9,900·(L·B·D)^1.26)`.
(Checked against the shipped cruiser row: `formBp`=9,723 at L=110, B=18.3, D=11.3 m, disp=7,823 t returns 38.0 %.)

| value | candidate | derivation | label |
| --- | --- | --- | --- |
| `formBp` | **≈ 13,400** (range 12,000–15,500) | White's steel passenger-steamer fraction 47.6 % [W], reference L=152.4, B=16.46, D=12.19 m (Oregon, [AF]), disp=12,500 t ([W]): 47.6·1.25×10⁷·10⁷ /(100·9,900·(152.4·16.46·12.19)^1.26) ≈ 13,420. Range covers D 11–13 m and target 45–55 %. **Not** a measured ship weight. | **ESTIMATE** (built on a VERIFIED fraction + sourced dimensions) |
| `cFormX100` | **26,000** (range 25,000–29,000) | §5 table (C2×100 for Etruria/Campania/City of Paris). Current 25,000 is at the low edge. | **ESTIMATE / SINGLE-SOURCE** (trial displacement uncertain) |
| `lengthMinMm` / `lengthMaxMm` | 90,000 / 160,000 (unchanged) | Umbria 152 m, Campania 183 m; the class grew across the band. Keep. | BALANCE TARGET |
| `lbMinX100` / `lbMaxX100` | **800 / 1050** (was 700 / 950) | Oregon L/B 9.26, Campania 9.09; White's merchant table spans ~6.3–10.0. The current 9.5 max would reject a 500×52 ft liner. | sourced range; endpoints BALANCE TARGET |
| block coefficient (design input) | 0.55–0.65 (fast liners ≈0.56–0.60) | [W] p. 3 class 2 + derived Umbria/Campania C_b | SINGLE-SOURCE-derived |
| `waterplaneCoeffBp` | 7,400 (keep) | no source; C_wp ≈ ⅔C_b + ⅓ → ~0.71–0.76 | **BALANCE TARGET** (ESTIMATE input) |
| `sheerBp` | 11,000 (keep) | no source | **BALANCE TARGET** |
| `volumeFullnessBp` / `deckFullnessBp` / `lcbPermille` | 6,000 / 7,000 / 500 (keep) | no source | **BALANCE TARGET** |
| `formComplexityBp` (cost) | 10,000 (keep) | no merchant-yard cost source | **BALANCE TARGET** |
| AMC `gmMinMm` | 450–500 | White's laden-merchant typical lower bound 1½ ft = 457 mm [W] | sourced lower bound; block/upper BALANCE TARGET |
| AMC `gmMaxMm` | 2,500–3,000 | White: "occasionally still higher" than 3 ft, no ceiling given | **BALANCE TARGET** |
| AMC `gmCapsizeMm` | 150 (keep) | model device, not historical | **BALANCE TARGET** |

## 10. Deferred / needs an owner

- A **specific named 1880s liner's published hull-weight breakdown** (Etruria, Servia, Oregon, Alaska) — not found. Would
  upgrade `formBp` from ESTIMATE to SINGLE-SOURCE/VERIFIED. Candidates: INA vol. 22 (1881) or 24 (1883) papers on the
  Servia / City of Rome; Lloyd's Register survey returns; builder's weight books (Fairfield / J. & G. Thomson).
- **Trial displacement of the 1880s liners** (only Campania/City of Paris have period displacement figures, and Campania's
  conflicts) — would tighten `cFormX100`.
- **Waterplane coefficient and LCB** for a liner — no source; if release needs them down to a real value, request it.
- **Material factor consistency:** the engine `materialBp.iron = 12500` (iron 25 % heavier than mild steel) vs White's/Elgar's
  steel-vs-iron saving of 12–16 %. An all-iron 1881 liner will come out heavier than White's iron 45–55 % band. Separate
  balance ticket; flagged here only.
- The `merchant_liner_form` `traits: [merchant_derived]` and zone shares are gameplay abstractions (fine as-is).

## 11. Verdict: is there enough grounding to calibrate `merchant_liner_form` for release?

**Qualified yes — do not disable the AMC on hull-data grounds.**

- **`formBp` has a usable source.** White 1894 gives the passenger-steamer hull-and-outfit fraction (VERIFIED text:
  45–55 % iron; 47.6 % steel for a 500 ft / 12,500 t liner), the same document and definition the warship calibration
  already uses. That yields a candidate `formBp ≈ 13,400` — a genuine, defendable replacement for the borrowed cruiser
  9,723. It is an **ESTIMATE derived from a VERIFIED fraction**, not a weighed ship, and must ship with that label.
- **`cFormX100` is marginal.** Period trial data (Etruria, Campania, City of Paris) bound it to ~25,000–29,000, but the
  trial displacements are uncertain; the difference from the current 25,000 is within the model's own 15 % tolerance.
  Keep 25,000 or move to 26,000, labelled ESTIMATE.
- **The L/B envelope and the GM lower bound are groundable** (Oregon/Campania dimensions; White's merchant GM range).
- **What does not exist:** a ship-specific liner hull-weight measurement or trial displacement in any source I could
  open. If the release gate demands **VERIFIED ship-specific** hull data, the honest answer is that it is **not
  available**, and the AMC should stay flagged in the release notes until one of the §10 sources is obtained.

Recommendation to the orchestrator: replace the PLACEHOLDER with the sourced-derived `formBp ≈ 13,400` and widen
`lbMaxX100` to ~1050, keep `cFormX100` at 25,000–26,000, and label all three ESTIMATE/SINGLE-SOURCE. Only fall back to
disabling the AMC if the release definition of "calibrated" requires a measured hull weight rather than a
White-derived fraction.

## Source list

1. W. H. White, _A Manual of Naval Architecture_, 3rd/4th ed., John Murray, 1894 — `manualofnavalarc00whitrich`.
2. F. Elgar, "On Fast Ocean Steamships", _Trans. INA_ 35 (1894), pp. 20–40 — `transactionsroy02unkngoog`.
3. A. J. Maginnis, _The Atlantic Ferry_, 1892 — `atlanticferryit01magigoog`, `cu31924030903011`.
4. F. E. Chadwick et al., _Ocean Steamships_, Scribner's, 1891 — `oceansteamships00huntgoog`.
5. T. A. Brassey (ed.), _The Naval Annual 1894_ — `CASGA_120401`.
