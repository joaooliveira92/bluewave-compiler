# P-1 ticket 12 — withdrawal / disengagement (ADR-0073)

Date: 2026-10-08. Ticket 11 (ADR-0072) verified and closed in the same session.

- Rule: side strength (mean ship `hpOfState`, bp) strictly below 2_000 bp withdraws; both below = `mutual_disengagement`. Elimination (incl. ADR-0026 tie) takes precedence. Contract field `withdrawalStrengthThresholdBp`.
- Sweep (30 seeds, 2v2): equal fleets 97% disengaged, mean sunk 0.37, 47.9 min; 30 kn vs 14 kn fast side 80%; torpedo vs unarmed 97% attacker.
- Re-pinned (ADR-0007): auto-resolve baseline #1 `bee00786…`→`53b93ad7252fdb04…`; ac6 baseline #2 `f762c585…`→`24dd6c7876d43522…`. Goldens unchanged (10/10).
- Downstream: `apps/desktop` commitMonth decisive-threshold test now pins a seed that sinks a loser ship (default seed ends by break-off).
- Review: APPROVE (medium/low notes: shell-sources-persist assertion weaker; add e2e mutual_disengagement assertion — tracked, not blocking).
