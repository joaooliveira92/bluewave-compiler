# ADR-0002: Integer Representation and Arithmetic

## Status

Accepted

## Context

The engineering contract requires authoritative outcomes to use integer or fixed-point arithmetic, branded safe-integer unit types, checked arithmetic, explicit bounds, and explicit rounding. Floating-point arithmetic may not alter authoritative state.

## Decision

### Safe integers

- Represent all game integers as `SafeInt` — a branded `number` that is both an integer and within `[MIN_SAFE_INTEGER, MAX_SAFE_INTEGER]`.
- `SafeInt()` constructor rejects non-integers, `NaN`, `Infinity`, and unsafe integers.
- `SafeInt.add`, `sub`, `mul`, `div` are checked and throw on overflow or division by zero.
- `SafeInt.div` requires an explicit `RoundingMode` parameter.

### Checked arithmetic

- `checkedAdd`, `checkedSub`, `checkedMul` are plain `number` utilities that throw on overflow.
- `roundToInt` rounds a `number` to a safe integer using an explicit rounding mode.

### Rounding modes

- `trunc` — truncate toward zero.
- `floor` — round toward negative infinity.
- `ceil` — round toward positive infinity.
- `halfUp` — round toward nearest neighbor, ties away from zero.
- `halfDown` — round toward nearest neighbor, ties toward zero.
- `halfEven` — round toward nearest neighbor, ties to even (banker's rounding).

### Boundary

- `bigint` is deferred until documented bound analysis proves it necessary.
- Rendering code may use `number` floating-point but may not feed it back into authoritative calculations.

## Consequences

- Every arithmetic operation has explicit overflow/rounding semantics.
- AI and formulas must use these primitives, not raw JavaScript arithmetic.
- `SafeInt` brand prevents accidental mixing with plain `number` values.
