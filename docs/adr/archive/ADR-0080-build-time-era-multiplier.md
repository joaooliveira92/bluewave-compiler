# ADR-0080: Build time era multiplier

## Status

Accepted 2026-10-09. Resolves ticket 26 on top of ADR-0067 section 5 (historical build time) and ticket 22 (sourced table).

## Context

`buildMonthsByDisplacementT` mixed two eras: the 1894-1900 points (35-36 months for a battleship) and the 1906-10 ones (Lord
Nelson 34, Bellerophon 28). Being date-agnostic, it made larger hulls build faster above 14,900 t, and an oversized design
ordered in the 1880s got a 1910 duration. Yards before the 1889 Naval Defence Act were also much slower than the table.

## Decisions

1. **The displacement table is one era: the 1894-1900 standard.** The 16,500 t and 18,600 t points leave it, so it is
   monotonic by displacement and clamps at 36 months above 14,900 t.
2. **Era is a separate multiplier keyed by the year the keel is laid** (`buildTimeEraBp`, a versioned content table in
   `balance.yaml`, bp on the displacement table, clamped at both ends). Each point is a class's keel-to-completion months over
   the table's months at its displacement: 1886 Trafalgar class 18,000 bp, 1890 Royal Sovereign class 12,200, 1895 and 1900
   10,000 (the table's own era), 1905 Lord Nelson / King Edward VII 9,400, 1908 Bellerophon 7,800. The two dropped table
   points are reproduced exactly (34 and 28 months).
3. **The keel is laid in the month the order is placed.** The engine's order plan and the Drawing Board forecast take the same
   month (`BuildTimeOptions.month`, `pricingFor(content, month)`), through the one `chooseYard` rule, so they cannot disagree.
   A malformed month throws instead of picking an era.
4. **Provenance per era point**, parallel to the table, checked like the displacement table's. The forecast is provisional
   while either table's bracketing points are not VERIFIED. The 1886 and 1890 points are SECONDARY (Wikipedia class pages);
   a Brassey or Parkes reading would make them VERIFIED.
5. **Granularity is the year.** Yearly points with linear interpolation are enough at this data density; integer bp, round
   half up, as every other multiplier on build time.

## Consequences

Ships ordered in an 1880 campaign take about 1.8 times the table time (a 2,000 t cruiser about 38 months), matching the decade's
record. Only designed ships (`SubmitDesign`, `ReviseProject`, `StartRebuild`) use the historical build time, so authored and
legacy projects and the goldens are unchanged. Era effects on cost are not modelled.
