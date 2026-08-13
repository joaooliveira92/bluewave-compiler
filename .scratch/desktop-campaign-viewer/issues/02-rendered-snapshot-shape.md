Type: grilling
Status: open
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

