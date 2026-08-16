# INC-1 — Reorder commissioning flow state machine

**What to build:** Restructure `useNewGameFlow.ts` / `NewGameDraft` /
`campaign-shell-state.ts` to the spec's 9-step order (Nation confirmation →
Rules of the Naval Age → Archetype → Admiral & Campaign Identity → Starting
Fleet Method → Final Commissioning Review → World-generation presentation →
Opening Strategic Briefing → existing Overview dashboard). Nation moves from
its current step 3 position to step 1. Existing screens (Nation selection,
Archetype, Preferences) get rewired into the new order with their content
unchanged. The two brand-new steps (Identity, Fleet Method) ship as minimal
pass-through stubs — a screen with correct default draft field values and a
Next button — so the entire flow is click-through end-to-end even before
their real content lands in later tickets. See
[the assembled spec](../spec.md) for full flow order and rationale.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `NewGameDraft` (or equivalent draft state shape) carries a nation field
      populated at step 1, before preferences/archetype are touched
- [ ] The state machine's step order matches the spec exactly: Nation →
      Rules of the Naval Age → Archetype → Identity → Fleet Method →
      Commissioning Review → World-gen → Briefing → Dashboard
- [ ] Existing Nation selection, Archetype, and Preferences screens render
      unchanged content at their new positions in the sequence
- [ ] Identity and Fleet Method steps exist as stub screens with valid
      default draft values (per spec §4/§5) and a working Next button
- [ ] A full click-through from nation pick to the (stubbed) briefing works
      without errors
- [ ] State-machine/draft-shape unit tests cover the new step order and
      default values
