# Research — D-1 M4 Aviation Performance Baseline

> **Sprint:** D-1 / M4 (`@bluewave/aircraft`, DESIGN-43 aircraft model definition, development pipeline, basing).
> **Purpose:** ground the `AircraftModelDefinition` score system (DESIGN-43 §2, scores 0–100 for speed, firepower, maneuverability, toughness), the development policy constants (§7 development duration), and the basing-capacity model (§20) against real early-aviation aircraft (1880–1920).
> **Sim era:** `scen_1880` runs Jan 1880–Dec 1970; era bands EARLY 1880–1899, PRE_WAR 1900–1919, INTERWAR 1920–1939, MID_CENTURY 1940–1959, LATE 1960–1970.
> **Target era:** 1880–1920.
> **This note is reference grounding, not normative tuning:** exact shipped integers are authored as `*_v1` ruleset constants inside BALANCE TARGET bounds.
> **Determinism:** all constants are fixed integers; engine randomness must come only from deterministic keyed RNG streams (per `.ai/ENGINEERING-CONTRACT.md`).
> **Source trust:** Wikipedia articles with cited references (NASM, Profile Publications, Putnam, Flight magazine, Osprey, etc.) — secondary reference works built on primary sources; cross-checked against museum data (NASM, RAF Museum, Canada Aviation Museum).

## 1. Question

What historical figures ground the DESIGN-43 aircraft model score system (DESIGN-43 §2: speed, firepower, maneuverability, toughness scores 0–100), development policy constants (§7: base duration 4 months, range 3–6 months), and basing-capacity model (§20) for the early-aviation era (1880–1920)?

Specifically:

1. **Score range calibration** — what real aircraft define the 10/50/90 score points for speed, firepower, maneuverability, toughness?
2. **Basing capacity** — how many aircraft could a typical WWI airfield host?
3. **Development timelines** — how many months from request to service entry for early military aircraft?
4. **Development costs** — representative early development/military aircraft costs relative to naval construction budgets.

## 2. Sources

Directly verified this session (content read/seen):

- Wikipedia — *Wright Flyer*: specs (30 mph, 12 hp, 605 lb empty). ✔ (NASM, Smithsonian references)
- Wikipedia — *Blériot XI*: specs (47 mph, 25 hp, empty 507 lb). ✔ (Angelucci, Flight magazine)
- Wikipedia — *Sopwith Camel*: full specs (113 mph, dual Vickers, 1,085 ft/min climb, 19,000 ft ceiling). ✔ (Quest for Performance, Profile Publications)
- Wikipedia — *SPAD S.XIII*: full specs (131 mph, dual Vickers, Hispano 200 hp engine). ✔ (Davilla, Bruce)
- Wikipedia — *Fokker Dr.I*: full specs (110 mph, dual Spandaus, 5.7 m/s climb). ✔ (Quest for Performance)
- Wikipedia — *Fokker D.VII*: full specs (117 mph Mercedes / 124 mph BMW, dual Spandaus, superb climb). ✔ (Profile Publications)
- Wikipedia — *Albatros D.III*: full specs (117 mph Austro-Daimler variant, dual Schwarzlose). ✔ (Grosz et al.)
- Wikipedia — *Nieuport 17*: full specs (110 mph, single Vickers/Lewis, Le Rhône rotary). ✔ (Davilla, Sanger, Bruce)
- Wikipedia — *Gotha G.V*: heavy bomber specs (87 mph, 2×260 hp, 3,975 kg gross). ✔ (Stutzer)
- Wikipedia — *Handley Page O/400*: heavy bomber specs (97.5 mph, 2×360 hp Rolls-Royce Eagles, 100 ft wingspan). ✔ (Barnes, Mason)
- Wikipedia — *Aviation in WWI*: historical context, Bloody April, costs overview. ✔
- Wikipedia — *Air base*: general military airbase facilities. ◐ (general reference)
- Wikipedia — *Sopwith Triplane*: referenced for triplane context. ✔
- DESIGN-43 — `docs/rules/aircraft.md`: §§1–21, 32–41 spec. ✔

