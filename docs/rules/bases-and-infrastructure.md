# DESIGN-16: Bases And Infrastructure

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-16`

Infrastructure Types:

- Port capacity.
- Supply capacity.
- Repair capacity.
- Dock size.
- Shipyard construction capacity.
- Airbase capacity.
- Coastal defenses.
- Mine support.
- Missile batteries.

Dock Size:

- Limits the largest ship that can be built domestically.
- May limit major repair or rebuild eligibility.
- Expansion takes approximately one year unless modified.
- Each expansion increases capacity by an era-defined 1,000–2,000 ton step.
- Private industrial development may create explicit seeded expansion events.

Shipyard Capacity:

- Limits total active construction work.
- Submarine construction counts.
- Rebuild and repair use separate repair/refit capacity where defined.
- AMCs and designated small corvettes may be exempt according to ruleset.
- Reserved, occupied, damaged, and available capacity are tracked separately.

Area Support:

- Ships consume port and supply load based on type, size, status, and condition.
- Overload allocation follows deterministic supply priority.
- Unsupported ships suffer maintenance and crew penalties.
- Temporary presence is allowed through the battle phase.
- Compliance and penalties are evaluated at MonthClosingSnapshot.

Airbases:

- Base capacity begins at 20 aircraft where established.
- Expansion occurs in increments of 20.
- Technology and possession infrastructure limit maximum expansion.

Foreign Construction:

- Uses a formal contract.
- Limited by builder capability and capacity.
- May transfer technology insight.
- May be delayed or impounded by war.
- A delivery-guarantee treaty prevents discretionary impoundment but not physical
  impossibility caused by occupation or destruction.
