# Campaign Flow

The game is a naval strategy game covering 1880 to 1970. Immediately after the player chooses a nation, your clone should not drop them straight into the strategic dashboard. It should guide them through a compact **campaign commissioning flow**, then present a readable “first day as Grand Admiral” briefing.

Rule the Waves 3 supports campaign starts in **1880, 1900, 1920, and 1935**, monthly strategic turns, variable fleet sizes, research development, political tensions, fleet construction, and tactical battles.

## Recommended starting flow

```text
Choose Nation
    ↓
Nation Confirmed
    ↓
Choose Starting Era
    ↓
Choose Campaign Scale
    ↓
Configure Historical Uncertainty
    ↓
Select Starting Fleet Method
    ↓
Name Admiral and Campaign
    ↓
Review Commissioning Brief
    ↓
Generate World and Fleets
    ↓
Opening Strategic Briefing
    ↓
Main Strategic Dashboard
    ↓
Guided First Month
```

---

## 1. Nation confirmation screen

After the flag or nation card is selected, transition to a full-screen **Naval Appointment** presentation.

### What the player sees

#### Header

> **You have been appointed First Sea Lord**  
> **United Kingdom, January 1880**

Adapt the title to the nation:

- United Kingdom: First Sea Lord
- United States: Chief of Naval Operations or Secretary’s Naval Adviser
- Germany: State Secretary of the Imperial Naval Office
- France: Chief of the Naval General Staff
- Japan: Chief of the Imperial Japanese Navy General Staff
- Italy: Chief of Staff of the Regia Marina
- Russia: Chief of the Naval Staff
- Austria-Hungary: Marinekommandant
- Spain: Chief of the Naval General Staff
- China: Imperial Naval Commissioner

You do not need perfect historical titles for every period. The product goal is to make the player feel that they have been given responsibility for the navy.

#### Central presentation

Show:

- Large national flag
- Naval ensign
- Nation name
- Starting government
- National naval doctrine
- Main strategic regions
- Naval budget category
- Shipbuilding capacity
- Research strengths and weaknesses
- Important national characteristics
- Likely rivals
- Initial difficulty rating

The official game presents national characteristics and opponents while the player reviews selectable nations. Different countries receive historically inspired research advantages, disadvantages, and special technologies.

##### Example nation summary

```text
UNITED KINGDOM

Global Naval Power

Strategic Position
Your navy must defend the North Sea, Mediterranean,
Indian Ocean, Far East, and overseas possessions.

National Advantages
• Advanced shipbuilding industry
• Strong ship-design research
• Extensive network of overseas naval bases
• Large initial budget

National Pressures
• Worldwide deployment requirements
• High maintenance expenditure
• Numerous potential rivals
• Public expectation of naval superiority

Recommended For
Experienced players who enjoy global fleet management.

Likely Early Rivals
Germany, France, Russia
```

#### Bottom controls

- **Change Nation**
- **Continue as [Nation]**
- Optional: **Compare Nations**
- Optional: **Recommended Setup**

The recommended setup should preconfigure the remaining screens but still let the player inspect them.

---

## 2. Choose the starting era

This is the most important decision after nation selection because it determines which naval technologies and fleet concepts the player inherits.

Rule the Waves 3 campaigns can begin in **1880, 1900, 1920, or 1935** and continue through 1970.

Present the eras as four large horizontal cards.

### 1880: Age of Iron and Steam

```text
1880
THE AGE OF IRON AND STEAM

Begin with protected cruisers, armoured cruisers,
torpedo craft, and early pre-dreadnought battleships.

You will experience the complete technological evolution
of modern naval warfare.

Complexity: Low at first, grows gradually
Campaign length: Very long
Recommended for: Players who want the full naval era
```

#### Player expectations

- Small and inaccurate guns
- Short engagement ranges
- Primitive fire control
- Early armour layouts
- Coal-powered fleets
- Weak torpedoes that become increasingly dangerous
- No aviation at the beginning
- Maximum opportunity to shape national doctrine

### 1900: Pre-Dreadnought Competition

```text
1900
THE NAVAL ARMS RACE

The great powers are expanding their fleets.
Long-range gunnery, submarines, turbines, and the
all-big-gun battleship are approaching.

Complexity: Moderate
Campaign length: Long
Recommended for: First-time players
```

The 1900 start is the special case in which the player may optionally construct the legacy fleet manually. In the other starting eras, the starting fleet is normally generated automatically.

