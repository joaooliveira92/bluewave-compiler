# Index — RULES.md compliance

Pointer (archived): `.scratch/archive/rules-compliance/spec.md`

Close the `RULES.md` audit gaps (authoritative wall-clock in `transitionRecord`;
untagged `instanceof` errors; cast-trusted boundaries; ambient `node:fs` in the
compiler parse stage; raw `JSON.stringify` for archetypes; the console allowance)
and freeze each always-apply rule as a fail-closed preflight ratchet gate
(ADR-0106 pattern). Governance only — goldens stay byte-identical.

- **Triage:** archived — all 7 tickets resolved.
- **Status:** archived (2026-10-13) — all tickets resolved; files moved to
  `.scratch/archive/rules-compliance/`.
- **Grounds:** `RULES.md`, `.ai/ENGINEERING-CONTRACT.md`, ADR-0004, ADR-0100,
  ADR-0102/0105, ADR-0106, ADR-0107, ADR-0125, ADR-0128.
