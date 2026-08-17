**Type:** grilling
**Status:** open
**Blocked by:** 11

## Question

Spec §13 (Foreign Relations) of [01-diagnosis.md](../01-diagnosis.md).

**Already decided during charting**: unlike the doc's §2.2 claim that war
declarations/peace negotiations/a full war system are out of scope, real
`WarDeclaration` (attacker/defender sides, war scores, status) and
`BlockadeState` records already exist and are already projected to a screen
(`packages/campaign-engine/src/diplomacy.ts`) — this page surfaces them
**read-only**. Declaring war or negotiating peace remains out of scope; only
*display* changed.

Decide:

1. **Relationship list** (§13.2): confirm nation/relations-label/tension-
   score/monthly-change/likely-rival fields are real, using the tension
   label from [Diplomacy tension-threshold policy](./11-diplomacy-tension-threshold-policy.md)
   (now resolved — cite its exact function/constant, don't re-derive).
2. **War/blockade display**: design how war and blockade state surface
   alongside the relationship list — decide whether it's a per-nation badge/
   row addition or a separate section, and exactly which `WarDeclaration`/
   `BlockadeState` fields are safe and meaningful to show read-only (war
   score, status, sides at minimum).
3. **Monthly change** (§13.4): confirm deterministic-RNG/stable-ordering
   requirements are consistent with
   [Determinism/RNG audit](./17-determinism-rng-audit.md)'s findings once
   resolved. Confirm the "future-war threshold" critical-warning copy (§13.4)
   still makes sense now that war is real and already modeled — the
   framing "may lead to war in a future milestone" may need rewriting since
   war already exists; decide the correct in-milestone framing (e.g. "may
   escalate to war" without the "future milestone" caveat).

## Notes for the resolving session

- [Determinism/RNG audit](./17-determinism-rng-audit.md) (resolved) found
  `resolve_diplomacy`'s `PhaseRegistry` entry is currently
  `rngAllowed: false` — if [ticket 11](./11-diplomacy-tension-threshold-policy.md)'s
  monthly-change design needs randomness, confirm that flag was flipped
  there rather than assuming it's available.
