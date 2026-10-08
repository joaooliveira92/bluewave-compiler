# Ship-Building System Specification (SB-1): Component-Level Design Workshop

**Status:** draft spec (spec-creator output, awaiting `to-tickets` slicing)
**Subsystem:** ship design, validation, construction, refit, AI design. Nothing else.
**Out of scope for this milestone:** tactical combat, diplomacy, politics, narrative events, espionage, general campaign mechanics. Where ship building needs one of them, only the minimal interface in §2.3 is defined.
**Originality:** all formulas, coefficients, terms, tables and UI here are original. Historical facts and public naval-architecture concepts (Froude/admiralty-style scaling, metacentric height, block coefficient) are used as inspiration only. No data, text, formula or layout is taken from Rule the Waves 3 or any other commercial game. Content values must come from the `research` skill (primary sources) and be authored as data, never invented in code.

---

## 0. Relationship to existing canon (read first)

The repo already has a normative, **template-level** design stack. This spec does not replace it. It adds a **component-level workshop** underneath it.

| Existing canon | What it owns | What SB-1 does with it |
|---|---|---|
| `docs/rules/ship-design.md` (DESIGN-21) | `DesignDraft` → `DesignStudy` → `CompiledDesignVersion` → `DesignFamily` → `NamedClass`; 20-stage compile pipeline; similarity/derived-design discount; overweight tolerance; reason codes | SB-1 **fills in** the pipeline stages 3–12, 17–18 with component-driven calculations. The layer names, immutability rule, family/similarity rules and hashing stay unchanged. |
| `docs/rules/construction-repair-and-rebuild.md` (DESIGN-23) | `DockyardProject` types (`NEW_CONSTRUCTION`, `REPAIR`, `REBUILD`, `CONVERSION`, `EQUIPMENT_INSTALLATION`), work packages, acceleration, latent defects, scrapping | SB-1 **adds** construction phases as work-package kinds, revision-cost tiers, and refit-kind legality. Project status, payment, defects and scrapping stay unchanged. |
| `docs/rules/ship-classification.md` (DESIGN-22) | Ship families, natural vs intended classification | Category ids are taken from here, not invented. |
| ADR-0037 | Authoring units mm/knots, **compiled units** µm / µm·s⁻¹ / kg | Compiled output of SB-1 MUST keep these fields (`normalizedDisplacementKg`, `normalizedArmorUm`, `normalizedSpeedUms`, `mainGunsCaliber`…) so `@bluewave/combat` and `@bluewave/campaign` need no change. |
| `content/production/1880/designs.yaml` | Today's authored ship templates | Remain valid. A template is the degenerate case of a component design (§4.2 "template import"). |

**Consequence for requirements.** Where the brief's wording ("invalid design cannot enter construction", "completed ship preserves its approved revision") already exists as a DESIGN-21/23 rule, SB-1 cites it and tests it rather than restating it.

**Unit deviations from the brief, resolved:** the brief says "integer minor currency units". The repo's canonical money unit is the **budget micro-unit** (DESIGN-07). SB-1 uses budget micro-units (integers). The brief's "tonnes/knots/nm" are display units only.

---

## 1. Design pillars

1. **Role before components.** A design is scored against its own `DesignRequirement`, never against a universal "best".
2. **Every gain has a named price.** Each performance axis is coupled to at least two others through the weight, volume, power or cost ledger (§5.1 coupling matrix). No free stats.
3. **Nothing is silently fixed.** Overweight, overcrowded or unstable designs are reported with cause and ≥3 remedies; the compiler never normalizes them (DESIGN-21 §25 already forbids silent fallback).
4. **Data over code.** Weapons, engines, armour schemes, sensors, hulls, doctrine and thresholds are YAML content with schema validation. Domain code knows categories and formulas, not item names.
5. **Technology is capability, not a multiplier.** Technology gates *what exists* and shifts *weight, size, cost, reliability, accuracy, power, crew, difficulty, maintenance* per component, with maturity curves (§6.3).
6. **Same rules for everyone.** The AI calls the same `compileDesign`. There is one validator.
7. **Deterministic by construction.** Integer / fixed-point arithmetic, no `Math.random`, no wall clock. Randomness only in construction defects/trials via `@bluewave/random`, logged, never in validation.
8. **Old hulls end.** Every hull carries finite growth and fatigue budgets; refits spend them.

---

## 2. Scope, assumptions, dependencies

### 2.1 In scope
Design requirement; hull and displacement; zone arrangement; machinery/speed/fuel/range; weapons and ammunition; armour and survivability; sensors/fire control; stability and structure; validation; cost; construction phases; shipyards and capacity (as consumed by ship building); revisions/variants; refits and reconstruction; AI candidate generation; persistence; UI information architecture; tests; backlog; vertical slice.

### 2.2 Assumptions
- A1. Campaign start is 1880 (`scen_1880`); the vertical slice uses the **EARLY band (1880–1899)** because that is what the production pack plays today.
- A2. TypeScript monorepo, `packages/*`, Effect-based services as elsewhere; no new runtime dependency is required.
- A3. Hull lengths are integer **millimetres**, volumes integer **litres**, mass integer **kg**, power integer **kW**, thickness integer **µm**, speed integer **µm/s**, money **budget micro-units**, probabilities/multipliers **basis points**, build effort **work micro-units**, time **campaign months** (DESIGN-07/21).
- A4. Fractional powers (e.g. Δ^(2/3)) are evaluated by exact bigint `integerRoot`/`powRational` in `@bluewave/deterministic` (added in SB-00), not `Math.pow`. Cross-process determinism test required.
- A5. The player is nation-bound; AI nations are `NationId`s with a doctrine record.

### 2.3 Dependencies and minimal interfaces (nothing more is built)
| Dependency | Minimal interface SB-1 consumes |
|---|---|
| Research (DESIGN-20) | `isTechUnlocked(nationId, techId, month)` and `techMaturityBp(nationId, techId, month)` |
| Economy | `budgetAvailable(nationId)`; `industrialCapacity(nationId, facilityId)` in work micro-units/month; material stock by `MaterialId` |
| Ports/facilities | `Facility { slipwayMaxLengthMm, slipwayMaxBeamMm, slipwayMaxDisplacementKg, drydockMaxLengthMm, craneLiftKg, armourPlantCapacity, heavyGunCapacity, workforce }` |
| Treaties (DESIGN-26 policy) | `TreatyLimits { maxDisplacementKg?, maxMainGunCaliberUm?, maxFleetTonnageKg?, forbiddenCategories[] }` returned by one query |
| Combat | none consumed. SB-1 *emits* the existing compiled fields plus an extra `survivabilityProfile` it does not require combat to read |
| Campaign state | design store lives in campaign snapshot (already holds `CompiledDesignVersion`) |

---

## 3. Core entities and value objects

Layers (DESIGN-21 §1, unchanged): `DesignDraft` → `DesignStudy` → `CompiledDesignVersion` → `DesignFamily` → `NamedClass` → `IndividualShip` → `RefitConfiguration`.

### 3.1 New or extended value objects

```ts
// Units are branded integers; see §3.2
type Mm = Brand<number,"Mm">; type Kg = Brand<number,"Kg">; type Kw = Brand<number,"Kw">;
type Litre = Brand<number,"Litre">; type Um = Brand<number,"Um">; type UmPerSec = Brand<number,"UmPerSec">;
type Bp = Brand<number,"Bp">; type Micro = Brand<number,"BudgetMicro">; type WorkMicro = Brand<number,"WorkMicro">;

interface DesignRequirement {            // §4.1. Stored on the draft. Drives mission-fit scoring only.
  category: CategoryId;                   // from DESIGN-22
  mission: MissionId;                     // e.g. "fleet_screen","commerce_protection","line_of_battle"
  expectedAdversaries: CategoryId[];
  region: RegionProfileId;                // sea-state, distance-to-base, climate bands
  desiredSpeed: UmPerSec; desiredRange: { distanceUm: number; atSpeed: UmPerSec };
  desiredProtection: ProtectionGoal;      // e.g. { immuneToCaliberUm, atRangeBand }
  armamentObjective: ArmamentGoal;        // {minBroadsideKg, minGunCaliberUm, minTorpedoSalvo}
  maxCost: Micro; maxBuildMonths: number;
  dockyardLimit: FacilityId | "ANY_OWNED";
  serviceLifeMonths: number;
  modernizationExpectation: "NONE"|"MINOR"|"MAJOR";   // sets target design margin (§8.4)
}

interface HullSpec {                     // §7
  hullFormId: HullFormId;                // data: fineness class, Cb range, admiralty-coefficient base, hull-complexity
  lengthWl: Mm; beam: Mm; draught: Mm; depthToMainDeck: Mm; // freeboard = depth - draught
  blockCoeffBp: Bp; waterplaneCoeffBp: Bp;
  structuralScheme: StructuralSchemeId;  // "transverse","mixed","longitudinal": affects hull weight & strength
  materialId: HullMaterialId;            // iron, mild_steel, high_tensile
  subdivisionGrade: 0|1|2|3|4;
  targetDisplacementKg: Kg;              // NORMAL-load; the player's budget
  limitDisplacementKg: Kg | null;        // treaty/policy/dock imposed; from §2.3
}

interface Placement {                    // component instance on the ship
  instanceId: string; componentId: ComponentId;
  zoneId: ZoneId; stationPermille: number;   // longitudinal position, 0=bow,1000=stern
  side: "CENTRE"|"PORT"|"STBD"|"BEAM_PAIR";
  deck: "HOLD"|"LOWER"|"MAIN"|"UPPER"|"SUPERSTRUCTURE";
  mountRef?: InstanceId;                 // ammo→magazine, turret→barbette
  variant?: Record<string, number|string>;  // caliber/barrel-count/etc. chosen from component's declared options
}

interface DesignDraftV2 extends DesignDraft {   // adds to DESIGN-21 §2 fields
  requirement: DesignRequirement; hull: HullSpec;
  placements: Placement[]; armourScheme: ArmourScheme;
  machineryPlan: MachineryPlan; fuelPlan: FuelPlan;
  accommodationStandard: "SPARTAN"|"STANDARD"|"GENEROUS";
  designMarginBp: Bp; growthReserveBp: Bp;
}
```

