# INC-2 — Complete ADR-0100's policy of record

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** Finish the policy of record for the runtime-free declination. The
closed-subset gate already rejects every declined Effect module, but the policy does not
name them, presents `@effect/vitest` as adopted, and does not record why test files sit
outside the runtime-free boundary. Write the three missing facts into ADR-0100 so a
reader (or an agent) can find the declination by searching for the module name. This
closes ticket 05's F2/F3/F4 residuals.

## Acceptance criteria

- [ ] ADR-0100 §1's `@effect/vitest` sentence is corrected to say it is vendored and
      **unused** (the runner is `vite-plus/test`, `RULES.md:120`).
- [ ] ADR-0100 §2 gains an explicit "test files" declination: `assert-runtime-free.mjs`
      guards only `*/src` roots by design, test files are outside the runtime-free
      boundary (ADR-0150 §1), and `@effect/vitest` is not a dependency. The disposition
      is **accept + record**; a test-file scope is noted only as a future alternative.
- [ ] ADR-0100 §2 names the declined Effect modules — `Resources` (the `05_resources`
      section; note `Scope` is separately adopted at the IO boundary and is not itself
      declined), `PubSub`, `Stream`, `Batching`/`Request`, `Schedule`, `Observability`
      (`Logger`/`Metric`) — in one enumerating row/cell that points at the closed-subset
      rule. A search for each declined name in `docs/adr`/`RULES.md`/`agent-patterns`
      finds the declination.
- [ ] No change to `scripts/assert-runtime-free.mjs` or any gate; no code change.
- [ ] `pnpm preflight` (including `docs-check` and `verify-doc-budgets`) stays green.

## Notes for implementator

- ADR-0100 is an existing ADR: amend it via `docs/adr/AMENDMENTS.md` if the change is an
  amendment, or edit the ADR's policy cells if it is a factual correction of the same
  decision — follow the repo's ADR-immutability rule and the ticket-05/07 precedent
  (factual policy-of-record corrections were made in place; dated amendments are kept).
- Keep ADR-0100 within its doc budget; condense if needed rather than grow it.
- ADR-0150 §1 is the determinism-gating decision that already reasons about the test
  boundary; cite it when recording the `09_testing` exemption.

## Answer

Resolved (doc-only; no gate or code change).

- **§1:** the `@effect/vitest` sentence is corrected — it is vendored on the
  same version but **unused** (runner is the `vite-plus/test` built-in,
  `RULES.md` "Tests and gates"; no first-party test imports it).
- **§2 Policy of record (2026-10-13):** one block records the three missing
  facts — (1) the declined modules are named (`Resources` — with `Scope` noted as
  separately adopted at the IO boundary and **not** itself declined — `PubSub`,
  `Stream`, `Batching`/`Request`, `Schedule`, `Observability`/`Logger`/`Metric`),
  pointing at the closed allowlist in `assert-runtime-free.mjs`; (2) test files
  are outside the runtime-free boundary by design (gate guards only `*/src`;
  tests reach neither the renderer nor a published pure package; ADR-0150 §1;
  `@effect/vitest` is not a dependency) — **accept + record**, a test-file scope
  only a future alternative; (3) no gate change.
- `scripts/assert-runtime-free.mjs` and every gate untouched.
- Commands: `node scripts/docs-check.cjs` green (442 links, 154 ADRs indexed);
  `node scripts/verify-doc-budgets.mjs` green (27 within ceiling); `pnpm preflight`
  green.

Closes ticket 05's `F-05-2`/`F-05-3`/`F-05-4` residuals.
