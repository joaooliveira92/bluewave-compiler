# INC-14 — p27 revision-limit cross-check

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R28) · **ADR:** only if the limits are not already enforced (new; amends DESIGN-21)

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
