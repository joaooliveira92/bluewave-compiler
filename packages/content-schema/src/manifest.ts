import { z } from "zod";

export const PackManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  type: z.enum(["production", "fixture", "mod"]),
  files: z.record(z.array(z.string())).optional(),
  dependencies: z.record(z.string()).optional(),
});

export const RulesetManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
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

export interface PackManifest extends z.infer<typeof PackManifestSchema> {}
export interface RulesetManifest extends z.infer<typeof RulesetManifestSchema> {}

import type { Nation } from "./nation.js";
import type { Area } from "./area.js";
import type { RouteEdge } from "./route.js";
import type { Possession } from "./possession.js";
import type { Port } from "./port.js";
import type { TechnologyPrerequisite } from "./technology.js";
