# DESIGN-07: Numeric And Temporal Contract

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-07`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. All authoritative numeric behavior MUST use the representations, operations, scales, overflow rules, and rounding rules defined here. Runtime inference and platform-dependent numeric behavior are prohibited.

## 1. Scope

This contract governs every numeric value and temporal value that can affect:

- authoritative state;
- command validation;
- command reservation;
- simulation resolution;
- event eligibility;
- AI legality and authoritative AI command generation;
- random-outcome mapping;
- classification;
- treaty compliance;
- financial ledgers;
- construction and project progress;
- save, load, replay, migration, and hashing; or
- any derived value used by an authoritative decision.

Presentation-only rendering MAY use other representations only under Section 13.

## 2. Authoritative Numeric Types

Authoritative runtime values MUST use signed or unsigned integers with explicit bit widths. Fixed-point values MUST be stored as scaled integers.

The canonical primitive types are:

- `i32`: signed 32-bit integer;
- `u32`: unsigned 32-bit integer;
- `i64`: signed 64-bit integer;
- `u64`: unsigned 64-bit integer; and
- `i128` and `u128`: intermediate calculation types only, unless a domain contract explicitly declares persisted 128-bit storage.

JavaScript and TypeScript authoritative implementations MUST represent `i64`, `u64`, `i128`, and `u128` operations with `bigint`. The ECMAScript `number` type MUST NOT be used for authoritative integer or fixed-point calculations, comparisons, serialization, hashing, command validation, or state mutation.

An authoritative numeric schema MUST declare:

- `numericTypeId`;
- signedness;
- storage bit width;
- scale numerator;
- scale denominator;
- canonical unit;
- minimum permitted value;
- maximum permitted value;
- default rounding mode for explicit scale conversion; and
- serialization format.

Missing numeric metadata MUST fail schema validation with `NUMERIC_TYPE_METADATA_MISSING`.

## 3. Prohibited Floating-Point Use

Binary floating-point types, including IEEE 754 `float`, `double`, and ECMAScript `number`, MUST NOT determine or alter:

- authoritative state values;
- authoritative branch conditions;
- sorting or tie-breaking used by simulation logic;
- command acceptance or rejection;
- resource reservations;
- random probabilities or random-result mappings;
- pathfinding costs or route legality;
- movement results;
- combat results;
- economic, research, construction, or political results;
- classification or treaty outcomes;
- canonical serialization;
- authoritative hashes; or
- replay verification.

Authoritative code MUST NOT call floating-point transcendental functions, including `sin`, `cos`, `tan`, `atan`, `atan2`, `sqrt`, `log`, `exp`, or `pow` with non-integer exponents.

When a domain requires square roots, trigonometry, interpolation, or nonlinear functions, it MUST use one of:

- a versioned integer algorithm with a declared iteration and rounding contract;
- a versioned fixed-point lookup table stored as canonical content; or
- a versioned piecewise integer formula.

The chosen algorithm or table identifier and version MUST be part of the active ruleset and save compatibility manifest.

Detection of prohibited floating-point participation in authoritative code MUST fail static or runtime validation with `AUTHORITATIVE_FLOATING_POINT_PROHIBITED`.

## 4. Canonical Unit Registry

The following representations are mandatory unless a later owning design contract declares a narrower range while retaining the same canonical scale.

### 4.1 Strategic Time

- type: `i32`;
- unit: campaign month;
- epoch: January 1800 equals month index `0`;
- conversion: `monthIndex = (year - 1800) * 12 + (month - 1)`;
- valid canonical campaign range: January 1800 through December 2199;
- month input range: `1..12` inclusive.

The Bluewave campaign timeline defined by `DESIGN-03` is a valid subrange of this representation.

### 4.2 Tactical Time

- authoritative turn type: `u32`;
- authoritative turn unit: battle minute;
- first unresolved battle minute index: `0`;
- one resolved turn: exactly `60_000` tactical milliseconds;
- internal substep type: `u32`;
- canonical internal substep duration: `1_000` tactical milliseconds;
- canonical substeps per battle minute: exactly `60`.

Every tactical system MUST resolve substeps in ascending substep index. A ruleset revision MAY choose another exact divisor of `60_000`, but it MUST declare `tacticalSubstepMilliseconds`, and `60_000 % tacticalSubstepMilliseconds` MUST equal `0`.

### 4.3 Ship Mass

- type: `i64`;
- stored unit: kilogram;
- scale: `1` stored unit equals `1` kilogram;
- canonical metric tonne: `1_000` kilograms;
- permitted stored range: `0..1_000_000_000` kilograms inclusive.

Display in tons MUST identify whether the presentation unit is metric tonnes or long tons. Classification, dock, treaty, and construction logic MUST use kilograms.

### 4.4 Strategic and Tactical Distance

- type: `i64`;
- stored unit: micrometre;
- scale: `1` stored unit equals `1` micrometre;
- one metre: `1_000_000` micrometres;
- one nautical mile: exactly `1_852_000_000` micrometres;
- permitted magnitude: `0..20_000_000_000_000` micrometres for scalar distance.

Tactical coordinates MUST use signed micrometres with each axis constrained to `-20_000_000_000_000..20_000_000_000_000` inclusive.

### 4.5 Speed

- type: `i64`;
- stored unit: micrometre per second;
- one knot: exactly `514_444` micrometres per second for canonical conversion;
- permitted range: `0..102_888_800` micrometres per second inclusive.

The canonical knot conversion intentionally fixes one knot to `514_444` micrometres per second. All authoritative content import and display conversion MUST use this value.

### 4.6 Armor Thickness

- type: `i64`;
- stored unit: micrometre;
- one inch: exactly `25_400` micrometres;
- permitted range: `0..1_000_000` micrometres inclusive.

Armor comparison, penetration, classification, and treaty logic MUST use stored micrometres and MUST NOT use rounded display inches.

### 4.7 Currency

- type: `i64`;
- stored unit: budget micro-unit;
- one budget unit: exactly `1_000_000` budget micro-units;
- permitted range per posting: `-9_000_000_000_000_000..9_000_000_000_000_000` micro-units inclusive.

Ledger balances and postings MUST use budget micro-units. Presentation MAY display whole or fractional budget units.

### 4.8 Probability and Multipliers

- type: `i32` for stored probabilities and ordinary multipliers;
- stored unit: basis point;
- probability range: `0..10_000` basis points inclusive;
- ordinary multiplier range: `0..100_000` basis points inclusive unless narrowed by the owning contract;
- `10_000` basis points equals `1.0000` or `100%`.

A probability check MUST compare an integer random draw from `0..9_999` inclusive against the probability basis points. The event succeeds exactly when `draw < probabilityBp`.

### 4.9 Angles

- type: `u32`;
- stored unit: angular turn unit;
- one full turn: exactly `4_294_967_296` conceptual units with storage wrapping modulo `2^32`;
- zero: canonical north or domain-declared reference direction;
- clockwise increase: mandatory for tactical headings unless an owning contract explicitly states otherwise.

Angle addition and subtraction MUST wrap modulo `2^32`. Angular comparisons MUST use a named normalized-difference function.

### 4.10 Research Progress

- type: `i64`;
- stored unit: research micro-point;
- one research point: exactly `1_000_000` research micro-points;
- permitted range: `0..9_000_000_000_000_000` inclusive.

### 4.11 Project Work

- type: `i64`;
- stored unit: work micro-unit;
- one work unit: exactly `1_000_000` work micro-units;
- permitted range: `0..9_000_000_000_000_000` inclusive.

### 4.12 Confidence, Unrest, and Similar Bounded Scores

Unless an owning contract declares another canonical scale:

- type: `i32`;
- stored unit: score point;
- permitted range: `0..100` inclusive.

Clamping is prohibited unless the formula definition explicitly declares `CLAMP` and supplies minimum and maximum bounds.

## 5. Formula Definition Contract

Every authoritative formula MUST have a versioned `FormulaDefinition` containing:

- `formulaId`;
- `formulaVersion`;
- ordered input identifiers;
- input numeric type identifiers;
- output numeric type identifier;
- ordered operation specification or implementation identifier;
- intermediate minimum and maximum bounds;
- overflow policy;
- division-by-zero policy;
- rounding mode for every non-exact division or scale reduction;
- clamping policy;
- tie-breaking rule when the formula selects or allocates entities;
- owning design-contract identifier;
- test-vector identifiers; and
- formula content hash.

A formula MUST declare a rounding mode at every operation that can discard a remainder. A formula-level default MUST NOT silently apply to multiple unspecified operations.

A formula with an omitted rounding mode MUST fail ruleset validation with `ROUNDING_MODE_MISSING`.

A formula with an undeclared overflow, division-by-zero, clamp, or tie-breaking behavior MUST fail with `INCOMPLETE_FORMULA_CONTRACT`.

## 6. Arithmetic Evaluation Order

Formula operations MUST execute in the exact declared order. Algebraically equivalent reassociation is prohibited when it could change overflow risk, remainder, or rounding.

Multiplication followed by division MUST use the canonical operation:

`multiplyDivide(a, b, divisor, roundingMode)`

The operation MUST:

1. promote `a` and `b` to a declared wide intermediate type;
2. calculate the exact integer product;
3. reject a zero divisor;
4. calculate quotient and remainder from the exact product;
5. apply the declared rounding mode once; and
6. validate the result against the output range.

Implementations MUST NOT divide either multiplicand before multiplication unless the formula explicitly declares that different operation order.

Summations MUST use canonical input ordering. When inputs are entity-scoped, they MUST be ordered by ascending stable entity identifier unless the formula declares another deterministic order.

## 7. Overflow, Underflow, and Invalid Arithmetic

Silent overflow, silent underflow, and wraparound are prohibited except for the explicit `u32` angle wrapping defined in Section 4.9.

Before every arithmetic operation, the implementation MUST either:

- prove through validated formula bounds that overflow is impossible; or
- evaluate in a wider integer type and range-check the result before narrowing.

The canonical overflow policy is `ERROR`. Saturation and wraparound MUST NOT be used unless a domain formula explicitly declares a bounded-gameplay clamp distinct from machine overflow.

Required failure codes are:

- `NUMERIC_OVERFLOW`;
- `NUMERIC_UNDERFLOW`;
- `DIVISION_BY_ZERO`;
- `VALUE_OUT_OF_CANONICAL_RANGE`; and
- `INVALID_NUMERIC_CONVERSION`.

A failed arithmetic operation MUST NOT partially mutate authoritative state.

## 8. Canonical Rounding Modes

The only permitted authoritative rounding modes are:

- `EXACT`;
- `FLOOR`;
- `CEILING`;
- `TOWARD_ZERO`;
- `AWAY_FROM_ZERO`;
- `HALF_UP`;
- `HALF_DOWN`;
- `HALF_EVEN`; and
- `AGAINST_PAYER`.

Their definitions are:

### 8.1 `EXACT`

The remainder MUST equal zero. A non-zero remainder fails with `INEXACT_RESULT_PROHIBITED`.

### 8.2 `FLOOR`

Return the greatest integer less than or equal to the exact rational result.

### 8.3 `CEILING`

Return the smallest integer greater than or equal to the exact rational result.

### 8.4 `TOWARD_ZERO`

Discard the fractional magnitude.

### 8.5 `AWAY_FROM_ZERO`

If the remainder is non-zero, increase the quotient magnitude by one.

### 8.6 `HALF_UP`

Round to the nearest integer. An exact half rounds toward positive infinity.

### 8.7 `HALF_DOWN`

Round to the nearest integer. An exact half rounds toward negative infinity.

### 8.8 `HALF_EVEN`

Round to the nearest integer. An exact half selects the even integer.

### 8.9 `AGAINST_PAYER`

This mode is valid only for a financial debit with an identified payer.

The debit amount is represented as a non-negative magnitude. If scale reduction has a non-zero remainder, the charged magnitude MUST round upward using `CEILING`. The corresponding payer ledger posting MUST equal the negative of that charged magnitude. The counter-posting MUST balance exactly in the same stored currency unit.

For a refund or credit, `AGAINST_PAYER` MUST NOT be used. The formula MUST declare another rounding mode explicitly.

Rounding behavior MUST be implemented by integer quotient and remainder logic. Conversion to floating point is prohibited.

## 9. Financial Rounding and Ledger Balance

Every financial posting MUST use currency micro-units.

A debit formula MUST identify:

- the payer account;
- the payee or balancing account;
- the exact pre-rounded rational amount;
- the scale conversion;
- the rounding mode; and
- the final charged amount.

Unless a specific financial formula declares another mode, all payer debits MUST use `AGAINST_PAYER`.

The default applies only when the formula definition explicitly references the canonical financial-debit policy `financial_debit_against_payer_v1`. Absence of both a formula rounding mode and this policy reference MUST fail with `ROUNDING_MODE_MISSING`.

For a positive exact debit magnitude `numerator / denominator`:

`chargedMagnitude = ceiling(numerator / denominator)`

The payer posting MUST be `-chargedMagnitude`. Ledger postings for one atomic transaction MUST sum to exactly zero micro-units.

A transaction whose postings do not sum to zero MUST fail with `UNBALANCED_FINANCIAL_POSTING` and apply no ledger mutation.

Accumulated sub-micro-unit remainders MUST NOT be stored in floating point. A domain MAY preserve exact remainder numerators only through a versioned integer remainder-ledger contract.

## 10. Construction and Project Completion

For every project:

- `totalWork` MUST be a positive integer number of work micro-units;
- `completedWork` MUST remain within `0..totalWork` inclusive;
- monthly credited work MUST be a non-negative integer number of work micro-units; and
- work credited in a resolution MUST equal paid effective work after all declared integer calculations and rounding.

Project completion is true exactly when:

`completedWork >= totalWork`

Before applying monthly work:

`remainingWork = totalWork - completedWork`

The applied work for that resolution MUST be:

`appliedWork = min(calculatedCreditedWork, remainingWork)`

The post-resolution value MUST be:

`completedWorkAfter = completedWork + appliedWork`

The completion phase and timestamp MUST be the phase in which `completedWorkAfter` first equals `totalWork`.

A projected fractional completion date, rounded display percentage, scheduled estimate, or calculated work rate MUST NOT complete a project before the authoritative accumulated work reaches `totalWork`.

Excess calculated work beyond `remainingWork` MUST NOT carry to another project unless a separate allocation formula explicitly assigns it before project work is applied.

A project marked complete with insufficient work MUST fail validation with `PREMATURE_PROJECT_COMPLETION`.

## 11. Classification and Treaty Comparisons

Ship classification and treaty compliance MUST compare canonical stored values before presentation rounding.

The comparison operand MUST be one of:

- the authoritative stored integer value; or
- an exact rational value represented by an integer numerator and positive integer denominator when the owning formula has not yet reduced to a stored unit.

A rounded UI value, formatted decimal string, converted display unit, cached label, or approximate value MUST NOT be used as a classification or treaty operand.

Every boundary predicate MUST declare its operator explicitly as one of:

- `<`;
- `<=`;
- `==`;
- `>=`; or
- `>`.

Terms such as `below`, `above`, `up to`, `at least`, and `from ... through ...` MUST be compiled into one of these explicit operators in the owning contract.

If a limit is authored in a display unit, content compilation MUST convert it exactly to the canonical stored unit. A non-exact conversion MUST declare a rounding mode in the content schema. Classification and treaty evaluation then use the compiled canonical integer limit.

A comparison using a presentation-rounded value MUST fail test instrumentation with `ROUNDED_VALUE_USED_FOR_AUTHORITY`.

## 12. Temporal Ordering

Authoritative phases, turns, and substeps MUST use integer indices.

Within one campaign month, phases MUST execute in the canonical phase order defined by the strategic-turn contract. Two records in the same phase MUST be ordered by:

1. declared resolution priority;
2. stable command or event identifier; and
3. stable target entity identifier.

Within one tactical minute, substeps MUST execute in ascending integer index from `0` through `substepsPerMinute - 1`.

Wall-clock time, frame duration, CPU timing, operating-system scheduling, locale, and time zone MUST NOT alter authoritative order or outcome.

Durations MUST use integer counts of their canonical time unit. A partial month MUST NOT be stored for strategic projects. Tactical systems requiring shorter duration MUST use integer tactical milliseconds or the declared fixed substep unit.

## 13. Presentation and Rendering

Rendering, animation, camera movement, charting, and non-authoritative visual interpolation MAY use floating-point arithmetic.

Presentation values MUST be produced from immutable copies or read-only projections of authoritative values. Presentation code MUST NOT hold a mutable reference to authoritative aggregates.

No value produced by presentation floating-point arithmetic may be written back to:

- authoritative state;
- a command payload field interpreted as an authoritative result;
- an authoritative cache;
- an RNG key or ordinal;
- a simulation branch condition; or
- a canonical hash input.

Player input captured in floating-point screen coordinates MUST be converted through a versioned integer quantization contract before command validation. The quantized integer command value, not the screen coordinate, is authoritative.

A rendering frame MUST be discardable without changing any authoritative hash.

## 14. UI Numeric Display and Breakdowns

The UI MAY round values for display, but every displayed authoritative or derived numeric value MUST retain access to a detailed breakdown.

A `NumericDisplayBreakdown` MUST contain:

- value identifier;
- authoritative stored integer value or fog-of-war-safe estimated interval;
- canonical unit;
- display unit;
- scale conversion formula identifier;
- display rounding mode;
- displayed value;
- formula identifier and version for derived values;
- ordered visible inputs;
- ordered visible modifiers;
- unrounded exact rational result when disclosure is permitted;
- authoritative rounding mode;
- final authoritative result; and
- observation date, confidence, and source when fog of war applies.

Display rounding MUST NOT change the stored value. Different localized formats MUST render from the same canonical value.

If a detailed breakdown would expose hidden information, the UI MUST provide a redacted or estimated breakdown consistent with the intelligence contract. It MUST NOT reveal hidden exact inputs through totals, remainder values, sorting, colors, warnings, or tooltips.

A displayed rounded value MUST be labeled with sufficient unit precision to avoid implying greater accuracy than the display provides.

## 15. Serialization and Hashing

Authoritative integers MUST use canonical serialization independent of locale and platform.

Binary canonical serialization MUST use:

- two's-complement representation for signed integers;
- unsigned binary representation for unsigned integers;
- big-endian byte order;
- the exact declared storage width; and
- no optional leading bytes.

Canonical JSON interchange, when required, MUST encode integers outside the safe exact ECMAScript integer interval as base-10 strings matching `^-?(0|[1-9][0-9]*)$`. Leading plus signs, leading zeroes, exponent notation, decimal points, `NaN`, and infinities are prohibited.

Fixed-point values MUST serialize as their stored scaled integer plus a schema-known numeric type identifier. Canonical hashes MUST use the stored integer representation, not formatted decimal text.

Negative zero is prohibited in every authoritative representation.

## 16. Conversion Rules

Conversion between canonical numeric types MUST use a versioned conversion formula.

A conversion MUST declare:

- source type and scale;
- target type and scale;
- exact integer conversion ratio;
- rounding mode when the ratio is not exact;
- permitted source range;
- permitted target range; and
- failure behavior.

Implicit narrowing conversions are prohibited.

Content import from decimal text MUST parse the decimal as an exact signed integer coefficient and decimal scale. It MUST NOT parse through binary floating point.

For example, decimal text `12.75` MUST be interpreted as the exact rational `1275 / 100` before conversion to the target canonical scale.

## 17. Deterministic Allocation

When a fixed integer total is distributed proportionally:

1. compute each exact non-negative rational share;
2. assign the floor of each share;
3. calculate the remaining units;
4. rank recipients by descending fractional remainder; and
5. resolve equal remainders by ascending stable recipient identifier.

Assign one remaining unit to each ranked recipient in order until the total is exhausted.

The final assigned sum MUST equal the original integer total exactly.

Use of iteration order, database order, randomized ties, or localized names as tie-breakers is prohibited.

## 18. Validation and Acceptance

Automated validation MUST prove that:

1. authoritative code does not use binary floating point for state, branching, sorting, validation, resolution, serialization, or hashing;
2. TypeScript authoritative `i64` and wider calculations use `bigint`;
3. every authoritative numeric schema declares type, scale, unit, bounds, rounding, and serialization;
4. every non-exact formula operation declares a rounding mode;
5. formula evaluation order is stable and versioned;
6. silent overflow, underflow, and narrowing are rejected;
7. angle wraparound is the only permitted machine-style wraparound;
8. probability `0` never succeeds and probability `10_000` always succeeds;
9. financial debit rounding always charges the payer the ceiling magnitude under `AGAINST_PAYER`;
10. every atomic financial transaction balances to exactly zero currency micro-units;
11. project completion occurs only when accumulated work equals total work;
12. excess project work cannot create early completion or silently transfer to another project;
13. classification and treaty boundaries use canonical unrounded operands and explicit comparison operators;
14. rendering and UI navigation cannot change authoritative hashes;
15. presentation floating-point results cannot be written into authoritative state;
16. every displayed numeric result provides a permitted detailed breakdown;
17. hidden values remain protected in numeric breakdowns;
18. serialization is byte-identical across supported operating systems;
19. canonical JSON integer strings round-trip without precision loss;
20. deterministic proportional allocation preserves the exact total and stable tie-breaking;
21. identical numeric inputs and formula versions produce identical outputs and hashes; and
22. save and reload preserve every authoritative scaled integer exactly.
