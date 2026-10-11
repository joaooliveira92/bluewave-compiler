# Deferred work ledger

Single release-gate-auditable list of work an ADR has **recorded as deferred**
rather than completed. `AGENTS.md` forbids silently dropping deferred or
mechanics-gated work; this ledger is where that work is held to account.

**Contract (enforced by `scripts/docs-check.cjs`):**

- Every ADR whose `## Status` section flags a deferral (matches `deferr` or a
  non-hyphenated `pending`) MUST have a row here naming its `ADR-NNNN`.
- Every `ADR-NNNN` named here MUST exist, and the row's status MUST be `open` or
  `closed`.
- A closed row stays in the ledger (history), with the closing ADR or PR noted.

Reviewers check this file during the release verification gate (ADR-0099).

| ID | Source ADR | Deferred | Next step | Status |
| --- | --- | --- | --- | --- |
| D-1 | ADR-0056 | The unit of "effective strength" fed to the battle-generation floors (part 2). `ship.firepower` is provisional; the rules fix the numbers (300/150) but never define a point. | Decide the unit together with movement/contact, as a versioned ruleset constant with its own ADR and a golden refresh. | open |
| D-2 | ADR-0069 | The 1880-borders dataset (`world_1880.geojson`, GPL-3.0) carries a licence obligation into any distributed build. | Before release: obtain licence sign-off, or re-bake from a permissively licensed source, or remove the layer. | open |
| D-3 | ADR-0071 | Full migration of the five command screens onto one orchestration convention; the second (`RequestLifecycle`) convention remains. | Generalize the workflow adapter to accept any screen state, migrate Construction/Fleet/Treasury and Research/Diplomacy, delete the hand-rolled wiring. | open |