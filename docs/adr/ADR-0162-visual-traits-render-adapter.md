# ADR-0162: Visual traits drive drawing selection — the `visual-traits/1` render adapter

## Status

Accepted (2026-10-15). Completes the D16 decision recorded in the ship-part-model
proposal (`.scratch/ship-part-model/proposal.md` §8.2) and the P6 phase of SPM-R26.

## Context

ADR-0148 keyed every ship-visual drawing by **mount class** (`TURRET`, `BARBETTE`,
`SHIELDED`, `OPEN`, `CASEMATE`) derived from the compiled armament mount type. The part
model (ADR-0154) made mounts first-class content with an authored `visual` block, and
D16 fixed a richer, closed **`visual-traits/1`** vocabulary: seven traits, each
compiler-derived or derived with an authored override, with contradiction rules V1–V12.
Drawings must be chosen from those traits instead of a guessed mount arrangement, without
changing any existing drawing (I-14, the presentation boundary).

## Decision

1. **`visual-traits/1` is owned by `@bluewave/content-schema`.** It is the decode and
   compile boundary, so the closed value sets, the pure derivation from source fields and
   the V1–V12 rules live there (`src/visual-traits.ts`) and are exported. This supersedes
   ADR-0148 §1 for the *trait* vocabulary only; `@bluewave/ship-visual` keeps its mirror
   of the two value sets it renders (`test/visual-traits.test.ts` pins the parity), because
   the presentation package must not depend on the schema package at runtime (SV-R12).
2. **Ownership is total.** Four traits are `derived_with_override`
   (`presentation_form`, `enclosure`, `barrel_arrangement`, `deck_relationship`); three are
   `compiler_derived` (`orientation`, `size_class`, `elevation_style`). An authored override
   carries its own non-empty `reason`. Authoring a compiler-derived trait is an excess key
   (V10); an unknown trait or value fails decoding (V12); a missing reason fails (V11).
3. **V1–V9 are evaluated on the effective traits** (after overrides) in the compiler's
   flatten stage, so a contradiction fails `content:check` and an override cannot suppress
   validation (I-26).
4. **The drawing resolution order** in `@bluewave/ship-visual` is: part-specific
   `visual.override` → trait match → interface-family fallback → a visibly marked
   missing-asset glyph (`missing_asset`). An unmatched trait emits
   `VISUAL_TRAIT_UNMATCHED`; a gap is never silent.
5. **The ADR-0148 translation map** (`mountClassOfTraits`) renames the resolver's input to
   traits and maps `(presentation_form, enclosure)` back to the drawn mount class, so every
   existing drawing and both golden matrices are preserved. `battery_port` maps explicitly
   to the `CASEMATE` family, so broadside and central batteries (the nine D17 assemblies,
   mount type `BROADSIDE_BATTERY` → `battery_port`) never fall to the generic glyph.
6. **Presentation only.** No trait feeds fitting compatibility, mass, cost, crew, volume,
   footprint, availability, AI behaviour or combat; adding or changing a `visual` block
   leaves every derived metric and the compiled design byte-identical (I-14).

## Consequences

- A new drawing remains a catalog edit; a new trait value is a `visual-traits` version bump
  and a ruleset change, never a renderer change.
- `@bluewave/ship-visual` gains a thin trait layer (`traits.ts`, `resolve-visual.ts`) and a
  parity test; the mount-class-keyed catalog and its golden matrices are untouched.
- ship-visualization INC-4 (plan mount glyphs) builds against resolved traits and the
  resolution order above; its ticket and scope are unchanged.
