# B10c Milestone: Diplomacy + War/Peace

## Scope

### Diplomacy (aligned to DESIGN-17)

Production-ready minimum-viable diplomacy. The existing `DiplomaticRelation` is a flat list with `neutral | allied | at_war | trade_agreement`. B10c formalizes this into a bounded diplomatic system grounded in the pair-registry model, without the full DESIGN-17 directed-attitude, tension-ledger, incident, war-risk, or event systems.

In scope:

- **Declaration of war**: A `DeclareWarCommand` in `@bluewave/commands`. Accepting the command creates a `WarDeclaration`, auto-transitions the relevant `DiplomaticRelation` to `at_war`, and feeds the new war into the existing `battle_resolution` phase. Validated through `CommandLifecycle` — rejected if the pair is already at war, or if the target nation does not exist. Reason codes: `ALREADY_AT_WAR`, `DECLARE_WAR_INVALID_TARGET`.

- **Peace treaty**: An `AcceptPeaceCommand` that ends an active war. On acceptance, the war's `status` becomes `ended`, the pair's diplomatic relation reverts to `neutral`, the peace-effective month is recorded. Settlement terms (territorial transfer, reparations, etc.) are out of scope — peace is a simple war-ender in the MVP. Reason codes: `PEACE_NO_ACTIVE_WAR`, `PEACE_INVALID`.

- **Alliances**: Extend `DiplomaticRelation` to support a formal `alliance` lifecycle. An `FormAllianceCommand` transitions a `neutral` pair to `allied`. The alliance creates a mutual-defense obligation: a declaration of war by a third party against one member triggers automatic war entry for the other (basic alliance call). `BreakAllianceCommand` transitions back to `neutral` (peace only — no breaking during an active shared war). Reason codes: `ALLIANCE_ALREADY_EXISTS`, `ALLIANCE_TARGET_NOT_NEUTRAL`, `ALLIANCE_LOCKED_BY_WAR`, `ALLIANCE_FORMATION_INELIGIBLE`.

- **Non-aggression pact**: A `FormNonAggressionPactCommand` establishing a bounded mutual peace commitment. If either party declares war on the other, the pact is broken and the declarer suffers a treasury penalty (fixed 50 currency units). Reason codes: `NAP_ALREADY_EXISTS`, `NAP_VIOLATED`.

- **Trade agreement**: The existing `trade_agreement` relation is retained as-is — it is a passive status set at fixture compile time. No runtime trade mechanics in B10c (trade income/goods deferred). The status constrains war declaration: a trade partner may be declared upon, but doing so terminates the trade agreement automatically.

- **Diplomatic pair lifecycle**: The `PoliticalState.relations` array is extended to enforce that every unordered pair of active powers has exactly one `DiplomaticRelation` record. Missing pairs are auto-created as `neutral` at campaign start. Self-relations are prohibited. `INVALID_DIPLOMATIC_PAIR_REGISTRY` on violations.

- **Tension (minimal)**: A shared `tension` field on `DiplomaticRelation` (integer `0..10`, matching DESIGN-17 §4.1 scale). Not a full tension-ledger system — a single scalar that war declaration sets to `10`, peace resets to `5`, alliance formation sets to `2`, and nothing else mutates it in B10c. This gives AI and future events a hook without the full ledger. Reason code: `TENSION_OUT_OF_RANGE`.

- **Reason codes** (diplomacy subset): `INVALID_DIPLOMATIC_PAIR_REGISTRY`, `TENSION_OUT_OF_RANGE`, `ALREADY_AT_WAR`, `DECLARE_WAR_INVALID_TARGET`, `PEACE_NO_ACTIVE_WAR`, `PEACE_INVALID`, `ALLIANCE_ALREADY_EXISTS`, `ALLIANCE_TARGET_NOT_NEUTRAL`, `ALLIANCE_LOCKED_BY_WAR`, `ALLIANCE_FORMATION_INELIGIBLE`, `NAP_ALREADY_EXISTS`, `NAP_VIOLATED`, `DIPLOMATIC_STATE_INVARIANT_FAILED`.

Explicitly out of scope for B10c (deferred):

