# Stale "validate IPC with Zod" line in ENGINEERING-CONTRACT.md

**Type:** task
**Status:** open
**Blocked by:** none

## Question

`.ai/ENGINEERING-CONTRACT.md` still instructs "Validate IPC requests and responses with
Zod" — stale since ADR-0102 replaced Zod with Effect `Schema` (Zod removed). Confirm the
exact line(s), the correct replacement wording (pointing at the decode-at-boundary rule /
`assert-boundary-decode.mjs`), and whether any other doc repeats the stale instruction
(e.g. `RULES.md`, `docs/delivery/*`, `AGENTS.md`).

Deliver: the stale lines found, the corrected wording, and the fix location(s). Doc-only.

## Answer

_(empty)_
