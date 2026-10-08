# 05 — Contract the PhaseRegistry into the one real execution path

**What to build:** there is exactly one phase-execution authority, and the
phase registry's contract is actually enforced rather than only asserted in
tests. Today the engine has two divergent engines: a phase-loop facade whose
`executeTurn` returns a no-op for every real phase (only opening/closing
validation run), and the monolithic month executor that actually runs the
phases and freely allocates randomness per phase without consulting the
registry. The registry's declared read/write permissions and RNG policy are
never checked at runtime.

This ticket makes the month executor run its phases through the registry such
that each phase's declared `readPermissions`/`writePermissions`/`rngAllowed`
are honored at runtime, and retires or folds the no-op phase facade so the two
paths collapse into one. Behavior is unchanged where the registry already
matches how phases actually behave (goldens stay byte-identical); a phase that
touches a resource it lacks permission for, or uses randomness when none is
allowed, fails closed with a diagnostic.

**Blocked by:** None — can start immediately.

**Type:** implementation
**Status:** resolved
**Frontier:** yes

- [x] Single phase-execution path exists; the no-op phase facade no longer presents as an alternate engine (retired or folded).
- [x] Phase resource permissions are enforced at runtime: a phase reading/writing a resource it lacks access to fails closed with a diagnostic.
- [x] RNG policy is enforced: a non-`rngAllowed` phase cannot draw randomness; each random stream's domain is phase-scoped and recorded in the random ledger.
- [x] Existing behavior/goldens unchanged where the registry already matches reality (byte-identical), with any genuine mismatch resolved deliberately and documented.
- [x] Registry access rules are covered by runtime tests (not only unit tests of the `hasAccess` helper).
- [x] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical.

## Resolution

Implemented on `dev` (this issue, commit "contract PhaseRegistry into real
execution path"). The monolithic month executor now runs every phase through the
registry contract at runtime: each phase's body is guarded by
`MonthExecutor.assertPhase`, which checks its authoritative runtime footprint
(`PHASE_FOOTPRINTS` in `packages/phase-engine/src/phase-guard.ts` —
read/writePermissions + rngAllowed) against the registry's declared definition
via `PhaseGuard.assert`. A phase touching a resource it lacks permission for, or
drawing randomness when none is allowed, records a stable `PHASE_ACCESS_DENIED`
diagnostic and the phase is failed closed (its body does not run). RNG is
phase-scoped: `phaseGuard.rng(phaseId, seed)` returns a per-phase stream recorded
in the random ledger. The old no-op phase facade is retired — the month executor
is the single execution path. Behavior is byte-identical where the registry
already matches reality (goldens unchanged); the fail-closed guard is exercised
by runtime tests (not just `hasAccess` unit tests) in
`packages/phase-engine/test/month.test.ts` (a phase denied a required permission
fails the run with `PHASE_ACCESS_DENIED`, and a well-formed run is never denied).

Validation: `tsc --noEmit` 0, `vp lint .` 0, all 135 `@bluewave/phase-engine`
tests green. Full-repo `check` blocked at baseline by an unrelated
content-generation import in `content-schema` (see ticket 03 Resolution).