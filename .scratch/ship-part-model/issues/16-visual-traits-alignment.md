# 16: Visual traits and the render adapter (P6 — gated on the owner's D16 review)

**Type:** implementation
**Status:** resolved
**Blocked by:**
- 09 (resolved)
- External: owner approval of D16 value sets, defaults, derivations and V1–V12 — **approved 2026-10-15** (proposal §8.2 adopted as the contract)
**Frontier:** no
**Requirements:** SPM-R9, SPM-R26 (P6 gate) · Stories 37, 38, 39

## What to build

Drawings are chosen from explicit **visual traits** instead of guessed mount
arrangements.

This ticket **consumes** an approved `visual-traits/1` vocabulary; it does not decide
D16. Do not start until the owner has approved the exact value sets, defaults,
derivations and V1–V12 rules. If any of those is missing or ambiguous at start, the
ticket stays blocked; the implementer does not resolve it. The D16 review blocks only
this ticket, never 01–15.

- `visual-traits/1`: seven traits, each compiler-derived or derived with an authored
  override, with source fields and defaults. Contradiction rules V1–V12 fail the visual
  compile stage.
- The ADR-0148 key rename and translation map preserve every existing drawing.
- Drawing resolution order: part-specific override → trait match → interface-family
  fallback → a visibly marked missing-asset glyph.
- Broadside and central batteries map explicitly to the casemate-family drawings, so they
  never fall to the generic glyph.
- When this ticket resolves, it provides the contract that ship-visualization INC-4
  (plan mount glyphs) consumes: resolved traits per compiled entry, and the drawing
  resolution order above. INC-4's own scope and ticket are not changed here.

## Acceptance criteria

- [x] Non-interference test: a visual-only change leaves every derived metric and
      simulation hash identical.
- [x] Each of V1–V12 has a failing fixture. An unknown trait value fails decoding.
- [x] Ship-visual golden resolution and placement matrices are unchanged through the
      translation map. The nine central batteries resolve to casemate-family drawings.
- [x] `pnpm snap` of the bottom-bar Shipbuilding workspace: screenshot and `aria.yaml`
      checked against these criteria, clean console, no churn warning.

## Comments

- **Owner approval.** Per the owner's instruction in this session, the proposal §8.2
  definitions are adopted as the approved D16 contract; the D16 rows in `proposal.md`
  reflect the approval.
- **Ownership.** `visual-traits/1` is canonical in `@bluewave/content-schema`
  (`src/visual-traits.ts`): closed value sets, ownership, pure derivation, the authored
  `visual.traits` override schema and the V1–V12 rules. `@bluewave/ship-visual` mirrors the
  two rendered value sets (`src/traits.ts`) with a parity test, because the presentation
  package must stay free of the schema package at runtime (SV-R12).
- **Decode (V10–V12).** `PartSchema.visual.traits` accepts one `{ value, reason }` per
  overridable trait; authoring a compiler-derived trait is an excess key, an unknown trait
  or value fails, and a missing reason fails. Diagnostics report at
  `Part.visual.traits.<trait>`.
- **Visual compile stage (V1–V9).** Evaluated on the effective traits (overrides applied)
  in the content-compiler flatten stage; a contradiction fails the build with code
  `VISUAL_TRAIT` and the rule id in the message.
- **Render adapter.** `@bluewave/ship-visual` adds `traits.ts` (the ADR-0148 translation map
  `mountClassOfTraits`, including `battery_port → CASEMATE`) and `resolve-visual.ts`
  (`resolveVisualMount`: override → trait match → interface-family fallback →
  `missing_asset` glyph, emitting `VISUAL_TRAIT_UNMATCHED`). Both golden matrices are
  unchanged; the mount-class-keyed catalog and `resolveMount` are untouched.
- **ADR.** ADR-0162 filed and indexed.
- **Validation.** `content:check` passes on production content; `check:golden` 11/11
  unchanged; the touched packages are green (content-schema 228, content-compiler 135,
  ship-design 1308, ship-visual 94, including both golden matrices). `pnpm preflight` is
  green except a **pre-existing, unrelated** `content-codemod/test/determinism.test.ts`
  permutation timeout (reproduced with this change stashed; it takes ~5.0–5.7 s against the
  5 s default).
- **Snap.** `pnpm snap --save <pkg> --click "Shipbuilding"`: the bottom-bar Shipbuilding
  workspace renders (plan glyphs, profile mounts, bottom-bar metrics); console clean, no
  churn warning (idle structural/attribute mutations 0).


