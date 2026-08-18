# INC-11 — Cosmetic monthly-resolution presentation

**What to build:** The cosmetic loading sequence over the synchronous
`commitMonth` call, per [the assembled spec](../spec.md) §15 — no real
progress streaming.

- Loading screen titled "Preparing the Monthly Naval Estimates," showing the
  stage indicator sequence with **truthful labels** in the real `PhaseRegistry`
  order:
  1. Reviewing naval finances (phase 1 `monthly_revenue` + phase 5 `obligation`)
  2. Processing fleet maintenance (phase 4 `maintenance`)
  3. Advancing ship construction (phase 3 `appropriation` + phase 6
     `construction_processing`)
  4. Assessing foreign relations (phase 6.5 `resolve_diplomacy`)
  5. Reviewing research programs (phase 7 `resolve_research`)
  6. Compiling the naval estimates (phase 9 `closing_validation` + report
     assembly)
  7. Saving the campaign (`SaveStore.save`)
- Cosmetic, timing-raced over the opaque `commitMonth` call (the
  world-generation-pattern precedent) — **no fine-grained percentage claims,
  no `MonthResolutionProgress` schema, no IPC progress channel**.
- Failure UI keyed off the real `BridgeResult` codes (surfaced verbatim, no
  stack traces / local paths): concise title, honest "the previous month
  remains intact" (ticket 13's atomicity), **Return to Overview**, **Try
  Again** (safe — failure leaves the session + queue untouched). **No "Open
  campaign folder" action** (no safe preload capability).

**Blocked by:** INC-10 (pre-turn review precedes the resolution flow)

**Status:** ready-for-agent

- [ ] Loading screen shows the 7 truthful stage labels in the real phase
      order, over the synchronous commit (no percentage claims)
- [ ] No progress-streaming IPC or schema is built
- [ ] Failure UI surfaces the real `BridgeResult` codes with the honest
      "previous month intact" copy, Return to Overview, and Try Again
- [ ] No "Open campaign folder" action exists
- [ ] Component tests cover the sequence + failure states
- [ ] Goldens 10/10 unchanged
