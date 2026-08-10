# DESIGN-54: Testing And Acceptance

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-54`

Required Test Classes:

- Unit tests.
- Invariant tests.
- Property-based tests.
- Metamorphic tests.
- Replay tests.
- Save/load tests.
- Compiler tests.
- AI legality tests.
- Monte Carlo balance tests.
- Performance tests.

Deterministic Acceptance:

- Same inputs and commands produce identical hashes.
- Save/load preserves future outcomes.
- UI actions do not alter RNG.
- Tactical replay reproduces results.
- Campaign compilation is reproducible.

Scenario Matrix:

- Four scenarios.
- Ten canonical player slots.
- Forty slot/scenario tests.
- Tests include active, inactive, and continuity-gated behavior.
- Historical 1920 and 1935 Austro-Hungarian slot must fail cleanly.
- alternate_continuity_v1 must activate it deterministically.
- Ottoman/Turkey must remain a distinct AI-only identity.

Start-Readiness Gates:

1. Content pack validation passes.
2. Scenario participation is complete.
3. All required canonical inputs exist.
4. Campaign compilation succeeds.
5. Initial world state materializes.
6. Initial fleets and projects materialize.
7. Initial economy and ledgers balance.
8. Initial research and technology state validates.
9. Initial deployment and obligations validate.
10. First monthly turn completes.
11. Tactical or auto-resolved battle path validates.
12. Save/load reproduces state and future outcome.
13. Repeated compilation and execution produce identical hashes.

A campaign is not start-ready merely because schema and seed rows exist.
