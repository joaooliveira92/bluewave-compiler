**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** yes

# INC-6: Hazards + night ops + weather suspension (§§21-25)

## Deliverable

- Hazard exposure: `fueledAircraft*10 + armedAircraft*10 + torpedoAircraft*15 + guidedWeaponAircraft*20 + fuelingActive*100 + ordnanceHandling*100` (§21)
- Hazard checks only after eligible hit/fire spread/crash/fuel leak/ordnance accident (§21)
- Base conditional probabilities: fuel ignition=2000bp, ordnance reaction=1500bp, torpedo warhead=2500bp, missile/guided=2000bp, hangar fuel propagation=2500bp, active fueling=5000bp (§22)
- Final: `clamp(0,10000,floor(baseBp * exposureBp * damageBp * firefightingBp * deckConfigBp / 10_000^4))` (§22)
- Each reaction creates separate causal damage package under DESIGN-41 (§22)
- Night recovery eligibility: night_carrier_operations tech + deck lighting + valid contact + wind + weather + command + fuel. Emergency only without tech (§23)
- Loss bases: daylight=250bp, twilight=750bp, trained night=2500bp, emergency=7500bp (§24)
- Failure results: bolter, deck accident, lost overboard, collision, severe crash, pilot+aircraft loss (§24)
- Weather suspension: sea state 8-9 = all fixed-wing suspended. State 7 = heavy jets suspended, others 5000bp rate. Wind outside limits = affected suspended. Heavy precip = jet 5000bp, piston 7500bp. Extreme precip = all launch suspended. Vis <2nm = visual recovery suspended unless ILS. Deck fire ≥5000 = launch/recovery suspended (§25)
- `CarrierHazardExposure_v1`, `CarrierNightRecovery_v1`, `CarrierWeatherSuspension_v1` contracts
- `CARRIER_AVIATION_FIRE_HAZARD`, `CARRIER_AVIATION_ORDNANCE_HAZARD`, `CARRIER_NIGHT_RECOVERY_INELIGIBLE`, `CARRIER_RECOVERY_OPERATIONAL_LOSS`, `CARRIER_OPERATIONS_SUSPENDED_BY_WEATHER` reason codes

## Acceptance criteria

AC-23 (hazard exposure), AC-24 (fire/explosion), AC-25 (night eligibility), AC-26 (night loss), AC-27 (weather suspension).