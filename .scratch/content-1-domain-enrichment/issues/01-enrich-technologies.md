# 01 — Enrich Technologies in the engine

**What to build:** The engine compiles a nation's research/technology state that reflects the full researched technology domain, so a campaign snapshot carries the researched tech-tree shape (fields, adoption category, prerequisites) instead of only a sparse tech-id/progress list. Callers and tests can read the richer technology data off the compiled snapshot deterministically.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Compiled research state deepens to represent the researched technology fields (technology field, adoption category, dependency/prerequisite chain) from `content/research/technologies`.
- [ ] The compiler fills that deepened state from the researched technology data during a normal campaign compile.
- [ ] The deterministic snapshot hash lock is updated; the pack still compiles deterministically.
- [ ] `format`, `lint`, `typecheck`, and `test` are all green.