## Question

What new reason codes, records pattern, and `*_v1` contracts does D-3 require?

Known inputs:
- D-1 already ships `AIRCRAFT_MISSION_ROLE_INELIGIBLE` (for squadron eligibility checks).
- DESIGN-43 §38 requires mission assignment records; D-1/AircraftRecord covers development/production/squadron but not tactical mission events.
- DESIGN-38 §28 (combat records) and §29 (ordering) established the pattern for tactical events. Design-38 §36 defines 18 reason codes for movement/spotting/contact.

Questions:
1. Do CAP/strike missions create records in a new `AirCombatRecord` (per-mission-event) or extend `AircraftRecord`?
2. Reason codes: at minimum need codes for: CAP interception failure, strike aborted, target not found, CAP air-to-air kill/loss, bomb miss, a/c lost operationally, no valid target. What is the complete set, with deferred markers?
3. Contracts: what state schemas need `*_v1` contracts? CAP patrol state per squadron? Strike mission state? Air combat outcome?
4. Ordering: how are CAP/strike records ordered relative to existing combat records (DESIGN-38 §29)?

Deliverable: complete reason-code set (shipped + deferred markers), record type design, contract list (count + names), ordering rule.