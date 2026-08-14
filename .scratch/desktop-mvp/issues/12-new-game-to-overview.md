# 12 — New Game → Overview

**What to build:** `listNewGameOptions`, `compileCampaign`, and
`inspectCampaign` implemented for real against `@bluewave/campaign`
(`CampaignCompiler`, `createInitialCampaignState`) and `@bluewave/persistence`
(`SaveStore`), per [New-Game & Continuity Contract](08-new-game-continuity-contract.md).
Includes fixing `SaveStore.save`'s Map-serialization bug (this is the first
slice that writes a real save) and excluding zero-content nations from
`supportedValues.playerSlotId` per
[Empty-Nation Content Gap](06-empty-nation-content-gap.md).

**Blocked by:** [Bridge Scaffold & Entry-Point Cutover](11-bridge-scaffold-entry-point-cutover.md).

- [ ] New Game flow (preferences → archetype → nation) runs against real
      `content/production/1880` data.
- [ ] Spain (and the 4 other zero-design/zero-construction nations) do not
      appear in nation selection.
- [ ] Completing New Game compiles a real campaign, writes an initial save
      package to disk, and lands on Overview.
- [ ] Overview shows real treasury, fleet count, known technologies, ports,
      and strategic areas for the compiled campaign — not placeholder data.
- [ ] A save written by `compileCampaign` round-trips through `SaveStore.load`
      with `nations`/`designs`/`designFamilies` intact (proves the Map-bug
      fix).
