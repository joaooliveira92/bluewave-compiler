# 07: Class-order batch and naming

**Type:** grilling
**Status:** resolved
**Blocked by:** 02

## Question

Decide the class-order batch and auto-naming model so it matches the manual, reconciled with
DESIGN-23 §3–5 and the code.

Manual (printed p31): the build dialog orders up to 12 ships of one class laid down, with names
assigned automatically — handy for large destroyer batches, but budget and shipyard capacity must
suffice. DESIGN-23 §3 (authorization), §4 (Class Order Batch: 1..12 ships, one compiled design
version, one named class, per-ship builders, stable ship ids, canonical name assignments or naming
policy, reservations, batch hash) and §5 (repeat orders) already specify this; it is not
implemented in code.

Decide: the batch-command shape; the ship-identifier allocation; the naming policy and its data
source (name pools, uniqueness, collisions); how budget and capacity reservations gate a batch;
and how a batch is surfaced and cancelled.

## Answer

Resolved 2026-10-12 (autonomous; grounded in `docs/research/manual-building-ships-rules.md` p31,
DESIGN-23 §3–5, and the code).

- **Batch = `OrderConstructionCommand` of `1..12` ships of one approved compiled design version.** This
  is DESIGN-23 §4 verbatim and the manual's "order up to 12 ships of the same class laid down". Implement
  §4: one design-version id, one named class, quantity `1..12`, one builder or per-ship builders, stable
  ship ids, canonical name assignments or a naming policy, capacity/payment reservations, batch hash;
  above 12 → `CONSTRUCTION_BATCH_LIMIT_EXCEEDED` (a second command covers a second batch).
- **Authorization is the gate** (DESIGN-23 §3): approved compiled version, classification, treaty, dock,
  capacity reservation, materials, personnel, accepted command — the batch reserves money and capacity
  before any project is added.
- **Auto-naming.** The manual's "names assigned automatically" is a canonical naming policy: allocate
  names from a per-nation, per-type name pool with deterministic order and collision handling; the
  named-class id is assigned once. The pools themselves are content (map fog).
- **Repeat orders** (§5) need no new study when the design version and hash are unchanged.
- **Out:** quantity above 12; design-study logic beyond §5.

Hand-off: one implementation slice — batch ordering command + reservations + naming policy + tests —
feeding the "Player-facing building-ships flow".