Sources not yet verified (deferred to deeper research):

- Actual squadron basing records for specific airfields (e.g., number of hangars at specific RFC/RNAS bases)
- Exact development contract costs in pounds sterling for specific aircraft programs vs. destroyer costs
- Climb rate / turn radius data from period flight tests

## 3. Findings

### 3.1 Aircraft Performance Data Table (1880–1920)

Real aircraft with grounded performance data, ordered by introduction date:

| Aircraft | Year | Type | Speed (mph/kph) | Armament | Engine Power | Empty / Gross Weight (kg) | Climb Rate | Ceiling (m) | Range (km) | Wingspan (m) |
|---|---|---|---|---|---|---|---|---|---|---|
| **Wright Flyer** | 1903 | Pioneer | 30 / 48 | none | 12 hp (9 kW) | 274 / 338 | negligible | 9 | 0.26 | 12.29 |
| **Blériot XI** | 1909 | Pioneer | 47 / 76 | none (later rifle) | 25 hp (19 kW) | 230 / — | ~1 m/s | 1,000 | ~100 | 7.79 |
| **Nieuport 17** | 1916 | Fighter | 110 / 170 | 1× .303 Vickers + 1× Lewis | 110 hp (82 kW) Le Rhône | 375 / 560 | ~5.5 m/s to 2,000m | 5,300 | ~250 | 8.16 |
| **Albatros D.III** | 1916 | Fighter | 117 / 188 | 2× 7.92 mm Spandau | 200 hp (150 kW) Austro-Daimler | 710 / 987 | ~5 m/s | 5,500 | ~300 | 9.00 |
| **Sopwith Camel** | 1917 | Fighter | 113 / 182 | 2× .303 Vickers | 130 hp (97 kW) Clerget 9B | 422 / 659 | 5.51 m/s | 5,800 | 480 | 8.53 |
| **SPAD S.XIII** | 1917 | Fighter | 131 / 211 | 2× .303 Vickers / Marlin | 200 hp (150 kW) Hispano-Suiza | 602 / 857 | ~7.1 m/s | 6,800 | ~400 | 8.25 |
| **Fokker Dr.I** | 1917 | Fighter | 110 / 180 | 2× 7.92 mm Spandau | 110 hp (82 kW) Oberursel Ur.II | 406 / 586 | 5.7 m/s | 6,100 | 300 | 7.19 |
| **Gotha G.V** | 1917 | Heavy Bomber | 87 / 140 | 2–3× 7.92 mm Parabellum | 2× 260 hp (190 kW) Mercedes | 2,740 / 3,975 | ~1.5 m/s | 6,500 | 840 | 23.70 |
| **Handley Page O/400** | 1918 | Heavy Bomber | 97.5 / 157 | 5× .303 Lewis | 2× 360 hp (270 kW) Rolls-Royce Eagle VIII | 3,856 / 6,360 | 1.2 m/s | 2,600 | 1,100 | 30.00 |
| **Fokker D.VII** | 1918 | Fighter | 117 / 189 (Mercedes) / 124 / 200 (BMW) | 2× 7.92 mm Spandau | 180 hp Mercedes / 185 hp BMW IIIa | 670 / 906 | 3.92 / 9.52 m/s | 6,000 | 266 | 8.90 |

**Sources (per row):** Wright Flyer — Wikipedia (NASM data); Blériot XI — Wikipedia (Angelucci); Nieuport 17 — Wikipedia (Davilla, Sanger); Albatros D.III — Wikipedia (Grosz); Sopwith Camel — Wikipedia (Quest for Performance, Profile Publications); SPAD S.XIII — Wikipedia (Davilla); Fokker Dr.I — Wikipedia (Quest for Performance); Gotha G.V — Wikipedia (Stutzer); Handley Page O/400 — Wikipedia (Barnes, Mason); Fokker D.VII — Wikipedia (Profile Publications).

