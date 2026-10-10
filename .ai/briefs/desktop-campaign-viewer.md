# Milestone: Desktop Campaign Viewer

## Objective

Add a read-only campaign-state viewer to `apps/desktop`: load an existing
`@bluewave/persistence` `SaveStore` save and display a curated subset of its
snapshot (turn, campaign id, nations, wars, diplomacy) in the same window as the
existing content-authoring/compile flow, without introducing any command-issuing
or turn-advancing capability. This is the "later milestone" B9 deferred read-only
render to (see `.ai/briefs/b9-desktop-shell.md`, In scope: "MVP uses vanilla
HTML/JS"; Out of scope: "File save/load, turn execution, or replay from the
desktop app" — this milestone adds save _loading_ only, still no turn execution).

Charted and scoped via `/wayfinder` — see `.scratch/desktop-campaign-viewer/map.md`
for the full decision trail.

## Canonical requirements

BW-ARC-001, BW-ARC-002 (UI state is never authoritative; the viewer only ever
displays a snapshot already produced and hashed by the engine). BW-SEC-001
(Electron IPC boundary: narrow, Zod-validated capabilities), per
`.ai/ENGINEERING-CONTRACT.md`'s Electron boundary section.

## Starting state

`apps/desktop` (B9) is a minimal Electron shell: `compile` IPC channel, and
`project:open`/`project:new`/`project:save`/`project:save-as` for a content-authoring
`.bluewave` archive. Renderer is framework-free (plain DOM/TS in
`src/renderer/src/main.ts`), driven by `window.electronAPI`. `@bluewave/persistence`
exists (`SaveStore.save`/`load`/`loadById`/`list`/`getActiveSaveId`) but was not yet
a dependency of `apps/desktop`. `SaveStore.load` returns a `CampaignState` whose
`CampaignSnapshot` holds `nations`/`designs`/`designFamilies` as `Map` — not directly
`JSON.stringify`-able, the format the renderer's existing output panel uses.

## In scope

- New `campaign:load-save` IPC channel: dialog-fallback `saveDir?` request (mirrors
  `compile`), always loads the _active_ save via `SaveStore.load`. `loadById`/`list`
  (a save picker) explicitly deferred.
- Main-process handler (`src/main/campaignSave.ts`) recursively converts every `Map`
  in the returned snapshot to a plain object (`mapsToPlainObjects`, including the
  nested `activeCandidates` Map inside each nation's `research`) before returning it.
- Renderer displays a curated subset only: `{ turnNumber, campaignId, nations, wars,
  diplomacy: politics.relations }`, rendered as plain `JSON.stringify(subset, null, 2)`
  — no reordering, no summarization — into a dedicated `#saveStatus`/`#saveOutput`
  pair, separate from the `compile` output panel.
- Diagnostics reuse the existing `diagnostics: [...]` shape (`CompileResult`'s
  pattern); `SaveStore`'s `CORRUPT_SAVE_CODE`/`MISSING_SAVE_CODE` surface through a
  `DiagnosticCollector` passed into `SaveStore.load`.
- Zod validation of the IPC envelope (`src/main/campaignSaveSchema.ts`):
  `LoadSaveRequestSchema` (`z.string().optional()`), `LoadSaveResultSchema`
  (envelope-level; `snapshot`'s deep contents stay `z.record(z.string(),
  z.unknown())` rather than re-deriving `CampaignSnapshot`'s ~20 interfaces, since
  correctness there is already guaranteed by `SaveStore`'s own hash/envelope
  verification).
- Renderer UI: tabbed "Editor" / "Campaign Save Viewer" split (`#tabs`,
  `editorTabBtn`/`viewerTabBtn` toggling a `.hidden` class). Existing
  New/Open/Save/Save As/Compile toolbar moves under `#editorTab`; a new "Load
  Campaign Save" button and its output panel live under `#viewerTab` (hidden by
  default), with a `.banner-info` explaining the save viewer is a separate concern
  from the open content-authoring project. Tabs are **not** mutually exclusive — a
  project can stay open on Editor while a save is loaded on Viewer.
- `@bluewave/persistence` and `zod` added as `apps/desktop` dependencies.

## Out of scope

- Issuing commands from the UI (economy, research, diplomacy, tactical orders).
- Running/advancing the campaign engine (turns) from the desktop app, and writing
  new saves from the UI — read-only means loading existing `SaveStore` saves only.
- Structured per-domain panels (nations/treasury/fleets/diplomacy as real UI
  instead of a JSON dump) — future milestone, once this MVP proves the
  save-loading plumbing.
- Tactical battle visualization (movement/spotting/contacts from B-1/B-2) — future
  milestone, once the B-3..B-6 tactical-combat track stabilizes the tactical model.
