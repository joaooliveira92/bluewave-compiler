## Question

Where in the minute-advance tactical engine order does CAP tick and strike attack execute? The existing order is: weather (7.5) → movement/spotting → gunnery → torpedo → damage → smoke → damage-control. CAP must intercept incoming strikes BEFORE they attack, but CAP patrols themselves must have been launched and positioned in previous minutes (or the battle start). Strike attack resolves after the strike has transited to the target.

Key sub-questions:
1. Does CAP detection/interception happen as a discrete stage BEFORE strike attack, or is it a continuous per-formation check?
2. Does the minute have a "CAP resolution" stage (step X) followed by "strike attack" stage (step Y)?
3. How do multiple waves / multiple formations interact with the minute order?
4. What about CAP vs other CAP (enemy fighters engaging each other)?
5. Is there a "launch" substep for aircraft not yet airborne at the start of a battle minute?

Deliverable: proposed new minute-stage numbers and their sequencing relative to existing steps 1-9. Document any changes required to the minute-advance engine in `packages/combat/src/`.

Reference: `packages/combat/src/` minute-advance order (B-2 established the pattern in `resolveMovement`/`resolveSpotting`/`resolveGunnery`/`resolveTorpedo`/`resolveDamage`/`resolveWeather`/`resolveSmoke`/`resolveDamageControl`).