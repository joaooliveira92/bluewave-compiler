# INC-1 — Classification parity pin

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R1..R3) · **ADR:** none (verification + doc annotation only)

## What to build

Prove that EARLY-band ship classification already matches `docs/manual.pdf` APPENDIX 1, so
classification is a settled, tested foundation for the build-phase work. Pin every boundary with a
test-vector fixture, pin the locked types, and add the one documentation annotation the manual's
2000 t gap needs.

## Acceptance criteria

- [ ] One test-vector fixture per EARLY-implemented type (`DD`, `CL`, `B`, `CA`, `BB`, `KE`, `AMC`)
      drawn from the Appendix 1 wording, exercising **both sides** of every strict/inclusive boundary
      (2000 t, 6 in, 19/16/20 kn, 4000/5000/8000 t, 2/3/12 in, 2000/2500 t, 1700 t, 22 kn).
- [ ] The deviations stay pinned by test: CA main gun strictly `>6 in` (ADR-0067 §1); DD "cannot be
      armoured" as the 2 in qualifying-armour threshold; CL belt `≤2 in` with a missing armour deck a
      WARNING not a rejection; KE/AMC read the largest gun of **any** role; AMC "fast" `≥22 kn` with
      fleet-share limits (ADR-0088); the 1880 ruleset relaxes B to 1500 t / 4 in / `<18 kn` (ADR-0116).
- [ ] `BC`, `CV`, `CVL`, `AV`, `SS`, `MTB`, `TR` remain unclassifiable in the EARLY band: a would-be
      design is refused with a blocking finding (`INTENDED_CLASSIFICATION_ILLEGAL` /
      `SHIP_TYPE_UNREGISTERED`), and no EARLY design can be classified as one of them.
- [ ] DESIGN-22 §9 gains the one-line annotation recording the 2000 t gap-fill (manual leaves exactly
      2000 t illegal; the app makes CL `≥2000`); a 2000 t design compiles as `CL`; no constant changes.
- [ ] Determinism: an identical compiled design yields an identical classification result and hash.

## Notes for implementator

No production behaviour changes. Ship the fixtures wherever the existing classification suite lives
(`@bluewave/ship-design`); do not weaken existing assertions. The DESIGN-22 §9 edit is one sentence and
needs no ADR (easy to reverse, unsurprising — ticket 04).
