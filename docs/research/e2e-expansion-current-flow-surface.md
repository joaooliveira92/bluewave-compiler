# E2E Expansion — Current Commissioning Flow & Surface Inventory

Ticket: `.scratch/desktop-e2e-expansion/issues/01-observable-surface-current-flow.md`

---

## 1. Commissioning Flow — Current Order

The flow is driven by `shell/useNewGameFlow.ts` (step order documented at line 93-94) and routed by `shell/App.tsx` `CampaignUnavailableView` (lines 176–294) via `shell/campaign-shell-state.ts` mode dispatches.

**Flow steps (in true order):**

### Step 0: Landing — Campaign File Screen
- File: `screens/campaign-file/CampaignFileScreen.tsx:13`
- Heading: `"Bluewave Naval Staff"` — `components/CampaignFileHeader.tsx:4`
- Actions (two large buttons): `"New Campaign"` / `"Open Campaign"` — `components/CampaignActions.tsx:27,36`
- Recent campaigns: `components/RecentCampaigns.tsx` — `"Recent Campaigns"` heading (line 22), per-revision `Rev N` label (line 38)
- Package Operations: `components/PackageOperations.tsx` — three buttons `"Verify"`, `"Recover"`, `"Replay"` (lines 27, 36, 45)
- Primary action: **none** (header shows no continue button)

### Step 1: Nation Selection — "Fleet Dispatch"
- File: `screens/new-game/NewGameNationScreen.tsx:25` → delegates to `NationSelectionScreen.tsx:27`
- Route mode: `new-game-nation` (App.tsx:188–197)
- Heading: `"Fleet Dispatch"` — `FleetDispatchBoard.tsx:109` (`h2` at line 106)
- Listbox: `role="listbox"` with `aria-label="Playable nations"` — `FleetDispatchBoard.tsx:126`
- Option elements: `role="option"` per-slot cards — `FleetDispatchCard.tsx:42`; `aria-selected`, `aria-label={countryName}`; **plain clickable** via `onClick` at line 47 (role=option is a standard ARIA widget — Playwright `getByRole("option", {name})` works)
- Keyboard interaction: `focusedIndex` state drives `aria-activedescendant`; arrow keys navigate, Enter confirms — `NationSelectionScreen.tsx:98-120`
- Error: `Admiralty Failure Dispatch` alert — `NationSelectionScreen.tsx:185-196`
- Primary action: **`"Continue"`** — registered at `NewGameNationScreen.tsx:46`, triggers `confirmNation` via `triggerConfirm` (line 39–42) which reads `slots[focusedIndex]`
- On confirm: `useNewGameFlow.ts:119` — `navigation.selectScreen("new-game-preferences")`

### Step 2: Rules of the Naval Age
- File: `screens/new-game/RulesOfTheNavalAgeScreen.tsx:37` (wrapped in `CampaignPreferencesView` at App.tsx:335–349)
- Route mode: `new-game-preferences`
- Loads: `bridge.campaign.execute("listNewGameOptions", undefined)` — line 54
- Heading: `"Rules of the Naval Age"` — `RulesOfTheNavalAgeScreen.tsx:108` (ScreenHeader, icon Anchor)
- Subtitle: `"Set the era, scale, and historical uncertainty for this campaign."` — line 109
- **Campaign Seed input**: `<FieldLabel htmlFor="campaignSeed">` → `<Input id="campaignSeed">` — `EraScaleSection.tsx:91-101`. This is indeed here, not as step 1. Default seed: 32 hex chars from 16 random bytes — `utils/campaign-seed.ts:7-10`.
- **Starting Era** (scenario): `<FieldLabel htmlFor="scenario">` — `EraScaleSection.tsx:47`, `<SelectTrigger id="scenario">` — line 49
- **Fleet Size**: `<FieldLabel htmlFor="fleetSize">` — `EraScaleSection.tsx:69`, `<SelectTrigger id="fleetSize">` — line 76
- **Preset picker**: `PresetPickerSection.tsx` — preset buttons over the 6 settings fields
- **Historical Uncertainty** section: 6 select fields (research speed, tech variation, etc.)
- Bottom buttons: `"Back"` (outline, onCancel), `"Next: Choose Archetype"` (primary, disabled unless ready) — lines 143-148
- Primary action: **none** — this screen does NOT register a header primary action; navigation is via the bottom `"Next: Choose Archetype"` button
- On proceed: `useNewGameFlow.ts:144` — `navigation.selectScreen("new-game-archetype")`

