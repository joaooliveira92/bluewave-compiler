# INC-3 — Verification, cleanup, and snapshot coverage

**Type:** implementation
**Status:** done
**Blocked by:** INC-2 (02-inline-custom-allocator)
**Frontier:** no (done)
**Requirements:** ARC-9, ARC-10; AC-1 (snap), AC-18, AC-19; DESIGN-51

## What to build

Prove the reworked screen against the two reference steps and close out the rework.

Retire the obsolete screen-local pieces that the new layout no longer uses (the grid
preset/custom cards and the empty-preview placeholder) **only after confirming with a
search that nothing else references them**; leave them in place if a test or another
consumer still needs them.

Capture the reworked screen with the desktop snapshot tool at desktop (`lg`) and
narrow widths and check the master/detail split, the stacked narrow layout, the
inline allocator, and the Active/Pending states against AC-1..AC-5 / AC-8..AC-12
(console clean, no structural churn warning). Keep the new-game end-to-end flow
green; if the flow's selectors touch the retired grid/modal markup, fix them in the
shared flow helper rather than weakening the assertion.

Run the full orchestrator gate; confirm no authoritative state, hash, golden, save,
RNG, IPC, or engine change (two-process determinism byte-identical).

## Acceptance

- [x] Obsolete grid/empty-preview components are removed only if unreferenced, else kept and noted (AC-18).
- [x] `pnpm snap` at desktop and narrow widths shows the master/detail split, stacked narrow layout, inline allocator, and Active/Pending states; console clean; no structural churn warning (AC-1, AC-10).
- [x] `pnpm test:e2e` stays green through the archetype step (AC-14, AC-15).
- [x] `pnpm preflight` green, including the no-new-`as unknown`-casts ratchet (AC-18).
- [x] `pnpm check` green end-to-end (format, lint, `lint:effect`, typecheck, build, tests, desktop E2E) (AC-19).
- [x] Two-process determinism byte-identical; golden verification unchanged; no engine/compiler/content/save/IPC change (AC-19).
- [x] Clean working tree; small Conventional Commits on `dev`; traceability pointer updated.
