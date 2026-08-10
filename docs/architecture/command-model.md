# DESIGN-11: Command Model

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-11`

Command Lifecycle:

- submitted
- validated
- authorized
- reserved
- accepted
- locked
- resolving
- completed
- partially_completed
- rejected
- cancelled
- superseded

Command Requirements:

- Stable command identifier.
- Issuing participant.
- Target aggregate.
- Submission phase.
- Preconditions.
- Reserved resources.
- Resolution phase.
- Result.
- Machine-readable reason code.

Command Rules:

- AI uses the same command contracts as the player where practical.
- Commands never mutate authoritative state directly.
- Commands that become impossible during resolution produce explicit outcomes.
- Cancellation is allowed only before the command's lock or irreversible phase.
- Refunds and lost costs are defined by command type.
- Automated actions also produce commands and audit records.

Examples of Reason Codes:

- INSUFFICIENT_FUNDS
- INSUFFICIENT_CAPACITY
- TECHNOLOGY_UNAVAILABLE
- TREATY_PROHIBITED
- INVALID_ROUTE
- CANAL_ACCESS_DENIED
- SHIP_NOT_OPERATIONAL
- TARGET_NO_LONGER_VALID
- PROJECT_ALREADY_COMPLETED
- DIVISION_LOCATION_CONFLICT
- POLITICAL_AUTHORIZATION_DENIED
