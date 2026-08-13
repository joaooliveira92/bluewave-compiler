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

**Verdict: Variant C** (revised — see below), a tabbed "Editor" / "Campaign
Save Viewer" split. Reviewer preference over the initially-recommended
Variant A after seeing both live in the prototype. Folded into production:
`index.html` now has an `#tabs` bar with `editorTabBtn`/`viewerTabBtn`; the
existing New/Open/Save/Save As/Compile toolbar and its `#status`/`#output`
moved under `#editorTab`, and `loadSaveBtn`/`#saveStatus`/`#saveOutput` moved
under `#viewerTab` (hidden by default) behind a `.banner-info` explaining the
save viewer is separate from the open project. `main.ts` adds
`showEditorTab`/`showViewerTab` toggling a `.hidden` class and an `.active`
class on the tab buttons; all existing element IDs and handlers
(`handleLoadCampaignSave`, `setProjectUi`, etc.) are unchanged.

*(Original recommendation, superseded):* Variant A — same toolbar, always
enabled — was picked first because it matched what `77d58ab`/`07c9c90` had
already shipped and avoided restructuring the page. The tabbed layout was
judged clearer once compared side-by-side in the prototype: it makes the
"this is a different, read-only concern" framing an up-front visual fact (a
tab boundary) rather than something the banner text in Variant A's toolbar had
to explain implicitly.

**Labeling:** "Load Campaign Save" (not "Open Save" or "Load Save") — reads
distinctly from "Open Project" and names the domain object (`CampaignSave`)
directly, avoiding the "project" word entirely so the two concepts can't be
conflated at a glance. Tab labeled "Campaign Save Viewer" for the same reason.

**Mutual exclusivity: no** — visually separated (own tab) but not gated.
Switching tabs doesn't clear or block anything; a project can stay open on the
Editor tab while a save is loaded on the Viewer tab, matching the ticket's own
example (project open for authoring, save loaded for viewing side-by-side).
`setProjectUi`'s disabled-state wiring (`saveBtn`, `saveAsBtn`, `compileBtn`)
still never touches `loadSaveBtn`, and vice versa — only the *visibility* of
the two toolbars is now tab-gated, not the underlying state.

**Loading/empty/error states:** unchanged from the existing implementation —
`setSaveStatus`/`saveOutputEl.className` mirror the `setStatus`/`setError`
pattern (`"Loading campaign save..."` → `"Campaign save loaded!"` success /
`"Load failed"` error with diagnostics listed), with dialog-cancel treated as
a silent no-op (empty status) rather than an error, matching `handleCompile`'s
and `handleOpen`'s existing cancel handling.

