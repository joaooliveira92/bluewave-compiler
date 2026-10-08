# Decision 07: Content constant policy

## Question

How should smoke and damage-control constants be authored?

## Options

**A. Shipped TypeScript constants.** All smoke models, funnel smoke profiles, smokescreen parameters, float/generator specs, fire multipliers, flooding thresholds, and damage-control resource values are shipped as in-code `*_v1` constant sets in `@bluewave/combat`, following the C-1/C-2/C-3/C-4 pattern.

**B. YAML-authored content.** Constants are YAML in the content packs and compiled.

## Decision

**Option A.** TypeScript constants for this sprint. When smoke/damage-control gets phase/snapshot wiring (C-6), the constants can be promoted to YAML content with compiler support. Recorded as an explicit deferral.