### Step 3: Archetype — "Choose your archetype"
- File: `screens/new-game/NewGameArchetypeScreen.tsx:77`
- Route mode: `new-game-archetype`
- Heading: `"Choose your archetype"` — line 159 (`h2`)
- Subtitle: `"Pick a playstyle, or build your own with 20 points across three engine-backed attributes."` — lines 160-162
- Preset buttons: `<button aria-pressed={active}>` per archetype preset (e.g. Shipyard Baron) — `PresetCard` at line 246
- Custom: `"Create Your Own"` card → modal dialog with allocation sliders — line 294
- Consequence preview: `ArchetypeConsequencePanel` — line 184
- Bottom: `"Back to Preferences"` — line 189
- Primary action: **`"Choose Nation"`** — registered at line 114, disabled until a valid archetype is selected
- On proceed: `useNewGameFlow.ts:158` — `navigation.selectScreen("new-game-identity")`

### Step 4: Identity — "Admiral & Campaign Identity"
- File: `screens/new-game/NewGameIdentityScreen.tsx:34`
- Route mode: `new-game-identity`
- Heading: `"Admiral & Campaign Identity"` — line 65
- Subtitle: `"Give this command a name."` — line 66
- Fields: `Admiral name` (input id="admiral-name"), `Campaign name` (input id="campaign-name"), `Naming convention` (select), `Ship name reuse` (select), `Measurement system` (select) — lines 73-175
- Bottom: `"Back to Archetype"` — line 180
- Primary action: **`"Next"`** — registered at line 55, disabled if identity invalid
- On proceed: `useNewGameFlow.ts:170` — `navigation.selectScreen("new-game-fleet-method")`

### Step 5: Fleet Method — "Starting-fleet method"
- File: `screens/new-game/NewGameFleetMethodScreen.tsx:18`
- Route mode: `new-game-fleet-method`
- Heading: `"Starting-fleet method"` — line 49
- Subtitle: `"Choose how your legacy navy comes together. Every option is available in every era."` — line 51
- Cards: three `<button aria-pressed={active}>` — `FleetMethodCard` at line 79
- Bottom: `"Back to Identity"` — line 72
- Primary action: **`"Start Campaign"`** (enabled) / `"Starting…"` (disabled when launching) — registered at line 40, triggers `triggerNext` (line 35) → `onNext` → `useNewGameFlow.ts:180` → `navigation.selectScreen("new-game-review")`
- Note: primary action label is `"Start Campaign"` in this step, NOT after nation (old flow)

### Step 6: Review — "Final commissioning review"
- File: `screens/new-game/NewGameCommissioningReviewScreen.tsx:32`
- Route mode: `new-game-review`
- Heading: `"Final commissioning review"` — line 76
- Subtitle: `"Confirm every decision before your appointment is commissioned."` — line 77
- Summary: table `aria-label="Commissioning summary"` — line 88
- Strategic forecast section — if available (line 101)
- Error alert: line 81
- Bottom: `"Back to Fleet Method"` — line 126
- Primary action: **`"Begin Commission"`** / `"Commissioning…"` — registered at line 54
- On begin: `useNewGameFlow.ts:201` `launch()` → `navigation.selectScreen("new-game-launching")`

