# 01: Manual ship-type definitions reference

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

Produce a citable, machine-checkable reference of every ship-type definition in
`docs/manual.pdf` APPENDIX 1 ("SHIP TYPE DEFINITIONS USED BY THE GAME", printed p131–134), so
"Classification fidelity to Appendix 1" can be decided against the manual's rules in one place.

For each of DD, CL, B (pre-dreadnought battleship), CA (armoured / later heavy cruiser), BC,
BB, KE (corvette), AMC, CV, CVL, and AV, record with exact manual wording and page:

- every stated bound/predicate — displacement, speed, belt/other armour, main-gun calibre,
  turret count, torpedo requirement, armour requirement, aircraft capacity, build-time and
  peacetime limits;
- type reclassification / morph notes (e.g. CA→heavy cruiser in the 1920s; BC speed requirement
  rising);
- the protected-cruiser single-mounting exception;
- what makes a type "illegal";
- which maxima the manual says "change in game depending on your technological progress"; and
- the manual's statement that the AI relies on ship type for decision-making.

Write the reference under `docs/research/` (the research role's home), cite manual page numbers,
and report the artifact path back on this ticket.

## Answer

Resolved 2026-10-12. Artifact: `docs/research/manual-appendix-1-ship-type-definitions.md`
(citable per-type table + verbatim wording, pages 131–134; folio numbers verified against the PDF
bookmark tree and rendered images).

Per-type bounds (t = tonnes, in = inches; strict `< >`, inclusive `≤ ≥`): **DD** `<2000 t`,
`>19 kn`, unarmoured, torpedoes required (max displacement rises with tech, to 3800 t late);
**CL** `>2000` & `<8000 t`, `>16 kn`, `≤6 in` main gun (protected cruisers single-mount `≤8 in`),
armour required (late unarmoured allowed with missile-cruiser tech); **B** `≥5000 t`, `<20 kn`,
belt `≥6 in`, gun `>6 in`, `≤2` turrets; **CA** `>4000 t`, `>19 kn`, belt `>2` & `≤12 in`, gun
`≥6` & `≤11 in` (→ heavy cruiser in the 1920s, same CA tag); **BC** branch A `>10 in` + `>23 kn`,
or branch B three turrets + `>21 kn` (speed requirement rises with time; borderline armour decides
BC/BB); **BB** `≥3` turrets, `>8000 t`, belt `>6 in`, gun `>10 in`; **KE** `<2500 t`, belt `≤2 in`,
gun `≤6 in`, no torpedoes (`≤500 t` = wartime trawler, auto-sold); **AMC** `>1700 t`, no armour,
gun `≤6 in`, ≤2 peacetime and ≤2 fast (`≤25 kn`), auto-sold; **CV** aircraft `>34`; **CVL** aircraft
`≥4` & `≤34`, `≤16000 t` (not conversions); **AV** small `<5000 t` 3–4 aircraft, large `≤14000 t`,
helicopter variant.

Also captured: illegality ("anything falling outside these parameters is an illegal ship type"),
the AI reliance statement ("the AI relies heavily on ship type for decision making"), and the
protected-cruiser single-mount exception.

Open readings surfaced for "Classification fidelity to Appendix 1" to resolve: BC "three main gun
turrets" (exactly 3 vs BB's "at least 3"); DD "cannot be armoured" has no numeric threshold; the
`≤6 in` CA/CL gun overlap and the DD/CL 2000 t gap have no priority rule; and every "changes with
tech / rises with time" quantity is unscheduled (a BALANCE TARGET, not a number).

Citation note: this note's folios are p131–134; the pre-existing
`docs/research/rtw3-official-manual-ship-rules-and-1890s-history.md` cites Appendix 1 at p133–135
(consistently +2). This note's pages were verified against the PDF bookmark tree; treat the +2 set
as off-by-two.
