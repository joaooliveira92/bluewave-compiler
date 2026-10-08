# Wayfinder Map: M3 Coastal Defense (C-4)

## Destination

Scope the first coherent **vertical slice of DESIGN-48 (`docs/rules/coastal-defense.md`, 48 lines)** as an engine-only, deterministic **coastal-defense value model** in `@bluewave/combat` (new `packages/combat/src/coastal-defense/`): coastal artillery battery definition (model, caliber, era-band, AA capability flag), land-target type classification (7 types: airfield/dockyard/fuel_storage/radar_station/coastal_battery/port_installation/transport_concentration), land-target damage state (5-state progression: Intact/Suppressed/Damaged/Disabled/Destroyed), coastal artillery participation in local battles (value-only effectiveness contribution), local mine-pressure contribution, placement rules (predefined zones, seed-driven selection, geographic validity), and records/reason codes. **No phase-engine/snapshot wiring this sprint** (mirrors the C-2-before-phase pattern). Golden hashes must remain unchanged.

## Notes

- Domain: `@bluewave/combat` (pure, platform-independent, deterministic). Precedent: strategic/monthly mechanics living in `@bluewave/combat` — weather/strategic-state.ts, mines/, submarines/.
- DESIGN-48 is extremely short (48 lines) — comparable to a single decision ticket from earlier sprints. The scope boundary question is: how much of the coastal-defense lifecycle can ship as a pure value model without battle/phase integration?
- **Key finding:** several DESIGN-48 items are battle-integration dependent:
  - "Participates in local battles" — needs the tactical battle context (manifest/damage pipeline) to apply. Deferred; value-only effectiveness contribution ships now.
  - "Consequences apply to campaign infrastructure after battle" — needs the strategic campaign snapshot and the battle-outcome → campaign integration wire (B-6). Deferred.
  - "Gains AA capability over time" — needs the AA system (M4/D-track, DESIGN-45). Deferred; captured as a data field on the battery model.
  - Airfields, radar sites — these are also M4/D-track capabilities (aircraft, radar/electronics). Deferred; land-target types are captured as discriminated union values only.
- C-4 is the last small sprint before the more complex C-5 (smoke + detailed damage control, 2 design docs) and then D-track (M4 Aviation).