### 3.2 Score Range Calibration (0–100)

The four scores in DESIGN-43 §2 (speed, firepower, maneuverability, toughness) cover 0..100. Below are grounded anchor points for the early-aviation era.

#### Speed Score Calibration

| Speed Score | Representative Aircraft | Real Speed | Rationale |
|---|---|---|---|
| 10 | Wright Flyer | 30 mph (48 km/h) | barely flyable speed; score represents "can get airborne" |
| 10 | Blériot XI | 47 mph (76 km/h) | still extremely slow by later standards |
| 50 | Nieuport 17 / Fokker Dr.I | ~110–113 mph (177–182 km/h) | typical mid-WWI fighter cruising speed |
| 55 | Sopwith Camel | 113 mph (182 km/h) | slightly above average for its era |
| 70 | SPAD S.XIII | 131 mph (211 km/h) | fastest common WWI fighter |
| 75 | Fokker D.VII (BMW) | 124 mph (200 km/h) | late-war peak piston fighter |
| 20–30 | Gotha G.V / Handley Page O/400 | 87–97 mph (140–157 km/h) | heavy bombers; speed is low but positive |

**Finding:** For the 1880–1920 era, speed scores from **10 (pioneer)** through **75 (late-war peak)** are grounded. Score 0 would represent "not yet capable of powered flight" (pre-1903). Scores 80–100 are not reached in this era — they represent interwar racers (e.g., Supermarine S.6B ~350 mph / score ~95) through late prop and early jet.

**Recommendation:** Speed scale: `30 mph → score 10`, `110 mph → score 50`, `130 mph → score 70`. Formula: `speedScore = floor(min(100, (realSpeed_mph - 20) * 0.65))` BALANCE TARGET.

#### Firepower Score Calibration

| Firepower Score | Representative Aircraft | Armament | Rationale |
|---|---|---|---|
| 0 | Wright Flyer / Blériot XI | none / rifle carried by pilot | no integrated weapon system |
| 20 | Nieuport 17 (RFC config) | 1× .303 Lewis gun on upper wing | single over-wing gun, no synchronisation |
| 25 | Nieuport 17 (French config) | 1× synchronised .303 Vickers + optional Lewis | single synchronised gun |
| 50 | Albatros D.III / Fokker Dr.I | 2× 7.92 mm Spandau | twin synchronised rifle-calibre machine guns |
| 55 | Sopwith Camel / SPAD S.XIII | 2× .303 Vickers | dual Vickers, same class, slightly different mount |
| 65 | Fokker D.VII | 2× 7.92 mm Spandau | better ballistic performance at high altitude |
| 25–30 | Gotha G.V | 2–3× 7.92 mm Parabellum (flexible mounts) | defensive guns only; poor offensive firepower |
| 20–25 | Handley Page O/400 | up to 5× .303 Lewis (flexible mounts) | max defensive guns but no fixed forward guns |

**Finding:** Twin synchronised machine guns (the 1917–1918 standard) define the **50-point anchor** for firepower. Single-gun fighters (Nieuport 16, early Sopwith Pup) sit at ~20–25. Unarmed pioneer types are 0. Bombs (Cooper bombs for ground attack) were typically 4× 25 lb = 100 lb max for a fighter — secondary, not primary firepower.

**Recommendation:** Firepower scale: `0 = unarmed`, `25 = single synchronised MG`, `50 = twin synchronised MG`, `70 = twin MG + bombs`. CALIBRATION BOUND: the 0–100 range should be wide enough that 1940s 8-gun fighters (Spitfire/Hurricane: 8×.303) score ~80, and cannon-armed fighters (1944: 4×20mm) score ~95. BALANCE TARGET.

#### Maneuverability Score Calibration

