Type: task
Status: open
Blocked by: 03

## Question

Repoint `apps/desktop/src/renderer/index.html` to boot `shell/App.tsx`
instead of the current entry (`src/renderer/src/main.tsx` → `App.tsx` — the
closed-out product of `desktop-ui-kit-migration`/`desktop-campaign-viewer`,
not legacy drift). Add `shell/`, `screens/`, `components/`, `content/`,
`lib/` to `tsconfig.web.json`'s `include` so the game-client tree is
type-checked (this reverses `desktop-ui-kit-migration` ticket 03's
deliberate exclusion of that tree — reversal confirmed in scope for this
map).

Decide, per the map's "Not yet specified" note on how the current
Editor/Campaign Save Viewer relates to the new shell: coexist (e.g. as a
dev-only screen), get its read-only save-inspection use case subsumed by
the shell's Campaign File screen and then get retired, or something else.
`compiler-cli` already covers compile/battle/gunnery debugging from the
terminal, so the Editor half of the current entry point is not load-bearing
for anything the CLI can't already do.
