# Research: Content 1 — 1880 Capital Fleets & Ship Classes

Factual grounding for the Bluewave `scen_1880` (Jan 1880) production pack's starting fleets and
design templates. Every historical figure below is taken from the cited Wikipedia article(s) /
standard naval reference (Conway's All the World's Fighting Ships 1860–1905, Parkes's _British
Battleships_). **Game-runtime numbers (firepower/armor/hitPoints) are OUR abstractions of the real
spec** and are marked as such; the "real spec" column is the historical figure to derive from.

## Conventions & abstraction mapping

The ship schema is `{ id, name, classId, hitPoints, maxHitPoints, speed(knots→int), firepower,
armor, isUnderConstruction, constructionProgress, constructionTotalWork }`. The design template
schema is `{ designId, nationId, className, hullType, displacementKg, speedUms, armorBeltUm,
mainGuns:{caliber,count,mounts}, machineryType, hitPoints, crewComplement, designFamilyId }`.

We propose these deterministic translations from the real specs (validate with the runtime owner):

- `speed` (int knots) = rounded real trial speed in knots.
- `speedUms` (m/s) = real knots × 0.514444 (e.g. 15 kn → 7.7 m/s).
- `displacementKg` = real displacement × 1,000 (metric) or × 1,016 (long tons); rounded.
- `armorBeltUm` = belt thickness in **mm** at its thickest section (inch × 25.4). Field name treated
  as "belt (in mm)" — confirm unit with the schema owner; we author mm.
- `armor` (ship abstraction) ≈ belt mm mapped to a game scale (e.g. mm / 10 → 0–60 points),
  representing the best-protected citadel.
- `firepower` ≈ total main-battery throw weight / broadside (caliber × shells) mapped to a game
  scale; used for balance only, real spec recorded below.
- `hitPoints` ≈ abstraction of displacement + armor; we peer it to the same scale as `armor`
  (e.g. ≈/2× armor scaled). **Balance value only.**
- `machineryType`: `STEAM_RECIP` (single/compound), `STEAM_COMPOUND`, `STEAM_TRIPLE`. 1880 world is
  entirely steam (some ships still carried auxiliary sail).

**Where a ship was not yet complete on 1 Jan 1880** it is listed with `isUnderConstruction` and is
primarily useful as a _design template_ for the player to finish building. Exceptions noted.

---

## 1. Royal Navy (Great Britain) — ironclad/battleship fleet ~1880

UK fielded by far the largest ironclad fleet (broadside, central-battery, and turret ships). The
following are the most signficant capital ships relevant as of Jan 1880.

| Ship / Class                                        | Type                              | Displacement (real)         | Main armament (real)                     | Belt (real)                   | Speed (real)             | Crew    | 1880 status                                |
| --------------------------------------------------- | --------------------------------- | --------------------------- | ---------------------------------------- | ----------------------------- | ------------------------ | ------- | ------------------------------------------ |
| HMS _Inflexible_                                    | turret ironclad                   | 10,880 t (11,880 full)      | 4×16 in (406 mm) RML, 2 twin turrets     | 24 in (610 mm), 20-in citadel | 14.7 kn                  | 440–470 | **under construction** (commissioned 1881) |
| HMS _Dreadnought_ (1875)                            | turret ironclad                   | 10,886 long tons            | 4×12.5 in (318 mm) RML, 2 twin turrets   | 14–8 in (356–203 mm)          | 14.0–14.5 kn             | 369     | in service (completed Feb 1879)            |
| HMS _Devastation_ / _Thunderer_ (Devastation class) | turret ship                       | 9,330–9,480 t (13,000 full) | 4×12 in (305 mm) RML, 2 twin turrets     | 10–12 in (250–300 mm)         | 13.8 kn                  | 329–410 | in service                                 |
| HMS _Alexandra_                                     | central-battery ironclad          | 9,490 t                     | 2×11 in (280 mm) + 10×10 in (254 mm) RML | 12–6 in (300–150 mm)          | 15.0 kn (fastest afloat) | 674     | in service (comm. 1877)                    |
| HMS _Temeraire_ (1876)                              | central-battery/barbette ironclad | ~8,540 t                    | 4×11 in (280 mm) + 4×10 in (254 mm) RML  | 11 in (280 mm)                | ~14.5 kn                 | ~450    | in service (comm. 1877)                    |