The pre-existing DESIGN-21 draft fields (`mechanical layout and firing positions`, `armor specification`, etc.) are *derived views* of `DesignDraftV2`. They remain authoritative for classification and combat consumers.

### 3.2 Units and numeric representation
| Quantity | Canonical (integer) | Display | Rounding |
|---|---|---|---|
| Mass/displacement | kg | tonne (÷1000) | all ledger lines round **up** to the next kg; the total is the sum of rounded lines (invariant I2) |
| Length | mm | m / ft | floor |
| Volume | litre | m³ | ceil for consumption, floor for capacity |
| Power | kW (display shp = kW×1.341, label as "shp") | shp | ceil for demand, floor for supply |
| Speed | µm/s (ADR-0037) | knots (÷514 444) | floor |
| Thickness | µm (ADR-0037) | in / mm | exact |
| Range | µm | nautical mile (1 852 m) | floor |
| Money | budget micro-unit | display currency | exact; multiplication via bp with round-half-up |
| Ratios | bp (1/10 000) | % | round-half-up, one documented rounding site per formula |
| Time | months (integer) + work micro-units | months | build duration = ceil(work / monthlyCapacity) |

**Intermediate precision.** Use `bigint` or fixed-point with ≥ 64-bit headroom for products of mass × length. Never accumulate floats. Each formula spec declares its rounding site.

---

## 4. Player design workflow

### 4.1 Stages
1. **Brief:** write or pick a `DesignRequirement` (pre-fills from category + mission templates; every field editable).
2. **Hull:** pick hull form, material, dimensions, target displacement. Live: hull weight, buoyancy check, speed potential, freeboard.
3. **Arrangement:** place machinery, magazines, weapons, sensors, aviation/mission gear into zones (§9).
4. **Protection:** choose armour scheme and thickness per region (§12).
5. **Systems:** fire control, sensors, electrical plant, damage-control, accommodation.
6. **Review:** validation panel, weight/space/power ledgers, requirement-fit score, cost & schedule forecast, comparison with existing classes.
7. **Study & submit:** pay the design study (DESIGN-21 §3), then submit for construction (DESIGN-23 §3).

Every stage is revisitable; the draft is always recompiled in "preview mode" (full pipeline, no persistence) after each edit.

### 4.2 Rules of the workflow
- Preview compile MUST be pure, deterministic and run within the performance budget (§22).
- Undo/redo is a command log of `DraftEdit`s (§17); preview results are never the source of truth.
- Template import: a `DesignTemplate` from `designs.yaml` converts to a draft by choosing the nearest hull form and a synthetic placement set; unmatched fields stay in a locked `legacy` block that the compiler passes through. This keeps the shipped 1880 pack playable.
- Submitting runs the **authoritative** compile (not preview); on any BLOCKING finding no `CompiledDesignVersion` is created (DESIGN-21 §7).

---

## 5. Cross-coupling model (how "you can't max everything" is enforced)

### 5.1 Coupling matrix (design intent; each cell is realised by a formula below)
| Increase | Costs weight | Costs volume | Costs power | Costs crew | Costs money/time | Lowers stability | Lowers reliability | Other side effect |
|---|---|---|---|---|---|---|---|---|
| Speed | machinery, hull strength | machinery, fuel | ∝V³ | stokers | ✓ | | ✓ | range↓, wet bow, seakeeping↓ |
| Range | fuel (+ bunker protection) | fuel | | provisions | | | | speed↓ for same Δ |
| Armour | ✓✓ (high-placed ones raise KG) | | | | ✓ | high deck armour ✓ | | speed↓, draught↑ |
| Guns (calibre/number) | gun, mount, barbette, ammo | magazine, barbette | training power | gun crew | ✓ | topweight ✓ | ✓ | blast arc limits, structure stress |
| Fire control | director weight at height | tower volume | ✓ | ✓ | ✓ | topweight | complexity | accuracy↑ |
| Aviation | hangar, catapult | hangar/deck | | ✓ | ✓ | topweight | fire risk | arcs blocked |
| Habitability | | ✓ | | | ✓ | | | reliability/morale↑, endurance↑ |
| Modernization margin | reserved mass | reserved volume | reserved power | | | | | lower launch capability, higher cost |

### 5.2 Anti-optimum guarantees (tested by §22 property tests)
- G1: No hull form has dominating coefficients in all dimensions (each form data entry must trade ≥2 axes; schema lint).
- G2: Marginal weight of a speed increase is strictly increasing (convex): `W_mach'(V)` increases for all V in the legal range.
- G3: Marginal armour benefit per kg decreases with thickness beyond the threat's penetration saturation.
- G4: A "maxed" design (random search over legal space for max requirement-fit with no cost cap) is not the same design for two different requirements.

---

## 6. Technology and component catalogue

### 6.1 Component schema (content, YAML → `ComponentDef`)

```yaml
id: gun_bl_12in_mkI            # stable, snake_case, never reused
displayName: "12-inch breech-loading gun, Mk I"   # presentation only
category: MAIN_GUN             # closed enum, §6.2
introduction: { fromMonth: "1881-03", obsoleteMonth: null }
requires: [tech_heavy_bl_guns]        # techIds; missing → BLOCKING TECH_UNAVAILABLE
maturity: { curve: "S", monthsToMature: 84 }   # see 6.3
parameters:                     # variant knobs the player can choose, with legal ranges
  barrels: { min: 1, max: 4, step: 1 }
weight:    { formula: "per_barrel_kg * barrels + mount_kg(barrels)", constants: { per_barrel_kg: 46000 } }
space:     { volumeLitre: "...", deckFootprintMm2: "...", heightMm: 3200, zones: [FORWARD, AFT, CENTRAL] }
cost:      { formula: "...", constantsRef: "cost.gun_heavy" }
complexity: { buildWorkMicro: "...", productionLine: "heavy_gun" }
power:     { demandKw: 0, trainingKw: "..." }
cooling:   { demandKw: 0 }
crew:      { count: "12 * barrels" }
reliability: { baseBp: 9400, degradeWithTechGapBp: 40 }
compatibleHulls: [BATTLESHIP, CRUISER_ARMOURED, COAST_DEFENCE]
placement: { requiresMount: BARBETTE_OR_TURRET, adjacency: { needsMagazineWithinStations: 350, forbidsOverlap: [MACHINERY] }, arc: { fwdDeg: 150, ... } }
upgradePath: [gun_bl_12in_mkII]
maintenance: { monthlyBp: 12 }          # of component cost
tags: [heavy, slow_firing]
```

**Rules.**
- Formulas are restricted-grammar expressions (`+ − × ÷`, `min`, `max`, `clamp`, `lookup(table, x)`, `pow(x, p/q)`) parsed at content-compile time into a typed AST; no `eval`. Constants live in `constants:` or a shared `balance/*.yaml`; implementation contains none.
- Content compile MUST fail on: negative weight over the legal parameter range (sampled at min/mid/max), a missing `requires` tech, an `upgradePath` cycle, an unknown tag/zone/category, or `volume`/`weight` that evaluates to non-integer without declared rounding.
- Adding a component never requires editing `packages/*/src` (acceptance AC-3).

### 6.2 Component categories (closed enum)
`HULL_FORM, MATERIAL, BOILER, ENGINE, SHAFT_PROPELLER, FUEL_BUNKER, GENERATOR, MAIN_GUN, SECONDARY_GUN, DUAL_PURPOSE_GUN, AA_WEAPON, TORPEDO_TUBE, MINE_GEAR, AIRCRAFT_FACILITY, MISSILE_LAUNCHER, MOUNT, MAGAZINE, AMMUNITION, ARMOUR_SCHEME, UNDERWATER_PROTECTION, DIRECTOR, RANGEFINDER, RADAR, SONAR, COMMS, SPECIAL_EQUIPMENT, DAMAGE_CONTROL, ACCOMMODATION`.

