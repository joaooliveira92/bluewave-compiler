# INC-12b — Rebuild surface offers the BULGE action (UI slice of INC-12)

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R25, SB3-R34) · **ADR:** none (presentation of a domain action)

## What to build

Expose the `BULGE` refit action on the Construction screen's rebuild surface, alongside the existing
machinery/fire-control/armour actions, the UI half of SB3-R25 that INC-12's domain slice left deferred.

## Acceptance criteria

- [ ] The rebuild surface lists the `BULGE` action and, when chosen, lets the player choose/confirm the blister
      (mass) and shows the projected speed penalty and the versioned torpedo-protection gain.
- [ ] Issuing the action edits a real refit plan/command; readouts are compiled values, never authored in the UI.
- [ ] `pnpm snap` of the rebuild surface with `aria.yaml` assertions, console clean, no churn warning; render test.

## Notes for implementator

INC-12 added the `BULGE` refit kind (`@bluewave/ship-design` `refit.ts`), the `RefitPlan.bulge` field and the
authored constants (`bulgeProtectionGainBp`, `bulgeSpeedPenaltyBp`). This ticket is the player surface only.
Deferred, not dropped, because a UI change needs a captured screen (AGENTS.md).
