**Type:** grilling
**Status:** resolved
**Blocked by:** 13

## Question

Spec §15 (Monthly Resolution Presentation) of [01-diagnosis.md](../01-diagnosis.md).

No progress-streaming mechanism exists for month resolution (no
`subscribeToMonthProgress` equivalent found in the charting-session IPC
audit) — `commitMonth.ts` processes a month in one request/response. This
mirrors the situation the prior map's world-generation-presentation ticket
faced (`.scratch/game-onboarding/issues/07-world-generation-presentation.md`),
which resolved on a **cosmetic timed sequence racing the opaque call**, not
real progress events.

Decide:

1. **Real stage progress vs. cosmetic sequence** (§15.1–§15.2): given the
   real phase list decided in [Advance Month flow](./13-advance-month-flow.md),
   decide whether building genuine IPC progress streaming for month
   resolution is worth it for M2, or whether the same cosmetic-sequence
   pattern from the world-generation ticket applies here too. Recommend
   reusing the cosmetic-sequence precedent unless the resolved phase list
   makes real progress trivially cheap to wire.
2. **Stage copy** (§15.1): confirm the seven listed stage labels match the
   real phase list's actual order and content from ticket 13; adjust
   wording to stay truthful per the doc's own "must not claim fine-grained
   percentage completion" rule.
3. **Failure presentation** (§15.3): confirm the failure UI's claims
   ("previous month remains intact", retry safety) are backed by the atomic
   persistence guarantees already established in
   [Advance Month flow](./13-advance-month-flow.md).

## Answer

Verified against `commitMonth.ts` (single synchronous request/response; the
`MonthExecutor.execute` call at `commitMonth.ts:100-125` is one opaque call —
no progress callback, no `AbortSignal`, no streaming), the real `PhaseRegistry`
phase list (ticket 13's stage table), and the shipped failure surface
(`BridgeResult` rejection codes). Precedent confirmed: no real IPC progress
mechanism exists for month resolution, and building one (new
`subscribeToMonthProgress` channel + `MonthExecutor` progress callbacks) is
nontrivial engine work with no player benefit for a fast synchronous commit.

### 1. Real stage progress vs. cosmetic sequence (§15.1–§15.2)

**Decision: reuse the cosmetic-sequence precedent — M2 does NOT build real
progress streaming.** `commitMonth` is synchronous and atomic; a genuine
per-stage IPC channel would require threading progress out of `MonthExecutor`'s
phases through a new event channel, and the commit returns in well under a
second. The doc's own gate says progress may be exposed "if the engine command
is structured into meaningful stages" — it is not (single call). The renderer
plays a **cosmetic, timing-raced stage sequence** over the opaque call (the
exact world-gen pattern): show the loading screen with a stage indicator, run
the commit, and reveal the report when the response arrives. No fine-grained
percentage claims (doc §15.1 "must not claim fine-grained percentage
completion" — a stage indicator only, satisfied).

**Stage labels — adjusted to the real phase list.** The doc's seven labels are
kept but re-ordered and made truthful to the real `PhaseRegistry` order
(ticket 13's table) + the app-layer steps:

| Cosmetic stage label | Real owner (phase order) |
| --- | --- |
| Reviewing naval finances | phase 1 `monthly_revenue` (+ phase 5 `obligation`) |
| Processing fleet maintenance | phase 4 `maintenance` |
| Advancing ship construction | phase 3 `appropriation` + phase 6 `construction_processing` |
| Assessing foreign relations | phase 6.5 `resolve_diplomacy` |
| Reviewing research programs | phase 7 `resolve_research` |
| Compiling the naval estimates | phase 9 `closing_validation` + app-layer report assembly (`commitMonth.ts:212-232`) |
| Saving the campaign | `SaveStore.save` (app layer, `commitMonth.ts:189-195`) |

Re-ordering note: the doc listed research before diplomacy; the real order is
`resolve_diplomacy` (6.5) **before** `resolve_research` (7) — the cosmetic
sequence follows the real order. Battle generation/resolution (phases 7.5/8)
are not a listed stage — battle outcomes surface as report text per the
charting decision, and the loading screen may either skip a battle stage or
include a truthful "Resolving engagements" label; the labels must stay honest
to what the engine does. No `requestId`-scoped progress contract (§15.2) is
built — the doc's `MonthResolutionProgress` schema and its cleanup/scope rules
are moot with a cosmetic sequence (the renderer owns the animation lifecycle;
unmount clears it; there are no cross-window events).

### 2. Stage copy (§15.1)

Seven labels mapped as the table above; wording adjusted so none overclaim
(no percentages, no "compiling X" for a phase that doesn't compile). The doc's
"Preparing the Monthly Naval Estimates" title is kept. Each label names a real
phase family — nothing on the loading screen claims a stage the engine does not
perform.

### 3. Failure presentation (§15.3)

Backed by the real `BridgeResult` outcomes + ticket 13's atomicity:

- **concise error title / safe explanation** → the real rejection reason codes
  surfaced verbatim: `REVISION_MISMATCH`, `SIMULATION_END_REACHED`,
  `UNKNOWN_PLAYER_SLOT`, `MONTH_EXECUTION_FAILED` (with `DiagnosticCollector`
  messages), `SAVE_FAILED` (`commitMonth.ts:53-91,127-133,192-195`). No stack
  traces, no local paths (doc §15.3 — the codes carry none).
- **whether the previous month remains intact** → TRUE, with the exact
  guarantee from ticket 13 §6: `SaveStore`'s tmp-dir-rename + pointer means a
  failed save leaves the on-disk pointer unchanged and the queue intact; a
  `MONTH_EXECUTION_FAILED`/`REVISION_MISMATCH`/`SAVE_FAILED` return persists
  nothing. The failure UI states this honestly.
- **Return to Overview** → real (navigate to the Overview screen).
- **Try Again** → real and safe: every failure path leaves the session and the
  pending-command queue untouched, so a retry re-issues the same commit with no
  double-application (revision guard + queue-intact semantics, ticket 13 §3/§6).
- **Open campaign folder** → **CUT.** The doc conditions it on "an existing
  narrow preload capability that supports it safely" — **no such capability
  exists** in the preload surface (verified: no `shell.openPath`/folder-open
  method is exposed). Not commissioned; recorded as deferred.

### Net spec effect

M2's Monthly Resolution Presentation = the cosmetic world-gen-pattern loading
screen (truthful stage labels per the real phase list, no percentages, no
progress contract), racing the synchronous `commitMonth` call, plus the failure
UI keyed off real `BridgeResult` codes with "previous month intact" / "Try
Again is safe" guaranteed by the real atomicity + revision guard, and **no
"Open campaign folder" action** (no safe preload capability). No engine change;
goldens stay 10/10.
