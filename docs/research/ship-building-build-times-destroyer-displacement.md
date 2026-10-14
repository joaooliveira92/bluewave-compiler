# Ship-building: torpedo-boat destroyer displacement for the build-time table (ticket 22)

Research note for `.scratch/ship-building/issues/22-build-time-estimate-rows.md`. Backs the low end of
`buildMonthsByDisplacementT` and its `buildMonthsProvenance[0]` in
`content/production/1880/ship-building/balance.yaml`. Research only: no content, code or ticket was edited.

Question: can the `[390, 18]` point (destroyer displacement 390 t, 18 months keel-to-commissioning) be marked
**VERIFIED** against a primary contemporary source? The ticket asks for a primary source that states a destroyer
displacement in the 350-400 t band together with a keel-to-commissioning duration for a named ship.

Method: archive.org OCR full texts (`_djvu.txt`) read in full for the pages cited, then the table pages checked
against page images (`https://archive.org/download/<id>/page/n<leaf>_w1600.jpg`) because the OCR of the flotilla
tables is garbled. Page numbers are the printed running headers.

## Verdict (summary)

**No.** No reachable primary contemporary source states 390 t for Bat, Whiting or any 30-knotter destroyer. The
primary source that gives the duration (Brassey's Naval Annual 1901, p. 263) names **Bat** and **Whiting**, and the
same volume's torpedo-boat flotilla table gives their displacement as **326 t** (Bat, p. 372) and **330 t**
(Whiting, p. 373). The 390 t figure is Jane's-derived (via Wikipedia) and conflicts with Brassey; it cannot be
verified, and it matches no 30-knotter in the volume.

The point **can** be made VERIFIED, but only by moving it to the displacement the primary source actually states:
**`[330, 18]`**.

## Sources

| Key | Source | archive.org id | Access |
| --- | ------ | -------------- | ------ |
| [B96] | The Naval Annual 1896 | `CASGA_120403` | OCR read |
| [B98] | The Naval Annual 1898 | `CASGA_120405` | OCR + page image (p. 349 = leaf n349) |
| [B99] | The Naval Annual 1899 | `navalannual1899` | OCR read |
| [B01] | Brassey's Naval Annual 1901 | `brassey-s-naval-annual-1901` | OCR + page images (p. 263 = leaf n291; pp. 372-373 = leaves n400-n401) |
| [B02] | The Naval Annual 1902 | `brasseysnavala1902brasuoft` | OCR read |
| [B04] | The Naval Annual 1904 | `CASGA_120410` | OCR searched |
| [ENG97] | The Engineer, Jan-Jun 1897 (Vol. 83) | `sim_engineer_january-1-june-25-1897_83` | OCR searched |
| [ENG00] | The Engineer, Jan-Jun 1900 (Vol. 89) | `sim_engineer_january-5-june-29-1900_89` | OCR searched |
| [WIKI] | Wikipedia, *HMS Whiting (1896)* and *Star-class destroyer* | en.wikipedia.org | read (secondary, for the conflict only) |

## Findings

### 1. The duration evidence ([B01] p. 263, p. 264) — VERIFIED

[B01] p. 263, running header "TIME-STANDARD FOR COMPLETION.", verbatim:

> "The Whiting was completed in every particular in fourteen months, and the Bat in two months more; yet the
> Express, Otter, and Vulture were in hand four years, the Electra and Recruit five years, the Fervent six, and the
> Zephyr even longer. ... So rapidly are advances being made in the design of these ships that, unless they can be
> finished in a year or eighteen months, it would be better that the placing of contracts should be delayed ..."

[B01] p. 264, verbatim:

> "A second-class ship should be ready within a couple of years, and a torpedo-boat destroyer in eighteen months at
> most. These standards have been beaten time and again."

So the 18 months in content is the **standard/ceiling**, and the two named ships that beat it are **Whiting (14
months)** and **Bat (16 months)**. This is the only primary destroyer build-time statement found; it is the
sentence already used in content. Note the passage does not state the start event (order, keel or laying down) for
the 14/16 months.

Corroboration of the 18-month norm for destroyers, [B98] p. 204 (war-reserve shipbuilding chapter):

> "... the private shipbuilders and machinery manufacturers would be able to turn out warships on the following
> scale ... forty torpedo-boat destroyers, as the Speedy and Havock, in eighteen months ..."

(Speedy and Havock are the 1893 ~240-280 t boats, not the 30-knotters, so this is a norm, not a 350-400 t datum.)

### 2. The displacement of the same two ships ([B01] pp. 372-373) — VERIFIED (page images)

[B01] p. 372, table "BRITISH AND FOREIGN TORPEDO-BOAT FLOTILLAS", column "Displacement, Tons":

> "Bat ... Jarrow ... 1896 | 215 | 20·75 | 6·8 | 2 | **326** | 6,185 | 30·1 | 1-12 pr. 5-6 prs. | 2 | 60 | 91"

[B01] p. 373, same table (continued), verbatim:

> "Whiting ... Jarrow ... 1896 | 215 | 20·75 | 6·88 | 2 | **330** | 6,239 | 30·2 | 1-12 pr. 5-6 prs. | 2 | 58 | 80"

The same table gives the whole Palmer 30-knotter group at **323-330 t**: Chamois 325, Crane 324 (p. 372); Fawn 325,
Flirt 324, Flying Fish 323, Star 328 (p. 373). Nothing in the group is near 390 t.

### 3. Other contemporary statements of the same displacement

- [B98] p. 349, same table (1898 edition): "Whiting ... Jarrow ... 1896 | 215 | 20·75 | 6·88 | 2 | **333** | 6,315 |
  30·2". The 1898 volume's **Bat** row reads "210·6 | 21·6 | 5·8 | 2 | **300** | 5,900", i.e. the dimensions of the
  Barrow-built Avon/Bittern rows, so the 1898 Bat row looks like a contract placeholder. [B01] supersedes it.
- [B02] p. 275 (1902), same table: **Bat 326 t, Whiting 330 t** — identical to [B01].
- [B99] (1899) p. 27: "The Viper ... is 220 ft. long, and of **330 tons** displacement." (the 1901 table lists the
  completed Viper at 512 t, so these early figures are working design values that grew).

### 4. Destroyers in the 350-400 t band in the primary source have NO stated duration

The [B01] flotilla table does contain destroyers at 350-400 t:

| Ship | Displacement [B01] | Page | Duration stated anywhere? |
| ---- | ------------------ | ---- | ------------------------- |
| Albatross (Thornycroft "special", 33 kn) | 360 t | p. 372 (and [B98] p. 349) | no |
| Success (Doxford) | 350 t | p. 373 | no |
| Úlbra / "1 Unnamed" (Elswick) | 400 t | p. 373 | no |

None of them has a keel-to-commissioning figure in [B01], [B02], [B98], [B99] or [B04]; [B02] p. 9 only records
that Albatross "was accepted last year" (i.e. 1901) and had failed to reach its 32 kn contract speed — a slow
acceptance, not a usable build-time point. So the ticket's "350-400 t destroyer with a duration" does not exist in
the sources read.

### 5. The 390 t figure and the legend/full-load conflict

[WIKI] *HMS Whiting (1896)* gives, for Whiting:

> Displacement: 390 long tons (396 t) **standard**; 420 long tons (427 t) **full load**. Laid down 13 April 1896,
> launched 26 August 1896, commissioned June 1897.

The article states "All tabular data under General Characteristics only from the listed *Jane's Fighting Ships*
volume", citing *Jane's Fighting Ships 1898* (pp. 84-85) and *Jane's ... 1919* (p. 76). The companion
*Star-class destroyer* article gives the same class as **360 long tons (366 t)** — a third value for the same
ships.

Conflict: the contemporary convention used by Brassey's flotilla table is a single **designed/legend
displacement** in the column headed "Displacement, Tons" (there is no standard/full-load split in any volume
read). The "standard" / "full load" labels in the Wikipedia infobox are a modern editorial convention (the
Washington "standard displacement" term postdates 1918); without the Jane's page itself I cannot confirm what its
column header was. On the evidence available, **Brassey's 326-330 t is the contemporary figure to use**, and the
390/420 t pair measures a different (and, per Wikipedia, later/reprinted) condition.

## Recommendations

1. **Point value.** Change `buildMonthsByDisplacementT.points[0]` from `[390, 18]` to:

   ```yaml
   - [330, 18]
   ```

   330 t is Whiting's displacement ([B01] p. 373); Bat is 326 t ([B01] p. 372). Keeping 18 months preserves the
   table's "1894-1900 standard" semantics ([B01] p. 264); the observed records (Whiting 14, Bat 16) are the beat-
   the-standard cases. If the orchestrator prefers a measured value rather than the standard, `[330, 15]` (mean of
   14 and 16) or `[330, 14]` (Whiting) are equally primary-grounded — but `[330, 18]` is the minimal change and
   keeps the existing curve.

2. **Provenance string.** Replace `buildMonthsProvenance[0]` with:

   ```yaml
   - status: VERIFIED
     source: "Brassey's Naval Annual 1901 p. 264 (18 months the most a destroyer should take; Whiting 14, Bat 16 months, p. 263); 330 t Whiting and 326 t Bat from the torpedo-boat flotilla table, pp. 373 and 372"
   ```

3. **Do not** keep 390 t as a VERIFIED point. If the orchestrator wants to retain 390 t for continuity with the
   Jane's-derived figure, it must stay **SECONDARY** (Jane's 1898 via Wikipedia, not directly readable), which
   leaves ticket 22's "provisional" label in place below 5,600 t.

