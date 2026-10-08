# SPRINT VALIDATION REPORT — M2 "First Month at the Admiralty" charting + INC-1

Session kind: wayfinder charting sprint (decision + spec assembly + slicing),
then the first implementation ticket on the frontier. No packaged smoke/IPC
round-trip beyond the existing suite; all changes are charting documents +
one read-only `@bluewave/campaign-engine` projection extension.

## Sessions run

1. **M2 charting (game-onboarding-first-month)** — resolved frontier decision
   tickets **04, 10, 12, 14, 15** (research-subagent grounding for the two
   real-data-heavy tickets), assembled the single M2 spec (`spec.md`, 1,508
   lines), and sliced it into **14** frontier-ordered implementation tickets
   (`issues/INC-01..14`).
2. **INC-1 (economy projection extension)** — implemented + reviewed + gated.

## Commits

- `06014b2` resolve ticket 04 Immediate priorities engine
- `ae951eb` resolve ticket 10 Ordering a ship wizard
- `b95073c` resolve ticket 12 Foreign Relations page
- `81066d6` resolve tickets 14 + 15 (charting decision phase complete — 18/18)
- `3f83d1d` assemble the M2 spec (charting effort COMPLETE)
- `b1b9635` slice M2 spec into 14 implementation tickets
- `ceb77ad` pin honest `constructionSpend` derivation in INC-1
- `4a5eb20` **INC-1** `PlayerProjection` economy + header fields
- `be69161` mark INC-1 done; refresh frontier pointer

## INC-1 validation evidence (exact commands + results)

- `pnpm -w turbo run build --filter @bluewave/campaign-engine --force` →
  **8/8 tasks successful**.
- `pnpm exec vitest run` (campaign-engine suite) → **12 files / 70 tests passed**
  (incl. 5 new `projection-economy` tests).
- `npx tsc -b apps/desktop` → **clean** (EXIT 0) after repairing the
  reviewer-flagged `overview-screen-state.test.ts` fixture literal; the
  focused desktop test → **7/7 passed**.
- `node scripts/verify-golden-hashes.cjs` → **"All 10 hashes match golden
  reference."** (implementator also recorded two-process determinism
  byte-identical; the reviewer's cross-process attempt hit an environmental
  `MODULE_NOT_FOUND` for a stale-worktree child path unrelated to the diff.)
- Reviewer: **NEEDS_REWORK** → repaired (1 HIGH: new required fields missing
  from a consumer test literal) → APPROVE. The reviewers' LOW (duplicated
  maintenance/paidWork helpers) was resolved by exporting the shared helpers
  from `opening-briefing.ts` and reusing them, eliminating drift.

## Acceptance notes

The M2 charting sprint's destination (a written, real-data-reconciled spec) is
reached; INC-1's DoD is met. Two items are **flagged, not resolved** (recorded
at `.scratch/game-onboarding-first-month/spec.md` §7/§4 and the issue tracks):
the `baseResources`-vs-`income` revenue divergence, and the turnNumber-as-
revision same-month-conflict gap Mend. Goldens unchanged throughout; no
authoritative schema/hash surface added.

## Working tree

Clean at session end.
