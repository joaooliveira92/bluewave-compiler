Type: grilling
Status: resolved

## Question

Ticket 02's research found that playable nation **Spain** (and 4
non-playable nations) have zero ship designs and zero construction projects
in `content/production/1880`. A playtester who picks Spain in New Game
lands on an empty Construction screen.

Decide how the MVP handles this: exclude Spain from the New Game
nation-selection flow for now, author minimal placeholder content so it has
at least one ship/design/construction project, accept it as a known
limitation with explicit UI messaging ("no active construction — content
pending"), or something else.

Not blocked by the bridge tickets — this is a content/UX scope call,
answerable independent of the IPC bridge work.

## Answer

**Exclude via the existing gate — no special UI messaging.**

`new-game-nation-screen-state.ts`'s `selectableNations()` already filters
by two gates: `scenario.playableNationIds` ∩
`supportedValues.playerSlotId` ("the engine says which slots it can
currently run"). Ticket 08's design of `NewGameOptions.supportedValues`
should have the bridge/`@bluewave/campaign-engine` layer omit any nation
with zero ship designs *and* zero construction projects (Spain, plus the 4
non-playable nations sharing the gap per ticket 02's research) from
`playerSlotId`. They simply never appear in nation selection — the
mechanism already exists in the UI code for exactly this case, so no new
disabled-state/tooltip UI is needed for MVP.
