# 01 — System definitions + state model + constants

**What to build:** Validate air defense system definitions and state model with all required fields including state hash, ensuring proper initialization and validation of AirDefenseSystemDefinition and AirDefenseState interfaces per DESIGN-45 §2-3.

**Blocked by:** None — can start immediately

**Status:** DONE

- [x] AC-1: System definitions validate correctly — `air-defense/system-definition.test.ts` (30 tests) + `air-defense/constants.test.ts` (11 tests)
- [x] AC-2: State model has all required fields + hash — `air-defense/state.test.ts` (21 tests, incl. map/set ordering-invariance determinism)