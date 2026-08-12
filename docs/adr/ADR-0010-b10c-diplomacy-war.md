# ADR-0010: B10c Diplomacy & War — Victory Classification, Phase Ordering, and State Model

## Status

Accepted

## Context

Sprint A-3 / B10c (`docs/rules/diplomacy.md` DESIGN-17, `docs/rules/war-and-peace.md`
DESIGN-31, brief `.ai/briefs/b10c-diplomacy-war.md`) ships a minimum-viable
diplomacy + war lifecycle. Three design points were under-specified in the
canonical sources and are resolved here deterministically so the work can
proceed without an owner in the loop (per the project's fully-autonomous
workflow; recording these as versioned ruleset constants per ENGINEERING-CONTRACT).

### 1. Victory-level classification predicate (was decision request)

DESIGN-31 §10 ships the war-score values (minor `+2`, major `+5`, decisive `+10`
and negatives) but no authoritative rule maps a `BattleResult` to one of the
three levels. The `BattleResolver` (criterion 15) must remain unchanged, so the
predicate is derived from its exposed output plus the battle's committed ships.

Resolved (Option A): classify by the **fraction of the losing side's total
committed hit points destroyed or damaged** in the battle.

```
lossFraction = sum(damageReport[ship].value for every loser-committed ship)
               / sum(committedLoserShip.hitPoints)
```

`BattleResolver.applyDamage` writes a `damageReport` entry for **every** loser
ship (destroyed or surviving), and `attackerLosses`/`defenderLosses` are the
destroyed ids, so the predicate needs only `result.damageReport`, `result.loserId`
and the battle's loser-side fleet ships — all deterministic, resolver-unchanged.

Versioned thresholds (ruleset constants):

| level | condition | winner war-score |
|---|---|---|
| minor | `lossFraction < 0.25` | `+2` |
| major | `0.25 <= lossFraction < 0.50` | `+5` |
| decisive | `lossFraction >= 0.50` | `+10` |

The loser receives the negative of the winner's value. Recorded as versioned
constants in `@bluewave/campaign` (`WAR_SCORE_*`), not scattered literals.

### 2. `RESOLVE_DIPLOMACY` phase ordering

The brief labels `RESOLVE_DIPLOMACY` as order 6.5 "between `battle_resolution` (6)
and `closing_validation` (7)", but the real `PhaseRegistry` (registry.ts) numbers
`battle_resolution` as 8 and `closing_validation` as 9 (the brief omits
`monthly_revenue` and `maintenance`). The **data-flow requirement** is what
matters: diplomatic commands are collected in `command_collection` (3) and must
be processed (declare → `DECLARED_NOT_ACTIVE`, alliances, NAP, blockade) **before**
`battle_resolution` (8) promotes the war to `ACTIVE`, applies war score, alliance
auto-entry and surrender. Therefore `RESOLVE_DIPLOMACY` is inserted at order
**6.5** (between `construction_processing` 6 and `resolve_research` 7), which
satisfies the required ordering. Phase-count tests that assumed
`phases[i].order === i` are updated to a fractional-order-aware assertion.

### 3. B10c state-model additions

`DiplomaticRelation` gains `tension` (0..10) and `nap` (non-aggression pact).
`WarDeclaration` gains side model + war score + revised status. New
`WarParticipantMembership` and `BlockadeState` types; `WarState` gains
`participantMemberships` and `blockadeState`. Full shapes are defined in the code
(`packages/campaign/src/state.ts`). These fields are serialized into snapshots and
fed to the hashed ledgers, so `golden/hashes.json` is regenerated per ADR-0007.

## Decision

1. Victory classification per Option A above with versioned `WAR_SCORE_*` constants.
2. `RESOLVE_DIPLOMACY` phase at order 6.5 (rng `false`, read `[wars,politics,fleets]`,
   write `[wars,politics]`).
3. State-model additions as described; `cloneSnapshot` updated to preserve them.

## Consequences

- War score drives peace eligibility (advantage `>=20` or duration `>=24` months)
  and surrender (`score >= 80`), so the chosen thresholds materially affect
  gameplay; they are recorded as versioned constants and can be re-tuned under a
  balance pass without a code-behavior change.
- Phase ordering tests are updated (not weakened) to reflect the fractional order.
- Golden hashes are regenerated with the ADR-0007 documented reproducible process
  and committed with the cause noted.