# INC-3: masts in the profile

**Type:** implementation
**Status:** resolved
**Blocked by:** INC-1
**Frontier:** no

Spec: SV-R8, SV-R9, SV-R11.

## What to build

Authored mast symbols (universal V/P/D), conventional placement from the superstructure
zone, height clamp, the mast layer behind the hull, and a `convention` legend chip.

## Acceptance criteria

- [x] A design with a superstructure zone shows a foremast and a mainmast, and one without
      shows none.
- [x] Masts never draw above the drawing's top pad.
- [x] The legend explains masts as a convention.

## Answer

- **Drawings:** universal masts for Victorian (pole mast with a fighting top and yards), pre-dreadnought (military mast
  with two tops) and dreadnought (tripod with a spotting top) in `parts.yaml`. The catalog test requires all three.
- **Placement:** `placeMasts` (pure) uses the stations from `mastStations`: the foremast at the bridge
  (`HouseMasses.bridgeStartPermille`) and the mainmast at the superstructure's aft end, with none without a
  superstructure. Each mast is seated on the house top.
- **Display clamp:** a mast is shrunk as a whole so the masthead stays under the top pad. The first version squeezed
  only the height, and the snap showed full-width yards on stubby masts, so it was changed (SV-R9 amended).
- **Layering:** `ProfileMastLayer` draws behind the hull.
- **Legend:** a `convention` "Masts" chip shows the style, the era with its year span, and the drawing with its
  fallback.
- **Validation:**
  - ship-visual 83/83; hull-plan + shipbuilding 310/310.
  - `pnpm snap` was taken in the bottom-bar **Shipbuilding** workspace (Start from a reference design → Alexandra →
    Side). It shows the foremast and mainmast, the hooded British barbette and the Victorian casemates, with a clean
    console.
