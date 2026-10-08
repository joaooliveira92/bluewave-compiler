# Decision 02: Phase/snapshot integration boundary

## Question

Does C-4 wire coastal defense into the phase engine or campaign snapshot?

## Options

**A. No wiring.** Pure value model only, like C-2 (mines before phase wiring) and C-3 (submarines before phase wiring). Coastal-defense records/projection are consumed later when the battle-integration slice (C-4 continuation or M3 acceptance gate) wires them into the tactical context.

**B. Wire now.** Add a `COASTAL_DEFENSE` phase or snapshot field.

## Decision

**Option A.** No phase/snapshot wiring this sprint. Coastal defense is a strategic asset (possession-installed) that produces tactical effects — it follows the same pattern as weather, mines, and submarines before their respective phase integrations. Golden hashes must remain unchanged (AC requirement). Phase/snapshot wiring is deferred to the M3 integration pass (C-6 or a C-4 continuation).