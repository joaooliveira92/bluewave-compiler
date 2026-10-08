# 26: Era multiplier for build time

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes

Source: ticket 22 review. `buildMonthsByDisplacementT` is date-agnostic, so above 14,900 t larger hulls build faster (34 and 28 months for 1906-10 battleships vs 35-36 in 1897-1900), and an oversized 1880s or 1890s design would get a 1910 duration. Add an era multiplier (versioned ruleset constant keyed by campaign month, sourced from Brassey/navweaps), keep the table monotonic by displacement within an era, and test determinism and boundaries.

## Comments
