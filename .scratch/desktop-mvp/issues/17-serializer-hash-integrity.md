# 17 — Serializer Hash Integrity (deferred follow-up)

Type: task
Status: resolved
Blocked by: 16

## Answer

Closed as out of scope for this effort (see map's Out of scope) — recorded
here so it ships in the repo's traceability, not dropped. The
`canonicalSerialize` Map-collapse fix is a canonical persistence-hash
migration belonging to the persistence track, with its own ADR-0007
regeneration + versioned-serializer bump. This MVP ships replay as the strong
integrity check; ADR-0024 records the decision and this ticket carries the
scope + definition of done for whoever works it. It is not a frontier ticket.

## Question

Fix the `canonicalSerialize` Map-collapse blind spot recorded in
ADR-0024: `packages/deterministic`'s `canonicalSerialize` collapses runtime
`Map`s to `{}`, so the snapshot `rawHash` / envelope `bodyHash` do NOT cover
Map-backed state (`nations`, `designs`, `designFamilies`,
`research.activeCandidates`). `verifyCampaign`/`recoverCampaign` (which
detect corruption via `SaveStore.load`'s envelope check) inherit the blind
spot; `replayCampaign` (Record-form subset hash) does not.

Not this effort's ticket to close — the desktop-mvp effort ships with replay
as the strong integrity check. This records the migration for the persistence
track.

## Resolution options (recorded in ADR-0024)

- **Option A**: hash over the storable (Record-form) snapshot
  (`toStorableSnapshot`) so every authoritative value is covered.
- **Option B**: serialize Maps canonically (sorted entries) in
  `canonicalSerialize`.

Both change every persisted hash → versioned serializer bump +
explicit migration/refusal per ENGINEERING-CONTRACT's persistence rule; ADR-0007
process.

Also in scope for the same follow-up: fold the `session.json` sidecar's
`campaignSeed` into the package hash (or at minimum assert seed provenance
during replay) — see ADR-0024 decision 3.

Definition of done when worked: (a) Map-backed state tampering (treasury,
nations, designs) fails `SaveStore.load` integrity; (b) verify/recover detect
the same tampering verify-and-recover currently miss; (c) golden hashes
regenerated with documented old/new + cause per ADR-0007; (d) migration
handling declared; (e) the continuity blind-spot tests move from recording the
gap to asserting the fix.