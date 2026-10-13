# ADR-0144: One manifest authority for the loaded surface, with a build-only ship-building declaration

## Status

Accepted (2026-10-12).

## Context

ADR-0122 §3 discovered the ship-building catalogue from `pack.json` **plus** the
conventional `ship-building/**` paths. That made the loaded file set have two
sources of truth: the manifest's `files` map declared the content-pack and
campaign-file collections, while the ship-building subtree was found purely by
filesystem convention. Nothing failed when a discovered file was not declared or
a declared file was missing, and the ship-building README still claimed the
subtree was not loaded at all (false since SB-14 wired it).

The compiled artifact embeds the manifest it was built from, so appending the
ship-building declarations to `files` would change the production artifact body
hash — a change ADR-0122's byte-compatibility promise did not anticipate.

## Decision

1. **The manifest is the single declaration of the loaded surface.** `pack.json`
   gains a top-level `shipBuilding` map (`shipComponents`, `propulsionPlants`,
   `hullForms`, `shipBalance`, `gunFamilies`, `gunModels`, `gunMounts`,
   `ammunition`, `navalProfiles`, `referenceDesigns`). `buildFullSurfaceInput`
   reads the declaration, and filesystem discovery is retained only as a resolver
   that must agree with it: a discovered file that is not declared fails, and a
   declared file that does not exist fails — each with an actionable `MANIFEST`
   diagnostic naming the file and the `shipBuilding.<key>` declaration. The
   `PackManifestSchema` accepts the new optional key.
2. **The declaration is build-only, not content identity.** The compile stage
   embeds a manifest projection that excludes `shipBuilding` (`name`, `version`,
   `type`, `files`, `dependencies`). Declaring which ship-building files to load
   is a build recipe; it must not move the artifact body hash. This preserved the
   production pack's hash exactly (`92124eba…`) through the change.
3. **Docs reconciled.** The content README and the ship-building README describe
   the one manifest and no longer claim the subtree is unloaded.

## Consequences

- The loaded file set cannot drift between the compiler and the runtime: a
  dropped-in file cannot be silently ignored, and a stale declaration fails.
- Future ship-building content changes are declared deliberately; the artifact
  identity follows content, never the loading recipe.
- The `files` map keeps its existing meaning and hash membership; only the new
  build-only key is excluded.

## Related

- ADR-0109 (ship-building content per nation), ADR-0122 (compiled content
  bundle), ADR-0124 (campaign collections through the artifact).