### Step 7: Launching — "Establishing the Naval Order"
- File: `screens/new-game/NewGameLaunchingScreen.tsx:20`
- Route mode: `new-game-launching`
- Heading (normal): `"Establishing the Naval Order"` — line 38
- Subtitle (normal): flavor text from checklist — line 39
- Checklist: cosmetic sequence items with `<Check>` icons — lines 42–47
- Error state: heading `"Commissioning failed"`, description = error string — lines 26-28; button `"Back to Commissioning Review"` — line 28
- Primary action: **none** (auto-proceeds on bridge completion)
- On success: `useNewGameFlow.ts:237` — `navigation.selectScreen("opening-briefing")`
- On cancel (SAVE_LOCATION_CANCELLED): silent return to `"new-game-review"` — line 229

### Step 8: Briefing — "Opening Strategic Briefing"
- File: `screens/new-game/NewGameBriefingScreen.tsx:228`
- Route mode: `opening-briefing`
- Loading: heading `"Opening Strategic Briefing"` → `"Preparing the briefing…"` — lines 270-275
- Error: heading `"Briefing unavailable"` — line 260
- Normal: heading `"Opening Strategic Briefing"`, description = page title (line 298)
- 5 pages (index 0-4): Appointment / State of the Navy / Treasury / Foreign Intelligence / Immediate Concerns — `OPENING_BRIEFING_PAGE_COUNT` = 5
- Page 0 heading: `"Appointment confirmed"` + month + `"You have been appointed …"` — lines 61-65
- Page 1 heading: `"Ship-class inventory"`, submarine heading `"Ships under construction"` etc.
- Progress bar: 5 segments, aria-label "Briefing progress" — line 300
- Navigation: `"Back"` (with ArrowLeft icon, line 319), `"Review the Admiralty's Assessment"` (page 0 next, line 329), `"Next"` (pages 1-3), last page: **`"Take command"`** — line 325 (`PAGE_LAST_ACTION_LABEL`)
- Primary action: **none** — uses bottom buttons
- On take command: `useNewGameFlow.ts:259` → `navigation.openCampaign(sessionId)` → shell enters campaign mode

### After compile: Campaign Overview
- File: `screens/overview/OverviewScreen.tsx:48`
- Route mode: `campaign` + screen `overview`
- Sidebar visible: `AppSidebar` with campaign screens
- Heading: `"Campaign Overview"` — `PageHeader` at line 115
- Subtitle: `"{month label} · Revision {revision} · Session {sessionId}"` — lines 117-123
- Quick-nav buttons: `"Construction"`, `"Fleet"`, `"Simulation & Turn"` — lines 398-408
- Campaign Identity section: `campaign-bluewave-1880-production` displayed via `projection.campaignIdentity` — line 423
- "Revision 0" shown in subtitle — line 119

---

## 2. Stale Spec Assumptions — `mvp-loop.spec.ts` vs Current Surface

### mvp-loop.spec.ts row 1 (lines 23-54)

