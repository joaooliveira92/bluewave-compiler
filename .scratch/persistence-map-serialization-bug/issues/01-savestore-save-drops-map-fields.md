Status: resolved

# `SaveStore.save` silently drops `Map`-valued fields on serialize

## Summary

`SaveStore.save` (`packages/persistence/src/store.ts`) serializes `CampaignState`
via `canonicalSerialize(state)` / plain `JSON.stringify` semantics. `JSON.stringify`
has no special handling for `Map` — a `Map` value stringifies as `{}`. Every
`Map`-valued field in `CampaignSnapshot` (`packages/campaign/src/state.ts:265`) is
silently emptied on write:

- `snapshot.nations: Map<string, NationState>`
- `snapshot.designs: Map<string, CompiledDesignVersion>`
- `snapshot.designFamilies: Map<string, DesignFamily>`
- the nested `activeCandidates` Map inside each nation's `research`

No error, no diagnostic, no test failure — the save file is written successfully,
its hash/envelope verify fine, and the data is just gone. Any consumer reading a
save back (e.g. `apps/desktop`'s campaign-save viewer,
`.ai/briefs/desktop-campaign-viewer.md`) sees empty `nations`/`designs`/
`designFamilies` for every save produced today.

## Found via

Surfaced while charting/resolving the `apps/desktop` Desktop Campaign Viewer
wayfinder map (`.scratch/desktop-campaign-viewer/`), specifically ticket 01
(`issues/01-load-save-ipc-contract.md`) and ticket 04
(`issues/04-savestore-map-serialization-bug.md`), which deliberately deferred the
fix to this package rather than folding it into the desktop side track.

## Expected behavior

`SaveStore.save` followed by `SaveStore.load`/`loadById` should round-trip
`CampaignSnapshot`'s `Map`-valued fields losslessly — a save/load cycle should
produce a snapshot equal (structurally) to what was saved, including
`nations`/`designs`/`designFamilies`/`activeCandidates` contents.

## Suggested fix direction

`canonicalSerialize` (`@bluewave/deterministic`) and/or `SaveStore.save` need to
convert `Map` fields to a serializable form (plain object, keyed by the Map's own
key, mirroring the desktop viewer's own `mapsToPlainObjects` workaround in
`apps/desktop/src/main/campaignSave.ts`) before serializing, and `SaveStore.load`
needs the inverse conversion back to `Map` so `CampaignState`'s in-memory shape is
unchanged for existing consumers. Check whether `canonicalSerialize` is used
elsewhere with `Map` inputs and already has (or should have) this handling
centrally, rather than patching `store.ts` alone.

## Acceptance

- A save/load round-trip test in `packages/persistence` (or a new one) asserts
  `nations`, `designs`, `designFamilies`, and each nation's
  `research.activeCandidates` are non-empty and structurally equal after
  `store.load(store.save(state, dir).savePath ... )` for a fixture state that
  populates all of them.
- Existing `apps/desktop` `campaign:load-save` tests/viewer continue to pass
  unchanged (its `mapsToPlainObjects` conversion becomes redundant-but-harmless
  once fixed at the source, or is removed if this fix makes it dead code — agent's
  call during implementation).
- No change to `CampaignState`'s public TypeScript shape (`Map` in memory is
  preserved) — only the on-disk serialization changes.

## Resolution

Fixed in `d72438c`. New `packages/persistence/src/snapshotSerialization.ts`
(`toStorableSnapshot`/`fromStorableSnapshot`) converts `nations`/`designs`/
`designFamilies`/`activeCandidates` between `Map` and plain `Record` at the
`SaveStore.save`/`loadById` I/O boundary only. `canonicalSerialize` in
`@bluewave/deterministic` was deliberately left untouched — fixing Map handling
there would change every existing hash that serializes a Map-bearing structure
(campaign compiler's `rawHash`, envelopes, any golden hash touching Maps),
which is a much larger blast radius than this bug warrants. Hash/envelope
verification in `load()` now runs after Maps are reconstituted, so it stays
bit-identical to what the campaign compiler already computes.

Round-trip test added in `packages/persistence/test/persistence.test.ts`
covering all four fields. `apps/desktop`'s `mapsToPlainObjects` workaround in
`campaignSave.ts` was left in place (untouched, still needed independently for
the renderer's JSON-display boundary) — confirmed still passing
(`apps/desktop/test/campaignSave.test.ts`, 6/6).
