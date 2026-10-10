Now that the opening roster is production-ready, the next milestone should be a nation-specific naval identity system. Do not begin by manually creating many ships. First build the rules and content pipeline that allow each playable nation to produce historically recognizable ships without duplicating the entire component catalog.

Rule the Waves 3 uses national characteristics to influence construction, research, defects, operational obligations, and tactical behavior. That is a useful design principle for your game: nations should differ through capabilities and preferences, not only through renamed ships.

Recommended next milestone
National Naval Identity and Ship Catalog

Build it in this order:

Nation doctrine and industrial profiles
Shared component families
Nation-specific component variants
Nation-specific reference designs
AI procurement doctrine
Historical validation and balance matrices
Nation-select and shipyard UX

This order avoids a common failure mode: creating dozens of historically named ship parts first, then discovering that the engine cannot express why one nation would prefer or produce them.

1. Define each nation’s naval identity

Create one versioned profile per playable nation. A profile should affect legal designs, component performance, industrial outcomes, AI preferences, and starter fleets.

A useful domain model is:

NationNavalProfile
├── nationId
├── activeFrom
├── activeUntil
├── strategicSituation
├── industrialProfile
├── doctrineProfile
├── researchPreferences
├── constructionModifiers
├── componentAccess
├── componentVariants
├── designPreferences
├── procurementPolicy
├── namingPolicy
└── sourceReferences

Separate hard capabilities from soft preferences

This distinction is essential.

Hard capability

A nation cannot use something because it lacks the technology, industry, facilities, license, or content access.

Examples:

maximum gun caliber;
gun-quality level;
maximum armor-plate thickness;
available armor material;
domestic torpedo diameter;
boiler or engine type;
turret mount types;
dock capacity;
available hull forms.
Soft preference

A nation can build something but usually chooses another solution.

Examples:

favor speed over armor;
favor many medium secondary guns;
place higher value on long range;
prefer larger armored cruisers;
tolerate cramped accommodation;
avoid risky machinery;
prioritize colonial-service capability;
prefer torpedo armament on cruisers.

Soft preferences should primarily guide templates, AI design evaluation, and procurement. They should not become arbitrary blockers.

1. Work with national archetypes before individual ships

For the pre-dreadnought era, I recommend defining each nation across eight axes.

Strategic posture

Choose one or two primary postures:

battle-fleet concentration;
commerce defense;
commerce raiding;
colonial presence;
coastal defense;
short-range regional warfare;
distant-water operations;
torpedo warfare.
Industrial capability

Represent:

annual shipbuilding capacity;
build-time modifier;
cost modifier;
maximum practical displacement;
dock-size progression;
heavy-gun production;
armor-plate production;
machinery reliability;
construction-quality variability.

For game balance, keep ordinary national cost and build-time modifiers relatively restrained, usually within approximately ±5% to ±15%. Larger differences can overwhelm player design decisions. Rule the Waves 3, for comparison, describes efficient and undeveloped shipbuilding traits through roughly 10% construction-time differences.

Gunnery doctrine

Represent:

preferred engagement distance;
main-gun emphasis;
secondary-battery emphasis;
gun-quality priorities;
ammunition allocation;
rate-of-fire preference;
armor-piercing versus high-explosive preference;
fire-control research priority.
Protection doctrine

Represent:

belt versus protected-deck preference;
favored armor coverage;
protection of secondary batteries;
conning-tower protection;
stability margin;
survivability versus speed preference.
Propulsion doctrine

Represent:

preferred speed margins;
machinery type;
reliability tolerance;
coal endurance;
forced-draught acceptance;
machinery compactness;
domestic versus imported machinery.
Torpedo doctrine

Represent:

torpedo priority;
preferred tube count;
above-water or submerged mounting;
use on cruisers;
use on capital ships;
torpedo-boat procurement intensity.
Global obligations

Represent:

