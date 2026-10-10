# Requirements Catalog

Status: extracted traceability index

These IDs are stable identifiers assigned to source statements containing explicit normative language. The catalog preserves source wording and does not fill specification gaps. IDs are intended for briefs, ADRs, tests, and implementation reports.

## REQ-DESIGN-01-001

- **Source:** [`DESIGN-01` Game Vision](../vision/game-vision.md)
- **Statement:** - Decisions must have visible causes and traceable consequences. - Historical asymmetry is intentional, but career evaluation is relative to each nation's opportunities and constraints. - Randomness must be deterministic, seeded, domain-separated, and auditable. - The player and AI issue commands through the same rules wherever practical. - Information presented to the player is limited by intelligence and fog of war. - The database stores canonical content and authoritative state, not duplicated procedural projections. - All derived values must be reproducible from authoritative inputs. - Save/load must preserve deterministic future outcomes when the same commands are repeated. - Tactical combat must never be required for campaign continuity; every battle must support deterministic auto-resolution. - No campaign may begin unless all start-readiness gates pass.

## REQ-DESIGN-02-001

- **Source:** [`DESIGN-02` Player Identity And Campaign Continuity](../domain/player-identity-and-continuity.md)
- **Statement:** - Government changes do not automatically end the campaign. - Revolution, defeat, regime change, constitutional change, or national succession may alter: - government type; - political mandates; - national traits; - diplomatic relations; - possessions; - budget; - strategic objectives; - officer eligibility; - institutional confidence. - Campaign termination occurs only through an explicit terminal condition.

## REQ-DESIGN-03-001

- **Source:** [`DESIGN-03` Campaign Configuration](../rules/campaign-configuration.md)
- **Statement:** Required Campaign Inputs:

## REQ-DESIGN-03-002

- **Source:** [`DESIGN-03` Campaign Configuration](../rules/campaign-configuration.md)
- **Statement:** - Modifies national naval appropriations, sustainable fleet size, AI force targets, and generated legacy-fleet scale. - Does not modify tactical statistics of individual ships. - Uses ruleset-defined multipliers. - Every multiplier must be present in the active ruleset.

## REQ-DESIGN-03-003

- **Source:** [`DESIGN-03` Campaign Configuration](../rules/campaign-configuration.md)
- **Statement:** - historical: - Uses canonical political and territorial continuity. - Historically unavailable playable slots remain inactive. - alternate_continuity_v1: - Activates supported alternate continuities. - Uses explicit scenario definitions rather than procedural substitutions. - No AI-only nation may silently replace a canonical playable slot.

## REQ-DESIGN-04-001

- **Source:** [`DESIGN-04` Canonical Playable Slots](../domain/playable-slots-and-nation-identity.md)
- **Statement:** - The ten slot identities are permanent campaign-selection identities. - Political regimes and represented state forms are scenario-specific. - A playable slot is distinct from the scenario's historical polity instance. - Slot identity must never be overwritten by an AI-only power. - Each scenario must define all ten slots as: - active; - inactive; - or conditional on a named continuity mode.

## REQ-DESIGN-04-002

- **Source:** [`DESIGN-04` Canonical Playable Slots](../domain/playable-slots-and-nation-identity.md)
- **Statement:** - Active in 1880 and 1900 historical scenarios. - Inactive in 1920 and 1935 historical scenarios. - May be activated in 1920 and 1935 only by alternate_continuity_v1. - Ottoman Empire or Turkey remains a distinct AI-only power. - Ottoman Empire or Turkey never substitutes for this slot.

## REQ-DESIGN-04-003

- **Source:** [`DESIGN-04` Canonical Playable Slots](../domain/playable-slots-and-nation-identity.md)
- **Statement:** - Uses an explicit scenario polity mapping. - Later starts may represent an approved successor continuity. - The successor mapping must be defined by scenario content. - It may not be inferred at runtime.

## REQ-DESIGN-04-004

- **Source:** [`DESIGN-04` Canonical Playable Slots](../domain/playable-slots-and-nation-identity.md)
- **Statement:** - Every scenario contains: - ten canonical playable slot records; - twelve AI-only powers; - twenty-two scenario identity records. - Inactive playable slots remain present as explicit inactive records. - Only active or continuity-enabled slots may start a campaign.

## REQ-DESIGN-05-001

- **Source:** [`DESIGN-05` Canonical Content And Rulesets](../architecture/canonical-content-and-rulesets.md)
- **Statement:** - Campaign compilation fails if required canonical input is missing. - The compiler must not silently invent: - nations; - possessions; - technologies; - starting ownership; - diplomatic participants; - required fleet designs; - scenario-specific continuity. - Procedural generation is permitted only where the content contract explicitly marks generation as authoritative.

