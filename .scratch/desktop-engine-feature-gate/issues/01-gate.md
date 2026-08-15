- **Type:** grilling
- **Status:** resolved

# 01 — Gate: which desktop features to build this sprint

**Question:** The desktop already has a complete MVP loop, but the engine has
built capabilities the desktop never surfaces (Research B10b, Diplomacy/War
B10c, tactical battle results B-2..B-6). Which should the desktop surface
first, and under what rule?

**Resolution — RULE (adopted):** gate = **engine-built, ACCEPTED, and absent
from the desktop**. Frontier this sprint = the **Research & Technology
screen** (B10b). Rationale:

1. Engine buildability — `MonthExecutor` already processes
   `SetResearchPriorityCommand` envelopes in its command_collection phase
   (`packages/phase-engine/src/month.ts`), and `ResearchState`
   (fieldPriorities/discovered/technologies) is already in the compiled
   snapshot. Zero engine change needed; it is a pure desktop-surface slice.
2. User value — research is a core monthly loop; without a screen the player
   cannot influence `research_progress` at all from the desktop.
3. Collision safety — the B-6 engine sprint (owned by a parallel phase-engine
   agent) is mid-flight with uncommitted `.scratch` status edits; a desktop
   slice that only reads a compiled snapshot + issues an already-supported
   command touches no phase-engine file and cannot collide.
4. Size — `inspectResearchScreen` (projection) + one command +
   a bounded screen; fits one session boundary alongside the gate chart.

**Adopted.** Deferred features are recorded in the map with explicit reasons.