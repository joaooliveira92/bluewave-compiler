# 02 — Enrich World / Geography in the engine

**What to build:** The engine compiles a world/geography state that reflects the full researched geography — richer area types (land/sea/coastal), ports and canals with their operational detail, and routes — so a campaign snapshot carries the researched geography instead of only sparse area/route/port stubs.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Compiled world state deepens to represent the researched geography (area type coverage, port/canal detail, route type) from `content/research/world`.
- [ ] The compiler fills that deepened state from the researched geography data during a normal campaign compile.
- [ ] The deterministic snapshot hash lock is updated; the pack still compiles deterministically.
- [ ] `format`, `lint`, `typecheck`, and `test` are all green.