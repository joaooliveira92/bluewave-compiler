# INC-14 — Campaign shell + header wiring

**What to build:** The nav-shell and campaign-header wiring every screen
hangs off, per [the assembled spec](../spec.md) §5 — the foundation slice.

- **Treasury route:** the nav registry gains a sixth section (sidebar entry +
  route) rendering a stub ("not yet available") until INC-4 wires it to real
  state — same conditional-registration pattern already used for debug-only
  screens.
- **Header additions:** current date (`month.year`/`month.month`), current
  funds (`economy.treasury`), nation name (INC-1's new field), projected
  surplus/deficit (INC-1's new field), Advance Month (already wired — keep),
  save state (the existing `saving`/`saveMessage` pair), active-alerts count
  slot **forward-wired** to the INC-2 priorities projection (populated once
  INC-2 lands; not built here).
- **`StrategicDestination` rename:** `"foreign-relations"` →
  `"diplomacy"` to match the real shipped screen. Every `focus*` field stays
  unvalidated for now (standing follow-up: re-check once the Research/
  Construction/Fleet screens are wired).
- Route ownership confirmed matching as-is: renderer owns navigation; all
  campaign mutations route through the command client.

**Blocked by:** INC-1 (header fields)

**Status:** ready-for-agent

- [ ] Six nav sections present; Treasury renders a stub until INC-4
- [ ] Header shows date, funds, nation name, projected surplus/deficit from
      the INC-1 fields; alert-count slot forward-wired to INC-2
- [ ] `StrategicDestination` uses `"diplomacy"` (no `"foreign-relations"`);
      focus fields unvalidated
- [ ] Route ownership matches as-is (renderer navigation, command-client
      mutations)
- [ ] Component tests cover the header + nav wiring
- [ ] Goldens 10/10 unchanged
