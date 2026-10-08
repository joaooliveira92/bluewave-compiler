# Desktop E2E Expansion — 07: Compile-breadth matrix — how many archetype/nation/scenario paths

Type: grilling
Status: open
Blocked by: 02 — Fixed-seed multi-month behaviour & suite wall-clock
Blocked by: 04 — Scope & Coverage Matrix v2: which flows graduate

## Question

Every create-side spec today drives exactly one path: archetype "Shipyard
Baron", nation "Austro-Hungarian Empire", scenario 1880, one seed. The new
commissioning flow adds real compile-time variance: nation slots (which drive
narrative/show), rules-of-the-naval-age presets, scenario selection (1880 +
future packs), and multiple archetypes with distinct starting states.

How much breadth should e2e cover — one curated path (status quo), a small
**matrix** of, say, 2–3 nations × 2 archetypes compiled to distinct campaigns
but asserted shallowly (Welcome/Overview/Revision 0), or 1 path deep (status
quo) plus 1 shallow alternate-nation compile to catch slot/asset-selection
regressions? What risk does breadth actually mitigate (content/asset wiring per
nation, archetype preset spread) and what does it cost at serial CI time?

Ground the choice in ticket 02's wall-clock facts and in what the
campaign-engine/compiler unit tests already prove per-nation (so e2e breadth
guards integration, not designs). Record the decided matrix rows.