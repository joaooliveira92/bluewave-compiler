# DESIGN-51: UI And Player Interaction

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-51`

Monthly Player Loop:

1. Review previous results.
2. Resolve mandatory decisions.
3. Review budget and warnings.
4. Manage projects and force plans.
5. Issue deployment and mission orders.
6. Review diplomacy and objectives.
7. Commit turn.
8. Resolve tactical engagements or auto-resolve.
9. Review end-of-month report.

Decision Classes:

- Mandatory.
- Exception-driven.
- Optional administrative.

Primary Interfaces:

- Strategic map.
- Nation dashboard.
- Fleet list.
- Design editor.
- Construction and dockyard.
- Research.
- Diplomacy.
- Intelligence.
- Officers and divisions.
- Aviation.
- War and objectives.
- Reports.
- Tactical order of battle.

Information Display:

- Stale or uncertain information shows:
  - observation date;
  - confidence;
  - source;
  - estimate range.
- Hidden values are not exposed through tooltips or derived totals.
- Player-facing reports respect fog of war.

Automation Policies:

- Repairs.
- Radar installation.
- Officer assignment.
- Squadron re-equipment.
- Ship naming.
- Trade protection.
- Foreign stations.
- Division replacement.
- Scrapping recommendations.
- Research reallocation.
- Inventory replenishment.
- Automation produces auditable commands.
- Player may lock assets against automation where permitted.

Logs:

- Human-readable logs are generated from structured domain events.
- Logs are never authoritative state.