| # | Stale assumption (line) | What is there now | Replacement interaction |
|---|---|---|---|
| 1 | `getByRole("button", { name: "New Campaign" })` clicks first (line 29) | Same button exists at `CampaignActions.tsx:36` | **Still valid** — no change |
| 2 | `getByLabel("Campaign Seed").fill(SEED)` (line 30) | Seed input exists at `EraScaleSection.tsx:92` with `htmlFor="campaignSeed"`, but it's now in **step 2** (Rules of the Naval Age), not the first visible step | **Order invalid** — step 1 is now nation selection (`Fleet Dispatch`), not preferences. Spec must navigate nation first, then find seed on step 2 |
| 3 | `getByRole("button", { name: "Next", exact: true })` (line 31) | There is no standalone "Next" button in the current flow as the first action. The `RulesOfTheNavalAgeScreen` has `"Next: Choose Archetype"` at line 147. The only `"Next"` primary action is in `NewGameIdentityScreen` (header) at line 55 | **Button does not exist at this point** — must replace with nation selection interaction first |
| 4 | `getByRole("button", { name: "Next: Choose Nation" })` (line 34) | This button **does not exist** in the current codebase. The Rules screen has `"Next: Choose Archetype"` | **Button name changed** — the destination after preferences is now archetype, not nation (nation was already selected in step 1) |
| 5 | `getByRole("heading", { name: "Choose your archetype" }).waitFor()` (line 37) | Same heading exists at `NewGameArchetypeScreen.tsx:159` | **Still valid** — heading unchanged |
| 6 | Archetype preset `getByRole("button", { name: new RegExp(ARCHETYPE) })` (line 38) | Preset buttons are `<button aria-pressed>` at `PresetCard` line 256; text content is the preset name (e.g. "Shipyard Baron") | **Still valid** — button role clickable |
| 7 | `getByRole("button", { name: "Choose Nation" })` (line 39) | This is the header **primary action** on the archetype screen, registered at `NewGameArchetypeScreen.tsx:114`. Label is `"Choose Nation"` | **Semantics changed** — the old flow selected nation after archetype. Now nation was already chosen in step 1; this action advances to the **identity** screen (step 4), not to nation selection |
| 8 | `getByRole("option", { name: NATION }).click()` (line 42) | Nation options are `role="option"` cards in `FleetDispatchBoard.tsx:124` via `FleetDispatchCard.tsx:42`. | **Still clickable via getByRole("option")** but the position in the flow is **step 1, not after archetype** |
| 9 | `getByRole("button", { name: "Start Campaign" }).click()` (line 43) | `"Start Campaign"` is now the **header primary action** on `NewGameFleetMethodScreen` (line 40), triggered by `Continue` button in header. It advances to the review screen, NOT directly to compile. | **Position changed** — it's now on step 5 (fleet method), not after nation; use `getByRole("button", {name: "Start Campaign"})` with the header continue button mechanism |
| 10 | `getByText("Revision 0")` (line 52) | `OverviewScreen.tsx:119` — rendered in subtitle as `Revision {projection.revision}` | **Still valid** |
| 11 | `getByText("campaign-bluewave-1880-production")` (line 53) | `OverviewScreen.tsx:423` — rendered as `projection.campaignIdentity` | **Still valid** (for the 1880 scenario) |

### continuance.spec.ts `compileFreshCampaign` helper (lines 25-38)

Same stale flow as mvp-loop — lines 27-34 mirror the exact same sequence.

---

## 3. Guided First-Month Inspection

### Auto-open behavior

- **`shouldAutoOpen()`** (`guided-inspection-state.ts:79-82`): returns `true` when `inspection === undefined` OR `inspection.status === "not_started"`
- **On a fresh compile**: `useGuidedInspection.ts:75-80` reads stored UiState. If `stored === undefined` (first ever for this session), it creates `emptyInspection()` (status=not_started) and sets `visible=true`. If stored exists with status `not_started`, lines 85-89: `visible = shouldAutoOpen(stored)` → `true`.
- **Conclusion**: the guided tour **IS active (auto-opens) on every fresh compile** unless previously dismissed/completed.

### Screens and steps

| Step | Screen | `data-guided-target` | Step title |
|------|--------|---------------------|------------|
| 0 | overview | `[data-guided-target='overview']` | "Overview — Your Naval Position" |
| 1 | treasury | `[data-guided-target='treasury']` | "Treasury" |
| 2 | research | `[data-guided-target='research']` | "Research & Technology" |
| 3 | construction | `[data-guided-target='construction']` | "Construction" |
| 4 | fleet | `[data-guided-target='fleet']` | "Fleet" |
| 5 | diplomacy | `[data-guided-target='diplomacy']` | "Foreign Relations" |
| 6 | (none — advance-month) | `[data-guided-target='advance-month']` | "Advance Month" |

Source: `guided-inspection-state.ts:19-70`

### Does it overlay/block e2e clicks?

