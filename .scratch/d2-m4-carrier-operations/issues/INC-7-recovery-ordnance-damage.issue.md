**Type:** implementation
**Status:** open
**Blocked by:** INC-1, INC-6
**Frontier:** yes

# INC-7: Recovery priority + ordnance + deck/hangar damage (§§26-28)

## Deliverable

- Recovery priority: 1. emergency fuel, 2. damaged aircraft, 3. hazardous ordnance, 4. immediate CAP, 5. returning strike, 6. search, 7. normal CAP, 8. ascending aircraft id (§26)
- Carrier reserves deck/capacity before recovery. Diversion only through alternate carrier, land base, ditching, or loss (§26)
- Ordnance reservation and tracking by inventory type/quantity (§27)
- Unused weapons from stood-down strike return to storage only when: aircraft aboard, no jettison, safe, storage capacity available, typed return-to-storage transaction. Jettisoned ordnance permanently removed (§27)
- Deck/hangar damage effects on: spot value, launch rate, recovery rate, hangar↔deck movement, refueling/rearming, fire/explosion risk, capacity access, repair, jet compatibility (§28)
- Damaged lift traps aircraft (consume capacity, unavailable for deck ops) (§28)
- `CarrierRecoveryPriority_v1`, `CarrierOrdnanceState_v1` contracts
- `CARRIER_ORDNANCE_INVENTORY_INSUFFICIENT` reason code

## Acceptance criteria

AC-28 (recovery priority), AC-29 (ordnance), AC-30 (deck/hangar damage).