- **Directed attitude** (DESIGN-17 §3) — attitude, trust, threat, grievance, affinity, modifiers.
- **Tension ledger** (DESIGN-17 §5) — full immutable entry-per-effect system. Single scalar tension is the MVP.
- **Incidents** (DESIGN-17 §8) — no incident records, severity, or war-risk contributions.
- **War-risk assessment** (DESIGN-17 §7) — no derived war-risk score or escalation thresholds. War starts only by explicit command or scenario event.
- **Canal access binding** (DESIGN-17 §6) — tension-driven canal denial deferred.
- **Diplomatic events** (DESIGN-17 §20) — no event contracts, hawkish/dovish profiles, or event-driven tension.
- **Guarantees and access rights** (DESIGN-17 §19) — no formal access-right records.
- **Technology trade** (DESIGN-17 §13) — alliance tech discounts deferred.
- **Cooldowns** (DESIGN-17 §24) — no cooldown records for diplomatic actions.

### War/Peace (aligned to DESIGN-31)

Production-ready minimum-viable war lifecycle. The existing `WarState`/`WarDeclaration` tracks wars as `active | ended` with an attacker/defender pair. The existing `BattleResolver` handles combat. B10c connects these into a coherent flow: declare → fight → settle.

In scope:

- **War identity and status lifecycle**: `WarDeclaration.status` gains the canonical DESIGN-31 §2 values: `DECLARED_NOT_ACTIVE`, `ACTIVE`, and `ENDED`. (`CEASEFIRE`, `SETTLEMENT_PENDING`, `INVALIDATED_BY_MIGRATION` deferred.) A war is `DECLARED_NOT_ACTIVE` upon declaration and transitions to `ACTIVE` in the next `battle_resolution` phase.

- **Belligerent sides**: `WarDeclaration` gains `attackerSideId` and `defenderSideId` (string identifiers). A `sideMembers` array lists participating nation ids per side. The existing `attackerId`/`defenderId` primary pair remains as the root identifiers. Multiple participants per side are supported (alliance war entry).

- **War participant membership**: A new `WarParticipantMembership` record per participating nation tracking `warId`, `nationId`, `sideId`, `entryMonth`, `exitMonth`, `status` (`ACTIVE` | `EXITED`). Stored within `WarState`.

- **Concurrent war limit**: A nation may participate in at most 3 active wars at once (shipped DESIGN-31 §5 value). `MAXIMUM_CONCURRENT_WARS_REACHED` on violation.

- **Alliance war entry**: When a war is declared against an allied nation, the `battle_resolution` phase auto-joins the ally to the defender's side via `JOIN_WAR` typed effect. This is the minimum mutual-defense obligation — no player prompt, no support-commitment calculation. The ally simply becomes a co-belligerent for the duration.

- **War score (minimal)**: A `warScore` integer per side (`-100..100`, DESIGN-31 §8). Updated by battle outcomes using the shipped DESIGN-31 §10 values: minor victory `+2`, major victory `+5`, decisive victory `+10`, and the corresponding negatives for defeat. No objective, blockade, merchant-warfare, or occupation score sources in B10c. Reason code: `UNLEDGERED_WAR_SCORE_MUTATION`.

- **National contribution (minimal)**: A `nationalContributionPoints` non-negative integer per participant, incremented by `enemy combat-value loss inflicted / 1000` (combat-value from battle damage) using DESIGN-31 §11 shipped formula. Zero for no inflicted loss. No objective, blockade, or occupation contribution sources.

- **Peace eligibility (minimal)**: A side may offer peace when at least one condition holds (DESIGN-31 §13 subset):
  - War score advantage `>= 20`;
  - War duration `>= 24` completed months;
  - Or an explicit `AcceptPeaceCommand` is issued by any participant.
    Reason code: `PEACE_NEGOTIATION_INELIGIBLE`.

- **Peace settlement (minimal)**: `AcceptPeaceCommand` resolves the war. At settlement:
  1. War status set to `ENDED`.
  2. All participant `WarParticipantMembership.status` set to `EXITED` with exit month.
  3. Diplomatic relation between former belligerents set to `neutral`, tension reset to `5`.
  4. Alliances between former belligerents are broken (separate peace not possible — all participants exit).
  5. No territorial transfer, reparations, ship transfer, or treaty obligations. These are deferred.

- **Surrender (minimal)**: Not a separate mechanic in B10c. A side at overwhelming score disadvantage (`score >= 80`) may accept peace without the other side's explicit command — auto-triggered during `battle_resolution` when the threshold is crossed after a battle outcome. This is the MVP stand-in for capitulation.

- **Blockade**: A `blockadeState` array on `WarState` tracking `blockaderId`, `blockadedNationId`, `areaId`, `establishedMonth`. A blockade is established by a `DeclareBlockadeCommand` targeting a specific area containing ports of the enemy. No blockade effects on economy in B10c (wartime economy modifiers deferred). Blockade contributes `+2` per established month to the blockader's war score (DESIGN-31 §10 shipped value). Reason codes: `BLOCKADE_INVALID_TARGET`, `BLOCKADE_ALREADY_EXISTS`, `BLOCKADE_NOT_AT_WAR`.