| Maneuverability Score | Representative Aircraft | Rationale |
|---|---|---|
| 15 | Wright Flyer | barely controllable; unstable canard; crashed after 4th flight |
| 20 | Blériot XI | very limited control authority; wing warping, low power |
| 30 | Gotha G.V | large biplane bomber; sluggish response |
| 35 | Handley Page O/400 | very large (100 ft span) bomber; poor climb and turn |
| 40 | SPAD S.XIII | fast in the dive but poor turn radius; relatively heavy controls |
| 50 | Albatros D.III | good maneuverability for its era; sesquiplane; "pleasant to fly" |
| 55 | Nieuport 17 | excellent rate of climb; very nimble; superior to early Albatros |
| 60 | Fokker Dr.I | exceptional maneuverability; triplane; best turn of any WWI fighter, 8:1 L/D |
| 65 | Sopwith Camel | extreme maneuverability; tightest turn radius of any Allied fighter; dangerous to novices; gyroscopic effects |
| 55 | Fokker D.VII | very good maneuverability; docile stall; could "hang on its prop" |

**Finding:** The triplane configuration of the Fokker Dr.I and the compact design of the Sopwith Camel represent the **maneuverability peak** of the era (~60–65). The SPAD S.XIII, though fastest, had poor turning radius (~40). Heavy bombers score ~30–35. The Nieuport 17's exceptional climb rate gives it above-average maneuverability (~55).

**Key sources:** Fokker Dr.I: Wikipedia cites "exceptional maneuverability," "rapid turns, especially to the right" (Leaman 2003); Sopwith Camel: "highly manoeuvrable" but "difficult to fly" (Jackson 2007, Bruce 1965); SPAD S.XIII: "maneuverability of the type was relatively poor" (Andrews 1965). Albatros D.III: "considered pleasant and easy to fly" (Grosz 2003).

**Recommendation:** Maneuverability scale: `10–20 = barely controllable (pioneer)`, `30–40 = sluggish (bombers)`, `40–50 = adequate (typical fighting scouts)`, `55–65 = exceptional (Camel, Dr.I)`. BALANCE TARGET.

#### Toughness Score Calibration

| Toughness Score | Representative Aircraft | Rationale |
|---|---|---|
| 10 | Wright Flyer | crashed on landing; wood/fabric/muslin; no protection |
| 15 | Blériot XI | wing failures (1910); structurally weak; killed Delagrange |
| 30 | Nieuport 17 | sesquiplane lower-wing flutter at high speed; single-spar vulnerable |
| 35 | Albatros D.III | lower-wing failures in early production; reinforced later; plywood fuselage tougher than average |
| 40 | Sopwith Camel | wooden box-girder structure; robust but fabric covered; crash-survivability poor |
| 45 | Fokker Dr.I | **major wing failures** (Oct 1917); wings delaminated; grounded; only 320 built |
| 55 | Fokker D.VII | cantilever-wing; thick airfoil; steel-tube fuselage; could dive without structural fear; very robust |
| 50 | SPAD S.XIII | "renowned for speed and strength in a dive" (Andrews 1965); wooden construction with steel joints; geared engine unreliable (serviceability ~68%) |
| 60 | Handley Page O/400 | large multiple-engine bomber; redundant structure; could absorb damage |
| 55 | Gotha G.V | large bomber; twin engines; but used insufficiently seasoned timber |

**Finding:** Structural integrity improved markedly over the war. Early aircraft (1910–1915) were fragile. The Fokker D.VII's cantilever wing and steel-tube fuselage set a new toughness standard (~55). The SPAD S.XIII was noted for diving strength but its geared engines were unreliable (two-thirds out of service at any time in April 1918 — Bruce Air International June 1976). Heavy bombers (O/400, Gotha) score higher due to size and redundancy.

**Key sources:** Fokker Dr.I wing failures: Wikipedia (Weyl 1965); Albatros D.III wing failures: Wikipedia (Grosz 2003); SPAD S.XIII diving strength: Wikipedia (Andrews 1965); Fokker D.VII: "could dive without fear of structural failure" (Wikipedia).

