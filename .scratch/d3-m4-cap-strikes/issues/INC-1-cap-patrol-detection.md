# INC-1: CAP patrol state + detection + interception timing

**ACs:** AC-1, AC-2, AC-3
**Blocked by:** none
**Frontier:** yes

## Deliverable

CAP patrol state model (`CapPatrolState`), detection of incoming strikes via B-2 spotting model, and interception timing formula. New file: `packages/combat/src/air-combat/cap-patrol.ts`.

## Acceptance criteria

- AC-1: every CAP-eligible squadron in battle has `CapPatrolState` (station, altitude, fuel remaining, engagement state). Missing/invalid → `AIR_COMBAT_INVALID_STATE`
- AC-2: CAP detects strike formations via B-2 spotting model. Detection range depends on relative spotting/sensor values
- AC-3: time to intercept = `ceil(distanceM / max(1, interceptSpeedMps * 60))`. Speed score → m/s via `2.5x + 20`

## Reason codes used

- `AIR_COMBAT_INVALID_STATE`
- `AIR_COMBAT_DETECTION_FAILED`
- `AIR_COMBAT_INTERCEPTION_TOO_LATE`

## Test files

- `packages/combat/test/air-combat/cap-patrol-state.test.ts`
- `packages/combat/test/air-combat/detection.test.ts`
- `packages/combat/test/air-combat/interception-timing.test.ts`