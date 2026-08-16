# Ticket 08 — Adoption Sequencing & Definition of Done

**Type:** grilling
**Status:** resolved
**Blocked by:** 05-engine-core-effect-policy, 06-beachhead-selection, 09-version-line-choice

## Question

What is the concrete package-by-package adoption order (bottom-up dependency
graph: `contracts`/`random`/`deterministic` → `events` → `campaign` →
`phase-engine` → `combat` → `commands` → `content-compiler` → `apps`)? What does
"adopted" mean per package (definition of done: which idioms, which lint/format
rules, which tests)? What verification replaces the **demoted determinism
gate** (ticket 05): hash changes recorded via ADR rather than blocked, full test
suite still green, whatever survives of replay-based integrity checking as
informational? And what is the final handoff shape — spec + implementation
sprint tickets + ADRs, including the dedicated ADR recording the DESIGN-08
demotion — when the map resolves?

Work with the human via `/grilling` + `/domain-modeling`, zooming tickets 05 and
06's answers.

## Answer

The adoption plan (human decisions 2026-08-16: service-first with stable
facades; strict idiom DoD + lint gate; harness kept with drift recorded).

**Ordering — service-first, facades stable until unification:**

- **Phase 0 — Foundations:** pin `effect` (reference `4.0.0-rc.109`; start the
  track at stable 4.0.0 per ticket 09, or earlier on the exact pinned rc if it
  must move — the beachhead is low-risk); wire the `effect-best-practices` lint
  gate into `vp lint`/format; keep `skipLibCheck: true`; no `effect` in the
  sandboxed preload.
- **Phase 1 — Beachhead:** `@bluewave/persistence` (ticket 06 bar).
- **Phase 2 — Boundary services:** `content-schema` validation (Effect Schema;
  `zod` removed from the root when it finishes, per ticket 07), desktop IPC
  (`apps/desktop/src/main` command/save schemas + Effect runtime
  orchestration), `diagnostics` (typed errors).
- **Phase 3 — Foundation bottom-up:** `contracts` → `deterministic` → `random`
  → `events` (Data/Schema/typed errors; Effect types begin to propagate;
  whether `random`'s hand-rolled PRNG is replaced by Effect `Random` is decided
  in this phase's ticket).
- **Phase 4 — Core bottom-up:** `campaign` → `commands` → `content-compiler` →
  `phase-engine` → `combat` → `campaign-engine` → `ai`.
- **Phase 5 — Unification:** one long-lived `ManagedRuntime`; entrypoints last
  (desktop main, compiler-cli) behind `runPromise` facades; cross-package
  facades finally flip to Effect-typed interfaces in one coherent step.

**Facade rule:** through Phases 1–4 each package's public surface stays
plain-TS-compatible (matching the beachhead bar: public `SaveStore` API stays
compatible); the unification step (Phase 5) flips boundaries to Effect types.

**Definition of done — strict idiom + lint gate, per package:**

- Tagged errors replace throw / undefined / `Result` patterns at the package
  boundary.
- Schema at validation boundaries.
- Effect runtime for async/orchestration where present.
- The `effect-best-practices` lint gate is wired into the repo's `vp
  lint`/format gates.
- Tests green; no feature regression.
- Any change to the package's hash-surface output is recorded as an ADR note.

**Verification post-demotion (ticket 05):**

- The cross-process harness keeps running (two-child equality) — determinism
  diffs still surface.
- Golden-equality: drift is **recorded via ADR note, never a failing blocker**
  ("record, not block").
- Replay-integrity checks stay informational.
- Hash regeneration is permitted and recorded.

**Handoff shape:**

- A spec via the repo's spec-creator / `to-spec` machinery
  (`.scratch/<slug>/spec.md`), sliced by `to-tickets` into frontier-ordered
  vertical implementation tickets, Phases 1–5 in dependency order.
- ADR set at handoff: (1) Effect v4 adoption decision (line, seam, beachhead,
  schema-vs-zod, sequencing); (2) **DESIGN-08 determinism verification spine
  demoted to deprecated machinery** (the conflict recorded in ticket 05);
  (3) per-package ADR notes where hash-surface output changed.

**Route is clear** — this resolves the map's last ticket. What remains is
implementation, a separate track (this map is plan-only).