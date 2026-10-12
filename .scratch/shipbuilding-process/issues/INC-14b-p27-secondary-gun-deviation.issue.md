# INC-14b — p27 secondary-gun revision limit deviation

**State:** RESOLVED · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R28) · **ADR:** amends ADR-0132 (in-place revision limits)

## What to build

WS1 verified ADR-0132's p27 limits against `docs/manual.pdf` p27 (see
`docs/research/manual-designing-ships-revision-limits.md`). Five of the six limits match the
manual exactly. The sixth does not:

- Manual p27: "Secondary guns over 6 in **can be changed to a limited extent**."
- Shipped `inPlaceRevisionFindings` (`packages/ship-design/src/revision.ts`): a secondary gun
  above 6 in is **refresh-only** (blocked on any calibre change) — identical to the main-gun rule,
  which the manual deliberately contrasts ("Main guns over 6 in cannot be changed").

The manual gives **no number** for the "limited extent", so a permissive rule needs a versioned
BALANCE TARGET constant; inventing one is not allowed. The deterministic, non-fabricating
resolution is to **record the refresh-only reading as a deliberate deviation** in ADR-0132
(aligning to the manual is not possible without a manual bound).

## Acceptance criteria

- [ ] ADR-0132 records the secondary >6 in rule as a **deliberate deviation** from the manual's
      "can be changed to a limited extent" wording (conservative refresh-only), with the reason
      (no manual bound; no fabricated constant).
- [ ] `docs/research/manual-designing-ships-revision-limits.md` is cited.
- [ ] No behaviour change; the existing `REVISION_SECONDARY_GUN_LIMIT` boundary test stands.
- [ ] If a future owner sources a bound, it is a versioned constant + ADR, not code.

## Notes for implementator

Doc/ADR-only. The alternative (author `secondaryHeavyGunChangeLimitBp` and allow a bounded change)
is explicitly deferred: the manual supplies no magnitude.

## Answer

Resolved as a recorded deviation (ADR-0132 §4). The manual's p27 secondary rule ("over 6 in can be
changed to a limited extent") has no magnitude, so the shipped refresh-only rule is kept and
recorded as a deliberate, conservative deviation from the manual wording — not presented as the
manual's rule. No behaviour change; the existing `REVISION_SECONDARY_GUN_LIMIT` boundary test
stands. `docs/research/manual-designing-ships-revision-limits.md` is cited.
