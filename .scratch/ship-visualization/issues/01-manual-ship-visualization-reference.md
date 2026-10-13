# Manual ship-visualization reference

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

What does `docs/manual.pdf` define as the ship types (Appendix 1), the era/scenario model,
and the visual-part model (Appendix 3 side views, Appendix 5 turret files) that the
visualization must mirror — and how do the manual's nation and era identifiers map to the
repo's canonical `NationId` and `EraBand`?

## Answer

Resolved by the `research` subagent; note at
`docs/research/ship-visualization-catalogue.md` (5,392 words, every claim page-cited,
inferences marked). Key findings:

- **Ship types (Appendix 1, p131–134):** eleven types — DD, CL, B, CA, BC, BB, KE, AMC, CV,
  CVL, AV — with exact bounds and verbatim tech-scaling quotes (DD 2000→3800 t; CL and CV
  maxima rise; BC speed bar rises; AV <5000 → ≤14 000 t). The manual gives *that* maxima
  change but **no numeric schedule** → BALANCE TARGET.
- **Scenario/era model:** campaign starts are **1890, 1900, 1920, 1935** (p21); covered span
  1890–1970 (p7). These differ from the repo's canonical 1880/1900/1920/1935/1960.
- **Visual-part model:** Appendix 3 element sets place **masts → decks → superstructure →
  accessories** (p136); masts/decks/superstructure draw behind hull+turrets, accessories in
  front; 640×160 `.bmp` named `Classname + NationNumber` (p137). Appendix 5 turret files key
  the visual part as **nationality (A/B/F/G/I/J/Q/R/S/U/X) × era (V/P/D/L) × size (S/M/L) ×
  turret/shielded × guns 1–4**, with four special cases, sponsons, superstructure layers 5–6,
  and 12"-reference auto-resize (p139–142). Visual eras are year ranges: V early–mid 1890s,
  P to ~1905, D early 1900s–1930s, L late WW2→end (p140).
- **Nation mapping:** the 10 manual styles map cleanly onto `uk, germany, usa, japan, france,
  italy, russia, austria_hungary, spain, qing`; the other 14 repo nations have **no manual
  style** and fall back to universal `X`.
- **Manual is silent on per-nation-per-era ship-type ownership** — any such matrix would be
  unsourced and must not be fabricated.

Deferred/flagged: numeric tech-progression schedules; the scenario-set mapping; `NationNumber`;
the `H` vs `S/M/L` size-code inconsistency; shielded-code and era-overlap confirmations.
