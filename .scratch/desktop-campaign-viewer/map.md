# Wayfinder Map: Desktop Campaign Viewer

## Destination

Produce a milestone brief (matching the B9/B10 pattern at `.ai/briefs/`) scoping a
read-only campaign-state viewer for `apps/desktop`: load an existing
`@bluewave/persistence` `SaveStore` save and render its snapshot (economy, nations,
fleets, diplomacy) as a new action in the same window, reusing the existing
diagnostics-list/JSON-dump rendering pattern already used by `compile`. This is the
"later milestone" B9 deferred read-only render to (`.scratch/engine-suite-roadmap/issues/02-b9-desktop-content-display.md`).

## Notes

- Domain: `engine-suite.md` governs roadmap order/scope; `.ai/ENGINEERING-CONTRACT.md`
  and `.ai/IMPLEMENTATION-PROMPT.md` govern implementation. `apps/desktop` was scoped
  in B9 (`.scratch/engine-suite-roadmap/map.md`, `.ai/briefs/b9-desktop-shell.md`) —
  this map is a follow-on side track, not a numbered roadmap milestone.
- Skills: `/grilling` and `/domain-modeling` for scope decisions; `/prototype` for
  "how should it look/behave" questions; `/research` for any package-API
  investigation before committing.
- Side track: lower priority than the active B-3..B-6 tactical-combat track (M2
  gunnery/armor/weather/results). Should not block or compete with it.
- Charting-session facts (from direct inspection, not decisions — re-verify if stale):
  - `apps/desktop` renderer has no framework — plain DOM/TS in
    `src/renderer/src/main.ts`, driven by `window.electronAPI` exposed from
    `src/preload/index.ts`. `compile` output is rendered as `JSON.stringify(...)`
    text into an `outputEl` — the pattern to reuse.
  - `@bluewave/persistence`'s `SaveStore` (`packages/persistence/src/store.ts`) has
    `save`, `load`, `loadById`, `list`, `getActiveSaveId`, `getPreviousSaveId`. Not
    yet a dependency of `apps/desktop` (only `@bluewave/campaign` and
    `@bluewave/combat` are, per `apps/desktop/package.json`).
  - `SaveStore.load`/`loadById` return `CampaignState { snapshot: CampaignSnapshot,
    envelope, rawHash }`. `CampaignSnapshot` (`packages/campaign/src/state.ts:265`)
    holds `nations`/`designs`/`designFamilies` as `Map`, plus `world`, `wars`,
    `politics`, `intelligence` — not directly `JSON.stringify`-able without
    conversion (Electron IPC's structured-clone does support `Map`, but JSON
    rendering in the DOM output panel does not).
  - Existing corrupt/missing-save diagnostic codes already defined:
    `CORRUPT_SAVE_CODE`, `MISSING_SAVE_CODE`, `CANCELLED_CODE` in `store.ts`.
- Locked scope (settled during charting, not tickets — see Destination):
  read-only only (no command-issuing, no phase-engine driving from the UI);
  `SaveStore`-backed (no new turn-advancing IPC); reuse existing
  diagnostics-list/JSON-dump rendering; new action in the same window, same
  plain-DOM style (no framework migration); brief stays agnostic about which
  fixture/save to target — implementation picks the nearest existing test fixture.
- Do not resolve more than one non-research ticket per session.

## Decisions so far

- Ticket 01 (`issues/01-load-save-ipc-contract.md`, resolved): single
  `campaign:load-save` channel, dialog-fallback `saveDir?` request (mirrors
  `compile`), always loads the active save via `SaveStore.load`. Response is a
  thin, complete pass-through of the full `CampaignSnapshot` (Maps recursively
  converted to plain objects) plus `envelope`/`rawHash`, reusing `CompileResult`'s
  `diagnostics: [...]` shape. Zod-validates the IPC envelope per
  `.ai/ENGINEERING-CONTRACT.md`'s Electron boundary rule (not a B9 brief — the
  ticket's "B9 Zod principle" reference was a misattribution). Added
  `@bluewave/persistence` and `zod` as `apps/desktop` dependencies. Surfaced but
  did not fix: `SaveStore.save` silently drops Map-valued fields on serialize
  (pre-existing bug in `@bluewave/persistence`, separate from this track).

## Not yet specified

- Structured per-domain panels (nations/treasury/fleets/diplomacy as real UI, not a
  JSON dump) — graduates once the MVP JSON-dump viewer proves the save-loading
  plumbing works.
- Tactical battle visualization (movement/spotting/contacts from B-1/B-2) — graduates
  once the B-3..B-6 tactical-combat track stabilizes the tactical model further.

## Out of scope

- Issuing commands from the UI (economy, research, diplomacy, tactical orders) —
  ruled out by the read-only scope decision (Q3 of charting session).
- Running/advancing the campaign engine (turns) from the desktop app, and writing
  new saves from the UI — read-only means loading existing `SaveStore` saves only,
  not producing them.
