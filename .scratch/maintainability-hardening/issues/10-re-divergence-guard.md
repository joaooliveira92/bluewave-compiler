# 10: Re-divergence guard

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** A documented, machine-checkable guard that makes reintroducing
a second task runner, build cache, or AST parser a deliberate, recorded decision
rather than an accident — so the change that fixes today's divergence cannot
quietly re-grow. The guard carries a documented escape hatch (an ADR reference)
for an intentional exception.

- [ ] A check (or lint rule) flags a second task runner, cache, or parser being
  added beside the incumbent.
- [ ] A documented escape (an ADR reference) allows an intentional exception.
- [ ] The guard has a fixture proving the pass and fail paths.
