# Desktop E2E Expansion — 06: Multi-month depth — advance past month 1 to assert next-turn command application

Type: grilling
Status: open
Blocked by: 02 — Fixed-seed multi-month behaviour & suite wall-clock
Blocked by: 04 — Scope & Coverage Matrix v2: which flows graduate

## Question

Today the suite advances exactly one month (row 2 → February 1880). But the
core command contract is **"the engine applies queued commands on the NEXT turn
advance"** (research priorities, diplomacy commands, construction status
changes). An e2e suite that never observes condition-precedent→effect across a
turn boundary does not prove the loop the player lives in.

Should the expansion add **multi-month depth** — a second (and possibly third)
advance that asserts the queued-command application from the research/diplomacy
flows (and construction progression) produces the expected user-visible
changes — and if so, how deep, and which assertions (grounded by ticket 02's
concrete month-2/3 deltas)?

Also decide how it interacts with the serial narrative: extend `mvp-loop.spec.ts`
rows in place, a dedicated `multi-month.spec.ts` that reuses the shared compiled
save, or a fresh compile with a deliberately distinct command queue. Factor in
the schedule cost (a slow serial Electron boot per extra file) and ticket 08's
parallelism decision into the choice.