Notes: Inflexible was _the_ counter to the Italian 100-ton-gun ships and carried the thickest belt
ever fitted to an RN ship; it is the obvious "top-of-line" 1880 hull and a strong design template.
Devastation/Warrior-to-Dreadnought context: Parkes 1990.

**Sources:** HMS Inflexible (1876); HMS Devastation (1871) / Devastation-class ironclad; HMS
Dreadnought (1875); HMS Alexandra; HMS Temeraire (1876); Conway's (Roberts 1979); Parkes 1990.

---

## 2. French Navy — flotte d'escadre ironclads ~1880

| Ship / Class                                  | Type                           | Displacement (real)  | Main armament (real)               | Belt (real)              | Speed (real) | Crew    | 1880 status                              |
| --------------------------------------------- | ------------------------------ | -------------------- | ---------------------------------- | ------------------------ | ------------ | ------- | ---------------------------------------- |
| _Redoutable_                                  | central-battery + barbette     | 8,858 t (9,430 full) | 8×274 mm (10.8 in)                 | 350–220 mm (13.8–8.7 in) | 14.7 kn      | 709     | in service (comm. Dec 1878)              |
| _Dévastation_ / _Courbet_ (Dévastation class) | central-battery + barbette     | ~10,450 t            | 4×340 mm (13.4 in) + 4×274 mm      | ~300–380 mm              | ~15 kn       | ~700    | under construction (based on Redoutable) |
| _Amiral Duperré_                              | barbette ship (first FR class) | 11,200 t (11,210)    | 4×340 mm (13.4 in), open barbettes | 559–254 mm (22–10 in)    | 14.3 kn      | 660–712 | **under construction** (comm. 1883)      |

Notes: Redoutable was the first major warship built of steel; Amiral Duperré (the counter to the
Italian _Duilio_/Italia) introduced all-guns-in-barbettes. Dévastation/Courbet figures are
approximate (ted to Redoutable lineage); Redoutable itself closest to reality for balance.

**Sources:** French ironclad Redoutable; French ironclad Amiral Duperré; Dévastation-class ironclad
(France); Conway's (Campbell 1979); Ropp.

---

## 3. German (Imperial) Navy ~1880

Small, coastal-defence-oriented fleet.

| Ship / Class                                                                     | Type                           | Displacement (real)        | Main armament (real)              | Belt (real)          | Speed (real) | Crew | 1880 status                    |
| -------------------------------------------------------------------------------- | ------------------------------ | -------------------------- | --------------------------------- | -------------------- | ------------ | ---- | ------------------------------ |
| SMS _Kaiser_ / _Deutschland_ (Kaiser class)                                      | central-battery ironclad       | 7,645 t (8,940 full)       | 8×26.3 cm (10.4 in) L/20          | 254–127 mm (10–5 in) | 14 kn        | ~600 | in service (comm. 1875)        |
| SMS _Sachsen_, _Bayern_, _Württemberg_, _Baden_ (Sachsen class)                  | armored corvette / sortie ship | 7,635 t (7,742–7,938 full) | 6×26 cm (10.2 in) L/22            | 254–203 mm (10–8 in) | 13 kn        | 317  | entering service 1878–83       |
| _Preussen_, _Friedrich der Grosse_, (Großer Kurfürst lost 1878) (Preussen class) | coastal turret ironclad        | ~6,821 t                   | 4×26 cm (10.2 in), 2 twin turrets | ~225 mm              | ~14 kn       | ~270 | in service (two of three left) |

Notes: Sachsen (1878) and Kaiser (1875) are the "current" German fleet in Jan 1880; Baden completes
1883, so Sachsen-class provides a natural design template for Germany.

**Sources:** Kaiser-class ironclad; Sachsen-class ironclad; Preussen-class ironclad; Conway's (Lyon
1979); Gröner 1990; Dodson 2016.

---

## 4. Russian Navy ~1880

