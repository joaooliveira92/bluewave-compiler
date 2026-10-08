**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec §17 (Saving and Loading) of [01-diagnosis.md](../01-diagnosis.md).

Save/load is already a mature, built system (`packages/persistence`:
`SaveStore`, string-typed `CURRENT_COMPATIBILITY_VERSION` compatibility
checking, atomic replace, recovery/corruption handling in `store.ts` and
`recovery.ts`). The doc's §17 reads like proposing new versioning/migration
work — it mostly isn't. This ticket's real job is narrower than the doc
implies:

1. **Autosave trigger wiring** (§17.1): confirm which of the six listed
   autosave triggers already fire (likely most, from the Commissioning Flow
   effort's briefing-completion autosave) versus which are genuinely new for
   M2 (budget revision, research revision, construction order, monthly
   resolution, onboarding-status change).

## Answer

Verified against `packages/persistence/src/store.ts` (`SaveStore`),
`compatibility.ts` (`CURRENT_COMPATIBILITY_VERSION = "1.1.0"`), and the
desktop shell's saving/message pair. Save/load is mature and real; this
ticket's job is to confirm what's already wired and specify the genuinely-new
**campaign-list screen** + the small metadata extension it needs.

### 1. Autosave trigger wiring (§17.1)

- **After completing the Opening Strategic Briefing** — already fires (the
  Commissioning Flow effort's briefing-completion autosave; real).
- **After a budget revision** — **moot for M2**: per ticket 06, Treasury is
  a read-only projection screen with no editable budget, so there is no
  budget-revision command to autosave after. Dropped from the trigger list.
- **After a research allocation revision** — genuinely new; wire an autosave
  after a successful `SetResearchPriority` command.
- **After placing a construction order** — genuinely new; wire an autosave
  after a successful construction-order command.
- **After completing monthly resolution** — already the real commit path
  (`commitMonth`/`advanceMonth` persists atomically); confirmed, not new.
- **After onboarding-status change** — genuinely new; wire an autosave after
  a first-month-inspection status change is persisted.

All M2-new triggers follow the existing pattern: a domain command is not
considered successful until its required persistence contract succeeds
(ENGINEERING-CONTRACT §Persistence), and the shell's saving/message pair
drives the indicator.

### 2. Save indicator (§17.2)

The real shell already carries a `saving` state + message pair (per the
shell ticket / desktop surface). The doc's four-way
Saved/Saving/Unsaved/Failed maps onto it as follows: **Saving** = command
in-flight; **Saved** = last command's persistence succeeded; **Save failed**
= last persistence threw (visible, never "Saved"); **Unsaved changes** = a
renderer-only draft that diverges from the last committed snapshot (only
meaningful for the one editable surface — research allocation — since
Treasury edits were cut). Specify the indicator as driven by the real
command/persistence lifecycle, not a new dirty-flag concept.

### 3. Manual save (§17.3)

Confirmed: the real `saveCampaign` command writes the current authoritative
state, does not advance time, does not generate a report, and returns a
structured result (including `savePath`/`hash`/`metadata`). It already
implements §17.3; nothing new.

### 4. Campaign-list screen (§17.4) — genuinely new UI

No dedicated campaign-list/load screen exists (confirmed by the charting
audit). Backing: `SaveStore.list(saveDir)` → `SaveMetadata[]` (real,
deterministically newest-first) + the `loadCampaign` command for the actual
load.

**Metadata gap:** the real `SaveMetadata` (`store.ts`/`schemas.ts`) stores
`saveId`, `timestamp`, `turnNumber`, `campaignId`, `snapshotHash`,
`compatibilityVersion`, `contentArtifactHash` — but **not** campaign name,
nation, or current date, which the doc's list columns require. Design
decision: **extend `SaveMetadata` with three additive, optional fields** —
`campaignName: string`, `nationId: string`, and `campaignDate: { year, month }`
— written at save time alongside the existing fields. Existing/legacy saves
(and the `list()` signature-fallback degraded records) simply omit them, so
the list renders them as `—` rather than fabricating values (no migration
needed; additive-only). The load still goes through `loadCampaign` and the
real `CompatibilityChecker`.

List columns (doc §17.4) with real substitutions:
- **campaign name** → `metadata.campaignName` (new field; `—` for legacy).
- **nation** → `metadata.nationId` (new field).
- **current date** → `metadata.campaignDate` (new field; `turnNumber` as the
  honest fallback where absent).
- **last saved time** → `metadata.timestamp` (real).
- **save-format version** → `metadata.compatibilityVersion` (real,
  **string-typed** `"1.1.0"` — substituting the doc's integer
  `CURRENT_CAMPAIGN_SAVE_VERSION` proposal; there is no integer schema
  version).
- **campaign status** → derived UI state (per ticket 01: `isTerminal` +
  in-flight-command), not a stored field.

### 5. Failed load, save versioning (§17.5–§17.6)

Confirmed the real `CompatibilityChecker`/`store.ts` already implements the
doc's intent: a structurally-obsolete save gets the stable compatibility
diagnostic (`PERSISTENCE_MISSING_SAVE`/version-mismatch, `compatibility.ts:14`),
a corrupt save is refused with `PERSISTENCE_CORRUPT_SAVE`, and there is **no
silent destructive repair** — the integrity gates (state-hash, signature,
envelope) hard-reject. A corrupt/incompatible save does not crash the list
(`list()` skips invalid directories). **This section is "document what's
real," not new design.** The doc's integer `CURRENT_CAMPAIGN_SAVE_VERSION`
and `v1→v2` migration are replaced by the real string-typed compatibility
version; no integer migration is added.
2. **Save indicator** (§17.2): confirm a real persistence-state signal
   already exists to drive Saved/Saving/Unsaved/Failed, or decide what's
   needed to expose one.
3. **Manual save** (§17.3): confirm `saveCampaign` (real command, per the
   charting IPC audit) already does what §17.3 describes.
4. **Campaign-list screen** (§17.4): **no dedicated campaign-list/load-
   campaign screen was found** in the charting-session audit — this is
   genuinely new UI. Design it against the doc's proposed field list (name,
   nation, date, last-saved time, status, save-format version), substituting
   the real string-typed compatibility version for the doc's integer
   `CURRENT_CAMPAIGN_SAVE_VERSION` proposal. Cross-reference `loadCampaign`
   (real command) as the backing call.
5. **Failed load, save versioning** (§17.5–§17.6): confirm the real
   `CompatibilityCheck`/`store.ts` mechanism already implements the doc's
   intent (reject-mismatch, don't silently repair) — this section is likely
   "document what's real," not "design something new."
