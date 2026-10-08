# RTW3 meaning of each readout and button

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question
From the RTW3 manual and high-trust sources, what does each readout mean (units, ranges, colour thresholds, e.g. negative monthly balance red, build requirement, shipyard capacity triple) and what does each button/tab open and do? Output `docs/research/campaign-command-screen-rtw3-semantics.md`. Features only, no layout copying.

## Answer

Findings are in `docs/research/campaign-command-screen-rtw3-semantics.md` on the throwaway local branch `research/campaign-command-screen-rtw3-semantics` (commit 4be36b1, not pushed, never merged; worktree `.claude/worktrees/agent-a8c74d44bc782ed7b`). Source: official RTW3 manual (149 pp). The manual has no main-screen chapter, so each claim is tagged DOC / INFER / NONE.

- Documented: prestige (<=16 risks sacking), fleet morale, unrest, foreign-station tonnage (colonial ships x1.5), dock size, shipyard capacity (multiple of dock size), treaties, intel, budget lines (research cap 12%, diminishing above 10%).
- Not in the manual: scales for prestige/morale/unrest, colour thresholds (red negative balance is a UI convention), "Build requirement", treaty "time" field, shipyard-capacity triple, naval-aircraft budget line, and the items Messages, All reserve, Mobilization screen, Show history, Auto-build subs, Resign, Almanac, Intel reports.
- Engine check: budget allocation exists (ADR-0060), Resign maps to Close; most other readouts are "Not yet modelled".

Open questions for the spec: define our own meaning for Build requirement, treaty time and the capacity triple (versioned constants + ADR), or leave them deferred.