## REQ-DESIGN-05-002

- **Source:** [`DESIGN-05` Canonical Content And Rulesets](../architecture/canonical-content-and-rulesets.md)
- **Statement:** Localized text is presentation-only. Simulation logic uses stable identifiers, never localized strings.

## REQ-DESIGN-06-001

- **Source:** [`DESIGN-06` Authoritative State Model](../architecture/authoritative-state-model.md)
- **Statement:** - canonical: - Persisted authoritative state. - derived: - Recomputed from canonical state. - cached_projection: - Optional persisted cache validated against derivation. - ledger: - Append-only historical record. - ephemeral: - Runtime-only state reconstructed or discarded at stable boundaries.

## REQ-DESIGN-06-002

- **Source:** [`DESIGN-06` Authoritative State Model](../architecture/authoritative-state-model.md)
- **Statement:** - A ship belongs to exactly one nation. - A ship has exactly one current compiled design version. - A commissioned ship occupies exactly one strategic location. - A ship cannot be both under construction and commissioned. - A ship cannot participate in two unresolved battles. - A possession has one legal owner and at most one military controller. - A construction project remains between zero and total work. - A completed project reserves no construction capacity. - A ship belongs to at most one permanent division. - A sunk ship accepts no operational orders. - Two nations cannot be allied and at war in the same relation context. - Technology prerequisites must be satisfied before discovery. - Tactical persistent units must map to campaign assets or declared temporary generated assets. - Every financial posting balances against a source and category. - Every random outcome records a stable random-stream key.

## REQ-DESIGN-07-001

- **Source:** [`DESIGN-07` Numeric And Temporal Contract](../architecture/numeric-and-temporal-contract.md)
- **Statement:** - Uses integer or fixed-point arithmetic. - Floating-point arithmetic is prohibited for authoritative outcomes. - Rendering may use floating point but cannot alter simulation state.

## REQ-DESIGN-07-002

- **Source:** [`DESIGN-07` Numeric And Temporal Contract](../architecture/numeric-and-temporal-contract.md)
- **Statement:** - Every formula declares its rounding mode. - Financial debits round against the payer unless explicitly stated. - Construction completion never occurs before accumulated work reaches total work. - Classification and treaty checks use unrounded canonical values. - UI values may be rounded for display but must expose detailed breakdowns.

## REQ-DESIGN-08-001

- **Source:** [`DESIGN-08` Determinism And Randomness](../architecture/determinism-and-randomness.md)
- **Statement:** - Identical content, ruleset, initial snapshot, commands, and seeds must produce identical authoritative hashes. - Determinism must hold across supported operating systems.

## REQ-DESIGN-08-002

- **Source:** [`DESIGN-08` Determinism And Randomness](../architecture/determinism-and-randomness.md)
- **Statement:** - A single global consumptive RNG stream is prohibited. - Random outcomes use named hierarchical streams.

## REQ-DESIGN-08-003

- **Source:** [`DESIGN-08` Determinism And Randomness](../architecture/determinism-and-randomness.md)
- **Statement:** Required Stream Families:

## REQ-DESIGN-09-001

- **Source:** [`DESIGN-09` Campaign Compilation](../architecture/campaign-compilation.md)
- **Statement:** 1. Load and hash content. 2. Validate scenario participation. 3. Materialize scenario nation instances. 4. Materialize regimes and traits. 5. Materialize world ownership and infrastructure. 6. Materialize diplomacy and treaty state. 7. Materialize technologies and technology variation. 8. Materialize economies and budgets. 9. Materialize historical or generated fleets. 10. Materialize ongoing construction and rebuilds. 11. Materialize officers, crews, divisions, and deployment. 12. Materialize aircraft, submarines, and inventories. 13. Materialize political state and objectives. 14. Validate all aggregates. 15. Repair only explicitly repairable generated data. 16. Reject irreparable or incomplete input. 17. Canonicalize ordering and identifiers. 18. Produce initial snapshot. 19. Execute preflight checks. 20. Compute reproducibility hashes. 21. Persist the first stable campaign save.

## REQ-DESIGN-09-002

- **Source:** [`DESIGN-09` Campaign Compilation](../architecture/campaign-compilation.md)
- **Statement:** - Fleet must satisfy: - budget sustainability; - minimum operational capability; - foreign-station obligations; - treaty legality; - dock and infrastructure limits; - scenario technology; - national force doctrine; - maintenance affordability; - playable first-turn liquidity. - Generated fleets include: - age cohorts; - design families; - individual ships; - historical refits; - readiness; - divisions; - officers; - deployment; - active projects.

## REQ-DESIGN-10-001

