# 01: Shared design-workspace layer

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` (new Shipbuilding workspace) · screen: `screens/shipbuilding/`.

## What to build

Make the change easy first. The designer's reusable pieces are currently embedded in the
Drawing Board: the undoable draft state hook, the content loader/seam, the presentation
selection store (with form-navigation linking), the validation/findings builders, and the
panel library. Lift that **design-workspace layer** into a shared renderer module so the new
Shipbuilding workspace can host the same designer without importing across another screen's
folder. The Drawing Board is repointed to the shared layer and behaves exactly as before.

## Acceptance criteria

- [x] A shared design-workspace module exists that owns the draft state hook, the content
      seam, the selection store, the findings/validation builders, and the panel library.
- [x] The Drawing Board consumes the shared module; its behaviour and DOM are unchanged and
      its full unit suite stays green.
- [x] Presentational components still take derived view-model props and read no authoritative
      state; one component per file; each directory's barrel is its public surface.
- [x] No new `as unknown` casts (the type-safety ratchet stays green).
- [x] No authoritative state, command, save format, hash, or golden change.
