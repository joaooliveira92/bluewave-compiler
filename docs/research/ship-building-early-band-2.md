# Research: Ship-building catalogue — EARLY band (1880–1899), second pass (costs, torpedoes, mounts, magazines, hulls, stores, electrics, rangefinders, stability)

Second research pass for the component-level ship compiler's catalogue (ADR-0063 / ADR-0064, `.scratch/ship-building/`), EARLY era
band (Jan 1880 – Dec 1899). It settles or narrows the UNVERIFIED / ESTIMATE rows of `ship-building-early-band.md` ("Gaps and
confidence") and the `PLACEHOLDER` items listed in `content/production/1880/ship-building/README.md`. Research-only; no catalogue
files are edited. Captured 2026-10-08. Method, labels and conversions are those of the first note (VERIFIED / SINGLE-SOURCE /
ESTIMATE / UNVERIFIED); read that note first, this one only adds and corrects.

## Method, sources and what could not be reached

All primary texts below were downloaded as archive.org OCR full text (`_djvu.txt`) and read/grepped directly. Page numbers are the
running heads where the OCR kept them; otherwise the volume is cited. OCR errors are flagged where a number is doubtful.
Wikipedia was used only to find leads (and is never a source); web-search snippets are labelled "secondary" and never graded above
SINGLE-SOURCE.

| Tag | Source | Grade |
| --- | --- | --- |
| [B86] | T. A. Brassey (ed.), _The Naval Annual 1886_ (archive.org `navalannual1886`) | Primary annual |
| [B89] | _The Naval Annual 1888–9_ (`navalannual1888-1889`) | Primary annual |
| [B90] | _The Naval Annual 1890_ (`navalannual1890`) | Primary annual |
| [B91] | _The Naval Annual 1891_ (`navalannual1891`) | Primary annual |
| [B92] | _The Naval Annual 1892_ (`navalannual1892`) | Primary annual |
| [B94] | _The Naval Annual 1894_ (`CASGA_120401`) | Primary annual |
| [B96] | _The Naval Annual 1896_ (`CASGA_120403`) | Primary annual |
| [B97] | _The Naval Annual 1897_ (`CASGA_120404`) | Primary annual |
| [B98] | _The Naval Annual 1898_ (`CASGA_120405`, used in note 1) | Primary annual |
| [B00] | _The Naval Annual 1900_ (`CASGA_120406`) | Primary annual |
| [B02] | _The Naval Annual 1902_ (`brasseysnavala1902brasuoft`, used in note 1) | Primary annual |
| [INA94] | W. H. White, "The Qualities and Performances of Recent First-Class Battle-ships", _Trans. Institution of Naval Architects_ vol. 35 (1894), pp. 147–155 (`transactionsroy02unkngoog`) | Primary (the DNC's own paper) |
| [W] | W. H. White, _A Manual of Naval Architecture_ (1894) (`manualofnavalarc00whitrich`, used in note 1) | Primary |
| [QR79] | _Queen's Regulations and Admiralty Instructions_ (1879), App. XXVI Table M (`royal-navy-regs-1879`) | Primary (Admiralty) |
| [TA02] | _Treatise on Ammunition_, 1902 ed. (`TreatiseOnAmmunition1902`) | Primary (HMSO) |
| [ARM96] | G. E. Armstrong, _Torpedoes and Torpedo-Vessels_ (Royal Navy Handbooks, ed. J. K. Laughton, Bell, 1896) (`torpedoesandtor00armsgoog`) | Near-primary handbook |
| [SLE] | C. W. Sleeman, _Torpedoes and Torpedo Warfare_ (ed. 1880 / 1889) (`torpedoesandtor00sleegoog`) | Near-primary |
| [OS] | Ordnance Society Research Guide VI (2020), a booklet reproducing EB 1911 "Range-finding" | Near-primary (1911 text, transcribed) |
| [CAR] | C. P. Carlson, "Development of Optical Rangefinders", Admiralty Trilogy seminar slides 2024 | Secondary (lead; cites trials) |
| [CER] | cerberus.com.au "torpedoes" page (HMAS _Cerberus_ museum) — table of RN 14-in torpedo marks, underlying manual not named | Secondary web compilation |

Not reachable this session: dreadnoughtproject.org (HTTP 403, Cloudflare challenge), sites.rootsweb.com (403), usni.org Proceedings
pages (403), navweaps torpedo pages for 14-in marks (no page exists; 404). Jane's _Fighting Ships_ (1898+), Engineering/The Engineer
runs, Navy Estimates Blue Books and the Navy List ship-complement pages were not fetched as full text; the Navy List editions exist on
archive.org (`navylist1896june`, `navylist1895april`, ...) but list officers and stations, not ship complements, so they were not used.

Conversions: 1 lb = 0.4536 kg; 1 long ton = 1016.05 kg; 1 ft = 0.3048 m; 1 ft³ = 0.02832 m³; 1 imp. gallon = 4.546 L; 1 pint = 0.5683 L;
1 ihp = 0.7457 kW; £1 = $4.8665 (par, used only to convert US prices).

---

## 1. Construction costs (GBP, 1880–1899)

### 1.1 Whole ships

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| HMS _Havock_ (1893) total cost | £34,254, of which machinery £18,674 (hull, fittings and outfit therefore £15,580) | GBP | [B94] p. 14 (Oldknow's "Naval Engineering Notes") | VERIFIED (primary; one source) |
| _Havock_ cost split | machinery 54.5 % of total; £5.33/ihp on the ~3,500 ihp of the trial; hull £64.9/ton of 240 t | % / GBP | derived from the row above and [B94] p. 14 (3,500 ihp, 26.78 kn) | ESTIMATE (derived arithmetic on VERIFIED inputs) |
| _Havock_ class coal / complement / radius | coal 60 t; complement 42 (officers and men); estimated 4,000 nmi at 10 kn ("which speed is too low to be often maintained") | t / men / nmi | [B94] p. 14 | VERIFIED for the quoted design claims |
| Torpedo-catcher of the _Havock_ type (French/other boat, "£30,000 a-piece", 27 kn, 3,400 ihp, 60 t coal, 40 men, 5 tubes) | £30,000 each | GBP | [B94] ch. 1 (foreign torpedo-catcher paragraph; boat not named in the OCR) | SINGLE-SOURCE (cross-check of the £34k Havock) |
| HMS _Majestic_ and _Magnificent_ (1895) | £911,000 apiece "have cost"; "the remaining ships of the class are estimated to cost somewhat less" | GBP | [B97] p. ~2 (Renown paragraph) | SINGLE-SOURCE (primary; guns exclusion not stated for Majestic, stated for Renown) |
| HMS _Renown_ (1897) | £704,747 excluding guns; 12,350 t, i.e. £57.1 per ton displacement | GBP | [B97] p. ~2 | VERIFIED (primary) |
| _Royal Sovereign_ class (dockyard-built) | £770,000 "exclusive of establishment charges and armament" (14,150 t → £54.4/t) | GBP | [B94] "The Royal Sovereign" paragraph quoting the DNC | VERIFIED (primary) |
| Majestic class cost per ton | £911,000 / 14,900 t = £61.1/t | GBP/t | derived | ESTIMATE (derived) |
| HMS _Nile_ (1888) | £803,826 for hull, machinery, gun mountings etc., excluding guns; £857,070 including guns (guns therefore £53,244) | GBP | [B89] p. ~54 (chapter on the _Nile_) | VERIFIED (primary) |
| HMS _Trafalgar_ (1887, sister of _Nile_) | hull, fittings and equipment £686,000; propelling machinery £94,000; gun mountings £46,278; torpedo gear £3,100; guns £56,340; total £885,718 | GBP | [B89] p. 54 | VERIFIED (primary) |
| _Nile_/_Trafalgar_ earlier 1885–86 estimate | £919,134 with guns: hull £686,000; machinery £97,000; gun mountings £79,794; guns £56,340 | GBP | [B86] p. 60 (First Lord's speech in Parliament) | VERIFIED (primary; superseded by the row above) |
| HMS _Inflexible_ / _Benbow_ / _Renown_ (1880s) | £809,600 / £789,162 (contract) / £789,995 (contract) | GBP | [B86] p. 60 | VERIFIED (primary) |
| HMS _Hood_ (1893) | about £900,000 total, complement 634, 7 torpedo dischargers | GBP | [B92] p. ~6 | SINGLE-SOURCE |
| HMS _Powerful_ and _Terrible_ (1895–97) | hull £338,000 (Naval Construction & Armament Co.) and £345,000 (J. & G. Thomson) plus £100,000 machinery each, contract ships; time 3 years | GBP | [B94] ch. 1, quoting the _US Institution Journal_ (Feb 1894) | SINGLE-SOURCE (relayed within a primary annual) |
| _Powerful_ class per-ton | (£338–345k + £100k) / ~14,200 t = £30.9–31.3/t overall; machinery £4.0/ihp for 25,000 ihp | GBP | derived | ESTIMATE |
| HMS _Blake_ and _Blenheim_ (1889–90) | to cost £368,000 each ("our most powerful cruisers") | GBP | [B90] p. 94 quoting _Engineering_ | SINGLE-SOURCE |
| HMS _Edgar_ class (1893) | £401,083 (Brassey 1895), £428,081 (1905), £410,980 (1906); other ships of the class £347,000–£402,000; "standard British practice excludes armament and stores" | GBP | relayed by a Wikipedia article citing Brassey 1895/1905/1906; **volumes 1895 and 1905/6 not opened here** | UNVERIFIED (lead only; plausibility check: _Blake_ at £368k for ~9,000 t, i.e. £41/t, implies £300–400k for 7,350–7,700 t) |
| _Medea_ class third-class protected cruiser (1888) | hull £64,790 and machinery £50,824; total each complete with guns, mountings, torpedo gear and stores about £173,000; 265 × 41 ft; crew ~300; 6 × 6-in (5-ton), 6 tubes | GBP | [B89] pp. 90–91 (_Army and Navy Gazette_ via Brassey) | SINGLE-SOURCE (hull figure looks like the structure only) |
| _Sharpshooter_-class torpedo gunboat (1888) | engines by Bellis & Co. £19,810 for 4,500 ihp (forced draught), i.e. £4.40/ihp; 735 t, 230 × 27 ft, mean draught 8 ft 3 in; coal 100 t; 2,500 nmi at 10 kn | GBP | [B89] p. ~109 | SINGLE-SOURCE |
| HMS _Speedy_ (1893, 810 t) hull cost | not found | — | — | UNVERIFIED (use _Sharpshooter_ engine £/ihp and ESTIMATE £100–125k) |
| Siegfried-class coast-defence ship, "P" and "Q" (1890) | £175,000 "total cost" per ship (three-year build), 3,495 t → £50/t; 240 × 49 ft 3 in × 17 ft 9 in draught; armour (compound) citadel 9.4 in; 4,800 ihp, 18 kn estimated; 3 × 24 cm; 3 tubes | GBP | [B90] p. ~116 | SINGLE-SOURCE (reads as per-ship; "total" wording ambiguous) |
| Naval Defence Act programme (1889) | £10,000,000 for the contract ships (32), built, completed and armed; dockyard-ship excess over estimates £920,000 on hulls/boilers/machinery, saving £313,000 on armament | GBP | [B92] pp. ~32 (First Lord's statement) | VERIFIED (primary) |
| US comparison, 1889 | turret-ship _Maine_ £517,650; cruiser _Texas_ £495,000; British cruisers of Baltimore size £145,000–£223,000 | GBP | [B90] p. 94 quoting _Engineering_ | SINGLE-SOURCE |
| Russia 1898 estimates | hulls £467,604, machinery £730,104, armour £52,291 (all new construction); with guns, torpedoes and electric light total £2,120,603 | GBP | [B98] Russian Navy Estimates | VERIFIED (primary, foreign) |

### 1.2 Per-ton and per-unit costs

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| Hull cost per ton weight of hull | £48 (_Devastation_, 1869–73); £68 (_Dreadnought_); £80 (_Collingwood_); £72 (_Camperdown_) | GBP/t of hull weight | [B86] p. ~28 (essay on cost of naval construction) | VERIFIED (primary) |
| Materials / labour for a 7,000-t-hull ship | _Devastation_ → _Rodney_: materials £182,000 → £250,000; labour £106,000 → £205,000 for the same hull weight | GBP | [B86] p. ~28 | VERIFIED |
| Dockyard labour cost per ton built, 1878–85 | armoured ships £30 0s 3d (1878-79) rising to £34 10s 11d (1884-85); unarmoured £34 0s 3d to £40 19s 11d | GBP/t | [B86] pp. 33–34 (table "Armoured / Unarmoured Ships, labour only") | VERIFIED |
| Total dockyard expenditure per ton constructed | £55 2s (1869-70); £84 15s 11d (1880-81); £99 14s 9d (1883-84); £109 14s 2d (1884-85) | GBP/t | [B86] pp. 33–34 | SINGLE-SOURCE (column header partly lost in OCR; reads as expenditure per ton of construction) |
| New-construction vote split 1880-81 → 1886-87 | dockyard £0.89 m → £1.50 m; contract £0.24 m → £1.43 m; machinery £0.30 m → £0.75 m | GBP | [B86] p. 434 | VERIFIED |
| Armour per ton (British, mean) | £50 (_Devastation_, iron); £95 14s (_Colossus_, compound); £95 12s (_Collingwood_ and _Rodney_, compound) | GBP/t | [B86] p. ~28 | VERIFIED (primary) — **iron and compound only** |
| Armour per ton, steel/Harvey/Krupp (British) | not found in the volumes read | — | — | UNVERIFIED |
| Armour per ton (US, for scale) | $490–$600 per ton for simple steel (Bethlehem contract 1 Jun 1887, average $538.76 = £110.7); Harvey nickel-steel contracts 1893 carried an extra allowance; 1897 congressional limit $300/t, later $400/t; early-1900s $445–$520/t | USD/t | secondary: Navy Dept. _History of the manufacture of armor plate for the US Navy_ and US newspapers, via web search (not opened) | SINGLE-SOURCE (secondary; US not UK) |
| Heavy guns per ton | English guns "since 1885 only £200 per ton"; French guns over 9 in. £320/ton; Krupp £240/ton (Lord C. Beresford in the Commons, 14 Mar 1888) | GBP/t | [B89] p. ~379 footnote | VERIFIED (primary; Hansard relay) |
| Cross-check on gun price | _Nile_ guns £53,244 for 4 × 67-ton 13.5-in (268 t) = £199/t; _Trafalgar_ £56,340 | GBP/t | derived from [B89] | ESTIMATE (derived; agrees with £200/t) |
| Hydraulic gun-mounting price | £43,155 (_Collingwood_ class); £75,000 in later ships of that type (4 × 12-in + minor); £46,278 for _Trafalgar_'s two twin turrets in the 1888 reckoning | GBP | [B86] p. ~28; [B89] p. 54 | VERIFIED |
| Quick-firing armament of a 5,800-t cruiser | "the cost of the guns alone will be about £16,500" for 5 × 6-in, 6 × 4.7-in, 8 × 12-pdr (12 cwt), 1 × 12-pdr (8 cwt), 3 × 3-pdr, 5 Maxim (Arrogant class, 1895–96) | GBP | [B96] p. ~62 | SINGLE-SOURCE |
| Torpedo gear per ship | £3,100 (_Trafalgar_, tubes, carriages, air gear; torpedoes themselves not included) | GBP | [B89] p. 54 | VERIFIED |
| Propellant cost | 80 rounds of 12-in Mk IX: ~£1,600 with cordite (≈ £20/round) against £4,800 for US nitro-cellulose (£60/charge) | GBP | [B02] p. ~330 | SINGLE-SOURCE |
| Machinery £/ihp, warships | £4.0 (_Powerful_ class, 25,000 ihp); £4.4 (_Sharpshooter_, 4,500 ihp); £5.3 (_Havock_, 3,500 ihp); £7.8 (_Trafalgar_, ~12,000 ihp, 1888 reckoning) | GBP/ihp | derived from [B94], [B89] | ESTIMATE (derived) |
| Torpedo (the weapon) price | not found | — | — | UNVERIFIED |
| 6-in QF, 4.7-in QF, 12-pdr, 3-pdr unit prices | not found | — | — | UNVERIFIED (only the group figure of £16,500 above) |

Reading the ledger: ship cost per ton of normal displacement rose from about £55–£60 (Royal Sovereign/Renown/Nile) to £61 (Majestic)
for battleships; the contract price for _Powerful_ (£31/t) was roughly half the dockyard rate; machinery cost fell from ~£8/ihp
(1888) to £4–£5/ihp (1893–95); armour was £95/ton for compound in the 1880s.

---

## 2. 14-inch Whitehead torpedo and its launching gear (1877–1890)

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| 14-in Whitehead, first model (1876–77) | 18 kn for 600 yd (549 m); guncotton charge 26 lb (≈ 11.8 kg) | kn / yd / lb | [ARM96] ch. 1 ("In 1876 Mr. Whitehead ... diameter of only 14 inches ... 18 knots for 600 yards ... 26 pounds of guncotton") | VERIFIED (agrees with note 1's 26.5 lb from a secondary) |
| 1884 redesign | "more powerful engines ... maximum speed of 24 knots" (+4 kn) and a considerably larger explosive charge | kn | [ARM96] ch. 1 | VERIFIED (primary handbook; charge not quantified there) |
| 1889 new torpedo (18-in, for scale) | 28–29 kn for 1,000 yd, 200 lb guncotton; RGF-made 18-in reached 30 kn | kn / lb | [ARM96] ch. 1 | VERIFIED |
| Original 1868 Austrian trial torpedoes | "normal" 14 ft 1 in × 16 in, 650 lb, 60 lb charge; "small" 11 ft 7 in × 14 in, 346 lb, 40 lb | ft / lb | [SLE] ch. II | VERIFIED |
| First English trial torpedoes (c. 1870) | large 14 ft 0 in × 16 in, 67 lb guncotton; small 13 ft 10½ in (13.875 ft) × 14 in, 18 lb dynamite (also a 18-lb charge) | ft / in / lb | [SLE] ch. II; [ARM96] ch. 1 | VERIFIED (two sources agree) |
| RL Mk II 14-in (made Woolwich 1879–82) | length 14 ft 7 in (4.45 m); mass 575 lb (261 kg); speed 19 kn, range 500 yd; charge 34 lb guncotton | — | [CER] page table | SINGLE-SOURCE (secondary compilation; mass and length plausible against the 14 ft / 13.875 ft 1870 sizes) |
| Fiume Mk IV 14-in (c. 1884) | length 14 ft 9 in (4.50 m); mass 660 lb (299 kg); 23.5 kn; 600 yd (549 m); charge 58 lb guncotton (26 kg) | — | [CER] page table | SINGLE-SOURCE (secondary). A web-search snippet from a second compilation says 52 Mk IV averaged 23.69 kn (22–25.5) over 600 yd with a 70 lb dry-guncotton charge and cites the 1883 Torpedo School Annual Report; the page was behind a 403, so the 58 vs 70 lb charge difference (wet vs dry) is unresolved |
| Mk IX RGF 14-in (acquired 1896) | length 14 ft 11½ in (4.56 m); mass 705 lb (320 kg); 27.5 kn at 1,000 yd; charge 79 lb | — | [CER] | SINGLE-SOURCE (secondary) |
| Air-flask charge | the Mark VIII (18-in era) "weighs over 30 lb" of compressed air vs 63 lb in the 18-in Fiume Mark I; air pressure 300–600 lb/in² in the 14-in types | lb | [ARM96] ch. 3; [SLE] ch. II | VERIFIED |
| Note-1 estimate "3.9–4.6 m, 250–400 kg" for the 14-in | length 14 ft–14 ft 11½ in = **4.27–4.56 m**; mass **261–320 kg** | m / kg | the rows above | resolved (replaces the UNVERIFIED estimate; still SINGLE-SOURCE) |
| Whitehead 1870 propulsion | Sleeman 1889 lists the 14-ft torpedo air reservoir as 5 ft long × 14 in diameter, rated to 100 atm (tested 120 atm) | ft / atm | [SLE] ch. II | VERIFIED |
| Deflection of submerged side-tube launch | torpedo launched from a submerged side tube is deflected up to 7° (RN) vs 15° (French) | degrees | [ARM96] ch. 4 | VERIFIED |
| Number of tube patterns in service by 1896 | 16 patterns of 14-in above-water tubes and 3 patterns of 18-in tubes | count | [ARM96] ch. 4 | VERIFIED |
| Above-water tube mass (carriage / tube) | not found | kg | — | UNVERIFIED (note-1 ESTIMATE 0.8–2.0 t retained) |
| Submerged bow tube mass | not found | kg | — | UNVERIFIED (note-1 ESTIMATE 1.5–3.5 t retained) |
| Impulse charge for above-water tubes | 4 oz and 4½ oz of pebble powder in a cartridge | oz | [ARM96] ch. 4 | VERIFIED |

### 2.1 Torpedoes carried per ship

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| HMS _Bellerophon_ (1885 refit, central-battery ironclad) | 12 × 14-in Whitehead torpedoes, 2 electric search lights | count | [B86] p. 166 | VERIFIED |
| HMS _Royal Sovereign_ (1889) | 7 torpedo tubes, 2 submerged; **18 torpedoes carried** | count | [B91] p. 121 | VERIFIED (design statement) |
| HMS _Royal Arthur_ / _Edgar_ class (1891) | 4 tubes (2 submerged, 2 above water); complement of **18 torpedoes** | count | [B91] p. 133 | VERIFIED (design statement) |
| HMS _Sharpshooter_ class (1888) | 4 torpedo-launching tubes (torpedo count not given) | count | [B89] p. 109 | VERIFIED (tubes only) |
| HMS _Hood_ (1893) | 7 torpedo dischargers | count | [B92] | SINGLE-SOURCE |
| _Medea_ class (1888) | 6 tubes, all under cover | count | [B89] p. 91 | VERIFIED |
| _Havock_ (1893) | tubes and torpedo count not stated in the volumes read (Yarrow 27-kn boats: 1 × 12-pdr, 3 × 6-pdr, 2 tubes is the standard class armament but unsourced here); the French equivalent in [B94] carries 5 tubes | — | — | UNVERIFIED |
| Torpedoes per tube (battleship/cruiser rule of thumb) | 18 ÷ 7 = 2.6 (Royal Sovereign); 18 ÷ 4 = 4.5 (Edgar class) | count | derived | ESTIMATE (≈ 2.5 per tube battleships, 4.5 per tube cruisers) |
| Gun-cotton warhead issue figures | 131 torpedoes made and issued 1886–87 with 126 more by end of FY 1887-88 (RN annual output) | count | [B89] p. 520 | VERIFIED (production, not stock) |

---

## 3. Gun mounts, 6-inch/26 mass and magazine capacities

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| BL 6-in (early, Mk I) mass | **89 cwt (4.45 long tons = 4,521 kg)** — two such guns carried amidships on main deck and two under forecastle in _Bellerophon_ (1885 refit); design target for the _Orlando_ class was "12 × 6-in of 4 tons" | cwt / t | [B86] p. 166 and p. ~57 | VERIFIED (primary) |
| BL 6-in Mk II–VI ("6-in 5-ton") mass | **5 long tons = 5,080 kg**: "10 × 6-in (5-ton)" in _Orlando_ as completed (1886–88); "six 6-inch (5-ton) breech-loading rifle guns" in _Medea_ class | t | [B89] pp. 64, 90 | VERIFIED (two entries) |
| BL 6-in service date | 6-in BL Mk II in service and proof-fired at Shoeburyness by October 1884 (one burst there; an earlier gun burst aboard HMS _Active_); Ordnance Committee reviewed all "new type BL guns" 3 Feb 1885 | year | [B86] p. ~290 | VERIFIED that the gun existed by 1884; first issue year UNVERIFIED (navweaps' "1880s"; use 1883, range 1881–1884) |
| 12-in BL Mk VIII Majestic gun | mass 46 tons ("four 12-in wire guns of 46 tons, two in each barbette; breech and body protected with a steel hood, extreme thickness 10 in in front") | t | [B96] p. 4 (from _The Engineer_) | VERIFIED (agrees with note 1) |
| 12-in Mk VIII full charge and shot | 295 lb powder for the older 12-in BL; **167½ lb cordite** for the new one; 850-lb shell | lb | [B97] p. 5 | VERIFIED — settles note 1's "ESTIMATE 174 lb (range 170–200)": use 167.5 lb = 76.0 kg |
| Majestic-class turret shield armour (Victorious onwards) | 10 in fronts, 6 in sides, 4 in backs, 2 in roofs and floors, mushroomed tops | in | [B96] p. 7 | VERIFIED |
| Mounting plus gun, _Racoon_-class forecastle pair | "the two 6-inch guns, with their mountings, weigh a little over 25(¼?) tons" (OCR reads "254"; gun 5 t each) → ≈ 8 t per shielded central-pivot 6-in mounting; with anchors and cat-davits the forecastle carries over 34 t | t | [B89] p. ~472 (Admiralty committee report on the 1888 manoeuvres) | SINGLE-SOURCE (derived; OCR digit uncertain) |
| 9.2-in high-angle Elswick mounting (1890 trial) | gun and mounting together 54 tons; trained by one man by hand | t | [B00] p. ~340 | SINGLE-SOURCE (special high-angle design; gun ≈ 22 t, mount ≈ 32 t) |
| Shell-handling gear, _Canopus_-type Elswick 12-in mounting | gear for shell room, shell hoists etc. about 54 tons per ship, "or half the weight of the projectiles stowed in the shell rooms" → ≈ 108 t of projectiles; 24 rounds per gun in the working-chamber bins; 3 in the gun house and 8 in the working chamber on the _Mikasa_ design | t / rounds | [B00] pp. 347–348 | VERIFIED (statements) |
| Implied 12-in rounds per gun (derived) | 108 t ÷ 0.379 t (850-lb shell) ≈ 285 projectiles ≈ 71 per gun for 4 guns | rounds | derived from the row above | ESTIMATE (the "shell rooms" may include the 6-in stock; catalogue 70–80) |
| Majestic-class (_Prince George_) ammunition total | **14,120 rounds** for 12-in, 6-in, 12-pdr and 3-pdr guns; service ammunition about 335 tons including cases; with cordite "the number of rounds of important secondary weapons raised to 200 and 300 per gun" (vs 300 t for the main armament alone of _Howe_/_Camperdown_) | rounds / t | [B97] p. 5 (from _The Engineer_) | VERIFIED (primary) |
| _Prince George_ five-minute broadside | 4 × 12-in at 4 rounds per gun (0.8 rds/min); 6 × 6-in at 25 rounds per gun (5 rds/min); 8 × 12-pdr at 50 per gun (10/min); 8 × 3-pdr at 75 per gun (15/min). Check: 16 × 850 = 13,600 lb; 150 × 100 = 15,000 lb; 400 × 12 = 4,800 lb; 600 × 3 = 1,800 lb | rds/min | [B97] p. 5 | VERIFIED (arithmetic closes) |
| Majestic main/secondary armament | 4 × 12-in, 12 × 6-in QF (8 in casemates, 4 in the upper battery), 16 × 12-pdr, 12 × 3-pdr (in the fighting tops) | count | [B96] pp. 3–4 | VERIFIED |
| Royal Sovereign armament | 4 × 13.5-in (630 lb charge, 1,250 lb shell), 10 × 6-in QF, 16 × 6-pdr, 9 × 3-pdr, 8 machine guns, 2 × 9-pdr field guns | count | [B91] p. 121 | VERIFIED |
| Edgar (design) armament | 2 × 9.2-in (26-ton), 10 × 6-in QF, 12 × 12-pdr (Royal Arthur/Crescent: 1 × 9.2-in, 12 × 6-in, 12 × 6-pdr, 5 × 3-pdr, 6 machine guns, 2 × 9-pdr) | count | [B91] p. 133; [B96] (Japanese Edgar-type copy) | VERIFIED |
| Rounds per gun in _Edgar_, _Havock_ | not found | rounds | — | UNVERIFIED (ESTIMATE from the _Prince George_ rule: 200 per 6-in, 300 per 12-pdr; TB-destroyers ~100–200 per 12-pdr/6-pdr) |
| Cordite charges for QF guns (1902 ordnance manual) | 4.7-in Marks I–IV: 5 lb 7 oz (2.47 kg), size 20; 4.7-in Mark V: 7 lb 8 oz; 12-pdr 12-cwt: 1 lb 1½ oz (OCR "lh-oz"; ≈ 0.50 kg), size 15; 12-pdr 8-cwt: 13½ oz (0.38 kg); 6-pdr: 7½ oz (0.21 kg), size 5; 3-pdr: 6⅝ oz (0.19 kg), size 5; 6-in QF reduced charge 5 lb 8 oz (2.5 kg); 4.7-in SP (black) 12 lb (5.4 kg) | oz / lb | [TA02] §§ on QF cartridges (Cartridge, Q.F. entries) | VERIFIED for the cordite figures of 1902 ed. (cordite introduced to QF c. 1894–96; use for 1895–99); black-powder charges for 6-pdr 1884 / 3-pdr 1886 / 12-pdr 1894 still not found |
| Note-1 ESTIMATES replaced | 12-pdr cordite charge ≈ 0.5 kg (note 1 guessed 0.9–1.4 kg); 6-pdr ≈ 0.21 kg (note 1: 0.4–0.6 kg black); 3-pdr ≈ 0.19 kg (note 1: 0.2–0.35 kg) | kg | [TA02] | resolved for cordite-era (1895+); black-powder-era values remain ESTIMATE |

---

## 4. Hull depth, freeboard, bunkers, radius, crews

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| _Royal Sovereign_ class: designed draught | 27 ft 6 in mean, 1 ft by the stern, 900 t coal; completed ship carries 1,100 t at that draught; bunker capacity about 1,100 t plus "wing/reserve bunkers" bringing total coal to **1,460 t** | ft / t | [INA94] pp. 147–148 | VERIFIED (primary, DNC) |
| _Royal Sovereign_ freeboard / gun height | heavy guns carried about 23 ft above water; high freeboard throughout; ("freeboard 17 ft 3 in" from note 1 is the hull freeboard amidships) | ft | [INA94] p. 147; [W] | VERIFIED |
| Draught change per inch | 66 tons per inch immersion at load; 3 ft draught range between deep load and light = nearly 2,000 t | t | [INA94] p. 148 | VERIFIED |
| _Hood_ (turret ship) | heavy guns about 17 ft above water; moderate freeboard at ends | ft | [INA94] p. 147 | VERIFIED |
| _Majestic_ dimensions | 390 ft between perpendiculars (length overall about 430 ft incl. 15 ft ram), beam 75 ft, 14,900 t; **freeboard forward about 23 ft** (extreme, forecastle); speed 17.8 kn at 1,000 fewer ihp than the Royal Sovereign class | ft / t | [B96] p. 3 (from _The Engineer_) | VERIFIED |
| Majestic-type (Japanese copy, for scale) | 390 ft 6 in pp, 73 ft 6 in beam, 27 ft 2 in draught, 15,140 t | ft / t | [B96] p. 56 | VERIFIED (foreign, same design) |
| _Edgar_ class dimensions | _Royal Arthur_: 360 ft pp, 60 ft 8 in beam, mean draught 24 ft 9 in, load displacement 7,700 t. White's trial table: _Edgar_ 360 × 60 ft, trial draught 23 ft 9 in, trial displacement 7,390 t | ft / t | [B91] p. 131; [W] ch. XVII table | VERIFIED |
| _Edgar_ coal and radius | **850 t** normal (design), 10,000 nmi at 10 kn or 2,800 nmi at 18 kn (design claim); engines 10,000 ihp natural / 12,000 forced | t / nmi | [B91] p. 133 | VERIFIED (design claim) — settles note 1's "ESTIMATE 800 t / 1,250 t max" (max not found) |
| _Edgar_ complement | **520** (design) officers and men; Conway's relay 544 as completed | men | [B91] p. 133 | VERIFIED for the 520 design figure |
| _Edgar_ ventilation / lighting | ventilated by natural and artificial means, "lighted electrically throughout", four search lights under cover of the steel deck, boats handled by steam hoists | — | [B91] p. 133 | VERIFIED |
| _Edgar_ trials | 20.97 kn forced (12,000 ihp design 19.75 kn); 19.25 kn natural (design 18.75 kn) | kn | [B92] p. 3 | VERIFIED |
| _Havock_ dimensions | 180 ft × 18 ft 6 in; coal 60 t in bunkers alongside the boilers; design radius 4,000 nmi at 10 kn; complement 42 | ft / t / nmi / men | [B94] p. 14 | VERIFIED (design claim) — settles note 1 (55–60 t; radius 1,200–1,800 nmi ESTIMATE is now contradicted by the printed claim; the claim is optimistic, keep ESTIMATE 1,500–2,000 nmi for a model) |
| _Havock_ speed / ihp | 26.78 kn mean over the measured mile at about 3,500 ihp, steam 165 lb vs 180 lb design; 362 rpm. Yarrow's own discussion remark in INA reads "about 8,600 H.P." which is an OCR/typo for 3,600 (Hornet 4,300 ihp on 8 water-tube boilers weighing 11 t less) | kn / ihp | [B94] p. 14; [INA94] discussion p. 336 | VERIFIED for 3,500 ihp (primary); Yarrow figure flagged OCR |
| _Hornet_ (water-tube sister) boiler data | 8 Yarrow boilers, one boiler complete with water 5 t 7 cwt; 12,500 lb/h evaporation per boiler; 28 kn on trial | t / lb/h | [INA94] disc. p. 336; [B94] p. 14 | VERIFIED |
| _Sharpshooter_/_Speedy_ group | _Sharpshooter_ (735 t, 230 × 27 ft, mean draught 8 ft 3 in) coal 100 t, 2,500 nmi at 10 kn, ≈ 4,500 ihp forced, 21 kn est.; armament 2 × 4.7-in QF (36-lb), 4 × 3-pdr QF, 4 tubes. Brassey's 1894 fleet list carries _Speedy_ at 810 t, 4,500 ihp (contract), twin screw | — | [B89] p. 109; [B94] p. 13 | VERIFIED for _Sharpshooter_; _Speedy_ bunkers UNVERIFIED (ESTIMATE 100–200 t) |
| _Speedy_ trial result | over 4,700 ihp (contract 4,500); first RN ship with Thornycroft water-tube boilers, engines by Thornycroft | ihp | [B94] "Armour-plate" preface; [B96] p. 190 | VERIFIED |
| _Speedy_ class beam and draught (White's table) | 230 ft × 27 ft, trial draught 8 ft 3 in, trial displacement 735 t | ft / t | [W] ch. XVII | VERIFIED |
| _Siegfried_ | 240 ft × 49 ft 3 in, draught 17 ft 9 in, 3,495 t, 4,800 ihp (est.), belt height above waterline 24 ft(?) and 5 ft below, compound armour, 3 × 24 cm, 3 tubes, ten ships to be completed by 1895, cost £175,000 | ft / t | [B90] p. ~116 | VERIFIED (primary; contemporary British description of the German programme) |
| Moulded depth | _Medea_ class (265 ft × 41 ft): "about 24 feet deep" | ft | [B89] p. 90 | VERIFIED for _Medea_ only |
| Moulded depth — Majestic, Royal Sovereign, Edgar, Havock, Siegfried | not found in any volume read | ft | — | UNVERIFIED. Derived ESTIMATE for _Royal Sovereign_: draught 27.5 ft + hull freeboard 17.25 ft = 44.75 ft overall depth (keel included) ≈ 13.6 m; for _Majestic_ 27 ft + ~19 ft ≈ 46 ft ≈ 14 m |
| Coal stowage rule | 1 ton Welsh coal = 40 ft³ (1.13 m³); North Country = 48 ft³ (1.36 m³) | ft³/t | [QR79] art. 1837; [W] gives 47 ft³ | VERIFIED |
| Majestic radius conflict (note 1) | the Edgar-class 10,000 nmi claim (850 t) is 11.8 nmi/t; a Majestic 7,000 nmi claim at 1,900 t is 3.7 nmi/t; Royal Sovereign 4,720 nmi on 1,420 t is 3.3 nmi/t. Design radii are not on a consistent basis | nmi/t | derived | ESTIMATE (use 3.3 nmi/t battleships at 10 kn, 11 nmi/t cruisers, 25 nmi/t _Sharpshooter_, 66 nmi/t _Havock_ claim) |

### 4.1 Complements

| ship | figure | source | confidence |
| --- | --- | --- | --- |
| _Hood_ (1893) | 634 | [B92] p. ~6 | SINGLE-SOURCE |
| _Royal Sovereign_ class | not found in Brassey text (Conway's relay 670–692 in note 1) | — | UNVERIFIED |
| _Majestic_ class | not found (Conway's relay 672–794 in note 1) | — | UNVERIFIED |
| _Edgar_ / _Royal Arthur_ | 520 (design) | [B91] p. 133 | VERIFIED |
| _Medea_ class | ~300 all told | [B89] p. 91 | VERIFIED |
| _Orlando_ class | 350 as designed, 455 as completed (Mar 1886 / Nov 1887) | [B89] p. 64 | VERIFIED |
| _Havock_ | 42 (officers and men) | [B94] p. 14 | VERIFIED (note 1: 43/46) |
| French _Siegfried_-size comparison: German _Siegfried_ class | 276 (Conway's relay in note 1; [B97] p. ~42 gives "Their complement is 276 men" for a 3,600-t German coast ship) | [B97] | SINGLE-SOURCE |

---

## 5. Accommodation, provisions and water per man (RN, 1880–99)

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| Daily water allowance, minimum | **6 pints (3.4 L) per head per day out of the Tropics; 1 gallon (4.55 L) within the Tropics**, "for each individual embarked, including the Crew of the Ship", to suffice for all purposes (distilled or filtered) | pints | [QR79] App. XXVI Table M, "Water" (p. 754) | VERIFIED (primary Admiralty regulation, 1879; applies to troop-ship scale but stated to include the crew) |
| Seaman's full daily allowance (Table M Part I) | Biscuit 1 lb (or soft bread, quantity not legible); spirit ⅛ pint; cocoa/chocolate 1 oz; sugar 1½ oz; fresh meat 1 lb (or salt pork/beef 1 lb alternate days); vegetables ½ lb; weekly allowances of oatmeal, mustard, pepper, vinegar ½ pint, pickles; when fresh provisions unavailable: salt pork or beef 1 lb, split peas ½ pint, compressed vegetables 1 oz, flour and suet on alternate days | lb/oz | [QR79] App. XXVI Table M Part I (OCR table damaged; ounces for sugar/cocoa partly illegible) | SINGLE-SOURCE (primary; OCR-limited) |
| Food mass per man per day | biscuit 0.45 kg + meat 0.45 kg + vegetables 0.23 kg + sugar/cocoa/pulses/condiments ≈ 0.1–0.2 kg ≈ **1.2–1.35 kg/man/day** | kg | derived from the row above | ESTIMATE (derived; supports note 1's 1.1–1.5 kg) |
| Provisions tare | the Orlando weights table treats "Provisions, with tare" as one item inside a ~394 t group with water, tanks, stores, slops, officers and men (1887 as completed, 455 crew): ≈ 0.87 t/man for the whole group | t/man | [B89] p. 64 | SINGLE-SOURCE (derived; includes water, tanks, effects) |
| Coal stowage rule | see §4 (40–48 ft³/t) | | [QR79] | VERIFIED |
| Hammock width / space per man in RN ships | not found (QR 1879 mentions hammocks, clews, nettings but gives no dimensions) | — | — | UNVERIFIED |
| Cubic space per man | not found for RN. Merchant legal minimum 72 ft³ / 12 ft² (note 1); US Navy 1900 data show 39.6 ft³ per kW for a generator space, not accommodation | — | — | UNVERIFIED (note-1 ESTIMATES 2.5 m³ battleship, 1.5 m³ cruiser, 1.0 m³ TB retained) |

---

## 6. Electric lighting, dynamos, fans

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| _Royal Sovereign_ (1889) | lighted throughout with **over 600 electric lamps**; **four electric search lights of 25,000 candle-power**, each worked by dynamos "under protection of armour" | count | [B91] p. 121 | VERIFIED (design statement) |
| HMS _Blake_ (1889) lighting plant | **three Siemens dynamos driven by a Willans engine, each capable of producing a current of 400 amperes**; engine-room cooled by 4 fans of 4 ft 6 in; forced draught by 12 fans of 5 ft 6 in (3 per stokehold); Normandy double distillers 400 gallons of fresh water per hour | A / ft / gal/h | [B92] p. ~113 | VERIFIED. Voltage not printed: at the RN's later standard 80 V each set would be 32 kW (**UNVERIFIED** assumption) |
| _Orlando_ class (1886-87) electric + auxiliary engine weight | "engines for electric lighting, capstan, steering, torpedoes, etc." **15 t as designed → 34 t as completed** (Oct 1886, electric light added), i.e. 0.6 % of 5,535 t; machinery proper 795 t | t | [B89] pp. 64–65 (Parliamentary return table) | VERIFIED |
| _Edgar_ class | lighted electrically throughout; four search lights worked from under the steel deck | — | [B91] p. 133 | VERIFIED |
| Dynamos placed under protective deck | _Medea_ class: "all machinery of vital importance, including steering gear, air compressors and electric dynamos is under the protective deck" | — | [B89] p. 90 | VERIFIED |
| Cross-check, US Navy (not RN) | 2 US cruisers (4,150–4,800 t, 1895): electric plant for 500 incandescent lamps and two search lights; two electric motors drive fans of 20,000 ft³/min aggregate (9.4 m³/s); 8-in/4.7-in armed. _Alabama_ (1900): 256 kW of generator sets in 10,140 ft³ (39.6 ft³ per kW = 1.1 m³/kW), motors would need 3,280 kW | kW / ft³ | [B97] pp. 53–54; [B00] pp. ~110–111 (Adm. Melville) | SINGLE-SOURCE (US; the best numeric anchors for plant volume) |
| Funnel power / forced-draught fans | fan count and sizes (above) but no electrical or steam horsepower | — | — | UNVERIFIED |
| Majestic electric plant size and weight | not found in the volumes read | — | — | UNVERIFIED |

---

## 7. Optical rangefinders (1880–99)

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| Admiralty requirement, 1891 | press advertisement inviting inventors to produce an instrument recording ranges "within 3 % at 3,000 yd" | % / yd | [OS] (EB 1911 "Range-finding") | VERIFIED (1911 reference text; Admiralty requirement) |
| Barr & Stroud FA Mk 1 — competition and adoption | competitive trials April 1892 on HMS _Arethusa_; FA Mk 1 most accurate; contract for an initial six; accepted into RN service 1893 | year | [CAR] slides (secondary; cites trials); [OS] says "competition ... declared in favour of" B&S | SINGLE-SOURCE |
| B&S description | coincidence instrument; two telescopes in a tube of 3 ft (small) to 9 ft (large) length on a pedestal; range scale reads 250 yd to infinity; a man "can take a range in 8–12 seconds"; ranges passed to guns by clockwork transmitter/receiver dials; the full description is in _Proc. Inst. Mech. Engineers_, 30 Jan 1896 (not opened) | ft / s | [OS] | VERIFIED (1911 text) |
| B&S mass | not found | kg | — | UNVERIFIED |
| B&S accuracy formula | range error = (dq × R²)/(B × M × 206,265) yards; effective naval range limit 4,000–5,000 yd for early single-observer instruments | — | [CAR] | SINGLE-SOURCE |
| Watkin Mekometer (army/boat) | "practically a box sextant", two instruments at the ends of a fixed base (50 yd, 100 yd double base for artillery); used by the British Army before the Marindin; a web-search snippet states "accuracy of less than 2 % of 2,000 yd" and 1885 trials without naming the source | yd / % | [OS]; web snippet | SINGLE-SOURCE (base from [OS]; accuracy snippet unattributed) |
| Watkin Position-Finder | a large depression range finder with additional recording appliances; service in coast defence, not afloat | — | [OS] | VERIFIED |
| Fiske range finder (US Navy, 1889–90) | two-station electrical instrument on pillar mounts 92 yd apart on deck, galvanometer scale to 30,000 yd, telephones between observers; fitted USS _Baltimore_ (since Jul 1889) and _Chicago_ (since Nov 1889); "approved by the French and Italian Navies"; the RN had not yet tried it | yd | [B91] pp. 314–316 | VERIFIED |
| Other contemporary devices | Liuzhol (1882), Fiske (1892), Handgerät (1893), Liuzhol–Maikishev (1894); naval fights in the 1890s at 1,000–2,000 yd (RN gun-layer trials 1890s 1,000–1,500 → 1,400–2,000 yd; Fisher Mediterranean 1899–1901 3,000–4,000 yd) | yd | [CAR] | SINGLE-SOURCE |
| Brassey's naval gunnery chapters 1896–1902 | do not discuss rangefinders by name in the OCR | — | — | (gap) |

---

## 8. Stability (metacentric height GM)

| item | figure | unit | source | confidence |
| --- | --- | --- | --- | --- |
| _Royal Sovereign_ class design GM | **aim ≈ 3½ ft at normal load (mean draught 27½ ft, 900 t coal)**; rises to ~3¾ ft with the full 1,460 t of coal because the reserve wing bunkers are low; ~4 ft with the double-bottom reserve feed-water also full; practically unchanged from normal to extreme light | ft | [INA94] pp. 149–150 | VERIFIED (primary) |
| _Royal Sovereign_ inclining | the actual centre of gravity found 0.16 ft (≈ 1⅞ in) **below** the calculated position; _Ramillies_ about 4 in below; _Hood_ also inclined satisfactorily | ft | [INA94] p. 151 | VERIFIED |
| Comparators quoted by White | _Minotaur_ class 4 ft; _Hercules_ 1.9 ft (light) to 2.7 ft (laden); _Devastation_ 2.5 ft to 3.7 ft; smaller ships of good steadiness 2½–3½ ft | ft | [INA94] p. 150 | VERIFIED |
| Unappropriated ("Board margin") weight | designed 500–600 t; 260 t used during construction | t | [INA94] pp. 147, 149 | VERIFIED |
| Majestic GM | not printed; the class was designed with White's same philosophy; ESTIMATE 3.0–3.7 ft | ft | — | UNVERIFIED |
| Protected cruisers (_Edgar_ type) | in modern swift protected cruisers GM commonly "1¾ to 2¼ ft", enough for manoeuvring while favouring steadiness; constant stiffness as coal is burnt | ft | [W] p. 96–97 (class table, protected cruisers of Mersey/Medea/Apollo classes; OCR ordering ambiguous) | SINGLE-SOURCE (class range, not ship-specific) |
| Torpedo gunboats | class GM 2 to 2½ ft ("Sloops and small protected cruisers, torpedo gunboats"), OCR row alignment uncertain | ft | [W] p. 97 | SINGLE-SOURCE |
| 1st-class torpedo boats | 1.38 ft (Danish 137 ft, 110 t), 1.46 ft (French 115 ft, 53 t, range of stability 59°→77° as altered), **1.47 ft (English 130 ft, 93 t, range 77°)**; later types 1½–2 ft; 2nd-class boats 0.4–1.0 ft | ft | [W] p. 97, p. 139 table | VERIFIED (table legible) |
| _Havock_-class destroyers | not found | ft | — | UNVERIFIED (use 1st-class TB values 1.4–1.5 ft as a ceiling) |
| Siegfried | not found; White's class table gives coast-defence ships (_Glatton_-type) 6–8 ft and American monitors about 14 ft, "special classes of armoured ships with limited lengths of water-line protected" larger values | ft | [W] p. 97 | UNVERIFIED (class range only) |
| Sail-era war-ships (context) | 4½–6½ ft fully laden | ft | [W] p. 98 | VERIFIED |

---

## Gaps and confidence (this pass)

| item | status after this pass | what would settle it |
| --- | --- | --- |
| 6-in/26 BL mass | **settled**: 89 cwt (Mk I, 4.45 t) and 5 t (Mk II–VI) from Brassey 1886/1888-9; in service by 1884 | Handbook for the 6-in BL gun (1880s) for exact marks |
| 12"/35 Mk VIII cordite charge | **settled**: 167½ lb (Brassey 1897 quoting _The Engineer_); muzzle velocity still conflicting | Treatise on Ammunition 1900 (not found as text) |
| 14-in Whitehead mass and length | resolved to 261–320 kg and 4.27–4.56 m (secondary table); charge 26 lb (1877) → 34 lb (RL Mk II) → 58–70 lb (Mk IV) | RN Torpedo Manual 1884–89 |
| Torpedoes carried per ship | partly settled (RS 18/7 tubes; Edgar 18/4; Bellerophon 12) | Brassey 1894 Part II ship tables (scrambled OCR) |
| Tube/carriage masses | still UNVERIFIED | HMS _Vernon_ drill books; Whitehead catalogue |
| Mount masses (barbette, turret, shield) | still UNVERIFIED except two anecdotal figures (6-in pair 25¼ t; 9.2-in HA gun + mount 54 t) | Elswick catalogue; Trans. INA papers on mountings (Vickers/Watts) |
| Magazine capacities | partly: _Prince George_ 14,120 rounds, 335 t; secondaries 200–300 rounds/gun | Admiralty Particulars of Ships; Jane's 1898 |
| Costs: hull, machinery, guns | settled to within ~10 % for battleships and Havock; Edgar/Speedy/torpedo price/QF-gun unit prices UNVERIFIED | Brassey 1895/1896 Navy Estimates programme tables; Navy Estimates Blue Books |
| Armour £/t (steel/Harvey/Krupp, British) | UNVERIFIED | Brassey 1893–1896 armour chapter; Parliamentary Return of ship costs |
| Moulded depth (all five), GM for Majestic/Edgar/Havock/Siegfried | UNVERIFIED | Admiralty ship books; Trans. INA vol. 35–40 inclining tables |
| Accommodation m³/man and hammock width | UNVERIFIED | Admiralty Committee on ship ventilation 1880s; Navy Health reports |
| Electric plant for Majestic/Edgar | UNVERIFIED (Royal Sovereign lamps/searchlights; Blake 3 × 400 A) | _Engineering_ 1895 articles; Trans. INA vol. 38–40 on electric lighting |
| Rangefinder mass | UNVERIFIED | Barr & Stroud 1896 Proc. IMechE paper |

---

## Suggested catalogue values (derived — not source figures)

Units: kg, mm, litres, kW, GBP; integers. **All values are DERIVED from the rows above** by the conversions shown; confidence follows
the weakest input. Replace the matching `PLACEHOLDER` rows only when the label is VERIFIED or SINGLE-SOURCE; keep ESTIMATE rows
marked as such.

### Weapons and ammunition

| catalogue item | value | derivation | conf. |
| --- | --- | --- | --- |
| BL 6"/26 early (Mk I) gun mass | 4,521 kg | 89 cwt = 4.45 long tons × 1,016.05 | VERIFIED |
| BL 6"/26 (Mk II–VI) gun mass | 5,080 kg | 5.0 long tons × 1,016.05 | VERIFIED |
| BL 6"/26 in-service year | 1883 | proof-fired by Oct 1884; earlier Mk I | ESTIMATE (≤ 1884 VERIFIED) |
| BL 12"/35 Mk VIII charge | 76 kg | 167.5 lb × 0.4536 = 75.98 | VERIFIED |
| 12"/35 Mk VIII shell | 386 kg | 850 lb × 0.4536 | VERIFIED |
| 12"/35 rate of fire | 1 round / 75 s (0.8 rds/min) | 4 rounds per gun in 5 min | VERIFIED |
| 6"/40 QF sustained fire | 5 rds/min | 25 rounds per gun in 5 min | VERIFIED |
| 12-pdr QF sustained fire | 10 rds/min | 50 rounds per gun in 5 min | VERIFIED |
| 3-pdr QF sustained fire | 15 rds/min | 75 rounds per gun in 5 min | VERIFIED |
| QF 4.7" cordite charge (Mk I–IV) | 2.47 kg | 5 lb 7 oz = 5.4375 lb × 0.4536 | VERIFIED (1902 manual) |
| QF 12-pdr 12-cwt cordite charge | 500 g | 1 lb 1½ oz = 17.5 oz × 28.35 | VERIFIED (OCR digit "1½" uncertain) |
| QF 12-pdr 8-cwt cordite charge | 380 g | 13½ oz × 28.35 | VERIFIED |
| QF 6-pdr cordite charge | 213 g | 7½ oz × 28.35 | VERIFIED |
| QF 3-pdr cordite charge | 188 g | 6⅝ oz × 28.35 | VERIFIED |
| Majestic ammunition (all calibres) | 14,120 rounds; 340,000 kg incl. cases | 335 long tons × 1,016.05 | VERIFIED |
| Majestic 12" rounds per gun | 75 | 108 t projectiles ÷ 0.385 t per 850-lb shell ÷ 4 guns | ESTIMATE |
| Secondary QF rounds per gun | 200 (6") / 300 (12-pdr) | Brassey 1897 | VERIFIED |
| 14" Whitehead torpedo mass | 300 kg | 660 lb × 0.4536 (Mk IV c. 1884) | SINGLE-SOURCE |
| 14" Whitehead length | 4,500 mm | 14 ft 9 in × 304.8 | SINGLE-SOURCE |
| 14" Whitehead warhead | 26 kg (1884 Mk IV, 58 lb) / 12 kg (1877, 26 lb) | lb × 0.4536 | SINGLE-SOURCE (1877 VERIFIED) |
| 14" Whitehead speed / range | 12 m/s (24 kn) / 549 m (600 yd); 1877 model 9.3 m/s / 549 m | 23.5 kn × 0.5144; 600 yd × 0.9144 | VERIFIED (kn/yd); mass SINGLE-SOURCE |
| Torpedoes carried | 18 (battleship, 7 tubes); 18 (cruiser, 4 tubes); 12 (central-battery ironclad) | Brassey 1891, 1886 | VERIFIED |
| Torpedo gear (tubes) | GBP 3,100 per ship | _Trafalgar_ | VERIFIED |
| Gun mount + 6" pair | 25,700 kg | 25.25 long tons × 1,016.05 (OCR uncertain) | SINGLE-SOURCE |
| 6" shielded mount (excl. gun) | 8,000 kg | (25.25 − 2 × 5) ÷ 2 = 7.6 t, rounded | ESTIMATE |
| 12" turret / barbette mount | PLACEHOLDER retained | no source | UNVERIFIED |

### Cost (GBP, per catalogue unit)

| catalogue item | value | derivation | conf. |
| --- | --- | --- | --- |
| Battleship hull + fittings, 1888 reckoning | 57.5 GBP per ton displacement | £686,000 / 11,940 t | VERIFIED input, ESTIMATE ratio |
| Battleship total ex guns, 1895–97 | 61 GBP per ton displacement (Majestic) / 57 (Renown) / 54 (Royal Sovereign) | Brassey 1894/1897 | VERIFIED/SINGLE |
| Hull cost per ton of hull weight | 48 → 80 GBP | 1873 to 1885 | VERIFIED |
| Machinery cost | 8 GBP per ihp (1888) → 4.5 GBP per ihp (1893–95); equivalent 6.0 → 3.4 GBP per kW (÷ 0.7457) | Trafalgar, Havock, Powerful | ESTIMATE |
| Heavy guns | 200 GBP per ton (long ton) = 0.197 GBP/kg | Commons 1888, Nile arithmetic | VERIFIED |
| Hydraulic gun mountings (4-gun ship) | 46,000–75,000 GBP | Trafalgar / Collingwood | VERIFIED |
| Compound armour | 95 GBP per ton | Colossus / Collingwood | VERIFIED |
| Steel/Harvey/Krupp armour | 100–120 GBP per ton (US-derived: $539 × 0.2055 = £110.7) | US 1887 contract | ESTIMATE (secondary) |
| Torpedo gunboat (Sharpshooter) | 90,000 GBP hull + 19,810 GBP machinery | ESTIMATE | ESTIMATE |
| Destroyer (Havock) | 34,000 GBP (total) of which machinery 18,674 | Brassey 1894 | VERIFIED |
| 12" cordite round | 20 GBP | £1,600 ÷ 80 | SINGLE-SOURCE |
| Dockyard labour | 34 GBP per ton armoured, 41 GBP per ton unarmoured (1885) | Brassey 1886 | VERIFIED |

### Hulls, bunkers, crews

| catalogue item | value | derivation | conf. |
| --- | --- | --- | --- |
| Royal Sovereign bunkers | 914,000 kg normal (900 t); 1,118,000 kg capacity (1,100 t); 1,483,000 kg full (1,460 t) | × 1,016.05 | VERIFIED |
| Edgar-class bunkers | 864,000 kg normal (850 t) | × 1,016.05 | VERIFIED (design) |
| Havock bunkers | 61,000 kg (60 t) | × 1,016.05 | VERIFIED |
| Sharpshooter bunkers | 102,000 kg (100 t) | × 1,016.05 | VERIFIED |
| Siegfried-type bunkers | 223,000 kg (220 t, note 1) | | SINGLE-SOURCE |
| Bunker volume | 1.13 m³ per tonne (Welsh) | 40 ft³ × 0.02832 | VERIFIED |
| Radius at 10 kn | 4,720 nmi (RS, note 1); 10,000 nmi (Edgar claim); 2,500 nmi (Sharpshooter); 4,000 nmi (Havock claim; use 1,500–2,000) | | VERIFIED claims |
| Crew | Edgar 520; Orlando 455 / Medea 300; Havock 42; Hood 634 | | VERIFIED |
| Freeboard / gun height | Majestic fore deck 23 ft = 7,010 mm; RS guns 23 ft = 7,010 mm; Hood guns 17 ft = 5,180 mm | ft × 304.8 | VERIFIED |
| Edgar trial draught | 23.75 ft = 7,240 mm; load draught 24.75 ft = 7,540 mm | ft × 304.8 | VERIFIED |
| Moulded depth | RS 13,600 mm; Majestic 14,000 mm (derived); Medea 7,300 mm | 44.75 ft; 46 ft; 24 ft | ESTIMATE / VERIFIED (Medea) |
| Provisions | 1.3 kg per man-day (food), 4.5 L water (tropics), 3.4 L (temperate), 90-day store = 117 kg | QR 1879 | ESTIMATE (water VERIFIED) |
| Water | 3.4 L temperate, 4.5 L tropical per man per day | 6 pints × 0.5683; 1 gal × 4.546 | VERIFIED |
| Electric lighting + auxiliary engines | 34,000 kg for a 5,500-t cruiser (0.6 % displacement) | Orlando table | VERIFIED |
| Dynamo set | 3 sets (Blake); 32 kW each only if 80 V | 400 A × 80 V | UNVERIFIED |
| Search lights | 4 × 25,000 cp; lamps > 600 (Royal Sovereign) | | VERIFIED |

### Stability and rangefinders

| catalogue item | value | derivation | conf. |
| --- | --- | --- | --- |
| Battleship GM (Royal Sovereign) | 1,070 mm (design); 1,140 mm full coal; 1,220 mm full coal + feed water | 3.5 / 3.75 / 4.0 ft × 304.8 | VERIFIED |
| Protected cruiser GM | 530–690 mm | 1¾–2¼ ft | SINGLE-SOURCE |
| Torpedo gunboat GM | 610–760 mm | 2–2½ ft | SINGLE-SOURCE |
| 1st-class torpedo boat GM | 420–450 mm (1.38–1.47 ft) | | VERIFIED |
| Rangefinder introduction | 1893 (Barr & Stroud FA Mk 1, 3 % at 3,000 yd = 2,743 m) | | SINGLE-SOURCE |
| Rangefinder mass | PLACEHOLDER retained | | UNVERIFIED |

---

## Remaining gaps

Still UNVERIFIED after this pass: Edgar construction cost (only a Wikipedia-relayed Brassey 1895 figure); Speedy cost; steel/Harvey/Krupp armour
price per ton (British); price of a Whitehead torpedo; unit prices of the 6-in/4.7-in/12-pdr/3-pdr QF guns; tube and carriage masses
(above-water and submerged); barbette/turret/shield masses (12-in, 10-in, 9.2-in); rounds per gun for Edgar and Havock and 12-in rounds
per gun for Majestic (only derived 70–80); moulded depth of Majestic, Royal Sovereign, Edgar, Havock, Siegfried; GM of Majestic, Edgar,
Havock-class destroyers and Siegfried; complements of Royal Sovereign and Majestic; accommodation volume per man and hammock width;
Majestic/Edgar dynamo size and weight, fan power; rangefinder mass; Mekometer accuracy (unattributed snippet only); black-powder QF
charges for 1884–94; the Havock torpedo and tube fit.

Contradictions to carry forward: Havock's printed 4,000 nmi radius at 10 kn vs the physical estimate; Edgar cruiser coal 850 t (design)
vs note 1 estimates; Mk IV 14-in charge 58 lb (compilation) vs 70 lb (snippet); Yarrow's discussion remark "8,600 H.P." (OCR/typo for
3,600) vs Brassey's 3,500 ihp.

## Source list

1. Brassey, _The Naval Annual_ 1886, 1888–9, 1890, 1891, 1892, 1894, 1896, 1897, 1898, 1900, 1902 (archive.org ids in the tag table).
2. W. H. White, "The Qualities and Performances of Recent First-Class Battle-ships", _Trans. Inst. Naval Architects_ 35 (1894) — `transactionsroy02unkngoog` (also the Thornycroft/Milton/Yarrow discussion on water-tube boilers, pp. 100–106, 336).
3. W. H. White, _A Manual of Naval Architecture_ (1894) — `manualofnavalarc00whitrich`.
4. _Queen's Regulations and Admiralty Instructions_ (1879) — `royal-navy-regs-1879`.
5. _Treatise on Ammunition_ (1902) — `TreatiseOnAmmunition1902`.
6. G. E. Armstrong, _Torpedoes and Torpedo-Vessels_ (1896) — `torpedoesandtor00armsgoog`; C. W. Sleeman, _Torpedoes and Torpedo Warfare_ — `torpedoesandtor00sleegoog`.
7. Ordnance Society Research Guide VI, "Range finding" (EB 1911 text), ordnancesociety.org.uk.
8. C. P. Carlson, "Development of Optical Rangefinders", Admiralty Trilogy Fall-In seminar 2024 (admiraltytrilogy.com PDF).
9. cerberus.com.au/torpedoes.html (RN 14-in torpedo table; secondary).
10. Leads only (not sources): Wikipedia article on the Edgar class (Brassey 1895/1905/1906 costs); web-search summaries of the US _History of the Manufacture of Armor Plate_ price figures; a web-search snippet on the Dreadnought Project 14-in Mark IV page (403).
