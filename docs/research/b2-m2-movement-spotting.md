# Research — B-2 Formation & Movement Constants (M2 Surface Tactical Core)

> Sprint: B-2 (`@bluewave/combat`, DESIGN-38 movement/spotting subset).
> Purpose: ground the authoritative formation/movement constant set that B-2 ships
> as engine versioned constants. This is **reference grounding** (high-trust naval
> reference values), not a normative history; exact shipped constants are tuned
> within `BALANCE TARGET` bounds and recorded as versioned ruleset constants + the
> B-2 ADR. Source markers are indicative; values are representative of standard
> reference tables unless quoted.

## 1. Battle-line / formation spacing

- **Column (line-ahead) spacing:** early-20th-century fleets typically maintained
  station with **~400–500 yards (≈ 366–457 m)** between consecutive ships of a
  division. Dreadnought-era columns often used intervals on the order of one
  ship-length-plus. *(Reference: WWI/Jutland battle-line station-keeping accounts;
  British Grand Fleet signalling/station instructions generally cite separation
  around 400–500 yd; some sources give 500 yd nominal.)*
- **Division interval / column-to-column gap:** 2–4 cables (≈ 370–740 m)
  between divisions/columns of a line of bearing.
- **Station tolerance:** realistic station keeping allows a few degrees of bearing
  error and small distance drift; ships restored to station over one to a few
  minutes at nominal speed.

→ B-2 ships a versioned **formation-station contract**: default column interval,
division gap, and station tolerance (degrees/basis points + distance), with LINE_AHEAD
as the reference formation.

## 2. Speed regimes

- **Standard / cruising speed:** ~15–18 kn for dreadnought-era battle squadrons on
  passage; typical fleet cruise ~17 kn.
- **Flank / maximum speed:** Dreadnought (1906) ~21 kn; super-dreadnoughts and
  fast battleships (Queen Elizabeth, 1915) ~24–25 kn; Kongō-class battlecruisers
  ~27.5 kn. *(Warship data: Brescia; Jane's Fighting Ships era tables; Conway's
  All the World's Fighting Ships.)*
- Speed is stored scaled (knots × 1000 = basis-point knots) per the existing
  `MovementState.orderedSpeed/currentSpeed` integer convention; µm/s conversion is
  a versioned unit constant used only for position integration.

→ Full-speed stress threshold (≥ 9,500 bp of attainable speed) already ships
(`fullSpeedStress.ts`); B-2 keeps it and adds propulsion/acceleration constants below.

## 3. Propulsion & turning

- **Acceleration (thrust):** real dreadnought acceleration from rest to ~20 kn took
  on the order of minutes (low throttle-response); steamships had modest ahead
  acceleration and poorer astern. B-2 models bounded thrust/brake acceleration
  (µm·s⁻² or kn/s scaled) as versioned constants; values are coarsely grounded and
  tuned within balance bounds.
- **Turning / tactical diameter:** late-19th/early-20th-century battleships had
  tactical diameters on the order of **600–1,100 yards at full helm** (rudder
  hard-over), giving low turn rates (≈ 0.5–1.5°/s effective). Battlecruisers with
  finer hulls turned faster. Versioned **turning-rate contract** (deg/s, design-
  dependent) is bounded by design/propulsion inputs with a safety minimum (reused
  by the existing `battleTurnAway` safety predicate).

→ These ground the propulsion + turning constants of B-2 INC-1.

## 4. Visual detection / horizon

- **Distance to visual horizon ≈ 2.08 × √h (h = eye height m) nautical miles**
  (standard geodetic formula) — i.e., ~20–30 km for a typical mast/top elevation
  ~10–25 m, reduced in haze. *(Standard nautical almanac formula.)*
- **Clear-daylight visual detection of a smoke-plume/hull:** on the order of
  8–20 nmi for large surface ships at horizon-limited geometry; detection against
  a smoke plume could be farther. B-2 uses baseline **clear-daylight** detection
  ranges with a neutral visibility multiplier (1.0 baseline); weather/smoke/ECM
  modifiers are deferred to B-5 / M5.

→ Grounds the **sensor/detection contract** of B-2 INC-2 (baseline only).

## 5. Units and scale (determinism)

Per DESIGN-07 and the existing combat scaffolding: all authoritative values are
integer **basis-point / fixed-point**; no `Math.random()`, wall clock, locale, or
filesystem order. Random scatter (if any) uses domain-separated keyed streams
(`battle/ship/sensors/...`). Position coordinates are fixed integers; speed is
integer µm/s or scaled knots; angles are integer degrees. These enforce
byte-identical cross-process hashes without any snapshot schema change.

## Sources (indicative)

- Conway's / Jane's era ship data tables (displacement, speed, LOA for regime calibers).
- Naval signalling / fleet-station-keeping references for column intervals.
- Standard geodetic horizon formula (nautical almanac) for detection range baseline.

> Values above are **reference ranges for the versioned constant contract**, not
> tuned gameplay numbers. Final shipped constants are authored in
> `packages/combat/src` as `*_v1` contracts and may sit anywhere within `BALANCE
> TARGET` bounds with the tuning decision recorded in the B-2 ADR — no human
> decision-request is required for ordinary tuning within those bounds.