### 6.3 Technology effects: not a linear bonus
Per-component, per-nation **maturity** `m ∈ [0,10000] bp` from `techMaturityBp`. Effects are *separate curves* in the component's data:

| Attribute | Typical direction as maturity ↑ |
|---|---|
| Weight | ↓ (diminishing) |
| Volume | ↓ |
| Cost | ↑ early (prototype premium), ↓ later |
| Reliability | ↑ (S-curve), starts low |
| Accuracy / efficiency | ↑ |
| Power / fuel use | ↓ |
| Crew | ↓ then flat |
| Construction complexity | ↓ |
| Maintenance burden | ↓ then flat; ↑ again when **obsolete** (spares) |

Beyond maturity there are **hard unlocks** (an engine type, an armour class, or a mount type either exists or does not). Obsolescence: after `obsoleteMonth`, new designs may still use it (cost ↑) but not once the replaced-by tech is in a treaty-mandated class.
A first-use penalty ("immature in this nation") feeds first-of-class risk (§14.4).

---

## 7. Hull and displacement model

### 7.1 Variables
`L` waterline length (m), `B` beam (m), `T` draught (m), `D` depth to main deck (m), `Cb` block coeff, `ρ` = 1025 kg/m³, `Δ` displacement (tonne), `Δtarget`.

### 7.2 Formulas
Each formula's coefficient names live in `balance/hull.yaml`.

**F-H1 Buoyant displacement** *(historically inspired)*  
`Δ_buoy_kg = L·B·T·Cb·ρ` (integer rounding: floor).  
The design is **hull-limited**: the buoyant displacement at the design draught MUST equal the ledger total within `±hullTolBp` (default 100 bp). Otherwise the compiler reports whether the ship is under- or over-weight and by what categories (never auto-adjusts draught).

**F-H2 Hull weight (structure and fittings)** *(gameplay law fitted to sourced data)*  
`W_hull_kg = K · f_mat · f_scheme · f_sub · f_form · (L·B·D)^1.26`, L, B, D in metres.  
Fitted in `docs/research/ship-building-early-band.md` to the hull-weight fractions of four sourced ships (Majestic 38 %, Edgar 38 %, Siegfried ~31 %, Havock ~33 % of displacement, White 1894): `K ≈ 9.9 kg/m^3.78`, constant to ~3 % across a 70x size range. (The first draft of this spec used `L^1.6·(B+D)`; it was off by ~5x between torpedo boat and battleship and was replaced.) `f_mat`: iron 1.25, mild steel 1.00, high-tensile 0.90 (gameplay defaults); `f_form` absorbs class residuals. The ledger `hull` line therefore means structure *plus* fittings, as in White; accommodation components carry only crew-space volume.  
Min/normal/extreme: L∈[20,260] m (hull-form-dependent), outside → BLOCKING `HULL_DIMENSION_RANGE`. `L/B` outside the form's `[lbMin, lbMax]` → WARNING (stability or speed penalty, §10, §11).

**F-H3 Strength index** *(gameplay)*  
`SI = (W_hull_actual / W_hull_required_for_L_and_loading)`; `W_hull_required = F-H2 × (1 + k_len·max(0, L/D − LD0)) × (1 + k_gun·gunBlastLoad/Δ)`.  
SI < 10 000 bp → structure under-built; < 8 500 bp CRITICAL `STRUCTURAL_FAILURE_RISK`. The player can pay for a stronger `structuralScheme`.

**F-H4 Freeboard / reserve buoyancy**  
`Freeboard = D − T`. `ReserveBuoyancy_bp = (Vol_above_WL_to_main_deck_closed) / ∇ ·10 000` where `Vol_above ≈ L·B·(D−T)·Cwp·k_sheer`.  
Thresholds per category/region in `thresholds/hull.yaml` (e.g. oceangoing ≥ 3 500 bp; coastal ≥ 2 500 bp). Below → WARNING; below half → CRITICAL `LOW_RESERVE_BUOYANCY`.

**F-H5 Displacement ledger (the invariant)**  
`Δ_total = W_hull + W_mach + W_fuel + W_armour + W_arm + W_ammo + W_sensors + W_mission + W_crew + W_aux + W_margin + W_reserve`  
- `W_margin = designMarginBp × (sum of the other 10 excluding reserve)` (accounts for weight growth during construction; min by tech maturity).  
- `W_reserve = growthReserveBp × Δtarget` (kept empty for future refits; raising it eats capability now).  
- Invariant I2: `Δ_total` equals the sum of the persisted ledger lines **exactly**; the compiled design stores each line.

**Compliance:** `Δ_total ≤ Δlimit` (treaty/policy/dock) hard; `Δ_total ≤ Δtarget × (1 + overTolBp)` per DESIGN-21 §19–20 (existing overweight tolerance and penalties reused unchanged). Excess above tolerance → BLOCKING `OVERWEIGHT_UNRECOVERABLE`, with the remedy generator in §16.3.

---

## 8. Space and arrangement model

### 8.1 Zones
Nine fixed longitudinal zones; each zone is a data record with a fraction of length, a buoyancy fraction, and available decks:

| # | Zone id | Typical contents |
|---|---|---|
| 1 | `FORECASTLE` | bow gun, anchor gear, torpedo tubes (sub), stores |
| 2 | `FWD_MAGAZINE` | magazines, shell rooms, gun barbette trunks |
| 3 | `FWD_SERVICE` | boilers/aux, workshops |
| 4 | `CENTRAL_MACHINERY` | boilers, engines, generators |
| 5 | `SUPERSTRUCTURE` | bridge, directors, funnels, boats |
| 6 | `AFT_SERVICE` | aux machinery, steering, accommodation |
| 7 | `AFT_MAGAZINE` | magazines |
| 8 | `QUARTERDECK` | aft gun, mine-gear, boats |
| 9 | `MISSION` | hangar, flight deck, special stores (overlays the upper decks of 5–8) |

Zone boundaries, in permille of `L`, come from the **hull form** record (so a flush-deck torpedo boat and a high-freeboard battleship differ) and are scaled by `L`.

### 8.2 Component spatial attributes
Weight, volume (internal litres), deck footprint (mm²), longitudinal station, vertical centre of gravity `z`, height, power, cooling, crew, compatibility, adjacency (all from §6.1).

### 8.3 Arrangement rules (each is a validator, §14)
| Rule id | Condition | Severity |
|---|---|---|
| ARR-OVERLAP | Two non-stackable components exceed zone deck footprint or volume | BLOCKING |
| ARR-TURRET-ON-MACHINERY | Gun barbette footprint overlaps `CENTRAL_MACHINERY` volume (barbette trunk cuts boiler/engine spaces) | BLOCKING unless component declares `canOverlap` |
| ARR-MAG-VOLUME | Magazine volume < required for ammunition stowed (§10.1) | BLOCKING |
| ARR-MAG-DIST | Magazine farther than `maxFeedStations` from served mount | CRITICAL (rate-of-fire penalty or blocks load) |
| ARR-TOPWEIGHT | `KG/B` above category threshold | WARNING→CRITICAL by stability (§11) |
| ARR-ARC | Funnel/superstructure/other mount obstructs the declared arc (§9.3) | WARNING; arc reduced |
| ARR-DIRECTOR-SMOKE | Director/radar within `smokeInterferenceStations` of funnel in a direction the data marks as downwind | WARNING |
| ARR-FLIGHT | Flight-deck or hangar dimensions < aircraft requirement (length, width, height) | BLOCKING for any aircraft facility |
| ARR-CRITICAL-CONC | > `critConcBp` of critical systems (machinery power, magazines) inside one zone | ADVISORY→WARNING (survivability, §13) |
| ARR-POWER | Generating capacity (kW) < demand at the "action" load case | CRITICAL |
| ARR-COOLING | Cooling demand > cooling supply (machinery/electronics spaces) | WARNING; reliability penalty |
| ARR-CREW | Accommodation capacity < crew required | CRITICAL (overcrowding) |

### 8.4 Why zones, not coordinates
Zone-based arrangement keeps the problem small, deterministic and UI-friendly while still producing real consequences (trim, topweight, arc blocking, magazine adjacency, concentration of critical systems). A 3-D layout is a documented non-goal (§24).

---

## 9. Machinery, speed, fuel, range

### 9.1 Formulas

**F-M1 Required power** *(historically inspired admiralty-style scaling)*  
`P_kW = Δ^(2/3) · V³ / (C_eff) · k_kw`  
with `Δ` in tonnes, `V` in knots, `k_kw` = 0.7457 (shp→kW).  
`C_eff = C_form · (1 − k_sl · max(0, SLR − SLR0)²) · (1 − k_foul(hullAgeMonths)) · k_load(Δ/Δ_nom)`  
where `SLR = V / √(L_ft)` (speed-length ratio). Above `SLR0` (hull speed region) the coefficient drops quadratically, making the last knots disproportionately expensive. `C_form` and `k_*` live with the hull form.  
Range: Δ∈[50, 60 000] t; V∈[6, 40] kn. Outside → BLOCKING `SPEED_OUT_OF_RANGE`. Extremes: at `SLR ≥ SLR_max` (default 3.2) C_eff clamps to `C_floor` and a WARNING `HULL_DRIVEN_BEYOND_FORM` is issued.

