# Desktop E2E Expansion — 09: Debug-gated Simulation (Turn Report / Battle Arena) via a debug e2e build variant

Type: grilling
Status: open
Blocked by: 04 — Scope & Coverage Matrix v2: which flows graduate

## Question

Simulation & Turn (Strategic Overview, Turn Report, Battle Arena), Tactical
Sandbox and Debugging screens are registered only when `VITE_BLUEWAVE_DEBUG=true`
(`DEBUG_MODE` in `campaign-screen-registry.tsx`), so the production e2e build
never renders them — Battle Arena's honest-`NOT_IMPLEMENTED` surface is
currently **untestable** from e2e, and the month-advance-from-Simulation path
(primary action "Advance Turn (1 Month)", distinct from the Overview header
"Advance Month" now covered) is invisible to the suite.

Should the expansion add a **debug-enabled e2e build variant** — a second
electron-vite build with the flag set, booted by a debug-tagged spec file — so
Spec:Simulation (Turn Report after a month advance, Strategic Overview,
submarine/mine/land-damage panels) and Battle Arena's honest disabled/stubbed
surface become coverable? Or keep debug surfaces out of e2e (they remain
unit-covered; Debugging/Tactical Sandbox are dev tooling)?

Weigh the cost: an extra built artifact + branch in the CI gate, and the risk
that debug-gated screens drift from unit coverage without a guard. Distinguish
Battle Arena full-play e2e (still fog — bridge battle commands are
NOT_IMPLEMENTED) from **asserting the honest disabled surface** today (in scope
of this decision). Record the decided variant (or deferral).