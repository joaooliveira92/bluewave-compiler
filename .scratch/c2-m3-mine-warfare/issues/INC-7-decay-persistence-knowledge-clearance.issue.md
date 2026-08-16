# INC-7 — Decay + Post-War Persistence + Ownership/Control Changes + Knowledge + Clearance

**Type:** implementation
**Status:** open
**Blocked by:** INC-6
**Frontier:** no

## Acceptance (spec AC-15..AC-19)

- Mine decay (§21): exact monthly retention multipliers (contact `9_750`,
  magnetic `9_500`, acoustic `9_250`, controlled-defensive-with-control
  `9_900`, controlled-defensive-without-control `9_000`, submarine-laid
  `9_500`, scenario-special definition-required); `pressureAfterDecay =
  floor(pressureAfterSweeping * retentionMultiplierBp / 10_000)`;
  `decayedPressure = pressureAfterSweeping - pressureAfterDecay`; freshness
  retention uses the same multiplier unless the mine-type definition provides
  a narrower explicit value; scenario-special without decay metadata →
  `MINE_DECAY_POLICY_MISSING` (`test/mines/decay.test.ts`).
- Post-war persistence (§22): war termination MUST NOT auto-remove pressure;
  target-belligerent sets preserved historically; minefields remain active
  hazards to configured targets + misidentified friendly/neutral traffic;
  decay continues monthly; clearance missions remain available; new laying
  requires a separate legal policy; peace settlement MAY alter target
  sets/lanes/disclosure/clearance only through typed terms
  (`test/mines/post-war-persistence.test.ts`).
- Ownership/control changes (§23): legal/military control change MUST NOT
  auto-delete/neutralize pressure; every transition declares exactly one of
  six closed dispositions (`PRESERVE_ACTIVE`/
  `TRANSFER_CONTROLLED_MINE_AUTHORITY`/`DEACTIVATE_CONTROLLED_MINES`/
  `DISCLOSE_SAFE_LANES`/`ASSIGN_CLEARANCE_OBLIGATION`/
  `DESTROY_CONTROL_INFRASTRUCTURE_WITH_DECLARED_EFFECT`); uncontrolled
  contact/magnetic/acoustic/submarine-laid mines remain active by default
  until decay/clearance; missing disposition for controlled-defensive mines →
  `CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING`
  (`test/mines/ownership-transitions.test.ts`).
- Mine knowledge (§24): separate per-participant knowledge assertions
  (suspected area/route, estimated pressure interval, mine type, suspected
  laying participant, known cleared lanes, freshness estimate, last
  observed/swept date); true pressure MUST NOT be exposed absent an explicit
  source policy; sweeping improves knowledge only via explicit
  sweep-observation records (`test/mines/knowledge.test.ts`).
- Mine-clearance completion (§27): a record clears when pressure reaches `0`
  after sweeping/decay; clearance closes the active record, preserves
  historical source/action records, updates visible knowledge per source/
  reporting rules, removes battle/route risk for that record from subsequent
  phases, emits `MINEFIELD_CLEARED`; clearing one participant's minefield MUST
  NOT clear another participant's record (`test/mines/clearance.test.ts`).

## Hints

Keep the "disposition" type a closed discriminated union (never an open
string) so a missing/invalid disposition is a compile-time and a runtime
(`CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING`) failure. Knowledge assertions
should be a distinct record type from `AreaMinePressureRecord`, never a
partial/optional view of the same type (per §24's truth/knowledge separation).
