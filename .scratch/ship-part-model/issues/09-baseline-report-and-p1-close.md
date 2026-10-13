# 09: Pinned, deterministic baseline report and approved-diff gate — P1 closes

**Type:** implementation
**Status:** open
**Blocked by:** 06, 07, 08
**Frontier:** no
**Requirements:** SPM-R23 (`dataQuality`), SPM-R24 (D17, torpedo, determinism), SPM-R25, SPM-R26 (P1 gate) · Stories 43, 45, 46, 47, 49

## What to build

The canonical baseline report is produced as acceptance evidence, and the gates that
later phases rely on are in place.

- A separate `dataQuality` section lists the inherited `DQ-TORPEDO-001` and
  `DQ-ARMAMENT-001` findings. These never count as differences, and differences are
  never hidden among them.
- The D17 equalities (`legacy barrels = total guns`; legacy fixed installation equals the
  translated `PER_LOADOUT_ENTRY` installation) and `mountCount = legacy tubes` are gated.
- The report is byte-identical across runs and processes, checked with the existing
  cross-process runner.
- Fixtures pin the coverage, the nine D17 rows and the 28 torpedo rows from the
  proposal's tables. The pinned coverage is:
  - 91 designs;
  - 823 placements;
  - 230 gun placements;
  - 28 torpedo-tube placements;
  - 9 central-battery placements;
  - 15 national launcher variants;
  - 5 waived launcher records;
  - 9 tube entries affected by `DQ-TORPEDO-001`.
- The approved-diff mechanism: any intended later change must match an owner-approved
  entry in `approved-diffs.json`, or the gate fails.
  - The file starts empty, and an empty file approves nothing.
  - Its schema is strict. Every entry requires `decisionId`, `designId`, `placementId`
    (or the affected entity), `fieldPath`, `oldValue`, `newValue`, `differenceClass`,
    `reason` and `approvalReference`.
  - A numeric difference also requires an explicit expected delta or expected
    replacement value.
  - Broad approvals are rejected at decode: `*` or any glob, regular expressions,
    approval of an entire design, and "every change from ticket X" style entries.
- The gate is wired into the repo's check/CI path per the check-parity rule.

## Acceptance criteria

- [ ] The canonical baseline report is generated, reviewed and reproducible, and is ready
      to commit with the implementation. It has `changed` = 0, full coverage and a
      populated `dataQuality` section. Whether the agent commits it follows that
      session's execution instructions; the gate is the reviewed, repeatable report.
- [ ] Moving any pinned coverage count, or editing a D17 or torpedo row, fails until an
      explicit baseline-update decision changes the fixture.
- [ ] Two processes produce byte-identical reports.
- [ ] An unapproved intended change fails, and the same change passes once a matching
      strict entry is added.
- [ ] Fixture tests reject: a wildcard or regex entry, a whole-design entry, an entry
      missing any required field, and a numeric entry with no expected delta or value.
      The empty file approves nothing.
- [ ] Whether any of the nine D17 designs feeds a campaign golden is recorded in this
      ticket's comments (for ticket 11).
- [ ] `pnpm check` is green: P1 is closed.
