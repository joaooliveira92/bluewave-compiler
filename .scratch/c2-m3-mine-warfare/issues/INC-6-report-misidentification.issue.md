# INC-6 — Mine Report + Misidentification Classifier

**Type:** implementation
**Status:** open
**Blocked by:** INC-5
**Frontier:** no

## Acceptance (spec AC-13, AC-14)

- Mine report (§19): `MineIncidentReport` with all fields (recipient
  participant, area/route, observed/received time, affected ship/force,
  reported cause, estimated mine type or `UNKNOWN`, estimated laying
  participant or `UNKNOWN`, confidence, position error, delivery delay,
  possible deception, generated knowledge assertions, report hash); reports
  MUST NOT overwrite true pressure/type/cause/laying-participant; emits
  `MINE_REPORT_CAUSE_UNCERTAIN` when cause estimation confidence is below the
  certain threshold (`test/mines/report.test.ts`).
- Mine/torpedo misidentification classifier (§20):
  `underwater_explosion_identification_v1`; exact base weights (mine `6_000`,
  torpedo `3_000`, unknown `1_000`); exact modifiers (known hostile mine
  pressure: mine `+2_000`; observed torpedo track: torpedo `+5_000`; no
  submarine contact: torpedo `-1_000` floor `0`; port/choke-point location:
  mine `+1_000`; multiple simultaneous explosions: event-defined, document as
  an explicit extension point not implemented this slice); weights normalized
  and selected via stream `mine_warfare/report/underwater_explosion` (keyed
  RNG, no ambient randomness); a false torpedo report MUST remain knowledge
  state only and MUST NOT create a real submarine asset or attack
  (`test/mines/misidentification.test.ts`).

## Hints

This module MUST NOT import from or reference
`packages/combat/src/torpedoes/` even though it classifies "torpedo vs mine" —
it only produces a `MINE_STRIKE` | `TORPEDO_ATTACK` | `UNDERWATER_EXPLOSION_UNKNOWN`
knowledge-state label, never a real torpedo/submarine entity. Use the existing
keyed-RNG-stream helper pattern from `gunnery`/`weather` (domain-separated
stream identity + stable entity key + phase + ruleset version + input hash).
