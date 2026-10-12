# DESIGNING SHIPS: in-place design-revision limits (manual p27)

Research-only note. No code, content, spec or brief edited. Verbatim, page-cited
transcript of the reference manual's **in-place design-revision limits** so the
SB-3 `INC-14` cross-check (ADR-0132) can be judged against the manual's own
wording in one place.

Ticket: `.scratch/shipbuilding-process/issues/INC-14-p27-revision-limit-cross-check.md`.
Companion notes: `docs/research/manual-building-ships-rules.md` (BUILDING SHIPS
pp30–36) and `docs/research/manual-appendix-1-ship-type-definitions.md`
(APPENDIX 1 pp131–134).

## 0. Source, method, page numbering

| Tag | Source | Grade |
| --- | ------ | ----- |
| [M] | `docs/manual.pdf` (148 pp; PDF producer "Adobe InDesign 18.2", creation 2023-04-18). The *Rule the Waves 3* manual. | **Primary (official manual)** |

Extraction: `python3 -c "import pymupdf; ..."` (`pymupdf 1.28.2`) from the PDF
text layer. **Printed page number == 1-based PDF page index** (same convention
as the companion notes; verified by the printed folios).

Context: the limits appear on printed p27 at the end of the "DESIGNING SHIPS"
passage, immediately after the paragraph on developing a new design from an
existing class and the "Developed from" discount. The list is introduced by:

> "Generally the following are the limits for change before it becomes an entire
> new design with no discount."

## 1. Verbatim transcript (printed p27)

> È Displacement can increase by a maximum of 10% or 1000 tons.
>
> È Main guns over 6 in cannot be changed.
>
> È Secondary guns over 6 in can be changed to a limited extent.
>
> È Speed can be changed by one knot.
>
> È Vertical armour can be changed by one inch and horizontal armour by half an
> inch.

(The `È` glyph is the PDF's bullet; the wording is otherwise verbatim.)

## 2. Machine-checkable limit table

| Field | Manual wording (p27) | Bound (as written) |
| ----- | -------------------- | ------------------ |
| Displacement | "can increase by a maximum of 10% or 1000 tons" | increase ≤ max(10 %, 1000 t) |
| Main guns | "over 6 in cannot be changed" | calibre > 6 in: no change (same-calibre refresh only) |
| Secondary guns | "over 6 in can be changed to a limited extent" | calibre > 6 in: **some** change permitted — extent **unspecified** |
| Speed | "can be changed by one knot" | ±1 kn |
| Vertical armour | "can be changed by one inch" | ±1 in |
| Horizontal armour | "…and horizontal armour by half an inch" | ±0.5 in |

## 3. Ambiguities (load-bearing)

1. **Displacement "10 % or 1000 tons".** The manual does not say "whichever is
   greater". The natural reading (and the one ADR-0132 adopts) is an allowance of
   `max(10 %, 1000 t)`: the 1000 t floor matters for small hulls, the 10 % matters
   for large ones. A reading of `min(...)` would make the 10 % clause dead for
   large ships; `sum(...)` is not supported by "or". Recorded, not resolved by the
   manual.
2. **Secondary guns "to a limited extent".** The manual deliberately contrasts
   the secondary rule with the main-gun rule ("cannot be changed"): secondary guns
   above 6 in *may* be changed, but only *to a limited extent*. The manual gives
   **no number** for that extent. ADR-0132's shipped behaviour treats a secondary
   gun above 6 in as refresh-only (identical to the main-gun rule), which is
   **stricter than the manual's plain wording**. The manual does not supply the
   bound, so any permissive implementation needs a versioned BALANCE TARGET
   constant; a conservative refresh-only rule must be recorded as a deliberate
   deviation, not presented as the manual's rule.
3. **"Change" scope.** The limits bound *in-place revision* of an existing class
   (before/while building), distinct from the rebuild retained-hull limits
   (DESIGN-23 §21: displacement +20 %, speed +3 kn, length/beam ±5 %) — the manual
   states the revision limits only for the design-study discount context.

## 4. Cross-check against the shipped model (ADR-0132)

| Limit | Shipped (`inPlaceRevisionFindings`) | Manual p27 | Verdict |
| ----- | ----------------------------------- | ---------- | ------- |
| Displacement | `max(10 %, 1000 t)` | "10% or 1000 tons" | matches (interpretation recorded) |
| Main gun > 6 in | block on calibre change | "cannot be changed" | matches |
| Secondary > 6 in | block on calibre change | "can be changed to a limited extent" | **stricter than manual** |
| Speed | ±1 kn | "by one knot" | matches |
| Vertical armour | ±1 in | "by one inch" | matches |
| Horizontal armour | ±0.5 in | "by half an inch" | matches |

## 5. Recommendation

- The displacement, main-gun, speed, vertical- and horizontal-armour limits match
  the manual and are correctly pinned by tests.
- The **secondary > 6 in** rule is a conservative deviation from the manual's
  "can be changed to a limited extent": either author a versioned BALANCE TARGET
  bound for the permitted change and implement it, or record the refresh-only
  reading explicitly in ADR-0132 as a deliberate deviation. Correction ticket:
  `INC-14b`.
