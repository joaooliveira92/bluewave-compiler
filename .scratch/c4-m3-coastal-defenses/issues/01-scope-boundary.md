# Decision 01: Scope boundary

## Question

What vertical slice of DESIGN-48 should C-4 deliver as a pure value model?

## Options

**A. Full coastal-defense model (model + types + damage + placement + records).**
Shipped in `packages/combat/src/coastal-defense/` as pure functions. Covers: battery definition, land target types, damage state progression, placement rules (zone + seed), and coastal artillery effectiveness as a value-only contribution (no battle integration). Everything that doesn't need the tactical battle context or strategic campaign snapshot.

**B. Minimal shell (types + damage states only).** Ship only the type definitions and damage state enum. Defer everything else.

## Decision

**Option A.** The entire DESIGN-48 can be captured as a pure value model in ~6 files, similar to the `mines/` module's structure. The scope is small enough (48-line doc) that splitting further would create a spec thinner than a single decision ticket. Deferred items (battle participation, campaign consequence application, AA progression) are explicitly marked.