Type: task
Status: open
Blocked by: 07, 08, 09, 10

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
