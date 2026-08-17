# ADR-0028: Desktop War-Score Delta Re-derivation on the Pre-Battle Snapshot

## Status

Accepted 2026-08-15

## Context

`commitMonth` (desktop) surfaces one flat `BattleOutcome` per resolved battle
via `ClosingSnapshotSummary.battleOutcomes`. `BattleResult`
(`packages/campaign/src/state.ts`) stores winner/loser, per-side sunk-loss
lists, `damageReport`, and explanation — but NOT the per-battle `warScoreDelta`
or victory class. The engine applies the delta only transiently inside
`applyBattleResult` (`packages/phase-engine/src/month.ts:1508-1552`), writing
the resulting `attackerWarScore`/`defenderWarScore` onto the war. The desktop
must therefore re-derive `warScoreDelta` for display.

A first implementation re-derived it over the POST-month snapshot. That is
wrong: `applyBattleResult` computes its victory class over the snapshot it is
called with, which is the month's state BEFORE `applyBattleConsequences`
(month.ts:2724) reduces survivors' HP and REMOVES ships sunk that month. Counting
the loser's ships on the post-month snapshot sees post-damage HP and loses the
sunk ships, so the re-derived class can disagree with (typically understate) the
magnitude the engine truly applied (finding 1). Concurrently, the test oracle
was a verbatim copy of the bridge formula, so it could never catch that
divergence.

No `BattleResolved` domain event can serve as the source here: the
`battle_resolution` phase never emits one (the `BattleResolved` body type exists
in `packages/events/src/envelope.ts`, but no phase appends it).

This ADR records the decisions fixing the desktop derivation and the honest
limitations that remain.

## Decision

1. **The bridge derives the losing side's ships at PRE-battle state.** The
   desktop re-derivation
   (`mapBattleOutcome`, `apps/desktop/src/main/commands/commitMonth.ts`) counts
   the losing nation's fleet ships for the battle from the PRE-month snapshot —
   survivors at their pre-battle HP and ships sunk this month still present —
   mirroring the ship-set/HP `applyBattleResult` computed over. It still mirrors
   the engine's `lossFraction` → decisive/major/minor threshold
   (`month.ts:1527-1538`) verbatim. For the common single-battle month this
   reproduces the engine's applied magnitude exactly **iff the loser's engaged
   fleet ship-set and HP are unchanged between the pre-month snapshot and
   `applyBattleResult`** — i.e. no same-month commissioning into that fleet.
   Same-month commissioning adds a full-HP ship to the losing fleet before
   `applyBattleResult` (the loser's `totalHp` then includes it while the
   bridge's pre-month snapshot does not), so the bridge's `lossFraction` is
   higher and can overstate the class/delta (report ±10 where the engine
   applied ±5). This commission residual is the same accepted class as the
   multi-battle cascade below and is deliberately not reconstructed here
   (keeps the bridge read-only and simple); it is cross-referenced in INC-5.
2. **Unavailable loser ⇒ `warScoreDelta: 0`, recorded, never fabricated.**
   If the losing nation or its fleet ships are genuinely unavailable on the
   pre-month snapshot (`loserNation === undefined`, no non-under-construction
   ships, or zero total HP), the bridge reports `warScoreDelta: 0` and appends
   a reason to `explanation`. The prior `totalHp > 0 ? lossHp/totalHp : 1`
   fallback (which turns absence into a decisive +10) is removed.
3. **Non-decided battles contribute 0.** A decided battle is (per ADR-0027/0026
   §7) the only kind `applyBattleResult` is even called for; a null-winner/`
   null-loser battle contributes no war score, so its delta is 0.
4. **Test oracle is derived from the engine's observable output.** The test no
   longer copies the bridge formula. For a single decided battle with no ±100
   clamping it asserts `warScoreDelta === max(|pre→post ΔattackerWarScore|,
   |pre→post ΔdefenderWarScore|)` of the winning war — the magnitude the engine
   literally wrote onto the snapshot. A decisive-boundary case pins a battle that
   sinks ≥1 loser ship (lossFraction ≥ 0.5 → ±10). These assertions FAIL if the
   derivation moves back to the post-month snapshot.

## Consequences

- Correct display delta for single-battle months, matching the engine exactly.
- **Residual multi-battle-month inexactness (documented, accepted, DON'T fix in
  the desktop):** in a month that resolves multiple battles against the same
  opponent, the engine computes battle B's class off battle A's already-applied
  damage (a per-battle cascade). Re-deriving every battle off one pre-month
  snapshot cannot reproduce that cascade. Reconstructing it would require
  replaying battle ordering in the bridge — out of scope; the single-battle case
  is exact and the cascade is a follow-up (see below).
- **Residual same-month-commissioning inexactness (documented, accepted):** a
  ship commissioned into the losing fleet in the same month is present at
  pre-battle HP in `applyBattleResult`'s basis but absent from the bridge's
  pre-month snapshot, so its totalHp is excluded and the lossFraction can be
  overstated. Accepted; cross-referenced in INC-5.
- A `BattleResolved` event is NOT a usable source (no phase emits one).
- **Follow-up (not started):** persist `warScoreDelta`/`victoryClass` on the
  engine's `BattleResult` (engine sprint) so the desktop reads an authoritative
  value instead of re-deriving it, and the multi-battle inexactness disappears.
  Recorded as ticket
  `.scratch/desktop-battle-outcomes/issues/05-followup-persist-warscore-delta.md`.

## Related requirements

ENGINEERING-CONTRACT (derived values pure/reproducible/explainable; bridge must
not fabricate); ADR-0026 §7 (non-decided battles), ADR-0027 (battle-resolution
phase wiring).

## Related ADRs

ADR-0026 (battle auto-resolution), ADR-0027 (battle-resolution phase wiring),
ADR-0010 (diplomacy/war, victory classification).