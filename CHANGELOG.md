# Changelog

All notable player-facing and release-relevant changes. Newest first. Versions follow the desktop
app (`apps/desktop/package.json`); everything below is **Unreleased** until a release is cut from `dev`
to `main` (see `AGENTS.md`).

## Unreleased

### Changed

- **Ship-building content moves to one part model (save compatibility 2.0.0).** Ships are now
  compiled from platforms, slots and parts instead of per-placement legacy records. Every existing
  reference design keeps its current displacement, speed, armament, protection, cost and build
  time; only the nine central-battery ironclads are represented as batteries rather than invented
  multi-gun turrets.
- **Saves from before 2.0.0 are refused with a clear message and left untouched.** The design data
  model changed shape, so an older campaign cannot be interpreted honestly and is not translated at
  load time. A workspace draft from an older version is preserved (renamed) and the workspace starts
  from the default design; nothing you authored is overwritten. An offline developer tool migrates
  development fixtures only.

## 1.2.0 — 2026-10-12

### Added

- **Crash support bundle.** If the app hits an unexpected error it writes a small, local support
  bundle — error text with your username and home path redacted, the app version and platform — and
  tells you where it is, so you can attach it to a bug report. Nothing is ever sent anywhere
  (ADR-0133).
- **Fleet movement orders.** Order a fleet to sail to a neighbouring area from the Fleet screen; it moves when
  you advance the month. One order per fleet; replace or cancel it before then. The 1880 map was also
  connected: most home coasts and colonies had no sea routes at all.
- **Ships sunk now have names.** Every ship lost in battle is recorded with its name, class, owner and
  cause (gunfire, torpedo, flooding, fire) and listed in the battle history on Diplomacy & War.
- **Budget allocation (Treasury).** Set the naval appropriation rate (5–50%) and a standing monthly
  research budget; the change is applied when you advance the month. Previously research was funded
  for the first month only and nothing let you change the budget.
- **Map as the home screen.** Overview opens on a live world map (Compact / Large / Fill) with ownership,
  fleets and routes, a scale bar in nautical miles, a minimap, deep zoom to 60× with detailed coastlines,
  an area list (filter, select, zoom, with a Ships/Possessions toggle), keyboard pan/zoom, and a text table of area control. F1 opens the
  same map in a larger side panel.
- **Fleet organization (division editor).** Create divisions on a flagship, add and remove ships, change
  the flagship, dissolve — with the experience/cohesion cost of each change stated first.
- **Fleet positions map and area overview** on the Fleet screen, focused on the selected division.
- **Battle history** on Diplomacy & War (outcome, sides, area, ships lost per battle).
- **War score bar** (you vs. the enemy) for each war.
- **Real alerts and priorities:** the header shows an alert count and Overview lists the Admiralty's
  concerns, each linking to where you can act.
- **Budget at a glance** on Treasury.
- **Display density** setting (Comfortable / Compact) in Options.
- **Save a Copy…** in Options.
- **Monthly report** on Overview: after you advance the month, treasury movement, spending, construction and
  research progress and battles (in words, with names), plus earlier months from this session.

### Fixed

- **Save and Close Campaign did nothing** (they reported "not implemented"). Both now work (covered by integration
  tests and an end-to-end test). Save is safe to click
  repeatedly, and Close frees everything the session held.
- Fleet, Construction and the division editor no longer show pre-advance data after you advance the month.
- Engine ids, session ids and revision numbers no longer appear in the release UI (debug builds only).
- Map labels and markers keep a constant size when zoomed; coastlines render smoothly at every zoom.

### Changed

- **Sidebar grouped by job:** Admiralty, Operations, Government, Foreign (and Settings). Group headings now
  actually display — the shared sidebar-label component was dropping its text.

- **Fleet** no longer offers a movement-order form that could only fail; it says plainly that the engine has no
  movement command yet. The screen title is now "Fleet".

### Not yet modelled by the engine (shown as such in the app, never faked)

Trade protection, anti-submarine rating, submarine warfare policy and roster, invasion planning,
intelligence levels/spend/reports, ship names and dates in the losses ledger, scrapping, forts and bases,
air groups, officers, doctrine, mobilization, treaties, budget allocation, ship designer, fleet movement
orders. See `docs/research/rtw3-parity-engine-roadmap.md`.

### Internal

- Canvas coastline renderer with level-of-detail tiers (ADR-0055); baked binary coastline asset.
- Packaged-app smoke script (`pnpm --filter @bluewave/desktop run smoke:packaged`), which now also
  forces a crash in the packaged binary and asserts the support bundle is written.
- `pnpm check` now runs the golden-hash and cross-process determinism proofs, so local green equals
  CI green; a commit that changes authoritative source without re-pinning `golden/hashes.json` fails.
- The pre-commit hook format-checks the staged files, and `pnpm preflight` gains tracker-consistency
  and version-coherence gates.
- Long simulation suites (36-month regression, AI procurement) run in a dedicated bounded-concurrency
  step instead of the default parallel suite.
- `scripts/changelog.mjs` drafts the changelog from Conventional Commit subjects (ADR-0134).
- Type-floor, click-depth and content-coverage guard tests.
- Automated accessibility audit (axe-core) over the new screens, with a control test proving it detects violations.
