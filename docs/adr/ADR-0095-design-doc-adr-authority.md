# ADR-0095: Design docs are normative; ADRs amend them and record the amendment

## Status

Accepted 2026-10-10.

## Context

The canonical game-design docs (`README.md`, `docs/vision/`, `docs/domain/`,
`docs/architecture/`, `docs/rules/`, `docs/delivery/`, `docs/acceptance/`) were
migrated verbatim from `SOURCE-DESIGN-v1.0.md` on 2026-08-10 and each declares
`> **Canonical status:** Normative design specification.` Since then 90+ ADRs
have changed implemented behaviour, but the design docs were left frozen. Only
`DESIGN-22` (ADR-0067) and `DESIGN-21` (ADR-0093) carried an in-doc note.

Two readers therefore disagree about the source of truth: one cites the "canonical
baseline", the other cites the ADR. A 2026-10-10 scan also found the
supporting indexes had rotted — a stale ADR index and 151 dead links in
`docs/requirements/`.

## Decision

1. **The DESIGN docs remain the normative baseline.** They describe intended game
   behaviour and are not rewritten when implementation refines it.

2. **An ADR that changes normative behaviour *is* the amendment.** Where an ADR
   supersedes, extends, or constrains a DESIGN rule, the ADR wins on the point it
   decides; the DESIGN text stands everywhere the ADR is silent. This is the same
   precedence `README.md` already sets (architectural rules → subsystem rules →
   …), with ADRs acting as recorded amendments to the subsystem rules.

3. **Every amendment is recorded in two places, and they must agree.**
   - In the DESIGN doc, a one-line banner in the header block:
     `> **Amended by:** ADR-NNNN, …`
   - In the index `docs/adr/AMENDMENTS.md`, the DESIGN doc's row listing its
     amending ADRs.

4. **Mechanical integrity is enforced, not remembered.** `pnpm preflight` (and
   therefore `pnpm dev` and `pnpm check`) runs `scripts/docs-check.cjs`, which
   fails on:
   - broken relative links between canonical docs; and
   - an ADR index (`docs/adr/README.md`) out of sync with the ADR files, or a
     stale "next number".
   It **warns** on any ADR that references a `DESIGN-N` but is not yet classified
   in `docs/adr/AMENDMENTS.md`, so new amendments surface as candidates rather
   than drifting silently.

5. **`SOURCE-DESIGN-v1.0.md` is frozen provenance, not the living spec.** It is
   retained only as the migration audit's SHA anchor and MUST NOT be edited.

6. **Superseded agent/bootstrap docs are labelled, never deleted.** A doc replaced
   by `AGENTS.md` + `.ai/ORCHESTRATION.md` carries a `Superseded` banner (the
   pattern `.ai/ROADMAP.md` already uses).

## Alternatives considered

- **Rewrite the DESIGN docs to match the code.** Rejected: churns ~45 migrated
  files, loses the audit trail, and recreates the same drift on the next change.
- **Declare ADRs authoritative and demote the DESIGN docs.** Rejected: the DESIGN
  docs are the only complete, readable specification; ADRs are decisions about it,
  not a replacement.
- **Rely on discipline to keep annotations current.** Rejected: without a gate the
  default fate is sediment (the 2026-10-10 scan is the evidence).

## Consequences

- The authority question is answered once; `docs/adr/AMENDMENTS.md` is the
  authoritative cross-reference.
- A new ADR must classify itself in `AMENDMENTS.md`; the gate flags the rest.
- The reconciliation backlog (DESIGN docs whose amending ADRs are not yet
  annotated) is tracked in `.scratch/doc-reconciliation/`.
