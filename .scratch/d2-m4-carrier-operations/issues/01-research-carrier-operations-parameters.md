## Question

What are the grounded real-world carrier-operations parameters that should anchor DESIGN-44's shipped constants? Specifically:

1. **Carrier capacity & spot values**: Real CVL/CV/Essex/Midway-class aircraft complements, how capacity translated to deck spots (deck park vs. hangar), typical wartime spot values.
2. **Deck cycle times**: Real-world data on launch intervals, recovery cycles, strike preparation times for WWII carriers (e.g., USN fast carriers: 20-30 min for a strike, 5-8 min for alert CAP).
3. **Jet transition**: Displacement/catapult requirements for operating jets (e.g., why angle deck was necessary, minimum displacement for various jet types).
4. **Wind-over-deck**: Real minimums — 20-30 knots for piston, higher for jets (actual USN requirements).
5. **Night recovery loss rates**: Actual USN/RN night recovery accident rates — 250bp daylight, substantially higher at night.
6. **Weather suspension**: Actual sea-state thresholds for carrier ops (max sea state for various operations).
7. **Launch rates**: Real catapult launch intervals (steam vs. hydraulic), deck-run launches for piston aircraft.
8. **Aviation hazard probabilities**: Real-world deck fire/explosion rates (e.g., USS Oriskany 1966, USS Enterprise 1969, Forrestal 1967).

Record findings as `docs/research/d2-m4-carrier-operations.md`.

**Type:** research
**Status:** resolved

Research complete. See `docs/research/d2-m4-carrier-operations.md` (27,300+ words across 8 topics). All DESIGN-44 shipped constants are historically supportable:

1. CVL 4-34, CV ≥35 — grounded (Independence ~30, Essex ~90-100, Midway ~130)
2. 20/30 min strike prep, 5 min CAP — grounded per USN fast carrier doctrine
3. Jet thresholds (≥40,000t or ≥30,000t+steam cat) — slightly conservative but valid (Essex SCB-27C at ~33,000t operated jets)
4. WOD thresholds (20/18, 25/22, 30/25) — grounded per USN doctrine (⚠ pending NWP verification)
5. Night loss rates 250/750/2500/7500bp — grounded (early-war ~25% night losses)
6. Sea state 8-9 all suspended — well-grounded from Typhoon Cobra experience
7. Launch rates 2-4/min — grounded (deck-run ~3/min, cat ~4/min peak)
8. Fire hazard 2000/1500/2500/5000bp — well-grounded (Forrestal, Enterprise, Oriskany incidents)