BLUEWAVE GAME DESIGN SCRIPT
Version: 1.0
Status: Canonical Design Baseline
Simulation Scope: 1880–1970
Strategic Resolution: Monthly
Tactical Resolution: Discrete one-minute turns
Game Mode: Offline, single-player, deterministic when seeded


1. GAME VISION

Purpose:

- Bluewave is a long-form naval strategy and tactical combat simulation.
- The player leads the naval institution of a major power rather than
  representing one fixed historical individual.
- The campaign models naval policy, fleet design, procurement, research,
  deployment, diplomacy, war, political confidence, and tactical command.
- The player influences foreign policy but does not directly control the
  whole national government.
- Campaign success is evaluated relative to the nation's starting position,
  assigned strategic objectives, political confidence, and long-term naval
  performance.

Primary Player Fantasy:

- Shape a nation's navy across multiple technological eras.
- Design ships and force structures under economic, industrial, political,
  treaty, and technological constraints.
- Prepare for wars whose timing and diplomatic context are not fully under
  player control.
- Command selected tactical engagements.
- Preserve the navy's institutional standing and leave a capable legacy fleet.

Core Design Principles:

- Decisions must have visible causes and traceable consequences.
- Historical asymmetry is intentional, but career evaluation is relative to
  each nation's opportunities and constraints.
- Randomness must be deterministic, seeded, domain-separated, and auditable.
- The player and AI issue commands through the same rules wherever practical.
- Information presented to the player is limited by intelligence and fog of war.
- The database stores canonical content and authoritative state, not duplicated
  procedural projections.
- All derived values must be reproducible from authoritative inputs.
- Save/load must preserve deterministic future outcomes when the same commands
  are repeated.
- Tactical combat must never be required for campaign continuity; every battle
  must support deterministic auto-resolution.
- No campaign may begin unless all start-readiness gates pass.

 2. PLAYER IDENTITY AND CAMPAIGN CONTINUITY


Player Role:

- The player represents the continuing senior leadership of the national navy.
- The role persists across retirements, promotions, regime changes, and officer
  generations.
- Individual officers remain separate simulated characters.
- "Prestige" represents institutional confidence in the player's naval
  administration, not the personal reputation of an immortal officer.

Campaign Continuity:

- Government changes do not automatically end the campaign.
- Revolution, defeat, regime change, constitutional change, or national
  succession may alter:
  - government type;
  - political mandates;
  - national traits;
  - diplomatic relations;
  - possessions;
  - budget;
  - strategic objectives;
  - officer eligibility;
  - institutional confidence.
- Campaign termination occurs only through an explicit terminal condition.

Campaign Terminal Conditions:

- Institutional confidence collapses and the naval administration is dismissed.
- The player nation ceases to have a supported continuation state.
- A scenario-specific terminal defeat condition is reached.
- The campaign reaches December 1970 and completes final evaluation.
- The player voluntarily retires the campaign.
- A canonical scenario endpoint explicitly terminates the campaign.

Non-Terminal Major Outcomes:

- Losing a war.
- Losing possessions.
- Revolution with a supported successor regime.
- Temporary fiscal insolvency.
- Fleet destruction.
- Government change.
- Treaty-imposed naval restrictions.

 3. CAMPAIGN CONFIGURATION


Supported Historical Start Scenarios:

- scen_1880
- scen_1900
- scen_1920
- scen_1935
- scen_1960

Simulation End:

- December 1970, unless terminated earlier.

Strategic Turn:

- One calendar month.

Required Campaign Inputs:

- Scenario.
- Player slot.
- Historical continuity mode.
- Fleet-size setting.
- Research-speed setting.
- Technology-variation setting.
- Historical-budget option where supported.
- Legacy-fleet mode where supported.
- Tactical realism mode.
- Campaign difficulty profile.
- Campaign seed.

Fleet-Size Setting:

- Modifies national naval appropriations, sustainable fleet size, AI force
  targets, and generated legacy-fleet scale.
- Does not modify tactical statistics of individual ships.
- Uses ruleset-defined multipliers.
- Every multiplier must be present in the active ruleset.

Research-Speed Setting:

- Modifies research progress rates.
- Does not change prerequisites or technology effects.
- Uses fixed-point ruleset multipliers.

Technology Variation:

- None:
  - Uses canonical availability dates and effectiveness.
- Some:
  - May shift eligible technology dates by a ruleset-bounded small amount.
  - May apply bounded effectiveness variation to eligible technologies.
- Considerable:
  - May shift dates by up to six years where permitted.
  - May apply wider bounded effectiveness variation.
- Technology variation is materialized during campaign compilation.
- Variation does not consume runtime research RNG.
- The resulting technology manifest is immutable for the campaign.

Historical Continuity Modes:

- historical:
  - Uses canonical political and territorial continuity.
  - Historically unavailable playable slots remain inactive.
- alternate_continuity_v1:
  - Activates supported alternate continuities.
  - Uses explicit scenario definitions rather than procedural substitutions.
- No AI-only nation may silently replace a canonical playable slot.

 4. CANONICAL PLAYABLE SLOTS


Playable Slots:

1. United Kingdom
2. German Empire
3. United States
4. Empire of Japan
5. French Republic
6. Kingdom of Italy
7. Russian Empire
8. Austro-Hungarian Empire
9. Kingdom of Spain
10. Qing Dynasty

Slot Rules:

- The ten slot identities are permanent campaign-selection identities.
- Political regimes and represented state forms are scenario-specific.
- A playable slot is distinct from the scenario's historical polity instance.
- Slot identity must never be overwritten by an AI-only power.
- Each scenario must define all ten slots as:
  - active;
  - inactive;
  - or conditional on a named continuity mode.

Austro-Hungarian Slot:

- Active in 1880 and 1900 historical scenarios.
- Inactive in 1920 and 1935 historical scenarios.
- May be activated in 1920 and 1935 only by alternate_continuity_v1.
- Ottoman Empire or Turkey remains a distinct AI-only power.
- Ottoman Empire or Turkey never substitutes for this slot.

Qing Slot:

- Uses an explicit scenario polity mapping.
- Later starts may represent an approved successor continuity.
- The successor mapping must be defined by scenario content.
- It may not be inferred at runtime.

Scenario Participation:

- Every scenario contains:
  - ten canonical playable slot records;
  - twelve AI-only powers;
  - twenty-two scenario identity records.
- Inactive playable slots remain present as explicit inactive records.
- Only active or continuity-enabled slots may start a campaign.

Nation Identity Layers:

- country_identity:
  - Long-term cultural and geopolitical identity.
- political_regime:
  - Government, ideology, legal structure, and era-specific policies.
- scenario_nation_instance:
  - Concrete nation state in a specific scenario.
- playable_slot:
  - Stable player-selection identity.
- war_participant:
  - Membership in a specific war and side.

 5. CANONICAL CONTENT AND RULESETS


Content Pack:

- The initial release uses one canonical content pack.
- The content pack contains:
  - nations;
  - regimes;
  - scenario participation;
  - world areas;
  - adjacency;
  - possessions;
  - ports;
  - canals;
  - climate profiles;
  - technologies;
  - ship components;
  - aircraft;
  - missiles;
  - submarines;
  - coastal defenses;
  - events;
  - AI profiles;
  - historical fleets;
  - generation templates;
  - balance constants.

Ruleset:

- Contains formulas, thresholds, modifiers, weights, and rounding rules.
- Every ruleset has:
  - stable identifier;
  - semantic version;
  - content hash;
  - formula version;
  - RNG algorithm version;
  - AI-policy version.

Missing Content Policy:

- Campaign compilation fails if required canonical input is missing.
- The compiler must not silently invent:
  - nations;
  - possessions;
  - technologies;
  - starting ownership;
  - diplomatic participants;
  - required fleet designs;
  - scenario-specific continuity.
- Procedural generation is permitted only where the content contract explicitly
  marks generation as authoritative.

Provenance Labels:

- CANONICAL_CONTENT
- MANUAL_EXPLICIT
- DESIGN_DECISION
- GENERATED_CANONICAL
- SCENARIO_OVERRIDE
- RULESET_CONSTANT
- DEPRECATED

Localized text is presentation-only.
Simulation logic uses stable identifiers, never localized strings.

 6. AUTHORITATIVE STATE MODEL


Campaign Aggregate:

- Owns:
  - campaign identity;
  - campaign configuration;
  - current strategic date;
  - current phase cursor;
  - ruleset references;
  - content-pack references;
  - RNG manifest;
  - terminal state;
  - references to subordinate aggregates.
- Does not directly mutate every subordinate entity.

Primary Aggregates:

- CampaignState
- WorldState
- NationState
- FleetState
- ResearchState
- PoliticalState
- IntelligenceState
- WarState
- TacticalBattleState
- PersistenceManifest

Authority Categories:

- canonical:
  - Persisted authoritative state.
- derived:
  - Recomputed from canonical state.
- cached_projection:
  - Optional persisted cache validated against derivation.
- ledger:
  - Append-only historical record.
- ephemeral:
  - Runtime-only state reconstructed or discarded at stable boundaries.

Derived Values Include:

- Blockade strength.
- Foreign-station fulfillment.
- Battle eligibility.
- Effective crew quality.
- Ship classification cache.
- Shipyard usage.
- Area base overload.
- Treaty compliance.
- Operational naval strength.
- Effective AA strength.
- Invasion eligibility.
- Maintenance warnings.

Stable State Invariants:

- A ship belongs to exactly one nation.
- A ship has exactly one current compiled design version.
- A commissioned ship occupies exactly one strategic location.
- A ship cannot be both under construction and commissioned.
- A ship cannot participate in two unresolved battles.
- A possession has one legal owner and at most one military controller.
- A construction project remains between zero and total work.
- A completed project reserves no construction capacity.
- A ship belongs to at most one permanent division.
- A sunk ship accepts no operational orders.
- Two nations cannot be allied and at war in the same relation context.
- Technology prerequisites must be satisfied before discovery.
- Tactical persistent units must map to campaign assets or declared temporary
  generated assets.
- Every financial posting balances against a source and category.
- Every random outcome records a stable random-stream key.

 7. NUMERIC AND TEMPORAL CONTRACT


Authoritative Arithmetic:

- Uses integer or fixed-point arithmetic.
- Floating-point arithmetic is prohibited for authoritative outcomes.
- Rendering may use floating point but cannot alter simulation state.

Units:

- Strategic time: integer campaign months.
- Tactical time: integer battle minutes with optional fixed internal substeps.
- Ship mass: integer ruleset mass units.
- Distance: fixed-point nautical miles.
- Tactical position: fixed-point world coordinates.
- Speed: fixed-point knots.
- Armor: fixed-point inches or canonical integer armor units.
- Currency: integer budget units.
- Probability: integer basis points or equivalent fixed scale.
- Angles: normalized fixed-point angular units.
- Research: integer progress units.
- Project work: integer work units.

Rounding:

- Every formula declares its rounding mode.
- Financial debits round against the payer unless explicitly stated.
- Construction completion never occurs before accumulated work reaches total work.
- Classification and treaty checks use unrounded canonical values.
- UI values may be rounded for display but must expose detailed breakdowns.

 8. DETERMINISM AND RANDOMNESS


Determinism Requirement:

- Identical content, ruleset, initial snapshot, commands, and seeds must produce
  identical authoritative hashes.
- Determinism must hold across supported operating systems.

Random Streams:

- A single global consumptive RNG stream is prohibited.
- Random outcomes use named hierarchical streams.

Required Stream Families:

- setup/world
- setup/nation
- setup/fleet
- diplomacy/month/pair
- politics/month/nation
- economy/month/nation
- research/month/nation/field
- construction/month/project
- officer/month/nation
- event/month/scope
- movement/month/area
- battle_generation/month/war/area
- tactical/battle
- submarine/month/war/area
- mine/month/war/area
- air_operations/battle
- damage/battle/ship
- peace/war/negotiation

Random Decision Record:

- Stream identifier.
- Stable entity key.
- Evaluation phase.
- Ruleset version.
- Input-state hash.
- Deterministic draw or derived value.
- Outcome.
- Reason code.

Save/Reload Rule:

- Reloading and repeating identical commands reproduces identical outcomes.
- UI navigation, reporting detail, and visual effects do not consume
  authoritative randomness.
- AI decisions are deterministic and included in replay verification.

 9. CAMPAIGN COMPILATION


Compiler Inputs:

- Canonical content pack.
- Ruleset.
- Scenario.
- Player slot.
- Continuity mode.
- Campaign settings.
- Structural seed.
- Campaign seed.

Compiler Pipeline:

1. Load and hash content.
2. Validate scenario participation.
3. Materialize scenario nation instances.
4. Materialize regimes and traits.
5. Materialize world ownership and infrastructure.
6. Materialize diplomacy and treaty state.
7. Materialize technologies and technology variation.
8. Materialize economies and budgets.
9. Materialize historical or generated fleets.
10. Materialize ongoing construction and rebuilds.
11. Materialize officers, crews, divisions, and deployment.
12. Materialize aircraft, submarines, and inventories.
13. Materialize political state and objectives.
14. Validate all aggregates.
15. Repair only explicitly repairable generated data.
16. Reject irreparable or incomplete input.
17. Canonicalize ordering and identifiers.
18. Produce initial snapshot.
19. Execute preflight checks.
20. Compute reproducibility hashes.
21. Persist the first stable campaign save.

Legacy Fleet Modes:

- 1880:
  - Automatic canonical generation.
- 1900:
  - Automatic generation or manual legacy construction.
- 1920:
  - Automatic canonical generation.
- 1935:
  - Automatic canonical generation.

Legacy Fleet Generation Requirements:

- Fleet must satisfy:
  - budget sustainability;
  - minimum operational capability;
  - foreign-station obligations;
  - treaty legality;
  - dock and infrastructure limits;
  - scenario technology;
  - national force doctrine;
  - maintenance affordability;
  - playable first-turn liquidity.
- Generated fleets include:
  - age cohorts;
  - design families;
  - individual ships;
  - historical refits;
  - readiness;
  - divisions;
  - officers;
  - deployment;
  - active projects.

Manual 1900 Legacy Construction:

- Starting allocation is divided between:
  - completed commissioned ships;
  - ships already under construction.
- Under-construction ships begin at the ruleset-defined legacy progress,
  nominally around 50%.
- The setup charge for completed historical work uses the explicit legacy
  subsidy rule, nominally 5% of the value of completed work.
- Subsidized historical work does not become future debt.
- Remaining unfinished work is paid normally.
- The compiler records:
  - full ship value;
  - historical work value;
  - setup charge;
  - subsidy;
  - remaining liability.

 10. STRATEGIC MONTHLY TURN PIPELINE


Stable Snapshots:

- MonthOpeningSnapshot
- CommandLockSnapshot
- PostMovementSnapshot
- BattleEligibilitySnapshot
- PostBattleSnapshot
- BlockadeSnapshot
- MonthClosingSnapshot

Authoritative Phase Order:

0.  Validate Previous Snapshot

- Verify hashes, invariants, and phase cursor.

1.  Open Month

- Advance scheduled calendar effects.
- Update elapsed war, service, project, and training months.

2.  Apply Scheduled Global Events

- Canal completion or disruption.
- Scenario events.
- Treaty expiration.
- Government transitions already scheduled.

3.  Apply Scheduled National Events

- Political mandates.
- Economic changes.
- Officer and institutional events.

4.  Present Mandatory Player Decisions

- Event choices.
- Peace offers.
- Treaty negotiations.
- Insolvency interventions.
- Required political responses.

5.  Generate AI Strategic Plans

- AI observes only information legally available at MonthOpeningSnapshot.

6.  Collect Player Commands

- Player issues budget, design, construction, movement, policy, and other orders.

7.  Validate and Reserve Commands

- Validate legality.
- Reserve treasury and capacity.
- Produce accepted or rejected command records.

8.  Lock All Commands

- Player and AI commands become immutable for the month.
- Produce CommandLockSnapshot.

9.  Resolve Diplomacy

- Alliances.
- Incidents.
- War declarations.
- War entry.
- Access rights.
- Canal permissions.

10. Resolve Political and Budget Changes

- Appropriation changes.
- Mandates.
- Confidence and unrest effects that apply before spending.

11. Post Monthly Revenue

- Naval appropriation.
- Possession income.
- Reparations.
- Scheduled grants.

12. Pay Mandatory Obligations

- Maintenance.
- Existing project commitments.
- Contractual payments.
- Required personnel and support costs.

13. Resolve Insolvency Allocation

- Apply payment priority.
- Pause or reduce non-mandatory spending.
- Record arrears where permitted.
- Apply morale and confidence effects.

14. Resolve Projects

- Design studies.
- Construction.
- Rebuilds and repairs.
- Infrastructure.
- Aircraft development.
- Radar and equipment production.

15. Resolve Research

- Apply paid research allocation.
- Progress fields.
- Discover technologies.
- Schedule installations or adoption requirements.

16. Resolve Personnel and Readiness

- Working up.
- Mobilization.
- Training.
- Officer assignments.
- Promotions.
- Crew recovery.
- Squadron re-equipment.

17. Resolve Strategic Movement

- Validate routes against current diplomacy.
- Resolve one monthly movement edge or ruleset-defined movement allowance.
- Resolve fuel, breakdown, and interdiction conditions.
- Produce PostMovementSnapshot.

18. Resolve Pre-Battle Operational Effects

- Mine preparation.
- Reconnaissance.
- Intelligence updates.
- Surprise conditions.
- Air and submarine availability.

19. Generate Tactical Engagements

- Determine eligible battles.
- Select forces through constraints.
- Produce BattleEligibilitySnapshot.

20. Resolve Battles

- Player may fight or auto-resolve.
- Apply tactical results immediately to participating assets.
- A ship cannot enter a second battle unless explicitly allowed by the ruleset.

21. Apply Battle Consequences

- Damage.
- Losses.
- Crew and officer outcomes.
- War contribution.
- Political effects.
- Reports.

22. Resolve Amphibious Operations

- Launch prepared invasions.
- Resolve invasion battle or abstraction.
- Establish occupation where successful.

23. Resolve Blockade

- Use PostBattleSnapshot.
- Establish, maintain, weaken, or break blockades.
- Produce BlockadeSnapshot.

24. Resolve Trade Warfare

- Trade protection.
- Raiders.
- Submarine warfare.
- Merchant losses.
- Operational mines.
- Neutral incidents.

25. Resolve Supply and Fuel

- Local base support.
- Wartime oil shortages.
- Remote deployment penalties.
- Merchant-import consequences.

26. Resolve Political End-of-Month Effects

- Unrest.
- War exhaustion.
- Strikes.
- Colonial unrest.
- Revolution checks.
- Institutional confidence.

27. Resolve Peace Negotiations

- Evaluate war state.
- Draft and validate settlement terms.
- Apply accepted settlements atomically.

28. Resolve Compliance

- Treaty compliance.
- Foreign-station obligations.
- Political mandates.
- Construction restrictions.

29. End-of-Month AI Administration

- Fill eligible command vacancies.
- Update plans.
- Generate non-authoritative recommendations.

30. Evaluate Terminal Conditions

- Dismissal.
- Unsupported national collapse.
- Scenario termination.
- End date.

31. Generate Reports

- Financial.
- Construction.
- Research.
- Intelligence.
- Operations.
- Political.
- War.
- Compliance.

32. Canonicalize State

- Normalize ordering.
- Rebuild required projections.
- Validate invariants.

33. Compute Hashes

- Aggregate hashes.
- Snapshot hash.
- Command/event ledger hash.
- RNG manifest hash.

34. Persist Autosave

- Save atomically at MonthClosingSnapshot.

35. Close Month

- MonthClosingSnapshot becomes next MonthOpeningSnapshot.

 11. COMMAND MODEL


Command Lifecycle:

- submitted
- validated
- authorized
- reserved
- accepted
- locked
- resolving
- completed
- partially_completed
- rejected
- cancelled
- superseded

Command Requirements:

- Stable command identifier.
- Issuing participant.
- Target aggregate.
- Submission phase.
- Preconditions.
- Reserved resources.
- Resolution phase.
- Result.
- Machine-readable reason code.

Command Rules:

- AI uses the same command contracts as the player where practical.
- Commands never mutate authoritative state directly.
- Commands that become impossible during resolution produce explicit outcomes.
- Cancellation is allowed only before the command's lock or irreversible phase.
- Refunds and lost costs are defined by command type.
- Automated actions also produce commands and audit records.

Examples of Reason Codes:

- INSUFFICIENT_FUNDS
- INSUFFICIENT_CAPACITY
- TECHNOLOGY_UNAVAILABLE
- TREATY_PROHIBITED
- INVALID_ROUTE
- CANAL_ACCESS_DENIED
- SHIP_NOT_OPERATIONAL
- TARGET_NO_LONGER_VALID
- PROJECT_ALREADY_COMPLETED
- DIVISION_LOCATION_CONFLICT
- POLITICAL_AUTHORIZATION_DENIED

 12. NATIONS AND GOVERNMENTS


Nation State:

- Identity and scenario polity.
- Government.
- Traits.
- Strategic objectives.
- Base resources.
- Naval appropriation rate.
- Treasury.
- Industrial capabilities.
- Possessions.
- Oil and supply access.
- Technologies.
- Fleet.
- Officers and manpower.
- Diplomacy.
- Wars.
- Political state.
- Intelligence state.

Government Types:

- Liberal democracy.
- Limited democracy.
- Autocratic.
- Fascist.
- Communist.
- Eastern.

Government Effects:

- Political tolerance.
- Treaty-compliance rules.
- Revolution susceptibility.
- Alliance compatibility.
- Budget behavior.
- Political mandates.
- Colonial policy.
- Officer policy.
- Wartime mobilization.

Trait Categories:

