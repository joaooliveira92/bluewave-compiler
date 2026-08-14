Type: grilling
Status: resolved
Blocked by: 07

## Question

Design the new-game and campaign-file (continuity) contracts, covering the
commands and shared types those two screen families already call:

- **New game** (`shared/new-game-contract.ts`, doesn't exist): the
  `compileCampaign` command's payload (a `CampaignConfiguration` built from
  `useNewGameFlow.ts`'s draft — preferences, archetype, nation selection)
  and result (initial `PlayerProjection` + session id). Ground this in
  `new-game-preferences-screen-state.ts`, `NewGameArchetypeScreen.tsx`, and
  `NewGameNationScreen.tsx`'s actual draft shapes.

- **Continuity / campaign-file** (`shared/continuity-contract.ts`,
  `shared/bridge-contract.ts`'s `LoadCampaignResponse`, doesn't exist):
  `loadCampaign`, `verifyCampaign`, `replayCampaign`, `recoverCampaign` —
  all called with `undefined` payload in `useCampaignFiles.ts`, implying
  the main process handles file/package selection (a native dialog) rather
  than the renderer passing a path. Persistence here is package/revision
  based (`packagePath`, `campaignIdentity`, `activeRevision` — see
  `recordLoadedCampaign` in `useCampaignFiles.ts`), not a simple save-slot
  API. Map these four commands onto `@bluewave/persistence`'s `SaveStore`
  and whatever revision/replay-integrity primitives `DESIGN-52` and
  `packages/persistence` already provide — determine whether "package" here
  means the existing `.bluewave` project format
  (`apps/desktop/src/main/project.ts`) repurposed, or a new format ticket
  01 didn't anticipate.

- There's no `saveCampaign` command anywhere in the screens. Determine
  whether saving is implicit (autosave inside `commitMonth`, see ticket 09)
  or genuinely missing from the assumed contract and needs adding.

Also apply ticket 01's decision that `SaveStore.save`'s Map-dropping bug is
now in-scope — factor whatever fix it needs into this contract's design if
it affects the shape.

## Answer

**Mostly wiring, not new architecture** — `@bluewave/persistence` and
`@bluewave/phase-engine` already have the primitives this contract needs.
Also found the missing 6th command in this domain: `listNewGameOptions`
(fetches `NewGameOptions` before the preferences screen renders — called
from `campaign-preferences/onboarding-blocks.tsx`), bringing the full
command surface to 20, not 19.

**"Package" = `SaveStore`'s save directory** (not the old `.bluewave`
content-project format in `main/project.ts`, which is a distinct
content-authoring format for compiling `content/production/1880`-style
source, unrelated to running-campaign state).

**Command mapping**:

- `listNewGameOptions(undefined) → NewGameOptions` — reads the compiled
  scenario/nation/ruleset data:
  ```ts
  interface NewGameOptions {
    readonly scenarios: readonly { id: string; playableNationIds: readonly string[] }[];
    readonly nations: readonly { id: string; name: string }[];
    readonly supportedValues: SupportedConfigurationValues; // ticket 07, minus nations excluded per ticket 06
  }
  ```
- `compileCampaign(config: CampaignConfiguration) → { sessionId: string; projection: PlayerProjection }` —
  prompts for a save location via native dialog (main-process driven, same
  pattern as the old `project:open`/`project:new` dialogs), compiles via
  `CampaignCompiler` + `createInitialCampaignState`, writes the initial
  state immediately via `SaveStore.save()`, returns the session handle.
- `inspectCampaign(sessionId: string) → PlayerProjection` — ticket 07's
  shape, unchanged.
- `loadCampaign(undefined) → LoadCampaignResponse` — opens a native
  directory picker for a package, then `SaveStore.load(saveDir)`:
  ```ts
  interface LoadCampaignResponse {
    readonly sessionId: string;
    readonly packagePath: string;
    readonly campaignIdentity: string; // CampaignSnapshot.campaignId
    readonly activeRevision: number;   // CampaignSnapshot.turnNumber, not a new concept
  }
  ```
- `verifyCampaign(undefined) → VerifyCampaignResponse` — `CompatibilityChecker`
  + hash/envelope check against the currently-loaded package (fast, safe
  on every load).
- `replayCampaign(undefined) → ReplayCampaignResponse` — full
  `ReplayVerifier`-based command-history replay, using the same
  hash-comparison approach ticket 05 already proved works end-to-end
  against real content (including copying the unexported
  `snapshotToHashable`/`hashSnapshot` helper, per ticket 05's note).
- `recoverCampaign(undefined) → RecoverCampaignResponse` — `RecoveryManager`'s
  existing corruption-recovery flow (`packages/persistence/src/recovery.ts`).

`SaveStore.save`'s Map-dropping bug (ticket 01: now in-scope) must be fixed
as part of implementing `compileCampaign`/`commitMonth`'s (ticket 09) save
path — without it, `verifyCampaign`/`replayCampaign` will fail on any
package saved through this contract.