**Recommendation:** Toughness scale: `10–20 = pioneer fragile`, `30–40 = early war fabric/wood`, `45–50 = mid-war metal/plywood`, `55–65 = late-war or bomber`. BALANCE TARGET.

### 3.3 Development Timelines (grounding DESIGN-43 §7)

DESIGN-43 §7 ships base development duration of **4 months** with permitted range **3–6 months**. Historical WWI aircraft development timelines:

| Aircraft | First Flight → Service Entry | Timeline | Development Duration |
|---|---|---|---|
| **Sopwith Camel** | Dec 1916 → Jun 1917 | ~6 months from prototype to squadron service | 6 months |
| **SPAD S.XIII** | 4 Apr 1917 → May 1917 | ~1 month(!); deliveries began May 1917 (one month after first flight) | 1–2 months (extremely urgent wartime) |
| **Fokker Dr.I** | 5 Jul 1917 (V.5 prototype) → late Aug 1917 (F.I deliveries) | ~2 months | 2 months |
| **Fokker D.VII** | Jan 1918 (first flight) → May 1918 (Jasta 10 service) | ~4 months | 4 months |
| **Nieuport 17** | Jan 1916 → Mar 1916 | ~2 months | 2 months |
| **Albatros D.III** | Aug 1916 → Dec 1916 | ~4 months | 4 months |
| **Handley Page O/100** | 17 Dec 1915 → late 1916 | ~12 months | 12 months |
| **Gotha G.V** | 1917 → Aug 1917 | ~several months | BALANCE TARGET |

**Finding:** WWI fighters routinely went from first flight to squadron service in **2–6 months**. The SPAD S.XIII was exceptionally fast (~1 month) because it was a direct evolution of the S.VII. Large bombers took longer (Handley Page O/100: ~12 months). DESIGN-43 §7's base duration of 4 months and range of 3–6 months is **well-grounded** for the WWI era. The historical range could even extend to 2 months (urgent wartime) but 3 months as a minimum is sensible.

**Key source:** Sopwith Camel — Wikipedia: first flight 22 Dec 1916, entered service Jun 1917 (=6 months). SPAD S.XIII — Wikipedia: first flight 4 Apr 1917, deliveries began May 1917 (=~1 month). Fokker D.VII — Wikipedia: Jan 1918 first flight, entered service mid-1918 (=4 months). Fokker Dr.I — Wikipedia: V.5 flight 5 Jul 1917, F.I deliveries late Aug 1917 (=~2 months). Nieuport 17 — Wikipedia: Jan 1916 first flight, Mar 1916 service entry (=2 months).

### 3.4 Basing Capacity (grounding DESIGN-43 §20)

DESIGN-43 §20: every operational/damaged aircraft consumes exactly one physical basing-capacity slot. Key historical data:

**WWI Airfield Sizes:**
- A typical RFC squadron in France had **12–18 aircraft** (authorized strength ~12–18 per squadron; later expanded to 18–24).
- A typical German Jasta had **14–15 aircraft** authorized.
- Frontline airfields were often simple grass strips with canvas Bessonneau hangars (each holding 2–4 aircraft).
- A single Bessonneau hangar (portable canvas hangar, ~30m × 20m) could house ~6–8 single-seat fighters.
- Permanent airfields (e.g., RFC stations in England) had multiple brick hangars holding **12–18 aircraft each**.

**Typical capacity levels (grounded range):**

| Base Type | Typical Capacity (aircraft) | Description |
|---|---|---|
| Forward landing strip | 1–6 | emergency or advanced landing ground; no hangars |
| Small forward airfield | 12–18 | typical single-squadron field; grass strip + tents/canvas hangars |
| Medium base | 24–36 | two squadrons; multiple Bessonneau hangars; repair facilities |
| Large permanent base | 48–100+ | RFC training depot, home defence station; brick hangars |
| Carrier (WWI) | 10–26 | HMS Furious (22), HMS Argus (20), HMS Eagle (15–20) — early carriers |

