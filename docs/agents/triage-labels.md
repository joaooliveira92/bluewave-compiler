# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

## How this maps to our local tracker

Our tracker is local Markdown (`.scratch/`), not a hosted issue tracker, so
triage is expressed with inline ticket fields rather than label strings:

- the skills' `ready-for-agent` ↔ an **implementation ticket** with
  `Status: open`, `Frontier: yes`, and a resolved/empty `Blocked by:` chain
  (see `docs/agents/issue-tracker.md`);
- `needs-triage` / `needs-info` / `wontfix` are not emitted in this repo —
  unfinished work stays `Status: open` with a note, and won't-fix work is
  recorded as **deferred** (`.ai/SPRINT-PLAN.md`), never silently dropped.

Keep the table above in sync with what the skills actually ask for; the inline
fields are the source of truth.

Edit the right-hand column to match whatever vocabulary you actually use.
