# Bluewave Engine and Compiler Prompt Suite

This suite governs autonomous development of the Bluewave TypeScript engine and compiler.

## Canonical inputs

The repository must contain:

- `README.md`, the binding canonical game-design baseline.
- This `.ai/` prompt suite.
- Approved ADRs and design amendments created during implementation.

Do not copy the entire canonical design into coding prompts. Reference it through stable requirement IDs in `.ai/REQUIREMENTS.md`.

## Precedence

1. Safety, legal, credential, and destructive-operation constraints
2. Canonical game design and approved amendments
3. `.ai/ENGINEERING-CONTRACT.md`
4. Approved ADRs and compatibility contracts
5. Current milestone brief
6. Reusable implementation prompt
7. Local conventions and agent judgment

If two applicable instructions conflict, stop and create a decision request. Never resolve a gameplay conflict silently.

## Recommended use

1. Give the agent `.ai/AUTONOMOUS-AGENT.md` as its standing operating prompt.
2. For a greenfield repository, run `.ai/BOOTSTRAP-PROMPT.md` with `.ai/briefs/B0-BOOTSTRAP.md`.
3. For subsequent work, combine `.ai/IMPLEMENTATION-PROMPT.md` with one approved milestone brief.
4. Before acceptance, run `.ai/REVIEW-PROMPT.md` in a fresh review context.
5. Use `.ai/RELEASE-PROMPT.md` at release or compatibility gates.

## Initial roadmap

- B0: Repository and engineering governance
- B1: Deterministic primitives and diagnostics
- B2: Minimal content compiler
- B3: Reduced-fixture campaign compiler
- B4: Command lifecycle and strategic phase runner
- B5: Meaningful one-month vertical slice
- B6: Atomic persistence, reload, and replay
- B7: Minimal deterministic battle auto-resolution
- B8: Cross-process and cross-platform determinism proof
- B9: Electron boundary and packaged smoke test
- B10: Milestone 1 expansion

The concrete bootstrap brief intentionally combines the smallest coherent portions of B0 through B2. It must stop before campaign compilation.
