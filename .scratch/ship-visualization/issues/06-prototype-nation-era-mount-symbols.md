# Prototype: a nation×era gun-mount symbol set in the side profile

**Type:** prototype
**Status:** resolved
**Blocked by:** 05

## Question

Raise the fidelity of the symbol/rendering decisions with a cheap, concrete artifact: a
throwaway prototype that draws a small **nation × visualEra** set of gun mounts (and one
non-mount part, e.g. a mast or funnel) into the existing side-profile view, using the
catalog key and rendering contract from tickets 04/05.

The prototype exists to answer, by reaction rather than argument:

- Does the `nationStyle × visualEra × sizeBand × mountType × gunCount` key actually produce a
  legible, distinct-enough silhouette per era and nation at profile scale?
- Does the layering/ordering (behind hull + turrets, accessories in front) read correctly
  when mounts are added to a profile that currently draws no mounts?
- Is the calibre-driven auto-resize believable against the drawn hull?

Deliverable: a throwaway artifact (outline/stub or UI code) linked as an asset; no
production code, no merge. Feed the reaction back into tickets 04/05 before they resolve.

## Answer

Resolved autonomously, by folding the prototype into the first vertical slice instead of a
throwaway branch. The slice is cheap to reshape and sits behind `pnpm snap` screenshots, so
the reaction comes from the real profile at real scale.

The reactions folded back into 04/05:

- Barrel count is invisible in a side view, so `guns` is optional in the key, and gun count
  shows in the plan and the symbol's `<title>`.
- Single-gun classes need per-gun repetition to read as a battery.
- Masts dwarf the compressed profile, so they get a height clamp to the drawing's top pad.
