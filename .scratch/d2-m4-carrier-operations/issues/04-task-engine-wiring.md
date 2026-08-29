**Type:** task
**Status:** resolved

Engine wiring resolved:

- **Phase stage**: `resolve_carrier_operations` at order **7.3**, `rngAllowed: true`. After `resolve_aircraft_development` (7.2), before `battle_generation` (7.5).
- **`resolveCarrierOperations` per nation per month**: Iterates carrier-capable ships (design.aircraftCapacity > 0). For each: advance deck cycles (ongoing prep/launch/recovery), resolve weather suspend state, process ordnance updates, update damage effects. No aircraft movement or tactical combat — that's D-3.
- **Tactical minute-advance**: Deferred to D-3. D-2 operates at strategic-month granularity only. Future D-3 step would be a new minute-advance stage (step ~4.5 between weather and spotting).
- **Two-process child**: `run-carrier-operations-child.ts` following `run-aircraft-child.ts` pattern. Needs a campaign with carrier-capable ships.
- **Integration-boundary test**: Zero carrier-capable ships = strict no-op. Goldens and B-2/B-3/B-4/B-5/B-6 hashes unchanged. `BattleResolver`/`StrengthCalculator` unmodified. Verify with diff.