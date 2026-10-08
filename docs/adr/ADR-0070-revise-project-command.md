# ADR-0070: ReviseProject command and retained source drafts

## Status

Accepted 2026-10-08. Implements the revision commands left open by ADR-0066 (SB-14), using spec section 15.4 and `classifyRevision` (SB-11).

## Decision

1. **Source drafts are kept.** `CompiledDesignVersion.sourceDraft` (optional, plain JSON) stores the `DesignDraft` a design was compiled from. Only designs created by `SubmitDesign` or `ReviseProject` have one; authored pack designs do not, so existing snapshots and golden hashes are unchanged. The snapshot stores a copy, never the command's own object.
2. **New engine command `ReviseProject { nationId, projectId, newDesignVersionId, draft }`** (18th command). `draft` is the whole new design. The new version joins the project's design family and inherits its class name, hull type and machinery type.
3. **Issue time** (`CommandLifecycle`): nation and project exist, project not `COMPLETED`, new id is lower snake_case and unused, the current design has a `sourceDraft`, the draft shape is valid and belongs to the issuing nation.
4. **Apply time** (`command_collection`, `applyReviseProject`): the new draft is compiled authoritatively (any BLOCKING finding refuses it); the change kinds are derived from the two drafts (`draftChangeKinds`); the tier comes from `classifyRevision` with `progressFromWork(completedWork, totalWork)` and the pack's `revision` balance (`balance.yaml`, spec 15.4). Outcomes:
   - T0 free change: the project switches to the new design, work kept.
   - T1 revision: as T0, and `reworkBp` of the completed work is added to the work still owed.
   - T2 redesign: as T0, and completed work shrinks to `redesignKeptBp` of itself.
   - T3 reconstruction: refused with `REVISION_REQUIRES_REBUILD`; the snapshot is untouched.
   The project's total work becomes the new design's `construction_order_v1` cost units (displacement / 100,000 kg) plus any rework. Paid work and the treasury are not touched.
5. A revision that changes nothing, an invalid revised design, missing ship-building content or missing revision rules are all refused with a diagnostic and no state change.

## Consequences

`phase-engine` now depends on `campaign-engine` (for `projectedConstructionOrderCosts`; there is no cycle). Draft retention makes snapshots a little larger for player-submitted designs. The rework, study-cost, kept-progress and T2-delay numbers in `balance.yaml` are PLACEHOLDER until the balance pass.

## Not done (recorded, not guessed)

- **T1/T2 delay in months**: projects have no schedule, so the delay is not applied (the extra work and lost progress still cost money and time indirectly).
- **T2 study cost** (`redesignStudyCostBp`): design studies (DESIGN-21 section 3) do not exist yet.
- **Armour/machinery already ordered, and launched**: the engine tracks one work figure per project, so these are treated as false; the real tier can only be this tier or higher.
- **T3 rebuild/conversion projects** (DESIGN-23 sections 20-23).
- **Desktop apply flow**: the Drawing Board still only previews; the bridge and "Revise project" action are the next step.
