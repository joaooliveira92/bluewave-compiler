# 01 — Reconcile the canonical design docs with the ADR record

**Type:** task
**Status:** open
**Blocked by:** none
**Frontier:** yes

## Problem

The canonical game-design docs (`README.md`, `docs/vision/`, `docs/domain/`,
`docs/architecture/`, `docs/rules/`, `docs/delivery/`, `docs/acceptance/`) were
migrated verbatim from `SOURCE-DESIGN-v1.0.md` on 2026-08-10 and still declare
`Status: Canonical design baseline`. Since then 80+ ADRs (through ADR-0094) have
changed implemented behaviour, but only two design docs carry an amendment:

- `docs/rules/ship-classification.md` (DESIGN-22, ADR-0067 amendment).
- `docs/domain/armament-content.md` (new, ADR-0093).

Every other behaviour-changing ADR lives only in `docs/adr/`, so the design docs
silently diverge from what the engine does. A reader who trusts the "canonical
baseline" gets stale rules.

## Scan findings (2026-10-10)

Mechanical defects — **fixed in the same change as this ticket**:

- `docs/adr/README.md` — index said "the next number is ADR-0093" and stopped at
  row 0092; corrected to ADR-0095 and added rows 0093/0094.
- `docs/requirements/REQUIREMENTS.md` and `docs/requirements/REQUIREMENT-MAP.md`
  — 151 broken relative links (`../docs/<subdir>/…` → `../<subdir>/…`).

Open reconciliation work — **this ticket**:

| DESIGN doc | ADRs that amend it but are absent from the doc |
| --- | --- |
| DESIGN-21 Ship Design | ADR-0063, ADR-0066, ADR-0070, ADR-0076, ADR-0085, ADR-0093 |
| DESIGN-22 Ship Classification | ADR-0013, ADR-0037, ADR-0088 (ADR-0067 partially noted) |
| DESIGN-23 Construction/Repair/Rebuild | ADR-0063, ADR-0064, ADR-0070, ADR-0077, ADR-0078 |
| DESIGN-26 Divisions And Formations | ADR-0012, ADR-0018, ADR-0065, ADR-0086 |
| DESIGN-33 Trade, Raiding, Merchant Shipping | ADR-0014, ADR-0088 |
| DESIGN-39 Gunnery | ADR-0020, ADR-0021, ADR-0048, ADR-0072 |
| DESIGN-25 Deployment/Logistics | ADR-0011, ADR-0033 |
| DESIGN-17 Diplomacy | ADR-0010 (diplomacy war model) |

Also unmanaged (no amendment mechanism at all): national naval profiles
(ADR-0089/0090), live AI procurement (ADR-0091), national content pipeline
(ADR-0092), build-time era multiplier (ADR-0080), loss ledger (ADR-0061), fleet
movement orders (ADR-0062), budget allocation (ADR-0060), officer corps
(ADR-0065), design studies (ADR-0085).

Legacy agent docs superseded by `AGENTS.md` + `.ai/ORCHESTRATION.md`: labelled with a
`Superseded (2026-10-10)` banner: `engine-suite.md`, `.ai/BOOTSTRAP-PROMPT.md`,
`.ai/RELEASE-PROMPT.md`. (`SOURCE-DESIGN-v1.0.md` is *not* edited — it is the migration
audit's SHA anchor; ADR-0095 records it as frozen provenance.) Note
`.ai/IMPLEMENTATION-PROMPT.md`, `.ai/AUTONOMOUS-AGENT.md`, and `.ai/REQUIREMENTS.md` are
still referenced by the active roles/commands, so they were **not** marked superseded.

## Done (2026-10-10)

- **ADR-0095** settles the authority question; `docs/adr/AMENDMENTS.md` is the amendment index.
- `> **Amended by:**` lines added to the 14 DESIGN docs already classified.
- `scripts/docs-check.cjs` added and wired into `pnpm preflight` / `pnpm check` / CI
  (fails on broken links and ADR-index drift; warns on unclassified amendments).
- Stale ADR index and the 151 `docs/requirements/` links fixed; README doc map extended.
- Superseded banners on the three legacy bootstrap docs.

## Remaining

- Classify the 25 ADRs the gate currently flags as candidate amendments (add the real
  ones to `docs/adr/AMENDMENTS.md`, ignore scope/integration-boundary ADRs).

## Proposed approach

1. Add a short `> **Amended by:** ADR-NNNN …` line (or an "Implementation
   amendments" section) to each affected DESIGN doc, pointing at the ADR that
   governs current behaviour. Do not rewrite the frozen normative text; annotate.
2. Decide the authority question once: either the design docs remain the
   normative baseline and ADRs are amendments, or ADRs are authoritative where
   they conflict. Record the decision as an ADR.
3. Mark or relocate the legacy bootstrap docs.

## Acceptance

- Every ADR that declares a change to a DESIGN subsystem is linked from that
  DESIGN doc's amendment section, or explicitly recorded as superseded.
- `README.md`'s document map lists all canonical docs (`docs/domain/armament-content.md`,
  `docs/ships-nation-orientation.md`, `docs/nations/national-content-completeness.md`).
- No unlabelled doc from the legacy-bootstrap set remains.

## Comments
