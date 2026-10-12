The original ship designer places almost every input on one screen. That maximizes information density, but it creates a form-heavy workflow where hull, armor, machinery, weapons, aviation, electronics, weight, and cost compete for attention. For your clone, I recommend a persistent ship workspace with a right-side scrollable inspector, divided into task-oriented tabs. In other words, use both ideas together rather than choosing only scrolling or only tabs.

Recommended UX paradigm
┌──────────────────────────────────────────────────────────────────────┐
│ Ship name | Ship type | Year | Undo/Redo | Validation | Save design │
├───────────────┬───────────────────────────────┬──────────────────────┤
│ Design Map    │                               │ Right Inspector      │
│               │       Ship visualization      │                      │
│ Overview      │                               │ [Hull][Machinery]    │
│ Hull          │     Top / side / section      │ [Armor][Weapons]     │
│ Machinery     │                               │                      │
│ Armor         │     Selectable components     │ Scrollable content   │
│ Weapons       │                               │ for active tab       │
│ Systems       │                               │                      │
│ Review        │                               │                      │
├───────────────┴───────────────────────────────┴──────────────────────┤
│ Displacement  11,000 / 11,300 t | Cost £36,521 | Stability 72%      │
│ Speed 17.0 kn | Range: Short | Remaining weight 300 t | 2 warnings  │
└──────────────────────────────────────────────────────────────────────┘

Why this hybrid is stronger
Tabs establish scope. The player understands whether the current task concerns hull, machinery, armor, armament, or support systems.
Scrolling handles complexity inside that scope. Weapons can contain main battery, secondary battery, tertiary weapons, ammunition, fire control, and turret placement without creating nested tabs everywhere.
The ship remains visible. The original interface gives the ship drawing only a relatively narrow column. Your clone should make the ship the visual center of the activity.
Critical outcomes remain visible. Displacement, available weight, cost, speed, stability, and design warnings should never disappear while the player scrolls.
The interface can grow by era. Aviation, radar, torpedoes, anti-aircraft weapons, and advanced fire control can appear when historically or technologically relevant.
Proposed screen structure

1. Persistent top command bar

The top bar should contain only design-level commands:

Class name
Ship type
Design year or technology year
Design status
Undo and redo
Compare variant
Clear or reset, placed inside an overflow menu
Save draft
Validate design
Finish design

Do not place ordinary ship parameters in this bar. The top bar should answer: “Which design am I editing, and what can I do with the entire design?”

A particularly useful addition would be a compact breadcrumb:

Devastation class / Weapons / Main battery / Turret A

1. Left design map

Use a narrow left rail as a design-navigation map:

Overview
Hull
Machinery
Protection
Armament
Systems
Review

Each section can display status:

✓ Hull
✓ Machinery
! Protection
2 Armament
– Systems

Suggested meanings:

✓ valid
! warning
2 two unresolved issues
– not configured or unavailable

This gives the player a sense of progression without forcing a rigid wizard. Experienced players can jump directly between sections.

For smaller screens, the left map can collapse into icons or become a dropdown.

1. Central ship workspace

The central area should be the primary interaction surface, not merely a preview.

Views

Provide a compact view selector:

Top
Side
Armor
Compartments
Firing arcs

The screenshots primarily show a top-down ship visualization. Your implementation should allow the player to select:

Turrets
Secondary mounts
Armor belts
Machinery spaces
Funnels
Masts
Torpedo launchers
Aviation facilities

Selecting an element in the visualization should switch the right inspector to the appropriate editor.

Example:

Player clicks Turret A
→ Weapons tab becomes active
→ Main battery section opens
→ Turret A editor is focused
→ Firing arc and covered sectors appear on the ship

This creates a direct-manipulation relationship between the ship and the form. The original interface largely separates the drawing from the numerical controls.

Contextual overlays

Do not show every overlay simultaneously. Provide toggles for:

Armor zones
Turret arcs
Component footprint
Center of mass
Topside load
Machinery layout
Structural conflicts

A selected component can use a strong accent color, while related coverage appears as a translucent overlay.

Right inspector design
Recommended width

For a desktop-oriented Electron game:

Default width: 400 to 480 px
Minimum width: approximately 360 px
Maximum width: approximately 560 px
Resizable by dragging its left edge
Remember width between sessions
Entire panel may collapse with a keyboard shortcut

At 1920×1080, a practical distribution would be:

Left design map: 200–240 px
Center workspace: remaining flexible width
Right inspector: 440–500 px
Bottom status bar: 56–72 px
Top-level tabs inside the inspector