| Ship / Class                                  | Type                   | Displacement (real)         | Main armament (real)             | Belt (real)          | Speed (real)                               | Crew | 1880 status                                                |
| --------------------------------------------- | ---------------------- | --------------------------- | -------------------------------- | -------------------- | ------------------------------------------ | ---- | ---------------------------------------------------------- |
| _Petr Veliky_                                 | turret ironclad        | 10,406 long tons (10,573 t) | 4×12 in (305 mm), 2 twin turrets | 356–203 mm (14–8 in) | 13 kn (11.8 trials; 14.4 after 1881 refit) | 441  | in service; defective engines until 1881                   |
| _Ekaterina II_ / _Sinop_ (Ekaterina II class) | turret ship, Black Sea | ~9,866 t / ~10,250 full     | 6×305 mm (12 in), 2 twin turrets | ~305 mm (12 in)      | ~14 kn                                     | ~600 | **not yet laid down (designed 1880-83)** → design template |
| _Chesma_ (Ekaterina II class, 3rd)            | turret ship            | ~9,866 t                    | 6×305 mm                         | ~305 mm              | ~14 kn                                     | ~600 | design template                                            |

Notes: Petr Veliky was Russia's one modern sea-going turret ship in 1880; the Ekaterina II class was
authorized in the early 1880s, so they are ideal **future-construction design templates** (Russia's
1880 fleet was otherwise obsolete broadside ironclads/monitors).

**Sources:** Russian ironclad Petr Veliky; Ekaterina II-class ironclad; Conway's (Campbell 1979);
McLaughlin 2003.

---

## 5. Austro-Hungarian Navy ~1880

| Ship / Class     | Type                                | Displacement (real)   | Main armament (real)              | Belt (real)          | Speed (real) | Crew | 1880 status                             |
| ---------------- | ----------------------------------- | --------------------- | --------------------------------- | -------------------- | ------------ | ---- | --------------------------------------- |
| SMS _Tegetthoff_ | central-battery (casemate) ironclad | 7,390–7,431 long tons | 6×280 mm (11 in) Krupp BL         | 356–230 mm (14–9 in) | 14 kn        | 525  | **under construction** (completed 1881) |
| SMS _Custoza_    | central-battery ironclad            | ~7,080 t              | 8×9 in (229 mm) + 6×8 in (203 mm) | ~10 in (254 mm)      | ~13.9 kn     | ~540 | in service (comm. 1875)                 |

Notes: Tegetthoff is the late-1870s AH modern capital ship (all-steel hull, single deck central
battery). Custoza is the oldest of the casemate ships still worth fielding. AH's other ironclads
(Erzherzog Albrecht, Kaiser Max class, Lissa) are older/decayed.

**Sources:** SMS Tegetthoff (1878); SMS Custoza; Conway's (Sieche & Bilzer 1979); Sondhaus 1994.

---

## 6. Italian Navy (Regia Marina) ~1880

| Ship / Class                                    | Type                                    | Displacement (real)            | Main armament (real)                 | Belt (real)                             | Speed (real) | Crew       | 1880 status                                                   |
| ----------------------------------------------- | --------------------------------------- | ------------------------------ | ------------------------------------ | --------------------------------------- | ------------ | ---------- | ------------------------------------------------------------- |
| _Caio Duilio_ / _Enrico Dandolo_ (Duilio class) | turret ironclad                         | 10,962 t (12,071 full)         | 4×450 mm (17.7 in) 100-ton Armstrong | 546 mm (21.5 in) steel                  | 15.0 kn      | 420 (→515) | Duilio completed Jan 1880; Dandolo still building             |
| _Italia_ / _Lepanto_ (Italia class)             | barbette ironclad (proto-battlecruiser) | 13,678 t (13,897; 15,407 full) | 4×432 mm (17 in) BL                  | none (deck 76–102 mm, barbettes 480 mm) | 17.5–18.4 kn | ~756       | **under construction** (Italia launched 1880; completed 1885) |

Notes: Italy had the most advanced/larger-gun ironclads of 1880. Duilio (completed Jan 1880) is the
"current" state-of-the-art ship; Italia/Lepanto are long-lead design templates (very fast, no belt).

**Sources:** Italian ironclad Duilio; Duilio-class ironclad; Italia-class ironclad; Conway's
(Gardiner 1979).

---

## 7. US Navy 1880 (weak: monitors + old)

US was in a post-war decline; only a handful of obsolete Civil-War-era monitors and the very slow,
decades-long Amphitrite/Puritan double-turret monitors (laid down 1874–76, still fitting/finishing
through the 1880s).

