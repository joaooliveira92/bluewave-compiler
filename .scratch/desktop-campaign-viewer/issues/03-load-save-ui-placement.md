Type: prototype
Status: resolved

## Question

How should the "Load Save" action look and behave relative to the existing
Open/Save Project and Compile buttons in `apps/desktop`'s single-window UI?

- Where does the button live, and how is it labeled to avoid confusion with
  "Open Project" (content-authoring archive, a different domain concept from a
  campaign save)?
- Is loading a save mutually exclusive with having a project open, or can both be
  active at once (e.g. project open for authoring, save loaded for viewing)?
- What does the loading/empty/error state look like in the same plain-DOM style as
  the rest of the UI (see `src/renderer/src/main.ts`'s `setStatus`/`setError`
  pattern)?

Use the `/prototype` skill to build a rough, throwaway stub to react to before
locking this down.

## Answer

**Prototype:** three placement variants (same toolbar / separate "Campaign Save
Viewer" panel / tabbed Editor-vs-Viewer), switchable via `?variant=A|B|C`, on
branch `prototype/desktop-load-save-ui-placement`
(`apps/desktop/src/renderer/PROTOTYPE-load-save-ui/index.html`, not on `dev`).

**Verdict: Variant A** — the "Load Campaign Save" button stays in the same
`#fileActions` toolbar as New/Open/Save/Save As/Compile, always enabled
(independent of `hasProject`), with its own `#saveStatus`/`#saveOutput` pair
below the compile output so the two actions never clobber each other. This is
also what `77d58ab`/`07c9c90` already shipped while ticket 01/02 were being
implemented — the prototype exercise confirmed it rather than changing it, so
no production code changed as a result of this ticket.

**Labeling:** "Load Campaign Save" (not "Open Save" or "Load Save") — reads
distinctly from "Open Project" and names the domain object (`CampaignSave`)
directly, avoiding the "project" word entirely so the two concepts can't be
conflated at a glance.

**Mutual exclusivity: no.** Loading a save does not require, gate on, or clear
an open project — `setProjectUi`'s disabled-state wiring (`saveBtn`,
`saveAsBtn`, `compileBtn`) never touches `loadSaveBtn`, and vice versa. This
was deliberate, not an oversight: the ticket's own example (project open for
authoring, save loaded for viewing side-by-side) is a real MVP use case, and
Variants B/C's alternative — a visually separate panel or a tabbed
editor/viewer split — were rejected specifically because they'd manufacture a
mutual-exclusivity feeling (a panel boundary or tab switch) that doesn't match
how the two actions are actually used. Revisit only if/when a structured
per-domain save-viewer panel (deferred in ticket 02) makes the flat toolbar
feel crowded.

**Loading/empty/error states:** unchanged from the existing implementation —
`setSaveStatus`/`saveOutputEl.className` mirror the `setStatus`/`setError`
pattern (`"Loading campaign save..."` → `"Campaign save loaded!"` success /
`"Load failed"` error with diagnostics listed), with dialog-cancel treated as
a silent no-op (empty status) rather than an error, matching `handleCompile`'s
and `handleOpen`'s existing cancel handling.

