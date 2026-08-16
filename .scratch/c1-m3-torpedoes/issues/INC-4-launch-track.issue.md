# INC-4 — Launch Timing/Failure + TorpedoTrack

**Type:** implementation
**State:** open
**Blocked by:** INC-3
**Frontier:** no

## Acceptance (spec AC-12, AC-13 part 1)

- §12 launch timing/failure: accepted salvo tubes fire in ascending tube-id order at
  their declared firing substep; per-tube mechanical failure consumes no torpedo unless
  the failure outcome is `TORPEDO_STUCK_IN_TUBE`; later tubes continue only per the
  salvo policy; every result recorded separately; no random branch changes canonical
  tube order; base launch-failure probability `100` bp per tube before model/damage/
  crew/reliability modifiers (`test/torpedo/launch-failure.test.ts`).
- §13 `TorpedoTrack`: every launched torpedo creates one authoritative track with all
  §13 fields (torpedoTrackId, launcher/ship/firing-side ids, target contact or `NONE`
  for area fire, model + setting, launch minute/substep, launch position/heading,
  ordered gyro angle, speed, max run distance, arming distance, depth setting,
  reliability state, guidance state, detection state by participant, current position,
  terminal result, track hash); track id derived deterministically (battleId +
  launcherId + tubeId + launch minute/substep); a torpedo remains an authoritative
  entity until hit/detonation/dud/grounding/exhaustion/destruction/battle end
  (`test/torpedo/track.test.ts`).

## Hints

Track id derivation mirrors `contactKey`/`gunneryEventId` stable-derivation idiom
(`contact/lifecycle.ts:28-30`). The track entity is threaded across minutes like
`GunneryState` (`engine.ts:416-421`).