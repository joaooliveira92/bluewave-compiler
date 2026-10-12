# 10: Rebuild parity

**Type:** grilling
**Status:** resolved
**Blocked by:** 02

## Question

Decide the rebuild model so it matches the manual's rebuild list, reconciled with DESIGN-23
§20–22 and the existing rebuild code.

Manual (printed p31–32): permitted rebuild actions are — change the main armament under conditions
(guns to modern versions of the same calibre; triple↔double or double↔single with compatible
calibres); change the secondary battery if its guns are in casemates or turrets of ≤6 in (to any
arrangement of ≤6 in), and the same for tertiary guns; swap machinery for more modern machinery;
improve fire control; add bulges (more torpedo protection, less speed); add one inch of deck
armour; remove the conning tower; change the upper belt; convert to CV or CVL with the technology.
Some rebuilds change the ship type (suggested or mandatory).

Compare `packages/ship-design/src/rebuild.ts`, `refit.ts`, `packages/phase-engine/src/rebuildProjects.ts`,
`startRebuild.ts`, DESIGN-23 §20–22, and the already-resolved `.scratch/ship-building/` tickets 21
and 28 (do not duplicate them). Identify each manual action present, missing, or divergent.

Decide: the canonical rebuild action set and its conditions for the EARLY band; which missing
actions to implement now; how rebuild-driven type reclassification is handled (the manual's
BC↔BB note); and what is deferred (CV/CVL conversion, later-era machinery).

## Answer

Resolved 2026-10-12 (autonomous; grounded in `docs/research/manual-building-ships-rules.md` p27 and
p31–32, DESIGN-23 §20–22, DESIGN-22 §22, ADR-0067 §3, ADR-0078, `rebuild.ts`, `refit.ts`, and SB
tickets 21/28 which already cover the armour subset — this extends them).

**Mapped — keep as-is:**

- machinery swap → `MACHINERY_REFIT`; fire-control improvement → `SENSOR_FC_UPDATE`.
- `+1 in` deck armour, remove conning tower, change upper belt → `ARMOUR_MODIFICATION`
  (`armourSet`/`armourRemove`); the ticket-21 decision (ADR-0067 §3) — already implemented.
- Retained-hull validation → `rebuild_validation_v1` (DESIGN-23 §21: **DESIGN** +20% displacement,
  +3 kn, ±5% length/beam, no hull-category change, plus dock/classification/treaty/stability), and the
  §22 result (one new `CompiledDesignVersion`, atomic per-ship switch, classification re-run).

**Gaps to implement (EARLY band):**

1. **Bulges.** The manual's "add bulges (more torpedo protection, less speed)" has no refit kind. Add a
   `BULGE` action: raises torpedo-defence/protection at a speed penalty, validated by the normal compile
   (mass, stability, speed). New action + constants.
2. **Main/secondary armament-change conditions.** `REARMAMENT` is category-based; the manual bounds it:
   main guns over 6 in cannot be changed; secondary/tertiary only when in casemates or `≤6 in` turrets,
   to any arrangement of `≤6 in`; triple↔double or double↔single swaps only within compatible calibres
   (e.g. double 8 in → single 10 in; triple 12 in → double 16 in). Add these as a `REARMAMENT` validation
   rule set, not a new kind.

**Deferred (recorded):** convert to CV/CVL (`AVIATION_CONVERSION`/`ROLE_CONVERSION`, aircraft band);
BC→BB and other administrative reclassification (BC band); the manual's suggested-vs-mandatory
reclassification messaging rides on DESIGN-22 §22 once BC exists.

**One cross-check to confirm (not itself a rebuild rule):** the manual's printed-p27 modification limits
(displacement +10% or 1000 t; main guns >6 in unchangeable; secondary >6 in limited; speed ±1 kn;
vertical armour ±1 in, horizontal ±0.5 in) are the **design-revision** limits, distinct from the rebuild
retained-hull limits of DESIGN-23 §21. The spec must confirm `constructionRevision`/`ReviseProject`
enforce the p27 numbers; if they do, no change, if not, align the revision limits to the manual (a rule
change → ADR).

Hand-off: implementation slices — (a) `BULGE` action; (b) armament-change validation; (c) the
revision-limit cross-check — extending SB tickets 21/28 and feeding the rebuild surface.
