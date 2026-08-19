# INC-13 — Campaign-list screen + SaveMetadata extension

**What to build:** The campaign-list/load screen + the small additive
`SaveMetadata` extension, per [the assembled spec](../spec.md) §17.

- **SaveMetadata extension:** add three **additive, optional** fields to the
  real `SaveMetadata` schema — `campaignName: string`, `nationId: string`,
  `campaignDate: { year, month }` — written at save time alongside the
  existing fields. Legacy saves (and degraded `list()` fallback records)
  simply omit them; no migration (additive-only).
- **Campaign-list screen:** `SaveStore.list(saveDir)` → `SaveMetadata[]`
  (newest-first) rendered as a table: campaign name / nation / current date
  (the three new fields, `—` for legacy), last-saved time (real
  `timestamp`), save-format version (real string-typed
  `compatibilityVersion`), campaign status (UI-derived from `isTerminal` +
  in-flight-command, per §4). Corrupt/incompatible saves are skipped by
  `list()` and never crash the screen. Load goes through the real
  `loadCampaign` + `CompatibilityChecker`.
- Manual save already real (`saveCampaign`); failed-load/versioning =
  "document what's real" (no silent repair).

**Blocked by:** INC-14 (nav shell entry point)

**Status:** done (INC-13 impl, 2026-08-19)

- [x] `SaveMetadataSchema` accepts the three new optional fields; legacy
      records render `—` (no migration, no fabricated values)
- [x] Campaign-list screen lists real saves with all six columns and loads
      through `loadCampaign`/`CompatibilityChecker`
- [x] Corrupt/incompatible saves are skipped (never crash the list)
- [x] The new fields are written at save time by the real save path
- [x] Tests cover the schema extension + the list rendering + legacy records
- [x] Goldens 10/10 unchanged
