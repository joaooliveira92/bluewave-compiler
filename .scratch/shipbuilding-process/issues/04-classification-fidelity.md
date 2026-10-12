# 04: Classification fidelity to Appendix 1

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question

Decide the changes (if any) needed so ship-type classification matches the manual, using the
reference from "Manual ship-type definitions reference".

Compare the manual's per-type rules (DD, CL, B, CA, BC, BB, KE, AMC, CV, CVL, AV; illegal types;
the protected-cruiser exception) against `docs/rules/ship-classification.md` (DESIGN-22),
`packages/ship-design/src/classificationRules.ts`, `classification.ts`, `shipTypes.ts`,
`shipTypeData.ts`, the 1880 ruleset override (ADR-0116), and
`content/production/1880/ship-building/balance.yaml` (`ship.classification`).

Decide:

- the canonical per-type rule table (bounds and operators) for the playable era, and where it
  lives (versioned ruleset constants + ADR);
- how era-dependent thresholds the manual says "change with technology" (DD max, CL max, CV max,
  BC speed rise, CA→heavy cruiser) are modelled — the mechanism now, the content values later;
- illegal-type enforcement and how mismatch/illegal is surfaced to the player;
- which types (`BC`, `CV`, `CVL`, `AV`, `SS`, `MTB`, `TR`) are implemented now versus deferred;
- every place the current code disagrees with the manual, with the decision for each.

## Answer

Resolved 2026-10-12 (autonomous; grounded in `docs/research/manual-appendix-1-ship-type-definitions.md`,
DESIGN-22, ADR-0067, ADR-0088, and `packages/ship-design/src/classificationRules.ts`). **No new ADR** —
every EARLY-band type the app implements already matches the manual, and each divergence is already
recorded.

**EARLY-band parity confirmed** (manual Appendix 1 vs DESIGN-22/code):

| Type | Manual | App (EARLY) | Verdict |
|---|---|---|---|
| DD | `<2000 t`, `>19 kn`, torpedoes, unarmoured | `<2000 t`, `>19 kn`, torps required, no `≥2 in` qualifying armour | match (deviations below) |
| CL | `>2000` & `<8000`, `>16 kn`, gun `≤6 in` (protected single `≤8 in`), armour | `≥2000` & `<8000`, `>16 kn`, gun `≤6 in`, protected single `≤8 in` | match except lower bound (below) |
| B | `≥5000`, belt `≥6`, gun `>6`, `<20 kn`, `≤2` turrets | same | match |
| CA | `>4000`, `>19 kn`, belt `>2` & `≤12`, gun `≥6` & `≤11` | gun strictly `>6` | match except gun bound (ADR-0067) |
| BB | `>8000`, `≥3` turrets, belt `>6`, gun `>10` | same, tech-locked to 1906 | match |
| KE | `<2500`, belt `≤2`, gun `≤6`, no torps | same | match |
| AMC | `>1700`, no armour, gun `≤6`, ≤2 peacetime / ≤2 fast `≤25 kn` | `>1700`, no qualifying armour, gun `≤6`, merchant hull, fast `≥22 kn` + share limits | match except fast definition (ADR-0088) |

**Deviations already recorded — keep (no change):**

- CA main gun strictly `>6 in` (manual "at least 6") so `CL` keeps the 6 in gun — ADR-0067 §1.
- DD may not mount a gun above 6 in of any role; the manual's "cannot be armoured" is read as the 2 in
  qualifying-armour threshold — ADR-0088 §5 (DESIGN-22 §7).
- CL belt `≤2 in`; a CL with no armour deck is a **WARNING**, not blocking (manual says CLs *must* have
  armour) — ADR-0088 §5.
- KE and AMC read the largest gun of **any** role (manual says "maximum gun calibre") — ADR-0088 §5.
- AMC "fast" is `≥22 kn` with fleet share limits (manual: up to two fast liners to 25 kn) — ADR-0088
  decision record.
- 1880 scenario ruleset relaxes B to 1500 t / 4 in / `<18 kn` for coast-defence ironclads — ADR-0116.

**One undocumented manual divergence to record (no ADR — easy to reverse, unsurprising):** the manual
leaves exactly 2000 t illegal (DD `<2000`, CL `>2000`); DESIGN-22 §9 makes CL `≥2000`, filling the gap.
Keep the gap-fill — every 2000 t design is a legal light cruiser — and note it as a one-line DESIGN-22
§9 boundary annotation; no constant changes.

**Illegal-type enforcement already implemented** (DESIGN-22 §5: intended illegal →
`INTENDED_CLASSIFICATION_ILLEGAL`; unknown category → `SHIP_TYPE_UNREGISTERED`; both blocking). No change.

**Deferred with later bands — recorded, not dropped** (this map is EARLY-scoped, so these are out of
scope here but must not be lost):

- **BC.** DESIGN-22 §12 and the manual both define it, but there is no predicate
  (`CLASSIFIED_SHIP_TYPES` omits BC) and ADR-0088 §4 keeps it locked. Two divergences to reconcile when
  the dreadnought band lands: (i) DESIGN-22 §12 uses a uniform era speed schedule (EARLY `≥20 kn`) where
  the manual has two branches (`>10 in` gun with `>23 kn`, or three turrets with `>21 kn`); (ii) DESIGN-22
  adds `>8000 t` and belt `>2 in` common conditions the manual does not state. BB↔BC armour-index
  precedence (DESIGN-22 §13) waits on BC too.
- **CV / CVL / AV / SS / MTB / TR.** DESIGN-22 §16–19 predicate values match the manual (CV aircraft
  `>34`; CVL `4..34` and `≤16000 t`, conversions exempt; AV subtypes), but `mechanicsImplemented: false`;
  locked until the carrier/submarine bands.
- **Era-scaled maxima.** The manual says CL and CV maxima rise later; only DD and BC have explicit
  DESIGN-22 schedules. Content for later bands (map fog).

**Hand-off:** no EARLY boundary change is required, so this ticket yields no implementation slice; it
feeds the spec as "classification parity verified, deviations recorded" plus the deferred BC
reconciliation and the DESIGN-22 §9 lower-bound annotation.