- **Source:** [`DESIGN-10` Strategic Monthly Turn Pipeline](../rules/strategic-turn.md)
- **Statement:** - Event choices. - Peace offers. - Treaty negotiations. - Insolvency interventions. - Required political responses.

## REQ-DESIGN-10-002

- **Source:** [`DESIGN-10` Strategic Monthly Turn Pipeline](../rules/strategic-turn.md)
- **Statement:** - AI observes only information legally available at MonthOpeningSnapshot.

## REQ-DESIGN-10-003

- **Source:** [`DESIGN-10` Strategic Monthly Turn Pipeline](../rules/strategic-turn.md)
- **Statement:** - Maintenance. - Existing project commitments. - Contractual payments. - Required personnel and support costs.

## REQ-DESIGN-10-004

- **Source:** [`DESIGN-10` Strategic Monthly Turn Pipeline](../rules/strategic-turn.md)
- **Statement:** - Player may fight or auto-resolve. - Apply tactical results immediately to participating assets. - A ship cannot enter a second battle unless explicitly allowed by the ruleset.

## REQ-DESIGN-10-005

- **Source:** [`DESIGN-10` Strategic Monthly Turn Pipeline](../rules/strategic-turn.md)
- **Statement:** - Normalize ordering. - Rebuild required projections. - Validate invariants.

## REQ-DESIGN-11-001

- **Source:** [`DESIGN-11` Command Model](../architecture/command-model.md)
- **Statement:** - AI uses the same command contracts as the player where practical. - Commands never mutate authoritative state directly. - Commands that become impossible during resolution produce explicit outcomes. - Cancellation is allowed only before the command's lock or irreversible phase. - Refunds and lost costs are defined by command type. - Automated actions also produce commands and audit records.

## REQ-DESIGN-12-001

- **Source:** [`DESIGN-12` Nations And Governments](../domain/nations-and-governments.md)
- **Statement:** - Efficient shipbuilding: - Construction work completes 10% faster unless the ruleset defines an equivalent fixed work-rate implementation. - Undeveloped shipbuilding: - Construction completes 10% slower. - Increased probability of latent construction defects. - Global naval power: - Foreign-station obligation includes at least 10% of eligible tonnage. - Cramped accommodation is prohibited for applicable new construction. - Government may react to rival budget parity. - Cautious: - Alters AI operational risk tolerance. - Increases political consequences of major defeats for the player nation. - Poor education: - Reduces baseline crew and pilot quality. - Reduces research efficiency. - Surprise attack: - Base first-war-entry surprise eligibility is 80%, subject to opportunity, date, previous use, intelligence, and ruleset modifiers. - Inconsistent naval policy: - Increases frequency and severity of political procurement mandates. - Attention to detail: - Reduces latent-defect probability and severity. - Technology leader: - Improves research position and AI commitment to technical competitiveness. - Does not grant technologies without prerequisites. - Hidden faults: - Increases latent-defect probability. - Kamikaze: - Conditional policy only. - Requires compatible government, technology, war state, and losing-war state. - Improves designated offensive-air behavior while worsening defensive-air priorities according to ruleset modifiers.

## REQ-DESIGN-13-001

- **Source:** [`DESIGN-13` Economy And Accounting](../rules/economy.md)
- **Statement:** 1. Legally mandatory obligations. 2. Minimum active-fleet maintenance. 3. Critical repairs and safety expenses. 4. Existing construction commitments. 5. Required foreign contracts. 6. Research and intelligence minimums. 7. Training. 8. New discretionary projects.

## REQ-DESIGN-13-002

- **Source:** [`DESIGN-13` Economy And Accounting](../rules/economy.md)
- **Statement:** - Treasury may not silently become negative. - Payments are reduced or deferred according to priority. - Unpaid eligible commitments become explicit arrears. - Construction receives progress only for paid work. - Insolvency can reduce: - institutional confidence; - fleet morale; - project progress; - readiness. - Persistent insolvency triggers political intervention.

## REQ-DESIGN-13-003

- **Source:** [`DESIGN-13` Economy And Accounting](../rules/economy.md)
- **Statement:** - Treasury carries over. - Excessive surplus may trigger a political reclamation event. - Confiscation is an explicit event or ruleset rule, never an invisible mutation.

## REQ-DESIGN-13-004

- **Source:** [`DESIGN-13` Economy And Accounting](../rules/economy.md)
- **Statement:** - Active maintenance increases. - Mobilized personnel, fuel, ammunition, repairs, and operations add costs. - Exact multipliers are ruleset constants and must be explainable in reports.

## REQ-DESIGN-14-001

- **Source:** [`DESIGN-14` World Geography](../domain/world-geography.md)
- **Statement:** - A normal strategic movement traverses one eligible area edge per month unless a special rule grants additional movement. - Long routes are stored as planned paths. - Each monthly resolution advances the force to the next legal node. - Operational battle presence is derived from resolved movement. - A ship is never stored in two areas simultaneously.