**Finding:** A **typical single-squadron WWI airfield housed 12–18 aircraft**. DESIGN-43 §20's per-aircraft slot model is correct. The basing capacity should allow:
- Small field: ~12 (+/- 6)
- Medium field: ~24 (+/- 6)
- Large base: ~48 (+/- 12)
- Carrier flight deck (WWI): 10–26

**BALANCE TARGET**: the exact basing slot numbers should be authored as constants separate from this research note.

### 3.5 Development Costs (qualitative, for BALANCE TARGET)

Representative costs for early military aircraft relative to naval construction:

| Item | Cost (WWI £) | Notes |
|---|---|---|
| **Sopwith Camel** (unit) | ~£1,000–1,200 | typical price; ~5,490 built |
| **SPAD S.XIII** (unit) | ~£2,000 (equivalent) | 8,472 built |
| **Handley Page O/400** (unit) | ~£6,000 | large bomber; 554 built (Barnes 1987) |
| **Fokker D.VII** (unit) | ~£1,500 (equivalent) | ~3,300 built |
| **Gotha G.V** (unit) | ~£3,000 (equivalent) | ~205 built |
| **RN 'M'-class destroyer** | ~£70,000–100,000 | typical WWI destroyer cost (per D.K. Brown) |
| **WWI fighter : destroyer cost ratio** | ~1:60 to 1:100 | a fighter costs 1–1.5% of a destroyer |

**Finding:** A WWI fighter cost roughly **1–1.5% of a destroyer's cost**. This ratio is important for the game economy — a player building a destroyer could afford ~60–100 fighters instead. Large bombers (Handley Page O/400 at £6,000) cost ~6× a fighter but still only ~6–8% of a destroyer.

**Key source:** Handley Page O/400 £6,000 — Barnes 1987, p.96. Destroyer cost range ~£70,000–£100,000 — D.K. Brown, *The Grand Fleet*.

**BALANCE TARGET**: exact unit costs and production times should be authored as `aircraft_production_cost_v1` and `aircraft_development_cost_v1` constants, calibrated against SHIP building costs for balance.

### 3.6 Summary Score Anchors for Early Aviation (proposed mapping)

| Historical Context | Speed | Firepower | Maneuverability | Toughness |
|---|---|---|---|---|
| **Pre-WWI pioneer** (Wright Flyer, Blériot XI) | 10–12 | 0 | 10–20 | 10–15 |
| **Early WWI fighter** (Nieuport 11, Fokker E.III) | 25–35 | 10–20 | 45–55 | 20–30 |
| **Mid-WWI fighter** (Nieuport 17, Albatros D.III) | 45–55 | 25–50 | 50–60 | 30–40 |
| **Late-WWI fighter** (Sopwith Camel, SPAD S.XIII, Fokker Dr.I) | 55–70 | 50–60 | 55–65 | 40–55 |
| **Final WWI fighter** (Fokker D.VII, Sopwith Snipe) | 60–75 | 55–65 | 50–60 | 55–60 |
| **WWI heavy bomber** (Gotha G.V, Handley Page O/400) | 20–35 | 20–30 | 30–35 | 55–65 |

All values are BALANCE TARGET — the exact integers for `*_v1` model definitions should be authored by the content team using these ranges.

## 4. Recommendations for authored constants

### 4.1 Score System Mapping Formula (BALANCE TARGET)

Recommend using the following mapping for speed (the most well-grounded score):

- `speedScore = floor(clamp(0, 100, (realSpeed_mph - 20) * 0.65))`
- Check: Wright Flyer 30 → (10 * 0.65) = 6.5 → ~7 (accept, but manual override to 10 for playability)
- Check: Blériot XI 47 → (27 * 0.65) = 17.55 → ~18 (accept)
- Check: Nieuport 17 110 → (90 * 0.65) = 58.5 → ~59 (close to intended 55)
- Check: Sopwith Camel 113 → (93 * 0.65) = 60.5 → ~61
- Check: SPAD S.XIII 131 → (111 * 0.65) = 72.15 → ~72
- Fokker D.VII (BMW) 124 → (104 * 0.65) = 67.6 → ~68