- A save picker (`loadById`/`list`) — only the active save loads for now.
- **Fixing `SaveStore.save`'s Map-serialization bug** (see Known Limitations below)
  — that is a `@bluewave/persistence` data-integrity defect, not owned by this
  `apps/desktop` side track. Tracked as a separate follow-up bug, not chartered here.
- Cancellation/abort plumbing for `campaign:load-save` — a local save-directory read
  isn't "long-running" under `.ai/ENGINEERING-CONTRACT.md`'s Cancellation rule, so
  `SaveStore.load`'s `CANCELLED_CODE` path (only reachable with an already-aborted
  `AbortSignal`) is intentionally not wired up.

## Required implementation

Already delivered — see `apps/desktop/src/main/campaignSave.ts`,
`apps/desktop/src/main/campaignSaveSchema.ts`, `apps/desktop/src/preload/index.ts`
(`loadCampaignSave`), `apps/desktop/src/renderer/index.html` and
`src/renderer/src/main.ts` (`showEditorTab`/`showViewerTab`,
`handleLoadCampaignSave`). Commits: `77d58ab` (IPC channel), `07c9c90` (curated
render), `345ef97` (tabbed layout).

## Acceptance tests

1. Unit test: `loadCampaignSave` given a valid save directory returns
   `{ success: true, snapshot, envelope, rawHash }` with every `Map` field
   converted to a plain object.
2. Unit test: `loadCampaignSave` given a missing/corrupt save directory returns
   `{ success: false, diagnostics: [...] }` carrying `MISSING_SAVE_CODE` /
   `CORRUPT_SAVE_CODE`.
3. Zod schema test: `LoadSaveRequestSchema`/`LoadSaveResultSchema` accept the
   shapes above and reject malformed envelopes.
4. Renderer test/smoke: switching to the "Campaign Save Viewer" tab and clicking
   "Load Campaign Save" renders the curated subset into `#saveOutput` without
   touching `#output`/`#status` (the Editor tab's compile panel).
5. Dialog-cancel on the save-directory picker is a silent no-op (empty status),
   matching `handleCompile`/`handleOpen`'s existing cancel handling — not treated
   as an error.
6. Process/IPC smoke test (extends B9's): `campaign:load-save` round-trips
   through the real Electron IPC boundary, not just an in-process function call.

## Determinism proof

Not applicable — the viewer is non-authoritative (BW-ARC-002) and displays a
snapshot already hashed and verified by `SaveStore`/`@bluewave/deterministic`. No
new determinism claims are made by this milestone.

## Compatibility and versions

No on-disk format changes. No new save/compatibility version. Reads existing
`SaveStore` saves as-is; see Known Limitations for what those saves currently do
and do not contain.

## Known Limitations

**`SaveStore.save` silently drops `Map`-valued fields on write.**
`packages/persistence/src/store.ts` serializes `CampaignState` via plain
`JSON.stringify`, which turns every `Map`-valued field — `nations`, `designs`,
`designFamilies`, and the nested `activeCandidates` Map inside each nation's
`research` — into `{}`. This means **any save written today will render with an
empty `nations` block in this viewer**, even though `nations` is exactly the field
this milestone's curated subset is built around.

This is a save-_writing_ defect in `@bluewave/persistence`, not a defect in this
viewer or its `campaign:load-save` channel (which correctly displays whatever a
save actually contains). It was deliberately left out of this milestone's scope
(`.scratch/desktop-campaign-viewer/issues/04-savestore-map-serialization-bug.md`)
because fixing it belongs to a separate `@bluewave/persistence`-scoped effort, not
this `apps/desktop` side track. It resolves itself once persistence is fixed and
new saves are written — no viewer change will be needed.

## Stop conditions

- If a save directory's `CampaignSnapshot` shape changes incompatibly with what
  `mapsToPlainObjects` expects (e.g. a new non-Map, non-plain-object nested type),
  stop and assess rather than silently mis-rendering.
- Do not add command-issuing IPC channels, turn advancement, or save writing from
  the desktop app under this milestone.
- Do not fix the `SaveStore.save` Map-dropping bug under this milestone — file it
  separately against `@bluewave/persistence`.

## Required delivery

- Code and tests: delivered across `77d58ab`, `07c9c90`, `345ef97`.
- Traceability: this brief, plus `.scratch/desktop-campaign-viewer/map.md` and its
  four resolved tickets (IPC contract, rendered snapshot shape, UI placement,
  persistence-bug scoping decision).
- Known Limitations section above stands in place of a separate decision-request —
  the persistence bug is flagged, not silently absorbed.
- Follow-up: open a separate bug ticket against `@bluewave/persistence` for the
  `SaveStore.save` Map-dropping defect.
