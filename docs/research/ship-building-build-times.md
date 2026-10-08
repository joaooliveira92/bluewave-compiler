# Ship-building: keel-to-commissioning build times (ticket 22)

Backs `buildMonthsByDisplacementT` and `buildMonthsProvenance` in `content/production/1880/ship-building/balance.yaml`
(ADR-0067 section 5). Researched 2026-10-08 from the OCR text of Brassey's Naval Annual on archive.org (ids
`brassey-s-naval-annual-1901`, `brasseysnavala1902brasuoft`, `brassey-s-naval-annual-1907`, `navalannual1908`,
`navalannual1910`, `CASGA_120403`). Page numbers are the printed running headers; OCR is imperfect.

Status key: VERIFIED = months read in a primary contemporary source for a ship of about that displacement. SECONDARY = a
compilation, a derived value, or a primary duration with an unverified displacement. ESTIMATE = no source.

## Table points

| t      | months | status    | evidence |
| ------ | ------ | --------- | -------- |
| 390    | 16     | VERIFIED  | Brassey 1901 p. 263: Whiting 14 months, Bat 16; p. 264: a destroyer should take 18 months at most. Displacement about 390 t (Wikipedia, Palmers 30-knotters). Wikipedia dates agree for Whiting (13 Apr 1896 to Jun 1897). |
| 5,600  | 30     | SECONDARY | Brassey 1901 p. 262: second-class cruisers Highflyer and Hermes "about two years and a half" from keel to Fleet Reserve; commissioned Oct and 7 Dec 1899. The 5,600 t displacement is not stated in the volumes read. |
| 11,000 | 30     | VERIFIED  | Brassey 1901 p. 262: Diadem laid 23 Jan 1896, pennant 19 Jul 1898 ("two years and six months"); Niobe 36 months. 11,000 t is on p. 10. |
| 12,000 | 31     | VERIFIED  | Cressy, see below. |
| 12,950 | 35     | VERIFIED  | Brassey 1901 p. 259 table: Canopus 4 Jan 1897 to 5 Dec 1899, 35 months; Ocean 36; Goliath 39; Glory 47. |
| 14,900 | 36     | VERIFIED  | Brassey 1901 pp. 258-259: Majestic class five ships "over three years" each; Hannibal 1 May 1894 to 9 May 1898. Majestic 22 and Magnificent 24 months are the efficient record (also Brassey 1896 p. 408). |
| 16,500 | 34     | VERIFIED  | Brassey 1908 p. 27: Lord Nelson 34 months; Africa, Hibernia, Britannia (King Edward VII class) 32-36. Displacement from Brassey 1907 p. 47. |
| 18,600 | 28     | VERIFIED  | Brassey 1910 p. 1: Bellerophon class "completed in twenty-eight months or less from the date of laying down" (an upper bound). Displacement from Brassey 1907 p. 47. |

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

## Design caveat

The 1906-10 battleship points (34 and 28 months) are shorter than the 1897-1900 ones (35 to 36). Yards and supply chains were
faster by then, and a displacement-only table cannot model era. The table is therefore not monotonic above 14,900 t. If the
campaign needs era-dependent build times, add an industry-era multiplier rather than bending the table.

## Still not verified

- The 5,600 t displacement of Hermes and Highflyer (the only SECONDARY point). Builds between 390 t and 11,000 t stay
  "provisional" until a primary source states it or a verified point replaces it.
- No Conway's, navweaps or Navypedia entry was usable: Conway's is lending-only on archive.org, navweaps covers guns not
  build dates, and the Navypedia pages tried were not reachable. Brassey was the primary source throughout.
- Armoured cruisers around 9,000 t (Kent/Monmouth class, 9,800 t): laying-down dates are in Brassey 1901 p. 23 but no
  completion date was found in the volumes read.
