# Architecture decision records

One ADR per durable decision: `ADR-NNNN-<slug>.md`. New decisions take the
highest existing number + 1 (the next number is ADR-0166).
Refresh this table from each file's H1 when one is added or re-titled.
(ADR-0043 was never written; the sequence intentionally continues at 0044.)
See [DESIGN amendments](AMENDMENTS.md) for which ADRs amend which DESIGN doc.
Work an ADR records as deferred is tracked in [DEFERRALS](../DEFERRALS.md).
Older records kept as provenance are listed in [archive/README.md](archive/README.md).

Rows are grouped by area; the Status and Superseded-by cells mirror each ADR's
own `## Status` / `Superseded by:` lines (`pnpm preflight` fails when either
drifts). Process-only records are kept together under Process & documentation.

## Foundations

Core engine geometry, determinism, persistence, and the compiler pipeline.

| # | File | Title | Status | Superseded by |
| --- | --- | --- | --- | --- |
| 0001 | [ADR-0001-monorepo-structure.md](ADR-0001-monorepo-structure.md) | Monorepo Structure and Package Boundaries | accepted | — |
| 0003 | [ADR-0003-serializer-hash.md](ADR-0003-serializer-hash.md) | Canonical Serialization and Hashing | accepted | — |
| 0007 | [ADR-0007-cross-process-determinism.md](ADR-0007-cross-process-determinism.md) | Cross-Process and Cross-Platform Determinism Test Strategy | accepted | — |
| 0032 | [ADR-0032-persistence-integrity-contract.md](ADR-0032-persistence-integrity-contract.md) | Persistence Save-Integrity, Hash Contract, and Atomicity | accepted | — |
| 0036 | [ADR-0036-contract-phase-registry.md](ADR-0036-contract-phase-registry.md) | Contract the PhaseRegistry into the Real Execution Path | accepted | — |
| 0037 | [ADR-0037-design-unit-normalization.md](ADR-0037-design-unit-normalization.md) | Normalize Authored Design Units at Compile | accepted | — |
| 0113 | [ADR-0113-save-compatibility-policy.md](ADR-0113-save-compatibility-policy.md) | First-release save-compatibility policy — reject on mismatch | accepted | — |
| 0122 | [ADR-0122-compiled-content-bundle.md](ADR-0122-compiled-content-bundle.md) | Compiled content bundle — one hash-pinned artifact for the full authored surface | accepted | — |
| 0123 | [ADR-0123-content-identity-artifact-derived.md](ADR-0123-content-identity-artifact-derived.md) | Content identity derives from the compiled artifact | accepted | — |
| 0146 | [ADR-0146-codepoint-ordering-in-the-compiler.md](ADR-0146-codepoint-ordering-in-the-compiler.md) | Codepoint ordering for the compiler's canonical content order | accepted | — |

## Effect adoption

Adopting and vendoring Effect v4: the validator/runtime idiom, the read-only agent reference, and the determinism demotion.

| # | File | Title | Status | Superseded by |
| --- | --- | --- | --- | --- |
| 0100 | [ADR-0100-adopt-effect-v4.md](ADR-0100-adopt-effect-v4.md) | Adopt Effect v4 | accepted | — |
| 0101 | [ADR-0101-vendor-effect.md](ADR-0101-vendor-effect.md) | Vendor Effect | accepted | — |
| 0102 | [ADR-0102-replace-zod-with-effect-schema.md](ADR-0102-replace-zod-with-effect-schema.md) | Replace Zod with Effect Schema | accepted | — |
| 0103 | [ADR-0103-design-08-determinism-spine-demoted.md](ADR-0103-design-08-determinism-spine-demoted.md) | DESIGN-08 determinism spine demoted | accepted | — |
| 0104 | [ADR-0104-persistence-effect-beachhead.md](ADR-0104-persistence-effect-beachhead.md) | `persistence` Effect beachhead — Schema save boundary + tagged errors | accepted | — |
| 0105 | [ADR-0105-content-schema-effect-boundary.md](ADR-0105-content-schema-effect-boundary.md) | `content-schema` Effect Schema boundary — strict excess-key policy | accepted | — |
| 0128 | [ADR-0128-effect-v4-runtime-wave-not-warranted.md](ADR-0128-effect-v4-runtime-wave-not-warranted.md) | The Effect v4 runtime wave is not warranted — facades stay plain, errors stay runtime-free | superseded | ADR-0159 |
| 0155 | [ADR-0155-per-schema-excess-key-strictness.md](ADR-0155-per-schema-excess-key-strictness.md) | Excess-key strictness is per-schema parity, not one boundary-wide policy constant | accepted | — |
| 0159 | [ADR-0159-effect-runtime-in-app-surfaces.md](ADR-0159-effect-runtime-in-app-surfaces.md) | The app surfaces adopt the full Effect runtime — desktop main and compiler-cli | accepted | — |