foreign-station tonnage;
endurance requirements;
accommodation requirements;
colonial-service capability;
number of overseas operating regions.

The official manual describes foreign stations, movement, maintenance, trade protection, raiding, and related strategic obligations as interconnected parts of fleet management. National design identity should therefore reflect where ships operate, not just how they fight.

Risk tolerance

Represent:

willingness to use unproven components;
minimum reliability;
acceptable stability margin;
tolerance for overweight construction;
preferred technological maturity;
refit frequency.
3. Use shared components plus national variants

Do not duplicate every component once per nation.

Instead, use three layers.

Layer 1: universal component family

Examples:

naval_gun_4_in
naval_gun_6_in
naval_gun_9_2_in
naval_gun_12_in
triple_expansion_engine
water_tube_boiler
harvey_armor
krupp_armor
torpedo_18_in

The family defines common behavior and interfaces.

Layer 2: national model

Examples:

GB_BL_6in_MkII
FR_Canon_1647_Mle1887
DE_SK_L40_15cm
US_6in_Mk4
JP_6in_Elswick_pattern

A national model may modify:

weight;
muzzle velocity;
penetration;
shell weight;
rate of fire;
reliability;
cost;
manufacturing time;
ammunition capacity;
mount compatibility;
introduction and retirement dates.
Layer 3: mount or installation

Keep the weapon separate from its installation:

GunModel
GunMount
Turret
Casemate
ShieldedDeckMount
AmmunitionPattern

A 6-inch gun in a casemate should not behave identically to the same gun in a turret or deck mount. Separate modeling gives you national differences without producing one enormous component entity.

1. Introduce provenance for every national item

Your merchant-liner work established a good evidence discipline. Apply it to ships and parts.

Every historical component should include:

sourceStatus:
  VERIFIED
  DERIVED
  ESTIMATE
  PLACEHOLDER

sources:

- title
- author
- year
- page
- archiveOrUrl
- accessedAt

derivation:
  sourceValue
  sourceUnit
  conversion
  gameValue
  roundingRule

confidence:
  HIGH
  MEDIUM
  LOW

Also distinguish:

historical fact, such as caliber or nominal speed;
game conversion, such as cost points;
balance adjustment, such as reducing an advantage for competitive parity.

Do not present balance changes as historical measurements.

1. Create representative ships, not every historical class

For the first national-content pass, create six reference designs per nation, one for each opening type:

B pre-dreadnought battleship
CA armoured cruiser
CL protected cruiser
DD torpedo boat or early destroyer
KE corvette or colonial gunboat
AMC armed merchant cruiser

However, nations should not receive artificially equal fleets. A nation may have:

a strong B and weak CA;
an excellent CA and inexpensive colonial KE;
advanced torpedo craft but limited heavy guns;
superior long-range cruisers but slower capital-ship construction.

The reference designs are starting points for players and baselines for AI procurement. They should not be locked “hero units.”

Recommended content volume

For the first pass:

6 reference designs per nation
8–15 national component variants per nation
3–5 doctrine modifiers per nation
2–4 industrial modifiers per nation
1 procurement policy per nation
1 naming dataset per nation

With eight playable nations, that produces approximately:

48 reference designs;
64–120 national component variants;
eight doctrine profiles;
eight procurement profiles.

That is already a substantial, testable milestone. Avoid creating hundreds of parts before validating two contrasting nations end to end.

1. Start with two contrasting vertical slices

Do not implement all playable nations simultaneously. Start with two nations that create clearly different fleets.

A strong pairing would be:

Britain-style global naval power

Design identity:

strong shipbuilding capacity;
substantial foreign-station obligation;
high endurance;
reliable machinery;
broad component availability;
balanced battleships;
numerous cruisers;
colonial gunboats;
expensive global commitments.
France-style continental and commerce-war power

Design identity:

