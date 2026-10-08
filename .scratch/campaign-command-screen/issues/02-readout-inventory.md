# Readout and button inventory vs the engine

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question
For every RTW3 readout (Prestige, Fleet morale, Tonnage on foreign stations, Dock size, Shipyard capacity, Unrest, Build requirement, Treaty limits, Yearly/Monthly budget, Maintenance, Construction, Naval aircraft, Research, Extra training, Intelligence, Total expenses, Monthly balance, intel bars, relations) and every action-grid/tab button: is there real data/command in the engine + campaign snapshot today (exact field/view), derivable, or absent? Output `docs/research/campaign-command-screen-engine-surface.md` as a table (item -> source -> real/derived/deferred -> reason). Reuse the existing engine roadmap note; do not duplicate it.

## Answer

Findings are in `docs/research/campaign-command-screen-engine-surface.md` on the throwaway local branch `research/campaign-command-screen-engine-surface` (commit d5234a3, not pushed, never merged; worktree `.claude/worktrees/agent-af96c102c1c2f2621`). It also notes that `rtw3-parity-engine-roadmap.md` is stale on budget allocation, fleet movement, officers, sunk-ships ledger, design submission and copy-game, which now exist.

- **Real:** treasury, maintenance, committed construction, monthly balance, research amount + budget command, relations/nation strip data, Save, Copy game, Turn. Tabs/buttons: Map, Ships in service, Ships under construction, Officers, Ships sunk (sunk only), Design Ship, Research, Build ship, Division editor, Preferences.
- **Derived:** tonnage on foreign stations, yearly budget, total expenses, messages (last month only), history (battles only), area tree, world tension (rule still to choose).
- **Proxy:** shipyard capacity = sum of port levels, not real yard capacity.
- **Deferred:** prestige, fleet morale, unrest, dock size, build requirement, treaty limits; naval aircraft, extra training, intelligence spend; intel bars/level/reports, auto-build subs, Resign (use Close); Doctrine, Mobilization, Build sub, Air groups, Aircraft types, Build fort/base, Fleet Exercise, Submarines, Coastal fortifications, scrapping. Subs/air/forts are also gated by the 1880 era. Almanac is static content.
- **Finding to confirm (from code reading, not run):** `baseResources` is hard-coded to 0 at compile, but the revenue phase pays from it, while the projection shows `scaleValue(income, rate)`. The displayed monthly budget may not match what the month pays; label it "projected" and have the owner confirm the revenue source.
- No single composed read model exists (relations, officers, loss ledger, budget bounds are separate inspect views). A first honest command screen needs no new engine work.