### 1920: Treaty and Aviation Era

```text
1920
THE SHADOW OF THE GREAT WAR

Dreadnought fleets dominate the seas, but aircraft,
submarines, and naval treaties are changing the rules.

Complexity: High
Campaign length: Medium
Recommended for: Players familiar with ship design
```

### 1935: Approaching Global War

```text
1935
THE GATHERING STORM

Fast battleships, aircraft carriers, submarines,
radar research, and modern naval aviation compete
for increasingly limited resources.

Complexity: Very high
Campaign length: Shorter and intense
Recommended for: Veteran players
```

When an era is selected, update a small visualization showing:

- Available ship categories
- Approximate campaign duration
- Starting technological maturity
- Expected administrative load
- Importance of aviation
- Importance of submarines

---

## 3. Choose campaign scale

The original game ties fleet size to the national budget and therefore to how many ships the player and AI powers can maintain. Large and very large settings are closer to historical fleet proportions, while medium or small fleets are easier for a new player to administer.

### Fleet-size choices

#### Small

- Compact fleets
- Faster turns
- Fewer ships to design
- Individual losses are especially significant
- Small nations may become extremely constrained

#### Medium

- Recommended default
- Enough ships for varied battles
- Moderate administrative burden
- Good for learning the campaign systems

#### Large

- Historically plausible scale
- Multiple squadrons and overseas stations
- More design and maintenance decisions
- Longer fleet-management sessions

#### Very Large

- Maximum fleet spectacle
- Dozens of capital ships over the campaign
- Heavy administrative workload
- Intended for experienced players

### Presentation example

```text
CAMPAIGN SCALE: MEDIUM

Estimated starting navy
  Capital ships       6–10
  Cruisers            12–20
  Destroyers          20–35
  Supporting forces   Nation and era dependent

Management load       Moderate
Battle size           Moderate
Economic pressure     Standard
Turn duration          3–8 minutes
```

These numbers should be calculated from your own game model rather than hard-coded. Show ranges only after generating an estimate from the selected nation, year, economic rules, and fleet multiplier.

Include a subtle warning when the player selects combinations such as:

```text
Spain + Small Fleet

This combination provides a very limited naval budget.
Recommended only for players seeking a difficult campaign.
```

The official manual similarly warns that minor naval powers, particularly Spain or Austria-Hungary, may have severely restricted resources when combined with a small fleet setting.

---

## 4. Configure historical uncertainty

Call this screen **Rules of the Naval Age** rather than “Advanced Settings.” It should explain the gameplay consequence of each setting instead of merely exposing checkboxes.

### Research speed

```text
RESEARCH PACE

Slow       Technologies arrive less frequently
Standard   Recommended historical progression
Fast       More rapid changes in fleet design
```

The original game permits research speed below 100 percent to slow technological development.

### Technology variation

#### Historical

Technologies generally become available around their historical periods.

#### Uncertain

Technologies may arrive somewhat earlier or later, and some systems may work differently than expected.

#### Alternate History

Technology dates and effectiveness vary considerably, meaning that historically successful ideas may not necessarily dominate.

The original options range from no variation through considerable variation. At the highest setting, technologies can be delayed by several years and their effectiveness may change, creating an alternate naval-development timeline.

### Aviation development

```text
AVIATION DEVELOPMENT

Historical
Naval aviation develops at the normal campaign rate.

Delayed
Extends the period in which gun-armed capital ships
remain the decisive naval weapon.
```

The manual explicitly includes an option to slow aviation development for players who want to prolong battleship dominance.

### Additional clone-friendly options

These can improve accessibility without changing the core simulation:

- Battle frequency
- Tactical battle difficulty
- Economic difficulty
- AI design quality
- Automatic fleet organization
- Automatic overseas deployment
- Detailed officer management
- Fog of war level
- Manual or automatic tactical battles
- Tutorial adviser
- Pause on important events
- Ironman mode

Group these under:

- **Historical Model**
- **Difficulty**
- **Automation**
- **Interface Assistance**

Do not present twenty checkboxes simultaneously. Use presets:

```text
CADET
More information, manageable fleets, adviser enabled.

ADMIRAL
Standard economy, standard uncertainty, limited assistance.

NAVAL HISTORIAN
Historical budgets and technology, realistic fleet scale.

ALTERNATE HISTORY
High technological variation and unpredictable world development.

CUSTOM
Configure every rule.
```

