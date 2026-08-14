Type: task
Status: resolved

## Question

Ticket 02's research found that no existing test compiles
`content/production/1880` and then advances a strategic month / saves /
loads — `packages/cross-process-test/src/run-child.ts` exercises exactly
that loop (compile → `MonthExecutor` → `SaveStore` → replay → battle
generation) but only against a synthetic inline 2-nation fixture, not the
canonical pack. The MVP loop's month-advance step is therefore untested
against real content.

Extend or adapt that cross-process-test pattern (or add a new integration
test) to run the same compile → advance-month → save → load cycle against
`content/production/1880` directly, and record whatever gaps it surfaces
(the answer only needs to report findings — fixing any newly-discovered
content/engine gaps is follow-on work, out of this ticket's scope unless
trivial).

Not blocked by the bridge tickets (01/03/04) — this exercises the engine
layer directly, independent of the desktop IPC bridge.

## Answer

**The loop passes clean end to end — no content/engine gaps found.**

Added `packages/cross-process-test/test/production-pack-loop.test.ts`
(placed there rather than `apps/desktop` because that package already
depends on `@bluewave/phase-engine`/`@bluewave/commands`, which
`apps/desktop` does not). It compiles `content/production/1880` (14
nations, zero diagnostics), advances one strategic month with a real
`budget_project` command against an actually-authored construction project
(`con_gbr_inflexible`, nation `uk`), saves via `SaveStore`, loads it back
with hash/envelope verification passing, and replays the same command
through `ReplayVerifier` — the replayed hash matches deterministically.

This closes caveat 3 from ticket 02's research
(`docs/research/content-4-desktop-mvp-pack-readiness.md`) — the
month/save/load mechanism is now proven against real content, not just the
synthetic fixture.

One implementation note for whoever builds `@bluewave/campaign-engine`
(tickets 07/08/09/10): `ReplayVerifier.verify()` compares against an
internal, unexported subset-hash helper (`snapshotToHashable`/
`hashSnapshot`), not a raw `canonicalSerialize` of the full snapshot — the
test had to copy that helper locally since `@bluewave/phase-engine` doesn't
export it. The projection package may hit the same wall if it needs to
verify replay integrity.
