# BUILDING SHIPS: manual reference (ticket 02)

Primary source: `docs/manual.pdf` (148 pp). Researched 2026-10-12 from the PDF text layer
with PyMuPDF (`pymupdf`). Printed page number == 1-based PDF page index. The BUILDING
SHIPS section begins on printed p. 30 (after FUNNELS / TOPSIDE POINTS) and continues
through the rebuild, docks, shipyard-capacity, submarine and coastal-artillery passages to
p. 36.

Status key: VERIFIED = wording read directly from the manual page cited. Nothing in this
note is inferred or backfilled; where the manual is silent, that is stated.

## 1. Build-time determinants and the shipbuilding-industry modifier

Manual p. 30:

> "Once the design study is completed, you can start building your new ships. The time to
> complete a ship is dependent on the ship type and can be modified by having an efficient
> or undeveloped shipbuilding industry."

VERIFIED. Build time is a function of *ship type*; an "efficient or undeveloped
shipbuilding industry" modifies it. The manual names no numeric multiplier here — no
figure is given, so any modifier magnitude is a BALANCE TARGET, not a manual fact.

## 2. Payment in monthly instalments

Manual p. 30:

> "The cost of building a ship is paid in monthly instalments during the build time."

VERIFIED. Cost is spread over the build duration as monthly instalments (not a lump sum).

## 3. Temporary halting of construction

Manual p. 30:

> "If you run into budget problems, it is possible to temporarily halt the construction of
> one or more ships. Halted ships will cost half of their mothballed maintenance cost."

VERIFIED. Halt = possible for one or more ships; carrying cost = **half the mothballed
maintenance cost**. (The mothballed-maintenance figure itself is defined elsewhere in the
manual, not in this span.)

## 4. Delayed-ship rule

Manual p. 31:

> "If a ship under construction is delayed, the monthly build cost will not be deducted,
> which can lead to lower than expected monthly expenses."

VERIFIED. A delayed ship's monthly build cost is **not** charged that month (so monthly
expenses can come in below expectation).

## 5. Acceleration

Manual p. 31:

> "You can also accelerate the construction of a limited number of ships. This will build
> them 10% faster, but with a 5% increase in cost. Having many ships in accelerated
> construction risks causing delays in the construction of other ships."

VERIFIED, exact figures: a **limited number** of ships; **10% faster** build; **5% increase
in cost**; risk of **delaying other ships** when many are accelerated. The manual does not
state the numeric size of the "limited number".

## 6. Build dialog — up to 12 ships, auto names

Manual p. 31:

> "In the build dialog, you order up to 12 ships of the same class laid down. The names
> will be assigned automatically. This might be very handy when building large numbers of
> destroyers for example. Note however that you will have to consider if your monthly
> budget or your shipyard capacity is enough to build that many ships."

VERIFIED. Up to **12** ships of one class per order; names assigned automatically; the
order is bounded by monthly budget and shipyard capacity.

## 7. Rebuilding ships — action list and conditions

Intro, manual p. 31:

> "You can rebuild existing ships, but there are limitations on what can be rebuilt. The
> following actions can be taken while rebuilding ships:"

### 7.1 Main armament changes

Manual pp. 31–32:

> "You can change the main armament according to certain conditions. Guns can be changed to
> more modern versions of the same calibre. Triple turrets can be changed to double turrets
> with larger guns or vice versa if the calibres are compatible. Double turrets can be
> changed to single turrets or vice versa if the calibres are compatible. For example, a
> double 8 in turret can be exchanged for a single 10 in turret or a triple 12 in turret can
> be exchanged for a double 16 in turret. To see the combinations available during a
> rebuild, select the turret and press the 'Rebuild?' button under the turret list. Gun
> rebuilds are generally expensive and take substantial time"

VERIFIED. Rules: same-calibre refresh to a more modern gun; **triple↔double** with larger
guns if calibres are compatible; **double↔single** if calibres compatible. Worked examples:
double 8 in → single 10 in; triple 12 in → double 16 in. Available combinations are shown
by the turret **'Rebuild?'** button. Gun rebuilds are expensive and slow (no numbers).

### 7.2 Secondary and tertiary batteries

Manual p. 32:

> "You can change the secondary battery if the existing guns are in casemates or in
> turrets of 6 inches calibre or less. It can be changed to any arrangement of 6 in guns or
> less. The same with tertiary guns."

VERIFIED. Secondary change allowed when existing guns are casemates or turrets of
**≤6 in**; may become any arrangement of **≤6 in** guns. Same condition for tertiary.

### 7.3 Machinery, fire control, bulges, armour, conning tower

Manual p. 32:

> "You can swap out the machinery for more modern machinery, increasing speed or using the
> weight gained for other purposes."
> "Fire control can be improved"
> "You can add bulges, which will increase torpedo protection but will also reduce speed."
> "You can add one inch of deck armour. You can also remove the conning tower, or change
> the upper belt armour."

VERIFIED. Machinery swap (faster and/or weight freed); fire-control improvement; bulges
(+torpedo protection, **−speed**); **+1 inch** deck armour; remove conning tower; change
upper belt armour.

### 7.4 Carrier conversion and type reclassification

Manual p. 32:

> "You can also rebuild ships to aircraft carriers (CV or CVL) provided you have researched
> the technology."
> "Some rebuilds will change the ship type, most often from something else to CV, but
> sometimes BC will be reclassified as BB. Sometimes a change of classification will be
> suggested, other times the change will be mandatory. The game definition of a BC will
> change over time (the speed requirement will rise), so occasionally when you rebuild a
> battlecruiser, the game will suggest that it might now be a battleship."

VERIFIED. CV/CVL conversion requires the researched technology. Reclassification can be
**suggested** or **mandatory**; BC definition drifts over time (speed requirement rises),
so a BC rebuild may be suggested as a BB.

## 8. Docks

Manual pp. 32–33:

> "In the game, dock size is used as a limit to the largest ship your nation can build and
> operate. It is also used to compute the total capacity of your shipbuilding industry."
> "You cannot build ships larger than your current dock size. Occasionally it is necessary
> to increase your maximum dock size. Docks take one year to build. Each building step will
> increase your dock size by between 1000 and 2000 tons depending on the time period. Try
> to plan ahead; waiting an extra year to lay down your new battleship while you enlarge
> your docks can be very frustrating. Dock size may occasionally increase by itself as a
> result of development in private shipbuilding."
> "Dock size is also used with a multiplier to determine your total shipyard capacity, that
> is, the total tonnage of ships you can have building. Note that submarines under
> construction are included in this total."

VERIFIED. Dock size = ceiling on largest ship buildable and operable, and the basis for
industry capacity. Each enlargement step: **+1000–2000 t depending on time period**;
build time **one year**. Occasional unprompted increase from **private shipbuilding**.
Shipyard capacity = dock size × a **multiplier** (multiplier value not stated here).

## 9. Shipyard capacity

Manual p. 33:

> "Your nation will have a maximum shipyard capacity, which is computed as a multiple of
> the dock size. The total tonnage of your ships under construction cannot exceed the
> maximum shipyard capacity. Ships under rebuild do not count, and neither do AMCs and
> small corvettes (as they are rebuilt from existing ships). Submarines do count towards
> the limit."

VERIFIED. Capacity = **multiple of dock size**; the total tonnage under construction cannot
exceed it. **Excluded**: ships under rebuild, AMCs, small corvettes (all rebuilt from
existing ships). **Included**: submarines.

## 10. Foreign yards

Manual p. 33:

> "If you cannot build ships at home, you can contract them to foreign yards. You will then
> be limited by the building nation's dock size. This can have a further advantage if your
> own nation lacks technology or has an undeveloped shipbuilding industry."
> "The drawback to building ships abroad is that you risk that your ships will be impounded
> and not delivered if a war breaks out. The risk of this happening depends on the tension
> level with the building nation. If you have a treaty with the building nation, they will
> always be delivered."
> "An advantage is that you may gain insight into the technology of the building nation."

VERIFIED. Foreign build is capped by the **building nation's dock size**; helps if your own
industry is undeveloped / you lack tech. Risk of **impoundment if war breaks out** scales
with **tension** with the builder; a **treaty guarantees delivery**. Advantage: **tech
insight** into the builder's technology. No numeric risk formula is given.

## 11. Submarines (selection, not design)

Manual p. 33:

> "You need not design submarines in RTW, they are selected from standardised types. The
> different types of submarine will be available as a result of your submarine research.
> The different submarine types are: Coastal submarines, Medium range submarines, Long
> range submarines, Minelaying submarines and Missile submarines."

VERIFIED. Submarines are chosen from **standardised types** (no player design), unlocked by
submarine research. Type list as above (pp. 33–34 describe each; p. 35–36 cover wartime
policy: Fleet support / Prize rules / Unrestricted).

## 12. Coastal artillery

Manual p. 36:

> "You can build coastal artillery batteries in the same way you build ships, except that
> you do not design them and can only chose between predefined types. Coastal artillery must
> be built in a specific possession."

VERIFIED. Built like ships (same build process), but no design — **predefined types only**,
and tied to a **specific possession**. Placement/AA/missile-battery details follow on p. 36.

## Recommendations for the implementator

Grounded constants (manual-cited, exact):

- Acceleration: **10% faster**, **+5% cost**, limited count, risks delaying other ships (p. 31).
- Halt carrying cost: **half the mothballed maintenance cost** (p. 30).
- Build-dialog batch limit: **12 ships of one class**, auto-named (p. 31).
- Dock enlargement: **+1000–2000 t per step by period**, **1 year** per step (pp. 32–33).
- Rebuild deck armour: **+1 in** (p. 32).
- Secondary/tertiary rebuild calibre ceiling: **6 in** (p. 32).
- Shipyard capacity excludes rebuilds/AMCs/small corvettes; includes submarines (p. 33).

Must remain BALANCE TARGET (manual gives no figure): the efficient/undeveloped
shipbuilding-industry modifier magnitude; the ship-type build-time table; the "limited
number" of ships eligible for acceleration; the dock-size→capacity multiplier; the
private-shipbuilding auto-increase chance/frequency; the tension→impoundment probability
curve; the mothballed-maintenance cost base.

## Deferred

- The mothballed-maintenance cost definition (needed to compute the halt cost) is not in
  this p. 30–36 span; locate it elsewhere in the manual or treat as a spec-owned constant.
- Numeric formulas for impoundment risk vs tension, and for the dock/capacity multiplier,
  are not stated in the manual; these require a decision-request / spec constant.