4. **Interpolation consequence (informational).** Moving the low point 390 -> 330 t changes very little: at 350 t
   the value goes from 18 (clamped) to ~18.0 months, and at 500 t to ~18.4 months, so the forecast, monotonic and
   bracketing behaviour are effectively unchanged. The orchestrator should still re-run the forecast/monotonic
   tests after the edit, as the ticket requires.

## Tried and not reachable (for a possible deferral record)

- **Jane's Fighting Ships 1898** (the direct source of the 390/420 t and the 13 Apr 1896 / Jun 1897 dates): not
  reachable. The only archive.org item matching it (`janesfightingshi0000unse_c8g0`, metadata date 1898) is a
  **mislabeled reprint of the 1914 edition** (its title page reads "JANE'S FIGHTING SHIPS 1914"); it is
  lending-collection (`internetarchivebooks`) and contains no 1898 ship data. No genuine 1898/1899/1900 Jane's
  scan exists on archive.org (`advancedsearch` returned nothing for those years). HathiTrust returned HTTP 403 and
  the Google Books API returned no volume.
- **UK Navy Estimates / parliamentary papers 1896-1901**: not on archive.org (`title:(navy estimates)` for
  1895-1902 returned nothing); no laid-down/completed destroyer table could be reached.
- **The Engineer / Engineering volumes**: [ENG97] and [ENG00] OCR searched; their "Whiting" hits are unrelated
  people/companies and no destroyer keel-to-completion table appears. Only index/supplement issues exist for most
  other 1896-1901 volumes.
- **Conway's All the World's Fighting Ships 1860-1905**: not reachable (lending-only), as recorded in the earlier
  note.
- **Primary keel and commissioning dates for Bat/Whiting**: still absent. Brassey records only the year of launch
  (1896) and the durations (14/16 months); the exact dates are Jane's-derived (via Wikipedia) and were not
  directly verified. A second reading of Jane's 1898 (or a ship-cover / Admiralty return) would be needed to pin
  them.
