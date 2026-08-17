# INC-5 — Starting-fleet method screen

**What to build:** New screen (replacing INC-1's stub) per [the assembled
spec](../spec.md) §5. Three-card select, matching the Archetype/preset-picker
visual pattern: `generated` = "Inherit an existing navy" (default,
recommended), `disabled` = "Build the legacy fleet manually", `historical` =
"Curated historical-inspired fleet." No era-gating — all three cards
selectable in every era. All three cards are descriptive-only (no numeric
previews); the manual-build card additionally shows a brief "detailed fleet
construction isn't available yet" note. None of the three ids are grayed out
or omitted.

**Blocked by:** INC-1

**Status:** done

- [ ] Three cards render with the copy mapping from spec §5a (note the
      `historical` = curated, not manual-build, naming trap)
- [ ] `generated` is the default selection on first visit
- [ ] All three cards are selectable in every scenario/era, with no
      conditional hiding or disabling based on era
- [ ] No numeric allocation figures, ship counts, or Phase 1/Phase 2
      breakdown appear on any card
- [ ] Manual-build card shows the "not yet available in detail" note
- [ ] Selected mode is readable from draft state as the real
      `legacyFleetModeId` value sent to `compileCampaign`
- [ ] Component tests cover default selection and card content per mode
