## Question

How should air-to-air combat (CAP interception, escort engagement, dogfight) be resolved within the minute-advance tactical engine? DESIGN-43 defines aircraft scores (speed 0-100, firepower 0-100, maneuverability 0-100, toughness 0-100) but provides no explicit air-combat formula. What combat model fits the existing integer-basis-point, deterministic RNG pattern used by gunnery (DESIGN-39) and torpedoes (DESIGN-40)?

Investigate:
1. Historical naval wargame air-combat models (board and computer) for a suitable abstract resolution pattern
2. How speed/firepower/maneuverability/toughness scores map to a detection→engagement→outcome sequence
3. What existing combat formula patterns (gunnery's 17-factor accuracy, torpedo's hit resolution) can be reused
4. Whether a simplified "score comparison + keyed RNG draw" is sufficient, or whether a multi-factor formula (relative scores, altitude, surprise, numerical advantage) is needed
5. The relationship between CAP interception timing and the strikegroup's escort — escort fighters reduce CAP effectiveness

Deliverable: recommendations for the air-combat resolution formula(s), including basis-point constants, RNG stream keys, and how the result feeds into aircraft loss/squadron depletion.