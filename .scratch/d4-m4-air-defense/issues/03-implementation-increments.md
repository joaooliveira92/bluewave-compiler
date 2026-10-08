## Question

Which sections of DESIGN-45 are implementation tickets for D-4?

From the 29 sections:
- §1 (Defense Layers) — layer resolution order in module
- §2 (State) — AirDefenseState interface
- §3 (System Definition) — AirDefenseSystemDefinition interface
- §4 (Attack Types) — eligibility matrix
- §5 (Engagement Outcomes) — KILL/DAMAGE/ABORT/DISRUPTION/NO_EFFECT
- §6 (Disruption) — separate from D-3 disruption, AA-specific
- §7-10 (Heavy/Medium/Light AA Eligibility) — layer-specific predicates
- §11-12 (Director Assignment + Scaling) — director model
- §13-14 (Radar-Directed Medium-AA Groups) — saturation model
- §15-16 (CIWS + Redundancy) — terminal defense
- §17 (Simultaneous Threats) — threat assignment
- §18 (Attack-Layer Matching) — eligibility matrix
- §19 (Engagement Resolution) — core formula
- §20 (Ammunition) — consumption model
- §21 (Damage + Power) — damage states

Proposed 6 implementation tickets:
INC-1: Defense system definitions + state model + constants
INC-2: Layer resolution + eligibility + engagement formula
INC-3: Director scaling + radar-directed groups
INC-4: CIWS + disruption + ammunition
INC-5: Records + ordering + reason codes + contracts
INC-6: Engine stage wiring + two-process + gate