# 16: Visual traits and the render adapter (P6 — gated on the owner's D16 review)

**Type:** implementation
**Status:** open
**Blocked by:**
- 09
- External: owner approval of D16 value sets, defaults, derivations and V1–V12
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

- [ ] Non-interference test: a visual-only change leaves every derived metric and
      simulation hash identical.
- [ ] Each of V1–V12 has a failing fixture. An unknown trait value fails decoding.
- [ ] Ship-visual golden resolution and placement matrices are unchanged through the
      translation map. The nine central batteries resolve to casemate-family drawings.
- [ ] `pnpm snap` of the bottom-bar Shipbuilding workspace: screenshot and `aria.yaml`
      checked against these criteria, clean console, no churn warning.
