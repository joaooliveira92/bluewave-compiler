# 06: Generated scripts inventory

**Type:** implementation
**Status:** open
**Blocked by:** 05
**Frontier:** no

**What to build:** The scripts documentation's gate and tool tables are generated
from the gate graph plus a small annotations map, and drift-checked the way the
ADR index already is, so the inventory cannot fall behind the code. Today the
tables are a hand-kept subset and most gates and scripts are undocumented.

- [ ] A generator renders the gate/tool tables from the graph plus annotations.
- [ ] The committed documentation matches the generator's output; a stale
  document fails preflight.
- [ ] Every gate and every script appears — no hand-kept subset.
- [ ] Regeneration is a single documented command.
