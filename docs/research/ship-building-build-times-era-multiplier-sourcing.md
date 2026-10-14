# Ship-building: primary sourcing for the build-time era multiplier (1886 and 1890 points)

Backs the first two points of `buildTimeEraBp` / `buildTimeEraProvenance` in
`content/production/1880/ship-building/balance.yaml` (ADR-0080 / ticket 26). Researched 2026-10-14
from contemporary *Brassey's Naval Annual* volumes on archive.org (OCR `_djvu.txt` read in full for the
pages cited, then every date/displacement below checked against the printed page image
`https://archive.org/download/<id>/page/n<leaf>_w1200.jpg`; leaf numbers from each item's
`_page_numbers.json`). Page numbers are the printed running headers.

This note does **not** edit any code or content YAML. It only reports what the primary sources say and
what they do not.

## 1. Question

The 1886 and 1890 era points of `buildTimeEraBp` are currently `SECONDARY` (Wikipedia class pages):

- 1886 → 18,000 bp, evidence: "Trafalgar-class battleship (Wikipedia): Nile laid 8 Apr 1886, completed
  10 Jul 1891; Trafalgar laid 18 Jan 1886, completed 1890; 11,940 t designed".
- 1890 → 12,200 bp, evidence: "Royal Sovereign-class battleship (Wikipedia): eight ships laid Jul 1889 –
  Feb 1891, completed May 1892 – Jun 1894; 14,150 t".

Can the keel-laying and completion (commissioning) dates and displacements for the Trafalgar class and
the Royal Sovereign class be grounded in contemporary primary sources, so that the two points can move
from `SECONDARY` to `VERIFIED`?

## 2. Sources

All directly verified against the printed page image unless the row says otherwise.

| Key | Source | archive.org id | Access |
| --- | ------ | -------------- | ------ |
| [B86] | T. A. Brassey (ed.), *The Naval Annual 1886* (1st volume) | `navalannual1886` | OCR read; p.185, p.413 read as page images (leaves n225, n611) |
| [B90] | *The Naval Annual 1890* | `navalannual1890` | OCR read (pp.146–149) |
| [B91] | *The Naval Annual 1891* (5th volume) | `navalannual1891` | OCR read; pp.88, 89, 118, 119, 414 read as page images (leaves n114, n115, n146, n147, n582) |
| [B92] | *The Naval Annual 1892* (6th volume) | `navalannual1892` | OCR read; pp.2, 65, 90 read as page images (leaves n22, n89, n114) |
| [B94] | *The Naval Annual 1894* | `CASGA_120401` | OCR read (pp.1–2, 422); tables in Part II are image-only / OCR-scrambled |
| [B95] | *The Naval Annual 1895* | `CASGA_120402` | OCR read (pp.5–6) |
| [B96] | *The Naval Annual 1896* | `CASGA_120403` | OCR read (p.11) |

No Conway's, Navypedia or navweaps entry was used (Conway's is lending-only on archive.org; the others
do not carry the build/completion dates sought). Wikipedia is referenced only as the current `SECONDARY`
provenance being tested, never as the grounding.

## 3. Findings

### 3.1 Trafalgar class (the 1886 point)

**Keel-laying dates — VERIFIED.** [B86] p.413, the appendix table *"A List of the Armoured and
Unarmoured Fighting Ships of England laid down to build since April, 1880"*, under the heading `1886.`
reads verbatim:

> `Ironclad Turret . | Trafalgar . | 18 Jan.` … `„ „ | Nile . | 8 April`

(Printed p.413, right-hand column; read from page image leaf n611.) Both dates match the Wikipedia claim
(Trafalgar 18 Jan 1886, Nile 8 Apr 1886).

**Designed displacement — VERIFIED.** [B86] p.185, section "(12) THE NILE AND THE TRAFALGAR", reads
verbatim:

> "The Nile and Trafalgar are the largest armour-clads yet constructed for the English navy… Their
> dimensions are: length, 345 feet; breadth, 73 feet; displacement, 11,940 tons; indicated horse-power
> 12,000."

(Printed p.185; page image leaf n225.) The 11,940 t designed displacement is therefore a primary figure,
not a Wikipedia one.

