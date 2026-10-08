# INC-9: Contracts Rollup + ADR + Traceability + Gate

**Frontier: no** (blocked by: INC-8)

## Deliverable

Full `*_v1` contracts rollup (`SHIPPED_AIRCRAFT_CONTRACT`), validate guards. ADR for scope/integration boundary + constants policy. Traceability update (SPRINT-PLAN, PROGRESS). Validation report. Full orchestrator validation gate.

## Files

- ADR document at `docs/adr/adr-XXXX-d1-m4-aviation.md`
- `.ai/reports/d1-m4-aviation-scoping.md`
- Updated `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`

## Tests

- `aircraft/contracts.test.ts` — all `*_v1` contracts pass validation, fail-closed
- orchestrator gate: uncached build, tsc -b, lint, format, full tests, goldens, two-process

## Acceptance criteria

AC-26 (contracts rollup), plus all prior ACs verified at gate

## Dependencies

INC-8 (all contracts and reason codes complete)