# INC-5 — Contracts / Content-Constants Rollup + ADR + Traceability

**State:** READY_FOR_AGENT · **Blocked by:** INC-4
**Spec:** `.scratch/b3-m2-gunnery/spec.md` (AC-10, AC-14..AC-15) · **ADR:** ADR-0020

## Acceptance criteria
- AC-10 **Reason-code set-equality**: this slice ships exactly the DESIGN-39 §32 codes
  relevant to the slice (spec §1.4: 7 new in-slice + reused existing
  `TACTICAL_STATE_INVARIANT_FAILED`, `TACTICAL_FOG_OF_WAR_VIOLATION`,
  `INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT`) + recorded deferred §32
  codes; a `reason-codes-gunnery.test.ts` set-equality check vs §32 + the existing
  catalog prevents silent addition. Each new code recorded as a versioned-ruleset
  decision in ADR-0020.
- AC-14 **Contracts + validate guards**: every new gunnery constant ships `*_v1` +
  `SHIPPED_GUNNERY_CONTRACT` (+ any subsets) + a validate guard; contract/version
  pinning fails closed validation. Proving test: `combat/test/gunnery/contracts.test.ts`.
- AC-15 **Goldens unchanged**: no snapshot schema/phase change; `verify-golden-hashes.cjs`
  9/9; `BattleResolver`/`StrengthCalculator` unmodified (verified by diff). Orchestrator gate.

## Artifacts
- **Content deliverable**: research-grounded **naval gun ballistics constant set**
  (`gunnery_v1` + `SHIPPED_GUNNERY_CONTRACT`) grounding `baseReloadMilliseconds` by
  broad caliber, salvo/spotting practice, fire-control cycle — see
  `docs/research/b3-m2-gunnery.md`.
- **ADR-0020**: B-3 scope/integration boundary (mirrors ADR-0018) + in-slice §32
  reason-code policy + the **surface-mode fire-control-solution threshold** as a
  versioned-ruleset constant (e.g. `NORMAL` minimum fire-control solution quality —
  set a documented constant; `RAPID` 6_000 per §7; this threshold is not pinned by
  DESIGN-39 and must be recorded, not fabricated).
- Traceability: `.ai/briefs/b3-m2-gunnery.md` (brief), `.ai/reports/b3-m2-gunnery-impl.md`
  (validation report), PROGRESS + SPRINT-PLAN B-3 row + "Immediate next action" pointer.

## Notes for implementator
Run the full orchestrator gate commands (build --force, typecheck, lint, format, full
tests, golden verify, cross-process) and record exact results in the report. Do not
regenerate goldens; no ADR-0007 change.