- The overlay renders at `z-[60]` — `GuidedInspectionOverlay.tsx:113`
- The overlay container has `pointer-events-none` — line 115. Only the step card inside has `pointer-events-auto` — line 143.
- **Conclusion: the overlay does NOT block clicks on the underlying UI.** Click events pass through the scrim. However, the overlay's `"Next"` button programmatically navigates the shell to the next step's screen via `onNavigate?.(nextStep.screenId)` (line 79). This **competes with** the e2e spec's own navigation — if both the tour and the spec navigate to different screens, they race.

### Is the guided tour currently covered or interference?

- **The existing specs do NOT dismiss the tour**, so the tour remains visible throughout. It does not block clicks, but it does programmatically navigate when the user clicks "Next" in the overlay — the specs never click the overlay buttons, so the tour does NOT auto-advance.
- **Conclusion**: the guided tour is NOT currently exercised by the e2e specs (they never interact with it), and it is NOT an interference (overlay is non-blocking, tour stays on step 0 because specs never click Next). It is a **latent race-risk** if a future spec clicks "Next" on the wrong element.

---

## 4. Reachable-but-Uncovered Production Screens

### Research & Technology
- File: `screens/research/ResearchScreen.tsx:39`
- Heading: `"Research & Technology"` — `PageHeader` line 46 (also line 69, 94)
- Description (idle): `"The monthly research budget across fields."` — line 69
- Description (loaded): `"Set field priorities; the engine applies them on the next turn advance."` — line 95
- Visual: 3 summary cards (Budget, Current project, Discovered techs), field priority toggles (High/Med/Low), in-progress tech work section
- Submit button: **`"Set priorities"`** — line 226
- Notice (success): **`"Priorities queued"`** (AlertTitle) — line 114
- Notice (error): **`"Not applied"`** (AlertTitle) — line 117
- Bridge command exercised: `inspectResearchScreenProjection`, `setResearchPriorityCommand`

### Diplomacy & War
- File: `screens/diplomacy/DiplomacyScreen.tsx:40`
- Heading: `"Diplomacy & War"` — `PageHeader` line 57 (also line 79, 100)
- Description (idle): `"Relations, wars and blockades from the compiled campaign state."` — line 80
- Description (loaded): `"View and direct relations; the engine applies commands on the next turn advance."` — line 102
- Visual: Relations table (per-row action buttons: "Declare war", "Form alliance", "Break NAP", "Blockade" etc.), Wars section, Blockades section, Command queue bar
- Submit button: **`"Submit command"`** — `CommandQueueBar` line 336 (also `"Submitting…"` when busy)
- Blockade area: `<Select aria-label="Blockade area">` — line 317
- Notice (success): **`"Command queued"`** (AlertTitle) — line 121
- Notice (error): **`"Not applied"`** (AlertTitle) — line 123
- Clear button: `"Clear"` with X icon — line 331
- Bridge commands exercised: `inspectDiplomacyScreenProjection`, `submitDiplomacyCommand`

### Treasury (read-only)
- File: `screens/treasury/TreasuryScreen.tsx:23`
- Heading: `"Treasury"` — `PageHeader` line 53
- Description: `"Government naval allocation, expenditure, and projected position. Read-only."` — line 54
- Visual: 3 cards (Income, Expenditure, Result) — lines 58-101
- No submit affordance — purely read-only
- Bridge command: `inspectTreasuryScreenProjection`

### Fleet Movement
- File: `screens/fleet/FleetScreen.tsx:15`
- Heading: `"Fleet Movement"` — line 62
- Submit button: `"Submit movement command"` — line 72 area (confirmed by mvp-loop.spec.ts line 167)
- Bridge commands: `inspectFleetScreenProjection`, `submitFleetMovementCommand`

