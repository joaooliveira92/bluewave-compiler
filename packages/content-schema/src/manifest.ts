import { Schema } from "effect";

export const PackManifestSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  version: Schema.NonEmptyString,
  type: Schema.Literals(["production", "fixture", "mod"]),
  files: Schema.optional(Schema.Record(Schema.String, Schema.Array(Schema.String))),
  dependencies: Schema.optional(Schema.Record(Schema.String, Schema.String)),
});

export const RulesetManifestSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  version: Schema.NonEmptyString,
});

export interface ContentPack {
  manifest: PackManifest;
  rulesets: RulesetManifest[];
  nations: Nation[];
  areas: Area[];
  routes: RouteEdge[];
  possessions: Possession[];
  ports: Port[];
  technologyChains: TechnologyPrerequisite[];
}

export type PackManifest = typeof PackManifestSchema.Type;
export type RulesetManifest = typeof RulesetManifestSchema.Type;

import type { Nation } from "./nation.js";
import type { Area } from "./area.js";
import type { RouteEdge } from "./route.js";
import type { Possession } from "./possession.js";
import type { Port } from "./port.js";
import type { TechnologyPrerequisite } from "./technology.js";
