# Desktop E2E Coverage — 03: Spec Decomposition & Coverage Matrix

Type: grilling
Status: open
Blocked by: (none)

## Question

What exactly does the suite contain — the decomposition of the approved
scope (the full MVP critical path, user-visible behavior assertions) into
individual Playwright specs, and each spec's definition of done?

Walk the playable loop and decide, one flow at a time:

- **New Game**: one spec for archetype → nation → preferences, or split per
  step? Which inputs are typed (fixed `campaignSeed`, a nation, an archetype
  preset) and what visible state confirms compile landed (post-open landing
  on Overview with the right month/treasury/nation)?
- **Advance a month** (`commitMonth`): what does a passing advance assert —
  the turn/calendar change, a battle auto-resolving inline (per desktop-mvp
  ticket 09), the Turn Report tab reflecting the month?
- **Construction ordering**: submit/replace/cancel — does one spec cover the
  three, and what does the `CommandTable` must render after each?
- **Fleet visibility**: read-only — what does the Fleet screen render for a
  compiled campaign (an empty divergences list is honest — `FleetState` is
  the source; `compiler` emits no divisions)?
- **Save/Load and continuity**: one spec or four (load / verify / replay /
  recover)? Which runs against the shipped production package and what does
  each assert (state restored, report integrity OK, tamper → mismatch visible,
  recovery restores a corrupted package)?
- Recording `NOT_IMPLEMENTED` stubs that the UI still exposes (movement
  ordering, save/close): do specs assert their disabled/error state (so
  coverage doesn't silently claim what isn't there)?

Deliverable: a coverage matrix (spec → flow buttons → seed/save → key
assertions → blocked-by/status) captured on this ticket, ready to hand to the
follow-up implementation effort.