**F-M2 Plant sizing.** Machinery is a *plant* made of boilers and engines from data; `P_installed = Σ rated kW of chosen engines × (1 − lossBp)`. Plant weight/volume from the components; `W_mach` = Σ component weights + shafting + propellers + `k_steam`·P for piping/aux (data).  
`V_max_actual = V s.t. P_required(V) = P_installed` (inverse solved by monotone integer bisection; ≤ 40 iterations; deterministic).

**F-M3 Fuel consumption.** `kg_per_hour(V) = P_kW(V) · SFC(plant, maturity, V/Vmax)`, where SFC is data (coal/oil/mixed; part-load curve with a minimum near 60–70 % load, ending with `lookup`). Cruising power: `P(Vc)` from F-M1 (not a simple cube).  
`Endurance_h = usableFuel_kg / kg_per_hour(Vc)`, `Range = Vc · Endurance_h`, `usableFuel = capacity · (1 − unusableBp − reserveBp)`.  
Three speeds are reported: max, economical cruise (best nm per tonne), and a player-set `Vc`.

**F-M4 Electrical.** Demand cases `HARBOUR`, `CRUISING`, `ACTION` (sum of component `power.demandKw` weighted by case-profile bp in data). Supply = Σ generators. Generator availability is derated by `1 − k_hits` if the plant is concentrated in one zone (links to survivability).

**F-M5 Reliability (plant).** `R_plant = Π R_i` over machinery components (bp, multiplied via integer division per step), × `1 − k_over·max(0, V_max/V_rated − 1)` (running above rating) × `maturityPenalty`. It feeds breakdown chance in construction trials (§15) and monthly maintenance.

### 9.2 Fuel types
Fuel type is data: `COAL`, `OIL`, `MIXED`, later `DIESEL`, `NUCLEAR`. Each has energy-density-equivalent SFC factor, bunker volume factor, refuel logistics tag, signature tag (smoke), and bunker-protection effect (coal bunkers add protection value, §12.4).

---

## 10. Weapons, ammunition, mission systems

### 10.1 Gun formulas

**F-G1 Mount weight** is in the component record (formula of barrels, calibre, shield/turret/barbette). Calibre is a *variant parameter* so `W_gun` is a smooth function with a documented cubic-like scaling `W ∝ cal^2.8` as a *gameplay approximation*.

**F-G2 Ammunition & magazine.**  
`RoundsPerGun` = player choice within `[min, max]` per category; `AmmoMass = rounds × guns × shellMass(cal) × (1 + chargeFactor)`;  
`MagVolume_litre = rounds × guns × roundVolume(cal) × stowageFactor(arrangement)`.  
A design fails ARR-MAG-VOLUME if magazine capacity < `AmmoVolume`.

**F-G3 Rate of fire.** `ROF_rpm = ROF_base(cal, mountType, maturity) · loaderFactor(crewQuality) · feedFactor(magazineDistance)`; development metric only (§21).

**F-G4 Broadside weight.** `Broadside_kg = Σ (guns whose arc covers beam) × shellMass × ROF`. Arc: each placement has `arcDeg`; obstruction reduces by data-defined blocking angles (superstructure station overlap, funnel).

**F-G5 Blast & structure.** Gun mounts add `gunBlastLoad` to F-H3 and impose deck exclusion: no boats/aircraft/AA within the mount's blast cone (ARR-ARC).

### 10.2 Other weapon classes
Torpedo tubes (above/below water, trainable/fixed; torpedo count; storage), mine gear, aircraft (facility → aircraft count; hangar volume; fuel & ordnance stowage; fire risk tag), missiles (launcher mass/volume/stowage, guidance dependency → sensors), AA and DP guns (ROF, ceiling, fire-control requirement). All are the same `ComponentDef` with their own `parameters` and data-driven `requires`/adjacency. **No weapon-specific code in domain logic.**

### 10.3 Existing combat contract
The compiler populates the already-defined `mainGuns`, `torpedoArmament`, etc. from placements. If combat later needs more fields (e.g. arcs), they are additive.

---

## 11. Stability and structural validation

**F-S1 Vertical centre of gravity.** `KG = Σ(w_i · z_i) / Σ w_i` over all ledger masses; hull structure uses `z_hull = k_hull·D`.  
**F-S2 Metacentre.** `KB = k_kb · T`, `BM = k_bm · L·B³·Cwp_inertia / ∇` where `∇ = Δ/ρ` (units m).  
`GM = KB + BM − KG`.  
**F-S3 Stability window.** Per category: `GM_min ≤ GM ≤ GM_max` (data).  
- `GM < GM_min`: CRITICAL `STABILITY_LOW`; below `GM_cap` BLOCKING (will capsize). Consequence: heavy-weather loss risk and reduced survival damaged.  
- `GM > GM_max`: WARNING `STABILITY_STIFF`: violent roll → gun platform & crew penalty.  
**F-S4 Range of stability / heel under damage (gameplay).** `ListOnFlood = f(subdivisionGrade, GM, ReserveBuoyancy)` via table lookup; used for flooding resistance score §13.  
**F-S5 Trim.** `LCG` (longitudinal centre of gravity) vs `LCB` (from `Cb` profile of the hull form). `Trim_bp = (LCG−LCB)/L`; |Trim| > `trimTol` → WARNING (bow/stern heavy), > 2× → CRITICAL.  
**F-S6 Structural stress.** Discretise weight into the 9 zones and buoyancy into the 9 zones using the form's buoyancy distribution; compute cumulative shear, trapezoid-integrate it to bending moment and remove the closing error linearly (the free ship trims to equilibrium); `StressIndex = Mmax / (σ_allow · SectionModulusProxy)` where `SectionModulusProxy = W_hull · D · k_sm` (gameplay proxy). `StressIndex > 10 000` CRITICAL; > 13 000 BLOCKING. States hogging vs sagging for diagnosis.  
**F-S7 Seakeeping score** (gameplay): from freeboard/L, bow flare class, GM, pitch-period proxy; output in bp and used by region profile (North Atlantic vs sheltered).

---

## 12. Armour and survivability

### 12.1 Armour scheme (data + variant)
Regions: `BELT_MAIN, BELT_UPPER, BELT_ENDS, DECK_MAIN, DECK_SLOPE, TURRET_FACE, BARBETTE, CONNING_TOWER, MAGAZINE_BOX, SPLINTER_PLATING, TORPEDO_BULKHEAD, TORPEDO_BELT`. Each region has `thickness (µm)`, `lengthStations (extent)`, `heightMm`, `armourMaterialId` (iron, compound, nickel steel, face-hardened, …), `obliquityDeg` where relevant.

**F-A1 Armour weight.** `W_region = ρ_steel · Area_region · thickness · k_backing · k_fixings`, `Area` from hull geometry & extent; `ρ_steel = 7 850 kg/m³`. Material gives an *effective thickness multiplier* `eff(mat, maturity)` (data) used in protection, not in weight.  
**F-A2 Protection effectiveness (design-level).** For each region and each **reference threat** (`ThreatProfile` data: gun calibre, shell type, era), compute `PenMargin_bp = 10 000 × (eff·thickness·cosObliquity − penetration(threat, range band)) / penetration` clamped to [−10 000, +10 000]. This is a *design-time protection diagram input*, **not** the combat resolver. The compiler only emits `normalizedArmorUm` etc. as already consumed by combat. A new field `survivabilityProfile` is additive.  
**F-A3 Coverage.** `Coverage_bp = (length of belt over machinery+magazines)/(length of those spaces) ×10 000`; citadel completeness; uncovered critical spaces → validator.  
**F-A4 Magazine protection.** Each magazine has `ProtectionLevel` = min over (belt, deck, bulkhead) margin vs. design threat. Below 0 against the requirement's expected adversary → WARNING `MAGAZINE_UNPROTECTED`; below −5 000 bp CRITICAL.  
**F-A5 Underwater protection.** Torpedo bulkhead depth, liquid-loading, coal bunker value; yields `UnderwaterResistance_bp` vs torpedo warhead class (data).  
**F-A6 Flooding resistance.** `FloodingResistance_bp = f(subdivisionGrade, reserve buoyancy, watertight compartments, damage control equip, crew)`.  
**F-A7 Fire risk.** `FireRisk_bp = Σ(flammable-stowage tags) − DC − compartmenting` (fuel type, aviation fuel, wooden fittings in early eras).  
**F-A8 Magazine vulnerability.** `MagVuln_bp` by magazine-adjacency to boilers/torpedo tubes, flash protection tech, and ARR-MAG distance.  
**F-A9 Concentration.** Critical-system concentration index (§8.3) feeds `SurvivabilityProfile`.

