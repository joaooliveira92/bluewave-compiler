# ADR-0016 (B-1-5): Manifest Hash / Seed Bootstrapping

## Status

Accepted

## Context

DESIGN-37 §30 says the `BattleManifest` contains a **battle seed**, and §31 says
manifest canonicalization must occur **before** battle-seed derivation. §32 says
the canonical battle-seed key includes the **canonical manifest hash**. Taken
literally, this is circular: the manifest hash is a field of the manifest (§30),
yet §32 derives the seed (also a manifest field) from the manifest hash. Two
readings of DESIGN-37 §30-vs-§32 would change authoritative manifests, so a
deterministic resolution is required (ADR threshold).

## Decision

1. `computeManifestHash(manifest)` is defined over the **canonicalized pre-seed
   manifest** — every manifest field except the seed envelope and the manifest
   hash itself. This is the `manifest_hash_v1` contract (versioned constant).
2. The derived battle seed is stored in a **seed-envelope field** on the manifest
   (`battleSeed`) that is **excluded** from the manifest hash input.
3. `deriveBattleSeed` runs only after `canonicalizeManifest` (DESIGN-37 §31) and
   uses the canonical key family `battle/battle_id/root` with the §32 components
   (RNG version, campaign seed, month, war, area, mission, opportunity, manifest
   hash, generation-formula version).
4. Identical canonical manifests produce identical seeds; rejected opportunities
   never receive a seed (DESIGN-37 §32).

## Consequences

- Deterministic, non-circular bootstrap: manifest hash → seed, no feedback loop.
- The seed is reproducible from the canonicalized pre-seed manifest on every
  platform (ADR-0007 determinism).
- Manifest immutability after `BattleEligibilitySnapshot` commitment holds: the
  seed is assigned once, and re-hashing the pre-seed manifest stays stable.

## Related requirements

- DESIGN-37 §30, §31, §32; ENGINEERING-CONTRACT identity/serialization/hashing.
- B-1 AC-10 (canonicalization before seed; identical manifest → identical seed).

## Related ADRs

- ADR-0007 (cross-process determinism), ADR-0015 (B-1-7 predicate).
- ADR-0017 (B-1-6 auto-resolution proof scope).