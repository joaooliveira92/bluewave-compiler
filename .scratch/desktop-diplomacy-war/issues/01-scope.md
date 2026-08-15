- **Type:** decision
- **Status:** resolved

# 01 — Diplomacy & War scope gate

**Question:** what exactly does the Diplomacy & War desktop screen surface?

**Resolution — SCOPE (adopted):** read-only projection (relations / wars /
blockades for the player nation) + issue of all 7 B10c commands, through the
existing single-channel bridge, engine-authoritative.

**In scope:**
- Relations grid per known nation: relation kind (neutral/allied/at_war/
  trade_agreement), tension, nap flag, since month, plus the issueable
  commands for that pair.
- Wars list: war id, attacker/defender sides + member nation ids, both war
  scores, status, start/end dates.
- Blockades list: blockader/blockaded/area/established month.
- Issue: DeclareWar, AcceptPeace, FormAlliance, BreakAlliance,
  FormNonAggressionPact, BreakNonAggressionPact, DeclareBlockade.

**Explicitly out of scope (engine has none yet — would be fabricated):**
trade agreements, treaties, strategic objectives, protest/warning diplomatic
state, AI-negotiation surfaces. Recorded, not dropped.

**Authority:** desktop queues engine envelopes only; `MonthExecutor`
command_collection (order 2) applies them; `resolveDiplomacyPhase` (order 6.5)
applies monthly effects inside `commitMonth`. Issue-time validity comes from
the engine's own `CommandLifecycle.validate` (public) — no hand mirror.