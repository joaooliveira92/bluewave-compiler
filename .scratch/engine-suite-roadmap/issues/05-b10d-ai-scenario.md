# 05 — B10d AI legality and scenario readiness

## Question

What exact scope does B10d (Milestone 1d: AI Legality + Scenario Readiness) cover?

This sub-milestone wraps up Milestone 1 by adding AI decision-making and a full scenario readiness gate.

Questions to resolve:

- AI legality scope: What is the minimum AI system? Legal-only AI (checks if a command is legal, picks randomly among legal options)? Or minimal strategic AI (e.g., always build ships, always research)?
- How does AI interact with the command lifecycle (BW-CMD-001, BW-CMD-002)?
- Scenario readiness: What gates define a "ready" scenario? (compile → first turn → battle resolution → save/load → replay — from the Release principle in ROADMAP.md)
- Does scenario readiness require multiple AI participants executing simultaneous turns?
- What are the explicit out-of-scope items (e.g., sophisticated strategic AI, learning, scripting)?
- Acceptance criteria — what must be demonstrable?
- Does this need new packages (e.g., `packages/ai`)?

Type: grilling
Status: resolved
Blocked by: 04

## Answer

### AI scope

**Minimum viable AI: legal-only command generation.** A new `AI_PLANNING` phase (order 1.5, between `command_collection` and `appropriation`) enumerates all legal commands for each AI nation and picks uniformly at random via a keyed RNG stream (`ai/planning/nation/type`). No strategic heuristics, no weighted preferences, no DESIGN-50 components.

AI generates the same command types humans use (`BudgetProjectCommand`, `SetResearchPriorityCommand`) and submits them through `CommandLifecycle.process()`. Rejected commands produce diagnostics but no retry. Idempotency keys are deterministic (`campaignId/turnNumber/nationId/commandType`).

### Scenario readiness gates

A "ready" scenario must pass six gates:

1. Campaign compilation → valid `CampaignSnapshot`
2. First turn execution → all slots run without crashing
3. Battle resolution → every reachable mission family auto-resolved
4. Save/load cycles → deterministic serialization round-trip
5. Replay verification → identical hashes from same seed
6. 24-month automated smoke test → zero human input, final hash verification

### Multiple AI participants

Yes — the scenario must support 2+ AI nations (FRA+GER in the 1880 fixture) executing simultaneous independent AI planning, each with their own RNG stream slice.

### Out-of-scope (explicit)

Strategic AI, all 23 DESIGN-50 components, national traits, difficulty levels, AI battle acceptance, AI diplomacy, AI ship design, AI learning/scripting, scenario support manifest runtime enforcement, capability readiness state machine, packaged smoke test framework, content-only locked isolation, release support manifest.

### New package

Yes — `@bluewave/ai` containing `AiPlanner`, `AiCommandGenerator`, `AiPhaseExecutor`. This is the first new package since the core packages and keeps AI concerns separate from `@bluewave/phase-engine`.

### Brief produced

`.ai/briefs/b10d-ai-scenario.md` — follows the same format as B10a/B10b with scope, out-of-scope, acceptance criteria, and stop conditions.
