# Right nation rail

**Type:** implementation
**Status:** resolved (2026-10-08)
**Blocked by:** none
**Frontier:** no
**Requirements:** CC-5

## Acceptance
Relations + war score from Diplomacy views; nation drawer; deferred intel items; All relations link.

## Resolution (2026-10-08)
`NationRail` lists the player first then the other powers (name + relation words +
war score while at war), from the `inspectDiplomacyScreen` projection; selecting a
row shows its relation detail inline (there is no nation drawer and the Diplomacy
screen takes no nation parameter, recorded in the component header); deferred
intel/almanac items collapse into one "Not yet modelled" disclosure with no
progress bars; "All relations" navigates to the Diplomacy & War screen. Flag art
now covers **every** 1880 power: the 10 playable slots (country ids `gb/de/us/
jp/fr/it/ru/ah/es/qing`) plus the four non-playable powers keyed by campaign id
(`ottoman_empire`, `netherlands`, `portugal`, `brazil`), with a guard test that a
full 14-power rail renders 14 flags. `NationRail.test.tsx` (6 tests) green;
desktop `tsc -b` clean; format/lint clean.
