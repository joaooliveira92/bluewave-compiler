# INC-8 — Final validation and documentation reconciliation

**Type:** implementation
**Status:** open
**Blocked by:** INC-5, INC-6, INC-7
**Frontier:** no

**What to build:** Prove the whole migration is behaviour-preserving and leave the
documentation of record consistent with the code.

## Acceptance criteria

- [ ] `pnpm preflight`, `pnpm test:scripts` and `pnpm check` are all green on the
      exact commit (ERA-R20).
- [ ] Goldens, cross-process determinism and equivalence checks are byte-identical
      (`check:golden`, `check:determinism`, `check:equivalence`) (ERA-R7, R8).
- [ ] The renderer/preload bundle tripwire (`check-renderer-bundle`) and the renderer
      content-boundary test are green — no `effect` reaches the renderer (ERA-R9).
- [ ] No `packages/*` runtime-free root gained a runtime import; the engine stays
      runtime-free with plain facades (ERA-R10).
- [ ] ADR-0159, `RULES.md` §Effect, and `docs/agents/runtime-free-gate.md` are mutually
      consistent; `docs-check` is green (ERA-R20).
- [ ] No `default*Deps` object remains and the app has one dependency mechanism
      (ERA-R16).

## Notes for implementator

- This is the release gate for the migration; run the full `pnpm check`, not a subset.
- If any slice left a recorded deferral, confirm it is captured in the spec's Out of
  Scope or a follow-up ticket rather than silently dropped.
