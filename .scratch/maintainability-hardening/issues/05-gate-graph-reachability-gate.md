# 05: Gate-graph reachability gate

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** A gate that fails when the preflight gate graph is not fully
wired: a gate task that nothing depends on (unreachable from the preflight
aggregate) or a gate that exists as a script but has no graph entry. An unwired
gate becomes a red preflight naming the orphan, never a silent no-op.

- [ ] A gate task unreachable from the preflight aggregate fails the check,
  naming it.
- [ ] A gate script with no graph entry is reported.
- [ ] The check is itself part of preflight and has a fixture proving the
  reachable and orphan cases.
- [ ] `pnpm preflight` stays green with the current graph.
