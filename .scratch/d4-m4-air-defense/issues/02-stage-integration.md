## Question

What is the stage position, integration pattern, and no-op guarantee for the `resolveAirDefense` engine stage?

D-3 wired `resolveAirCombat` at step 7.7 (after weather, before spotting). Air defense should resolve AFTER air-combat CAP intercepts (step 7.7) and BEFORE movement/spotting resolves (step 8).

Proposed: step 7.8 — `resolve_air_defense`, after `resolve_air_combat`, before `resolve_sensors_spotting`. Strict no-op when no AA-relevant context present (no defending ships with AA systems, no incoming air attacks). Optional context in `AdvanceMinuteInput`, threaded through `advanceMinutes`.

Decision: confirm step 7.8 position and the no-op guarantee pattern (mirrors smoke/resolveSmoke).