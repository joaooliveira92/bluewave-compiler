# Ticket 01 — Effect v4 Release Reality

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

What is Effect v4, precisely, as of 2026-08-16? Is it released and stable, and
what exact version (or version line) should a greenfield adopter pin? What are
the headline changes from Effect v3 — module reorganizations, renamed/deleted
APIs, package renames, breaking changes — and is there an official v3→v4
migration guide? What is the v4.x release cadence, the minimum Node/TypeScript
support, and any deprecation schedule for v3?

Resolve via a `/research` subagent against primary sources (effect.website
docs, GitHub releases/changelog, the migration guide). Context pointer →
`docs/research/effect-v4-release-reality.md`.

## Answer

Research note: `docs/research/effect-v4-release-reality.md`. **Effect v4 is NOT
stable** — it is a real, active major in RC: npm `latest` = `3.22.1` (v3),
`rc` = `4.0.0-rc.109` (2026-08-14), stable targeted Q3/Q4 2026. Headline v3→v4
changes: unified versioning, package consolidation into core `effect`,
`effect/unstable/*` module system, rewritten fiber runtime (bundle ~70 kB →
~20 kB), large API rename surface (`Either`→`Result`, `Context.Tag`→
`Context.Service`, `Schema.ErrorClass`→`Schema.Error`, etc.). Official
migration guide exists (`MIGRATION.md` + generated rename map; header note
stale vs RC status). No v3 EOL announced. The "which line to adopt" call is
graduated to ticket `09-version-line-choice`.