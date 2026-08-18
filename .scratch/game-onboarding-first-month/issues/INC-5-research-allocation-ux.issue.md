# INC-5 — Research allocation edit UX

**What to build:** The field-level research allocation editing UX on the
existing Research & Technology screen, per [the assembled spec](../spec.md)
§10 — the one editable allocation surface in M2.

- Field priority select per canonical research field: `HIGH / MEDIUM / LOW /
  (unset)` over the real integer-weight model (no basis-points, no
  balancing category).
- Cap: **`MAX_HIGH_PRIORITY_FIELDS = 5`** — raising a 6th field to `HIGH` is
  rejected (or the player must first lower another `HIGH` field); no silent
  redistribution.
- Issues the real `SetResearchPriorityCommand` (existing desktop command,
  whole-record `fieldPriorities` payload, one priority change per command,
  stable increments). No new command name/payload.
- Projected monthly progress is a pure derivation (largest-remainder split
  over `researchBudget` + weights), shown read-only.
- **Autosave after a successful `SetResearchPriority` command** (spec §17:
  genuinely-new trigger; domain command not successful until its persistence
  contract succeeds).
- "Unsaved changes" indicator: a renderer-only draft that diverges from the
  last committed snapshot (the only surface where this concept is
  meaningful).

**Blocked by:** INC-14 (nav shell), INC-1 (researchSpend for the header's
current-research figure)

**Status:** ready-for-agent

- [ ] Field priorities are editable per the weight model with the 5-HIGH cap
      enforced (raising a 6th is rejected, no silent redistribution)
- [ ] Real `SetResearchPriorityCommand` is issued via the existing desktop
      command path (no new command)
- [ ] Projected progress is a pure derivation, read-only
- [ ] Autosave fires after a successful research-priority command
- [ ] Component/engine tests cover the cap, the command payload, and the
      autosave trigger
- [ ] Goldens 10/10 unchanged; two-process determinism byte-identical
