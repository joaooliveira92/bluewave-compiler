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

The component model does not carry a casemate/turret flag (`COMPONENTS.md` /
`components.yaml` distinguish them only in display text). Until content authors a
mount-style attribute, the rule reads a **single-barrel** mounting as a
casemate/broadside and a **multi-barrel** one as a turret. This is deterministic
and is recorded here rather than invented per call site.

## Consequences

- The manual's conditions are enforced in the refit path with stable reason codes;
  an incompatible change fails and changes nothing.
- The mount-style inference is explicit and replaceable: when content gains a
  mount-style attribute, the rule reads it instead of inferring from barrel count.
- No new refit kind or engine command is introduced.

## Alternatives considered

- **Add a mount-style attribute to every gun component now.** Deferred: it is a
  content-wide authoring change well beyond this rebuild-validation ticket; the
  inference is deterministic and documented.
- **Forbid all calibre changes outright.** Rejected: the manual explicitly permits
  the barrel-count-against-calibre trade (its own worked examples).
