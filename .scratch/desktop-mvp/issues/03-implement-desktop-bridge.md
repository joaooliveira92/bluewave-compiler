Type: task
Status: resolved
Blocked by: 07, 08, 09, 10

## Answer

Superseded by [Bridge Scaffold & Entry-Point Cutover](11-bridge-scaffold-entry-point-cutover.md)
(ticket 11): the campaign-engine package, the six `shared/*-contract.ts`
files, and the full `campaign.execute` bridge wiring (all 22 commands) were
implemented as a single cutover ticket. See 11's resolution notes.

## Question

Implement the `campaign.execute` IPC bridge and the `@bluewave/campaign-engine`
package designed across tickets 07 (projection shape), 08 (new-game/continuity
contract), 09 (simulation contract), and 10 (construction/fleet contract):
build `packages/campaign-engine` per ticket 07's design, expose the bridge
from `src/preload/index.ts` as `BluewaveDesktopBridge`, add the corresponding
`ipcMain.handle` wiring in `src/main/index.ts`, and create the
`apps/desktop/src/shared/*-contract.ts` files the screens already import.
Follow ticket 08's decision on how the existing
`compile`/`project:*`/`campaign:load-save` channels relate to the new ones.