Corroboration of the same class in [B90] p.146: the "Trafalgar (as designed)" table gives "Displacement
(approximate) … 12,000" and "Horse-power, forced draught … 12,000"; [B91] p.119 gives "Nile and
Trafalgar … Displacement … 12,500" (a load/round figure). The design figure to use is 11,940 t.

**Completion dates.**

- *Nile* — **VERIFIED (commissioning)**. [B92] p.65, in the 1891-manoeuvres chapter ("The French
  Manœuvres of 1891 were organised…", p.62), reads verbatim: "The Nile was commissioned on June 30 and
  the Sans Pareil on July 8, and both for the first time." The passage is dated to 1891 by the same
  chapter (p.62) and by Sans Pareil's known 8 Jul 1891 commissioning. So Nile was commissioned
  **30 June 1891**, not 10 July 1891 — keel-to-commissioning = **62.7 months**. [B91] p.89 independently
  places Nile's completion in the financial year **1891–92** (1 Apr 1891 – 31 Mar 1892): see the
  old-programme table below. Wikipedia's "10 Jul 1891" is a *completion* date, two events apart; the
  primary source gives the commissioning date.
- *Trafalgar* — **VERIFIED (completion year)**. [B91] p.89, table "During the last three years the
  following vessels laid down under the old programme have been completed and passed into the First
  Reserve:—", reads verbatim:

  > `1889-90 | Trafalgar, Victoria, Camperdown`
  > `1890-91 | Sanspareil`
  > `1891-92 | Nile`

  (Printed p.89; page image leaf n115.) Trafalgar completed and passed into the First Reserve in FY
  **1889–90**, i.e. on or before 31 March 1890. [B90] p.148 independently records "The gunnery trials of
  Her Majesty's ship Trafalgar took place on Saturday, 22nd February, 1890" (p.149 is the running head
  "TRAFALGAR'S GUN TRIALS"), so completion in early 1890 is consistent. Keel-to-completion = 18 Jan 1886
  → 31 Mar 1890 = **50.4 months** (48–50 months if she completed earlier in Jan–Mar 1890).

**A conflicting contemporary claim (recorded, not used).** [B92] p.90 says of Trafalgar: "She was built
and completed in about three years and three months." That is ~39 months, which cannot be reconciled
with the laid date of 18 Jan 1886 and the FY 1889–90 completion in [B91] p.89 (nor with the Feb 1890
gunnery trials in [B90]). The same page is otherwise careful (it gives Royal Sovereign's commencement as
30 Sep 1889), so the 39-month Trafalgar claim appears to be an error or to measure a different interval.
The FY 1889–90 completion year and the 50-month keel-to-completion are used.

### 3.2 Royal Sovereign class (the 1890 point)

