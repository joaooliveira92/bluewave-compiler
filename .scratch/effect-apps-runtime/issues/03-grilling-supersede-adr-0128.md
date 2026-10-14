# 03: Supersede ADR-0128 for the app surfaces

**Type:** grilling
**Status:** resolved
**Blocked by:** 01, 02

## Question

Ratify the reversal: what exactly are we deciding, and what stays unchanged?

Grill out the superseding ADR (next free number **ADR-0159**) covering:

- **Scope of the reversal** — `apps/desktop/src/main` and `apps/compiler-cli`
  move to the full runtime; `packages/*` runtime-free roots and the
  renderer/preload stay exactly as they are. Confirm nothing else moves.
- **Gate movement** — `scripts/assert-runtime-free.mjs` `RUNTIME_FREE_ROOTS`
  drops `apps/desktop/src/main` (and `apps/compiler-cli` was never listed) in the
  *same* change, per ADR-0128 §Revisit; the renderer stays protected by
  `check-renderer-bundle.mjs` + the boundary test. Confirm what the runtime-free
  gate now means and whether a *new* gate is needed to keep the renderer clean.
- **Which ADR-0128 claims are overturned vs. retained** — §1 facades (retained?
  app-internal only), §2 no `ManagedRuntime` in main (overturned), §3
  compiler-cli plain entrypoint (overturned), §4 runtime-free subset as the
  in-process idiom (retained for packages).
- **Status handling** — superseded-by vs. amended; update `docs/adr/README.md`,
  `AMENDMENTS.md`, and `RULES.md` §Effect (the runtime-free list at RULES.md:54-58
  and §Services).
- **Reversal cost** — accepted consequences (two idioms at the boundary,
  determinism must be proven, test-harness question carried to ticket 07).

Deliverable: the ADR draft (written under the domain-modeling skill's ADR
conventions) plus the precise gate/edit list, carried into the spec hand-off.

## Answer

Resolved 2026-10-14 — all four boundaries approved by the human, and the ADR is
written and the corpus kept consistent (`docs-check` green).

**Decided (ADR-0159, `docs/adr/ADR-0159-effect-runtime-in-app-surfaces.md`).**
1. Scope: the full runtime lands only in `apps/desktop/src/main` and
   `apps/compiler-cli`; `packages/*` runtime-free roots and renderer/preload are
   unchanged.
2. Gate: `apps/desktop/src/main` leaves `RUNTIME_FREE_ROOTS`; renderer stays
   protected by `check-renderer-bundle.mjs` + the boundary test (no new gate).
3. ADR-0128 §1 retained — cross-package facades and package internals stay
   plain-TS; only app internals become Effect programs.
4. Status: ADR-0128 is **superseded by** ADR-0159 (for the app surfaces only;
   package/renderer constraints restated in ADR-0159).

**Files changed now (decision artifacts only):**
- `docs/adr/ADR-0159-effect-runtime-in-app-surfaces.md` (new).
- `docs/adr/ADR-0128-…md` — Status → `Superseded by: ADR-0159`.
- `scripts/adr-index.cjs` — ADR-0159 assigned to the "Effect adoption" area.
- `docs/adr/README.md` — regenerated (`pnpm adr:index`); `docs-check` green.

**Exact implementation edit list (carried to ticket 08 / the spec — NOT applied
here, because the gate and code move together in the implementation change):**
- `scripts/assert-runtime-free.mjs` — remove `"apps/desktop/src/main"` from
  `RUNTIME_FREE_ROOTS` (line 37); reconcile the file-top comment and embedded
  `FIXTURES` if any assert main is guarded, plus `scripts/test/assert-runtime-free.test.mjs`.
- `scripts/verify-check-parity.mjs` — confirm any new runtime-gate wiring is
  covered (no CI drift).
- `RULES.md` §Effect (lines ~54–58) — name `apps/desktop/src/main` and
  `apps/compiler-cli` as the runtime-permitted app surfaces (the current text
  already says "app entry points", so this is a naming clarification).
- `docs/agents/runtime-free-gate.md` — remove main from "Guarded roots"; update
  the ADR-0128 reference to ADR-0159.
