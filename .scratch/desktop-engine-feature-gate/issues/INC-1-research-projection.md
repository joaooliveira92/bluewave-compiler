# INC-1 — Projection + `inspectResearchScreen` bridge command

**Type:** task
**Status:** resolved
**Blocked by:**

## What to build

`packages/campaign-engine/src/research.ts` — `ResearchScreenProjection` +
`buildResearchScreenProjection(state, playerSlotId, month)` derived one-to-one
from the compiled snapshot's `nation.research` (`ResearchState`):

- `nationId`, `researchBudget` (SafeInt number)
- `fieldPriorities: Record<string, number>` (same basis-point scale the
  compiler emits; `fieldPriorities` in `ResearchState`)
- `discoveredTechIds: string[]` (from `discoveredTechs`, sorted)
- `inProgressTechnologies: { techId, investedPoints, completed }[]` (from
  `technologies: TechnologyProgress[]`)
- `currentProjectTechId: string | null`

Contract `apps/desktop/src/shared/research-contract.ts` mirroring the shape.
Main-process handler `apps/desktop/src/main/commands/researchCommands.ts`:
`inspectResearchScreen(sessionId)` → `BridgeResult<ResearchScreenProjection>`
(session lookup → SESSION_NOT_FOUND; build projection from
`record.state.snapshot.nations.get(record.playerSlotId).research`; never
fabricate). Wire into `campaignBridge.ts` + add "inspectResearchScreen" to
`CAMPAIGN_COMMAND_NAMES` + `CampaignCommandClient` overload + update
`campaignBridge.test.ts` name-set canary.

## Acceptance (maps to spec AC-1)

- Projection for a compiled production campaign renders budget / progress /
  discovered / priorities from the real snapshot.
- Bridge returns SESSION_NOT_FOUND for an unknown session.
- `campaignBridge.test.ts` passes with the new name set.

## Validation

`pnpm -w turbo run typecheck build --filter=@bluewave/campaign-engine --filter=@bluewave/desktop` then
`pnpm -w turbo run test --filter=@bluewave/desktop`.