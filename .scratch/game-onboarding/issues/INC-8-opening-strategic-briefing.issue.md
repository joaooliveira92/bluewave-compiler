# INC-8 — Opening strategic briefing

**What to build:** New 5-page linear briefing shown once after world
generation, before the existing unchanged Overview dashboard, per [the
assembled spec](../spec.md) §8. Back always available (returns to prior
page, never exits); "Review Naval Estimates" label on page 1, generic
Next/Back on pages 2–4, "Take command" as page 5's closing action.

- Page 1 (Appointment): reuses INC-2's appointment title + dossier flavor,
  shows the scenario's start date.
- Page 2 (State of the Navy): ship-class inventory counts, under-construction
  count, most-expensive-active-class, largest-available-dock, total
  maintenance expense, current construction expenditure — all via the joins
  spelled out in spec §8 page 2. No reserve/overseas counts, no oldest
  capital ship, no free monthly balance.
- Page 3 (Treasury Position): government allocation, fleet maintenance,
  construction spending, research expenditure, projected surplus/deficit,
  plus a qualitative healthy/narrow/deficit/critical status computed via
  lightweight threshold logic. No "other naval expenses" row.
- Page 4 (Foreign Intelligence): relations label + tension score per rival
  only. No estimated ship counts, no intelligence-quality tiering.
- Page 5 (Immediate Concerns): categories only — obsolescence, budget
  shortfall, near-complete construction, low research spending. No
  "understaffed region" category. Exact trigger thresholds are this
  ticket's own implementation detail to define.

**Blocked by:** INC-7

**Status:** ready-for-agent

- [ ] All 5 pages render in the correct order with working Back/Next
      navigation and no skip logic
- [ ] Page 2's six fields are computed via the real joins (design catalog
      hullType lookup, construction queue, port capacity, month report) —
      no hard-coded or fabricated values
- [ ] Page 3's qualitative status is computed from the real projected
      surplus number, not hard-coded
- [ ] Page 4 shows only relations + tension per rival — verify no ship-count
      or intel-quality field is rendered anywhere
- [ ] Page 5 shows only the four specified categories with working
      (even if simple) trigger logic — no "understaffed region" category
- [ ] "Take command" transitions into the existing, unchanged Overview
      dashboard with no other closing option present
- [ ] Component tests cover each page's data derivation and the full
      Back/Next/Take-command navigation path
