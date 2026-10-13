# Archived architecture decision records

Historical ADRs kept for provenance. Each remains the decision of its time, but
is no longer part of the active index; current decisions live in
[../README.md](../README.md). Regenerate both indexes with `pnpm adr:index`.

| # | File | Title | Status | Superseded by |
| --- | --- | --- | --- | --- |
| 0002 | [ADR-0002-integer-arithmetic.md](ADR-0002-integer-arithmetic.md) | Integer Representation and Arithmetic | accepted | — |
| 0004 | [ADR-0004-compiler-stages.md](ADR-0004-compiler-stages.md) | Compiler Stage Architecture | accepted | — |
| 0005 | [ADR-0005-content-parsing.md](ADR-0005-content-parsing.md) | Content Parsing and Schema Validation | accepted | — |
| 0006 | [ADR-0006-campaign-architecture.md](ADR-0006-campaign-architecture.md) | Campaign Package and Aggregate Architecture | accepted | — |
| 0008 | [ADR-0008-electron-boundary.md](ADR-0008-electron-boundary.md) | Electron Desktop Boundary | accepted | — |
| 0009 | [ADR-0009-research-phase-identifier.md](ADR-0009-research-phase-identifier.md) | Research Resolution Phase Identifier | accepted | — |
| 0012 | [ADR-0012-b1-division-boundary.md](ADR-0012-b1-division-boundary.md) | ADR-0012 (B-1-1): Package Boundary for Permanent Divisions vs. Battle Generation | accepted | — |
| 0013 | [ADR-0013-b1-ship-type-classifier.md](ADR-0013-b1-ship-type-classifier.md) | ADR-0013 (B-1-2): Derived Ship-Type Classification | accepted | — |
| 0014 | [ADR-0014-b1-reachable-mission-subset.md](ADR-0014-b1-reachable-mission-subset.md) | ADR-0014 (B-1-3): Reachable Mission Subset for B-1 Battle Generation | accepted | — |
| 0015 | [ADR-0015-b1-opportunity-predicate.md](ADR-0015-b1-opportunity-predicate.md) | ADR-0015 (B-1-7): Reachable Opportunity Predicate for FLEET/CRUISER Battles | accepted | — |
| 0016 | [ADR-0016-b1-manifest-seed.md](ADR-0016-b1-manifest-seed.md) | ADR-0016 (B-1-5): Manifest Hash / Seed Bootstrapping | accepted | — |
| 0017 | [ADR-0017-b1-autoresolution-scope.md](ADR-0017-b1-autoresolution-scope.md) | ADR-0017 (B-1-6): Auto-Resolution Proof Scope | accepted | — |
| 0018 | [ADR-0018-b2-movement-spotting-scope.md](ADR-0018-b2-movement-spotting-scope.md) | ADR-0018 (B-2): Tactical Movement/Spotting/Contact Scope & Integration Boundary | accepted | — |
| 0019 | [ADR-0019-b2-contact-shape.md](ADR-0019-b2-contact-shape.md) | ADR-0019 (B-2): Authoritative Contact Shape — TacticalContact Unification | accepted | — |
| 0020 | [ADR-0020-b3-gunnery-scope-and-reason-codes.md](ADR-0020-b3-gunnery-scope-and-reason-codes.md) | ADR-0020 (B-3): Gunnery Scope/Integration Boundary + Reason-Code and Constant Policy | accepted | — |
| 0023 | [ADR-0023-desktop-mvp-construction-lifecycle.md](ADR-0023-desktop-mvp-construction-lifecycle.md) | Desktop MVP — Construction Command Lifecycle Subset + Projected-Cost Formula | accepted | — |
| 0024 | [ADR-0024-desktop-mvp-save-integrity-blind-spot.md](ADR-0024-desktop-mvp-save-integrity-blind-spot.md) | Save Integrity Blind Spot in `canonicalSerialize` (Maps Collapse to `{}`) — recorded + deferred | accepted | — |
| 0027 | [ADR-0027-battle-resolution-phase-wiring.md](ADR-0027-battle-resolution-phase-wiring.md) | ADR-0027 (B-6 INC-3): Battle-Resolution Phase Wiring + Campaign Consequences | accepted | — |
| 0028 | [ADR-0028-desktop-warscore-rederivation.md](ADR-0028-desktop-warscore-rederivation.md) | Desktop War-Score Delta Re-derivation on the Pre-Battle Snapshot | accepted | — |
| 0030 | [ADR-0030-desktop-mvp-bridge-boundary.md](ADR-0030-desktop-mvp-bridge-boundary.md) | Desktop MVP — `campaign-engine` Package Boundary and `campaign:execute` Electron Boundary | accepted | — |
| 0031 | [ADR-0031-c1-torpedo-scope-reason-codes.md](ADR-0031-c1-torpedo-scope-reason-codes.md) | ADR-0031 (C-1): Torpedo Fire-Resolution Slice — Scope/Integration Boundary, Reason Codes, and Detonation-Fuze Authority | accepted | ADR-0046 |
| 0033 | [ADR-0033-c2-mine-warfare-scope-reason-codes.md](ADR-0033-c2-mine-warfare-scope-reason-codes.md) | ADR-0033 (C-2): Mine-Pressure Lifecycle — Scope/Integration Boundary, Strike Deferral, and Reason-Code/Constant Policy | accepted | — |
| 0034 | [ADR-0034-engine-state-hash-chain-tactical-checkpoints.md](ADR-0034-engine-state-hash-chain-tactical-checkpoints.md) | Engine-State Hardening — Snapshot Hash-Chain and Tactical Checkpoint Decisions | accepted | — |
| 0035 | [ADR-0035-engine-event-timestamp-contract.md](ADR-0035-engine-event-timestamp-contract.md) | Engine Event Timestamps — Deterministic ISO-8601 Contract | accepted | — |
| 0039 | [ADR-0039-c4-coastal-defense-scope-integration.md](ADR-0039-c4-coastal-defense-scope-integration.md) | C-4 Coastal Defense — Scope, Integration Boundary & Constant Policy | accepted | — |
| 0040 | [ADR-0040-smoke-damage-control-scope-and-integration.md](ADR-0040-smoke-damage-control-scope-and-integration.md) | Smoke Module + Damage-Control Extension — Scope, Integration, and Policy | accepted | — |
| 0041 | [ADR-0041-d2-carrier-operations-scope-integration-boundary.md](ADR-0041-d2-carrier-operations-scope-integration-boundary.md) | D-2 Carrier Operations — Scope/Integration Boundary + Contracts Policy + Phase Wiring | accepted | — |
| 0042 | [ADR-0042-d4-air-defense-layer-resolution-eligibility.md](ADR-0042-d4-air-defense-layer-resolution-eligibility.md) | D-4 Air Defense — Layer Resolution & Eligibility + Engagement Decisions (INC-2/INC-3/INC-4/INC-5) | accepted | — |
| 0044 | [ADR-0044-d4-parallel-implementation-merge-resolution.md](ADR-0044-d4-parallel-implementation-merge-resolution.md) | D-4 Air Defense — Merge Resolution: adopt the 2026-09-22 `origin/dev` implementation | accepted | — |
| 0045 | [ADR-0045-playability-first-reprioritization.md](ADR-0045-playability-first-reprioritization.md) | Playability-First Re-prioritization of the Sprint Backlog | accepted | — |
| 0048 | [ADR-0048-p1-gunnery-fidelity-range-and-gun-count.md](ADR-0048-p1-gunnery-fidelity-range-and-gun-count.md) | P-1 — Auto-Resolution Gunnery Fidelity (True Range + Gun-Count Sensitivity) | accepted | — |
| 0049 | [ADR-0049-p1-damage-control-in-every-battle.md](ADR-0049-p1-damage-control-in-every-battle.md) | P-1 — Damage Control Runs in Every Auto-Resolved Battle | accepted | — |
| 0050 | [ADR-0050-p1-persist-shell-fire-flooding.md](ADR-0050-p1-persist-shell-fire-flooding.md) | P-1 — Persist Shell-Created Fire and Flooding Sources | accepted | — |
| 0051 | [ADR-0051-p1-spawn-heading-convention.md](ADR-0051-p1-spawn-heading-convention.md) | P-1 — Spawn Heading Follows `directionBp` | accepted | — |
| 0052 | [ADR-0052-p1-cause-of-loss.md](ADR-0052-p1-cause-of-loss.md) | P-1 — Observational Per-Ship Cause of Loss | accepted | — |
| 0053 | [ADR-0053-p1-lethality-tuning.md](ADR-0053-p1-lethality-tuning.md) | P-1 — Auto-Resolution Lethality Tuning | accepted | — |
| 0056 | [ADR-0056-battle-generation-strength-floors.md](ADR-0056-battle-generation-strength-floors.md) | Battle-Generation Strength Floors — Per-Side Fix Now, Unit Deferred | accepted | — |
| 0058 | [ADR-0058-release-ui-hides-engine-detail.md](ADR-0058-release-ui-hides-engine-detail.md) | Release UI hides engine detail; debug builds show it | accepted | — |
| 0059 | [ADR-0059-rtw3-parity-ux-decisions.md](ADR-0059-rtw3-parity-ux-decisions.md) | RTW3 parity / UX modernization — decisions | accepted | — |
| 0063 | [ADR-0063-component-level-ship-compiler.md](ADR-0063-component-level-ship-compiler.md) | Component-Level Ship Compiler Beneath DESIGN-21 | accepted | — |
| 0064 | [ADR-0064-new-construction-work-packages.md](ADR-0064-new-construction-work-packages.md) | New-Construction Work Packages Extend DESIGN-23 §18 | accepted | — |
| 0068 | [ADR-0068-command-screen-decisions.md](ADR-0068-command-screen-decisions.md) | Campaign command screen — decisions | accepted | — |
| 0069 | [ADR-0069-1880-nation-borders.md](ADR-0069-1880-nation-borders.md) | 1880 borders for the playable nations (presentation layer) | accepted | — |
| 0072 | [ADR-0072-p1-speed-as-range-control.md](ADR-0072-p1-speed-as-range-control.md) | P-1 — Speed Advantage as Range Control (Ticket 11) | accepted | — |
| 0074 | [ADR-0074-designed-ship-treasury-cost.md](ADR-0074-designed-ship-treasury-cost.md) | Designed ships are priced by the cost model, in treasury units | accepted | — |
| 0076 | [ADR-0076-sb2-ship-building-parity.md](ADR-0076-sb2-ship-building-parity.md) | SB-2 ship-building parity with the reference design screen | accepted | ADR-0077 |
| 0079 | [ADR-0079-typography-system.md](ADR-0079-typography-system.md) | Typography system — semantic font roles, user-selectable body font | accepted | — |
| 0080 | [ADR-0080-build-time-era-multiplier.md](ADR-0080-build-time-era-multiplier.md) | Build time era multiplier | accepted | — |
| 0081 | [ADR-0081-month-input-replay.md](ADR-0081-month-input-replay.md) | Each save records its month's input, so replay runs the month the player played | accepted | — |
| 0082 | [ADR-0082-drawing-board-durability.md](ADR-0082-drawing-board-durability.md) | The Drawing Board never loses work: draft sidecar and a durable command queue | accepted | — |
| 0084 | [ADR-0084-plan-drag-and-auto-place.md](ADR-0084-plan-drag-and-auto-place.md) | Drag to move and auto-place on the hull plan | accepted | — |
| 0087 | [ADR-0087-section-card-faithful-crop.md](ADR-0087-section-card-faithful-crop.md) | Section hover card draws a faithful crop of the plan and profile | accepted | — |
| 0090 | [ADR-0090-national-runtime-integration.md](ADR-0090-national-runtime-integration.md) | National naval profiles at runtime (construction economics, access, research, procurement) | accepted | — |
| 0096 | [ADR-0096-playable-nation-coverage.md](ADR-0096-playable-nation-coverage.md) | Playable nations must have an authored national profile | accepted | — |
| 0097 | [ADR-0097-first-release-combat-surface.md](ADR-0097-first-release-combat-surface.md) | First-release combat surface — defer the unreachable M3/M4 modules | superseded | ADR-0112 |
| 0099 | [ADR-0099-release-verification-gates.md](ADR-0099-release-verification-gates.md) | Release verification gates and push discipline | accepted | — |
| 0108 | [ADR-0108-all-playable-nations-profiled.md](ADR-0108-all-playable-nations-profiled.md) | Every playable nation has an authored naval profile | accepted | — |
| 0110 | [ADR-0110-all-scenario-nations-profiled.md](ADR-0110-all-scenario-nations-profiled.md) | Every scenario nation has an authored naval profile | accepted | — |
| 0111 | [ADR-0111-historical-national-starters.md](ADR-0111-historical-national-starters.md) | Promote canonical historical ships to national capital starters | accepted | — |
| 0112 | [ADR-0112-wire-smoke-air-battle-stages.md](ADR-0112-wire-smoke-air-battle-stages.md) | Wire the smoke and air battle stages; defer mine, submarine and coastal warfare | accepted | — |
| 0115 | [ADR-0115-debug-campaign-battle-drill.md](ADR-0115-debug-campaign-battle-drill.md) | Debug-only campaign battle drill for the playable-loop E2E | accepted | — |
| 0116 | [ADR-0116-per-scenario-1880-classification-ruleset.md](ADR-0116-per-scenario-1880-classification-ruleset.md) | Per-scenario 1880 classification ruleset — coast-defence ships as capital | accepted | — |
| 0117 | [ADR-0117-promote-us-coast-defence-monitor.md](ADR-0117-promote-us-coast-defence-monitor.md) | Promote the US coast-defence monitor and model smoothbore ordnance | accepted | — |
| 0118 | [ADR-0118-react-devtools-opt-in-dev-dependency.md](ADR-0118-react-devtools-opt-in-dev-dependency.md) | React DevTools are an opt-in dev dependency kept out of the production main bundle | accepted | — |
| 0120 | [ADR-0120-desktop-quit-on-close-and-signals.md](ADR-0120-desktop-quit-on-close-and-signals.md) | The desktop app quits on window close and on termination signals | accepted | — |
| 0124 | [ADR-0124-campaign-collections-through-artifact.md](ADR-0124-campaign-collections-through-artifact.md) | Campaign-file collections are compiled into the artifact and consumed decoded at runtime | accepted | — |
| 0125 | [ADR-0125-renderer-content-ipc.md](ADR-0125-renderer-content-ipc.md) | Renderer decoupling over a narrow content IPC — executing `MIG-EXCL-1` | accepted | — |
| 0126 | [ADR-0126-unified-hover-card.md](ADR-0126-unified-hover-card.md) | One hover popover — the ReUI hover card (Base UI PreviewCard) replaces the tooltip | accepted | — |
| 0127 | [ADR-0127-shared-master-detail-primitives.md](ADR-0127-shared-master-detail-primitives.md) | Shared master/detail primitives — card deck and slide panel | accepted | — |
| 0129 | [ADR-0129-dockyard-project-status-model.md](ADR-0129-dockyard-project-status-model.md) | Dockyard-project status model and save-compatibility bump | accepted | — |
| 0130 | [ADR-0130-bulge-refit-kind.md](ADR-0130-bulge-refit-kind.md) | BULGE refit kind | accepted | — |
| 0131 | [ADR-0131-rearmament-armament-change-conditions.md](ADR-0131-rearmament-armament-change-conditions.md) | REARMAMENT armament-change conditions | accepted | — |
| 0137 | [ADR-0137-national-construction-concurrency-cap.md](ADR-0137-national-construction-concurrency-cap.md) | National construction concurrency cap and AMC/small-corvette exemptions | accepted | — |
| 0138 | [ADR-0138-foreign-construction-save-state.md](ADR-0138-foreign-construction-save-state.md) | Persisted foreign-construction save state (optional, hash-neutral) | accepted | — |
| 0142 | [ADR-0142-shipbuilding-selection-routing.md](ADR-0142-shipbuilding-selection-routing.md) | Shipbuilding screen ↔ selection routing | accepted | — |
