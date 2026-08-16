# Ticket 09 — Version-Line Choice

**Type:** grilling
**Status:** resolved
**Blocked by:** 01-effect-v4-release-reality

## Question

Research (ticket 01) showed Effect **v4 is not stable**: `effect@latest` is v3
(`3.22.1`, still maintained, releases through 2026-07-30, no EOL announced);
`effect@rc` is `4.0.0-rc.109` with interfaces "presumed final" and stable
targeted Q3/Q4 2026; v4 is ESM-only and renames a large API surface
(`Either`→`Result`, `Context.Tag`→`Context.Service`, `Schema.ErrorClass`→
`Schema.Error`, etc.).

Which Effect line does Bluewave adopt, and when? Options: (a) pin v3 stable now
and migrate at 4.0.0 stable; (b) adopt the v4 RC line now (pinned rc version,
API names not frozen, evaluation spikes allowed); (c) wait for stable 4.0.0
before any adoption work starts. This decides the code-shape every other ticket
answers (v3 vs v4 API names, dual-build vs ESM-only, the migration surface).

Work with the human via `/grilling` + `/domain-modeling`, zooming ticket 01's
note (`docs/research/effect-v4-release-reality.md`).

## Answer

Bluewave adopts the **v4 line** as its Effect target (human decision,
2026-08-16):

- Planning proceeds against **v4 API shapes** now — every code-shape answer in
  this map (engine-core policy, beachhead, schema-vs-zod, sequencing) uses v4
  names: `Result`, `Context.Service`, `Schema.TaggedError`, ESM-only,
  `skipLibCheck: true` kept (load-bearing per ticket 02).
- Reference pin for the plan: **`effect@4.0.0-rc.109`**. The implementation
  track begins at **stable 4.0.0** (target Q3/Q4 2026); if the track must move
  before stable, it pins the exact rc (`4.0.0-rc.109`), never a floating rc.
- The rc→stable bump is scoped into the implementation track and rides the
  official `MIGRATION.md` + generated rename map (near-automated per the
  maintainers' RC announcement).
- No v3 line is adopted; no v3→v4 migration is scoped anywhere.

## Rationale / authority

The map is plan-only, so the RC's API churn never ships here; v4 stable is
imminent (Q3/Q4 2026, interfaces "presumed final"); v4 is ESM-only matching the
repo's toolchain and its TS ≥ 5.9 floor is exceeded (TS 7.0.2). Adopting v3
would pay a v3→v4 migration tax later with no offsetting benefit for a planning
effort whose destination is v4.