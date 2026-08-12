# 06 — Enrich Resources / Economy in the engine

**What to build:** The engine compiles economy state that reflects the full researched economy/budget domain (treasury, income, expenses, appropriation, production resources) so a campaign snapshot carries the researched budget/resource shape instead of only a few scalar fields.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Compiled nation economy state deepens to represent the researched economy/budget shape from `content/research/resources` and `content/research/budgets`.
- [ ] The compiler fills that deepened state from the researched economy data during a normal campaign compile.
- [ ] The deterministic snapshot hash lock is updated; the pack still compiles deterministically.
- [ ] `format`, `lint`, `typecheck`, and `test` are all green.