- industrial_capability
- strategic_obligation
- education_and_personnel
- research_affinity
- political_behavior
- AI_personality
- tactical_doctrine
- ship_quality
- conditional_wartime_policy

Canonical Trait Mechanics:

- Efficient shipbuilding:
  - Construction work completes 10% faster unless the ruleset defines an
    equivalent fixed work-rate implementation.
- Undeveloped shipbuilding:
  - Construction completes 10% slower.
  - Increased probability of latent construction defects.
- Global naval power:
  - Foreign-station obligation includes at least 10% of eligible tonnage.
  - Cramped accommodation is prohibited for applicable new construction.
  - Government may react to rival budget parity.
- Cautious:
  - Alters AI operational risk tolerance.
  - Increases political consequences of major defeats for the player nation.
- Poor education:
  - Reduces baseline crew and pilot quality.
  - Reduces research efficiency.
- Surprise attack:
  - Base first-war-entry surprise eligibility is 80%, subject to opportunity,
    date, previous use, intelligence, and ruleset modifiers.
- Inconsistent naval policy:
  - Increases frequency and severity of political procurement mandates.
- Attention to detail:
  - Reduces latent-defect probability and severity.
- Technology leader:
  - Improves research position and AI commitment to technical competitiveness.
  - Does not grant technologies without prerequisites.
- Hidden faults:
  - Increases latent-defect probability.
- Kamikaze:
  - Conditional policy only.
  - Requires compatible government, technology, war state, and losing-war state.
  - Improves designated offensive-air behavior while worsening defensive-air
    priorities according to ruleset modifiers.

Trait Activation:

- Every trait declares:
  - scope;
  - activation conditions;
  - duration;
  - stacking behavior;
  - applicable scenarios;
  - whether it belongs to nation, regime, or temporary state.

 13. ECONOMY AND ACCOUNTING


Economic State:

- Base resources.
- Naval appropriation rate.
- Monthly appropriation.
- Treasury.
- Committed obligations.
- Arrears.
- Possession income.
- Wartime modifiers.
- Economic growth.
- Financial ledger.

Base Resource Growth:

- Canonical annual growth normally falls within approximately 3–5%.
- Actual growth uses scenario, government, war, event, and ruleset modifiers.
- Growth is applied at an explicit annual phase.
- War and peace settlements may permanently change base resources.

Financial Ledger:

- Opening treasury.
- Recurring naval appropriation.
- Possession income.
- Event income.
- Reparations.
- Construction expenditure.
- Rebuild and repair expenditure.
- Maintenance.
- Research.
- Intelligence.
- Training.
- Infrastructure.
- Aircraft and missile procurement.
- Treaty or scrapping losses.
- Closing treasury.

Payment Priority:

1. Legally mandatory obligations.
2. Minimum active-fleet maintenance.
3. Critical repairs and safety expenses.
4. Existing construction commitments.
5. Required foreign contracts.
6. Research and intelligence minimums.
7. Training.
8. New discretionary projects.

Insolvency:

- Treasury may not silently become negative.
- Payments are reduced or deferred according to priority.
- Unpaid eligible commitments become explicit arrears.
- Construction receives progress only for paid work.
- Insolvency can reduce:
  - institutional confidence;
  - fleet morale;
  - project progress;
  - readiness.
- Persistent insolvency triggers political intervention.

Surplus:

- Treasury carries over.
- Excessive surplus may trigger a political reclamation event.
- Confiscation is an explicit event or ruleset rule, never an invisible mutation.

Research Spending:

- Up to 12% of naval appropriation.
- Spending above 10% receives diminishing marginal effectiveness.
- Actual research progress is based on paid, not merely allocated, expenditure.

Construction:

- Paid through completed work units.
- Halted projects perform no construction work.
- Halted projects incur half the mothballed maintenance equivalent or the
  ruleset's canonical preservation cost.
- Accelerated projects:
  - cost 5% more total work-equivalent value;
  - receive a work-rate increase calibrated to approximately 10% faster
    completion;
  - can increase delay pressure on other construction.

Wartime Costs:

- Active maintenance increases.
- Mobilized personnel, fuel, ammunition, repairs, and operations add costs.
- Exact multipliers are ruleset constants and must be explainable in reports.

 14. WORLD GEOGRAPHY


World Entities:

- Area.
- Sea zone.
- Possession.
- Port.
- Home area.
- Build area.
- Canal.
- Choke point.
- Route edge.
- Climate profile.

Area State:

- Stable identifier.
- Adjacency.
- Climate.
- Strategic position.
- Associated possessions.
- Eligible battle templates.
- Mine pressure by belligerent.
- Operational reports.

Movement:

- A normal strategic movement traverses one eligible area edge per month unless
  a special rule grants additional movement.
- Long routes are stored as planned paths.
- Each monthly resolution advances the force to the next legal node.
- Operational battle presence is derived from resolved movement.
- A ship is never stored in two areas simultaneously.

Canals:

- Suez is operational at applicable scenario starts unless scenario content
  overrides condition.
- Panama is scheduled to become operational in 1914, subject to scenario event
  and condition rules.
- Canal state includes:
  - legal owner;
  - military controller;
  - operating condition;
  - access policy;
  - mined or blocked state.
- Transit is denied when:
  - the traveler is at war with the controlling authority;
  - bilateral tension with the controller is 7 or higher;
  - the canal is physically closed;
  - another explicit access restriction applies.
- Ships already in transit use the ruleset's locked-route resolution.

Choke Points:

- The Baltic–Northern Europe route may be restricted against Germany's enemies
  after active mine-warfare capability exists and applicable wartime conditions
  are met.
- Choke-point restrictions are explicit route predicates.

 15. POSSESSIONS AND TERRITORIAL CONTROL


Possession State:

- Legal owner.
- Military controller.
- Occupier.
- Area.
- Geographic coordinates.
- Port coordinates.
- Economic value.
- Peace-settlement value.
- Base infrastructure.
- Air infrastructure.
- Coastal defenses.
- Oil resources.
- Local unrest.
- Claims.

Ownership and Control:

- Invasion normally changes military control.
- Legal ownership changes through peace, event, or explicit annexation rule.
- Income, access, and foreign-station obligation declare whether they use legal
  ownership, control, or both.

Possession Effects:

- Income.
- Strategic basing.
- Foreign-station obligation.
- Oil access.
- Invasion target.
- Diplomatic friction.
- Peace claim value.

Colonial Income:

- Declines over time according to a ruleset-defined decolonization curve.
- Government, local development, unrest, and events may alter the decline.

Oil:

- Before 1920:
  - Oil access is required to construct oil-fueled ships.
  - Captured or foreign-built oil ships may be operated only if supply is
    available.
- From 1920:
  - International oil access is normally assumed in peacetime.
  - Nations without domestic or controlled oil are more vulnerable to wartime
    shortage and blockade.
- Oil discoveries before 1920 are seeded, explicit events.
- Oil access, stockpile risk, and local supply are separate concepts.

Decolonization:

- Liberal democracies receive increasing political pressure to grant autonomy
  or independence.
- Independence is an explicit political process.
- Local unrest and occupation can accelerate it.

 16. BASES AND INFRASTRUCTURE


Infrastructure Types:

- Port capacity.
- Supply capacity.
- Repair capacity.
- Dock size.
- Shipyard construction capacity.
- Airbase capacity.
- Coastal defenses.
- Mine support.
- Missile batteries.

Dock Size:

- Limits the largest ship that can be built domestically.
- May limit major repair or rebuild eligibility.
- Expansion takes approximately one year unless modified.
- Each expansion increases capacity by an era-defined 1,000–2,000 ton step.
- Private industrial development may create explicit seeded expansion events.

Shipyard Capacity:

- Limits total active construction work.
- Submarine construction counts.
- Rebuild and repair use separate repair/refit capacity where defined.
- AMCs and designated small corvettes may be exempt according to ruleset.
- Reserved, occupied, damaged, and available capacity are tracked separately.

Area Support:

- Ships consume port and supply load based on type, size, status, and condition.
- Overload allocation follows deterministic supply priority.
- Unsupported ships suffer maintenance and crew penalties.
- Temporary presence is allowed through the battle phase.
- Compliance and penalties are evaluated at MonthClosingSnapshot.

Airbases:

- Base capacity begins at 20 aircraft where established.
- Expansion occurs in increments of 20.
- Technology and possession infrastructure limit maximum expansion.

Foreign Construction:

- Uses a formal contract.
- Limited by builder capability and capacity.
- May transfer technology insight.
- May be delayed or impounded by war.
- A delivery-guarantee treaty prevents discretionary impoundment but not physical
  impossibility caused by occupation or destruction.

 17. DIPLOMACY


Diplomatic Relation:

- Directed attitude from A to B.
- Shared bilateral tension.
- Alliance state.
- War state.
- Guarantees.
- Access rights.
- Technology-trade eligibility.
- Claims and incidents.
- Cooldowns.
- Treaty relationships.

Tension:

- Exists between every pair of active powers.
- Uses the canonical ruleset scale.
- Tension 7 or higher blocks normal canal use controlled by the other nation.
- Higher tension increases war risk.
- Tension changes are recorded in a ledger with causes.

Alliances:

- Reduce mutual tension.
- Increase expected support in war.
- Improve technology-sale availability and pricing.
- Permit allied operational support where access exists.
- May increase tension with rivals.
- May be revoked in peace if relation conditions fail.
- Are not revoked while both allies remain in the same active war.
- An ally may seek separate peace through war-participant rules.

Diplomatic Events:

- Hawkish responses may increase:
  - institutional confidence;
  - naval budget;
  - tension.
- Dovish responses may reduce tension but can reduce confidence or budget.
- Effects are explicit per event and never inferred from descriptive text.

War Entry:

- Determined by:
  - tension;
  - incidents;
  - alliances;
  - government;
  - strategic objectives;
  - events;
  - surprise opportunities.
- War is never triggered from tension alone unless the ruleset explicitly defines
  a threshold event.

 18. POLITICS, CONFIDENCE, AND UNREST


Political State:

- Institutional confidence.
- Political capital.
- Domestic unrest.
- War exhaustion.
- Colonial unrest by possession.
- Government confidence.
- Active mandates.
- Revolution risk.

Institutional Confidence:

- Replaces overloaded prestige as the dismissal variable.
- Represents trust in naval administration.
- A value at or below 16 creates dismissal risk.
- Dismissal checks occur only during the terminal-evaluation phase.
- Confidence changes through:
  - victories;
  - defeats;
  - fiscal management;
  - mandate compliance;
  - foreign-station compliance;
  - preparedness;
  - event choices.
- Proportional losses use explicit ruleset formulas.

Political Capital:

- Spendable resource used to influence or resist political decisions.
- Spending political capital does not directly reduce institutional confidence.
- May be used to:
  - reject a mandate;
  - negotiate requirements;
  - protect a project;
  - accelerate approval;
  - reduce political penalties.

Domestic Unrest:

- Influenced by:
  - military expenditure;
  - war duration;
  - blockade;
  - shortages;
  - defeats;
  - accommodation conditions;
  - taxation and events.
- Can cause strikes and political budget pressure.

War Exhaustion:

- Separate from general unrest.
- Initially may fall or stabilize at war outbreak.
- Increases with duration, defeat, blockade, casualties, and shortages.

Colonial Unrest:

- Possession-scoped.
- Influenced by low protection, foreign occupation, unrest events, and
  decolonization pressure.

Revolution:

- Requires explicit eligibility and threshold conditions.
- Less likely in liberal democracies.
- May:
  - change government;
  - end or alter war participation;
  - impose harsh peace terms;
  - create successor states.
- Revolution is not automatically terminal if a supported continuation exists.

Political Mandates:

- Issuing authority.
- Requirement.
- Deadline.
- Compliance test.
- Reward.
- Refusal cost.
- Negotiation options.
- Expiration.

 19. STRATEGIC OBJECTIVES


Objective Types:

- Maintain fleet parity.
- Protect possessions.
- Defend trade.
- Expand regional influence.
- Secure oil access.
- Avoid war with a named power.
- Contain a rival.
- Modernize a force category.
- Meet treaty obligations.
- Recover or retain territory.

Objective State:

- Owner.
- Target.
- Priority.
- Start date.
- Deadline.
- Success condition.
- Failure condition.
- Visibility.
- Political reward or penalty.

Player Relationship:

- Government assigns national objectives.
- Player may influence priorities through political capital and event choices.
- Objectives guide AI plans and final career evaluation.

 20. RESEARCH AND TECHNOLOGY


Technology Definition:

- Stable identifier.
- Research field.
- Prerequisites.
- Historical availability.
- Variation eligibility.
- Research cost.
- Effects.
- Adoption type.
- AI value.
- Scenario restrictions.

Research State:

- Paid monthly spending.
- Field priorities.
- Progress per field.
- Discovered technologies.
- Adoption projects.
- Intelligence-derived insights.

Priorities:

- High.
- Medium.
- Low.
- Priorities are relative weights.
- The player cannot select the exact next technology.

Research Resolution:

1. Calculate paid research resources.
2. Apply national and education modifiers.
3. Allocate by field priority.
4. Reallocate exhausted-field progress.
5. Advance eligible technologies.
6. Resolve deterministic discovery selection.
7. Apply discovery.
8. Create adoption, production, or refit requirements.

Technology Applicability:

- immediate_knowledge
- doctrine_requires_training
- equipment_requires_production
- minor_installation
- major_refit
- new_construction_only
- new_ammunition_production

Technology Fields Include:

- Hull construction.
- Machinery.
- Ship design.
- Gunnery.
- Fire control.
- Torpedoes.
- Submarines.
- Mines and ASW.
- Aviation.
- Carrier operations.
- Radar and electronics.
- Missiles.
- Amphibious operations.
- Infrastructure.
- Damage control.

Technology Variation:

- Materialized once during campaign compilation.
- Prerequisite structure remains valid.
- A varied technology cannot precede mandatory prerequisites.

 21. SHIP DESIGN


Design Layers:

- DesignDraft:
  - Mutable player or AI work.
- DesignStudy:
  - Time-and-cost project.
- CompiledDesignVersion:
  - Immutable validated mechanical design.
- DesignFamily:
  - Related design lineage.
- NamedClass:
  - Naming and historical grouping.
- IndividualShip:
  - Commissioned physical asset.
- RefitConfiguration:
  - Ship-specific active modification state.

Design Attributes:

- Displacement.
- Speed.
- Range.
- Fuel.
- Machinery.
- Armor.
- Armament.
- Torpedoes.
- Missiles.
- Fire control.
- Radar.
- Aviation facilities.
- Topside load.
- Accommodation.
- Special features.
- Layout and firing positions.

Design Compilation:

1. Normalize units.
2. Validate technology.
3. Compute hull capacity.
4. Compute machinery and speed.
5. Compute fuel and range.
6. Compute armor weight and protection.
7. Compute weapons and ammunition.
8. Compute aviation capacity.
9. Compute electronics and topside load.
10. Compute crew and support requirements.
11. Compute displacement and margins.
12. Compute stability and flotation.
13. Validate intended classification.
14. Apply treaty rules.
15. Apply dock and construction restrictions.
16. Compute cost.
17. Compute construction work.
18. Produce immutable compiled design.

Derived Design:

- A design based on an existing family receives study discounts while all
  ruleset similarity thresholds remain satisfied.
- Similarity is lost when changes exceed limits including:
  - displacement increase greater than max(10%, 1,000 tons);
  - major main-gun change beyond ruleset allowance;
  - major secondary-gun change;
  - speed change over one knot;
  - vertical armor change over one inch;
  - horizontal armor change over half an inch.

Overweight Designs:

- Slight overweight may be accepted with explicit stability and flotation
  penalties.
- Designs beyond the legal tolerance are rejected.

Aesthetic Data:

- Superstructure drawings, visual decoration, and cosmetic arrangement are
  presentation-only unless mapped to a mechanical component.

 22. SHIP CLASSIFICATION


Classification Policy:

- The designer declares an intended ship type.
- A deterministic validator checks type-specific requirements.
- A natural classifier independently identifies the best matching type.
- Illegal mismatch is rejected or explicitly warned according to ruleset.
- Classification precedence is explicit and versioned.
- Boundary values declare inclusive or exclusive behavior.

Supported Types:

- DD
- CL
- B
- CA
- BC
- BB
- KE
- AMC
- CV
- CVL
- AV
- SS
- TR
- MTB
- Additional ruleset-defined types

Core Classification Baselines:

- DD:
  - Initially below 2,000 tons.
  - Speed above 19 knots.
  - Requires torpedoes.
  - Cannot carry qualifying armor.
  - Maximum displacement rises by technology to approximately 3,800 tons.
- CL:
  - Initially above 2,000 and below 8,000 tons.
  - Speed above 16 knots.
  - Main guns normally no larger than 6 inches.
  - Protected-cruiser and missile-era exceptions require explicit technology.
- B:
  - At least 5,000 tons.
  - Belt at least 6 inches.
  - Main guns over 6 inches.
  - Speed below 20 knots.
  - No more than two main turrets.
- CA:
  - Above 4,000 tons.
  - Speed above 19 knots.
  - Belt above 2 and no more than 12 inches.
  - Main guns from 6 through 11 inches under canonical boundary rules.
- BC:
  - Main guns over 10 inches and qualifying high speed;
  - or three main turrets and qualifying speed.
  - Speed threshold rises by era.
  - Borderline ships use explicit armor and speed precedence rules.
- BB:
  - At least three main turrets.
  - Above 8,000 tons.
  - Belt over 6 inches.
  - Main guns over 10 inches.
- KE:
  - Below 2,500 tons.
  - Belt no more than 2 inches.
  - Maximum gun caliber 6 inches.
  - No torpedoes.
- AMC:
  - Above 1,700 tons.
  - No armor.
  - Guns no larger than 6 inches.
  - Number and fast-AMC limits apply.
- CV:
  - Aircraft capacity above 34.
  - Displacement limited by carrier technology.
- CVL:
  - Aircraft capacity from 4 through 34.
  - Normally no more than 16,000 tons unless a valid conversion.
- AV:
  - Defined by aircraft-support subtype and era.

Reclassification:

- Rebuilds invoke classification again.
- Era changes alone may trigger administrative reclassification where the
  ruleset explicitly requires it.
- Classification cache must always match the current compiled design version.

 23. CONSTRUCTION, REPAIR, AND REBUILD


Unified Dockyard Project:

- design_study
- new_construction
- repair
- rebuild
- conversion
- infrastructure
- equipment_installation

Project State:

- planned
- authorized
- awaiting_capacity
- active
- halted
- delayed
- accelerated
- completed
- cancelled
- impounded

Project Accounting:

- Total work.
- Completed work.
- Paid work.
- Remaining work.
- Unit cost.
- Monthly capacity.
- Capacity reservation.
- Builder.
- Acceleration state.
- Delay state.

Construction Rules:

- Starts only after design approval.
- Up to twelve ships of one class may be ordered together.
- Additional ships of an approved design need no new study unless the design is
  modified.
- Progress equals paid effective work.
- Delayed projects receive no work and no work charge that month.
- Accelerated work costs 5% more and increases progress rate.
- Excess acceleration can impose seeded capacity-pressure delays.

Latent Defects:

- Determined from:
  - builder quality;
  - national traits;
  - design complexity;
  - acceleration;
  - foreign-yard context.
- Created at construction progression or completion through a stable stream.
- Stored as hidden authoritative state.
- May be discovered during trials, service, repair, or combat.
- Repairability is defect-specific.

Repairs and Rebuilds:

- Use one combined dockyard project where simultaneous.
- Repair work, machinery work, armor work, armament work, electronics, and
  conversion are separate work packages.
- Ships under major rebuild are unavailable.
- Rebuild validation differs from new-construction validation.
- Rebuild produces a new compiled design version.
- Individual ships of the same named class may have different design versions.

Scrapping:

- Cancels operational status.
- May produce salvage credit.
- Removes future maintenance.
- Treaty-required scrapping follows treaty deadlines and inspection rules.

 24. FLEET MANAGEMENT


Ship State Dimensions:

Readiness State:

- active
- reserve
- mothballed
- mobilizing
- working_up
- unavailable

Operational Mission:

- fleet
- foreign_station
- trade_protection
- raider
- training
- transit
- mine_warfare
- amphibious_support

Dockyard State:

- none
- maintenance
- repair
- rebuild
- conversion

Damage State:

- operational
- degraded
- mission_killed
- dead_in_water
- abandoned
- sinking
- stabilized
- foundered
- scuttled
- sunk
- captured

Readiness Effects:

- Active:
  - Highest routine availability and training.
- Reserve:
  - Lower cost and reduced immediate effectiveness.
- Mothballed:
  - Lowest cost, poor readiness, extended reactivation.
- Working up:
  - Gains crew proficiency.
  - Cannot participate in normal battle generation.
- Repair or rebuild:
  - Availability determined by project state.

Fleet Exercise:

- Normally once per calendar year.
- Participating ships pay twice active maintenance.
- Improves crew and division experience.
- Large exercises may increase tension.
- Exercise availability and political effect are ruleset-driven.

Maintenance Warning:

- Derived from support, location, status, and infrastructure.
- Never stored as independent authority.

 25. DEPLOYMENT AND LOGISTICS


Deployment:

- Each ship has one strategic area.
- Divisions normally move together.
- Illegal mixed-location divisions must be split or movement rejected.

Support Capacity:

- Area support derives from controlled or accessible bases.
- Ships consume support load.
- Overload penalties are assigned by deterministic supply priority.
- Temporary overload is permitted until the end-of-month compliance phase.

Foreign-Station Requirement:

