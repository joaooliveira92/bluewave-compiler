**Type:** implementation
**Status:** open
**Blocked by:** INC-1, INC-3
**Frontier:** yes

# INC-4: Strike preparation + launch + recovery (§§13-18)

## Deliverable

- `CarrierStrikeState` model with all §13 fields: strikeId, origin carriers, target report, aircraft/squadron allocations, escort, loadout, coordination, timing, fuel, spot, formation, mission, recovery plan, ruleset version, strike hash
- Base prep times: uncoordinated=20min, coordinated=30min, alert CAP=5min, search=10min, emergency re-strike=10min (§14)
- Strike-time modifiers: `clamp(5,90,ceil(base * crewBp * catapultBp * deckBp * damageBp * weatherBp * oversizedBp / 10_000^6))`. Shipped modifiers per §15 (improved crew=9000bp, modern crew=8000bp, catapult=9000bp, angled deck=9000bp, degraded deck=12500bp, heavy precip=15000bp, oversized=11000bp)
- Coordinated strike effects: 12000bp cohesion, 12000bp defense, 8500bp dispersion, 9000bp loss, 10min formation. Uncoordinated: 10000bp neutral, 5min formation. No penetration/damage improvement (§16)
- Spot-value launch limit: launchCycleAircraftCount ≤ finalSpotValue (§17)
- Launch rates: no catapult piston=2/min, 1 catapult=3/min, 2+ catapults=4/min, steam+light jet=2/min, 2+ steam=3/min, heavy jet=2/min (§18)
- `launchDurationMinutes = ceil(aircraftCount / rate)` (§18)
- `CarrierStrikeState_v1`, `CarrierLaunchRate_v1` contracts
- `CARRIER_STRIKE_EXCEEDS_SPOT_VALUE` reason code

## Acceptance criteria

AC-15 (strike state), AC-16 (prep times), AC-17 (time modifiers), AC-18 (coordinated strikes), AC-19 (spot limit), AC-20 (launch rate).