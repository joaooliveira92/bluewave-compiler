Type: task
Status: resolved
Blocked by: 01

## Question

Reconstruct the missing styling foundation the `components/ui/` kit assumes:
a Tailwind CSS setup (config + PostCSS wiring into `electron-vite`'s renderer
build) and a minimal design-token file (colors, spacing, radii, the easing
curves `lib/ease.ts` already references via its `globals.css` comment) —
since no such source exists elsewhere to copy from (confirmed during
charting: no Tailwind config, no `globals.css`, anywhere in the tree).

Scope: only enough tokens to support whichever components ticket 01
("Component Mapping") selects — not a full design system. Reasonable
defaults/judgment calls are expected here (this was explicitly left to
implementation during charting, not a design decision needing further
grilling).

## Answer

No external token source was provided, so `src/renderer/src/styles/globals.css`
uses the standard shadcn/ui "neutral" light-mode token set (Tailwind v4
`@theme` block, OKLCH colors) — `background`, `foreground`, `card`,
`primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`,
`ring`, plus `--radius`. Scoped to exactly the tokens the 7 adopted
components (ticket 01) reference — no dark-mode variant, no typography
scale, no motion tokens (none of the 7 use `lib/ease.ts`). Only Tailwind's
own utility classes plus this token block; no separate PostCSS config needed
since `@tailwindcss/vite` handles that internally.

