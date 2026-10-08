**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec §12.1–§12.3 and §12.8 (Construction page, Active Projects, Supported
Project States, Monthly Construction Resolution) of
[01-diagnosis.md](../01-diagnosis.md). (§12.4–§12.7, the ship-ordering
wizard, is a [separate ticket](./10-ordering-a-ship-wizard.md) blocked by
this one.)

The real `ConstructionProject` state
(`packages/campaign/src/state.ts:214-225`) has `totalWork`, `completedWork`,
`paidWork`, and a **4-value** status enum: `PLANNED | AUTHORIZED | ACTIVE |
COMPLETED` — no `paused` or `cancelled`, and upper-cased rather than the
doc's lower-cased 5-value proposal. A real cost formula already exists
(`construction_order_v1`: 1 cost unit per 100 tons displacement, capacity in
kilotons) that the doc doesn't mention.

Decide:

1. **Adopt the real 4-state enum** in place of the doc's proposal — confirm
   what `AUTHORIZED` means relative to the doc's `active`/`planned` split,
   and decide how (or whether) the doc's `paused` concept (§12.3: "may be
   produced automatically by insufficient funding") maps onto the real
   states, since no `paused` state exists. If insufficient funding can't be
   represented as a distinct state today, decide whether that's a display
   concern layered on `ACTIVE` (e.g. a stall flag) or genuinely out of
   scope for M2.

## Answer

Verified against `packages/campaign/src/state.ts:214-225`
(`ConstructionProject`) and the phase engine's resolution
(`packages/phase-engine/src/month.ts` — `appropriation` phase ~line 514,
`construction-processing` phase ~line 779, `computeConstructionCap`).

### 1. Adopt the real 4-state enum

**Adopt `PLANNED | AUTHORIZED | ACTIVE | COMPLETED`** (upper-cased, real) in
place of the doc's lower-cased 5-value proposal. Meaning against the doc's
split:

- `PLANNED` / `AUTHORIZED` — pre-resolution project records (authored
  starting builds and newly placed orders); nothing has been funded yet. The
  doc's `planned` maps onto this pair; the doc's `active` maps onto `ACTIVE`.
  `AUTHORIZED` vs `PLANNED` is not a player-facing distinction for M2 — the
  Construction page presents both as "not yet started."
- `ACTIVE` — the project has received construction work (the `appropriation`
  phase sets any funded project's status to `ACTIVE`, `month.ts:560`).
- `COMPLETED` — `completedWork >= totalWork` (`month.ts:805-814`); the
  `construction-processing` phase instantiates the finished ship
  (`month.ts:817-877`).

**`paused` (insufficient funding): there is no persisted `paused` state, and
this ticket decides NOT to add one.** The engine's real policy is that an
unfunded project simply does not progress (the `appropriation` phase skips it
when `available <= 0` or the per-nation construction cap is exhausted). The
doc's §12.3 "paused by insufficient funding" becomes a **display concern
layered on `ACTIVE`/`AUTHORIZED`** — a derived "stalled" flag meaning *no
progress in the resolved month* — surfaced in the report and on the
Construction page, **not** a new persisted state. The derived value comes from
the month-over-month `completedWork` delta already produced by
`constructionProgressedEvent` / the monthly report, so it is honest and needs
no new schema. This is the same stall signal the priority engine's
`construction_stalled` trigger (ticket 04) should consume.

### 2. Active project fields (§12.2)

- **total projected cost** = `totalWork`; **cost paid** = `paidWork`;
  **remaining cost** = `totalWork - paidWork` — work and treasury are 1:1
  (ADR-0036 / `construction.ts` note), so these are direct reads, not stored
  separately. Real.
- **progress percentage** = `completedWork / totalWork`, derived.
- **projected months remaining** = `(totalWork - completedWork) / expected
  monthly spend` where expected monthly spend uses the nation's construction
  cap (`computeConstructionCap`) — an **estimate**, explicitly labeled as
  such in the UI (the real appropriation is proportional to *available*
  funds and can vary). Derived, not stored.
- **assigned shipyard/dock** — **omitted.** No per-project dock is modeled;
  only the aggregate port-`level` capacity proxy (`shipyardCapacity`) exists.
  Showing "capacity used" as an aggregate is acceptable; a per-project dock
  assignment is not real and not shown.
- **project state** = the real `status` enum. Real.

### 3. Player-initiated cancellation

Confirmed **no `cancelled` state** exists and no reimbursement/cancellation
semantics are implemented. **Kept out of scope** per the doc's own gate
(§12.3). Completed projects appear in historical reports, not the default
active list (real `COMPLETED` filter).

### 4. Monthly resolution (§12.8)

The **real cost-formula/allocation policy is authoritative**, replacing the
doc's 10-step proposal:
1. `appropriation` phase (`month.ts:505-619`) — for each playable/AI nation
   with `treasury > expenses`, distributes available funds proportionally
   across incomplete projects (weighted by remaining work), each capped by
   the per-nation `computeConstructionCap`, spending real treasury and
   advancing `completedWork`/`paidWork`.
2. `construction-processing` phase (`month.ts:779-898`) — clamps
   `completedWork` (overflow → `CONSTRUCTION_OVERFLOW` diagnostic), marks
   `COMPLETED` at `completedWork >= totalWork`, and instantiates the new
   `Ship` (stats from the compiled design, ADR-0037), appending it to the
   nation's fleet.

The spec's copy must describe **this** actual policy (per §12.8's last
line) — proportional-to-available-funds with a construction cap, unfunded
projects stalling in place — not the doc's idealized 10 steps.
2. **Active project fields** (§12.2): confirm "remaining months" and
   "progress percentage" are derivable from `totalWork`/`completedWork` plus
   the real cost formula, not separately modeled fields.
3. **Player-initiated cancellation** (§12.3): the doc already marks this
   out-of-scope "unless the engine already safely supports reimbursement and
   cancellation semantics" — confirm it doesn't (no `cancelled` state
   exists) and keep it out of scope.
4. **Monthly resolution** (§12.8): confirm the real cost-formula/allocation
   policy is authoritative over the doc's proposed 10-step resolution list,
   and that the spec's copy describes the *actual* policy per the doc's own
   instruction (§12.8's last line).
