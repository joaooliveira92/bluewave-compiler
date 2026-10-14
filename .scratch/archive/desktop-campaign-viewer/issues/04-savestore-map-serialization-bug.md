Type: grilling
Status: resolved

## Question

Ticket 01 surfaced that `SaveStore.save` (`packages/persistence/src/store.ts`)
serializes `CampaignState` via plain `JSON.stringify`, which silently turns every
`Map`-valued field (`nations`, `designs`, `designFamilies`, and the nested
`activeCandidates` Map inside each nation's `research`) into `{}`. Ticket 02 then
scoped the MVP viewer's subset around `nations`/`wars`/`diplomacy` — but `nations`
is exactly one of the fields this bug empties out. Any save written today will
render as an (almost) empty viewer for the field this map cares most about.

This bug lives in `@bluewave/persistence`, outside `apps/desktop` — ticket 01
explicitly left it unfixed as out of scope for *that* ticket. But it's not clearly
out of scope for *this map's destination*: a "read-only campaign-state viewer"
that can't actually show nation data because saves never carried it doesn't reach
the destination in any meaningful sense.

Decide: does fixing `SaveStore.save`'s Map-serialization bug belong on this map
(as a blocking ticket before the destination counts as reached), or is it
genuinely a separate effort (its own bug ticket/map in `@bluewave/persistence`,
unblocked from this one) — in which case this map's Out of scope section should
say so explicitly, and the milestone brief should document it as a known
limitation of "what a save currently contains" rather than a viewer defect.

## Answer

**Deferred, not fixed here.** The bug is a data-integrity issue in
`@bluewave/persistence`'s save serialization generally — not specific to the
desktop viewer that noticed it — so fixing it belongs in its own effort scoped
to that package, not folded into this side-track map.

This map's milestone brief must carry a **Known Limitations** section stating
plainly: saves written before the `@bluewave/persistence` fix lands will render
with an empty `nations` (and `designs`/`designFamilies`) block in the viewer,
because `SaveStore.save` silently drops `Map`-valued fields on serialize — this
is a save-writing defect, not a viewer defect, and resolves itself once
persistence is fixed and new saves are written.

Follow-up: open a separate bug/ticket against `@bluewave/persistence` for the
`SaveStore.save` Map-dropping defect (not chartered as part of this map).

