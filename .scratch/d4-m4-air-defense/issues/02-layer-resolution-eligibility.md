# 02 — Layer resolution + eligibility (heavy/medium/light) + CIWS

**What to build:** Implement layer resolution in HEAVY_AA → MEDIUM_AA → LIGHT_AA → CIWS order with eligibility predicates for each layer: heavy AA protecting own ship + 5nm protected radius from DESIGN-45 §7, medium AA pre-release window with 4_000bp fire-control solution from §8, and light AA windows per attack profile + speed bands from §9.

**Blocked by:** 01 — System definitions + state model + constants

**Status:** ready-for-agent

- [ ] AC-3: Layers resolve in HEAVY→MEDIUM→LIGHT→CIWS order
- [ ] AC-4: Heavy AA protects own ship + 5nm protected radius
- [ ] AC-5: Medium AA pre-release window with 4_000bp FC solution
- [ ] AC-6: Light AA windows per attack profile + speed bands