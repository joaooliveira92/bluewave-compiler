# ADR-0114: Domestic vs imported gun ceiling, and the coast-defence starter blocker

## Status

Accepted (2026-10-11). Amends ADR-0089; follows ADR-0111; does not amend ADR-0108/ADR-0110.

## Context

`hardCapabilities.maxGunCaliberUm` is documented as *the largest gun calibre the
domestic industry can produce* (`nationProfile.ts`), but `catalogueForNation`
enforced it as an absolute cap for **every** family, including families the
profile marks `IMPORTED` / `LICENSE_BUILT` / `CAPTURED_OR_STUDIED`
(`componentVariants.ts`). A nation therefore could not obtain an imported gun
above its domestic ceiling without inflating the single field — exactly the
"inflate the ceiling to admit an import" move ADR-0111 forbade. ADR-0111 recorded
this as its deferred follow-up ("separate the domestic production ceiling from
the largest obtainable imported equipment").

ADR-0111 also deferred eight historical candidates as capital starters because
the shared catalogue lacked their ordnance. Inspecting those candidates against
the authored classification ruleset (`DESIGN_22_EARLY`) shows a second, deeper
blocker that is **not** about the catalogue.

## Decision

### 1. Split the ceiling (the enabler)

Add an optional `hardCapabilities.maxImportedGunCaliberUm`: the largest obtainable
**imported** calibre. `catalogueForNation` now chooses the ceiling by access:

- a `DOMESTIC` family (or a family with no access entry) is capped by
  `maxGunCaliberUm`;
- an obtained-from-abroad family (`IMPORTED` / `LICENSE_BUILT` /
  `CAPTURED_OR_STUDIED`) is capped by `maxImportedGunCaliberUm ?? maxGunCaliberUm`.

The field is restrict-or-relabel only and can only ever *admit an import above
the domestic ceiling*; it never raises the domestic ceiling. The validator rejects
a value below `maxGunCaliberUm` (which would silently restrict, not widen) or a
non-positive value. Per-nation values are **not** authored yet: no period print
source in the repo justifies a separate domestic figure for an 1880 nation, and
ADR-0110 forbids inventing one. The mechanism, its content schema, and its tests
land now; per-nation values follow when sourced.

### 2. The deferred candidates stay on their doctrine template

None of the ADR-0111-deferred candidates can legally classify as a **B** capital
under `DESIGN_22_EARLY`, and none classifies as any other opening type either:

| Ship | Nation | displ (t) | belt (mm) | main gun | speed (kn) | why no B / no class |
| --- | --- | --- | --- | --- | --- | --- |
| *Matador* | netherlands | 1,968 | 140 | 283 mm | 7.5 | displ < 5,000 t; belt < 6 in; too slow for CL/CA/DD |
| *Vasco da Gama* | portugal | 2,384 | 229 | 263 mm | 10.3 | displ < 5,000 t; too slow |
| *Sete de Setembro* | brazil | 2,174 | 114 | 300-pdr | 12 | displ/belt fail; too slow |
| *Fusō* | japan | 3,717 | 229 | 235 mm | 13 | displ < 5,000 t |
| *Numancia* / *Vitoria* | spain | 7,189 / 7,135 | 130 | 254 mm | 10 / 12 | belt 130 mm < 152 mm; too slow |
| *Wei Yuen* | qing | 1,258 | 0 | 160 mm | 11 | displ < 2,000 t; speed < 16 kn; gun > 6 in |
| *Canonicus* / *Trenton* | usa | 2,100 / 3,800 | 127 / 0 | 381 mm SB / 203 mm | 8 / 14 | displ/belt fail; smoothbore prohibited |
| *Kaiser Max* | austria_hungary | 3,548 | 205 | 209 mm | 13.3 | displ < 5,000 t |

A release requires each nation's six starters to classify as their own declared
type (`nationCompleteness.ts` → `NATION_STARTER_CLASS`), so promoting any of these
would fail `validateAllNations`. They remain `DOCTRINE_TEMPLATE`, one
authoritative design each, and are pinned by a test so no later pass promotes one
by falsifying displacement or armour. Adding the missing gun *families* (R1)
would not change this: the blocker is the classification ruleset, not the
catalogue. A coast-defence type, or a per-scenario classification ruleset that
admits slow belted ships below 5,000 t, is a separate gameplay decision.

## Alternatives considered

- **Bypass the ceiling for any `IMPORTED` family.** Rejected: unbounded imports.
  The obtainable imported calibre is a real, finite ceiling.
- **Raise the importing nations' `maxGunCaliberUm`.** Rejected (ADR-0111): it
  inflates the domestic ceiling to admit an import.
- **Promote the candidates and relax the classification thresholds.** Rejected:
  that changes gameplay classification, not content, and is outside this sprint.
- **Fit a smoothbore onto rifled-RML ballistics (Canonicus).** Rejected: false
  mechanism.

## Consequences

- Capability content can now express "domestically up to X, imported up to Y"
  without conflating the two; the domestic ceiling is provably un-inflated.
- The eight candidates' status is now pinned with a stated reason, replacing the
  earlier catalogue-only explanation. Their distinct 1880s guns (Dutch 283 mm
  Krupp, Portuguese 149/67 mm, Brazilian Whitworth 300-pdr, Japanese 235/173 mm,
  Spanish Hontoria, Qing 121 mm, US Dahlgren/8-in MLR, Austro-Hungarian
  209 mm G L/20 C.68) remain unmodelled; a future pass that adds them still
  cannot promote the ships without the classification decision in §2.
- Reference designs sit outside `pack.json`; no pack hash, save, or golden
  changes. `uk`/`france`/`germany` content is untouched.