## REQ-DESIGN-15-001

- **Source:** [`DESIGN-15` Possessions And Territorial Control](../domain/possessions-and-territorial-control.md)
- **Statement:** - Before 1920: - Oil access is required to construct oil-fueled ships. - Captured or foreign-built oil ships may be operated only if supply is available. - From 1920: - International oil access is normally assumed in peacetime. - Nations without domestic or controlled oil are more vulnerable to wartime shortage and blockade. - Oil discoveries before 1920 are seeded, explicit events. - Oil access, stockpile risk, and local supply are separate concepts.

## REQ-DESIGN-17-001

- **Source:** [`DESIGN-17` Diplomacy](../rules/diplomacy.md)
- **Statement:** - Reduce mutual tension. - Increase expected support in war. - Improve technology-sale availability and pricing. - Permit allied operational support where access exists. - May increase tension with rivals. - May be revoked in peace if relation conditions fail. - Are not revoked while both allies remain in the same active war. - An ally may seek separate peace through war-participant rules.

## REQ-DESIGN-17-002

- **Source:** [`DESIGN-17` Diplomacy](../rules/diplomacy.md)
- **Statement:** - Hawkish responses may increase: - institutional confidence; - naval budget; - tension. - Dovish responses may reduce tension but can reduce confidence or budget. - Effects are explicit per event and never inferred from descriptive text.

## REQ-DESIGN-17-003

- **Source:** [`DESIGN-17` Diplomacy](../rules/diplomacy.md)
- **Statement:** - Determined by: - tension; - incidents; - alliances; - government; - strategic objectives; - events; - surprise opportunities. - War is never triggered from tension alone unless the ruleset explicitly defines a threshold event.

## REQ-DESIGN-18-001

- **Source:** [`DESIGN-18` Politics, Confidence, And Unrest](../rules/politics-confidence-and-unrest.md)
- **Statement:** - Replaces overloaded prestige as the dismissal variable. - Represents trust in naval administration. - A value at or below 16 creates dismissal risk. - Dismissal checks occur only during the terminal-evaluation phase. - Confidence changes through: - victories; - defeats; - fiscal management; - mandate compliance; - foreign-station compliance; - preparedness; - event choices. - Proportional losses use explicit ruleset formulas.

## REQ-DESIGN-18-002

- **Source:** [`DESIGN-18` Politics, Confidence, And Unrest](../rules/politics-confidence-and-unrest.md)
- **Statement:** - Requires explicit eligibility and threshold conditions. - Less likely in liberal democracies. - May: - change government; - end or alter war participation; - impose harsh peace terms; - create successor states. - Revolution is not automatically terminal if a supported continuation exists.

## REQ-DESIGN-20-001

- **Source:** [`DESIGN-20` Research And Technology](../rules/research-and-technology.md)
- **Statement:** - High. - Medium. - Low. - Priorities are relative weights. - The player cannot select the exact next technology.

## REQ-DESIGN-20-002

- **Source:** [`DESIGN-20` Research And Technology](../rules/research-and-technology.md)
- **Statement:** - Materialized once during campaign compilation. - Prerequisite structure remains valid. - A varied technology cannot precede mandatory prerequisites.

## REQ-DESIGN-21-001

- **Source:** [`DESIGN-21` Ship Design](../rules/ship-design.md)
- **Statement:** - Superstructure drawings, visual decoration, and cosmetic arrangement are presentation-only unless mapped to a mechanical component.

## REQ-DESIGN-22-001

- **Source:** [`DESIGN-22` Ship Classification](../rules/ship-classification.md)
- **Statement:** - DD: - Initially below 2,000 tons. - Speed above 19 knots. - Requires torpedoes. - Cannot carry qualifying armor. - Maximum displacement rises by technology to approximately 3,800 tons. - CL: - Initially above 2,000 and below 8,000 tons. - Speed above 16 knots. - Main guns normally no larger than 6 inches. - Protected-cruiser and missile-era exceptions require explicit technology. - B: - At least 5,000 tons. - Belt at least 6 inches. - Main guns over 6 inches. - Speed below 20 knots. - No more than two main turrets. - CA: - Above 4,000 tons. - Speed above 19 knots. - Belt above 2 and no more than 12 inches. - Main guns from 6 through 11 inches under canonical boundary rules. - BC: - Main guns over 10 inches and qualifying high speed; - or three main turrets and qualifying speed. - Speed threshold rises by era. - Borderline ships use explicit armor and speed precedence rules. - BB: - At least three main turrets. - Above 8,000 tons. - Belt over 6 inches. - Main guns over 10 inches. - KE: - Below 2,500 tons. - Belt no more than 2 inches. - Maximum gun caliber 6 inches. - No torpedoes. - AMC: - Above 1,700 tons. - No armor. - Guns no larger than 6 inches. - Number and fast-AMC limits apply. - CV: - Aircraft capacity above 34. - Displacement limited by carrier technology. - CVL: - Aircraft capacity from 4 through 34. - Normally no more than 16,000 tons unless a valid conversion. - AV: - Defined by aircraft-support subtype and era.

