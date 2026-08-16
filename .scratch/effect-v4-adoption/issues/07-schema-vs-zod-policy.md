# Ticket 07 — Schema vs Zod Policy

**Type:** grilling
**Status:** resolved
**Blocked by:** 03-incremental-adoption-path, 09-version-line-choice

## Question

Does Effect Schema **replace**, **coexist with**, or **defer** the existing Zod
usage in this repo (root devDependency `zod ^3.24`; content-pack validation,
IPC envelopes, save boundaries)? What is the coexistence/transition policy
during gradual adoption, and where, if anywhere, is Zod the right tool to keep?

Work with the human via `/grilling` + `/domain-modeling`, zooming the adoption
path research (ticket 03).

## Answer

**Replace entirely, boundary-by-boundary** (human decision, 2026-08-16). Effect
Schema becomes the **single validator** across all three boundaries:

1. `@bluewave/persistence` / save boundary (the beachhead — first).
2. Desktop IPC (`apps/desktop/src/main`: `campaignCommandSchemas`,
   `campaignSessionMetadata`, `campaignBridge`, `campaignSaveSchema`).
3. `@bluewave/content-schema` pack schemas (largest, settled — last).

Each boundary migrates **in place** — no Zod↔Schema derivation bridge is
needed, because Zod is validation-only here (no downstream Zod consumers), so
there is never dual-maintenance of the same wire shape. The `zod` devDependency
is removed from the root when `content-schema` finishes. Consistent with the
one-monorepo-idiom driver (Q1) and the research-03 never-dual-maintain rule.

## Rationale / authority

Zod is used purely for validation at two boundaries (content-schema pack
schemas; desktop IPC), so Schema replaces it cleanly per the official
incremental on-ramp (one Schema-owned boundary at a time). Keeping Zod
permanently on content-schema would enshrine a two-idiom split against the
destination's idiom-alignment driver.