---

## 5. Select the starting-fleet method

This is where the starting flow branches.

### Option A: Inherit an existing navy

```text
INHERIT THE FLEET

Your predecessor has left you an operational navy,
including ships of varying quality and age.

You must modernize what you have rather than beginning
with an ideal fleet.

Recommended for your first campaign.
```

This should be the default. The inherited fleet creates immediate strategic problems:

- Obsolete capital ships
- Inconsistent cruiser classes
- Expensive ships with limited combat value
- Ships undergoing construction
- Insufficient destroyer numbers
- Poor overseas distribution
- Dock-size limitations
- Maintenance pressure

The official manual recommends starting with a generated legacy fleet because manually constructing an entire initial navy requires considerable design work. It also treats coping with an inherited fleet as part of the campaign challenge.

### Option B: Build the legacy fleet manually

Only enable this when supported by your selected era, or make it a custom rule in your clone.

```text
DESIGN THE LEGACY FLEET

Construct the navy that exists on the campaign’s opening day.

Phase 1
Purchase completed ships.

Phase 2
Order ships already under construction.

Warning
This process requires extensive ship design and may give
an experienced player an advantage over AI-controlled nations.
```

If selected, show the player:

- Total legacy fleet allocation
- Minimum amount that must be spent on completed ships
- Maximum amount reservable for ships under construction
- Required minimum force structure
- Overseas station requirements
- Maximum dock size
- Available starting technologies

The source game divides manual legacy-fleet creation into completed ships and ships already under construction. Most funds must go toward existing vessels, while unfinished ships begin partially complete and continue charging normal construction costs once the campaign starts.

### Option C: Curated historical-inspired fleet

This would be a useful addition for your clone:

```text
CURATED FLEET

Start with a balanced, historically inspired navy tailored
to your nation and selected era.

Recommended for players who want authenticity without
managing initial fleet construction.
```

It should not reproduce real orders of battle exactly unless you have appropriate research and data. Instead, generate plausible classes and clearly label them as historically inspired.

---

## 6. Admiral and campaign identity

This short step gives the campaign a personal identity.

### Inputs

```text
Admiral name:          ______________________
Campaign name:         ______________________
Naming convention:     Historical / Generated / Custom
Ship name reuse:       Allowed / Disabled
Measurement system:    Imperial / Metric
```

The original game predominantly displays gun calibres and armour in inches, ranges in yards, and other naval measurements in imperial units.

### Optional player archetype

For Bluewave-style campaign identity, you could include a 12-point command profile:

- **Strategist**: intelligence and deployment
- **Engineer**: ship design and refit efficiency
- **Politician**: budget, prestige, and crisis influence
- **Commander**: tactical control and fleet morale

This should influence the campaign gently. It should not override the nation’s starting characteristics.

Example:

```text
THE NAVAL REFORMER

Strategist   3
Engineer     5
Politician   3
Commander    1

Effect
• Reduced ship-development cost
• Slightly faster refits
• Greater prestige penalty for battle defeats
```

---

## 7. Final commissioning review

Before world generation, show a single summary screen.

```text
NAVAL COMMISSION

Nation                 United Kingdom
Starting date          January 1880
Campaign scale         Medium
Starting fleet         Generated legacy fleet
Research pace          Standard
Technology variation   Uncertain
Aviation development   Historical
Economic model         Balanced
Tutorial adviser       Enabled
Admiral                 John Fisher
Campaign               Britannia Ascendant
```

### Strategic forecast panel

```text
YOUR OPENING CHALLENGE

You command the world’s largest navy, but it is scattered
across numerous overseas stations. Your first priority will
be to preserve local superiority while controlling the cost
of maintaining a global fleet.

Expected pressures
• Expensive overseas commitments
• Growing continental competitors
• High public expectations
• Frequent colonial deployment decisions
```

### Buttons

- **Back**
- **Save as Preset**
- **Begin Commission**
- Optional: **Generate Another Starting Fleet**

If the player selected an automatically generated fleet, “Generate Another Starting Fleet” should reroll ship classes and construction queues while preserving approximately the same total value.

---

## 8. World generation presentation

Avoid a plain loading spinner. Present the creation of the naval world as reports arriving at the admiralty.