## REQ-DESIGN-22-002

- **Source:** [`DESIGN-22` Ship Classification](../rules/ship-classification.md)
- **Statement:** - Rebuilds invoke classification again. - Era changes alone may trigger administrative reclassification where the ruleset explicitly requires it. - Classification cache must always match the current compiled design version.

## REQ-DESIGN-23-001

- **Source:** [`DESIGN-23` Construction, Repair, And Rebuild](../rules/construction-repair-and-rebuild.md)
- **Statement:** - Starts only after design approval. - Up to twelve ships of one class may be ordered together. - Additional ships of an approved design need no new study unless the design is modified. - Progress equals paid effective work. - Delayed projects receive no work and no work charge that month. - Accelerated work costs 5% more and increases progress rate. - Excess acceleration can impose seeded capacity-pressure delays.

## REQ-DESIGN-23-002

- **Source:** [`DESIGN-23` Construction, Repair, And Rebuild](../rules/construction-repair-and-rebuild.md)
- **Statement:** - Cancels operational status. - May produce salvage credit. - Removes future maintenance. - Treaty-required scrapping follows treaty deadlines and inspection rules.

## REQ-DESIGN-24-001

- **Source:** [`DESIGN-24` Fleet Management](../domain/fleet-management.md)
- **Statement:** - Active: - Highest routine availability and training. - Reserve: - Lower cost and reduced immediate effectiveness. - Mothballed: - Lowest cost, poor readiness, extended reactivation. - Working up: - Gains crew proficiency. - Cannot participate in normal battle generation. - Repair or rebuild: - Availability determined by project state.

## REQ-DESIGN-24-002

- **Source:** [`DESIGN-24` Fleet Management](../domain/fleet-management.md)
- **Statement:** - Derived from support, location, status, and infrastructure. - Never stored as independent authority.

## REQ-DESIGN-25-001

- **Source:** [`DESIGN-25` Deployment And Logistics](../rules/deployment-and-logistics.md)
- **Statement:** - Each ship has one strategic area. - Divisions normally move together. - Illegal mixed-location divisions must be split or movement rejected.

## REQ-DESIGN-25-002

- **Source:** [`DESIGN-25` Deployment And Logistics](../rules/deployment-and-logistics.md)
- **Statement:** - Calculated per area from possession obligations. - Global naval powers must maintain at least the required global percentage. - Only eligible active and foreign-station ships contribute. - Colonial-service ships contribute 1.5 times qualifying tonnage. - Cramped and short-range ships contribute less. - Requirements may be suspended during wartime blockade. - Newly acquired possessions receive a ruleset-defined grace period.

## REQ-DESIGN-25-003

- **Source:** [`DESIGN-25` Deployment And Logistics](../rules/deployment-and-logistics.md)
- **Statement:** - Short-range ships cannot make normal strategic movement outside allowed adjacent home-area exceptions. - Blockaded nations cannot normally move ships out of relevant home/build areas except through authorized raider breakout or battle outcomes. - Fuel shortage may cancel movement or remove battle eligibility. - Coal ships are not affected by oil shortage.

## REQ-DESIGN-26-001

- **Source:** [`DESIGN-26` Divisions And Formations](../domain/divisions-and-formations.md)
- **Statement:** - Battle-local projection. - Derived from permanent division where possible. - May be adjusted for availability, mission, or scenario needs. - Must preserve provenance to campaign assets.

## REQ-DESIGN-26-002

- **Source:** [`DESIGN-26` Divisions And Formations](../domain/divisions-and-formations.md)
- **Statement:** - Role and formation legality use ship-type and technology rules. - Battleships cannot scout. - Destroyers scout only if all ships meet the ruleset displacement threshold, nominally above 1,500 tons.

## REQ-DESIGN-27-001

- **Source:** [`DESIGN-27` Officers And Personnel](../domain/officers-and-personnel.md)
- **Statement:** - Requires technology and establishment project. - Produces more and somewhat better officers. - Has recurring cost.

## REQ-DESIGN-27-002

- **Source:** [`DESIGN-27` Officers And Personnel](../domain/officers-and-personnel.md)
- **Statement:** - Naval manpower. - Trained manpower. - Specialists. - Reservists. - Pilot pool. - New construction cannot become fully operational without adequate personnel.