- Calculated per area from possession obligations.
- Global naval powers must maintain at least the required global percentage.
- Only eligible active and foreign-station ships contribute.
- Colonial-service ships contribute 1.5 times qualifying tonnage.
- Cramped and short-range ships contribute less.
- Requirements may be suspended during wartime blockade.
- Newly acquired possessions receive a ruleset-defined grace period.

Range:

- short
- normal
- long
- extreme

Wartime Movement:

- Short-range ships cannot make normal strategic movement outside allowed
  adjacent home-area exceptions.
- Blockaded nations cannot normally move ships out of relevant home/build areas
  except through authorized raider breakout or battle outcomes.
- Fuel shortage may cancel movement or remove battle eligibility.
- Coal ships are not affected by oil shortage.

Movement Resolution:

- Produces:
  - traversed route edge;
  - final location;
  - battle-presence state;
  - fuel result;
  - breakdown result;
  - failure reason.

 26. DIVISIONS AND FORMATIONS


Permanent Division:

- Persistent campaign organization.
- One to five ships.
- Destroyer divisions may contain up to six.
- Ships normally share type.
- BB and B may mix.
- CA may join BC divisions when allowed.
- First ship is flagship.
- Has commander and experience.

Tactical Division:

- Battle-local projection.
- Derived from permanent division where possible.
- May be adjusted for availability, mission, or scenario needs.
- Must preserve provenance to campaign assets.

Roles:

- independent
- core
- support
- scout
- screen
- patrol

Formations:

- line_ahead
- line_abreast
- search_line
- screen

Experience:

- Improves over time and training.
- Falls when:
  - ships change;
  - commander changes;
  - flagship changes;
  - organization changes substantially.
- Influences:
  - signaling;
  - contact retention;
  - fire distribution;
  - formation cohesion;
  - spotting;
  - effective crew performance.

Training:

- Wartime division training improves experience faster.
- A training division is unavailable for battle that month.

Eligibility:

- Role and formation legality use ship-type and technology rules.
- Battleships cannot scout.
- Destroyers scout only if all ships meet the ruleset displacement threshold,
  nominally above 1,500 tons.

 27. OFFICERS AND PERSONNEL


Officer:

- Stable identity.
- Age cohort.
- Service-entry date.
- Rank history.
- Command history.
- True ability.
- Revealed ability estimate.
- Traits.
- Battle experience.
- Status.
- Promotion eligibility.

Ranks:

- Commander.
- Captain.
- Rear Admiral.
- Admiral.

Ability:

- brilliant
- above_average
- average
- below_average
- incompetent

Ability Knowledge:

- True ability is authoritative but initially hidden.
- Player sees an estimate and confidence.
- Service time and battle experience improve revelation.
- Estimates may remain uncertain.

Officer Traits:

- speed_enthusiast
- rof_enthusiast
- gunnery_expert
- torpedo_expert
- disciplinarian
- music_lover
- sportsman
- lucky
- aggressive
- timid
- well_connected
- wily
- poor_admin
- poor_shiphandler
- loose_cannon
- good_administrator
- no_connections

Command Eligibility:

- Commander:
  - CL or DD division.
- Captain:
  - CA, B, BB, BC, CV, CVL, or DD division.
- Rear Admiral:
  - CL or heavier division.
- Destroyers do not require individual ship-command records.

Promotion:

- Normally evaluated after approximately five years in rank.
- Can be automatic or manual.
- Early manual promotion costs political capital or confidence according to rule.
- Promotion may alter traits through explicit seeded outcomes.
- Empty command slots may be filled by deterministic administrative automation.

Removal:

- Costs political capital or institutional confidence.
- Well-connected officers impose greater political cost.

Naval Academy:

- Requires technology and establishment project.
- Produces more and somewhat better officers.
- Has recurring cost.

Personnel Pools:

- Naval manpower.
- Trained manpower.
- Specialists.
- Reservists.
- Pilot pool.
- New construction cannot become fully operational without adequate personnel.

 28. CREW, TRAINING, AND MORALE


Crew Performance Layers:

1. National education and training baseline.
2. Ship crew long-term quality.
3. Readiness modifier.
4. Special-training proficiency.
5. Division cohesion.
6. Officer effect.
7. Battle morale.
8. Fatigue, supply, and damage.

Special Training:

- Maximum two active subjects.
- Requires twelve paid consecutive months to reach full proficiency.
- Proficiency decays or is suspended when funding stops according to ruleset.
- Benefits are conditional on paid training.

Subjects:

- Gunnery:
  - Approximately 10% accuracy improvement.
  - Approximately 30% active-maintenance increase.
- Night fighting:
  - Better night spotting and engagement.
  - Approximately 10% night accuracy improvement.
  - Approximately 20% maintenance increase.
- Torpedo tactics:
  - Improves attack behavior and torpedo effectiveness.
  - Approximately 20% maintenance increase.
- Damage control:
  - Improves firefighting and flooding control.
  - Approximately 20% maintenance increase.

Japan:

- Receives its explicit reduced special-training cost modifier.

Morale:

- Exists at fleet, force, and ship level where required.
- Financial failure, defeat, exhaustion, and command orders modify morale.
- Rally temporarily raises force morale.
- Disengage reduces aggressive behavior and encourages withdrawal.

Aircrew:

- Squadron experience is distinct from pilot-pool quality.
- Re-equipment, expansion, and losses reduce experience.
- Attack missions create more fatigue than CAP and reconnaissance.
- Elite training improves quality but is difficult to sustain in wartime.
- Air-sea rescue improves pilot survival.

 29. INTELLIGENCE AND KNOWLEDGE


Intelligence Program:

- One allocation per observed nation.
- Spending requires time to build capability.
- Interim capability is explicitly displayed.

Knowledge Assertion:

- Subject.
- Attribute.
- Estimated value or range.
- Confidence.
- Source.
- Observed date.
- Received date.
- Decay or expiration.
- Possible deception.

Enemy Construction Knowledge:

- Initially may reveal type and estimated displacement.
- Completed ships may reveal:
  - type;
  - displacement estimate;
  - weapon count and caliber estimate;
  - speed estimate.
- Official figures may be false.
- Additional attributes require intelligence or observation.

Strategic Reports:

- May contain:
  - position error;
  - strength error;
  - identification error;
  - delivery delay.
- Reports never overwrite true state.

Intelligence Effects:

- Research insight.
- Technology acquisition.
- Enemy-ship information.
- War-plan warning.
- Better battle avoidance.
- Improved wartime ASW.
- Detection may create diplomatic incidents and tension.

AI Fog of War:

- AI strategic planning uses its own knowledge assertions.
- AI does not receive player truth unless an explicit difficulty modifier grants
  defined information assistance.

 30. TREATIES


Treaty:

- Parties.
- Effective date.
- Expiration.
- Clauses.
- Inspection rules.
- Compliance ledger.
- Violation state.

Clause Types:

- New-construction displacement limit.
- Main-caliber limit.
- Total tonnage limit.
- Category tonnage limit.
- Carrier conversion limit.
- Replacement age.
- Scrapping requirement.
- Construction holiday.
- Inspection.
- Declared-displacement rule.

Treaty Effects:

- Noncompliant ships under construction at signing are cancelled or scrapped
  according to terms.
- Existing completed ships may remain unless a clause requires disposal.
- Existing ships may be modernized within rebuild restrictions.
- Liberal democracies must comply strictly unless a scenario rule overrides.
- Other governments may declare up to 10% less displacement where cheating is
  permitted.
- Main-caliber cheating is prohibited.

Cheating:

- True and declared displacement are separate.
- Detection depends on intelligence and inspection.
- Discovery can cause:
  - diplomatic crisis;
  - forced scrapping;
  - confidence loss;
  - treaty collapse;
  - tension increase.

Validation:

- Occurs at:
  - design approval;
  - construction order;
  - rebuild approval;
  - treaty signing;
  - monthly compliance;
  - ship completion.

 31. WAR AND PEACE


War:

- Stable identity.
- Belligerent sides.
- Participants.
- Entry and exit dates.
- War goals.
- Side war score.
- National contribution.
- Blockade relationships.
- Peace tracks.
- War duration.
- Exhaustion effects.

Multiple Wars:

- A nation may participate in multiple wars if rules permit.
- War identities do not automatically merge.
- Participant membership records alliance and side context.

War Score:

- Derived from:
  - battle outcomes;
  - objectives;
  - blockade;
  - merchant warfare;
  - occupation;
  - strategic events.
- National contribution is tracked separately from side score.

Peace:

- Large score advantage increases peace eligibility.
- Peace offers are explicit negotiation objects.
- Player choices influence acceptable terms and political consequences.

Settlement:

- May contain:
  - resource adjustment;
  - possession transfer;
  - occupation recognition;
  - ship transfer;
  - reparations;
  - shipbuilding restrictions;
  - treaty obligations.
- Terms are validated and applied atomically.
- Allies receive claims according to contribution, objectives, and negotiated
  priority.
- Unused claim value may become a smaller base-resource gain.

Separate Peace:

- Removes one participant without necessarily ending the war.
- Recalculates sides, access, blockade, and occupation.
- Cannot leave invalid alliance-war states.

Revolutionary Defeat:

- May force harsh terms.
- Uses explicit revolution and peace logic.
- Is not an arbitrary direct mutation.

 32. BLOCKADE


Blockade State:

- none
- attempted
- contested
- established
- weakened
- broken

Strength:

- Derived from eligible naval strength in relevant enemy home/build areas.
- Ship types use ruleset-defined weights.
- Nation modifiers apply:
  - United Kingdom example: 1.2.
  - Russia example: 0.7.
- Damage, supply, readiness, and mission modify effective strength.

Establishment:

- Normally requires at least 110% of defending eligible strength.
- Uses PostBattleSnapshot.
- May require establishment persistence or explicit ruleset duration.

Maintenance:

- Uses hysteresis or a separate maintenance threshold to prevent monthly
  oscillation.
- Contested blockade gives partial effects.

Effects:

- Monthly war score for blockader.
- Increased unrest and shortage risk for blockaded nation.
- Movement restrictions.
- Raider breakout risk.
- Reduced merchant targets for additional submarine or raider warfare.
- Increased oil-shortage pressure.

Special Case:

- Russia may be blockaded from Northern Europe under the canonical route rule.

Multiple Home Areas:

- Blockade is evaluated per blockade theater.
- National blockade effect is derived from theater coverage and economic access.

 33. TRADE, RAIDING, AND MERCHANT SHIPPING


Merchant State:

- Merchant capacity.
- Import requirement.
- Convoy capacity.
- Cumulative losses.
- Replacement rate.
- Trade disruption.
- Food and fuel dependency.

Trade-Protection Requirement:

- Global compliance requirement derived from:
  - economy;
  - fleet size;
  - enemy submarine strength.
- Operational effectiveness remains regional.
- Global compliance prevents political penalties.
- Regional allocation controls losses and interception.

Eligible Missions:

- DD and KE:
  - ASW and convoy escort.
- Cruisers:
  - Raider interception and heavy escort.
- AMC:
  - Trade protection or raiding.

Trade-Protection Effects:

