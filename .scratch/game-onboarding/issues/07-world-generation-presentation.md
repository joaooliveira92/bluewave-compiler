# World-generation presentation

**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec the "Establishing the Naval Order" world-generation presentation
(diagnosis doc step 8) that replaces today's plain disabled-button
"Starting…" state (`NewGameNationScreen.tsx`) shown while `compileCampaign`
runs.

Cover:
- The checklist of report lines and their sequencing/timing (real progress
  vs. a fixed cosmetic sequence — `compileCampaign` today has no progress
  events, so decide whether this needs new progress-reporting from the
  bridge or can stay a client-side cosmetic sequence gated on the single
  compile call's completion).
- The rotating flavor-text messages.
- Transition into the opening strategic briefing (ticket 08) on completion,
  and error handling if `compileCampaign` fails mid-presentation.

## Answer

**Progress model**: purely cosmetic, client-side, decoupled from real
progress. `compileCampaign` is one opaque bridge call with no per-stage
instrumentation (confirmed by reading `compileCampaign.ts` — create session
→ compile → validate nation/slot → native OS save-directory dialog →
`SaveStore.save` → write session metadata → register session → return). No
new bridge/engine progress-reporting is added; the 9 checklist lines don't
map to real instrumented stages.

**Handling the indeterminate native save dialog** (the crux of this
ticket): the save-directory prompt (`dialog.showSaveDialog`) sits inside
the same opaque `compileCampaign` call, of unknown/indefinite duration.
`compileCampaign`'s bridge contract stays **untouched** — no restructuring
to split the prompt out into an earlier step, which would be real
bridge-contract code, not a UI spec (the map's Notes only carve out an
engine-work exception for fleet-method semantics, not this). Instead: the
fixed 9-line checklist + flavor-text sequence plays over a bounded minimum
duration (~2.5–3s, paced to be readable), and if the real
`compileCampaign` call hasn't resolved by then — including however long
the player takes on the native dialog — the screen holds on the final
checklist line (fully revealed, flavor-text still rotating) until it does.
Flagged as a known rough edge, not fixed by this effort; a candidate for a
future ticket if it proves janky in practice.

**Flavor-text messages**: reuse the doc's four verbatim (generic, not
nation/era-specific, no new authoring needed): "Foreign ship
characteristics are based on intelligence estimates.", "Technological
discoveries will not always follow history.", "A large fleet may become
unsustainable during an economic downturn.", "A navy built for the last
war may be unsuited to the next one." Rotate on a fixed interval (~2s),
independent of the checklist reveal pace.

**Transition to Opening Strategic Briefing (ticket 08)**: automatic, no
button — fires once both the cosmetic minimum has elapsed and the real
call has resolved successfully. Matches the doc's "reports arriving"
framing; both this screen and ticket 08 are one-shot/non-interactive.

**Error handling** — two treatments, not one generic error state:
- `SAVE_LOCATION_CANCELLED` (player hit Cancel on the OS file picker) —
  not a failure. Silently return to the Commissioning Review screen
  (ticket 06) with selections intact, no error banner.
- The other five reasons (`INVALID_CAMPAIGN_CONFIGURATION`,
  `COMPILE_FAILED`, `UNKNOWN_PLAYER_SLOT`, `PLAYER_SLOT_NOT_SUPPORTED`,
  `SAVE_FAILED`) — replace the checklist/flavor-text UI with a real error
  state: short message + "Back to Commissioning Review" action.
