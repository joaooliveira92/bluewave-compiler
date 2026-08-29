# Decision 01: Scope boundary — smoke module

## Question

What vertical slice of DESIGN-42 §§7-23 (smoke) should C-5 deliver?

## Options

**A. Full smoke module.** All 17 sections (7-23): SmokeCloud model + drift/decay + line intersection + fire-through-smoke + funnel smoke + smokescreen eligibility/generation/cooldown/density/effects + smoke-float tech/capacity/deployment + smoke-generator tech/policy/capacity + source precedence + records/ordering/reason codes. Ships as `packages/combat/src/smoke/` — pure functions, no phase/snapshot wiring. ~10-12 files.

**B. Partial smoke (sections 7-16 only).** Ship funnel smoke + smokescreens only. Defer smoke floats and smoke generators (sections 17-23).

**C. Minimal smoke (sections 7-11 only).** Ship only the core cloud model, drift/decay, line intersection, fire-through-smoke, funnel smoke. Defer all deliberate smoke generation (smokescreens, floats, generators).

## Decision

**Option A.** Smoke floats and generators are core to the DESIGN-42 smoke contract and are small enough (sections 17-22 are ~60 lines total) that deferring creates an incomplete module. The entire smoke section is coherent and ships as one well-defined module. The precedent is C-1 (torpedo full fire-resolution) and C-2 (full mine lifecycle). Smoke module is the natural dependency for fire smoke (DESIGN-41 §25 coupling).