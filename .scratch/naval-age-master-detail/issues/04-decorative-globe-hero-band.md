# INC-4 — Decorative globe hero band in the detail column

**Type:** implementation
**Status:** open
**Blocked by:** 02, 03
**Frontier:** no
**Requirements:** NAM-3; AC-8; BW-ARC-001, BW-ARC-002, DESIGN-51

## What to build

Add the **decorative globe band** as the top element of the right detail column,
using the shared shell's decorative composition from INC-2. It is inert: no pins,
no drag/zoom/click, marked decorative to assistive tech, idle spin that respects
`prefers-reduced-motion`, reading no authoritative game state and no nation id —
so it carries the naval-dossier atmosphere without offering a second, confusing
nation picker.

Deliverable: the reworked screen shows the decorative globe above the
focused-preset panel and the forms, and nothing about it implies nation selection.

## Acceptance

- [ ] The decorative globe renders as the detail column's hero band, with no `option`/interactive node and no nation id/pin.
- [ ] It reads no authoritative/campaign module (boundary or import check clean) and exposes no nation-selection semantics.
- [ ] It respects `prefers-reduced-motion` and offers no second nation-picker affordance.
- [ ] An external-behaviour test covers the decorative contract (non-interactive, hidden from assistive tech).
