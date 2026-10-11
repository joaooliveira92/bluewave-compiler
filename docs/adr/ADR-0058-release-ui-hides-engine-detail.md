# ADR-0058: Release UI hides engine detail; debug builds show it

## Status

accepted (2026-10-07). Context: RTW3 parity / UX modernization
(`.scratch/rtw3-parity-ux-overhaul`, V-1..V-5), ADR-0029 (debug-mode screens).

## Context
The first screenshot sweep showed the player-facing UI leaking engine
internals: the session UUID and revision in Overview and the sidebar footer,
raw ids (`fleet_gbr_home`, `des_gbr_alexandra`) in lists, and header slots
rendering "Alerts: —" for data the engine does not report yet.

## Decision
1. **`DEBUG_MODE`** (`shell/debug-flag.ts`, from `VITE_BLUEWAVE_DEBUG`, ADR-0029)
   is the single switch for engine-facing detail: session id, revision, month
   codes, the sidebar session footer, and the debug-only screens. Release builds
   never render them.
2. **`humanizeId`** (`lib/humanize-id.ts`) is for display only. Prefer the
   content pack's real display name; use `humanizeId` as the fallback. Its output
   is never a key and is never compared with engine ids.
3. **No placeholder dashes for unreported data.** A header slot the engine does
   not report yet is omitted, not drawn as "—". A feature the engine cannot
   support is shown as an explicit "deferred" panel with a recorded reason
   (AGENTS.md), never as fabricated numbers.
4. **e2e asserts what players see.** Specs assert the January 1880 header, not
   `Revision 0`. Debug-only values may be asserted in a debug build only.

## Consequences
New screens must not print ids, UUIDs or revisions outside `DEBUG_MODE`. The
click-depth ledger and the packaged smoke (`scripts/packaged-smoke.mjs`) check
the release build, so a leak surfaces there.