```text
ESTABLISHING THE NAVAL ORDER

✓ Appointing foreign governments
✓ Calculating national naval budgets
✓ Establishing diplomatic relations
✓ Generating naval technologies
✓ Laying down existing ship classes
✓ Assigning ships to overseas stations
✓ Constructing naval bases and fortifications
✓ Compiling foreign intelligence estimates
✓ Preparing the January naval estimates
```

Alongside it, rotate short setting messages:

- “Foreign ship characteristics are based on intelligence estimates.”
- “Technological discoveries will not always follow history.”
- “A large fleet may become unsustainable during an economic downturn.”
- “A navy built for the last war may be unsuited to the next one.”

---

## 9. Opening strategic briefing

This is the first thing presented after the new campaign has actually been generated.

Do not expose the full strategic dashboard immediately. Place a modal or briefing dossier above it.

### Page 1: Appointment

```text
ADMIRALTY
1 January 1880

By order of the Government, you are appointed to command
the naval administration of the United Kingdom.

You are responsible for fleet construction, readiness,
research, overseas deployment, and advising the Government
during international crises.

The Cabinet expects the Royal Navy to remain capable of
defending the nation’s trade and overseas possessions.
```

Button: **Review Naval Estimates**

### Page 2: State of the navy

Show a compact inventory:

```text
ACTIVE FLEET

Battleships               8
Armoured cruisers         6
Protected cruisers       14
Corvettes                  8
Destroyers                24
Submarines                 0

Ships under construction   5
Ships in reserve           4
Ships overseas            17
```

Also show:

- Oldest capital ship
- Most expensive active class
- Largest available dock
- Total maintenance expense
- Current construction expenditure
- Free monthly balance

### Page 3: Treasury position

```text
MONTHLY NAVAL ESTIMATE

Government allocation       6,420
Fleet maintenance          -3,180
Ships under construction   -1,640
Research expenditure         -640
Other naval expenses         -210
Projected monthly surplus     750
```

Provide a simple qualitative status:

- Healthy surplus
- Narrow surplus
- Deficit
- Critical deficit

Budgets are received as monthly naval payments. Spending beyond available funds can reduce prestige and fleet morale, while accumulating a very large unused reserve may attract government attention.

### Page 4: Strategic obligations

Display every sea region relevant to the selected nation:

```text
REGIONAL COMMITMENTS

Northern Europe
Required presence: High
Current strength: Adequate

Mediterranean
Required presence: Medium
Current strength: Weak

Northeast Asia
Required presence: Low
Current strength: Adequate

West Africa
Required presence: Low
Current strength: None
```

Each region should identify:

- Friendly possessions
- Naval-base capacity
- Ships currently deployed
- Required colonial presence
- Nearby foreign powers
- Strategic bottlenecks
- Unrest or instability
- Oil availability, where relevant

The game world is divided into areas containing national or neutral possessions. Possessions can provide naval bases, improve regional presence, change hands through peace or events, and sometimes contain oil resources.

### Page 5: Foreign intelligence

```text
FOREIGN NAVAL ESTIMATES

France
Relations: Cautious
Tension: 2/10
Estimated capital ships: 6
Intelligence quality: Fair

Germany
Relations: Neutral
Tension: 1/10
Estimated capital ships: 4
Intelligence quality: Limited

Russia
Relations: Strained
Tension: 4/10
Estimated capital ships: 5
Intelligence quality: Poor
```

Always express foreign ship counts as estimates unless intelligence quality is excellent.

### Page 6: Immediate concerns

Generate three to five contextual issues:

```text
IMMEDIATE NAVAL CONCERNS

1. Three battleships are approaching obsolescence.
2. Mediterranean cruiser strength is below the recommended level.
3. Two new protected cruisers will complete within six months.
4. Current docks cannot support ships above 15,000 tons.
5. Research spending is below the Admiralty’s recommended level.
```

### Final briefing choice

```text
How do you wish to begin?

[Take command]
Open the complete strategic dashboard.

[Guided inspection]
Visit each important naval screen with contextual explanations.

[Delegate routine administration]
Apply recommended research and deployment settings before opening the dashboard.
```

---

## 10. Main strategic dashboard

Once the player closes the briefing, present the primary campaign screen.

### Top status bar

Always visible:

```text
January 1880 | United Kingdom | Prestige 52 | Unrest 3
Funds 18,250 | Monthly Balance +750 | Fleet Morale: Good
```

Also include:

- Current war or peace state
- Government type
- Current selected region
- Alert count
- Advance-one-month button

Government type, prestige, unrest, morale, and tension with other powers are persistent strategic concerns. Rising tension can eventually lead to war, while political events force the player to balance prestige, budget, and international relations.

### Left navigation

1. Strategic Map
2. Fleet
3. Construction
4. Ship Design
5. Research
6. Intelligence
7. Diplomacy
8. Bases and Defences
9. Officers
10. Reports
11. Naval History

### Central workspace

Default to the strategic map:

- World map
- National possessions indicated by colour and flag
- Naval bases
- Regional fleet strength
- Ships in transit
- Tension overlays
- Blocked passages
- Oil resources
- Active alerts

### Right-side command panel

#### Current priorities

```text
CURRENT PRIORITIES

! Mediterranean strength below requirement
! One capital ship design is obsolete
• A cruiser completes in three months
• No research priority has been selected
```

#### Month-end checklist

```text
BEFORE ADVANCING THE MONTH

✓ Fleet maintenance is funded
✓ No ships exceed base capacity
○ Review research allocation
○ Resolve one deployment warning
○ Inspect ships under construction
```

Do not require every item to be completed. Distinguish:

- Red: campaign-threatening
- Amber: important
- Blue: informational
- Green: resolved

---

## 11. Guided first-month sequence

For the first month only, guide the player through the core loop.

### Step 1: Inspect the inherited fleet

Highlight the Fleet tab.

Ask the player to review:

- Capital ships
- Cruiser force
- Destroyer and escort strength
- Ships in reserve
- Ships overseas
- Obsolete classes
- Ships in poor condition
- Maintenance cost by class

Provide one clear lesson:

> You are not expected to replace the entire fleet immediately. Decide which ships remain useful, which can be refitted, and which are consuming more resources than they are worth.

### Step 2: Review construction

Show:

- Ships under construction
- Monthly cost
- Completion dates
- Build delay risk
- Available shipyard capacity
- Options to halt or accelerate construction

In the source game, construction costs are paid in monthly instalments. Construction may be halted, and a limited number of ships can be accelerated at increased cost and with possible disruption to other work.

### Step 3: Configure research

Show research areas such as:

- Ship design
- Armour development
- Naval guns
- Fire control
- Torpedoes
- Submarines
- Machinery
- Damage control
- Naval aviation
- Radar and electronics
- Missiles, when era-appropriate

Let the player:

- Set total research funding
- Mark priorities
- Leave the default balanced allocation
- Review national advantages

### Step 4: Review foreign relations

Introduce tension:

```text
TENSION WITH FRANCE: 2/10

Low tension indicates peace is currently likely,
but diplomatic events can change relations unexpectedly.
```

The player should understand that war is not scheduled. Random events and crises can increase tension rapidly, so maintaining a minimally viable fleet is safer than scrapping everything for future projects.

### Step 5: Inspect overseas deployment

Highlight any area where:

- The navy is below required presence
- A ship is too large for the local base
- Maintenance costs are excessive
- The area is strategically exposed
- A colonial possession lacks adequate defence

### Step 6: Advance the month

Before processing, show:

```text
ADVANCE TO FEBRUARY 1880?

Expected financial result       +750
Ships completing this month     0
Known political events          None
Critical deployment warnings    0

The international situation may change when the month is processed.
```

On advancing, animate the monthly resolution:

```text
PROCESSING FEBRUARY 1880

• Naval budget received
• Maintenance paid
• Construction advanced
• Research conducted
• Foreign relations updated
• Intelligence reports compiled
• Political events checked
```

Then show a concise monthly report rather than multiple disconnected pop-ups.

---

## Core experience you should preserve

The opening should establish five ideas:

1. **The player inherits a navy rather than starting from nothing.**
2. **The budget is a recurring monthly constraint, not merely a purchase currency.**
3. **Every ship competes for maintenance, construction, and research resources.**
4. **Technology is uncertain and may invalidate current naval doctrine.**
5. **War can emerge from political tension before the fleet is fully prepared.**

The player’s first meaningful decision should therefore not be “Which battleship should I build?” It should be:

> **What kind of navy have I inherited, what obligations must it satisfy, and what can I afford to change first?**

That framing gives the opening the deliberate, administrative character that makes this style of naval campaign compelling, while the guided sequence prevents the player from being overwhelmed by the entire simulation at once.