Avoid reproducing all original categories as tabs. Use only a manageable number at a time.

When Armament is selected in the design map, the inspector could show:

[Main battery] [Secondary] [Torpedoes] [Other]

When Protection is selected:

[Armor] [Underwater] [Structural]

When Systems is selected:

[Fire control] [Sensors] [Aviation] [Accommodation]

Tabs should represent sibling concepts. Do not put a long list of unrelated controls under generic tabs such as “Additional armament.”

Recommended right-panel content by section
Overview

A design summary rather than a duplicate form:

Ship type and intended role
Design year
Displacement
Cost
Speed and range
Armor summary
Main armament summary
Crew and accommodation
Technology constraints
Design warnings
Combat-role estimates

This can also include explicit design goals:

Design priorities
Speed       [■■■□□]
Protection  [■■■■□]
Firepower   [■■■■■]
Range       [■■□□□]
Cost        [■■■□□]

These priorities should not automatically override player choices unless the game has an assisted-design mode.

Hull

Use collapsible sections:

Dimensions and capacity
Displacement
Freeboard
Hull proportions, if configurable
Reserve displacement
Seakeeping
Stability
Buoyancy
Structural stress
Seakeeping estimate
Internal capacity
Machinery volume
Magazine volume
Accommodation
Available deck space
Topside capacity

Inputs should show their downstream consequences directly:

Freeboard: Normal
Weight: +210 t
Stability: +3%
Target profile: +6%

Machinery

Organize around outcomes first:

Performance targets
Target speed
Operational range
Cruising speed
Propulsion configuration
Engine type
Boilers
Fuel type
Shaft count
Machinery arrangement
Calculated results
Horsepower required
Machinery weight
Fuel capacity
Cost
Reliability
Acceleration, if modeled

A player should be able to enter either a target speed or a power configuration, depending on your simulation model. Avoid circular controls where both values appear editable while one silently overrides the other.

Protection

The screenshot contains belt, belt coverage, extended belt, upper belt, deck, extended deck, conning tower, turret armor, turret-top armor, and torpedo defense. The redesigned interface should group these spatially.

Armor layout
Main belt
Upper belt
Main deck
Extended deck
Conning tower
Armament protection
Turret face
Turret side
Turret roof
Barbette
Underwater protection
Torpedo-defense system
Subdivision
Double bottom
Magazine protection

Every armor field should provide:

Thickness
Coverage
Weight
Protected area
Estimated effectiveness

Selecting “Main belt” should highlight the belt on the central ship visualization.

Armament

Armament benefits most from a master-detail pattern.

Left side of inspector content

A compact mount list:

MAIN BATTERY
A  Twin 13-inch       Fore
Y  Twin 13-inch       Aft

SECONDARY BATTERY
P1  Single 10-inch    Port wing
S1  Single 10-inch    Starboard wing

TERTIARY
12 × 5-inch casemate

Selected mount editor

After selecting A:

Gun model or caliber
Barrel count
Turret quality
Ammunition per gun
Mount position
Elevation
Fire-control connection
Armor
Rotation and firing arc
Weight and cost
Placement conflicts

Provide actions near the selected mount:

Duplicate symmetrically
Move
Replace
Remove
Mirror to opposite side

This is much more efficient than maintaining independent forms and textual position lists, as seen in the reference interface.

Systems

Only show systems relevant to the selected design year and hull type:

Fire-control equipment
Rangefinders
Directors
Radio
Radar
Anti-aircraft direction
Searchlights
Aviation installations
Mines
Depth charges
Colonial-service accommodations

Locked technology should not necessarily vanish. A disabled entry can teach progression:

Radar direction
Unavailable until the required technology is researched.

However, irrelevant future systems should not overwhelm an early pre-dreadnought design. Consider an optional “Show unavailable technology” filter.

Review

The final section should be a structured validation screen.

Blocking errors
Displacement exceeds hull capacity
Component overlap
Invalid turret arc
Machinery does not fit
Required crew accommodation missing
Warnings
Low stability
Excessive topside weight
Main belt protects too little of the hull
Secondary weapons have restricted fire
Range is below role recommendation
Advisory observations
Speed is lower than comparable ships
Ammunition endurance is limited
Armor distribution is inefficient
Cost exceeds the player’s selected target

Clearly separate invalid, risky, and merely suboptimal. The game should not prevent unusual but physically valid experimentation.

The persistent bottom status bar

The status bar should expose the values that currently appear scattered through the original form:

