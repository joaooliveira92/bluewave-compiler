# Index — RULES.md compliance

Pointer: `.scratch/rules-compliance/spec.md`

Close the `RULES.md` audit gaps (authoritative wall-clock in `transitionRecord`;
untagged `instanceof` errors; cast-trusted boundaries; ambient `node:fs` in the
compiler parse stage; raw `JSON.stringify` for archetypes; the console allowance)
and freeze each always-apply rule as a fail-closed preflight ratchet gate
(ADR-0106 pattern). Governance only — goldens stay byte-identical.

- **Triage:** `ready-for-agent` — ready for slicing.
- **Status:** sliced — 7 frontier-ordered tickets at
  `.scratch/rules-compliance/issues/` (all unblocked).
- **Grounds:** `RULES.md`, `.ai/ENGINEERING-CONTRACT.md`, ADR-0004, ADR-0100,
  ADR-0102/0105, ADR-0106, ADR-0107, ADR-0125, ADR-0128.
