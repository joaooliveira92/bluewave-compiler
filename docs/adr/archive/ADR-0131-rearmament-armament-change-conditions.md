# ADR-0131: REARMAMENT armament-change conditions

## Status

Accepted (2026-10-12).

## Context

The reference manual's rebuild list (BUILDING SHIPS, printed pp31–32) constrains
how a `REARMAMENT` rebuild may change guns: main guns above 6 inches cannot be
changed (a refresh to a more modern gun of the same calibre is allowed);
secondary/tertiary batteries may change only when the existing guns are casemates
or 6-inch-or-under turrets, and may become any arrangement of 6-inch-or-under
guns; and triple↔double / double↔single swaps are allowed only within compatible
calibres. SB-3 `INC-13` adds those conditions as a validation rule set inside the
existing refit evaluation (extending ADR-0067; no new refit kind).

## Decision

`armamentChangeFindings(removed, added, mainGunMaxUm)` in `@bluewave/ship-design`
is the one armament-change rule set, called from `evaluateRefit` when the kind is
`REARMAMENT`.

- **Main battery.** A removed gun of the same calibre as an added one is a
  refresh and is always allowed. Otherwise a removed and an added main gun are
  paired as a barrel/calibre trade: reducing barrels may increase calibre only if
  the weight of broadside (`calibre × barrels`) does not increase; increasing or
  keeping barrels requires that the calibre not increase. An above-6-inch main gun
  with no replacement is refused (`ARMAMENT_MAIN_GUN_UNCHANGEABLE`); an
  incompatible swap is refused (`ARMAMENT_INCOMPATIBLE_CALIBRE`). The manual's
  worked examples — double 8 in → single 10 in, triple 12 in → double 16 in — are
  legal under this rule.
- **Secondary/tertiary.** A changed gun is allowed only when the existing gun is a
  casemate or a 6-inch-or-under turret (`ARMAMENT_SECONDARY_CHANGE_NOT_ALLOWED`
  otherwise), and every added one must be 6 inches or smaller
  (`ARMAMENT_SECONDARY_TOO_LARGE` otherwise).

### Mount style

The manual's casemate-vs-turret condition needs a mount style per gun. It is
**authored once**, as `defaultMountType` on the first-class armament content
(`gun-families.yaml`, ADR-0093), keyed by the same id as the legacy component.
`gunChangeOf` reads it from `ctx.armamentContent`; only an enclosed `TURRET` is a
turret, and every other mounting (casemate, barbette, deck, broadside battery) is
the manual's casemate case. A pack with no armament content falls back to the
barrel-count approximation (a single-barrel mounting is a casemate/broadside, a
multi-barrel one a turret).

*Amended 2026-10-12 (INC-13b):* the approximation is now only the fallback. The
mount style was already authored in the armament content; duplicating it on
`ComponentDef` would have created a second source of truth, so the rule reads the
existing authored value instead. The armament content's legacy-compatibility
drift checks (`lintArmamentContent`) already keep it consistent with the
component catalogue.

## Consequences

- The manual's conditions are enforced in the refit path with stable reason codes;
  an incompatible change fails and changes nothing.
- A single-barrel turret above 6 in is refused; a casemate of any permitted
  calibre is allowed. No new refit kind or engine command is introduced.
- The mount style has one authored source (the armament content); the barrel-count
  rule survives only as the no-armament-content fallback.

## Alternatives considered

- **Add a mount-style attribute to `ComponentDef` and author it on the whole gun
  catalogue.** Rejected (INC-13b): the mount style is already authored as
  `defaultMountType` in the first-class armament content (ADR-0093); a second
  copy on the legacy component would drift. Reading the authored value closes the
  trap with one source of truth.
- **Forbid all calibre changes outright.** Rejected: the manual explicitly permits
  the barrel-count-against-calibre trade (its own worked examples).
