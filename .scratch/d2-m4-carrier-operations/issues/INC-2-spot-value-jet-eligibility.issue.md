**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** yes

# INC-2: Spot value + modifiers + jet eligibility (§§6-10)

## Deliverable

- `baseSpotValue = floor(compiledAircraftCapacity / 2)` (§6)
- `finalSpotValue = floor(baseSpot * catapultBp * speedBp * deckConfigBp * damageBp * techBp * oversizedBp / 10_000^6)` — clamped 0..compiledAircraftCapacity (§7)
- Catapult multiplier: 0=10000bp, 1=11000bp, 2+=12000bp (§7.1)
- Speed multiplier: <20kt=6000bp, 20-24kt=8000bp, 24-28kt=10000bp, 28+=11000bp (§7.2)
- Deck configuration: straight=10000bp, deck-edge lift=11000bp, angled=12000bp (§7.3)
- Flight-deck damage: operational=10000bp, degraded=7500bp, heavily damaged=3500bp, launch-inoperable=0 (§7.4)
- Technology: basic=10000bp, improved=11000bp, modern=12000bp (§7.5)
- Jet carrier capability enum: NONE, LIGHT_JET_CAPABLE, HEAVY_JET_CAPABLE, MODERN_JET_CAPABLE (§8)
- Light-jet eligibility: ≥40,000t or ≥30,000t+catapult + early_jet_carrier_operations + physical predicates + carrierSuitable aircraft + weather/wind (§9)
- Heavy-jet eligibility: ≥40,000t + modern_jet_carrier_operations + catapult + arresting gear + angled deck + strength/heat (§10)
- `CarrierSpotValue_v1`, `JetCarrierCapability_v1` contracts
- `CARRIER_SPOT_VALUE_ZERO`, `JET_CARRIER_DISPLACEMENT_INSUFFICIENT`, `JET_CARRIER_CATAPULT_REQUIRED`, `HEAVY_JET_CARRIER_INELIGIBLE`, `HEAVY_JET_ANGLED_DECK_REQUIRED` reason codes

## Acceptance criteria

AC-7 (base spot), AC-8 (modifiers), AC-9 (speed-spot), AC-10 (jet capability), AC-11 (light jet), AC-12 (heavy jet).