# 27: Component-level drafts for authored designs (so starting ships can be revised)

**Type:** content + implementation
**Status:** open (deferred: blocked on content)
**Blocked by:** research pass for the missing components (below)
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (AC-13, template import). Decision record: ADR-0070 ("Not done").

## Why

`ReviseProject` needs the draft a ship was designed from (`CompiledDesignVersion.sourceDraft`). Designs submitted in game have one;
the 37 authored designs in `content/production/1880/designs.yaml` do not, so ships built from them (for example the UK's Inflexible,
60 % built at the start) show "cannot be revised".

## Why it is not done

An honest draft needs real components. The authored designs span 1880 to 1915 (7 ironclad turret ships, 5 central-battery ships,
7 battleships, 5 dreadnoughts, 5 super-dreadnoughts, 3 battlecruisers, 3 monitors, ...), main guns from 203 mm to 460 mm, and
reciprocating, triple-expansion, steam-turbine and geared-turbine plants. The EARLY-band catalogue has main guns up to 13.5 in
(343 mm), four hull forms (torpedo boat, protected cruiser, coast defence, pre-dreadnought) and four plants (compound, triple
expansion, water-tube triple expansion, locomotive-boiler torpedo boat). Mapping an authored ship onto it would invent equipment and
figures, which the project rule forbids ("never silently dropped or fabricated").

## What would unblock it

1. Research notes and components for what the 1880 starting fleets actually need: 16-in / 12.5-in / 10-in muzzle-loading rifles,
   ironclad turret and central-battery mounts, compound (wrought-iron) belt armour, monitor and ironclad hull forms.
2. A content file `ship-building/authored-drafts.yaml` mapping `designVersionId` to a draft, validated against the authored record
   (displacement within tolerance, speed, belt, main gun calibre and count must agree with `designs.yaml`).
3. Campaign compile sets `sourceDraft` and `constructionCostUnits` for the mapped designs (ADR-0074), leaving unmapped designs as
   they are. Existing saves keep working (both fields are optional).
4. Tests: every mapped draft compiles valid for its month; the compiled ship agrees with the authored record within tolerance.

## Meanwhile

The Revision panel states plainly that an authored design has no component-level drawing and cannot be revised, and shows an
estimate from the player's edits only.
