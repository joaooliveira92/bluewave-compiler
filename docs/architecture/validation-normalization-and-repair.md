# DESIGN-53: Validation, Normalization, And Repair

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-53`

Validation:

- Detects invalid state.
- Does not mutate state.

Normalization:

- Converts equivalent representations into canonical ordering and formatting.
- Cannot change gameplay meaning.

Repair:

- Changes invalid generated or cached state only under an explicit repair policy.
- Every repair is logged.
- High-authority missing content cannot be fabricated.

Fatal Errors:

- Missing nation ownership.
- Missing canonical possession definition.
- Missing required technology prerequisite.
- Invalid campaign participant mapping.
- Unresolvable aggregate identity conflict.
- Broken financial ledger.
- Unsupported content or ruleset mismatch.

Repairable Errors:

- Missing cached projection.
- Invalid display ordering.
- Recomputable derived classification cache.
- Missing report index.
- Non-authoritative duplicate UI metadata.
