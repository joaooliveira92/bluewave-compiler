# Define legacy-fleet-mode semantics

**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

The engine validates three `legacyFleetModeId`s (`historical`, `generated`,
`disabled` — `packages/campaign/src/scenario.ts`) but no fleet-generation
behavior is implemented behind any of them yet. Before the Starting-Fleet-
Method screen (ticket 05) can be spec'd, decide:

- What does each existing id actually mean in gameplay terms? Do they map
  onto the diagnosis doc's three options (A: inherit a generated legacy
  fleet, B: manually build the legacy fleet, C: curated historically-inspired
  fleet), and if so which id is which?
- Does the doc's option C ("curated fleet") require a 4th mode, or does an
  existing id already cover it?
- Is actually implementing the fleet-generation behavior in scope for the
  team following this spec, or is this ticket only pinning the *meaning* of
  each id so the screen's copy is truthful, leaving generation logic as a
  separately-scoped engine task?

This is a decision ticket, not an implementation ticket — the answer is the
id→meaning mapping (and any new id needed), not working code.

## Answer

id→meaning mapping (note the naming trap: `historical` is *not* the manual-build
option — it's the doc's flavor-only "curated" option):

- **`generated`** → doc's **Option A: Inherit an existing navy**. The doc's own
  text says "the official manual recommends starting with a *generated* legacy
  fleet" — this is the recommended default, an operational-but-aging navy the
  player must modernize rather than design from scratch.
- **`disabled`** → doc's **Option B: Build the legacy fleet manually**. Read as
  "automatic generation is disabled," leaving construction to the player —
  matches the doc's era-gating language ("only enable this when supported by
  your selected era").
- **`historical`** → doc's **Option C: Curated historical-inspired fleet**. Not
  "recreate real history manually" — a balanced, nation/era-tailored navy
  labeled as historically inspired, generated rather than hand-built.

No 4th id is needed — the three existing ids fully cover the doc's A/B/C.

Implementing the actual fleet-generation/manual-build/curation *behavior* is
**out of scope** for this spec. Nothing in the engine currently branches on
this id at all (confirmed by grep — it only flows through as a validated
string, displayed verbatim in `RulesetPanel.tsx`). This ticket only pins the
id→meaning mapping so the Starting-Fleet-Method screen (ticket 05) can carry
truthful copy; the generation/build/curation logic itself is a separately-
scoped future engine task. Ticket 05's spec should note that selecting a mode
today doesn't yet produce a real starting fleet.
