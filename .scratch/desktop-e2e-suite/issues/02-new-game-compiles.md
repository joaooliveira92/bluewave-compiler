# 02 — New Game compiles a campaign

**What to build:** the suite's first real flow — from the landing screen, a
player creates a new campaign (pick an archetype preset, fill preferences
including the fixed seed, choose Austria-Hungary) and lands on Campaign
Overview showing the freshly compiled campaign: nation Austria-Hungary,
turn 0.

**Blocked by:** 01 — Harness scaffold runs green

**Status:** resolved

- [ ] Spec exists in the serial `mvp-loop` file and is the first spec in the
      narrative: it compiles a fresh campaign into the file-scoped shared
      save dir (matrix row 1).
- [ ] Asserts user-visible state after compiling: Overview header shows, the
      campaign identity names Austria-Hungary and turn 0 — no IPC/envelope
      assertions.
- [ ] Fixed seed `ba44581c2f1d8e5c9753ffc80be8e6a0` is typed into the
      Campaign Seed field (valid u128 hex, per the map).
- [ ] Passes hermetically (built app, no dev server) via the harness; serial
      mode keeps it deterministic (workers: 1).
- [ ] Exact `test:e2e` command + results recorded; clean working tree;
      small conventional commit(s).

## Answer

Resolved. `apps/desktop/e2e/mvp-loop.spec.ts` row 1 (serial narrative,
file-scoped shared save). **Real flow order** (correcting the matrix's prose
order): Preferences → Archetype → Nation:

1. Landing → "New Campaign".
2. Preferences step 1 (Scenario): fill Campaign Seed with the fixed SEED →
   "Next" → step 2 (Ruleset) → "Next: Choose Nation".
3. Archetype: "Choose your archetype" → preset **Shipyard Baron** (an
   engine-backed preset card, `<button aria-pressed>`) → header primary
   action "Choose Nation".
4. Nation: option (listbox role, `aria-label`) **Austro-Hungarian Empire**
   (display name per the flavor catalog — the matrix's "Austria-Hungary"
   was wrong) → primary action "Start Campaign".
5. Compilation → shell lands on Overview.

**User-visible assertion corrections** (the Overview does not render the
nation inline; honest facts asserted instead):
- "Campaign Overview" heading visible within 30s.
- "Revision 0" in the header description (revision = `turnNumber`, fresh
  compile ⇒ 0).
- Campaign Identity card shows the fixed production scenario identity
  `campaign-bluewave-1880-production` (compiler: `campaign-${pack.manifest.name}`).

**Validation**: `pnpm --filter @bluewave/desktop test:e2e` → `2 passed
(2.2s)` (mvp-loop row 1 + hermetic smoke). Verified on disk that the
stubbed-dialog compile truly persisted a SaveStore package (session.json,
pointer.json, campaign.json + sig + metadata) into the file-scoped shared
save dir — the dialog stub + compile→persist path works end to end.

Also hardened the harness (fixtures.ts): launch failure now removes its
scratch tree (was leaking on mid-boot failures).

**Finding for ticket 06**: the previously shipped fixture package
`content/production/1880/bluewave-austria_hungary-scen_1880/` is **no longer
present** in the working tree (it was untracked at charting time). The
continuance suite's fixture must be produced by this compile flow (a fixed
seed carries the shape needed), or re-shipped/committed — see ticket 06.