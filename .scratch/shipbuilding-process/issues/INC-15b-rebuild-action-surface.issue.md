# INC-15b — Rebuild action surface

**State:** deferred · **Frontier:** no · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R34) · **ADR:** none new
**Parent:** `INC-15-rebuild-reclassification-and-surface.issue.md` (engine slice landed)

> **Deferred (2026-10-12):** the rebuild surface is being replaced with the new shipbuilding screen (work
> in progress under `apps/desktop/src/renderer/screens/shipbuilding/`). The reclassification engine slice
> (INC-15) is complete; only the player surface moves. Recorded, not dropped.

## What to build

One rebuild surface exposing the full action set: `BULGE` (INC-12), the armament-change rules
(INC-13), and the existing machinery / fire-control / armour actions. The surface does not offer
CV/CVL conversion or BC→BB reclassification in the EARLY band.

## Acceptance criteria

- [ ] The rebuild surface offers BULGE, armament change, machinery, fire-control and armour actions.
- [ ] CV/CVL conversion and BC→BB reclassification are not offered.
- [ ] Desktop render test + `pnpm snap` of the rebuild surface (screenshot + `aria.yaml`, console
      clean, no churn warning).

## Notes for implementator

Part of WS5. All actions are already engine-side; the surface wires them through the existing
construction bridge.
