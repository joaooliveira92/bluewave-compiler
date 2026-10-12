# INC-5 — ADR-0127 + visual/a11y coverage + full gate

**Type:** implementation
**Status:** open
**Blocked by:** 03, 04
**Frontier:** no
**Requirements:** NAM-9, NAM-10; AC-16, AC-17, AC-18; ADR-0106, BW-DET-003

## What to build

Close the sprint: record the required ADR, complete the visual/a11y coverage, and
prove the full gate with no authoritative change.

- Write **ADR-0127** covering (a) where the shared controlled deck, master
  selector, globe shell, and slide-panel primitives live and why, and (b) the
  decorative-globe constraint (inert shell, no authoritative reads, no
  nation-selection implication). Refresh the ADR index row.
- Capture `pnpm snap` at desktop (`lg`) and narrow widths and check against the ACs.
- Confirm the new-game e2e flow and the a11y audit stay green.

Deliverable: documented decisions plus a green, verified gate on the exact commit.

## Acceptance

- [ ] ADR-0127 written with its ADR index row; the `pnpm preflight` ADR gate is green.
- [ ] `pnpm snap` captures the reworked screen at desktop and narrow widths (screenshot + `aria.yaml`, console clean, no structural churn warning), checked against AC-1..AC-4 / AC-8..AC-12.
- [ ] The new-game e2e flow stays green (the `"Next: Choose Archetype"` click is preserved); the a11y audit is green.
- [ ] `pnpm preflight` and `pnpm test:scripts` green; `pnpm check` green end-to-end (format, lint, `lint:effect`, typecheck, build, tests, desktop e2e).
- [ ] Two-process determinism is byte-identical and golden hashes are unchanged; no engine/compiler/content/save/IPC change.
- [ ] No new `as unknown` casts; clean working tree; small Conventional Commits on `dev`.
