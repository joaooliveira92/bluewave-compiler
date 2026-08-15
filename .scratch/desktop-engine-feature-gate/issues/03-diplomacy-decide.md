- **Type:** decision
- **Status:** resolved
- **Blocked by:** 01

# 03 — Diplomacy & War doorstep decision

**Question:** does this sprint also build the Diplomacy & War screen
(B10c — 7 issueable commands + relations view + war-score surfacing)?

**Resolution — DEFERRED (recorded, not dropped).** Reasons:

1. **Surface breadth** — B10c ships 7 commands plus a relations matrix and
   war score view; a faithful screen is a multi-screen slice with real
   command-issuing plumbing (DeclareWar targeting, alliances, blockades).
   Fitting it next to a Research screen would exceed the single-session,
   single-frontier rule.
2. **Independent value** — Research screens work with zero dependency on
   diplomacy; both stand alone.
3. **Provenance** — this stays a tracked candidate on the map (row 2), not a
   silent drop.

**Adopted.** The Research & Technology screen is the sole frontier of this
sprint. Diplomacy & War becomes the next candidate in the desktop feature
gate queue.