greater emphasis on armored cruisers and torpedo forces;
experimental or unconventional layouts where supported;
strong commerce-raiding potential;
different protection and secondary-battery preferences;
fleet composition less centered on copying British battle-line proportions.

The goal is not to add arbitrary bonuses. It is to prove that the same six hull categories produce recognizably different fleets through doctrines, components, constraints, and AI choices.

After this vertical slice works, expand to other nations.

1. Add national design scoring for the AI

Ship legality alone will not create national identity. AI design and procurement must value ships differently.

Use a weighted utility model:

designScore =
    firepowerScore * doctrine.firepowerWeight

- protectionScore * doctrine.protectionWeight
- speedScore * doctrine.speedWeight
- enduranceScore * doctrine.enduranceWeight
- torpedoScore * doctrine.torpedoWeight
- reliabilityScore * doctrine.reliabilityWeight
- colonialScore * doctrine.colonialWeight

- costPenalty
- buildTimePenalty
- instabilityPenalty
- obsolescencePenalty

Then apply role-specific weights. A nation’s preference should not cause every ship type to use the same balance.

For example:

Global-power CL:
  endurance       1.40
  colonial value  1.25
  reliability     1.20
  speed           1.10
  raw firepower   0.90

Regional torpedo DD:
  torpedo power   1.45
  speed           1.30
  cost efficiency 1.20
  endurance       0.75

Good ship design is fundamentally role-specific because guns, armor, speed, range, displacement, and budget compete with each other. A national AI should therefore pursue focused role-appropriate designs rather than universal bonuses.

Add bounded randomness

Without variation, every AI campaign will reproduce the same classes.

Use controlled variation of approximately ±5% to ±10% around doctrine weights, seeded by campaign ID. This creates different designs while preserving national character and determinism.

1. Model foreign procurement and licensed components

The pre-dreadnought era should not imply that every nation manufactured every component domestically.

Your component-access model should support:

DOMESTIC
LICENSE_BUILT
IMPORTED
CAPTURED_OR_STUDIED
UNAVAILABLE

These statuses can affect:

purchase price;
delivery time;
replacement availability;
wartime supply risk;
reliability;
refit compatibility;
political dependencies;
export restrictions.

This is especially important for nations that historically purchased complete ships, guns, armor, or machinery from foreign yards.

Avoid permanently assigning imported components as a national weakness. Procurement availability should depend on diplomatic relations, war status, date, and domestic-development progress.

1. Build a national content validation matrix

Each nation needs automated validation beyond “the YAML parses.”

Required nation-profile tests

Test that:

all referenced components exist;
availability dates are internally consistent;
retirement dates follow introduction dates;
every opening ship type has either a legal starter or an explicit national exception;
starter designs compile under that nation’s 1880 conditions;
no starter uses foreign components without a valid procurement relationship;
AI procurement can construct an affordable initial fleet;
industrial capacity can physically build the starter designs;
national modifiers do not bypass global classification rules;
component variants stay inside reasonable balance bounds;
source labels are present;
no PLACEHOLDER reaches release content.
Recommended comparative tests

Create a scenario matrix:

Nation × Ship type × Year × Budget band

Initially:

2 nations × 6 ship types × 3 years × 3 budgets
= 108 generated-design scenarios

Use 1880, 1885, and 1890 with low, standard, and high naval budgets.

For each generated design, verify:

legal classification;
no blocking findings;
within budget;
buildable by available dock;
role requirements satisfied;
deterministic output for the same seed;
meaningful difference between the two national profiles.
10. Add national differentiation to the UI

The shipyard should explain national identity without implying that the player is forced to follow history.

For each nation, show:

naval doctrine summary;
industrial strengths;
industrial limitations;
preferred components;
imported or license-built components;
global obligations;
starter-fleet philosophy.

When selecting a component, explain national status:

Domestic model
Reliable and readily available
Standard cost and construction time

Imported model
Higher cost and replacement risk
Availability depends on diplomatic relations

