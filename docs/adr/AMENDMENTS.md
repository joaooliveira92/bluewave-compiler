# DESIGN amendments

Authoritative cross-reference for ADR-0095: which ADRs amend which DESIGN doc,
and which merely implement or bound one. The DESIGN docs are the normative
baseline; an ADR listed under **Amendments** wins on the point it decides and the
DESIGN text stands everywhere the ADR is silent.

Keep this file and each DESIGN doc's `> **Amended by:**` header line in sync.
`pnpm preflight` fails when an ADR references a `DESIGN-N` but is classified in
neither section, so a new amendment must be recorded here rather than drift.

## Amendments

ADRs that change a DESIGN rule (supersede, extend, or constrain it).

| DESIGN doc | Amending ADRs |
| --- | --- |
| `DESIGN-07` Numeric And Temporal Contract | ADR-0037 |
| `DESIGN-08` Determinism And Randomness | ADR-0103 |
| `DESIGN-12` Nations And Governments | ADR-0089, ADR-0090, ADR-0092 |
| `DESIGN-13` Economy And Accounting | ADR-0060 |
| `DESIGN-17` Diplomacy | ADR-0010, ADR-0054 |
| `DESIGN-21` Ship Design | ADR-0063, ADR-0066, ADR-0070, ADR-0076, ADR-0085, ADR-0093, ADR-0132 |
| `DESIGN-22` Ship Classification | ADR-0037, ADR-0067, ADR-0088, ADR-0116 |
| `DESIGN-23` Construction, Repair, And Rebuild | ADR-0064, ADR-0077, ADR-0078, ADR-0080, ADR-0083 |
| `DESIGN-24` Fleet Management | ADR-0062 |
| `DESIGN-26` Divisions And Formations | ADR-0065, ADR-0086 |
| `DESIGN-27` Officers And Personnel | ADR-0065 |
| `DESIGN-37` Battle Generation | ADR-0015, ADR-0016, ADR-0056 |
| `DESIGN-38` Tactical Combat | ADR-0019, ADR-0034, ADR-0051, ADR-0052, ADR-0073 |
| `DESIGN-39` Gunnery | ADR-0048, ADR-0072 |
| `DESIGN-40` Torpedoes | ADR-0046 |
| `DESIGN-41` Damage, Fire, And Flooding | ADR-0047, ADR-0049, ADR-0050, ADR-0098 |

## Scope and process (no design change)

ADRs that reference a DESIGN doc only to implement, scope, or bound it, or that
change process without changing normative behaviour.

- ADR-0001 (package boundaries), ADR-0009 (research phase id), ADR-0011 (M1 scope),
  ADR-0012 (division package boundary), ADR-0013 (ship-type classifier), ADR-0014
  (reachable mission subset), ADR-0017 (auto-resolution proof scope), ADR-0018
  (movement/spotting scope), ADR-0020 (gunnery scope), ADR-0021 (armor/damage scope),
  ADR-0022 (weather scope), ADR-0025 (weather snapshot wiring), ADR-0026
  (auto-resolution orchestrator), ADR-0027 (battle-resolution phase wiring),
  ADR-0030 (desktop bridge boundary), ADR-0031 (torpedo slice scope), ADR-0033
  (mine-pressure scope), ADR-0039 (coastal-defense scope), ADR-0040 (smoke/damage-control
  scope), ADR-0041 (carrier-operations boundary), ADR-0042 (air-defense decisions),
  ADR-0044 (air-defense merge resolution), ADR-0045 (playability re-prioritization),
  ADR-0095 (docs/ADR authority), ADR-0096 (playable-nation coverage policy),
  ADR-0097 (first-release combat surface), ADR-0129 (dockyard-project status model),
  ADR-0130 (BULGE refit kind), ADR-0131 (REARMAMENT armament-change conditions).
