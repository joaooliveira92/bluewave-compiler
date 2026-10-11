import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DesignDraft } from "@bluewave/ship-design";
import { parse } from "yaml";
import { resolveProductionPackDir } from "./contentPack.js";

/** A raw reference design as authored under `ship-building/reference-designs/<nation>/` (ADR-0109). */
export interface RawReferenceDesignFile {
  readonly id: string;
  readonly name: string;
  readonly month: string;
  readonly starterFor?: string;
  readonly draft: DesignDraft;
}

/** Read every reference design from the per-nation directory tree (starters.yaml + historical.yaml). */
export function readReferenceDesigns(): RawReferenceDesignFile[] {
  const base = join(resolveProductionPackDir(), "ship-building", "reference-designs");
  return readdirSync(base)
    .sort()
    .flatMap((nation) =>
      ["starters.yaml", "historical.yaml"].flatMap((name) => {
        const path = join(base, nation, name);
        return existsSync(path)
          ? (parse(readFileSync(path, "utf8")) as { designs: RawReferenceDesignFile[] }).designs
          : [];
      }),
    );
}
