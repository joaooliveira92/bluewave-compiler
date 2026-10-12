# 11: Overview section

**Type:** implementation
**Status:** open
**Blocked by:** 03
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Overview".

## What to build

An Overview section that is a design summary rather than a duplicate form: ship type and
intended role, design year, displacement, cost, speed and range, armour summary, main armament
summary, crew and accommodation, technology constraints, design warnings, and combat-role
estimates. It also carries explicit design-priority settings (speed, protection, firepower,
range, cost) that do **not** automatically override the player's choices.

## Acceptance criteria

- [ ] Overview shows the listed summary values, all derived from compiled design state (not
      editable duplicates of other sections).
- [ ] Design warnings shown here match the Review findings.
- [ ] Design priorities are settable and displayed; changing a priority does not automatically
      modify the design unless an assisted-design mode is explicitly enabled (none exists yet).
