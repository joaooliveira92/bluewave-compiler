Type: prototype
Status: resolved
Blocked by: 01, 02, 03

## Question

Build a rough, throwaway prototype (via `/prototype`) of the Editor and
Campaign Save Viewer screens composed from the `components/ui/` kit files
selected in "Component Mapping" (ticket 01), using the styling foundation from
"Styling Foundation" (ticket 02) and the working React build from "React Build
Wiring" (ticket 03). React state replaces `main.ts`'s imperative DOM
manipulation (`setStatus`/`setError`/`setProjectUi`) one-to-one — same IPC
calls (`compile`, `project:*`, `campaign:load-save`), same behavior, new
presentation only.

This is the "how should it look/behave" decision — react to the prototype
live, then fold the agreed version into production, same pattern as the
Desktop Campaign Viewer map's UI-placement ticket.

## Answer

Given the scope is small (2 screens, 7 components, behavior held fixed
1:1 with the existing plain-DOM version), the prototype and the production
fold happened as one step rather than two — `src/renderer/src/App.tsx` *is*
both. Composition:

- `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (uncontrolled, `defaultValue="editor"`)
  replace the old `.hidden`-class toggling and `editorTabBtn`/`viewerTabBtn`.
- Each tab's content is a `Card` (`CardHeader`+`CardTitle`+`CardContent`)
  instead of a bare `<div>`.
- Toolbar actions are `Button`s: `variant="outline"` for
  New/Open/Save/Save-As, `variant="default"` (primary) for Compile/Load
  Campaign Save.
- `setStatus`/`setError`'s text+className pattern becomes React state
  (`{ text, variant: "default" | "destructive" }`) rendered through
  `Alert`/`AlertDescription` — `"success"` styling folds into `"default"`
  since the kit's `alert.tsx` only has two variants.
- Output panels (`#output`/`#saveOutput`) become `ScrollArea` wrapping a
  `<pre>` with the same unmodified `JSON.stringify(subset, null, 2)` text —
  no formatting change, per the Desktop Campaign Viewer map's ticket 02.
  decision.
- Compile/Load buttons show a `Spinner` (`lucide-react`'s `Loader2`) while
  their async call is in flight — the one small addition beyond a strict
  1:1 swap (see ticket 01's answer for why this was judged in-scope).
- All IPC calls (`compile`, `openProject`, `newProject`, `saveProject`,
  `saveProjectAs`, `loadCampaignSave`) and their control flow (cancel
  handling, disabled-until-project-open gating) are unchanged from
  `main.ts` — only extracted into `src/renderer/src/electronApi.ts` (typed
  `ElectronAPI` interface + `extractSnapshotSubset`) so `App.tsx` stays
  focused on presentation.

Verified with a smoke test (`test/App.test.tsx`): renders both tab labels
and the toolbar, and confirms project-dependent actions stay disabled until
a project is opened.

