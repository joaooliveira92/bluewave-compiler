# INC-7 — World-generation presentation

**What to build:** Replace today's plain disabled-button "Starting…" state
with the "Establishing the Naval Order" cosmetic presentation per [the
assembled spec](../spec.md) §7. Fixed 9-line checklist reveal + 4-message
rotating flavor text, paced over a bounded ~2.5–3s minimum, racing the real
(untouched) `compileCampaign` bridge call — if the call (including however
long the native save dialog takes) runs longer than the cosmetic minimum,
the screen holds on the final checklist line until it resolves. On success,
auto-advances into INC-8's briefing with no button. On
`SAVE_LOCATION_CANCELLED`, silently returns to INC-6's review screen with
selections intact. On any of the other five failure reasons
(`INVALID_CAMPAIGN_CONFIGURATION`, `COMPILE_FAILED`, `UNKNOWN_PLAYER_SLOT`,
`PLAYER_SLOT_NOT_SUPPORTED`, `SAVE_FAILED`), shows an error state (short
message + "Back to Commissioning Review" action) in place of the checklist.

**Blocked by:** INC-6

**Status:** done

- [x] All 9 checklist lines and all 4 flavor-text messages match the spec
      verbatim, checklist reveals over the paced minimum duration
- [x] `compileCampaign`'s bridge contract/signature is unchanged — no new
      progress-reporting mechanism added
- [x] If `compileCampaign` resolves after the cosmetic minimum has elapsed,
      the screen holds on the final checklist line (still revealed, flavor
      text still rotating) until resolution
- [x] Successful resolution auto-advances to the Opening Strategic Briefing
      with no button click required
- [x] `SAVE_LOCATION_CANCELLED` returns silently to the Commissioning Review
      screen with no error banner and all prior selections intact
- [x] The other five failure reasons show a distinct error state with a
      working "Back to Commissioning Review" action
- [x] Tests cover both the cancel path and at least one real-failure path
      without needing to wait out the full cosmetic timer (fake timers/mocked
      bridge call)
