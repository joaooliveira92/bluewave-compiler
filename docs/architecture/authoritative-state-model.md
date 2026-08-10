# DESIGN-06: Authoritative State Model

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-06`

Campaign Aggregate:

- Owns:
  - campaign identity;
  - campaign configuration;
  - current strategic date;
  - current phase cursor;
  - ruleset references;
  - content-pack references;
  - RNG manifest;
  - terminal state;
  - references to subordinate aggregates.
- Does not directly mutate every subordinate entity.

Primary Aggregates:

- CampaignState
- WorldState
- NationState
- FleetState
- ResearchState
- PoliticalState
- IntelligenceState
- WarState
- TacticalBattleState
- PersistenceManifest

Authority Categories:

- canonical:
  - Persisted authoritative state.
- derived:
  - Recomputed from canonical state.
- cached_projection:
  - Optional persisted cache validated against derivation.
- ledger:
  - Append-only historical record.
- ephemeral:
  - Runtime-only state reconstructed or discarded at stable boundaries.

Derived Values Include:

- Blockade strength.
- Foreign-station fulfillment.
- Battle eligibility.
- Effective crew quality.
- Ship classification cache.
- Shipyard usage.
- Area base overload.
- Treaty compliance.
- Operational naval strength.
- Effective AA strength.
- Invasion eligibility.
- Maintenance warnings.

Stable State Invariants:

- A ship belongs to exactly one nation.
- A ship has exactly one current compiled design version.
- A commissioned ship occupies exactly one strategic location.
- A ship cannot be both under construction and commissioned.
- A ship cannot participate in two unresolved battles.
- A possession has one legal owner and at most one military controller.
- A construction project remains between zero and total work.
- A completed project reserves no construction capacity.
- A ship belongs to at most one permanent division.
- A sunk ship accepts no operational orders.
- Two nations cannot be allied and at war in the same relation context.
- Technology prerequisites must be satisfied before discovery.
- Tactical persistent units must map to campaign assets or declared temporary
  generated assets.
- Every financial posting balances against a source and category.
- Every random outcome records a stable random-stream key.
