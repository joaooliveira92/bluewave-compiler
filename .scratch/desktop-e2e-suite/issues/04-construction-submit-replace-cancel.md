# 04 — Construction submit / replace / cancel

**What to build:** on an open campaign, the player orders a construction
command (pick a design, Submit) and sees it land in the Shipyard Ledger's
command table; then replaces it with another design; then cancels it — each
step arriving at an honest, snapshot-consistent table state.

**Blocked by:** 03 — Advance a Strategic month

**Status:** resolved

- [x] Three specs appended to the serial `mvp-loop` narrative (matrix rows
      3–5), opening the file-scoped shared save.
- [x] Submit: design row appears in the construction command table with a
      status ≈ under construction / building, reflecting the screen's
      snapshot projection.
- [x] Replace: the in-flight command is replaced with another design and the
      table shows the replacement with no residue (replace is
      failure-atomic per the map).
- [x] Cancel: the command leaves the live table and the snapshot reflects
      the cancel.
- [x] All assertions user-visible only; deterministic (shared fixed-seed
      save); hermetic; serial; workers: 1.
- [x] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).

## Answer

Resolved. `apps/desktop/e2e/mvp-loop.spec.ts` rows 3–5, appended after row 2
in the serial narrative — each row reopens the file-scoped `sharedSaveDir`
from a fresh app boot (same pattern as row 2).

**Real screen (corrections to the ticket's assumed copy):** Construction
lives at sidebar "Construction" → "Construction Commands" heading, with
three tabs — "Design Catalog" (`DesignPicker`), "Command Ledger"
(`CommandTable`), "Shipyard Ledger" (stats only). Submit button is literally
"Submit Construction Command"; status badges render the raw lowercase
`ConstructionCommandStatus` (`submitted`/`accepted`/`superseded`/
`cancelled`), not "Building"/"Under construction" — the ticket's assumed
copy was wrong, so rows assert the real status text. Replace/Cancel buttons
render per-row in the Command Ledger only while `status === "submitted"`;
neither has a confirm dialog — both apply immediately (no separate Save
step exists on this screen).

**Real-content finding (Replace):** the Austria-Hungary production content
pack (`content/production/1880/designs.yaml`) carries exactly **one**
approved design for this nation (`des_aut_tegetthoff`), confirmed by
`buildConstructionDesignCatalog`'s strict `nationId` filter
(`packages/campaign-engine/src/construction.ts:110`). "Replace it with
another design" as literally described is not exercisable against this
nation/content combination — row 4 replaces with the same (only) design.
The user-visible atomicity contract under test is unchanged: the old
command supersedes (row shows `superseded`), exactly one `submitted` row
exists afterward — no duplicate in-flight residue.

**Nav selector fix:** the Overview screen renders its own "Construction"/
"Fleet" quick-nav buttons alongside the sidebar's, so a plain
`getByRole("button", { name })` is ambiguous (strict-mode violation). Added
a `navigateTo(page, label)` helper scoped to
`[data-sidebar="menu-button"]` in `mvp-loop.spec.ts`.

**Validation**: `pnpm --filter @bluewave/desktop build` (fresh
electron-vite build) then `pnpm --filter @bluewave/desktop test:e2e` →
`13 passed` (mvp-loop rows 1–6 + continuance rows 7–10 + smoke — the full
suite as of this ticket + 05/06). Standalone `tsc --noEmit --strict` on the
e2e files → clean. `vp lint apps/desktop/e2e` → 0 warnings/errors. Desktop
unit suite (`pnpm --filter @bluewave/desktop test`) → `49 files / 360 tests
passed`, unaffected.