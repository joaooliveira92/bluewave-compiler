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
**Status:** open
**Frontier:** yes

- [ ] Single phase-execution path exists; the no-op phase facade no longer presents as an alternate engine (retired or folded).
- [ ] Phase resource permissions are enforced at runtime: a phase reading/writing a resource it lacks access to fails closed with a diagnostic.
- [ ] RNG policy is enforced: a non-`rngAllowed` phase cannot draw randomness; each random stream's domain is phase-scoped and recorded in the random ledger.
- [ ] Existing behavior/goldens unchanged where the registry already matches reality (byte-identical), with any genuine mismatch resolved deliberately and documented.
- [ ] Registry access rules are covered by runtime tests (not only unit tests of the `hasAccess` helper).
- [ ] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical.