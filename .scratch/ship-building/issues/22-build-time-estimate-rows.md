# 22: Replace ESTIMATE and Wikipedia-only rows in the build-time table (release blocker)

**Type:** task
**Status:** open
**Blocked by:** none
**Frontier:** yes

Source: ticket 20 review. In `content/production/1880/ship-building/balance.yaml`, `buildMonthsByDisplacementT` has unsourced ESTIMATE points at 300, 3,000, 9,000 and 20,000 t, and a Wikipedia-only point at 12,000 t whose completion date conflicts with Brassey 1901 (Cressy delivered Oct 1900 vs Wikipedia 28 May 1901). Verify against Conway's, Brassey 1902 or navweaps, add destroyer and torpedo-boat sources, record machine-readable provenance per point, and drop the "provisional" label in the Drawing Board forecast once no ESTIMATE rows remain. Release blocker.

## Comments
