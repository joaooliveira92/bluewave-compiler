// Shared Zod schemas + runtime-validated types for every on-disk artifact the
// persistence package reads back. Casting parsed JSON to a TS type is only a
// compile-time assertion; these schemas are the runtime authority that turns
// "trust me" into "prove it" before any reconstruction or integrity work reads
// attacker/mutation-controlled surface (TODOs #9/#14).
//
// NOTE on depth: `StorableSnapshotSchema` validates the *shape* of the storable
// snapshot (the container fields and their JSON-safe record types) rather than
// enumerating every nested SafeInt/deeply-typed leaf. Deep value-fidelity is
// guaranteed authoritatively by the deterministic `envelope` + `rawHash`
// checks in `store.ts` (a structurally-valid but semantically-changed body
// cannot pass them), and this schema exists to reject shape hacks — missing,
// mistyped, or wrongly-typed top-level/container fields — that the envelope
// hash alone would still choke on ambiguously. Keeping deep leaves permissive
// avoids duplicating the entire (fast-evolving) `@bluewave/campaign` schema as
// a frozen mirror.

import { z } from "zod";

export const SaveHeaderSchema = z.object({
  snapshot: z.object({
    compatibilityVersion: z.string(),
  }),
});

export type DecodedSaveHeader = z.infer<typeof SaveHeaderSchema>;

const JsonRecord = z.record(z.string(), z.unknown());

const StorableSnapshotSchema = z.object({
  version: z.string(),
  turnNumber: z.number(),
  campaignId: z.string(),
  startYear: z.number(),
  startMonth: z.number(),
  slots: z.array(z.object({ nationId: z.string(), type: z.string() })).default([]),
  world: z.object({
    areas: z.array(z.record(z.string(), z.unknown())).default([]),
    routes: z.array(z.unknown()).default([]),
    ports: z.array(z.unknown()).default([]),
  }),
  nations: JsonRecord,
  wars: z.object({
    wars: z.array(z.unknown()),
    battles: z.array(z.unknown()),
    participantMemberships: z.array(z.unknown()),
    blockadeState: z.array(z.unknown()),
    battleManifests: z.array(z.unknown()),
  }),
  politics: z.object({
    relations: z.array(z.unknown()),
    shells: JsonRecord,
  }),
  intelligence: z.object({
    shells: JsonRecord,
  }),
  designs: JsonRecord,
  designFamilies: JsonRecord,
  strategicWeather: z.array(z.unknown()).default([]),
  rulesetVersion: z.string(),
  compatibilityVersion: z.string(),
});

export const StorableCampaignStateSchema = z.object({
  snapshot: StorableSnapshotSchema,
  envelope: z.object({
    algorithm: z.string(),
    artifactKind: z.string(),
    compatibilityVersion: z.string(),
    bodyHash: z.string(),
    bodyLength: z.number(),
  }),
  rawHash: z.string(),
});

export type StorableCampaignState = z.infer<typeof StorableCampaignStateSchema>;

export const PointerFileSchema = z.object({
  activeSaveId: z.string(),
  previousSaveId: z.string().optional(),
  recoveredAt: z.string().optional(),
});

export type PointerFile = z.infer<typeof PointerFileSchema>;

// Integrity contract (see ADR-NNN, TODO #1):
//  - `serializedHash`: sha256 of the exact on-disk `campaign.json` bytes.
//  - `stateHash`:     the semantic hash of the reconstituted in-memory state
//                     (identical to `state.rawHash`).
//  - `compatibilityVersion`: the snapshot's compatibility version.
export const SigFileSchema = z.object({
  serializedHash: z.string(),
  stateHash: z.string(),
  compatibilityVersion: z.string(),
});

export type SigFile = z.infer<typeof SigFileSchema>;

export const SaveMetadataSchema = z.object({
  saveId: z.string(),
  previousSaveId: z.string().optional(),
  timestamp: z.string(),
  turnNumber: z.number(),
  campaignId: z.string(),
  snapshotHash: z.string(),
  compatibilityVersion: z.string(),
  contentArtifactHash: z.string(),
  campaignName: z.string().optional(),
  nationId: z.string().optional(),
  campaignDate: z.object({ year: z.number(), month: z.number() }).optional(),
});

export type SaveMetadata = z.infer<typeof SaveMetadataSchema>;
