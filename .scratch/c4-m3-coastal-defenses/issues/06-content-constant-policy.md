# Decision 06: Content constants and policy

## Question

How should coastal-defense constants be authored?

## Options

**A. Shipped TypeScript constants.** All battery models, damage thresholds, and placement defaults are shipped as in-code `*_v1` constant sets in `packages/combat/src/coastal-defense/constants.ts`, following the C-3 `submarine_constants_v1` pattern.

**B. YAML-authored content.** Constants are YAML in the content packs and compiled.

## Decision

**Option A.** TypeScript constants for this sprint. The coastal-defense model is small enough that authored YAML would be overhead without a consumer (no phase/snapshot wiring yet). When phase integration happens (C-4 continuation), the constants can be promoted to YAML content with compiler support. Recorded as an explicit deferral.