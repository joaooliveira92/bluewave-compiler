# Ship-building: keel-to-commissioning build times (ticket 22)

Backs `buildMonthsByDisplacementT`, `buildMonthsProvenance`, `buildTimeEraBp` and `buildTimeEraProvenance` in `content/production/1880/ship-building/balance.yaml`
(ADR-0067 section 5). Researched 2026-10-08 from the OCR text of Brassey's Naval Annual on archive.org (ids
`brassey-s-naval-annual-1901`, `brasseysnavala1902brasuoft`, `brassey-s-naval-annual-1907`, `navalannual1908`,
`navalannual1910`, `CASGA_120403`). Page numbers are the printed running headers; OCR is imperfect.

Status key: VERIFIED = months read in a primary contemporary source for a ship of about that displacement. SECONDARY = a
compilation, a derived value, or a primary duration with an unverified displacement. ESTIMATE = no source.

## Table points

| t      | months | status    | evidence |
| ------ | ------ | --------- | -------- |
| 390    | 18     | SECONDARY | Brassey 1901 p. 264: a destroyer should take 18 months at most (the standard, used here); p. 263: Whiting 14 months and Bat 16 are the records. Displacement about 390 t is from Wikipedia (Palmers 30-knotters), not Brassey. |
| 5,600  | 30     | VERIFIED  | Brassey 1901 p. 262: second-class cruisers Highflyer and Hermes "about two years and a half" from keel to Fleet Reserve; commissioned Oct and 7 Dec 1899. 5,600 t: "Three new second-class cruisers of 5600 tons have been laid down, the Hyacinth..., the Hermes and Highflyer at Fairfield" (Brassey 1898 p. 12). |
| 11,000 | 30     | VERIFIED  | Brassey 1901 p. 262: Diadem laid 23 Jan 1896, pennant 19 Jul 1898 ("two years and six months"); Niobe 36 months. 11,000 t is on p. 10. |
| 12,000 | 31     | VERIFIED  | Cressy, see below. |
| 12,950 | 35     | VERIFIED  | Brassey 1901 p. 259 table: Canopus 4 Jan 1897 to 5 Dec 1899, 35 months; Ocean 36; Goliath 39; Glory 47. |
| 14,900 | 36     | VERIFIED  | Brassey 1901 pp. 258-259: Majestic class five ships "over three years" each; Hannibal 1 May 1894 to 9 May 1898. Majestic 22 and Magnificent 24 months are the efficient record (also Brassey 1896 p. 408). |

## Cressy: October 1900 versus 28 May 1901

Both dates are right; they are different events.

- Laid down 12 Oct 1898, launched 4 Dec 1899 (Brassey 1901 p. 23 table).
- "The Cressy was delivered at Portsmouth in October, 1900, from the works of the Fairfield Company" (Brassey 1901 p. 20): the
  contractor handed the hull over to the dockyard (about 24 months), then went through full-power trials in December 1900.
- "The Cressy, the leading vessel of this type of cruiser, was commissioned in May last" (Brassey 1902 p. 396), consistent with
  Wikipedia's 28 May 1901.

Keel to commissioning is therefore about 31 months, the value in the table. The First Lord's memorandum in Brassey 1901
(page not recorded) also says she was delivered within the contract date.

## Other observations (not table points)

- Dreadnought 17,900 t: trials one year after official laying down, "rather less than 16 months" under construction (Brassey
  1907 p. 7); "could only be attained in very special cases" (Brassey 1908 p. 27). Excluded as an outlier.
- Vanguard 19,250 t: laid Apr 1908, commissioned Mar 1910 (about 23 months), "well under the two years allowed by the
  contract" (Brassey 1910 p. 1).
- Brassey 1901 p. 264 standards: first-class cruiser two years from laying down, second-class about two years, destroyer 18
  months at most.
- Havock 240 t: laid 1 Jul 1892, commissioned Jan 1894 (18 months); Hornet 275 t: Jul 1892 to Jul 1894 (24 months, new-boiler
  outlier). Both Wikipedia only, not used.
- Blake 9,150 t: about 43 months, laid Jul 1888, ready Feb 1892 (Wikipedia, 1880s outlier, not used).

## Era multiplier (ticket 26, ADR-0080)

The table above is the 1894-1900 standard. Yards were slower before the 1889 Naval Defence Act and faster after 1905, so
`buildTimeEraBp` scales it by the year the keel is laid. Each factor is the class's keel-to-completion months over the
table's months at its displacement.

| year | bp     | status    | evidence |
| ---- | ------ | --------- | -------- |
| 1886 | 18,000 | SECONDARY | Trafalgar class, 11,940 t designed (Wikipedia): Nile laid 8 Apr 1886, completed 10 Jul 1891 (63 months); Trafalgar laid 18 Jan 1886, completed 1890 (48-59). Table 30 months. |
| 1890 | 12,200 | SECONDARY | Royal Sovereign class, 14,150 t (Wikipedia): eight ships laid Jul 1889 - Feb 1891, 32, 50, 52, 45, 38, 42, 37 and 48 months (mean 43). Table 36. |
| 1895 | 10,000 | VERIFIED  | The table's own era (Majestic, Canopus; Brassey 1901 pp. 258-259). |
| 1900 | 10,000 | VERIFIED  | The table's own era (Diadem, Cressy; Brassey 1901 pp. 20-23, 262). |
| 1905 | 9,400  | VERIFIED  | Brassey 1908 p. 27: Lord Nelson 34 months; King Edward VII class 32-36; 16,500 t (Brassey 1907 p. 47). 34 / 36. |
| 1908 | 7,800  | VERIFIED  | Brassey 1910 p. 1: Bellerophon class 28 months or less; 18,600 t (Brassey 1907 p. 47). 28 / 36. |

The Admiral class (laid 1880-83, 70-84 months) is not used: its delays came from the 13.5-inch gun supply, not the yards.
Builds ordered before 1895 stay "provisional" until the 1886 and 1890 points are read in Brassey or Parkes.

## Still not verified

- The ~390 t destroyer displacement (Wikipedia; the 18-month standard itself is Brassey 1901 p. 264). Builds below 5,600 t
  stay "provisional" until a primary source states a destroyer displacement. (The 5,600 t point is VERIFIED since
  2026-10-09, Brassey 1898 p. 12; see `ship-building-content-sourcing.md`.)
- No Conway's, navweaps or Navypedia entry was usable: Conway's is lending-only on archive.org, navweaps covers guns not
  build dates, and the Navypedia pages tried were not reachable. Brassey was the primary source throughout.
- Armoured cruisers around 9,000 t (Kent/Monmouth class, 9,800 t): Kent laid 12 Feb 1900 (Brassey 1901 p. 21), in
  commission by early 1904 (Brassey 1904 p. 4), so 40-48 months; no completion month is printed, so it is not a table point.
