# 05 — Fleet visibility and honest stub surface

**What to build:** on the open campaign, the Fleet Movement screen renders
honestly for a freshly compiled campaign — the fleet/dashboard panels appear,
the divisions list shows the actual compiled state (an honest empty state,
never an error card), and the movement-order surface is presented as
available-but-disabled because movement commands are not yet implemented in
the bridge.

**Blocked by:** 04 — Construction submit / replace / cancel

**Status:** ready-for-agent

- [ ] Spec appended to the serial `mvp-loop` narrative (matrix row 6),
      opening the file-scoped shared save.
- [ ] Asserts the Fleet screen renders its panels with the compiler's honest
      divisions state (FleetState is the projection source; the compiler
      emits no divisions) — empty state, not an error.
- [ ] Asserts the movement-order surface is honestly disabled/not-submittable
      (the bridge commands are `NOT_IMPLEMENTED`) — no fabricated success
      copy (stub-surface contract).
- [ ] All assertions user-visible only; hermetic; serial; workers: 1.
- [ ] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).