## REQ-DESIGN-28-001

- **Source:** [`DESIGN-28` Crew, Training, And Morale](../rules/crew-training-and-morale.md)
- **Statement:** - Maximum two active subjects. - Requires twelve paid consecutive months to reach full proficiency. - Proficiency decays or is suspended when funding stops according to ruleset. - Benefits are conditional on paid training.

## REQ-DESIGN-28-002

- **Source:** [`DESIGN-28` Crew, Training, And Morale](../rules/crew-training-and-morale.md)
- **Statement:** - Exists at fleet, force, and ship level where required. - Financial failure, defeat, exhaustion, and command orders modify morale. - Rally temporarily raises force morale. - Disengage reduces aggressive behavior and encourages withdrawal.

## REQ-DESIGN-29-001

- **Source:** [`DESIGN-29` Intelligence And Knowledge](../architecture/intelligence-and-knowledge.md)
- **Statement:** - One allocation per observed nation. - Spending requires time to build capability. - Interim capability is explicitly displayed.

## REQ-DESIGN-29-002

- **Source:** [`DESIGN-29` Intelligence And Knowledge](../architecture/intelligence-and-knowledge.md)
- **Statement:** - May contain: - position error; - strength error; - identification error; - delivery delay. - Reports never overwrite true state.

## REQ-DESIGN-30-001

- **Source:** [`DESIGN-30` Treaties](../rules/treaties.md)
- **Statement:** - Noncompliant ships under construction at signing are cancelled or scrapped according to terms. - Existing completed ships may remain unless a clause requires disposal. - Existing ships may be modernized within rebuild restrictions. - Liberal democracies must comply strictly unless a scenario rule overrides. - Other governments may declare up to 10% less displacement where cheating is permitted. - Main-caliber cheating is prohibited.

## REQ-DESIGN-31-001

- **Source:** [`DESIGN-31` War And Peace](../rules/war-and-peace.md)
- **Statement:** - Removes one participant without necessarily ending the war. - Recalculates sides, access, blockade, and occupation. - Cannot leave invalid alliance-war states.

## REQ-DESIGN-32-001

- **Source:** [`DESIGN-32` Blockade](../rules/blockade.md)
- **Statement:** - Normally requires at least 110% of defending eligible strength. - Uses PostBattleSnapshot. - May require establishment persistence or explicit ruleset duration.

## REQ-DESIGN-33-001

- **Source:** [`DESIGN-33` Trade, Raiding, And Merchant Shipping](../rules/trade-raiding-and-merchant-shipping.md)
- **Statement:** - Cannot be short range. - Long range and speed improve effectiveness. - Can be intercepted. - Damage may cause scuttling or internment. - Fuel and machinery reliability affect endurance. - Raiders have little or no economic effect against an already effectively blockaded enemy.

## REQ-DESIGN-34-001

- **Source:** [`DESIGN-34` Submarines](../rules/submarines.md)
- **Statement:** - Submarines are maintained as typed flotilla pools or persistent units according to the active ruleset. - Tactical submarine instances are allocated from strategic assets. - Tactical loss reduces the associated strategic pool or unit. - One asset cannot appear in multiple simultaneous battles.

## REQ-DESIGN-36-001

- **Source:** [`DESIGN-36` Amphibious Operations](../rules/amphibious-operations.md)
- **Statement:** - Target within national invasion range. - Valid staging port. - Sufficient transports. - Sufficient local naval strength. - Required preparation complete. - Blockade and supply rules permit launch.

## REQ-DESIGN-36-002

- **Source:** [`DESIGN-36` Amphibious Operations](../rules/amphibious-operations.md)
- **Statement:** - Transports must be escorted to the objective. - More than marginal victory normally succeeds. - Failure can cause transport, confidence, and war-score losses.

## REQ-DESIGN-36-003

- **Source:** [`DESIGN-36` Amphibious Operations](../rules/amphibious-operations.md)
- **Statement:** - Not available before 1935. - Requires eligible government and scenario conditions. - Most likely near war opening. - Uses an explicit operation and cannot transfer possession without resolution.

## REQ-DESIGN-37-001

- **Source:** [`DESIGN-37` Battle Generation](../rules/battle-generation.md)
- **Statement:** - Working-up ships excluded. - Ships in another unresolved battle excluded. - Fuel- or range-ineligible ships excluded. - Mission requirements must be satisfied. - Generated forces must remain within scenario limits.

## REQ-DESIGN-37-002

- **Source:** [`DESIGN-37` Battle Generation](../rules/battle-generation.md)
- **Statement:** - Battles may be: - optional; - politically expected; - operationally unavoidable. - Declining can affect: - war score; - institutional confidence; - objectives. - Consequences depend on mission and obligation, not only decline count.

