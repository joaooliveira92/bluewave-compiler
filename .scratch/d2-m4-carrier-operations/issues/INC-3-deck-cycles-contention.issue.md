**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** yes

# INC-3: Deck-cycle states + contention (§§11-12)

## Deliverable

- 13 deck-cycle states: UNREADY, READYING, SPOTTING, SPOTTED, LAUNCHING, FORMING, AIRBORNE, RETURNING, HOLDING, LANDING, REFUELING, REARMING, STRUCK_DOWN (§11)
- Validated explicit transitions — invalid = `INVALID_CARRIER_DECK_CYCLE_TRANSITION` (§11)
- Deck contention model: straight deck = 1 operation class at a time. Angled deck: launch/spotting + recovery overlap when damage/weather/traffic permit. Emergency recovery preempts (§12)
- Operation priority: 1. emergency recovery, 2. ordinary recovery (below reserve fuel), 3. alert CAP, 4. active strike, 5. search, 6. ordinary CAP, 7. spotting, 8. refueling/rearming, 9. strike-down. Equal priority = ascending operation id (§12)
- `CarrierDeckCycleState_v1`, `CarrierDeckContention_v1` contracts
- `INVALID_CARRIER_DECK_CYCLE_TRANSITION`, `CARRIER_DECK_CONTENTION` reason codes

## Acceptance criteria

AC-13 (deck-cycle states), AC-14 (deck contention).