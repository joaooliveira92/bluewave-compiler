# Stale "validate IPC with Zod" line in ENGINEERING-CONTRACT.md

**Type:** task
**Status:** resolved
**Blocked by:** none

## Question

`.ai/ENGINEERING-CONTRACT.md` still instructs "Validate IPC requests and responses with
Zod" — stale since ADR-0102 replaced Zod with Effect `Schema` (Zod removed). Confirm the
exact line(s), the correct replacement wording (pointing at the decode-at-boundary rule /
`assert-boundary-decode.mjs`), and whether any other doc repeats the stale instruction
(e.g. `RULES.md`, `docs/delivery/*`, `AGENTS.md`).

Deliver: the stale lines found, the corrected wording, and the fix location(s). Doc-only.

## Answer

**Resolved — doc-only, applied.** The stale instruction was two lines in
`.ai/ENGINEERING-CONTRACT.md`; the same rule is repeated as live instruction in two
further forward-guidance docs, which were fixed in the same change.

**Stale lines found.**

- `.ai/ENGINEERING-CONTRACT.md:77` (Content) — "Use Zod for untrusted boundaries and
  serialization contracts."
- `.ai/ENGINEERING-CONTRACT.md:102` (Electron boundary) — "Validate IPC requests and
  responses with Zod."
- `.ai/IMPLEMENTATION-PROMPT.md:42` (live procedure) — "Validate untrusted boundaries
  with Zod …".
- `.opencode/agents/implementator.md:30` (live agent brief) — "use strict Zod
  boundaries".
- `docs/domain/armament-content.md:20` (live domain reference) — "The Zod schemas
  live in …".
- `packages/README.md:21` (live package index) — "`content-schema` | Zod schemas …
  ".

**Corrected wording** (points at the decode-at-boundary rule and its gate; uses the
`RULES.md` §Schema and boundaries policy of record — Effect `Schema` is the single
validator, `JSON.parse(...) as T` is rejected):

- `ENGINEERING-CONTRACT.md:77` → "Decode untrusted boundaries and serialization
  contracts with Effect `Schema` (Zod was replaced, ADR-0102/0105). Decode, never
  assert: a boundary `JSON.parse(...) as T` cast is rejected by
  `scripts/assert-boundary-decode.mjs`. Keep semantic rules and aggregate invariants in
  explicit domain code."
- `ENGINEERING-CONTRACT.md:102` → "Decode IPC requests and responses at the boundary
  with a strict Effect `Schema`; never trust a `JSON.parse(...) as T` cast
  (ADR-0102/0105, `scripts/assert-boundary-decode.mjs`)."
- `IMPLEMENTATION-PROMPT.md:42` → "Decode untrusted boundaries with a strict Effect
  `Schema` and domain legality with explicit validators."
- `implementator.md:30` → "decode every boundary with a strict Effect `Schema`
  (`scripts/assert-boundary-decode.mjs`)".
- `docs/domain/armament-content.md:20` → "The Effect `Schema` definitions live in
  `packages/content-schema/src/armament.ts`".
- `packages/README.md:21` → "Effect `Schema` definitions + safe YAML parser for packs,
  rulesets, entities."

**Other docs checked.**

- `RULES.md:78-85` — **already correct** (Effect `Schema` single validator; "Never
  dual-maintain Zod and Effect Schema"); no change.
- `AGENTS.md`, `docs/delivery/*` — **no** Zod instruction; no change.
- Historical records that describe the pre-migration rule at the time are **left
  intact** (rewriting them would falsify the record): `.ai/ROADMAP.md:45` (explicitly
  "Superseded … historical reference only"), `.ai/briefs/desktop-campaign-viewer.md`,
  `.ai/reports/*`, `docs/PROGRESS.md`, and other `.scratch/<effort>/` tickets.
- Non-archived ADRs that name Zod (`ADR-0001:24`, `ADR-0032`, `ADR-0038`, `ADR-0089`,
  `ADR-0093`, and the archived `ADR-0008`/`ADR-0030`) are **decision records** — the
  pre-migration state was true when they were written; ADRs are immutable and amended
  via `docs/adr/AMENDMENTS.md`, so they are left intact.
- `agent-patterns/effect-idioms.md` and `docs/content-suggestions.md` mention Zod only
  as the replaced predecessor / migration history — correct, no change.

**Fix locations.** `.ai/ENGINEERING-CONTRACT.md` (×2), `.ai/IMPLEMENTATION-PROMPT.md`,
`.opencode/agents/implementator.md`, `docs/domain/armament-content.md`,
`packages/README.md`. Doc-only; gates re-run green (`verify-doc-budgets`,
`docs-check`).
