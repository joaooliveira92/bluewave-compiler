# INC-6 — Contracts Rollup + Research Content Constants + ADR + Traceability

**State:** READY_FOR_AGENT · **Blocked by:** INC-5
**Spec:** `.scratch/b4-m2-armor-damage/spec.md` (AC-13, AC-15..16)

## Acceptance criteria
- AC-13 `reason-codes-damage.test.ts` set-equality vs DESIGN-41 §47 + DESIGN-39 §32 + existing catalog (in-slice exact; deferred codes absent; literal identifier scan over `src/damage/**`).
- AC-15 full `*_v1` rollup (`armor_v1` + `damage_v1` + `SHIPPED_DAMAGE_CONTRACT` + `SHIPPED_ARMOR_CONTRACT` + validate guards) fail-closed; contracts test.
- AC-16 goldens unchanged: `verify-golden-hashes.cjs` 9/9; `BattleResolver`/`StrengthCalculator` unmodified (diff); orchestrator validation gate (build --force, typecheck, lint, format, full tests, cross-process).
- Content deliverable: research-grounded armor/damage **content constant set** in `armor_v1` (`docs/research/b4-m2-armor-damage.md` §3 armor-technology quality families 9 800..11 000 bp; §1 zone maxima; §2 thick-armor 7 500 bp; §4 fire/flooding creation-type tables) + `ballistics`-style locking test.
- ADR-0021 (scope/integration boundary + in-slice §47/§32 reason-code + constant policy; armor-quality families recorded BALANCE TARGET; production-class mapping flagged) — **already authored in scoping; confirm + evidence**.
- Traceability: B-4-IMPL report `.ai/reports/b4-m2-armor-damage-impl.md`, PROGRESS + SPRINT-PLAN B-4 row + "Immediate next action" pointer.

## Notes
Run the full orchestrator gate (build --force, `tsc -b`, lint, format, full `test:run`, cross-process, goldens 9/9). Pre-existing baseline failures (desktop test suites, `nation.test.ts`, lint/format debt) are documented, not newly caused. Do not regenerate goldens.