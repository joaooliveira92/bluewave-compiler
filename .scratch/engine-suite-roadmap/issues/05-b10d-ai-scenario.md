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
Status: open
Blocked by: 04