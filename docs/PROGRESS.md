# Bluewave Engine — Implementation Progress

> Single source of truth for LLM context. Updated as milestones advance.
> Canonical spec: [`README.md`](../README.md). Delivery scope: [`docs/delivery/release-scope-and-implementation-order.md`](delivery/release-scope-and-implementation-order.md).

## Overall Status

| Milestone                    | B#     | Design                                  | Implementation     | Tests              | Notes            |
| ---------------------------- | ------ | --------------------------------------- | ------------------ | ------------------ | ---------------- |
| M1 Strategic Campaign Kernel | B0–B8  | Complete (57 docs)                      | Core pipeline done | ~154 tests passing | See below        |
| M1 Strategic Campaign Kernel | B9–B10 | Scope briefs ready                      | Not yet started    | —                  | 4 sub-milestones |
| M2 Surface Tactical Core     | —      | Design docs exist (DESIGN-38–42)        | Not started        | —                  | Future           |
| M3 Advanced Surface Warfare  | —      | Design docs exist (DESIGN-34–36, 39–42) | Not started        | —                  | Future           |
| M4 Aviation                  | —      | Design docs exist (DESIGN-43–45)        | Not started        | —                  | Future           |
| M5 Electronics & Missile Era | —      | Design docs exist (DESIGN-46–48)        | Not started        | —                  | Future           |

## ✅ Completed (B0–B8)

Each entry uses a _capability readiness state_: CONTENT_ONLY / IMPLEMENTED_UNVERIFIED / VERIFIED_NOT_INTEGRATED / INTEGRATED_NOT_ACCEPTED / ACCEPTED.

