# INC-2 — Nation confirmation screen enrichment

**What to build:** Enrich the existing `DossierSlidePanel` accordion in
place (no new full-screen route) per [the assembled spec](../spec.md) §1.
New header showing appointment title + nation name (no date). New fields —
doctrine, budget category, shipbuilding capacity, research
strengths/weaknesses, strategic regions, national characteristics, likely
rivals, difficulty rating — fold into the existing Economy/Military/
Diplomacy tabs, hand-authored for all 10 playable nations per the spec's
table. Bottom controls: "Change Nation" (collapses panel), "Continue as
[Nation]" (renamed from "Confirm Selection"), and "Recommended Setup",
which writes the Admiral preset's six setting-id values (fleetSize:
standard, researchSpeed: standard, technologyVariation: some,
historicalBudget: standard, tacticalRealism: standard, difficulty: normal)
plus the `generated` fleet-method id directly into draft state — this is a
data constant per spec §2/§5 and does not require INC-3 or INC-5's screens
to exist yet.

**Blocked by:** INC-1

**Status:** ready-for-agent

- [ ] Header shows "You have been appointed [Appointment Title]" / "[Nation
      Name]", no date/era shown
- [ ] All 10 nations have their full field set (appointment title, doctrine,
      regions, budget category, shipbuilding capacity, research
      strengths/weaknesses, characteristics, rivals, difficulty 1–5) authored
      per the spec's table and rendered in the correct existing tabs
- [ ] "Change Nation" collapses the panel back to grid focus
- [ ] "Continue as [Nation]" advances the flow with the confirmed nation id
- [ ] "Recommended Setup" sets the Admiral preset's six draft values and the
      `generated` fleet-method id, verifiable even though downstream screens
      may still be stubs
- [ ] "Compare Nations" is not present anywhere on this screen
- [ ] Component/screen tests cover all 10 nations' content rendering and the
      three button behaviors
