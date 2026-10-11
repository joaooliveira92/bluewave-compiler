# Architecture decision records

One ADR per durable decision: `ADR-NNNN-<slug>.md`. New decisions take the
highest existing number + 1 (the next number is ADR-0100).
Refresh this table from each file's H1 when one is added or re-titled.
(ADR-0043 was never written; the sequence intentionally continues at 0044.)
See [DESIGN amendments](AMENDMENTS.md) for which ADRs amend which DESIGN doc.

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
| 0012 | [ADR-0012-b1-division-boundary.md](ADR-0012-b1-division-boundary.md) | ADR-0012 (B-1-1): Package Boundary for Permanent Divisions vs. Battle Generation |
| 0013 | [ADR-0013-b1-ship-type-classifier.md](ADR-0013-b1-ship-type-classifier.md) | ADR-0013 (B-1-2): Derived Ship-Type Classification |
| 0014 | [ADR-0014-b1-reachable-mission-subset.md](ADR-0014-b1-reachable-mission-subset.md) | ADR-0014 (B-1-3): Reachable Mission Subset for B-1 Battle Generation |
| 0015 | [ADR-0015-b1-opportunity-predicate.md](ADR-0015-b1-opportunity-predicate.md) | ADR-0015 (B-1-7): Reachable Opportunity Predicate for FLEET/CRUISER Battles |
| 0016 | [ADR-0016-b1-manifest-seed.md](ADR-0016-b1-manifest-seed.md) | ADR-0016 (B-1-5): Manifest Hash / Seed Bootstrapping |
| 0017 | [ADR-0017-b1-autoresolution-scope.md](ADR-0017-b1-autoresolution-scope.md) | ADR-0017 (B-1-6): Auto-Resolution Proof Scope |
| 0018 | [ADR-0018-b2-movement-spotting-scope.md](ADR-0018-b2-movement-spotting-scope.md) | ADR-0018 (B-2): Tactical Movement/Spotting/Contact Scope & Integration Boundary |
| 0019 | [ADR-0019-b2-contact-shape.md](ADR-0019-b2-contact-shape.md) | ADR-0019 (B-2): Authoritative Contact Shape — TacticalContact Unification |
| 0020 | [ADR-0020-b3-gunnery-scope-and-reason-codes.md](ADR-0020-b3-gunnery-scope-and-reason-codes.md) | ADR-0020 (B-3): Gunnery Scope/Integration Boundary + Reason-Code and Constant Policy |
| 0021 | [ADR-0021-b4-armor-damage-scope.md](ADR-0021-b4-armor-damage-scope.md) | ADR-0021 (B-4): Armor & Damage Scope / Integration Boundary + In-Slice Reason-Code & Constant Policy |
| 0022 | [ADR-0022-weather-scope-integration-boundary.md](ADR-0022-weather-scope-integration-boundary.md) | ADR-0022 (B-5): Weather / Visibility Scope & Integration Boundary + In-Slice Reason-Code & Constant Policy |
| 0023 | [ADR-0023-desktop-mvp-construction-lifecycle.md](ADR-0023-desktop-mvp-construction-lifecycle.md) | Desktop MVP — Construction Command Lifecycle Subset + Projected-Cost Formula |
| 0024 | [ADR-0024-desktop-mvp-save-integrity-blind-spot.md](ADR-0024-desktop-mvp-save-integrity-blind-spot.md) | Save Integrity Blind Spot in `canonicalSerialize` (Maps Collapse to `{}`) — recorded + deferred |
| 0025 | [ADR-0025-strategic-weather-snapshot.md](ADR-0025-strategic-weather-snapshot.md) | ADR-0025 (B-6 INC-1): Strategic Weather Snapshot Persistence + Authoritative `weather_generation` Wiring |
| 0026 | [ADR-0026-battle-auto-resolution.md](ADR-0026-battle-auto-resolution.md) | ADR-0026 (B-6 INC-2): Battle Auto-Resolution Orchestrator — `resolveBattleAuto` |
| 0027 | [ADR-0027-battle-resolution-phase-wiring.md](ADR-0027-battle-resolution-phase-wiring.md) | ADR-0027 (B-6 INC-3): Battle-Resolution Phase Wiring + Campaign Consequences |
| 0028 | [ADR-0028-desktop-warscore-rederivation.md](ADR-0028-desktop-warscore-rederivation.md) | Desktop War-Score Delta Re-derivation on the Pre-Battle Snapshot |
| 0029 | [ADR-0029-desktop-debug-mode-screens.md](ADR-0029-desktop-debug-mode-screens.md) | Desktop Debug-Only Screens Gated Behind Build-Time Debug Mode |
| 0030 | [ADR-0030-desktop-mvp-bridge-boundary.md](ADR-0030-desktop-mvp-bridge-boundary.md) | Desktop MVP — `campaign-engine` Package Boundary and `campaign:execute` Electron Boundary |
| 0031 | [ADR-0031-c1-torpedo-scope-reason-codes.md](ADR-0031-c1-torpedo-scope-reason-codes.md) | ADR-0031 (C-1): Torpedo Fire-Resolution Slice — Scope/Integration Boundary, Reason Codes, and Detonation-Fuze Authority |
| 0032 | [ADR-0032-persistence-integrity-contract.md](ADR-0032-persistence-integrity-contract.md) | Persistence Save-Integrity, Hash Contract, and Atomicity |
| 0033 | [ADR-0033-c2-mine-warfare-scope-reason-codes.md](ADR-0033-c2-mine-warfare-scope-reason-codes.md) | ADR-0033 (C-2): Mine-Pressure Lifecycle — Scope/Integration Boundary, Strike Deferral, and Reason-Code/Constant Policy |
| 0034 | [ADR-0034-engine-state-hash-chain-tactical-checkpoints.md](ADR-0034-engine-state-hash-chain-tactical-checkpoints.md) | Engine-State Hardening — Snapshot Hash-Chain and Tactical Checkpoint Decisions |
| 0035 | [ADR-0035-engine-event-timestamp-contract.md](ADR-0035-engine-event-timestamp-contract.md) | Engine Event Timestamps — Deterministic ISO-8601 Contract |
| 0036 | [ADR-0036-contract-phase-registry.md](ADR-0036-contract-phase-registry.md) | Contract the PhaseRegistry into the Real Execution Path |
| 0037 | [ADR-0037-design-unit-normalization.md](ADR-0037-design-unit-normalization.md) | Normalize Authored Design Units at Compile |
| 0038 | [ADR-0038-ui-state-sidecar.md](ADR-0038-ui-state-sidecar.md) | ADR-0038 (game-onboarding-first-month INC-3): Renderer-Owned `ui-state.json` Sidecar — Non-Authoritative UI-State Persistence |
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
| 0052 | [ADR-0052-p1-cause-of-loss.md](ADR-0052-p1-cause-of-loss.md) | P-1 — Observational Per-Ship Cause of Loss |
| 0053 | [ADR-0053-p1-lethality-tuning.md](ADR-0053-p1-lethality-tuning.md) | P-1 — Auto-Resolution Lethality Tuning |
| 0054 | [ADR-0054-diplomacy-command-visibility.md](ADR-0054-diplomacy-command-visibility.md) | Diplomacy Command Queue Stays Visible; War Declaration Reads as Irreversible |
| 0055 | [ADR-0055-map-renderer-canvas-lod.md](ADR-0055-map-renderer-canvas-lod.md) | Map renderer — Canvas 2D with pre-simplified LOD tiers |
| 0056 | [ADR-0056-battle-generation-strength-floors.md](ADR-0056-battle-generation-strength-floors.md) | Battle-Generation Strength Floors — Per-Side Fix Now, Unit Deferred |
| 0057 | [ADR-0057-desktop-battle-sandbox-scenario.md](ADR-0057-desktop-battle-sandbox-scenario.md) | Desktop Tactical Sandbox Runs on an Ephemeral Scenario Copy |
| 0058 | [ADR-0058-release-ui-hides-engine-detail.md](ADR-0058-release-ui-hides-engine-detail.md) | Release UI hides engine detail; debug builds show it |
| 0059 | [ADR-0059-rtw3-parity-ux-decisions.md](ADR-0059-rtw3-parity-ux-decisions.md) | RTW3 parity / UX modernization — decisions |
| 0060 | [ADR-0060-budget-allocation-command.md](ADR-0060-budget-allocation-command.md) | Player budget allocation (`SetBudgetAllocation`) |
| 0061 | [ADR-0061-loss-ledger.md](ADR-0061-loss-ledger.md) | Persisted ship-loss records (the "ships sunk" ledger) |
| 0062 | [ADR-0062-fleet-movement-orders.md](ADR-0062-fleet-movement-orders.md) | Fleet movement orders (`MoveFleet`) and a connected 1880 map |
| 0063 | [ADR-0063-component-level-ship-compiler.md](ADR-0063-component-level-ship-compiler.md) | Component-Level Ship Compiler Beneath DESIGN-21 |
| 0064 | [ADR-0064-new-construction-work-packages.md](ADR-0064-new-construction-work-packages.md) | New-Construction Work Packages Extend DESIGN-23 §18 |
| 0065 | [ADR-0065-officer-corps.md](ADR-0065-officer-corps.md) | Officer Corps and Division Commanders |
| 0066 | [ADR-0066-submit-design-command.md](ADR-0066-submit-design-command.md) | SubmitDesign command and engine-side design compile |
| 0067 | [ADR-0067-ship-rules-vs-rtw3-manual.md](ADR-0067-ship-rules-vs-rtw3-manual.md) | Ship classification and refit rules versus the RTW3 manual |
| 0068 | [ADR-0068-command-screen-decisions.md](ADR-0068-command-screen-decisions.md) | Campaign command screen — decisions |
| 0069 | [ADR-0069-1880-nation-borders.md](ADR-0069-1880-nation-borders.md) | 1880 borders for the playable nations (presentation layer) |
| 0070 | [ADR-0070-revise-project-command.md](ADR-0070-revise-project-command.md) | ReviseProject command and retained source drafts |
| 0071 | [ADR-0071-command-screen-state-convention.md](ADR-0071-command-screen-state-convention.md) | One command-screen lifecycle convention |
| 0072 | [ADR-0072-p1-speed-as-range-control.md](ADR-0072-p1-speed-as-range-control.md) | P-1 — Speed Advantage as Range Control (Ticket 11) |
| 0073 | [ADR-0073-p1-withdrawal-disengagement.md](ADR-0073-p1-withdrawal-disengagement.md) | P-1 — Withdrawal / Disengagement So Battles Can End Without Elimination (Ticket 12) |
| 0074 | [ADR-0074-designed-ship-treasury-cost.md](ADR-0074-designed-ship-treasury-cost.md) | Designed ships are priced by the cost model, in treasury units |
| 0075 | [ADR-0075-read-only-screen-query-convention.md](ADR-0075-read-only-screen-query-convention.md) | Read-only screen reads go through one query hook |
| 0076 | [ADR-0076-sb2-ship-building-parity.md](ADR-0076-sb2-ship-building-parity.md) | SB-2 ship-building parity with the reference design screen |
| 0077 | [ADR-0077-construction-progress-per-package.md](ADR-0077-construction-progress-per-package.md) | Construction progress per work package (model, migration, slicing) |
| 0078 | [ADR-0078-rebuild-projects.md](ADR-0078-rebuild-projects.md) | REBUILD projects (retained-hull validation, availability, slicing) |
| 0079 | [ADR-0079-typography-system.md](ADR-0079-typography-system.md) | Typography system — semantic font roles, user-selectable body font |
| 0080 | [ADR-0080-build-time-era-multiplier.md](ADR-0080-build-time-era-multiplier.md) | Build time era multiplier |
| 0081 | [ADR-0081-month-input-replay.md](ADR-0081-month-input-replay.md) | Each save records its month's input, so replay runs the month the player played |
| 0082 | [ADR-0082-drawing-board-durability.md](ADR-0082-drawing-board-durability.md) | The Drawing Board never loses work: draft sidecar and a durable command queue |
| 0083 | [ADR-0083-fittings-inside-hull-weight.md](ADR-0083-fittings-inside-hull-weight.md) | Fittings are inside the hull weight; fitting components carry no extra mass |
| 0084 | [ADR-0084-plan-drag-and-auto-place.md](ADR-0084-plan-drag-and-auto-place.md) | Drag to move and auto-place on the hull plan |
| 0085 | [ADR-0085-design-studies.md](ADR-0085-design-studies.md) | Design studies gate design approval |
| 0086 | [ADR-0086-division-ship-reorder.md](ADR-0086-division-ship-reorder.md) | Division ship reordering — flagship pinned, DESIGN-26 §12 penalty |
| 0087 | [ADR-0087-section-card-faithful-crop.md](ADR-0087-section-card-faithful-crop.md) | Section hover card draws a faithful crop of the plan and profile |
| 0088 | [ADR-0088-opening-ship-types.md](ADR-0088-opening-ship-types.md) | Opening ship types, availability policy and engine-side enforcement |
| 0089 | [ADR-0089-national-naval-profiles.md](ADR-0089-national-naval-profiles.md) | National naval profiles (NationNavalProfile) |
| 0090 | [ADR-0090-national-runtime-integration.md](ADR-0090-national-runtime-integration.md) | National naval profiles at runtime (construction economics, access, research, procurement) |
| 0091 | [ADR-0091-live-ai-procurement.md](ADR-0091-live-ai-procurement.md) | Live AI naval procurement lifecycle |
| 0092 | [ADR-0092-national-content-pipeline.md](ADR-0092-national-content-pipeline.md) | National content-production pipeline |
| 0093 | [ADR-0093-armament-domain-and-resolver.md](ADR-0093-armament-domain-and-resolver.md) | Authoritative armament domain and resolver (national armament integration, Step 1) |
| 0094 | [ADR-0094-combat-caliber-unit-correction.md](ADR-0094-combat-caliber-unit-correction.md) | Combat caliber unit correction (armament-to-combat boundary) |
| 0095 | [ADR-0095-design-doc-adr-authority.md](ADR-0095-design-doc-adr-authority.md) | Design docs are normative; ADRs amend them and record the amendment |
| 0096 | [ADR-0096-playable-nation-coverage.md](ADR-0096-playable-nation-coverage.md) | Playable nations must have an authored national profile |
| 0097 | [ADR-0097-first-release-combat-surface.md](ADR-0097-first-release-combat-surface.md) | First-release combat surface — defer the unreachable M3/M4 modules |
| 0098 | [ADR-0098-post-caliber-correction-lethality-rebalance.md](ADR-0098-post-caliber-correction-lethality-rebalance.md) | Post-caliber-correction auto-resolution lethality rebalance |
| 0099 | [ADR-0099-release-verification-gates.md](ADR-0099-release-verification-gates.md) | Release verification gates and push discipline |
