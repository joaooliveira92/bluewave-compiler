# Research: national naval profile — Germany (1880–1899)

Companion to `national-naval-profiles-uk-france.md`; method, source grades and confidence labels identical. Every
in-repo figure (gun families, plants, hull forms, balance) is reused from the EARLY-band notes
(`ship-building-early-band.md`, `ship-building-1880-*.md`). Captured 2026-10-10.

## Question
Ground a date-banded `NationNavalProfile` for Germany (`germany`, the canonical repo id), plus shared-family national
models and six 1880 opening designs, without projecting the post-1898 Tirpitz battle-fleet doctrine back to 1880.

## Findings (summary)
- **Posture.** 1880 Germany is a continental two-sea (Baltic + North Sea) navy: a small, heavily-armoured
  coastal-defence-weighted battle line, a fast-growing torpedo-boat arm, and a minor colonial wing. Labeled ESTIMATE
  (shape grounded via navypedia class pages and Roksund's *Jeune École*, relayed) rather than VERIFIED; the Tirpitz-era
  fleet laws (1898/1900) are **not** applied.
- **Industry.** Krupp leadership in guns and steel armour (the two CLAUDE-relevant differentiators); no overseas
  coaling-station empire. Build-time/cost multipliers are BALANCE_TARGET within ±15% (no single sourced multiplier);
  machinery reliability ESTIMATE; quality variance ESTIMATE.
- **Gunnery.** Krupp 26 cm RK L/20 as the domestic heavy (present in the catalogue as `gun_bl_263mm_rkl20`); a
  license/import path for early QF; short battle range is a period fact, not the later doctrine. Heavy-gun and
  armour-plate production are DOMESTIC.
- **Torpedoes.** Schwarzkopf 45 cm tubes, DOMESTIC; torpedo craft emphasised (procurement and design weights).
- **Research.** GUNNERY 4, MACHINERY/HULL/TORPEDOES/MINES 3 (ESTIMATE shape).
- **Naming.** Dynastic/kingdom battleship names (Kaiser, Sachsen, Brandenburg), princely cruisers (Prinz Heinrich,
  Irene), yard-number torpedo boats (S113, G132), predator-name gunboats (Iltis, Wolf).

## Confidence / deferred (low-confidence values)
- Build-time/cost/reliability/variance multipliers: **BALANCE_TARGET** (no sourced German multiplier).
- 26 cm shell mass and the 15 cm RK L/25 shell mass: **ESTIMATE** pending a print source (Jordan/Gröner weight books).
- Engagement range, research priorities and design weights: **BALANCE_TARGET / ESTIMATE** shape.
- No German-specific dock capacity, yard throughput or stability source was opened.

## Verdict
Enough grounding to author Germany through the pipeline with per-value labels and no release placeholder; the
differentiators (coastal/battle-fleet posture, Krupp quality, torpedo emphasis, lower endurance) are grounded in
shape while the multipliers are explicit balance targets.
