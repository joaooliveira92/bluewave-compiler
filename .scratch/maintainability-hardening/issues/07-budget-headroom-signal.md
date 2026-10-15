# 07: Budget-headroom signal

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** The doc-budget gate surfaces when a budgeted document is at or
near its ceiling, so the ratchet doesn't silently freeze a document (several sit
at 99–100% and cannot take a real edit). It reports headroom per document and
warns below a small threshold, without failing a legitimately-full document.

- [ ] The gate lists headroom (used/ceiling) per budgeted document.
- [ ] A document within the threshold of its ceiling produces a visible warning.
- [ ] A document over its ceiling still fails.
- [ ] A fixture covers the near-ceiling and over-ceiling cases.
