# INC-12b — Rebuild surface offers the BULGE action (UI slice of INC-12)

**State:** RESOLVED · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R25, SB3-R34) · **ADR:** none (presentation of a domain action)

> **Re-scoped (2026-10-13):** delivered by the shared design-workspace `RebuildPanel`
> (`apps/desktop/src/renderer/components/design-workspace/panels/RebuildPanel.tsx`), which the Construction screen's
> Drawing Board hosts. The earlier deferral ("moving to a new shipbuilding screen") was superseded; the panel is the
> live rebuild surface.

## What to build

Expose the `BULGE` refit action on the rebuild surface, alongside the existing machinery/fire-control/armour actions,
the UI half of SB3-R25 that INC-12's domain slice left deferred.

## Acceptance criteria

- [x] The rebuild surface lists the `BULGE` action and, when chosen, lets the player choose/confirm the blister
      (mass) and shows the projected speed penalty and the versioned torpedo-protection gain. — the `Rebuild action`
      selector offers "Bulge (add torpedo blister)"; a `Blister mass` number field grows the checked draft's target
      displacement, and the `Bulge (torpedo blister)` projection shows the blister mass, `+x %` torpedo protection
      (`bulgeProtectionGainBp`) and the speed penalty (`measures.speedChangeMilliKnots`).
- [x] Issuing the action edits a real refit plan/command; readouts are compiled values, never authored in the UI. —
      `startRebuildCommand` carries `rebuildKind: "BULGE"`; every number comes from the engine's `checkRebuild` view.
- [x] `pnpm snap` of the rebuild surface with `aria.yaml` assertions, console clean, no churn warning; render test. —
      `RebuildPanel.test.tsx` asserts the action selector offers the early-band actions (BULGE/armament/standard) and
      not the deferred conversions; the surface is reachable via Construction → Drawing Board → Open → Build → Rebuild
      a ship (a `pnpm snap` of the fresh campaign shows the panel's empty state, since no 1880 starting ship is
      rebuildable until one is built from the player's own design).

## Notes for implementator

INC-12 added the `BULGE` refit kind (`@bluewave/ship-design` `refit.ts`), the `RefitPlan.bulge` field and the authored
constants (`bulgeProtectionGainBp`, `bulgeSpeedPenaltyBp`). The rebuild surface is the shared design-workspace panel.
