# ADR-0066: SubmitDesign command and engine-side design compile

## Status

Accepted 2026-10-08. Implements SB-14 of `.scratch/ship-building/spec.md` (builds on ADR-0063/0064).

## Decision

1. New engine command `SubmitDesign { nationId, designVersionId, designFamilyId, className, hullType, machineryType, draft }` (17th command). `draft` is a `@bluewave/ship-design` `DesignDraft` as JSON.
2. **Issue time** (`CommandLifecycle`): cheap structural checks only - nation exists, ids are lower snake_case, names present, design id unused, draft shape valid (`validateDraftShape`), draft belongs to the issuing nation. Failures are `INVALID_NATION_ID` / `INVALID_COMMAND_PAYLOAD`.
3. **Apply time** (`command_collection`, `applySubmitDesign`): the draft is compiled authoritatively with `compileDesign` against ship-building content supplied through `MonthExecutorEngineOptions.shipBuilding` and the campaign month. An invalid design (any BLOCKING finding) leaves the snapshot untouched and records `DESIGN_REJECTED` naming the blocking findings; missing content records `SHIP_BUILDING_CONTENT_MISSING`. A valid design is projected with `toEngineDesign` (ADR-0037 units; hit points = displacement / `kgPerHitPoint`, 214,000 kg, the median of the authored 1880 designs) into an immutable `CompiledDesignVersion` plus its `DesignFamily`, which the existing construction screens and `construction_order_v1` already handle.
4. The content port `ShipBuildingContent` (`buildShipBuildingContent`) lives in `ship-design` and is built from parsed YAML (`content/production/<scenario>/ship-building`); the UI, the engine tests and the engine share it.

## Consequences

Compile results depend on content and month, so the executor must always be given the same content for a replay; the compiled design carries `compiledHash` of the full compile result. The commit-time bridge still has to load and pass the content (next step) and the Drawing Board still needs a Submit button. `construction_order_v1` cost is unchanged for now; replacing it with `computeCost` is a later ticket (existing in-flight projects keep their projected cost).

## Not done

Template import of authored 1880 designs, revision commands (T0-T3), refit commands, design studies (DESIGN-21 §3).