## Campaign & strategy

Strategic layer: diplomacy, economy, fleet, officers, command screens, and time.

| # | File | Title | Status | Superseded by |
| --- | --- | --- | --- | --- |
| 0010 | [ADR-0010-b10c-diplomacy-war.md](ADR-0010-b10c-diplomacy-war.md) | B10c Diplomacy & War — Victory Classification, Phase Ordering, and State Model | accepted | — |
| 0011 | [ADR-0011-m1-acceptance-deployment-scope.md](ADR-0011-m1-acceptance-deployment-scope.md) | M1 Acceptance Scope — Deployment (DESIGN-25) Ownership and M1 Completion Sign-off | accepted | — |
| 0054 | [ADR-0054-diplomacy-command-visibility.md](ADR-0054-diplomacy-command-visibility.md) | Diplomacy Command Queue Stays Visible; War Declaration Reads as Irreversible | accepted | — |
| 0060 | [ADR-0060-budget-allocation-command.md](ADR-0060-budget-allocation-command.md) | Player budget allocation (`SetBudgetAllocation`) | accepted | — |
| 0061 | [ADR-0061-loss-ledger.md](ADR-0061-loss-ledger.md) | Persisted ship-loss records (the "ships sunk" ledger) | accepted | — |
| 0062 | [ADR-0062-fleet-movement-orders.md](ADR-0062-fleet-movement-orders.md) | Fleet movement orders (`MoveFleet`) and a connected 1880 map | accepted | — |
| 0065 | [ADR-0065-officer-corps.md](ADR-0065-officer-corps.md) | Officer Corps and Division Commanders | accepted | — |
| 0071 | [ADR-0071-command-screen-state-convention.md](ADR-0071-command-screen-state-convention.md) | One command-screen lifecycle convention | accepted | — |
| 0075 | [ADR-0075-read-only-screen-query-convention.md](ADR-0075-read-only-screen-query-convention.md) | Read-only screen reads go through one query hook | accepted | — |
| 0086 | [ADR-0086-division-ship-reorder.md](ADR-0086-division-ship-reorder.md) | Division ship reordering — flagship pinned, DESIGN-26 §12 penalty | accepted | — |

## Combat

Battle generation, tactical resolution, gunnery, torpedoes, mines, air, coastal defense, damage, weather.

