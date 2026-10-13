# 14: Refit compatibility from slot acceptance (P5 prerequisite)

**Type:** implementation
**Status:** open
**Blocked by:** 07, 11
**Frontier:** no
**Requirements:** SPM-R18 · Stories 6, 28

## What to build

A refit may swap a part only for one that the same slot accepts, and that passes the
slot's constraints at the refit month. Supersession alone never makes an incompatible
refit legal. Refit-kind rules move from allowed categories to allowed interfaces. After
this ticket, nothing reads `upgradePath` (it is deleted in ticket 15).

## Acceptance criteria

- [ ] Design-compile seam tests: a successor that violates a slot constraint is rejected,
      and a non-successor that the slot accepts is allowed.
- [ ] Existing rebuild/refit and armament-change validation suites stay green, with
      unchanged outcomes for current content.
- [ ] No reader of `upgradePath` remains.
