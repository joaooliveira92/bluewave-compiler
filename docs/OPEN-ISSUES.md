# Known Specification Issues

Status: audit registry (reconciled at M1 gate, 2026-08-12)

This file is the registry for ambiguity candidates detected from the canonical
source during the migration. Detection does not itself change the design; each
item is closed by one of: clarification, conversion to a ruleset constant,
classification as a balance target, or closure as sufficiently explicit.
Implementations MUST NOT silently resolve an open decision.

## The "126 items" claim — resolved

The figure `126` seen in `docs/PROGRESS.md`, `docs/audit/MIGRATION-AUDIT.md`,
`docs/audit/MANIFEST.json`, and `docs/requirements/REQUIREMENT-MAP.md` is a
**migration-time, lexical, first-pass audit snapshot** — the count of
`Open audit candidates` produced when the source `SOURCE-DESIGN-v1.0.md` was
split into `DESIGN-*` documents. It is not a live list of unresolved decisions.

As of the M1 acceptance gate (2026-08-12):

- **Zero** `OPEN DECISION` markers remain in any canonical design document
  (verified `rg -i "open decision" docs/` → only this file and PROGRESS policy
  text).
- **Zero** blocking ambiguity is open across every M1 governing design contract
  (DESIGN-03/04/06/07/08/09/10/11/12/13/14/15/17/20/21/22/23/25/31/32/52 etc.).
- Every M1 ambiguity that was actually encountered during implementation was
  closed by an explicit recorded resolution: ADR-0001…ADR-0011 and the per-sprint
  brief/report records (`docs/adr/`, `.ai/reports/`).

Items that are deferred (not silently dropped) but still require future review
are tracked in the appropriate per-track documents rather than here as a stale
global count: see `.ai/SPRINT-PLAN.md` (deferred mechanics/scoping rows) and
`docs/acceptance/m1-capability-registry.md` (deferred `CONTENT_ONLY` capability).

Any genuinely new open decision encountered from this point forward is recorded
here as an individual item (an `OPEN DECISION` marker in the governing doc + an
entry below) and MUST NOT be resolved by an implementation without an ADR or an
explicit decision-request.