### 12.2 Trade-offs enforced
Heavy armour: weight → KG ↑ if high-placed → GM ↓; draught ↑; speed ↓; cost ↑. Thin-but-extensive vs thick-but-short: both are legitimate; the requirement's expected adversaries decide which is "right".

---

## 13. Sensors, fire control, electronics

- **Fire control** (`DIRECTOR, RANGEFINDER, COMPUTER`): provides `accuracyFactor(maturity)`, needs height (topweight), crew, power, and communications; directors have mutual interference flagged by position (ARR-DIRECTOR-SMOKE).  
- **Compatibility:** each gun component declares `fcClass` list; a gun without a compatible director gets `localControlPenaltyBp` (applied to the development combat-value metric, and exposed as a WARNING `FC_INCOMPATIBLE`).  
- **Radar / sonar / comms**: same schema (power, cooling, mass at height, volume, crew, reliability, maintenance, `requires`). Their *effect* is a capability tag consumed by combat via data; SB-1 only certifies the ship carries and powers them.  
- **Topside load** from sensors is added to the KG calculation (F-S1) at the declared mounting height.

---

## 14. Design validation

### 14.1 Findings
```ts
interface Finding {
  id: ReasonCode;                       // extends DESIGN-21 §28 code list (additions registered in the same list)
  severity: "BLOCKING"|"CRITICAL"|"WARNING"|"ADVISORY";
  what: string;       // what failed
  why: string;        // the computed values that caused it
  consequence: string;// probable gameplay effect
  remedies: Remedy[]; // ≥ 2 for WARNING+, ≥ 3 for BLOCKING; each carries a quantified preview delta
  evidence: { formulaId: string; inputs: Record<string,number>; threshold: number; value: number };
}
```
Messages are template strings from `content/messages/*.yaml` with parameters. A rule without all four fields fails content lint.

### 14.2 Rule set (minimum)
| Area | Rule ids | Highest severity |
|---|---|---|
| Displacement | `OVERWEIGHT_*`, `HULL_BUOYANCY_MISMATCH` | BLOCKING |
| Stability | `STABILITY_CAPSIZE` (BLOCKING), `STABILITY_LOW` (CRITICAL), `STABILITY_STIFF`, `STABILITY_MARGIN_THIN`, `TRIM_BOW_HEAVY`/`TRIM_STERN_HEAVY` | BLOCKING |
| Reserve buoyancy | `LOW_RESERVE_BUOYANCY` | CRITICAL |
| Structure | `STRUCTURAL_FAILURE_RISK`, `HULL_DIMENSION_RANGE` | BLOCKING |
| Machinery | `SPEED_OUT_OF_RANGE`, `NO_PROPULSION`, `PLANT_SIZE_RANGE` (BLOCKING); `PLANT_INSUFFICIENT` (V_max < required speed), `HULL_DRIVEN_BEYOND_FORM` (WARNING: a brief the ship fails is a role compromise, not an unbuildable ship) | BLOCKING |
| Endurance | `RANGE_BELOW_REQUIREMENT`, `FUEL_VOLUME` | WARNING |
| Armour coverage | `CITADEL_INCOMPLETE`, `ARMOUR_INEFFECTIVE_VS_ADVERSARY` | WARNING |
| Magazine | `MAGAZINE_UNPROTECTED`, `ARR-MAG-*` | BLOCKING/CRITICAL |
| Weapon arcs | `ARC_OBSTRUCTED` | WARNING |
| Fire control | `FC_INCOMPATIBLE`, `DIRECTOR_INTERFERENCE` | WARNING |
| Electrical | `POWER_SHORTFALL`, `COOLING_SHORTFALL` | CRITICAL/WARNING |
| Crew | `ACCOMMODATION_SHORT` | CRITICAL |
| Dockyard | `NO_FACILITY_FITS`, `EXCEEDS_SLIPWAY_*` | BLOCKING |
| Technology | `TECH_UNAVAILABLE`, `COMPONENT_OBSOLETE` | BLOCKING / ADVISORY |
| Treaty/policy | `TREATY_LIMIT_*` | BLOCKING |
| Capacity | `CAPACITY_INSUFFICIENT_FOR_SCHEDULE` | WARNING |
| Cost | `COST_CEILING_EXCEEDED` | BLOCKING if hard cap, else WARNING |
| Modernization | `MODERNIZATION_MARGIN_LOW` | ADVISORY |

### 14.3 Gate
Only a design with **zero BLOCKING findings** can produce a `CompiledDesignVersion` and enter construction (invariants I3, I4).

### 14.4 Remedy generator (overweight, e.g.)
Deterministic ranked list: (1) reduce displacement-heavy category by the smallest step that clears the finding; (2) swap in lighter component of the same category available in tech; (3) lengthen hull (cost/stress trade); (4) cut speed by 1 kn: Δ saving shown; (5) reduce margin/reserve (shows the consequence). Each remedy is **previewed** by recompiling in preview mode and showing the finding delta. Ordering: by (estimated requirement-fit loss ascending, then id).

---

## 15. Cost, construction, shipyards, industrial capacity

### 15.1 Cost
**F-C1** `Cost = Σ component costs(maturity) + HullCost + Overheads`;  
`HullCost = W_hull_t · costPerTonne(material) · complexity(hullForm, subdivision, SLR)`.  
First-of-class premium (+ `firstOfClassBp`), design-study cost (DESIGN-21 §3, existing), derived-class discount (existing §18). Everything integer budget micro-units; all multipliers in bp with named rounding.  
**Monthly maintenance** `M = Σ component.maintenance.monthlyBp × cost + hull age term + fuel-type surcharges`, scaled by reliability deficit and accommodation level.

### 15.2 Construction work
**F-C2** `Work_total = Σ component.complexity + hullWork(W_hull, SLR, subdivision)`, times `techMaturityMultiplier` and `firstOfClassMultiplier`. Compiled design stores `Work_total` and its split across **work packages** (DESIGN-23 §18):

| Package kind | Gate (what it needs) | Production lines |
|---|---|---|
| `DESIGN_FINALISATION` | paid design study | design office |
| `KEEL_AND_HULL` | slipway large enough | slipway |
| `ARMOUR_FABRICATION` | armour plant capacity, material | armour_plate |
| `HEAVY_ORDNANCE` | heavy-gun line, material | heavy_gun |
| `MACHINERY` | engine works | machinery |
| `LAUNCH` | after ≥ launchFractionBp of hull+armour progress | slipway→fitting-out quay |
| `FIT_OUT` | quay, crane lift ≥ heaviest item | quay |
| `TRIALS` | after fit-out | none (randomised, §15.5) |
| `ACCEPTANCE` | trials pass | none |

Hull work cannot begin before the slipway is free and big enough; armour/guns/engines are **manufactured in parallel** at national or foreign works and arrive as **delivery events** with their own queue (DESIGN-23 §19 package ordering and parallelism). A late gun mount delays `FIT_OUT`, not `KEEL_AND_HULL`.

### 15.3 Capacity
Monthly progress per package = `min(paid work, capacityAvailable(facility, line), workforceFactor, materialAvailability)`. Contention is resolved in priority order from the existing `DockyardProject` priority; ties by `projectId` (deterministic). Parallel construction uses the slipway count of the facility. Delays and halts follow DESIGN-23 §7.

### 15.4 Revisions during construction (when changes are cheap vs ruinous)
`p = completedHullWork / totalHullWork` at the time of the change request.

| Tier | Condition | Effect |
|---|---|---|
| T0 *Free change* | `p < 5 %` and no armour/engine ordered | no penalty; new design revision (re-compile, restart schedule share) |
| T1 *Revision* | `p < 25 %`, change touches non-structural items | + rework work = `reworkBp × affected package progress`; delay ≥ 1 month |
| T2 *Redesign* | `p < 50 %` or hull geometry/engine/main armament change | study cost × `redesignBp`, hull work progress is **reduced** by `keptBp`, delay `ceil(...)` months |
| T3 *Reconstruction* | `p ≥ 50 %` or post-launch | no longer a revision: treated as a `REBUILD`/`CONVERSION` project on the launched hull (DESIGN-23 §20–22), or cancel (DESIGN-23 §23) |

Thresholds in `balance/construction.yaml`. A completed ship always references the **approved** compiled design version plus its list of accepted revisions (invariant I7).

### 15.5 Trials and acceptance (the only seeded randomness)
At `TRIALS`, a seeded draw (stream `shipbuilding.trials:<projectId>`, logged) from `@bluewave/random` determines: achieved speed within `[−spdLossBp, +0]` of design depending on reliability/maturity/overweight; endurance trial pass; any **latent defects** (reuse DESIGN-23 §10–16 mechanism rather than creating another). Acceptance requires zero unfixed `BLOCKING` trial results; otherwise the ship goes to `REPAIR`/`REBUILD`. Validation never depends on trial rolls.

---

## 16. Refits, reconstruction, conversion