- Crew quality matters.
- Excess coverage improves submarine suppression.
- Insufficient coverage increases merchant losses and confidence penalties.

Raiders:

- Cannot be short range.
- Long range and speed improve effectiveness.
- Can be intercepted.
- Damage may cause scuttling or internment.
- Fuel and machinery reliability affect endurance.
- Raiders have little or no economic effect against an already effectively
  blockaded enemy.

Q-Ships:

- Require technology.
- Permit eligible AMCs to surprise submarines.

 34. SUBMARINES


Strategic Representation:

- Submarines are maintained as typed flotilla pools or persistent units according
  to the active ruleset.
- Tactical submarine instances are allocated from strategic assets.
- Tactical loss reduces the associated strategic pool or unit.
- One asset cannot appear in multiple simultaneous battles.

Types:

- coastal
- medium_range
- long_range
- minelaying
- missile

Submarine Policy:

- fleet_support
- prize_rules
- unrestricted

Policy Effects:

- Fleet support emphasizes warships.
- Prize rules balances warship and merchant attacks with neutral risk.
- Unrestricted maximizes merchant pressure but increases neutral incidents.

Operational Effects:

- Merchant attacks.
- Occasional warship attacks.
- Mine laying.
- Battle participation.
- Post-battle attacks on returning ships.

Modifiers:

- Technology.
- Reliability.
- Base proximity.
- Submarine type.
- Enemy trade protection.
- ASW strength.
- Heavy-ship-to-destroyer balance.
- Blockade.
- Sea state.
- Intelligence.

Coastal Submarines:

- Full efficiency near bases.
- Restricted strategic movement in war.

Long-Range Submarines:

- Better remote efficiency.
- Slightly greater ASW vulnerability where specified.

Tactical Sea State:

- Nominal optimum approximately 2–5.
- Calm conditions increase detection risk.
- Heavy conditions impair observation and attack.

Friendly-Fire Risk:

- Friendly submarines can create mistaken-identification incidents.
- Knowledge and identification rules apply.

 35. MINE WARFARE


Mine Pressure:

- Area.
- Laying side or nation.
- Target belligerents.
- Strength.
- Freshness.
- Source composition.
- Detection confidence.
- Last swept date.

Mine Sources:

- Bases.
- Coastal artillery.
- Mine-capable ships.
- Minelaying submarines.
- Scenario minefields.

Minesweeping:

- Eligible ships generate regional sweeping value.
- Dual ASW/mine equipment reduces both capabilities according to ruleset.
- Sweeping reduces mine pressure and battle-mine generation.

Resolution:

- Pre-battle mining and sweeping round.
- Monthly operational mining.
- Mine-strike checks.
- Battle minefield generation.

Effects:

- Damage or loss.
- Route risk.
- Defensive standoff.
- Battle hazards.
- Reports that may misidentify mines as torpedo attacks.

Persistence:

- Mines decay according to type and time.
- Post-war mines remain until decay or clearance where applicable.
- Ownership change does not automatically remove minefields.
- Friendly-fire risk is possible where knowledge is incomplete.

 36. AMPHIBIOUS OPERATIONS


Invasion Plan:

- Target possession.
- Staging port.
- Preparation progress.
- Transport requirement.
- Escort requirement.
- Bombardment support.
- Air support.
- Supply endurance.
- Intelligence confidence.
- Launch window.
- Status.

Eligibility:

- Target within national invasion range.
- Valid staging port.
- Sufficient transports.
- Sufficient local naval strength.
- Required preparation complete.
- Blockade and supply rules permit launch.

Range:

- Measured between eligible friendly and target ports.
- Technology modifies range.
- Global naval power and surprise-attack traits may improve first-war-year range.
- Blockade reduces range.

Launch:

- Naval superiority increases launch probability.
- Amphibious technology improves preparation and launch reliability.
- A failed launch check does not erase preparation but may create delay or
  political cost.

Battle:

- Transports must be escorted to the objective.
- More than marginal victory normally succeeds.
- Failure can cause transport, confidence, and war-score losses.

Occupation:

- Successful invasion establishes military control.
- Legal ownership normally remains until settlement.

Blitzkrieg Invasion:

- Not available before 1935.
- Requires eligible government and scenario conditions.
- Most likely near war opening.
- Uses an explicit operation and cannot transfer possession without resolution.

 37. BATTLE GENERATION


Battle Generation Inputs:

- War.
- Mission opportunities.
- Area forces.
- Ship readiness.
- Divisions.
- Intelligence.
- Weather.
- Coastal defenses.
- Mines.
- Submarines.
- Aircraft.
- Trade context.
- Operational objectives.

Mission Types:

- fleet_battle
- cruiser_battle
- coastal_raid
- convoy_attack
- convoy_defense
- invasion
- raider_interception
- blockade_breakout
- carrier_action
- ruleset-defined variants

Generation Pipeline:

1. Determine mission opportunity.
2. Determine participating sides.
3. Create force requirements.
4. Gather eligible assets.
5. Preserve permanent divisions where possible.
6. Assign mandatory roles.
7. Add optional assets by weighted deterministic selection.
8. Add allied support.
9. Instantiate coastal, submarine, mine, and air elements.
10. Validate force reachability and legality.
11. Repair generated composition where allowed.
12. Reject irreparable engagement.
13. Canonicalize battle manifest.
14. Assign battle seed.
15. Present estimate according to intelligence.

Eligibility:

- Working-up ships excluded.
- Ships in another unresolved battle excluded.
- Fuel- or range-ineligible ships excluded.
- Mission requirements must be satisfied.
- Generated forces must remain within scenario limits.

Battle Acceptance:

- Battles may be:
  - optional;
  - politically expected;
  - operationally unavoidable.
- Declining can affect:
  - war score;
  - institutional confidence;
  - objectives.
- Consequences depend on mission and obligation, not only decline count.

Support Forces:

- Allied or non-player friendly forces may participate.
- Their information and command remain limited.
- They obey their own AI and command structure.

 38. TACTICAL COMBAT


Resolution:

- Discrete one-minute authoritative turns.
- Rendering may interpolate smoothly.
- Commands are quantized to authoritative tactical time.

Core State:

- Battle map.
- Forces.
- Divisions.
- Ships.
- Aircraft.
- Submarines.
- Contacts.
- Objectives.
- Weather.
- Smoke.
- Mines.
- Orders.
- Battle event ledger.

Realism Modes:

- Admiral:
  - Player commands lead divisions.
  - No direct manual targeting.
- Rear Admiral:
  - Player commands divisions within command reach.
  - Division target orders allowed.
- Captain:
  - Player may command any friendly division.
  - Ship targeting and manual torpedo fire allowed.
- Realism mode does not alter raw war score.
- Any realism bonus or penalty applies only to final career evaluation.

Command State:

- intended
- issued
- transmitted
- acknowledged
- executing
- completed
- failed
- cancelled

Command Constraints:

- Flagship communication.
- Visibility.
- Radio and signaling technology.
- Commander ability.
- Division experience.
- Flagship damage.
- Formation.

Movement:

- Uses fixed tactical coordinates.
- Ships have heading, speed, acceleration, turning performance, and collision
  radius.
- Full speed can cause:
  - fouled grates;
  - exhausted stokers;
  - machinery breakdown;
  - vibration penalties above 25 knots.
- Coal ships and VTE machinery are more sensitive.

Force Orders:

- flotilla_attack
- rally
- disengage
- change_lead_division
- battle_turn_away

Battle Turn Away:

- Requires technology.
- Reverses course and division order.
- May create command confusion.

Exit:

- Scenario-defined exit zones and disengagement conditions.
- Crossing a visual boundary alone does not guarantee escape.
- Pursuit, speed, contact, and mission determine successful withdrawal.

Battle End:

- Objective completion.
- Mutual disengagement.
- One side withdraws.
- Time limit.
- No viable combatants.
- Scenario-specific condition.

Auto-Resolution:

- Always available unless the scenario explicitly requires player command.
- Uses the same campaign inputs.
- Must be statistically validated against tactical simulation.

 39. GUNNERY


Gunnery State:

- Battery.
- Target.
- Acquisition progress.
- Range estimate.
- Fire-control solution.
- Ammunition.
- Fire mode.
- Damage state.

Accuracy Factors:

- Fire-control technology.
- Crew quality.
- Officer effects.
- Special training.
- Range.
- Visibility.
- Radar.
- Own and target maneuver.
- Previous salvos.
- Sea state.
- Smoke.
- Damage.
- Multiple attackers.
- Glare and twilight.
- Target evasion.

Rate-of-Fire Factors:

- Gun and mount.
- Crew.
- Technology.
- Turn state.
- Sea state.
- Smoke interference.
- Damage.
- Range.
- Ammunition state.

Gun Quality:

- Range from -3 through +2.
- Modifies range, penetration, and applicable rate of fire.

Autoloaders:

- Approximately 10% higher normal rate of fire.
- Approximately 30% rapid-fire improvement after straddling.
- Approximately 25% heavier.
- Improved AA performance where applicable.

Dual-Purpose Guns:

- Approximately 25% heavier.
- Serve surface and AA roles.

Armor Resolution:

- Shell and gun definition.
- Range.
- Impact zone.
- Impact angle.
- Armor quality.
- Obliquity.
- Penetration margin.
- Outcome:
  - no effect;
  - splinter effect;
  - partial penetration;
  - full penetration;
  - pass-through;
  - dud;
  - critical penetration.

Armor Limits:

- Belt maximum 20 inches.
- Turret maximum 26 inches.
- Armor above 12 inches receives reduced proportional effectiveness according to
  manufacturing rules.
- Armor of 2 inches or more protects against qualifying splinters.

Target Allocation:

- Threat.
- Suitability.
- Range.
- Identification.
- Current engagement.
- Overkill.
- Objective relevance.
- Ammunition conservation.
- Manual orders constrain this evaluation.

 40. TORPEDOES


Torpedo State:

- National torpedo model.
- Platform compatibility.
- Mount position.
- Tube count.
- Ammunition.
- Damage state.
- Fire solution.

Use:

- Normally automated by tactical AI.
- Captain mode permits manual launch.
- Underwater tubes cannot fire above 25 knots.

Solution Quality:

- Target range.
- Relative bearing.
- Target speed and course.
- Platform maneuver.
- Crew and training.
- Sea state.
- Technology.
- Visibility and identification.

Technology:

- New torpedoes require production and supply where the ruleset models inventory.
- Old ships adopt new weapons only if compatible and supplied.
- Increased torpedo weight can require refit for incompatible mounts.

Oxygen Torpedoes:

- Improve performance.
- Increase tube-hit explosion risk.

Damage:

- Major flotation damage.
- Progressive flooding.
- Machinery damage.
- Turret or system loss.
- Underwater-tube hits can cause severe flooding.

 41. DAMAGE, FIRE, AND FLOODING


Damage Resolution Pipeline:

1. Determine hit location.
2. Resolve armor interaction.
3. Apply local component damage.
4. Apply structure and flotation contribution.
5. Create immediate fire or flooding.
6. Resolve secondary hazards.
7. Update performance.
8. Enter terminal state where applicable.

