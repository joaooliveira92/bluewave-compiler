# Bluewave Engine — Implementation Progress

> Single source of truth for LLM context. Updated as milestones advance.
> Canonical spec: [`README.md`](../README.md). Delivery scope: [`docs/delivery/release-scope-and-implementation-order.md`](delivery/release-scope-and-implementation-order.md).

## Overall Status

| Milestone                    | B#     | Design                                  | Implementation     | Tests              | Notes            |
| ---------------------------- | ------ | --------------------------------------- | ------------------ | ------------------ | ---------------- |
| M1 Strategic Campaign Kernel | B0–B8  | Complete (57 docs)                      | Core pipeline done | ~154 tests passing | See below        |
| M1 Strategic Campaign Kernel | B9–B10 | Scope briefs ready                      | B9/B10a/B10b done; B10c/B10d pending | —                  | B10b ACCEPTED (A-0/A-0b) |
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

> **Status (2026-08-11): PASS_WITH_LIMITATIONS.** Acceptance evidence recorded
> (`.ai/reports/a1-b9-acceptance.md`). Build, packaging (mac dmg/zip + linux
> AppImage), unit + boundary tests all green. CSP and IPC narrowing tested.
> Limitations: live Electron GUI start and full renderer→main IPC round-trip
> are not automated headlessly; Windows nsis not built on macOS.

| Capability              | Readiness         | Key decisions                                 |
| ----------------------- | ----------------- | --------------------------------------------- |
| Electron packaging      | PASS_WITH_LIMITATIONS | dmg+zip/nsis/AppImage config; mac+linux built, win configured |
| Desktop content display | CLI-only for B9   | read-only renderer deferred                   |
| CSP / IPC boundary      | PASS              | `default-src 'self'`; single `compile` channel |
| Acceptance              | PASS_WITH_LIMITATIONS | `.ai/reports/a1-b9-acceptance.md`           |

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

> **Status (2026-08-11): ACCEPTED.** The A-0 acceptance pass (`.ai/reports/a0-b10b-acceptance.md`)
> originally returned BLOCKED because several brief criteria were unimplemented;
> the A-0b completion sprint closed every gap. `SetResearchPriorityCommand`
> validation, prerequisite-cycle detection, `DesignTemplateSchema` + design
> YAML, discovery revalidation, and the historical timing modifier are now
> implemented with proof tests for all 17 criteria. 32 turbo tasks green;
> golden determinism hashes unchanged.

| Capability                            | Readiness         | Key decisions                                                    |
| ------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| Research (15-field, 8-stage pipeline) | ACCEPTED          | `resolveResearchPhase` + priority command; ADR-0009 phase-id      |
| Ship design (YAML templates)          | ACCEPTED          | `DesignTemplateSchema` + deterministic compiledHash               |
| Integration with construction         | ACCEPTED          | completion builds Ship from design attrs when `designVersionId` set |
| Fixture                               | ACCEPTED          | 3-nation research + design templates proof tests                 |
| Acceptance                            | PASS              | `.ai/reports/a0-b10b-acceptance.md`                               |

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
