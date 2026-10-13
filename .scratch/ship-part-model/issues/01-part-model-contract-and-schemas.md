# 01: Part-model contract — ADR, glossary and strict schemas (P0)

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no
**Requirements:** SPM-R1–R7, SPM-R26 (P0) · Stories 4, 7, 8, 9, 15, 22, 25

## What to build

A content author can write a **part**, a **platform** with **slots**, and a
**loadout entry** in the new shape. The content compiler decodes them strictly, and
any word outside the closed vocabularies fails with a clear decode diagnostic. No
compiled output changes yet: this ticket fixes the contract that every later ticket
builds on.

- File the proposal's draft ADR (§14, revision 4) as a numbered ADR, and add it to the
  active ADR index.
- Add the proposal's terms to `CONTEXT.md` (the list in the spec's *Glossary* note).
- Add closed vocabularies to `@bluewave/content-schema`: `interfaces/1` (14 values, each
  with one-line semantics), application bases (`PER_LOADOUT_ENTRY`, `PER_PART_UNIT`,
  `PER_CONTAINED_UNIT`), slot constraint keys, and legacy-exception codes
  (`DQ-TORPEDO-001` only).
- Add schemas for the part envelope (a discriminated union on `family`), lifecycle,
  revision, quantity component, slot, platform and loadout entry. Decoding uses the
  repo's strict boundary decode (`onExcessProperty: "error"`).

## Acceptance criteria

- [x] The ADR is filed and indexed, and `CONTEXT.md` defines every glossary term listed in
      the spec.
- [x] **Valid records decode.** A minimal record of each of the nine part families,
      a slot template and a platform decode through the content compile seam. A loadout
      with a nested entry decodes through the same strict validator; no content
      collection carries loadouts until P2 rewrites the designs.
- [x] **Unknown interfaces fail.** Every identifier outside `interfaces/1` fails: a near
      miss, a wrong case, a calibre-qualified id and a wildcard (`*`) are each tested, on
      both `provides` and slot acceptance.
- [x] **Unknown bases fail.** Every value outside the three application bases fails, and
      so does a quantity component with no basis.
- [x] **Unknown fields are rejected, not discarded.** An unknown slot-constraint key fails,
      and so does an unknown field on the part envelope, slot, loadout entry or visual
      block. D16 is not approved yet, so the visual block accepts no trait fields: any
      trait field fails decoding instead of being dropped. The ADR records this rule.
- [x] **Migration-only aliases fail.** The canonical decoder rejects `PER_FIT`,
      `PER_MOUNT`, `barrels`, `tubes` and any unknown legacy-exception code.
- [x] **Diagnostics locate the failure.** Every strict-decode failure names the source file
      and the field path of the offending value. Tests assert both.
      Exception (recorded in ADR-0154 §9): a `family` matching no union member is
      reported at the record root, with a message listing the nine families.
- [x] `mountCount` must be a positive integer. An absent `mountCount` means 1
      (`DEFAULT_MOUNT_COUNT`); ticket 03's compile stage applies it, because a decode
      default would need the Effect runtime in a runtime-free package. A loadout entry
      has no other quantity field.
- [x] A legacy exception must name exactly one waived constraint (`diameterUmEqualsBore`)
      and one counterpart part, and must carry a note.
- [x] **Nothing observable changes.** The existing compiled artifact's hash is unchanged
      and every golden is byte-identical.
- [x] **No out-of-scope changes.** Production content, the save compatibility version and
      every runtime read path are untouched.
- [x] Validation passes: focused tests, typecheck, lint, format, the Effect lint gate, the
      runtime-free gate and `pnpm preflight`.

## Comments

- 2026-10-13: Implemented. `PartSchema`, `SlotTemplateSchema`, `PlatformSchema` and `LoadoutSchema`
  are in `@bluewave/content-schema`. The compiler decodes `shipBuilding.parts`, `.slotTemplates` and
  `.platforms` strictly and checks them for duplicate ids, but they do not reach the bundle yet;
  the content hash is unchanged. ADR-0154 is filed, and the glossary is in `CONTEXT.md`.
- Handed to ticket 02: cross-references (platform → slot template and hull form, `extends`,
  `supersedes`, legacy-exception `forPart`) are not checked yet. Ticket 03 applies
  `DEFAULT_MOUNT_COUNT` when it compiles entries.
- Reviewer verdict: APPROVE. All findings were fixed: the unknown-family path is recorded as
  an exception, the shape rules are in the ADR, `fireControlClass` and
  `supportsFireControlClasses` were dropped because nothing reads them, and the missing tests
  were added.
