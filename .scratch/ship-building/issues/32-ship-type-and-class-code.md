# 32: Ship type and class code

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Spec: `parity-spec.md` F2. Derived class code (type + main battery), chosen type vs natural class finding.

Acceptance:
- `classCode(type, components)` pure function in `classification.ts` (deterministic; type + main mounts X most barrels).
- A "Design brief" panel shows the class code and natural class and lets the player declare the type, required speed,
  cruising speed and range. Scope note: the existing DESIGN-22 mismatch finding is already BLOCKING (DESIGN-21 s25), so no
  new advisory finding was added; the panel marks a mismatch with a destructive badge.
- Tests for code format, mixed batteries, no guns, disagreement finding; render test.

## Comments

### 2026-10-09 orchestrator

Implemented. New edit `set_requirement` (applyEdit, describeEdit); `changeKindOf` now returns `ChangeKind | null` (a brief edit is not a build change, matching `draftChangeKinds`), `changeKinds` in the desktop ignores it. `classCode` + `WorkshopView.classCode`. `BriefPanel` on the Hull tab. Tests: edits (merge, brief-only, purity), trials-revision (null), classification (`classCode`: no guns, mixed battery, defaults), revisionPreview, DrawingBoard render. ship-design 33 files / 328 tests; construction screens 14 files / 131 tests; snap inspected.
