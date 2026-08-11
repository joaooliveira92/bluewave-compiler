# 04 — B10c diplomacy and war scope

## Question

What exact scope does B10c (Milestone 1c: Diplomacy + War/Peace) cover?

This sub-milestone extends the existing diplomatic relations and battle resolution into a full war-and-peace lifecycle.

Questions to resolve:

- Diplomacy scope: declaration of war, peace treaties, alliances, non-aggression pacts, trade agreements?
- War scope: war goals, surrender terms, territorial transfer, blockade mechanics?
- How does the existing narrow battle auto-resolution (B7) integrate with a war lifecycle?
- What is the minimum viable war/peace system for 1880 between GBR and FRA?
- Are treaties (DESIGN-30) in scope or deferred?
- What are the explicit out-of-scope items?
- Acceptance criteria — what must be demonstrable?
- Does this need new aggregates (TreatyState, WarGoalState)?

Type: grilling
Status: resolved
Blocked by: 03

## Answer

B10c scope is production-ready minimum-viable diplomacy + war/peace. Here are the decisions:

### Diplomacy — Minimum Viable

- **Declaration of war**: `DeclareWarCommand` creates a `WarDeclaration`, transitions relation to `at_war`, sets tension to `10`.
- **Peace treaties**: `AcceptPeaceCommand` ends war, resets relation to `neutral`, tension to `5`. No settlement terms — simple war-ender.
- **Alliances**: `FormAllianceCommand`+`BreakAllianceCommand` lifecycle. Mutual defense: ally auto-joins defender's side via `JOIN_WAR` during `battle_resolution`.
- **Non-aggression pacts**: `FormNonAggressionPactCommand` / `BreakNonAggressionPactCommand`. Violation costs 50 treasury.
- **Trade agreement**: Retained as-is from fixture. No runtime trade mechanics. Declaring war auto-terminates it.
- **Tension**: Single scalar `0..10` on `DiplomaticRelation`. War=`10`, peace=`5`, alliance=`2`. No ledger, no incidents, no war-risk assessment.
- **Pair registry**: Every unordered pair has exactly one `DiplomaticRelation`. Auto-created as `neutral` for missing pairs.

### War/Peace — Minimum Viable

- **War lifecycle**: `DECLARED_NOT_ACTIVE` → `ACTIVE` → `ENDED`. Side model with multi-participant support per side.
- **War score**: `-100..100` per side, updated from battle outcomes (shipped: ±2/±5/±10). No objective/blockade/merchant/occupation scores.
- **National contribution**: Points from enemy combat-value loss inflicted. Claims and allocation deferred.
- **Peace eligibility**: Score advantage `>=20`, duration `>=24mo`, or explicit command.
- **Surrender**: Auto-peace when side score `>=80` after a battle.
- **Blockade**: Basic `DeclareBlockadeCommand`, `+2` war score per established month. No economic effects.
- **Concurrent war limit**: 3 max. Reason code on violation.
- **Battle integration**: `BattleResolver` unchanged. Results feed war-score updates. New `RESOLVE_DIPLOMACY` phase (order 6.5) processes all diplomatic commands.

### Treaties (DESIGN-30)

**Entirely deferred.** Alliance/NAP are declarative commands, not treaty aggregates. No `TreatyState`, clauses, compliance, or settlement treaties.

### Fixture

3-nation (GBR, FRA, GER) is sufficient. GBR–FRA at tension 5 (strained). GER at tension 2/1. Fixture includes sample `DeclareWarCommand` for first-month demonstration.

### Packages

Extend `@bluewave/campaign`, `@bluewave/phase-engine`, `@bluewave/commands`. No new packages.

### Key deferrals

No directed attitude, tension ledger, incidents, war-risk, diplomatic events, canal access, guarantees, tech trade, cooldowns, war goals, settlement terms, separate peace, coalition claims, revolutionary defeat, successors, merchant warfare, occupation, war exhaustion, full PeaceOffer lifecycle, treaties.
