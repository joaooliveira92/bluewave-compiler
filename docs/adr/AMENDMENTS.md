# DESIGN amendments

Authoritative cross-reference for ADR-0095: which ADRs amend which DESIGN doc.
The DESIGN docs are the normative baseline; an ADR listed here wins on the point
it decides and the DESIGN text stands everywhere the ADR is silent.

Keep this table and each DESIGN doc's `> **Amended by:**` header line in sync.
`pnpm preflight` warns when an ADR references a `DESIGN-N` but is not classified
here, so a new amendment surfaces as a candidate instead of drifting silently.
Being listed here is not required for an ADR that only *implements* a DESIGN doc
(a scope/integration-boundary ADR) or that changes no design behaviour.

| DESIGN doc | Amending ADRs |
| --- | --- |
| `DESIGN-12` Nations And Governments | ADR-0089, ADR-0090, ADR-0092 |
| `DESIGN-13` Economy And Accounting | ADR-0060 |
| `DESIGN-17` Diplomacy | ADR-0010, ADR-0054 |
| `DESIGN-21` Ship Design | ADR-0063, ADR-0066, ADR-0070, ADR-0076, ADR-0085, ADR-0093 |
| `DESIGN-22` Ship Classification | ADR-0067, ADR-0088 |
| `DESIGN-23` Construction, Repair, And Rebuild | ADR-0064, ADR-0077, ADR-0078, ADR-0080, ADR-0083 |
| `DESIGN-24` Fleet Management | ADR-0062 |
| `DESIGN-26` Divisions And Formations | ADR-0065, ADR-0086 |
| `DESIGN-27` Officers And Personnel | ADR-0065 |
| `DESIGN-37` Battle Generation | ADR-0015, ADR-0016, ADR-0056 |
| `DESIGN-38` Tactical Combat | ADR-0019, ADR-0034, ADR-0051, ADR-0052, ADR-0073 |
| `DESIGN-39` Gunnery | ADR-0048, ADR-0072 |
| `DESIGN-40` Torpedoes | ADR-0046 |
| `DESIGN-41` Damage, Fire, And Flooding | ADR-0047, ADR-0049, ADR-0050 |