## REQ-DESIGN-38-001

- **Source:** [`DESIGN-38` Tactical Combat](../rules/tactical-combat.md)
- **Statement:** - Admiral: - Player commands lead divisions. - No direct manual targeting. - Rear Admiral: - Player commands divisions within command reach. - Division target orders allowed. - Captain: - Player may command any friendly division. - Ship targeting and manual torpedo fire allowed. - Realism mode does not alter raw war score. - Any realism bonus or penalty applies only to final career evaluation.

## REQ-DESIGN-38-002

- **Source:** [`DESIGN-38` Tactical Combat](../rules/tactical-combat.md)
- **Statement:** - Requires technology. - Reverses course and division order. - May create command confusion.

## REQ-DESIGN-38-003

- **Source:** [`DESIGN-38` Tactical Combat](../rules/tactical-combat.md)
- **Statement:** - Always available unless the scenario explicitly requires player command. - Uses the same campaign inputs. - Must be statistically validated against tactical simulation.

## REQ-DESIGN-40-001

- **Source:** [`DESIGN-40` Torpedoes](../rules/torpedoes.md)
- **Statement:** - Normally automated by tactical AI. - Captain mode permits manual launch. - Underwater tubes cannot fire above 25 knots.

## REQ-DESIGN-40-002

- **Source:** [`DESIGN-40` Torpedoes](../rules/torpedoes.md)
- **Statement:** - New torpedoes require production and supply where the ruleset models inventory. - Old ships adopt new weapons only if compatible and supplied. - Increased torpedo weight can require refit for incompatible mounts.

## REQ-DESIGN-41-001

- **Source:** [`DESIGN-41` Damage, Fire, And Flooding](../rules/damage-fire-and-flooding.md)
- **Statement:** - Rescue may provide battle score. - Requires eligible friendly ships and acceptable enemy threat.

## REQ-DESIGN-42-001

- **Source:** [`DESIGN-42` Weather, Visibility, And Smoke](../rules/weather-visibility-and-smoke.md)
- **Statement:** - Eligible DD and CL ships may generate up to approximately five minutes. - Requires approximately twenty minutes before reuse. - Affects all fire through the screen.

## REQ-DESIGN-43-001

- **Source:** [`DESIGN-43` Aircraft](../rules/aircraft.md)
- **Statement:** - Auto-equip only when models and inventory are available. - Re-equipment lowers temporary experience. - Large expansion dilutes experience. - Damaged aircraft count against physical basing capacity until removed or repaired.

## REQ-DESIGN-44-001

- **Source:** [`DESIGN-44` Carrier Operations](../rules/carrier-operations.md)
- **Statement:** - Normally requires: - 40,000 tons; - or 30,000 tons with steam catapults. - Heavy jets require jet-capable carriers. - Angled deck is required for applicable heavy-jet operations.

## REQ-DESIGN-44-002

- **Source:** [`DESIGN-44` Carrier Operations](../rules/carrier-operations.md)
- **Statement:** - Spot and launch normally requires approximately 20–30 minutes. - Coordinated strikes take longer but improve survival and cohesion. - A strike larger than current spot value cannot launch.

## REQ-DESIGN-44-003

- **Source:** [`DESIGN-44` Carrier Operations](../rules/carrier-operations.md)
- **Statement:** - Automatically turns into wind and uses required speed for launch or recovery. - Player cannot issue conflicting maneuver orders during mandatory deck operations.

## REQ-DESIGN-46-001

- **Source:** [`DESIGN-46` Radar, Electronics, And Electronic Warfare](../rules/radar-electronics-and-ew.md)
- **Statement:** - Permits target information sharing. - Improved levels increase range, accuracy, and resilience. - Shared contact must satisfy required track quality.

## REQ-DESIGN-47-001

- **Source:** [`DESIGN-47` Missiles](../rules/missiles.md)
- **Statement:** - Requires technology. - Allows attacks on contacts held by another unit. - Uncertain reports reduce accuracy and may increase misidentification risk.

## REQ-DESIGN-48-001

- **Source:** [`DESIGN-48` Coastal Defense](../rules/coastal-defense.md)
- **Statement:** - Battles use valid predefined geographic placement zones. - Random placement selects among valid zones. - Seed-driven placement prevents tactical optimization. - Batteries cannot appear in geographically invalid positions.

## REQ-DESIGN-49-001

- **Source:** [`DESIGN-49` Events](../architecture/events.md)
- **Statement:** - Arbitrary database scripts are prohibited for normal events. - Custom procedural events require: - explicit implementation identifier; - version; - deterministic contract; - tests. - Event text never defines mechanics independently of typed effects.

