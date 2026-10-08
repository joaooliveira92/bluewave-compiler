# 24: Tech and material gating for refit armour edits

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes

Source: ticket 21 review. `RefitPlan.armourSet` does not check that `materialId` or thickness is available at the campaign month, so a refit could install armour not yet introduced. Decide whether compile already gates this for new designs, and apply the same gate to refits, with a BLOCKING finding and tests.

## Comments
