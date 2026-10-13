# 02: Codepoint ordering in the compiler

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** The compiler's canonical ordering must be locale-independent.
Replace the normalize stage's locale-dependent string comparison with codepoint
comparison, matching the rule already used elsewhere in the repo, so the artifact
body hash is reproducible by rule rather than by environment. Extend the
cross-process determinism proof to cover the compiler's canonical order.

## Acceptance criteria

- [ ] Compiler ordering uses codepoint comparison, never locale-dependent
      ordering.
- [ ] The artifact body hash is byte-identical across processes and across host
      locales (verified under at least two different locales).
- [ ] Existing content, fixtures and goldens are unchanged (the current ids sort
      identically under both rules, so the hash does not move).
- [ ] A test pins the ordering rule so a future locale-dependent sort fails.

## Notes

- Prefer a shared comparator over re-stating the rule. If extracting one would
  fan across packages, scope this ticket to the compiler and record the shared
  helper as a follow-up.