Damage Categories:

- Local component damage.
- Structure.
- Flotation.
- Fire.
- Progressive flooding.
- Critical effects.

Critical Effects:

- Rudder.
- Machinery.
- Magazine.
- Fire control.
- Bridge or conning tower.
- Electrical system.
- Severe waterline damage.
- Torpedo or mine catastrophe.
- Aviation-fuel or ordnance event.

Turrets:

- operational
- jammed
- disabled
- destroyed
- burned_out

Flooding:

- Reduces speed and stability.
- Lower speed improves control.
- Approximately 10 knots is normally a safe target for controlling serious
  flooding.
- High speed with major flooding increases loss risk.

Fire:

- Damages superstructure and systems.
- Reduces rate of fire.
- Obstructs carrier operations.
- Increases nighttime visibility.
- Generates smoke.
- Carriers, transports, AMCs, AVs, and pre-dreadnoughts have higher risk.
- Aluminum superstructure saves approximately 10% hull weight but increases fire
  vulnerability.

Damage-Control Resources:

- Teams.
- Pumping capacity.
- Firefighting capacity.
- Electrical power.
- Crew availability.
- Player or AI priorities.

Terminal States:

- Mission-killed ships may still float.
- Sinking ships may remain afloat for hours.
- Stabilized ships may survive.
- Abandoned ships may be scuttled, captured, or recovered.
- Sinking credit and VP timing use explicit battle rules.

Survivors:

- Rescue may provide battle score.
- Requires eligible friendly ships and acceptable enemy threat.

 42. WEATHER, VISIBILITY, AND SMOKE


Strategic Weather:

- Generated from area climate, season, and persistent weather state.
- Shared by battles in a consistent place and time unless temporal progression
  justifies change.

Weather Components:

- Sea state.
- Wind.
- Precipitation.
- Fog or mist.
- Time of day.
- Glare.
- Visibility.

Effects:

- Gunnery.
- Torpedoes.
- Submarines.
- Air operations.
- Ship speed.
- Formation cohesion.
- Foundering.
- Spotting and identification.

Smoke:

- Represented as deterministic spatial clouds.
- Attributes:
  - position;
  - shape;
  - density;
  - source;
  - age;
  - drift;
  - decay.
- Wind moves and disperses smoke.

Funnel Smoke:

- Coal ships generate more at high power.
- Oil ships generate less.
- Firing through smoke degrades accuracy.

Smokescreens:

- Eligible DD and CL ships may generate up to approximately five minutes.
- Requires approximately twenty minutes before reuse.
- Affects all fire through the screen.

Smoke Floats and Generators:

- Light cruisers may carry approximately three to five smoke floats.
- Later technology replaces floats with generators.

 43. AIRCRAFT


Aircraft Definitions:

- fighter
- torpedo_bomber
- dive_bomber
- medium_bomber
- patrol_aircraft
- floatplane_scout
- airship
- light_jet_fighter
- heavy_jet_fighter
- jet_attack_aircraft
- helicopter
- special_squadron

Aircraft Model:

- Speed.
- Firepower.
- Maneuverability.
- Toughness.
- Load.
- Range.
- Roles.
- Basing requirements.
- Technology.

Aircraft State:

- National inventory pools.
- Squadron assignments.
- Operational aircraft.
- Damaged aircraft.
- Pilot pool.
- Squadron experience.
- Fatigue.
- Basing.

Aircraft Development:

- Player requests one proposal at a time.
- Selects role and two emphasized traits.
- Development normally takes three to six months.
- Private ventures may create purchasable proposals.
- Proposals and results are deterministic from campaign state and stream.

Squadrons:

- Auto-equip only when models and inventory are available.
- Re-equipment lowers temporary experience.
- Large expansion dilutes experience.
- Damaged aircraft count against physical basing capacity until removed or
  repaired.

Aircraft Roles:

- Fighters:
  - CAP and escort.
- Torpedo bombers:
  - Torpedo or bomb attack.
- Dive bombers:
  - Accurate ship attack with lower bomb penetration.
- Medium bombers:
  - Level, skip, torpedo, guided-weapon, or missile attack as technology allows.
- Patrol aircraft:
  - Long-range scouting and strategic ASW.
- Floatplanes:
  - Local scouting and ASW.
  - Without catapult, launch may require ship to stop.
- Airships:
  - Long-range early scouting.
  - High weather sensitivity.
- Jets:
  - Require appropriate carrier and deck technology.
- Helicopters:
  - ASW, radar extension, and modern utility roles.

 44. CARRIER OPERATIONS


Carrier State:

- Aircraft capacity.
- Spot value.
- Deck state.
- Catapults.
- Lifts.
- Flight-deck condition.
- Hangar condition.
- Ordnance.
- Assigned air group.

Carrier Capacity:

- CVL: 4–34 aircraft.
- CV: above 34 aircraft.
- Carriers above 100 aircraft suffer reduced operating efficiency and increased
  cost.
- Jet aircraft may consume 1.5 capacity according to type and carrier size.
- Capacity rounding is deterministic per aircraft assignment.

Spot Value:

- Normally approximately half aircraft capacity.
- Modified by:
  - catapults;
  - speed;
  - deck configuration;
  - damage;
  - technology.
- Carriers below 24 knots have reduced spot value.

Jet Capability:

- Normally requires:
  - 40,000 tons;
  - or 30,000 tons with steam catapults.
- Heavy jets require jet-capable carriers.
- Angled deck is required for applicable heavy-jet operations.

Deck-Cycle States:

- unready
- readying
- spotting
- spotted
- launching
- forming
- airborne
- returning
- holding
- landing
- refueling
- rearming
- struck_down

Deck Contention:

- CAP, search, strike launch, and recovery compete for deck operations.
- Maximum simultaneous operations depend on technology and carrier layout.

Strike:

- Origin.
- Target report.
- Aircraft allocation.
- Escort.
- Loadout.
- Coordination.
- Timing.
- Fuel.
- Mission state.

Strike Timing:

- Spot and launch normally requires approximately 20–30 minutes.
- Coordinated strikes take longer but improve survival and cohesion.
- A strike larger than current spot value cannot launch.

Carrier Maneuver:

- Automatically turns into wind and uses required speed for launch or recovery.
- Player cannot issue conflicting maneuver orders during mandatory deck
  operations.

Vulnerability:

- Fueled and armed aircraft increase fire and explosion risk.
- Night recovery causes severe operational-loss risk.
- Weather may suspend operations.

Ordnance:

- Aircraft torpedoes.
- Guided bombs.
- Anti-ship missiles.
- Unused weapons from stood-down aircraft return to storage.
- Jettisoned airborne weapons are lost.

 45. AIR DEFENSE


Defense Layers:

1. CAP.
2. Heavy SAM.
3. Medium SAM.
4. Light SAM.
5. Heavy AA.
6. Medium AA.
7. Light AA.
8. CIWS and terminal defense.

AA State:

- Gun category.
- Director.
- Radar.
- Crew.
- Damage.
- Ammunition.
- Target attack type.

Resolution Outcomes:

- kill
- damage
- abort
- disruption
- no_effect

Disruption:

- Separate from physical aircraft damage.
- Reduces attack accuracy and cohesion.

AA Rules:

- Heavy AA engages aircraft attacking own or nearby ships.
- Medium AA engages before release against applicable attacks.
- Light AA timing depends on aircraft speed and attack profile.
- Light AA always has an opportunity to disrupt where eligible.
- Up to four AA directors provide normal scaling.
- More than four radar-directed medium-AA groups have diminishing returns.
- More than eight are mostly redundant.
- More than six CIWS systems are strongly redundant; approximately four is
  normally sufficient.

CAP:

- Uses:
  - airborne CAP;
  - ready CAP;
  - refueling CAP;
  - alert level;
  - endurance.
- Radar and fighter direction affect interception.
- Repeated attacks can exhaust CAP.

Attack-Layer Matching:

- Heavy ASM against heavy defenses.
- Medium ASM against medium defenses.
- Light ASM against light defenses and heavy AA.
- Bombing and rockets against applicable AA layers.
- Torpedo, skip, and dive bombing against terminal AA layers.

 46. RADAR, ELECTRONICS, AND ELECTRONIC WARFARE


Ship Electronics:

- Search radar.
- Fire-control radar.
- Fighter direction.
- Data link.
- Electronic-support measures.
- Jamming.
- Decoys.
- Radar warning.

Radar:

- Search radar detects contacts in poor visibility.
- Fire-control radar improves gunnery.
- Fire-control radar level 3 enables blind fire against qualifying radar tracks.
- Radar contacts remain less identified than visual contacts.

Installation:

- All ships may carry radar through level 2 when technology permits.
- Higher levels require available design space.
- Radar sets are produced as inventory.
- Automatic installation prioritizes larger active ships.
- Manual installation makes the ship unavailable for the current month.

Reliability:

- Early radar may malfunction.
- Can be disabled by damage or own gunfire.
- Reliability improves with technology.

Data Link:

- Permits target information sharing.
- Improved levels increase range, accuracy, and resilience.
- Shared contact must satisfy required track quality.

Electronic Warfare:

- Sensor quality.
- Emission state.
- Jamming strength.
- Decoy capacity.
- Seeker resistance.
- Data-link resilience.
- If a detailed EW model is disabled, these remain compact opposed modifiers,
  not omitted effects.

 47. MISSILES


Missile Categories:

- ASM
- SSM
- SAM

Sizes:

- light
- medium
- heavy

Missile Definition:

- Range.
- Speed.
- Damage.
- Seeker.
- Warhead.
- Launch platform.
- Target-quality requirement.
- Defense susceptibility.
- Reload rule.

Target Quality:

- area_report
- coarse_track
- fire_control_track
- terminally_updated_track
- visual_confirmation

Firing:

- Anti-ship missiles remain held until:
  - fire_at_will;
  - ripple;
  - half_salvo;
  - full_salvo;
  - explicit coordinated salvo.
- SAM fire is automated.

Platforms:

- Surface ships.
- Aircraft.
- Missile submarines.
- Coastal batteries.

Data-Link Fire:

- Requires technology.
- Allows attacks on contacts held by another unit.
- Uncertain reports reduce accuracy and may increase misidentification risk.

Storage:

- minimum
- adequate
- plentiful
- Low storage increases shortage risk during the first eighteen months of war.
- Stockpile has peacetime cost.
- Mount presence and missile inventory are separate.

Damage:

- Anti-ship missiles act as large explosive or semi-armor-piercing weapons.
- Cause:
  - structure damage;
  - fire;
  - sensor damage;
  - superstructure damage.
- Special missile torpedoes and diving missiles use their dedicated damage rules.

 48. COASTAL DEFENSE


Possession Defenses:

- Coastal artillery.
- Fortifications.
- Local minefields.
- Airfields.
- Radar sites.
- Coastal missile batteries.
- Patrol craft.

Placement:

