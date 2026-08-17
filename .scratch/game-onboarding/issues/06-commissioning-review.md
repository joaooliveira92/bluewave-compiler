# Final commissioning review screen

**Type:** grilling
**Status:** resolved
**Blocked by:** 01, 02, 03, 05

## Question

Spec the final commissioning review screen (diagnosis doc step 7) that
summarizes every decision made in the preceding steps before world
generation. Blocked on tickets 01/02/03/05 so the exact field names, labels,
and vocabulary already settled in each of those screens can be reused
verbatim rather than re-invented.

Cover:
- The summary table: nation, starting date, campaign scale, starting fleet
  method, research pace, technology variation, aviation development,
  economic model, tutorial adviser (if applicable), admiral, campaign name.
- The "strategic forecast" panel — a short generated blurb about the
  player's opening challenge. Decide how much is hand-authored per
  nation/era vs. templated from the settings chosen.
- Buttons: Back, Save as Preset, Begin Commission. Decide whether "Generate
  Another Starting Fleet" ships given ticket 04/05's fleet-mode semantics.

## Answer

**Summary table rows** (top to bottom), reusing settled vocabulary verbatim
from tickets 01/02/03/05, cutting doc fields with no engine backing:

- Nation (ticket 01)
- Era (scenario — doc's "Starting date" relabeled to match ticket 02's
  "Era & Scale" vocabulary)
- Fleet size (relabeled from the doc's "Campaign scale," which isn't a real
  setting — reuses ticket 02's real `fleetSize` setting)
- Research pace, Technology variation, Historical budget, Tactical realism,
  Difficulty (ticket 02's remaining five real settings)
- Starting fleet method (ticket 05: Inherit / Manual-build / Curated)
- Archetype (Merchant Prince / Shipyard Baron / Grand Admiral, unchanged
  per ticket 03)
- Naming convention, Ship name reuse, Measurement system (ticket 03's three
  Identity enums — not in the doc's mockup, but ticket 03 committed to
  surfacing them here)
- Admiral, Campaign name (ticket 03)

**Cut entirely** (no engine backing, would make the screen lie): Aviation
development, Tutorial adviser, Economic model, "Campaign scale" as a label.

**Active preset**: shown as a small heading annotation above/beside the six
ticket-02 setting rows (e.g. "Rules of the Naval Age: Naval Historian", or
"Custom" if none active) — not a duplicate row.

**Strategic forecast panel**: templated, not hand-authored per nation×era
combination (125 combos is out of bounds for hand authorship, consistent
with tickets 01/02's ~10-nation / ~18-blurb authoring caps). Built from
ticket 01's existing per-nation dossier fields (doctrine, characteristics,
regions) as the constant part, plus a short "Expected pressures" bullet list
mechanically keyed off the chosen settings, reusing ticket 02's qualitative
setting blurbs as the bullet source rather than new authored paragraphs.

**Buttons**: **Back**, **Begin Commission** only.
- **"Save as Preset" — cut entirely.** Ticket 02 designed a fixed 5-preset
  system with no persistence layer, preset editor, or storage decision.
  Adding real custom-preset saving here would be new, unscoped work; not
  even a disabled placeholder, since nothing was ever designed for it to
  wait on.
- **"Generate Another Starting Fleet" — cut entirely, not even disabled.**
  Ticket 05 confirmed no mode has real generation logic. Unlike ticket 05's
  fleet-method cards (which only describe a mode, promising nothing), this
  button promises an observable action (reroll ship classes) with zero
  implementation behind it — a disabled version would still mislead.
