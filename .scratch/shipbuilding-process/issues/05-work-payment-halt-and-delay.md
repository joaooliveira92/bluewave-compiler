# 05: Work, payment, halt and delay

**Type:** grilling
**Status:** resolved
**Blocked by:** 02

## Question

Decide the build-phase money/work model so it matches the manual, reconciled with DESIGN-23
§6–7 and the code.

Manual (printed p30–31): cost is paid in monthly instalments during the build time; construction
may be temporarily halted (halted ships cost half their mothballed maintenance cost); a delayed
ship does not have its monthly build cost deducted.

Compare DESIGN-23 §6 (Work and Payment: `affordableWork`, `capacityLimitedWork`,
`calculatedEffectiveWork`, `appliedWork`) and §7 (Delayed and Halted: zero work, zero ordinary
charge, preservation cost), plus `packages/phase-engine/src/constructionFunding.ts` and the
project status enum in `packages/campaign/src/state.ts` — which currently has no `HALTED` or
`DELAYED`.

Decide: implement the manual's instalment model or keep per-package funding with halt/delay as
status modifiers; the halted-cost rule (half mothballed maintenance); delayed-month
non-deduction; the player's halt/resume action; and the status/persistence changes required.

## Answer

Resolved 2026-10-12 (autonomous; grounded in `docs/research/manual-building-ships-rules.md` p30–31,
DESIGN-23 §2/§6/§7, and the code). Follows the accepted direction of "Fidelity and deviation policy"
(Q6): keep the per-package work/payment engine as truth; do not invent a separate instalment schedule.

- **Instalments = the existing monthly payment.** The manual's "cost is paid in monthly instalments
  during the build time" is already the model: each month a project pays its share and converts it to
  work (DESIGN-23 §6 `affordableWork = floor(paymentReceived / costPerWorkMicroUnit)`; `appliedWork` is
  the month's progress). No new "instalment plan" object is introduced — that would duplicate funding.
- **Delayed month.** DESIGN-23 §7 already matches the manual: a `DELAYED` project receives 0 work and 0
  ordinary work charge, so the monthly build cost is not deducted. Keep.
- **Halting.** Add a player `HALTED` status. Zero work / zero ordinary charge per DESIGN-23 §7; the
  carrying cost is **half the mothballed maintenance cost** (manual). The mothballed-maintenance cost
  base is not in the manual → a versioned `balance.yaml` constant, PLACEHOLDER until sourced.
- **Status model.** Extend the engine project-status enum (`packages/campaign/src/state.ts`, today
  `PLANNED|AUTHORIZED|ACTIVE|COMPLETED`) to DESIGN-23 §2 (add `AWAITING_CAPACITY`, `HALTED`, `DELAYED`,
  `ACCELERATED`, `IMPOUNDED`); legal transitions per DESIGN-23 §2
  (`INVALID_DOCKYARD_PROJECT_TRANSITION`). This is a save-format change → follow ADR-0113 (reject on
  mismatch) + migration.
- **Player action.** A halt/resume command (`HaltConstruction` / `ResumeConstruction`) with the domain
  function in `phase-engine`; resume returns the project to `ACTIVE` (or `AWAITING_CAPACITY`).
- **Out of scope:** replacing `constructionFunding.ts` arithmetic with a fixed instalment schedule
  (rejected, Q6); the mothball-cost base number (BALANCE TARGET, map fog).

Hand-off: one implementation slice — project-status extension + halt/resume command + preservation cost
+ tests + migration — feeding the "Player-facing building-ships flow".
