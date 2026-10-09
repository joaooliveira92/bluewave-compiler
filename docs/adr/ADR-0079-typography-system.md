# ADR-0079: Typography system — semantic font roles, user-selectable body font

## Status

Accepted 2026-10-09.

## Context

The renderer shipped three self-hosted variable fonts (`Inter`, `Plus Jakarta Sans`,
`Space Grotesk`) but referenced none of them: `body` hard-coded an operating-system
stack and every "technical" accent used Tailwind's default `font-mono` (the OS
monospace). There was no way to choose the interface face, and no single place
defining what each font is *for*.

## Decisions

1. **Three semantic roles, expressed as Tailwind v4 `@theme` utilities.** Components
   consume `font-sans`, `font-mono` and `font-display` — never a family name directly.

   | Role | Utility | Family | Use |
   | --- | --- | --- | --- |
   | Body | `font-sans` | Inter *or* Plus Jakarta Sans (user choice) | Prose, labels, controls, shadcn/ui |
   | Mono | `font-mono` | Geist Mono | Code, telemetry, audit output, identifiers, aligned tabular digits, `<pre>`, `<code>` |
   | Display | `font-display` | Space Grotesk | Headings, titles, dossier screens, marquees, intentional display type |

2. **The body font is user-selectable: Inter or Plus Jakarta Sans.** A narrow typed
   value (`SansFontPreference = "inter" | "jakarta"`) lives, with its options, storage
   key and validator, in one module (`shell/FontContext.tsx`). Inter is the
   deterministic default when nothing valid is stored; any missing, malformed or
   unsupported stored value falls back to Inter. The preference applies to the whole
   renderer through `<html data-font>` and is renderer-local (like theme, density and
   background) — no IPC, so the Electron security boundary (ADR-0008) is unchanged.

3. **Space Grotesk is never the monospaced font.** It is a proportional grotesk, so it
   must not back `font-mono`. Existing `font-mono` usages were reviewed individually:
   the nation-selection / dossier cluster — which used OS monospace as a *display*
   aesthetic — was migrated to `font-display`; telemetry, audit, identifier, `<pre>`,
   `<code>` and tabular-numeric usages stayed `font-mono`. No blind global replacement.
   `font-mono` therefore points at Geist Mono.

4. **Fonts are self-hosted and offline.** All faces are `@font-face` declarations over
   assets in `src/assets/fonts/`, bundled by Vite with `font-display: swap`. No Google
   Fonts, CDN or other remote service — compatible with the renderer CSP
   (`default-src 'self'`, `src/main/csp.ts`) and the offline packaged build. Family
   names are stable and independent of emitted asset hashes. Variable weight ranges and
   `font-style: normal` are declared accurately; no synthesized bold or italic faces.

5. **Initialization avoids a flash of the wrong face.** `FontProvider` sets
   `<html data-font>` in a layout effect before first paint (the `DensityProvider`
   pattern), so the saved choice is applied without an avoidable Inter→Jakarta flash and
   without an inline script (which the CSP forbids).

## Consequences

- New typography must select a semantic role utility; naming a family directly in a
  component, or adding a legacy `tailwind.config.js`, is a regression.
- Adding a family means adding an `@font-face` (in `styles/globals.css`) and, if it is
  user-selectable, an option in `FontContext.tsx` plus its `[data-font]` mapping — the
  family name lives only in CSS.
- The committed TTF/WOFF2 assets are the source; converting to WOFF2 for the two TTF
  faces is a possible future size optimisation, recorded here as deferred rather than
  silently fetching replacements.
