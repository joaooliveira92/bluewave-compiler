# 05 — Enrich Shipbuilding in the engine

**What to build:** The engine compiles shipbuilding state that reflects the full researched shipbuilding domain (design templates, construction pipeline, rebuilds, yard capacity) so a campaign snapshot carries the researched design/build model instead of only sparse design/build stubs.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Compiled design/build state deepens to represent the researched shipbuilding shape (design templates, build/rebuild state, yard capacity) from `content/research/shipbuilding`.
- [ ] The compiler fills that deepened state from the researched shipbuilding data during a normal campaign compile.
- [ ] The deterministic snapshot hash lock is updated; the pack still compiles deterministically.
- [ ] `format`, `lint`, `typecheck`, and `test` are all green.