## Question

When a strike reaches its target, how does it resolve the attack? DESIGN-43 defines dive-bombing accuracy (12,500bp) and penetration (8,500bp) relative to level bombing, but doesn't define the base bombing formula or how torpedo attacks work from the air.

Key questions:
1. Does an air attack create a hit-chance roll (like gunnery) or a damage roll (like torpedo)?
2. For bombing: what's the base hit probability? Does it use a "number of bombs dropped × accuracy × defenses" formula?
3. For aerial torpedo attack: reuse the existing torpedo hit resolution (C-1) with modifications for air launch speed/altitude?
4. How do bombs/torpedoes create ship damage — reuse DESIGN-41 damage pipeline (resolveDamage)? Or create a lightweight air-attack damage package that feeds into the existing damage resolver?
5. What modifiers apply: target maneuver, AAA (deferred to D-4), weather, visibility, pilot experience, squadron experience?
6. Do multiple attacking squadrons against the same target combine, or resolve independently?

Deliverable: proposed attack resolution formula(s), identifying which existing pipelines can be reused (damage, torpedo) and which need new code. Document whether D-4 (AA) integration creates a placeholder or entirely defers defensive fire.