# INC-14 — p27 revision-limit cross-check

**State:** RESOLVED · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R28) · **ADR:** in-place revision limits (ADR-0132; amends DESIGN-21)

## What to build

Confirm that the app's design-**revision** limits are the manual's printed-p27 limits, which are
distinct from the rebuild limits — so a player modifying a class before building is bounded by the
manual's rules, not an invented set.

## Acceptance criteria

- [ ] Confirm `constructionRevision` / `ReviseProject` enforce the manual's p27 revision limits:
      displacement `+10 %` or `1000 t`, main guns `>6 in` unchangeable, secondary `>6 in` limited,
      speed `±1 kn`, vertical armour `±1 in`, horizontal armour `±0.5 in`.
- [ ] If already enforced: pin each with a boundary test; no production change.
- [ ] If not enforced: align them to the manual as a rule change with a **new ADR** amending
      DESIGN-21 (record in `docs/adr/AMENDMENTS.md` with the DESIGN-21 banner per ADR-0095), and pin
      each with a boundary test.
- [ ] Determinism: the revision decision is keyed/stable.

## Notes for implementator

The manual's p27 numbers bound an **in-place revision**; they are not the rebuild retained-hull limits
(DESIGN-23 §21). Determine which model currently owns them before changing anything — the cross-check
may legitimately end with "already correct, tests added".

## Answer

Cross-checked: the revision model enforced no magnitude limits, so the manual's p27 limits were added as a rule change.

- `RevisionBalance` gains `inPlace: RevisionLimits` (displacement +10 % or 1000 t, whichever larger; speed ±1 kn;
  vertical armour ±1 in; horizontal armour ±0.5 in; main gun >6 in unchangeable), authored in `balance.yaml` and
  validated by `checkRevisionBalance`.
- `inPlaceRevisionFindings(source, target, limits)` + `revisionFactsOf` in `@bluewave/ship-design` (DESIGN-21);
  specific codes `REVISION_DISPLACEMENT_EXCEEDED`, `REVISION_SPEED_EXCEEDED`, `REVISION_VERTICAL_ARMOUR_EXCEEDED`,
  `REVISION_HORIZONTAL_ARMOUR_EXCEEDED`, `REVISION_MAIN_GUN_UNCHANGEABLE`.
- `applyReviseProject` enforces them for a T0/T1 in-place change, rejecting with `REVISION_LIMITS_EXCEEDED`; a
  T2/T3 change is already on the redesign/rebuild path.
- ADR-0132 amends DESIGN-21 (header banner + `docs/adr/AMENDMENTS.md`); each limit is pinned by a boundary test.

Commands: `@bluewave/ship-design` `vp test run test/trials-revision.test.ts` (28 passed) and full suite (886 passed);
`@bluewave/phase-engine` `vp test run` (316 passed); `tsc --noEmit` clean; `pnpm preflight` green.
