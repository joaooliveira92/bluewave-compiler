# INC-7b — Construction capacity cap panel

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** INC-7
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R19) · **ADR:** none new
**Parent:** `INC-7-concurrency-cap-and-exemptions.issue.md` (engine slice landed)

## What to build

The Construction screen shows the national capacity cap and its current utilisation as compiled
values: `maxConcurrentConstructionMassKg` and the committed `NEW_CONSTRUCTION` mass, with the exempt
AMC/small-corvette share distinguished from the normal-pool share.

## Acceptance criteria

- [ ] A dock/capacity panel shows the cap and current utilisation, both compiled values.
- [ ] The exempt AMC/small-corvette share is shown separately from the normal-pool share.
- [ ] Desktop render test + `pnpm snap` (screenshot + `aria.yaml`, console clean, no churn warning).

## Notes for implementator

Part of WS5. The engine exposes `nationalConstructionCapacity` and
`committedNewConstructionMassKg` from `@bluewave/phase-engine`; the panel consumes them, never
authored state.
