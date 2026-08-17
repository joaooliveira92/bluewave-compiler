- **Type:** task
- **Status:** resolved
# B-6: M2 Acceptance Gate — registry + §23 sign-off + traceability

## Question

How is M2 made COMPLETED correctly, using the A-5 (M1) precedent?

## Answer

**Locked.**
1. Read `docs/acceptance/m1-capability-registry.md` as the template; produce
   `docs/acceptance/m2-capability-registry.md` applying DESIGN-55 §9 to the
   seven M2 capabilities:
   - tactical movement (B-2) — ACCEPTED
   - spotting & contact (B-2) — ACCEPTED
   - tactical divisions & formations (B-1) — ACCEPTED
   - gunnery (B-3) — ACCEPTED
   - basic armor & damage (B-4) — ACCEPTED
   - tactical weather (B-5 + B-6 wiring) — ACCEPTED
   - battle results (B-6) — ACCEPTED
2. Each row: readiness state, implementing packages, governing docs, primary
   test suites, acceptance evidence (commit + report refs). §9 predicates:
   contracts resolved (no open decision), implementation at boundaries, tests
   pass, auto-resolution reachable end-to-end, save/replay/hash preserved,
   dependencies (M1) accepted, approval record signed.
3. Recorded limitations (non-blocking, explicit): DESIGN-38 §34 statistical
   study → REL-1; production climate YAML → CONTENT-track; B-1 AC-14 production
   ship→design linkage → CONTENT-track.
4. Sign `M2_SURFACE_TACTICAL_CORE` **COMPLETED** (§23) at the final commit of
   B-6, then refresh `docs/PROGRESS.md` and `.ai/SPRINT-PLAN.md` (row done +
   advance pointer) and write `.ai/reports/b6-m2-battle-results-impl.md`.
5. Next-plan pointer: B-6 completed → Track C (M3) is blocked-ordered; the
   immediate pointer must be the first unblocked M3 row OR the deferred
   CONTENT/desktop repairs listed in SPRINT-PLAN §Next.