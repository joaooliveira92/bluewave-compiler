# ADR-0038 (game-onboarding-first-month INC-3): Renderer-Owned `ui-state.json` Sidecar — Non-Authoritative UI-State Persistence

## Status

Accepted 2026-08-18

## Context

The M2 "First Month at the Admiralty" spec (`.scratch/game-onboarding-first-month/spec.md` §7 "Dismissal" and §8 "Persistence") needs a per-campaign place to persist renderer-owned UI state that has no existing home:

- **Priority dismissal** — the Immediate Priorities system (§7) lets the player dismiss `information`/`advisory` priority cards, keyed by a deterministic `fingerprint`, expiring on turn advance. Dismissal must never mutate simulation state.
- **Guided first-month inspection** — the seven-step overlay (§8) tracks `status` (`not_started | in_progress | completed | dismissed`) + `lastCompletedStep`, must survive save/load, and once completed/dismissed must not auto-reopen.

No existing mechanism fits: `CampaignSnapshot` has no UI-metadata bag; `SaveMetadataSchema` is a fixed-shape `z.object` that strips unknown keys; there is no per-campaign renderer-owned UI-state persistence. ENGINEERING-CONTRACT is explicit that "React and UI state are never authoritative simulation state," so the storage must sit entirely outside the authoritative envelope/hash.

## Decision

Add a small per-campaign sidecar file **`ui-state.json`** in the campaign save directory (a sibling of `pointer.json` and the `SaveStore` save-id directories — one campaign save dir = one sidecar, so it is keyed by `campaignId` via location).

- **Shape:** `{ turnNumber, dismissedFingerprints: string[], firstMonthInspection?: { status, lastCompletedStep } }`.
- **Atomic write:** tmp file → `renameSync`, matching `SaveStore.save`'s atomic-replace convention; a failed write removes the tmp artifact; `AbortSignal` checked before fs work (renderer-owned state, so no pointer to advance).
- **Tolerant read:** missing file, unparseable JSON, or a shape failing the boundary Zod schema all fall back to empty defaults — never crashes.
- **Expiry:** dismissal fingerprints are honored only while the sidecar's `turnNumber` equals the session's current `state.snapshot.turnNumber`; on turn advance the dismissal set collapses to empty. `firstMonthInspection` does not expire (a completed/dismissed guide stays closed across turns; a mid-guide close resumes from the last completed step).
- **One mechanism for both features**, and **merge-preserve write semantics**: a write only touches the fields it carries — `dismissedFingerprints` is a complete-set replace (every dismissal write submits the full current set), while an absent `firstMonthInspection` is carried forward from the stored sidecar so a dismissal-only write never erases inspection progress (explicit reset remains via `{status:"not_started", lastCompletedStep:0}`).
- **Never authoritative:** the file is written as a sibling of the save ids, is not part of the `SaveStore` envelope/hash, is never loaded into simulation state, and is never read by `MonthExecutor`. Zero hash surface — goldens stay 10/10.
- **Narrow IPC surface:** served through the existing single `campaign:execute` channel as a `readUiState`/`writeUiState` command pair, Zod-validated at the boundary (`campaignCommandSchemas.ts`); `turnNumber` is stamped server-side from the session (never trusted from the renderer).

## Consequences

- The sidecar introduces a persistent renderer-owned artifact that SaveStore save/load and `MonthExecutor` do not see; verification must never treat it as authoritative. Guarded by tests proving identical post-`commitMonth` `rawHash` with and without a populated sidecar, and by the sidecar never being inside a SaveStore save-id directory.
- No migration, no serializer change, no compatibility-version impact — existing saves are untouched; a legacy campaign simply has no sidecar and reads as empty defaults.
- Dismissal is inherently scoped to the current turn (expiry by `turnNumber` comparison), satisfying §7 without storing history.
- Future renderer state that must persist per-campaign should extend this sidecar rather than inventing a new mechanism — but any state that must influence simulation outcomes belongs in an authoritative schema, not here.