### 16.1 Refit kinds
| Kind | DESIGN-23 project type | Typical touches |
|---|---|---|
| `MAINTENANCE_REFIT` | `REPAIR` | restore condition, reliability; resets hull-age fouling |
| `SENSOR_FC_UPDATE` | `EQUIPMENT_INSTALLATION` | directors, rangefinders, radar |
| `AA_UPGRADE` | `EQUIPMENT_INSTALLATION` | AA/DP weapons, fire control, ammunition |
| `MACHINERY_REFIT` | `REBUILD` | boilers/engines/fuel type |
| `REARMAMENT` | `REBUILD` | replace gun mounts, magazines |
| `ARMOUR_MODIFICATION` | `REBUILD` | add/remove plates, bulges |
| `AVIATION_CONVERSION` | `CONVERSION` | hangars, catapults |
| `MAJOR_RECONSTRUCTION` | `REBUILD` | new superstructure/machinery/armament combined |
| `ROLE_CONVERSION` | `CONVERSION` | change category (e.g. cruiser→training/depot) |

### 16.2 Refit compile
A refit is a **diff** on a ship's current `CompiledDesignVersion`: `RefitPlan{ removed[], added[], changedParams[] }`. The same compile pipeline runs on `base − removed + added`, then **refit-specific validators** run: 

1. Mass: `Δ_new ≤ Δ_hull_limit` and the change is within `growthReserve`; else `REFIT_OVERWEIGHT` BLOCKING (list of remedies: remove X, decline Y).
2. Volume & footprint in the target zone (ARR-*).
3. Stability recomputed with new `KG` (older hull may now fail).
4. Power & cooling & crew.
5. Structural compatibility: `SI` recomputed with actual hull age; mounts above `structuralAddLimit` for the hull form are `REFIT_STRUCTURE_LIMIT`.
6. Remaining service life ≥ `minRemainingLifeForRefit(kind)`.
7. Shipyard: dock size and crane lift; `NO_FACILITY_FITS`.
8. Time out of service and cost; **cost vs replacement** ratio shown; if `refitCost/replacementCost ≥ uneconomicalBp` → WARNING `REFIT_UNECONOMICAL`; ≥ `uneconomicalHardBp` → BLOCKING (policy: unless forced by treaty).

