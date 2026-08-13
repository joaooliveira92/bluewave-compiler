Type: grilling
Status: resolved
Blocked by: 01

## Question

Given the data shape settled by "Load-Save IPC Contract" (ticket 01), decide what
subset of the `CampaignSnapshot` the MVP viewer actually renders and in what shape:

- Full snapshot dump vs. a curated subset (per the charting decision, economy/
  nations/fleets/diplomacy first — `wars`, `politics` sections vs. `world`/
  `intelligence`/`designs`/`designFamilies`).
- How much formatting beyond raw JSON (e.g. field ordering, omitting huge nested
  structures, summarizing counts) is in scope for the MVP JSON-dump style, vs.
  deferred to the "structured per-domain panels" fog entry on the map.
- Whether the same `outputEl`/status-line UI pattern used for `compile` is reused
  as-is, or needs a second output panel to avoid clobbering compile output.

## Answer

**Subset, not full dump.** The renderer extracts and displays only:
`{ turnNumber, campaignId, nations, wars, diplomacy: politics.relations }`
from the (already Map-flattened) `snapshot` returned by `campaign:load-save`.
`world`, `intelligence`, `designs`, `designFamilies`, and `politics.shells` are
omitted from v1. Rationale: `politics`/`intelligence` are still unmodeled stub
`shells: Record<string, unknown>` bags — dumping them shows opaque placeholder
data that undercuts trust in the viewer more than a smaller, honest subset
would. `world`/`designs`/`designFamilies` are flat and small but outside the
"economy/nations/fleets/diplomacy" story the ticket calls out, so they're left
for a later structured-panel ticket rather than folded into the MVP dump.

**No formatting beyond `JSON.stringify`.** Within the chosen subset, the MVP
does strictly `JSON.stringify(subset, null, 2)` — no key reordering, no
per-field omission of huge nested arrays (e.g. `wars.battleManifests`'
~30-field provenance records), no count-summarization (`"ships": 12` instead
of the array). That kind of shaping is exactly what the future "structured
per-domain panels" fog entry is for; building it now risks guessing at a
presentation that gets thrown away once real panels exist. If a specific
field proves unreadably huge in practice, that's a concrete follow-up ticket.

**Second output panel, not reuse of `outputEl`/`statusEl`.** Loading a save
and compiling a project are different actions a user may invoke back-to-back;
sharing `#output`/`#status` would silently clobber whichever ran first. A
dedicated `#saveStatus`/`#saveOutput` pair (same plain-DOM, `.textContent`-only
style as the existing compile panel) is added instead. Exact button placement/
labeling relative to Open/Save/Compile is deferred to ticket 03 (still open) —
this only fixes that the render target is a separate DOM pair, not where the
trigger lives.