- **Battle integration**: The existing `BattleResolver` is unchanged. B10c adds:
  - A `RESOLVE_DIPLOMACY` phase (order 6.5, between `battle_resolution` (6) and `closing_validation` (7)) that processes diplomatic commands (`DeclareWarCommand`, `AcceptPeaceCommand`, `FormAllianceCommand`, `BreakAllianceCommand`, `FormNonAggressionPactCommand`, `DeclareBlockadeCommand`).
  - Battle outcomes feed war-score updates back into `WarState`.
  - After battle resolution, surrender eligibility is checked for sides with score `>= 80`.

- **Phase pipeline changes**: The `PhaseRegistry` gains:
  - `RESOLVE_DIPLOMACY` at order 6.5, `rngAllowed: false`, `readPermissions: ["wars", "politics", "fleets"]`, `writePermissions: ["wars", "politics"]`.

- **Reason codes** (war/peace subset): `INVALID_WAR_STATE`, `INVALID_WAR_SIDE`, `INVALID_WAR_PARTICIPANT_MEMBERSHIP`, `MAXIMUM_CONCURRENT_WARS_REACHED`, `WAR_PARTICIPANT_ALREADY_ACTIVE`, `UNLEDGERED_WAR_SCORE_MUTATION`, `PEACE_NEGOTIATION_INELIGIBLE`, `PEACE_OFFER_INVALID`, `BLOCKADE_INVALID_TARGET`, `BLOCKADE_ALREADY_EXISTS`, `BLOCKADE_NOT_AT_WAR`, `WAR_AND_PEACE_INVARIANT_FAILED`.

Explicitly out of scope for B10c (deferred):

- **War goals and objectives** (DESIGN-31 §5, §10) — no war-goal records, objective score, or objective completion.
- **Settlement terms** (DESIGN-31 §18-25) — no `TRANSFER_POSSESSION_OWNERSHIP`, `TRANSFER_SHIP`, `REPARATIONS`, `SHIPBUILDING_RESTRICTION`, `CREATE_TREATY_OBLIGATION`, or any other term type.
- **Separate peace** (DESIGN-31 §31-32) — all participants exit together; a single nation cannot peel off.
- **Coalition claim pools and allocation** (DESIGN-31 §27-29) — no side claim pool, largest-remainder allocation, or unused-claim conversion.
- **Revolutionary defeat** (DESIGN-31 §34-36) — no revolution-war interaction.
- **Successor states** (DESIGN-31 §37) — successor creation deferred.
- **Merchant warfare** — no commerce raiding or merchant-loss score.
- **Occupation** — no territorial occupation, liberation, or occupation score.
- **War exhaustion** — no exhaustion system; war duration is the only pressure.
- **Full peace offer object** — `PeaceOffer` with `DRAFT`/`VALIDATED`/`PRESENTED`/etc. lifecycle deferred. Peace is a command, not a negotiated instrument.

### Treaties (DESIGN-30)

**Explicitly deferred.** The full `TreatyState`, clause types, signing validation, compliance, inspection, violation, disposal, and settlement-based treaty creation are not in B10c.

A treaty-style agreement in B10c is represented by the declarative commands (alliance, non-aggression pact). No treaty aggregate, clause type, or compliance system exists.

### Fixture

- The existing 3-nation fixture (GBR, FRA, GER) is sufficient. No new nations needed.
- GBR and FRA start at tension `5` (strained), with `neutral` relation and two `ConstructionProject` ships each (already in fixture).
- GER starts at tension `2` (cordial) with GBR and `1` (cooperative) with FRA, both `neutral`.
- The fixture includes a `DeclareWarCommand` in the first month's command set to demonstrate war declaration → battle resolution → peace lifecycle.

### Command surface

New commands in `@bluewave/commands`, validated through `CommandLifecycle`:

- `DeclareWarCommand`: declarer, target, war goals (optional id only, no goal system). Creates war, transitions relation.
- `AcceptPeaceCommand`: proposing nation, target war. Ends war, resets relations.
- `FormAllianceCommand`: proposer, partner, optional duration. Transitions both pairs to `allied`.
- `BreakAllianceCommand`: proposer, partner. Transitions back to `neutral`.
- `FormNonAggressionPactCommand`: proposer, partner, duration months. Sets NAP on pair.
- `BreakNonAggressionPactCommand`: proposer, partner. Removes NAP.
- `DeclareBlockadeCommand`: declarer, target, areaId. Creates blockade record.

### Package placement

