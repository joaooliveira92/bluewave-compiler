# Bluewave Game Design

Version: 1.0 structured edition  
Status: Canonical design baseline  
Simulation scope: 1880–1970  
Strategic resolution: monthly  
Tactical resolution: discrete one-minute turns  
Game mode: offline, single-player, deterministic when seeded

## Document Contract

This documentation defines normative game behavior.

- **MUST**: required behavior.
- **MUST NOT**: prohibited behavior.
- **SHOULD**: default behavior; deviations require an explicit rule.
- **MAY**: optional behavior.
- **BALANCE TARGET**: non-normative tuning guidance.
- **OPEN DECISION**: unresolved behavior that an implementation must not invent.

### Precedence

When two statements overlap, use this order:

1. Non-negotiable architectural rules.
2. Explicit subsystem rules.
3. Scenario overrides.
4. Ruleset constants.
5. Balance targets and illustrative examples.

If two normative statements conflict, implementation must stop and report the conflict. It must not silently select one.

## How To Use This Documentation

- Start with [Game Vision](docs/vision/game-vision.md).
- Use `docs/domain/` to establish canonical language and identities.
- Use `docs/architecture/` for system-wide contracts and authority.
- Use `docs/rules/` for subsystem behavior.
- Use `docs/contracts/` for extracted implementation contracts and audit catalogs.
- Use `docs/acceptance/` to determine whether behavior is complete.
- Use `docs/delivery/` only for implementation order and scope.
- See [Known specification issues](docs/OPEN-ISSUES.md) before creating implementation tickets.
- See [Migration audit](docs/audit/MIGRATION-AUDIT.md) for coverage and limitations.
- The untouched source is preserved at [SOURCE-DESIGN-v1.0.md](SOURCE-DESIGN-v1.0.md).

## Document Map

### Vision

- [`DESIGN-01` Game Vision](docs/vision/game-vision.md)

### Domain

- [`DESIGN-02` Player Identity And Campaign Continuity](docs/domain/player-identity-and-continuity.md)
- [`DESIGN-04` Canonical Playable Slots](docs/domain/playable-slots-and-nation-identity.md)
- [`DESIGN-12` Nations And Governments](docs/domain/nations-and-governments.md)
- [`DESIGN-14` World Geography](docs/domain/world-geography.md)
- [`DESIGN-15` Possessions And Territorial Control](docs/domain/possessions-and-territorial-control.md)
- [`DESIGN-19` Strategic Objectives](docs/domain/strategic-objectives.md)
- [`DESIGN-24` Fleet Management](docs/domain/fleet-management.md)
- [`DESIGN-26` Divisions And Formations](docs/domain/divisions-and-formations.md)
- [`DESIGN-27` Officers And Personnel](docs/domain/officers-and-personnel.md)

### Architecture

- [`DESIGN-05` Canonical Content And Rulesets](docs/architecture/canonical-content-and-rulesets.md)
- [`DESIGN-06` Authoritative State Model](docs/architecture/authoritative-state-model.md)
- [`DESIGN-07` Numeric And Temporal Contract](docs/architecture/numeric-and-temporal-contract.md)
- [`DESIGN-08` Determinism And Randomness](docs/architecture/determinism-and-randomness.md)
- [`DESIGN-09` Campaign Compilation](docs/architecture/campaign-compilation.md)
- [`DESIGN-11` Command Model](docs/architecture/command-model.md)
- [`DESIGN-29` Intelligence And Knowledge](docs/architecture/intelligence-and-knowledge.md)
- [`DESIGN-49` Events](docs/architecture/events.md)
- [`DESIGN-50` AI Architecture](docs/architecture/ai-architecture.md)
- [`DESIGN-51` UI And Player Interaction](docs/architecture/ui-and-player-interaction.md)
- [`DESIGN-52` Save, Load, Replay, And Persistence](docs/architecture/persistence-and-replay.md)
- [`DESIGN-53` Validation, Normalization, And Repair](docs/architecture/validation-normalization-and-repair.md)
- [`DESIGN-57` Non-Negotiable Architectural Rules](docs/architecture/non-negotiable-rules.md)

### Rules

- [`DESIGN-03` Campaign Configuration](docs/rules/campaign-configuration.md)
- [`DESIGN-10` Strategic Monthly Turn Pipeline](docs/rules/strategic-turn.md)
- [`DESIGN-13` Economy And Accounting](docs/rules/economy.md)
- [`DESIGN-16` Bases And Infrastructure](docs/rules/bases-and-infrastructure.md)
- [`DESIGN-17` Diplomacy](docs/rules/diplomacy.md)
- [`DESIGN-18` Politics, Confidence, And Unrest](docs/rules/politics-confidence-and-unrest.md)
- [`DESIGN-20` Research And Technology](docs/rules/research-and-technology.md)
- [`DESIGN-21` Ship Design](docs/rules/ship-design.md)
- [`DESIGN-22` Ship Classification](docs/rules/ship-classification.md)
- [`DESIGN-23` Construction, Repair, And Rebuild](docs/rules/construction-repair-and-rebuild.md)
- [`DESIGN-25` Deployment And Logistics](docs/rules/deployment-and-logistics.md)
- [`DESIGN-28` Crew, Training, And Morale](docs/rules/crew-training-and-morale.md)
- [`DESIGN-30` Treaties](docs/rules/treaties.md)
- [`DESIGN-31` War And Peace](docs/rules/war-and-peace.md)
- [`DESIGN-32` Blockade](docs/rules/blockade.md)
- [`DESIGN-33` Trade, Raiding, And Merchant Shipping](docs/rules/trade-raiding-and-merchant-shipping.md)
- [`DESIGN-34` Submarines](docs/rules/submarines.md)
- [`DESIGN-35` Mine Warfare](docs/rules/mine-warfare.md)
- [`DESIGN-36` Amphibious Operations](docs/rules/amphibious-operations.md)
- [`DESIGN-37` Battle Generation](docs/rules/battle-generation.md)
- [`DESIGN-38` Tactical Combat](docs/rules/tactical-combat.md)
- [`DESIGN-39` Gunnery](docs/rules/gunnery.md)
- [`DESIGN-40` Torpedoes](docs/rules/torpedoes.md)
- [`DESIGN-41` Damage, Fire, And Flooding](docs/rules/damage-fire-and-flooding.md)
- [`DESIGN-42` Weather, Visibility, And Smoke](docs/rules/weather-visibility-and-smoke.md)
- [`DESIGN-43` Aircraft](docs/rules/aircraft.md)
- [`DESIGN-44` Carrier Operations](docs/rules/carrier-operations.md)
- [`DESIGN-45` Air Defense](docs/rules/air-defense.md)
- [`DESIGN-46` Radar, Electronics, And Electronic Warfare](docs/rules/radar-electronics-and-ew.md)
- [`DESIGN-47` Missiles](docs/rules/missiles.md)
- [`DESIGN-48` Coastal Defense](docs/rules/coastal-defense.md)

### Acceptance

- [`DESIGN-54` Testing And Acceptance](docs/acceptance/testing-and-acceptance.md)
- [`DESIGN-56` Final Career Evaluation](docs/acceptance/final-career-evaluation.md)

### Delivery

- [`DESIGN-55` Release Scope And Implementation Order](docs/delivery/release-scope-and-implementation-order.md)

