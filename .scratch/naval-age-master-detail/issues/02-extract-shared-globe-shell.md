# INC-2 — Extract shared globe shell + slide-panel primitive (with decorative mode)

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes
**Requirements:** NAM-3, NAM-7; AC-8, AC-15; BW-ARC-001

## What to build

Lift the D3 orthographic **sphere shell + autorotate projection loop**
(`GlobeShell` + `useSvgGlobe`) and the **slide-visibility / panel-chrome**
primitives into shared renderer presentation modules. `InteractiveGlobe` and
`DossierSlidePanel` keep their current behaviour by composing the shared pieces.
Add a **decorative composition** that renders the sphere with no pins, no
drag/zoom/click, marked decorative to assistive tech, reading no authoritative
state and no nation id.

Deliverable: the interactive nation globe and dossier are unchanged, and a
decorative globe composition exists and is covered by an external-behaviour test.

## Acceptance

- [ ] Shared globe shell extracted; `InteractiveGlobe` composes it with pins, selection ring, drag/zoom unchanged; no nation-selection regression.
- [ ] Decorative composition present: no interactive handlers, `aria-hidden` (no `listbox`/`option`/`button` semantics), respects `prefers-reduced-motion`, reads only static world data + theme CSS variables.
- [ ] Slide-visibility / panel-chrome primitive shared; the nation dossier consumes it unchanged; the preset detail panel's body stays preset-specific.
- [ ] No new dependency; no new `as unknown` casts; barrel surfaces respected.