Experimental domestic model
Improved performance
Higher fault and delay risk

For reference designs, distinguish:

Historical inspiration
National doctrine template
Player-created design

Do not call a fictional class historical merely because its parameters resemble period ships.

 1. Recommended implementation phases
Phase 1: national-profile infrastructure

Deliver:

schema and domain entity;
date-banded profile resolution;
hard capability versus soft preference separation;
source metadata;
content-pack validation;
deterministic modifier composition.
Phase 2: two-nation vertical slice

Deliver:

two full national profiles;
12 reference designs;
approximately 20 national component variants;
AI design scoring;
procurement behavior;
comparative tests.
Phase 3: remaining playable nations

Add nations in small batches of two. For each batch:

research;
content implementation;
starter designs;
AI behavior;
balance comparison;
visual and naming content.
Phase 4: foreign procurement

Deliver:

imported and licensed equipment;
diplomatic availability;
wartime restrictions;
cost and reliability consequences;
player-facing provenance.
Phase 5: national shipyard UX and balancing

Deliver:

doctrine overview;
national component filtering;
comparison tools;
auto-design explanation;
generated-fleet simulations;
cross-nation balance report.
12. What I recommend you do immediately

The next concrete task should be:

Implement the national naval profile system and complete two contrasting playable nations end to end, including components, six opening reference designs each, AI design preferences, procurement policy, provenance, and comparative validation.

Do not push or open the PR yet if you intend to start this work immediately on the same branch. The current three commits form a clean, independently reviewable milestone. My preferred workflow would be:

push dev;
open a PR into main for the completed opening-roster work;
create a new branch from dev or updated main, such as:
feat/national-naval-identities

build the two-nation vertical slice there.

This prevents the finished 62-file opening-roster milestone from becoming entangled with a much larger national-content initiative.

Suggested prompt for the next coding pass
Implement the national naval identity foundation for the pre-dreadnought
shipbuilding system.

Begin with two contrasting playable nations as complete vertical slices.
Before changing code, inspect the existing nation, content-pack, technology,
ship-design, construction, AI-procurement, campaign-start and persistence
systems.

Create a platform-independent, date-banded NationNavalProfile model that
separates hard capabilities from soft doctrine preferences. Each profile must
support industrial capability, research priorities, construction modifiers,
component access, national component variants, design preferences,
procurement policy, naming policy and source provenance.

Use shared component families with nation-specific models. Do not duplicate
the full component catalog per nation. Separate gun models from mounts,
turrets, casemates and ammunition patterns.

For each of the two nations, deliver:

- one researched naval profile;
- six legal 1880 opening reference designs: B, CA, CL, DD, KE and AMC;
- approximately 8–15 meaningful national component variants;
- role-specific AI design weights;
- an AI procurement policy;
- deterministic campaign-seeded variation;
- player-facing explanations of national strengths and constraints;
- source and confidence metadata for historical content.

National identity must influence AI evaluation and procurement, not merely
names, icons or flat bonuses. Global ship-classification rules remain
authoritative and cannot be bypassed by national modifiers.

Add validation for:

- component references and date ranges;
- national access and foreign procurement;
- legal starter designs;
- dock and industrial feasibility;
- affordability;
- deterministic generation;
- role satisfaction;
- provenance completeness;
- comparative differentiation between the two nations;
- absence of release placeholders.

Generate a Nation × Ship Type × Year × Budget validation matrix using 1880,
1885 and 1890 with low, standard and high budgets.

Preserve Electron security and the existing domain/application boundaries.
Do not commit, push, stage, reset, restore, stash or discard changes unless
explicitly instructed.

Run the full validation gate and report exact commands, test counts, results,
files changed, historical assumptions, balance decisions, remaining
limitations and a suggested Conventional Commit message.

The most important design principle for the next stage is simple: a nation should be recognizable from the fleet it builds even if every ship name and flag is hidden.
