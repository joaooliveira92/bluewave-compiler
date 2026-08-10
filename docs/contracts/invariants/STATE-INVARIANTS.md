# State Invariants

> Extracted contract view. The originating `DESIGN-*` document remains normative.

Stable State Invariants:

- A ship belongs to exactly one nation.
- A ship has exactly one current compiled design version.
- A commissioned ship occupies exactly one strategic location.
- A ship cannot be both under construction and commissioned.
- A ship cannot participate in two unresolved battles.
- A possession has one legal owner and at most one military controller.
- A construction project remains between zero and total work.
- A completed project reserves no construction capacity.
- A ship belongs to at most one permanent division.
- A sunk ship accepts no operational orders.
- Two nations cannot be allied and at war in the same relation context.
- Technology prerequisites must be satisfied before discovery.
- Tactical persistent units must map to campaign assets or declared temporary
  generated assets.
- Every financial posting balances against a source and category.
- Every random outcome records a stable random-stream key.