**Displacement — VERIFIED.** [B91] pp.118–119, comparison table "Royal Sovereign | Nile and Trafalgar",
reads verbatim `Displacement … tons 14,150 | 12,500` (printed p.119; page image leaf n147). Corroborated
by [B94] Chapter II: "the armour-clads of the Royal Sovereign Class of 14,150 tons"; and by the trials
table in [B94] ("The Royal Sovereign herself was tried at 27 ft. 6 in. load draught and about 14,200 tons
displacement"). The class design displacement of 14,150 t is primary.

**Royal Sovereign's own keel and completion — VERIFIED.** [B91] p.88: "The Royal Sovereign was laid down
in the month of September, 1889…" (page image leaf n114); [B91] p.119 adds "the keel-plate was laid down
on October 1st, 1889"; [B92] p.90 repeats "the ship is stated to have been commenced on 30th September,
1889". [B92] p.2 reads verbatim:

> "The Royal Sovereign, which was launched in 1890–91, is expected to be ready for commission on May 31,
> two years and eight months from the day her keel was laid. This unprecedented rate of construction has
> been secured by concentrating the energies of Portsmouth Dockyard upon her throughout the period of her
> construction, and **cannot be considered as normal**."

(Printed p.2; page image leaf n22.) So Royal Sovereign: keel 30 Sep 1889 → commission 31 May 1892 =
**32.0 months** (2 y 8 m), explicitly flagged by Brassey as an outlier.

**Class laid/completed window — VERIFIED at class level, not per ship.**

- Laid-down dates from [B91] p.414 (table "…laid down to build since January, 1885—continued", 1889
  section): `Hood … Aug. 12`; `Renown … July 9`; `Repulse … May 4`; `Royal Sovereign … 30 Sept.`
  (page image leaf n582). **The rows for Ramillies, Resolution, Revenge and Royal Oak carry a dash, not a
  date** — those four dates are not printed in this table. The 1892 volume's version of the same table
  ([B92] p.423, "A List of Ships Building under Naval Defence Act not to be completed till after
  March 31, 1893") repeats the same blanks.
- Completion: [B94] pp.1–2 reads verbatim: "The Empress of India, Ramillies, Resolution, and Centurion
  were completed before the end of 1893, and are already in commission. The Revenge, Royal Oak, Repulse,
  and Barfleur have been through their trials, and will be ready for sea in April." [B94] p.422 repeats
  "the Royal Oak, Repulse, and Revenge will be ready for Service in April, 1894." [B92] p.2 records the
  Empress of India and Hood "completing for sea" in early 1892, and the Repulse and Ramillies being
  launched on 27 Feb and 1 Mar 1892.

So the class window "laid 1889–90, completed May 1892 – April 1894" is primary-grounded, but the
**per-ship keel and completion dates for all eight ships are not all printed in the reachable volumes**:
Brassey prints laid dates for only Royal Sovereign, Empress of India (as Renown), Hood and Repulse, and
completion years only as a class (four before end-1893; three in April 1894; Royal Sovereign May 1892).

**The 32-month figure is explicitly not representative.** [B95] p.5 (page image not needed; OCR legible)
reads verbatim: "It was observed in the case of the Royal Sovereign, which was seventeen months on the
stocks, that the rate at which she was built could not be considered as normal, an observation which was
justified by the length of time which the other ships of the class took to build." [B96] p.11 repeats
that "the rate of construction attained in the case of the Royal Sovereign, the Majestic, or the
Magnificent, cannot be accepted as normal." Any era factor built on the class must therefore use a
class-mean / representative figure, not Royal Sovereign alone.

### 3.3 The build-time table's months at these displacements

From `buildMonthsByDisplacementT` in `balance.yaml` (points `[390,18] [5600,30] [11000,30] [12000,31]
[12950,35] [14900,36]`, linear interpolation):

- At 11,940 t (Trafalgar): 30 + (11,940 − 11,000)/1,000 × (31 − 30) = **30.94 months**.
- At 14,150 t (Royal Sovereign): 35 + (14,150 − 12,950)/1,950 × (36 − 35) = **35.62 months**.

(The current comment in `balance.yaml` writes "31" and "36" for these; the interpolated values are
30.94 and 35.62.)

### 3.4 Recomputed era factors (ADR-0080 method: class keel-to-completion months ÷ table months at that displacement)

**1886 point (Trafalgar class, 11,940 t):**

| ship | keel | completed / commissioned | months | source |
| ---- | ---- | ------------------------ | ------ | ------ |
| Nile | 8 Apr 1886 | commissioned 30 Jun 1891 | 62.7 | [B86] p.413; [B92] p.65 |
| Trafalgar | 18 Jan 1886 | completed FY 1889–90 (≤31 Mar 1890) | 50.4 | [B86] p.413; [B91] p.89 |

Class mean = (62.7 + 50.4)/2 = **56.6 months**. Factor = 56.6 / 30.94 = 1.829 →
**18,290 bp (≈ 18,300)**.

- Nile alone: 62.7 / 30.94 = 2.027 → 20,270 bp.
- Trafalgar alone: 50.4 / 30.94 = 1.629 → 16,290 bp.

The shipped value is **18,000 bp**; the primary recomputation is 18,000–18,300 (within ~2 %). The current
value **agrees**.

**1890 point (Royal Sovereign class, 14,150 t):**

- Royal Sovereign alone: 32.0 / 35.62 = 0.898 → **8,980 bp** (but Brassey says this is *not normal*).
- Class mean = 43.0 months (the figure the current provenance is built on): 43.0 / 35.62 = 1.207 →
  **12,070 bp**. At 44.0 months: 12,350 bp. Against the table's rounded 36 months (as the current comment
  does): 43/36 = 11,940 bp; 44/36 = 12,220 bp.

The shipped value is **12,200 bp**, which corresponds to ≈ 43.5–44 months ÷ 36. The class-mean
recomputation gives 12,000–12,400 depending on the exact mean and whether 35.62 or 36 is used. The current
value is **consistent with a class mean of ~43–44 months**, but that mean is not fully primary-sourced
(see §3.2).

## 4. Recommendations

- **1886 point: move to `VERIFIED`.** All four required figures — both keel dates, both completion
  dates, and the 11,940 t displacement — are now read in contemporary primary sources ([B86] pp.185, 413;
  [B90] pp.146–149; [B91] pp.88–89; [B92] pp.2, 65, 90). Keep **18,000 bp**; the primary recomputation is
  18,000–18,300 bp, so 18,000 is defensible. Suggested provenance text: "Trafalgar class 11,940 t
  (Brassey's Naval Annual 1886 p.185): Nile laid 8 Apr 1886 (1886 p.413), commissioned 30 Jun 1891
  (1892 p.65); Trafalgar laid 18 Jan 1886 (1886 p.413), completed and passed into the First Reserve in
  FY 1889–90 (1891 p.89). Mean ~56.5 months vs table 30.9 → ~1.83."
- **1890 point: keep 12,200 bp but re-word provenance, or re-derive.** The displacement (14,150 t) and the
  class window (laid 1889–90; completed May 1892 – Apr 1894) and Royal Sovereign's own 32 months are
  `VERIFIED` ([B91] pp.88, 118–119, 414; [B92] pp.2, 90; [B94] pp.1–2, 422). But the eight-ship mean of
  ~43 months that produces 12,200 bp is a derived statistic whose per-ship keel and completion dates are
  **not** all printed in the reachable volumes. Recommended provenance: cite the primary class evidence
  above, state that the mean is derived from the class window (Royal Sovereign 32 months, explicitly an
  outlier per Brassey 1895 p.5), and mark the point `SECONDARY (class-derived)` unless the orchestrator
  accepts class-level primary evidence as sufficient for `VERIFIED`. Do **not** silently keep the
  Wikipedia provenance.
- **The exact bp values remain BALANCE TARGET (non-normative).** The choice of class-mean vs a
  representative ship, and the integer rounding, are modelling decisions, not historical facts. ADR-0080
  itself says "each point is a class's keel-to-completion months over the table's months" without
  specifying mean-vs-representative, so the orchestrator owns that choice.

## 5. Per-point verdict

- **1886 — CAN be marked VERIFIED.** Every figure is read in a contemporary primary source.
- **1890 — PARTIALLY.** The displacement, the class laid/completed window, and Royal Sovereign's own
  32-month build are VERIFIED; the ~43-month class mean (the basis of 12,200 bp) is not fully
  primary-sourced. Sources tried and failed to fill the four missing laid dates: *The Naval Annual 1891*
  p.414 and *1892* p.423 (both print a dash for Ramillies / Resolution / Revenge / Royal Oak); *The Naval
  Annual 1894* Part II ship tables are image-only with OCR-scrambled rows; the 1895 and 1896 volumes
  carry no per-ship laid/completed table. If a strictly per-ship-`VERIFIED` 1890 point is required, the
  remaining four keel dates need a source this session could not reach.

## 6. Deferred / open

- The four missing laid dates (Ramillies, Resolution, Revenge, Royal Oak). A future pass could try the
  UK Navy Estimates / parliamentary papers (not on archive.org for these years per
  `ship-building-build-times-destroyer-displacement.md`) or Conway's *All the World's Fighting Ships*
  (lending-only on archive.org) for a per-ship table.
- The conflict between [B92] p.90 ("Trafalgar … built and completed in about three years and three
  months") and [B91] p.89 (FY 1889–90 completion). Recorded, not resolved; the FY-1889–90 evidence is
  preferred.
- No open decision in `docs/OPEN-ISSUES.md` was silently resolved by this note. The era-multiplier
  derivation method (mean vs representative) is a modelling choice for the orchestrator, not a factual
  one.
