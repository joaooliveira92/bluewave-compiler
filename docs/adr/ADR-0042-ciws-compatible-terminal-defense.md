# ADR-0042: CIWS "Compatible Terminal Defense" Requires Declared MEDIUM-ASM Capability

## Status

Accepted (2026-08-31)

## Context

D-4 (Air Defense, DESIGN-45) ships the pure AA air-defense module in
`@bluewave/combat/src/air-defense/`. The §18 attack-layer matching matrix
(`docs/rules/air-defense.md` lines 311-318) defines which defense layers may
engage which attack classes:

- **heavy ASM** (line 311): `CAP`, `HEAVY_SAM`, `MEDIUM_SAM`, and *explicitly
  capable* `CIWS_TERMINAL_DEFENSE`;
- **medium ASM** (line 312): `CAP`, `HEAVY_SAM`, `MEDIUM_SAM`, `LIGHT_SAM`, and
  *compatible terminal defense*;
- line 318: "A defense layer absent from the attack's explicit eligibility set
  MUST NOT engage it."

The phrase "compatible terminal defense" for medium ASM is ambiguous: it does not
say "explicitly capable" the way the heavy-ASM row does. Reading it as an
open invitation for every CIWS to engage medium ASM would contradict line 318's
fail-closed principle and would make the CIWS layer engage a class it has not
declared any capability for.

INC-2 sanctioned "CIWS-compatible terminal defense" and its reviewer asked that
both the heavy- and medium-ASM CIWS rows be wired through the
`REQUIRES_EXPLICIT_CAPABILITY` gate so the attack type must be present in the
CIWS system's `profileEligibility`.

## Decision

CIWS terminal defense engages **heavy ASM** and **medium ASM** only when the
CIWS system's `profileEligibility` explicitly declares the attack type
(`"HEAVY_ASM"` / `"MEDIUM_ASM"`). In `layer-resolution.ts`:

- `"CIWS_TERMINAL_DEFENSE:HEAVY_ASM"` and `"CIWS_TERMINAL_DEFENSE:MEDIUM_ASM"`
  are added to `REQUIRES_EXPLICIT_CAPABILITY`;
- the §18 eligibility predicate (`checkSystemEligibilityForLayer` step 3) already
  fails closed when the pair is required but absent from
  `system.profileEligibility`, so no CIWS engages either class without a declared
  capability.

Interpretation: "compatible terminal defense" (§18 line 312) means a CIWS whose
`profileEligibility` includes `"MEDIUM_ASM"`. A CIWS without that declared
capability is NOT compatible and MUST NOT engage medium ASM.

## Consequences

1. CIWS eligibility for heavy and medium ASM is fail-closed: engaging either
   class requires the explicit capability declaration in `profileEligibility`.
2. Attack types that are always CIWS-eligible under §18 (aircraft delivery
   profiles and `LIGHT_ASM`) are unaffected — they are not in
   `REQUIRES_EXPLICIT_CAPABILITY`.
3. The `terminalProfile` field was added to `AirDefenseAttack` (§4 line 84) as a
   typed union of deterministic string literals, required by the strict Zod
   schema, so terminal-profile data is present and fail-closed.
4. Determinism and safe-arithmetic are preserved: the speed conversion uses
   `SafeInt.div(SafeInt.mul(...), SafeInt(3600), "floor")` instead of
   `Math.floor(Number(...) * ... / 3600)`.

## Compliance

- **ENGINEERING-CONTRACT.md**: strict Zod boundaries, branded integers, explicit
  rounding, fail-closed domain decisions.
- **DESIGN-45 §4, §16, §18** (`docs/rules/air-defense.md` lines 311-318).
- **Ticket INC-2** (`.scratch/d4-m4-air-defense/issues/02-layer-resolution-eligibility.md`).