### Construction
- File: `screens/construction/ConstructionScreen.tsx:15`
- Heading: `"Construction Commands"` — line 58
- Submit button: `"Submit Construction Command"` — line 82 area (confirmed by mvp-loop.spec.ts line 92)
- Bridge commands: `inspectConstructionScreenProjection`, `submitConstructionCommand`

### Campaign File Screen (landing)
- File: `screens/campaign-file/CampaignFileScreen.tsx:13`
- Heading: `"Bluewave Naval Staff"` — `CampaignFileHeader.tsx:4`
- Subtitle: `"Strategic & tactical campaign workspace"` — line 5
- Buttons: `"New Campaign"`, `"Open Campaign"` — `CampaignActions.tsx:27,36`
- Section heading: `"Package Operations"` — `PackageOperations.tsx:16`
- Buttons: `"Verify"`, `"Recover"`, `"Replay"` — `PackageOperations.tsx:27,36,45`
- Section heading: `"Recent Campaigns"` — `RecentCampaigns.tsx:22`
- Per-file: filename text, `"Rev N"` label, `"Remove from recent"` button — lines 28-47
- Result messages: `"Package verified — campaign …"`, `"Replay complete — …"`, `"Recovery complete — active revision …"` — `OperationStatus.tsx:60-85`

### Campaign List Screen
- File: `screens/campaign-list/CampaignListScreen.tsx:16`
- Heading: `"Campaigns"` — line 49
- Description: `"Saved campaigns in the selected package."` — line 50
- Table columns: Campaign name, Nation, Current date, Last saved, Save-format version, Campaign status, Load button — lines 56-82
- Empty state: `"No saved campaigns found in this package."` — line 54
- Load button per row: `"Load"` — line 78

---

## 5. Debug-Gating Mechanics

### Source of truth
- **`shell/debug-mode.ts:5-6`**: `isDebugMode(env)` returns `true` only when `env.flag === "true"` exactly
- **`shell/campaign-screen-registry.tsx:187`**: `DEBUG_MODE = isDebugMode({ flag: import.meta.env.VITE_BLUEWAVE_DEBUG })`
- **Line 250**: `SIMULATION_SCREEN` included only when `DEBUG_MODE` is true
- **Line 268**: `TACTICAL_SANDBOX_SCREEN` and `DEBUGGING_SCREEN` included only when `DEBUG_MODE` is true
- **Line 269**: `MAP_PROTOTYPE_SCREEN` included only when `import.meta.env.DEV` is true (different gate — dev mode, not debug mode)

