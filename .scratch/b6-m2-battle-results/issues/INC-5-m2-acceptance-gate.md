- **Type:** task
- **Status:** ready-for-agent
- **Blocked by:** INC-4

# INC-5: M2 acceptance gate + traceability

## Acceptance criteria (spec AC-14)

- `docs/acceptance/m2-capability-registry.md` materialized: seven M2
  capabilities (movement; spotting & contact; divisions & formations; gunnery;
  basic armor & damage; tactical weather; battle results) each with §9 readiness
  state `ACCEPTED`, implementing packages, governing docs, primary test suites,
  acceptance evidence (commits + report refs), recorded limitations.
- Sign `M2_SURFACE_TACTICAL_CORE` **COMPLETED** (§23) in the registry + gate
  report.
- Refresh `docs/PROGRESS.md` (M2 row), `.ai/SPRINT-PLAN.md` (B-6 done row +
  Immediate-next pointer), write `.ai/reports/b6-m2-battle-results-impl.md`
  (validation report with exact commands + results), update `.ai/specs/README.md`.
- Non-blocking limitations recorded: DESIGN-38 §34 study → REL-1; region climate
  YAML → CONTENT-track; B-1 AC-14 → CONTENT-track; `BattleResolver` retained as
  M1 fallback.

## Tests

No code; the gate is documentation + the full orchestrator validation gate
(clean uncached build, tsc, lint, format, full tests, cross-process, goldens).

## Blocking notes

Depends on INC-1..INC-4 all passing their gates. Mirror M1 gate
(`docs/acceptance/m1-capability-registry.md`, `.ai/reports/a5-m1-acceptance-gate.md`).