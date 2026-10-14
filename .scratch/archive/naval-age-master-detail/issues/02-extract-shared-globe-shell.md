# INC-2 — Extract shared globe shell + slide-panel primitive (with decorative mode)

**Type:** implementation
**Status:** resolved
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

## Answer

- `apps/desktop/src/renderer/components/globe/` (barrel `index.ts`): `GlobeShell`
  and `useSvgGlobe` moved here (git rename) and gained a `decorative` mode /
  `autorotate` option; new `DecorativeGlobe` composes them with no pins, ring,
  drag/zoom/click, `aria-hidden`, `pointer-events-none`, idle spin off under
  `prefers-reduced-motion`. `InteractiveGlobe` imports the shared barrel; its
  behaviour is unchanged. `globeBoundary.test.ts` import-allowlists the module.
- `apps/desktop/src/renderer/components/slide-panel/` (barrel `index.ts`):
  `useSlideVisibility` + `PANEL_TRANSITION_MS` moved here; new `SlidePanel`
  (`overlay` / `inline` placement, `animateOnMount`) is the shared chrome the
  nation dossier now wraps its body in.
- `no-unknown-casts.baseline.json` key renamed for the moved `useSvgGlobe.ts`
  (same four existing assertions; no new ones). `test-setup.ts` gained an
  `IntersectionObserver` stub for jsdom.

## Amendment 2026-10-11

The globe/decorative-composition half of this ticket was **reverted** at the
owner's direction (no globe on the preset step); `GlobeShell`, `useSvgGlobe` and
`InteractiveGlobe` are back in `nation-selection/`, unchanged. The slide-panel
extraction stands (`components/slide-panel/`).
