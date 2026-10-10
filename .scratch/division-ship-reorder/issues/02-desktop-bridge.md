# INC-2 — Desktop bridge for `ReorderDivisionShips`

**Type:** implementation
**Status:** resolved
**Blocked by:** 01
**Frontier:** yes
**Requirements:** B-1, B-2, B-3, B-4

## Scope

- `shared/division-contract.ts`: add the wire body member.
- `main/campaignCommandSchemas.ts`: add the Zod union member.
- `main/commands/divisionCommands.ts`: add the planner descriptor.
- `screens/fleet/organization/division-organization-state.ts`: add
  `penalties.reorder` (initial + projection) and the `COMMAND_LABELS` entry.

## Acceptance

- `submitDivisionCommand` maps the wire body to the engine body with the session's
  `nationId` and a `divisionId + joined shipOrder` discriminator.
- The projection carries the reorder penalty so the UI can state it.
- `apps/desktop` typecheck + focused unit tests (`divisionCommands.test.ts`,
  `division-organization-state.test.ts`) pass.
