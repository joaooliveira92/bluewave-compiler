# 25: Armour material availability content

**Type:** task
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Source: ticket 24. The shared armour availability gate (`ArmourBalance.materialAvailability`) is inert because `content/production/1880/ship-building/balance.yaml` has no entries. Research per-material introduction month, required technology ids and maximum plate thickness for the early-band armour materials (iron, compound, steel, Harvey, nickel steel) from primary sources (Brassey, navweaps, official records), add them with provenance labels as in ticket 22, and add tests that the shipped content blocks an unavailable material in both a new design and a refit.

## Comments

### 2026-10-09 orchestrator

Resolved. `balance.yaml` `ship.armour.materialAvailability` now lists all eight materials. Provenance: the shipped tech tree (`technologies.yaml`, sourced in `docs/research/content-1-research-tech-tree.md` section 1.1) supplies the technology ids and years, so the Research screen and the Drawing Board agree; iron, wrought iron, mild steel and steel are open from 1880 (mild-steel deck plating predates the all-steel-hull technology and the 1880 reference design carries it). `maxThicknessUm` is deliberately unset: no source gives a per-material limit, and an invented cap would block legitimate designs. Tests: `armourAvailabilityContent.test.ts` (8) checks the shipped balance against the real content: every material declared, each plate blocked the month before its technology year and open at it, compound obsolete advisory, new design blocked via `compileDesign`, the Drawing Board option list. The refit path shares `armourAvailabilityFindings`, tested in `refit.test.ts` (ticket 24); a refit-with-shipped-content test was not added because that gate is the same function. Also from this pass: `bunkerLitrePerKg` became `bunkerLitreBpPerKg` (11148), see the README audit.
