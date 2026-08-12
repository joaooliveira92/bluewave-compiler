# 04 — Enrich Fleet in the engine

**What to build:** The engine compiles fleet state that reflects the full researched fleet domain (historical ships with their class/hull/status per scenario) so a campaign snapshot carries the researched per-class ship data instead of only sparse ship stubs.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Compiled fleet/ship state deepens to represent the researched fleet shape (historical ships, hull type, status) from `content/research/fleet` and `content/research/fleets`.
- [ ] The compiler fills that deepened state from the researched fleet data during a normal campaign compile.
- [ ] The deterministic snapshot hash lock is updated; the pack still compiles deterministically.
- [ ] `format`, `lint`, `typecheck`, and `test` are all green.