| # | File | Title | Status | Superseded by |
| --- | --- | --- | --- | --- |
| 0021 | [ADR-0021-b4-armor-damage-scope.md](ADR-0021-b4-armor-damage-scope.md) | ADR-0021 (B-4): Armor & Damage Scope / Integration Boundary + In-Slice Reason-Code & Constant Policy | accepted | — |
| 0022 | [ADR-0022-weather-scope-integration-boundary.md](ADR-0022-weather-scope-integration-boundary.md) | ADR-0022 (B-5): Weather / Visibility Scope & Integration Boundary + In-Slice Reason-Code & Constant Policy | accepted | — |
| 0025 | [ADR-0025-strategic-weather-snapshot.md](ADR-0025-strategic-weather-snapshot.md) | ADR-0025 (B-6 INC-1): Strategic Weather Snapshot Persistence + Authoritative `weather_generation` Wiring | accepted | — |
| 0026 | [ADR-0026-battle-auto-resolution.md](ADR-0026-battle-auto-resolution.md) | ADR-0026 (B-6 INC-2): Battle Auto-Resolution Orchestrator — `resolveBattleAuto` | accepted | — |
| 0046 | [ADR-0046-p1-campaign-battle-fidelity-fixes.md](ADR-0046-p1-campaign-battle-fidelity-fixes.md) | P-1 — Torpedoes in Campaign Auto-Resolution + Battle-Fidelity Fixes | accepted | ADR-0051 |
| 0047 | [ADR-0047-p1-damage-control-scope-and-units.md](ADR-0047-p1-damage-control-scope-and-units.md) | P-1 — Damage-Control Scope in Auto-Resolution, Unit Contract, and Recorded Deferrals | accepted | ADR-0049 |
| 0073 | [ADR-0073-p1-withdrawal-disengagement.md](ADR-0073-p1-withdrawal-disengagement.md) | P-1 — Withdrawal / Disengagement So Battles Can End Without Elimination (Ticket 12) | accepted | — |
| 0093 | [ADR-0093-armament-domain-and-resolver.md](ADR-0093-armament-domain-and-resolver.md) | Authoritative armament domain and resolver (national armament integration, Step 1) | accepted | — |
| 0094 | [ADR-0094-combat-caliber-unit-correction.md](ADR-0094-combat-caliber-unit-correction.md) | Combat caliber unit correction (armament-to-combat boundary) | accepted | — |
| 0098 | [ADR-0098-post-caliber-correction-lethality-rebalance.md](ADR-0098-post-caliber-correction-lethality-rebalance.md) | Post-caliber-correction auto-resolution lethality rebalance | accepted | — |

## Ship design & construction

Ship design, classification, construction, repair, and rebuild.

| # | File | Title | Status | Superseded by |
| --- | --- | --- | --- | --- |
| 0066 | [ADR-0066-submit-design-command.md](ADR-0066-submit-design-command.md) | SubmitDesign command and engine-side design compile | accepted | ADR-0085 |
| 0067 | [ADR-0067-ship-rules-vs-rtw3-manual.md](ADR-0067-ship-rules-vs-rtw3-manual.md) | Ship classification and refit rules versus the RTW3 manual | accepted | — |
| 0070 | [ADR-0070-revise-project-command.md](ADR-0070-revise-project-command.md) | ReviseProject command and retained source drafts | accepted | — |
| 0077 | [ADR-0077-construction-progress-per-package.md](ADR-0077-construction-progress-per-package.md) | Construction progress per work package (model, migration, slicing) | accepted | — |
| 0078 | [ADR-0078-rebuild-projects.md](ADR-0078-rebuild-projects.md) | REBUILD projects (retained-hull validation, availability, slicing) | accepted | — |
| 0083 | [ADR-0083-fittings-inside-hull-weight.md](ADR-0083-fittings-inside-hull-weight.md) | Fittings are inside the hull weight; fitting components carry no extra mass | accepted | — |
| 0085 | [ADR-0085-design-studies.md](ADR-0085-design-studies.md) | Design studies gate design approval | accepted | — |
| 0088 | [ADR-0088-opening-ship-types.md](ADR-0088-opening-ship-types.md) | Opening ship types, availability policy and engine-side enforcement | accepted | — |
| 0132 | [ADR-0132-in-place-revision-limits.md](ADR-0132-in-place-revision-limits.md) | In-place design-revision limits (manual p27) | accepted | — |
| 0135 | [ADR-0135-authored-national-dock-record.md](ADR-0135-authored-national-dock-record.md) | Authored national dock record (distinct from the production ceiling) | accepted | — |
| 0154 | [ADR-0154-ship-part-model.md](ADR-0154-ship-part-model.md) | One part model for ships — platforms declare slots, parts plug in through stable interfaces | accepted | — |
| 0156 | [ADR-0156-ship-types-as-content.md](ADR-0156-ship-types-as-content.md) | Ship types become content records naming a closed engine behaviour class | accepted | — |
| 0157 | [ADR-0157-torpedoes-as-parts-and-compiled-torpedo.md](ADR-0157-torpedoes-as-parts-and-compiled-torpedo.md) | Torpedoes become parts, and the compiled torpedo contract | accepted | — |
| 0158 | [ADR-0158-dockyard-project-cancellation-settlement.md](ADR-0158-dockyard-project-cancellation-settlement.md) | Cancelling a dockyard project — the settlement policy and the rebuild release | accepted | — |
| 0160 | [ADR-0160-designer-reads-the-parts-catalogue.md](ADR-0160-designer-reads-the-parts-catalogue.md) | The designer reads the parts-derived catalogue; the compile engine keeps the runtime catalogue until 17c | accepted | — |
| 0161 | [ADR-0161-derive-first-ship-part-cutover.md](ADR-0161-derive-first-ship-part-cutover.md) | The ship-part cutover is derive-first — the legacy catalogue retires only after a parts-native derive pipeline exists | accepted | — |
| 0163 | [ADR-0163-derive-inputs-on-canonical-parts.md](ADR-0163-derive-inputs-on-canonical-parts.md) | The ship-part derive reads the canonical part representation — evaluated quantities and typed facts, never formulas | accepted | — |

