**Type:** implementation
**Status:** closed
**Blocked by:** INC-1
**Frontier:** no

# INC-5: Carrier maneuver + wind-over-deck (§§19-20)

## Deliverable

- Automatic carrier maneuver controller: during mandatory launch/recovery, carrier automatically maintains required wind-over-deck vector and minimum safe speed (§19)
- Maneuver command contains: required course interval, speed interval, wind vector, deck-op id, start/end times, collision/formation constraints, failure behavior (§19)
- Conflicting commands → `CARRIER_MANEUVER_LOCKED_BY_DECK_OPERATION` (§19)
- Wind-over-deck requirements: piston launch=20kt, recovery=18kt. Light jet launch=25kt, recovery=22kt. Heavy jet launch=30kt, recovery=25kt. Helo: model-defined, default 0 (§20)
- WOD combines ambient wind + carrier motion through authoritative vector arithmetic (§20)
- Operation delayed/suspended if requirement unmet (§20)
- `CarrierWindOverDeck_v1` contract
- `CARRIER_MANEUVER_LOCKED_BY_DECK_OPERATION`, `CARRIER_WIND_OVER_DECK_INSUFFICIENT` reason codes

## Acceptance criteria

AC-21 (carrier maneuver), AC-22 (wind-over-deck).

**DONE 2026-08-29 — PASS.** Combat 219 files / 2910 tests green. Build 18/18. tsc -b clean.