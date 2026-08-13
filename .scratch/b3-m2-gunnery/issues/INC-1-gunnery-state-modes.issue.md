# INC-1 — GunneryState + Fire Modes + Guards + Constants

**State:** READY_FOR_AGENT (frontier) · **Blocked by:** none
**Spec:** `.scratch/b3-m2-gunnery/spec.md` (AC-1, AC-2, AC-14 seeds) · **ADR:** (recorded at INC-5)

## Acceptance criteria
- AC-1 **GunneryState invariant**: authoritative numeric `GunneryState` surface
  (§1: acquisition bp, range estimate/uncertainty, fire-control solution quality,
  ammunition count by type, reload progress ms, last salvo minute/substep,
  ruleset+formula versions) uses integer/fixed-point; non-integers rejected
  (`GUNNERY_STATE_INVARIANT_FAILED` / `TACTICAL_STATE_INVARIANT_FAILED`); state
  carries an authoritative hash. Proving test: `combat/test/gunnery/state.test.ts`
  (invalid + boundary).
- AC-2 **Fire modes**: seven canonical modes as a closed enum with a per-mode
  record (§2): `CEASE_FIRE`, `RANGING`, `NORMAL`, `RAPID`, `AA_TRACKING`,
  `AA_BARRAGE`, `LOCAL_CONTROL`; each declares ammo/reload/accuracy/eligibility/
  fire-control/cancellation behavior. `RAPID`/`AA_TRACKING`/`AA_BARRAGE` defined
  but their eligibility predicates deferred — a firing guard reports the deferred
  predicate rather than fabricating one. Proving test:
  `combat/test/gunnery/modes.test.ts`.
- AC-14 seed: base gunnery constant contracts (battery/battery-definition
  surfaces) as `gunnery_v1` + `SHIPPED_GUNNERY_CONTRACT` + a validate guard.

## Notes for implementator
Pure `@bluewave/combat` module (no ambient I/O/clock/random). Branded safe
integers via `@bluewave/contracts`. Read the B-2 `assertFixedPointMovement`
pattern (`packages/combat/src/movement.ts`) and `movement/constants.ts` +
`reasonCodes.ts` to match repo style. `GNNERY` types/file landing under
`packages/combat/src/gunnery/*`. Do not touch `BattleResolver`/`StrengthCalculator`.
Add focused tests proving each AC including invalid/boundary.
