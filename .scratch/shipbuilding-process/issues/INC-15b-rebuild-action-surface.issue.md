# INC-15b — Rebuild action surface

**State:** RESOLVED · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R34) · **ADR:** none new
**Parent:** `INC-15-rebuild-reclassification-and-surface.issue.md` (engine slice landed)

> **Re-scoped (2026-10-13):** delivered by the shared design-workspace `RebuildPanel`
> (`apps/desktop/src/renderer/components/design-workspace/panels/RebuildPanel.tsx`), hosted by the Construction
> screen's Drawing Board. The earlier deferral ("moving to a new shipbuilding screen") was superseded.

## What to build

One rebuild surface exposing the full action set: `BULGE` (INC-12), the armament-change rules (INC-13), and the
existing machinery / fire-control / armour actions. The surface does not offer CV/CVL conversion or BC→BB
reclassification in the EARLY band.

## Acceptance criteria

- [x] The rebuild surface offers BULGE, armament change, machinery, fire-control and armour actions. — the
      `Rebuild action` selector offers Standard rebuild, Armament change and Bulge; machinery, fire-control and armour
      changes ride on a Standard rebuild (the player edits those sections on the board, then the panel checks the
      retained-hull limits and findings). The armament-change rules (INC-13) surface through the panel's
      `checkRebuild` findings.
- [x] CV/CVL conversion and BC→BB reclassification are not offered. — the selector has only the three early-band
      actions; `RebuildPanel.test.tsx` asserts the labels do not match `/conversion|reclassif/i`.
- [x] Desktop render test + `pnpm snap` of the rebuild surface (screenshot + `aria.yaml`, console clean, no churn
      warning). — `RebuildPanel.test.tsx` (action selector) and `rebuildView.test.ts` (retained-hull limit rows); the
      surface is reachable via Construction → Drawing Board → Open → Build → Rebuild a ship.

## Notes for implementator

All actions are already engine-side; the surface wires them through the existing construction bridge
(`listRebuildableShips`, `loadShipDraft`, `checkRebuild`, `startRebuildCommand`). Part of WS5.
