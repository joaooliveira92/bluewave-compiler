# Ticket 06 — Gun Quality & Content Constants

**Type:** decision
**State:** RESOLVED
**Blocked by:** 01

## Question
What gun-quality model and content-constant deliverable does this slice ship?

## Decision
Gun quality is an integer in `-3..+2` (DESIGN-39 §5). Shipped multipliers
(range/penetration/rate-of-fire basis points): `-3`: 8_500, `-2`: 9_000,
`-1`: 9_500, `0`: 10_000, `+1`: 10_500, `+2`: 11_000. Out-of-range quality fails
with `GUN_QUALITY_OUT_OF_RANGE`. A gun/mount definition MAY declare quality does not
affect rate of fire (rate multiplier then omitted). Range/penetration multipliers
apply via their owning factors (range factor used in this slice; penetration folded
with armor track B-4).

**Content deliverable:** versioned gunnery constants (`gunnery_v1` policy +
`SHIPPED_GUNNERY_CONTRACT` + `validateGunneryContract`) plus a research-grounded
**naval gun ballistics constant set** in `docs/research/b3-m2-gunnery.md` — base
reload ms by broad caliber, salvo/spotting practice, fire-control cycle — so
`baseReloadMilliseconds` for the demonstration batteries is grounded, not invented.
No production-pack YAML change this sprint (content tracked separately).

## Rationale / authority
DESIGN-39 §5 normative shipped multipliers. Constant-deliverable matches B-2's
formation/movement constant pattern and the plan's B-3 content deliverable
("Naval gun ballistics stats").