- **Extend `@bluewave/campaign`**: Expanded `DiplomaticRelation` (tension, alliance, nap fields), new `WarParticipantMembership` and `BlockadeState` types, `WarState` gets participant memberships and blockade arrays, `WarDeclaration` gets side model.
- **Extend `@bluewave/phase-engine`**: New `RESOLVE_DIPLOMACY` phase in `PhaseRegistry` and `MonthExecutor`, battle-result-to-war-score integration, surrender auto-check.
- **Extend `@bluewave/commands`**: All new command types above. Existing `CommandLifecycle` validation patterns.
- **No new packages** for B10c.

## Out of scope

- Directed attitude system (trust, threat, grievance, affinity)
- Tension ledger (immutable entries, full cause tracking)
- Incidents and war-risk assessment
- Canal access binding
- Diplomatic events (hawkish/dovish profiles, event contracts)
- Guarantees and access rights
- Technology trade (alliance discounts)
- Cooldown records
- War goals and objectives
- Settlement terms (territorial transfer, reparations, ship transfer, restrictions)
- Separate peace
- Coalition claim pools and largest-remainder allocation
- Revolutionary defeat
- Successor states
- Merchant warfare / commerce raiding
- Occupation / liberation score
- War exhaustion system
- Full PeaceOffer lifecycle (draft/validate/present/accept/reject)
- Full TreatyState and treaty clauses (DESIGN-30 entirely deferred)
- War merger
- AI diplomacy decision-making (B10d)
- Desktop render of diplomacy/war (B9 is CLI-only; B10c stays CLI)

## Acceptance criteria

1. `MonthExecutor` runs a full monthly turn with GBR, FRA, and GER including the new `RESOLVE_DIPLOMACY` phase.
2. `DeclareWarCommand` creates a `WarDeclaration` with status `DECLARED_NOT_ACTIVE`, transitions the GBR↔FRA relation to `at_war`, sets tension to `10`.
3. In the next `battle_resolution` phase, a `pending` battle (if any) is resolved, the war transitions to `ACTIVE`, and the war score updates per battle outcome using shipped values.
4. If FRA is allied to GER via `FormAllianceCommand`, a GBR declaration of war on FRA automatically adds GER to the defender's side.
5. `AcceptPeaceCommand` ends the war, sets all participant memberships to `EXITED`, resets relations to `neutral`, resets tension to `5`.
6. A side reaching war score `>= 80` after a battle triggers surrender — peace is auto-accepted.
7. A nation cannot exceed 3 concurrent active wars; attempt is rejected with `MAXIMUM_CONCURRENT_WARS_REACHED`.
8. `DeclareBlockadeCommand` creates a blockade record; the blockader gains `+2` war score per established month.
9. `FormAllianceCommand` is rejected when the pair is at war (`ALLIANCE_TARGET_NOT_NEUTRAL`).
10. `BreakAllianceCommand` is rejected when both parties share an active war (`ALLIANCE_LOCKED_BY_WAR`).
11. `FormNonAggressionPactCommand` creates a NAP; violating it by declaring war deducts 50 treasury from the violator.
12. `DeclareWarCommand` against a non-existent nation is rejected with `DECLARE_WAR_INVALID_TARGET`.
13. `DeclareWarCommand` against an already-at-war pair is rejected with `ALREADY_AT_WAR`.
14. All state changes are deterministic for a fixed seed (replay produces identical snapshots and hashes).
15. The existing `BattleResolver` still passes its test suite with zero changes.
16. Existing compiler, command, phase, persistence, and determinism test suites still pass.
17. `vitest run` passes across the workspace.

## Stop conditions

- A DESIGN-17 or DESIGN-31 invariant (e.g., pair-registry uniqueness, war-score range, concurrent war limit) cannot be expressed within the existing `PoliticalState`/`WarState` structure without a breaking persistence change (then stop and propose a migration ADR).
- The alliance auto-war-entry logic conflicts with the `CommandLifecycle` single-slot assumption (commands from one nation only) such that ally war entry cannot be effected within the existing phase pipeline (then stop and propose a phase-engine refactor before proceeding).
- The `RESOLVE_DIPLOMACY` phase (order 6.5) insertion requires a change to the `PhaseRegistry` or `MonthExecutor` that breaks existing phase-ordering invariants (then stop and verify the insertion is safe with existing phases).
- The `BattleResolver` integration (war-score updates from battle results) cannot be wired without modifying the resolver interface (then stop and add a `WarScoreEffect` output to the resolver before proceeding).
- Determinism cannot be preserved for a fixed seed across the new diplomatic and war lifecycle phases.
