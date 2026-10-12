# 03: Design map and inspector section routing

**Type:** implementation
**Status:** open
**Blocked by:** 02
**Frontier:** yes

Source: `.scratch/shippbuilding-ui.md` §"Left design map", §"Right inspector design",
§"Recommended right-panel content by section".

## What to build

Turn the left rail into a design-navigation map of the seven design sections (Overview, Hull,
Machinery, Protection, Armament, Systems, Review), each showing a status indicator (valid /
warning / a count of unresolved issues / not configured). Selecting a section shows its
content in the right inspector with that section's local tabs, and the existing editors are
relocated into their sections. This is the navigation spine the section tickets fill in.

## Acceptance criteria

- [ ] The design map lists the seven sections, each with a status meaning (✓ valid, ! warning,
      a count of unresolved issues, – not configured/unavailable).
- [ ] Selecting a section swaps the inspector content; each section shows a small number of
      local tabs (2–4) representing sibling concepts, with no nested tab hierarchy.
- [ ] Existing editors are reachable under their sections and still modify the draft with no
      functional regression.
- [ ] At small widths the design map collapses into icons or a dropdown.
- [ ] Sections that are not configured/unavailable render as not-configured rather than
      erroring.