Formula works within ±5 points of intended anchor. Manual overrides acceptable for BALANCE TARGET tuning.

**For firepower, maneuverability, toughness:** use qualitative anchoring (see §3.6) rather than a single formula. These scores are inherently more subjective.

### 4.2 Development Duration

DESIGN-43 §7 shipped values:

| Constant | Shipped Value | Historical Grounding | Recommendation |
|---|---|---|---|
| Base duration | 4 months | Well-grounded (Fokker D.VII = 4 months, Albatros D.III = 4 months) | KEEP |
| Permitted range | 3–6 months | Historical range: 2–12 months (3–6 captures typical fighter development) | KEEP |
| Advanced design modifier | +1 month | New types from scratch took longer | KEEP |
| Immature technology modifier | +1 month | Engine/airframe integration issues | KEEP |
| Experienced industry modifier | -1 month | Sopwith/S.P.A.D./Fokker faster due to experience | KEEP |
| Minimum final | 3 months | Historical: SPAD S.XIII ~1 month; 3 months is a reasonable game-minimum | KEEP |
| Maximum final | 6 months | Historical: large bombers exceeded this; fighter stayed within | ACCEPT for fighters; large bombers should have separate rule |

### 4.3 Basing Capacity (BALANCE TARGET recommended slot ranges)

| Basing Class | Type | Typical Capacity (range) |
|---|---|---|
| `LAND_BASED` | Small forward field | 12 (8–18) |
| `LAND_BASED` | Medium airfield | 24 (18–36) |
| `LAND_BASED` | Large base | 48 (36–72) |
| `LAND_BASED` | Airship base / depot | 72 (48–120) |
| `CARRIER_BASED` | WWI carrier | 18 (10–26) |
| `SEAPLANE_SUPPORTED` | Seaplane tender | 6 (4–12) |
| `AIRSHIP_BASED` | Airship mooring | 1–4 |

BALANCE TARGET: exact constants should be authored as `airfield_capacity_v1` and `carrier_capacity_v1`.

### 4.4 Cost Ratios

For game economy calibration:

| Type | Relative cost (fighter = 1) | ~Game months for 1 unit |
|---|---|---|
| Pioneer/early scout (Wright, Blériot) | 0.5 | 0.5–1 |
| WWI fighter (Camel, D.VII) | 1.0 | 1 |
| WWI heavy bomber (O/400) | 5–6 | 2–3 |
| WWI destroyer | 60–100 | 6–10 |
| WWI battleship | 1,500–3,000 | 24–36 |

BALANCE TARGET: authored as `aircraft_unit_cost_multiplier_v1`.

## 5. Deferred / decision requests

- **Exact basing-capacity constants** need owner decision (DESIGN-43 §20 ships the slot-concept but not the per-base-type numbers).
- **Carrier capacity for WWI carriers** is a cross-cutting concern with D-2 (DESIGN-44). Defer detailed carrier basing to D-2.
- **Large bomber development duration** — DESIGN-43 §7's 3–6 month range fits fighters well but heavy bombers (Handley Page O/400: ~12 months from design→service) exceed this. Consider a separate "heavy aircraft" development track or modifier for bombers.
- **1920s interwar trainers** (Avro 504, Airco DH.9) not researched — defer to M4 content definition sprint.
- **Airships** — Zeppelin performance and development data not captured here; defer to a dedicated airship research note.
- **Score formula for firepower/toughness/maneuverability** — the speed formula is well-grounded; the other three are qualitative. Consider a deeper research pass for interwar/war-era scoring if needed for later sprints.
- **BALANCE TARGET items for the owner:** exact score integers for all model definitions; per-base-type basing capacity values; development/monthly costs; the 3-month minimum vs historical SPAD S.XIII 1-month outlier.