# 15: Retire the legacy part formats (P5)

**Type:** implementation
**Status:** open
**Blocked by:** 12, 13, 14
**Frontier:** no
**Requirements:** SPM-R26 (P5 gate) · Story 51

## What to build

There is now one representation for ship parts. The following are deleted:

- `ComponentDef` guns;
- `componentVariants`;
- the national profile gun-model overrides;
- the armament adapter;
- the P1 read-path adapter;
- `upgradePath`;
- any combat torpedo constant still left.

Once the legacy baseline pipeline no longer exists, the equivalence harness keeps the
committed P2 report as its frozen baseline.

## Acceptance criteria

- [ ] Each removed symbol and schema field has no remaining reader. A grep/no-reader
      check is recorded in the ticket.
- [ ] All goldens and the committed equivalence reports are unchanged.
- [ ] Decoding content that uses a removed field fails.
- [ ] `pnpm check` is green.
