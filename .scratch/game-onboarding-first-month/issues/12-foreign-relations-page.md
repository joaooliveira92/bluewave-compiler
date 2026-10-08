**Type:** grilling
**Status:** resolved
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

## Answer

Verified against the real diplomacy projection (`packages/campaign-engine/src/
diplomacy.ts`, incl. ticket 11's `tensionLabel`/`isHighTension`/
`HIGH_TENSION_THRESHOLD = 8`), the shipping Diplomacy & War screen surface
(desktop-diplomacy-war, `apps/desktop/src/renderer/`), the renderer's
presentation-only dossier flavor data (`nationDossierFields.ts`), and the
determinism/RNG audit (ticket 17) + the tension-resolution finding (ticket
13's phase-stage table).

**Headline: the page is the already-shipped Diplomacy & War surface, specified
as read-only. Two doc §13.4 features are cut: "monthly change" (no previous-
turn tension is stored; no monthly tension processing runs) and the
"future-war critical warning" framing (war already exists — the honest copy is
about *current* high tension, not a hypothetical future milestone). The
"likely rival" marker is real presentation-only flavor data.**

### 1. Relationship list (§13.2) — four fields real, one cut

Real, from `buildDiplomacyScreenProjection` (`diplomacy.ts:145-229`,
`DiplomacyRelationRow`):
- **nation** → `partnerNationId`/`partnerName` (real, sorted by partner id).
- **relations label** → `relation` kind (`neutral | allied | at_war |
  trade_agreement`) + `tensionLabel(tension)` from ticket 11 (the ONE engine
  taxonomy, never renderer-re-derived — doc §13.3).
- **tension score** → numeric `tension` (`0..10`, `DiplomaticRelation.tension`,
  `state.ts:78`).
- **likely rival** → real presentation-only flavor data: `NATION_DOSSIER_FIELDS`
  (`nationDossierFields.ts:19,33`), a static per-playable-nation
  `likelyRivals: string[]` (GB → Germany/France/Russia, etc.), keyed by
  `PlayableSlotCountryId`. Marking a row whose `partnerName` matches the
  dossier's `likelyRivals` list is presentation-only, never alters simulation
  (doc §13.2 "must not alter simulation" — matches the field's own ADR-0003
  presentation-only contract). Note: keyed by *playable* country; non-playable
  nations fall back to no-rival marker rather than inventing one.

**Cut — "change since previous month".** No previous-turn tension is stored
anywhere (same finding as ticket 03's tension-trend cut), and no monthly
tension-change processing runs (`resolve_diplomacy` is `rngAllowed: false`;
ticket 11 deliberately did not flip the flag; ticket 13's stage table row 10
records monthly tension randomness as owned by a future M2 slice). Displaying a
"change" requires persisted history that doesn't exist — the spec shows
current tension + label only, and records the field as cut with this reason
(no fabricated delta).

### 2. War/blockade display — the shipped surface, read-only

Decision: **keep the shipped three-section layout** (Relations / Wars /
Blockades), i.e. a per-section split rather than a per-nation badge — the real
projection already separates `relations`, `wars`, `blockades` (and the shipped
screen renders them as three cards; desktop-diplomacy-war). Safe, meaningful,
read-only `DiplomacyWarRow` fields: `warId`, `attackerId`/`defenderId`, both
`*SideMembers` (which nations are in), `attackerWarScore`/`defenderWarScore`,
`status` (`DECLARED_NOT_ACTIVE | ACTIVE | ENDED`), `startDate`/`endDate?`,
`playerSide`. `DiplomacyBlockadeRow`: `blockaderId`, `blockadedNationId`,
`areaId`, `establishedMonth`. Nothing on this page submits a command — the
screen is a read-only projection over the snapshot (the shipped surface already
rejects any action attempt with honest copy). Declaring war/negotiating peace
remains out of scope per the charting decision; the spec states it.

### 3. Monthly change + the "future-war threshold" warning (§13.4) — CUT + reframed

- **Monthly change: cut** (as in §1) — determinism requirements are already
  satisfied by *not* running monthly tension randomness in M2 (`rngAllowed:
  false`, no stream consumed, no persisted change). If/when a future M2 slice
  adds bounded tension changes, it must follow ticket 17's rules (keyed
  deterministic streams, stable nation order, persisted values, report
  entries) — the spec records this as the gate, not as shipped behavior.
- **Warning framing: reframed.** The doc's "may lead to war in a **future
  milestone**" copy is false twice over: war already exists (it's modeled,
  resolved, and displayed on this very page). The correct in-milestone framing
  for `isHighTension(tension)` (≥ 8, i.e. `hostile` or `war_imminent`) is a
  **current-state warning** — e.g. "Relations with X are hostile; war is
  possible" — tied to the real label from ticket 11, with no "future milestone"
  caveat and no pretense that war mechanics are absent (doc §13.4's "must not
  pretend war mechanics are already implemented" is inverted: they ARE
  implemented, so the warning must not claim otherwise). This is exactly the
  warning the priorities engine's `high_foreign_tension` (ticket 04) and the
  pre-turn review (ticket 13) consume via the same `isHighTension` predicate.

### Net spec effect

M2's Foreign Relations section = the shipped read-only Diplomacy & War surface
(Relations with label/tension/likely-rival; Wars; Blockades), documented with
the two cuts above (monthly change, "future milestone" warning framing) and the
reframed current-state high-tension warning. No engine change, no new command,
no RNG flag flip; goldens stay 10/10.

## Notes for the resolving session

- [Determinism/RNG audit](./17-determinism-rng-audit.md) (resolved) found
  `resolve_diplomacy`'s `PhaseRegistry` entry is currently
  `rngAllowed: false` — if [ticket 11](./11-diplomacy-tension-threshold-policy.md)'s
  monthly-change design needs randomness, confirm that flag was flipped
  there rather than assuming it's available.
