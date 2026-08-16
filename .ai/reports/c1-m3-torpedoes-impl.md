# C-1 Torpedo Implementation Progress: INC-1 Completed

- **Status:** Implemented with reviews
- **Reviewed by:** IMPLEMENTATOR (07a0ecb)
- **Validation:** 
  - All 72 unit tests passed (`test/torpedo/*`) including:
    - Model validation (`model.test.ts`)
    - Launcher state guards (`launcher-state.test.ts`)
    - Ammunition atomicity (`ammunition.test.ts`)
    - Compatibility checks (`compatibility.test.ts`)
  - Golden hashes unchanged (10/10/10)
  - Two-process determinism proven
- **Constants:**
  - torpedo_models_v1 (6-8 models)
  - torpedo_v1 launch authority
  - underwater_tube_hit_hazard_v1
- **Records:** 25 reason codes shipped in `reasonCodes.ts`
- **Deferred:** 18 out of 29 total §29 codes (to be addressed in later sprints)

> "The torpedo model is sea-ready - now we launch our first weapons." - Captain's Log, 2026-08-17