## National content

National naval profiles, the content pipeline, and AI procurement.

| # | File | Title | Status | Superseded by |
| --- | --- | --- | --- | --- |
| 0089 | [ADR-0089-national-naval-profiles.md](ADR-0089-national-naval-profiles.md) | National naval profiles (NationNavalProfile) | accepted | — |
| 0091 | [ADR-0091-live-ai-procurement.md](ADR-0091-live-ai-procurement.md) | Live AI naval procurement lifecycle | accepted | — |
| 0092 | [ADR-0092-national-content-pipeline.md](ADR-0092-national-content-pipeline.md) | National content-production pipeline | accepted | — |
| 0109 | [ADR-0109-ship-building-content-per-nation.md](ADR-0109-ship-building-content-per-nation.md) | Ship-building content is split per nation | accepted | — |
| 0114 | [ADR-0114-domestic-vs-imported-gun-ceiling.md](ADR-0114-domestic-vs-imported-gun-ceiling.md) | Domestic vs imported gun ceiling, and the coast-defence starter blocker | accepted | — |
| 0119 | [ADR-0119-promote-1880-coast-defence-casemate-starters.md](ADR-0119-promote-1880-coast-defence-casemate-starters.md) | Promote the remaining 1880 coast-defence / casemate capital starters | accepted | — |
| 0143 | [ADR-0143-content-schema-coverage-and-decode-at-boundary.md](ADR-0143-content-schema-coverage-and-decode-at-boundary.md) | Complete content-schema coverage and decode the artifact at its boundary | accepted | — |
| 0144 | [ADR-0144-one-manifest-authority.md](ADR-0144-one-manifest-authority.md) | One manifest authority for the loaded surface, with a build-only ship-building declaration | accepted | — |
| 0145 | [ADR-0145-committed-content-lock-and-verify.md](ADR-0145-committed-content-lock-and-verify.md) | A committed content lock and `content:verify` | accepted | — |
| 0147 | [ADR-0147-machine-checked-provenance-and-placeholder-gate.md](ADR-0147-machine-checked-provenance-and-placeholder-gate.md) | Machine-checked provenance and a placeholder release gate | accepted | — |

## Desktop & UI

Electron boundary, renderer screens, UX, and presentation.

