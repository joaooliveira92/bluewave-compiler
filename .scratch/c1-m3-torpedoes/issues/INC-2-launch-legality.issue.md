# INC-2 — Launch Legality (Authority + Eligibility + Speed Limits)

**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** no

## Acceptance (spec AC-5..AC-8)

- `torpedo_launch_authority_v1` policy contract defining `ADMIRAL`/`REAR_ADMIRAL`/
  `CAPTAIN`; legality guard enforces mode; ADMIRAL/REAR_ADMIRAL prohibit manual launch
  (`TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED`); lacking authority →
  `TORPEDO_LAUNCH_AUTHORITY_DENIED` (`test/torpedo/authority.test.ts`).
- All §6 eligibility predicates; target contact confidence ≥ `4_000` bp after reused
  `validateTargetOrder` (`TACTICAL_FOG_OF_WAR_VIOLATION`); failure consumes NO torpedo +
  exactly one explicit reason code (`test/torpedo/eligibility.test.ts`).
- §7 underwater-tube speed limit: `UNDERWATER_FIXED`/`UNDERWATER_TRAINABLE` fire only
  when `currentSpeedMicrometresPerSecond <= 12_861_100` (25 kn legal, > illegal);
  checked at command validation AND firing substep; post-issuance acceleration →
  `UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED`, no torpedo consumed, command completed with
  failed-launch outcome (`test/torpedo/underwater-speed-limit.test.ts`).
- §8 above-water limits: fixed `30` kn / trainable `35` kn exact defaults, launcher MAY
  declare narrower; missing metadata → `TORPEDO_LAUNCH_SPEED_LIMIT_MISSING`
  (`test/torpedo/launch-speed-limit.test.ts`).

## Hints

Speed values are integer micrometres-per-second (µm/s) — the engine's B-2 speed model
already uses `currentSpeedMicrometresPerSecond`. Reuse `targeting.ts:validateTargetOrder`
as the fog gate, then apply the higher 4_000 bp gate.