| Package                        | State                   | What it does                                                                                                        |
| ------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@bluewave/contracts`          | ACCEPTED                | SafeInt branded integers, checked arithmetic                                                                        |
| `@bluewave/deterministic`      | ACCEPTED                | Canonical serialization + SHA-256 enveloping                                                                        |
| `@bluewave/diagnostics`        | ACCEPTED                | Structured diagnostic collector (error/warning/info)                                                                |
| `@bluewave/content-schema`     | ACCEPTED                | YAML schema definitions, Zod validation, YAML parser                                                                |
| `@bluewave/content-compiler`   | ACCEPTED                | 4-stage pipeline: parse → validate → normalize → compile                                                            |
| `@bluewave/campaign`           | ACCEPTED                | Campaign compiler + state aggregates (world, nations, fleets, research, construction, war, diplomacy, intelligence) |
| `@bluewave/random`             | ACCEPTED                | SHA-256 domain-separated PRNG with audit ledger                                                                     |
| `@bluewave/commands`           | ACCEPTED                | 7-step command lifecycle, idempotency, ledger                                                                       |
| `@bluewave/events`             | ACCEPTED                | Domain event envelopes, 5 event types, explanation trees                                                            |
| `@bluewave/phase-engine`       | ACCEPTED                | 8-phase turn pipeline, month executor, replay verifier, financial ledger                                            |
| `@bluewave/persistence`        | ACCEPTED                | Content-addressed atomic save/load, recovery                                                                        |
| `@bluewave/combat`             | ACCEPTED                | Deterministic auto-resolution with explanation                                                                      |
| `@bluewave/cross-process-test` | ACCEPTED                | Cross-process determinism proof harness                                                                             |
| `@bluewave/test-support`       | ACCEPTED                | Shared test utilities                                                                                               |
| `compiler-cli`                 | INTEGRATED_NOT_ACCEPTED | CLI (bwc): validate, compile, inspect, verify, compare, campaign:_, turn:_, replay                                  |
| `desktop`                      | VERIFIED_NOT_INTEGRATED | Electron shell with CSP, compile IPC, CLI-only renderer                                                             |

### Phase Registry (8 ordered phases)

1. **opening_validation** — validate treasury non-negative, construction caps, ship battle assignment
2. **command_collection** — player command processing
3. **appropriation** — proportional construction funding
4. **obligation** — mandatory fixed expenses
5. **construction_processing** — progress cap enforcement
6. **research_progress** — RNG-driven research point allocation
7. **battle_resolution** — auto-resolve pending battles
8. **closing_validation** — final state validation + hash

### What's solid

- Deterministic by design: canonical serialization + SHA-256 end-to-end
- Replay verifier compares ledgers across runs
- Cross-process determinism proven
- All strategic turn phases execute and produce auditable state transitions

## 🔜 In Progress / Planned (B9–B10)

### B9 — Electron Desktop Shell

| Capability              | Readiness         | Key decisions                                 |
| ----------------------- | ----------------- | --------------------------------------------- |
| Electron packaging      | Scope brief ready | electron-builder, dmg+zip/nsis/AppImage       |
| Desktop content display | Scope brief ready | CLI-only for B9 (read-only renderer deferred) |
| Acceptance              | —                 | Brief at `.ai/briefs/b9-desktop-shell.md`     |

### B10a — Economy & Construction

| Capability                    | Readiness         | Key decisions                                      |
| ----------------------------- | ----------------- | -------------------------------------------------- |
| Treasury + income             | Scope brief ready | Ledger-based                                       |
| Maintenance costs             | Scope brief ready |                                                    |
| Appropriation & obligation    | Scope brief ready |                                                    |
| Ship construction (paid-work) | Scope brief ready | Completion promotes to FleetState                  |
| Fixture                       | Scope brief ready | 3 nations (GBR, FRA, GER)                          |
| Acceptance                    | —                 | Brief at `.ai/briefs/b10a-economy-construction.md` |

### B10b — Research & Ship Design

> **Status (2026-08-11): scoped/partially implemented, NOT accepted.** The A-0
> acceptance pass re-verified the brief's 17 acceptance criteria against the code
> and found them largely unsatisfied (see `.ai/reports/a0-b10b-acceptance.md`):
> `SetResearchPriorityCommand` has no lifecycle handler, cycle detection and the
> `DesignTemplateSchema` are missing, design YAML fixtures are absent, and most
> criteria lack proving tests. `resolveResearchPhase` is wired into the month
> pipeline with conversion, allocation, eligibility, keyed selection, and
> `RESEARCH_EXPENDITURE` posting, but this is unproven under the brief.

| Capability                            | Readiness         | Key decisions                                                    |
| ------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| Research (15-field, 8-stage pipeline) | Partial impl, no proof | `resolveResearchPhase` ported; command surface (priorities) missing |
| Ship design (YAML templates)          | Partial impl, no proof | `CompiledDesignVersion` + compiler path exist; no schema/fixtures |
| Integration with construction         | Partial impl, no proof | completion uses design attrs only when `designVersionId` present |
| Fixture                               | Missing           | No 3-nation research fixture, no GER research, `designFiles: []` |
| Acceptance                            | BLOCKED           | `.ai/reports/a0-b10b-acceptance.md`; re-run after A-0b completion |

### B10c — Diplomacy & War

| Capability                           | Readiness           | Key decisions                               |
| ------------------------------------ | ------------------- | ------------------------------------------- |
| Declare war, peace treaties          | Scope brief ready   | War lifecycle with side model               |
| Alliances, NAPs, trade agreements    | Scope brief ready   | Single-scalar tension                       |
| War score from battles               | Scope brief ready   | Surrender at score >= 80                    |
| Basic blockade (+2/mo)               | Scope brief ready   |                                             |
| Mutual-defense alliance auto-entry   | Scope brief ready   |                                             |
| New `RESOLVE_DIPLOMACY` phase        | Scope brief ready   |                                             |
| All treaties (DESIGN-30) deferred    | Scope decision made | Out of scope for B10c                       |
| No settlement terms / separate peace | Scope decision made | Out of scope for B10c                       |
| Acceptance                           | —                   | Brief at `.ai/briefs/b10c-diplomacy-war.md` |

### B10d — AI & Scenario Readiness

| Capability                      | Readiness         | Key decisions                                                  |
| ------------------------------- | ----------------- | -------------------------------------------------------------- |
| AI legal-only commands          | Scope brief ready | Uniform random selection                                       |
| `AI_PLANNING` phase             | Scope brief ready |                                                                |
| Deterministic idempotency + RNG | Scope brief ready |                                                                |
| 6-gate acceptance               | Scope brief ready | compile → 1st turn → battle → save/load → replay → 24-mo smoke |
| New `@bluewave/ai` package      | Scope brief ready |                                                                |
| 2+ AI participants              | Scope brief ready |                                                                |
| Acceptance                      | —                 | Brief at `.ai/briefs/b10d-ai-scenario.md`                      |

## 🔮 Not Yet Started (M2–M5)

| Area                                 | Design coverage      |
| ------------------------------------ | -------------------- |
| Tactical movement, spotting, contact | DESIGN-37, DESIGN-38 |
| Tactical gunnery + armor/damage      | DESIGN-39            |
| Torpedoes                            | DESIGN-40            |
| Damage, fire, flooding               | DESIGN-41            |
| Tactical weather, visibility, smoke  | DESIGN-42            |
| Aircraft, squadrons, airbases        | DESIGN-43            |
| Carrier operations (CAP, strikes)    | DESIGN-44            |
| Anti-aircraft defense                | DESIGN-45            |
| Radar, electronics, EW               | DESIGN-46            |
| Missiles                             | DESIGN-47            |
| Coastal defense                      | DESIGN-48            |
| Submarines                           | DESIGN-34            |
| Mine warfare                         | DESIGN-35            |
| Amphibious operations                | DESIGN-36            |

## 🎯 Open Design Decisions

See [`docs/OPEN-ISSUES.md`](OPEN-ISSUES.md) — 126 open ambiguity candidates from the source migration. Implementations **MUST NOT** silently resolve an open decision.

## 📐 Implementation Approach

- **Technology**: TypeScript (Node >=24), pnpm workspaces, Turborepo, Vitest
- **Paradigm**: Immutable state transitions, pure functions, deterministic by construction
- **Testing**: Unit tests per package + integration tests + cross-process determinism proof
- **Packaging**: electron-builder (dmg+zip / nsis / AppImage)
- **Traceability**: Each capability maps to DESIGN-* documents in `docs/`
