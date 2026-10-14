# 14: Refit compatibility from slot acceptance (P5 prerequisite)

**Type:** implementation
**Status:** resolved
**Blocked by:** 07, 11
**Frontier:** yes
**Requirements:** SPM-R18 · Stories 6, 28

## What to build

A refit may swap a part only for one that the same slot accepts, and that passes the
slot's constraints at the refit month. Supersession alone never makes an incompatible
refit legal. Refit-kind rules move from allowed categories to allowed interfaces. After
this ticket, nothing on the refit / design-compile / production compatibility path reads
`upgradePath` (the legacy P1-read-path validation that still does is deleted in ticket 15).

## Acceptance criteria

- [x] Design-compile seam tests: a successor that violates a slot constraint is rejected,
      and a non-successor that the slot accepts is allowed.
- [x] Existing rebuild/refit and armament-change validation suites stay green, with
      unchanged outcomes for current content.
- [x] No reader of `upgradePath` remains on the refit / design-compile / production
      compatibility path (proven by `scripts/verify-no-upgradepath-refit-readers.mjs`). The
      remaining readers — `partCatalogue.ts` (the `upgradePath` → `lifecycle.supersedes`
      migration), `component.ts` `lintCatalogue` and `content-compiler/stages/validate.ts` —
      are the legacy P1-read-path validation that ticket 15 (P5) deletes; ticket 14 does not
      touch them.

## Resolution (ticket 14)

- **Enforcement seam.** `evaluateRefit` reads `ShipContext.partModel` (attached by
  `environmentFor` from `data.partModel`). A touched component resolves to its part through a
  deterministic index (a part carrying the id, else a gun family's `standard_<family>` model,
  else a variant's prototype); the part's interface must be in the kind's `allowedInterfaces`
  (`REFIT_KIND_MISMATCH`) and the placement's zone slot must exist, accept the interface and
  pass `evaluateConstraints` at the refit month (`REFIT_SLOT_REJECTED`, new BLOCKING id, no
  central registration). Supersession is never consulted. Without a part model the interface
  falls back to the legacy category map, which now matches the part-model result for guns
  (`MAIN_GUN`/`SECONDARY_GUN`/`DUAL_PURPOSE_GUN`/`AA_WEAPON` → `gun`, `MOUNT` → `gun_mount`).
- **Deferral — `balance.yaml` `refit:` rename (owner: orchestrator / content change).** The
  authored `content/production/1880/ship-building/balance.yaml` `refit.rules.*.allowedCategories`
  was not renamed to `allowedInterfaces`. The whole `refit` section is carried **verbatim** into
  the content artifact (`balance: Schema.Unknown`), so the rename would move the content lock
  `bodyHash` and the golden `contentArtifactHash`/`contentBundleHash` — outside this ticket's
  no-hash-change rule. The section has **no decoded reader**: the production `RefitBalance` is
  never built from YAML, and the desktop reads only `refit.bulgeProtectionGainBp` narrowly
  (`designCommands.ts`). Rename it only alongside an approved content-lock + golden re-pin.
- **Deferral — gun/mount slot gap (owner: P7 authored mount slots).** A gun placement resolves
  to its `gun` part, but the platform slot it fills is the mount's, which a legacy placement
  does not name; only zone-slot interfaces (`<zone>.<interface>`) get a constraint check. The
  kind check still covers guns (`gun`/`gun_mount`). Replace this when slots are authored per
  hull form (P7).
- **AVIATION_CONVERSION (deferred, owner: future aviation-parts work / P7).** `interfaces/1`
  has no aircraft-facility token (I-21), so `AVIATION_CONVERSION.allowedInterfaces` is empty and
  an aviation-facility touch is rejected with `REFIT_KIND_MISMATCH` (pinned by test) rather than
  silently allowed. Recorded in `docs/DEFERRALS.md` D-9.
- **Gate scope.** `scripts/verify-no-upgradepath-refit-readers.mjs` guards `refit.ts`,
  `partFit.ts`, `partFitConstraints.ts`, `partQueries.ts`, `partCompatibility.ts`,
  `compileProduction.ts`, `compileThroughFit.ts`, `compileShared.ts`, `shipBuildingContent.ts`,
  `partCatalogueReaders.ts`, `phase-engine/src/startRebuild.ts` and
  `apps/desktop/.../designCommands.ts` for `upgradePath`; and `refit.ts`, `compileProduction.ts`
  and `compileThroughFit.ts` additionally for `supersedes` (partFit/partQueries read it only for
  the informational `supersededBy`/lineage output).
