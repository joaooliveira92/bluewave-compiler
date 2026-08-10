# DESIGN-23: Construction, Repair, And Rebuild

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-23`

Unified Dockyard Project:

- design_study
- new_construction
- repair
- rebuild
- conversion
- infrastructure
- equipment_installation

Project State:

- planned
- authorized
- awaiting_capacity
- active
- halted
- delayed
- accelerated
- completed
- cancelled
- impounded

Project Accounting:

- Total work.
- Completed work.
- Paid work.
- Remaining work.
- Unit cost.
- Monthly capacity.
- Capacity reservation.
- Builder.
- Acceleration state.
- Delay state.

Construction Rules:

- Starts only after design approval.
- Up to twelve ships of one class may be ordered together.
- Additional ships of an approved design need no new study unless the design is
  modified.
- Progress equals paid effective work.
- Delayed projects receive no work and no work charge that month.
- Accelerated work costs 5% more and increases progress rate.
- Excess acceleration can impose seeded capacity-pressure delays.

Latent Defects:

- Determined from:
  - builder quality;
  - national traits;
  - design complexity;
  - acceleration;
  - foreign-yard context.
- Created at construction progression or completion through a stable stream.
- Stored as hidden authoritative state.
- May be discovered during trials, service, repair, or combat.
- Repairability is defect-specific.

Repairs and Rebuilds:

- Use one combined dockyard project where simultaneous.
- Repair work, machinery work, armor work, armament work, electronics, and
  conversion are separate work packages.
- Ships under major rebuild are unavailable.
- Rebuild validation differs from new-construction validation.
- Rebuild produces a new compiled design version.
- Individual ships of the same named class may have different design versions.

Scrapping:

- Cancels operational status.
- May produce salvage credit.
- Removes future maintenance.
- Treaty-required scrapping follows treaty deadlines and inspection rules.