### Production vs Test
- **`electron.vite.config.ts`**: No `define` or `env` overrides for `VITE_BLUEWAVE_DEBUG`. A production build (`electron-vite build`) produces a renderer bundle where `import.meta.env.VITE_BLUEWAVE_DEBUG` is `undefined` (Vite's default) → `isDebugMode` returns `false` → all debug screens excluded.
- **`vitest.config.ts:19`**: `env: { VITE_BLUEWAVE_DEBUG: "true" }` — unit tests run with debug enabled, so `campaign-screen-registry.test.tsx` exercises the simulation/sandbox/debugging screen routes.
- **`playwright.config.ts`**: No env overrides. Playwright e2e launches the built app via `electron-vite build` / `electron-vite preview` (or a direct binary). Without explicit env injection into the build, e2e runs in production mode → **debug screens are invisible to e2e**.

### How to enable debug for e2e
To let e2e see simulation/tactical-sandbox/debugging screens, one of:
1. Inject `VITE_BLUEWAVE_DEBUG=true` into the electron-vite build via `electron.vite.config.ts` `renderer.build.rollupOptions` with `define` or environment plugin
2. Set env var at the OS level when running `pnpm build:debug` or `pnpm dev:debug` (if such script exists)
3. Modify `playwright.config.ts` to set `VITE_BLUEWAVE_DEBUG=true` and rebuild the app before e2e run

The config file to modify is `electron.vite.config.ts` (renderer section, lines 31-46). The flag is read at compile time via Vite's `import.meta.env` replacement, so it must be set during the Vite build, not at runtime.

---

## Key File Reference Map

| Component | File | Key lines |
|-----------|------|-----------|
| App shell routing | `shell/App.tsx` | 176–294 (CampaignUnavailableView screens switch) |
| New game flow state machine | `shell/useNewGameFlow.ts` | 60–73 (actions), 88–310 (step transitions) |
| New game mode screens | `shell/App.tsx` | 188–293 (switch cases) |
| Nation selection | `screens/new-game/NewGameNationScreen.tsx` | 25–84 |
| Nation listbox | `screens/new-game/nation-selection/NationSelectionScreen.tsx` | 27–203 |
| Fleet dispatch board | `screens/new-game/nation-selection/FleetDispatchBoard.tsx` | 21–173 |
| Fleet dispatch card | `screens/new-game/nation-selection/FleetDispatchCard.tsx` | 23–145 |
| Rules of the Naval Age | `screens/new-game/RulesOfTheNavalAgeScreen.tsx` | 37–152 |
| Era & Scale section | `screens/new-game/components/EraScaleSection.tsx` | 28–106 |
| Archetype | `screens/new-game/NewGameArchetypeScreen.tsx` | 77–244 |
| Identity | `screens/new-game/NewGameIdentityScreen.tsx` | 34–185 |
| Fleet method | `screens/new-game/NewGameFleetMethodScreen.tsx` | 18–77 |
| Commissioning review | `screens/new-game/NewGameCommissioningReviewScreen.tsx` | 32–131 |
| Launching screen | `screens/new-game/NewGameLaunchingScreen.tsx` | 20–53 |
| Opening briefing | `screens/new-game/NewGameBriefingScreen.tsx` | 228–344 |
| Campaign file (landing) | `screens/campaign-file/CampaignFileScreen.tsx` | 13–44 |
| Campaign actions | `screens/campaign-file/components/CampaignActions.tsx` | 11–40 |
| Package operations | `screens/campaign-file/components/PackageOperations.tsx` | 11–50 |
| Operation status | `screens/campaign-file/components/OperationStatus.tsx` | 14–101 |
| Recent campaigns | `screens/campaign-file/components/RecentCampaigns.tsx` | 16–53 |
| Campaign list | `screens/campaign-list/CampaignListScreen.tsx` | 16–89 |
| Overview | `screens/overview/OverviewScreen.tsx` | 48–436 |
| Construction | `screens/construction/ConstructionScreen.tsx` | 15–131 |
| Fleet movement | `screens/fleet/FleetScreen.tsx` | 15–106 |
| Research | `screens/research/ResearchScreen.tsx` | 39–267 |
| Diplomacy | `screens/diplomacy/DiplomacyScreen.tsx` | 40–375 |
| Treasury | `screens/treasury/TreasuryScreen.tsx` | 23–104 |
| Site header | `shell/SiteHeader.tsx` | 31–108 |
| Primary action mechanism | `shell/primary-action.ts` | 7–11 |
| Campaign screen registry | `shell/campaign-screen-registry.tsx` | 1–316 |
| Debug mode gate | `shell/debug-mode.ts` | 1–7 |
| Guided inspection state | `shell/guided-inspection-state.ts` | 1–137 |
| Guided inspection hook | `shell/useGuidedInspection.ts` | 58–150 |
| Guided inspection overlay | `shell/GuidedInspectionOverlay.tsx` | 37–189 |
| Campaign seed utility | `screens/new-game/utils/campaign-seed.ts` | 7–11 |
| electron-vite config | `electron.vite.config.ts` | 1–48 |
| vitest config | `vitest.config.ts` | 1–30 |
| playwright config | `playwright.config.ts` | 1–18 |
| e2e mvp-loop spec | `e2e/mvp-loop.spec.ts` | 1–169 |
| e2e continuance spec | `e2e/continuance.spec.ts` | 1–150 |