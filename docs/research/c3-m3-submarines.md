# C-3 Research Note — M3 Submarines (Strategic Submarine-Operations Lifecycle)

**Sprint:** C-3 (`.ai/SPRINT-PLAN.md` Track C row 3)
**Governing doc:** DESIGN-34 (`docs/rules/submarines.md`)
**Date:** 2026-08-17
**Status:** Scoping research note. **No primary-source grounding pass was
required** — see §3.

## 1. Summary

C-3 is the M3 submarine vertical slice. Following the C-2 (mines, ADR-0033)
precedent, the governing design document **DESIGN-34 already ships every
mechanical constant as a `MUST`-level exact integer** — policy weights (§5),
reliability multipliers (§7), remote-efficiency table (§9), long-range ASW
vulnerability (§10), screening balance (§18), sea-state scale + detection /
observation / attack / surface-snorkel multipliers (§13–17), and the friendly-fire
base misidentification probability (§23). There is **no open catalog** to ground
(the analogue of DESIGN-40's `torpedo_models_v1`, which genuinely required
research). Therefore **no `/research` background agent was invoked**; this note
records that finding and provides light historical framing as **non-normative
context only**.

## 2. Why no primary-source grounding is required

| DESIGN-34 slice | Constant source | Research needed? |
|-----------------|-----------------|------------------|
| Policies §5 (weights sum to 10_000) | exact integers in doc | No |
| Reliability §7 (0..100, multiplier table) | exact integers | No |
| Remote-efficiency §9 | exact table | No |
| Long-range ASW vulnerability §10 | exact 10_000..12_500 bp | No |
| Screening balance §18 (ratio bands + multipliers) | exact integers | No |
| Sea-state §13–17 (scale + 4 multiplier tables) | exact integers | No |
| Friendly-fire §23 (500 bp base) | exact integer | No |
| Attack-opportunity stream §19 | keyed stream name given | No |

These are shipped, deterministic, engine-versioned constants wired directly from
the design doc, exactly as C-2 wired DESIGN-35's §30 codes and constant tables
(ADR-0033 ticket 06). No invented or tuned authoritative value is introduced.

## 3. Non-normative historical framing (context, NOT authoritative)

The five canonical submarine types map to real naval history, provided for
readability and future content work only — **they are not the source of any
shipped constant**:

- **Coastal** (`COASTAL`): short-legged, harbor/local-defense submarines (e.g.
  1880s–1900s French and Russian coastal boats). Motivated DESIGN-34 §12's strict
  local-only range rule and §9's `0` remote multiplier.
- **Medium range** (`MEDIUM_RANGE`): typical WWI-era coastal-patrol submarines
  with a few hundred-nautical-mile operational radius.
- **Long range** (`LONG_RANGE`): ocean-going patrol and commerce-raiding boats
  (e.g. U-boats of 1916+). Motivated §9's elevated remote multipliers and §10's
  higher ASW vulnerability at range.
- **Minelaying** (`MINELAYING`): submarines fitted to lay minefields (e.g.
  UC-class minelaying U-boats). Feeds §20 submarine-laid mine laying → C-2
  `AreaMinePressureRecord`.
- **Missile** (`MISSILE`): strategic/guided-missile submarines; designated
  `PERSISTENT_UNIT` (§1). Payload mechanics are E-track (M5) — this slice ships
  the type data only.

## 4. Key scope boundary (non-normative reasoning, authoritative in ticket 03)

DESIGN-34's **resolution** sections (§2–3 tactical allocation/loss, §21
returning-ship, §22 ASW, §23–24 friendly-fire, §19 loss application) each depend
on a **not-yet-built** battle/attack machinery or the **unassigned** DESIGN-29
intelligence layer. Shipping them now would invent a missing mechanic's shape as a
side effect (prohibited scope creep). The **value / predicate / record layer**
(representation, types, policies, missions, reliability, proximity, efficiency,
vulnerability, effectiveness, sea state, screening, opportunity-selection,
mine-laying) has no missing dependency and ships this sprint.

## 5. Source

- DESIGN-34 (`docs/rules/submarines.md`) — the sole authoritative source for all
  shipped constants.
- C-2 precedent: `docs/research/c2-m3-mine-warfare.md` (same "exact integers, no
  research" finding), ADR-0033.
- C-1 precedent: DESIGN-40 required real grounding (`torpedo_models_v1`, ADR-0031)
  — the contrasting case where research WAS required.
