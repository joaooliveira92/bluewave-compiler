# Architecture decision records

One ADR per durable decision: `ADR-NNNN-<slug>.md`. New decisions take the
highest existing number + 1 (ADR-0053 records the current next number).
Refresh this table from each file's H1 when one is added or re-titled.

| # | File | Title |
| --- | --- | --- |
| 0001 | [ADR-0001-monorepo-structure.md](ADR-0001-monorepo-structure.md) | Monorepo Structure and Package Boundaries |
| 0002 | [ADR-0002-integer-arithmetic.md](ADR-0002-integer-arithmetic.md) | Integer Representation and Arithmetic |
| 0003 | [ADR-0003-serializer-hash.md](ADR-0003-serializer-hash.md) | Canonical Serialization and Hashing |
| 0004 | [ADR-0004-compiler-stages.md](ADR-0004-compiler-stages.md) | Compiler Stage Architecture |
| 0005 | [ADR-0005-content-parsing.md](ADR-0005-content-parsing.md) | Content Parsing and Schema Validation |
| 0006 | [ADR-0006-campaign-architecture.md](ADR-0006-campaign-architecture.md) | Campaign Package and Aggregate Architecture |
| 0007 | [ADR-0007-cross-process-determinism.md](ADR-0007-cross-process-determinism.md) | Cross-Process and Cross-Platform Determinism Test Strategy |
| 0008 | [ADR-0008-electron-boundary.md](ADR-0008-electron-boundary.md) | Electron Desktop Boundary |
| 0009 | [ADR-0009-research-phase-identifier.md](ADR-0009-research-phase-identifier.md) | Research Resolution Phase Identifier |
| 0010 | [ADR-0010-b10c-diplomacy-war.md](ADR-0010-b10c-diplomacy-war.md) | B10c Diplomacy & War — Victory Classification, Phase Ordering, and State Model |
| 0011 | [ADR-0011-m1-acceptance-deployment-scope.md](ADR-0011-m1-acceptance-deployment-scope.md) | M1 Acceptance Scope — Deployment (DESIGN-25) Ownership and M1 Completion Sign-off |
|  | [ADR-0012-b1-division-boundary.md](ADR-0012-b1-division-boundary.md) | ADR-0012 (B-1-1): Package Boundary for Permanent Divisions vs. Battle Generation |
|  | [ADR-0013-b1-ship-type-classifier.md](ADR-0013-b1-ship-type-classifier.md) | ADR-0013 (B-1-2): Derived Ship-Type Classification |
|  | [ADR-0014-b1-reachable-mission-subset.md](ADR-0014-b1-reachable-mission-subset.md) | ADR-0014 (B-1-3): Reachable Mission Subset for B-1 Battle Generation |
|  | [ADR-0015-b1-opportunity-predicate.md](ADR-0015-b1-opportunity-predicate.md) | ADR-0015 (B-1-7): Reachable Opportunity Predicate for FLEET/CRUISER Battles |
|  | [ADR-0016-b1-manifest-seed.md](ADR-0016-b1-manifest-seed.md) | ADR-0016 (B-1-5): Manifest Hash / Seed Bootstrapping |
|  | [ADR-0017-b1-autoresolution-scope.md](ADR-0017-b1-autoresolution-scope.md) | ADR-0017 (B-1-6): Auto-Resolution Proof Scope |
|  | [ADR-0018-b2-movement-spotting-scope.md](ADR-0018-b2-movement-spotting-scope.md) | ADR-0018 (B-2): Tactical Movement/Spotting/Contact Scope & Integration Boundary |
|  | [ADR-0019-b2-contact-shape.md](ADR-0019-b2-contact-shape.md) | ADR-0019 (B-2): Authoritative Contact Shape — TacticalContact Unification |
|  | [ADR-0020-b3-gunnery-scope-and-reason-codes.md](ADR-0020-b3-gunnery-scope-and-reason-codes.md) | ADR-0020 (B-3): Gunnery Scope/Integration Boundary + Reason-Code and Constant Policy |
|  | [ADR-0021-b4-armor-damage-scope.md](ADR-0021-b4-armor-damage-scope.md) | ADR-0021 (B-4): Armor & Damage Scope / Integration Boundary + In-Slice Reason-Code & Constant Policy |
|  | [ADR-0022-weather-scope-integration-boundary.md](ADR-0022-weather-scope-integration-boundary.md) | ADR-0022 (B-5): Weather / Visibility Scope & Integration Boundary + In-Slice Reason-Code & Constant Policy |
| 0023 | [ADR-0023-desktop-mvp-construction-lifecycle.md](ADR-0023-desktop-mvp-construction-lifecycle.md) | Desktop MVP — Construction Command Lifecycle Subset + Projected-Cost Formula |
| 0024 | [ADR-0024-desktop-mvp-save-integrity-blind-spot.md](ADR-0024-desktop-mvp-save-integrity-blind-spot.md) | Save Integrity Blind Spot in `canonicalSerialize` (Maps Collapse to `{}`) — recorded + deferred |
|  | [ADR-0025-strategic-weather-snapshot.md](ADR-0025-strategic-weather-snapshot.md) | ADR-0025 (B-6 INC-1): Strategic Weather Snapshot Persistence + Authoritative `weather_generation` Wiring |
|  | [ADR-0026-battle-auto-resolution.md](ADR-0026-battle-auto-resolution.md) | ADR-0026 (B-6 INC-2): Battle Auto-Resolution Orchestrator — `resolveBattleAuto` |
|  | [ADR-0027-battle-resolution-phase-wiring.md](ADR-0027-battle-resolution-phase-wiring.md) | ADR-0027 (B-6 INC-3): Battle-Resolution Phase Wiring + Campaign Consequences |
| 0028 | [ADR-0028-desktop-warscore-rederivation.md](ADR-0028-desktop-warscore-rederivation.md) | Desktop War-Score Delta Re-derivation on the Pre-Battle Snapshot |
| 0029 | [ADR-0029-desktop-debug-mode-screens.md](ADR-0029-desktop-debug-mode-screens.md) | Desktop Debug-Only Screens Gated Behind Build-Time Debug Mode |
| 0030 | [ADR-0030-desktop-mvp-bridge-boundary.md](ADR-0030-desktop-mvp-bridge-boundary.md) | Desktop MVP — `campaign-engine` Package Boundary and `campaign:execute` Electron Boundary |
|  | [ADR-0031-c1-torpedo-scope-reason-codes.md](ADR-0031-c1-torpedo-scope-reason-codes.md) | ADR-0031 (C-1): Torpedo Fire-Resolution Slice — Scope/Integration Boundary, Reason Codes, and Detonation-Fuze Authority |
| 0032 | [ADR-0032-persistence-integrity-contract.md](ADR-0032-persistence-integrity-contract.md) | Persistence Save-Integrity, Hash Contract, and Atomicity |
|  | [ADR-0033-c2-mine-warfare-scope-reason-codes.md](ADR-0033-c2-mine-warfare-scope-reason-codes.md) | ADR-0033 (C-2): Mine-Pressure Lifecycle — Scope/Integration Boundary, Strike Deferral, and Reason-Code/Constant Policy |
| 0034 | [ADR-0034-engine-state-hash-chain-tactical-checkpoints.md](ADR-0034-engine-state-hash-chain-tactical-checkpoints.md) | Engine-State Hardening — Snapshot Hash-Chain and Tactical Checkpoint Decisions |
| 0035 | [ADR-0035-engine-event-timestamp-contract.md](ADR-0035-engine-event-timestamp-contract.md) | Engine Event Timestamps — Deterministic ISO-8601 Contract |
| 0036 | [ADR-0036-contract-phase-registry.md](ADR-0036-contract-phase-registry.md) | Contract the PhaseRegistry into the Real Execution Path |
| 0037 | [ADR-0037-design-unit-normalization.md](ADR-0037-design-unit-normalization.md) | Normalize Authored Design Units at Compile |
|  | [ADR-0038-ui-state-sidecar.md](ADR-0038-ui-state-sidecar.md) | ADR-0038 (game-onboarding-first-month INC-3): Renderer-Owned `ui-state.json` Sidecar — Non-Authoritative UI-State Persistence |
| 0039 | [ADR-0039-c4-coastal-defense-scope-integration.md](ADR-0039-c4-coastal-defense-scope-integration.md) | C-4 Coastal Defense — Scope, Integration Boundary & Constant Policy |
| 0040 | [ADR-0040-smoke-damage-control-scope-and-integration.md](ADR-0040-smoke-damage-control-scope-and-integration.md) | Smoke Module + Damage-Control Extension — Scope, Integration, and Policy |
| 0041 | [ADR-0041-d2-carrier-operations-scope-integration-boundary.md](ADR-0041-d2-carrier-operations-scope-integration-boundary.md) | D-2 Carrier Operations — Scope/Integration Boundary + Contracts Policy + Phase Wiring |
| 0042 | [ADR-0042-d4-air-defense-layer-resolution-eligibility.md](ADR-0042-d4-air-defense-layer-resolution-eligibility.md) | D-4 Air Defense — Layer Resolution & Eligibility + Engagement Decisions (INC-2/INC-3/INC-4/INC-5) |
| 0044 | [ADR-0044-d4-parallel-implementation-merge-resolution.md](ADR-0044-d4-parallel-implementation-merge-resolution.md) | D-4 Air Defense — Merge Resolution: adopt the 2026-09-22 `origin/dev` implementation |
| 0045 | [ADR-0045-playability-first-reprioritization.md](ADR-0045-playability-first-reprioritization.md) | Playability-First Re-prioritization of the Sprint Backlog |
| 0046 | [ADR-0046-p1-campaign-battle-fidelity-fixes.md](ADR-0046-p1-campaign-battle-fidelity-fixes.md) | P-1 — Torpedoes in Campaign Auto-Resolution + Battle-Fidelity Fixes |
| 0047 | [ADR-0047-p1-damage-control-scope-and-units.md](ADR-0047-p1-damage-control-scope-and-units.md) | P-1 — Damage-Control Scope in Auto-Resolution, Unit Contract, and Recorded Deferrals |
| 0048 | [ADR-0048-p1-gunnery-fidelity-range-and-gun-count.md](ADR-0048-p1-gunnery-fidelity-range-and-gun-count.md) | P-1 — Auto-Resolution Gunnery Fidelity (True Range + Gun-Count Sensitivity) |
| 0049 | [ADR-0049-p1-damage-control-in-every-battle.md](ADR-0049-p1-damage-control-in-every-battle.md) | P-1 — Damage Control Runs in Every Auto-Resolved Battle |
| 0050 | [ADR-0050-p1-persist-shell-fire-flooding.md](ADR-0050-p1-persist-shell-fire-flooding.md) | P-1 — Persist Shell-Created Fire and Flooding Sources |
| 0051 | [ADR-0051-p1-spawn-heading-convention.md](ADR-0051-p1-spawn-heading-convention.md) | P-1 — Spawn Heading Follows `directionBp` |
| 0052 | [ADR-0052-p1-cause-of-loss.md](ADR-0052-p1-cause-of-loss.md) | P-1 — Per-Ship Cause of Loss in Battle Results |
| 0053 | [ADR-0053-p1-lethality-tuning.md](ADR-0053-p1-lethality-tuning.md) | P-1 — Auto-Resolution Lethality Tuning |
| 0054 | [ADR-0054-diplomacy-command-visibility.md](ADR-0054-diplomacy-command-visibility.md) | Diplomacy Command Queue Stays Visible; War Declaration Reads as Irreversible |
| 0056 | [ADR-0056-battle-generation-strength-floors.md](ADR-0056-battle-generation-strength-floors.md) | Battle-Generation Strength Floors — Per-Side Fix Now, Unit Deferred |
| 0057 | [ADR-0057-desktop-battle-sandbox-scenario.md](ADR-0057-desktop-battle-sandbox-scenario.md) | Desktop Tactical Sandbox Runs on an Ephemeral Scenario Copy |
| 0069 | [ADR-0069-1880-nation-borders.md](ADR-0069-1880-nation-borders.md) | 1880 borders for the playable nations (presentation layer) |
| 0070 | [ADR-0070-revise-project-command.md](ADR-0070-revise-project-command.md) | ReviseProject command and retained source drafts |
| 0071 | [ADR-0071-command-screen-state-convention.md](ADR-0071-command-screen-state-convention.md) | One command-screen lifecycle convention |
| 0073 | [ADR-0073-p1-withdrawal-disengagement.md](ADR-0073-p1-withdrawal-disengagement.md) | P-1 withdrawal / disengagement predicate (ticket 12) |