| Ship / Class                                       | Type                    | Displacement (real) | Main armament (real)                        | Belt (real)             | Speed (real) | Crew     | 1880 status                                                          |
| -------------------------------------------------- | ----------------------- | ------------------- | ------------------------------------------- | ----------------------- | ------------ | -------- | -------------------------------------------------------------------- |
| _Puritan_                                          | double-turreted monitor | ~6,100 t (designed) | 4×12 in (305 mm) or 4×10 in, 2 twin turrets | 14 in (356 mm, turrets) | ~12 kn       | ~160     | laid down 1874, completed 1896 (archetype for a very slow "big gun") |
| _Amphitrite_ class (Amphitrite, Monadnock, Terror) | double-turreted monitor | ~3,990 t            | 4×10 in (254 mm), 2 twin turrets            | ~9–4 in (229–102 mm)    | ~12 kn       | ~150–200 | laid down 1874–76; completed 1890s → design template                 |
| Civil-War monitors (Passaic / Canonicus classes)   | monitors                | ~1,875–2,100 t      | 1–2×15 in (381 mm) or 11 in                 | 11–5 in                 | ~7–9 kn      | ~100     | in reserve/obsolete                                                  |

Notes: For 1880 the US "capital" presence is essentially zero viable sea-going battleships. The
Amphitrite/Puritan monitors are realistic **design templates** (cheap, slow, heavy-gunned coastal
units) and reflect US doctrine until the 1883 "ABCD" ships.

**Sources:** Amphitrite-class monitor; USS Puritan (BB-1); Passaic-class monitor / Canonicus-class
monitor; Conway's (Roberts 1979).

---

## 8. Japanese (Meiji) Navy 1880 (tiny)

| Ship / Class     | Type                    | Displacement (real) | Main armament (real)                   | Belt (real)          | Speed (real) | Crew | 1880 status             |
| ---------------- | ----------------------- | ------------------- | -------------------------------------- | -------------------- | ------------ | ---- | ----------------------- |
| _Fusō_           | small casemate ironclad | ~3,717 t            | 4×240 mm (9.45 in) + 2×170 mm (6.7 in) | ~230–100 mm (9–4 in) | ~13 kn       | ~386 | in service (comm. 1878) |
| _Kongō_ / _Hiei_ | armored corvettes       | ~2,248 t            | 3×170 mm (6.7 in)                      | ~110 mm (4.3 in)     | ~13 kn       | ~300 | in service (1878–79)    |

Notes: Japan's 1880 navy was minuscule — Fusō was its only true ironclad; the mail-protected
Kongō/Hiei corvettes round out the "capital" set. Good as a small starting set + design template.

**Sources:** Japanese ironclad Fusō; Japanese ironclad Kongō; Japanese ironclad Hiei; Conway's.

---

## 9. Ottoman, Spanish, Chinese (Beiyang) — smaller sets

| Navy            | Ship / Class                                                          | Notes                                                                                                                      |
| --------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Ottoman         | _Mesudiye_ (central battery, 1874, ~9,120 t, ~12 heavy guns, ~13 kn)  | The Ottoman flagship capital ship in 1880; several older central-battery ironclads linger.                                 |
| China (Beiyang) | _Dingyuan_ / _Zhenyuan_ (Dingyuan class, ordered 1880 from AG Vulcan) | ~7,220 t, 4×305 mm (12 in) in 2 twin turrets, belt ~355 mm, ~15.4 kn — **under construction 1880**, ideal design template. |
| Spain           | _Vitoria_, _Numancia_, _Zaragoza_, _Arapiles_                         | Old broadside/central-battery ironclads from the 1860s-70s; obsolescent but present.                                       |

**Sources:** Ottoman ironclad Mesudiye; Dingyuan-class ironclad; Spanish ironclad Vitoria; Spanish
ironclad Numancia; Conway's (various national chapters).

---

## Recommended design templates for construction (schema fields)

`machineryType` = `STEAM_SIMPLE` | `STEAM_COMPOUND` | `STEAM_TRIPLE`. `hullType` = `TURRET` |
`CENTRAL_BATTERY` | `BARBETTE` | `COASTAL_DEFENSE` | `MONITOR`. `armorBeltUm` authored in mm.
`speedUms` computed from knots. `hitPoints`/`firepower`/`armor` are **balance abstractions** (see
mapping at top) — tune during design review.

