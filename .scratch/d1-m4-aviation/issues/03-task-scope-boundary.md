## Question

Which DESIGN-43 sections ship in D-1 vs deferred to later sprints?

DESIGN-43 has 41 sections. D-1 needs to define the boundary:
- **IN scope for D-1:** §§1-6 (aircraft types, model, state, development request, proposal, project), §§11-14 (private ventures, inventory states, squadron state), §§15-16 (auto-equip), §§17-18 (re-equipment), §§19-21 (expansion, basing, damaged disposition), §§32 (basing classes), §§35 (inventory allocation), §§38-41 (records, ordering, reason codes, validation).
- **Deferred:** §§7-10 (development duration, proposal generation, attribute allocation, proposal review) — these are the RNG-heavy core that needs careful stream design; §§22-31 (mission roles — tactical); §§33-34 (mission eligibility, aircraft availability — tactical); §§36-37 (experience/fatigue, production — DESIGN-28/separate).
- **Split consideration:** §§7-10 might ship in D-1 if the development pipeline is incomplete without them; similarly §§33-34 if we need minimum availability predicates for squadron state validation.

Decision: exact scope fence, with rationale per section.

## Type

task