# 03: Fidelity and deviation policy

**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Decide how this effort treats disagreements between the authoritative manual (`docs/manual.pdf`,
BUILDING SHIPS + APPENDIX 1) and the app's normative rules specs and code, and what shape the
deliverable takes.

- When the manual and DESIGN-22/DESIGN-23/code disagree, which wins, and how is the deviation
  recorded (ADR vs rules-doc amendment vs glossary)? The rules docs already encode a richer model
  than the manual (work micro-units, latent defects, `IMPOUNDED`, capacity-pressure delay); which
  of those richer behaviours are kept as deliberate deviations and which are trimmed to the manual?
- Does the outcome amend the normative rules docs (DESIGN-22/DESIGN-23) in place, produce a new
  sprint spec under `.scratch/` that references them, or both?
- What is the acceptance/validation bar for "production-ready" (fidelity evidence, determinism,
  goldens, `pnpm check`), and how is manual parity proven?
- Confirmation of the EARLY era band: which manual rules are implementable now and which are
  recorded deferred.

Capture the outcome as ADR(s) and any glossary terms.

## Answer

Resolved 2026-10-12 (autonomous, per AGENTS.md; grounded in the repo's existing authority
policy). **No new ADR** — the policy is already settled by ADR-0095 and precedented by ADR-0067.

1. **Authority.** DESIGN-21/22/23 stay the normative *implementation* baseline; the RTW3 manual
   (`docs/manual.pdf`) is the authoritative reference for *intended* behaviour. Where the manual
   and a DESIGN doc/code disagree, resolve it one of two ways: align to the manual, or record a
   **deliberate deviation** as an ADR (ADR-0067 is the precedent — e.g. CA main gun kept strictly
   `>6 in` so `CL` keeps the 6 in gun; `ARMOUR_MODIFICATION` kept broader than the manual's rebuild
   list). Either way the outcome is written down; silent divergence is prohibited (DESIGN-23
   header; ADR-0095 §2).
2. **Recording a deviation.** Per ADR-0095 §3: an ADR amends the DESIGN doc on the point it
   decides; add the `> **Amended by:** ADR-NNNN` banner to the DESIGN header **and** the row in
   `docs/adr/AMENDMENTS.md` (the gate fails otherwise). Glossary only for vocabulary shifts.
3. **Richer-than-manual depth is kept, not trimmed.** DESIGN-23's work micro-units, latent
   defects, `IMPOUNDED` status, and capacity-pressure delay are deliberate depth the manual need
   not mention; this effort does not remove them to "match" the manual. It adds the manual
   mechanics that are missing (instalments/halt/delay, batch, engine acceleration, dock/capacity,
   foreign yards) and verifies classification.
4. **Deliverable shape.** Because DESIGN-22/23 already specify most of the target, the hand-off is a
   sprint spec under `.scratch/shipbuilding-process/` that (a) records parity/deviation decisions as
   ADRs where a rule changes and (b) slices implementation tickets for the specified-but-unimplemented
   mechanics; amend DESIGN-22/23 in place only where a boundary or rule genuinely changes. Proceed
   to `to-spec` → `to-tickets` once tickets 04–11 are resolved.
5. **Validation bar for "production-ready".** Manual-parity claims cite the research notes
   (`docs/research/manual-*.md`, p131–134 / p30–33); every changed rule has
   unit/boundary/determinism/persistence tests; `pnpm check` (preflight + typecheck + lint + full
   tests + e2e) passes; cross-process determinism holds; goldens updated deliberately
   (ADR-0099, ADR-0106, ADR-0107).
6. **Era band.** EARLY (1880–1899) confirmed; later-era constructs stay deferred / out of scope.

Prior art: ADR-0067 already settled several classification and refit questions against the manual;
"Classification fidelity to Appendix 1" and "Rebuild parity" must extend it, not repeat it.
