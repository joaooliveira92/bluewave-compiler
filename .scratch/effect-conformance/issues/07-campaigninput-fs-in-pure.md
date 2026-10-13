# campaignInput.ts filesystem-read in a runtime-free package

**Type:** task
**Status:** open
**Blocked by:** none

## Question

ADR-0100 §2 (amendment) records a policy debt: `campaignInput.ts` performs a filesystem
read inside a package classified runtime-free. Confirm the current state
(read-then-decode shape, which package, whether `assert-runtime-free.mjs` covers it and
why it passes), then decide the remedy: move the IO to a boundary, reclassify the
package, or accept-and-document.

Deliver: the facts (file, package, gate status), a boundary-class verdict, and a
remedy with rationale. Escalate to an ADR only if reclassifying the package.

## Answer

_(empty)_