### 16.3 Preventing unlimited upgrades (finite hull budgets)
Each `IndividualShip` stores `GrowthBudget` and `HullFatigue`:
- `GrowthBudget` starts as `growthReserveBp × Δ` + hull-form `baseGrowthBp`; each refit **consumes** it by the net mass added (and a bit by stripped-out mass because old fittings leave holes in hull strength).  
- `HullFatigue_bp` increases per service month and per major reconstruction and with heavy-weather duty; above a threshold the hull cannot take `REBUILD`-class refits (`HULL_WORN_OUT`); only scrapping, harbour role or `ROLE_CONVERSION`.
- Every successive `MAJOR_RECONSTRUCTION` multiplies cost by `reconstructionRepeatBp`.
- Technology cap: some component classes (e.g. radar mounting needs power > hull's generator-upgrade headroom) cannot fit regardless of mass.

### 16.4 Exploit guard
A refit cannot be used to dodge the design-study or treaty rules: if the refit's *derived design* differs by more than DESIGN-21 similarity thresholds from the original, it creates a new `DesignFamily` member (DESIGN-21 §17) and treaty displacement/gun-calibre limits are re-evaluated.

---

## 17. Revisions, class variants, history

- Draft edits: `DraftEdit` commands (`SetHullDim`, `PlaceComponent`, `MoveComponent`, `RemoveComponent`, `SetArmour`, `SetParam`, …) appended to a per-draft log; undo/redo moves a cursor; the draft is the fold of the log up to the cursor. Log is persisted (up to cap N=500 per draft; then compacted into a snapshot).
- Revisions: submitting creates a compiled version; a subsequent change from it creates a draft with `parentCompiledDesignId`.
- Variants: "Generate derivative design" → draft with the parent id. DESIGN-21 §9–17 similarity decides same family (cheaper study) vs. new family.
- Automatic naming: class name from nation naming scheme data (`naming/<nation>.yaml`); version label `<Class> Mk<N>` for family members; revision label `r<K>` for draft revisions.
- History view: DAG of family members, with each node's diff summary (weight deltas by category, speed, armament, cost).

---

## 18. AI ship design

### 18.1 Interface
```ts
generateCandidates(ctx: AiDesignContext, seed: Seed, n: number): Result<ReadonlyArray<Candidate>, AiDesignError>
interface AiDesignContext {
  nationId; doctrineId; month; availableTechs; budget: Micro; facilities: Facility[];
  expectedEnemies: ThreatProfile[]; fleetComposition: FleetSummary; missions: MissionNeed[];
}
```
It reads the same `ComponentDef` set, the same `compileDesign` and the same validator. No hidden bonuses. A candidate that has any BLOCKING finding is discarded before being returned (test AC-9).

### 18.2 Algorithm (deterministic, seeded, logged)
1. **Archetype seeds** (data): `CONSERVATIVE`, `BALANCED`, `AGGRESSIVE_HIGH_RISK`, `LOW_COST_MASS`, `LONG_RANGE`, `UPGRADE_ORIENTED`. Each is a weight vector over the requirement-fit terms plus constraints (e.g. LOW_COST: cost cap tight, tolerance for lower fit; UPGRADE: `growthReserve` high; AGGRESSIVE: `speed/gun` weight high and margin low).
2. **Construction heuristics** (doctrine-driven rules produce a first feasible design: hull proportions from category priors, plant sizing from F-M1, armour from threat-based scheme, etc.).
3. **Local search** (hill-climb / simulated annealing with seeded RNG, N=200–2 000 compile calls per candidate, bounded by a per-call budget) over the `DraftEdit` neighbourhood; objective = archetype-weighted requirement-fit − penalties for findings (WARNING counts, CRITICAL strongly).
4. **Diversity selection:** from the pool, greedily choose candidates maximising minimum feature-distance (feature = displacement, speed, range, armament mass, armour mass, cost, growth reserve) so results are meaningfully different.
5. Output includes the *explanation* for each candidate (why it differs) and its findings.

### 18.3 Fairness
AI calls go through the same preview compile path and the same technology/capacity queries. Doctrine modifies only **objective weights and priors**, never formulas.

---

## 19. Persistence and versioning

- Designs, studies, compiled versions, families and refit plans are stored in the campaign snapshot (existing `CompiledDesignVersion` slot); draft work and edit logs live in the **UI-state sidecar** (ADR-0038) until submitted, so the authoritative snapshot hash does not churn on draft edits.
- Content is versioned: `contentPackVersion`, `ruleVersion` (balance files), `compilerVersion`. A compiled design stores all three plus the component-definition hashes it used (DESIGN-21 §4 already requires versions).
- **Schema migrations:** `SchemaVersion` field on each persisted record; forward-only migration functions with golden fixtures per version; unknown future version → typed error, never silent downgrade.
- **Canonical JSON & hashing:** sorted keys, integers only (no floats anywhere in persisted state), SHA-256 as DESIGN-21 §27.
- Save/Load of designs standalone: `.bwdesign.json` export (single draft or compiled design + the component hashes) with import validation re-running the compile; mismatch of component hashes → import with a `CONTENT_DRIFT` warning, recompile required.

---

## 20. UI information architecture (original; "Drawing Board")

Desktop app (Electron), following ADR-0058 (release UI hides engine detail) and ADR-0059 UX decisions, clone *features*, not layout.

**Layout:** three columns, not a copy of any existing layout.
- **Left: "Workbench rail"**: the 7 stages (Brief → Hull → Arrangement → Protection → Systems → Review → Submit) with a finding badge per stage; below it the **Catalogue drawer** filtered by tech/category/zone with "why not available" tooltips.
- **Centre: "Longitudinal board"**: a side profile divided into the nine zones with ruler in metres; components are dropped as cards onto decks; overlays toggle: *weights, volumes, power, arcs, armour, flooding, centre of gravity/buoyancy, blast cones*. Armour has its own plan view and section view in the Protection stage.
- **Right: "Ledger stack"**: collapsible panels: Displacement ledger (stacked bar of the 12 categories, margin & reserve), Space (per zone fill), Power (cases), Stability (GM gauge with window, trim bar, list-on-flood), Performance (speed/range curve chart), Cost & schedule forecast (with package timeline and which facility), Fit-to-requirement (radar chart of requirement vs result).
- **Bottom: "Findings strip"** sorted by severity; each opens the 4-part explanation + remedy buttons showing preview deltas. Remedy click applies a `DraftEdit` (undoable).
- **Top bar:** draft name/version, Undo/Redo, Compare… (side-by-side with an existing class: delta table), Save as new class, Derive variant, History drawer (family DAG), Submit.
- **Accessibility/agent-readability:** every panel is exposed in the ARIA tree, so `pnpm snap` output (`aria.yaml`) can be asserted (AGENTS.md "Viewing the desktop UI").

UI contains no formulas; it calls `previewCompile(draft)` through the desktop bridge (ADR-0030).

---

## 21. Development metric: combat-value estimate (not combat)

`CVE = clamp( wO·Offence + wP·Protection + wM·Mobility + wR·Reliability + wS·MissionSuitability )`,
with each term a 0..10 000 bp score computed from compiled results: Offence from broadside kg·ROF·accuracy; Protection from armour margins & flooding & underwater; Mobility from speed/range/seakeeping; Reliability from `R_plant` and maturity; Mission suitability = distance between result and requirement (§4.1). Weights from `balance/cve.yaml` by category. **Labeled "DEV METRIC: not a combat result" in code, UI and docs.** It is used for AI objective, balance tests and sorting, never for battle outcomes.

---

## 22. Testing strategy

### 22.1 Test kinds
| Kind | Where | Examples |
|---|---|---|
| Unit (formulas) | `packages/ship-design/test/formulas/*.test.ts` | F-H1..F-S6 at min/normal/extreme |
| Boundary | same | speed 6/40 kn, `L/B` bounds, zero armour, 0-gun design |
| Property (fast-check) | `test/properties/*.test.ts` | I1 weights ≥0; I2 ledger sum; monotonic power vs speed; G2 convexity; armour weight monotone in thickness; determinism under permuted placement order |
| Invalid-design | `test/invalid/*.test.ts` | each BLOCKING rule has one failing fixture, asserting code, 4-part message, ≥3 remedies |
| Regression fixtures | `test/fixtures/*.json` + golden hashes | vertical-slice sample designs (golden compiled hash) |
| Serialization round-trip | | draft/compiled/refit plan: encode→decode→equal, hash stable, migration fixtures |
| Determinism | `packages/cross-process-test` | same inputs in two processes → identical hash; same seed → identical trials |
| Construction transitions | `test/construction/*.test.ts` | state machine legal transitions only; progress never negative; revision tiers T0–T3 |
| Refit legality | `test/refit/*.test.ts` | each refit kind × (mass/volume/stability/power/crew/structure/life/yard) failure |
| AI validity | `test/ai/*.test.ts` | for 50 seeds × 6 archetypes, all returned candidates have zero BLOCKING; same seed → same set; candidates are pairwise distinct beyond a distance |
| Content lint | `packages/content-compiler` tests | component schema, tech refs, formula grammar, non-negativity sampled |
| Performance | `test/perf/*.test.ts` | 2 000-component catalogue: preview compile ≤ 25 ms p95 on dev hardware; AI search 1 000 compiles ≤ 5 s |
| UI | `pnpm test:e2e` + `pnpm snap` | design a torpedo boat end-to-end; findings visible; screenshots + aria |

### 22.2 Global invariants (I1–I8)
- I1 No negative component weight (content-lint + property).  
- I2 `Δ_total` = Σ documented ledger lines exactly.  
- I3 An invalid design (≥1 BLOCKING) cannot enter construction (command rejects; state unchanged).  
- I4 Unavailable technology cannot appear in a compiled design.  
- I5 A refit cannot add equipment without mass, volume, crew and power accounting (compile of the refit includes them; test removes any one and expects failure).  
- I6 Construction progress ≥ 0 and non-decreasing except for explicit revision-tier reductions (event recorded).  
- I7 A completed ship references its approved design version and revision list.  
- I8 Identical inputs + seeds → identical outputs and hashes.

---

## 23. Worked example: Torpedo-gunboat "Fleet Screen" (EARLY band, 1893)

**Brief:** category torpedo-gunboat, mission fleet screen, enemy: torpedo boats, speed ≥ 20 kn, range ≥ 2 500 nm @ 10 kn, cost ≤ 450 000 currency-display-units, build ≤ 18 months.

**Hull:** `L=70.0 m, B=8.4 m, T=2.6 m, D=5.2 m, Cb=0.45`, mild steel, form `fine_light`.
- F-H1: `70·8.4·2.6·0.45·1.025 = 705 t` buoyant.
- F-H2 (K_mat 1.00, K_form 0.95, K_sub 1.0; calibrated example value): `W_hull ≈ 262 t` (37 %).

**Machinery:** two triple-expansion engines (data ids illustrative), 4 locomotive boilers, coal.
- F-M1: `Δ^(2/3) = 705^(2/3) ≈ 79.2`; `V=20` → `V³=8 000`; `SLR = 20/√229.7 = 1.32`; assume `C_eff = 165` (form 175, minor SLR penalty) → `P = 79.2·8000/165 ≈ 3 840 shp = 2 864 kW`.
- Plant weight at ~ 38 kg/kW → `W_mach ≈ 109 t` (15.5 %).

**Fuel:** cruising 10 kn → `P(10)` ≈ 3 840·(0.5)^3·1.35 (part-load penalty) ≈ 650 shp; SFC 0.95 kg/shp·h → 618 kg/h. For 2 500 nm: 250 h → 154 t usable ⇒ bunkers 154/(1−0.12)=175 t (**24.8 % of Δ**).

**Armament:** 1×4.7″ QF, 3×6-pdr, 2×3-pdr, 3×14″ above-water tubes with 6 torpedoes: ~ 28 t guns/mounts, 9 t ammo, 14 t torpedoes/tubes. Light protection: 25 mm splinter shield, protective deck 19 mm over machinery: 20 t. Fire control: rangefinder + voice tubes: 1 t. Crew 85: 12 t (+ provisions). Aux 22 t. Margin 4 % of subtotal; no reserve.

**Ledger:** hull 262 + mach 109 + fuel 175 + armour 20 + arm 28 + ammo 9 + torp 14 + sensors 1 + crew 12 + aux 22 = **652 t**; margin 4 % ≈ 26 t; reserve 0 → **678 t**. Target 705 t ⇒ 27 t slack (3.8 %), so valid but with `MODERNIZATION_MARGIN_LOW` ADVISORY.

**Pressure points:**
- Raising speed to 24 kn: `V³` 13 824 → +73 % power; plant + 80 t, fuel for the same range (SLR ↑ → C_eff drop) + 70 t → overweight by ~ 120 t → BLOCKING `OVERWEIGHT_UNRECOVERABLE` (overTol 5 % ≈ 35 t). Remedies shown: cut range to 1 600 nm (−62 t), lighten gun fit (−18 t), lengthen hull by 6 m (+9 t hull, −9 % power), accept diesel/oil plant if tech exists.
- Adding a second 4.7″ gun on the forecastle: arc ok but topweight raises KG; `GM` falls from 0.72 m to 0.55 m (`GM_min` 0.50 for this category) → no finding but ADVISORY "within 10 % of stability limit".

(All numbers are illustrative of formula shape; calibration happens in ticket SB-12 from researched data.)

---

## 24. Exploits, edge cases, failure modes

| Risk | Mitigation |
|---|---|
| **Free-weight exploits:** components with tiny weight but large effect | content lint: effect-per-kg ceilings per category; balance report lists top 10 effect/kg outliers |
| **Margin gaming:** margin/reserve zero to squeeze capability | margin has a minimum by tech maturity; reserve may be 0 but modernization potential then = 0 and refits blocked |
| **Floating-point drift** | integer/fixed-point only; cross-process determinism test; lint bans `Math.random`, `Date`, `Math.pow` in package |
| **Divide-by-zero / empty ship** (no machinery, zero displacement) | explicit BLOCKING `NO_PROPULSION`/`NO_HULL` guards; boundary tests |
| **Formula discontinuities at thresholds** (e.g. `GM_min`) | continuous penalty functions with documented clamps; tests for monotonicity |
| **Arrangement drag-drop absurdity** (all weapons in one zone) | zone footprint caps + concentration + blast cone rules |
| **Component spam** (100 tiny guns) | per-category max count per hull length class + crew + power + fire-control saturation |
| **Refit cycling** (swap parts forever for free credit) | salvage credit capped (DESIGN-23 §26), refit consumes `GrowthBudget`/`HullFatigue` |
| **Treaty dodging via refit or tonnage rounding** | re-check at refit; use kg not rounded tonnes; compare against limits before rounding |
| **AI exploiting preview as oracle with unlimited calls** | AI budget in compile calls per month per nation (data) |
| **Content drift between save and new content** | component hashes in compiled design; `CONTENT_DRIFT` flow (§19) |
| **Performance blow-up** | memoised sub-results by (component, params, maturity) hash; zone-level incremental recompute; perf tests |
| **Randomness leaking into validation** | trials use separate stream; validator's type signature takes no RNG |
| **Unit mix-ups (ADR-0037 incident)** | branded types, no raw `number` across package API, unit-conversion tests |

---

## 25. Acceptance criteria (requirement IDs)

- **AC-1** Every ledger line is non-negative; `Δ_total` equals the sum of the 12 lines for any compiled design (I1, I2).
- **AC-2** An overweight design beyond tolerance yields BLOCKING with cause, consequence and ≥ 3 remedies, each previewed; no value is auto-adjusted.
- **AC-3** Adding a new weapon/engine/armour/sensor requires only YAML; no `src` change; content lint rejects negative/invalid definitions.
- **AC-4** A design using a tech not unlocked for the nation fails with `TECH_UNAVAILABLE` and cannot be compiled.
- **AC-5** Each validation rule in §14.2 has an invalid fixture proving severity, the four message parts and remedies.
- **AC-6** Speed, range, GM, trim, stress, freeboard match golden values for at least five fixture designs; the formulas are traceable to named parameters in `balance/*.yaml`.
- **AC-7** Construction runs through the package phases (§15.2) with parallel manufacture and delivery; no single countdown; invalid design cannot be submitted.
- **AC-8** Revision tiers T0–T3 behave as in §15.4 including conversion to a `REBUILD` project at T3.
- **AC-9** Refit compile accounts for removed/added mass, volume, power, cooling, crew, structure, remaining life, yard, cost-vs-replacement; `GrowthBudget` and `HullFatigue` limit repeated upgrades.
- **AC-10** AI returns ≥ 4 pairwise-distinct valid candidates per request for the six archetypes (when feasible); same seed ⇒ same output; the AI path uses `compileDesign` only.
- **AC-11** Save/load round-trips drafts, compiled designs and refit plans; migration fixtures pass; hashes stable.
- **AC-12** Cross-process determinism: identical compile hash and trial outcomes in two processes.
- **AC-13** Compiled output for a template-imported 1880 design equals what the current campaign compiler produces on the shared fields (no regression for `@bluewave/combat`).
- **AC-14** UI: a player can design, review findings, apply a remedy, undo it, compare with an existing class and submit; `pnpm snap` evidence per screen; console clean.
- **AC-15** CVE is labeled a development metric and is never read by combat.

---

## 26. Implementation backlog (frontier-ordered; each is one vertical ticket for `to-tickets`)

| Id | Slice | Blocked by |
|---|---|---|
| SB-00 | ADR-0063: component-level compiler under DESIGN-21; unit/rounding conventions; fixed-point pow in `@bluewave/deterministic` | none |
| SB-01 | `packages/ship-design` skeleton: branded units, `Finding`, ledger types, formula AST + parser, content-lint for components (no catalogue yet) | SB-00 |
| SB-02 | Hull model F-H1..H5 + ledger + overweight BLOCKING w/ remedies (one hull form, mild steel) → first end-to-end compile of a bare hull | SB-01 |
| SB-03 | Machinery/speed/fuel/range F-M1..M3, 3 propulsion options | SB-02 |
| SB-04 | Zones, placement, volume/footprint rules ARR-OVERLAP/MAG-VOLUME/TURRET-ON-MACHINERY | SB-02 |
| SB-05 | Weapons + ammunition (≥ 10 weapon components), arcs, broadside | SB-03, SB-04 |
| SB-06 | Armour schemes (≥ 4), coverage, magazine protection, underwater, flooding, fire risk | SB-04 |
| SB-07 | Stability/trim/stress F-S1..S7 | SB-05, SB-06 |
| SB-08 | Fire control + sensors + electrical/crew | SB-05 |
| SB-09 | Validator completion (§14.2), remedy generator, messages | SB-07, SB-08 |
| SB-10 | Cost, construction work split, packages, facility fit; integrate with DESIGN-23 `NEW_CONSTRUCTION` | SB-09 |
| SB-11 | Trials/acceptance (seeded), revision tiers T0–T3 | SB-10 |
| SB-12 | Content pass: EARLY-band catalogue from research notes (`docs/research/ship-building-early-band.md`); calibrate coefficients | SB-09 (research can start at SB-00) |
| SB-13 | Persistence: schemas, migrations, `.bwdesign.json`, sidecar draft log | SB-09 |
| SB-14 | Command + engine wiring: `SubmitDesign`, `StartConstruction`, revision commands; template import (AC-13) | SB-10, SB-13 |
| SB-15 | Refit: one type (`SENSOR_FC_UPDATE`), diff compile, legality, growth/fatigue | SB-11 |
| SB-16 | CVE dev metric + balance harness (CLI report) | SB-09 |
| SB-17 | AI candidate generator | SB-16 |
| SB-18 | Desktop "Drawing Board" UI (staged; each stage a ticket) | SB-14 |
| SB-19+ | Expansion across eras: oil/turbines, directors, aviation, radar, AA, missiles (each = content + any new *category* formulas), further refit kinds | SB-15..18 |

Each ticket carries its own tests, per the strategy in §22.

---

## 27. Smallest playable vertical slice

**Era band:** EARLY (1880–1899), the band `scen_1880` actually plays.
**Categories (4):** torpedo boat/gunboat, protected cruiser, coast-defence ironclad, battleship (ids mapped to DESIGN-22; no new class families).
**Propulsion (3):** compound-expansion reciprocating coal; triple-expansion coal with forced draught; water-tube-boiler triple-expansion coal. (Oil/turbine out.)
**Weapons (≥ 10), illustrative classes to be fixed by research:** heavy BL gun (≥ 2 calibres), medium BL/QF (2 calibres), light QF (2 calibres), machine gun, torpedo tube above water, torpedo tube submerged, ram bow fitting (as a hull option).
**Armour (4):** unarmoured, protective deck only, belt-and-deck citadel, full belt with armoured battery, each using the material available (iron/compound/steel).
**Fire control:** rangefinder, voice-tube/fire-control position, basic director-less group control.
**Calculations:** displacement ledger, power/speed, fuel/range, stability (GM/trim), cost.
**Validation:** all BLOCKING rules + the listed WARNINGs.
**Construction:** package model with hull/armour/guns/machinery/launch/fit-out/trials/acceptance; one facility type; T0–T3 revisions.
**One minor refit:** `SENSOR_FC_UPDATE` (rangefinder/fire-control position).
**Persistence:** save/load designs; template import for the 1880 pack.
**Not in the slice:** AI search (SB-17), full UI polish, aviation, radar, missiles, dual-purpose/AA.
**Definition of done:** a player can start 1880, design a protected cruiser against a stated requirement, get BLOCKING/CRITICAL findings with remedies, fix them, pay the study, build it through the package model, receive it after trials, and refit its fire control, all deterministically; AC-1..9, 11–13 hold for this slice.

---

## 28. Files to create / modify

**Create**
- `packages/ship-design/` (`src/units.ts`, `findings.ts`, `ledger.ts`, `formula/{ast,parse,eval}.ts`, `hull.ts`, `machinery.ts`, `zones.ts`, `weapons.ts`, `armour.ts`, `stability.ts`, `validate/*.ts`, `remedies.ts`, `cost.ts`, `compile.ts`, `index.ts`; `test/**`)
- `packages/ship-construction/` (packages, trials, revision tiers) *or* extend `packages/campaign` if ADR-0063 decides against a new package
- `packages/ship-ai/` (candidate generator) later
- `content/production/1880/components/*.yaml`, `content/production/1880/hull-forms.yaml`, `balance/{hull,machinery,armour,construction,cve}.yaml`, `thresholds/*.yaml`, `messages/validation.yaml`
- `docs/adr/ADR-0063-component-level-ship-compiler.md`
- `docs/research/ship-building-early-band.md` (via `research` skill)
- `docs/rules/ship-building-components.md` (normative detail promoted from this spec after acceptance)
- `.scratch/ship-building/issues/NN-*.md` (via `to-tickets`)

**Modify**
- `packages/content-schema` (ComponentDef, HullForm schemas), `packages/content-compiler` (component lint), `packages/campaign/src/compiler.ts` (call `compileDesign`, keep ADR-0037 fields), `packages/commands` (design/revision/refit commands), `packages/phase-engine` (construction package progress), `packages/persistence` (schema + migrations), `docs/rules/ship-design.md` + `docs/rules/construction-repair-and-rebuild.md` (cross-reference only), `.ai/specs/README.md` (pointer), `CONTEXT.md` (new terms: Component, Zone, Ledger, GrowthBudget, HullFatigue), `apps/desktop` (UI, last).

**Working-tree caution.** `packages/campaign`, `commands`, `phase-engine`, `combat` currently have uncommitted changes from other work; SB-14 must rebase onto them.

---

## 29. Open questions (resolved by default unless owner objects)

1. New package vs extending `packages/campaign` → default **new `packages/ship-design`** (pure, no campaign dependency), decided in ADR-0063.
2. Zone count fixed at 9 → default **fixed**; revisit only if the slice shows it is too coarse.
3. Treaty rules enter only as `TreatyLimits` → default **yes**.
4. Is `Math.pow`-free fixed-point acceptable → default **yes**, table-driven with ≥ 1e-6 relative accuracy over the ranges in §9.

**Next implementation action:** run `to-tickets` on this spec to produce SB-00..SB-18, then start SB-00 (ADR-0063 + fixed-point pow check in `@bluewave/deterministic`) and in parallel dispatch the `research` role for `docs/research/ship-building-early-band.md`.
