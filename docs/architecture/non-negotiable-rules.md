# DESIGN-57: Non-Negotiable Architectural Rules

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-57`

- Campaign setup must be deterministic.
- Scenario compilation must be reproducible.
- All runtime randomness must use domain-separated streams.
- Player and AI commands must be validated through domain contracts.
- UI state must never be authoritative simulation state.
- Localized text must never control mechanics.
- Derived values must not compete with canonical authority.
- Financial changes must pass through a ledger.
- Long-running work must use explicit projects.
- Wars must support coalitions and separate peace.
- Territory ownership and military control must remain separate.
- Knowledge must remain separate from truth.
- Tactical simulation must support auto-resolution.
- Save files must pin content, formulas, AI, and RNG versions.
- Every monthly turn must end in a validated canonical snapshot.
- No campaign is start-ready without first-turn, save/load, and hash proof.
