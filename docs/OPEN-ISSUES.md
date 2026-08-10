# Known Specification Issues

Status: audit registry

This file lists automatically detected ambiguity candidates from the canonical source. Detection does not itself change the design. Each item requires human review and one of: clarification, conversion to a ruleset constant, classification as a balance target, or closure as sufficiently explicit. Implementations MUST NOT silently resolve an open decision.

## OPEN-0001

- **Source:** [`DESIGN-01` Game Vision](../docs/vision/game-vision.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Bluewave is a long-form naval strategy and tactical combat simulation. - The player leads the naval institution of a major power rather than representing one fixed historical individual. - The campaign models naval policy, fleet design, procurement, research, deployment, diplomacy, war, political confidence, and tactical command. - The player influences foreign policy but does not directly control the whole national government. - Campaign success is evaluated relative to the nation's starting position, assigned strategic objectives, political confidence, and long-term naval performance.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0002

- **Source:** [`DESIGN-01` Game Vision](../docs/vision/game-vision.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Decisions must have visible causes and traceable consequences. - Historical asymmetry is intentional, but career evaluation is relative to each nation's opportunities and constraints. - Randomness must be deterministic, seeded, domain-separated, and auditable. - The player and AI issue commands through the same rules wherever practical. - Information presented to the player is limited by intelligence and fog of war. - The database stores canonical content and authoritative state, not duplicated procedural projections. - All derived values must be reproducible from authoritative inputs. - Save/load must preserve deterministic future outcomes when the same commands are repeated. - Tactical c...
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0003

- **Source:** [`DESIGN-02` Player Identity And Campaign Continuity](../docs/domain/player-identity-and-continuity.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Government changes do not automatically end the campaign. - Revolution, defeat, regime change, constitutional change, or national succession may alter: - government type; - political mandates; - national traits; - diplomatic relations; - possessions; - budget; - strategic objectives; - officer eligibility; - institutional confidence. - Campaign termination occurs only through an explicit terminal condition.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0004

- **Source:** [`DESIGN-02` Player Identity And Campaign Continuity](../docs/domain/player-identity-and-continuity.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** Non-Terminal Major Outcomes:
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0005

- **Source:** [`DESIGN-03` Campaign Configuration](../docs/rules/campaign-configuration.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Modifies national naval appropriations, sustainable fleet size, AI force targets, and generated legacy-fleet scale. - Does not modify tactical statistics of individual ships. - Uses ruleset-defined multipliers. - Every multiplier must be present in the active ruleset.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0006

- **Source:** [`DESIGN-03` Campaign Configuration](../docs/rules/campaign-configuration.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - None: - Uses canonical availability dates and effectiveness. - Some: - May shift eligible technology dates by a ruleset-bounded small amount. - May apply bounded effectiveness variation to eligible technologies. - Considerable: - May shift dates by up to six years where permitted. - May apply wider bounded effectiveness variation. - Technology variation is materialized during campaign compilation. - Variation does not consume runtime research RNG. - The resulting technology manifest is immutable for the campaign.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0007

- **Source:** [`DESIGN-03` Campaign Configuration](../docs/rules/campaign-configuration.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - historical: - Uses canonical political and territorial continuity. - Historically unavailable playable slots remain inactive. - alternate_continuity_v1: - Activates supported alternate continuities. - Uses explicit scenario definitions rather than procedural substitutions. - No AI-only nation may silently replace a canonical playable slot.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0008

- **Source:** [`DESIGN-04` Canonical Playable Slots](../docs/domain/playable-slots-and-nation-identity.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Active in 1880 and 1900 historical scenarios. - Inactive in 1920 and 1935 historical scenarios. - May be activated in 1920 and 1935 only by alternate_continuity_v1. - Ottoman Empire or Turkey remains a distinct AI-only power. - Ottoman Empire or Turkey never substitutes for this slot.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0009

- **Source:** [`DESIGN-04` Canonical Playable Slots](../docs/domain/playable-slots-and-nation-identity.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Uses an explicit scenario polity mapping. - Later starts may represent an approved successor continuity. - The successor mapping must be defined by scenario content. - It may not be inferred at runtime.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0010

- **Source:** [`DESIGN-04` Canonical Playable Slots](../docs/domain/playable-slots-and-nation-identity.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Every scenario contains: - ten canonical playable slot records; - twelve AI-only powers; - twenty-two scenario identity records. - Inactive playable slots remain present as explicit inactive records. - Only active or continuity-enabled slots may start a campaign.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0011

- **Source:** [`DESIGN-07` Numeric And Temporal Contract](../docs/architecture/numeric-and-temporal-contract.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Uses integer or fixed-point arithmetic. - Floating-point arithmetic is prohibited for authoritative outcomes. - Rendering may use floating point but cannot alter simulation state.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0012

- **Source:** [`DESIGN-07` Numeric And Temporal Contract](../docs/architecture/numeric-and-temporal-contract.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Every formula declares its rounding mode. - Financial debits round against the payer unless explicitly stated. - Construction completion never occurs before accumulated work reaches total work. - Classification and treaty checks use unrounded canonical values. - UI values may be rounded for display but must expose detailed breakdowns.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0013

- **Source:** [`DESIGN-09` Campaign Compilation](../docs/architecture/campaign-compilation.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Starting allocation is divided between: - completed commissioned ships; - ships already under construction. - Under-construction ships begin at the ruleset-defined legacy progress, nominally around 50%. - The setup charge for completed historical work uses the explicit legacy subsidy rule, nominally 5% of the value of completed work. - Subsidized historical work does not become future debt. - Remaining unfinished work is paid normally. - The compiler records: - full ship value; - historical work value; - setup charge; - subsidy; - remaining liability.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0014

- **Source:** [`DESIGN-10` Strategic Monthly Turn Pipeline](../docs/rules/strategic-turn.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Validate routes against current diplomacy. - Resolve one monthly movement edge or ruleset-defined movement allowance. - Resolve fuel, breakdown, and interdiction conditions. - Produce PostMovementSnapshot.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0015

- **Source:** [`DESIGN-10` Strategic Monthly Turn Pipeline](../docs/rules/strategic-turn.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Determine eligible battles. - Select forces through constraints. - Produce BattleEligibilitySnapshot.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0016

- **Source:** [`DESIGN-10` Strategic Monthly Turn Pipeline](../docs/rules/strategic-turn.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Player may fight or auto-resolve. - Apply tactical results immediately to participating assets. - A ship cannot enter a second battle unless explicitly allowed by the ruleset.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0017

- **Source:** [`DESIGN-10` Strategic Monthly Turn Pipeline](../docs/rules/strategic-turn.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Fill eligible command vacancies. - Update plans. - Generate non-authoritative recommendations.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0018

- **Source:** [`DESIGN-11` Command Model](../docs/architecture/command-model.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - AI uses the same command contracts as the player where practical. - Commands never mutate authoritative state directly. - Commands that become impossible during resolution produce explicit outcomes. - Cancellation is allowed only before the command's lock or irreversible phase. - Refunds and lost costs are defined by command type. - Automated actions also produce commands and audit records.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0019

- **Source:** [`DESIGN-12` Nations And Governments](../docs/domain/nations-and-governments.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Efficient shipbuilding: - Construction work completes 10% faster unless the ruleset defines an equivalent fixed work-rate implementation. - Undeveloped shipbuilding: - Construction completes 10% slower. - Increased probability of latent construction defects. - Global naval power: - Foreign-station obligation includes at least 10% of eligible tonnage. - Cramped accommodation is prohibited for applicable new construction. - Government may react to rival budget parity. - Cautious: - Alters AI operational risk tolerance. - Increases political consequences of major defeats for the player nation. - Poor education: - Reduces baseline crew and pilot quality. - Reduces research efficiency. - Surpri...
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0020

- **Source:** [`DESIGN-13` Economy And Accounting](../docs/rules/economy.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Canonical annual growth normally falls within approximately 3–5%. - Actual growth uses scenario, government, war, event, and ruleset modifiers. - Growth is applied at an explicit annual phase. - War and peace settlements may permanently change base resources.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0021

- **Source:** [`DESIGN-13` Economy And Accounting](../docs/rules/economy.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Treasury may not silently become negative. - Payments are reduced or deferred according to priority. - Unpaid eligible commitments become explicit arrears. - Construction receives progress only for paid work. - Insolvency can reduce: - institutional confidence; - fleet morale; - project progress; - readiness. - Persistent insolvency triggers political intervention.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0022

- **Source:** [`DESIGN-13` Economy And Accounting](../docs/rules/economy.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Treasury carries over. - Excessive surplus may trigger a political reclamation event. - Confiscation is an explicit event or ruleset rule, never an invisible mutation.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0023

- **Source:** [`DESIGN-13` Economy And Accounting](../docs/rules/economy.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Up to 12% of naval appropriation. - Spending above 10% receives diminishing marginal effectiveness. - Actual research progress is based on paid, not merely allocated, expenditure.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0024

- **Source:** [`DESIGN-13` Economy And Accounting](../docs/rules/economy.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Paid through completed work units. - Halted projects perform no construction work. - Halted projects incur half the mothballed maintenance equivalent or the ruleset's canonical preservation cost. - Accelerated projects: - cost 5% more total work-equivalent value; - receive a work-rate increase calibrated to approximately 10% faster completion; - can increase delay pressure on other construction.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0025

- **Source:** [`DESIGN-14` World Geography](../docs/domain/world-geography.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Stable identifier. - Adjacency. - Climate. - Strategic position. - Associated possessions. - Eligible battle templates. - Mine pressure by belligerent. - Operational reports.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0026

- **Source:** [`DESIGN-14` World Geography](../docs/domain/world-geography.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - A normal strategic movement traverses one eligible area edge per month unless a special rule grants additional movement. - Long routes are stored as planned paths. - Each monthly resolution advances the force to the next legal node. - Operational battle presence is derived from resolved movement. - A ship is never stored in two areas simultaneously.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0027

- **Source:** [`DESIGN-14` World Geography](../docs/domain/world-geography.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Suez is operational at applicable scenario starts unless scenario content overrides condition. - Panama is scheduled to become operational in 1914, subject to scenario event and condition rules. - Canal state includes: - legal owner; - military controller; - operating condition; - access policy; - mined or blocked state. - Transit is denied when: - the traveler is at war with the controlling authority; - bilateral tension with the controller is 7 or higher; - the canal is physically closed; - another explicit access restriction applies. - Ships already in transit use the ruleset's locked-route resolution.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0028

- **Source:** [`DESIGN-14` World Geography](../docs/domain/world-geography.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - The Baltic–Northern Europe route may be restricted against Germany's enemies after active mine-warfare capability exists and applicable wartime conditions are met. - Choke-point restrictions are explicit route predicates.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0029

- **Source:** [`DESIGN-15` Possessions And Territorial Control](../docs/domain/possessions-and-territorial-control.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Invasion normally changes military control. - Legal ownership changes through peace, event, or explicit annexation rule. - Income, access, and foreign-station obligation declare whether they use legal ownership, control, or both.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0030

- **Source:** [`DESIGN-15` Possessions And Territorial Control](../docs/domain/possessions-and-territorial-control.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Declines over time according to a ruleset-defined decolonization curve. - Government, local development, unrest, and events may alter the decline.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0031

- **Source:** [`DESIGN-15` Possessions And Territorial Control](../docs/domain/possessions-and-territorial-control.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Before 1920: - Oil access is required to construct oil-fueled ships. - Captured or foreign-built oil ships may be operated only if supply is available. - From 1920: - International oil access is normally assumed in peacetime. - Nations without domestic or controlled oil are more vulnerable to wartime shortage and blockade. - Oil discoveries before 1920 are seeded, explicit events. - Oil access, stockpile risk, and local supply are separate concepts.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0032

- **Source:** [`DESIGN-16` Bases And Infrastructure](../docs/rules/bases-and-infrastructure.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Limits the largest ship that can be built domestically. - May limit major repair or rebuild eligibility. - Expansion takes approximately one year unless modified. - Each expansion increases capacity by an era-defined 1,000–2,000 ton step. - Private industrial development may create explicit seeded expansion events.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0033

- **Source:** [`DESIGN-16` Bases And Infrastructure](../docs/rules/bases-and-infrastructure.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Limits total active construction work. - Submarine construction counts. - Rebuild and repair use separate repair/refit capacity where defined. - AMCs and designated small corvettes may be exempt according to ruleset. - Reserved, occupied, damaged, and available capacity are tracked separately.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0034

- **Source:** [`DESIGN-16` Bases And Infrastructure](../docs/rules/bases-and-infrastructure.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Uses a formal contract. - Limited by builder capability and capacity. - May transfer technology insight. - May be delayed or impounded by war. - A delivery-guarantee treaty prevents discretionary impoundment but not physical impossibility caused by occupation or destruction.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0035

- **Source:** [`DESIGN-17` Diplomacy](../docs/rules/diplomacy.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Exists between every pair of active powers. - Uses the canonical ruleset scale. - Tension 7 or higher blocks normal canal use controlled by the other nation. - Higher tension increases war risk. - Tension changes are recorded in a ledger with causes.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0036

- **Source:** [`DESIGN-17` Diplomacy](../docs/rules/diplomacy.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Reduce mutual tension. - Increase expected support in war. - Improve technology-sale availability and pricing. - Permit allied operational support where access exists. - May increase tension with rivals. - May be revoked in peace if relation conditions fail. - Are not revoked while both allies remain in the same active war. - An ally may seek separate peace through war-participant rules.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0037

- **Source:** [`DESIGN-17` Diplomacy](../docs/rules/diplomacy.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Hawkish responses may increase: - institutional confidence; - naval budget; - tension. - Dovish responses may reduce tension but can reduce confidence or budget. - Effects are explicit per event and never inferred from descriptive text.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0038

- **Source:** [`DESIGN-18` Politics, Confidence, And Unrest](../docs/rules/politics-confidence-and-unrest.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Replaces overloaded prestige as the dismissal variable. - Represents trust in naval administration. - A value at or below 16 creates dismissal risk. - Dismissal checks occur only during the terminal-evaluation phase. - Confidence changes through: - victories; - defeats; - fiscal management; - mandate compliance; - foreign-station compliance; - preparedness; - event choices. - Proportional losses use explicit ruleset formulas.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0039

- **Source:** [`DESIGN-18` Politics, Confidence, And Unrest](../docs/rules/politics-confidence-and-unrest.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Spendable resource used to influence or resist political decisions. - Spending political capital does not directly reduce institutional confidence. - May be used to: - reject a mandate; - negotiate requirements; - protect a project; - accelerate approval; - reduce political penalties.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0040

- **Source:** [`DESIGN-18` Politics, Confidence, And Unrest](../docs/rules/politics-confidence-and-unrest.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Separate from general unrest. - Initially may fall or stabilize at war outbreak. - Increases with duration, defeat, blockade, casualties, and shortages.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0041

- **Source:** [`DESIGN-18` Politics, Confidence, And Unrest](../docs/rules/politics-confidence-and-unrest.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Requires explicit eligibility and threshold conditions. - Less likely in liberal democracies. - May: - change government; - end or alter war participation; - impose harsh peace terms; - create successor states. - Revolution is not automatically terminal if a supported continuation exists.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0042

- **Source:** [`DESIGN-19` Strategic Objectives](../docs/domain/strategic-objectives.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Government assigns national objectives. - Player may influence priorities through political capital and event choices. - Objectives guide AI plans and final career evaluation.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0043

- **Source:** [`DESIGN-20` Research And Technology](../docs/rules/research-and-technology.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** 1. Calculate paid research resources. 2. Apply national and education modifiers. 3. Allocate by field priority. 4. Reallocate exhausted-field progress. 5. Advance eligible technologies. 6. Resolve deterministic discovery selection. 7. Apply discovery. 8. Create adoption, production, or refit requirements.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0044

- **Source:** [`DESIGN-21` Ship Design](../docs/rules/ship-design.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - A design based on an existing family receives study discounts while all ruleset similarity thresholds remain satisfied. - Similarity is lost when changes exceed limits including: - displacement increase greater than max(10%, 1,000 tons); - major main-gun change beyond ruleset allowance; - major secondary-gun change; - speed change over one knot; - vertical armor change over one inch; - horizontal armor change over half an inch.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0045

- **Source:** [`DESIGN-21` Ship Design](../docs/rules/ship-design.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Slight overweight may be accepted with explicit stability and flotation penalties. - Designs beyond the legal tolerance are rejected.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0046

- **Source:** [`DESIGN-22` Ship Classification](../docs/rules/ship-classification.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - DD - CL - B - CA - BC - BB - KE - AMC - CV - CVL - AV - SS - TR - MTB - Additional ruleset-defined types
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0047

- **Source:** [`DESIGN-22` Ship Classification](../docs/rules/ship-classification.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - DD: - Initially below 2,000 tons. - Speed above 19 knots. - Requires torpedoes. - Cannot carry qualifying armor. - Maximum displacement rises by technology to approximately 3,800 tons. - CL: - Initially above 2,000 and below 8,000 tons. - Speed above 16 knots. - Main guns normally no larger than 6 inches. - Protected-cruiser and missile-era exceptions require explicit technology. - B: - At least 5,000 tons. - Belt at least 6 inches. - Main guns over 6 inches. - Speed below 20 knots. - No more than two main turrets. - CA: - Above 4,000 tons. - Speed above 19 knots. - Belt above 2 and no more than 12 inches. - Main guns from 6 through 11 inches under canonical boundary rules. - BC: - Main gu...
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0048

- **Source:** [`DESIGN-22` Ship Classification](../docs/rules/ship-classification.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Rebuilds invoke classification again. - Era changes alone may trigger administrative reclassification where the ruleset explicitly requires it. - Classification cache must always match the current compiled design version.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0049

- **Source:** [`DESIGN-23` Construction, Repair, And Rebuild](../docs/rules/construction-repair-and-rebuild.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Starts only after design approval. - Up to twelve ships of one class may be ordered together. - Additional ships of an approved design need no new study unless the design is modified. - Progress equals paid effective work. - Delayed projects receive no work and no work charge that month. - Accelerated work costs 5% more and increases progress rate. - Excess acceleration can impose seeded capacity-pressure delays.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0050

- **Source:** [`DESIGN-23` Construction, Repair, And Rebuild](../docs/rules/construction-repair-and-rebuild.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Determined from: - builder quality; - national traits; - design complexity; - acceleration; - foreign-yard context. - Created at construction progression or completion through a stable stream. - Stored as hidden authoritative state. - May be discovered during trials, service, repair, or combat. - Repairability is defect-specific.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0051

- **Source:** [`DESIGN-23` Construction, Repair, And Rebuild](../docs/rules/construction-repair-and-rebuild.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Use one combined dockyard project where simultaneous. - Repair work, machinery work, armor work, armament work, electronics, and conversion are separate work packages. - Ships under major rebuild are unavailable. - Rebuild validation differs from new-construction validation. - Rebuild produces a new compiled design version. - Individual ships of the same named class may have different design versions.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0052

- **Source:** [`DESIGN-23` Construction, Repair, And Rebuild](../docs/rules/construction-repair-and-rebuild.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Cancels operational status. - May produce salvage credit. - Removes future maintenance. - Treaty-required scrapping follows treaty deadlines and inspection rules.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0053

- **Source:** [`DESIGN-24` Fleet Management](../docs/domain/fleet-management.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Active: - Highest routine availability and training. - Reserve: - Lower cost and reduced immediate effectiveness. - Mothballed: - Lowest cost, poor readiness, extended reactivation. - Working up: - Gains crew proficiency. - Cannot participate in normal battle generation. - Repair or rebuild: - Availability determined by project state.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0054

- **Source:** [`DESIGN-24` Fleet Management](../docs/domain/fleet-management.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Normally once per calendar year. - Participating ships pay twice active maintenance. - Improves crew and division experience. - Large exercises may increase tension. - Exercise availability and political effect are ruleset-driven.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0055

- **Source:** [`DESIGN-25` Deployment And Logistics](../docs/rules/deployment-and-logistics.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Each ship has one strategic area. - Divisions normally move together. - Illegal mixed-location divisions must be split or movement rejected.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0056

- **Source:** [`DESIGN-25` Deployment And Logistics](../docs/rules/deployment-and-logistics.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Calculated per area from possession obligations. - Global naval powers must maintain at least the required global percentage. - Only eligible active and foreign-station ships contribute. - Colonial-service ships contribute 1.5 times qualifying tonnage. - Cramped and short-range ships contribute less. - Requirements may be suspended during wartime blockade. - Newly acquired possessions receive a ruleset-defined grace period.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0057

- **Source:** [`DESIGN-25` Deployment And Logistics](../docs/rules/deployment-and-logistics.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Short-range ships cannot make normal strategic movement outside allowed adjacent home-area exceptions. - Blockaded nations cannot normally move ships out of relevant home/build areas except through authorized raider breakout or battle outcomes. - Fuel shortage may cancel movement or remove battle eligibility. - Coal ships are not affected by oil shortage.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0058

- **Source:** [`DESIGN-26` Divisions And Formations](../docs/domain/divisions-and-formations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Persistent campaign organization. - One to five ships. - Destroyer divisions may contain up to six. - Ships normally share type. - BB and B may mix. - CA may join BC divisions when allowed. - First ship is flagship. - Has commander and experience.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0059

- **Source:** [`DESIGN-26` Divisions And Formations](../docs/domain/divisions-and-formations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Battle-local projection. - Derived from permanent division where possible. - May be adjusted for availability, mission, or scenario needs. - Must preserve provenance to campaign assets.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0060

- **Source:** [`DESIGN-27` Officers And Personnel](../docs/domain/officers-and-personnel.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - True ability is authoritative but initially hidden. - Player sees an estimate and confidence. - Service time and battle experience improve revelation. - Estimates may remain uncertain.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0061

- **Source:** [`DESIGN-27` Officers And Personnel](../docs/domain/officers-and-personnel.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Normally evaluated after approximately five years in rank. - Can be automatic or manual. - Early manual promotion costs political capital or confidence according to rule. - Promotion may alter traits through explicit seeded outcomes. - Empty command slots may be filled by deterministic administrative automation.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0062

- **Source:** [`DESIGN-27` Officers And Personnel](../docs/domain/officers-and-personnel.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Requires technology and establishment project. - Produces more and somewhat better officers. - Has recurring cost.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0063

- **Source:** [`DESIGN-28` Crew, Training, And Morale](../docs/rules/crew-training-and-morale.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Gunnery: - Approximately 10% accuracy improvement. - Approximately 30% active-maintenance increase. - Night fighting: - Better night spotting and engagement. - Approximately 10% night accuracy improvement. - Approximately 20% maintenance increase. - Torpedo tactics: - Improves attack behavior and torpedo effectiveness. - Approximately 20% maintenance increase. - Damage control: - Improves firefighting and flooding control. - Approximately 20% maintenance increase.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0064

- **Source:** [`DESIGN-29` Intelligence And Knowledge](../docs/architecture/intelligence-and-knowledge.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Initially may reveal type and estimated displacement. - Completed ships may reveal: - type; - displacement estimate; - weapon count and caliber estimate; - speed estimate. - Official figures may be false. - Additional attributes require intelligence or observation.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0065

- **Source:** [`DESIGN-29` Intelligence And Knowledge](../docs/architecture/intelligence-and-knowledge.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - May contain: - position error; - strength error; - identification error; - delivery delay. - Reports never overwrite true state.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0066

- **Source:** [`DESIGN-29` Intelligence And Knowledge](../docs/architecture/intelligence-and-knowledge.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Research insight. - Technology acquisition. - Enemy-ship information. - War-plan warning. - Better battle avoidance. - Improved wartime ASW. - Detection may create diplomatic incidents and tension.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0067

- **Source:** [`DESIGN-30` Treaties](../docs/rules/treaties.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Noncompliant ships under construction at signing are cancelled or scrapped according to terms. - Existing completed ships may remain unless a clause requires disposal. - Existing ships may be modernized within rebuild restrictions. - Liberal democracies must comply strictly unless a scenario rule overrides. - Other governments may declare up to 10% less displacement where cheating is permitted. - Main-caliber cheating is prohibited.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0068

- **Source:** [`DESIGN-31` War And Peace](../docs/rules/war-and-peace.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - A nation may participate in multiple wars if rules permit. - War identities do not automatically merge. - Participant membership records alliance and side context.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0069

- **Source:** [`DESIGN-31` War And Peace](../docs/rules/war-and-peace.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Large score advantage increases peace eligibility. - Peace offers are explicit negotiation objects. - Player choices influence acceptable terms and political consequences.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0070

- **Source:** [`DESIGN-31` War And Peace](../docs/rules/war-and-peace.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - May contain: - resource adjustment; - possession transfer; - occupation recognition; - ship transfer; - reparations; - shipbuilding restrictions; - treaty obligations. - Terms are validated and applied atomically. - Allies receive claims according to contribution, objectives, and negotiated priority. - Unused claim value may become a smaller base-resource gain.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0071

- **Source:** [`DESIGN-31` War And Peace](../docs/rules/war-and-peace.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - May force harsh terms. - Uses explicit revolution and peace logic. - Is not an arbitrary direct mutation.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0072

- **Source:** [`DESIGN-32` Blockade](../docs/rules/blockade.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Derived from eligible naval strength in relevant enemy home/build areas. - Ship types use ruleset-defined weights. - Nation modifiers apply: - United Kingdom example: 1.2. - Russia example: 0.7. - Damage, supply, readiness, and mission modify effective strength.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0073

- **Source:** [`DESIGN-32` Blockade](../docs/rules/blockade.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Normally requires at least 110% of defending eligible strength. - Uses PostBattleSnapshot. - May require establishment persistence or explicit ruleset duration.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0074

- **Source:** [`DESIGN-32` Blockade](../docs/rules/blockade.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Russia may be blockaded from Northern Europe under the canonical route rule.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0075

- **Source:** [`DESIGN-33` Trade, Raiding, And Merchant Shipping](../docs/rules/trade-raiding-and-merchant-shipping.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** Eligible Missions:
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0076

- **Source:** [`DESIGN-33` Trade, Raiding, And Merchant Shipping](../docs/rules/trade-raiding-and-merchant-shipping.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Cannot be short range. - Long range and speed improve effectiveness. - Can be intercepted. - Damage may cause scuttling or internment. - Fuel and machinery reliability affect endurance. - Raiders have little or no economic effect against an already effectively blockaded enemy.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0077

- **Source:** [`DESIGN-33` Trade, Raiding, And Merchant Shipping](../docs/rules/trade-raiding-and-merchant-shipping.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Require technology. - Permit eligible AMCs to surprise submarines.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0078

- **Source:** [`DESIGN-34` Submarines](../docs/rules/submarines.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Better remote efficiency. - Slightly greater ASW vulnerability where specified.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0079

- **Source:** [`DESIGN-34` Submarines](../docs/rules/submarines.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Nominal optimum approximately 2–5. - Calm conditions increase detection risk. - Heavy conditions impair observation and attack.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0080

- **Source:** [`DESIGN-35` Mine Warfare](../docs/rules/mine-warfare.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Eligible ships generate regional sweeping value. - Dual ASW/mine equipment reduces both capabilities according to ruleset. - Sweeping reduces mine pressure and battle-mine generation.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0081

- **Source:** [`DESIGN-35` Mine Warfare](../docs/rules/mine-warfare.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Damage or loss. - Route risk. - Defensive standoff. - Battle hazards. - Reports that may misidentify mines as torpedo attacks.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0082

- **Source:** [`DESIGN-35` Mine Warfare](../docs/rules/mine-warfare.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Mines decay according to type and time. - Post-war mines remain until decay or clearance where applicable. - Ownership change does not automatically remove minefields. - Friendly-fire risk is possible where knowledge is incomplete.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0083

- **Source:** [`DESIGN-36` Amphibious Operations](../docs/rules/amphibious-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Target within national invasion range. - Valid staging port. - Sufficient transports. - Sufficient local naval strength. - Required preparation complete. - Blockade and supply rules permit launch.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0084

- **Source:** [`DESIGN-36` Amphibious Operations](../docs/rules/amphibious-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Measured between eligible friendly and target ports. - Technology modifies range. - Global naval power and surprise-attack traits may improve first-war-year range. - Blockade reduces range.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0085

- **Source:** [`DESIGN-36` Amphibious Operations](../docs/rules/amphibious-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Naval superiority increases launch probability. - Amphibious technology improves preparation and launch reliability. - A failed launch check does not erase preparation but may create delay or political cost.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0086

- **Source:** [`DESIGN-36` Amphibious Operations](../docs/rules/amphibious-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Transports must be escorted to the objective. - More than marginal victory normally succeeds. - Failure can cause transport, confidence, and war-score losses.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0087

- **Source:** [`DESIGN-36` Amphibious Operations](../docs/rules/amphibious-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Successful invasion establishes military control. - Legal ownership normally remains until settlement.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0088

- **Source:** [`DESIGN-36` Amphibious Operations](../docs/rules/amphibious-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Not available before 1935. - Requires eligible government and scenario conditions. - Most likely near war opening. - Uses an explicit operation and cannot transfer possession without resolution.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0089

- **Source:** [`DESIGN-37` Battle Generation](../docs/rules/battle-generation.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - fleet_battle - cruiser_battle - coastal_raid - convoy_attack - convoy_defense - invasion - raider_interception - blockade_breakout - carrier_action - ruleset-defined variants
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0090

- **Source:** [`DESIGN-37` Battle Generation](../docs/rules/battle-generation.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** 1. Determine mission opportunity. 2. Determine participating sides. 3. Create force requirements. 4. Gather eligible assets. 5. Preserve permanent divisions where possible. 6. Assign mandatory roles. 7. Add optional assets by weighted deterministic selection. 8. Add allied support. 9. Instantiate coastal, submarine, mine, and air elements. 10. Validate force reachability and legality. 11. Repair generated composition where allowed. 12. Reject irreparable engagement. 13. Canonicalize battle manifest. 14. Assign battle seed. 15. Present estimate according to intelligence.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0091

- **Source:** [`DESIGN-37` Battle Generation](../docs/rules/battle-generation.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Battles may be: - optional; - politically expected; - operationally unavoidable. - Declining can affect: - war score; - institutional confidence; - objectives. - Consequences depend on mission and obligation, not only decline count.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0092

- **Source:** [`DESIGN-37` Battle Generation](../docs/rules/battle-generation.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Allied or non-player friendly forces may participate. - Their information and command remain limited. - They obey their own AI and command structure.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0093

- **Source:** [`DESIGN-38` Tactical Combat](../docs/rules/tactical-combat.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Discrete one-minute authoritative turns. - Rendering may interpolate smoothly. - Commands are quantized to authoritative tactical time.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0094

- **Source:** [`DESIGN-38` Tactical Combat](../docs/rules/tactical-combat.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Admiral: - Player commands lead divisions. - No direct manual targeting. - Rear Admiral: - Player commands divisions within command reach. - Division target orders allowed. - Captain: - Player may command any friendly division. - Ship targeting and manual torpedo fire allowed. - Realism mode does not alter raw war score. - Any realism bonus or penalty applies only to final career evaluation.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0095

- **Source:** [`DESIGN-38` Tactical Combat](../docs/rules/tactical-combat.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Requires technology. - Reverses course and division order. - May create command confusion.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0096

- **Source:** [`DESIGN-39` Gunnery](../docs/rules/gunnery.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Approximately 10% higher normal rate of fire. - Approximately 30% rapid-fire improvement after straddling. - Approximately 25% heavier. - Improved AA performance where applicable.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0097

- **Source:** [`DESIGN-39` Gunnery](../docs/rules/gunnery.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Approximately 25% heavier. - Serve surface and AA roles.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0098

- **Source:** [`DESIGN-39` Gunnery](../docs/rules/gunnery.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Belt maximum 20 inches. - Turret maximum 26 inches. - Armor above 12 inches receives reduced proportional effectiveness according to manufacturing rules. - Armor of 2 inches or more protects against qualifying splinters.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0099

- **Source:** [`DESIGN-40` Torpedoes](../docs/rules/torpedoes.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Normally automated by tactical AI. - Captain mode permits manual launch. - Underwater tubes cannot fire above 25 knots.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0100

- **Source:** [`DESIGN-40` Torpedoes](../docs/rules/torpedoes.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Major flotation damage. - Progressive flooding. - Machinery damage. - Turret or system loss. - Underwater-tube hits can cause severe flooding.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0101

- **Source:** [`DESIGN-41` Damage, Fire, And Flooding](../docs/rules/damage-fire-and-flooding.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** 1. Determine hit location. 2. Resolve armor interaction. 3. Apply local component damage. 4. Apply structure and flotation contribution. 5. Create immediate fire or flooding. 6. Resolve secondary hazards. 7. Update performance. 8. Enter terminal state where applicable.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0102

- **Source:** [`DESIGN-41` Damage, Fire, And Flooding](../docs/rules/damage-fire-and-flooding.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Reduces speed and stability. - Lower speed improves control. - Approximately 10 knots is normally a safe target for controlling serious flooding. - High speed with major flooding increases loss risk.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0103

- **Source:** [`DESIGN-41` Damage, Fire, And Flooding](../docs/rules/damage-fire-and-flooding.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Damages superstructure and systems. - Reduces rate of fire. - Obstructs carrier operations. - Increases nighttime visibility. - Generates smoke. - Carriers, transports, AMCs, AVs, and pre-dreadnoughts have higher risk. - Aluminum superstructure saves approximately 10% hull weight but increases fire vulnerability.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0104

- **Source:** [`DESIGN-41` Damage, Fire, And Flooding](../docs/rules/damage-fire-and-flooding.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Mission-killed ships may still float. - Sinking ships may remain afloat for hours. - Stabilized ships may survive. - Abandoned ships may be scuttled, captured, or recovered. - Sinking credit and VP timing use explicit battle rules.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0105

- **Source:** [`DESIGN-41` Damage, Fire, And Flooding](../docs/rules/damage-fire-and-flooding.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Rescue may provide battle score. - Requires eligible friendly ships and acceptable enemy threat.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0106

- **Source:** [`DESIGN-42` Weather, Visibility, And Smoke](../docs/rules/weather-visibility-and-smoke.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Eligible DD and CL ships may generate up to approximately five minutes. - Requires approximately twenty minutes before reuse. - Affects all fire through the screen.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0107

- **Source:** [`DESIGN-42` Weather, Visibility, And Smoke](../docs/rules/weather-visibility-and-smoke.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Light cruisers may carry approximately three to five smoke floats. - Later technology replaces floats with generators.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0108

- **Source:** [`DESIGN-43` Aircraft](../docs/rules/aircraft.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Player requests one proposal at a time. - Selects role and two emphasized traits. - Development normally takes three to six months. - Private ventures may create purchasable proposals. - Proposals and results are deterministic from campaign state and stream.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0109

- **Source:** [`DESIGN-43` Aircraft](../docs/rules/aircraft.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Auto-equip only when models and inventory are available. - Re-equipment lowers temporary experience. - Large expansion dilutes experience. - Damaged aircraft count against physical basing capacity until removed or repaired.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0110

- **Source:** [`DESIGN-43` Aircraft](../docs/rules/aircraft.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Fighters: - CAP and escort. - Torpedo bombers: - Torpedo or bomb attack. - Dive bombers: - Accurate ship attack with lower bomb penetration. - Medium bombers: - Level, skip, torpedo, guided-weapon, or missile attack as technology allows. - Patrol aircraft: - Long-range scouting and strategic ASW. - Floatplanes: - Local scouting and ASW. - Without catapult, launch may require ship to stop. - Airships: - Long-range early scouting. - High weather sensitivity. - Jets: - Require appropriate carrier and deck technology. - Helicopters: - ASW, radar extension, and modern utility roles.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0111

- **Source:** [`DESIGN-44` Carrier Operations](../docs/rules/carrier-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - CVL: 4–34 aircraft. - CV: above 34 aircraft. - Carriers above 100 aircraft suffer reduced operating efficiency and increased cost. - Jet aircraft may consume 1.5 capacity according to type and carrier size. - Capacity rounding is deterministic per aircraft assignment.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0112

- **Source:** [`DESIGN-44` Carrier Operations](../docs/rules/carrier-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Normally approximately half aircraft capacity. - Modified by: - catapults; - speed; - deck configuration; - damage; - technology. - Carriers below 24 knots have reduced spot value.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0113

- **Source:** [`DESIGN-44` Carrier Operations](../docs/rules/carrier-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Normally requires: - 40,000 tons; - or 30,000 tons with steam catapults. - Heavy jets require jet-capable carriers. - Angled deck is required for applicable heavy-jet operations.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0114

- **Source:** [`DESIGN-44` Carrier Operations](../docs/rules/carrier-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Spot and launch normally requires approximately 20–30 minutes. - Coordinated strikes take longer but improve survival and cohesion. - A strike larger than current spot value cannot launch.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0115

- **Source:** [`DESIGN-44` Carrier Operations](../docs/rules/carrier-operations.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Fueled and armed aircraft increase fire and explosion risk. - Night recovery causes severe operational-loss risk. - Weather may suspend operations.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0116

- **Source:** [`DESIGN-45` Air Defense](../docs/rules/air-defense.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Heavy AA engages aircraft attacking own or nearby ships. - Medium AA engages before release against applicable attacks. - Light AA timing depends on aircraft speed and attack profile. - Light AA always has an opportunity to disrupt where eligible. - Up to four AA directors provide normal scaling. - More than four radar-directed medium-AA groups have diminishing returns. - More than eight are mostly redundant. - More than six CIWS systems are strongly redundant; approximately four is normally sufficient.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0117

- **Source:** [`DESIGN-46` Radar, Electronics, And Electronic Warfare](../docs/rules/radar-electronics-and-ew.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Search radar detects contacts in poor visibility. - Fire-control radar improves gunnery. - Fire-control radar level 3 enables blind fire against qualifying radar tracks. - Radar contacts remain less identified than visual contacts.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0118

- **Source:** [`DESIGN-46` Radar, Electronics, And Electronic Warfare](../docs/rules/radar-electronics-and-ew.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - All ships may carry radar through level 2 when technology permits. - Higher levels require available design space. - Radar sets are produced as inventory. - Automatic installation prioritizes larger active ships. - Manual installation makes the ship unavailable for the current month.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0119

- **Source:** [`DESIGN-46` Radar, Electronics, And Electronic Warfare](../docs/rules/radar-electronics-and-ew.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Early radar may malfunction. - Can be disabled by damage or own gunfire. - Reliability improves with technology.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0120

- **Source:** [`DESIGN-47` Missiles](../docs/rules/missiles.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Requires technology. - Allows attacks on contacts held by another unit. - Uncertain reports reduce accuracy and may increase misidentification risk.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0121

- **Source:** [`DESIGN-47` Missiles](../docs/rules/missiles.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Anti-ship missiles act as large explosive or semi-armor-piercing weapons. - Cause: - structure damage; - fire; - sensor damage; - superstructure damage. - Special missile torpedoes and diving missiles use their dedicated damage rules.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0122

- **Source:** [`DESIGN-51` UI And Player Interaction](../docs/architecture/ui-and-player-interaction.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Repairs. - Radar installation. - Officer assignment. - Squadron re-equipment. - Ship naming. - Trade protection. - Foreign stations. - Division replacement. - Scrapping recommendations. - Research reallocation. - Inventory replenishment. - Automation produces auditable commands. - Player may lock assets against automation where permitted.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0123

- **Source:** [`DESIGN-52` Save, Load, Replay, And Persistence](../docs/architecture/persistence-and-replay.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Stores authoritative state. - Derived projections may be rebuilt. - RNG stream state or deterministic derivation position is persisted. - Every individual compiled design is stored or content-addressed. - Save files do not depend on untracked external design files.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0124

- **Source:** [`DESIGN-55` Release Scope And Implementation Order](../docs/delivery/release-scope-and-implementation-order.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Later-era content may exist in the canonical pack before its tactical system is complete, but no scenario is declared fully supported until all required systems for its expected era pass acceptance.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0125

- **Source:** [`DESIGN-56` Final Career Evaluation](../docs/acceptance/final-career-evaluation.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Institutional-confidence history. - Achievement of national objectives. - Wars and peace outcomes. - Fleet readiness. - Budget discipline. - Technology position. - Merchant protection. - Territorial protection or expansion. - Officer and crew development. - Fleet modernization. - Legacy fleet quality. - Starting national difficulty. - Tactical realism modifier where applicable.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

## OPEN-0126

- **Source:** [`DESIGN-56` Final Career Evaluation](../docs/acceptance/final-career-evaluation.md)
- **Audit classification:** Potential vague, conditional, approximate, or ruleset-dependent requirement
- **Source text:** - Campaign timeline. - Major decisions. - Fleet evolution. - Wars. - Territorial changes. - Technology milestones. - Financial record. - Political record. - Officer legacy. - Surviving and lost ships. - Final objective evaluation. - Relative career rating.
- **Required disposition:** Clarify, bind to a named contract or ruleset field, mark as BALANCE TARGET, or close with rationale.