| designId              | nationId | className          | hullType        | displacementKg | speedUms | armorBeltUm             | mainGuns (caliber, count) | machineryType  | hitPoints* | crewComplement |
| --------------------- | -------- | ------------------ | --------------- | -------------- | -------- | ----------------------- | ------------------------- | -------------- | ---------- | -------------- |
| des_uk_inflexible     | UK       | Inflexible         | TURRET          | 11,000,000     | 7.6      | 610                     | 406, 4                    | STEAM_COMPOUND | 60         | 460            |
| des_uk_dreadnought75  | UK       | Dreadnought (1875) | TURRET          | 11,060,000     | 7.2      | 356                     | 318, 4                    | STEAM_COMPOUND | 44         | 370            |
| des_uk_devastation    | UK       | Devastation        | TURRET          | 9,400,000      | 7.1      | 300                     | 305, 4                    | STEAM_SIMPLE   | 38         | 400            |
| des_uk_alexandra      | UK       | Alexandra          | CENTRAL_BATTERY | 9,500,000      | 7.7      | 305                     | 280, 2 (+254×10)          | STEAM_COMPOUND | 38         | 670            |
| des_fr_redoutable     | FR       | Redoutable         | CENTRAL_BATTERY | 8,860,000      | 7.5      | 350                     | 274, 8                    | STEAM_COMPOUND | 40         | 710            |
| des_fr_amiral_duperre | FR       | Amiral Duperré     | BARBETTE        | 11,200,000     | 7.4      | 559                     | 340, 4                    | STEAM_COMPOUND | 46         | 700            |
| des_de_kaiser         | DE       | Kaiser             | CENTRAL_BATTERY | 7,650,000      | 7.2      | 254                     | 263, 8                    | STEAM_SIMPLE   | 36         | 600            |
| des_de_sachsen        | DE       | Sachsen            | COASTAL_DEFENSE | 7,640,000      | 6.7      | 254                     | 260, 6                    | STEAM_SIMPLE   | 34         | 320            |
| des_de_preussen       | DE       | Preussen           | TURRET          | 6,820,000      | 7.0      | 225                     | 260, 4                    | STEAM_SIMPLE   | 30         | 270            |
| des_ru_petrveliky     | RU       | Petr Veliky        | TURRET          | 10,570,000     | 6.7      | 356                     | 305, 4                    | STEAM_SIMPLE   | 42         | 440            |
| des_ru_ekaterinall    | RU       | Ekaterina II       | TURRET          | 10,000,000     | 7.2      | 305                     | 305, 6                    | STEAM_COMPOUND | 44         | 600            |
| des_ah_tegetthoff     | AH       | Tegetthoff         | CENTRAL_BATTERY | 7,510,000      | 7.2      | 356                     | 280, 6                    | STEAM_COMPOUND | 36         | 525            |
| des_it_duilio         | IT       | Duilio             | TURRET          | 11,140,000     | 7.7      | 546                     | 450, 4                    | STEAM_COMPOUND | 52         | 480            |
| des_it_italia         | IT       | Italia             | BARBETTE        | 13,900,000     | 9.0      | 480 (barbette; no belt) | 432, 4                    | STEAM_COMPOUND | 44         | 760            |
| des_us_amphitrite     | US       | Amphitrite         | MONITOR         | 4,000,000      | 6.2      | 229                     | 254, 4                    | STEAM_SIMPLE   | 26         | 180            |
| des_jp_fuso           | JP       | Fusō               | CENTRAL_BATTERY | 3,720,000      | 6.7      | 230                     | 240, 4                    | STEAM_SIMPLE   | 22         | 390            |
| des_cn_dingyuan       | CN       | Dingyuan           | TURRET          | 7,220,000      | 7.9      | 355                     | 305, 4                    | STEAM_COMPOUND | 40         | 330            |

\* `hitPoints`/`firepower`/`armor` shown are **proposed balance abstractions**, not history; the real
tonnage/guns/belt in the preceding tables are the authoritative spec anchors.

## Open items / verification flags

1. `armorBeltUm` unit interpreted as millimetres — confirm with the schema owner before content authoring.
2. German _Preussen_-class and French _Dévastation_-class exact figures are approximate (Großer
   Kurfürst lost to collision in 1878; note only two remain). Verify against Conway's if precision needed.
3. Italian _Italia_-class has **no belt** (armored deck + heavy barbettes) — a deliberate design
   tradeoff worth modelling (speed vs. protection).
4. US/Ekaterina-II/Amiral-Duperré/Italia ships are largely **unfinished at 1 Jan 1880** → author as
   `isUnderConstruction` starting builds and/or design templates, not complete fleet assets.
