Type: grilling
Status: resolved

## Question

Map the current Editor/Campaign-Save-Viewer UI (`apps/desktop/src/renderer/index.html`
+ `src/main.ts`) onto specific `components/ui/*.tsx` files:

Current elements: tab bar (`#tabs`, `editorTabBtn`/`viewerTabBtn`), toolbar buttons
(New/Open/Save/Save-As/Compile, Load Campaign Save), status line (`setStatus`/
`setError`), output panels (`#output`/`#saveOutput`, plain `<pre>`-style
`JSON.stringify` text), and the info banner on the Viewer tab.

Available kit (37 files): `accordion`, `alert-dialog`, `alert`, `badge`,
`button-group`, `button`, `card`, `command`, `dialog`, `empty`, `field`,
`glass-card`, `gradient-background-text`, `hover-card`, `input`, `item`, `kbd`,
`label`, `liquid-glass`, `number-ticker`, `popover`, `progress`, `radio-group`,
`scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `spinner`,
`table`, `tabs`, `textarea`, `toggle-group`, `toggle`, `tooltip`.

For each current UI element, decide: which kit component replaces it (e.g. tab
bar → `tabs.tsx`, toolbar buttons → `button.tsx`, banner → `alert.tsx`, output
panels → `card.tsx` + plain text or `scroll-area.tsx`), and which kit components
are **not** needed for this scope (most of the 37 — `sidebar`, `command`,
`table`, `select`, etc. don't correspond to anything in the current two screens).

Only components that map to something real get adopted — this ticket produces
the concrete "copy these N files" list the implementation tickets act on.

## Answer

**Adopted (6 of 37 — `separator` initially copied on a "check during
implementation" note, confirmed unused, and removed; see Correction below):**

| Current element | Kit component | Notes |
|---|---|---|
| `#tabs` (Editor/Viewer tab bar) | `tabs.tsx` | `Tabs`/`TabsList`/`TabsTrigger` replace `editorTabBtn`/`viewerTabBtn` + `.hidden` toggling |
| Toolbar buttons (New/Open/Save/Save As/Compile/Load Campaign Save) | `button.tsx` | `variant="outline"` for secondary actions, `variant="default"` for primary (Compile/Load) |
| Editor panel, Viewer panel containers | `card.tsx` | `Card`/`CardHeader`/`CardContent` wrap each tab's content, replacing bare `<div id="editorTab">`/`<div id="viewerTab">` |
| Status line (`setStatus`/`setError`) | `alert.tsx` | `variant="destructive"` for errors, `variant="default"` for success/info — replaces the plain `<div id="status">`/`className="error"` pattern |
| Viewer tab's info banner | `alert.tsx` | Same component as status, `variant="default"`, reused rather than adding a second kit component for one banner |
| `#output`/`#saveOutput` (JSON dump) | `scroll-area.tsx` | Wraps the existing raw `JSON.stringify` text in a scrollable region — content format unchanged, per the Desktop Campaign Viewer map's "no formatting beyond JSON.stringify" decision |
| Compile/Load button disabled-pending state | `spinner.tsx` | Small addition beyond a strict 1:1 swap — current UI has no loading indicator (just disables the button and changes status text); a spinner is a natural fit for "Compiling..."/"Loading campaign save..." and needs no new IPC/state, so it's included rather than treated as scope creep. |

**Correction (found in code review):** `separator` was copied speculatively
against the "pulled in transitively by scroll-area" guess below, but the
implementation never actually checked that — `scroll-area.tsx` doesn't import
it, and nothing in `App.tsx` uses `Separator` either. Removed as dead code;
6 components ship, not 7.

**Explicitly not needed for this scope (30 of 37):** `accordion`, `alert-dialog`,
`badge`, `button-group`, `command`, `dialog`, `empty`, `field`, `glass-card`,
`gradient-background-text`, `hover-card`, `input`, `item`, `kbd`,
`liquid-glass`, `label`, `number-ticker`, `popover`, `progress`,
`radio-group`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `table`,
`textarea`, `toggle-group`, `toggle`, `tooltip` — none correspond to anything
in the current two screens (no forms, no navigation sidebar, no data tables,
no multi-step dialogs). Revisit only if a future ticket adds a feature that
needs one.

**Dependency footprint from this selection:** `tabs`/`scroll-area` need
`@base-ui/react`; `button`/`alert` need
`class-variance-authority`; none of the 7 need `cmdk` or `lucide-react`
directly (no icons used in the current toolbar text-only buttons) or `motion`
(no animation in the current behavior) — but per the charted dependency
stance, ticket 03 still installs the full set rather than trimming, since a
future ticket may need them and re-deriving the minimal set each time isn't
worth the churn.