| # | File | Title | Status | Superseded by |
| --- | --- | --- | --- | --- |
| 0029 | [ADR-0029-desktop-debug-mode-screens.md](ADR-0029-desktop-debug-mode-screens.md) | Desktop Debug-Only Screens Gated Behind Build-Time Debug Mode | accepted | — |
| 0038 | [ADR-0038-ui-state-sidecar.md](ADR-0038-ui-state-sidecar.md) | ADR-0038 (game-onboarding-first-month INC-3): Renderer-Owned `ui-state.json` Sidecar — Non-Authoritative UI-State Persistence | accepted | — |
| 0055 | [ADR-0055-map-renderer-canvas-lod.md](ADR-0055-map-renderer-canvas-lod.md) | Map renderer — Canvas 2D with pre-simplified LOD tiers | accepted | — |
| 0057 | [ADR-0057-desktop-battle-sandbox-scenario.md](ADR-0057-desktop-battle-sandbox-scenario.md) | Desktop Tactical Sandbox Runs on an Ephemeral Scenario Copy | accepted | — |
| 0121 | [ADR-0121-desktop-shell-hardening.md](ADR-0121-desktop-shell-hardening.md) | Desktop shell hardening — renderer recovery, single instance, and a bounded flushing quit | accepted | — |
| 0133 | [ADR-0133-crash-error-observability.md](ADR-0133-crash-error-observability.md) | Crash and error observability — a local-only support bundle | accepted | — |
| 0141 | [ADR-0141-shipbuilding-workspace.md](ADR-0141-shipbuilding-workspace.md) | Shipbuilding workspace beside the Drawing Board | accepted | ADR-0153 |
| 0148 | [ADR-0148-ship-visual-part-catalog.md](ADR-0148-ship-visual-part-catalog.md) | Era- and nation-aware ship visual parts from an authored catalog | accepted | — |
| 0149 | [ADR-0149-presentation-content-from-artifact.md](ADR-0149-presentation-content-from-artifact.md) | Presentation content sourced from the compiled artifact | accepted | — |
| 0153 | [ADR-0153-shipbuilding-workspace-only-designer.md](ADR-0153-shipbuilding-workspace-only-designer.md) | The Shipbuilding workspace is the app's only designer — the Drawing Board tab is removed | accepted | — |
| 0162 | [ADR-0162-visual-traits-render-adapter.md](ADR-0162-visual-traits-render-adapter.md) | Visual traits drive drawing selection — the `visual-traits/1` render adapter | accepted | — |

## Process & documentation

Repo process, docs/ADR authority, and release gates.

| # | File | Title | Status | Superseded by |
| --- | --- | --- | --- | --- |
| 0095 | [ADR-0095-design-doc-adr-authority.md](ADR-0095-design-doc-adr-authority.md) | Design docs are normative; ADRs amend them and record the amendment | accepted | — |
| 0106 | [ADR-0106-documentation-and-type-safety-ratchet-gates.md](ADR-0106-documentation-and-type-safety-ratchet-gates.md) | Documentation and type-safety ratchet gates | accepted | — |
| 0107 | [ADR-0107-verification-hardening.md](ADR-0107-verification-hardening.md) | Verification hardening — local hooks, a gate runner, and a dependency policy | accepted | — |
| 0134 | [ADR-0134-versioning-and-changelog-policy.md](ADR-0134-versioning-and-changelog-policy.md) | Versioning and changelog policy | accepted | — |
| 0136 | [ADR-0136-golden-repin-guard-scope.md](ADR-0136-golden-repin-guard-scope.md) | Scope the golden re-pin guard to the reference run's real inputs | accepted | — |
| 0139 | [ADR-0139-effect-tsgo-install-patch.md](ADR-0139-effect-tsgo-install-patch.md) | Effect Language Service (tsgo) — patch at install and enable the TypeScript integration | accepted | — |
| 0140 | [ADR-0140-check-ci-parity-guard.md](ADR-0140-check-ci-parity-guard.md) | Enforce every `pnpm check` step in CI, and the Effect toolchain at preflight | accepted | — |
| 0150 | [ADR-0150-authoritative-determinism-gate.md](ADR-0150-authoritative-determinism-gate.md) | The authoritative-determinism ratchet gate | accepted | — |
| 0151 | [ADR-0151-rules-compliance-ratchet-gates.md](ADR-0151-rules-compliance-ratchet-gates.md) | The RULES.md compliance ratchet gates | accepted | — |
| 0152 | [ADR-0152-errors-by-reachability.md](ADR-0152-errors-by-reachability.md) | Errors are tagged by reachability — `Data.TaggedError` inside, `readonly _tag` at the renderer boundary | accepted | — |
| 0164 | [ADR-0164-consolidate-on-the-vite-plus-task-runner.md](ADR-0164-consolidate-on-the-vite-plus-task-runner.md) | Consolidate task orchestration on the Vite+ task runner | accepted | — |
| 0165 | [ADR-0165-branch-discipline-and-pr-gated-dev.md](ADR-0165-branch-discipline-and-pr-gated-dev.md) | Branch discipline — a PR-gated `dev` and one worktree per session | accepted | — |

## Archive

75 records retained for provenance (older or absorbed decisions).
They stay on disk and searchable, but are not part of the active index; find
them with titles and links in [archive/README.md](archive/README.md).
