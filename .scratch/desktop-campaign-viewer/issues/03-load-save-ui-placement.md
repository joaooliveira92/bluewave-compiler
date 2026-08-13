Type: prototype
Status: open

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