## REQ-DESIGN-50-001

- **Source:** [`DESIGN-50` AI Architecture](../architecture/ai-architecture.md)
- **Statement:** - Reads legal knowledge, not global truth. - Issues validated domain commands. - Respects budget, technology, treaties, capacity, and logistics. - Does not mutate state directly. - Is deterministic. - Produces explanation traces. - Difficulty changes policy quality or information assistance explicitly. - Hidden combat-stat bonuses are prohibited unless declared by difficulty rules.

## REQ-DESIGN-51-001

- **Source:** [`DESIGN-51` UI And Player Interaction](../architecture/ui-and-player-interaction.md)
- **Statement:** - Human-readable logs are generated from structured domain events. - Logs are never authoritative state.

## REQ-DESIGN-52-001

- **Source:** [`DESIGN-52` Save, Load, Replay, And Persistence](../architecture/persistence-and-replay.md)
- **Statement:** - Campaigns are pinned to their original ruleset by default. - Migration to a changed ruleset requires an explicit supported migration. - Silent formula changes to an existing campaign are prohibited.

## REQ-DESIGN-53-001

- **Source:** [`DESIGN-53` Validation, Normalization, And Repair](../architecture/validation-normalization-and-repair.md)
- **Statement:** - Converts equivalent representations into canonical ordering and formatting. - Cannot change gameplay meaning.

## REQ-DESIGN-53-002

- **Source:** [`DESIGN-53` Validation, Normalization, And Repair](../architecture/validation-normalization-and-repair.md)
- **Statement:** - Changes invalid generated or cached state only under an explicit repair policy. - Every repair is logged. - High-authority missing content cannot be fabricated.

## REQ-DESIGN-53-003

- **Source:** [`DESIGN-53` Validation, Normalization, And Repair](../architecture/validation-normalization-and-repair.md)
- **Statement:** - Missing nation ownership. - Missing canonical possession definition. - Missing required technology prerequisite. - Invalid campaign participant mapping. - Unresolvable aggregate identity conflict. - Broken financial ledger. - Unsupported content or ruleset mismatch.

## REQ-DESIGN-54-001

- **Source:** [`DESIGN-54` Testing And Acceptance](../acceptance/testing-and-acceptance.md)
- **Statement:** Required Test Classes:

## REQ-DESIGN-54-002

- **Source:** [`DESIGN-54` Testing And Acceptance](../acceptance/testing-and-acceptance.md)
- **Statement:** - Four scenarios. - Ten canonical player slots. - Forty slot/scenario tests. - Tests include active, inactive, and continuity-gated behavior. - Historical 1920 and 1935 Austro-Hungarian slot must fail cleanly. - alternate_continuity_v1 must activate it deterministically. - Ottoman/Turkey must remain a distinct AI-only identity.

## REQ-DESIGN-54-003

- **Source:** [`DESIGN-54` Testing And Acceptance](../acceptance/testing-and-acceptance.md)
- **Statement:** 1. Content pack validation passes. 2. Scenario participation is complete. 3. All required canonical inputs exist. 4. Campaign compilation succeeds. 5. Initial world state materializes. 6. Initial fleets and projects materialize. 7. Initial economy and ledgers balance. 8. Initial research and technology state validates. 9. Initial deployment and obligations validate. 10. First monthly turn completes. 11. Tactical or auto-resolved battle path validates. 12. Save/load reproduces state and future outcome. 13. Repeated compilation and execution produce identical hashes.

## REQ-DESIGN-55-001

- **Source:** [`DESIGN-55` Release Scope And Implementation Order](../delivery/release-scope-and-implementation-order.md)
- **Statement:** - Later-era content may exist in the canonical pack before its tactical system is complete, but no scenario is declared fully supported until all required systems for its expected era pass acceptance.

## REQ-DESIGN-57-001

- **Source:** [`DESIGN-57` Non-Negotiable Architectural Rules](../architecture/non-negotiable-rules.md)
- **Statement:** - Campaign setup must be deterministic. - Scenario compilation must be reproducible. - All runtime randomness must use domain-separated streams. - Player and AI commands must be validated through domain contracts. - UI state must never be authoritative simulation state. - Localized text must never control mechanics. - Derived values must not compete with canonical authority. - Financial changes must pass through a ledger. - Long-running work must use explicit projects. - Wars must support coalitions and separate peace. - Territory ownership and military control must remain separate. - Knowledge must remain separate from truth. - Tactical simulation must support auto-resolution. - Save files must pin content, formulas, AI, and RNG versions. - Every monthly turn must end in a validated canonical snapshot. - No campaign is start-ready without first-turn, save/load, and hash proof.

