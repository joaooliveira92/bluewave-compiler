---
Type: task
Status: resolved
Blocked by:
---

# B-2 / 05 — Contact-state lifecycle

## Question

How does B-2 maintain contact tracks and knowledge state (DESIGN-38 §3 step 4, §19)?

## Answer

A contact-track lifecycle feeding `TacticalBattleState.contacts`:

- **Create**: a newly detected true asset yields a `ContactTrack` (estimated
  identity, position, course, speed, confidence, observation time, source,
  uncertainty) — reusing/extending the existing `ContactTrack` shape in
  `targeting.ts`.
- **Update**: on re-detection, the track's position/course/speed/observation time
  refresh toward the true asset's current values via an explicit update rule.
- **Age/stale**: when a track is not re-observed, confidence decays (basis-point
  slope, versioned) and observation-time advances; a track past a staleness
  threshold may be marked stale/dropped — exact interval set during INC-3.
- **Merge**: duplicate tracks for the same true asset merge deterministically by
  asset key, keeping the highest-confidence source.
- **Knowledge + fog**: `update_contact_knowledge` runs before movement/targeting in
  the DESIGN-38 §3 order; targeting and any order resolution must reference a legal
  ContactTrack via the existing `validateTargetOrder` (throws
  `TACTICAL_FOG_OF_WAR_VIOLATION` on a hidden true asset). Confidence/uncertainty
  model certainty without exposing hidden identity.
