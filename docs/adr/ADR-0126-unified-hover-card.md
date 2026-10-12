# ADR-0126: One hover popover — the ReUI hover card (Base UI PreviewCard) replaces the tooltip

## Status

Accepted 2026-10-11.

## Context

The renderer carried **two hover popovers built on the same Base UI floating
machinery**: `components/ui/tooltip.tsx` (`Tooltip`, Base UI `Tooltip`) used in
~16 places for short labels and explanations, and `components/ui/hover-card.tsx`
(`HoverCard`, Base UI `PreviewCard`) used in ~9 places for rich stat breakdowns
and panels. They looked and behaved differently (different padding, radius,
surface, delay defaults, and default placement), so "hovering something" was two
visual languages. The brief was to make every hover effect use the ReUI hover
card.

Base UI documents a hard semantic difference between the two primitives: a
**tooltip** is announced to assistive tech (`role="tooltip"`, wired through
`aria-describedby`), while a **preview card's content is a visual progressive
enhancement for sighted mouse and keyboard users only** — it is deliberately not
screen-reader navigable, and the trigger's own accessible name is meant to carry
the meaning.

## Decision

1. **One component.** `components/ui/hover-card.tsx` is the only hover popover.
   `components/ui/tooltip.tsx` is deleted; every `Tooltip`/`TooltipTrigger`/
   `TooltipContent`/`TooltipProvider` usage becomes the `HoverCard` equivalent.
   `TooltipProvider` has no analogue — per-trigger `delay`/`closeDelay` replace
   it (the wrapper defaults to a ReUI-style `100`/`100`).
2. **ReUI/shadcn base-nova styling.** `HoverCardContent` adopts the ReUI
   anatomy: `w-64`, `rounded-lg`, `bg-popover`, `ring-1 ring-foreground/10`,
   `p-2.5 text-sm`, `origin-(--transform-origin)`, side-aware
   `slide-in-from-*`, and `alignOffset` support. It keeps the app's shared
   `FLOATING_LAYER` (`z-[60]`) stacking and the detached-handle / `anchor` /
   `collisionPadding` props the dossier and hull-plan cards already rely on.
3. **Two densities, one component.** Rich content uses the default/wide card.
   One-line labels opt into a compact variant through classes
   (`w-auto max-w-64 px-3 py-1.5 text-xs`) — the old tooltip's footprint, now
   rendered by the same component.
4. **Accessibility is preserved at the trigger.** Because preview-card content
   is not announced, the trigger must carry the essential information in its
   accessible name. Every migrated trigger already had visible text or an
   `aria-label`; none is left with a nameless icon.

## Consequences

- Hovering anything in the app opens the same ReUI-styled card; the two
  competing looks are gone and `tooltip.tsx` no longer exists.
- Keyboard focus still opens a card, but only when the trigger matches
  `:focus-visible` (Base UI's rule) — mouse-click focus does not pop a card.
- Screen readers no longer hear the short explanation that used to ride on a
  tooltip; it is supplementary text whose meaning is on the trigger. This is the
  accepted cost of the directive, and it matches Base UI's documented contract.
- The ReUI motion classes are adopted verbatim. The repo has no `tw-animate-css`
  (and none of the existing popovers resolve `animate-in`/`slide-in-from-*`), so
  the enter/exit motion remains inert exactly as it already was for popovers,
  menus, and the previous hover card — not a regression, but a known gap.
- The `showDetailedTooltips` display preference ("Expanded stat breakdowns on
  hover") is still unwired and unchanged by this ADR.

## Alternatives considered

- **Keep `Tooltip` for one-line labels, convert only the rich cards.** Rejected:
  the directive was to standardise every hover popover, and the duplication was
  the problem.
- **Keep both components, restyle `Tooltip` to match.** Rejected: leaves two
  primitives, two APIs, and two providers for one visual result.
- **Build the compact variant as a separate `Tooltip`-shaped wrapper over
  `PreviewCard`.** Rejected: a second public surface for what is a class string.
- **Add `tw-animate-css` to make the ReUI slide animations real.** Deferred: it
  would re-animate every popover in the app, beyond this change's scope.