- Battles use valid predefined geographic placement zones.
- Random placement selects among valid zones.
- Seed-driven placement prevents tactical optimization.
- Batteries cannot appear in geographically invalid positions.

Coastal Artillery:

- Participates in local battles.
- Increases local mine pressure.
- Gains AA capability over time.
- Uses possession-specific inventory.

Land Targets:

- airfield
- dockyard
- fuel_storage
- radar_station
- coastal_battery
- port_installation
- transport_concentration

Land-Target Damage:

- Intact.
- Suppressed.
- Damaged.
- Disabled.
- Destroyed.
- Consequences apply to campaign infrastructure after battle.

 49. EVENTS


Event Definition:

- Stable identifier.
- Version.
- Scope.
- Eligibility.
- Trigger phase.
- Weight or schedule.
- Mutual-exclusion group.
- Cooldown.
- Visibility.
- Choices.
- AI-choice policy.
- Effects.
- Follow-ups.
- Expiration.
- Historical-mode restrictions.
- RNG stream.

Typed Event Effects:

- adjust_tension
- adjust_confidence
- adjust_political_capital
- adjust_unrest
- adjust_budget_rate
- adjust_resources
- grant_technology_insight
- schedule_event
- change_government
- transfer_control
- transfer_ownership
- start_war
- join_war
- add_trait
- remove_trait
- add_mandate
- create_project
- modify_objective

Event Rules:

- Arbitrary database scripts are prohibited for normal events.
- Custom procedural events require:
  - explicit implementation identifier;
  - version;
  - deterministic contract;
  - tests.
- Event text never defines mechanics independently of typed effects.

 50. AI ARCHITECTURE


AI Components:

- StrategicPlanner
- BudgetAllocator
- ForceStructurePlanner
- DesignRequirementGenerator
- ShipDesignAgent
- ConstructionScheduler
- RefitPlanner
- DeploymentPlanner
- DiplomaticPlanner
- WarPlanner
- InvasionPlanner
- IntelligencePlanner
- OfficerAdministrator
- BattleAcceptancePolicy
- TacticalDoctrineController

AI Rules:

- Reads legal knowledge, not global truth.
- Issues validated domain commands.
- Respects budget, technology, treaties, capacity, and logistics.
- Does not mutate state directly.
- Is deterministic.
- Produces explanation traces.
- Difficulty changes policy quality or information assistance explicitly.
- Hidden combat-stat bonuses are prohibited unless declared by difficulty rules.

AI Planning:

- Uses:
  - strategic objectives;
  - national traits;
  - government;
  - known rival capability;
  - budget forecast;
  - technology forecast;
  - treaty state;
  - war risk.
- Maintains multi-year force-structure goals.
- Can revise plans after failed validation or changed circumstances.

 51. UI AND PLAYER INTERACTION


Monthly Player Loop:

1. Review previous results.
2. Resolve mandatory decisions.
3. Review budget and warnings.
4. Manage projects and force plans.
5. Issue deployment and mission orders.
6. Review diplomacy and objectives.
7. Commit turn.
8. Resolve tactical engagements or auto-resolve.
9. Review end-of-month report.

Decision Classes:

- Mandatory.
- Exception-driven.
- Optional administrative.

Primary Interfaces:

- Strategic map.
- Nation dashboard.
- Fleet list.
- Design editor.
- Construction and dockyard.
- Research.
- Diplomacy.
- Intelligence.
- Officers and divisions.
- Aviation.
- War and objectives.
- Reports.
- Tactical order of battle.

Information Display:

- Stale or uncertain information shows:
  - observation date;
  - confidence;
  - source;
  - estimate range.
- Hidden values are not exposed through tooltips or derived totals.
- Player-facing reports respect fog of war.

Automation Policies:

- Repairs.
- Radar installation.
- Officer assignment.
- Squadron re-equipment.
- Ship naming.
- Trade protection.
- Foreign stations.
- Division replacement.
- Scrapping recommendations.
- Research reallocation.
- Inventory replenishment.
- Automation produces auditable commands.
- Player may lock assets against automation where permitted.

Logs:

- Human-readable logs are generated from structured domain events.
- Logs are never authoritative state.

 52. SAVE, LOAD, REPLAY, AND PERSISTENCE


Stable Save Boundaries:

- MonthOpeningSnapshot.
- MonthClosingSnapshot.
- Tactical minute boundary where battle saving is enabled.

Save Manifest:

- Save-format version.
- Ruleset version.
- Formula version.
- AI-policy version.
- RNG algorithm version.
- Content-pack identifier and hash.
- Scenario identifier and hash.
- Campaign identifier.
- Current phase cursor.
- Strategic snapshot hash.
- Active battle hash.
- RNG manifest hash.
- Design artifact hashes.
- Command/event ledger position.
- Migration history.

Persistence:

- Stores authoritative state.
- Derived projections may be rebuilt.
- RNG stream state or deterministic derivation position is persisted.
- Every individual compiled design is stored or content-addressed.
- Save files do not depend on untracked external design files.

Autosave:

- Occurs after every completed month.
- Battle autosave occurs at configured stable intervals.
- Writes are atomic:
  1. Write new save.
  2. Validate.
  3. Compute hash.
  4. Commit active pointer.
  5. Retain previous recovery save.

Load:

- Validates hashes and content compatibility.
- Applies supported migrations.
- Rebuilds derived projections.
- Runs invariant validation.
- Rejects unrecoverable canonical corruption.

Replay:

- Tactical replay uses:
  - initial battle snapshot;
  - battle seed;
  - command log;
  - ruleset.
- Strategic replay uses:
  - compiled initial snapshot;
  - monthly commands;
  - decisions;
  - content and ruleset hashes.

Ruleset Compatibility:

- Campaigns are pinned to their original ruleset by default.
- Migration to a changed ruleset requires an explicit supported migration.
- Silent formula changes to an existing campaign are prohibited.

 53. VALIDATION, NORMALIZATION, AND REPAIR


Validation:

- Detects invalid state.
- Does not mutate state.

Normalization:

- Converts equivalent representations into canonical ordering and formatting.
- Cannot change gameplay meaning.

Repair:

- Changes invalid generated or cached state only under an explicit repair policy.
- Every repair is logged.
- High-authority missing content cannot be fabricated.

Fatal Errors:

- Missing nation ownership.
- Missing canonical possession definition.
- Missing required technology prerequisite.
- Invalid campaign participant mapping.
- Unresolvable aggregate identity conflict.
- Broken financial ledger.
- Unsupported content or ruleset mismatch.

Repairable Errors:

- Missing cached projection.
- Invalid display ordering.
- Recomputable derived classification cache.
- Missing report index.
- Non-authoritative duplicate UI metadata.

 54. TESTING AND ACCEPTANCE


Required Test Classes:

- Unit tests.
- Invariant tests.
- Property-based tests.
- Metamorphic tests.
- Replay tests.
- Save/load tests.
- Compiler tests.
- AI legality tests.
- Monte Carlo balance tests.
- Performance tests.

Deterministic Acceptance:

- Same inputs and commands produce identical hashes.
- Save/load preserves future outcomes.
- UI actions do not alter RNG.
- Tactical replay reproduces results.
- Campaign compilation is reproducible.

Scenario Matrix:

- Four scenarios.
- Ten canonical player slots.
- Forty slot/scenario tests.
- Tests include active, inactive, and continuity-gated behavior.
- Historical 1920 and 1935 Austro-Hungarian slot must fail cleanly.
- alternate_continuity_v1 must activate it deterministically.
- Ottoman/Turkey must remain a distinct AI-only identity.

Start-Readiness Gates:

1. Content pack validation passes.
2. Scenario participation is complete.
3. All required canonical inputs exist.
4. Campaign compilation succeeds.
5. Initial world state materializes.
6. Initial fleets and projects materialize.
7. Initial economy and ledgers balance.
8. Initial research and technology state validates.
9. Initial deployment and obligations validate.
10. First monthly turn completes.
11. Tactical or auto-resolved battle path validates.
12. Save/load reproduces state and future outcome.
13. Repeated compilation and execution produce identical hashes.

A campaign is not start-ready merely because schema and seed rows exist.

 55. RELEASE SCOPE AND IMPLEMENTATION ORDER


Milestone 1 — Strategic Campaign Kernel:

- Campaign compiler.
- Nations and world.
- Economy.
- Research.
- Ship design and construction.
- Deployment.
- Diplomacy.
- War and peace.
- Monthly phase pipeline.
- Save/load and hashes.
- Deterministic auto-resolution.

Milestone 2 — Surface Tactical Core:

- Movement.
- Spotting.
- Divisions.
- Gunnery.
- Basic armor and damage.
- Weather.
- Battle results.

Milestone 3 — Advanced Surface Warfare:

- Torpedoes.
- Mines.
- Submarines.
- Coastal defenses.
- Smoke.
- Detailed damage control.

Milestone 4 — Aviation:

- Aircraft development.
- Squadrons.
- Airbases.
- Carriers.
- CAP.
- Strikes.
- AA.

Milestone 5 — Electronics and Missile Era:

- Radar.
- Fighter direction.
- Data links.
- Electronic warfare.
- Guided weapons.
- SAM.
- CIWS.
- Jets and helicopters.

Milestone Rule:

- Later-era content may exist in the canonical pack before its tactical system is
  complete, but no scenario is declared fully supported until all required
  systems for its expected era pass acceptance.

 56. FINAL CAREER EVALUATION


Evaluation Dimensions:

- Institutional-confidence history.
- Achievement of national objectives.
- Wars and peace outcomes.
- Fleet readiness.
- Budget discipline.
- Technology position.
- Merchant protection.
- Territorial protection or expansion.
- Officer and crew development.
- Fleet modernization.
- Legacy fleet quality.
- Starting national difficulty.
- Tactical realism modifier where applicable.

Final Report:

- Campaign timeline.
- Major decisions.
- Fleet evolution.
- Wars.
- Territorial changes.
- Technology milestones.
- Financial record.
- Political record.
- Officer legacy.
- Surviving and lost ships.
- Final objective evaluation.
- Relative career rating.

Success:

- Is measured against the nation's starting position and assigned objectives.
- Does not require becoming the world's largest navy.
- Does not use final institutional confidence as the sole score.

 57. NON-NEGOTIABLE ARCHITECTURAL RULES


- Campaign setup must be deterministic.
- Scenario compilation must be reproducible.
- All runtime randomness must use domain-separated streams.
- Player and AI commands must be validated through domain contracts.
- UI state must never be authoritative simulation state.
- Localized text must never control mechanics.
- Derived values must not compete with canonical authority.
- Financial changes must pass through a ledger.
- Long-running work must use explicit projects.
- Wars must support coalitions and separate peace.
- Territory ownership and military control must remain separate.
- Knowledge must remain separate from truth.
- Tactical simulation must support auto-resolution.
- Save files must pin content, formulas, AI, and RNG versions.
- Every monthly turn must end in a validated canonical snapshot.
- No campaign is start-ready without first-turn, save/load, and hash proof.
