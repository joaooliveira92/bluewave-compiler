# INC-6 — Final commissioning review screen

**What to build:** New summary screen per [the assembled spec](../spec.md)
§6, reusing the exact settled vocabulary from INC-2/3/4/5 verbatim. Summary
table rows: Nation, Era, Fleet size, Research pace, Technology variation,
Historical budget, Tactical realism, Difficulty, Starting fleet method,
Archetype, Naming convention, Ship name reuse, Measurement system, Admiral,
Campaign name. Active-preset annotation shown as a heading above the six
Rules-of-the-Naval-Age rows. Strategic forecast panel templated from the
nation's dossier data (INC-2) plus a settings-keyed "Expected pressures"
bullet list drawn from INC-3's setting blurbs — not hand-authored per
nation×era combination. Only two buttons: Back, Begin Commission.

**Blocked by:** INC-2, INC-3, INC-4, INC-5

**Status:** done

- [x] Summary table shows exactly the rows listed in spec §6, with no
      Aviation development / Tutorial adviser / Economic model / "Campaign
      scale" rows anywhere
- [x] Active preset name (or "Custom") shown as an annotation, not a
      duplicate row
- [x] Strategic forecast panel renders for all 10 nations × 5 eras without
      any new per-combination authoring — verify by spot-checking at least 3
      nation/era combinations produce sensible, non-empty text
- [x] No "Save as Preset" or "Generate Another Starting Fleet" button
      present anywhere on this screen, not even disabled
- [x] "Begin Commission" triggers the `compileCampaign` call (wired to
      INC-7 in that ticket)
- [x] Component tests cover table row rendering from draft state and the
      forecast panel's templating logic
