Type: grilling
Status: resolved

## Question

Design the IPC contract for loading a campaign save into `apps/desktop`, following
the existing `compile`/`project:*` channel patterns in `src/main/index.ts` and
`src/preload/index.ts`:

- Channel name(s) (e.g. `campaign:load-save`) and the shape of its request (save
  directory/id?) and response.
- How does `CampaignSnapshot`'s `Map`-valued fields (`nations`, `designs`,
  `designFamilies`) cross the boundary — converted to plain objects/arrays in main
  before sending, or left as `Map` and relying on Electron's structured-clone
  support? Whichever is chosen must still land in a form the renderer's
  `JSON.stringify`-based output panel can display.
- Error handling: how do `SaveStore`'s `CORRUPT_SAVE_CODE`/`MISSING_SAVE_CODE`
  diagnostic codes surface to the renderer — same `diagnostics: [...]` shape as
  `CompileResult`, or a new result type?
- Whether/how the channel is Zod-validated, matching B9's "narrow Zod-validated
  capabilities" principle.
- Whether `@bluewave/persistence` needs to be added as an `apps/desktop` dependency
  (it currently isn't).

## Answer

**Channel:** single channel `"campaign:load-save"` (no separate list channel yet).
Always loads the *active* save in a given/dialog-picked directory via
`SaveStore.load`; `loadById`/`list` deferred to a future ticket if a save-picker UI
is ever built.

**Preload (`src/preload/index.ts`):**
```ts
loadCampaignSave(saveDir?: string): Promise<LoadSaveResult>
// -> ipcRenderer.invoke("campaign:load-save", saveDir)
```

**Main (`src/main/index.ts` + `src/main/campaignSave.ts`):** handler takes an
optional `saveDir`; if omitted, opens a directory-picker dialog (mirrors
`handleCompile`). Calls `SaveStore.load(dir, diagnostics)`. Recursively converts
every `Map` in the returned `CampaignSnapshot` to a plain object — including the
nested `activeCandidates` Map inside each nation's `research` — before sending, so
the renderer's `JSON.stringify`-based output panel can render it (`mapsToPlainObjects`
in `campaignSave.ts`).

**Result type (`LoadSaveResult`):**
```ts
interface LoadSaveResult {
  success: boolean;
  snapshot?: Record<string, unknown>; // full snapshot, Maps -> objects, no trimming
  envelope?: Record<string, unknown>;
  rawHash?: string;
  diagnostics: Array<{ code: string; severity: string; message: string }>;
  error?: string;
}
```
Diagnostics fed by a `DiagnosticCollector` passed into `SaveStore.load`, surfacing
`CORRUPT_SAVE_CODE`/`MISSING_SAVE_CODE` the same way `compile` surfaces its
diagnostics — reuses the renderer's existing diagnostics-list rendering unmodified.
`CANCELLED_CODE` is not wired up: `SaveStore.load` only emits it when passed an
already-aborted `AbortSignal`, and `loadCampaignSave` doesn't accept one — a local
save-directory read isn't "long-running" under ENGINEERING-CONTRACT.md's own
Cancellation rule, so adding abort-controller plumbing purely to make that one code
reachable would be speculative generality with no real use case. What the renderer
actually displays/formats from `snapshot` is deferred to ticket 02; this ticket
stays a thin, complete pass-through.

**Zod validation:** `.ai/ENGINEERING-CONTRACT.md`'s Electron boundary section
mandates "Validate IPC requests and responses with Zod" — this, not anything in the
B9 briefs, is the actual "Zod principle" the question referenced (the B9 briefs
don't mention Zod at all, and the existing `compile`/`project:*` channels don't
follow this mandatory rule either — pre-existing non-compliance, not grounds to
repeat it in new code). `campaignSaveSchema.ts` defines `LoadSaveRequestSchema`
(`z.string().optional()`) and `LoadSaveResultSchema`, validating the envelope
crossing the IPC boundary. `snapshot`'s deep contents are typed
`z.record(z.string(), z.unknown())` rather than a full re-derivation of
`CampaignSnapshot`'s ~20 interfaces in Zod, since that structure's correctness is
already guaranteed by `SaveStore`'s own hash/envelope verification
(`CORRUPT_SAVE_CODE`).

**Dependency:** added `@bluewave/persistence: "workspace:*"` and
`zod: "^3.24.0"` to `apps/desktop/package.json`.

**Known limitation surfaced during implementation, not fixed here:** `SaveStore.save`
(`packages/persistence/src/store.ts`) serializes state via plain `JSON.stringify`,
which silently turns `Map`-valued fields into `{}` — so saves produced today
already lose `nations`/`designs`/`designFamilies` data before this channel even
runs. Pre-existing bug in `@bluewave/persistence`, out of scope for this ticket.

