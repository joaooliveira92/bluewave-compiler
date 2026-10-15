# 10: Documentation of record and tracker tidy

**What to build:** the repository's always-read rules and domain docs state the per-surface runtime
boundary as it now stands — the desktop main process and the compiler CLI run on the full runtime; the
renderer, preload, and the `packages/*` engine stay runtime-free — so the next session does not
re-litigate the superseded "no runtime anywhere" decision. The two composition roots are documented,
and the completed migration tracker is archived.

**Blocked by:** 01 — Land the Effect runtime migration on `dev`

**Status:** ready-for-agent

- [ ] The rules of record and the agent doc state the per-surface boundary (main + CLI runtime;
      renderer/preload and `packages/*` runtime-free) and cite the superseding ADR.
- [ ] A short note documents the two composition roots (desktop main service graph; CLI layer) so the
      service graph is discoverable.
- [ ] The completed migration tracker (`.scratch/effect-apps-runtime/`) is archived per the tracker
      convention.
- [ ] `docs-check` and the doc budgets stay green.
