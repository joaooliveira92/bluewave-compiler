# 03 — Enrich Nations / Governments in the engine

**What to build:** The engine compiles nation state that reflects the full researched nation/government domain — regime, playable slot, canonical identity (lowercase NationId + 3-letter tag) — so a campaign snapshot carries the researched government/regime and slot data instead of only name/tag/treasury.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Compiled nation state deepens to represent the researched nation/government fields (regime, playable slot, canonical identity) from `content/research/nations` and `content/research/governments`.
- [ ] The compiler fills that deepened state from the researched nation data during a normal campaign compile.
- [ ] The deterministic snapshot hash lock is updated; the pack still compiles deterministically.
- [ ] `format`, `lint`, `typecheck`, and `test` are all green.