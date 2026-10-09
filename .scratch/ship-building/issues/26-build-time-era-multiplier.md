# 26: Era multiplier for build time

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Source: ticket 22 review. `buildMonthsByDisplacementT` is date-agnostic, so above 14,900 t larger hulls build faster (34 and 28 months for 1906-10 battleships vs 35-36 in 1897-1900), and an oversized 1880s or 1890s design would get a 1910 duration. Add an era multiplier (versioned ruleset constant keyed by campaign month, sourced from Brassey/navweaps), keep the table monotonic by displacement within an era, and test determinism and boundaries.

## Comments
- 2026-10-09 resolved (ADR-0080): the displacement table is the 1894-1900 standard only (16,500/18,600 t points removed, so it is monotonic); `buildTimeEraBp` (year -> bp, clamped, per-point provenance) scales it by the keel-laying month, reproducing Lord Nelson 34 and Bellerophon 28 exactly; 1886 18,000 and 1890 12,200 bp are SECONDARY (Wikipedia Trafalgar / Royal Sovereign classes). Forecast and engine order share the month through `chooseYard`. Tests: era points, clamping, monotonic by displacement in every era and non-increasing by year, malformed months, provisional by era.