11,000 / 11,300 t     £36,521     17.0 kn     Short range
Stability 72%         Topside 22 / 98 t        2 warnings

Recommended behavior:

Clicking displacement opens a weight breakdown.
Clicking cost opens a cost breakdown.
Clicking stability opens relevant causes.
Hovering over available weight shows committed and reserved weight.
Invalid values turn red.
Values approaching a constraint turn amber.
Normal values stay neutral rather than becoming aggressively green.

A weight breakdown should be visual but precise:

Hull and fittings       2,874 t
Machinery                 933 t
Armor                   3,971 t
Armament                2,375 t
Ammunition                205 t
Accommodation             267 t
Incidental                 375 t
────────────────────────────────
Current                 11,000 t
Capacity                11,300 t
Remaining                  300 t

Important interaction patterns

1. Progressive disclosure

Initially show the controls needed for a valid design. Place specialized controls under an “Advanced” disclosure.

Example:

Main belt
Thickness       13 in
Coverage        Narrow

Advanced
  Inclination
  Tapering
  Material
  Internal backing

This preserves simulation depth without presenting an intimidating wall of fields.

1. Immediate cause-and-effect feedback

Every edit should update:

Visualization
Displacement
Cost
Performance
Stability
Validation messages

Use a short visual transition of approximately 150–250 ms, but do not delay calculations merely to animate them.

For expensive calculations, display a pending indicator and prevent stale results from replacing newer changes.

1. Comparison before commitment

When hovering over or selecting a new option, show the delta:

Compound engine → Triple-expansion engine

Speed       +1.3 kn
Weight      -84 t
Cost        +£1,260
Reliability +8%
Year        Requires 1885

Players should not need to memorize the old value before changing an option.

1. Editable numbers with unit awareness

Numerical fields should support:

Direct keyboard entry
Increment/decrement buttons
Mouse wheel only when the field is focused
Unit display
Valid range
Reset to recommended value
Undo

Avoid changing numeric values merely because the pointer passes over a control while the user scrolls the right panel.

1. Selection synchronization

Selection should work in both directions:

Select a turret in the panel
→ Highlight the turret on the ship

Select a turret on the ship
→ Focus the mount editor in the panel

1. Optional linked symmetry

For paired wing mounts:

☑ Link port and starboard mounts

Changing caliber or armor should update both linked mounts, while still allowing the player to unlink mounts for asymmetric designs.

1. Presets without hidden automation

Presets may include:

Balanced pre-dreadnought
Coastal defense ship
Fast armored cruiser
Long-range colonial cruiser
Maximum protection
Minimum cost

Applying a preset should produce a preview and list the affected fields. It should never silently replace the design.

What to avoid
Avoid one enormous right-side scroll

A single panel containing hull, armor, engines, weapons, torpedoes, aviation, fire control, and accommodation would only move the original density problem into a vertical format. The player would continually lose context and scroll position.

Avoid excessive top-level tabs

Ten or more tabs create a different navigation problem. Labels become compressed, important status becomes hidden, and players must repeatedly search for a control.

Use approximately:

5–7 primary design sections
2–4 local tabs within a section
Collapsible subsections inside each local tab
Avoid nested tab hierarchies

Do not create:

Armament
  → Guns
     → Main guns
        → Turrets
           → Position

Use a mount list and a selected-mount inspector instead.

Avoid modal dialogs for routine work

Gun selection, armor editing, engine configuration, and component placement should remain in the main workspace. Reserve modal dialogs for destructive confirmation, importing designs, or complex comparison workflows.

Avoid making “Save and finish” the only meaningful exit

Support:

Autosaved draft
Explicit save
Duplicate variant
Validate
Finish or commission design

Players should be free to leave an incomplete design and return to it.

Strongest final recommendation

Use the following combination:

Persistent central ship visualization
Left-side design map for major systems
Right-side resizable and scrollable inspector
A small number of contextual tabs inside the inspector
Master-detail editors for weapons and mounted components
Persistent bottom engineering summary
A dedicated final review and validation section

The core principle should be:

Navigate by ship system, edit through a contextual inspector, and observe consequences without losing sight of the ship.

This preserves the mechanical depth visible in the reference screenshots while replacing the spreadsheet-like experience with a modern design workspace. It also fits a React/Electron implementation well because the navigation shell, central visualization, inspector, and engineering-summary bar can remain independent components with explicit state boundaries.

Main design change: the proposal separates navigation, direct ship interaction, detailed editing, and continuous engineering feedback. This reduces visual competition while preserving all of the original designer’s numerical depth.
